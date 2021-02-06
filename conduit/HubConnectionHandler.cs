using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
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
        private static readonly HttpClient httpClient = new HttpClient();

#if DEBUG
        public static HubConnectionHandler Instance;
#endif

        private WebSocket socket;
        private LeagueConnection league;

        private Dictionary<string, MobileConnectionHandler> connections =
            new Dictionary<string, MobileConnectionHandler>();

        public event Action OnClose;
        private bool hasClosed = false;
        public string NotificationSubscriptionToken { get; set; }

        private uint lastInputEventTime;

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
         * Sends a notification to all registered devices of the specified type.
         */
        public async Task SendNotification(string type)
        {
            DebugLogger.Global.WriteMessage("Attempting to send notification of type " + type);

            await httpClient.PostAsync(Program.HUB + "/v1/notifications/send", new StringContent(
                SimpleJson.SerializeObject(new
                {
                    token = Persistence.GetHubToken(),
                    type
                }), Encoding.UTF8, "application/json"));
        }

        private void HandleMessage(object sender, MessageEventArgs ev)
        {
            if (!ev.IsText) return;

            dynamic contents = SimpleJson.DeserializeObject(ev.Data);
            if (!(contents is JsonArray)) return;

            if (contents[0] == (long) RiftOpcode.Welcome)
            {
                // We're connected.
                DebugLogger.Global.WriteMessage("Connected to Rift and received a welcome.");

                NotificationSubscriptionToken = (string) contents[1];
            }
            else if (contents[0] == (long) RiftOpcode.Open)
            {
                // We got a new connection!
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
            else if (contents[0] == (long) RiftOpcode.PNInstantResponse)
            {
                DebugLogger.Global.WriteMessage("User responded with " + (string) contents[2] + " to " +
                                                (string) contents[1]);

                if (contents[1].Equals(NotificationType.ReadyCheck))
                {
                    league.Request("POST", "/lol-matchmaking/v1/ready-check/" + (string) contents[2], null);
                }
            }
        }

        private void HandleReadyCheckChange(dynamic data)
        {
            var newState = data == null ? "Invalid" : (string) data.state;
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
            lastInputEventTime = Utils.GetLastInputTime();
            DebugLogger.Global.WriteMessage("Detected League of Legends launch. lastInputEventTime = " + lastInputEventTime);
        }

        private void HandleLeagueStart()
        {
            var newestLastInputEventTime = Utils.GetLastInputTime();
            DebugLogger.Global.WriteMessage("Detected League of Legends loading screen end. newestLastInputEventTime = " + newestLastInputEventTime);

            // If the last event time is the same, it means there haven't been any new events
            // since the user entered loading screen, i.e. they're probably afk.
            if (lastInputEventTime == newestLastInputEventTime)
            {
                DebugLogger.Global.WriteMessage("No input events since loading screen started, emitting notification");
                SendNotification(NotificationType.GameStarted);
            }
        }
    }

    /**
     * Represents an operation sent by the hub. Incomplete, contains only definitions we're interested in.
     */
    enum RiftOpcode : long
    {
        // Rift welcomes us, contains push notification subscription token.
        Welcome = 0,

        // New connection from mobile client.
        Open = 1,

        // New message from previously connected client.
        Message = 2,

        // Mobile client connection closed.
        Close = 3,

        // Send a message to a mobile connected peer.
        Reply = 7,

        // Receive an instant response to an emitted push notification.
        PNInstantResponse = 9
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