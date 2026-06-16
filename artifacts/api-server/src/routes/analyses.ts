import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAuth } from "../lib/auth-middleware.js";

const router = Router();

const ALLOWED_ANALYSIS_TYPES = new Set(["jd_match", "general_review"]);
const MAX_FILENAME_LENGTH = 255;
const MAX_SCORE = 100;

router.get("/analyses", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

  if (limitParam !== undefined && (isNaN(limitParam) || limitParam < 1 || limitParam > 100)) {
    res.status(400).json({ error: "Invalid limit parameter" });
    return;
  }

  try {
    const db = getAdminFirestore();
    const snap = await db.collection("analyses").where("userId", "==", uid).get();
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    results.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return bTime - aTime;
    });
    if (limitParam) results = results.slice(0, limitParam);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analyses/:id", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const id = String(req.params.id).slice(0, 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json({ error: "Invalid analysis ID" });
    return;
  }
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("analyses").doc(id).get();
    if (!doc.exists) { res.status(404).json({ error: "Analysis not found" }); return; }
    const data = doc.data()!;
    if (data.userId !== uid) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: doc.id, ...data });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
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

  if (!analysisType || !ALLOWED_ANALYSIS_TYPES.has(analysisType)) {
    res.status(400).json({ error: "Invalid analysisType" });
    return;
  }
  if (!fileName || typeof fileName !== "string" || fileName.trim().length === 0 || fileName.length > MAX_FILENAME_LENGTH) {
    res.status(400).json({ error: "Invalid fileName" });
    return;
  }
  if (results === null || typeof results !== "object" || Array.isArray(results)) {
    res.status(400).json({ error: "Invalid results" });
    return;
  }
  const scoreNum = Number(score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > MAX_SCORE) {
    res.status(400).json({ error: "Invalid score" });
    return;
  }

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }
    const userData = userDoc.data()!;
    if ((userData.remainingScans ?? 0) <= 0 && userData.plan !== "pro") {
      res.status(403).json({ error: "No remaining scans" }); return;
    }
    const ref = db.collection("analyses").doc();
    const analysis = {
      userId: uid,
      analysisType,
      fileName: fileName.trim(),
      results,
      score: scoreNum,
      createdAt: new Date().toISOString(),
    };
    await ref.set(analysis);
    if (userData.plan !== "pro") {
      await db.collection("users").doc(uid).update({
        remainingScans: Math.max(0, (userData.remainingScans ?? 0) - 1),
      });
    }
    res.json({ id: ref.id, ...analysis });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
