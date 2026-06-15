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

  const user = await requireAuth(req, res);
  if (!user) return;

  const id = req.query.id as string;

  if (req.method === "GET") {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("analyses").doc(id).get();
      if (!doc.exists) { res.status(404).json({ error: "Analysis not found" }); return; }
      const data = doc.data()!;
      if (data.userId !== user.uid) { res.status(403).json({ error: "Forbidden" }); return; }
      res.status(200).json({ id: doc.id, ...data });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
