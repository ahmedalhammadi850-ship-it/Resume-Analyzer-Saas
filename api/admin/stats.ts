import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Key");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  try {
    const [usersSnap, analysesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("analyses").get(),
    ]);
    const users = usersSnap.docs.map((d) => d.data());
    const activeSubscribers = users.filter((u: any) => u.plan === "pro").length;
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = users.filter((u: any) => new Date(u.createdAt) >= monthStart).length;
    res.status(200).json({
      totalUsers: users.length,
      totalAnalyses: analysesSnap.size,
      activeSubscribers,
      monthlyGrowth: newThisMonth,
      monthlyRevenue: activeSubscribers * 19,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
