import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminAuth, getAdminFirestore } from "./_firebase-admin";

export const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthUser | null> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    return { uid: decoded.uid, email: decoded.email ?? "", name: decoded.name ?? decoded.email ?? "" };
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(user.uid).get();
    const data = doc.data();
    if (!data || (data.role !== "admin" && !ADMIN_EMAILS.includes(user.email))) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
    return user;
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    return null;
  }
}
