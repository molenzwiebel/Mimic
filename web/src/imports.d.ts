declare module "*.vue" {
    import Vue from "vue";
    export = Vue;
}

declare module "*.jpg" {
    const path: string;
    export = path;
}

declare module "*.json" {
    const path: string;
    export = path;
}

declare module "*.png" {
    const path: string;
    export = path;
}

declare module "*.mp3" {
    const path: string;
    export = path;
}
