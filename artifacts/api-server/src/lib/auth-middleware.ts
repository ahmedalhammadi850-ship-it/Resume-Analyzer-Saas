import { type Request, type Response, type NextFunction } from "express";
import { getAdminAuth, getAdminFirestore } from "./firebase-admin.js";
import { ADMIN_EMAILS, ADMIN_API_KEY } from "./constants.js";

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
      email: decoded.email ?? "",
      name: decoded.name ?? decoded.email ?? "",
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey && adminKey === ADMIN_API_KEY) {
    next();
    return;
  }

  await requireAuth(req, res, async () => {
    const uid = req.user!.uid;
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(uid).get();
      const user = doc.data();
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
