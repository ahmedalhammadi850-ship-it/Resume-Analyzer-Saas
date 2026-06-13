import type { IncomingMessage, ServerResponse } from "node:http";
import { parseJsonBody, setCors, json } from "./_utils.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method Not Allowed" });
    return;
  }

  const body = await parseJsonBody<{ webhook_url: string; [key: string]: unknown }>(req);
  const { webhook_url, ...payload } = body;

  if (!webhook_url || !webhook_url.startsWith("https://")) {
    json(res, 400, { error: "webhook_url مطلوب" });
    return;
  }

  try {
    const n8nRes = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = n8nRes.headers.get("content-type") ?? "";

    const isBinary =
      contentType.includes("application/pdf") ||
      contentType.includes("application/vnd") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/zip");

    if (isBinary) {
      const buffer = await n8nRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const disposition = n8nRes.headers.get("content-disposition") ?? "";
      const nameMatch = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
      const fileName = nameMatch
        ? nameMatch[1].replace(/['"]/g, "").trim()
        : "resume.pdf";
      json(res, 200, {
        type: "file",
        base64,
        mimeType: contentType.split(";")[0].trim(),
        fileName,
      });
      return;
    }

    const rawText = await n8nRes.text();

    if (rawText.startsWith("%PDF") || rawText.includes("%%EOF")) {
      const base64 = Buffer.from(rawText, "binary").toString("base64");
      json(res, 200, {
        type: "file",
        base64,
        mimeType: "application/pdf",
        fileName: "resume.pdf",
      });
      return;
    }

    try {
      const parsed = JSON.parse(rawText);
      json(res, 200, parsed);
    } catch {
      json(res, 200, { message: rawText });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    json(res, 502, { error: `تعذّر الاتصال بـ N8N: ${message}` });
  }
}
