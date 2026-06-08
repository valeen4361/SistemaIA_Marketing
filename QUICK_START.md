# 🚀 Guía Rápida - Videos con IA en Remotion

## ✅ Estado Actual

- ✅ Backend corriendo en `http://localhost:3000`
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ Nuevo endpoint `/api/ai-render` disponible
- ⏳ **Falta**: Configurar `OPENROUTER_API_KEY`

## 📋 Pasos Siguientes (5 minutos)

### 1️⃣ Obtén una API Key (GRATIS)

```bash
# Ve a: https://openrouter.ai
# Crea una cuenta (gratis)
# Copia tu API Key
```

### 2️⃣ Configura en backend/.env

```bash
# Abre backend/.env y reemplaza:
OPENROUTER_API_KEY=sk-or-xxxxx-xxxxx  ← TU CLAVE AQUÍ
```

### 3️⃣ Reinicia el backend

```bash
# Termina el proceso (Ctrl+C) y ejecuta:
npm run dev:backend
```

### 4️⃣ Prueba el endpoint

**Opción A: Con curl**
```bash
curl -X POST \
  -F "imagen=@tu-imagen.jpg" \
  -F "textoOverlay=Torneo Poker 15 Junio" \
  -F "tournamentName=Gran Torneo" \
  http://localhost:3000/api/ai-render
```

**Opción B: Con JavaScript**
```javascript
const form = new FormData();
form.append("imagen", imageFile);
form.append("textoOverlay", "Tu texto aquí");

const response = await fetch("http://localhost:3000/api/ai-render", {
  method: "POST",
  body: form
});

const result = await response.json();
console.log("Script generado:", result.script);
```

## 📁 Archivos Nuevos Creados

```
backend/
├── src/
│   ├── services/
│   │   └── aiScriptGenerator.ts      ← Genera scripts con MiniMax M3
│   ├── routes/
│   │   └── aiRender.ts               ← Endpoint POST /api/ai-render
│   └── server.ts                     ← MODIFICADO: agregada ruta
├── .env                               ← NUEVO: variables de entorno
└── .env.example                       ← NUEVO: plantilla

frontend/
└── src/
    └── hooks/
        └── useAIRender.ts            ← Hook React para consumir API
```

## 🎯 Flujo Completo

```
1. Usuario sube imagen en frontend
   ↓
2. Frontend llama POST /api/ai-render
   ↓
3. Backend convierte imagen a base64
   ↓
4. Backend llama MiniMax M3 (OpenRouter)
   ↓
5. MiniMax M3 genera script Remotion
   ↓
6. Backend retorna script + metadata
   ↓
7. Frontend renderiza con Remotion
```

## 🔧 Integración en Frontend (Opcional)

En tu componente React:

```tsx
import { useAIRender } from "@/hooks/useAIRender";

export function VideoGenerator() {
  const { generateVideo, loading, result, error } = useAIRender({
    onProgress: (msg) => console.log(msg)
  });

  const handleSubmit = async (file: File) => {
    const result = await generateVideo(file, "Tu texto aquí", {
      tournamentName: "Mi Torneo"
    });
    
    if (result?.script) {
      // Ahora tienes el script de Remotion generado
      console.log("Listo para renderizar:", result.script);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleSubmit(e.target.files?.[0])} />
      {loading && <p>Generando...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
```

## ⚠️ Notas Importantes

- **Costo**: Cada llamada consume tokens de OpenRouter (~$0.01-0.10 por video)
- **Límites**: Máx 25MB imagen, solo JPG/PNG/WEBP
- **Tiempo**: Primera llamada tarda 5-15 segundos
- **API Key**: Mantén segura, NO expongas en cliente

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| "OPENROUTER_API_KEY no configurada" | Verifica `backend/.env`, reinicia backend |
| "Network error" | Verifica conexión a internet, API key válida |
| "Script inválido" | Prueba con texto más simple, revisa logs del backend |
| Backend no inicia | Verifica que los ports 3000 y 5173 estén libres |

## 📚 Más Información

- [Documentación completa: API_AI_RENDER.md](./API_AI_RENDER.md)
- [Cambios realizados: CAMBIOS_IA.md](./CAMBIOS_IA.md)
- [OpenRouter API: https://openrouter.ai/docs](https://openrouter.ai/docs)
- [MiniMax M3: Modelo multimodal de IA](https://openrouter.ai/models)

## ✅ Checklist

- [ ] Registrado en OpenRouter (https://openrouter.ai)
- [ ] Copié mi API Key
- [ ] Configuré `backend/.env` con la API Key
- [ ] Reinicié el backend (`npm run dev:backend`)
- [ ] Probé endpoint con curl o JavaScript
- [ ] Integré hook `useAIRender` en componente del frontend
- [ ] Generé primer video con IA ✨
