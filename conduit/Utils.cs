using System;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace Conduit
{
    /**
     * Some static utilities used to interact/query the state of the league client process.
     */
    static class Utils
    {
        private static Regex AUTH_TOKEN_REGEX = new Regex("\"--remoting-auth-token=(.+?)\"");
        private static Regex PORT_REGEX = new Regex("\"--app-port=(\\d+?)\"");
        private static Regex INSTALL_LOCATION_REGEX = new Regex("\"--install-directory=(.*?)\"");

        /**
         * Returns a tuple with the process, remoting auth token and port of the current league client.
         * Returns null if the current league client is not running.
         */
        public static Tuple<Process, string, string, string> GetLeagueStatus()
        {
            // Find the LeagueClientUx process.
            foreach (var p in Process.GetProcessesByName("LeagueClientUx"))
            {
                // Use WMI to figure out its command line.
                using (var mos = new ManagementObjectSearcher("SELECT CommandLine FROM Win32_Process WHERE ProcessId = " + p.Id.ToString()))
                using (var moc = mos.Get())
                {
                    var commandLine = (string)moc.OfType<ManagementObject>().First()["CommandLine"];
                    if (commandLine == null) // We can't get the commandline sometimes without admin access, so let's elevate
                    {
                        if (Administrator.IsAdmin())
                        {
                            DebugLogger.Global.WriteError("We cannot determine why the commandline is null! Cannot get the League of Legends information from this process!");
                            continue;
                        }
                        else
                        {
                            Administrator.Elevate();
                        }
                    }

                    try
                    {
                        var authToken = AUTH_TOKEN_REGEX.Match(commandLine).Groups[1].Value;
                        var port = PORT_REGEX.Match(commandLine).Groups[1].Value;
                        var installDir = INSTALL_LOCATION_REGEX.Match(commandLine).Groups[1].Value;
                        // Use regex to extract data, return it.
                        return new Tuple<Process, string, string, string>
                        (
                            p,
                            authToken,
                            port,
                            installDir
                        );
                    }
                    catch (Exception e)
                    {
                        DebugLogger.Global.WriteError($"Error while trying to get the status for LeagueClientUx: {e.ToString()}\n\n(CommandLine = {commandLine})");
                    }
                }
            }

            // LeagueClientUx process was not found. Return null.
            return null;
        }

        /**
         * Queries and returns the global cursor position.
         */
        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetCursorPos(out POINT lpPoint);
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT
    {
        public int X;
        public int Y;

        public POINT(int x, int y)
        {
            this.X = x;
            this.Y = y;
        }

        public static implicit operator System.Drawing.Point(POINT p)
        {
            return new System.Drawing.Point(p.X, p.Y);
        }

        public static implicit operator POINT(System.Drawing.Point p)
        {
            return new POINT(p.X, p.Y);
        }
    }
}