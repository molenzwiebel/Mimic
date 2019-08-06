
// The following arrays are adapted from:
// https://medium.com/creative-technology-concepts-code/detect-device-browser-and-version-using-javascript-8b511906745
const DEVICES = [
    { name: 'Windows Phone', value: 'Windows Phone' },
    { name: 'Windows computer', value: 'Win' },
    { name: 'iPhone', value: 'iPhone' },
    { name: 'iPad', value: 'iPad' },
    { name: 'Kindle device', value: 'Silk' },
    { name: 'Android device', value: 'Android' },
    { name: 'PlayBook', value: 'PlayBook' },
    { name: 'BlackBerry', value: 'BlackBerry' },
    { name: 'macOS computer', value: 'Mac' },
    { name: 'Linux computer', value: 'Linux' },
    { name: 'Palm device', value: 'Palm' }
];

const BROWSERS = [
    { name: 'Edge', value: 'Edge' },
    { name: 'Chrome', value: 'Chrome' },
    { name: 'Firefox', value: 'Firefox' },
    { name: 'Safari', value: 'Safari' },
    { name: 'Internet Explorer', value: 'MSIE' },
    { name: 'Opera', value: 'Opera' },
    { name: 'BlackBerry', value: 'CLDC' },
    { name: 'Mozilla', value: 'Mozilla' }
];

/**
 * Returns whether or not this device is running Mimic standalone (outside
 * of the normal browser interface, such as when added to the homescreen or
 * when running in the native apps).
 */
export function isRunningStandalone() {
    return !!(
        (<any>navigator).standalone
        || window.matchMedia('(display-mode: standalone)').matches
        || (typeof (<any>window).webkit !== "undefined" && typeof (<any>window).webkit.messageHandlers !== "undefined")
        || (typeof (<any>window).AndroidMimic !== "undefined")
    );
}

/**
 * Returns a simple object containing the browser and device of the current session.
 */
export function getDeviceDescription(): { browser: string, device: string } {
    const device = DEVICES.filter(x => navigator.userAgent.indexOf(x.value) !== -1);
    const browser = BROWSERS.filter(x => navigator.userAgent.indexOf(x.value) !== -1);

    return {
        browser: (browser.length ? browser[0].name : "Unknown Browser"),
        device: (device.length ? device[0].name : "Unknown Device")
    };
}

/**
 * Finds or generates a unique ID for this device that is used for Conduit
 * to remember our device on subsequent connections. Stored in localStorage,
 * so private browsing may forget us.
 */
export function getDeviceID(): string {
    const hasLocalStorage = "localStorage" in window && localStorage;
    if (hasLocalStorage && localStorage.getItem("deviceID")) {
        return localStorage.getItem("deviceID")!;
    }

    // Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    if (hasLocalStorage) {
        localStorage.setItem("deviceID", uuid);
    }

    return uuid;
}