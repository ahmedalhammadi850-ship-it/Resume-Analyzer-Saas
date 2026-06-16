import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../_auth";
import { getAdminFirestore } from "../../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Key");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const _s = req.query.slug;
  const slug: string[] = Array.isArray(_s) ? _s : _s ? [_s] : [];
  const [requestId, action] = slug;

  if (!requestId || !["approve", "reject"].includes(action) || req.method !== "PATCH") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch {
    res.status(503).json({ error: "Database unavailable" }); return;
  }

  try {
    const doc = await db.collection("users").doc(requestId).get();
    if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }

    const existing = (doc.data()?.upgradeRequest as Record<string, unknown>) ?? {};
    const now = new Date().toISOString();

    if (action === "approve") {
      await db.collection("users").doc(requestId).update({
        plan: "pro",
        remainingScans: 25,
        upgradeRequest: { ...existing, status: "approved", reviewedAt: now },
      });
    } else {
      await db.collection("users").doc(requestId).update({
        upgradeRequest: { ...existing, status: "rejected", reviewedAt: now },
      });
    }

    const updated = await db.collection("users").doc(requestId).get();
    res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
