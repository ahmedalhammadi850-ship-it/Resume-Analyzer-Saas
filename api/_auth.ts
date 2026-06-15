import jwt from "jsonwebtoken";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "./_db.js";

export const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];
const SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, SECRET) as {
      uid?: string;
      email?: string;
      name?: string;
    };
    if (!payload.uid) return null;
    return { uid: payload.uid, email: payload.email ?? "", name: payload.name ?? "" };
  } catch {
    return null;
  }
}

export function issueJwt(uid: string, email: string, name: string): string {
  return jwt.sign({ uid, email, name }, SECRET, { expiresIn: "30d" });
}

export function getAuth(req: VercelRequest): AuthUser | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyJwt(auth.slice(7));
}

export function requireAuth(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = getAuth(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return user;
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthUser | null> {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (ADMIN_EMAILS.includes(user.email)) return user;

  const rows = await query<{ role: string }>(
    "SELECT role FROM users WHERE id = $1",
    [user.uid],
  );
  if (rows[0]?.role === "admin") return user;

  res.status(403).json({ error: "Forbidden" });
  return null;
}
