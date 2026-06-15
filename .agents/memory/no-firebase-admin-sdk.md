---
name: No Firebase Admin SDK — FIREBASE_SERVICE_ACCOUNT eliminated
description: Auth works without Firebase Admin SDK; email/password uses bcrypt+JWT; Google uses Firebase REST API
---

## The Rule
Do NOT use `firebase-admin` SDK or require `FIREBASE_SERVICE_ACCOUNT`. The project has eliminated this dependency entirely.

## Architecture
- **Email/password users**: bcrypt verify in `email-auth.ts` → issue JWT signed with `SESSION_SECRET` (30d expiry)
- **Google users**: frontend Firebase SDK gets ID token → backend verifies via `POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=VITE_FIREBASE_API_KEY`
- **auth-middleware.ts**: tries our JWT first (fast, no network), then Firebase REST API (for Google tokens)
- User IDs for email/password: `crypto.randomUUID()` (stored in PostgreSQL)
- User IDs for Google: Firebase UID

## Why
User could not obtain the Firebase Service Account JSON from Firebase Console, and entered the Web API key by mistake. Solution: replace Admin SDK with REST API for verification and jsonwebtoken for email/password sessions.

## Env vars used
- `SESSION_SECRET` — signs our JWTs
- `VITE_FIREBASE_API_KEY` — used on backend to call Firebase REST API for Google token verification
