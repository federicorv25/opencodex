---
title: "Arquitectura"
description: "opencodex integra el mapa del módulo —, el puente AdapterEvent, el analizador de solicitudes y el almacenamiento en caché."
---

opencodex es un único proceso Bun. Una solicitud ingresa como OpenAI Responses, se normaliza a un modelo, enrutado, enviado a un proveedor a través de un adaptador, y puenteado de nuevo a Responses SSE. Véase
[Cómo funciona](/es/getting-started/how-it-works/) para el flujo de extremo a extremo.

<a id="module-map"></a>

## Mapa del módulo

```
src/
├── cli/                # ocx command dispatch, init, status, provider commands
├── server/             # Bun.serve, /v1/* proxy, /api/* management API, WS bridge
├── codex/              # Codex config injection, catalog sync, auth/account integration
├── providers/          # provider metadata, API-key pool, quota and labels
├── adapters/           # wire adapters, shared guards/utilities, Cursor protobuf transport
├── oauth/              # OAuth providers, API-key catalog, token store/refresh
├── usage/              # request usage extraction, JSONL logs, summaries, totals
├── lib/                # runtime, process, retry, privacy, token estimate helpers
├── web-search/         # web-search sidecar (synthetic tool, loop, executor, parser)
├── vision/             # vision sidecar (describe + plan)
├── config.ts           # ~/.opencodex/config.json, defaults, PID, env resolution
├── router.ts           # model id → provider + adapter
├── bridge.ts           # facade over bridge/
├── bridge/             # AdapterEvent stream → Responses SSE (sse.ts) / JSON (response-json.ts)
├── reasoning-effort.ts # reasoning-effort translation, clamping, and catalog levels
├── responses/
│   ├── parser.ts       # Responses request → OcxParsedRequest
│   ├── schema.ts       # Zod validation
│   └── compaction.ts   # remote compaction prompts, envelopes, compact history
├── service.ts          # launchd / systemd / Task Scheduler background service
├── types.ts            # core interfaces + helpers (modelInList, namespacedToolName)
└── index.ts            # public entry
```

Varios archivos de entrada anteriormente grandes ahora conservan la compatibilidad como fachadas: `codex/catalog.ts` exportaciones Su enfocado `codex/catalog/*.ts` módulos, `server/management-api.ts` despachos a
`server/management/*.ts`, `server/responses.ts` exportaciones `server/responses/*.ts`, y `bridge.ts`
reexportaciones `bridge/*.ts`. Una fachada es la ruta de importación estable, no la implementación: cada paso nombre del módulo que posee el código, y `structure/transports/responses.md` lleva el inventario completo del propietario para la superficie Responses.

<a id="request-flow"></a>

## Flujo de solicitudes

`server/index/serve-options.ts` posee el límite HTTP y delega el plano de datos Responses a la `server/responses.ts` La fachada y su `server/responses/*.ts` módulos:

1. `server/index/serve-options.ts` aplica la autenticación CORS y API, rechaza nuevo trabajo mientras drena con HTTP 503, JSON `error.code: "server_restarting"`, y `Retry-After: 5`, y registros solicitar metadatos del ciclo de vida. Las respuestas de drenaje usan la directiva CORS del oyente receptor. Sirve `GET /v1/models`, `POST /v1/responses`,
   `POST /v1/responses/compact`, `POST /v1/images/generations` / `POST /v1/images/edits`
   (retransmitido a una familia OpenAI de origen por `server/images.ts` para el códice incorporado `image_gen`
   herramienta), `POST /v1/live` / `POST /v1/realtime/calls` (ChatGPT / Codex App voz y OpenAI Llamada-crear en tiempo real, transmitida por `server/live.ts`), banda lateral WebSocket se une
   `/v1/live/{callId}` (y `/v1/realtime?call_id=`), y la actualización opcional WebSocket en
   `/v1/responses`.
2. `server/responses/request-prepare.ts` descomprime y analiza JSON, expande localmente recordado
   `previous_response_id` entrada cuando esté disponible, luego llama `responses/parser.ts`.
