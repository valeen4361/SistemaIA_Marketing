import { useEffect, useState } from "react";
import { checkBackend, publishToSocialMedia, renderVideo, uploadImages, getScheduledPosts, createScheduledPost, cancelScheduledPost } from "./api";
import type { RenderFormData, UploadedAudio, UploadedImage, Platform, ScheduledPost } from "./types";
import { PLATFORMS } from "./types";

type Toast =
  | { kind: "success"; text: string }
  | { kind: "error"; text: string }
  | { kind: "info"; text: string }
  | null;

interface RenderState {
  videoUrl: string;
  videoPath: string;
  durationSeconds: number;
  sizeBytes: number;
}

export function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [uploadedMusic, setUploadedMusic] = useState<UploadedAudio | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [form, setForm] = useState<RenderFormData>({
    tournamentName: "Torneo de Poker - Copa Verano",
    date: "15 de Junio 2026",
    prize: "$5,000 USD",
    location: "Casino Central, CDMX",
    caption:
      "Vive la mejor experiencia de poker. Torneo de Copa Verano este 15 de Junio. Premio mayor $5,000 USD. Inscripciones abiertas. #Poker #Torneo #PokerLife",
    contact: {
      agent: "Carlos Mendoza",
      phone: "+52 55 1234 5678",
      instagram: "@pokerclubmx",
    },
  });

  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [render, setRender] = useState<RenderState | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram"]);

  // Scheduling
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTz, setScheduleTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  async function loadScheduledPosts() {
    try {
      const posts = await getScheduledPosts();
      setScheduledPosts(posts);
    } catch {
    }
  }

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function update<K extends keyof RenderFormData>(key: K, value: RenderFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateContact<K extends keyof RenderFormData["contact"]>(key: K, value: RenderFormData["contact"][K]) {
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }));
  }

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => /^image\//.test(f.type));
    setFiles(next);
    setUploaded([]);
    setRender(null);
  }

  function onPickMusic(file: File | null) {
    if (!file) {
      setMusicFile(null);
      return;
    }
    if (!/^audio\/mpeg$/.test(file.type) && !/\.mp3$/i.test(file.name)) {
      setToast({ kind: "error", text: "Solo se permite audio MP3." });
      setMusicFile(null);
      return;
    }
    setMusicFile(file);
  }

  function clearMusic() {
    setMusicFile(null);
    setUploadedMusic(null);
  }

  async function handleUpload() {
    if (files.length === 0) {
      setToast({ kind: "error", text: "Selecciona al menos una imagen JPG." });
      return;
    }
    setUploading(true);
    setToast({ kind: "info", text: "Subiendo imagenes y audio..." });
    try {
      const res = await uploadImages(files, musicFile ?? undefined);
      setUploaded(res.images);
      setUploadedMusic(res.music ?? null);
      setToast({
        kind: "success",
        text: `${res.images.length} imagen(es) subidas correctamente${res.music ? ", audio cargado." : "."}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast({ kind: "error", text: msg });
    } finally {
      setUploading(false);
    }
  }

  async function handleRender() {
    if (uploaded.length === 0) {
      setToast({ kind: "error", text: "Primero sube las imagenes." });
      return;
    }
    setRendering(true);
    setToast({ kind: "info", text: "Renderizando video (puede tomar 30-90 segundos)..." });
    try {
      const imageUrls = uploaded.map((u) => u.url);
      const res = await renderVideo(form, imageUrls, uploadedMusic?.url ?? null);
      setRender({
        videoUrl: res.videoUrl,
        videoPath: res.videoPath,
        durationSeconds: res.durationSeconds,
        sizeBytes: res.sizeBytes,
      });
      setToast({
        kind: "success",
        text: `Video generado: ${res.durationSeconds.toFixed(1)}s (${(res.sizeBytes / 1024 / 1024).toFixed(1)} MB).`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast({ kind: "error", text: msg });
    } finally {
      setRendering(false);
    }
  }

  async function handlePublish() {
    if (!render) {
      setToast({ kind: "error", text: "Primero genera el video." });
      return;
    }
    if (!form.caption.trim()) {
      setToast({ kind: "error", text: "El copy de publicacion esta vacio." });
      return;
    }
    if (selectedPlatforms.length === 0) {
      setToast({ kind: "error", text: "Selecciona al menos una plataforma." });
      return;
    }

    if (scheduleMode) {
      if (!scheduleDate || !scheduleTime) {
        setToast({ kind: "error", text: "Selecciona fecha y hora para programar." });
        return;
      }
      await handleSchedule();
      return;
    }

    setPublishing(true);
    const platformLabels = selectedPlatforms.map((p) => PLATFORMS.find((x) => x.id === p)!.label).join(", ");
    setToast({ kind: "info", text: `Publicando en: ${platformLabels}...` });
    try {
      const filePath = render.videoPath.replace(/^https?:\/\/[^/]+/, "");
      const localPath = filePath.startsWith("/") ? `.${filePath}` : `./${filePath}`;
      const res = await publishToSocialMedia(localPath, form.caption, selectedPlatforms);

      if (res.ok) {
        const msg = res.message || `Publicado en ${platformLabels}`;
        setToast({ kind: "success", text: msg });
      } else {
        const failPlatforms = res.results?.filter((r) => !r.success).map((r) => r.platform).join(", ");
        setToast({ kind: "error", text: `Error en: ${failPlatforms || "desconocido"}` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast({ kind: "error", text: msg });
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedule() {
    if (!render) return;
    setPublishing(true);
    try {
      const filePath = render.videoPath.replace(/^https?:\/\/[^/]+/, "");
      const localPath = filePath.startsWith("/") ? `.${filePath}` : `./${filePath}`;
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;

      await createScheduledPost({
        filePath: localPath,
        title: form.caption,
        platforms: selectedPlatforms,
        scheduledAt,
        timezone: scheduleTz,
      });

      setToast({
        kind: "success",
        text: `Programado para el ${scheduleDate} a las ${scheduleTime} (${scheduleTz}) en ${selectedPlatforms.length} plataforma(s)`,
      });
      await loadScheduledPosts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast({ kind: "error", text: `Error al programar: ${msg}` });
    } finally {
      setPublishing(false);
    }
  }

  async function handleCancelSchedule(id: string) {
    const ok = await cancelScheduledPost(id);
    if (ok) {
      setToast({ kind: "success", text: "Programacion cancelada" });
      await loadScheduledPosts();
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "#4caf50";
      case "failed": return "#f44336";
      case "processing": return "#ff9800";
      case "cancelled": return "#9e9e9e";
      default: return "#2196f3";
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          Poker <span className="accent">Marketing</span> Studio
        </h1>
        <span style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.5)" }}>
          Reel Generator + Social Media Publisher
        </span>
      </header>

      <div className="layout">
        <section className="panel">
          <h2>1. Subir fotos del torneo</h2>
          <label className="dropzone">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
            />
            <div style={{ fontSize: 18, letterSpacing: 2, textTransform: "uppercase" }}>
              {files.length > 0 ? `${files.length} archivo(s) listo(s)` : "Click o arrastra JPG/PNG"}
            </div>
            <div className="dropzone-hint">
              Sube 3-6 fotos del torneo, casino, mesa, jugadores, premios.
            </div>
          </label>

          <label className="dropzone" style={{ marginTop: 20 }}>
            <input
              type="file"
              accept="audio/mpeg,.mp3"
              onChange={(e) => onPickMusic(e.target.files?.[0] ?? null)}
            />
            <div style={{ fontSize: 18, letterSpacing: 2, textTransform: "uppercase" }}>
              {musicFile ? musicFile.name : "Selecciona un MP3 para la musica de fondo"}
            </div>
            <div className="dropzone-hint">
              Archivo MP3 opcional. Se reproducira como musica de fondo del reel.
            </div>
          </label>
          {musicFile && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 10, marginBottom: 10 }}
              type="button"
              onClick={clearMusic}
            >
              Eliminar audio seleccionado
            </button>
          )}

          {files.length > 0 && (
            <div className="thumbs">
              {files.map((f, i) => (
                <div className="thumb" key={i}>
                  <img src={URL.createObjectURL(f)} alt={f.name} />
                  <div className="badge">#{i + 1}</div>
                </div>
              ))}
            </div>
          )}

          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? <span className="spinner" /> : null}
              {uploading ? "Subiendo..." : "Subir imagenes"}
            </button>
            {uploaded.length > 0 && (
              <span style={{ alignSelf: "center", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                {uploaded.length} imagen(es) listas
              </span>
            )}
            {uploadedMusic && (
              <span style={{ alignSelf: "center", color: "rgba(255,255,255,0.6)", fontSize: 13, marginLeft: 16 }}>
                Audio cargado: {uploadedMusic.filename}
              </span>
            )}
          </div>

          <h2 style={{ marginTop: 32 }}>2. Datos del torneo</h2>

          <div className="field">
            <label>Nombre del torneo</label>
            <input
              value={form.tournamentName}
              onChange={(e) => update("tournamentName", e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Fecha</label>
              <input value={form.date} onChange={(e) => update("date", e.target.value)} />
            </div>
            <div className="field">
              <label>Premio mayor</label>
              <input value={form.prize} onChange={(e) => update("prize", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Ubicacion</label>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>

          <h2 style={{ marginTop: 28 }}>3. Datos del agente</h2>
          <div className="field-row">
            <div className="field">
              <label>Nombre del agente</label>
              <input
                value={form.contact.agent}
                onChange={(e) => updateContact("agent", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Telefono</label>
              <input
                value={form.contact.phone}
                onChange={(e) => updateContact("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Instagram del agente</label>
            <input
              value={form.contact.instagram}
              onChange={(e) => updateContact("instagram", e.target.value)}
            />
          </div>

          <h2 style={{ marginTop: 28 }}>4. Copy para publicacion</h2>
          <div className="field">
            <label>Descripcion / Caption</label>
            <textarea
              rows={4}
              value={form.caption}
              onChange={(e) => update("caption", e.target.value)}
            />
          </div>

          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={handleRender}
              disabled={rendering || uploaded.length === 0}
            >
              {rendering ? <span className="spinner" /> : null}
              {rendering ? "Renderizando..." : "Generar video (9:16)"}
            </button>
          </div>
        </section>

        <section className="panel results">
          <h2>Resultado</h2>

          {toast && <div className={`toast toast-${toast.kind}`}>{toast.text}</div>}

          {render ? (
            <>
              <div className="video-frame">
                <video src={render.videoUrl} controls autoPlay loop muted playsInline />
              </div>

              <div className="meta-list">
                <div>
                  <strong>Duracion:</strong> {render.durationSeconds.toFixed(1)}s
                </div>
                <div>
                  <strong>Tamano:</strong> {(render.sizeBytes / 1024 / 1024).toFixed(1)} MB
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>URL:</strong> {render.videoUrl}
                </div>
              </div>

              <div className="publish-section">
                <div className="section-title">5. Publicar</div>

                <div className="platform-grid">
                  {PLATFORMS.map((p) => (
                    <label key={p.id} className={`platform-chip ${selectedPlatforms.includes(p.id) ? "active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(p.id)}
                        onChange={() => togglePlatform(p.id)}
                      />
                      {p.icon} {p.label}
                    </label>
                  ))}
                </div>

                <div className="schedule-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={scheduleMode}
                      onChange={(e) => setScheduleMode(e.target.checked)}
                    />
                    Programar para despues
                  </label>
                </div>

                {scheduleMode && (
                  <div className="schedule-fields">
                    <div className="field-row">
                      <div className="field">
                        <label>Fecha</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Hora</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label>Zona horaria</label>
                      <select value={scheduleTz} onChange={(e) => setScheduleTz(e.target.value)}>
                        <option value="America/Santiago">America/Santiago (GMT-4/-3)</option>
                        <option value="America/Mexico_City">America/Mexico City (GMT-6)</option>
                        <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
                        <option value="America/Bogota">Colombia (GMT-5)</option>
                        <option value="America/Lima">Peru (GMT-5)</option>
                        <option value="America/New_York">New York (GMT-5/-4)</option>
                        <option value="Europe/Madrid">Madrid (GMT+1/+2)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-instagram"
                  onClick={handlePublish}
                  disabled={publishing || selectedPlatforms.length === 0}
                >
                  {publishing ? <span className="spinner spinner-light" /> : null}
                  {publishing
                    ? "Publicando..."
                    : scheduleMode
                      ? "Programar publicacion"
                      : `Publicar en ${selectedPlatforms.length} plataforma(s)`}
                </button>
              </div>

              <div className="scheduled-list">
                <div className="section-title">Programaciones</div>
                {scheduledPosts.length === 0 ? (
                  <div className="empty-state">No hay publicaciones programadas</div>
                ) : (
                  <div className="schedule-items">
                    {scheduledPosts
                      .filter((j) => j.status !== "cancelled")
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((job) => (
                        <div key={job.id} className="schedule-item">
                          <div className="schedule-item-main">
                            <span
                              className="schedule-status"
                              style={{ backgroundColor: statusColor(job.status) }}
                            >
                              {job.status}
                            </span>
                            <span className="schedule-title">{job.title.slice(0, 50)}</span>
                          </div>
                          <div className="schedule-item-meta">
                            <span>{new Date(job.scheduledAt).toLocaleString()}</span>
                            <span className="schedule-platforms">
                              {job.platforms.map((p) => PLATFORMS.find((x) => x.id === p)?.icon).join(" ")}
                            </span>
                          </div>
                          {job.status === "pending" && (
                            <button
                              className="btn-cancel"
                              onClick={() => handleCancelSchedule(job.id)}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                <button className="btn btn-secondary btn-sm" onClick={loadScheduledPosts}>
                  Recargar
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state-video">
              El video generado aparecera aqui en formato 9:16 listo para Reels.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
