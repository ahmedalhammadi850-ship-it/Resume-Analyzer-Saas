import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { query, mapUser } from "../_db.js";
import { issueJwt } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }

  try {
    const rows = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase()]);
    if (!rows.length) { res.status(401).json({ error: "Invalid email or password." }); return; }

    const row = rows[0] as Record<string, unknown>;
    if (row.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
    if (!row.password_hash) { res.status(401).json({ error: "This account uses Google sign-in." }); return; }

    const valid = await bcrypt.compare(password, row.password_hash as string);
    if (!valid) { res.status(401).json({ error: "Invalid email or password." }); return; }

    const user = mapUser(row);
    const token = issueJwt(row.id as string, row.email as string, row.name as string);
    res.status(200).json({ token, user });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Login failed." });
  }
}
