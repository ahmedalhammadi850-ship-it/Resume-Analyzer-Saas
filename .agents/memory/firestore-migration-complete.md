---
name: Full Firestore Migration
description: The api-server is fully migrated to Firebase Auth + Firestore — no PostgreSQL, no Drizzle, no JWT.
---

## Rule
The api-server has zero PostgreSQL/Drizzle/JWT dependencies. All data lives in Firestore. Never re-add `@workspace/db`, `drizzle-orm`, `pg`, or `jsonwebtoken` to `artifacts/api-server/package.json`.

**Why:** User explicitly chose Firebase Auth + Firestore as the only data/auth layer. PostgreSQL was provisioned by Replit but is not used by this app.

**How to apply:**
- Backend auth: `getAdminAuth().verifyIdToken(token)` in `auth-middleware.ts`
- Backend data: `getAdminFirestore().collection(...)` in all routes
- Frontend auth state: `onAuthStateChanged` in `AuthContext.tsx`
- Frontend API calls: `auth.currentUser.getIdToken()` → `Authorization: Bearer <token>`
- Email login flow: POST `/api/auth/login-email` → server returns `customToken` → `signInWithCustomToken(auth, customToken)`
- `firebase-admin` must remain in `external[]` in `build.mjs` (loads native grpc modules dynamically)

## Firestore collections
- `users/{uid}` — profile, plan, role, remainingScans, suspended, upgradeRequest
- `analyses/{id}` — userId, analysisType, fileName, results, score, createdAt
- `notifications/{id}` — userId, title, message, type, read, createdAt
- `app_settings/global` — resumeNameChangeFree
- `app_settings/pricing` — free/starter/pro plan config

## Composite indexes needed (create in Firebase Console if query errors appear)
- `notifications`: userId + read + createdAt
- `analyses`: userId + createdAt
