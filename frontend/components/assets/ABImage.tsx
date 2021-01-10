import { Image, ImageProps } from "react-native";
import * as assets from "../../utils/asset-bundle";
import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";

export type ABImageProps = { path: string } & Omit<ImageProps, "source">;

// 1x1 transparent image so that we do not reflow the page while we query for cache status
const placeholder = Asset.fromModule(require("../../assets/transparent-placeholder.png")).uri;

/**
 * Represents an image loaded from the locally cached asset bundle. Will
 * either display the image immediately if it is cached, or else display the low
 * resolution thumbnail until the actual image has been loaded.
 */
export default function ABImage({ path, ...props }: ABImageProps) {
    const [source, setSource] = useState(placeholder);
    const [isBlurred, setBlurred] = useState(false);

    // Whenever the path to this image changes...
    useEffect(() => {
        // reset the source while we check if we have the image cached
        setSource(placeholder);
        setBlurred(false);

        // if we're no longer valid (not mounted, path changed, etc), ensure
        // we don't update with stale data
        let stillValid = true;

        // figure out if we have the image cached
        const assetFile = assets.lookupAsset(path);
        if (!assetFile) {
            // nothing we can do if file doesn't exist. Assume it is a URL
            console.warn(
                "[-] Warning: image " +
                    path +
                    " was requested but does not exist in the asset bundle. Assuming it is from the internet."
            );
            setSource(path);

            return;
        }

        assets.getCachedPath(assetFile.path, assetFile.hash).then(path => {
            if (!stillValid) return;

            // if already cached, just show it immediately
            if (path) {
                setSource(path);
                return;
            }

            // not cached. use the thumbnail while we download
            setBlurred(true);
            setSource(assetFile.thumbnail!);

            // download actual asset
            assets.downloadAsset(assetFile.path).then(url => {
                if (!stillValid) return;

                // display actual asset
                setBlurred(false);
                setSource(url);
            });
        });

        // on unmount/path change we should cancel
        return () => {
            stillValid = false;
        };
    }, [path]);

    return <Image {...props} source={{ uri: source }} blurRadius={isBlurred ? 1 : undefined} />;
}
