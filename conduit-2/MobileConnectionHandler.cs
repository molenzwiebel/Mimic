using System;

namespace Conduit
{
    /**
     * Handles a connection with a mobile client, which is wrapped through a connection with the hub. Also handles
     * key negotiation and encryption.
     */
    class MobileConnectionHandler
    {
        public delegate void SendMessageDelegate(string s);

        private LeagueConnection league;
        private byte[] key;

        private SendMessageDelegate Send;
        private SendMessageDelegate SendRaw;

        public MobileConnectionHandler(LeagueConnection league, SendMessageDelegate send)
        {
            this.league = league;

            this.SendRaw = send;
            this.Send = msg => SendRaw("\"" + CryptoHelpers.EncryptAES(key, msg) + "\"");
        }

        /**
         * Handles a message incoming through rift. First checks its opcode, then possibly decrypts the contents.
         */
        public void HandleMessage(dynamic msg)
        {
            if (key != null)
            {
                try
                {
                    var contents = CryptoHelpers.DecryptAES(key, (string) msg);
                    this.HandleMimicMessage(SimpleJson.DeserializeObject(contents));
                }
                catch
                {
                    // Ignore message.
                    return;
                }
            }
        
            if (!(msg is JsonArray)) return;

            if (msg[0] == (long) MobileOpcode.Secret)
            {
                var info = CryptoHelpers.DecryptRSA((string) msg[1]);

                if (info == null)
                {
                    this.SendRaw("[" + MobileOpcode.SecretResponse + ",false]");
                    return;
                }

                dynamic contents = SimpleJson.DeserializeObject(info);
                if (contents["secret"] == null || contents["identity"] == null || contents["device"] == null) return;

                // TODO: Ask user for approval.

                this.key = Convert.FromBase64String((string) contents["secret"]);
                this.SendRaw("[" + (long) MobileOpcode.SecretResponse + ",true]");
            }
        }

        /**
         * Handles a message post-decryption, which is the raw message sent by the mobile client.
         */
        private void HandleMimicMessage(dynamic msg)
        {
            // TODO
        }
    }

    enum MobileOpcode : long
    {
        // Mobile -> Conduit, sends encrypted shared secret.
        Secret = 1,

        // Conduit <- Mobile, sends result of secret negotiation. If true, rest of communications is encrypted.
        SecretResponse = 2,

        // Mobile -> Conduit, request version
        Version = 3,

        // Conduit <- Mobile, send version
        VersionResponse = 4,

        // Mobile -> Conduit, subscribe to LCU updates that match regex
        Subscribe = 5,

        // Mobile -> Conduit, unsibscribe to LCU updates that match regex
        Unsubscribe = 6,

        // Mobile -> Conduit, make LCU request
        Request = 7,

        // Conduit -> Mobile, response of a previous request message.
        Response = 8
    }
}