import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // Link to user

  // Profile
  displayName: text("display_name").notNull().default("Trader"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("UTC"),
  
  // Trading Preferences
  defaultAssetClass: text("default_asset_class").notNull().default("STOCK"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  startingBalance: numeric("starting_balance", { precision: 18, scale: 2 }).notNull().default("10000"),
  riskPerTrade: numeric("risk_per_trade", { precision: 5, scale: 2 }).notNull().default("1.00"),
  maxDailyLoss: numeric("max_daily_loss", { precision: 18, scale: 2 }),
  maxDailyTrades: integer("max_daily_trades"),
  
  // Display Preferences
  theme: text("theme").notNull().default("dark"),
  compactMode: boolean("compact_mode").notNull().default(false),
  showPnlInPercent: boolean("show_pnl_in_percent").notNull().default(false),
  
  // Notifications
  emailNotifications: boolean("email_notifications").notNull().default(true),
  dailySummary: boolean("daily_summary").notNull().default(false),
  weeklyReport: boolean("weekly_report").notNull().default(true),
  tradeAlerts: boolean("trade_alerts").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
