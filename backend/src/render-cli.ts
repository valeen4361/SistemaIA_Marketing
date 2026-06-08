import { renderReelVideo } from "./services/remotionRenderer";
import crypto from "crypto";

async function main() {
  const args = process.argv.slice(2);
  const imageArg = args.find((a) => a.startsWith("--images="));
  const nameArg = args.find((a) => a.startsWith("--name=")) ?? "--name=Torneo de Prueba";

  const images = imageArg
    ? imageArg.replace("--images=", "").split(",")
    : ["https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1080&h=1920&fit=crop"];

  const tournamentName = nameArg.replace("--name=", "");
  const jobId = crypto.randomBytes(6).toString("hex");

  console.log(`[cli] rendering ${images.length} images, jobId=${jobId}`);

  const result = await renderReelVideo(
    {
      images,
      tournamentName,
      date: "15 de Junio 2026",
      prize: "$5,000 USD",
      location: "Casino Central, CDMX",
      contact: {
        agent: "Agente de Marketing",
        phone: "+52 55 0000 0000",
        instagram: "@pokerclub",
      },
      music: null,
      durationPerPhoto: 4,
      totalDuration: 28,
    },
    jobId
  );

  console.log("\n[cli] DONE");
  console.log("  videoPath:", result.videoPath);
  console.log("  videoUrl:", result.videoUrl);
  console.log(`  duration: ${result.durationSeconds.toFixed(1)}s`);
  console.log(`  size: ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error("[cli] failed:", err);
  process.exit(1);
});
