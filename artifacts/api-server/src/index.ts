import { initializeDb, db, usersTable, userSettingsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import app from "./app";

const rawPort = process.env["PORT"] ?? "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Initialize DB then start server
console.log("Starting server initialization...");
initializeDb().then(async () => {
  console.log("Database connection established.");

  // Ensure Backtest tables exist
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS backtest_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        market_type TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        replay_point TIMESTAMPTZ,
        notes TEXT,
        tags JSONB DEFAULT '[]'::jsonb NOT NULL,
        config JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS backtest_session_id integer`);
    
    // AI System Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_strategies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        content TEXT,
        structured_rules JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        type TEXT DEFAULT 'MANUAL' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        trade_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        quality_score INTEGER DEFAULT 0,
        execution_score INTEGER DEFAULT 0,
        discipline_score INTEGER DEFAULT 0,
        risk_score INTEGER DEFAULT 0,
        strategy_alignment_score INTEGER DEFAULT 0,
        biggest_mistake TEXT,
        best_decision TEXT,
        hidden_weakness TEXT,
        recommendations TEXT,
        alternative_entry TEXT,
        rule_violations JSONB DEFAULT '[]'::jsonb NOT NULL,
        positive_confluences JSONB DEFAULT '[]'::jsonb NOT NULL,
        raw_response JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_memories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        importance INTEGER DEFAULT 1,
        last_observed TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    // Challenges and Notebooks (Ensuring they exist for all DB providers)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '' NOT NULL,
        type TEXT DEFAULT 'CONSISTENCY' NOT NULL,
        target_metrics JSONB DEFAULT '{}'::jsonb NOT NULL,
        start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        end_date TIMESTAMPTZ,
        status TEXT DEFAULT 'ACTIVE' NOT NULL,
        progress NUMERIC(5,2) DEFAULT '0' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notebooks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT DEFAULT 'Untitled' NOT NULL,
        content TEXT DEFAULT '' NOT NULL,
        folder TEXT,
        tags JSONB DEFAULT '[]'::jsonb NOT NULL,
        pinned BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS user_id integer`);
    await db.execute(sql`ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS user_id integer`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        account_name TEXT NOT NULL,
        server_address TEXT,
        login TEXT,
        password TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        last_sync_at TIMESTAMPTZ,
        settings JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS ticket_id TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS magic_number INTEGER`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker_name TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_login TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS timeframe TEXT`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS gross_pnl NUMERIC(20,2)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS commission NUMERIC(20,2) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS swap NUMERIC(20,2) DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS balance_before NUMERIC(20,2)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS balance_after NUMERIC(20,2)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_minutes INTEGER`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '{"before": null, "during": null, "after": null}'::jsonb`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS rr_ratio NUMERIC(5,2)`);
    await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session TEXT`);

    console.log("[DB] All system tables verified.");

    // Seed default user (userId: 1) for the removed login workflow
    console.log("[DB] Ensuring default user exists...");
    const [defaultUser] = await db.select().from(usersTable).where(eq(usersTable.id, 1));
    if (!defaultUser) {
      console.log("[DB] Seeding default user...");
      await db.insert(usersTable).values({
        id: 1,
        email: "trader@example.com",
        password: "password", // Not used since login is removed
        displayName: "Trader",
      }).onConflictDoNothing();
      
      await db.insert(userSettingsTable).values({
        userId: 1,
        displayName: "Trader",
      }).onConflictDoNothing();
      console.log("[DB] Default user seeded.");
    }
  } catch (e) {
    console.warn("[DB] Migration warning:", e);
  }

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
  
  server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  // Keep process alive explicitly if needed
  setInterval(() => {
    if (server.listening) {
       // Just a heartbeat
    }
  }, 60000);
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