3. `router.ts` Resolver un desnudo o `provider/model` id. El servidor resuelve la cuenta Codex afinidad, actualiza el proveedor OAuth cuando sea necesario y aplica la credencial seleccionada a la ruta.
4. Antes de la llamada principal, `vision/` describe imágenes para modelos en `noVisionModels`; si no hay caja fuerte Si existe una ruta sidecar, las imágenes se eliminan en lugar de enviarse a un flujo ascendente solo de texto.
5. `server/adapter-resolve.ts` aplica cualquier anulación de cable específica del modelo y construye uno de los adaptadores registrados. Responses retransmite el cuerpo nativo, Cursor ejecuta su sistema bidireccional
   `runTurn` transporte, y adaptadores traducidos compilar/fetch/parse una petición ascendente.
6. Para modelos enrutados con un host `web_search` herramienta, `web-search/` expone una función sintética, ejecuta la búsqueda real a través del backend configurado (el sidecar OpenAI/ChatGPT o Anthropic), devuelve los resultados al modelo enrutado y se repite dentro del límite de bucle configurado. Este bucle admite solo la ruta estándar HTTP; adaptadores que implementan `runTurn`, como Cursor, omitalo.
7. `bridge/sse.ts` / `bridge/response-json.ts` produce Responses SSE o JSON `server/request-log.ts` y `usage/` terminal de recogida estado, latencia, etiquetas de proveedor/modelo y uso token de mejor esfuerzo sin cambiar la respuesta.

La estimación de entrada previa al envío sigue lo que realmente envía el adaptador enrutado. Porque `openai-chat`
modelos excluidos por la política efectiva de repetición del pensamiento de chat (una
`preserveReasoningContentModels` lista, o detección de Flash/Pro DeepSeek cuando no está configurado), el adaptador deja caer el pensamiento del asistente reproducido, por lo que la estimación lo excluye también; el historial que nunca llega al proveedor, por lo tanto, no puede denegación contexto-límite. Modelos que preservan el razonamiento, y otros adaptadores, Envía ese pensamiento y aún cuenta.

<a id="the-parser"></a>

## El analizador

`responses/parser.ts` valida la solicitud entrante con `responses/schema.ts` (Zod), luego construye un
`OcxParsedRequest`:

- **Messages** — `input` Los elementos se vuelven normalizados `OcxMessage[]`: usuario / desarrollador / asistente / toolResult. `reasoning` los elementos se convierten en bloques de pensamiento; `function_call`, `custom_tool_call`, y
  `tool_search_call` los artículos se convierten en llamadas de herramientas; sus `*_output` Las contrapartes se convierten en resultados de herramientas.
- **Herramientas** Las herramientas de función — pasan a través; **Las herramientas namespaced (MCP) están aplanadas** a
  `namespace__name` (y restaurado en el camino de regreso); **freeform** herramientas (e.g. `apply_patch`)
  **tool_search** Las herramientas de descubrimiento están marcadas; **Herramientas alojadas** (`web_search`, gen de imagen, …) son Se deja caer y se vuelve a inyectar por un sidecar sólo si se manejan ellos.
- **Imágenes** — se conserva como partes de contenido real (datos URL o https remoto), nunca se alinea como texto.
- **Banderas de características** — `_webSearch` (se solicita una búsqueda web alojada), `_structuredOutput`
  (`text.format` es json_schema / json_object), y `_compactionRequest` (compactación remota v2).

<a id="the-bridge"></a>

## El puente

`bridge/sse.ts` Gire el adaptador interno `AdapterEvent` transmitir de nuevo a Responses SSE que Codex entiende:

| AdaptadorEvent | Responses SSE emitido |
| --- | --- |
| `text_delta` | `response.output_text.delta` → `…done`, `response.content_part.done`, `response.output_item.done` |
| `thinking_delta` | `response.reasoning_summary_text.delta` → `…done`, elemento cerrar |
| `reasoning_raw_delta` | Un crudo `reasoning_text` artículo (o un sobre de ida y vuelta oculto) |
| `thinking_signature` / `redacted_thinking` | Conservado en un `encrypted_content` envolvente de razonamiento |
| `tool_call_start` | `response.output_item.added` (tipo: `function_call` / `custom_tool_call` / `tool_search_call`) |
| `tool_call_delta` | `response.function_call_arguments.delta` (omitido para la forma libre / tool_search) |
| `tool_call_end` | `response.function_call_arguments.done` → `response.output_item.done` |
| `web_search_call_begin` / `web_search_call_end` | Uno vive `web_search_call` elemento más citas URL |
| `heartbeat` | Marca la actividad ascendente; ningún elemento de salida visible por el usuario |
| `done` | `response.completed` (Con el uso) |
| `error` | `response.failed` (con `last_error`) |

