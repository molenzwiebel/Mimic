import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import * as rift from "./rift";
import socket from "./socket";
import Constants from "expo-constants";
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
        config.readyCheckNotificationsEnabled
            ? socket.subscribeForNotifications(NotificationType.READY_CHECK)
            : socket.unsubscribeFromNotifications(NotificationType.READY_CHECK),
        config.gameStartNotificationsEnabled
            ? socket.subscribeForNotifications(NotificationType.GAME_STARTED)
            : socket.unsubscribeFromNotifications(NotificationType.GAME_STARTED)
    ]);
}

/**
 * Sends the updated push notification tokens to the server so that this
 * device is reachable. Should be called after notification settings are updated
 * as well as other places where these can be regenerated (particularly, on restart).
 */
export async function updateRemoteNotificationToken() {
    console.log("[+] Updating notification tokens with remote...");

    const response = await Notifications.getPermissionsAsync();
    const token = response.granted ? (await Notifications.getExpoPushTokenAsync())?.data : null;

    console.log("[+] Notification token: " + token);

    await rift.updateRemoteNotificationToken(token);
}

/**
 * Subscribes this device to receive notifications of the specified type using the
 * PN token pushed to Rift on startup. `token` needs to be the subscription token
 * received from Conduit during handshaking.
 */
export async function subscribeForNotifications(token: string, type: NotificationType) {
    await rift.subscribeForNotifications(token, type);
}

/**
 * Unsubscribes this device from receiving notifications of the specified type from
 * the machine with the given code.
 */
export async function unsubscribeForNotification(machine: string, type: NotificationType) {
    await rift.unsubscribeForNotification(machine, type);
}

async function handleNotification(notification: Notifications.Notification, focused: boolean, action: string | null) {
    console.log("[+] Received notification: ");
    console.log(JSON.stringify(notification));
    console.log("[+] Action: " + action);

    // Clear notifications if needed.
    if (notification.request.content.data.type === NotificationType.CLEAR) {
        await Notifications.dismissAllNotificationsAsync();
        return;
    }

    if (!focused) {
        // The notification happened while we were focused.
        // Ignore it since we aren't interested.
        // TODO (molenzwiebel): Maybe show a local copy of the notification if != READY_CHECK?
        return;
    }

    // If this is a ready check and the user responded through the notification, apply it.
    if (notification.request.content.data.type === NotificationType.READY_CHECK && action) {
        // We don't care about the response, so don't await.
        rift.respondInstantFeedback(notification.request.content.data.respondToken as string, action).catch(() => {});
    }

    // TODO: Figure out how to find selected result.
    // For now, just connect.
    if (!socket.connected || socket.code !== notification.request.content.data.code) {
        socket.connect(notification.request.content.data.code as string);
    }
}

/**
 * Registers the notification categories used in iOS/Android.
 */
export async function registerForNotifications() {
    await Notifications.setNotificationCategoryAsync(
        NotificationType.READY_CHECK,
        [
            {
                identifier: "accept",
                buttonTitle: "Accept"
            },
            {
                identifier: "decline",
                buttonTitle: "Decline",
                options: {
                    opensAppToForeground: false // handle in the background
                }
            }
        ],
        {
            showTitle: true,
            showSubtitle: true,
            allowAnnouncement: true
        }
    );

    if (Constants.platform?.android) {
        await Notifications.setNotificationChannelAsync(NotificationType.READY_CHECK, {
            name: "Ready Check Notifications",
            importance: AndroidImportance.MAX,
            description:
                "Notifications sent when your queue pops! These are a pretty high priority, to ensure that they get to you as fast as possible.",
            enableVibrate: true
        });

        await Notifications.setNotificationChannelAsync(NotificationType.GAME_STARTED, {
            name: "Game Start Notifications",
            importance: AndroidImportance.MAX,
            description:
                "Notifications sent when minions are about to spawn and you're still away from your computer. High priority, to ensure that you get back before the first wave spawns.",
            enableVibrate: true
        });
    }

    Notifications.addNotificationReceivedListener(notif => handleNotification(notif, false, null));
    Notifications.addNotificationResponseReceivedListener(notif =>
        handleNotification(notif.notification, false, notif.actionIdentifier)
    );
}
