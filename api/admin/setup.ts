import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../_db.js";
import { requireAuth } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const admins = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
    if (admins.length > 0) { res.status(403).json({ error: "Admin already exists" }); return; }
    const rows = await query("UPDATE users SET role = 'admin' WHERE id = $1 RETURNING *", [user.uid]);
    res.status(200).json({ ok: true, user: mapUser(rows[0] as Record<string, unknown>) });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
