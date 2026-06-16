import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_auth";
import { getAdminFirestore } from "../_firebase-admin";

const FREE_PLAN_LIMIT = 1;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const action = req.query.slug as string;

  if (action === "me" && req.method === "GET") {
    const user = await requireAuth(req, res);
    if (!user) return;
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        res.status(200).json({ id: doc.id, ...doc.data() });
        return;
      }
      const newUser = {
        name: user.name || user.email.split("@")[0] || "User",
        email: user.email,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
        suspended: false,
        createdAt: new Date().toISOString(),
      };
      await db.collection("users").doc(user.uid).set(newUser);
      res.status(200).json({ id: user.uid, ...newUser });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
    }
    return;
  }

  res.status(404).json({ error: "Not found" });
}
