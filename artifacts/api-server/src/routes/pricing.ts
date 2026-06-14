import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

const DEFAULT_PRICING = {
  free: {
    price: 0,
    scanLimit: 1,
    billing: "forever",
    visible: true,
    mostPopular: false,
    features: [
      "تحليل سيرة ذاتية واحدة",
      "ATS Score",
      "تحليل الكلمات المفتاحية",
      "توصيات أساسية",
      "دعم عربي وإنجليزي",
      "رفع PDF و DOCX",
    ],
  },
  starter: {
    price: 3,
    scanLimit: 7,
    billing: "one-time",
    visible: true,
    mostPopular: false,
    features: [
      "7 تحليلات سيرة ذاتية",
      "كل مزايا المجاني",
      "تحليل كامل للكلمات المفتاحية",
      "نصائح تحسين مفصّلة",
      "دعم عربي وإنجليزي",
      "رفع PDF و DOCX",
    ],
  },
  pro: {
    price: 10,
    scanLimit: 25,
    billing: "/month",
    visible: true,
    mostPopular: true,
    features: [
      "25 تحليل شهرياً",
      "كل مزايا Starter",
      "منشئ السيرة الذاتية بالذكاء الاصطناعي",
      "أولوية في التحليل",
      "نصائح متقدمة ومفصّلة",
      "دعم مخصص على مدار الساعة",
    ],
  },
};

router.get("/pricing-config", async (_req, res) => {
  try {
    const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "pricing")).limit(1);
    if (rows.length) {
      res.json(rows[0].value);
    } else {
      res.json(DEFAULT_PRICING);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/pricing-config", requireAdmin, async (req, res) => {
  const patch = req.body as Record<string, unknown>;
  try {
    const existing = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "pricing")).limit(1);
    if (existing.length) {
      const merged = { ...(existing[0].value as Record<string, unknown>), ...patch };
      const [updated] = await db.update(appSettingsTable).set({ value: merged }).where(eq(appSettingsTable.key, "pricing")).returning();
      res.json(updated.value);
    } else {
      const merged = { ...DEFAULT_PRICING, ...patch };
      const [created] = await db.insert(appSettingsTable).values({ key: "pricing", value: merged }).returning();
      res.json(created.value);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
