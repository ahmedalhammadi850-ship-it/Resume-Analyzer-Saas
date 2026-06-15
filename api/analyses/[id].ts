import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapAnalysis } from "../_db.js";
import { requireAuth } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };
  try {
    const rows = await query("SELECT * FROM analyses WHERE id = $1 LIMIT 1", [id]);
    if (!rows.length) { res.status(404).json({ error: "Analysis not found" }); return; }
    const row = rows[0] as Record<string, unknown>;
    if (row.user_id !== user.uid) { res.status(403).json({ error: "Forbidden" }); return; }
    res.status(200).json(mapAnalysis(row));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
