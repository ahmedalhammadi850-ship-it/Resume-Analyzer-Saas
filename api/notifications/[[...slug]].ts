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

  const _s = req.query.slug;
  const slug: string[] = Array.isArray(_s) ? _s : _s ? [_s] : [];
  const [id, action] = slug;

  if (!id && req.method === "GET") {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .get();
      const results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      results.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      res.status(200).json(results.slice(0, 50));
    } catch {
      res.status(200).json([]);
    }
    return;
  }

  if (id === "unread-count" && req.method === "GET") {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .get();
      const count = snap.docs.filter((d: any) => d.data().read === false).length;
      res.status(200).json({ count });
    } catch {
      res.status(200).json({ count: 0 });
    }
    return;
  }

  if (id === "read-all" && req.method === "PATCH") {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("notifications")
        .where("userId", "==", user.uid)
        .get();
      const batch = db.batch();
      snap.docs
        .filter((d: any) => d.data().read === false)
        .forEach((d: any) => batch.update(d.ref, { read: true }));
      await batch.commit();
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (id && action === "read" && req.method === "PATCH") {
    try {
      const db = getAdminFirestore();
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
