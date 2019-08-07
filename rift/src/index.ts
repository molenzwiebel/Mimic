import "dotenv/config";
import * as db from "./database";
import * as http from "http";
import app from "./web";
import WebSocketManager from "./sockets";

const PORT = process.env.PORT || 51001;

(async() => {
    if (!process.env.RIFT_JWT_SECRET) {
        console.error("[-] No JWT secret found. Ensure the RIFT_JWT_SECRET environment variable is set.");
        return;
    }

    console.log("[+] Starting rift...");
    await db.create();

    const server = http.createServer(app);

    const sockets = new WebSocketManager();
    server.on("upgrade", sockets.handleUpgradeRequest);

    app.on("notificationResponse", (data: any) => {
        sockets.handleNotificationResponse(data);
    });

    console.log("[+] Listening on 0.0.0.0:" + PORT + "... ^C to exit.");
    server.listen(PORT);
})();