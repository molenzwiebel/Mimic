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
                isNewLaunch = true;
                Connect();
            };
            league.OnDisconnected += Close;
        }

        /**
         * Connects to the hub. Errors if there is already a hub connection.
         * Will cancel a pending reconnection if there is one. This method is
         * not guaranteed to connect on first try.
         */
        public async void Connect()
        {
            Console.WriteLine("[+] Connecting to rift...");

            if (hubConnectionHandler != null) throw new Exception("Already connected.");
            if (!league.IsConnected) return;

            try
            {
                // Cancel pending reconnect if there is one.
                if (reconnectCancellationTokenSource != null)
                {
                    reconnectCancellationTokenSource.Cancel();
                    reconnectCancellationTokenSource = null;
                }

                // Ensure that our token is still valid...
                bool valid = false; // in case first startup and hub token is empty
                if (!Persistence.GetHubToken().IsNullOrEmpty())
                {
                    var response = await httpClient.GetStringAsync(Program.HUB + "/check?token=" + Persistence.GetHubToken());
                    valid = response == "true";
                }

                // ... and request a new one if it isn't.
                if (!valid)
                {
                    var payload = "{\"pubkey\":\"" + CryptoHelpers.ExportPublicKey() + "\"}";
                    var responseBlob = await httpClient.PostAsync(Program.HUB + "/register", new StringContent(payload, Encoding.UTF8, "application/json"));
                    var response = SimpleJson.DeserializeObject<dynamic>(await responseBlob.Content.ReadAsStringAsync());
                    if (!response["ok"]) throw new Exception("Could not receive JWT from Rift");

                    Persistence.SetHubToken(response["token"]);
                }

                // Connect to hub. Will error if token is invalid or server is down, which will prompt a reconnection.
                hubConnectionHandler = new HubConnectionHandler(league);
                hubConnectionHandler.OnClose += CloseAndReconnect;

                // We assume to be connected.
                if (isNewLaunch)
                {
                    app.ShowNotification("Connected to League. Click here for instructions on how to control your League client from your phone.");
                    isNewLaunch = false;
                }

                hasTriedImmediateReconnect = false;
            } catch
            {
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
            Console.WriteLine("[+] Disconnecting from rift.");

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
                    Console.WriteLine("[+] Reconnecting to rift in 5s...");
                    await Task.Delay(5000, reconnectCancellationTokenSource.Token);
                } else
                {
                    Console.WriteLine("[+] Reconnecting to rift immediately...");
                    hasTriedImmediateReconnect = true;
                }

                Connect();
            } catch (TaskCanceledException)
            {
                // Delay got cancelled. Ignore error.
            }
        }
    }
}
