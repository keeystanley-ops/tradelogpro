
import { db, initializeDb } from "./lib/db/src/index";
import { sql } from "drizzle-orm";

async function fix() {
  try {
    await initializeDb();
    console.log("Adding missing columns to trades table...");
    
    const columns = [
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id integer",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS asset_class text DEFAULT 'STOCK'",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time timestamp with time zone",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time timestamp with time zone",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS net_pnl numeric(20,4) DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS gross_pnl numeric(20,4) DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS commissions numeric(20,4) DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS fees numeric(20,4) DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS slippage numeric(20,4) DEFAULT 0",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss numeric(20,8)",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit numeric(20,8)",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple numeric(10,4)",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS import_source text DEFAULT 'MANUAL'",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS followed_rules boolean DEFAULT false",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistakes jsonb DEFAULT '[]'::jsonb",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotions jsonb DEFAULT '[]'::jsonb",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS grade text",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest boolean DEFAULT false",
      "ALTER TABLE trades ADD COLUMN IF NOT EXISTS backtest_session_id integer",
    ];

    for (const col of columns) {
      try {
        await db.execute(sql.raw(col));
        console.log(`Success: ${col}`);
      } catch (e: any) {
        console.log(`Skipped/Error: ${col} - ${e.message}`);
      }
    }

    // Migration: Copy entry_date to entry_time if entry_time is null
    try {
        await db.execute(sql`UPDATE trades SET entry_time = entry_date WHERE entry_time IS NULL AND entry_date IS NOT NULL`);
        await db.execute(sql`UPDATE trades SET exit_time = exit_date WHERE exit_time IS NULL AND exit_date IS NOT NULL`);
        console.log("Migrated dates to times");
    } catch (e: any) {
        console.log("Date migration error:", e.message);
    }

    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
