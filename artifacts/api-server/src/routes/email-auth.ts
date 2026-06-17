import { Router } from "express";
import bcrypt from "bcrypt";
import { getAdminAuth, getAdminFirestore } from "../lib/firebase-admin.js";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.post("/auth/register-email", async (req, res) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }

  const emailLower = email.toLowerCase();
  const displayName = name?.trim() || emailLower.split("@")[0] || "User";

  try {
    const db = getAdminFirestore();

    const existing = await db.collection("users").where("email", "==", emailLower).limit(1).get();
    if (!existing.empty) { res.status(409).json({ error: "An account with this email already exists." }); return; }

    let uid: string;
    let passwordHash: string | undefined;

    try {
      const fbUser = await getAdminAuth().createUser({ email: emailLower, password, displayName });
      uid = fbUser.uid;
    } catch {
      uid = crypto.randomUUID();
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newUser = {
      name: displayName,
      email: emailLower,
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
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }

  const emailLower = email.toLowerCase();

  try {
    const db = getAdminFirestore();

    try {
      const fbUser = await getAdminAuth().getUserByEmail(emailLower);
      const doc = await db.collection("users").doc(fbUser.uid).get();
      if (!doc.exists) {
        const newUser = {
          name: fbUser.displayName || emailLower.split("@")[0] || "User",
          email: emailLower,
          plan: "free",
          remainingScans: FREE_PLAN_LIMIT,
          role: "user",
          suspended: false,
          createdAt: new Date().toISOString(),
        };
        await db.collection("users").doc(fbUser.uid).set(newUser);
        const customToken = await getAdminAuth().createCustomToken(fbUser.uid);
        res.json({ customToken, user: { id: fbUser.uid, ...newUser } });
        return;
      }
      const user = doc.data()!;
      if (user.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
      const customToken = await getAdminAuth().createCustomToken(fbUser.uid);
      res.json({ customToken, user: { id: fbUser.uid, ...user } });
      return;
    } catch {}

    const snap = await db.collection("users").where("email", "==", emailLower).limit(1).get();
    if (snap.empty) { res.status(401).json({ error: "Invalid email or password." }); return; }
    const doc = snap.docs[0];
    const user = doc.data();
    if (user.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
    if (!user.passwordHash) { res.status(401).json({ error: "This account uses Google sign-in." }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid email or password." }); return; }
    const customToken = await getAdminAuth().createCustomToken(doc.id);
    res.json({ customToken, user: { id: doc.id, ...user } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

export default router;
