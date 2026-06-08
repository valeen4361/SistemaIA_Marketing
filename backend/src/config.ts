import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  outputDir: process.env.OUTPUT_DIR ?? "./renders",
  remotionEntry:
    process.env.REMOTION_ENTRY ?? "../remotion/src/index.ts",
  remotionPublicDir:
    process.env.REMOTION_PUBLIC_DIR ?? "../remotion/public",
  uploadPostApi: {
    url: process.env.UPLOADPOST_API_URL ?? "https://api.upload-post.com/api/upload",
    key: process.env.UPLOADPOST_API_KEY ?? "",
    user: process.env.UPLOADPOST_USER ?? "poker-club-marketing",
  },
  facebookApi: {
    url: process.env.FACEBOOK_API_URL ?? "https://graph.facebook.com/v18.0/me/photos",
    key: process.env.FACEBOOK_API_KEY ?? process.env.UPLOADPOST_API_KEY ?? "",
    user: process.env.FACEBOOK_USER ?? process.env.UPLOADPOST_USER ?? "",
  },
  twitterApi: {
    url: process.env.TWITTER_API_URL ?? "https://api.twitter.com/2/tweets",
    key: process.env.TWITTER_API_KEY ?? "",
    user: process.env.TWITTER_USER ?? "",
  },
  tiktokApi: {
    url: process.env.TIKTOK_API_URL ?? "https://open-api.tiktok.com/share/video/upload/",
    key: process.env.TIKTOK_API_KEY ?? "",
    user: process.env.TIKTOK_USER ?? "",
  },
  instagramGraphApi: {
    accessToken: process.env.IG_ACCESS_TOKEN ?? "",
    userId: process.env.IG_USER_ID ?? "",
    apiVersion: process.env.IG_API_VERSION ?? "v18.0",
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
};
