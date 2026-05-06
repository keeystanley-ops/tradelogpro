import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetClassEnum = pgEnum("asset_class", [
  "STOCK",
  "CRYPTO",
  "OPTION",
  "FUTURES",
  "FOREX",
]);

export const directionEnum = pgEnum("direction", ["LONG", "SHORT"]);

export const tradeStatusEnum = pgEnum("trade_status", [
  "OPEN",
  "CLOSED",
  "PENDING",
]);

export const importSourceEnum = pgEnum("import_source", [
  "API",
  "CSV",
  "MANUAL",
]);

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Playbook relation
  playbookId: integer("playbook_id"),

  symbol: text("symbol").notNull(),
  assetClass: assetClassEnum("asset_class").notNull().default("STOCK"),
  direction: directionEnum("direction").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  entryPrice: numeric("entry_price", { precision: 18, scale: 8 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 18, scale: 8 }).notNull(),
  entryTime: timestamp("entry_time", { withTimezone: true }).notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }).notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  grossPnl: numeric("gross_pnl", { precision: 18, scale: 4 }).notNull().default("0"),
  netPnl: numeric("net_pnl", { precision: 18, scale: 4 }).notNull().default("0"),
  commissions: numeric("commissions", { precision: 18, scale: 4 }).notNull().default("0"),
  fees: numeric("fees", { precision: 18, scale: 4 }).notNull().default("0"),
  slippage: numeric("slippage", { precision: 18, scale: 4 }).notNull().default("0"),
  stopLoss: numeric("stop_loss", { precision: 18, scale: 8 }),
  rMultiple: numeric("r_multiple", { precision: 10, scale: 4 }),
  status: tradeStatusEnum("status").notNull().default("CLOSED"),
  importSource: importSourceEnum("import_source").notNull().default("MANUAL"),

  // Behavior tracking fields
  followedRules: boolean("followed_rules").notNull().default(false),
  mistakes: jsonb("mistakes").notNull().default([]),
  emotions: jsonb("emotions").notNull().default([]),
  grade: text("grade"),

  notes: text("notes"),
  rating: integer("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
