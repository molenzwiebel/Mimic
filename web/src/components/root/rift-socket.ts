import NodeRSA = require("node-rsa");

/**
 * WebSocket-esque class that handles messaging with Conduit through rift.
 */
export default class RiftSocket {
    private socket = new WebSocket("ws://127.0.0.1:51001/mobile");

    // Params from the normal websocket.
    public onopen: () => void;
    public onmessage: (msg: MessageEvent) => void;
    public onclose: () => void;
    public readyState = WebSocket.CONNECTING;

    // State for UI
    public state = RiftSocketState.CONNECTING;

    private key: CryptoKey | null = null;
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
        const iv = new Uint8Array(16);
        window.crypto.getRandomValues(iv);

        // Encrypt using AES-CBC.
        const encryptedBuffer = await window.crypto.subtle.encrypt({
            name: "AES-CBC",
            iv
        }, this.key!, stringToBuffer(contents));

        this.socket.send(JSON.stringify([
            RiftOpcode.SEND, bufferToBase64(iv.buffer) + ":" + bufferToBase64(encryptedBuffer)
        ]));
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
        if (this.onclose !== null) this.onclose();
    };

    /**
     * Takes the identity of this device, encrypts it with the specified public key
     * and sends it to the Conduit instance. Also chooses a random key.
     */
    private async sendIdentity(pubkey: string) {
        // Generate a random shared key.
        const secret = new Uint8Array(32);
        window.crypto.getRandomValues(secret);

        // Generate a WebCrypto key.
        this.key = await window.crypto.subtle.importKey("raw", secret.buffer, {
            name: "AES-CBC"
        }, false, ["encrypt", "decrypt"]);

        const rsa = new NodeRSA();
        rsa.importKey(pubkey, "pkcs8-public-pem");

        this.socket.send(JSON.stringify([RiftOpcode.SEND, [MobileOpcode.SECRET, rsa.encrypt(JSON.stringify({
            secret: bufferToBase64(secret.buffer),
            identity: "my-phone",
            device: "Mimic v2 - Testbench"
        }), "base64", "utf8")]]));
    }

    /**
     * Handles a raw message received from Conduit. Possibly decrypts the contents before passing it on
     * to the normal message handler.
     */
    private async handleMobileMessage(parts: any) {
        if (this.encrypted && this.key && typeof parts === "string") {
            const [iv, encrypted] = parts.split(":");

            // Decrypt incoming message.
            const decrypted = await window.crypto.subtle.decrypt({
                name: "AES-CBC",
                iv: stringToBuffer(atob(iv))
            }, this.key!, stringToBuffer(atob(encrypted)));

            // Convert to string and dispatch.
            const decryptedString = String.fromCharCode(...Array.from(new Uint8Array(decrypted)));

            // console.log(decryptedString);

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
                this.state = RiftSocketState.DISCONNECTED;
                this.key = null;

                // Notify the wrapper.
                if (this.onclose !== null) this.onclose();
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

    return arr.buffer;
}

export const enum RiftSocketState {
    // Connecting to Hub socket/requesting public key
    CONNECTING,

    // Failed to get a public key for the specified key, probably invalid or offline.
    FAILED_NO_DESKTOP,

    // Performing a handshake with Conduit, user may need to accept the connection
    HANDSHAKING,

    // Succesfully connected and exchanging encrypted messages
    CONNECTED,

    // The hub socket disconnected us.
    DISCONNECTED
}

const enum RiftOpcode {
    // Request Rift for pubkey.
    CONNECT = 4,

    // Rift either sends public key or null.
    CONNECT_PUBKEY = 5,

    // Send a message to our connected peer.
    SEND = 6,

    // Connected conduit sent a message to us.
    RECEIVE = 8
}

export const enum MobileOpcode {
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