import { Router, type IRouter } from "express";
import healthRouter from "./health";
import n8nProxyRouter from "./n8n-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(n8nProxyRouter);

export default router;
