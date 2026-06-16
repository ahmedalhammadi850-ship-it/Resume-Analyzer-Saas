import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "./_auth";
import { getAdminFirestore } from "./_firebase-admin";

const SETTINGS_DEFAULTS = { resumeNameChangeFree: false };

const DEFAULT_PRICING = {
  free: {
    price: 0, scanLimit: 1, billing: "forever", visible: true, mostPopular: false,
    features: ["تحليل سيرة ذاتية واحدة", "ATS Score", "تحليل الكلمات المفتاحية", "توصيات أساسية", "دعم عربي وإنجليزي", "رفع PDF و DOCX"],
  },
  starter: {
    price: 3, scanLimit: 7, billing: "one-time", visible: true, mostPopular: false,
    features: ["7 تحليلات سيرة ذاتية", "كل مزايا المجاني", "تحليل كامل للكلمات المفتاحية", "نصائح تحسين مفصّلة", "دعم عربي وإنجليزي", "رفع PDF و DOCX"],
  },
  pro: {
    price: 10, scanLimit: 25, billing: "/month", visible: true, mostPopular: true,
    features: ["25 تحليل شهرياً", "كل مزايا Starter", "منشئ السيرة الذاتية بالذكاء الاصطناعي", "أولوية في التحليل", "نصائح متقدمة ومفصّلة", "دعم مخصص على مدار الساعة"],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Key");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const url = req.url ?? "";

  if (url.includes("/healthz") || url.includes("/health")) {
    res.status(200).json({ status: "ok" }); return;
  }

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  if (url.includes("pricing-config")) {
    if (req.method === "GET") {
      try {
        const doc = await db.collection("app_settings").doc("pricing").get();
        res.status(200).json(doc.exists ? doc.data() : DEFAULT_PRICING);
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
      }
      return;
    }
    if (req.method === "PATCH") {
      const user = await requireAdmin(req, res);
      if (!user) return;
      const patch = (req.body ?? {}) as Record<string, unknown>;
      try {
        const ref = db.collection("app_settings").doc("pricing");
        const doc = await ref.get();
        if (doc.exists) { await ref.update(patch); } else { await ref.set({ ...DEFAULT_PRICING, ...patch }); }
        const updated = await ref.get();
        res.status(200).json(updated.data());
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
      }
      return;
    }
    res.status(405).json({ error: "Method Not Allowed" }); return;
  }

  if (req.method === "GET") {
    try {
      const doc = await db.collection("app_settings").doc("global").get();
      res.status(200).json(doc.exists ? doc.data() : SETTINGS_DEFAULTS);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const patch = (req.body ?? {}) as Record<string, unknown>;
    try {
      const ref = db.collection("app_settings").doc("global");
      const doc = await ref.get();
      if (doc.exists) { await ref.update(patch); } else { await ref.set({ ...SETTINGS_DEFAULTS, ...patch }); }
      const updated = await ref.get();
      res.status(200).json(updated.data());
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
