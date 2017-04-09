import Vue from "vue";
import Component from "vue-class-component";

import Lobby = require("../lobby/lobby.vue");
import Queue = require("../queue/queue.vue");
import ReadyCheck = require("../ready-check/ready-check.vue");
import ChampSelect = require("../champ-select/champ-select.vue");
import Invites = require("../invites/invites.vue");

// Represents a result from the LCU api.
export interface Result {
    // Status code of the API call.
    status: number;
    // Parsed JSON of the response body.
    content: any;
}

// Type 1: an observed path changed. Format: [1, path_that_changed, new_status, new_content]
// Type 2: a request was completed. Format: [2, request_id, status, response]
type WebsocketMessage = [1, string, number, any] | [2, number, number, any];

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
    socket: WebSocket;

    idCounter = 0;
    observers: { matcher: RegExp, handler: (res: Result) => void }[] = [];
    requests: { [key: number]: Function } = {};
    hostname = "";

    mounted() {
        //this.connect();
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
        this.socket.send(JSON.stringify([1, path.source])); // ask to observe the specified path.
    }

    /**
     * Stop observing the specified path. Does nothing if the path
     * isn't currently being observed.
     */
    unobserve(path: RegExp | string) {
        if (typeof path === "string") path = new RegExp("^" + path + "$");

        this.observers = this.observers.filter(x => {
            if (x.matcher.toString() !== path.toString()) return true;

            if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify([2, (path as RegExp).source])); // ask to stop observing
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
            this.socket.send(JSON.stringify([3, id, path, method, body]));
            this.requests[id] = resolve;
        });
    }

    /**
     * Handles any incoming messages from the websocket connection and notifies
     * listeners/resolves promises when applicable.
     */
    handleWebsocketMessage = (msg: MessageEvent) => {
        const data: WebsocketMessage = JSON.parse(msg.data);

        if (data[0] === 1) {
            this.observers
                .filter(x => !!x.matcher.exec(data[1] as string))
                .forEach(x => x.handler({ status: data[2], content: data[3] }));
        }

        if (data[0] === 2 && this.requests[data[1] as number]) {
            this.requests[data[1] as number]({ status: data[2], content: data[3] });
            delete this.requests[data[1] as number];
        }
    };

    /**
     * Automatically (re)connects to the websocket.
     */
    private connect() {
        this.socket = new WebSocket("ws://" + this.hostname + ":8182/league");

        this.socket.onopen = () => {
            this.connected = true;
        };

        this.socket.onmessage = this.handleWebsocketMessage;

        this.socket.onclose = () => {
            this.connected = false;
            /*setTimeout(() => {
                this.connect();
            }, 1000);*/
        };
    }
}