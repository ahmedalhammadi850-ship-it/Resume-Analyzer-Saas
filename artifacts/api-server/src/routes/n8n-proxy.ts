import { Router } from "express";
import { requireAuth } from "../lib/auth-middleware.js";

const router = Router();

const ALLOWED_N8N_DOMAINS = [
  "n8n.cloud",
  "app.n8n.cloud",
];

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_N8N_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

router.post("/n8n-proxy", requireAuth, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const { webhook_url, ...rest } = body;

  if (!webhook_url || typeof webhook_url !== "string") {
    res.status(400).json({ error: "webhook_url مطلوب" });
    return;
  }

  if (!isAllowedWebhookUrl(webhook_url)) {
    res.status(400).json({ error: "webhook_url غير مسموح به" });
    return;
  }

  const fileKeys = Object.keys(rest).filter((k) => k.endsWith("__base64"));
  const hasFiles = fileKeys.length > 0;

  if (hasFiles) {
    for (const base64Key of fileKeys) {
      const fieldName = base64Key.replace("__base64", "");
      const mimeType = (rest[`${fieldName}__type`] as string) || "";
      const base64 = rest[base64Key] as string;

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        res.status(400).json({ error: `نوع الملف غير مدعوم: ${mimeType}` });
        return;
      }

      const estimatedSize = Math.floor((base64.length * 3) / 4);
      if (estimatedSize > MAX_FILE_SIZE_BYTES) {
        res.status(400).json({ error: "حجم الملف يتجاوز الحد المسموح (5MB)" });
        return;
      }
    }
  }

  let forwardBody: string | FormData;
  const forwardHeaders: Record<string, string> = {};

  if (hasFiles) {
    const form = new FormData();

    for (const base64Key of fileKeys) {
      const fieldName = base64Key.replace("__base64", "");
      const base64 = rest[base64Key] as string;
      const fileName = (rest[`${fieldName}__name`] as string) || fieldName;
      const mimeType = (rest[`${fieldName}__type`] as string) || "application/octet-stream";

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      form.append(fieldName, blob, fileName);
    }

    for (const [key, value] of Object.entries(rest)) {
      if (!key.endsWith("__base64") && !key.endsWith("__name") && !key.endsWith("__type")) {
        form.append(key, String(value));
      }
    }

    forwardBody = form;
  } else {
    forwardHeaders["Content-Type"] = "application/json";
    forwardBody = JSON.stringify(rest);
  }

  try {
    const n8nRes = await fetch(webhook_url, {
      method: "POST",
      headers: forwardHeaders,
      body: forwardBody,
    });

    const respContentType: string = n8nRes.headers.get("content-type") ?? "";

    const isBinary =
      respContentType.includes("application/pdf") ||
      respContentType.includes("application/vnd") ||
      respContentType.includes("application/octet-stream") ||
      respContentType.includes("application/zip");

    if (isBinary) {
      const buffer = await n8nRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const disposition: string = n8nRes.headers.get("content-disposition") ?? "";
      const nameMatch = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
      const fileName = nameMatch ? nameMatch[1].replace(/['"]/g, "").trim() : "resume.pdf";
      res.status(200).json({ type: "file", base64, mimeType: respContentType.split(";")[0].trim(), fileName });
      return;
    }

    const rawText: string = await n8nRes.text();

    if (rawText.startsWith("%PDF") || rawText.includes("%%EOF")) {
      const base64 = Buffer.from(rawText, "binary").toString("base64");
      res.status(200).json({ type: "file", base64, mimeType: "application/pdf", fileName: "resume.pdf" });
      return;
    }

    try {
      const json = JSON.parse(rawText);
      res.status(200).json(json);
    } catch {
      res.status(200).json({ message: rawText });
    }
  } catch (err: any) {
    res.status(502).json({ error: `تعذّر الاتصال بـ N8N: ${err.message}` });
  }
});

export default router;