El puente también corre a **latido del corazón mantener vivo** (RC3): durante el silencio ascendente, emite un SSE línea de comentarios (`: opencodex heartbeat`) cada 2 segundos para volver a armar el temporizador inactivo de Codex. Líneas de comentarios son descartados por cada analizador de eventsource sin producir un evento, por lo que los decodificadores Responses estrictos nunca se ve una variante desconocida. El valor predeterminado **fecha límite de venta** es de 300 segundos para un público de origen y discapacitado para un local (`stallTimeoutSec`; `0` lo desactiva en todas partes); alcanzarlo aborta el upstream y emite `response.incomplete` con razón
`upstream_stall_timeout`, evitando que una conexión colgada bloquee Codex indefinidamente.

Las llamadas a herramientas se desambiguan en tres tipos de elementos Responses utilizando el mapa de espacio de nombres, la forma libre conjunto, y el conjunto de herramientas de búsqueda capturado por el analizador — para MCP espacios de nombres, `apply_patch`-style freeform herramientas, y el cliente ejecutado `tool_search` todo el viaje. A `buildResponseJSON()` Variante produce un un solo objeto de respuesta no de transmisión de los mismos eventos.

<a id="management-api-oauth-and-usage"></a>

## Administración API, OAuth y uso

`server/management-api.ts` respalda el panel y envía grupos de rutas enfocadas a
`server/management/*.ts`. Es `/api/*` las rutas cubren configuración/configuración seguros, proveedor CRUD y grupos de claves, selección de modelos/controles de v2 de mayúsculas/contexto, sincronización de catálogo, diagnósticos y Registros de depuración, uso y cuotas, configuración de sidecar, actualizaciones, claves API de cliente generadas, inicio de sesión / estado / OAuth cierre de sesión y selección de cuenta, gestión de cuentas Codex y stop elegante. `server/auth-cors.ts`
requiere `OPENCODEX_API_AUTH_TOKEN` Para ambos `/api/*` y `/v1/*` cuando el poder se une más allá loopback; configurado `corsAllowOrigins` Las entradas amplían la lista de permisos de origen local.

Implementaciones de OAuth en vivo `oauth/`; acceso tokens se cargan o actualizan inmediatamente antes de La llamada, mientras `oauth/token-guardian.ts` puede actualizar proactivamente solo a los proveedores cuya política Lo permite. La actualización se coordina con un solo vuelo en proceso, un bloqueo de archivos por cuenta y generación CAS para que los escritores concurrentes no puedan bloquear una credencial más nueva. Una proyección de salud compartida (`oauth/health.ts`) alimenta `ocx status`, `ocx doctor`, la administración API y el panel de control. Credenciales de grupo Codex/ChatGPT y afinidad de subproceso local de proceso en vivo bajo `codex/` y se mantienen fuera de las respuestas de la administración; la afinidad `401` / `403` / `429` (no fijado a través de los límites de tarifa) y no se persiste en los reinicios. El uso de las solicitudes está normalizado `OcxUsage`, apareció en eventos de terminal Responses, y agregados por `usage/` para el panel de instrumentos y opcional JSONL Diagnóstico.

<a id="transport-and-compaction"></a>

## Transporte y compactación

`server/index/serve-options.ts` sirve HTTP/SSE en `/v1/responses` por defecto. Si Codex intenta un Responses WebSocket actualización mientras `websockets` es `false`, opencodex devuelve `426 upgrade_required`; Codex entonces vuelve a HTTP para esa sesión. Cuando `"websockets": true` se establece, el mismo punto final acepta la actualizar y utiliza el puente WebSocket.

Independientemente de esa configuración orientada al cliente, las solicitudes canónicas de reenvío ChatGPT con nivel raíz
`stream: true` puede usar Codex's de origen WebSocket Transporte en estable Bun 1.4.0 o más reciente. El canónico ChatGPT conservas de caminos HTTP Responses Lite intent en los metadatos de marco WS y deriva su sugerencia de enrutamiento del modelo saliente real y el nivel de servicio. HTTP cabeceras de respuesta; las actualizaciones de cuota posteriores se atribuyen a la cuenta de servicio, no se agregan retroactivamente a las cabeceras ya enviadas. Un fallo después de que se envió una solicitud WS no activa una cuenta automática HTTP Estas asignaciones no permiten que el cliente
WebSocket configuración o cambiar la selección de transporte de otros proveedores. Bun 1.3.14, prelanzamientos, e identidades en entorno de ejecución no verificables HTTP/SSE. Las respuestas de WS de origen exitosas mantienen la del cliente SSE contrato y bypass `tee()` a través de una avidez limitada relé de un solo lector (4 MiB por trama sin procesar/envuelta y una cola de productores de 8 MiB). Desbordamiento de colas cierra el upstream y emite un terminal downstream `response.failed` Evento seguido de `[DONE]`.

