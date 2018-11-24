using System;
using System.Collections.Generic;
using WebSocketSharp;

namespace Conduit
{
    /**
     * Handles the connection with the hub, including authentication and other fancy stuff.
     */
    class HubConnectionHandler
    {
        private WebSocket socket;
        private LeagueConnection league;
        private Dictionary<string, MobileConnectionHandler> connections = new Dictionary<string, MobileConnectionHandler>();

        public HubConnectionHandler(LeagueConnection league)
        {
            this.league = league;

            socket = new WebSocket(Program.HUB_WS);
            socket.CustomHeaders = new Dictionary<string, string>()
            {
                {"Token", Persistence.GetHubToken()},
                {"Public-Key", CryptoHelpers.ExportPublicKey()}
            };

            socket.OnMessage += HandleMessage;

            socket.Connect();
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
                Console.WriteLine("Got new mobile connection: " + (string) contents[1]);

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

                Console.WriteLine("Lost mobile connection: " + (string)contents[1]);
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
