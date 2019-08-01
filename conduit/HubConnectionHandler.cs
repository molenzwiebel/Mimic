using System;
using System.Collections.Generic;
using System.Web;
using WebSocketSharp;

namespace Conduit
{
    /**
     * This class handles all connection with the hub and delegates any threaded messages to their
     * appropriate mobile connection handlers. This class is not responsible for ensuring that the JWT
     * is valid or keeping track of rift/league connection state. The wrapper class for this class, 
     * ConnectionManager, is in charge of reconnection and JWT registration.
     */
    class HubConnectionHandler
    {
        private WebSocket socket;
        private LeagueConnection league;
        private Dictionary<string, MobileConnectionHandler> connections = new Dictionary<string, MobileConnectionHandler>();

        public event Action OnClose;
        private bool hasClosed = false;

        public HubConnectionHandler(LeagueConnection league)
        {
            this.league = league;

            // Pass parameters in the URL.
            socket = new WebSocket(
                Program.HUB_WS
                    + "?token=" + HttpUtility.UrlEncode(Persistence.GetHubToken())
                    + "&publicKey=" + HttpUtility.UrlEncode(CryptoHelpers.ExportPublicKey())
            );

            socket.OnMessage += HandleMessage;
            socket.OnClose += (sender, ev) =>
            {
                // Invoke the close handler unless we explicitly triggered this closure.
                // Note that we invoke the event handler and close ourselves as well.
                // This means that in all cases, anyone listening to the closure event does
                // not have to close us. They only need to call Close on us if we want to
                // terminate a connection that is still stable.
                if (!hasClosed)
                {
                    OnClose?.Invoke();
                    Close();
                }
            };

            socket.Connect();
        }

        /**
         * Closes the connection with the hub. Should be invoked when League closes.
         */
        public void Close()
        {
            if (hasClosed) return;
            hasClosed = true;

            // Close socket.
            if (socket.ReadyState == WebSocketState.Open) socket.Close();

            // Call destructors for mobile connections.
            foreach (var connection in connections.Values) connection.OnClose();

            // Release resources.
            socket = null;
            league = null;

            connections.Clear();
            connections = null;
        }

        private void HandleMessage(object sender, MessageEventArgs ev)
        {
            if (!ev.IsText) return;

            dynamic contents = SimpleJson.DeserializeObject(ev.Data);
            if (!(contents is JsonArray)) return;

            // We got a new connection!
            if (contents[0] == (long) RiftOpcode.Open)
            {
                if (connections.ContainsKey(contents[1])) return;

                connections.Add(contents[1], new MobileConnectionHandler(league, msg =>
                {
                    socket.Send("[" + (long) RiftOpcode.Reply + ",\"" + contents[1] + "\"," + msg + "]");
                }));
            }
            else if (contents[0] == (long) RiftOpcode.Message)
            {
                if (!connections.ContainsKey(contents[1])) return;
            
                connections[contents[1]].HandleMessage(contents[2]);
            }
            else if (contents[0] == (long) RiftOpcode.Close)
            {
                if (!connections.ContainsKey(contents[1])) return;

                connections[contents[1]].OnClose();
                connections.Remove(contents[1]);
            }
        }
    }

    /**
     * Represents an operation sent by the hub. Incomplete, contains only definitions we're interested in.
     */
    enum RiftOpcode : long
    {
        // New connection from mobile client.
        Open = 1,

        // New message from previously connected client.
        Message = 2,

        // Mobile client connection closed.
        Close = 3,

        // Send a message to a mobile connected peer.
        Reply = 7
    }
}
