using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Fantome.Libraries.League.IO.ReleaseManifestFile;
using Fantome.Libraries.League.IO.WAD;
using Newtonsoft.Json.Linq;
using ZstdSharp;

namespace crunch
{
    class Program
    {
        static void Main(string[] args)
        {
            AsyncMain(args).Wait();
        }

        async static Task AsyncMain(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("[-] Usage: ./crunch [region] [out directory]");
                return;
            }

            var region = args[0];
            var outDir = args[1];

            Console.WriteLine($"[+] Creating asset bundle for the latest release on {region}...");

            var downloadLink = await QueryLatestRelease(region);

            var existingManifestPath = Path.Combine(outDir, "manifest.json");
            if (File.Exists(existingManifestPath))
            {
                dynamic content = JObject.Parse(File.ReadAllText(existingManifestPath));
                if (content.manifest_url == downloadLink)
                {
                    Console.WriteLine("[+] Manifest URL matches old bundle, not updating.");
                    return;
                }
            }

            Console.WriteLine($"[+] Latest manifest URL: {downloadLink}");

            var manifest = await DownloadManifest(downloadLink);

            var gameDataFolder = manifest.Directories.First(x => x.Name == "rcp-be-lol-game-data");
            var wadEntry = manifest.Files.First(x => x.ParentID == gameDataFolder.ID && x.Name == "default-assets.wad");
            var wadFile = Path.Combine(outDir, "default-assets.wad");

            Console.WriteLine($"[+] Downloaded manifest, found game data WAD with ID {wadEntry.ID}");

            await DownloadPatchFile(manifest, wadEntry, wadFile);

            Console.WriteLine("[+] Download game data WAD, exporting...");

            using (var stream = File.OpenRead(wadFile))
            {
                var gameDataWad = new WADFile(stream);
                var generator = new AssetBundleGenerator(downloadLink, gameDataWad, outDir);

                generator.Generate();
            }

            Console.WriteLine("[+] Done!");
            File.Delete(wadFile);
        }

        /**
         * Queries patch sieve for the URL of the most recent processed 
         */
        private static async Task<string> QueryLatestRelease(string region)
        {
            var client = new HttpClient();
            var content = await client.GetStringAsync(
                $"https://clientconfig.rpg.riotgames.com/api/v1/config/public");

            dynamic body = JObject.Parse(content);
            JArray configs = body["keystone.products.league_of_legends.patchlines.live"].platforms.win.configurations;
            dynamic relevantConfig = configs.First(x =>
            {
                dynamic obj = x;
                return obj.region_data.default_region == region;
            });

            return relevantConfig.patch_url;
        }

        private static async Task<ReleaseManifest> DownloadManifest(string url)
        {
            var client = new HttpClient();
            var bytes = await client.GetByteArrayAsync(url);
            var stream = new MemoryStream(bytes);
            return new ReleaseManifest(stream);
        }

        private static async Task DownloadPatchFile(ReleaseManifest manifest, ReleaseManifestFile file, string output)
        {
            var chunksById = new Dictionary<ulong, BundleChunk>();
            foreach (var bundle in manifest.Bundles)
            {
                long offset = 0;
                foreach (var chunk in bundle.Chunks)
                {
                    chunksById.Add(chunk.ID, new BundleChunk
                    {
                        URL = $"https://lol.secure.dyn.riotcdn.net/channels/public/bundles/{bundle.ID:X16}.bundle",
                        Offset = offset,
                        Length = chunk.CompressedSize,
                        DecompressedLength = chunk.UncompressedSize,
                    });

                    offset += chunk.CompressedSize;
                }
            }

            var client = new HttpClient();
            var writeStream = File.Create(output);
            Console.WriteLine();

            for (var i = 0; i < file.ChunkIDs.Count;)
            {
                var chunk = chunksById[file.ChunkIDs[i]];
                var downloadStart = chunk.Offset;
                var downloadEnd = chunk.Offset + chunk.Length;
                var length = chunk.DecompressedLength;

                i++;

                while (i < file.ChunkIDs.Count)
                {
                    var nextChunk = chunksById[file.ChunkIDs[i]];

                    if (nextChunk.URL == chunk.URL && nextChunk.Offset == downloadEnd)
                    {
                        downloadEnd += nextChunk.Length;
                        length += nextChunk.DecompressedLength;
                        i++;
                    }
                    else
                    {
                        break;
                    }
                }

                Console.Write("\r[+] Download progress: " + i + "/" + file.ChunkIDs.Count + "     ");

                var compressedBytes = await DownloadRange(client, chunk.URL, downloadStart, downloadEnd);
                var uncompressedBytes = Zstd.Decompress(compressedBytes, (int) length);
                await writeStream.WriteAsync(uncompressedBytes);
            }

            writeStream.Close();
        }

        private static async Task<byte[]> DownloadRange(HttpClient client, string url, long from, long to)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Range = new RangeHeaderValue
            {
                Ranges = {new RangeItemHeaderValue(from, to - 1)}
            };

            var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsByteArrayAsync();
        }

        class BundleChunk
        {
            public string URL;
            public long Offset;
            public long Length;
            public long DecompressedLength;
        }
    }
}