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
  const { role } = (req.body ?? {}) as { role?: string };
  if (!role || !["user", "admin"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }

  try {
    const rows = await query("UPDATE users SET role = $1 WHERE id = $2 RETURNING *", [role, uid]);
    res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
