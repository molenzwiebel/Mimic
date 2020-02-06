import { open, Database } from "sqlite";
import { NotificationPlatform, NotificationType } from "./types";
import * as fs from "fs";

let database!: Database;

/**
 * Creates or loads a new sqlite database.
 */
export async function create() {
    const existed = fs.existsSync("database.db");

    database = await open("database.db");

    if (!existed) {
        await database.exec(`
            CREATE TABLE \`conduit_instances\` (
                \`code\`	    TEXT,
                \`public_key\`	TEXT,
                PRIMARY KEY(\`code\`)
            );
        `);

        await database.exec(`
            CREATE TABLE \`push_notification_tokens\` (
                \`code\`        TEXT,
                \`deviceID\`    TEXT,
                \`platform\`    TEXT,
                \`type\`        TEXT,
                \`token\`       TEXT
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
 * Registers or updates the push notification token for the specified device+platform+
 * notification type combo within the list of registered push notification receivers of
 * the specified device. If the pnToken is null, the specific push notification type is
 * deleted instead, preventing the device from receiving those kinds of notifications.
 */
export async function updatePushNotificationToken(code: string, deviceID: string, platform: NotificationPlatform, type: NotificationType, pnToken: string | null): Promise<void> {
    if (!database) throw new Error("Database not loaded yet.");

    // Delete if token == null.
    if (!pnToken) {
        await database.run("DELETE FROM push_notification_tokens WHERE code = ? AND type = ? AND deviceId = ?", code, type, deviceID);
        return;
    }

    // First, clean the database to ensure that anyone that has a same token but different device ID is removed.
    // This could technically happen if the device ID resets but the push notification token doesn't (and prevents
    // us from delivering the same notification twice for what we think are two different devices).
    await database.run(`DELETE FROM push_notification_tokens WHERE token = ? AND deviceID != ?`, pnToken, deviceID);

    // Also delete an old token of the same type if we had one. Prevents us from having duplicates (and the
    // old token should no longer be valid anyways).
    await database.run(`DELETE FROM push_notification_tokens WHERE code = ? AND deviceID = ? AND type = ?`, code, deviceID, type);

    // Add to database.
    await database.run(`INSERT INTO push_notification_tokens (code, deviceID, platform, type, token) VALUES (?, ?, ?, ?, ?)`, code, deviceID, platform, type, pnToken);
}

/**
 * Returns a list of all registered notification tokens for the specified conduit code.
 */
export async function getRegisteredNotificationTokens(code: string, type: NotificationType): Promise<{ token: string, deviceID: string, platform: NotificationPlatform }[]> {
    return database.all(`SELECT * FROM push_notification_tokens WHERE code = ? AND type = ?`, code, type);
}