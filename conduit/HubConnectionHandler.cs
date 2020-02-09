using System;
using System.Collections.Generic;
using System.Web;
using System.Windows;
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
#if DEBUG
        public static HubConnectionHandler Instance;
#endif

        private WebSocket socket;
        private LeagueConnection league;
        private Dictionary<string, MobileConnectionHandler> connections = new Dictionary<string, MobileConnectionHandler>();

        public event Action OnClose;
        private bool hasClosed = false;

        private POINT cursorPosition;

        private string readyCheckState = "Invalid";

        public HubConnectionHandler(LeagueConnection league)
        {
#if DEBUG
            Instance = this;
#endif

            this.league = league;

            league.Observe("/lol-matchmaking/v1/ready-check", HandleReadyCheckChange);
            league.OnLeagueGameLaunch += HandleLeagueLaunch;
            league.OnLeagueGameStart += HandleLeagueStart;

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

        /**
         * Sends a message to Rift to register the specified PN token and device type for the
         * current conduit instance. Does nothing if we don't have a Rift connection.
         */
        public void RegisterPushNotificationToken(string deviceID, string platform, string type, string token)
        {
            if (hasClosed || socket == null || socket.ReadyState != WebSocketState.Open) return;

            var tokenJson = token == null ? "null" : "\"" + token + "\"";
            socket.Send(SimpleJson.SerializeObject(new List<object> { (long) RiftOpcode.PNSubscribe, deviceID, platform, type, tokenJson }));
        }

        /**
         * Sends a notification to all registered devices of the specified type.
         */
        public void SendNotification(string type)
        {
            if (hasClosed || socket == null || socket.ReadyState != WebSocketState.Open) return;

            socket.Send(SimpleJson.SerializeObject(new List<object> { (long) RiftOpcode.PNSend, type }));
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

                connections.Add(contents[1], new MobileConnectionHandler(this, league, msg =>
                {
                    // Intentionally manually building JSON, the msg is already a JSON here and we don't want it as a string.
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
            else if (contents[0] == (long) RiftOpcode.PNResponse)
            {
                DebugLogger.Global.WriteMessage("User responded with " + (string)contents[2] + " to " + (string)contents[1]);

                if (contents[1].Equals(NotificationType.ReadyCheck))
                {
                    league.Request("POST", "/lol-matchmaking/v1/ready-check/" + (string) contents[2], null);
                }
            }
        }

        private void HandleReadyCheckChange(dynamic data)
        {
            var newState = data == null ? "Invalid" : (string)data.state;
            DebugLogger.Global.WriteMessage("Ready check state changed: " + newState);

            // Ready check just popped.
            if (newState == "InProgress" && readyCheckState != "InProgress")
            {
                SendNotification(NotificationType.ReadyCheck);
            }

            // Ready check just got accepted/denied.
            if (newState != "InProgress" && readyCheckState == "InProgress")
            {
                SendNotification(NotificationType.Clear);
            }

            readyCheckState = newState;
        }

        private void HandleLeagueLaunch()
        {
            Utils.GetCursorPos(out cursorPosition);
            DebugLogger.Global.WriteMessage("Detected League of Legends launch.");
        }

        private void HandleLeagueStart()
        {
            DebugLogger.Global.WriteMessage("Detected League of Legends loading screen end.");
            Utils.GetCursorPos(out var newCursorPosition);

            // If the cursor hasn't changed, the user is likely not at their computer yet.
            if (newCursorPosition.X == cursorPosition.X && newCursorPosition.Y == cursorPosition.Y)
            {
                DebugLogger.Global.WriteMessage("Cursor position wasn't changed, emitting notification");
                SendNotification(NotificationType.GameStarted);
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
        Reply = 7,

        // Subscribe a phone to notifications for the current conduit.
        PNSubscribe = 9,

        // Send a push notification for the current conduit.
        PNSend = 10,

        // Receive an instant response to an emitted push notification.
        PNResponse = 11
    }

    /**
     * Represents a type of push notification that can be sent by Rift.
     */
    sealed class NotificationType
    {
        // Every client subscribes to this. Clears all received notifications.
        public const string Clear = "CLEAR";
        // Sent when ready check triggers.
        public const string ReadyCheck = "READY_CHECK";
        // Sent when the game has (almost) started.
        public const string GameStarted = "GAME_STARTED";
    }
}
