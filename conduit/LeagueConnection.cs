using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text;
using System.Threading.Tasks;
using WebSocketSharp;

namespace Conduit
{
    /**
     * Class that manages a connection with the LCU. This will automatically connect to the League
     * client once it starts, and exposes a simple API for listening to requests, making requests
     * and lifetime events.
     */
    class LeagueConnection
    {
        private static HttpClient HTTP_CLIENT;

        private WebSocket socketConnection;
        private Tuple<Process, string, string> processInfo;
        private bool connected;

        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<OnWebsocketEventArgs> OnWebsocketEvent;

        /**
         * Returns if this connection is currently connected.
         */
        public bool IsConnected => connected;

        /**
         * Creates a new LeagueConnection instance. This will immediately start trying
         * to connect to League.
         */
        public LeagueConnection()
        {
            try
            {
                HTTP_CLIENT = new HttpClient(new HttpClientHandler()
                {
                    SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls11 | SslProtocols.Tls,
                    ServerCertificateCustomValidationCallback = (a, b, c, d) => true
                });
            }
            catch
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

                HTTP_CLIENT = new HttpClient(new HttpClientHandler()
                {
                    ServerCertificateCustomValidationCallback = (a, b, c, d) => true
                });
            }

            // Run after a slight delay.
            Task.Delay(2000).ContinueWith(e => TryConnectOrRetry());
        }

        /**
         * Clears all listeners for websocket events, to ensure that they can get garbage collected.
         */
        public void ClearAllListeners()
        {
            OnWebsocketEvent = null;
        }

        /**
         * Tries to connect to a currently running league process. Called
         * by the connection timer every 5 seconds.
         */
        private void TryConnect()
        {
            try
            {
                // We're already connected.
                if (connected) return;

                // Check league status, abort if league is not running.
                var status = LeagueUtils.GetLeagueStatus();
                if (status == null) return;

                // Set the password and base address for our httpclient so we don't have to specify it every time.
                var byteArray = Encoding.ASCII.GetBytes("riot:" + status.Item2);
                HTTP_CLIENT.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));

                // Connect to our websocket.
                socketConnection = new WebSocket("wss://127.0.0.1:" + status.Item3 + "/", "wamp");
                socketConnection.SetCredentials("riot", status.Item2, true);

                socketConnection.SslConfiguration.EnabledSslProtocols = SslProtocols.Tls12;
                socketConnection.SslConfiguration.ServerCertificateValidationCallback = (a, b, c, d) => true;
                socketConnection.OnMessage += HandleMessage;
                socketConnection.OnClose += HandleDisconnect;
                socketConnection.Connect();
                // Subscribe to Json API events from the LCU.
                socketConnection.Send("[5,\"OnJsonApiEvent\"]");

                // Update local state.
                processInfo = status;
                connected = true;

                // Emit our events.
                OnConnected?.Invoke();
            }
            catch (Exception e)
            {
                processInfo = null;
                connected = false;
                DebugLogger.Global.WriteError($"Exception occurred trying to connect to League of Legends: {e.ToString()}");
            }
        }

        /**
         * Wrapper around TryConnect that will retry after a fixed delay if the connection fails.
         */
        private void TryConnectOrRetry()
        {
            if (connected) return;
            TryConnect();

            // Call this function again 2s later.
            Task.Delay(2000).ContinueWith(a => TryConnectOrRetry());
        }

        /**
         * Called when our websocket connection is closed. Responsible for updating internal state.
         */
        private void HandleDisconnect(object sender, CloseEventArgs args)
        {
            // Update internal state.
            processInfo = null;
            connected = false;
            socketConnection = null;

            // Notify observers.
            OnDisconnected?.Invoke();

            TryConnectOrRetry();
        }

        /**
         * Called when we receive a websocket message. Responsible for invoking event handlers.
         */
        private void HandleMessage(object sender, MessageEventArgs args)
        {
            // Abort if we get an invalid payload.
            if (!args.IsText) return;
            var payload = SimpleJson.DeserializeObject<JsonArray>(args.Data);

            // Abort if this is not a OnJsonApiEvent.
            if (payload.Count != 3) return;
            if ((long)payload[0] != 8 || !((string)payload[1]).Equals("OnJsonApiEvent")) return;

            // Invoke our listeners.
            var ev = (dynamic)payload[2];
            OnWebsocketEvent?.Invoke(new OnWebsocketEventArgs()
            {
                Path = ev["uri"],
                Type = ev["eventType"],
                Data = ev["eventType"] == "Delete" ? null : ev["data"]
            });
        }

        /**
         * Functionally similar to Get, but does not attempt to transform the
         * result into a JSON object. Instead, it returns the raw bytes.
         */
        public async Task<byte[]> GetAsset(string url)
        {
            if (!connected) throw new InvalidOperationException("Not connected to LCU");

            var res = await HTTP_CLIENT.GetAsync("https://127.0.0.1:" + processInfo.Item3 + url);
            return await res.Content.ReadAsByteArrayAsync();
        }

        /**
         * Performs a GET request on the specified URL.
         */
        public async Task<dynamic> Get(string url)
        {
            if (!connected) throw new InvalidOperationException("Not connected to LCU");

            var res = await HTTP_CLIENT.GetAsync("https://127.0.0.1:" + processInfo.Item3 + url);
            var stringContent = await res.Content.ReadAsStringAsync();

            if (res.StatusCode == System.Net.HttpStatusCode.NotFound) return null;
            return SimpleJson.DeserializeObject(stringContent);
        }

        /**
         * Observes the specified path. The specified handler gets invoked with the initial, current value.
         * After that, the handler will get invoked whenever the value at the specified URL changes.
         */
        public async void Observe(string url, Action<dynamic> handler)
        {
            // Listen to new websocket events and handle them if they're appropriate.
            OnWebsocketEvent += data =>
            {
                if (data.Path == url) handler(data.Data);
            };

            // If we are currently connected, initially populate.
            // Else, wait for the connect and then initially populate.
            if (connected)
            {
                // We are currently connected, handle it immediately.
                handler(await Get(url));
            }
            else
            {
                Action connectHandler = null;
                connectHandler = async () =>
                {
                    OnConnected -= connectHandler;
                    handler(await Get(url));
                };

                // Wait for the next connected event.
                OnConnected += connectHandler;
            }
        }

        /**
         * Performs a request with the specified method on the specified URL with the specified body.
         */
        public Task<HttpResponseMessage> Request(string method, string url, string body)
        {
            if (!connected) throw new InvalidOperationException("Not connected to LCU");

            return HTTP_CLIENT.SendAsync(new HttpRequestMessage(new HttpMethod(method), "https://127.0.0.1:" + processInfo.Item3 + url)
            {
                Content = body == null ? null : new StringContent(body, Encoding.UTF8, "application/json")
            });
        }
    }

    /**
     * Represents an OnJsonApiEvent sent by the websocket API.
     */
    public class OnWebsocketEventArgs : EventArgs
    {
        /**
         * The path that was modified.
         */
        public string Path { get; set; }

        /**
         * The type of the modification (Create/Update/Delete).
         */
        public string Type { get; set; }

        /**
         * The payload of the event. May be null.
         */
        public dynamic Data { get; set; }
    }
}