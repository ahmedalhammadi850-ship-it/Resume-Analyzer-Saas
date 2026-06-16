import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Key");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  try {
    const snap = await db.collection("users").orderBy("createdAt").get();
    res.status(200).json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
