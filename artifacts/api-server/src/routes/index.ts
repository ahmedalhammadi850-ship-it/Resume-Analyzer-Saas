import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import n8nProxyRouter from "./n8n-proxy.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import analysesRouter from "./analyses.js";
import settingsRouter from "./settings.js";
import pricingRouter from "./pricing.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(analysesRouter);
router.use(settingsRouter);
router.use(pricingRouter);
router.use(n8nProxyRouter);

export default router;
