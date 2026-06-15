import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_auth";
import { getAdminFirestore } from "./_firebase-admin";

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

  if (req.method === "GET") {
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

  res.status(405).json({ error: "Method Not Allowed" });
}
