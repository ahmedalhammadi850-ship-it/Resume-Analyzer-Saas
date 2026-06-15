import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAILS } from "./constants.js";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

/** Verify a Firebase ID token using Firebase REST API (no Admin SDK needed) */
async function verifyFirebaseToken(token: string): Promise<AuthUser | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json() as { users?: Array<{ localId: string; email?: string; displayName?: string }> };
    const user = data.users?.[0];
    if (!user) return null;
    return {
      uid: user.localId,
      email: user.email ?? "",
      name: user.displayName ?? user.email ?? "",
    };
  } catch {
    return null;
  }
}

/** Verify our own JWT (issued for email/password users) */
function verifyOurJwt(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as { uid?: string; email?: string; name?: string };
    if (!payload.uid) return null;
    return { uid: payload.uid, email: payload.email ?? "", name: payload.name ?? "" };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authorization.slice(7);

  // Try our own JWT first (no network call, faster)
  const ourUser = verifyOurJwt(token);
  if (ourUser) {
    req.user = ourUser;
    next();
    return;
  }

  // Try Firebase ID token (Google sign-in)
  const firebaseUser = await verifyFirebaseToken(token);
  if (firebaseUser) {
    req.user = firebaseUser;
    next();
    return;
  }

  res.status(401).json({ error: "Invalid or expired token" });
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const uid = req.user!.uid;
    try {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
      const user = users[0];
      if (!user || (user.role !== "admin" && !ADMIN_EMAILS.includes(user.email))) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });
}
