import { Router } from "express";
import path from "path";
import { config } from "../config";
import { publishToMultiplePlatforms, type Platform, PLATFORM_LABELS } from "../services/platforms";

const router = Router();

router.post("/publish", async (req, res) => {
  const { imagePath, title, user, platforms } = req.body ?? {};

  if (!imagePath || typeof imagePath !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Falta el campo imagePath (ruta del archivo generado)",
    });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Falta el campo title (copy de publicacion)",
    });
  }

  const abs = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(process.cwd(), imagePath);

  const targetPlatforms: Platform[] =
    Array.isArray(platforms) && platforms.length > 0
      ? platforms.filter((p: string) =>
          ["instagram", "facebook", "twitter", "tiktok"].includes(p)
        )
      : ["instagram"];

  if (targetPlatforms.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "Ninguna plataforma valida. Opciones: instagram, facebook, twitter, tiktok",
    });
  }

  const results = await publishToMultiplePlatforms(
    abs,
    title,
    targetPlatforms,
    typeof user === "string" ? user : undefined
  );

  const allOk = results.every((r) => r.success);

  return res.status(allOk ? 200 : 502).json({
    ok: allOk,
    results,
    message: allOk
      ? `Publicado correctamente en: ${targetPlatforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`
      : `Error en alguna plataforma.`,
  });
});

export default router;
