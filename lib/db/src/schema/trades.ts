import { pgTable, serial, integer, text, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  playbookId: integer("playbook_id"),
  
  // MT4/MT5 Specific Identifiers
  ticketId: text("ticket_id"), // Unique trade ID from broker
  magicNumber: integer("magic_number"),
  brokerName: text("broker_name"),
  accountLogin: text("account_login"),
  
  // Core Trade Data
  symbol: text("symbol").notNull(),
  assetClass: text("asset_class").notNull().default("STOCK"),
  direction: text("direction").notNull(), // LONG/SHORT
  status: text("status").notNull().default("OPEN"), // OPEN, CLOSED, CANCELLED
  timeframe: text("timeframe"),
  
  // Prices & Size
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  entryPrice: numeric("entry_price", { precision: 20, scale: 8 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 20, scale: 8 }),
  stopLoss: numeric("stop_loss", { precision: 20, scale: 8 }),
  takeProfit: numeric("take_profit", { precision: 20, scale: 8 }),
  
  // Timing
  entryTime: timestamp("entry_time", { withTimezone: true }).notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  
  // Financials
  netPnl: numeric("net_pnl", { precision: 20, scale: 4 }).notNull().default("0"),
  grossPnl: numeric("gross_pnl", { precision: 20, scale: 4 }).notNull().default("0"),
  commissions: numeric("commissions", { precision: 20, scale: 4 }).notNull().default("0"),
  fees: numeric("fees", { precision: 20, scale: 4 }).notNull().default("0"),
  slippage: numeric("slippage", { precision: 20, scale: 4 }).notNull().default("0"),
  
  // Account State
  balanceBefore: numeric("balance_before", { precision: 20, scale: 2 }),
  balanceAfter: numeric("balance_after", { precision: 20, scale: 2 }),
  
  // Metadata & Analysis
  importSource: text("import_source").notNull().default("MANUAL"),
  followedRules: boolean("followed_rules").notNull().default(false),
  mistakes: jsonb("mistakes").notNull().default([]),
  emotions: jsonb("emotions").notNull().default([]),
  grade: text("grade"),
  notes: text("notes"),
  rating: integer("rating"),
  
  // Technicals
  rMultiple: numeric("r_multiple", { precision: 10, scale: 4 }),
  marketSession: text("market_session"), // London, New York, Asia
  
  isBacktest: boolean("is_backtest").notNull().default(false),
  backtestSessionId: integer("backtest_session_id"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Trade = typeof tradesTable.$inferSelect;
export type NewTrade = typeof tradesTable.$inferInsert;

