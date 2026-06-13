import type { IncomingMessage, ServerResponse } from "node:http";
import { setCors, json } from "./_utils.js";

export default function handler(
  _req: IncomingMessage,
  res: ServerResponse,
): void {
  setCors(res);
  json(res, 200, {
    api: "AI Resume Analyzer",
    version: "1.0.0",
    endpoints: [
      { method: "GET",  path: "/api/healthz" },
      { method: "POST", path: "/api/n8n-proxy" },
    ],
  });
}
