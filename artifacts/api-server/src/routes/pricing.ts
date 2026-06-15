import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
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
    const db = getAdminFirestore();
    const doc = await db.collection("app_settings").doc("pricing").get();
    res.json(doc.exists ? doc.data() : DEFAULT_PRICING);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/pricing-config", requireAdmin, async (req, res) => {
  const patch = req.body as Record<string, unknown>;
  try {
    const db = getAdminFirestore();
    const ref = db.collection("app_settings").doc("pricing");
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update(patch);
    } else {
      await ref.set({ ...DEFAULT_PRICING, ...patch });
    }
    const updated = await ref.get();
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
