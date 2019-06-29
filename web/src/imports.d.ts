declare module "*.vue" {
    import Vue from "vue";
    export default Vue;
}

declare module "*.jpg" {
    const path: string;
    export default path;
}

declare module "*.json" {
    const path: string;
    export default path;
}

declare module "*.png" {
    const path: string;
    export default path;
}

declare module "*.mp3" {
    const path: string;
    export default path;
}

declare module "node-rsa" {
    class NodeRSA {
        importKey(key: string, format: string): void;
        encrypt(content: string, outFmt: string, inFmt: string): void;
    }

    export default NodeRSA;
}