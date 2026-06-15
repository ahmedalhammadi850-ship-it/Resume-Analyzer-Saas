import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../_db.js";
import { requireAdmin } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const [usersRes, analysesRes, proRes, monthRes] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*) AS count FROM users", []),
      query<{ count: string }>("SELECT COUNT(*) AS count FROM analyses", []),
      query<{ count: string }>("SELECT COUNT(*) AS count FROM users WHERE plan = 'pro'", []),
      query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM users WHERE created_at >= date_trunc('month', NOW())",
        [],
      ),
    ]);
    const activeSubscribers = parseInt(proRes[0]?.count ?? "0");
    res.status(200).json({
      totalUsers: parseInt(usersRes[0]?.count ?? "0"),
      totalAnalyses: parseInt(analysesRes[0]?.count ?? "0"),
      activeSubscribers,
      monthlyGrowth: parseInt(monthRes[0]?.count ?? "0"),
      monthlyRevenue: activeSubscribers * 19,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
