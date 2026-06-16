import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
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
    const snap = await db.collection("users").get();
    const requests = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((u: any) => u.upgradeRequest != null)
      .map((u: any) => {
        const r = u.upgradeRequest;
        return {
          requestId: u.id,
          userId: u.id,
          email: r.email ?? u.email,
          name: r.name ?? u.name,
          status: r.status ?? "pending",
          n8nSent: r.n8nSent ?? false,
          createdAt: r.createdAt ?? "",
          reviewedAt: r.reviewedAt,
        };
      })
      .sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
    res.status(200).json(requests);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
