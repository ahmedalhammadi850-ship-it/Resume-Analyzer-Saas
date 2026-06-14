---
name: Firebase to Replit migration
description: Details of migrating AI Resume Analyzer from Firebase Auth/Firestore to Replit Auth + PostgreSQL
---

## Stack after migration
- Auth: Replit Auth via `@replit/repl-auth` — backend route `/api/replit-auth/login` redirects to `replit.com/auth_with_repl_site`, callback at `/api/replit-auth/callback`
- Session: `express-session` + `connect-pg-simple` backed by PostgreSQL, stored in `session` table
- DB: PostgreSQL via Drizzle ORM (`@workspace/db`), tables: `users`, `analyses`, `app_settings`
- Frontend auth: `AuthContext.tsx` polls `/api/auth/me` — no Firebase SDK on frontend

## Critical build quirk
`pg` must be:
1. Added as a direct dependency to `@workspace/api-server` (`pnpm add pg --filter @workspace/api-server`)
2. Added to the `external` array in `artifacts/api-server/build.mjs` (esbuild doesn't bundle it)

**Why:** `connect-pg-simple` and `pg.Pool` in `app.ts` use `pg` directly; esbuild can't resolve it without it being both installed and externalized.

## Workflows
- `Resume Analyzer API`: `pnpm --filter @workspace/api-server run dev` → port 8080 (console output)
- `Resume Analyzer Frontend`: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/resume-analyzer run dev` → port 5000 (webview)

## UserProfile field rename
`uid` → `id` everywhere (types.ts, all pages, AuthContext). The DB column is `id` (text primary key).

## Frontend API client
All API calls go through `artifacts/resume-analyzer/src/lib/api.ts` using relative `/api/*` paths proxied by Vite to port 8080. File uploads (FormData) go directly to N8N webhooks, not proxied.
