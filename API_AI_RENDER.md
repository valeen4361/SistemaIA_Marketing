# API de Generación de Videos con IA

## Nuevo Endpoint: `/api/ai-render`

### Descripción
Genera videos de Remotion dinámicamente usando IA (MiniMax M3). La imagen se procesa por IA para generar un script Remotion personalizado.

### Flujo
```
Usuario carga imagen + texto 
    ↓
Backend convierte imagen a base64
    ↓
MiniMax M3 genera script TypeScript/React
    ↓
Script se formatea para Remotion
    ↓
Se retorna para renderizar
```

### Método
`POST /api/ai-render`

### Parámetros

#### Multipart Form Data
```
- imagen: File (JPG, PNG, WEBP, máx 25MB)
- textoOverlay: string (requerido)
- tournamentName: string (opcional)
- date: string (opcional)
- prize: string (opcional)
- location: string (opcional)
- contact: JSON object (opcional)
```

### Ejemplo de uso (JavaScript/Fetch)

```javascript
const formData = new FormData();
formData.append("imagen", imageFile);
formData.append("textoOverlay", "Torneo Poker – 15 Junio");
formData.append("tournamentName", "Gran Torneo");
formData.append("date", "15 de Junio 2026");

const response = await fetch("http://localhost:3000/api/ai-render", {
  method: "POST",
  body: formData,
});

const result = await response.json();
// result.script contiene el código Remotion generado
// result.imagenUrl es la URL de la imagen subida
// result.metadata tiene stats de tokens usado
```

### Respuesta exitosa (200)
```json
{
  "ok": true,
  "jobId": "a1b2c3d4e5f6",
  "script": "export const AIGeneratedScene: React.FC<...> = { ... }",
  "imagenUrl": "http://localhost:3000/uploads/ai-1717...jpg",
  "metadata": {
    "model": "minimax/minimax-m3",
    "promptTokens": 456,
    "completionTokens": 1234
  },
  "message": "Script generado. Procede a renderizar con /render"
}
```

### Respuesta de error (400/500)
```json
{
  "ok": false,
  "error": "Descripción del error",
  "jobId": "a1b2c3d4e5f6"
}
```

## Endpoints tradicionales (sin cambios)

### `POST /api/upload` - Subir imágenes
```bash
curl -X POST -F "images=@photo1.jpg" http://localhost:3000/api/upload
```

### `POST /api/render` - Renderizar video (estándar)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "images": ["url1", "url2"],
    "tournamentName": "Torneo Poker",
    "date": "15 Junio"
  }' \
  http://localhost:3000/api/render
```

## Variables de entorno requeridas

```
OPENROUTER_API_KEY=sk-or-...   # Obtén en https://openrouter.ai
```

### Cómo obtener la clave
1. Ve a https://openrouter.ai
2. Regístrate o inicia sesión
3. Copia tu API Key
4. Pégala en `backend/.env`

## Limitaciones
- Máximo 25MB de imagen
- Solo JPG, PNG, WEBP
- Depende de disponibilidad de MiniMax M3 en OpenRouter
- Cada llamada consume tokens (verificar créditos en OpenRouter)
