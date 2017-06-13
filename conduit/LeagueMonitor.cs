using Microsoft.WindowsAPICodePack.Dialogs;
using System;
using System.Diagnostics;
using System.Management;
using System.IO;
using System.Text;
using System.Windows.Forms;
using System.ComponentModel;
using System.Linq;

namespace MimicConduit
{
    class LeagueMonitor
    {
        private static string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Mimic");
        private FileSystemWatcher watcher = new FileSystemWatcher();

        static LeagueMonitor()
        {
            if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
        }

        /**
         * Utility method that calls the specified argument functions whenever League starts or stops.
         * This is done by observing the lockfile, and the start function gets the contents of the lockfile as a param.
         */
        public LeagueMonitor(string lcuExecutablePath, Action<string> onStart, Action onStop)
        {
            var leagueDir = Path.GetDirectoryName(lcuExecutablePath) + "\\";

            watcher.Path = leagueDir;
            watcher.NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName | NotifyFilters.DirectoryName | NotifyFilters.LastAccess;
            watcher.Filter = "lockfile";

            var active = false;

            // We use the same handler for both lockfile creation and lockfile edits.
            // Sometimes we are so fast that the file is still empty when we attempt to read it.
            // This way, it will be caught in the edit event instead.
            FileSystemEventHandler createdEditHandler = (o, e) =>
            {
                if (active) return;

                var contents = ReadLockfile(leagueDir);
                if (!contents.Equals(""))
                {
                    onStart(contents);
                    active = true;
                }
            };

            watcher.Created += createdEditHandler;
            watcher.Changed += createdEditHandler;

            watcher.Deleted += (o, e) =>
            {
                // Lockfile was deleted, notify.
                onStop();
                active = false;
            };

            watcher.EnableRaisingEvents = true;

            // Check if we launched while league was already active.
            if (File.Exists(leagueDir + "\\lockfile"))
            {
                active = true;
                onStart(ReadLockfile(leagueDir));
            }
        }

        /**
         * Reads the lockfile at the specified location. The lockfile needs to be copied first, since it is locked (heh).
         */
        private static string ReadLockfile(string leagueLocation)
        {
            // The lockfile is locked (heh), so we copy it first.
            File.Copy(leagueLocation + "lockfile", leagueLocation + "lockfile-temp");
            var contents = File.ReadAllText(leagueLocation + "lockfile-temp", Encoding.UTF8);
            File.Delete(leagueLocation + "lockfile-temp");
            return contents;
        }

        /**
         * Either gets the LCU path from the saved properties, or by prompting the user.
         * Returns null if the user does not want to select a folder.
         */
        public static string GetLCUPath()
        {
            string configPath = Path.Combine(dataDir, "lcuPath");
            string path = File.Exists(configPath) ? File.ReadAllText(configPath) : "C:/Riot Games/League of Legends/LeagueClient.exe";

            if (!IsValidLCUPath(path))
            {
                // Notify that the path is invalid.
                MessageBox.Show(
                    "Mimic could not find the League client at " + path + ". Make sure the League client runs, and press OK.",
                    "LCU not found",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Exclamation
                );

                var leaguePath = GetLCUPathWithRunningLeagueClient();
                path = leaguePath != null ? leaguePath + "LeagueClient.exe" : path;

                // Store choice so we don't have to look for it again.
                if (IsValidLCUPath(path))
                    File.WriteAllText(configPath, path);
            }

            while (!IsValidLCUPath(path))
            {
                // Notify that the path is invalid.
                MessageBox.Show(
                    "Mimic could not find the running League client. Please select the location of 'LeagueClient.exe' manually.",
                    "LCU not found",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Exclamation
                );

                // Ask for new path.
                CommonOpenFileDialog dialog = new CommonOpenFileDialog();
                dialog.Title = "Select LeagueClient.exe location.";
                dialog.InitialDirectory = "C:\\Riot Games\\League of Legends";
                dialog.EnsureFileExists = true;
                dialog.EnsurePathExists = true;
                dialog.DefaultFileName = "LeagueClient";
                dialog.DefaultExtension = "exe";
                dialog.Filters.Add(new CommonFileDialogFilter("Executables", ".exe"));
                dialog.Filters.Add(new CommonFileDialogFilter("All Files", ".*"));
                if (dialog.ShowDialog() == CommonFileDialogResult.Cancel)
                {
                    // User wants to cancel. Exit
                    return null;
                }

                path = dialog.FileName;

                // Store choice so we don't have to ask for it again.
                File.WriteAllText(configPath, path);
            }

            return path;
        }

        /*
         * Find the league client location by checking for the process, 
         * then look for an argument with the --install-directory,
         * in which the lockfile should be placed.
         */
        public static string GetLCUPathWithRunningLeagueClient()
        {
            var leagueProcesses = Process.GetProcesses().Where(p => p.ProcessName.Contains("League"));
            foreach (var process in leagueProcesses)
            {
                try
                {
                    string commandLine = process.GetCommandLine();
                    var indexOfInstallDirectory = commandLine.IndexOf("--install-directory");
                    if (indexOfInstallDirectory == -1)
                        continue;

                    // Index started at "--league-directory=", but we now go to the start of the directory in the string
                    indexOfInstallDirectory = commandLine.IndexOf("=", indexOfInstallDirectory) + 1;

                    // Take everything until the " behind the directory
                    return commandLine.Substring(indexOfInstallDirectory, commandLine.IndexOf("\"", indexOfInstallDirectory) - indexOfInstallDirectory);
                }
                catch (Win32Exception ex) when ((uint)ex.ErrorCode == 0x80004005)
                {
                    // Intentionally empty.
                }
            }
            return null;
        }

        /**
         * Checks if the provided path is most likely a path where the LCU is installed.
         */
        private static bool IsValidLCUPath(string path)
        {
            try
            {
                if (String.IsNullOrEmpty(path))
                    return false;

                string folder = Path.GetDirectoryName(path);
                return File.Exists(path) && File.Exists(folder + "/lockfile");
            }
            catch(Exception)
            {
                return false;
            }
        }
    }
}
