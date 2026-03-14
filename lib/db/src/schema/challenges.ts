import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengeTypeEnum = pgEnum("challenge_type", [
  "CONSISTENCY",
  "PROFITABILITY",
  "DISCIPLINE",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "ACTIVE",
  "COMPLETED",
  "FAILED",
]);

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: challengeTypeEnum("type").notNull().default("CONSISTENCY"),
  targetMetrics: jsonb("target_metrics").$type<Record<string, number>>().default({}),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: challengeStatusEnum("status").notNull().default("ACTIVE"),
  progress: numeric("progress", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
