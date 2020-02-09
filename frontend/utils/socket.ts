import { computed, observable } from "mobx";
import Constants from "expo-constants";
import RiftSocket, { MobileOpcode, RiftSocketState } from "./rift-socket";
import { withComputerConfig } from "./persistence";
import { NotificationPlatform, NotificationType, updateNotificationTokens } from "./notifications";

// Represents a result from the LCU api.
export interface Result {
    // Status code of the API call.
    status: number;
    // Parsed JSON of the response body.
    content: any;
}

// Type 1: an observed path changed. Format: [1, path_that_changed, new_status, new_content]
// Type 2: a request was completed. Format: [2, request_id, status, response]
// Type 3: a response to an info request. Format: [3, conduit_version, machine_name]
type WebsocketMessage = [1, string, number, any] | [2, number, number, any] | [3, string, string];

/**
 * Class that handles communication between Mimic and the League client.
 */
class Socket {
    @observable
    connected = false;

    @observable
    connecting = false;

    @observable
    socket: RiftSocket;

    @observable
    computerName = "";

    @observable
    computerVersion = "";

    code = "";

    idCounter = 0;
    observers: { matcher: string; handler: (res: Result) => void }[] = [];
    requests: { [key: number]: Function } = {};

    /**
     * Starts observing the specified url. The handler will be called
     * whenever the endpoints contents or HTTP status change. Only a single
     * instance can observe the same path at a time.
     */
    observe(path: string, handler: (result: Result) => void) {
        if (this.connected) {
            // Make initial request to populate the handler.
            this.request(path).then(handler);

            this.socket.send(JSON.stringify([MobileOpcode.SUBSCRIBE, path])); // ask to observe the specified path.
        }

        this.observers.push({ matcher: path, handler });
    }

    /**
     * Stop observing the specified path. Does nothing if the path
     * isn't currently being observed.
     */
    unobserve(path: string) {
        this.observers = this.observers.filter(x => {
            if (x.matcher !== path) return true;

            if (this.socket.readyState === WebSocket.OPEN) {
                // ask to stop observing
                this.socket.send(JSON.stringify([MobileOpcode.UNSUBSCRIBE, path]));
            }

            return false;
        });
    }

    /**
     * Makes a request to the specified LCU endpoint with the specified
     * method and optional body. Returns a promise that resolves when the call
     * completes. Note that this promise will never be rejected, even for non-200
     * responses.
     */
    request(path: string, method: string = "GET", body?: string): Promise<Result> {
        if (!this.connected) throw new Error("Not connected.");

        return new Promise(resolve => {
            const id = this.idCounter++;
            this.socket.send(JSON.stringify([MobileOpcode.REQUEST, id, path, method, body]));
            this.requests[id] = resolve;
        });
    }

    /**
     * Handles any incoming messages from the websocket connection and notifies
     * listeners/resolves promises when applicable.
     */
    handleWebsocketMessage = (msg: MessageEvent) => {
        let data: WebsocketMessage;
        try {
            data = JSON.parse(msg.data);
        } catch {
            // Not using error here, as it causes a big red screen.
            console.log(msg.data + " was not valid JSON, ignoring.");
            return;
        }

        if (data[0] === MobileOpcode.UPDATE) {
            this.observers
                .filter(x => data[1] === x.matcher)
                .forEach(x => x.handler({ status: +data[2], content: data[3] }));
        }

        if (data[0] === MobileOpcode.RESPONSE && this.requests[data[1] as number]) {
            this.requests[data[1] as number]({
                status: data[2],
                content: data[3]
            });
            delete this.requests[data[1] as number];
        }

        if (data[0] === MobileOpcode.VERSION_RESPONSE) {
            console.log("Connected to " + data[2]);
            this.computerName = data[2] as string;
            this.computerVersion = data[1] as string;

            // Save latest computer name to config.
            withComputerConfig(config => {
                config.name = this.computerName;
            }).then(updateNotificationTokens);

            // Populate registered listeners.
            this.observers.forEach(x => {
                this.socket.send(JSON.stringify([MobileOpcode.SUBSCRIBE, x.matcher]));
                this.request(x.matcher).then(x.handler);
            });
        }
    };

    /**
     * Tries to do another connection attempt with the last used code.
     */
    public tryReconnect() {
        this.connect(this.code);
    }

    /**
     * Registers with Rift this device with the specified push notification token
     * for the specified notification type. Passing null will unregister from those
     * notification types instead.
     */
    public registerPushNotificationToken(type: NotificationType, token: string | null) {
        const platform = Constants.platform!.ios
            ? NotificationPlatform.IOS
            : Constants.platform!.android
            ? NotificationPlatform.ANDROID
            : NotificationPlatform.WEB;
        this.socket.send(JSON.stringify([MobileOpcode.PN_SUBSCRIBE, Constants.installationId, platform, type, token]));
    }

    /**
     * Closes the current socket, regardless of current connection state.
     */
    public close() {
        if (this.socket) {
            this.socket.onopen = <any>null;
            this.socket.onmessage = <any>null;
            this.socket.onclose = <any>null;
            this.socket.close();
            this.socket = <any>null;
            this.connecting = false;
            this.connected = false;
        }
    }

    /**
     * Automatically (re)connects to the websocket.
     */
    public connect(code: string) {
        this.connecting = true;
        this.code = code;

        try {
            this.socket = new RiftSocket(code);

            this.socket.onopen = () => {
                this.connected = true;
                this.connecting = false;
                this.socket.send("[" + MobileOpcode.VERSION + "]");
            };

            this.socket.onmessage = this.handleWebsocketMessage;

            this.socket.onclose = ev => {
                if (this.connecting) {
                    console.log("Closed unexpectedly (" + ev.reason + ")");
                    return;
                }

                this.connected = false;
                console.log("Connection to host closed.");
            };
        } catch (e) {
            console.log(e.message);
        }
    }

    @computed
    get state(): null | RiftSocketState {
        if (!this.socket) return null;
        if (this.socket.state === RiftSocketState.DISCONNECTED) return null;

        return this.socket.state;
    }
}

const instance = observable(new Socket());
export default instance;
