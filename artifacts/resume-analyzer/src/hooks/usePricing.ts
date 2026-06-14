import { useState, useEffect } from "react";
import { type PricingConfig } from "@/types";

const DEFAULT_PRICING: PricingConfig = {
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

let cached: PricingConfig | null = null;

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(cached ?? DEFAULT_PRICING);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    fetch("/api/pricing-config")
      .then(r => r.json())
      .then(data => {
        cached = data;
        setPricing(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { pricing, loading };
}

export function invalidatePricingCache() {
  cached = null;
}
