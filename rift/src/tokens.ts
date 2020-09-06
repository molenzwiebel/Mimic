import * as jwt from "jsonwebtoken";
import { NotificationType } from "./types";

const SECRET: string = process.env.RIFT_JWT_SECRET!;

/**
 * Creates a new JWT for the specified conduit code that can be
 * used by Conduit to identify itself for connections and push
 * notification sending.
 */
export function createConnectionToken(code: string): string {
    return jwt.sign({
        type: "connect",
        code
    }, SECRET);
}

/**
 * Creates a new JWT for the specified conduit code that can be used
 * by a device to subscribe to push notifications for that host.
 */
export function createPushNotificationToken(code: string): string {
    return jwt.sign({
        type: "notification",
        code
    }, SECRET);
}

/**
 * Creates a new JWT for the specified conduit code that can be used
 * by a device to emit an instant response for that host and the specified
 * notification type.
 */
export function createInstantResponseToken(code: string, notificationType: NotificationType): string {
    return jwt.sign({
        type: "instant_response",
        notificationType,
        code
    }, SECRET);
}

/**
 * Verifies the specified jwt and ensures it is a connect-type code that
 * allows access to a Conduit instance. Returns the code of the Conduit
 * instance if valid, or null otherwise.
 */
export async function verifyConnectionToken(token: string): Promise<string | null> {
    const decoded = await new Promise<any | null>(resolve => {
        jwt.verify(token, SECRET, (err: Error | null, dec: any) => {
            err ? resolve(null) : resolve(dec);
        });
    });

    if (!decoded || decoded.type !== "connect" || typeof decoded.code !== "string") return null;

    return decoded.code;
}

/**
 * Verifies the specified jwt and ensures it is a push notification-type code that
 * allows subscribing to push notifications. Returns the code of the conduit instance
 * if valid, or null otherwise.
 */
export async function verifyPushNotificationToken(token: string): Promise<string | null> {
    const decoded = await new Promise<any | null>(resolve => {
        jwt.verify(token, SECRET, (err: Error | null, dec: any) => {
            err ? resolve(null) : resolve(dec);
        });
    });

    if (!decoded || decoded.type !== "notification" || typeof decoded.code !== "string") return null;

    return decoded.code;
}

/**
 * Verifies the specified jwt and ensures it is an instant response-type code that
 * Returns the code of the conduit instance and the type of the notification this
 * code responds to if valid, or null otherwise.
 */
export async function verifyInstantResponseToken(token: string): Promise<{ code: string, type: NotificationType } | null> {
    const decoded = await new Promise<any | null>(resolve => {
        jwt.verify(token, SECRET, (err: Error | null, dec: any) => {
            err ? resolve(null) : resolve(dec);
        });
    });

    if (
        !decoded
        || decoded.type !== "instant_response"
        || typeof decoded.code !== "string"
        || typeof decoded.notificationType !== "string"
    ) return null;

    return {
        code: decoded.code,
        type: decoded.notificationType
    };
}