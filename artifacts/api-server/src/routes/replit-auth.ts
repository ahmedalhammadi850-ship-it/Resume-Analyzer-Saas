import { Router } from "express";
import { getTokenFromRequest, getUserIdentityFromToken } from "@replit/repl-auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.get("/replit-auth/login", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/replit-auth/callback`;
  res.redirect(
    `https://replit.com/auth_with_repl_site?domain=${req.get("host")}`
  );
});

router.post("/replit-auth/callback", async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(400).json({ error: "No auth token" });
      return;
    }
    const identity = await getUserIdentityFromToken(token);
    if (!identity) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const id = String(identity.id);
    const name = identity.name || identity.username || "User";
    const email = `${identity.username}@users.replit.com`;

    let existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing.length) {
      const [newUser] = await db.insert(usersTable).values({
        id,
        name,
        email,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
      }).returning();
      existing = [newUser];
    }

    (req.session as any).userId = id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    res.redirect("/dashboard");
  } catch (err: any) {
    console.error("Replit Auth callback error:", err);
    res.redirect("/login?error=auth_failed");
  }
});

export default router;
