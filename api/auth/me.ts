import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth.js";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const payload = requireAuth(req, res);
  if (!payload) return;

  // الـ JWT يحتوي على بيانات المستخدم الكاملة — إرجاعها مباشرة
  res.status(200).json({
    id: payload.uid,
    name: payload.name,
    email: payload.email,
    plan: payload.plan,
    remainingScans: payload.remainingScans,
    role: payload.role,
  });
}