Para el modelo saliente final `gpt-5.3-codex-spark`, reenvío canónico ChatGPT explícitamente desactiva Responses Lite tanto en la cabecera HTTP como en los metadatos de fotograma WS nativos, incluso cuando un alias selecciona Spark — pero solo cuando el cuerpo saliente no lleva `additional_tools` artículo con un no vacío `tools` matriz. Ese grupo ES la forma de entrega de herramientas Lite, por lo que un cuerpo Spark que todavía lo usa mantiene Lite ON incluso si un llamante o encabezado configurado dijera lo contrario; de lo contrario, el marco anunciaría que no es Lite mientras que las herramientas solo existen en la forma Lite. Una identidad Lite cambiada retira el socket antiguo; subsecuentemente elegible las solicitudes con la misma identidad pueden reutilizar el nuevo socket. Otros modelos y pasarelas mantienen su política Lite existente. Los metadatos nativos mal formados todavía vuelven a HTTP con su cuerpo sin cambios.

Cuando un proveedor rechaza una solicitud de transmisión con HTTP 413 antes de que comience SSE, OpenCodex emite una terminal `response.failed` evento con `context_length_exceeded` en lugar de retransmitir el reintentable estado desconocido. Esto permite a Codex detener su bucle de reconexión y aplicar su propia política de compactación de contexto. en el siguiente turno. OpenCodex no elimina silenciosamente mensajes o imágenes; reducir la entrada actual o Reintentar después de la compactación. Las personas que no llaman a API continúan recibiendo el HTTP 413 del proveedor.

La compactación de contexto Codex funciona para modelos enrutados. `server/responses/compact.ts` mangos
`POST /v1/responses/compact` ejecutando un giro de resumen interno y volviendo compactado historia, mientras `responses/parser.ts` y `bridge/sse.ts` manejar la compactación remota v2
`compaction_trigger` se convierte emitiendo exactamente una `compaction` elemento de salida.

<a id="caching--the-catalog"></a>

## El almacenamiento en caché y el catálogo

- `codex/model-cache.ts` mantiene una caché de TTL en memoria por proveedor `/models` resultados (por defecto 5 min, ej., haciendo coincidir la propia memoria caché de Codex), con un retroceso obsoleto cuando falla una fetch.
- `codex/catalog/sync.ts`exportado a través de la `codex/catalog.ts` fachada, fusiona modelos enrutados en Catálogo de Codex como entradas namespaced, rangos destacados
  [Modelos de subagentes](/es/guides/codex-integration/#the-subagent-picker) Primero, los filtros
  `disabledModels`, y puede restaurar completamente el catálogo prístino desde una copia de seguridad única.

<a id="reasoning-effort"></a>

## Esfuerzo de razonamiento

`reasoning-effort.ts` traduce las etiquetas de razonamiento de Codex en los valores de cable de cada proveedor. Los El catálogo de Codex anuncia las etiquetas que Codex acepta (`low` / `medium` / `high` / `xhigh` / `max`), pero Los proveedores de upstream pueden admitir solo un subconjunto más pequeño o requerir un alias real. El módulo:

- Define el canónico `CODEX_REASONING_LEVELS` y su orden.
- Sujeta un esfuerzo solicitado al nivel soportado más cercano cuando el nivel exacto no está disponible.
- Resuelve por modelo y por proveedor `reasoningEffortMap` Anulaciones para asignaciones de cables personalizadas.
- Deja de lado el esfuerzo por completo para los modelos enumerados en `noReasoningModels`.

Qwen3.8-Max es una excepción explícita de esfuerzo directo al antiguo contrato de presupuesto Qwen3.x. Alibaba Token Plan registra su escalera soportada de origen como `low`, `medium`, y `xhigh` (el valor predeterminado), y Emite el valor efectivo como `reasoning_effort`; Codex-solamente las tapas de compatibilidad están sujetas a
`xhigh` en el cable. El enriquecimiento del registro en entorno de ejecución repara metadatos preestablecidos persistentes anteriores que aún clasifica este modelo como `thinking_budget` modelo.

<a id="core-types"></a>

## Tipos de núcleo

El modelo interno vive en `types.ts`: `OcxParsedRequest`, `OcxContext`, el `OcxMessage` Unión,
`OcxContentPart` (texto/imagen), `OcxToolCall`, `OcxTool`, `AdapterEvent`, y los tipos de configuración (`OcxConfig`, `OcxProviderConfig`) Dos ayudantes son ampliamente utilizados: `namespacedToolName()` y
`modelInList()` (Tolerante) `:size`-etiqueta coincidente para `noVisionModels` / `noReasoningModels`).


