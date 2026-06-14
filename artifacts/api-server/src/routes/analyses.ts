import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, analysesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware.js";

const router = Router();

router.get("/analyses", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  const limitParam = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  try {
    let q = db.select().from(analysesTable).where(eq(analysesTable.userId, uid)).orderBy(desc(analysesTable.createdAt));
    const results = limitParam ? (await q.limit(limitParam)) : (await q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analyses/:id", requireAuth, async (req, res) => {
  const uid = req.user!.uid;
  try {
    const analyses = await db.select().from(analysesTable).where(eq(analysesTable.id, req.params.id)).limit(1);
    if (!analyses.length) { res.status(404).json({ error: "Analysis not found" }); return; }
    if (analyses[0].userId !== uid) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(analyses[0]);
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
    const users = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const user = users[0];

    const [analysis] = await db.insert(analysesTable).values({
      userId: uid,
      analysisType,
      fileName,
      results,
      score: Number(score) || 0,
    }).returning();

    if (user.plan === "free") {
      await db.update(usersTable).set({
        remainingScans: Math.max(0, (user.remainingScans ?? 0) - 1),
      }).where(eq(usersTable.id, uid));
    }

    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
