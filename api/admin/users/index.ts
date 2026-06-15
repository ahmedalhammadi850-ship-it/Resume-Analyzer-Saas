import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../../_db.js";
import { requireAdmin } from "../../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const rows = await query("SELECT * FROM users ORDER BY created_at ASC", []);
    res.status(200).json(rows.map(r => mapUser(r as Record<string, unknown>)));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
