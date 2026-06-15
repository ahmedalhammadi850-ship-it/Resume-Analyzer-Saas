import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(raw: string): Record<string, unknown> {
  raw = raw.trim().replace(/^\uFEFF/, "");
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try { raw = JSON.parse(raw) as string; } catch {}
  }
  try { return JSON.parse(raw) as Record<string, unknown>; } catch {}
  try {
    const fixed = raw.replace(
      /"((?:[^"\\]|\\.)*)"/g,
      (_match, content: string) =>
        '"' + content.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n") + '"',
    );
    return JSON.parse(fixed) as Record<string, unknown>;
  } catch {}
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
}

export function getAdminAuth() {
  if (getApps().length === 0) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
    initializeApp({ credential: cert(parseServiceAccount(sa) as Parameters<typeof cert>[0]) });
  }
  return getAuth();
}

export function getAdminFirestore() {
  if (getApps().length === 0) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
    initializeApp({ credential: cert(parseServiceAccount(sa) as Parameters<typeof cert>[0]) });
  }
  return getFirestore();
}
