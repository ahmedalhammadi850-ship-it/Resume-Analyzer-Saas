import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, requireAdmin } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Key");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const rawPath = (req.url ?? "").split("?")[0];
  const adminPath = rawPath.replace(/^\/api\/admin\/?/, "");
  const slug = adminPath ? adminPath.split("/").filter(Boolean) : [];
  const [section, param1, param2] = slug;
  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch (err: unknown) {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  if (section === "setup" && req.method === "GET") {
    const user = await requireAuth(req, res);
    if (!user) return;
    try {
      const snap = await db.collection("users").where("role", "==", "admin").limit(1).get();
      if (!snap.empty) { res.status(403).json({ error: "Admin already exists" }); return; }
      await db.collection("users").doc(user.uid).update({ role: "admin" });
      const doc = await db.collection("users").doc(user.uid).get();
      res.status(200).json({ ok: true, user: { id: doc.id, ...doc.data() } });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (section === "stats" && req.method === "GET") {
    try {
      const [usersSnap, analysesSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("analyses").get(),
      ]);
      const users = usersSnap.docs.map((d: any) => d.data());
      const activeSubscribers = users.filter((u: any) => u.plan === "pro").length;
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const newThisMonth = users.filter((u: any) => new Date(u.createdAt) >= monthStart).length;
      res.status(200).json({
        totalUsers: users.length,
        totalAnalyses: analysesSnap.size,
        activeSubscribers,
        monthlyGrowth: newThisMonth,
        monthlyRevenue: activeSubscribers * 19,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && !param1 && req.method === "GET") {
    try {
      const snap = await db.collection("users").orderBy("createdAt").get();
      res.status(200).json(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && !param2 && req.method === "DELETE") {
    try {
      await db.collection("users").doc(param1).delete();
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && param2 === "plan" && req.method === "PATCH") {
    const { plan } = (req.body ?? {}) as { plan?: string };
    if (!plan || !["free", "starter", "pro"].includes(plan)) {
      res.status(400).json({ error: "Invalid plan" }); return;
    }
    const scanLimits: Record<string, number> = { free: 1, starter: 7, pro: 25 };
    try {
      await db.collection("users").doc(param1).update({ plan, remainingScans: scanLimits[plan] });
      const doc = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && param2 === "role" && req.method === "PATCH") {
    const { role } = (req.body ?? {}) as { role?: string };
    if (!role || !["user", "admin"].includes(role)) {
      res.status(400).json({ error: "Invalid role" }); return;
    }
    try {
      await db.collection("users").doc(param1).update({ role });
      const doc = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && param2 === "scans" && req.method === "PATCH") {
    const { amount } = (req.body ?? {}) as { amount?: number };
    try {
      const doc = await db.collection("users").doc(param1).get();
      if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const current = (doc.data()?.remainingScans ?? 0) as number;
      await db.collection("users").doc(param1).update({ remainingScans: current + (amount ?? 0) });
      const updated = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && param2 === "suspend" && req.method === "PATCH") {
    try {
      await db.collection("users").doc(param1).update({ suspended: true });
      const doc = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "users" && param1 && param2 === "unsuspend" && req.method === "PATCH") {
    try {
      await db.collection("users").doc(param1).update({ suspended: false });
      const doc = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "notify" && param1 && req.method === "POST") {
    const { title, message, type } = (req.body ?? {}) as { title?: string; message?: string; type?: string };
    if (!title || !message) { res.status(400).json({ error: "title and message are required" }); return; }
    try {
      const userDoc = await db.collection("users").doc(param1).get();
      if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const ref = db.collection("notifications").doc();
      const notif = {
        userId: param1,
        title,
        message,
        type: type ?? "info",
        read: false,
        createdAt: new Date().toISOString(),
      };
      await ref.set(notif);
      res.status(200).json({ id: ref.id, ...notif });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "upgrade-requests" && !param1 && req.method === "GET") {
    try {
      const snap = await db.collection("users").get();
      const requests = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
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
      res.status(200).json(requests);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "upgrade-requests" && param1 && param2 === "approve" && req.method === "PATCH") {
    try {
      const doc = await db.collection("users").doc(param1).get();
      if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const existing = (doc.data()?.upgradeRequest as any) ?? {};
      await db.collection("users").doc(param1).update({
        plan: "pro",
        remainingScans: 25,
        upgradeRequest: { ...existing, status: "approved", reviewedAt: new Date().toISOString() },
      });
      const updated = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (section === "upgrade-requests" && param1 && param2 === "reject" && req.method === "PATCH") {
    try {
      const doc = await db.collection("users").doc(param1).get();
      if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const existing = (doc.data()?.upgradeRequest as any) ?? {};
      await db.collection("users").doc(param1).update({
        upgradeRequest: { ...existing, status: "rejected", reviewedAt: new Date().toISOString() },
      });
      const updated = await db.collection("users").doc(param1).get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
