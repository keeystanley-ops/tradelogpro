import { initializeDb, db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";

export default async (req: any, res: any) => {
  await initializeDb();
  
  // Safe Migration: Ensure all newer columns exist
  try {
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS ticket_id TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS quantity NUMERIC(20,8)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS net_pnl NUMERIC(20,4) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0`);
    console.log("[Vercel-Entry] DB Columns verified.");
  } catch (err) {
    console.warn("[Vercel-Entry] Migration warning:", err);
  }

  return (app as any)(req, res);
};
