import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  try {
    const snap = await db.collection("users").where("role", "==", "admin").limit(1).get();
    if (!snap.empty) { res.status(403).json({ error: "Admin already exists" }); return; }
    await db.collection("users").doc(user.uid).update({ role: "admin" });
    const doc = await db.collection("users").doc(user.uid).get();
    res.status(200).json({ ok: true, user: { id: doc.id, ...doc.data() } });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
