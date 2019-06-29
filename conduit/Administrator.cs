using System;
using System.Diagnostics;
using System.Reflection;
using System.Security.Principal;

namespace Conduit
{
    public static class Administrator
    {
        public static bool IsAdmin()
        {
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
            {
                WindowsPrincipal principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
        }

        public static void Elevate()
        {
            var currentProcessInfo = new ProcessStartInfo
            {
                UseShellExecute = true,
                WorkingDirectory = Environment.CurrentDirectory,
                FileName = Assembly.GetEntryAssembly().Location,
                Verb = "runas"
            };

            Process.Start(currentProcessInfo);
            Environment.Exit(0);
        }
    }
}
