import { initializeDb, db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";

export default async (req: any, res: any) => {
  await initializeDb();
  
  // Safe Migration: Ensure all newer columns exist
  try {
    // Structural columns
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS backtest_session_id integer`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id integer`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    
    // Trade Data columns
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS ticket_id TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS magic_number INTEGER`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker_name TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_login TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS timeframe TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS quantity NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session TEXT`);
    
    // Financial columns
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS net_pnl NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS gross_pnl NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS commissions NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS fees NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS swap NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0`);
    
    console.log("[Vercel-Entry] Full DB Sync Completed.");
  } catch (err) {
    console.warn("[Vercel-Entry] Migration warning:", err);
  }

  return (app as any)(req, res);
};
