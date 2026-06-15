import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth, requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("notifications")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("notifications")
      .where("userId", "==", uid)
      .where("read", "==", false)
      .get();
    res.json({ count: snap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("notifications").doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== uid) { res.status(404).json({ error: "Not found" }); return; }
    await db.collection("notifications").doc(req.params.id).update({ read: true });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("notifications")
      .where("userId", "==", uid)
      .where("read", "==", false)
      .get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/notify/:uid", requireAdmin, async (req, res) => {
  const { title, message, type } = req.body as { title: string; message: string; type?: string };
  if (!title || !message) { res.status(400).json({ error: "title and message are required" }); return; }
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(req.params.uid).get();
    if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const ref = db.collection("notifications").doc();
    const notif = {
      userId: req.params.uid,
      title,
      message,
      type: type ?? "info",
      read: false,
      createdAt: new Date().toISOString(),
    };
    await ref.set(notif);
    res.json({ id: ref.id, ...notif });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
