import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, analysesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAILS } from "../lib/constants.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any)?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user || (user.role !== "admin" && !ADMIN_EMAILS.includes(user.email))) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  (req as any).adminUser = user;
  next();
}

router.get("/users/me", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
  res.json(users[0]);
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { resumeName } = req.body as { resumeName?: string };
  try {
    const [user] = await db.update(usersTable).set({ resumeName }).where(eq(usersTable.id, userId)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const analyses = await db.select().from(analysesTable);
    const activeSubscribers = users.filter(u => u.plan === "pro").length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = users.filter(u => new Date(u.createdAt) >= monthStart).length;
    res.json({
      totalUsers: users.length,
      totalAnalyses: analyses.length,
      activeSubscribers,
      monthlyGrowth: newThisMonth,
      monthlyRevenue: activeSubscribers * 19,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/users/:uid/suspend", requireAdmin, async (req, res) => {
  try {
    const [user] = await db.update(usersTable).set({ suspended: true }).where(eq(usersTable.id, req.params.uid)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/users/:uid", requireAdmin, async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.uid));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/users/:uid/scans", requireAdmin, async (req, res) => {
  const { amount } = req.body as { amount: number };
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.uid)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const current = users[0].remainingScans ?? 0;
    const [user] = await db.update(usersTable).set({ remainingScans: current + amount }).where(eq(usersTable.id, req.params.uid)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/upgrade-requests", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const requests = users
      .filter(u => u.upgradeRequest != null)
      .map(u => {
        const r = u.upgradeRequest as any;
        return {
          requestId: u.id,
          userId: u.id,
          email: r.email ?? u.email,
          name: r.name ?? u.name,
          status: r.status ?? "pending",
          n8nSent: r.n8nSent ?? false,
          createdAt: r.createdAt ?? "",
          reviewedAt: r.reviewedAt,
        };
      })
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/upgrade-requests/:requestId/approve", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.requestId)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const existing = (users[0].upgradeRequest as any) ?? {};
    const [user] = await db.update(usersTable).set({
      plan: "pro",
      remainingScans: 25,
      upgradeRequest: { ...existing, status: "approved", reviewedAt: new Date().toISOString() },
    }).where(eq(usersTable.id, req.params.requestId)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/upgrade-requests/:requestId/reject", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.requestId)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const existing = (users[0].upgradeRequest as any) ?? {};
    const [user] = await db.update(usersTable).set({
      upgradeRequest: { ...existing, status: "rejected", reviewedAt: new Date().toISOString() },
    }).where(eq(usersTable.id, req.params.requestId)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/users/:uid/role", requireAdmin, async (req, res) => {
  const { role } = req.body as { role: string };
  if (!["user", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" }); return;
  }
  try {
    const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, req.params.uid)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/users/:uid/plan", requireAdmin, async (req, res) => {
  const { plan } = req.body as { plan: string };
  if (!["free", "pro"].includes(plan)) {
    res.status(400).json({ error: "Invalid plan" }); return;
  }
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.uid)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const [user] = await db.update(usersTable).set({
      plan,
      remainingScans: plan === "pro" ? 25 : 1,
    }).where(eq(usersTable.id, req.params.uid)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/users/:uid/unsuspend", requireAdmin, async (req, res) => {
  try {
    const [user] = await db.update(usersTable).set({ suspended: false }).where(eq(usersTable.id, req.params.uid)).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/setup", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  try {
    const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length > 0) {
      res.status(403).json({ error: "Admin already exists" }); return;
    }
    const [user] = await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, userId)).returning();
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users/upgrade-request", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { n8nSent } = req.body as { n8nSent?: boolean };
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const u = users[0];
    const [updated] = await db.update(usersTable).set({
      upgradeRequest: {
        userId,
        email: u.email,
        name: u.name,
        status: "pending",
        n8nSent: n8nSent ?? false,
        createdAt: new Date().toISOString(),
      }
    }).where(eq(usersTable.id, userId)).returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
