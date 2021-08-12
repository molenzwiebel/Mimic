using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Fantome.Libraries.League.Helpers.Cryptography;
using Fantome.Libraries.League.IO.WAD;
using Newtonsoft.Json;

namespace crunch
{
    public class AssetBundleGenerator
    {
        private string _manifestUrl;
        private WADFile _wad;
        private string _outDir;

        private List<SerializedFile> _serializedFiles = new List<SerializedFile>();

        public AssetBundleGenerator(string manifestUrl, WADFile wad, string outDir)
        {
            _manifestUrl = manifestUrl;
            _wad = wad;
            _outDir = outDir;

            Directory.CreateDirectory(Path.Combine(outDir, "files"));
        }

        /**
         * Generates the complete asset bundle, including a manifest with hashes, from
         * the wad file passed in the constructor. Writes to the specified target directory.
         */
        public void Generate()
        {
            // Read champion data.
            var championData = ReadJSON<List<ChampionSummaryItem>>("v1/champion-summary.json");
            WriteFile("v1/champion-summary.json");
            
            // Copy champion icons, splashes, etc.
            foreach (var champ in championData)
            {
                var champData = ReadJSON<ChampionData>($"v1/champions/{champ.id}.json");
                WriteFile($"v1/champions/{champ.id}.json");

                foreach (var skin in champData.skins)
                {
                    WriteImageFileWithThumbnail(skin.RelativePath, "data:image/jpeg;base64,", 36, 20);
                }
                
                WriteImageFileWithThumbnail($"v1/champion-icons/{champ.id}.png", "data:image/png;base64,", 20, 20);
            }
            
            // Read profile icon data.
            var iconData = ReadJSON<List<IDItem>>("v1/profile-icons.json");
            
            // Copy profile icons.
            foreach (var icon in iconData)
            {
                WriteImageFileWithThumbnail($"v1/profile-icons/{icon.id}.jpg", "data:image/jpeg;base64,", 20, 20);
            }
            
            // Read summoner spell data.
            var spellData = ReadJSON<List<IconPathItem>>("v1/summoner-spells.json");
            WriteFile("v1/summoner-spells.json");
            
            // Copy summoner spell icons.
            foreach (var spell in spellData)
            {
                WriteImageFileWithThumbnail(spell.RelativePath, "data:image/png;base64,", 20, 20);
            }
            
            // Read rune data
            var perkData = ReadJSON<List<IconPathItem>>("v1/perks.json");
            var perkStyleData = ReadJSON<PerkStyles>("v1/perkstyles.json");
            
            WriteFile("v1/perks.json");
            WriteFile("v1/perkstyles.json");
            
            // Copy rune icons
            foreach (var perk in perkData)
            {
                WriteImageFileWithThumbnail(perk.RelativePath, "data:image/png;base64,", 20, 20);
            }

            foreach (var perkstyle in perkStyleData.styles)
            {
                WriteImageFileWithThumbnail(perkstyle.RelativePath, "data:image/png;base64,", 20, 20);
            }
            
            WriteManifest();
        }

        /**
         * Writes the specified file to the output directory, recording its MD5. Will additionally
         * write the file to the root using its hashed name for caching purposes.
         */
        private bool WriteFile(string path)
        {
            var file = _wad.GetFile($"plugins/rcp-be-lol-game-data/global/default/{path}");
            if (file == null)
            {
                Console.WriteLine($"[-] File {path} did not exist");
                return false;
            }
            
            Console.WriteLine($"[+] Bundling file {path}");

            var bytes = file.GetContent(true);
            var hash = HashBytes(bytes);
            var hashPath = "files/" + hash + Path.GetExtension(path);

            _serializedFiles.Add(new SerializedFile
            {
                path = path,
                hash_path = hashPath,
                hash = hash
            });


            Directory.CreateDirectory(Path.GetDirectoryName(Path.Combine(_outDir, path)));
            File.WriteAllBytes(Path.Combine(_outDir, path), bytes);

            // The file may already exist, not just across runs but also if two items happen to share the same md5.
            var hashOutPath = Path.Combine(_outDir, hashPath);
            if (!File.Exists(hashOutPath))
            {
                File.WriteAllBytes(Path.Combine(_outDir, hashPath), bytes);
            }

            return true;
        }
        
        /**
         * Similar to WriteFile but also creates and inlines a base64 thumbnail for the image.
         */
        private void WriteImageFileWithThumbnail(string path, string prefix, int thumbnailWidth, int thumbnailHeight)
        {
            if (!WriteFile(path)) return;

            var manifestEntry = _serializedFiles.Last();
            _serializedFiles.RemoveAt(_serializedFiles.Count - 1);

            var image = Image.FromFile(Path.Combine(_outDir, manifestEntry.hash_path));
            var thumbnail = image.GetThumbnailImage(thumbnailWidth, thumbnailHeight, null, IntPtr.Zero);
            var memStream = new MemoryStream();
            thumbnail.Save(memStream, image.RawFormat);
            var thumbnailBase64 = prefix + Convert.ToBase64String(memStream.ToArray());
            memStream.Close();
            
            _serializedFiles.Add(new ThumbnailSerializedFile()
            {
                path = path,
                hash_path = manifestEntry.hash_path,
                hash = manifestEntry.hash,
                thumbnail = thumbnailBase64
            });
        }

        /**
         * Writes the completed manifest to the file.
         */
        private void WriteManifest()
        {
            var jsonContent = JsonConvert.SerializeObject(new
            {
                manifest_url = _manifestUrl,
                created_at = DateTime.Now,
                files = _serializedFiles
            });
            
            File.WriteAllText(Path.Combine(_outDir, "manifest.json"), jsonContent);

            var manifestMd5 = HashBytes(Encoding.UTF8.GetBytes(jsonContent));
            File.WriteAllText(Path.Combine(_outDir, "manifesthash"), manifestMd5);
        }
        
        /**
         * Reads the contents of the specified path as a JSON.
         */
        private T ReadJSON<T>(string path)
        {
            var file = _wad.GetFile($"plugins/rcp-be-lol-game-data/global/default/{path}");
            var content = Encoding.UTF8.GetString(file.GetContent(true));

            return JsonConvert.DeserializeObject<T>(content);
        }

        /**
         * Creates the MD5 hash of the specified byte array.
         */
        private static string HashBytes(byte[] bytes)
        {
            using (var md5 = MD5.Create())
            {
                var hash = md5.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", string.Empty);
            }
        }
    }
    
    static class Extensions
    {
        public static WADEntry GetFile(this WADFile file, string path)
        {
            var hash = XXHash.XXH64(Encoding.ASCII.GetBytes(path.ToLower()));
            return file.Entries.FirstOrDefault(x => x.XXHash == hash);
        }
    }

    class SerializedFile
    {
        public string path;
        public string hash_path;
        public string hash;
    }

    class ThumbnailSerializedFile : SerializedFile
    {
        public string thumbnail;
    }

    class ChampionSummaryItem
    {
        public int id;
        public string name;
        public string alias;
    }

    class IconPathItem
    {
        public string iconPath;

        public string RelativePath => iconPath.Replace("/lol-game-data/assets/", "").ToLower();
    }

    class PerkStyles
    {
        public List<IconPathItem> styles;
    }

    class IDItem
    {
        public int id;
    }

    class ChampionData
    {
        public List<ChampionSkin> skins;
    }

    class ChampionSkin
    {
        public string splashPath;
        
        public string RelativePath => splashPath.Replace("/lol-game-data/assets/", "").ToLower();
    }
}