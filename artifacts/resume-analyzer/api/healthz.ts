import type { IncomingMessage, ServerResponse } from "node:http";
import { setCors, json } from "./_utils";

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "Method Not Allowed" });
    return;
  }

  json(res, 200, { status: "ok" });
}
