import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiStrategiesTable = pgTable("ai_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content"), // The raw text/markdown input
  structuredRules: jsonb("structured_rules").notNull().default({}), // Parsed rule logic
  isActive: boolean("is_active").notNull().default(true),
  type: text("type").notNull().default("MANUAL"), // MANUAL, PDF, SCREENSHOT
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiAnalysisTable = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull(), // Link to the trade
  userId: integer("user_id").notNull(),
  
  qualityScore: integer("quality_score").default(0), // 0-100
  
  // Breakdown scores
  executionScore: integer("execution_score").default(0),
  disciplineScore: integer("discipline_score").default(0),
  riskScore: integer("risk_score").default(0),
  strategyAlignmentScore: integer("strategy_alignment_score").default(0),
  
  biggestMistake: text("biggest_mistake"),
  bestDecision: text("best_decision"),
  hiddenWeakness: text("hidden_weakness"),
  
  recommendations: text("recommendations"), // AI advice
  alternativeEntry: text("alternative_entry"),
  
  ruleViolations: jsonb("rule_violations").notNull().default([]), // List of rules broken
  positiveConfluences: jsonb("positive_confluences").notNull().default([]),
  
  rawResponse: jsonb("raw_response"), // Store the AI's full analysis for debugging
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiMemoriesTable = pgTable("ai_memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(), // e.g., "Frequent Mistakes", "Peak Performance", "Session Bias"
  content: text("content").notNull(),
  importance: integer("importance").default(1), // 1-5
  lastObserved: timestamp("last_observed", { withTimezone: true }).notNull().defaultNow(),
  
  // For RAG if needed later
  // embedding: ... (requires pgvector setup in drizzle)
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiStrategySchema = createInsertSchema(aiStrategiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalysisTable).omit({
  id: true,
  createdAt: true,
});

export type AiStrategy = typeof aiStrategiesTable.$inferSelect;
export type AiAnalysis = typeof aiAnalysisTable.$inferSelect;
export type AiMemory = typeof aiMemoriesTable.$inferSelect;
