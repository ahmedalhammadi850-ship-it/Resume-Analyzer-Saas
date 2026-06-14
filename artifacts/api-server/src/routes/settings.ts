import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

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
