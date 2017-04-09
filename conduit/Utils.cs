using Microsoft.WindowsAPICodePack.Dialogs;
using System;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace RiftwalkConduit
{
    static class Utils
    {
        private static string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Riftwalk");

        static Utils()
        {
            if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
        }

        /**
         * Utility method that calls the specified argument functions whenever League starts or stops.
         * This is done by observing the lockfile, and the start function gets the contents of the lockfile as a param.
         */
        public static void MonitorLeague(string lcuExecutablePath, Action<string> onStart, Action onStop)
        {
            var leagueDir = Path.GetDirectoryName(lcuExecutablePath) + "\\";

            var watcher = new FileSystemWatcher();
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

            while (!IsValidLCUPath(path))
            {
                // Notify that the path is invalid.
                MessageBox.Show(
                    "Riftwalk could not find the League client at " + path + ". Please select the location of 'LeagueClient.exe' manually.",
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
            }

            // Store choice so we don't have to ask for it again.
            File.WriteAllText(configPath, path);

            return path;
        }

        /**
         * Checks if the provided path is most likely a path where the LCU is installed.
         */
        private static bool IsValidLCUPath(string path)
        {
            string folder = Path.GetDirectoryName(path);
            return File.Exists(path) && Directory.Exists(folder + "/RADS") && Directory.Exists(folder + "/RADS/projects/league_client");
        }
    }
}
