import { Router } from "express";
import { getAdminAuth, getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth } from "../lib/auth-middleware.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  const { uid, email, name } = req.user!;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      res.json({ id: doc.id, ...doc.data() });
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
