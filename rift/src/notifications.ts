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

const CATEGORIES = {
    readyCheck: {
        ios: "READY_CHECK",
        android: "readyCheck"
    },
    gameStart: {
        ios: "GAME_START",
        android: "gameStart"
    }
};

/**
 * Broadcasts a ready check notification with appropriate content to all devices registered
 * with the computer with the specified code. This function will automatically populate the
 * appropriate fields for the specified notification type. It will also attach a signed token
 * that can be used to give feedback without having to connect to the device itself. These 
 * tokens expire after a minute.
 */
export async function broadcastReadyCheckNotification(content: string, code: string) {
    
}

/**
 * Broadcasts a game start notification with appropriate content to all devices registered
 * with the computer with the specified code. This function will automatically populate the
 * appropriate fields for the specified notification type.
 */
export async function broadcastGameStartNotification(content: string, code: string) {
    
}

/**
 * Sends a hidden notification to all devices registered with the specified code to remove
 * all outstanding notifications of the specified type.
 */
export async function removeNotifications(code: string) {
    
}
