import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const { webhook_url, ...rest } = body;

  if (!webhook_url || typeof webhook_url !== "string" || !webhook_url.startsWith("https://")) {
    res.status(400).json({ error: "webhook_url مطلوب" });
    return;
  }

  const fileKeys = Object.keys(rest).filter((k) => k.endsWith("__base64"));
  const hasFiles = fileKeys.length > 0;

  let forwardBody: BodyInit;
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
      const fileName = nameMatch ? nameMatch[1].replace(/['"]/g, "").trim() : "resume.pdf";
      res.status(200).json({ type: "file", base64, mimeType: contentType.split(";")[0].trim(), fileName });
      return;
    }

    const rawText = await n8nRes.text();
    if (rawText.startsWith("%PDF") || rawText.includes("%%EOF")) {
      const base64 = Buffer.from(rawText, "binary").toString("base64");
      res.status(200).json({ type: "file", base64, mimeType: "application/pdf", fileName: "resume.pdf" });
      return;
    }

    try {
      res.status(200).json(JSON.parse(rawText));
    } catch {
      res.status(200).json({ message: rawText });
    }
  } catch (err: unknown) {
    res.status(502).json({ error: `تعذّر الاتصال بـ N8N: ${err instanceof Error ? err.message : String(err)}` });
  }
}
