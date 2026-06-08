import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { config } from "../config";

const router = Router();

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const id = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const imageOk = /\.(jpe?g|png|webp)$/i.test(file.originalname);
    const audioOk = /\.(mp3)$/i.test(file.originalname);
    if (file.fieldname === "music") {
      if (!audioOk) {
        return cb(new Error("El archivo de audio debe ser MP3"));
      }
      return cb(null, true);
    }
    if (!imageOk) {
      return cb(new Error("Solo se permiten archivos JPG, PNG o WEBP para las imagenes"));
    }
    cb(null, true);
  },
});

router.post(
  "/upload",
  upload.fields([
    { name: "images", maxCount: 12 },
    { name: "music", maxCount: 1 },
  ]),
  (req, res) => {
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] } | undefined) ?? {};
    const imageFiles = files.images ?? [];
    const musicFile = files.music?.[0] ?? null;

    if (!imageFiles.length) {
      return res.status(400).json({ ok: false, error: "No se recibieron imagenes" });
    }

    const images = imageFiles.map((f) => ({
      filename: f.filename,
      url: `${config.publicBaseUrl}/uploads/${f.filename}`,
      size: f.size,
    }));

    const music = musicFile
      ? {
          filename: musicFile.filename,
          url: `${config.publicBaseUrl}/uploads/${musicFile.filename}`,
          size: musicFile.size,
        }
      : undefined;

    return res.json({ ok: true, images, music });
  }
);

export default router;
