import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/n8n-proxy", async (req, res) => {
  const { webhook_url, ...body } = req.body as {
    webhook_url: string;
    [key: string]: unknown;
  };

  if (!webhook_url || !webhook_url.startsWith("https://")) {
    res.status(400).json({ error: "webhook_url مطلوب" });
    return;
  }

  try {
    const n8nRes: any = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType: string = n8nRes.headers.get("content-type") ?? "";

    const isBinary =
      contentType.includes("application/pdf") ||
      contentType.includes("application/vnd") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/zip");

    if (isBinary) {
      const buffer = await n8nRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const disposition: string =
        n8nRes.headers.get("content-disposition") ?? "";
      const nameMatch = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
      const fileName = nameMatch
        ? nameMatch[1].replace(/['"]/g, "").trim()
        : "resume.pdf";
      res.status(200).json({
        type: "file",
        base64,
        mimeType: contentType.split(";")[0].trim(),
        fileName,
      });
      return;
    }

    const rawText: string = await n8nRes.text();

    if (rawText.startsWith("%PDF") || rawText.includes("%%EOF")) {
      const base64 = Buffer.from(rawText, "binary").toString("base64");
      res.status(200).json({
        type: "file",
        base64,
        mimeType: "application/pdf",
        fileName: "resume.pdf",
      });
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

export default app;
