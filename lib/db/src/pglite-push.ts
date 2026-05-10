import type { PGlite } from "@electric-sql/pglite";

/**
 * Creates all required tables in the PGlite local database.
 * This is a simplified "push" equivalent for local dev without a PostgreSQL server.
 */
export async function pushPgSchemaToLocalDB(client: PGlite) {
  // We use simple SQL here to avoid WASM issues with complex DO blocks
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Trader',
      email TEXT,
      avatar_url TEXT,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      default_asset_class TEXT NOT NULL DEFAULT 'STOCK',
      default_currency TEXT NOT NULL DEFAULT 'USD',
      starting_balance NUMERIC(18,2) NOT NULL DEFAULT 10000.00,
      risk_per_trade NUMERIC(5,2) NOT NULL DEFAULT 1.00,
      max_daily_loss NUMERIC(18,2),
      max_daily_trades INTEGER,
      theme TEXT NOT NULL DEFAULT 'dark',
      compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
      show_pnl_in_percent BOOLEAN NOT NULL DEFAULT FALSE,
      email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      daily_summary BOOLEAN NOT NULL DEFAULT FALSE,
      weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
      trade_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL DEFAULT 0,
      playbook_id INTEGER,
      symbol TEXT NOT NULL,
      asset_class TEXT NOT NULL DEFAULT 'STOCK',
      direction TEXT NOT NULL,
      quantity NUMERIC(18,8) NOT NULL,
      entry_price NUMERIC(18,8) NOT NULL,
      exit_price NUMERIC(18,8) NOT NULL,
      entry_time TIMESTAMPTZ NOT NULL,
      exit_time TIMESTAMPTZ NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      gross_pnl NUMERIC(18,4) NOT NULL DEFAULT 0,
      net_pnl NUMERIC(18,4) NOT NULL DEFAULT 0,
      commissions NUMERIC(18,4) NOT NULL DEFAULT 0,
      fees NUMERIC(18,4) NOT NULL DEFAULT 0,
      slippage NUMERIC(18,4) NOT NULL DEFAULT 0,
      stop_loss NUMERIC(18,8),
      r_multiple NUMERIC(10,4),
      status TEXT NOT NULL DEFAULT 'CLOSED',
      import_source TEXT NOT NULL DEFAULT 'MANUAL',
      followed_rules BOOLEAN NOT NULL DEFAULT FALSE,
      mistakes JSONB NOT NULL DEFAULT '[]',
      emotions JSONB NOT NULL DEFAULT '[]',
      grade TEXT,
      notes TEXT,
      rating INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      target_value NUMERIC(18,4) NOT NULL,
      period TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS playbooks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      asset_class TEXT,
      time_window TEXT,
      rules JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS notebooks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT NOT NULL DEFAULT '',
      folder TEXT,
      tags JSONB DEFAULT '[]',
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'CONSISTENCY',
      target_metrics JSONB DEFAULT '{}',
      start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      progress NUMERIC(5,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS backtest_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      market_type TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      replay_point TIMESTAMPTZ,
      notes TEXT,
      tags JSONB DEFAULT '[]' NOT NULL,
      config JSONB DEFAULT '{}' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`
  ];

  for (const table of tables) {
    try {
      await client.exec(table);
    } catch (err) {
      console.warn("Table creation warning:", err);
    }
  }

  // Migrations: add new columns to existing tables (safe to re-run)
  const migrations = [
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id INTEGER`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS followed_rules BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistakes JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotions JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS grade TEXT`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple NUMERIC(10,4)`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE trades ADD COLUMN IF NOT EXISTS backtest_session_id INTEGER`,
  ];

  for (const migration of migrations) {
    try {
      await client.exec(migration);
    } catch (err) {
      // Column may already exist, that's fine
    }
  }
}
