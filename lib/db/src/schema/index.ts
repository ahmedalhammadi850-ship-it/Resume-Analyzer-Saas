import { pgTable, text, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  plan: text("plan").notNull().default("free"),
  remainingScans: integer("remaining_scans").notNull().default(1),
  role: text("role").notNull().default("user"),
  resumeName: text("resume_name"),
  suspended: boolean("suspended").notNull().default(false),
  upgradeRequest: jsonb("upgrade_request"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analysesTable = pgTable("analyses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  analysisType: text("analysis_type").notNull(),
  fileName: text("file_name").notNull(),
  results: jsonb("results").notNull(),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appSettingsTable = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true });
export const insertAppSettingSchema = createInsertSchema(appSettingsTable);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type AppSetting = typeof appSettingsTable.$inferSelect;
