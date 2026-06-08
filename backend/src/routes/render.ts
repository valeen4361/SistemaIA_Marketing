import { Router } from "express";
import crypto from "crypto";
import { renderReelVideo } from "../services/remotionRenderer";
import type { RenderRequestBody } from "../types";

const router = Router();

router.post("/render", async (req, res) => {
  const body = req.body as RenderRequestBody;

  if (!body || !Array.isArray(body.images) || body.images.length === 0) {
    return res.status(400).json({ ok: false, error: "Falta el campo images[]" });
  }
  if (!body.tournamentName || !body.date) {
    return res.status(400).json({
      ok: false,
      error: "Faltan campos requeridos: tournamentName, date",
    });
  }

  const jobId = crypto.randomBytes(6).toString("hex");

  try {
    console.log(`[render:${jobId}] starting with ${body.images.length} images`);
    const result = await renderReelVideo(body, jobId);
    console.log(`[render:${jobId}] done -> ${result.videoPath}`);
    return res.json({ ok: true, jobId, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[render:${jobId}] failed:`, message);
    return res.status(500).json({ ok: false, error: message });
  }
});

export default router;
