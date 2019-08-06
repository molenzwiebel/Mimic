
/**
 * This file handles interaction with the host application, whether it is iOS or
 * Android. It is responsible for checking if notifications are supported and
 * retrieving the tokens needed to send them.
 */
const isiOSApp = typeof window.webkit !== "undefined" && typeof window.webkit.messageHandlers !== "undefined" && typeof window.webkit.messageHandlers.mimic !== "undefined";
const isAndroidApp = typeof window.MimicAndroid !== "undefined";

let resolve!: Function;

/**
 * This function is invoked by Swift to relay information back to the
 * application after a request is made. We assume this to invoke fast
 * enough to only have a single global shared resolve function.
 */
function iosWebkitCallback(result: any) {
    resolve(result);
}
window.iosWebkitCallback = iosWebkitCallback;

/**
 * This function is invoked by Kotlin to relay information back to the
 * application after a request is made. We assume this to invoke fast
 * enough to only have a single global shared resolve function.
 */
function androidCallback(result: any) {
    resolve(result);
}
window.androidCallback = androidCallback;

/**
 * Sends a message to the host applications that loading has been
 * completed and that the interface has been rendered.
 */
export function signalLoadComplete() {
    if (isiOSApp) {
        window.webkit!.messageHandlers.mimic.postMessage({
            type: "loadingComplete"
        });
    }

    if (isAndroidApp) {
        window.MimicAndroid!.loadingComplete();
    }
}

/**
 * Checks whether or not notifications are supported on this device. Returns
 * false on websites, true on iOS/Android app.
 */
export function areNotificationsSupported(): boolean {
    return isiOSApp || isAndroidApp;
}

/**
 * Requests access to the notification feature on this device. If accepted, returns
 * a pair of [token, type]. If declined, returns null.
 */
export function requestNotificationAccess(): Promise<string[] | null> {
    if (!areNotificationsSupported()) throw new Error("Notifications not supported.");

    return new Promise<string | null>(res => {
        resolve = res;

        if (isiOSApp) {
            window.webkit!.messageHandlers.mimic.postMessage({
                type: "requestNotificationAccess"
            });
        } else {
            window.MimicAndroid!.requestNotificationAccess();
        }
    }).then(result => {
        if (result) {
            return [result, isiOSApp ? "ios" : "android"];
        }

        return null;
    });
}

declare global {
    interface Window {
        // If running on iOS.
        webkit?: {
            messageHandlers: {
                mimic: MessagePort;
            }
        };
        iosWebkitCallback?: Function;

        // If running on Android.
        MimicAndroid?: {
            requestNotificationAccess: Function,
            loadingComplete: Function
        };
        androidCallback?: Function;
    }
}