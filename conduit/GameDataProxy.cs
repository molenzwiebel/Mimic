using System;
using System.IO;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using WebSocketSharp.Server;

namespace MimicConduit
{
    public class GameDataProxy : IDisposable
    {
        private readonly HttpServer server;
        private readonly Uri baseUri;

        private readonly NetworkCredential credentials;

        public GameDataProxy(HttpServer server, int port, string pass)
        {
            this.server = server;
            baseUri = new Uri($"https://127.0.0.1:{port}/");

            credentials = new NetworkCredential("riot", pass);

            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            server.OnGet += OnGetRequest;
        }

        private void OnGetRequest(object sender, HttpRequestEventArgs e)
        {
            var path = e.Request.Url.LocalPath;
            if (!path.StartsWith("/lol-game-data/"))
                return;

            var proxyReq = WebRequest.CreateHttp(new Uri(baseUri, path));
            proxyReq.ServerCertificateValidationCallback = ValidateCertificate;
            proxyReq.Credentials = credentials;

            using (e.Response)
            using (var proxyRes = (HttpWebResponse) proxyReq.GetResponse())
            using (var proxyStream = proxyRes.GetResponseStream())
            using (var responseStream = e.Response.OutputStream)

            using (var temp = new MemoryStream())
            {
                proxyStream?.CopyTo(temp);

                e.Response.StatusCode = (int) proxyRes.StatusCode;
                e.Response.ContentType = proxyRes.ContentType;
                e.Response.ContentLength64 = temp.Length;
                e.Response.AddHeader("Access-Control-Allow-Origin", "*");

                temp.WriteTo(responseStream);
            }

            Console.WriteLine(path);
        }

        public void Dispose()
        {
            server.OnGet -= OnGetRequest;
        }

        private static bool ValidateCertificate(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }
    }
}
