import * as apn from "apn";
import * as db from "./database";
import * as jwt from "jsonwebtoken";
import * as admin from "firebase-admin";

// iOS notifications.
const apnProvider = new apn.Provider({
    token: {
        key: process.env.RIFT_IOS_PN_KEY_PATH!,
        keyId: process.env.RIOT_IOS_PN_KEY_ID!,
        teamId: process.env.RIFT_IOS_PN_TEAM_ID!
    },
    production: false
});

// Android/Firebase notifications.
admin.initializeApp({
    credential: admin.credential.cert(process.env.RIFT_FIREBASE_KEY_PATH!)
});
const messaging = admin.messaging();

/**
 * Broadcasts a ready check notification with appropriate content to all devices registered
 * with the computer with the specified code. This function will automatically populate the
 * appropriate fields for the specified notification type. It will also attach a signed token
 * that can be used to give feedback without having to connect to the device itself. These 
 * tokens expire after 
 */
export async function broadcastReadyCheckNotification(content: string, code: string) {
    const tokens = await db.getRegisteredNotificationTokens(code);
    const iosTokens = tokens.filter(x => x.type === "ios").map(x => x.token);
    const androidTokens = tokens.filter(x => x.type === "android").map(x => x.token);

    const respondToken = jwt.sign({
        code,
        type: "readyCheck"
    }, process.env.RIFT_JWT_SECRET!, {
        expiresIn: 60 // expire in a minute 
    });

    if (iosTokens.length) {
        // Send iOS notification.
        const iosNotification = new apn.Notification();
        iosNotification.expiry = Math.floor(Date.now() / 1000) + 10; // expire in 10 seconds (ready check takes 8s)
        iosNotification.sound = "queue-pop.aiff";
        iosNotification.alert = content;
        iosNotification.payload = { respondToken, code };
        iosNotification.topic = process.env.RIFT_IOS_PN_BUNDLE_ID!;
        iosNotification.collapseId = "READY_CHECK";
        iosNotification.aps.category = "READY_CHECK";
        await apnProvider.send(iosNotification, iosTokens);
    }

    if (androidTokens.length) {
        // Send android notification.
        await messaging.sendToDevice(androidTokens, {
            data: {
                type: "readyCheck",
                title: content,
                respondToken,
                code
            }
        });
    }
}

/**
 * Sends a hidden notification to all devices registered with the specified code to remove
 * all outstanding ready check notifications. This is used to remove the notifications when
 * the ready check expires.
 */
export async function removeReadyCheckNotifications(code: string) {
    const tokens = await db.getRegisteredNotificationTokens(code);
    const iosTokens = tokens.filter(x => x.type === "ios").map(x => x.token);
    const androidTokens = tokens.filter(x => x.type === "android").map(x => x.token);

    if (iosTokens.length) {
        // Send iOS notification.
        const iosNotification = new apn.Notification();
        iosNotification.payload = { remove: "READY_CHECK" };
        iosNotification.contentAvailable = true; // run in the background
        iosNotification.topic = process.env.RIFT_IOS_PN_BUNDLE_ID!;
        await apnProvider.send(iosNotification, iosTokens);
    }

    if (androidTokens.length) {
        // Send android notification.
        await messaging.sendToDevice(androidTokens, {
            data: {
                type: "dismiss",
                dismissType: "readyCheck"
            }
        });
    }
}
