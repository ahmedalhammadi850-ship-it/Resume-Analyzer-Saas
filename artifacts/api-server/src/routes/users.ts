import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth, requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

router.get("/users/me", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const db = getAdminFirestore();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: doc.id, ...doc.data() });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const { resumeName } = req.body as { resumeName?: string };
  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(uid).update({ resumeName });
    const doc = await db.collection("users").doc(uid).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("users").orderBy("createdAt").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const db = getAdminFirestore();
    const [usersSnap, analysesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("analyses").get(),
    ]);
    const users = usersSnap.docs.map(d => d.data());
    const activeSubscribers = users.filter(u => u.plan === "pro").length;
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = users.filter(u => new Date(u.createdAt) >= monthStart).length;
    res.json({
      totalUsers: users.length,
      totalAnalyses: analysesSnap.size,
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
    const db = getAdminFirestore();
    await db.collection("users").doc(req.params.uid).update({ suspended: true });
    const doc = await db.collection("users").doc(req.params.uid).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/users/:uid/unsuspend", requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(req.params.uid).update({ suspended: false });
    const doc = await db.collection("users").doc(req.params.uid).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/users/:uid", requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(req.params.uid).delete();
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/users/:uid/scans", requireAdmin, async (req, res) => {
  const { amount } = req.body as { amount: number };
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const current = (doc.data()?.remainingScans ?? 0) as number;
    await db.collection("users").doc(req.params.uid).update({ remainingScans: current + amount });
    const updated = await db.collection("users").doc(req.params.uid).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/users/:uid/role", requireAdmin, async (req, res) => {
  const { role } = req.body as { role: string };
  if (!["user", "admin"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(req.params.uid).update({ role });
    const doc = await db.collection("users").doc(req.params.uid).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/users/:uid/plan", requireAdmin, async (req, res) => {
  const { plan } = req.body as { plan: string };
  if (!["free", "pro"].includes(plan)) { res.status(400).json({ error: "Invalid plan" }); return; }
  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(req.params.uid).update({
      plan,
      remainingScans: plan === "pro" ? 25 : 1,
    });
    const doc = await db.collection("users").doc(req.params.uid).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/admin/upgrade-requests", requireAdmin, async (_req, res) => {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("users").get();
    const requests = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((u: any) => u.upgradeRequest != null)
      .map((u: any) => {
        const r = u.upgradeRequest;
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
      .sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
    res.json(requests);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/upgrade-requests/:requestId/approve", requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(req.params.requestId).get();
    if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const existing = (doc.data()?.upgradeRequest as any) ?? {};
    await db.collection("users").doc(req.params.requestId).update({
      plan: "pro",
      remainingScans: 25,
      upgradeRequest: { ...existing, status: "approved", reviewedAt: new Date().toISOString() },
    });
    const updated = await db.collection("users").doc(req.params.requestId).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/upgrade-requests/:requestId/reject", requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(req.params.requestId).get();
    if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const existing = (doc.data()?.upgradeRequest as any) ?? {};
    await db.collection("users").doc(req.params.requestId).update({
      upgradeRequest: { ...existing, status: "rejected", reviewedAt: new Date().toISOString() },
    });
    const updated = await db.collection("users").doc(req.params.requestId).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/admin/setup", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("users").where("role", "==", "admin").limit(1).get();
    if (!snap.empty) { res.status(403).json({ error: "Admin already exists" }); return; }
    await db.collection("users").doc(uid).update({ role: "admin" });
    const doc = await db.collection("users").doc(uid).get();
    res.json({ ok: true, user: { id: doc.id, ...doc.data() } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/users/upgrade-request", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const { n8nSent } = req.body as { n8nSent?: boolean };
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const u = doc.data()!;
    const now = new Date().toISOString();
    await db.collection("users").doc(uid).update({
      upgradeRequest: {
        userId: uid,
        email: u.email,
        name: u.name,
        status: "pending",
        n8nSent: n8nSent ?? false,
        createdAt: now,
      },
    });

    const adminsSnap = await db.collection("users").where("role", "==", "admin").get();
    const batch = db.batch();
    adminsSnap.docs.forEach(adminDoc => {
      if (adminDoc.id === uid) return;
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        userId: adminDoc.id,
        title: "طلب ترقية جديد 🔔",
        message: `المستخدم ${u.name || u.email} أرسل إيصال تحويل ويطلب الترقية إلى Pro. راجع طلبات الترقية.`,
        type: "upgrade",
        read: false,
        createdAt: now,
      });
    });
    await batch.commit();

    const updated = await db.collection("users").doc(uid).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
