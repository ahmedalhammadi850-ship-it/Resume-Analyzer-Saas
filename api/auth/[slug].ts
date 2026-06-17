import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, isAdminEmail } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

const FREE_PLAN_LIMIT = 1;
const PLAN_LIMITS: Record<string, number> = { free: 1, starter: 7, pro: 25 };

function getNextRenewal(planRenewedAt: string): Date {
  const d = new Date(planRenewedAt);
  d.setDate(d.getDate() + 30);
  return d;
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const action = req.query.slug as string;

  if (action === "me" && req.method === "GET") {
    const user = await requireAuth(req, res);
    if (!user) return;
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data()!;
        const updates: Record<string, unknown> = {};
        // Auto-promote existing users whose email is in ADMIN_EMAILS
        if (isAdminEmail(user.email) && data.role !== "admin") {
          updates.role = "admin";
        }
        // Renew plan scans if expired
        if (data.plan && data.plan !== "free" && data.planRenewedAt) {
          const nextRenewal = getNextRenewal(data.planRenewedAt as string);
          if (new Date() >= nextRenewal) {
            const limit = PLAN_LIMITS[data.plan as string] ?? 1;
            updates.remainingScans = limit;
            updates.planRenewedAt = nextRenewal.toISOString();
          }
        }
        if (Object.keys(updates).length > 0) {
          await db.collection("users").doc(user.uid).update(updates);
          const refreshed = await db.collection("users").doc(user.uid).get();
          res.status(200).json({ id: refreshed.id, ...refreshed.data() });
          return;
        }
        res.status(200).json({ id: doc.id, ...data });
        return;
      }
      const newUser = {
        name: user.name || user.email.split("@")[0] || "User",
        email: user.email,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: isAdminEmail(user.email) ? "admin" : "user",
        suspended: false,
        createdAt: new Date().toISOString(),
      };
      await db.collection("users").doc(user.uid).set(newUser);
      res.status(200).json({ id: user.uid, ...newUser });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
