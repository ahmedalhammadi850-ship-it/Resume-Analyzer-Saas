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

    const rawText = await n8nRes.text();

    // Try to parse as JSON; if not, return as plain text message
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
