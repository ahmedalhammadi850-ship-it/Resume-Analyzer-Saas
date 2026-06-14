import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  const { uid, email, name } = req.user!;
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (existing.length) {
      res.json(existing[0]);
      return;
    }
    const [user] = await db.insert(usersTable).values({
      id: uid,
      name: name || email.split("@")[0] || "User",
      email,
      plan: "free",
      remainingScans: FREE_PLAN_LIMIT,
      role: "user",
    }).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
