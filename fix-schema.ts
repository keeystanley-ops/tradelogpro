
import { db, initializeDb } from "./lib/db/src/index";

import { sql } from "drizzle-orm";

async function fixSchema() {
  try {
    await initializeDb();
    console.log("Checking and fixing schema...");

    
    // Add playbook_id
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id integer`);
      console.log("Added playbook_id column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding playbook_id:", e.message);
    }

    // Add followed_rules
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS followed_rules boolean DEFAULT false`);
      console.log("Added followed_rules column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding followed_rules:", e.message);
    }

    // Add mistakes
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistakes jsonb DEFAULT '[]'::jsonb`);
      console.log("Added mistakes column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding mistakes:", e.message);
    }

    // Add emotions
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotions jsonb DEFAULT '[]'::jsonb`);
      console.log("Added emotions column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding emotions:", e.message);
    }

    // Add grade
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS grade text`);
      console.log("Added grade column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding grade:", e.message);
    }

    // Add rating if missing
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS rating integer`);
      console.log("Added rating column (if it didn't exist)");
    } catch (e: any) {
      console.log("Error adding rating:", e.message);
    }

    console.log("Schema fix attempt complete.");
  } catch (err) {
    console.error("Failed to fix schema:", err);
  } finally {
    process.exit(0);
  }
}

fixSchema();
