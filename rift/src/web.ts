import * as express from "express";
import * as bodyParser from "body-parser";
import * as tokens from "./tokens";
import * as cors from "cors";
import * as db from "./database";
import * as z from "zod";
import * as notifications from "./notifications";
import { NOTIFICATION_PLATFORMS, NOTIFICATION_TYPES, NotificationPlatform, NotificationType } from "./types";
import sockets from "./sockets";

// Create a new express app using CORS and JSON bodies.
const app = express();
app.use(cors());
app.use(bodyParser.json());

// GET /. Just return some default text.
app.get("/", (req, res) => {
    res.send("Hai, rifto desu.");
});

/**
 * POST /v1/conduit/register
 * Content-Type: application/json
 * 
 * {
 *   "pubkey": "pem representation of the machine's public key"
 * }
 * 
 * This endpoint will assign a new 6-digit code to the specified
 * machine, unless the public key has already been seen before, in 
 * which case it will return the previously assigned code for that
 * machine.
 */
app.post("/v1/conduit/register", async (req, res) => {
    // Check that they provided a public key.
    if (!z.object({
        pubkey: z.string()
    }).check(req.body)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    // Generate a new unique code.
    const code = await db.generateCode(req.body.pubkey);
    console.log("[+] New Conduit registered. Code: " + code);

    // Sign a JWT for the machine and return it.
    res.json({
        ok: true,
        token: tokens.createConnectionToken(code)
    });
});

/**
 * GET /v1/conduit/verify?token=jY...
 * 
 * Will ask the server to verify whether or not the specified token is
 * still a valid token for the current machine. This is used by Conduit
 * to ensure that it will retrieve a valid token before connecting. Returns
 * true if valid, false if not.
 */
app.get("/v1/conduit/verify", async (req, res) => {
    if (typeof req.query.token !== "string") {
        return res.status(400).json({
            ok: false,
            error: "Missing a token to check."
        });
    }

    const code = await tokens.verifyConnectionToken(req.query.token);
    const codeExists = code && await db.lookup(code);

    res.json(codeExists);
});

/**
 * GET /v1/conduit/status/:code
 * 
 * Returns whether or not the device with the specified code is currently
 * connected to Rift. This does not require authentication and as a result
 * only returns a yes/no answer and no further information.
 */
app.get("/v1/conduit/status/:code", async (req, res) => {
    if (typeof req.params.code !== "string") {
        return res.status(400).json({
            ok: false,
            error: "Invalid conduit code."
        });
    }

    res.json(sockets.isDeviceOnline(req.params.code));
});

/**
 * POST /v1/notifications/register
 * Content-Type: application/json
 * 
 * {
 *   "uuid": "device uuid",
 *   "platform": "ios/android/web",
 *   "token": "notification token for the specified platform or null if no permission"
 * }
 * 
 * Registers or updates the notification token for the specified device ID. Returns
 * a JSON object with ok set to true/false depending on whether the request succeeded.
 */
app.post("/v1/notifications/register", async (req, res) => {
    if (!z.object({
        uuid: z.string(),
        platform: z.string(),
        token: z.string().nullable()
    }).check(req.body) || !NOTIFICATION_PLATFORMS.includes(req.body.platform)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    console.log(`[+] Updated notification token for ${req.body.uuid} to '${req.body.token}'`);
    await db.registerOrUpdateDeviceNotifications(req.body.uuid, req.body.platform as NotificationPlatform, req.body.token);

    return res.json({
        ok: true
    });
});

/**
 * POST /v1/notifications/subscribe
 * Content-Type: application/json
 * 
 * {
 *   "uuid": "uuid of device subscribing",
 *   "token": "token received from conduit.",
 *   "type": "type of notification to subscribe to"
 * }
 * 
 * Registers a specific device UUID for receiving notifications
 * of type `type`.
 */
app.post("/v1/notifications/subscribe", async (req, res) => {
    if (!z.object({
        uuid: z.string(),
        token: z.string(),
        type: z.string()
    }).check(req.body) || !NOTIFICATION_TYPES.includes(req.body.type)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    const code = await tokens.verifyPushNotificationToken(req.body.token);
    if (!code) return res.status(403).json({
        ok: false,
        error: "Invalid token."
    });

    console.log(`[+] Device ${req.body.uuid} subscribed to ${req.body.type} notifications.`);
    await db.subscribeDeviceNotifications(req.body.uuid, code, req.body.type as NotificationType);

    return res.json({
        ok: true
    });
});

/**
 * POST /v1/notifications/unsubscribe/:code
 * Content-Type: application/json
 * 
 * {
 *   "uuid": "uuid of device subscribing",
 *   "type": "type of notification to unsubscribe from"
 * }
 * 
 * Unregisters a specific device UUID from receiving notifications
 * of type `type`.
 */
app.post("/v1/notifications/unsubscribe/:code", async (req, res) => {
    if (!z.object({
        uuid: z.string(),
        type: z.string()
    }).check(req.body) || !NOTIFICATION_TYPES.includes(req.body.type)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    console.log(`[+] Device ${req.body.uuid} unsubscribed from ${req.body.type} notifications.`);
    await db.unsubscribeDeviceNotifications(req.body.uuid, req.query.code, req.body.type as NotificationType);

    return res.json({
        ok: true
    });
});

/**
 * POST /v1/notifications/send
 * Content-Type: application/json
 * 
 * {
 *   "token": "connection token used to send notification",
 *   "type": "type of notification to send"
 * }
 * 
 * Sends a notification to all subscribed clients for the Conduit instance
 * belonging to the specified auth token.
 */
app.post("/v1/notifications/send", async (req, res) => {
    if (!z.object({
        token: z.string(),
        type: z.string()
    }).check(req.body) || !NOTIFICATION_TYPES.includes(req.body.type)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    const code = await tokens.verifyConnectionToken(req.body.token);
    if (!code) return res.status(403).json({
        ok: false,
        error: "Invalid token."
    });

    switch (req.body.type) {
    case NotificationType.READY_CHECK:
        await notifications.broadcastReadyCheckNotification(code);
        setTimeout(() => notifications.removeNotifications(code), 20 * 1000); // 20s later, clear
        break;
    case NotificationType.GAME_STARTED:
        await notifications.broadcastGameStartNotification(code);
        setTimeout(() => notifications.removeNotifications(code), 2 * 60 * 1000); // two minutes later, clear
        break;
    case NotificationType.CLEAR:
        await notifications.removeNotifications(code);
        break;
    }

    return res.json({
        ok: true
    });
});

/**
 * POST /v1/notifications/respond?token=jY...&response=X
 * 
 * Delivers an instant response for the specified response token and the
 * specified result. This will be pushed to the socket directly, without
 * the need for mobile to handshake with the websocket first.
 */
app.post("/v1/notifications/respond", async (req, res) => {
    if (!z.object({
        token: z.string(),
        response: z.string()
    }).check(req.query)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid request."
        });
    }

    const token = await tokens.verifyInstantResponseToken(req.query.token);
    if (!token) {
        return res.status(400).json({
            ok: false,
            error: "Invalid token."
        });
    }

    console.log("[+] Got response " + req.query.response + " for computer " + token.code);

    // Emit this so it can be picked up by the socket end.
    app.emit("notificationResponse", {
        code: token.code,
        type: token.type,
        response: req.query.response
    });
});

export default app;
