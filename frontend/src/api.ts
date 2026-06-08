import type { PublishResponse, RenderFormData, RenderResponse, UploadResponse, ScheduleRequest, ScheduledPost, ScheduleListResponse } from "./types";

const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string | undefined) ?? "";

async function postForm(path: string, formData: globalThis.FormData): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, { method: "POST", body: formData });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo conectar con el backend en ${API_BASE || "vite proxy"}${path}. ` +
        `Asegurate de que el backend este corriendo: cd backend && npm run dev. ` +
        `Error original: ${reason}`
    );
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo conectar con el backend en ${API_BASE || "vite proxy"}${path}. ` +
        `Asegurate de que el backend este corriendo: cd backend && npm run dev. ` +
        `Error original: ${reason}`
    );
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo conectar con el backend en ${API_BASE || "vite proxy"}${path}. ${reason}`
    );
  }
}

async function del(path: string): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Error al eliminar: ${reason}`);
  }
}

export async function checkBackend(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { ok: false, message: `Backend respondio ${res.status}` };
    const data = await res.json();
    return {
      ok: Boolean(data.ok),
      message: data.hasUploadPostKey
        ? "Backend OK (Upload-Post key cargada)"
        : "Backend OK (sin UPLOADPOST_API_KEY)",
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Backend no alcanzable: ${reason}` };
  }
}

export async function uploadImages(files: File[], musicFile?: File): Promise<UploadResponse> {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);
  if (musicFile) {
    fd.append("music", musicFile);
  }
  const res = await postForm("/api/upload", fd);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload fallo: ${res.status} - ${text || res.statusText}`);
  }
  return res.json();
}

export async function renderVideo(
  form: RenderFormData,
  imageUrls: string[],
  musicUrl?: string | null
): Promise<RenderResponse> {
  const data = await postJson<RenderResponse>("/api/render", {
    images: imageUrls,
    tournamentName: form.tournamentName,
    date: form.date,
    prize: form.prize,
    location: form.location,
    contact: form.contact,
    music: musicUrl ?? null,
    durationPerPhoto: 4,
    totalDuration: 28,
  });
  if (!data.ok) {
    throw new Error(data.error ?? "Render fallo");
  }
  return data;
}

export async function publishToSocialMedia(
  imagePath: string,
  title: string,
  platforms: string[] = ["instagram"]
): Promise<PublishResponse> {
  return postJson<PublishResponse>("/api/publish", {
    imagePath,
    title,
    platforms,
  });
}

// Schedule API
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const data = await getJson<ScheduleListResponse>("/api/schedule");
  return data.jobs ?? [];
}

export async function createScheduledPost(req: ScheduleRequest): Promise<{ ok: boolean; job: ScheduledPost }> {
  return postJson("/api/schedule", req);
}

export async function cancelScheduledPost(id: string): Promise<boolean> {
  const res = await del(`/api/schedule/${id}`);
  const data = await res.json();
  return data.ok;
}
