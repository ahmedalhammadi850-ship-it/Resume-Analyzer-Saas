import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../_db.js";
import { requireAuth } from "../_auth.js";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const user = requireAuth(req, res);
  if (!user) return;

  const slug = (req.query.slug ?? []) as string[];
  const action = slug[0];

  // GET,PATCH /api/users/me
  if (action === "me") {
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
    return;
  }

  // POST /api/users/upgrade-request
  if (action === "upgrade-request" && req.method === "POST") {
    const { n8nSent } = (req.body ?? {}) as { n8nSent?: boolean };
    try {
      const rows = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [user.uid]);
      if (!rows.length) { res.status(404).json({ error: "User not found" }); return; }
      const u = rows[0] as Record<string, unknown>;
      const upgradeRequest = {
        userId: user.uid,
        email: u.email,
        name: u.name,
        status: "pending",
        n8nSent: n8nSent ?? false,
        createdAt: new Date().toISOString(),
      };
      const updated = await query(
        "UPDATE users SET upgrade_request = $1 WHERE id = $2 RETURNING *",
        [JSON.stringify(upgradeRequest), user.uid],
      );
      res.status(200).json(mapUser(updated[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
