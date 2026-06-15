import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getAdminAuth } from "../lib/firebase-admin.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

const SALT_ROUNDS = 10;

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
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const adminAuth = getAdminAuth();
    let firebaseUid: string;

    try {
      const fbUser = await adminAuth.createUser({
        email,
        displayName: name?.trim() || email.split("@")[0],
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-exists") {
        const fbUser = await adminAuth.getUserByEmail(email);
        firebaseUid = fbUser.uid;
      } else {
        throw fbErr;
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({
        id: firebaseUid,
        name: name?.trim() || email.split("@")[0] || "User",
        email,
        passwordHash,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { passwordHash },
      })
      .returning();

    const customToken = await adminAuth.createCustomToken(firebaseUid);
    res.json({ customToken, user });
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
      .where(eq(usersTable.email, email))
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

    const adminAuth = getAdminAuth();
    const customToken = await adminAuth.createCustomToken(user.id);
    res.json({ customToken, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

export default router;
