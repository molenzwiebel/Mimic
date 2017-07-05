using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Runtime.Serialization;
using System.Text;
using System.Text.RegularExpressions;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace MimicConduit
{
    class LeagueSocketBehavior : WebSocketBehavior
    {
        private WebSocket socket;
        private Dictionary<string, Regex> observedPaths = new Dictionary<string, Regex>();

        private int lcuPort;
        private string lcuPassword;

        public LeagueSocketBehavior(int port, string password)
        {
            lcuPort = port;
            lcuPassword = password;

            socket = new WebSocket("wss://127.0.0.1:" + port + "/", "wamp");
            socket.SetCredentials("riot", password, true);
            socket.SslConfiguration.EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12;
            socket.SslConfiguration.ServerCertificateValidationCallback = (a, b, c, d) => true;
            socket.OnMessage += handleWebSocketMessage;
            socket.Connect();
            // Subscribe to Json API events from the LCU.
            socket.Send("[5,\"OnJsonApiEvent\"]");
        }

        public void Destroy()
        {
            if (socket != null)
            {
                socket.Close();
                socket = null;
            }

            // Close all sessions.
            foreach (var sessId in Sessions.IDs)
            {
                Sessions.CloseSession(sessId);
            }
        }

        private void handleWebSocketMessage(object sender, MessageEventArgs args)
        {
            if (!args.IsText) return;
            JsonArray payload;
            try
            {
                payload = SimpleJson.DeserializeObject<JsonArray>(args.Data);
            }
            catch (SerializationException)
            {
                var tmp = Regex.Replace(args.Data, "(\"spell(?:1|2)Id\"): \\d{5,}", "$1: 0");
                payload = SimpleJson.DeserializeObject<JsonArray>(tmp);
            }

            if (payload.Count != 3) return;
            if ((long)payload[0] != 8 || !((string)payload[1]).Equals("OnJsonApiEvent")) return;

            var ev = (JsonObject)payload[2];
            if (!ev.ContainsKey("uri") || !ev.ContainsKey("data") || !ev.ContainsKey("eventType") || (ev["data"] != null && !(ev["data"] is JsonObject))) return;

            var uri = (string)ev["uri"];
            if (!observedPaths.Values.Any(x => x.IsMatch(uri))) return;
            var data = (JsonObject)ev["data"];
            var eventType = (string)ev["eventType"];

            var status = eventType.Equals("Create") || eventType.Equals("Update") ? 200 : 404;
            var message = "[1, \"" + uri + "\", " + status + ", " + SimpleJson.SerializeObject(data) + "]";
            Sessions.Broadcast(message);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            if (!e.IsText) return;

            var command = SimpleJson.DeserializeObject<JsonArray>(e.Data);
            var op = (long)command[0];

            if (op == 1) // Subscribe to endpoint
            {
                var path = (string)command[1];
                if (!observedPaths.ContainsKey(path)) observedPaths.Add(path, new Regex(path));
            }
            else if (op == 2) // Unsubscribe from endpoint
            {
                var path = (string)command[1];
                if (observedPaths.ContainsKey(path)) observedPaths.Remove(path);
            }
            else if (op == 3) // Make request
            {
                var id = (long)command[1];
                var path = (string)command[2];
                var method = (string)command[3];
                var body = (string)command[4];

                var response = makeRequest(path, method, body);
                Send("[2, " + id + ", " + response.Item1 + ", " + SimpleJson.SerializeObject(response.Item2) + "]");
            }
            else if (op == 4) // Get client info
            {
                Send("[3, \"" + Program.VERSION + "\", \"" + Environment.MachineName + "\"]");
            }
        }

        /// Called when the socket for this behavior disconnects. Cleans up the websocket connection to the LCU.
        protected override void OnClose(CloseEventArgs e)
        {
            if (socket != null)
            {
                socket.Close();
                socket = null;
            }
        }

        /// Makes an http request to the specified path with an optional method and body.
        Tuple<int, object> makeRequest(string path, string method = "GET", string body = null)
        {
            using (var client = new TcpClient("127.0.0.1", lcuPort))
            using (var stream = new SslStream(client.GetStream(), true, (a, b, c, d) => true))
            {
                stream.AuthenticateAsClient("127.0.0.1", null, System.Security.Authentication.SslProtocols.Tls12, false);

                var bytes = body != null ? Encoding.UTF8.GetBytes(body) : null;
                var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes("riot:" + lcuPassword));

                var request =
                    method + " " + path + " HTTP/1.1\r\n"
                    + "Host: 127.0.0.1:" + lcuPort + "\r\n"
                    + "Authorization: Basic " + auth + "\r\n"
                    + "Connection: close\r\n"
                    + "Content-Type: application/json\r\n"
                    + (bytes != null ? "Content-Length: " + bytes.Length + "\r\n" : "")
                    + "\r\n";

                stream.Write(Encoding.UTF8.GetBytes(request));
                if (bytes != null) stream.Write(bytes);

                var reader = new StreamReader(stream);
                var response = reader.ReadLine(); // response status
                var statusCode = int.Parse(response.Split(' ')[1]);
                var responseLen = -1;
                var isChunked = false;

                var hdr = reader.ReadLine();
                while (!hdr.Equals("")) // headers terminated with \r\n
                {
                    if (hdr.Contains("content-length:"))
                    {
                        responseLen = int.Parse(hdr.Replace("content-length: ", "").Trim());
                    }

                    if (hdr.Contains("chunked"))
                    {
                        isChunked = true;
                    }

                    hdr = reader.ReadLine();
                }

                var responseBody = "{}";
                if (responseLen > 0)
                {
                    var responseBuf = new char[responseLen];
                    reader.Read(responseBuf, 0, responseLen);
                    responseBody = new string(responseBuf);
                }

                if (isChunked)
                {
                    var builder = new StringBuilder();
                    while (true)
                    {
                        var len = int.Parse(reader.ReadLine(), System.Globalization.NumberStyles.HexNumber);
                        if (len == 0) break;

                        var buf = new char[len];
                        reader.Read(buf, 0, len);
                        reader.Read(); // trailing \r
                        reader.Read(); // trailing \n

                        builder.Append(new string(buf));
                    }
                    responseBody = builder.ToString();
                }

                return new Tuple<int, object>(statusCode, SimpleJson.DeserializeObject(responseBody));
            }
        }
    }
}
