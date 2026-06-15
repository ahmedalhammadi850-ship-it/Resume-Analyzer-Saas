import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";
const JWT_EXPIRES_IN = "30d";
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function issueToken(uid: string, email: string, name: string): string {
  return jwt.sign({ uid, email, name }, SESSION_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

router.get("/auth/me", requireAuth, async (req, res) => {
  const { uid, email, name } = req.user!;
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (existing.length) {
      res.json(existing[0]);
      return;
    }
    const [user] = await db.insert(usersTable).values({
      id: uid,
      name: name || email.split("@")[0] || "User",
      email,
      plan: "free",
      remainingScans: FREE_PLAN_LIMIT,
      role: "user",
    }).returning();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/auth/google", async (req, res) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken) {
    res.status(400).json({ error: "idToken مطلوب" });
    return;
  }

  if (!FIREBASE_API_KEY) {
    res.status(500).json({ error: "Firebase غير مهيّأ في البيئة" });
    return;
  }

  try {
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!firebaseRes.ok) {
      res.status(401).json({ error: "توكن Google غير صالح" });
      return;
    }

    const data = await firebaseRes.json() as {
      users?: Array<{ localId: string; email?: string; displayName?: string }>;
    };
    const fbUser = data.users?.[0];
    if (!fbUser) {
      res.status(401).json({ error: "توكن Google غير صالح" });
      return;
    }

    const uid = fbUser.localId;
    const email = fbUser.email ?? "";
    const name = fbUser.displayName ?? email.split("@")[0] ?? "User";

    const existing = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    let user;

    if (existing.length > 0) {
      user = existing[0];
      if (user.suspended) {
        res.status(403).json({ error: "هذا الحساب موقوف." });
        return;
      }
    } else {
      const [newUser] = await db.insert(usersTable).values({
        id: uid,
        name,
        email,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
      }).returning();
      user = newUser;
    }

    const token = issueToken(uid, email, name);
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "فشل تسجيل الدخول بـ Google" });
  }
});

export default router;
