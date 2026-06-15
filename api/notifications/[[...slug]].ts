import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  const slug = (req.query.slug ?? []) as string[];
  const [id, action] = slug;
  const db = getAdminFirestore();

  if (!id && req.method === "GET") {
    try {
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      res.status(200).json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (id === "unread-count" && req.method === "GET") {
    try {
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .where("read", "==", false)
        .get();
      res.status(200).json({ count: snap.size });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (id === "read-all" && req.method === "PATCH") {
    try {
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .where("read", "==", false)
        .get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (id && action === "read" && req.method === "PATCH") {
    try {
      const doc = await db.collection("notifications").doc(id).get();
      if (!doc.exists || doc.data()?.userId !== user.uid) {
        res.status(404).json({ error: "Not found" }); return;
      }
      await db.collection("notifications").doc(id).update({ read: true });
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
