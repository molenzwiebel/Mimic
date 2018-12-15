using System;
using System.IO;

namespace Conduit
{
    class Program
    {
        public static string APP_NAME = "Mimic"; // For boot identification
        public static string VERSION = "2.0.0";

        public static string HUB_WS = "ws://127.0.0.1:51001/conduit";
        public static string HUB = "http://127.0.0.1:51001";

        [STAThread]
        public static void Main()
        {
            Console.WriteLine("Hello, world!");

            Persistence.SetHubToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoiNjYzMDYzIiwiaWF0IjoxNTM4MjQ3NzIwfQ.GSXm1g6RePlwYuuGHl6XaZkdsMfzrzhgButDPz2nPPE");

            ConnectionManager connectionManager = new ConnectionManager();

            Console.ReadKey();
        }
    }
}
