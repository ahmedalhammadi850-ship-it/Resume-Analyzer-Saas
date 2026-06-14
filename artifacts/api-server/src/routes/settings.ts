import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, appSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAILS } from "../lib/constants.js";

const router = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user || (user.role !== "admin" && !ADMIN_EMAILS.includes(user.email))) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  next();
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "global")).limit(1);
    if (settings.length) {
      res.json(settings[0].value);
    } else {
      res.json({ resumeNameChangeFree: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/settings", requireAdmin, async (req, res) => {
  const patch = req.body as Record<string, unknown>;
  try {
    const existing = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "global")).limit(1);
    if (existing.length) {
      const merged = { ...(existing[0].value as Record<string, unknown>), ...patch };
      const [updated] = await db.update(appSettingsTable).set({ value: merged }).where(eq(appSettingsTable.key, "global")).returning();
      res.json(updated.value);
    } else {
      const defaults = { resumeNameChangeFree: false, ...patch };
      const [created] = await db.insert(appSettingsTable).values({ key: "global", value: defaults }).returning();
      res.json(created.value);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
