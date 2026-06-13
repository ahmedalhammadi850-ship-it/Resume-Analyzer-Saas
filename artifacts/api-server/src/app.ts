import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// pino-http uses worker threads which crash in Vercel serverless — skip it there
if (!process.env["VERCEL"]) {
  // Dynamic import to avoid crashing in environments where worker_threads is limited
  const pinoHttpModule = await import("pino-http");
  const { logger } = await import("./lib/logger");

  const pinoHttp =
    typeof pinoHttpModule === "function"
      ? pinoHttpModule
      : (pinoHttpModule as unknown as { default: unknown }).default ?? pinoHttpModule;

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
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
