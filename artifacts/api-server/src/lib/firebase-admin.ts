import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";

let adminApp: App | null = null;

function parseServiceAccount(raw: string): Record<string, unknown> {
  raw = raw.trim().replace(/^\uFEFF/, ""); // strip BOM

  // Handle double-encoded JSON (value wrapped in extra outer quotes)
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      raw = JSON.parse(raw) as string;
    } catch {}
  }

  // Try direct parse first (normal case)
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {}

  // Fallback: fix actual newlines inside JSON string values
  // (happens when private_key has real \n characters instead of escape sequences)
  try {
    const fixed = raw.replace(
      /"((?:[^"\\]|\\.)*)"/g,
      (_match, content: string) =>
        '"' + content.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n") + '"',
    );
    return JSON.parse(fixed) as Record<string, unknown>;
  } catch {}

  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT is not valid JSON. " +
    "Go to Firebase Console → Project Settings → Service Accounts → Generate new private key, " +
    "then copy the entire JSON file content and paste it as the secret value.",
  );
}

function initAdmin(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
      "Add your Firebase service account JSON as this secret.",
    );
  }

  const parsed = parseServiceAccount(serviceAccount);

  adminApp = initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  initAdmin();
  return getAuth();
}
