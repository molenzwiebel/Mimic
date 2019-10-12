import { observable } from "mobx";
import RiftSocket, { MobileOpcode } from "./rift-socket";

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

    socket: RiftSocket;

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
            console.error(msg.data + " was not valid JSON, ignoring.");
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

            // Populate registered listeners.
            this.observers.forEach(x => {
                this.socket.send(JSON.stringify([MobileOpcode.SUBSCRIBE, x.matcher]));
                this.request(x.matcher).then(x.handler);
            });
        }
    };

    /**
     * Automatically (re)connects to the websocket.
     */
    public connect(hostname: string) {
        this.connecting = true;

        try {
            this.socket = new RiftSocket("498477");

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
}

const instance = observable(new Socket());
export default instance;
