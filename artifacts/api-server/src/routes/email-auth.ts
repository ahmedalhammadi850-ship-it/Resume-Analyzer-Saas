import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

const SALT_ROUNDS = 10;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";
const JWT_EXPIRES_IN = "30d";

function issueToken(uid: string, email: string, name: string): string {
  return jwt.sign({ uid, email, name }, SESSION_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

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

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const uid = crypto.randomUUID();
    const displayName = name?.trim() || email.split("@")[0] || "User";
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({
        id: uid,
        name: displayName,
        email: email.toLowerCase(),
        passwordHash,
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

router.post("/auth/login-email", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

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
