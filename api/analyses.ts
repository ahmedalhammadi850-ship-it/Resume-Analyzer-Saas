import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_auth";
import { getAdminFirestore } from "./_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const limitParam = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("analyses")
        .where("userId", "==", user.uid)
        .get();
      let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      results.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      if (limitParam) results = results.slice(0, limitParam);
      res.status(200).json(results);
    } catch {
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === "POST") {
    const { analysisType, fileName, results, score } = (req.body ?? {}) as {
      analysisType?: string; fileName?: string; results?: unknown; score?: number;
    };
    if (!analysisType || !fileName || !results) {
      res.status(400).json({ error: "analysisType, fileName, results are required" });
      return;
    }
    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const userData = userDoc.data()!;
      const ref = db.collection("analyses").doc();
      const newAnalysis = {
        userId: user.uid,
        analysisType,
        fileName,
        results,
        score: Number(score) || 0,
        createdAt: new Date().toISOString(),
      };
      await ref.set(newAnalysis);
      if (userData.plan === "free") {
        await db.collection("users").doc(user.uid).update({
          remainingScans: Math.max(0, (userData.remainingScans ?? 0) - 1),
        });
      }
      res.status(200).json({ id: ref.id, ...newAnalysis });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
