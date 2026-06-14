import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.get("/auth/me", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/auth/register", async (req, res) => {
  const { id, name, email } = req.body as { id: string; name: string; email: string };
  if (!id || !email) {
    res.status(400).json({ error: "id and email are required" });
    return;
  }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (existing.length) {
      (req.session as any).userId = id;
      res.json(existing[0]);
      return;
    }
    const [user] = await db.insert(usersTable).values({
      id,
      name: name || email.split("@")[0],
      email,
      plan: "free",
      remainingScans: FREE_PLAN_LIMIT,
      role: "user",
    }).returning();
    (req.session as any).userId = id;
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  const { id } = req.body as { id: string };
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    (req.session as any).userId = id;
    res.json(user[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
