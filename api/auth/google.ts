import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyFirebaseToken, issueJwt } from "../_auth.js";
import { firestoreGetUser, firestoreSetUser, type UserProfile } from "../_firestore.js";

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

  const { idToken } = (req.body ?? {}) as { idToken?: string };
  if (!idToken) { res.status(400).json({ error: "idToken is required." }); return; }

  try {
    // 1. التحقق من Firebase ID token
    const fbUser = await verifyFirebaseToken(idToken);
    if (!fbUser) { res.status(401).json({ error: "Invalid Firebase token." }); return; }

    const { uid, email, displayName } = fbUser;

    // 2. جلب أو إنشاء ملف المستخدم في Firestore
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

    if (userProfile.suspended) {
      res.status(403).json({ error: "This account has been suspended." });
      return;
    }

    // 3. إصدار JWT وإرجاع المستخدم
    const token = issueJwt(userProfile);
    res.status(200).json({ token, user: userProfile });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Google sign-in failed." });
  }
}
