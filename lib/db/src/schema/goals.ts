import {
  pgTable,
  serial,
  text,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalTypeEnum = pgEnum("goal_type", [
  "PNL",
  "WIN_RATE",
  "PROFIT_FACTOR",
  "TRADE_COUNT",
  "MAX_LOSS",
]);

export const goalPeriodEnum = pgEnum("goal_period", [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  type: goalTypeEnum("type").notNull(),
  name: text("name").notNull(),
  targetValue: numeric("target_value", { precision: 18, scale: 4 }).notNull(),
  period: goalPeriodEnum("period").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
