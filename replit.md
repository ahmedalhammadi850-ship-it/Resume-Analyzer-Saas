# AI Resume Analyzer

منصة SaaS لتحليل السير الذاتية باستخدام الذكاء الاصطناعي — المستخدم يرفع CV ويقارنه بوصف وظيفي ليحصل على ATS score وتوصيات تحسين.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل API server (port 8080)
- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/resume-analyzer run dev` — تشغيل الواجهة (port 5000)
- `pnpm run typecheck` — فحص TypeScript لجميع الحزم
- `pnpm run build` — بناء كامل

## Stack

- pnpm workspaces، Node.js، TypeScript 5.9
- API: Express 5 — port 8080
- Frontend: React 19 + Vite — port 5000 (يوجّه `/api` إلى port 8080)
- Auth + DB: Firebase Auth + Firestore (عبر Firebase Admin SDK في الـ backend)
- AI: n8n webhooks عبر proxy محمي بالمصادقة
- i18n: i18next (عربي + إنجليزي)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/resume-analyzer/` — الواجهة (React/Vite)
- `artifacts/api-server/` — الـ backend (Express)

## Architecture decisions

- لا PostgreSQL ولا Drizzle — كل البيانات في Firestore
- Firebase Auth هو مصدر الحقيقة للمصادقة
  - Google: `signInWithPopup` → Firebase ID token مباشرة
  - Email/password: POST `/api/auth/login-email` → server يعيد `customToken` → `signInWithCustomToken`
- الـ backend يتحقق من الهوية عبر `verifyIdToken` (Firebase Admin SDK)
- الـ frontend يرسل `Authorization: Bearer <idToken>` مع كل طلب
- `firebase-admin` مُخرَّج (externalized) في `build.mjs` — لا يُبنى داخل الـ bundle
- الـ admin access يتحقق من `role === "admin"` في Firestore أو قائمة `ADMIN_EMAILS` في `constants.ts`
- أول مستخدم يمكنه ترقية نفسه لأدمن عبر `GET /api/admin/setup` (يعمل فقط إذا لا يوجد أدمن بعد)

## Environment Variables

### Backend (Replit Secrets / Vercel Env Vars)
- `FIREBASE_SERVICE_ACCOUNT` — محتوى ملف service account JSON من Firebase Console

### Frontend (VITE_* — تُشحن للمتصفح)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Product

- تحليل السيرة الذاتية مقابل وصف وظيفي (ATS score + keyword gaps)
- مراجعة عامة للـ CV
- بناء السيرة الذاتية
- نظام اشتراكات (Free / Starter / Pro)
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
- `firebase-admin` يُحمَّل كـ external في esbuild — يجب أن يكون مثبّتاً في node_modules وقت التشغيل
- لا تستخدم `VITE_*` للأسرار — يُشحن للمتصفح
- الـ Firestore queries التي تجمع `where` + `orderBy` قد تحتاج composite indexes — أنشئها من Firebase Console إذا ظهر خطأ

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Firebase Admin: `artifacts/api-server/src/lib/firebase-admin.ts`
- Auth middleware: `artifacts/api-server/src/lib/auth-middleware.ts`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/resume-analyzer/src/pages/`
- Auth context: `artifacts/resume-analyzer/src/contexts/AuthContext.tsx`
