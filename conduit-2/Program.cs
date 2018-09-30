using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Conduit
{
    class Program
    {
        [STAThread]
        public static void Main()
        {
            Console.WriteLine("Hello, world!");

            var conn = new LeagueConnection();
            conn.OnConnected += () => Console.WriteLine("Connect");
            conn.OnDisconnected += () => Console.WriteLine("disonnect");
            conn.OnWebsocketEvent += (ev) => Console.WriteLine(ev.Path);

            Console.ReadKey();
        }
    }
}
