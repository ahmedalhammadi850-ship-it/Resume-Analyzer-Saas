import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "./_auth";
import { getAdminFirestore } from "./_firebase-admin";

const DEFAULTS = { resumeNameChangeFree: false };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const db = getAdminFirestore();

  if (req.method === "GET") {
    try {
      const doc = await db.collection("app_settings").doc("global").get();
      res.status(200).json(doc.exists ? doc.data() : DEFAULTS);
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
      if (doc.exists) {
        await ref.update(patch);
      } else {
        await ref.set({ ...DEFAULTS, ...patch });
      }
      const updated = await ref.get();
      res.status(200).json(updated.data());
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
