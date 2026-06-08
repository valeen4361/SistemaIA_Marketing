import React from "react";

/**
 * Hook para generar videos con IA
 * Usa el endpoint /api/ai-render
 */

interface AIRenderResponse {
  ok: boolean;
  jobId: string;
  script?: string;
  imagenUrl?: string;
  metadata?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
  };
  message?: string;
  error?: string;
}

interface UseAIRenderOptions {
  baseUrl?: string;
  onProgress?: (message: string) => void;
}

export function useAIRender(options: UseAIRenderOptions = {}) {
  const baseUrl = options.baseUrl || "http://localhost:3000";
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AIRenderResponse | null>(null);

  const generateVideo = async (
    imageFile: File,
    textoOverlay: string,
    context?: Record<string, any>
  ): Promise<AIRenderResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      options.onProgress?.("Preparando imagen...");

      const formData = new FormData();
      formData.append("imagen", imageFile);
      formData.append("textoOverlay", textoOverlay);

      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
        });
      }

      options.onProgress?.("Generando script con IA (MiniMax M3)...");

      const response = await fetch(`${baseUrl}/api/ai-render`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AIRenderResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Error desconocido");
      }

      options.onProgress?.("Script generado exitosamente");
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      options.onProgress?.(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    generateVideo,
    reset: () => {
      setError(null);
      setResult(null);
    },
  };
}
