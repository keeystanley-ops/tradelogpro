
import { db, initializeDb } from "./lib/db/src/index";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    await initializeDb();
    const tables = ['users', 'user_settings', 'trades'];
    for (const table of tables) {
      const res = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `);
      console.log(`Table ${table} columns:`);
      console.log(JSON.stringify(res, null, 2));
    }
  } catch (err) {
    console.error("Failed to check schema:", err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
