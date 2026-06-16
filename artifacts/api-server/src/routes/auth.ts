import { Router } from "express";
import { getAdminAuth, getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth } from "../lib/auth-middleware.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const PLAN_LIMITS: Record<string, number> = { free: 1, starter: 7, pro: 25 };

function getNextRenewal(planRenewedAt: string): Date {
  const d = new Date(planRenewedAt);
  d.setDate(d.getDate() + 30);
  return d;
}

const router = Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  const { uid, email, name } = req.user!;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      const data = doc.data()!;
      if (data.plan && data.plan !== "free" && data.planRenewedAt) {
        const nextRenewal = getNextRenewal(data.planRenewedAt as string);
        if (new Date() >= nextRenewal) {
          const limit = PLAN_LIMITS[data.plan as string] ?? 1;
          await db.collection("users").doc(uid).update({
            remainingScans: limit,
            planRenewedAt: nextRenewal.toISOString(),
          });
          const refreshed = await db.collection("users").doc(uid).get();
          res.json({ id: refreshed.id, ...refreshed.data() });
          return;
        }
      }
      res.json({ id: doc.id, ...data });
      return;
    }
    const newUser = {
      name: name || email.split("@")[0] || "User",
      email,
      plan: "free",
      remainingScans: FREE_PLAN_LIMIT,
      role: "user",
      suspended: false,
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(uid).set(newUser);
    res.json({ id: uid, ...newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
