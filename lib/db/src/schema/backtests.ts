import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const backtestSessionsTable = pgTable("backtest_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  marketType: text("market_type").notNull(), // Forex, Crypto, etc.
  timeframe: text("timeframe").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  replayPoint: timestamp("replay_point", { withTimezone: true }),
  notes: text("notes"),
  tags: jsonb("tags").notNull().default([]),
  config: jsonb("config").notNull().default({}), // Additional replay settings
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBacktestSessionSchema = createInsertSchema(backtestSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBacktestSession = z.infer<typeof insertBacktestSessionSchema>;
export type BacktestSession = typeof backtestSessionsTable.$inferSelect;
