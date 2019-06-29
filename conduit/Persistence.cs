using Microsoft.Win32;
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Serialization;

namespace Conduit
{
    /**
     * Class responsible for handling filesystem persistence. In particular, this stores our JWT and keypairs.
     */
    class Persistence
    {
        public static string DATA_DIRECTORY = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Mimic");
        public static event Action OnHubCodeChanged;

        private static readonly string HUB_TOKEN_PATH = Path.Combine(DATA_DIRECTORY, "token");
        private static readonly string KEYPAIR_PATH = Path.Combine(DATA_DIRECTORY, "keys");
        private static readonly string DEVICES_PATH = Path.Combine(DATA_DIRECTORY, "devices");
        private static readonly RegistryKey BOOT_KEY = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true);

        static Persistence()
        {
            // Create directory if needed.
            if (!Directory.Exists(DATA_DIRECTORY)) Directory.CreateDirectory(DATA_DIRECTORY);
        }

        /**
         * Returns the stored hub token for this computer, or null if none are found.
         */
        public static string GetHubToken()
        {
            try
            {
                if (!File.Exists(HUB_TOKEN_PATH)) return null;
                return File.ReadAllText(HUB_TOKEN_PATH);
            }
            catch
            {
                // If we have an error, just ignore it and return null.
                return null;
            }
        }

        /**
         * Returns the code that needs to be entered on the mobile interface to connect to this
         * phone. Returns null if no token is received yet.
         */
        public static string GetHubCode()
        {
            var token = GetHubToken();
            if (token == null) return null;

            var base64Json = token.Split('.')[1];

            // We need to pad to the nearest multiple of 4 here since jwts are stored without padding =s.
            var jsonContents = Encoding.UTF8.GetString(Convert.FromBase64String(base64Json.PadRight(4 * ((base64Json.Length + 3) / 4), '=')));
            return SimpleJson.DeserializeObject<dynamic>(jsonContents)["code"];
        }

        /**
         * Writes the specified new hub JWT to storage.
         */
        public static void SetHubToken(string token)
        {
            File.WriteAllText(HUB_TOKEN_PATH, token);

            // Invoke listeners
            OnHubCodeChanged?.Invoke();
        }

        /**
         * Checks if the specified device UUID has been seen and approved before.
         */
        public static bool IsDeviceApproved(string deviceUUID)
        {
            try
            {
                if (!File.Exists(DEVICES_PATH)) return false;

                var contents = File.ReadAllLines(DEVICES_PATH);
                return contents.Any(x => x == deviceUUID);
            }
            catch
            {
                // Ignore errors.
                return false;
            }
        }

        /**
         * Adds the specified device UUID to the list of approved devices. Note: this
         * does not check if the device was previously approved, calling this with an
         * approved device will lead to duplicate entries.
         */
        public static void ApproveDevice(string deviceUUID)
        {
            try
            {
                // Simply append the UUID to the list of approved devices. This will
                // create the file if it did not yet exist.
                File.AppendAllText(DEVICES_PATH, deviceUUID + "\n");
            }
            catch
            {
                // Ignore errors.
            }
        }

        /**
         * Checks if conduit is configured to launch at startup.
         */
        public static bool LaunchesAtStartup()
        {
            // Update path to current executable if we moved.
            var exists = BOOT_KEY.GetValue(Program.APP_NAME) != null;

            if (exists)
            {
                BOOT_KEY.SetValue(Program.APP_NAME, Assembly.GetExecutingAssembly().Location);
            }

            return exists;
        }

        /**
         * Toggles whether or not mimic should launch at startup.
         */
        public static void ToggleLaunchAtStartup()
        {
            if (LaunchesAtStartup())
            {
                BOOT_KEY.DeleteValue(Program.APP_NAME);
            } else
            {
                BOOT_KEY.SetValue(Program.APP_NAME, Assembly.GetExecutingAssembly().Location);
            }
        }

        /**
         * Either loads the stored keys into a new RSACryptoServiceProvider, or generates
         * new keys and stores them.
         */
        public static RSACryptoServiceProvider GetRSAProvider()
        {
            try
            {
                // The stored file doesn't exist, generate a new one.
                if (!File.Exists(KEYPAIR_PATH)) return GenerateAndStoreKeys();

                // Else, import from XML.
                var reader = new StringReader(File.ReadAllText(KEYPAIR_PATH));
                var deserializer = new XmlSerializer(typeof(RSAParameters));
                var rsaParams = (RSAParameters) deserializer.Deserialize(reader);

                var provider = new RSACryptoServiceProvider();
                provider.ImportParameters(rsaParams);

                return provider;
            }
            catch
            {
                // Something bad happened. Regen our keys.
                return GenerateAndStoreKeys();
            }
        }

        /**
         * Utility helper to generate and store a new set of 2048bit RSA keys.
         */
        private static RSACryptoServiceProvider GenerateAndStoreKeys()
        {
            var provider = new RSACryptoServiceProvider(2048);

            // Write the constants as XML to file.
            var writer = new StringWriter();
            var serializer = new XmlSerializer(typeof(RSAParameters));
            serializer.Serialize(writer, provider.ExportParameters(true));
            File.WriteAllText(KEYPAIR_PATH, writer.ToString());

            return provider;
        }
    }
}
