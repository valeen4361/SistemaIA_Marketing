import fetch from "node-fetch";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v3";

interface GeneratedScript {
  script: string;
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Genera un script de Remotion dinámicamente usando un modelo de OpenRouter
 * @param imagenBase64 - Imagen en formato base64
 * @param textoOverlay - Texto a mostrar en el video
 * @param contexto - Contexto adicional (nombre del torneo, etc)
 */
export async function generarScriptRemotion(
  imagenBase64: string,
  textoOverlay: string,
  contexto?: Record<string, any>
): Promise<GeneratedScript> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY no está configurada");
  }

  const promptSistema = `Eres un asistente experto en TypeScript, React y Remotion. Genera código válido para Remotion v4.0.0 y no incluyas ningún comentario ni texto explicativo extra.

La salida debe ser el cuerpo de un componente React válido que use los valores de imagen y texto proporcionados. No incluyas la definición del componente completa ni los imports.`;

  const promptUsuario = `Genera el cuerpo de un componente React para Remotion que muestre un video vertical 9:16 (1080x1920), con esta imagen en base64 y un texto overlay.
- La imagen base64 se puede usar como src de un <Img /> o dentro de un style background.
- El video debe usar animación de zoom suave y fade in/out.
- El texto overlay debe ser visible en pantalla y tener estilo moderno.
- Usa <AbsoluteFill>, <Sequence>, spring(), interpolate() y useCurrentFrame() si es necesario.
- No generes imports ni export default.
- El componente debe ser válido TypeScript para Remotion.

Datos:
- Imagen base64: ${imagenBase64.substring(0, 50)}...
- Texto overlay: "${textoOverlay}"
- Duración recomendada: 30 segundos (900 frames a 30 fps)
${contexto ? `- Contexto adicional: ${JSON.stringify(contexto)}` : ""}

Retorna SOLO el cuerpo del componente:`;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Poker Marketing Studio",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: promptSistema,
          },
          {
            role: "user",
            content: promptUsuario,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return {
      script: data.choices[0].message.content,
      metadata: {
        model: data.model,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      },
    };
  } catch (error) {
    console.error(`Error al generar script con el modelo ${OPENROUTER_MODEL}:`, error);
    throw error;
  }
}

/**
 * Convierte el script generado a un componente Remotion válido
 */
export function formatearScriptParaRemotion(
  scriptGenerado: string,
  nombreComponente: string = "GeneratedScene"
): string {
  const imports = `import React from "react";
import { useVideoConfig, AbsoluteFill, Img, Sequence, spring, interpolate, useCurrentFrame } from "remotion";\n\n`;

  const componenteWrapped = `export const ${nombreComponente}: React.FC<{ imageUrl: string; text: string }> = ({ imageUrl, text }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  ${scriptGenerado}
};\n`;

  return imports + componenteWrapped;
}
