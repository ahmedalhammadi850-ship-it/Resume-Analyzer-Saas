---
name: Vercel catch-all base path bug
description: [[...slug]] optional catch-all doesn't match the base directory path in Vercel; routes with slugs work but base paths 404
---

In Vercel serverless functions, `api/foo/[[...slug]].ts` (optional catch-all) is supposed to match both `/api/foo` and `/api/foo/bar`. In practice, it reliably matches paths WITH slug segments (e.g. `/api/auth/me` where slug=["me"]) but NOT the base path without any segments (`/api/analyses` with slug=[]).

**Why:** Vercel's internal routing may not resolve the optional catch-all for the exact directory base path in all configurations. Routes like `/api/auth/me` worked because they always include a slug.

**How to apply:** When a `[[...slug]].ts` file needs to handle the base path (no additional segments), split it into:
- `api/foo.ts` — handles `GET /api/foo`, `POST /api/foo` (base path operations)
- `api/foo/[id].ts` — handles `GET /api/foo/:id` (per-ID operations)

The `[[...slug]].ts` catch-all can remain for sub-paths that always have slugs (like `/unread-count`, `/read-all`).

Also: simplify `vercel.json` SPA rewrite from complex negative-lookahead regex `/((?!api/).*)` to plain `/(.*)`  → since Vercel processes serverless functions BEFORE rewrites, API routes are never caught by the SPA fallback.
