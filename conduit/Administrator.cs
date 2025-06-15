using System;
using System.Diagnostics;
using System.Reflection;
using System.Security.Principal;
using System.Windows.Forms;

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
            MessageBox.Show(
                "Your League client is running as administrator, and Mimic cannot access it. Mimic will now attempt to restart as administrator. Press 'Yes' on the Windows prompt to allow this.",
                "Mimic",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error,
                MessageBoxDefaultButton.Button1
            );

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
