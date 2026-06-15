import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(raw: string): Record<string, unknown> {
  raw = raw.trim().replace(/^\uFEFF/, "");
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try { raw = JSON.parse(raw) as string; } catch {}
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e1) {
    console.error("[firebase-admin] Attempt 1 (direct JSON.parse) failed:", (e1 as Error).message);
  }
  try {
    const fixed = raw.replace(
      /"((?:[^"\\]|\\.|\n|\r)*)"/g,
      (_match, content: string) =>
        '"' + content.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n") + '"',
    );
    return JSON.parse(fixed) as Record<string, unknown>;
  } catch (e2) {
    console.error("[firebase-admin] Attempt 2 (regex fix) failed:", (e2 as Error).message);
  }
  const err = new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
  console.error("[firebase-admin] All parse attempts failed:", err.message);
  throw err;
}

function initApp() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
  const parsed = parseServiceAccount(sa);
  initializeApp({ credential: cert(parsed as Parameters<typeof cert>[0]) });
}

export function getAdminFirestore() {
  try {
    if (getApps().length === 0) initApp();
    return getFirestore();
  } catch (e) {
    console.error("[firebase-admin] getAdminFirestore threw:", (e as Error).message);
    throw e;
  }
}
