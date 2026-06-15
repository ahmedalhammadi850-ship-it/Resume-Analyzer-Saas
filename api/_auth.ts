import jwt from "jsonwebtoken";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { UserProfile } from "./_firestore.js";

export const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];
const SECRET = process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod";
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY ?? "";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

export interface JwtPayload extends AuthUser {
  plan: string;
  remainingScans: number;
  role: string;
}

export function issueJwt(profile: UserProfile): string {
  const payload: JwtPayload = {
    uid: profile.id,
    email: profile.email,
    name: profile.name,
    plan: profile.plan,
    remainingScans: profile.remainingScans,
    role: profile.role,
  };
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as Record<string, unknown>;
    if (!payload.uid) return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuth(req: VercelRequest): JwtPayload | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyJwt(auth.slice(7));
}

export function requireAuth(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const user = getAuth(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return user;
}

/** التحقق من Firebase ID token عبر REST API */
export async function verifyFirebaseToken(
  idToken: string,
): Promise<{ uid: string; email: string; displayName: string } | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!r.ok) return null;
    const data = await r.json() as { users?: Array<{ localId: string; email?: string; displayName?: string }> };
    const u = data.users?.[0];
    if (!u) return null;
    return { uid: u.localId, email: u.email ?? "", displayName: u.displayName ?? "" };
  } catch {
    return null;
  }
}

/** إنشاء مستخدم في Firebase Auth عبر REST API */
export async function firebaseSignUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ uid: string; idToken: string } | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
      },
    );
    if (!r.ok) {
      const err = await r.json() as { error?: { message?: string } };
      const msg = err.error?.message ?? "SIGNUP_FAILED";
      throw new Error(msg);
    }
    const d = await r.json() as { localId: string; idToken: string };
    return { uid: d.localId, idToken: d.idToken };
  } catch (e) {
    throw e;
  }
}

/** تسجيل دخول بالبريد + كلمة المرور عبر Firebase REST API */
export async function firebaseSignIn(
  email: string,
  password: string,
): Promise<{ uid: string; idToken: string; displayName: string } | null> {
  if (!FIREBASE_API_KEY) return null;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    if (!r.ok) {
      const err = await r.json() as { error?: { message?: string } };
      const msg = err.error?.message ?? "SIGNIN_FAILED";
      throw new Error(msg);
    }
    const d = await r.json() as { localId: string; idToken: string; displayName?: string };
    return { uid: d.localId, idToken: d.idToken, displayName: d.displayName ?? "" };
  } catch (e) {
    throw e;
  }
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<JwtPayload | null> {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (ADMIN_EMAILS.includes(user.email) || user.role === "admin") return user;
  res.status(403).json({ error: "Forbidden" });
  return null;
}
