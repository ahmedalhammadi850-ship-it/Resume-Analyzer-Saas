import { Router } from "express";
import { getAdminFirestore } from "../lib/firebase-admin.js";
import { requireAdmin } from "../lib/auth-middleware.js";

const router = Router();

router.get("/settings", async (_req, res) => {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("app_settings").doc("global").get();
    res.json(doc.exists ? doc.data() : { resumeNameChangeFree: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/settings", requireAdmin, async (req, res) => {
  const patch = req.body as Record<string, unknown>;
  try {
    const db = getAdminFirestore();
    const ref = db.collection("app_settings").doc("global");
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update(patch);
    } else {
      await ref.set({ resumeNameChangeFree: false, ...patch });
    }
    const updated = await ref.get();
    res.json(updated.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
