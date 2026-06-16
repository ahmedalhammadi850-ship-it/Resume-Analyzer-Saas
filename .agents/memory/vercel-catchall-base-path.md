---
name: Vercel catch-all routing bug
description: [[...slug]] optional catch-all is unreliable for named sub-paths in Vercel; always use explicit files for static routes.
---

# Vercel `[[...slug]]` Catch-all Routing Bug

## The Rule
Never rely solely on `[[...slug]]` catch-all files for named/static sub-paths in Vercel. Always create explicit `.ts` files for static routes.

**Why:** Two separate failure modes:
1. `[[...slug]]` does NOT reliably match the base directory path (e.g. `/api/analyses` with slug=[]) — use `api/foo.ts` for base path.
2. For named sub-paths (e.g. `/api/users/me`), `req.query.slug` may arrive as a **string** (`"me"`) instead of an **array** (`["me"]`). Casting with `as string[]` makes `slug[0]` = `"m"` (first char), causing all `if (action === "me")` checks to fail → falls through to 404.

**How to apply:**
- Create an explicit file for every static named path: `api/users/me.ts`, `api/admin/stats.ts`, etc.
- Keep catch-all only for dynamic segments with user IDs (e.g. `/api/admin/users/[uid]/plan`).
- If you must use a catch-all, always guard slug with: `const slug = Array.isArray(_s) ? _s : _s ? [_s] : [];`

## Explicit files in this project (replaces catch-all for these paths)
- `api/users/me.ts` — GET/PATCH /api/users/me
- `api/users/upgrade-request.ts` — POST /api/users/upgrade-request
- `api/notifications/unread-count.ts` — GET /api/notifications/unread-count
- `api/notifications/read-all.ts` — PATCH /api/notifications/read-all
- `api/admin/setup.ts` — GET /api/admin/setup
- `api/admin/stats.ts` — GET /api/admin/stats
- `api/admin/users.ts` — GET /api/admin/users
- `api/admin/upgrade-requests.ts` — GET /api/admin/upgrade-requests

## SPA rewrite note
Vercel processes serverless functions BEFORE rewrites, so API routes are never caught by the SPA fallback `/((?!api/.*)` — the negative lookahead is safe but unnecessary for function routes.
