import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { generarScriptRemotion, formatearScriptParaRemotion } from "../services/aiScriptGenerator";
import { config } from "../config";

const router = Router();

// Configurar multer para uploads de imagen
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const id = crypto.randomBytes(8).toString("hex");
    cb(null, `ai-${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpe?g|png|webp)$/i.test(file.originalname);
    if (!ok) {
      return cb(new Error("Solo se permiten archivos JPG, PNG o WEBP"));
    }
    cb(null, true);
  },
});

interface AIRenderRequest {
  textoOverlay: string;
  tournamentName?: string;
  date?: string;
  prize?: string;
  location?: string;
  contact?: {
    agent: string;
    phone: string;
    instagram: string;
  };
}

/**
 * Endpoint para generar y renderizar videos con IA
 * POST /ai-render
 * Body: { textoOverlay, tournamentName?, date?, ... }
 * File: imagen (multipart)
 */
router.post("/ai-render", upload.single("imagen"), async (req, res) => {
  const jobId = crypto.randomBytes(6).toString("hex");

  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No se recibió imagen" });
    }

    const body = req.body as AIRenderRequest;

    if (!body.textoOverlay) {
      return res.status(400).json({ ok: false, error: "Falta el campo textoOverlay" });
    }

    console.log(`[ai-render:${jobId}] Iniciando generación con IA...`);
    console.log(`[ai-render:${jobId}] Imagen: ${req.file.filename}`);
    console.log(`[ai-render:${jobId}] Texto: ${body.textoOverlay}`);

    // Leer imagen como base64
    const imagenPath = req.file.path;
    const imagenBuffer = fs.readFileSync(imagenPath);
    const imagenBase64 = `data:image/${path.extname(req.file.filename).slice(1)};base64,${imagenBuffer.toString("base64")}`;

    // Generar script con MiniMax M3
    console.log(`[ai-render:${jobId}] Llamando MiniMax M3...`);
    const generatedData = await generarScriptRemotion(imagenBase64, body.textoOverlay, {
      tournamentName: body.tournamentName,
      date: body.date,
      prize: body.prize,
      location: body.location,
    });

    console.log(`[ai-render:${jobId}] Script generado exitosamente`);
    console.log(`[ai-render:${jobId}] Tokens usados - Prompt: ${generatedData.metadata.promptTokens}, Completion: ${generatedData.metadata.completionTokens}`);

    // Formatear script para Remotion
    const scriptFormateado = formatearScriptParaRemotion(generatedData.script, "AIGeneratedScene");

    // Guardar script para referencia
    const scriptDir = path.join(config.outputDir, "generated-scripts");
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }

    const scriptPath = path.join(scriptDir, `${jobId}.tsx`);
    fs.writeFileSync(scriptPath, scriptFormateado);

    console.log(`[ai-render:${jobId}] Script guardado en: ${scriptPath}`);

    // Retornar datos para que el frontend pueda renderizar
    return res.json({
      ok: true,
      jobId,
      script: scriptFormateado,
      imagenUrl: `${config.publicBaseUrl}/uploads/${req.file.filename}`,
      metadata: generatedData.metadata,
      message: "Script generado. Procede a renderizar con /render",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ai-render:${jobId}] Error:`, message);
    return res.status(500).json({ ok: false, error: message, jobId });
  }
});

export default router;
