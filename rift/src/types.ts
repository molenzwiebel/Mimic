
declare module "http" {
    class IncomingMessage {
        code: string;
    }

    // ws refers to this interface but newer node functions don't have it.
    interface OutgoingHttpHeaders {}
}

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
}