import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../_db.js";
import { requireAdmin } from "../_auth.js";

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (req.method === "GET") {
    try {
      const rows = await query("SELECT value FROM app_settings WHERE key = 'pricing' LIMIT 1", []);
      res.status(200).json(rows.length ? rows[0].value : DEFAULT_PRICING);
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
      const existing = await query("SELECT value FROM app_settings WHERE key = 'pricing' LIMIT 1", []);
      if (existing.length) {
        const merged = { ...(existing[0].value as Record<string, unknown>), ...patch };
        const rows = await query(
          "UPDATE app_settings SET value = $1 WHERE key = 'pricing' RETURNING value",
          [JSON.stringify(merged)],
        );
        res.status(200).json(rows[0].value);
      } else {
        const merged = { ...DEFAULT_PRICING, ...patch };
        const rows = await query(
          "INSERT INTO app_settings (key, value) VALUES ('pricing', $1) RETURNING value",
          [JSON.stringify(merged)],
        );
        res.status(200).json(rows[0].value);
      }
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
