import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapAnalysis } from "../_db.js";
import { requireAuth } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const limitParam = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    try {
      const sql = limitParam
        ? "SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"
        : "SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC";
      const params = limitParam ? [user.uid, limitParam] : [user.uid];
      const rows = await query(sql, params);
      res.status(200).json(rows.map(r => mapAnalysis(r as Record<string, unknown>)));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
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
      const id = crypto.randomUUID();
      const rows = await query(
        `INSERT INTO analyses (id, user_id, analysis_type, file_name, results, score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, user.uid, analysisType, fileName, JSON.stringify(results), score ?? 0],
      );
      // Decrement remaining scans for free users
      await query(
        "UPDATE users SET remaining_scans = GREATEST(remaining_scans - 1, 0) WHERE id = $1 AND plan != 'pro'",
        [user.uid],
      );
      res.status(200).json(mapAnalysis(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
