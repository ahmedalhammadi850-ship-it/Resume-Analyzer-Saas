import { Router } from "express";

const router = Router();

router.post("/n8n-proxy", async (req, res) => {
  const { webhook_url, ...body } = req.body as { webhook_url: string; [key: string]: unknown };

  if (!webhook_url || !webhook_url.startsWith("https://")) {
    res.status(400).json({ error: "webhook_url مطلوب" });
    return;
  }

  try {
    const n8nRes = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = n8nRes.headers.get("content-type") ?? "";

    // Binary file (PDF, docx, etc.) — convert to base64 and return with metadata
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
      res.status(200).json({
        type: "file",
        base64,
        mimeType: contentType.split(";")[0].trim(),
        fileName,
      });
      return;
    }

    // Text / JSON response
    const rawText = await n8nRes.text();

    // If the raw text starts with %PDF (PDF sent as plain text/binary mistakenly)
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

    // Try JSON parse
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
