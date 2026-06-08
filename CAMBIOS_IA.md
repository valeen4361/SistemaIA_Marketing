# 🎯 Cambios Implementados - Generación de Videos con IA

## Archivos Nuevos Creados

### Backend
1. **`backend/src/services/aiScriptGenerator.ts`**
   - Genera scripts Remotion con MiniMax M3
   - Formatea scripts para compatibilidad
   - Maneja errores de API

2. **`backend/src/routes/aiRender.ts`**
   - Nuevo endpoint `POST /api/ai-render`
   - Acepta imagen + texto
   - Retorna script generado + metadata

3. **`backend/.env`** (plantilla)
   - Debes agregar tu `OPENROUTER_API_KEY`

### Frontend
4. **`frontend/src/hooks/useAIRender.ts`**
   - Hook React para consumir `/api/ai-render`
   - Maneja loading, error, resultado
   - Callback para mostrar progreso

### Documentación
5. **`API_AI_RENDER.md`**
   - Guía completa del endpoint
   - Ejemplos de uso
   - Instrucciones para OpenRouter

## Archivos Modificados

### Backend
- **`backend/src/server.ts`**
  - Agregada importación de aiRenderRoutes
  - Registrado endpoint `/api/ai-render`

## 🔧 Configuración Requerida

### 1. Obtén una API Key de OpenRouter

```bash
# Ve a https://openrouter.ai
# Crea una cuenta gratis
# Copia tu API Key
```

### 2. Configura el .env

```bash
cd backend
# Copia .env.example a .env
# Edita .env y pega tu API Key
```

**backend/.env:**
```
OPENROUTER_API_KEY=sk-or-xxxxx-xxxxx
PORT=3000
NODE_ENV=development
```

### 3. Reinicia el backend

```bash
npm run dev:backend
```

## 🚀 Cómo Usar

### Opción 1: Con curl (testing)
```bash
curl -X POST \
  -F "imagen=@mi-imagen.jpg" \
  -F "textoOverlay=Torneo Poker 15 Junio" \
  -F "tournamentName=Gran Torneo" \
  http://localhost:3000/api/ai-render
```

### Opción 2: Con JavaScript (Frontend)
```tsx
import { useAIRender } from "@/hooks/useAIRender";

function MyComponent() {
  const { generateVideo, loading, result, error } = useAIRender({
    onProgress: (msg) => console.log(msg),
  });

  const handleGenerate = async (file: File, texto: string) => {
    const result = await generateVideo(file, texto, {
      tournamentName: "Gran Torneo",
      date: "15 Junio 2026",
    });
    
    if (result?.script) {
      console.log("Script generado:", result.script);
      // Ahora puedes renderizar con Remotion
    }
  };

  return (
    <button onClick={() => handleGenerate(file, "Tu texto")}>
      {loading ? "Generando..." : "Generar Video"}
    </button>
  );
}
```

## 📊 Flujo Completo

```
1. Usuario sube imagen + texto en frontend
   ↓
2. Frontend llama POST /api/ai-render (multipart form)
   ↓
3. Backend convierte imagen a base64
   ↓
4. Backend llama MiniMax M3 en OpenRouter
   ↓
5. MiniMax genera script TypeScript/React
   ↓
6. Backend formatea y valida script
   ↓
7. Backend retorna script + metadata
   ↓
8. Frontend renderiza con Remotion Studio o automático
```

## ⚠️ Notas Importantes

- **Costo**: Cada llamada a MiniMax M3 consume tokens (verificar créditos en OpenRouter)
- **Límites**: Máx 25MB de imagen, solo JPG/PNG/WEBP
- **Performance**: Primera llamada puede tardar 5-15 segundos (depende de OpenRouter)
- **API Key**: Mantén tu clave segura en variables de entorno, NUNCA en código

## 🐛 Troubleshooting

### "OPENROUTER_API_KEY no está configurada"
```
✗ Verifica que backend/.env exista
✗ Verifica que tenga la clave correcta
✗ Reinicia el backend: npm run dev:backend
```

### "Network request to openrouter failed"
```
✗ Verifica conexión a internet
✗ Verifica que la API key sea válida
✗ Verifica que tengas créditos en OpenRouter
```

### Script generado no funciona en Remotion
```
✗ Posible que MiniMax generó sintaxis incorrecta
✗ Revisa los logs del backend (console output)
✗ Intenta con texto más simple en textoOverlay
```

## 📝 Próximos Pasos

1. ✅ Configura OpenRouter API Key
2. ✅ Reinicia backend
3. ✅ Prueba endpoint con curl
4. ✅ Integra hook en componente del frontend
5. ✅ Testea flujo completo
6. ⏳ (Opcional) Agregar caché de scripts generados
7. ⏳ (Opcional) Agregar preview antes de renderizar
