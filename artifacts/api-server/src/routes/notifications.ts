import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const items = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, uid))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const items = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, uid), eq(notificationsTable.read, false)));
    res.json({ count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, req.params.id), eq(notificationsTable.userId, uid)));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, uid));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/notify/:uid", requireAdmin, async (req, res) => {
  const { title, message, type } = req.body as { title: string; message: string; type?: string };
  if (!title || !message) {
    res.status(400).json({ error: "title and message are required" });
    return;
  }
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.uid)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const [notif] = await db.insert(notificationsTable).values({
      userId: req.params.uid,
      title,
      message,
      type: type ?? "info",
    }).returning();
    res.json(notif);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
