import { type Request, type Response, type NextFunction } from "express";
import { getAdminAuth } from "./firebase-admin.js";
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

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authorization.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || decoded.email || "",
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
