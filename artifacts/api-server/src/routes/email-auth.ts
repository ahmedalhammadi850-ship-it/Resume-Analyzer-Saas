import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";
const JWT_EXPIRES_IN = "30d";
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function issueToken(uid: string, email: string, name: string): string {
  return jwt.sign({ uid, email, name }, SESSION_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

interface FirebaseSignUpResponse {
  localId: string;
  email: string;
  idToken: string;
  error?: { message: string };
}

interface FirebaseSignInResponse {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  error?: { message: string };
}

/** إنشاء مستخدم في Firebase Auth عبر REST API */
async function firebaseSignUp(email: string, password: string, displayName: string): Promise<FirebaseSignUpResponse | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
      },
    );
    const data = await res.json() as FirebaseSignUpResponse;
    if (!res.ok || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

/** تسجيل دخول بالبريد + كلمة المرور عبر Firebase REST API */
async function firebaseSignIn(email: string, password: string): Promise<FirebaseSignInResponse | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    const data = await res.json() as FirebaseSignInResponse;
    if (!res.ok || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── تسجيل حساب جديد ───────────────────────────────────────────────────────
router.post("/auth/register-email", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const emailLower = email.toLowerCase();
  const displayName = name?.trim() || emailLower.split("@")[0] || "User";

  try {
    // 1. تحقق من وجود المستخدم في DB
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    let uid: string;
    let passwordHash: string | undefined;

    // 2. حاول إنشاء المستخدم في Firebase
    const fbResult = await firebaseSignUp(emailLower, password, displayName);

    if (fbResult) {
      // Firebase أنشأ المستخدم — استخدم UID الخاص به
      uid = fbResult.localId;
    } else {
      // Firebase غير متاح — استخدم bcrypt كـ fallback
      uid = crypto.randomUUID();
      passwordHash = await bcrypt.hash(password, 10);
    }

    // 3. أنشئ المستخدم في DB
    const [user] = await db
      .insert(usersTable)
      .values({
        id: uid,
        name: displayName,
        email: emailLower,
        passwordHash: passwordHash ?? null,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
      })
      .returning();

    const token = issueToken(uid, user.email, user.name);
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// ─── تسجيل دخول ────────────────────────────────────────────────────────────
router.post("/auth/login-email", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const emailLower = email.toLowerCase();

  try {
    // 1. حاول التحقق عبر Firebase أولاً
    const fbResult = await firebaseSignIn(emailLower, password);

    if (fbResult) {
      // Firebase نجح — ابحث أو أنشئ المستخدم في DB
      const existing = await db.select().from(usersTable).where(eq(usersTable.id, fbResult.localId)).limit(1);

      let user;
      if (existing.length > 0) {
        user = existing[0];
        if (user.suspended) {
          res.status(403).json({ error: "This account has been suspended." });
          return;
        }
      } else {
        // مستخدم Firebase موجود لكن ليس في DB — أنشئه
        const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
        if (byEmail.length > 0) {
          user = byEmail[0];
          if (user.suspended) {
            res.status(403).json({ error: "This account has been suspended." });
            return;
          }
        } else {
          const [newUser] = await db.insert(usersTable).values({
            id: fbResult.localId,
            name: fbResult.displayName || emailLower.split("@")[0] || "User",
            email: emailLower,
            plan: "free",
            remainingScans: FREE_PLAN_LIMIT,
            role: "user",
          }).returning();
          user = newUser;
        }
      }

      const token = issueToken(user.id, user.email, user.name);
      res.json({ token, user });
      return;
    }

    // 2. Firebase فشل — جرّب bcrypt (مستخدمون قدامى)
    const users = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
    if (users.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = users[0];

    if (user.suspended) {
      res.status(403).json({ error: "This account has been suspended." });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: "This account uses Google sign-in. Please sign in with Google." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = issueToken(user.id, user.email, user.name);
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

export default router;
