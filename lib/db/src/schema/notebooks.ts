import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notebooksTable = pgTable("notebooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull().default("Untitled"),
  content: text("content").notNull().default(""),
  folder: text("folder"),
  tags: jsonb("tags").$type<string[]>().default([]),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotebookSchema = createInsertSchema(notebooksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotebook = z.infer<typeof insertNotebookSchema>;
export type Notebook = typeof notebooksTable.$inferSelect;
