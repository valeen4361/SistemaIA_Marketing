import fs from "fs";
import path from "path";
import FormData from "form-data";
import { config } from "../config";

export interface UploadPostResult {
  success: boolean;
  status: number;
  data: unknown;
  message: string;
}

export async function publishToInstagram(
  filePath: string,
  title: string,
  userOverride?: string,
  extraPlatforms: string[] = ["instagram"]
): Promise<UploadPostResult> {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      status: 404,
      data: null,
      message: `Archivo no encontrado: ${filePath}`,
    };
  }

  if (!config.uploadPostApi.key) {
    return {
      success: false,
      status: 500,
      data: null,
      message:
        "Falta la variable de entorno UPLOADPOST_API_KEY. Agregala al archivo .env",
    };
  }

  const form = new FormData();
  form.append("user", userOverride ?? config.uploadPostApi.user);
  for (const p of extraPlatforms) {
    form.append("platform[]", p);
  }
  form.append("title", title);

  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(filePath);
  const field = isVideo ? "video" : "image";
  form.append(field, fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: isVideo ? "video/mp4" : "image/jpeg",
  });

  try {
    const res = await fetch(config.uploadPostApi.url, {
      method: "POST",
      headers: {
        Authorization: `Apikey ${config.uploadPostApi.key}`,
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
      status: res.status,
      data,
      message: res.ok
        ? "Publicacion enviada a Instagram correctamente."
        : `La API de upload-post respondio ${res.status}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 0,
      data: null,
      message: `Error de red al llamar a upload-post: ${message}`,
    };
  }
}
