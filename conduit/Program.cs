using System;
using System.Collections.Generic;
using System.Drawing;
using System.Net;
using System.Net.Sockets;
using System.Windows.Forms;
using WebSocketSharp.Server;

namespace RiftwalkConduit
{
    class Program : ApplicationContext
    {
        private WebSocketServer server;
        private List<LeagueSocketBehavior> behaviors = new List<LeagueSocketBehavior>();
        private NotifyIcon trayIcon;
        private bool connected = false;

        private Program(string lcuPath)
        {
            // Start the websocket server. It will not actually do anything until we add a behavior.
            server = new WebSocketServer(8182);
            server.Start();

            trayIcon = new NotifyIcon()
            {
                Icon = SystemIcons.WinLogo,
                Visible = true,
                BalloonTipTitle = "Riftwalk",
                BalloonTipText = "Riftwalk will run in the background. Right-Click the tray icon for more info."
            };
            trayIcon.ShowBalloonTip(5000);
            UpdateMenuItems();

            // Start monitoring league.
            Utils.MonitorLeague(lcuPath, onLeagueStart, onLeagueStop);
        }

        private void UpdateMenuItems()
        {
            var aboutMenuItem = new MenuItem("Riftwalk v0.1 - " + (connected ? "Connected" : "Disconnected"));
            aboutMenuItem.Enabled = false;

            var ipMenuItem = new MenuItem("Address: " + FindLocalIP());
            ipMenuItem.Enabled = false;

            var quitMenuItem = new MenuItem("Quit", (a, b) => Application.Exit());
            trayIcon.ContextMenu = new ContextMenu(new MenuItem[] { aboutMenuItem, ipMenuItem, quitMenuItem });
        }

        private string FindLocalIP()
        {
            using (Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, 0))
            {
                socket.Connect("8.8.8.8", 65530);
                IPEndPoint endPoint = socket.LocalEndPoint as IPEndPoint;
                return endPoint.Address.ToString();
            }
        }

        private void onLeagueStart(string lockfileContents)
        {
            Console.WriteLine("League Started.");
            trayIcon.BalloonTipText = "Connected to League. Visit http://riftwalk.molenzwiebel.xyz to control your client remotely.";
            trayIcon.ShowBalloonTip(2000);
            connected = true;
            UpdateMenuItems();

            var parts = lockfileContents.Split(':');
            var port = int.Parse(parts[2]);
            server.AddWebSocketService("/league", () =>
            {
                var behavior = new LeagueSocketBehavior(port, parts[3]);
                behaviors.Add(behavior);
                return behavior;
            });
        }

        private void onLeagueStop()
        {
            Console.WriteLine("League Stopped.");
            trayIcon.BalloonTipText = "Disconnected from League.";
            trayIcon.ShowBalloonTip(1000);
            connected = false;
            UpdateMenuItems();

            // This will cleanup the pending connections too.
            behaviors.ForEach(x => x.Destroy());
            behaviors.Clear();
            server.RemoveWebSocketService("/league");
        }

        [STAThread]
        static void Main()
        {
            var lcuPath = Utils.GetLCUPath();
            if (lcuPath == null) return; // Abort

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Program(lcuPath));
        }
    }
}
