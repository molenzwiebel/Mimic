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
        }, process.env.RIFT_JWT_SECRET!)
    });
});

// GET /check?token=jY... Checks if a specified JWT is valid.
app.get("/check", async (req, res) => {
    if (typeof req.query.token !== "string") {
        return res.status(400).json({
            ok: false,
            error: "Missing a token to check."
        });
    }

    jwt.verify(req.query.token, process.env.RIFT_JWT_SECRET!, async (err: Error | null, obj: any) => {
        // If the token could not be decoded, or if it doesn't contain a code field, return false.
        if (err) return res.json(false);
        if (!obj || typeof obj.code !== "string") return res.json(false);

        // Return whether or not the code exists in our database.
        res.json(!!await db.lookup(obj.code));
    });
});

// POST /respond?token=jY..&response=X Deliver an instant response for a notification
app.post("/respond", async (req, res) => {
    if (typeof req.query.token !== "string" || typeof req.query.response !== "string") {
        return res.status(400).json({
            ok: false,
            error: "Missing token or response."
        });
    }

    jwt.verify(req.query.token, process.env.RIFT_JWT_SECRET!, async (err: Error | null, obj: any) => {
        // If the token could not be decoded, or if it doesn't contain a code field, return false.
        if (err || !obj || typeof obj.code !== "string") return res.status(400).json({
            ok: false,
            error: "Invalid token supplied."
        });

        console.log("[+] Got response " + req.query.response + " for computer " + obj.code);

        // Emit this so it can be picked up by the socket end.
        app.emit("notificationResponse", {
            code: obj.code,
            type: obj.type,
            response: req.query.response
        });
    });
});

export default app;
