import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../lib/auth-middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/n8n-proxy", requireAuth, upload.any(), async (req, res) => {
  const contentType = req.headers["content-type"] ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let webhookUrl: string;
  let forwardBody: BodyInit;
  const forwardHeaders: Record<string, string> = {};

  if (isMultipart) {
    webhookUrl = (req.body as Record<string, string>).webhook_url ?? "";
    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      res.status(400).json({ error: "webhook_url مطلوب" });
      return;
    }

    const form = new FormData();

    for (const [key, value] of Object.entries(req.body as Record<string, string>)) {
      if (key !== "webhook_url") {
        form.append(key, value);
      }
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    for (const file of files) {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      form.append(file.fieldname, blob, file.originalname);
    }

    forwardBody = form;
  } else {
    const { webhook_url, ...body } = req.body as { webhook_url: string; [key: string]: unknown };
    webhookUrl = webhook_url ?? "";
    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      res.status(400).json({ error: "webhook_url مطلوب" });
      return;
    }
    forwardHeaders["Content-Type"] = "application/json";
    forwardBody = JSON.stringify(body);
  }

  try {
    const n8nRes = await fetch(webhookUrl, {
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
