---
title: "Puente de imágenes"
description: "Route image_generation llamadas de herramienta alojada a xAI Grok Imagine cuando se utiliza un proveedor que no sea OpenAI."
---

<a id="overview"></a>

## Descripción general

Cuando enruta Codex a través de un modelo que no sea OpenAI (Claude, Gemini, Grok, etc.), el
`image_generation` **herramienta alojada** normalmente no funciona — requiere el lado del servidor de OpenAI entorno de ejecución. El puente de imagen detecta estas llamadas y las redirige transparentemente a xAI Grok Imagine, por lo que el modelo con el que está chateando puede generar imágenes.

<a id="prerequisites"></a>

## Requisitos previos

- **Habilitar el puente** mediante el establecimiento `images.bridgeEnabled: true` en su configuración (está desactivado por por defecto para evitar inesperados cargos xAI — ver [Configuración](#configuration) infra).
- Un `xai` entrada del proveedor con un **Clave API**. El puente de imagen Responses fija el cumplimiento a la registro xAI Endpoint de imágenes (`https://api.x.ai/v1`); cualquier `baseUrl` Anular es Ignorado para llamadas de imagen. OAuth / `ocx login xai` Solo hace **no** arme este bucle sidecar. El mismo `bridgeEnabled` bandera hace armar el separado Codex `/v1/images` relé para que el incorporado
  `image_gen` El cliente puede llamar a Imagine con el Grok CLI subvención — ver
  [Generación de imagen incorporada](/es/guides/codex-integration/#built-in-image-generation-image_gen). Si falta esa concesión (o una clave xAI API), `/v1/images` devuelve un error en lugar de cayendo a través de ChatGPT.

  El relé solo posee la ruta cuando no hay ningún proveedor de imágenes configurado: se ejecuta cuando
  `images.bridgeEnabled` es `true` **y** `images.provider` se omite. Configuración
  `images.provider` explícitamente manos `/v1/images` a ese proveedor, y a su propio Los errores de validación se devuelven tal cual en lugar de volver a intentarlo a través de xAI.

  ```json
  {
    "providers": {
      "xai": { "adapter": "openai-chat", "apiKey": "xai-…", "authMode": "key" }
    }
  }
  ```

- Un modelo que no sea OpenAI seleccionado como su proveedor activo. (Cuando el proveedor activo es OpenAI, la herramienta alojada nativa se utiliza directamente y el puente se pasa por alto.)

<a id="configuration"></a>

## Configuración

Image Opciones de puente en vivo bajo `images` en `~/.opencodex/config.json`. Bridging es
**opt-in** — debe establecer `bridgeEnabled: true` para habilitar la generación de pago xAI Grok Imagine:

```json
{
  "images": {
    "bridgeEnabled": true,
    "bridgeModel": "grok-imagine-image-quality",
    "maxRounds": 3,
    "timeoutMs": 60000
  }
}
```

| Opción | Predeterminado | Descripción |
| --- | --- | --- |
| `bridgeEnabled` | `false` | Interruptor maestro. Establecer `true` para permitir el bridge. Desactivado por defecto para evitar cargos inesperados de xAI. |
| `bridgeModel` | `grok-imagine-image-quality` | El identificador de modelo de imagen xAI al que enviar mensajes. |
| `maxRounds` | `3` | Iteraciones máximas de bucle de generación de imágenes por turno. Fijado a un entero y sujetado a `[0, 10]`Los valores no finitos vuelven a `3`. |
| `timeoutMs` | `60000` | Fecha límite de xAI por llamada en milisegundos. Los valores positivos finitos se minimizan y pasan a la solicitud xAI. |
| `artifactsKeepCount` | `200` | Número máximo de archivos retenidos bajo `artifacts/`. Cuando se excede, los archivos más antiguos se eliminan después de cada llamada completada. Configurar `0` o un valor negativo para deshabilitar la poda. |

<a id="artifact-retention"></a>

## Retención de artefactos

Las imágenes generadas se escriben en `~/.opencodex/artifacts/`. Para evitar el disco sin límites en sesiones de larga duración, el directorio se poda automáticamente después de cada llamada de imagen (una vez que el lote completo para esa llamada está en disco) — los archivos más antiguos (por modificación tiempo) se eliminan cuando el recuento excede el máximo configurado (por defecto 200, configurable
`images.artifactsKeepCount`) Solo las rutas que sobreviven a la poda se devuelven al modelo.

<a id="how-it-works"></a>

## Cómo funciona

El puente de imagen se activa solo en **Responses** giros que incluyen el hosted
`image_generation` En el `/v1/responses` herramientas mientras que un **non-OpenAI**
El modelo está seleccionado. Lo hace **no** interceptar el sistema integrado de Codex `image_gen` herramienta, cual se envía directamente a `/v1/images/generations` (o `/images/edits`) — esa ruta Se cubre por separado en [Integración con Codex](/es/guides/codex-integration/#built-in-image-generation-image_gen).

1. Cuando se muestra una solicitud Responses `image_generation` en `tools`, OpenCodex lo detecta durante el preprocesamiento de solicitudes.
2. La herramienta alojada se sustituye por un **herramienta de función sintética** que el modelo enrutado puede llamar normalmente — el modelo ve una herramienta llamable en lugar de una herramienta alojada opaca que no puede ejecutar.
3. Cuando el modelo invoca esa herramienta, OpenCodex intercepta la llamada y envía el mensaje a xAI. generación de imágenes API.
4. Las imágenes generadas se guardan en `~/.opencodex/artifacts/` y el **ruta de acceso de archivo local** es devuelto como resultado de la herramienta.
5. El modelo continúa la conversación con el conocimiento de la imagen generada y su ubicación.

Desde la perspectiva del modelo nada cambió — llamó a una herramienta y obtuvo un resultado. Desde el usuario En perspectiva, la generación de imágenes funciona con cualquier proveedor enrutado en lugar de fallar silenciosamente.

<a id="limitations"></a>

## Limitaciones

- **Solo se admite xAI Grok Imagine.** DALL-E y otros proveedores de imágenes se pueden agregar más tarde.
- **La búsqueda web tiene prioridad** en adaptadores que soportan el bucle sidecar de búsqueda web. Si ambos sitios web se solicitan búsqueda y generación de imágenes en el mismo turno, La generación se salta. Cursor/`runTurn` adaptadores no pueden usar ese sidecar hoy, por lo que la imagen El puente todavía puede funcionar para esos giros de doble herramienta.
- **Se aplican costos de xAI.** La generación de imágenes a través de xAI requiere una suscripción activa a xAI o créditos API.
- **Sólo streaming.** El puente funciona interceptando el flujo de respuesta SSE; solicitudes con
  `stream: false` Se rechazan con un error de 400.
