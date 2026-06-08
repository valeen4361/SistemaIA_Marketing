import { Router } from "express";
import crypto from "crypto";
import { scheduleManager, type ScheduledPost } from "../services/scheduler";
import type { Platform } from "../services/platforms";

const router = Router();

// GET /api/schedule - List all scheduled posts
router.get("/schedule", (_req, res) => {
  const jobs = scheduleManager.getAll();
  return res.json({ ok: true, jobs });
});

// GET /api/schedule/:id - Get a specific scheduled post
router.get("/schedule/:id", (req, res) => {
  const job = scheduleManager.getById(req.params.id);
  if (!job) {
    return res.status(404).json({ ok: false, error: "Programacion no encontrada" });
  }
  return res.json({ ok: true, job });
});

// POST /api/schedule - Create a scheduled post
router.post("/schedule", (req, res) => {
  const { filePath, title, platforms, scheduledAt, timezone } = req.body ?? {};

  if (!filePath || typeof filePath !== "string") {
    return res.status(400).json({ ok: false, error: "Falta el campo filePath" });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ ok: false, error: "Falta el campo title" });
  }
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ ok: false, error: "Falta el campo platforms (array)" });
  }
  if (!scheduledAt || typeof scheduledAt !== "string") {
    return res.status(400).json({ ok: false, error: "Falta el campo scheduledAt (ISO string)" });
  }

  const validPlatforms: Platform[] = platforms.filter((p: string) =>
    ["instagram", "facebook", "twitter", "tiktok"].includes(p)
  ) as Platform[];

  if (validPlatforms.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "Ninguna plataforma valida. Opciones: instagram, facebook, twitter, tiktok",
    });
  }

  const job: ScheduledPost = {
    id: crypto.randomBytes(8).toString("hex"),
    filePath,
    title,
    platforms: validPlatforms,
    scheduledAt,
    timezone: timezone ?? "UTC",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  scheduleManager.add(job);
  console.log(`[schedule] Created job ${job.id} for ${scheduledAt} on [${validPlatforms.join(", ")}]`);

  return res.status(201).json({ ok: true, job });
});

// PATCH /api/schedule/:id - Update a scheduled post
router.patch("/schedule/:id", (req, res) => {
  const { filePath, title, platforms, scheduledAt, timezone, status } = req.body ?? {};
  const existing = scheduleManager.getById(req.params.id);

  if (!existing) {
    return res.status(404).json({ ok: false, error: "Programacion no encontrada" });
  }

  const updates: Partial<ScheduledPost> = {};
  if (typeof filePath === "string") updates.filePath = filePath;
  if (typeof title === "string") updates.title = title;
  if (Array.isArray(platforms)) {
    updates.platforms = platforms.filter((p: string) =>
      ["instagram", "facebook", "twitter", "tiktok"].includes(p)
    ) as Platform[];
  }
  if (typeof scheduledAt === "string") updates.scheduledAt = scheduledAt;
  if (typeof timezone === "string") updates.timezone = timezone;
  if (typeof status === "string" && ["pending", "cancelled"].includes(status)) {
    updates.status = status as "pending" | "cancelled";
  }

  const updated = scheduleManager.update(req.params.id, updates);
  return res.json({ ok: true, job: updated });
});

// DELETE /api/schedule/:id - Cancel/remove a scheduled post
router.delete("/schedule/:id", (req, res) => {
  const removed = scheduleManager.remove(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: "Programacion no encontrada" });
  }
  return res.json({ ok: true, message: "Programacion eliminada" });
});

export default router;
