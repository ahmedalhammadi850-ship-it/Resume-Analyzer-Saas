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
  if (req.method !== "GET" && req.method !== "PATCH") {
    res.status(405).json({ error: "Method Not Allowed" }); return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

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
  }
}
