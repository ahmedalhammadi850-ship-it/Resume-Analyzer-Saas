import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  requireAuth,
  verifyFirebaseToken,
  firebaseSignIn,
  firebaseSignUp,
  issueJwt,
} from "../_auth.js";
import { firestoreGetUser, firestoreSetUser, type UserProfile } from "../_firestore.js";

const FREE_PLAN_LIMIT = 1;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const slug = (req.query.slug ?? []) as string[];
  const action = slug[0] ?? "me";

  // GET /api/auth/me
  if (action === "me" && req.method === "GET") {
    const payload = requireAuth(req, res);
    if (!payload) return;
    res.status(200).json({
      id: payload.uid,
      name: payload.name,
      email: payload.email,
      plan: payload.plan,
      remainingScans: payload.remainingScans,
      role: payload.role,
    });
    return;
  }

  // POST /api/auth/google
  if (action === "google" && req.method === "POST") {
    const { idToken } = (req.body ?? {}) as { idToken?: string };
    if (!idToken) { res.status(400).json({ error: "idToken is required." }); return; }
    try {
      const fbUser = await verifyFirebaseToken(idToken);
      if (!fbUser) { res.status(401).json({ error: "Invalid Firebase token." }); return; }
      const { uid, email, displayName } = fbUser;
      let userProfile: UserProfile | null = await firestoreGetUser(uid, idToken);
      if (!userProfile) {
        const now = new Date().toISOString();
        userProfile = {
          id: uid,
          name: displayName || email.split("@")[0] || "User",
          email: email.toLowerCase(),
          plan: "free",
          remainingScans: FREE_PLAN_LIMIT,
          role: "user",
          resumeName: null,
          suspended: false,
          upgradeRequest: null,
          createdAt: now,
        };
        await firestoreSetUser(uid, idToken, userProfile);
      }
      if (userProfile.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
      const token = issueJwt(userProfile);
      res.status(200).json({ token, user: userProfile });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Google sign-in failed." });
    }
    return;
  }

  // POST /api/auth/login-email
  if (action === "login-email" && req.method === "POST") {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
    try {
      const fbResult = await firebaseSignIn(email.toLowerCase(), password);
      if (!fbResult) { res.status(503).json({ error: "Firebase is not configured. Please set VITE_FIREBASE_API_KEY." }); return; }
      const { uid, idToken, displayName } = fbResult;
      let userProfile = await firestoreGetUser(uid, idToken);
      if (!userProfile) {
        const now = new Date().toISOString();
        userProfile = {
          id: uid,
          name: displayName || email.split("@")[0] || "User",
          email: email.toLowerCase(),
          plan: "free",
          remainingScans: FREE_PLAN_LIMIT,
          role: "user",
          resumeName: null,
          suspended: false,
          upgradeRequest: null,
          createdAt: now,
        };
        await firestoreSetUser(uid, idToken, userProfile);
      }
      if (userProfile.suspended) { res.status(403).json({ error: "This account has been suspended." }); return; }
      const token = issueJwt(userProfile);
      res.status(200).json({ token, user: userProfile });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (msg.includes("EMAIL_NOT_FOUND") || msg.includes("INVALID_PASSWORD") || msg.includes("INVALID_LOGIN_CREDENTIALS")) {
        res.status(401).json({ error: "Invalid email or password." }); return;
      }
      if (msg.includes("USER_DISABLED")) { res.status(403).json({ error: "This account has been disabled." }); return; }
      if (msg.includes("TOO_MANY_ATTEMPTS")) { res.status(429).json({ error: "Too many failed attempts. Please try again later." }); return; }
      res.status(500).json({ error: msg });
    }
    return;
  }

  // POST /api/auth/register-email
  if (action === "register-email" && req.method === "POST") {
    const { email, password, name } = (req.body ?? {}) as { email?: string; password?: string; name?: string };
    if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
    if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }
    const emailLower = email.toLowerCase();
    const displayName = name?.trim() || emailLower.split("@")[0] || "User";
    try {
      const fbResult = await firebaseSignUp(emailLower, password, displayName);
      if (!fbResult) { res.status(503).json({ error: "Firebase is not configured. Please set VITE_FIREBASE_API_KEY." }); return; }
      const { uid, idToken } = fbResult;
      const existing = await firestoreGetUser(uid, idToken);
      if (existing) {
        const token = issueJwt(existing);
        res.status(200).json({ token, user: existing });
        return;
      }
      const now = new Date().toISOString();
      const userProfile: UserProfile = {
        id: uid,
        name: displayName,
        email: emailLower,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
        resumeName: null,
        suspended: false,
        upgradeRequest: null,
        createdAt: now,
      };
      await firestoreSetUser(uid, idToken, userProfile);
      const token = issueJwt(userProfile);
      res.status(200).json({ token, user: userProfile });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("EMAIL_EXISTS")) { res.status(409).json({ error: "An account with this email already exists." }); return; }
      if (msg.includes("WEAK_PASSWORD")) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }
      res.status(500).json({ error: msg });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
