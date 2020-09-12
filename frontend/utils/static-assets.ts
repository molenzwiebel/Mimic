import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";
import { CDN_HOST } from "./constants";

const isWeb = typeof Constants.platform?.web !== "undefined";
const DIR = `${FileSystem.cacheDirectory}mimic-crunch-static`;

/**
 * Represents the manifest.json file created by crunch.
 */
interface AssetManifest {
    manifest_url: string;
    created_at: string;
    files: AssetFile[];
}

/**
 * Represents an asset within the manifest created by crunch.
 */
interface AssetFile {
    path: string;
    hash_path: string;
    hash: string;
    thumbnail?: string;
}

let manifest!: AssetManifest;

/**
 * Either returns the path to the specified file from the locally cached
 * file system or attempts to download it from the CDN. The given md5 is
 * used to determine whether the locally cached asset is still valid.
 */
async function getOrDownloadAsset(path: string, md5: string): Promise<string> {
    // No FS on web, return URL to CDN instead.
    if (isWeb) {
        return `${CDN_HOST}${path}`;
    }

    const filePath = `${DIR}/${path}`;
    const fileData = await FileSystem.getInfoAsync(filePath, { md5: true });

    if (fileData.exists && fileData.md5?.toUpperCase() === md5.toUpperCase()) {
        return filePath;
    }

    console.log(`[+] Downloading asset '${path}' because it was not cached or out of date.`);

    const downloadResult = await FileSystem.downloadAsync(`${CDN_HOST}${path}`, filePath);
    return downloadResult.uri;
}

/**
 * Reads the contents of the specified cached file URI returned from
 * getOrDownloadAsset.
 */
async function readCachedFile(uri: string): Promise<string> {
    if (isWeb) {
        return fetch(uri).then(x => x.text());
    }

    return FileSystem.readAsStringAsync(uri);
}

/**
 * Initializes the static asset directory by downloading the manifest
 * from the CDN and storing it locally. All future lookups will go through
 * this manifest to determine cache status.
 */
export async function initializeStaticAssets() {
    try {
        await FileSystem.makeDirectoryAsync(DIR);
    } catch {
        // ignore
    }

    // Load manifest MD5.
    const manifestHash = await fetch(`${CDN_HOST}/manifesthash`).then(x => x.text());
    console.log("[+] Asset manifest bundle hash: " + manifestHash);

    // Load manifest.
    const manifestUrl = await getOrDownloadAsset("/manifest.json", manifestHash);
    manifest = JSON.parse(await readCachedFile(manifestUrl));

    console.log("[+] Loaded asset bundle created at " + manifest.created_at);
}