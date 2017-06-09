import { Database } from "basie";
import { Instance } from "./database";
import express = require("express");
import bodyParser = require("body-parser");

(async () => {
    console.log("[*] Preparing database...");
    await Database.connect("rift.db");
    await Instance.createTable();
    console.log("[+] Database ready.");

    console.log("[*] Creating web front...");
    const app = express();
    app.use(bodyParser.json());
    app.post("/update", (req, res) => {
        console.dir(req.body);
        res.status(500).end();
    });
    app.get("/lookup", (req, res) => {

    });
    app.get("*", (_, res) => res.end("This endpoint is only used for Mimic autodiscovery. You might want the main site instead."));
    app.listen(8003);
    console.log("[+] Listening at 0.0.0.0:8003... ^C to exit.");
})();