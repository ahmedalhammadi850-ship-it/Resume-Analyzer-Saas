import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { query, mapUser } from "../_db.js";
import { issueJwt } from "../_auth.js";

const FREE_PLAN_LIMIT = 1;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const { email, password, name } = (req.body ?? {}) as {
    email?: string; password?: string; name?: string;
  };

  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase()]);
    if (existing.length > 0) { res.status(409).json({ error: "An account with this email already exists." }); return; }

    const uid = crypto.randomUUID();
    const displayName = name?.trim() || email.split("@")[0] || "User";
    const passwordHash = await bcrypt.hash(password, 10);

    const rows = await query(
      `INSERT INTO users (id, name, email, password_hash, plan, remaining_scans, role)
       VALUES ($1, $2, $3, $4, 'free', $5, 'user') RETURNING *`,
      [uid, displayName, email.toLowerCase(), passwordHash, FREE_PLAN_LIMIT],
    );

    const user = mapUser(rows[0] as Record<string, unknown>);
    const token = issueJwt(uid, user.email as string, user.name as string);
    res.status(200).json({ token, user });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Registration failed." });
  }
}
