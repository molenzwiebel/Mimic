import { open, Database } from "sqlite";
import { Database as Sqlite3Database } from "sqlite3";
import { NotificationPlatform, NotificationType } from "./types";
import * as fs from "fs";

let database!: Database;

/**
 * Creates or loads a new sqlite database.
 */
export async function create() {
    const existed = fs.existsSync("database.db");

    database = await open({
        filename: "database.db",
        driver: Sqlite3Database
    });

    if (!existed) {
        // List of conduit codes and their accompanying public key.
        // We use the public key as a way to re-assign the same code
        // to a device if they lost/expired their access token.
        await database.exec(`
            CREATE TABLE \`conduit_instances\` (
                \`code\`	    TEXT,
                \`public_key\`	TEXT,
                PRIMARY KEY(\`code\`)
            );
        `);

        // List of mobile devices, indexed by their randomly generated UUID.
        // Platform refers to the NotificationPlatform, token is the last known
        // valid push notification token for that platform. token can be null
        // if a push notification emit failed due to an expired token (we 
        // do not nuke the entry entirely as it is possible the device could
        // connect in the future and regenerate a new valid token)
        await database.exec(`
            CREATE TABLE \`mobile_devices\` (
                \`id\`          INTEGER PRIMARY KEY,
                \`uuid\`        TEXT,
                \`platform\`    TEXT,
                \`token\`       TEXT
            );
        `);

        // List of subscription pairs between a mobile device and a conduit
        // instance. type refcers to the NotificationType for that specific
        // registration.
        await database.exec(`
            CREATE TABLE \`device_notification_subscriptions\` (
                \`device_id\`    INTEGER,
                \`conduit_code\` TEXT,
                \`type\`         TEXT,
                CONSTRAINT fk_device_id FOREIGN KEY (device_id) REFERENCES mobile_devices (id) ON DELETE CASCADE
            );
        `);
    }
}

/**
 * Generates a new unique code for the specified public key and returns that key.
 * Either inserts the public key in the database, or returns the existing code
 * if it already existed.
 */
export async function generateCode(pubkey: string): Promise<string> {
    if (!database) throw new Error("Database not loaded yet.");

    const existing = await database.get(`SELECT * FROM conduit_instances WHERE public_key = ? LIMIT 1`, pubkey);
    if (existing) return existing.code;

    let code: string;
    while (true) {
        // Generate a random 6 digit number as code.
        code = (Math.floor(Math.random() * 900000) + 100000).toString();

        // Check if it already existed.
        const existed = await database.get(`SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?`, code);

        // Break if unique, else loop again.
        if (existed.count === 0) break;
    }

    await database.run(`INSERT INTO conduit_instances VALUES (?, ?)`, code, pubkey);
    return code;
}

/**
 * Looks up the public key belonging to the specified code. Returns either the
 * key, or null if not found.
 */
export async function lookup(code: string): Promise<{ public_key: string, code: string } | null> {
    if (!database) throw new Error("Database not loaded yet.");

    const entry = await database.get(`SELECT * FROM conduit_instances WHERE code = ? LIMIT 1`, code);
    return entry || null;
}

/**
 * Checks if the specified code is still a valid entry. If yes, updates the pubkey for
 * said code and returns true. Else, returns false.
 */
export async function potentiallyUpdate(code: string, pubkey: string): Promise<boolean> {
    if (!database) throw new Error("Database not loaded yet.");

    // Check if it already existed.
    const existed = await database.get(`SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?`, code);
    if (existed.count === 0) return false;

    await database.run(`UPDATE conduit_instances SET public_key = ? WHERE code = ?`, pubkey, code);
    return true;
}

/**
 * Registers or updates the stored push notification token for the specified device ID on the
 * specified platform.
 */
export async function registerOrUpdateDeviceNotifications(deviceUUID: string, devicePlatform: NotificationPlatform, pnToken: string | null) {
    const existed = await database.get(`SELECT COUNT(*) as count FROM mobile_devices WHERE uuid = ?`, deviceUUID);

    if (existed.count > 0) {
        // update if existed
        await database.run(`UPDATE mobile_devices SET platform = ?, token = ? WHERE uuid = ?`, devicePlatform, pnToken, deviceUUID);
    } else {
        // insert
        await database.run(`INSERT INTO mobile_devices(uuid, platform, token) VALUES (?, ?, ?)`, deviceUUID, devicePlatform, pnToken);
    }
}

/**
 * If not already subscribed, will subscribe the specified device UUID to notifications of
 * type `type` originating from computer `code`. It is assumed that the caller already checked
 * whether or not the device has appropriate permissions to request this subscription.
 */
export async function subscribeDeviceNotifications(deviceUUID: string, code: string, type: NotificationType) {
    const deviceId = await database.get(`SELECT id FROM mobile_devices WHERE uuid = ?`, deviceUUID);
    if (!deviceId.id) return;

    const existed = await database.get(`SELECT COUNT(*) as count FROM device_notification_subscriptions WHERE device_id = ? AND conduit_code = ? AND type = ?`, deviceId.id, code, type);
    if (existed.count > 0) return;

    await database.run(`INSERT INTO device_notification_subscriptions(device_id, conduit_code, type) VALUES (?, ?, ?)`, deviceId.id, code, type);
}

/**
 * Unsubscribes the specified device UUID from notifications of the specified type for the
 * specified device code. Does nothing if the device was not subscribed to those notifications.
 */
export async function unsubscribeDeviceNotifications(deviceUUID: string, code: string, type: NotificationType) {
    const deviceId = await database.get(`SELECT id FROM mobile_devices WHERE uuid = ?`, deviceUUID);
    if (!deviceId.id) return;

    await database.run(`DELETE FROM device_notification_subscriptions WHERE device_id = ? AND conduit_code = ? AND type = ?`, deviceId.id, code, type);
}

/**
 * Queries the notification tokens for all devices subscribed to notifications of the specified
 * type for the specified conduit code and returns a list of those alongside the platform of the device.
 */
export async function getSubscribedDeviceTokens(code: string, type: NotificationType): Promise<{ token: string, platform: NotificationPlatform }[]> {
    return database.all(`
        SELECT token, platform
        FROM device_notification_subscriptions
        INNER JOIN mobile_devices
        ON mobile_devices.id = device_notification_subscriptions.device_id
        WHERE conduit_code = ? AND type = ?
    `, code, type);
}