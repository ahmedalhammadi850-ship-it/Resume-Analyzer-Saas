import admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

function initAdmin(): admin.app.App {
  if (adminApp) return adminApp;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
      "Add your Firebase service account JSON as this secret."
    );
  }

  let parsed: admin.ServiceAccount;
  try {
    parsed = JSON.parse(serviceAccount) as admin.ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON.");
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(parsed),
  });

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  return initAdmin().auth();
}

export { admin };
