import { Database } from "basie";
import { Instance } from "./database";
import express = require("express");
import bodyParser = require("body-parser");

// Returns the external IP of the request, or null if it is missing or invalid
function getExternalIP(req: express.Request): string | null {
    const val = req.header("X-Real-IP");
    if (!val) return null;
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(val)) return null;
    return val;
}

(async () => {
    console.log("[*] Preparing database...");
    await Database.connect("rift.db");
    await Instance.createTable();
    console.log("[+] Database ready.");

    console.log("[*] Creating web front...");
    const app = express();
    app.use(bodyParser.json());

    app.post("/update", async (req, res) => {
        // Reject invalid payloads.
        if (!req.body || typeof req.body.internal !== "string") return res.status(400).end();

        const external = getExternalIP(req);
        if (!external) return res.status(400).end();

        // Save new entry. This either updates the old value, or adds a new one.
        const entry = await Instance.findBy({ externalIP: external }) || new Instance();
        entry.internalIP = req.body.internal;
        entry.externalIP = external;
        await entry.save();

        // 204 NO CONTENT
        res.status(204).end();
    });

    app.get("/lookup", async (req, res) => {
        // Reject invalid payloads.
        const external = getExternalIP(req);
        if (!external) return res.status(400).end();

        const entry = await Instance.findBy({ externalIP: external });
        res.json(entry ? entry.internalIP : null); // return null if not found
    });

    app.get("*", (_, res) => res.end("This endpoint is only used for Mimic autodiscovery. You might want the main site instead."));

    app.listen(8003);
    console.log("[+] Listening at 0.0.0.0:8003... ^C to exit.");
})();