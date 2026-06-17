import { Router } from "express";
import bcrypt from "bcrypt";
import { getAdminAuth, getAdminFirestore } from "../lib/firebase-admin.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

function toInternalEmail(username: string): string {
  return `${username.toLowerCase().trim()}@cv-analyzer.internal`;
}

router.post("/auth/register-email", async (req, res) => {
  const { username, password, name } = req.body as { username?: string; password?: string; name?: string };
  if (!username || !password) { res.status(400).json({ error: "Username and password are required." }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }

  const usernameLower = username.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,30}$/.test(usernameLower)) {
    res.status(400).json({ error: "Username must be 3–30 characters (letters, numbers, underscores only)." });
    return;
  }

  const displayName = name?.trim() || usernameLower;
  const internalEmail = toInternalEmail(usernameLower);

  try {
    const db = getAdminFirestore();

    const existing = await db.collection("users").where("username", "==", usernameLower).limit(1).get();
    if (!existing.empty) { res.status(409).json({ error: "This username is already taken." }); return; }

    let uid: string;
    let passwordHash: string | undefined;

    try {
      const fbUser = await getAdminAuth().createUser({
        email: internalEmail,
        password,
        displayName,
        emailVerified: true,
      });
      uid = fbUser.uid;
    } catch {
      uid = crypto.randomUUID();
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newUser = {
      name: displayName,
      username: usernameLower,
      email: internalEmail,
      passwordHash: passwordHash ?? null,
      plan: "free",
      remainingScans: FREE_PLAN_LIMIT,
      role: "user",
      suspended: false,
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(uid).set(newUser);

    const customToken = await getAdminAuth().createCustomToken(uid);
    res.json({ customToken, user: { id: uid, ...newUser } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

router.post("/auth/login-email", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) { res.status(400).json({ error: "Username and password are required." }); return; }

  const usernameLower = username.toLowerCase().trim();
  const internalEmail = toInternalEmail(usernameLower);

  try {
    const db = getAdminFirestore();

    // Look up by username field first
    const snap = await db.collection("users").where("username", "==", usernameLower).limit(1).get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const user = doc.data();
      if (user.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }

      // If they have a passwordHash (bcrypt-only user), verify manually
      if (user.passwordHash) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) { res.status(401).json({ error: "Invalid username or password." }); return; }
        const customToken = await getAdminAuth().createCustomToken(doc.id);
        res.json({ customToken, user: { id: doc.id, ...user } });
        return;
      }

      // Firebase Auth user — sign in via Firebase to verify password
      try {
        const fbUser = await getAdminAuth().getUserByEmail(internalEmail);
        if (fbUser.uid !== doc.id) {
          res.status(401).json({ error: "Invalid username or password." });
          return;
        }
        const customToken = await getAdminAuth().createCustomToken(fbUser.uid);
        res.json({ customToken, user: { id: fbUser.uid, ...user } });
        return;
      } catch {
        res.status(401).json({ error: "Invalid username or password." });
        return;
      }
    }

    // Fallback: try Firebase Auth by internal email directly (legacy accounts)
    try {
      const fbUser = await getAdminAuth().getUserByEmail(internalEmail);
      const docRef = await db.collection("users").doc(fbUser.uid).get();
      if (!docRef.exists) {
        res.status(401).json({ error: "Invalid username or password." });
        return;
      }
      const user = docRef.data()!;
      if (user.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
      const customToken = await getAdminAuth().createCustomToken(fbUser.uid);
      res.json({ customToken, user: { id: fbUser.uid, ...user } });
      return;
    } catch {}

    res.status(401).json({ error: "Invalid username or password." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

export default router;
