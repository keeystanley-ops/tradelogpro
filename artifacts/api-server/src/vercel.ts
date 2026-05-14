import { initializeDb, db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";

let migrationPromise: Promise<void> | null = null;

async function ensureSchema() {
  console.log("[Vercel-Entry] Performing Exhaustive Database Migration...");
  
  try {
    // 1. Create Core Tables If Not Exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL DEFAULT 'UNKNOWN',
        direction TEXT NOT NULL DEFAULT 'LONG',
        status TEXT NOT NULL DEFAULT 'OPEN',
        entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        display_name TEXT NOT NULL DEFAULT 'Trader',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 2. Add Missing Columns to Users (Metadata)
    const userColumns = [
      ["display_name", "TEXT"],
      ["created_at", "TIMESTAMPTZ DEFAULT NOW()"],
      ["updated_at", "TIMESTAMPTZ DEFAULT NOW()"]
    ];

    for (const [col, type] of userColumns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {
        console.warn(`[Vercel-Entry] Warning adding user column ${col}:`, (e as Error).message);
      }
    }

    // 3. Add Missing Columns to User Settings (Exhaustive)
    const settingsColumns = [
      ["email", "TEXT"],
      ["avatar_url", "TEXT"],
      ["timezone", "TEXT NOT NULL DEFAULT 'UTC'"],
      ["default_asset_class", "TEXT NOT NULL DEFAULT 'STOCK'"],
      ["default_currency", "TEXT NOT NULL DEFAULT 'USD'"],
      ["starting_balance", "NUMERIC(18,2) NOT NULL DEFAULT '10000'"],
      ["risk_per_trade", "NUMERIC(5,2) NOT NULL DEFAULT '1.00'"],
      ["max_daily_loss", "NUMERIC(18,2)"],
      ["max_daily_trades", "INTEGER"],
      ["theme", "TEXT NOT NULL DEFAULT 'dark'"],
      ["compact_mode", "BOOLEAN NOT NULL DEFAULT false"],
      ["show_pnl_in_percent", "BOOLEAN NOT NULL DEFAULT false"],
      ["email_notifications", "BOOLEAN NOT NULL DEFAULT true"],
      ["daily_summary", "BOOLEAN NOT NULL DEFAULT false"],
      ["weekly_report", "BOOLEAN NOT NULL DEFAULT true"],
      ["trade_alerts", "BOOLEAN NOT NULL DEFAULT true"],
      ["created_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
      ["updated_at", "TIMESTAMPTZ NOT NULL DEFAULT NOW()"]
    ];

    for (const [col, type] of settingsColumns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {
        console.warn(`[Vercel-Entry] Warning adding settings column ${col}:`, (e as Error).message);
      }
    }

    // 4. Add Missing Columns to Trades (Full Metadata)
    const tradeColumns = [
      ["is_backtest", "BOOLEAN DEFAULT FALSE"],
      ["backtest_session_id", "INTEGER"],
      ["created_at", "TIMESTAMPTZ DEFAULT NOW()"],
      ["updated_at", "TIMESTAMPTZ DEFAULT NOW()"],
      ["ticket_id", "TEXT"],
      ["magic_number", "INTEGER"],
      ["broker_name", "TEXT"],
      ["account_login", "TEXT"],
      ["timeframe", "TEXT"],
      ["take_profit", "NUMERIC(20,8)"],
      ["stop_loss", "NUMERIC(20,8)"],
      ["entry_price", "NUMERIC(20,8) DEFAULT 0"],
      ["exit_price", "NUMERIC(20,8)"],
      ["quantity", "NUMERIC(20,8) DEFAULT 0"],
      ["market_session", "TEXT"],
      ["entry_time", "TIMESTAMPTZ DEFAULT NOW()"],
      ["exit_time", "TIMESTAMPTZ"],
      ["duration_seconds", "INTEGER DEFAULT 0"],
      ["net_pnl", "NUMERIC(20,4) DEFAULT 0"],
      ["gross_pnl", "NUMERIC(20,4) DEFAULT 0"],
      ["commissions", "NUMERIC(20,4) DEFAULT 0"],
      ["fees", "NUMERIC(20,4) DEFAULT 0"],
      ["swap", "NUMERIC(20,4) DEFAULT 0"],
      ["slippage", "NUMERIC(20,4) DEFAULT 0"],
      ["balance_before", "NUMERIC(20,2)"],
      ["balance_after", "NUMERIC(20,2)"],
      ["asset_class", "TEXT DEFAULT 'STOCK'"],
      ["import_source", "TEXT DEFAULT 'MANUAL'"],
      ["followed_rules", "BOOLEAN DEFAULT FALSE"],
      ["mistakes", "JSONB DEFAULT '[]'"],
      ["emotions", "JSONB DEFAULT '[]'"],
      ["grade", "TEXT"],
      ["notes", "TEXT"],
      ["rating", "INTEGER"],
      ["r_multiple", "NUMERIC(10,4)"]
    ];

    for (const [col, type] of tradeColumns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {
        console.warn(`[Vercel-Entry] Warning adding trade column ${col}:`, (e as Error).message);
      }
    }
    
    console.log("[Vercel-Entry] Full DB Sync Completed.");
  } catch (err) {
    console.error("[Vercel-Entry] CRITICAL Migration Error:", err);
    throw err;
  }

}

export default async (req: any, res: any) => {
  try {
    if (process.env.VERCEL && !process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL environment variable. Please add it to your Vercel project settings.");
    }
    
    console.log("[Vercel-Entry] Initializing request...");
    await initializeDb();
    
    if (!migrationPromise) {
      console.log("[Vercel-Entry] Starting schema sync...");
      migrationPromise = ensureSchema().catch((err) => {
        migrationPromise = null;
        throw err;
      });
    }
    
    await migrationPromise;
    console.log("[Vercel-Entry] Initialization successful, handing off to app.");
    return (app as any)(req, res);
  } catch (err: any) {
    console.error("[Vercel-Entry] CRITICAL ERROR:", err);
    return res.status(500).json({ 
      error: "Vercel Entry Initialization Failed", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      hint: "Ensure DATABASE_URL is correctly set in Vercel Environment Variables."
    });
  }
};
