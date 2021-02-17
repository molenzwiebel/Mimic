import { getNotificationPlatform, RIFT_HOST } from "./constants";
import Constants from "expo-constants";
import { NotificationType } from "./notifications";

/**
 * Unsubscribes the current machine from push notifications of the given type sent by
 * the given machine.
 */
export async function unsubscribeForNotification(machine: string, type: NotificationType) {
    await fetch(`${RIFT_HOST}/v1/notifications/unsubscribe/${machine}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uuid: Constants.installationId,
            type
        })
    });
}

/**
 * Subscribes the current machine for push notifications of the given type sent by
 * the given machine.
 */
export async function subscribeForNotifications(token: string, type: NotificationType) {
    await fetch(`${RIFT_HOST}/v1/notifications/subscribe`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uuid: Constants.installationId,
            token,
            type
        })
    });
}

/**
 * Respond using the instant feedback token received through a push notification with
 * the given action.
 */
export async function respondInstantFeedback(token: string, action: string) {
    return fetch(`${RIFT_HOST}/v1/notifications/respond?token=${token}&response=${action}`, {
        method: "POST"
    });
}

/**
 * Update the remotely stored push notification token for this device to the given token.
 */
export async function updateRemoteNotificationToken(token: string | null) {
    await fetch(`${RIFT_HOST}/v1/notifications/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uuid: Constants.installationId,
            platform: getNotificationPlatform(),
            token: token
        })
    });
}

/**
 * Returns whether the specified device is currently connected to rift. This does not necessarily
 * indicate that the device is available for connections and should be used as a heuristic.
 */
export async function isDeviceOnline(code: string): Promise<boolean> {
    return await fetch(`${RIFT_HOST}/v1/conduit/status/${code}`).then(x => x.json());
}
