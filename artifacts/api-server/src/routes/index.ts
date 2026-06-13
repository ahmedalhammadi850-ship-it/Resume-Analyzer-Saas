import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import n8nProxyRouter from "./n8n-proxy.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(n8nProxyRouter);

export default router;
