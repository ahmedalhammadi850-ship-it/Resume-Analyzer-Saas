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

  const { uid } = req.query as { uid: string };
  const { amount } = (req.body ?? {}) as { amount?: number };

  try {
    const current = await query<{ remaining_scans: number }>(
      "SELECT remaining_scans FROM users WHERE id = $1 LIMIT 1",
      [uid],
    );
    if (!current.length) { res.status(404).json({ error: "User not found" }); return; }
    const newScans = (current[0].remaining_scans ?? 0) + (amount ?? 0);
    const rows = await query(
      "UPDATE users SET remaining_scans = $1 WHERE id = $2 RETURNING *",
      [newScans, uid],
    );
    res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
