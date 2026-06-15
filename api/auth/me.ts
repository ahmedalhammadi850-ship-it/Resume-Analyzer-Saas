import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../_db.js";
import { requireAuth } from "../_auth.js";

const FREE_PLAN_LIMIT = 1;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const existing = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [user.uid]);
    if (existing.length) {
      res.status(200).json(mapUser(existing[0] as Record<string, unknown>));
      return;
    }
    const rows = await query(
      `INSERT INTO users (id, name, email, plan, remaining_scans, role)
       VALUES ($1, $2, $3, 'free', $4, 'user') RETURNING *`,
      [user.uid, user.name || user.email.split("@")[0] || "User", user.email, FREE_PLAN_LIMIT],
    );
    res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
