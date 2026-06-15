import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../../../_db.js";
import { requireAdmin } from "../../../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "PATCH") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const { requestId } = req.query as { requestId: string };
  try {
    const existing = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [requestId]);
    if (!existing.length) { res.status(404).json({ error: "User not found" }); return; }
    const row = existing[0] as Record<string, unknown>;
    const current = (row.upgrade_request as Record<string, unknown>) ?? {};
    const updated = { ...current, status: "rejected", reviewedAt: new Date().toISOString() };
    const rows = await query(
      "UPDATE users SET upgrade_request = $1 WHERE id = $2 RETURNING *",
      [JSON.stringify(updated), requestId],
    );
    res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
