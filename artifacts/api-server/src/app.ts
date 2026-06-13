import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const pinoHttp =
  typeof pinoHttpModule === "function"
    ? pinoHttpModule
    : (pinoHttpModule as unknown as { default: unknown }).default ?? pinoHttpModule;

const app: Express = express();

app.use(
  (pinoHttp as (opts: Record<string, unknown>) => express.RequestHandler)({
    logger,
    serializers: {
      req(req: Record<string, unknown>) {
        return {
          id: req["id"],
          method: req["method"],
          url: typeof req["url"] === "string" ? req["url"].split("?")[0] : req["url"],
        };
      },
      res(res: Record<string, unknown>) {
        return {
          statusCode: res["statusCode"],
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
