using System;
using System.IO;

namespace Conduit
{
    class Program
    {
        public static string APP_NAME = "Mimic Conduit";
        public static string VERSION = "2.0.0";

        public static string HUB_WS = "ws://rift.mimic.lol/conduit";
        public static string HUB = "https://rift.mimic.lol";

        private static App _instance;

        [STAThread]
        public static void Main()
        {
            // Start the application.
            _instance = new App();
            _instance.InitializeComponent();
            _instance.Run();
        }
    }
}
