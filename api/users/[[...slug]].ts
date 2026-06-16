import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  const _s = req.query.slug;
  const slug: string[] = Array.isArray(_s) ? _s : _s ? [_s] : [];
  const action = slug[0];
  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch (err: unknown) {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  if (action === "me") {
    if (req.method === "GET") {
      try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
        res.status(200).json({ id: doc.id, ...doc.data() });
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
      }
      return;
    }
    if (req.method === "PATCH") {
      const { resumeName } = (req.body ?? {}) as { resumeName?: string };
      try {
        await db.collection("users").doc(user.uid).update({ resumeName });
        const doc = await db.collection("users").doc(user.uid).get();
        res.status(200).json({ id: doc.id, ...doc.data() });
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
      }
      return;
    }
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (action === "upgrade-request" && req.method === "POST") {
    const { n8nSent } = (req.body ?? {}) as { n8nSent?: boolean };
    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const u = doc.data()!;
      await db.collection("users").doc(user.uid).update({
        upgradeRequest: {
          userId: user.uid,
          email: u.email,
          name: u.name,
          status: "pending",
          n8nSent: n8nSent ?? false,
          createdAt: new Date().toISOString(),
        },
      });
      const updated = await db.collection("users").doc(user.uid).get();
      res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
