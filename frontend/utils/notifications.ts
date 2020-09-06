import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import socket from "./socket";
import Constants from "expo-constants";
import { Notification } from "expo/build/Notifications/Notifications.types";
import { getNotificationPlatform, RIFT_HOST } from "./constants";
import { withComputerConfig } from "./persistence";

/**
 * Represents a type of push notification that can be sent by Rift.
 */
export enum NotificationType {
    // Every client subscribes to this. Clears all received notifications.
    CLEAR = "CLEAR",

    // Sent when ready check triggers.
    READY_CHECK = "READY_CHECK",

    // Sent when the game has (almost) started.
    GAME_STARTED = "GAME_STARTED"
}

/**
 * Represents a platform that can receive push notifications.
 */
export enum NotificationPlatform {
    IOS = "ios",
    ANDROID = "android",
    WEB = "web"
}

/**
 * Updates the remote subscriptions of all notifications based on our current settings.
 * Should be called after notification settings are updated, so that the updated subscriptions
 * can be sent to the server.
 */
export async function updateNotificationSubscriptions() {
    const config = await withComputerConfig();

    await Promise.all([
        socket.subscribeForNotifications(NotificationType.CLEAR),
        config.readyCheckNotificationsEnabled ? socket.subscribeForNotifications(NotificationType.READY_CHECK) : socket.unsubscribeFromNotifications(NotificationType.READY_CHECK),
        config.gameStartNotificationsEnabled ? socket.subscribeForNotifications(NotificationType.GAME_STARTED) : socket.unsubscribeFromNotifications(NotificationType.GAME_STARTED),
    ]);
}

/**
 * Sends the updated push notification tokens to the server so that this
 * device is reachable. Should be called after notification settings are updated
 * as well as other places where these can be regenerated (particularly, on restart).
 */
export async function updateRemoteNotificationToken() {
    console.log("[+] Updating notification tokens with remote...");

    const response = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    const token = response.granted ? await Notifications.getExpoPushTokenAsync() : null;

    console.log("[+] Notification token: " + token);

    await fetch(`${RIFT_HOST}/v1/notifications/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uuid: Constants.installationId,
            platform: getNotificationPlatform(),
            token
        })
    });
}

/**
 * Subscribes this device to receive notifications of the specified type using the
 * PN token pushed to Rift on startup. `token` needs to be the subscription token
 * received from Conduit during handshaking.
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
 * Unsubscribes this device from receiving notifications of the specified type from
 * the machine with the given code.
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

async function handleNotification(notification: Notification) {
    console.log("[+] Received notification: ");
    console.log(JSON.stringify(notification));
    const action: string | null = (<any>notification).actionId || null;

    // Clear notifications if needed.
    if (notification.data.type === NotificationType.CLEAR) {
        await Notifications.dismissAllNotificationsAsync();
        return;
    }

    if (notification.origin === "received") {
        // The notification happened while we were focused.
        // Ignore it since we aren't interested.
        // TODO (molenzwiebel): Maybe show a local copy of the notification if != READY_CHECK?
        return;
    }

    // If this is a ready check and the user responded through the notification, apply it.
    if (notification.data.type === NotificationType.READY_CHECK && action) {
        // We don't care about the response.
        fetch(`${RIFT_HOST}/v1/notifications/respond?token=${notification.data.respondToken}&response=${action}`, {
            method: "POST"
        }).catch(() => {
            /* Ignored */
        });
    }

    // TODO: Figure out how to find selected result.
    // For now, just connect.
    if (!socket.connected || socket.code !== notification.data.code) {
        socket.connect(notification.data.code);
    }
}

/**
 * Registers the notification categories used in iOS/Android.
 */
export async function registerForNotifications() {
    await Notifications.createCategoryAsync(NotificationType.READY_CHECK, [
        {
            actionId: "accept",
            buttonTitle: "Accept"
        },
        {
            actionId: "decline",
            buttonTitle: "Decline",
            doNotOpenInForeground: true // handle in the background
        }
    ]);

    await Notifications.createChannelAndroidAsync(NotificationType.READY_CHECK, {
        name: "Ready Check Notifications",
        description:
            "Notifications sent when your queue pops! These are a pretty high priority, to ensure that they get to you as fast as possible.",
        vibrate: true,
        priority: "max"
    });

    await Notifications.createChannelAndroidAsync(NotificationType.GAME_STARTED, {
        name: "Game Start Notifications",
        description:
            "Notifications sent when minions are about to spawn and you're still away from your computer. High priority, to ensure that you get back before the first wave spawns.",
        vibrate: true,
        priority: "max"
    });

    await Notifications.addListener(handleNotification);
}
