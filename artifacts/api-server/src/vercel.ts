import { initializeDb, db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";

let migrationPromise: Promise<void> | null = null;

async function ensureSchema() {
  console.log("[Vercel-Entry] Starting Database Sync...");
  
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

    // 2. Batch Add Columns to prevent timeout
    // Users columns
    const userCols = ["display_name", "created_at", "updated_at"];
    for (const col of userCols) {
      try {
        const type = col === "display_name" ? "TEXT" : "TIMESTAMPTZ DEFAULT NOW()";
        await db.execute(sql.raw(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {}
    }

    // Settings columns
    const settingsCols = [
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
    
    for (const [col, type] of settingsCols) {
      try {
         await db.execute(sql.raw(`ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {}
    }

    // Trade columns (The most critical ones)
    const tradeCols = [
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
      ["entry_price", "NUMERIC(20,4) DEFAULT 0"],
      ["exit_price", "NUMERIC(20,4)"],
      ["quantity", "NUMERIC(20,8) DEFAULT 0"],
      ["market_session", "TEXT"],
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

    for (const [col, type] of tradeCols) {
      try {
        await db.execute(sql.raw(`ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS ${col} ${type}`));
      } catch (e) {}
    }
    
    console.log("[Vercel-Entry] Essential DB Sync Completed.");
  } catch (err) {
    console.error("[Vercel-Entry] Sync Error (non-fatal):", err);
  }
}

export default async (req: any, res: any) => {
  try {
    console.log("[Vercel-Entry] Initializing request...");
    await initializeDb();
    
    if (!migrationPromise) {
      migrationPromise = ensureSchema();
    }
    await migrationPromise;

    console.log("[Vercel-Entry] DB Initialized and Synced. Processing with app...");
    return (app as any)(req, res);
  } catch (err: any) {
    console.error("[Vercel-Entry] CRITICAL ERROR DETAILS:", {
      message: err.message,
      stack: err.stack,
      env: {
        HAS_DB_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    });

    return res.status(500).json({ 
      error: "Vercel Entry Initialization Failed", 
      message: err.message,
      diagnostics: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        hasGithubModelsKey: !!process.env.GITHUB_MODELS_API_KEY,
        nodeVersion: process.version
      },
      hint: "If you see 'hasDbUrl: false', you must add DATABASE_URL to your Vercel Environment Variables."
    });
  }
};
