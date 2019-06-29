using System;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;
using WebSocketSharp;
using System.Text;

namespace Conduit
{
    /**
     * Class responsible for monitoring League and automatically connecting to Rift when needed.
     * This class is also responsible for requesting/storing JWTs from rift and ensuring that they
     * remain valid. All actual messaging is left to Hub/MobileConnectionHandler.
     */
    class ConnectionManager
    {
        private static readonly HttpClient httpClient = new HttpClient();

        private App app;
        private LeagueConnection league;
        private HubConnectionHandler hubConnectionHandler;
        private bool isNewLaunch = true;
        private bool hasTriedImmediateReconnect = false; // after a DC, we first try to reconnect immediately. If that fails, do a 5s backoff

        private CancellationTokenSource reconnectCancellationTokenSource;

        public ConnectionManager(App app)
        {
            this.app = app;
            this.league = new LeagueConnection();

            // Hook up league events.
            league.OnConnected += () =>
            {
                DebugLogger.Global.WriteMessage($"ConnectionManager is connected to League of Legends.");
                isNewLaunch = true;
                Connect();
            };
            league.OnDisconnected += () =>
            {
                DebugLogger.Global.WriteMessage($"ConnectionManager is disconnected from League of Legends.");
                Close();
            };
        }

        /**
         * Connects to the hub. Errors if there is already a hub connection.
         * Will cancel a pending reconnection if there is one. This method is
         * not guaranteed to connect on first try.
         */
        public async void Connect()
        {
            if (hubConnectionHandler != null) throw new Exception("Already connected.");
            if (!league.IsConnected) return;

            try
            {
                DebugLogger.Global.WriteMessage("Connecting to Rift...");

                // Cancel pending reconnect if there is one.
                if (reconnectCancellationTokenSource != null)
                {
                    DebugLogger.Global.WriteMessage($"Canceling older reconnect to Rift.");
                    reconnectCancellationTokenSource.Cancel();
                    reconnectCancellationTokenSource = null;
                }

                // Ensure that our token is still valid...
                bool valid = false; // in case first startup and hub token is empty
                if (!Persistence.GetHubToken().IsNullOrEmpty())
                {
                    DebugLogger.Global.WriteMessage("Requesting hub token..");
                    var response = await httpClient.GetStringAsync(Program.HUB + "/check?token=" + Persistence.GetHubToken());
                    valid = response == "true";
                    DebugLogger.Global.WriteMessage($"Hub token validity: {(valid ? "valid" : "invalid")}.");
                }

                // ... and request a new one if it isn't.
                if (!valid)
                {
                    DebugLogger.Global.WriteMessage($"Requesting hub token..");
                    var payload = "{\"pubkey\":\"" + CryptoHelpers.ExportPublicKey() + "\"}";
                    var responseBlob = await httpClient.PostAsync(Program.HUB + "/register", new StringContent(payload, Encoding.UTF8, "application/json"));
                    var response = SimpleJson.DeserializeObject<dynamic>(await responseBlob.Content.ReadAsStringAsync());
                    if (!response["ok"]) throw new Exception("Could not receive JWT from Rift");

                    Persistence.SetHubToken(response["token"]);
                    DebugLogger.Global.WriteMessage($"Hub token: {response["token"]}.");
                }

                // Connect to hub. Will error if token is invalid or server is down, which will prompt a reconnection.
                hubConnectionHandler = new HubConnectionHandler(league);
                hubConnectionHandler.OnClose += CloseAndReconnect;

                // We assume to be connected.
                if (isNewLaunch)
                {
                    DebugLogger.Global.WriteMessage($"Creating New Launch popup.");
                    app.ShowNotification("Connected to League. Click here for instructions on how to control your League client from your phone.");
                    isNewLaunch = false;
                }

                hasTriedImmediateReconnect = false;
            }
            catch (Exception e)
            {
                DebugLogger.Global.WriteError($"Connection to Rift failed, an exception occurred: {e.ToString()}");
                // Something happened that we didn't anticipate for.
                // Just try again in a bit.
                CloseAndReconnect();
            }
        }

        /**
         * Closes all connections _without_ queueing a reconnect.
         */
        public void Close()
        {
            DebugLogger.Global.WriteMessage("Disconnecting from rift.");

            // Already closed, don't error but just ignore.
            if (hubConnectionHandler == null) return;

            // Clear entries.
            hubConnectionHandler.Close();
            league.ClearAllListeners();

            hubConnectionHandler = null;
            reconnectCancellationTokenSource = null;
        }

        /**
         * Does the same as Close, but queues a reconnect in 5 seconds.
         */
        public async void CloseAndReconnect()
        {
            Close();

            try
            {
                reconnectCancellationTokenSource = new CancellationTokenSource();

                // If this is an immediate reconnect, 
                if (hasTriedImmediateReconnect)
                {
                    DebugLogger.Global.WriteWarning("Could not connect to Rift, retrying to connect to Rift in 5s...");
                    await Task.Delay(5000, reconnectCancellationTokenSource.Token);
                } else
                {
                    DebugLogger.Global.WriteWarning("Could not connect to Rift, retrying to connect to Rift immediately...");
                    hasTriedImmediateReconnect = true;
                }

                Connect();
            }
            catch (TaskCanceledException e)
            {
                DebugLogger.Global.WriteError($"Our reconnect to Rift got canceled, reason: {e.ToString()}");
                // Delay got cancelled. Ignore error.
            }
        }
    }
}
