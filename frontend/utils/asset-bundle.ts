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

const ongoingDownloads = new Map<string, Promise<string>>();
let manifest!: AssetManifest;
const assetFileByPath = new Map<string, AssetFile>();

/**
 * Attempts to retrieve the asset for the specified path synchronously. Returns
 * the assetfile if it exists, or null otherwise.
 */
export function lookupAsset(path: string): AssetFile | null {
    return assetFileByPath.get(path) || null;
}

/**
 * Returns the path to the cached version of the specified asset with the specified
 * md5, or null if that version of the file is not currently cached locally.
 */
export async function getCachedPath(path: string, md5: string): Promise<string | null> {
    if (isWeb) return null;

    const filePath = `${DIR}/${path}`;
    const fileData = await FileSystem.getInfoAsync(filePath, { md5: true });

    if (fileData.exists && fileData.md5?.toUpperCase() === md5.toUpperCase()) {
        return filePath;
    }

    return null;
}

/**
 * Downloads the specified path to the cache filesystem. Does not attempt to check whether
 * a (potentially equal or newer) version of the asset already exists locally. This function
 * will deduplicate multiple calls for the same asset.
 */
export async function downloadAsset(path: string): Promise<string> {
    if (ongoingDownloads.has(path)) return ongoingDownloads.get(path)!;

    const promise = doDownloadAsset(path);
    ongoingDownloads.set(path, promise);

    return promise.then(result => {
        ongoingDownloads.delete(path);
        return result;
    });
}

/**
 * Private implementation for `downloadAsset`.
 */
async function doDownloadAsset(path: string): Promise<string> {
    const dir = path
        .split("/")
        .slice(0, -1)
        .join("/");
    const filePath = `${DIR}/${path}`;
    const dirPath = `${DIR}/${dir}`;

    // ensure directory is created
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });

    // prefer the hashed download URL so that the CDN caching works properly
    // this only works if we have the manifest loaded already (doesn't work
    // we're downloading the manifest right now)
    const url = assetFileByPath.get(path)?.hash_path ?? path;

    const downloadResult = await FileSystem.downloadAsync(`${CDN_HOST}/${url}`, filePath);
    return downloadResult.uri;
}

/**
 * Either returns the path to the specified file from the locally cached
 * file system or attempts to download it from the CDN. The given md5 is
 * used to determine whether the locally cached asset is still valid.
 */
async function getOrDownloadAsset(path: string, md5: string): Promise<string> {
    // No FS on web, return URL to CDN instead.
    if (isWeb) {
        return `${CDN_HOST}/${path}`;
    }

    const cachePath = await getCachedPath(path, md5);

    if (cachePath) {
        return cachePath;
    }

    console.log(`[+] Downloading asset '${path}' because it was not cached or out of date.`);
    return await downloadAsset(path);
}

/**
 * Attempts to download the JSON object at the specified path. This will
 * internally look up the MD5 for the object from the bundle and ensure that
 * the latest version is cached locally.
 */
export async function getOrDownloadJSON<T>(path: string): Promise<T> {
    const assetFile = assetFileByPath.get(path);
    if (!assetFile) throw new Error("Unknown JSON asset: " + path);

    const manifestUrl = await getOrDownloadAsset(assetFile.path, assetFile.hash);
    return JSON.parse(await readCachedFile(manifestUrl));
}

/**
 * Reads the contents of the specified cached file URI returned from
 * getOrDownloadAsset.
 */
export async function readCachedFile(uri: string): Promise<string> {
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
    const manifestUrl = await getOrDownloadAsset("manifest.json", manifestHash);
    manifest = JSON.parse(await readCachedFile(manifestUrl));

    for (const file of manifest.files) {
        assetFileByPath.set(file.path, file);
    }

    console.log("[+] Loaded asset bundle created at " + manifest.created_at);
}
