import * as express from "express";
import * as bodyParser from "body-parser";
import * as jwt from "jsonwebtoken";
import * as cors from "cors";

import * as db from "./database";

// Create a new express app using CORS and JSON bodies.
const app = express();
app.use(cors());
app.use(bodyParser.json());

// GET /. Just return some default text.
app.get("/", (req, res) => {
    res.send("Hai, rifto desu.");
});

// POST /register. Receive a code for the specified public key.
app.post("/register", async (req, res) => {
    // Check that they provided a public key.
    if (typeof req.body.pubkey !== "string") {
        return res.status(400).json({
            ok: false,
            error: "Missing public key."
        });
    }

    // Generate a new unique code.
    const code = await db.generateCode(req.body.pubkey);
    console.log("[+] New Conduit registered. Code: " + code);

    // Sign a JWT and return it.
    res.json({
        ok: true,
        token: jwt.sign({
            code
        }, process.env.RIFT_JWT_SECRET)
    });
});

export default app;