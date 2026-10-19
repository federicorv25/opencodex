---
title: "Puente de video"
description: "Generar vídeos con Grok Imagine Video a través de un modelo que no sea OpenAI."
---

<a id="overview"></a>

## Descripción general

El puente de vídeo le permite utilizar xAI de Grok Imagine Generación de vídeo a través de cualquier modelo que no sea OpenAI dirigido por opencodex. Cuando se activa, un `video_gen` La herramienta se inyecta en la conversación. El modelo lo llama como cualquier herramienta de función; opencodex intercepta la llamada, envía una generación de video trabajo en xAI, sondeos hasta su finalización y descarga el resultado.

<a id="prerequisites"></a>

## Requisitos previos

- Un `xai` entrada del proveedor con un **Clave API** (`ocx login xai` solo no es suficiente — el puente de vídeo requiere autenticación clave, no OAuth)
- Un modelo que no sea OpenAI como su proveedor de rutas (e.g. Anthropic Claude, Google Gemini
- opencodex configurado para enrutarse a través del proveedor que no es OpenAI

> **⚠ Se requiere clave de proveedor:** El puente de vídeo solo se activa cuando el `xai` proveedor utiliza > API clave de autenticación. Añade esto a tu configuración:
>
> ```json
> {
>   "providers": {
>     "xai": { "adapter": "openai-chat", "apiKey": "xai-…", "authMode": "key" }
>   }
> }
> ```
>
> Si te has embarcado vía `ocx login xai` (OAuth), el proveedor permanece en `authMode: "oauth"`
> y el puente en silencio no se activarán. Establecer `XAI_API_KEY` en el medio ambiente **o**
> código duro de la clave como se muestra arriba.

<a id="configuration"></a>

## Configuración

Añadir `videoBridgeEnabled: true` a su `images` config:

```json
{
  "images": {
    "bridgeEnabled": true,
    "videoBridgeEnabled": true,
    "videoBridgeModel": "grok-imagine-video",
    "videoMaxRounds": 2,
    "videoTimeoutMs": 300000
  }
}
```

| Opción | Predeterminado | Descripción |
|--------|---------|-------------|
| `videoBridgeEnabled` | `false` | Interruptor maestro. Debe estar explícitamente habilitado. |
| `videoBridgeModel` | `"grok-imagine-video"` | ID de modelo de vídeo xAI. |
| `videoMaxRounds` | `2` | Max video-gen rondas antes de la respuesta final forzada. |
| `videoTimeoutMs` | `300000` (5 min) | Tiempo de espera por video, incluida la votación. |

<a id="how-it-works"></a>

## Cómo funciona

1. opencodex detecta un modelo enrutado no-OpenAI con `videoBridgeEnabled: true`
2. Un sintético `video_gen` herramienta de función se inyecta en la conversación
3. Cuando el modelo llama `video_gen`, opencodex envía un trabajo a xAI `/videos/generations`
4. El puente sondea el estado del trabajo cada 5-15 segundos, enviando mensajes de latido para mantener viva la transmisión
5. Cuando el video está listo, se descarga en el directorio de artefactos
6. La ruta local del archivo se devuelve al modelo como resultado de la herramienta

<a id="supported-parameters"></a>

## Parámetros soportados

Los `video_gen` herramienta acepta:

| Parámetro | Tipo | Alcance | Descripción |
|-----------|------|-------|-------------|
| `prompt` | cadena | requerido | Indicación detallada de generación de vídeo |
| `duration` | entero | 1-15 | Duración del vídeo en segundos |
| `resolution` | cadena | `"480p"`, `"720p"` | Resolución de vídeo |
| `aspect_ratio` | cadena | 7 relaciones | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `3:2`, `2:3` |

<a id="limitations"></a>

## Limitaciones

- **Solo xAI**: La generación de videos solo está disponible a través de xAI's Grok Imagine Video API
- **Asíncrono**: La generación de video toma 30-120 segundos
- **Coste**: La generación de vídeo es una función xAI pagada (~$0,05/seg. 480p, ~$0,07/seg. 720p)
- **Un video por llamada**: Cada uno `video_gen` llamada produce un video
- **Coexiste con Image Bridge**: Ambos puentes se pueden habilitar simultáneamente
- **Prioridad de búsqueda web**: Cuando un sidecar de búsqueda web está activo durante un turno (no`runTurn` adaptador), el puente de vídeo se salta — los dos no pueden ejecutarse simultáneamente. A `console.warn` se emite para que pueda detectar esto en registros.
- **Tiempo de espera cubre enviar + encuesta**: El `videoTimeoutMs` El presupuesto comienza antes de la presentación del trabajo, por lo que la convocatoria de presentación (60 s) y las encuestas posteriores comparten el mismo plazo.
