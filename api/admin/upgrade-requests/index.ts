import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../_db.js";
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
    const rows = await query("SELECT * FROM users WHERE upgrade_request IS NOT NULL", []);
    const requests = rows
      .map((row) => {
        const r = (row as Record<string, unknown>).upgrade_request as Record<string, unknown>;
        return {
          requestId: row.id,
          userId: row.id,
          email: r?.email ?? (row as Record<string, unknown>).email,
          name: r?.name ?? (row as Record<string, unknown>).name,
          status: r?.status ?? "pending",
          n8nSent: r?.n8nSent ?? false,
          createdAt: r?.createdAt ?? "",
          reviewedAt: r?.reviewedAt,
        };
      })
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    res.status(200).json(requests);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
