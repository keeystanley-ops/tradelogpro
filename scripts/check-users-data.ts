
import { db, initializeDb, usersTable, userSettingsTable } from "./lib/db/src/index";
import { sql } from "drizzle-orm";

async function checkUsers() {
  try {
    await initializeDb();
    console.log("Fetching users...");
    const users = await db.select().from(usersTable);
    console.log("Users:", JSON.stringify(users, null, 2));

    console.log("Fetching user settings...");
    const settings = await db.select().from(userSettingsTable);
    console.log("Settings:", JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Failed to check users:", err);
  } finally {
    process.exit(0);
  }
}

checkUsers();
