import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(raw: string): Record<string, unknown> {
  raw = raw.trim().replace(/^\uFEFF/, "");
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try { raw = JSON.parse(raw) as string; } catch {}
  }

  // Attempt 1: direct JSON.parse
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e1) {
    console.error("[firebase-admin] Attempt 1 (direct JSON.parse) failed:", (e1 as Error).message);
  }

  // Attempt 2: fix literal newlines inside JSON string values
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

  const err = new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Check private_key formatting.");
  console.error("[firebase-admin] All parse attempts failed. Throwing:", err.message);
  throw err;
}

function initApp() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) {
    const err = new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
    console.error("[firebase-admin] FATAL:", err.message);
    throw err;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = parseServiceAccount(sa);
  } catch (e) {
    console.error("[firebase-admin] parseServiceAccount threw:", (e as Error).message);
    throw e;
  }
  const pk = parsed.private_key as string | undefined;
  console.log("[firebase-admin] project_id:", parsed.project_id);
  console.log("[firebase-admin] private_key present:", !!pk);
  console.log("[firebase-admin] private_key length:", pk?.length ?? 0);
  console.log("[firebase-admin] private_key starts with:", pk?.slice(0, 27));
  console.log("[firebase-admin] private_key has real newlines:", pk?.includes("\n"));
  try {
    initializeApp({ credential: cert(parsed as Parameters<typeof cert>[0]) });
    console.log("[firebase-admin] initializeApp: OK");
  } catch (e) {
    console.error("[firebase-admin] initializeApp FAILED:", (e as Error).message);
    throw e;
  }
}

export function getAdminAuth() {
  try {
    if (getApps().length === 0) initApp();
    return getAuth();
  } catch (e) {
    console.error("[firebase-admin] getAdminAuth threw:", (e as Error).message);
    throw e;
  }
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
