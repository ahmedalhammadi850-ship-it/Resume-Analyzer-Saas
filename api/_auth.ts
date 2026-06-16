import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createVerify } from "node:crypto";
import { getAdminFirestore } from "./_firebase-admin";

export const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];
export const ADMIN_API_KEY = "admin7707";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.trim().toLowerCase() === normalized);
}

// Cache Google's Firebase public keys (rotated every ~6h by Google)
let _keysCache: Record<string, string> = {};
let _keysCacheExpiry = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  if (Date.now() < _keysCacheExpiry && Object.keys(_keysCache).length > 0) {
    return _keysCache;
  }
  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
  );
  const maxAge = res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1];
  _keysCacheExpiry = Date.now() + (maxAge ? parseInt(maxAge, 10) * 1000 : 3_600_000);
  _keysCache = (await res.json()) as Record<string, string>;
  return _keysCache;
}

async function verifyFirebaseToken(idToken: string): Promise<AuthUser> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as {
    kid: string;
    alg: string;
  };
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
    sub: string;
    email?: string;
    name?: string;
    iss: string;
    aud: string;
    exp: number;
    iat: number;
  };

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) throw new Error("Token expired");
  if (payload.iat > now + 300) throw new Error("Token issued in the future");
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Invalid issuer");
  }
  if (projectId && payload.aud !== projectId) throw new Error("Invalid audience");
  if (!payload.sub) throw new Error("Missing subject");
  if (header.alg !== "RS256") throw new Error("Unexpected algorithm");

  const keys = await getGooglePublicKeys();
  const cert = keys[header.kid];
  if (!cert) throw new Error("Unknown signing key ID");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  const valid = verifier.verify(cert, parts[2], "base64url");
  if (!valid) throw new Error("Invalid token signature");

  return {
    uid: payload.sub,
    email: payload.email ?? "",
    name: payload.name ?? payload.email ?? "",
  };
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthUser | null> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  try {
    return await verifyFirebaseToken(authorization.slice(7));
  } catch (e) {
    console.error("[auth] verifyFirebaseToken failed:", (e as Error).message);
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthUser | null> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey && adminKey === ADMIN_API_KEY) {
    return { uid: "admin", email: ADMIN_EMAILS[0], name: "Admin" };
  }

  const user = await requireAuth(req, res);
  if (!user) return null;
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(user.uid).get();
    const data = doc.data();
    // Check role OR email (JWT email or Firestore email) — case-insensitive
    const firestoreEmail = (data?.email as string) ?? "";
    const isAdmin =
      data?.role === "admin" ||
      isAdminEmail(user.email) ||
      isAdminEmail(firestoreEmail);
    if (!data || !isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
    return user;
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    return null;
  }
}
