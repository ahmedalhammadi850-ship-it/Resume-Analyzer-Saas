import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth } from "../lib/auth-middleware.js";

const router = Router();

router.get("/analyses", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const limitParam = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  try {
    const db = getAdminFirestore();
    let query = db.collection("analyses")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc");
    if (limitParam) query = query.limit(limitParam) as any;
    const snap = await query.get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analyses/:id", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("analyses").doc(req.params.id).get();
    if (!doc.exists) { res.status(404).json({ error: "Analysis not found" }); return; }
    const data = doc.data()!;
    if (data.userId !== uid) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: doc.id, ...data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/analyses", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const { analysisType, fileName, results, score } = req.body as {
    analysisType: string;
    fileName: string;
    results: Record<string, unknown>;
    score: number;
  };
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const user = userDoc.data()!;

    const analysisRef = db.collection("analyses").doc();
    const newAnalysis = {
      userId: uid,
      analysisType,
      fileName,
      results,
      score: Number(score) || 0,
      createdAt: new Date().toISOString(),
    };
    await analysisRef.set(newAnalysis);

    if (user.plan === "free") {
      await db.collection("users").doc(uid).update({
        remainingScans: Math.max(0, (user.remainingScans ?? 0) - 1),
      });
    }

    res.json({ id: analysisRef.id, ...newAnalysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
