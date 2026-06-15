import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  email: z.string().default(""),
  plan: z.string().default("free"),
  remainingScans: z.number().default(1),
  role: z.string().default("user"),
  resumeName: z.string().optional(),
  suspended: z.boolean().default(false),
  upgradeRequest: z.unknown().optional(),
  createdAt: z.string(),
});

export const analysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  analysisType: z.string(),
  fileName: z.string(),
  results: z.unknown(),
  score: z.number().default(0),
  createdAt: z.string(),
});

export const appSettingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string().default("info"),
  read: z.boolean().default(false),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type AppSetting = z.infer<typeof appSettingSchema>;
export type Notification = z.infer<typeof notificationSchema>;
