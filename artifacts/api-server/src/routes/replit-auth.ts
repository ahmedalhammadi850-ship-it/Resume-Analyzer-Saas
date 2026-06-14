import { Router } from "express";
import { getUserInfo } from "@replit/repl-auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { FREE_PLAN_LIMIT } from "../lib/constants.js";

const router = Router();

router.get("/replit-auth/login", (req: any, res: any) => {
  const returnTo = (req.query?.returnTo as string) || "/dashboard";
  const host = req.headers?.host || req.hostname || "";
  const protocol = (req.headers?.["x-forwarded-proto"] as string) || "https";
  const returnUrl = encodeURIComponent(`${protocol}://${host}${returnTo}`);
  res.redirect(`https://replit.com/login?goto=${returnUrl}`);
});

router.get("/replit-auth/logout", (req: any, res: any) => {
  req.session?.destroy(() => {
    res.redirect("/");
  });
});

export async function replitAuthMiddleware(req: any, res: any, next: any) {
  const userInfo = getUserInfo(req as any);
  if (!userInfo?.id) {
    next();
    return;
  }

  const id = String(userInfo.id);
  const name = (userInfo as any).name || (userInfo as any).username || "User";
  const email = `${(userInfo as any).name || id}@users.replit.com`;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing.length) {
      await db.insert(usersTable).values({
        id,
        name,
        email,
        plan: "free",
        remainingScans: FREE_PLAN_LIMIT,
        role: "user",
      });
    }

    if ((req.session as any)?.userId !== id) {
      (req.session as any).userId = id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => (err ? reject(err) : resolve()));
      });
    }
  } catch (err) {
    console.error("replitAuthMiddleware error:", err);
  }

  next();
}

export default router;
