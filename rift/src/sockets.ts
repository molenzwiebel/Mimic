import { Server as WebSocketServer, VerifyClientCallbackAsync } from "ws";
import WebSocket = require("ws");
import * as url from "url";
import * as jwt from "jsonwebtoken";
import * as db from "./database";
import * as uuid from "uuid";
import { Socket } from "net";
import { IncomingMessage } from "http";
import { RiftOpcode } from "./types";

/**
 * Represents a single mobile connection to a specific Conduit instance. The
 * UUID identifies the request within Conduit so it can differentiate between
 * different clients connected at the same time.
 */
interface MobileConnection {
    uuid: string;
    socket: WebSocket;
}

/**
 * Wrapper class that manages the two websocket servers for mobile and conduit clients.
 */
export default class WebSocketManager {
    private mobileServer: WebSocketServer;
    private conduitServer: WebSocketServer;

    private conduitConnections = new Map<string, WebSocket>();
    private conduitToMobileMap = new Map<WebSocket, MobileConnection[]>();
    private mobileToConduitMap = new Map<WebSocket, MobileConnection>();

    constructor() {
        this.mobileServer = new WebSocketServer({ noServer: true });
        this.mobileServer.on("connection", this.handleMobileConnection);

        this.conduitServer = new WebSocketServer({
            noServer: true,
            verifyClient: this.verifyConduitClient
        });
        this.conduitServer.on("connection", this.handleConduitConnection);
    }

    /**
     * Handles a on("upgrade") from a HTTP(s) server to select which websocket
     * server should handle the specified request. If an invalid path is given,
     * the socket is just terminated.
     */
    public handleUpgradeRequest = async (request: IncomingMessage, socket: Socket, head: Buffer) => {
        if (!request.url) return socket.destroy();
        const pathname = url.parse(request.url).pathname;

        if (pathname === "/conduit") {
            this.conduitServer.handleUpgrade(request, socket, head, ws => {
                this.conduitServer.emit('connection', ws, request);
            });
        } else if (pathname === "/mobile") {
            this.mobileServer.handleUpgrade(request, socket, head, ws => {
                this.mobileServer.emit('connection', ws, request);
            });
        } else {
            console.log("[-] Received upgrade request for invalid URL: " + request.url);
            socket.destroy();
        }
    };

    /**
     * Ensures that a Conduit client connecting to us has a valid JWT
     * and a proper public key. Closes the connection if the request is invalid.
     */
    private verifyConduitClient: VerifyClientCallbackAsync = async (info, cb) => {
        try {
            // If a token or pubkey is missing, abort.
            const token = <string>info.req.headers.token;
            const pubkey = <string>info.req.headers["public-key"];
            if (!token || !pubkey) return cb(false, 401, "Unauthorized");

            // Verify given JWT token.
            const decoded = await new Promise<any>((resolve, reject) => {
                jwt.verify(token, process.env.RIFT_JWT_SECRET!, (err: Error | null, dec: any) => {
                    err ? reject(err) : resolve(dec)
                });
            });

            const isValidCode = await db.potentiallyUpdate(decoded.code, pubkey);
            if (!isValidCode) return cb(false, 401, "Unauthorized");

            // Everything is good, allow the connection.
            info.req.code = decoded.code;
            cb(true);
        } catch (e) {
            cb(false, 400, "Invalid Request");
        }
    };

    /**
     * Handles a new incoming connection to the conduit endpoint. Checks that the
     * connection is not a dupe and registers it locally. This is only called after JWT
     * validation, so we know that the code is good.
     */
    private handleConduitConnection = async (ws: WebSocket, request: IncomingMessage) => {
        const code = request.code;
        if (!code) return;
        console.log("[+] Got a new Conduit connection from " + code);

        // If there was a previous connection, close it.
        if (this.conduitConnections.has(code)) {
            this.conduitConnections.get(code)!.close();
        }

        this.conduitConnections.set(code, ws);
        this.conduitToMobileMap.set(ws, []);

        ws.on("close", () => {
            // Close all mobile sockets connected to this conduit client.
            for (const { socket } of this.conduitToMobileMap.get(ws)!) {
                socket.close();
            }

            console.log("[+] Conduit host " + code + " disconnected.");
            this.conduitConnections.delete(code);
            this.conduitToMobileMap.delete(ws);
        });

        ws.on("message", this.handleConduitMessage(ws));
    };

