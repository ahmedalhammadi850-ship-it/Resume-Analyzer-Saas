import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../_db.js";
import { requireAuth } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === "GET") {
    try {
      const rows = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [user.uid]);
      if (!rows.length) { res.status(404).json({ error: "User not found" }); return; }
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const { resumeName } = (req.body ?? {}) as { resumeName?: string };
    try {
      const rows = await query(
        "UPDATE users SET resume_name = $1 WHERE id = $2 RETURNING *",
        [resumeName, user.uid],
      );
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
