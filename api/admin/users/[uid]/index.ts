import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../../_db.js";
import { requireAdmin } from "../../../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "DELETE") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const { uid } = req.query as { uid: string };
  try {
    await query("DELETE FROM users WHERE id = $1", [uid]);
    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
