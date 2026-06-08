import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import uploadRoutes from "./routes/upload";
import renderRoutes from "./routes/render";
import publishRoutes from "./routes/publish";
import aiRenderRoutes from "./routes/aiRender";
import scheduleRoutes from "./routes/schedule";
import { scheduleManager } from "./services/scheduler";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.resolve(config.uploadDir)));
app.use("/renders", express.static(path.resolve(config.outputDir)));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "poker-marketing-backend",
    hasUploadPostKey: Boolean(config.uploadPostApi.key),
  });
});

app.use("/api", uploadRoutes);
app.use("/api", renderRoutes);
app.use("/api", aiRenderRoutes);
app.use("/api", publishRoutes);
app.use("/api", scheduleRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[server] unhandled error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
);

app.listen(config.port, async () => {
  console.log(`\n[server] listening on ${config.publicBaseUrl}`);
  console.log(`[server] uploads dir: ${path.resolve(config.uploadDir)}`);
  console.log(`[server] renders dir: ${path.resolve(config.outputDir)}`);
  if (!config.uploadPostApi.key) {
    console.warn(
      "[server] WARNING: UPLOADPOST_API_KEY is missing — Instagram publish will fail."
    );
  }

  await scheduleManager.init();
  console.log("[server] Scheduler initialized.");
});
