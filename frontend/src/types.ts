export interface UploadedImage {
  filename: string;
  url: string;
  size: number;
}

export interface UploadedAudio {
  filename: string;
  url: string;
  size: number;
}

export interface UploadResponse {
  ok: boolean;
  images: UploadedImage[];
  music?: UploadedAudio;
}

export interface RenderResponse {
  ok: boolean;
  jobId: string;
  videoPath: string;
  videoUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  error?: string;
}

export interface PublishResponse {
  ok: boolean;
  status?: number;
  message: string;
  data?: unknown;
  results?: Array<{ platform: string; success: boolean; message: string }>;
}

export interface ScheduleRequest {
  filePath: string;
  title: string;
  platforms: string[];
  scheduledAt: string;
  timezone?: string;
}

export interface ScheduledPost {
  id: string;
  filePath: string;
  title: string;
  platforms: string[];
  scheduledAt: string;
  timezone: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: string;
  publishedAt?: string;
  results?: Array<{ platform: string; success: boolean; message: string }>;
  error?: string;
}

export interface ScheduleListResponse {
  ok: boolean;
  jobs: ScheduledPost[];
}

export interface RenderFormData {
  tournamentName: string;
  date: string;
  prize: string;
  location: string;
  caption: string;
  contact: {
    agent: string;
    phone: string;
    instagram: string;
  };
}

export type Platform = "instagram" | "facebook" | "twitter" | "tiktok";

export const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "facebook", label: "Facebook", icon: "👍" },
  { id: "twitter", label: "Twitter / X", icon: "🐦" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
];
