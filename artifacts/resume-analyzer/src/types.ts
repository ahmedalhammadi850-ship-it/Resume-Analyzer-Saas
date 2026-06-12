export type UserRole = "user" | "admin";
export type PlanType = "free" | "starter" | "pro";
export type AnalysisType = "jd_match" | "general_review";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  plan: PlanType;
  remainingScans: number;
  role: UserRole;
  createdAt: string;
  resumeName?: string;
}

export interface Analysis {
  analysisId: string;
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

export interface Subscription {
  userId: string;
  plan: PlanType;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  renewalDate: string;
  usage: number;
}

export interface SystemSettings {
  freePlanLimit: number;
  monthlyLimits: Record<string, number>;
  pricing: {
    pro: number;
  };
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
  "https://ahmed11ali.app.n8n.cloud/webhook-test/628cdfcd-4800-4277-83a6-c99ee4992aa8";
export const N8N_WEBHOOK_GENERAL =
  "https://ahmed11ali.app.n8n.cloud/webhook-test/df12d3bb-295b-452f-92ab-c3fea3532a52";
export const N8N_WEBHOOK_UPGRADE =
  "https://ahmed11ali.app.n8n.cloud/webhook-test/2f6b38a8-cde2-4029-9b59-a3b6d1a33eb4";
export const FREE_PLAN_LIMIT = 1;
export const STARTER_PLAN_LIMIT = 7;
export const PRO_PLAN_LIMIT = 25;