    /**
     * Handles a websocket message sent by a Conduit instance to Rift.
     */
    private handleConduitMessage = (ws: WebSocket) => async (msg: string) => {
        try {
            const [op, ...args] = JSON.parse(msg);

            if (op === RiftOpcode.REPLY) {
                const [peer, message] = args;
                const entry = this.conduitToMobileMap.get(ws)!.find(x => x.uuid === peer);

                // Conduit may be lagging behind and still trying to reply to an already disconnected
                // peer. Don't be too harsh and just ignore the message instead of immediately disconnecting.
                if (!entry) return;

                entry.socket.send(JSON.stringify([RiftOpcode.RECEIVE, message]));
            } else {
                // Just disconnect them.
                throw new Error("Conduit sent invalid opcode.");
            }
        } catch (e) {
            console.log("[-] Error handling conduit message: " + e.message);
            console.log(e);
            ws.close();
        }
    };

    /**
     * Handles a new incoming connection to the mobile endpoint. Only really hooks up
     * event handlers.
     */
    private handleMobileConnection = async (ws: WebSocket) => {
        console.log("[+] Got a new mobile connection.");

        // If we were connected to a conduit instance, send it a message that we closed.
        ws.on("close", () => {
            if (!this.mobileToConduitMap.has(ws)) return;

            const { uuid, socket } = this.mobileToConduitMap.get(ws)!;
            this.mobileToConduitMap.delete(ws);

            const conduitPeers = this.conduitToMobileMap.get(socket);
            if (conduitPeers && uuid) {
                conduitPeers.splice(conduitPeers.findIndex(x => x.uuid === uuid), 1);
            }

            if (socket.readyState === WebSocket.OPEN && uuid) {
                console.log("[+] Peer connected as " + uuid + " closed.");
                socket.send(JSON.stringify([RiftOpcode.CLOSE, uuid]));
            }
        });

        ws.on("message", this.handleMobileMessage(ws));
    };

    /**
     * Handles a message sent by a mobile peer to Rift.
     */
    private handleMobileMessage = (ws: WebSocket) => async (msg: string) => {
        try {
            const [op, ...args] = JSON.parse(msg);

            if (op === RiftOpcode.CONNECT) {
                // If this client is trying to connect while already connected, close.
                if (this.mobileToConduitMap.has(ws)) return ws.close();

                const [code] = args;
                const done = (result: string | null) => ws.send(JSON.stringify([RiftOpcode.CONNECT_PUBKEY, result]));

                // Look up public key, send null if it doesn't exist.
                const pubkey = await db.lookup(code);
                if (!pubkey) return done(null);

                // Look up the conduit connection, send null if conduit is not connected.
                const conduit = this.conduitConnections.get(code);
                if (!conduit) return done(null);

                // Generate a random connection ID.
                const connectionID = uuid.v4();

                let conns = this.conduitToMobileMap.get(conduit);
                if (!conns) this.conduitToMobileMap.set(conduit, conns = []);

                conns.push({ socket: ws, uuid: connectionID });
                this.mobileToConduitMap.set(ws, { socket: conduit, uuid: connectionID });
                console.log("[+] Peer connected to " + code + " as " + connectionID);

                // Send the public key to client, inform conduit of new connection.
                conduit.send(JSON.stringify([RiftOpcode.OPEN, connectionID]));
                return done(pubkey);
            } else if (op === RiftOpcode.SEND) {
                // Abort if not connected.
                const peerDetails = this.mobileToConduitMap.get(ws);
                if (!peerDetails) return ws.close();

                peerDetails.socket.send(JSON.stringify([RiftOpcode.MSG, peerDetails.uuid, args[0]]));
            } else {
                // Just disconnect them.
                throw new Error("Mobile sent invalid opcode.");
            }
        } catch (e) {
            console.log("[-] Error handling mobile message: " + e.message);
            console.log(e);
            ws.close();
        }
    };
}
