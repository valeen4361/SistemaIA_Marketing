# Poker Marketing Studio

Sistema de IA para marketing de un club de poker. El equipo de marketing sube
fotos de un torneo, el sistema genera automaticamente un **reel vertical 1080x1920**
con Remotion (transiciones suaves, zoom, texto animado, pantalla de contacto y
musica de fondo) y lo publica en Instagram con un click usando la API de
[Upload-Post](https://upload-post.com).

```
JPGs  ->  Express API  ->  Remotion render  ->  MP4 9:16  ->  Instagram
                              (smooth ken-burns, fade, text, music)
```

## Estructura del proyecto

```
.
├── backend/         # Express + TypeScript: upload, render, publish
├── remotion/        # Composicion Remotion 1080x1920 (PokerReel)
├── frontend/        # React + Vite: UI para el equipo de marketing
├── .env             # Variables de entorno (UPLOADPOST_API_KEY, etc.)
└── README.md
```

## Stack

| Capa       | Tecnologia                                     |
|------------|------------------------------------------------|
| Frontend   | React 18 + Vite + TypeScript                   |
| Backend    | Express 4 + TypeScript + Multer                |
| Video      | Remotion 4 + @remotion/transitions             |
| Audio      | @remotion/media (mp3 de fondo)                 |
| Publicacion| Upload-Post.com API (multipart)                |

## Setup rapido

### 1. Instalar dependencias (cada subproyecto)

```bash
cd backend   && npm install
cd ../remotion && npm install
cd ../frontend && npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` en la raiz y completa los valores. La API key de
Upload-Post ya esta precargada en el `.env` que entrego el proyecto.

```env
UPLOADPOST_API_KEY=tu_api_key
UPLOADPOST_USER=poker-club-marketing
```

### 3. Colocar musica de fondo (opcional)

Si quieres musica, copia un archivo `soundtrack.mp3` a
`remotion/public/soundtrack.mp3` y modifica el request de render para enviar
`music: "soundtrack.mp3"`.

### 4. Arrancar todo (3 terminales)

```bash
# Terminal 1 - Backend (puerto 4000)
cd backend && npm run dev

# Terminal 2 - Frontend (puerto 5173)
cd frontend && npm run dev

# Terminal 3 (opcional) - Remotion Studio para previsualizar
cd remotion && npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Flujo de uso

1. **Subir fotos** - 3 a 6 fotos JPG del torneo, casino, mesa, jugadores, etc.
2. **Completar datos** - nombre del torneo, fecha, premio, ubicacion, datos del
   agente y copy de Instagram.
3. **Generar video** - el backend renderiza con Remotion un MP4 vertical 9:16
   de 20-30 segundos.
4. **Previsualizar** - el video aparece en la columna derecha con controles.
5. **Publicar en Instagram** - un click sube el archivo generado a Instagram via
   la API de Upload-Post. Se muestra un toast de exito o error.

## Composicion Remotion (PokerReel)

Resolucion: **1080 x 1920** (9:16 vertical para Reels/Stories).

Estructura de la timeline (para 5 fotos, ~28s):

```
[ TitleScene ]  ─fade─  [ Photo 1 ]  ─fade─  [ Photo 2 ]  ...  ─fade─  [ ContactScene ]
   4s                  4s              4s                                    5s
```

- **TitleScene**: nombre del torneo, fecha, lugar y premio mayor.
- **PhotoScene** (una por imagen): Ken Burns con smooth time-remapping,
  alternando la direccion del pan/zoom entre imagenes (efecto "reverse" del
  par). Texto animado con linea dorada y subcaption (fecha o ubicacion).
- **ContactScene**: pantalla final con datos del agente y CTA "#PokerLife".

Las transiciones entre escenas son **crossfades** de 18 frames (0.6s) usando
`<TransitionSeries>` de `@remotion/transitions`.

Si se envia `music` en el request de render, se agrega un `<Audio>` con loop y
volumen al 55% durante toda la composicion.

## Endpoints del backend

| Metodo | Ruta              | Descripcion                                      |
|--------|-------------------|--------------------------------------------------|
| GET    | `/api/health`     | Estado del servidor y de la API key              |
| POST   | `/api/upload`     | Sube hasta 12 imagenes (multipart `images[]`)    |
| POST   | `/api/render`     | Renderiza el video con Remotion                  |
| POST   | `/api/publish`    | Publica el archivo generado en Instagram         |
| GET    | `/uploads/:f`     | Sirve las imagenes subidas                       |
| GET    | `/renders/:f`     | Sirve los videos renderizados                    |

### Ejemplo: `POST /api/render`

```json
{
  "images": ["http://localhost:4000/uploads/abc.jpg"],
  "tournamentName": "Torneo Copa Verano",
  "date": "15 de Junio 2026",
  "prize": "$5,000 USD",
  "location": "Casino Central, CDMX",
  "contact": {
    "agent": "Carlos Mendoza",
    "phone": "+52 55 1234 5678",
    "instagram": "@pokerclubmx"
  },
  "music": "soundtrack.mp3",
  "durationPerPhoto": 4
}
```

Respuesta:

```json
{
  "ok": true,
  "jobId": "a1b2c3d4e5f6",
  "videoPath": "/renders/reel-a1b2c3d4e5f6.mp4",
  "videoUrl": "http://localhost:4000/renders/reel-a1b2c3d4e5f6.mp4",
  "durationSeconds": 28.4,
  "sizeBytes": 8423112
}
```

### Ejemplo: `POST /api/publish`

```json
{
  "imagePath": "./renders/reel-a1b2c3d4e5f6.mp4",
  "title": "Copa Verano 15 de Junio - $5,000 USD en premios",
  "platforms": ["instagram"]
}
```

El backend hace `multipart/form-data` a
`https://api.upload-post.com/api/upload` con:

- `user`: `poker-club-marketing` (configurable)
- `platform[]`: `instagram`
- `video` o `image`: el archivo generado
- `title`: el copy de Instagram

Header:

```
Authorization: Apikey <UPLOADPOST_API_KEY>
```

## Iteraciones futuras

- Plantillas predefinidas (torneos, rankings, promociones).
- Banco de musica integrado.
- Dashboard con metricas de rendimiento.
- Integracion con n8n para workflows automaticos.
- Hashtag generator con IA.
- Multi-idioma.
