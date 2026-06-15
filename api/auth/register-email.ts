import type { VercelRequest, VercelResponse } from "@vercel/node";
import { firebaseSignUp, issueJwt } from "../_auth.js";
import { firestoreSetUser, firestoreGetUser, type UserProfile } from "../_firestore.js";

const FREE_PLAN_LIMIT = 1;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const { email, password, name } = (req.body ?? {}) as {
    email?: string; password?: string; name?: string;
  };

  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters." }); return; }

  const emailLower = email.toLowerCase();
  const displayName = name?.trim() || emailLower.split("@")[0] || "User";

  try {
    // 1. إنشاء المستخدم في Firebase Auth عبر REST API (بدون bcrypt، بدون قاعدة بيانات)
    const fbResult = await firebaseSignUp(emailLower, password, displayName);

    if (!fbResult) {
      res.status(503).json({ error: "Firebase is not configured. Please set VITE_FIREBASE_API_KEY." });
      return;
    }

    const { uid, idToken } = fbResult;

    // 2. فحص إذا كان المستخدم موجوداً مسبقاً في Firestore
    const existing = await firestoreGetUser(uid, idToken);
    if (existing) {
      const token = issueJwt(existing);
      res.status(200).json({ token, user: existing });
      return;
    }

    // 3. إنشاء ملف المستخدم في Firestore
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

    // 4. إصدار JWT وإرجاع المستخدم
    const token = issueJwt(userProfile);
    res.status(200).json({ token, user: userProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed.";
    // Firebase error codes
    if (msg.includes("EMAIL_EXISTS")) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    if (msg.includes("WEAK_PASSWORD")) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }
    res.status(500).json({ error: msg });
  }
}
