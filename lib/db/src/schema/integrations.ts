import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const integrationsTable = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  provider: text("provider").notNull(), // 'MT4', 'MT5', 'IBKR', 'BINANCE'
  accountName: text("account_name").notNull(),
  serverAddress: text("server_address"),
  login: text("login"),
  password: text("password"), // In a production app, this would be encrypted
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Integration = typeof integrationsTable.$inferSelect;
export type NewIntegration = typeof integrationsTable.$inferInsert;
