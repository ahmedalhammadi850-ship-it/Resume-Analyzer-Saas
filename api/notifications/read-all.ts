import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "PATCH") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const db = getAdminFirestore();
    const snap = await db.collection("notifications").where("userId", "==", user.uid).get();
    const batch = db.batch();
    snap.docs
      .filter((d: any) => d.data().read === false)
      .forEach((d: any) => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
