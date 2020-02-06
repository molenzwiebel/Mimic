
declare module "http" {
    class IncomingMessage {
        code: string;
    }

    // ws refers to this interface but newer node functions don't have it.
    interface OutgoingHttpHeaders {}
}

/**
 * Represents a type of push notification that can be sent by Rift.
 */
export const enum NotificationType {
    // Every client subscribes to this. Clears all received notifications.
    CLEAR = "CLEAR",

    // Sent when ready check triggers.
    READY_CHECK = "READY_CHECK",

    // Sent when the game has (almost) started.
    GAME_STARTED = "GAME_STARTED"
}

export const NOTIFICATION_TYPES = [
    NotificationType.CLEAR,
    NotificationType.READY_CHECK,
    NotificationType.GAME_STARTED
];

/**
 * Represents a platform that can receive push notifications.
 */
export const enum NotificationPlatform {
    IOS = "ios",
    ANDROID = "android",
    WEB = "web"
}

export const NOTIFICATION_PLATFORMS = [
    NotificationPlatform.IOS,
    NotificationPlatform.ANDROID,
    NotificationPlatform.WEB
];

/**
 * Represents an opcode sent/received by Rift. These are the first element
 * of arrays.
 */
export const enum RiftOpcode {
    // A new Mobile -> Conduit connection was established.
    OPEN = 1,

    // A message from the specified mobile connection was sent.
    MSG = 2,

    // A previous mobile <-> conduit connection was closed.
    CLOSE = 3,

    // Request Rift for pubkey.
    CONNECT = 4,

    // Rift either sends public key or null.
    CONNECT_PUBKEY = 5,

    // Mobile sends a connection to the connected Conduit instance.
    SEND = 6,

    // Send a message from Conduit to the specified mobile peer.
    REPLY = 7,

    // Mobile receives a message from the connected Conduit instance.
    RECEIVE = 8,

    // Conduit subscribes on behalf of web to push notifications.
    PN_SUBSCRIBE = 9,

    // Conduit sends a push notification to all subscribed devices.
    PN_SEND = 10,

    // Conduit receives an instant response to an emitted push notification.
    PN_RESPONSE = 11
}