import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { config } from "../config";
import type { RenderRequestBody, RenderResult } from "../types";

let cachedBundle: string | null = null;

async function getBundle(): Promise<string> {
  if (cachedBundle && fs.existsSync(cachedBundle)) {
    return cachedBundle;
  }
  const entry = path.resolve(process.cwd(), config.remotionEntry);
  const publicDir = path.resolve(process.cwd(), config.remotionPublicDir);
  console.log("[remotion] Bundling entry:", entry);
  console.log("[remotion] Public dir:", publicDir);
  cachedBundle = await bundle({
    entryPoint: entry,
    publicDir,
    onProgress: (p: number) => {
      if (p % 0.25 < 0.01) {
        console.log(`[remotion] bundle progress ${(p * 100).toFixed(0)}%`);
      }
    },
  });
  return cachedBundle;
}

export async function renderReelVideo(
  body: RenderRequestBody,
  jobId: string
): Promise<RenderResult> {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const bundleLocation = await getBundle();

  const inputProps = {
    images: body.images,
    tournamentName: body.tournamentName,
    date: body.date,
    prize: body.prize,
    location: body.location,
    contact: body.contact,
    music: body.music ?? null,
    durationPerPhoto: body.durationPerPhoto ?? 4,
    totalDuration: body.totalDuration ?? 28,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "PokerReel",
    inputProps,
  });

  const outputPath = path.join(config.outputDir, `reel-${jobId}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    outputLocation: outputPath,
    inputProps,
    codec: "h264",
    imageFormat: "jpeg",
    pixelFormat: "yuv420p",
    crf: 18,
    onProgress: (progress: { progress: number }) => {
      const p = progress.progress;
      if (p % 0.1 < 0.01) {
        console.log(`[remotion] render progress ${(p * 100).toFixed(0)}%`);
      }
    },
  });

  const stat = fs.statSync(outputPath);
  const durationSeconds = (composition.durationInFrames / composition.fps);

  return {
    videoPath: outputPath,
    videoUrl: `${config.publicBaseUrl}/renders/${path.basename(outputPath)}`,
    durationSeconds,
    sizeBytes: stat.size,
  };
}
