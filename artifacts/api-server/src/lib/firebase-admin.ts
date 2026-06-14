import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";

let adminApp: App | null = null;

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
      "Add your Firebase service account JSON as this secret."
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(serviceAccount) as Record<string, unknown>;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON.");
  }

  adminApp = initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  initAdmin();
  return getAuth();
}
