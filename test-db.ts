
import { db, usersTable } from "./lib/db/src/index.ts";
import { initializeDb } from "./lib/db/src/index.ts";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    console.log("Initializing DB...");
    const timeout = setTimeout(() => {
        console.error("DB initialization timed out after 10s!");
        process.exit(1);
    }, 10000);
    await initializeDb();
    clearTimeout(timeout);
    console.log("DB Initialized.");
    const users = await db.select().from(usersTable);
    console.log("Users:", users);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit(0);
  }
}

test();
