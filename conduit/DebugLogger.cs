using System;
using System.IO;

namespace Conduit
{
    public class DebugLogger
    {
        public static DebugLogger Global = new DebugLogger("global.txt");

        private StreamWriter writer;

        public DebugLogger(string fileName)
        {
            writer = new StreamWriter(Path.Combine(Persistence.DATA_DIRECTORY, fileName), true);
            writer.AutoFlush = true;
            writer.WriteLine($"\n\n\n --- {DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")} --- ");
            writer.WriteLine($"Started logging to {fileName}...");
        }

        public void WriteError(string error)
        {
            writer.WriteLine($"[ERROR {DateTime.Now.ToString("HH:mm:ss")}] {error}");
        }

        public void WriteMessage(string message)
        {
            writer.WriteLine($"[MSG {DateTime.Now.ToString("HH:mm:ss")}] {message}");
        }

        public void WriteWarning(string warning)
        {
            writer.WriteLine($"[WRN {DateTime.Now.ToString("HH:mm:ss")}] {warning}");
        }
    }
}
