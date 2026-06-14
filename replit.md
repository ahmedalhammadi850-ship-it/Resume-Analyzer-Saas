# AI Resume Analyzer

منصة SaaS لتحليل السير الذاتية باستخدام الذكاء الاصطناعي — المستخدم يرفع CV ويقارنه بوصف وظيفي ليحصل على ATS score وتوصيات تحسين.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل API server (port 8080)
- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/resume-analyzer run dev` — تشغيل الواجهة (port 5000)
- `pnpm run typecheck` — فحص TypeScript لجميع الحزم
- `pnpm run build` — بناء كامل
- `pnpm --filter @workspace/api-spec run codegen` — إعادة توليد API hooks من OpenAPI spec
- `pnpm --filter @workspace/db run push` — تطبيق تغييرات DB schema

## Stack

- pnpm workspaces، Node.js، TypeScript 5.9
- API: Express 5 — port 8080
- Frontend: React 19 + Vite — port 5000 (يوجّه `/api` إلى port 8080)
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (`@replit/repl-auth`) + express-session مخزّن في Postgres
- Validation: Zod (`zod/v4`)، `drizzle-zod`
- AI: n8n webhooks عبر proxy محمي بالمصادقة
- i18n: i18next (عربي + إنجليزي)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/resume-analyzer/` — الواجهة (React/Vite)
- `artifacts/api-server/` — الـ backend (Express)
- `lib/db/` — Drizzle schema + client (source of truth للـ DB)
- `lib/api-spec/` — OpenAPI spec
- `lib/api-client-react/` + `lib/api-zod/` — auto-generated من codegen

## Architecture decisions

- Firebase كان مستخدماً لكن استُبدل بـ Replit Auth + PostgreSQL
- الـ n8n webhooks تُستدعى فقط من الـ backend proxy (لا مباشرة من المتصفح)
- الـ session مخزّنة في Postgres عبر `connect-pg-simple`
- الـ admin access يتحقق من `role === "admin"` في DB أو قائمة `ADMIN_EMAILS` في `constants.ts`
- أول مستخدم يمكنه ترقية نفسه لأدمن عبر `GET /api/admin/setup` (يعمل فقط إذا لا يوجد أدمن بعد)

## Product

- تحليل السيرة الذاتية مقابل وصف وظيفي (ATS score + keyword gaps)
- مراجعة عامة للـ CV
- بناء السيرة الذاتية
- نظام اشتراكات (Free / Pro)
- لوحة إدارة كاملة للـ admin

## Admin Dashboard

الوصول لـ `/admin`:
1. سجّل الدخول أولاً
2. افتح `/api/admin/setup` في المتصفح (يعمل فقط إذا لا يوجد أدمن) لترقية نفسك
3. أو أضف email في `ADMIN_EMAILS` داخل `artifacts/api-server/src/lib/constants.ts`

الميزات: إحصائيات، إدارة مستخدمين (تغيير خطة/دور/تعليق/حذف)، طلبات الترقية، إعدادات النظام.

## User preferences

_اضف تفضيلاتك هنا_

## Gotchas

- Vite يوجّه `/api/*` إلى `localhost:8080` (محدد في `vite.config.ts`)
- الـ session secret في `SESSION_SECRET` — يوجد fallback للتطوير فقط
- `pnpm approve-builds` مطلوب إذا أضفت packages ببناء scripts جديدة
- لا تستخدم `VITE_*` للأسرار — يُشحن للمتصفح

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema: `lib/db/src/schema/index.ts`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/resume-analyzer/src/pages/`
