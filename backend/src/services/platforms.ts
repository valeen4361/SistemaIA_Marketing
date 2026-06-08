import fs from "fs";
import path from "path";
import FormData from "form-data";
import { config } from "../config";

export type Platform = "instagram" | "facebook" | "twitter" | "tiktok";

export interface PublishResult {
  success: boolean;
  platform: Platform;
  status: number;
  data: unknown;
  message: string;
}

interface PlatformConfig {
  apiUrl: string;
  apiKey: string;
  user: string;
}

function getPlatformConfig(platform: Platform): PlatformConfig {
  switch (platform) {
    case "instagram":
      return {
        apiUrl: config.uploadPostApi.url,
        apiKey: config.instagramGraphApi.accessToken || config.uploadPostApi.key,
        user: config.uploadPostApi.user,
      };
    case "facebook":
      return {
        apiUrl: config.facebookApi.url,
        apiKey: config.facebookApi.key,
        user: config.facebookApi.user,
      };
    case "twitter":
      return {
        apiUrl: config.twitterApi.url,
        apiKey: config.twitterApi.key,
        user: config.twitterApi.user,
      };
    case "tiktok":
      return {
        apiUrl: config.tiktokApi.url,
        apiKey: config.tiktokApi.key,
        user: config.tiktokApi.user,
      };
  }
}

function isUploadPostPlatform(platform: Platform): boolean {
  return platform === "instagram" || platform === "facebook";
}

export async function publishToPlatform(
  filePath: string,
  title: string,
  platform: Platform,
  userOverride?: string
): Promise<PublishResult> {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      platform,
      status: 404,
      data: null,
      message: `Archivo no encontrado: ${filePath}`,
    };
  }

  const pf = getPlatformConfig(platform);

  if (!pf.apiKey) {
    return {
      success: false,
      platform,
      status: 500,
      data: null,
      message: `Falta API Key para ${platform}. Agregala al archivo .env`,
    };
  }

  // Instagram direct API si está configurado IG_USER_ID
  if (platform === "instagram" && config.instagramGraphApi.userId) {
    return publishViaInstagramGraphAPI(filePath, title, platform, pf);
  }

  if (isUploadPostPlatform(platform)) {
    return publishViaUploadPost(filePath, title, platform, pf, userOverride);
  }

  return publishViaDirectAPI(filePath, title, platform, pf);
}

async function publishViaInstagramGraphAPI(
  filePath: string,
  title: string,
  platform: Platform,
  pf: PlatformConfig
): Promise<PublishResult> {
  try {
    const igConfig = config.instagramGraphApi;

    if (!igConfig.userId) {
      return {
        success: false,
        platform,
        status: 500,
        data: null,
        message: "Falta IG_USER_ID en .env. Debe ser el ID numérico de tu cuenta de Instagram Business/Creator.",
      };
    }

    const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(filePath);
    if (!isVideo) {
      return {
        success: false,
        platform,
        status: 400,
        data: null,
        message: "Instagram Graph API solo acepta video MP4.",
      };
    }

    // Construir URL pública del video
    const outputDir = path.resolve(process.cwd(), config.outputDir);
    const relativePath = path.relative(outputDir, filePath);
    const videoUrl = `${config.publicBaseUrl}/renders/${relativePath.replace(/\\/g, "/")}`;

    console.log(`[instagram-graph] Public URL: ${videoUrl}`);

    // Paso 1: Crear media container
    const createRes = await fetch(
      `https://graph.facebook.com/${igConfig.apiVersion}/${igConfig.userId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "VIDEO",
          video_url: videoUrl,
          caption: title,
          access_token: pf.apiKey,
        }),
      }
    );

    const createData: any = await createRes.json();

    if (!createRes.ok) {
      return {
        success: false,
        platform,
        status: createRes.status,
        data: createData,
        message: `Error al crear container: ${createData?.error?.message || JSON.stringify(createData)}`,
      };
    }

    const creationId = createData.id;
    console.log(`[instagram-graph] Container creado: ${creationId}`);

    // Paso 2: Publicar el container
    const publishRes = await fetch(
      `https://graph.facebook.com/${igConfig.apiVersion}/${igConfig.userId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pf.apiKey,
        }),
      }
    );

    const publishData: any = await publishRes.json();

    if (!publishRes.ok) {
      return {
        success: false,
        platform,
        status: publishRes.status,
        data: publishData,
        message: `Error al publicar: ${publishData?.error?.message || JSON.stringify(publishData)}`,
      };
    }

    console.log(`[instagram-graph] Publicado: ${publishData.id}`);

    return {
      success: true,
      platform,
      status: publishRes.status,
      data: publishData,
      message: "Video publicado en Instagram correctamente.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      platform,
      status: 0,
      data: null,
      message: `Error de red en Instagram API: ${message}`,
    };
  }
}

async function publishViaUploadPost(
  filePath: string,
  title: string,
  platform: Platform,
  pf: PlatformConfig,
  userOverride?: string
): Promise<PublishResult> {
  const form = new FormData();
  form.append("user", userOverride ?? pf.user);
  form.append("platform[]", platform);
  form.append("title", title);

  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(filePath);
  const field = isVideo ? "video" : "image";
  form.append(field, fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: isVideo ? "video/mp4" : "image/jpeg",
  });

  try {
    const res = await fetch(pf.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Apikey ${pf.apiKey}`,
        ...form.getHeaders(),
      },
      body: form as any,
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
    }

    return {
      success: res.ok,
      platform,
      status: res.status,
      data,
      message: res.ok
        ? `Publicado en ${platform} correctamente.`
        : `La API respondio ${res.status} en ${platform}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      platform,
      status: 0,
      data: null,
      message: `Error de red al publicar en ${platform}: ${message}`,
    };
  }
}

async function publishViaDirectAPI(
  filePath: string,
  title: string,
  platform: Platform,
  pf: PlatformConfig
): Promise<PublishResult> {
  try {
    const form = new FormData();
    form.append("text", title);

    const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(filePath);
    const field = isVideo ? "media" : "image";
    form.append(field, fs.createReadStream(filePath), {
      filename: path.basename(filePath),
    });

    const res = await fetch(pf.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pf.apiKey}`,
        ...form.getHeaders(),
      },
      body: form as any,
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
    }

    return {
      success: res.ok,
      platform,
      status: res.status,
      data,
      message: res.ok
        ? `Publicado en ${platform} correctamente.`
        : `La API respondio ${res.status} en ${platform}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      platform,
      status: 0,
      data: null,
      message: `Error de red al publicar en ${platform}: ${message}`,
    };
  }
}

export async function publishToMultiplePlatforms(
  filePath: string,
  title: string,
  platforms: Platform[],
  userOverride?: string
): Promise<PublishResult[]> {
  return Promise.all(
    platforms.map((p) => publishToPlatform(filePath, title, p, userOverride))
  );
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter / X",
  tiktok: "TikTok",
};
