using System;
using System.IO;

namespace Conduit
{
    class Program
    {
        public static string APP_NAME = "Mimic"; // For boot identification
        public static string VERSION = "2.0.0";

        public static string HUB_WS = "ws://127.0.0.1:51001/conduit";
        public static string HUB = "https://rift.mimic.lol";

        [STAThread]
        public static void Main()
        {
            Console.WriteLine("Hello, world!");

            Persistence.SetHubToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MzA2MyIsImlhdCI6MTUzODI0NzcyMH0.kUYgdhA2SYySJ-LLPh_OaNiv27iJUdNRh7MPIft7xqk");

            LeagueConnection lcu = new LeagueConnection();
            HubConnectionHandler cn;
            lcu.OnConnected += () => cn = new HubConnectionHandler(lcu);

            Console.ReadKey();
        }
    }
}
