---
name: Firebase Auth setup
description: Architecture decisions for replacing Replit Auth with Firebase Auth (Email+Password + Google Sign-In)
---

## Architecture

- **Frontend**: `firebase/auth` SDK — `onAuthStateChanged`, `signInWithEmailAndPassword`, `signInWithPopup` (GoogleAuthProvider), `sendPasswordResetEmail`
- **Backend**: `firebase-admin` — `verifyIdToken(token)` in `requireAuth` middleware; no sessions, no cookies
- **API calls**: `auth.currentUser.getIdToken()` → `Authorization: Bearer <token>` header on every request
- **User provisioning**: `GET /api/auth/me` auto-creates DB record on first login

## Key files

- `artifacts/resume-analyzer/src/firebase.ts` — initializes Firebase app
- `artifacts/resume-analyzer/src/contexts/AuthContext.tsx` — `onAuthStateChanged` → calls `/api/auth/me`
- `artifacts/resume-analyzer/src/lib/api.ts` — `getAuthHeaders()` attaches Bearer token
- `artifacts/api-server/src/lib/firebase-admin.ts` — lazy init from `FIREBASE_SERVICE_ACCOUNT` env secret
- `artifacts/api-server/src/lib/auth-middleware.ts` — `requireAuth` / `requireAdmin`

## Env vars required

- `FIREBASE_SERVICE_ACCOUNT` — **Replit Secret** — full service account JSON (from Firebase Console → Service Accounts)
- `VITE_FIREBASE_API_KEY` — **Replit Env Var (shared)** — Firebase web API key (public, safe as env var)
- `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — all set as shared env vars

**Why:** `VITE_*` prefix is required for Vite to embed vars in the client bundle. The `GOOGLE_API_KEY` secret cannot be used directly since it lacks the `VITE_` prefix — a separate `VITE_FIREBASE_API_KEY` must be set with the same value.

## Removed

- `@replit/repl-auth`, `express-session`, `connect-pg-simple`, `cookie-parser` — all removed from api-server
- `artifacts/api-server/src/routes/replit-auth.ts` — deleted
