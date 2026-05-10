
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import pg from "pg";
const { Pool } = pg;

async function check() {
  console.log("Starting check...");
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log("Connecting to remote DB...");
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'trades'
      `);
      console.log("Trades table columns:");
      console.table(res.rows);
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    console.log("No DATABASE_URL found.");
  }
}

check().catch(console.error);