<a id="incomplete-quota-terminals"></a>

### Terminales de cuota incompletos

Una respuesta directa nativa que termina con evidencia de cuota o límite de tasa en un
`incomplete` terminal registra el fallo de la cuota de cuenta y la salud de retroceso de generación. Estructurado `incomplete_details.reason` y los códigos de error se aceptan sin un mensaje; el límite de salida ordinario, el filtrado, la dirección y el bloqueo incompletos no Enfriar una cuenta. La clasificación de la política cibernética mantiene su precedencia. El terminal es no se reproduce después de la salida, y la selección de solicitud de cuenta fija permanece fija.

Las solicitudes compactas remotas pueden almacenar en búfer su respuesta por más tiempo que el servidor. tiempo de espera. Ese tiempo de espera del oyente se desactiva después de que el cuerpo de la solicitud es aceptado; la cancelación del cliente y los plazos de operación ascendente aún se aplican.

La compactación enrutada amortiguada trata los deltas de texto y razonamiento no vacíos como progreso sin exponer texto de resumen parcial. Comentarios, deltas vacías y pasarela Los keepalives no restablecen el organismo de control de pérdida de eventos del adaptador. El stand por defecto El tiempo de espera permanece 300 segundos; el contenido de compactación encriptado se conserva sin cambios.

El almacenamiento en búfer de respuesta compacto nativo también impone una fecha límite de inactividad de byte por cuerpo usando `stallTimeoutSec` (300 segundos para un upstream público, deshabilitado para uno local, y discapacitados en todas partes cuando se `0`) Los trozos no vacíos restablecen esa plazo; un cuerpo estancado devuelve HTTP 504, la cancelación del cliente retiene HTTP 499, y la limpieza no espera una promesa de cancelación de origen atascada. Los 32 MiB Se conservan el techo de respuesta y los bytes del cuerpo original.

Un error canónico WebSocket denegado puede convertirse en un HTTP 4xx solamente antes de que se confirme la respuesta y después de las comprobaciones de correlación de flujo. Permitido Las cabeceras de cuota están acotadas y reconstruidas sin cabeceras de encuadre ascendentes; la JSON La respuesta no es cacheable. Los errores posteriores al compromiso y 5xx mantienen la ruta sin reenvío.

Cuando la recuperación de la tarea agente encriptada rechaza una tarea enrutada, su error 400 existente puede incluir un límite `recovery_reason`: `unsupported_envelope`,
`admission_denied`, `recovery_unavailable`, `caller_cancelled`, `input_changed`,
`recovery_http_rejected`, `recovery_timeout`, `recovery_aborted`,
`recovery_transport_error`, o `recovery_invalid_output`. El rechazo HTTP requiere una respuesta no exitosa observada. Salida no válida incluye UTF-8 no válido, cuerpos de gran tamaño, flujos de recuperación mal formados o incompletos, y Asignaciones inválidas o contradictorias. La cancelación de una llamada tiene prioridad sobre una fecha límite propia, que tiene prioridad sobre los fallos de decodificación/transporte.
`recovery_aborted` describe una recuperación compartida cancelada independientemente de esa persona que llama. Los camareros de vuelos compartidos reciben el mismo fallo subyacente a menos que se cancele individualmente. solo se almacena en caché el texto sin formato correcto. Los diagnósticos no contienen ningún error de flujo ascendente o texto de carga útil. El campo se omite cuando no existe un resultado de recuperación clasificado, y cuando existe un combo ramas que devuelven el fallo de destino original mantienen esa respuesta.
`recovery_unavailable` incluye capacidad de caché/singleflight y no prueba Se intentó una solicitud ascendente. No se permite reintento o aceptación de envolvente más amplia.
