import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, mapUser } from "../_db.js";
import { requireAuth, requireAdmin } from "../_auth.js";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const slug = (req.query.slug ?? []) as string[];
  const [section, param1, param2] = slug;

  // GET /api/admin/setup — promote first user to admin (no admin required, just auth)
  if (section === "setup" && req.method === "GET") {
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
    return;
  }

  // All remaining admin routes require admin role
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // GET /api/admin/stats
  if (section === "stats" && req.method === "GET") {
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
    return;
  }

  // GET /api/admin/users — list all users
  if (section === "users" && !param1 && req.method === "GET") {
    try {
      const rows = await query("SELECT * FROM users ORDER BY created_at ASC", []);
      res.status(200).json(rows.map(r => mapUser(r as Record<string, unknown>)));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // DELETE /api/admin/users/:uid
  if (section === "users" && param1 && !param2 && req.method === "DELETE") {
    try {
      await query("DELETE FROM users WHERE id = $1", [param1]);
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/users/:uid/plan
  if (section === "users" && param1 && param2 === "plan" && req.method === "PATCH") {
    const { plan } = (req.body ?? {}) as { plan?: string };
    if (!plan || !["free", "starter", "pro"].includes(plan)) {
      res.status(400).json({ error: "Invalid plan" }); return;
    }
    const scanLimits: Record<string, number> = { free: 1, starter: 7, pro: 25 };
    try {
      const rows = await query(
        "UPDATE users SET plan = $1, remaining_scans = $2 WHERE id = $3 RETURNING *",
        [plan, scanLimits[plan], param1],
      );
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/users/:uid/role
  if (section === "users" && param1 && param2 === "role" && req.method === "PATCH") {
    const { role } = (req.body ?? {}) as { role?: string };
    if (!role || !["user", "admin"].includes(role)) {
      res.status(400).json({ error: "Invalid role" }); return;
    }
    try {
      const rows = await query("UPDATE users SET role = $1 WHERE id = $2 RETURNING *", [role, param1]);
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/users/:uid/scans
  if (section === "users" && param1 && param2 === "scans" && req.method === "PATCH") {
    const { amount } = (req.body ?? {}) as { amount?: number };
    try {
      const current = await query<{ remaining_scans: number }>(
        "SELECT remaining_scans FROM users WHERE id = $1 LIMIT 1", [param1],
      );
      if (!current.length) { res.status(404).json({ error: "User not found" }); return; }
      const newScans = (current[0].remaining_scans ?? 0) + (amount ?? 0);
      const rows = await query(
        "UPDATE users SET remaining_scans = $1 WHERE id = $2 RETURNING *", [newScans, param1],
      );
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/users/:uid/suspend
  if (section === "users" && param1 && param2 === "suspend" && req.method === "PATCH") {
    try {
      const rows = await query("UPDATE users SET suspended = true WHERE id = $1 RETURNING *", [param1]);
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/users/:uid/unsuspend
  if (section === "users" && param1 && param2 === "unsuspend" && req.method === "PATCH") {
    try {
      const rows = await query("UPDATE users SET suspended = false WHERE id = $1 RETURNING *", [param1]);
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // GET /api/admin/upgrade-requests
  if (section === "upgrade-requests" && !param1 && req.method === "GET") {
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
    return;
  }

  // PATCH /api/admin/upgrade-requests/:requestId/approve
  if (section === "upgrade-requests" && param1 && param2 === "approve" && req.method === "PATCH") {
    try {
      const existing = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [param1]);
      if (!existing.length) { res.status(404).json({ error: "User not found" }); return; }
      const row = existing[0] as Record<string, unknown>;
      const current = (row.upgrade_request as Record<string, unknown>) ?? {};
      const updated = { ...current, status: "approved", reviewedAt: new Date().toISOString() };
      const rows = await query(
        "UPDATE users SET plan = 'pro', remaining_scans = 25, upgrade_request = $1 WHERE id = $2 RETURNING *",
        [JSON.stringify(updated), param1],
      );
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  // PATCH /api/admin/upgrade-requests/:requestId/reject
  if (section === "upgrade-requests" && param1 && param2 === "reject" && req.method === "PATCH") {
    try {
      const existing = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [param1]);
      if (!existing.length) { res.status(404).json({ error: "User not found" }); return; }
      const row = existing[0] as Record<string, unknown>;
      const current = (row.upgrade_request as Record<string, unknown>) ?? {};
      const updated = { ...current, status: "rejected", reviewedAt: new Date().toISOString() };
      const rows = await query(
        "UPDATE users SET upgrade_request = $1 WHERE id = $2 RETURNING *",
        [JSON.stringify(updated), param1],
      );
      res.status(200).json(mapUser(rows[0] as Record<string, unknown>));
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
