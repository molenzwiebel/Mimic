import * as db from "./database";
import * as jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { NotificationType, NotificationPlatform } from "./types";

/**
 * Uses the Expo API to send the specified notification.
 */
async function sendNotification(notification: any): Promise<void> {
    await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(notification)
    });
}

/**
 * Helper function that loads the notification tokens needed for the
 * specified conduit instance and type, then groups them by platform.
 */
async function getGroupedNotificationTokens(code: string, type: NotificationType): Promise<{ android: string[], ios: string[] }> {
    const tokens = await db.getSubscribedDeviceTokens(code, type);

    return {
        android: tokens.filter(x => x.platform === NotificationPlatform.ANDROID).map(x => x.token),
        ios: tokens.filter(x => x.platform === NotificationPlatform.IOS).map(x => x.token),
    };
}

/**
 * Broadcasts a ready check notification with appropriate content to all devices registered
 * with the computer with the specified code. This function will automatically populate the
 * appropriate fields for the specified notification type. It will also attach a signed token
 * that can be used to give feedback without having to connect to the device itself. These 
 * tokens expire after a minute.
 */
export async function broadcastReadyCheckNotification(code: string) {
    const { ios, android } = await getGroupedNotificationTokens(code, NotificationType.READY_CHECK);

    const respondToken = jwt.sign({
        code,
        type: NotificationType.READY_CHECK
    }, process.env.RIFT_JWT_SECRET!, {
        expiresIn: 60 // expire in a minute 
    });

    const common = {
        data: {
            type: NotificationType.READY_CHECK,
            respondToken,
            code
        },
        priority: "high",
        body: "🔔 Your queue has popped! Tap here to open Mimic.",
    };

    // iOS notification.
    await sendNotification({
        to: ios,
        sound: "default",
        badge: 1,
        categoryId: NotificationType.READY_CHECK,
        ...common
    });

    // Android notification
    await sendNotification({
        to: android,
        title: "Mimic - Queue Popped!",
        channelId: NotificationType.READY_CHECK,
        categoryId: NotificationType.READY_CHECK,
        ...common
    });
}

/**
 * Broadcasts a game start notification with appropriate content to all devices registered
 * with the computer with the specified code. This function will automatically populate the
 * appropriate fields for the specified notification type.
 */
export async function broadcastGameStartNotification(code: string) {
    const { ios, android } = await getGroupedNotificationTokens(code, NotificationType.GAME_STARTED);

    const common = {
        data: {
            type: NotificationType.GAME_STARTED,
            code
        },
        priority: "high",
        body: "🎮 The loading screen is complete and minions will spawn soon! Get back to your PC and grab that win!",
    };

    // iOS notification.
    await sendNotification({
        to: ios,
        sound: "default",
        badge: 1,
        _displayInForeground: true,
        ...common
    });

    // Android notification
    await sendNotification({
        to: android,
        title: "Mimic - Game Started!",
        channelId: NotificationType.GAME_STARTED,
        ...common
    });
}

/**
 * Sends a hidden notification to all devices registered with the specified code to remove
 * all outstanding notifications of the specified type.
 */
export async function removeNotifications(code: string) {
    const { ios, android } = await getGroupedNotificationTokens(code, NotificationType.CLEAR);

    const common = {
        data: {
            type: NotificationType.CLEAR,
            code
        },
        priority: "high"
    };

    // iOS notification.
    await sendNotification({
        to: ios,
        badge: 0,
        ...common
    });

    // Android notification
    await sendNotification({
        to: android,
        channelId: NotificationType.CLEAR,
        ...common
    });
}
