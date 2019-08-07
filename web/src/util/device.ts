import { isiOSApp, isAndroidApp } from "@/util/native";
import Vue from "vue";

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

// The user's response to asking for PN approval for a specific code.
type DevicePNApprovalState = "notAsked" | "approved" | "denied";

// Local copy of the pushNotificationApprovals object, but made reactive
// so that Vue can pick up on calls to setPushNotificationApprovalState.
const hasLocalStorage = "localStorage" in window && localStorage;
const pushNotificationApprovals = Vue.observable(
    hasLocalStorage ? JSON.parse(localStorage.getItem("pushNotificationApprovals") || "{}") : {}
);

/**
 * Returns whether or not this device is running Mimic standalone (outside
 * of the normal browser interface, such as when added to the homescreen or
 * when running in the native apps).
 */
export function isRunningStandalone() {
    return !!(
        (<any>navigator).standalone
        || window.matchMedia('(display-mode: standalone)').matches
        || isiOSApp
        || isAndroidApp
    );
}

/**
 * Returns a simple object containing the browser and device of the current session.
 */
export function getDeviceDescription(): { browser: string, device: string } {
    const device = DEVICES.filter(x => navigator.userAgent.indexOf(x.value) !== -1);

    let browser = BROWSERS.filter(x => navigator.userAgent.indexOf(x.value) !== -1);
    if (isiOSApp || isAndroidApp) {
        browser = [{ name: "the Mimic app", value: "" }];
    }

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

/**
 * Returns the push notification approval state for the machine with the
 * specified code.
 */
export function getPushNotificationApprovalState(code: string): DevicePNApprovalState {
    if (!hasLocalStorage) return "denied";

    // We need to set here so that Vue can pick up on the
    // property read below. Otherwise it will not detect that
    // a view depends on the return value of this function.
    if (!pushNotificationApprovals[code]) {
        Vue.set(pushNotificationApprovals, code, "notAsked");
    }

    return pushNotificationApprovals[code];
}

/**
 * Records the specified user response for push notification approval or denial.
 */
export function setPushNotificationApprovalState(code: string, state: DevicePNApprovalState) {
    if (!hasLocalStorage) return;

    Vue.set(pushNotificationApprovals, code, state);
    localStorage.setItem("pushNotificationApprovals", JSON.stringify(pushNotificationApprovals));
}
