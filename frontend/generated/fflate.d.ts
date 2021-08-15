// fflate doesn't seem to have typescript typings for these
// specific imports, so we have to manually stub them.
declare module "fflate/esm/browser.js" {
    export const inflateSync: any;
}
