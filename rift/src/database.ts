import { open, Database } from "sqlite";
import * as fs from "fs";

let database!: Database;

/**
 * Creates or loads a new sqlite database.
 */
export async function create() {
    const existed = fs.existsSync("database.db");

    database = await open("database.db");

    if (!existed) {
        await database.exec(`
            CREATE TABLE \`conduit_instances\` (
                \`code\`	    TEXT,
                \`public_key\`	TEXT,
                PRIMARY KEY(\`code\`)
            );
        `);
    }
}

/**
 * Generates a new unique code for the specified public key and returns that key.
 * Either inserts the public key in the database, or returns the existing code
 * if it already existed.
 */
export async function generateCode(pubkey: string): Promise<string> {
    if (!database) throw new Error("Database not loaded yet.");

    let code: string;
    while (true) {
        // Generate a random 6 digit number as code.
        code = (Math.floor(Math.random() * 900000) + 100000).toString();

        // Check if it already existed.
        const existed = await database.get(`SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?`, code);

        // Break if unique, else loop again.
        if (existed.count === 0) break;
    }

    await database.run(`INSERT INTO conduit_instances VALUES (?, ?)`, code, pubkey);
    return code;
}

/**
 * Looks up the public key belonging to the specified code. Returns either the
 * key, or null if not found.
 */
export async function lookup(code: string): Promise<{ public_key: string, code: string } | null> {
    if (!database) throw new Error("Database not loaded yet.");

    const entry = await database.get(`SELECT * FROM conduit_instances WHERE code = ? LIMIT 1`, code);
    return entry || null;
}

/**
 * Checks if the specified code is still a valid entry. If yes, updates the pubkey for
 * said code and returns true. Else, returns false.
 */
export async function potentiallyUpdate(code: string, pubkey: string): Promise<boolean> {
    if (!database) throw new Error("Database not loaded yet.");

    // Check if it already existed.
    const existed = await database.get(`SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?`, code);
    if (existed.count === 0) return false;

    await database.run(`UPDATE conduit_instances SET public_key = ? WHERE code = ?`, pubkey, code);
    return true;
}