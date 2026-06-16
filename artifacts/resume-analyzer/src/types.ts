export type UserRole = "user" | "admin";
export type PlanType = "free" | "starter" | "pro";
export type AnalysisType = "jd_match" | "general_review";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  remainingScans: number;
  role: UserRole;
  createdAt: string;
  resumeName?: string;
}

export interface Analysis {
  id: string;
  userId: string;
  analysisType: AnalysisType;
  fileName: string;
  results: AnalysisResults;
  score: number;
  createdAt: string;
}

export interface AnalysisResults {
  ats_score?: number;
  match_score?: number;
  missing_skills?: string[];
  missing_keywords?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  ai_insights?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppSettings {
  resumeNameChangeFree: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  activeSubscribers: number;
  monthlyGrowth: number;
  monthlyRevenue: number;
}

export type UpgradeRequestStatus = "pending" | "approved" | "rejected";

export interface UpgradeRequest {
  requestId: string;
  userId: string;
  email: string;
  name: string;
  status: UpgradeRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  n8nSent: boolean;
}

export const N8N_WEBHOOK_JD =
  import.meta.env.VITE_N8N_WEBHOOK_JD as string;
export const N8N_WEBHOOK_GENERAL =
  import.meta.env.VITE_N8N_WEBHOOK_GENERAL as string;
export const N8N_WEBHOOK_UPGRADE =
  import.meta.env.VITE_N8N_WEBHOOK_UPGRADE as string;
export const N8N_WEBHOOK_CREATE_CV =
  import.meta.env.VITE_N8N_WEBHOOK_CREATE_CV as string;
export const FREE_PLAN_LIMIT = 1;
export const STARTER_PLAN_LIMIT = 7;
export const PRO_PLAN_LIMIT = 25;

export interface PlanConfig {
  price: number;
  scanLimit: number;
  billing: string;
  visible: boolean;
  mostPopular: boolean;
  features: string[];
}

export interface PricingConfig {
  free: PlanConfig;
  starter: PlanConfig;
  pro: PlanConfig;
}
