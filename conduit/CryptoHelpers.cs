using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Conduit
{
    /**
     * Set of helpers for dealing with both RSA (for exchanging a shared secret) and AES (for encoding payloads).
     */
    class CryptoHelpers
    {
        // Get a provider either from files or generate a new one.
        private static readonly RSACryptoServiceProvider PROVIDER = Persistence.GetRSAProvider();

        /**
         * Exports the public key for this Conduit installation to ASN.1 base64 format.
         */
        public static string ExportPublicKey()
        {
            return RSAToASN(PROVIDER);
        }

        /**
         * Decrypts the specified base64 encoded string using the Conduit private key. Returns null
         * if the data is invalid.
         */
        public static string DecryptRSA(string base64)
        {
            try
            {
                return Encoding.UTF8.GetString(PROVIDER.Decrypt(Convert.FromBase64String(base64), true));
            }
            catch (CryptographicException)
            {
                return null;
            }
        }

        /**
         * Decrypts the specified base64 string of encoded values + ivs using the specified AES key.
         */
        public static string DecryptAES(byte[] key, string base64)
        {
            string[] parts = base64.Split(':');
            byte[] iv = Convert.FromBase64String(parts[0]);
            byte[] payload = Convert.FromBase64String(parts[1]);

            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.Key = key;
                aesAlg.IV = iv;

                // Create a decryptor to perform the stream transform.
                ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

                // Create the streams used for decryption.
                using (MemoryStream msDecrypt = new MemoryStream(payload))
                using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                {
                    return srDecrypt.ReadToEnd();
                }
            }
        }

        /**
         * Encrypts the specified message using the specified key and a random IV.
         */
        public static string EncryptAES(byte[] key, string payload)
        {
            using (Aes aesAlg = Aes.Create())
            using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider())
            {
                // Get 16 random bytes for our IV.
                var iv = new byte[16];
                rng.GetBytes(iv);

                aesAlg.Key = key;
                aesAlg.IV = iv;

                // Create an encryptor to perform the stream transform.
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                // Create the streams used for encryption.
                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                    {
                        //Write all data to the stream.
                        swEncrypt.Write(payload);
                    }

                    return Convert.ToBase64String(iv) + ":" + Convert.ToBase64String(msEncrypt.ToArray());
                }
            }
        }

        /**
         * Helper to export the specified RSACryptoServiceProvider to a base64 ASN.1 format.
         * Adapted from this stackoverflow answer: https://stackoverflow.com/questions/28406888/c-sharp-rsa-public-key-output-not-correct/28407693#28407693
         */
        private static string RSAToASN(RSACryptoServiceProvider csp)
        {
            var parameters = csp.ExportParameters(false);

            using (var stream = new MemoryStream())
            {
                var writer = new BinaryWriter(stream);
                writer.Write((byte) 0x30); // SEQUENCE

                using (var innerStream = new MemoryStream())
                {
                    var innerWriter = new BinaryWriter(innerStream);
                    innerWriter.Write((byte) 0x30); // SEQUENCE

                    EncodeLength(innerWriter, 13);

                    innerWriter.Write((byte) 0x06); // OBJECT IDENTIFIER
                    var rsaEncryptionOid = new byte[] {0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01};

                    EncodeLength(innerWriter, rsaEncryptionOid.Length);
                    innerWriter.Write(rsaEncryptionOid);
                    innerWriter.Write((byte) 0x05); // NULL

                    EncodeLength(innerWriter, 0);
                    innerWriter.Write((byte) 0x03); // BIT STRING

                    using (var bitStringStream = new MemoryStream())
                    {
                        var bitStringWriter = new BinaryWriter(bitStringStream);
                        bitStringWriter.Write((byte) 0x00); // # of unused bits
                        bitStringWriter.Write((byte) 0x30); // SEQUENCE

                        using (var paramsStream = new MemoryStream())
                        {
                            var paramsWriter = new BinaryWriter(paramsStream);
                            EncodeIntegerBigEndian(paramsWriter, parameters.Modulus); // Modulus
                            EncodeIntegerBigEndian(paramsWriter, parameters.Exponent); // Exponent

                            var paramsLength = (int) paramsStream.Length;
                            EncodeLength(bitStringWriter, paramsLength);
                            bitStringWriter.Write(paramsStream.GetBuffer(), 0, paramsLength);
                        }

                        var bitStringLength = (int) bitStringStream.Length;
                        EncodeLength(innerWriter, bitStringLength);
                        innerWriter.Write(bitStringStream.GetBuffer(), 0, bitStringLength);
                    }

                    var length = (int) innerStream.Length;
                    EncodeLength(writer, length);
                    writer.Write(innerStream.GetBuffer(), 0, length);
                }

                return Convert.ToBase64String(stream.GetBuffer(), 0, (int) stream.Length);
            }
        }

        /**
         * Helper to encode an ASN formatted length.
         * Source: https://stackoverflow.com/questions/28406888/c-sharp-rsa-public-key-output-not-correct/28407693#28407693
         */
        private static void EncodeLength(BinaryWriter stream, int length)
        {
            if (length < 0x80)
            {
                // Short form
                stream.Write((byte) length);
            }
            else
            {
                // Long form
                var temp = length;
                var bytesRequired = 0;
                while (temp > 0)
                {
                    temp >>= 8;
                    bytesRequired++;
                }

                stream.Write((byte) (bytesRequired | 0x80));
                for (var i = bytesRequired - 1; i >= 0; i--)
                {
                    stream.Write((byte) (length >> (8 * i) & 0xff));
                }
            }
        }

        /**
         * Helper to write an integer of variable length as big endian to a binary writer.
         * Source: https://stackoverflow.com/questions/28406888/c-sharp-rsa-public-key-output-not-correct/28407693#28407693
         */
        private static void EncodeIntegerBigEndian(BinaryWriter stream, byte[] value, bool forceUnsigned = true)
        {
            stream.Write((byte) 0x02); // INTEGER

            var prefixZeros = 0;
            foreach (var t in value)
            {
                if (t != 0) break;
                prefixZeros++;
            }

            if (value.Length - prefixZeros == 0)
            {
                EncodeLength(stream, 1);
                stream.Write((byte) 0);
            }
            else
            {
                if (forceUnsigned && value[prefixZeros] > 0x7f)
                {
                    // Add a prefix zero to force unsigned if the MSB is 1
                    EncodeLength(stream, value.Length - prefixZeros + 1);
                    stream.Write((byte) 0);
                }
                else
                {
                    EncodeLength(stream, value.Length - prefixZeros);
                }

                for (var i = prefixZeros; i < value.Length; i++)
                {
                    stream.Write(value[i]);
                }
            }
        }
    }
}