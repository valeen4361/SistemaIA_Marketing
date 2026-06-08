import fs from "fs";
import path from "path";
import cron from "node-cron";
import { DateTime } from "luxon";
import { publishToMultiplePlatforms, type Platform } from "./platforms";

export type ScheduleStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface ScheduledPost {
  id: string;
  filePath: string;
  title: string;
  platforms: Platform[];
  scheduledAt: string;
  timezone: string;
  status: ScheduleStatus;
  createdAt: string;
  publishedAt?: string;
  results?: Array<{ platform: Platform; success: boolean; message: string }>;
  error?: string;
}

const SCHEDULE_FILE = path.resolve(process.cwd(), "schedules.json");

class ScheduleManager {
  private jobs: ScheduledPost[] = [];
  private initialized = false;
  private onTick: (() => void) | null = null;

  load(): ScheduledPost[] {
    try {
      if (fs.existsSync(SCHEDULE_FILE)) {
        const raw = fs.readFileSync(SCHEDULE_FILE, "utf-8");
        this.jobs = JSON.parse(raw);
      }
    } catch (err) {
      console.error("[scheduler] Error loading schedules:", err);
      this.jobs = [];
    }
    return this.jobs;
  }

  save(): void {
    try {
      fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(this.jobs, null, 2), "utf-8");
    } catch (err) {
      console.error("[scheduler] Error saving schedules:", err);
    }
  }

  getAll(): ScheduledPost[] {
    return this.jobs;
  }

  getById(id: string): ScheduledPost | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  add(post: ScheduledPost): void {
    this.jobs.push(post);
    this.save();
  }

  update(id: string, updates: Partial<ScheduledPost>): ScheduledPost | null {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return null;
    this.jobs[idx] = { ...this.jobs[idx], ...updates };
    this.save();
    return this.jobs[idx];
  }

  remove(id: string): boolean {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return false;
    this.jobs.splice(idx, 1);
    this.save();
    return true;
  }

  async checkAndExecute(): Promise<void> {
    const now = DateTime.now().toUTC();
    const due = this.jobs.filter(
      (j) => j.status === "pending" && DateTime.fromISO(j.scheduledAt).toUTC() <= now
    );

    for (const job of due) {
      console.log(`[scheduler] Executing scheduled post ${job.id}...`);
      this.update(job.id, { status: "processing" });

      try {
        const results = await publishToMultiplePlatforms(
          job.filePath,
          job.title,
          job.platforms
        );

        const allOk = results.every((r) => r.success);
        this.update(job.id, {
          status: allOk ? "completed" : "failed",
          publishedAt: DateTime.now().toUTC().toISO(),
          results: results.map((r) => ({
            platform: r.platform,
            success: r.success,
            message: r.message,
          })),
          error: allOk ? undefined : results.find((r) => !r.success)?.message,
        });

        console.log(
          `[scheduler] Post ${job.id} ${allOk ? "completed" : "failed"}:`,
          results.map((r) => `${r.platform}=${r.success}`).join(", ")
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[scheduler] Post ${job.id} error:`, msg);
        this.update(job.id, { status: "failed", error: msg });
      }
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.load();
    this.initialized = true;

    // Check every 30 seconds
    cron.schedule("*/30 * * * * *", () => {
      this.checkAndExecute().catch((err) =>
        console.error("[scheduler] tick error:", err)
      );
    });

    const pending = this.jobs.filter((j) => j.status === "pending").length;
    console.log(`[scheduler] Initialized. ${this.jobs.length} total, ${pending} pending.`);
  }
}

export const scheduleManager = new ScheduleManager();
