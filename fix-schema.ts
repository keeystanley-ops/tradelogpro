
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

    // Add backtest columns to trades
    try {
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest boolean DEFAULT false`);
      await db.execute(sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS backtest_session_id integer`);
      console.log("Added backtest columns to trades");
    } catch (e: any) {
      console.log("Error adding backtest columns:", e.message);
    }

    // Create backtest_sessions table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS backtest_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          symbol TEXT NOT NULL,
          market_type TEXT NOT NULL,
          timeframe TEXT NOT NULL,
          start_date TIMESTAMP WITH TIMEZONE NOT NULL,
          replay_point TIMESTAMP WITH TIMEZONE,
          notes TEXT,
          tags JSONB DEFAULT '[]'::jsonb NOT NULL,
          config JSONB DEFAULT '{}'::jsonb NOT NULL,
          created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created backtest_sessions table (if it didn't exist)");
    } catch (e: any) {
      console.log("Error creating backtest_sessions table:", e.message);
    }

    // AI Strategies
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_strategies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          content TEXT,
          structured_rules JSONB DEFAULT '{}'::jsonb NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          type TEXT DEFAULT 'MANUAL' NOT NULL,
          created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created ai_strategies table");
    } catch (e: any) {
      console.log("Error creating ai_strategies table:", e.message);
    }

    // AI Analysis
    try {
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
          created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created ai_analysis table");
    } catch (e: any) {
      console.log("Error creating ai_analysis table:", e.message);
    }

    // AI Memories
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_memories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          topic TEXT NOT NULL,
          content TEXT NOT NULL,
          importance INTEGER DEFAULT 1,
          last_observed TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL,
          created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created ai_memories table");
    } catch (e: any) {
      console.log("Error creating ai_memories table:", e.message);
    }

    console.log("Schema fix attempt complete.");
  } catch (err) {
    console.error("Failed to fix schema:", err);
  } finally {
    process.exit(0);
  }
}

fixSchema();
