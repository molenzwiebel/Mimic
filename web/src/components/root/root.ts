import Vue from "vue";
import Component from "vue-class-component";

import Lobby from "../lobby/lobby.vue";
import Queue from "../queue/queue.vue";
import ReadyCheck from "../ready-check/ready-check.vue";
import ChampSelect from "../champ-select/champ-select.vue";
import Invites from "../invites/invites.vue";
import Version from "../../util/version";
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

@Component({
    components: {
        lobby: Lobby,
        queue: Queue,
        readyCheck: ReadyCheck,
        champSelect: ChampSelect,
        invites: Invites
    }
})
export default class Root extends Vue {
    connected = false;
    socket: RiftSocket | null = null;
    peerVersion: Version = <any>null; // null is required to allow vue to observe
    notifications: string[] = [];

    connecting = false;
    conduitID = (localStorage && localStorage.getItem("conduitID")) || "";

    idCounter = 0;
    observers: { matcher: RegExp, handler: (res: Result) => void }[] = [];
    requests: { [key: number]: Function } = {};

    /**
     * @returns the most recent notification, if there is one
     */
    get notification() {
        return this.notifications[0];
    }

    /**
     * Starts observing the specified url. The handler will be called
     * whenever the endpoints contents or HTTP status change. Only a single
     * instance can observe the same path at a time.
     */
    observe(path: RegExp | string, handler: (result: Result) => void) {
        if (typeof path === "string") {
            // Make initial request to populate the handler.
            this.request(path).then(handler);

            path = new RegExp("^" + path + "$");
        }

        this.observers.push({ matcher: path, handler });
        this.socket!.send(JSON.stringify([MobileOpcode.SUBSCRIBE, path.source])); // ask to observe the specified path.
    }

    /**
     * Stop observing the specified path. Does nothing if the path
     * isn't currently being observed.
     */
    unobserve(path: RegExp | string) {
        if (typeof path === "string") path = new RegExp("^" + path + "$");

        this.observers = this.observers.filter(x => {
            if (x.matcher.toString() !== path.toString()) return true;

            if (this.socket!.readyState === WebSocket.OPEN) this.socket!.send(JSON.stringify([MobileOpcode.UNSUBSCRIBE, (path as RegExp).source])); // ask to stop observing
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
        return new Promise(resolve => {
            const id = this.idCounter++;
            this.socket!.send(JSON.stringify([MobileOpcode.REQUEST, id, path, method, body]));
            this.requests[id] = resolve;
        });
    }

    /**
     * Handles any incoming messages from the websocket connection and notifies
     * listeners/resolves promises when applicable.
     */
    handleWebsocketMessage = (msg: MessageEvent) => {
        const data: WebsocketMessage = JSON.parse(msg.data);

        if (data[0] === MobileOpcode.UPDATE) {
            this.observers
                .filter(x => !!x.matcher.exec(data[1] as string))
                .forEach(x => x.handler({ status: +data[2], content: data[3] }));
        }

        if (data[0] === MobileOpcode.RESPONSE && this.requests[data[1] as number]) {
            this.requests[data[1] as number]({ status: data[2], content: data[3] });
            delete this.requests[data[1] as number];
        }

        if (data[0] === MobileOpcode.VERSION_RESPONSE) {
            this.showNotification("Connected to " + data[2]);
            this.setPeerVersion(<string>data[1]);
        }
    };

    /**
     * Weirdly enough, setting this directly in handleWebsocketManage makes vue go
     * haywire. This works fine though, so we use this instead.
     */
    private setPeerVersion(version: string) {
        this.peerVersion = new Version(version);
    }

    /**
     * Automatically (re)connects to the websocket.
     */
    private connect() {
        localStorage && localStorage.setItem("conduitID", this.conduitID);
        this.connecting = true;

        try {
            this.socket = new RiftSocket(this.conduitID);

            this.socket.onopen = () => {
                this.connected = true;
                this.connecting = false;
                this.socket!.send("[" + MobileOpcode.VERSION + "]");
            };

            this.socket.onmessage = this.handleWebsocketMessage;

            this.socket.onclose = () => {
                if (this.connecting) {
                    this.showNotification("The connection closed unexpectedly. Check your connection?");
                    return;
                }

                this.connected = false;
                this.socket = null;
                this.showNotification("Connection to host closed.");
            };
        } catch (e) {
            this.showNotification("Unexpected error.");
        }
    }

    /**
     * Shows a notification that hides after a few moments.
     */
    private showNotification(content: string) {
        this.notifications.push(content);
        setTimeout(() => {
            this.notifications.splice(this.notifications.indexOf(content), 1);
        }, 8000);
    }
}