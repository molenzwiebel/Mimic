import * as aesjs from "aes-js";
import * as Random from "expo-random";
import { encode as btoa, decode as atob } from "base-64";

import "../generated/node-rsa-browserified.min";

/**
 * WebSocket-esque class that handles messaging with Conduit through rift.
 */
export default class RiftSocket {
    private socket = new WebSocket("wss://rift.mimic.lol/mobile");

    // Params from the normal websocket.
    public onopen: () => void;
    public onmessage: (msg: MessageEvent) => void;
    public onclose: (ev: CloseEvent) => void;
    public readyState = WebSocket.CONNECTING;

    // State for UI
    public state = RiftSocketState.CONNECTING;

    private key: Uint8Array | null = null;
    private encrypted = false;

    constructor(private code: string) {
        this.socket.onopen = this.handleOpen;
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
    }

    /**
     * Encrypts the specified contents and sends them to the other side.
     */
    public async send(contents: string) {
        // Generate random IV.
        const iv = await Random.getRandomBytesAsync(16);

        // Encrypt using AES-CBC.
        const aes = new aesjs.ModeOfOperation.cbc(this.key!, iv);
        const encryptedBuffer = aes.encrypt(aesjs.padding.pkcs7.pad(stringToBuffer(contents)));

        this.socket.send(
            JSON.stringify([RiftOpcode.SEND, bufferToBase64(iv.buffer) + ":" + bufferToBase64(encryptedBuffer)])
        );
    }

    /**
     * Handles a completed connection with Rift.
     */
    private handleOpen = () => {
        // Request the public key for our target.
        this.socket.send(JSON.stringify([RiftOpcode.CONNECT, this.code]));
    };

    /**
     * Handles a wrapped message sent from Rift.
     */
    private handleMessage = (msg: MessageEvent) => {
        try {
            const [op, ...data] = JSON.parse(msg.data);

            if (op === RiftOpcode.CONNECT_PUBKEY) {
                const pubkey = data[0];

                // If we don't have a public key, show an error.
                if (!pubkey) {
                    this.state = RiftSocketState.FAILED_NO_DESKTOP;
                    return;
                }

                this.state = RiftSocketState.HANDSHAKING;
                this.sendIdentity(pubkey);
            } else if (op === RiftOpcode.RECEIVE) {
                this.handleMobileMessage(data[0]);
            }
        } catch (ignored) {
            // Ignore invalid message.
        }
    };

    /**
     * Handles the closing of the socket.
     */
    private handleClose = (ev: CloseEvent) => {
        this.readyState = WebSocket.CLOSED;
        this.state = RiftSocketState.DISCONNECTED;

        // Notify the wrapper.
        if (this.onclose !== null) this.onclose(ev);
    };

    /**
     * Takes the identity of this device, encrypts it with the specified public key
     * and sends it to the Conduit instance. Also chooses a random key.
     */
    private async sendIdentity(pubkey: string) {
        // Generate a WebCrypto key.
        this.key = await Random.getRandomBytesAsync(32);

        // node-rsa is particularly big and we only need it here, so extract it into its own chunk
        // however, do prefetch it so that it'll be available as quickly as possible
        const rsa = new window.NodeRSA();
        rsa.importKey(pubkey, "pkcs8-public-pem");

        // Create our identification payload with the chosen secret and info on the device.
        const { device, browser } = { device: "Expo", browser: "Native App" };
        const identify = JSON.stringify({
            secret: bufferToBase64(this.key.buffer),
            identity: "B",
            device,
            browser
        });

        // Send the handshake to Conduit.
        this.socket.send(
            JSON.stringify([RiftOpcode.SEND, [MobileOpcode.SECRET, rsa.encrypt(identify, "base64", "utf8")]])
        );
    }

    /**
     * Handles a raw message received from Conduit. Possibly decrypts the contents before passing it on
     * to the normal message handler.
     */
    private async handleMobileMessage(parts: any) {
        if (this.encrypted && this.key && typeof parts === "string") {
            const [iv, encrypted] = parts.split(":");

            // Decrypt incoming message.
            const aes = new aesjs.ModeOfOperation.cbc(this.key!, stringToBuffer(atob(iv)));
            const decrypted = aesjs.padding.pkcs7.strip(aes.decrypt(stringToBuffer(atob(encrypted))));

            // Convert to string and dispatch.
            const decryptedString = aesjs.utils.utf8.fromBytes(decrypted);

            if (this.onmessage !== null) {
                this.onmessage(<any>{
                    data: decryptedString
                });
            }

            return;
        }

        if (Array.isArray(parts) && parts[0] === MobileOpcode.SECRET_RESPONSE) {
            const succeeded = parts[1];

            if (!succeeded) {
                this.state = RiftSocketState.FAILED_DESKTOP_DENY;
                this.key = null;

                // Notify the wrapper.
                return;
            }

            // Handshake is done, we're "open" now.
            this.encrypted = true;
            this.readyState = WebSocket.OPEN;
            this.state = RiftSocketState.CONNECTED;
            this.onopen();
        }
    }
}

// Helper to convert the specified arraybuffer to a base64 string.
function bufferToBase64(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))));
}

// Helper to convert the specified string into an ArrayBuffer.
function stringToBuffer(str: string) {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < arr.length; i++) arr[i] = str.charCodeAt(i);

    return arr;
}

export enum RiftSocketState {
    // Connecting to Hub socket/requesting public key
    CONNECTING,

    // Failed to get a public key for the specified key, probably invalid or offline.
    FAILED_NO_DESKTOP,

    // The desktop denied our connection request.
    FAILED_DESKTOP_DENY,

    // Performing a handshake with Conduit, user may need to accept the connection
    HANDSHAKING,

    // Succesfully connected and exchanging encrypted messages
    CONNECTED,

    // The hub socket disconnected us.
    DISCONNECTED
}

enum RiftOpcode {
    // Request Rift for pubkey.
    CONNECT = 4,

    // Rift either sends public key or null.
    CONNECT_PUBKEY = 5,

    // Send a message to our connected peer.
    SEND = 6,

    // Connected conduit sent a message to us.
    RECEIVE = 8
}

export enum MobileOpcode {
    // Mobile -> Conduit, sends encrypted shared secret.
    SECRET = 1,

    // Conduit <- Mobile, sends result of secret negotiation. If true, rest of communications is encrypted.
    SECRET_RESPONSE = 2,

    // Mobile -> Conduit, request version
    VERSION = 3,

    // Conduit <- Mobile, send version
    VERSION_RESPONSE = 4,

    // Mobile -> Conduit, subscribe to LCU updates that match regex
    SUBSCRIBE = 5,

    // Mobile -> Conduit, unsibscribe to LCU updates that match regex
    UNSUBSCRIBE = 6,

    // Mobile -> Conduit, make LCU request
    REQUEST = 7,

    // Conduit -> Mobile, response of a previous request message.
    RESPONSE = 8,

    // Conduit -> Mobile, when any subscribed endpoint gets an update
    UPDATE = 9
}

declare global {
    interface Window {
        // imported from browserify
        NodeRSA: any;
    }
}
