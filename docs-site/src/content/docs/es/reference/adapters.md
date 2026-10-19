---
title: "Adaptadores"
description: "El proveedor adapta — lo que cada uno apunta, cómo crea solicitudes y sus peculiaridades."
---

Un **adaptador** traduce entre el modelo interno de solicitud/respuesta de opencodex y un cable de proveedor formato. Cada adaptador implementa el `ProviderAdapter` interfaz (`src/adapters/base.ts`):

```ts
interface ProviderAdapter {
  name: string;
  buildRequest(parsed: OcxParsedRequest, incoming: IncomingMeta): AdapterRequest | Promise<AdapterRequest>;
  fetchResponse?(request: AdapterRequest, ctx?: AdapterFetchContext): Promise<Response>;
  parseStream(response: Response, budget: TranslatorBudget): AsyncGenerator<AdapterEvent>;
  parseResponse?(response: Response, budget: TranslatorBudget): Promise<AdapterEvent[]>;
  runTurn?(parsed: OcxParsedRequest, incoming: IncomingMeta, emit: (event: AdapterEvent) => void): Promise<void>;
}
```

`buildRequest` reduce un `OcxParsedRequest` en una solicitud HTTP ascendente; `parseStream` /
`parseResponse` Elevar la respuesta del proveedor hacia el interior `AdapterEvent`s. `fetchResponse` deja un adaptador propio reintentos / tiempos de espera, mientras `runTurn` soporta transportes que no pueden representarse como uno HTTP fetch seguido de un flujo de respuesta. [`bridge.ts`](/es/reference/architecture/#the-bridge)
luego convierte los eventos en Responses SSE.

<a id="external-task-input-on-translated-responses-routes"></a>

## Entrada de tarea externa en rutas Responses traducidas

La coordinación de tareas Codex puede entregar entrada como `function_call_output` con nonblank
`id`, `name` y `namespace` campos y no `call_id` propiedad. OpenCodex mapea esto sobre completo a un mensaje de usuario antes de la traducción del adaptador. Su producción debe ser texto en blanco o una matriz de texto totalmente compatible y `input_image` URL piezas. Texto y orden de la imagen se conservan; detalle de la imagen `original` Mapas para `high`.

Contenido vacío, partes mal formadas u opacas, imágenes de solo identificación de archivo y sobres parciales permanecer inválido. Los resultados de la función ordinaria/herramienta personalizada aún requieren un
`call_id`. Los metadatos del sobre identifican una forma de compatibilidad y no conceden permisos adicionales. El paso nativo y la compactación enrutada (portátil) aplican el mismo mapeo de turnos de usuario a sus cuerpos crudos; el nativo directo `/responses/compact` hacia adelante mantiene sus reglas de cuerpo crudo existentes.

<a id="checkpoint-continuation-after-routed-compaction"></a>

## Continuación del punto de control después de la compactación enrutada

Un modelo enrutado reproduce un OpenCode `ocx1:` punto de control como texto de usuario plano junto a las solicitudes anteriores retenidas. Cuando una solicitud lleva dicho punto de control decodificado, OpenCodeX agrega una nota corta a las instrucciones del sistema (rutas traducidas) o `instructions` (Responses passthrough). La nota enmarca las solicitudes completadas como historial y permite la continuación solo de trabajos no terminados ya autorizados y aún dentro de ese alcance, sin pedir la misma autorización nuevamente mientras se aplica. Permisos existentes y puertas de confirmación permanecen en vigor: las decisiones pendientes o permisos requeridos deben ser resueltos antes de las acciones dependientes. Los puestos de control y las delegaciones, incluidos los de otro hilo, no otorgan autoridad o alcance ampliado. Los mensajes posteriores del usuario tienen prioridad, incluida una pausa, cancelación, reemplazo o cambio de alcance. Las solicitudes de compactación, las manchas nativas opacas y las solicitudes sin punto de control no reciben la nota.

## `openai-chat`

**Objetivos:** OpenAI **Chat Completions** (`POST {baseUrl}/chat/completions`; un seguimiento `/chat/completions` o `/` on `baseUrl` primero) y todas las compatibles proveedor — xAI, Kimi, DeepSeek, GLM, Groq, OpenRouter, Ollama (local), y mucho más.
**Auth:** `key` (Bearer).

Para xAI, el adaptador ascendente resuelto puede ser `openai-chat` o `openai-responses`, dependiendo de los valores predeterminados y explícitos del modelo `modelAdapters` Anulaciones. Ambos apoyos público xAI API-clave de autenticación y Grok CLI OAuth. El registro de uso
[`attempts[].credentialSource`](/es/reference/management-api/) De ello se desprende que resuelto transporte; no infiere la atribución de suscripción del protocolo entrante.

- Convierte mensajes internos a roles OpenAI; asigna herramientas a `{type:"function", function:{…}}` y
  `tool_choice` (`auto`/`none`/`required` o una función con nombre).
- **Imágenes de resultados de herramientas** en un mensaje de visión de usuario de seguimiento (`image_url` partes) liberado una vez la ronda de herramientas se cierra, ya que `role:"tool"` contenido es sólo texto; el `[image]` El marcador se queda en el mensaje de herramienta como ancla.
- **Reescribe el mensaje de identidad Codex de GPT-5** a una intro modelo-agnóstico por lo que los modelos enrutados no pretenden ser OpenAI.
- Por traducido `Qwen3.8-27B` solicitudes (incluyendo ids de nombres separados como
  `openai/Qwen3.8-27B`), Solicitudes Flash-Next (`flash-next` o `Qwen3.8-Flash-Next`También con espacios de nombres de pasarela), y `OrcaSAQ-2-Cyber-27B` Solicitudes GGUF, un recordatorio para desarrolladores solo de texto después de que el mensaje principal del sistema permanezca en su ranura de conversación, pero se envíe como `user`. La excepción Orca requiere `GGUF` en el segmento del modelo final antes de cualquier colon opcional etiqueta quant; las variantes Orca que no son GGUF mantienen su comportamiento configurado de rol de desarrollador. Estas plantillas de chat ancladas — por ejemplo
  [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B/blob/1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0/chat_template.jinja) — Rechazar más tarde `system` Mensajes y no aceptas `developer`, mientras que después `user` mensajes son válidas. Esto preserva el orden pero no puede preservar la precedencia del rol de desarrollador. Otros modelos mantener su comportamiento de rol de desarrollador configurado; el passthrough de chat nativo no cambia.
- **Abrazaderas `reasoning_effort`** al subconjunto anunciado del modelo cuando un nivel exacto no está disponible;
  `xhigh` y `max` etiquetas distintas a menos que un proveedor configure explícitamente un alias. Los adaptador **lo omite por completo** para los ID en `provider.noReasoningModels`.
- Corrientes `delta.content` (texto), `delta.reasoning_content` (pensamiento), y `delta.tool_calls[]`; recoge `usage`. Proveedores listados en `reasoningDetailsModels` (MiniMax serie M) en lugar de leer estructurado `delta.reasoning_details` segmentos, cuyos `text` llega como instantáneas acumulativas y es diffed del prefijo, y el razonamiento conservado de la repetición como un `reasoning_details` matriz.
- Porque `api.mistral.ai`, ambas rutas de respuesta también aceptan tipeado `text` y `thinking`
  matrices. El texto mantiene sus bytes y orden; el pensamiento permanece separado de la respuesta. Los bloques de texto adyacentes comparten el análisis de etiquetas en línea; el pensamiento escrito lo restablece. Los bloques de matriz no compatibles o mal formados devuelven un error ascendente. Otros anfitriones mantener su comportamiento existente. Esto no añade repetición de firma Mistral.
- Suprime desnudo `<tool_call>` texto cuando duplica una llamada estructurada y colapsa dos bloques idénticos inmediatamente adyacentes cuando exactamente una llamada estructurada está de acuerdo con su función y entrada. Un doble `input` se reduce a una copia, unida directamente o por una nueva línea, y solo cuando el objeto argumentos no tiene ninguna clave aparte de `input`. El espacio en blanco después de la par se suprime; sigue siendo visible el marcado no coincidente o de ejemplo.
- ClinePass utiliza el formato de puerta de enlace verificado en vivo `reasoning: { enabled: true, effort }` (o
  `{ enabled: false }` cuando el razonamiento está deshabilitado); sus documentos públicos API no especifican actualmente esta forma de solicitud. El adaptador conserva solicitado `low`, `medium`, `high`, `xhigh`, y `max`
  niveles, acepta deltas de razonamiento de cualquiera `delta.reasoning_content` o `delta.reasoning`, solicitudes Uso de streaming con `stream_options.include_usage`, y lee el uso de envolventes de respuesta no de flujo.

Las llamadas a herramientas de streaming retienen su identidad cuando un proveedor envía por primera vez un ID. luego asocia ese ID con un índice y luego envía un argumento de solo índice fragmentos. Esos fragmentos se reúnen en una llamada con el nombre original y argumentos completos; las llamadas paralelas conservan identidades separadas. Cuando está presente, los índices de llamada a herramientas transmitidos deben ser enteros seguros no negativos. No numérico valores y números negativos, fraccionarios o inseguros terminan el flujo con un error antes de la coincidencia de identidad. Los índices ausentes y nulos siguen siendo marcadores de posición del índice ausente; Las cadenas numéricas no son forzadas.

## `ollama-native`

**Objetivos:** El propio Ollama **Chat API** (`POST /api/chat`) en lugar de su compatible con OpenAI superficie. El incorporado `ollama-cloud` proveedor está seleccionado en este adaptador; también puede se configurará en un proveedor Ollama personalizado o autoalojado por separado con
`adapter: "ollama-native"`.
**Auth:** `key` (Bearer) para los puntos finales de nube/personalizados; no se envía ninguna credencial a loopback o
`authMode: "local"` objetivos.

- **La selección del registro es portante.** El incorporado `ollama-cloud` fila mantiene la base URL
  `https://ollama.com/v1` por `/v1/models` descubrimiento en vivo, mientras que la inferencia se normaliza en
  `POST https://ollama.com/api/chat`. Un nivel de configuración `adapter` se descarta para esa fila de proveedores. El Ollama local incorporado ordinario permanece encendido `openai-chat`; elegir `ollama-native` por un local o El punto final autoalojado es una decisión explícita de configuración del proveedor, detectada por el host. El destino no Ollama nunca se reescribe silenciosamente.
- **Metadatos del modelo:** `/v1/models` no lleva metadatos por modelo, por lo que para la nube canónica Ollama el proveedor del adaptador enriquece cada identificación descubierta a través de un *delimitado* `POST /api/show` (256 KiB por respuesta, 8 s por solicitud, concurrencia 4, 48 solicitudes, un plazo de 12 s para toda la fase) para llenar la ventana de contexto real y la capacidad de visión. La solicitud de presentación es del mismo origen y nunca sigue una redireccionar; las fallas degradan ese modelo y nunca fallan en el descubrimiento.
- **Transmisión:** Ollama nativo de NDJSON. Texto y `message.thinking` Los deltas se envían como llegar; un giro se completa solo en un `done: true` registro de terminal, y buffered `done: false` o a La terminal faltante suprime completamente las llamadas parciales de texto y herramientas.
- **Razonamiento:** mapas en el nativo de Ollama `think` campo (`low`/`medium`/`high`/`max`, más booleanos), sujetado a la escalera anunciada del modelo, y honra el `__omit__` semántica centinela upstream configura.
- **Imágenes:** enviado de forma nativa en el mensaje `images` array donde el modelo es capaz de visión; video se rechaza en lugar de enviarse incorrectamente, y las URL de imágenes remotas no se obtienen.
- **Herramientas:** declaradas en la forma nativa de Ollama, las llamadas de herramientas transmitidas son registros de llamada completa con objeto-valorado `arguments`, y la repetición de resultados de herramienta se empareja estrictamente con el identificador de llamada y el nombre de la herramienta. Los identificadores de llamada nativos válidos distinguen las llamadas incluso cuando el proveedor repite un índice de función. Los ID repetidos actualizan los argumentos de la misma llamada; Las entradas sin ID vuelven al índice, luego a la posición. Las llamadas retienen el primer orden visto. Con `parallel_tool_calls: false`, una segunda llamada de proveedor distinta aún falla el giro cerrado antes de que se emita cualquier llamada de herramienta. Codex puede grabar comentarios del asistente antes de los resultados de una llamada pendiente. Texto/Pensamiento sin nuevas herramientas se aplaza hasta que el lote se resuelva, por lo que los resultados genuinos permanecen al lado de su llamadas de origen. Un nuevo lote de llamada a herramientas aún resuelve el anterior; los resultados que faltan retienen un marcador explícito de estado desconocido. Salidas adicionales para una llamada abierta unirse en orden de llegada; La salida que llega después de que su lote se asienta se conserva como una conversación atribuida explícitamente. texto, después de cualquier par pendiente de llamada/resultado. Los identificadores de llamadas desconocidos y las identidades de herramientas no coincidentes permanecen inválido; esto no crea ni ejecuta otra llamada a la herramienta. La atribución generada para salidas tardías comparte un presupuesto de 256 KiB por solicitud JSON-byte. Exceder ese presupuesto rechaza la solicitud con HTTP 413 `request_too_large` en lugar de truncar identidades o resultados de herramientas. El mensaje de error nombra la causa y el límite. Para continuar, inicie un nuevo hilo: compactar en la misma ruta Ollama reenvía el mismo historial y se rechaza de nuevo, a menos que se encamine la compactación a otro proveedor.
  `tool_choice: "none"` y `auto` se comportan con normalidad; **`required` o una elección con nombre exacto falla cerrado**, porque Ollama de `/api/chat` no tiene `tool_choice` campo para hacerla cumplir.
- **La salida estructurada se rechaza en la nube canónica Ollama.** Ollama actualmente documentos estructurados las salidas no compatibles en su nube, y la nube no `format` campo, por lo que OpenCodex no se cierra esa solicitud en lugar de devolver prosa sin restricciones en respuesta a un esquema en forma de solicitud. Local y personalizado `ollama-native` los puntos finales mantienen el nativo de Ollama `format` cartografía (`json_object` → `"json"`, `json_schema` → el objeto de esquema).

## `openai-responses`

**Objetivos:** el OpenAI **Responses API**. **`passthrough: true`** — normalmente reenvía la solicitud sin procesar cuerpo y respuesta, con estrechas reescrituras de compatibilidad para puertas de enlace enrutadas.
**Auth:** canonical OpenAI `forward` transmite solo la lista de permisos de llamadas seguras; no canónico
`forward` utiliza encabezados estáticos configurados sin retransmitir la autorización del llamante; `key` utiliza el Configurar la clave del proveedor.

Cuando la historia de Google se reproduce a canónica ChatGPT Codex o el oficial OpenAI Responses API, el adaptador elimina el nivel de artículo `extra_content` desde la solicitud HTTP saliente o WebSocket Crear. Nativo `/responses/compact` Aplica la misma proyección. La historia original mantiene el Google firma de pensamiento para giros posteriores Google. Otras pasarelas Responses conservan sus extensiones.

El adaptador conserva el `User-Agent` como un fallback en ambos modos de auth porque algunos proveedores compatibles con Responses utilizan la huella digital del cliente Codex para el comportamiento de compatibilidad. Un proveedor configurado explícitamente `User-Agent` sigue siendo autoritativo independientemente de la carcasa del cabezal; si el llamante no envía ninguno, OpenCodex no inventa uno. Se pueden seleccionar metadatos de llamadas adicionales con `forwardClientHeaders`; proveedor `headers` gana por esta opción, y credenciales o propiedad del transporte Los nombres son rechazados. Canonical ChatGPT forward auth conserva su lista de permisos de encabezado fijo separada. Solo `originator`, `x-client-request-id`, `x-codex-app-version`, y `user-agent` son apoyados por `forwardClientHeaders`; los nombres arbitrarios se rechazan al cargar/escribir y se ignoran en entorno de ejecución.

<a id="native-compaction-on-custom-gateways"></a>

### Compactación nativa en puertas de enlace personalizadas

La compatibilidad con Responses por sí sola no es evidencia de soporte de compactación nativo. Puertas de enlace personalizadas seguir utilizando resúmenes de texto portátiles a menos que el operador declare la capacidad pertinente:

- `supportsNativeCompactionTrigger: true` preserva v2 `compaction_trigger` Solicitudes y salida nativa.
- `supportsNativeCompactEndpoint: true` opta por rutas clave/local/directa en el punto final v1 separado. OAuth conserva la compactación enrutada y su ciclo de vida de credenciales existente. El soporte V2 no implica soporte v1.
- `decodesNativeCompactionBlobs: true` preserva las manchas nativas en giros posteriores cuando hay no se conoce ningún desajuste entre proveedor y servidor. Ninguna bandera de generación implica esta capacidad de reproducción.

V1 nativo personalizado también honra `preserveResponsesReasoningContent: true` para el razonamiento de texto plano de entrada, al igual que las solicitudes Responses personalizadas ordinarias. Ausente o `false` mantiene el contenido en blanco; Los destinos compactos operados por OpenAI se mantienen en blanco incluso si la bandera está configurada. Interno `ocxr1:`
Los sobres siempre se eliminan. La preservación del texto sin formato es independiente de las banderas de generación, blob nativo capacidad de reproducción y verificación de identidad de servicio.

Si el proveedor personalizado también requiere resultados de herramientas adyacentes (`requiresAdjacentResponsesToolResults: true`), tanto Responses ordinario como v1 nativo eliminan el texto cifrado de razonamiento opaco y requieren repetición de texto sin formato. Falta `reasoning_text` se llena desde el punto `summary_text`, o un marcador de posición mínimo si no El resumen útil existe. Se conserva el texto plano existente. El compacto operado por OpenAI mantiene su propia política.

Por una puerta de entrada cuya **Generación v2 y reproducción** ambos han sido verificados, fusione estos campos en su configuración de proveedor existente, conservando su URL real y autenticación configurada:

```json
{
  "adapter": "openai-responses",
  "supportsNativeCompactionTrigger": true,
  "decodesNativeCompactionBlobs": true
}
```

Estas banderas no hacen que la puerta de enlace sea un destino oficial de OpenAI, las credenciales de llamada directa, cambiar la selección de la cuenta o evitar la desinfección de compatibilidad normal. Validar un compacto real respuesta y conversación continua, no solo HTTP 200. Mantén las manchas en el fondo que las acuñó; El enrutamiento de compactación entre proveedores aún usa resúmenes portátiles. Resumen de fallback V1 permanecer portátil incluso cuando el destino acepta por separado disparadores v2. Rutas con capacidad nativa están excluidos de la recuperación de compactación de emergencia portátil para su protocolo respectivo.

La selección del adaptador no selecciona el transporte ascendente. Las solicitudes elegibles pueden utilizar el
[Ruta proxy ascendente WebSocket](/es/reference/proxy-formats/#json-and-sse-output); inválido o no compatible Los configuración del proxy WebSocket vuelven a HTTP/SSE. HTTP fetch basado en el manejo de Responses utiliza la
[fetch de salida configurada](/es/reference/configuration/server/#server-fields): un servidor proxy SOCKS5 de
`config.proxy` o un SOCKS5 `ALL_PROXY` utiliza el túnel incorporado cuando `NO_PROXY` No está exento El objetivo. Las variables proxy HTTP(S) específicas del esquema conservan su manejo nativo separado; non-SOCKS `ALL_PROXY` No es un nativo HTTP fetch ruta.

Las pasarelas Responses no canónicas reciben el cliente ejecutado de Codex `tool_search` declaración como a herramienta de función pública segura contra colisiones. El historial de solicitudes coincidentes y las llamadas a la función JSON/SSE son traducido de nuevo a lo privado `tool_search` Ciclo de vida para el cliente. Canonical OpenAI avance mantiene el tipo privado nativo sin cambios.

Solicitudes con `authMode` distinto de `"forward"` convertir Codex `agent_message`
elementos que contienen matrices no vacías de partes de texto plano admitidas en mensajes públicos de usuario, preservando esas partes y autor / destinatario legible Metadatos. `agent_message` ChatGPT Codex backend, y la ruta Hasta el momento, todos los países han rechazado el
`422 unknown item type "agent_message"` — y porque Codex reproduce el historial de subagentes en En cada vuelta, ese fracaso se repite para el resto del hilo. Esta conversión deja contenido cifrado o desconocido sin cambios. Proveedores que utilizan `authMode: "forward"` retener estos elementos sin cambios. Para xAI Responses en HTTPS `api.x.ai` o `cli-chat-proxy.grok.com`
usando el puerto estándar, un resultado hijo de cadena no en blanco también se convierte en un resultado `input_text`
parte con su espacio en blanco exacto y líneas nuevas. Otros destinos retienen artículos de valor de cadena; Las cadenas en blanco y las partes cifradas/desconocidas mixtas no se convierten parcialmente. Véase [mensajes de agente](/es/reference/configuration/providers/#routed-agent-messages)
para el comportamiento separado de recuperación de tareas cifradas opt-in.

Para xAI Responses `auto` o `none` La selección de herramientas se omite cuando la normalización no deja herramientas en la solicitud, incluso cuando se elimina la búsqueda solo en caché. Selección de funciones forzadas válidas permanecen intactos. Las llamadas a herramientas personalizadas repetidas con ID de artículo no válido o que faltan reciben ID estables cuando su identificador de llamada, nombre y entrada son cadenas; su emparejamiento de llamada/resultado se conserva.

El destino canónico ChatGPT Codex también normaliza dos formas públicas de Responses que su backend más estricto rechaza: totalmente textual `system` Mensajes en el interior `input` Se agregan a la nivel superior `instructions` string en el orden de solicitud, y el nivel superior `truncation` campo se ha eliminado. Esta reescritura está limitada al destino. Proveedores de clave pública / personalizada Responses y no canónicos Las pasarelas directas mantienen ambos campos sin cambios; un mensaje del sistema multimodal nunca se pliega parcialmente o silenciosamente caído.

Para las continuaciones canónicas hacia adelante, solo cliente `prompt_cache_breakpoint` Las propiedades son eliminadas recursivamente dentro de los límites transversales. Cuando `store: false`, `item_reference` Las filas son también se omitió porque el destino no puede resolver un elemento que no persistía. Función/herramienta `call_id`
pares y `reasoning.effort` son preservados.

[Compatibilidad con Luna Reserve](/es/reference/cli/providers-accounts/#luna-reserve-alongside-routed-models)
utiliza esta ruta canónica ChatGPT-forward, no key-auth o pasarelas Responses arbitrarias. Retiene la lista de permisos de llamadas seguras y la normalización de solicitudes con alcance de destino que se describen aquí. OpenCodex envía su cabecera de capacidad de reserva en la búsqueda de uso de cuenta principal propia; esa cabecera No es permiso en sí mismo. Las solicitudes de compatibilidad elegibles vuelven a verificar la autorización vinculada a credenciales en el despacho. Conversación y compactación son compatibles; ayudantes de visión, ayudantes de búsqueda en la web, y El relé de búsqueda independiente no lo es.

Porque `key` auth, [`retryOn429`](/es/reference/configuration/) también se aplica aquí: un pre-stream 429 espera y repite la solicitud idéntica en la misma tecla antes de cualquier otro manejo, exactamente igual que El traducido `openai-chat` / Ruta de solicitud Anthropic. Personalizado `runTurn` Los transportes no son parte del bucle de reintento HTTP.

- El analizador sin estado Responses de DeepSeek recibe la normalización del historial de alcance del proveedor: contexto se mueve después de una llamada de herramienta/lote de resultado no ambiguo. Las llamadas paralelas permanecen agrupadas antes sus salidas coincidentes para que cada llamada permanezca en el turno del asistente de razonamiento. Tolerante Los proveedores y los identificadores ambiguos duplicados, faltantes o fuera de orden mantienen su orden de entrada original.

- `forward` URL → `{baseUrl}/responses`. A `key` proveedor predeterminados para el legado `{baseUrl}/v1/responses` construcción.
- A `key` puede establecer un pariente validado `responsesPath`; el adaptador elimina una barra trasera de `baseUrl` y envía `{trimmedBaseUrl}{responsesPath}`. Para el Plan de Agente de Ark, use `baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3"` con `responsesPath: "/responses"`.
- En `forward` solo se retransmite una lista de permisos de encabezado seguro (`FORWARD_HEADERS`): autorización, ChatGPT ID de cuenta y los encabezados beta/originador/sesión de OpenAI. Esta es la ruta ChatGPT-login Esto también potencia el [sidecares](/es/guides/sidecars/).

<a id="command-code-session-affinity"></a>

## Afinidad de sesión de Código de Comando

El OAuth `command-code` adaptador deriva un opaco `x-session-id` Desde el cliente identidad de hilo, luego la identidad de conversación de razonamiento-reproducción. Cuando ninguno de los disponible, utiliza una clave de caché rápida solo si la integración ha sido clasificaron esa clave como perteneciente a una conversación. Caché compartida o no clasificada Las claves no establecen afinidad de sesión; las solicitudes sin una identidad utilizable reciben Una nueva ID de sesión. La recuperación y la reproducción de la historia guardada en caché preservan esta clasificación.

La clave API `commandcode` proveedor utiliza Chat Completions para la mayoría de los ID de modelo y el Adaptador Anthropic Messages`x-api-key`) por `claude-*` ids, que el código de comando sirve solo en `/provider/v1/messages`; el pin se aplica solo mientras el proveedor señala que punto final. Los `tokenlab` proveedor utiliza el mismo pin vinculado a un punto final para `claude-*` ids, que TokenLab declara solo para Chat y Messages, en `https://api.tokenlab.sh/v1/messages`. El código de comando admite el reenvío `prompt_cache_key`; esto es separado desde el encabezado de sesión del adaptador OAuth y no garantiza un éxito de caché del proveedor. El OAuth `command-code` flujos preestablecidos `/alpha/generate` como NDJSON. MiMo tool-call markup repetido por la puerta de enlace como texto se elimina cuando duplica una llamada real. Marcado después de la prosa ordinaria, incluyendo un marcador dividido en deltas posteriores del mismo bloque de texto, se mantiene y elimina solo si una llamada nativa lleva el mismo contenido. De lo contrario es publicado como texto y nunca restaurado como una llamada. Sólo espera mientras un nativo lo llama. duplicado sigue abierto, contando la primera llamada de la misma herramienta que comienza después del marcado; una vez que se cierran sin un partido, se libera de inmediato. Razonamiento u otros eventos que llegan entre ya no liberar un sobre retenido. Después de una parada limpia o un acabado de llamada a herramientas, un Envoltorio completo de herramientas declaradas sin contraparte nativa se restaura como un sobre real llamada; un giro interrumpido o fallido deja el marcado como texto. Una llamada desnuda al analizador No se puede leer en lugar de imprimir cuando todavía se abre, cierra y nombra una herramienta declarada, y la llamada real para herramienta llega o el giro termina limpiamente. Una llamada de forma libre se hizo eco sin su
`</function>` cerrar cuenta como completa una vez `</tool_call>` Llega. Esto se aplica a cada Modelo de código de comando MiMo sirve.

## `anthropic`

**Objetivos:** Anthropic **Messages** (`/v1/messages`).
**Auth:** `key` (`x-api-key` por defecto, o `Authorization: Bearer` con `apiKeyTransport: "bearer"`) `oauth` (Bearer+ `anthropic-beta`, para Claude Pro/Max).

- Convierte mensajes a bloques de contenido Anthropic (texto, imagen base64, `tool_use`, `thinking`).
- Traducido Anthropic Messages El razonamiento de reproducción comparte el presupuesto de traducción de la solicitud, incluida la sobrecarga de codificación/decodificación de copias. HTTP 413 con
  `translation_buffer_limit`; las firmas y los datos de razonamiento opacos nunca se truncan para adaptarse. El passthrough nativo de Anthropic utiliza su contrato de tamaño de cuerpo separado.
- **Matemáticas de pensamiento extendido:** Anthropic requiere `max_tokens > thinking.budget_tokens`. El adaptador asigna el esfuerzo de razonamiento a un presupuesto (mínimo 1024 … max 32000), luego calcula una caja fuerte `max_tokens` con espacio libre de salida, y **gotas `temperature`/`top_p`** cuando el pensamiento está habilitado (Anthropic prohíbe ellos allí).
- **Pantalla de pensamiento adaptativo:** modelos de pensamiento adaptativo (Opus 4.7+, Sonnet 5, Fable) por `thinking.display: "summarized"`, por lo que una larga reflexión llega a los clientes de Chat y Responses como Razonamiento de deltas en lugar de minutos de latidos cardíacos. Una petición que oculta el resumen del razonamiento (`reasoning.summary: "none"`) mantiene el proveedor por defecto.
- **Salida estructurada:** Responses `text.format` y Chat Completions `response_format` solicitudes con `type: "json_schema"` Convertirse en Anthropic `output_config.format`. El formato se fusiona en un configuración de salida de pensamiento adaptativo existente, preservando una `output_config.effort`. Encaminado Anthropic Messages Las solicitudes conservan el mismo formato a través deOAuth traducción. El adaptador refleja el Anthropic TypeScript SDK's apoyado JSON Subconjunto de esquemas: las restricciones no soportadas se mueven a `description` como guía modelo, `oneOf` se convierte `anyOf`, y objeto esquemas reciben `additionalProperties: false`. Una raíz `$ref` mantiene su adyacente `$defs` Así que Las referencias locales siguen siendo resolubles. Campos envolventes OpenAI como esquema `name`, sobre
  `description`, y `strict` no forman parte del formato de cable Anthropic. JSON modo de objeto sin un schema no tiene equivalente Anthropic y no se traduce. En la dirección inversa, los esquemas de salida Anthropic traducidos conservan el original del llamante esquema. `strict: true` requiere una raíz de objeto sin una unión de raíz y objetos completos cerrados a través de propiedades anidadas, elementos de matriz, uniones y definiciones: `properties` debe ser un objeto,
  `additionalProperties` debe ser `false`, y `required` debe contener exactamente los nombres de sus propiedades. Objetos incompletos, palabras clave de esquema desconocidas y valores fuera de la estricta documentación de OpenAI Uso explícito del subconjunto `strict: false`; el clasificador utiliza una lista de permisos en lugar de perseguir cada restricciones no soportadas por separado. El proxy no inventa campos requeridos, cerrar un objeto abierto o descartar el esquema del llamante simplemente para obtener el modo estricto.
- Siempre envía `anthropic-version: 2023-06-01`. Corrientes `content_block_delta` (`text_delta`,
  `thinking_delta`, compatible `reasoning_delta`, `input_json_delta`) El decodificador SSE conserva estado del evento en los fragmentos fetch y acepta un terminal `message_stop` sin una nueva línea. En `message_stop`, el flujo traducido emite su resultado terminal y termina sin esperar de origen EOF. Los pings o comentarios posteriores no convierten ese mensaje completado en un flujo de búsqueda web Error. Pings y comentarios antes `message_stop` mantener el pensamiento largo se vuelve vivo; rechazos Los resultados incompletos no recuperables y las razones de parada de errores ascendentes siguen siendo fallas.
- Para los giros Anthropic enrutados Responses con herramientas cliente, un protector de terminal limitado detecta el Caso de alta confianza en el que el usuario solicitó una acción pero Claude termina con un reclamo de ejecución y ninguna llamada de herramienta. Realiza como máximo una continuación interna; respuestas normales, aclaraciones. preguntas, giros de uso de herramientas y respuestas incompletas de transporte no se retiran automáticamente.

## `google`

**Objetivos:** Google **Gemini**, **Vertex AI**, y la antigravedad **Asistencia de código en la nube**. AI Studio utiliza
`/v1beta/models/{model}:streamGenerateContent`; los otros modos usan sus puntos finales nativos Google.
**Auth:** clave API, Vertex ADC o Google Antigravedad OAuth, seleccionado por `googleMode`.

- **Las denegaciones de ubicación son errores de permiso, no solicitudes inválidas.** Google rechaza el soporte ubicaciones geográficas o de centros de datos con HTTP 400 `FAILED_PRECONDITION: User location is not
  supported for the API use.` El proxy informa esto como `… location not supported: …` y lo clasifica como `permission_error` con código `location_not_supported`Así que un cliente no malinterpretó un rechazo de ubicación de red como un mensaje mal formado. La respuesta directa HTTP mantiene la de origen 400; rutas de terminal de solo mensaje infieren 403 (clase de permiso). La restricción en sí es Google de — el proxy no se enruta alrededor de él.
- Solicitud del sistema → `systemInstruction`; mensajes → `contents[]` (Asistente → `model`); herramientas →
  `functionDeclarations`. Datos-URL imágenes → `inline_data`.
- Los identificadores de llamada a herramientas se sintetizan cuando Gemini los omite. Vertex y Antigravedad preservan y reproducen opaco `thoughtSignature` valores para que las continuaciones de resultados de herramientas conserven la continuidad del razonamiento Gemini. La caché de firma se captura en el directorio config, por lo que las continuaciones también sobreviven al proxy se reinicia.
- **Las formas de respuesta mal formadas fallan al cerrarse.** El candidato reclamado, su `content`, o su
  `content.parts` que no es el contenedor documentado termina el turno con un
  `google response contained invalid …` error nombrando la razón estructural y la ofensa tipo de valor — nunca su contenido. La ausencia se maneja separadamente de la corrupción: un ausente,
  `null` o vacío `content` o `parts` completa el turno normalmente, un trozo de transmisión cuya
  `candidates` está ausente, `null` o vacío se omite para que el turno se complete en una terminal posterior marco, y una respuesta almacenada en búfer que no lleva ningún candidato en todas las
  `google response contained no candidates`. Una raíz `data: null` el marco de keepalive todavía se salta como relleno.
- Los lotes de llamada a herramientas se cierran en un turno de usuario inmediatamente adyacente que contiene uno ordenado.
  `functionResponse` por llamada representable. Las historias interrumpidas reciben un marcador explícito de resultado perdido; resultados duplicados o independientes se conservan como texto marcado (y hermanos de imagen) en emitido como inválido no emparejado `functionResponse` partes.
- **Entrada de vídeo y procesamiento angélico.** El contenido compatible con OpenAI
  `{"type": "video_url", "video_url": {"url": "…", "processing": "agentic"}}` Se acepta en ambos las rutas de ingreso de Chat y Responses. `url` es necesario; `processing` Es opcional y es en la parte Gemini como `media_processing` (`STATIC` es el valor predeterminado de Gemini, `AGENTIC`
  solicita comprensión de video agentico). El campo se sienta en el **parte**, al lado `inline_data` o
  `file_data`, por lo que se aplica a bytes en línea y URIs buscados por igual — no es el Interacciones API `processing`. Una petición que omite `processing` no gana ningún campo, por lo que las llamadas existentes son sin cambios.

  Se manejan tres formularios URL, y solo tres:

  | `url` | enviado como |
  | --- | --- |
  | `data:` URL | `inline_data` con los datos del propio tipo de medios de URL |
  | YouTube ver URL (`youtube.com`, `youtu.be`, `m.`/`music.`/`-nocookie` variantes) | `file_data.file_uri` |
  | `https://generativelanguage.googleapis.com/<version>/files/<id>` — el formulario de recursos de archivos API, donde `<version>` es `v1`, `v1beta` o `v1alpha` | `file_data.file_uri` |

  Cualquier otro URL remoto se mantiene como el marcador de texto `[video: <url>]`porque el adaptador no tiene tipo de medios para él y no hay evidencia Gemini lo fetch. El allowlist se empareja en el análisis El host de URL y la ruta sobre HTTPS — no en una subcadena — para que un host parecido no se convierta en un host
  `file_data` referencia el proxy pide Gemini a fetch. El camino está anclado al principio, por lo que el punto final de carga resumible (`/upload/<version>/files/<id>`) es *no* aceptado: no es un recursos legibles, y `file_data.file_uri` le pide a Gemini que no haga referencia a lo que se le da. `file_data` lleva `file_uri` solo; no adivinado `mime_type` se adjunta.

- **Salida de imagen en línea:** cuando el modelo es uno de los ID de chat explícitos con capacidad de imagen (`gemini-3.1-flash-image`, `gemini-2.0-flash-preview-image-generation`, o
  `gemini-3-pro-image-preview`), el adaptador envía `responseModalities: ["TEXT", "IMAGE"]`. ID de generación de medios independientes como `gemini-3-pro-image` No están incluidos. Devuelto
  `inlineData` las piezas se materializan bajo el configurado OpenCodex `artifacts/` directorio y aparece como enlaces de imagen de marcado a la ruta opaca autenticada
  `/v1/opencodex/artifacts/<id>` (no `file:` URIs o rutas del sistema de archivos host). Cada imagen está tapada a 50 MB y cada respuesta a 100 MB de datos descodificados; se rechazan cargas útiles base64 mal formadas. Los artefactos se podan automáticamente cuando el recuento supera los 200 archivos.

## `kiro`

**Objetivos:** El Amazon CodeWhisperer `GenerateAssistantResponse` servicio utilizado por Kiro (`https://runtime.{region}.kiro.dev/`).
**Auth:** Kiro OAuth acceder a token como Bearer, con metadatos de región/perfil de la credencial Kiro.

- Construye Kiro `conversationState`, mapea las herramientas Codex y los resultados de la herramienta, y envía bloques de imágenes compatibles por el cable Kiro.
- Conserva como máximo 20 imágenes en línea por mensaje y 100 por solicitud. Se omiten las imágenes históricas más antiguas primero cuando la solicitud excede el límite, con un marcador de texto en los mensajes afectados; imágenes recientes en el giro actual permanecen disponibles.
- Cuando un dato de imagen en línea URL carece de bytes de imagen o una coma, omite esa imagen con un marcador de texto en su turno de usuario o resultado de la herramienta. Las referencias de imágenes remotas usan un marcador separado; ningún marcador repite el URL.
- Coalesce las salidas adyacentes de la misma llamada de herramienta original en un resultado Kiro. El texto permanece ordenado, las imágenes conservan los límites por mensaje existentes y cualquier indicador de error permanece establecido. Usuario, desarrollador, asistente u otra herramienta finaliza el grupo. Identificadores originales distintos que mapean con el mismo ID de Kiro normalizado.
- Las salidas combinadas mantienen el texto real y la información de fallos sin insertar una pista de salida vacía para un trozo en blanco posterior. Un solo resultado mantiene su normalización existente; un texto completamente vacío. grupo recibe un recurso alternativo, con una redacción neutra cuando hay imágenes o un indicador de error.
- Trata a un cliente `parallel_tool_calls: true` valor como permiso en lugar de un requisito de cable. Kiro permanece serializado: el catálogo enrutado anuncia que no hay capacidad de herramienta paralela y la El adaptador no envía ningún campo de control paralelo de origen, pero las vueltas de herramienta Codex ordinarias no se rechazan Solo porque el cliente permite llamadas paralelas.
- Acepta Responses `text` controles que no son salida estructurada — `text.verbosity` y
  `text.format: {"type":"text"}` — sin reenviarlos. Kiro no tiene campo de alambre para ninguno, así que Son ignorados en lugar de rechazados. Salida estructurada (`text.format` de tipo `json_schema`
  o `json_object`) todavía se rechaza: el cable Kiro no puede restringir la forma de la respuesta, y un quien llama esperando JSON recibiría prosa.
- Descifra `application/vnd.amazon.eventstream`, reconstruye eventos de texto/pensamiento/herramienta, detecta herramienta truncada JSON, y estima el uso porque el flujo ascendente no devuelve los recuentos de token.
- Utiliza el configurado `baseUrl` literal cuando es costumbre. Un canónico
  `runtime.{region}.kiro.dev` URL sigue la región API de la credencial importada; solo que canónica forma es elegible para una reserva presupuestada a `q.{region}.amazonaws.com` Después de un endpoint, firma, DNS, o falla de conexión, o HTTP 502/503/504 recibido antes de la salida.
- Posee la recuperación de conexión-reset segura para reproducción, ese único recurso de punto final elegible, un OAuth actualizar/reproducir después de HTTP 401 y recuperación limitada para Kiro transitorio 429s. Reutilización compartida y Una sola sonda posterior al enfriamiento evita que las solicitudes simultáneas agoten los presupuestos de reintentos independientes; Los fallos de cuota dura no se vuelven a intentar en esa misma cuenta, y otros errores de servicio no se repiten. Cada envío físico Kiro utiliza salida de proveedor configurada. Una fecha límite de cabecera devuelve 504; la cancelación de la persona que llama detiene el turno. Los cuerpos finales HTTP 5xx usan texto público fijo sin detalles ascendentes.
- Su analizador sin flujo drena el mismo flujo de eventos para el bucle de búsqueda web.
- Informes de uso por cuenta. `AmazonCodeWhispererService.GetUsageLimits` on
  `https://management.{region}.kiro.dev/` devuelve la asignación del plan, que se convierte en la ventana de cuota mensual para esa cuenta; se informa de un saldo de prueba gratuita como su propia ventana. ARNLuego, se almacena API/SSO región. Un AWS
  La cuenta de Builder ID no tiene perfil ARN Por su cuenta, la sonda envía el mismo perfil de servicio Builder ID que utilizan las solicitudes de generación. ARN Una respuesta ilegible o no reconocida se informa como desconocida en lugar de como uso cero, y una cuenta cuyo exceso está habilitado no se trata como agotada simplemente por pasar su límite. AWS, así que trata los números como el mejor esfuerzo. Una cuenta sin ID de constructor sin un perfil utilizable ARN no hace ninguna solicitud de uso; el uso no está disponible mientras que una barra de cuota de mismo inicio de sesión anterior permanece visible. La prueba de cuota y agotamiento conocida sobrevive al reinicio solo para el mismo inicio de sesión, cada uno hasta su propio reinicio o vida útil de diez minutos. La evidencia faltante, antigua o mal formada se desconoce. El saldo de crédito preciso del plan se conserva con esa lectura de cuota de identidad. Kiro `meteringEvent` Los valores de crédito son gastos de solicitud medidos: el último valor dentro de una respuesta física se utiliza, y se añaden créditos de envíos facturados por separado. El uso del token sigue siendo estimado; los créditos nunca se infieren de tokens.
- Después de una solicitud admitida, lee los modelos disponibles de la cuenta de la administración regional. servicio sin demorar la solicitud. Los resultados almacenados en caché agregan ID de modelo al catálogo enviado. Las respuestas vacías o no reconocidas conservan la lista enviada y cualquier última lista de buenas cuentas. Modelo La membresía guía la preferencia de cuenta elegible; las identificaciones desconocidas todavía van hacia arriba. Ingresos notificados Los límites informan las ventanas de contexto, combinadas conservadoramente con los límites enviados cuando la evidencia es parcial. Las cuentas que no han servido aún no tienen evidencia de lista.
- Participa en la rotación de cuentas múltiples. Con dos cuentas almacenadas, un rechazo de tasa de solicitud enfría la cuenta rechazada brevemente; una negativa exacta mensual en HTTP 400 o 429 lo excluye hasta que expire el restablecimiento o la prueba observados. Una suspensión HTTP 403 confirmada cuarentenas que tienen en cuenta en el proceso, mientras que un 403 ordinario no gira. Reactiva La rotación permanece disponible cuando `oauthAccountFailover.enabled` es falso. Rechazo-consciente selección antes del primer envío requiere preferencia proactiva, con la configuración del proveedor tener prioridad sobre la configuración global. Un giro completo desde el mismo inicio de sesión borra un Veredicto de agotamiento más antiguo. Cada portador rotado lleva su propio perfil ARN y región.

<a id="completion-semantics"></a>

### Semántica de finalización

El texto del asistente Kiro no lleva ninguna fase de fin-giro confiable por sí mismo. Su terminal `metadataEvent`
puede llevar un nativo `stopReason`, pero Kiro puede etiquetar la prosa de progreso como `END_TURN`. En habilitado para herramientas turnos, `END_TURN` y `STOP_SEQUENCE` Por lo tanto, pruebe sólo que la inferencia se detuvo; sigue siendo comentario y entra en la validación de finalización limitada.

`END_TURN`, `STOP_SEQUENCE`, o una razón de parada faltante puede usar la ruta de compatibilidad. Otros explícitos razones ya han terminado la inferencia de origen, por lo que el adaptador informa de ellos en gasto de otra solicitud de modelo: un límite de superficies de salida-token como salida incompleta que un cliente puede continuar, mientras El agotamiento de la ventana de contexto aparece como un error de longitud de contexto no reintentable en lugar de como truncado salida. Filtrado y barandilla se detiene la superficie como salida incompleta filtrada, y un `TOOL_USE` parada que llega sin una llamada de herramienta real se informa como una contradicción en lugar de tratarse como progreso.

Cuando existe una herramienta de cliente común, opencodex agrega un
`codex_kiro_final_answer` herramienta a la solicitud de flujo ascendente; flujos de texto de progreso como comentario y No puede terminar el turno. El adaptador consume la llamada privada, emite su respuesta como texto final, y nunca expone la herramienta privada a Codex o Claude Code. Porque la razón de parada solo llega a al final de la secuencia, el texto del asistente en un turno habilitado para herramientas se mantiene hasta una llamada real a la herramienta comienza o termina el flujo, luego lo libera como comentario a menos que la herramienta privada proporcione la información final. Respuesta. Cuando el sidecar de búsqueda web está activo, El comentario aún se transmite antes del evento terminal; solo los eventos necesarios para decidir si el modelo solicitó que una búsqueda sintética permanezca almacenada en búfer.

Una pregunta sin la que el modelo no puede proceder es también una respuesta final. El contrato inyectado le dice a Enrutado modelo que cuando se necesita una decisión, una pieza de información, o una aclaración sólo el usuario puede dar, debe entregar esa pregunta a través de `codex_kiro_final_answer` y parar, en lugar de escribir la pregunta como texto ordinario y continuar. Tal giro llega como cualquier otro completado. respuesta: texto final con el turno terminado, no comentario y no una llamada de herramienta del cliente. Sin esto, el contrato describía solo "todavía funcionando" y "completamente completo", y un modelo pregunta no tenía manera de decir que — el resultado observado era una pregunta y un auto-invalidación emitida como uno mensaje, seguido de otra llamada a la herramienta desde la misma inferencia.

Si Kiro se detiene sin llamar a la herramienta de finalización, el adaptador realiza una continuación. Razonamiento... solo los reintentos conservan el turno original válido de usuario/resultado de la herramienta en lugar de fabricar un producto vacío mensaje de asistente; el progreso visible se reproduce con una instrucción de propiedad de adaptador no vacía. Antes transporte, la conversación generada se comprueba para alternar roles, giros estructurales no vacíos, e identificadores de uso/resultado de herramientas coincidentes. La salida de la herramienta vacía recibe un marcador de posición neutral no vacío. Los retry no puede recurse: un retry vacío o de razonamiento solo se devuelve como reintentable incompleto, mientras que un La llamada de la herramienta del cliente real mantiene el turno abierto. Una respuesta de herramienta de finalización siempre se emite como
`final_answer`, incluso cuando se repite exactamente el comentario anterior, porque la corrección de fase es más importante que la deduplicación cosmética. Las solicitudes libres de herramientas conservan el comportamiento normal de finalización del texto.

<a id="reasoning-effort"></a>

### Esfuerzo de razonamiento

La familia GPT-5.6 utiliza `additionalModelRequestFields.reasoning.effort`; `claude-opus-5`
usos `additionalModelRequestFields.output_config.effort`. Porque `gpt-5.6-luna` y
`gpt-5.6-terra`, sólo `low`, `medium`, `high`, y `max` Utilice la ruta nativa verificada. Sus `xhigh` La selección conserva las instrucciones de pensamiento limitadas anteriores en el contenido del usuario. porque ese peldaño nativo no ha sido verificado. `gpt-5.6-sol` y `claude-opus-5` mantener Su nativo existente `low`, `medium`, `high`, `xhigh`, y `max` comportamiento. Otros Kiro Los modelos usan razonamiento emulado; un control de esfuerzo anunciado no es prueba de apoyo nativo.

## `cursor`

**Objetivos:** Cursor `agent.v1.AgentService/Run` sobre HTTP/2 Conectar la transmisión en `api2.cursor.sh`
por defecto. Con `upstreamHttpVersion: "http1.1"` (o `"h1"`), utiliza Cursor de HTTP/1.1 par de compatibilidad: `agent.v1.AgentService/RunSSE` para la salida del servidor y
`aiserver.v1.BidiService/BidiAppend` para los mensajes del cliente.
**Auth:** Cursor OAuth/acceso token desde `provider.apiKey` o la cabecera de autorización reenviada.

- Usos `runTurn` en lugar de la ruta ordinaria fetch/parse. Solicitudes, eventos de servidor, argumentos de herramientas, controles de uso y las respuestas de los clientes se codifican con `@bufbuild/protobuf` esquemas en
  `cursor/gen/agent_pb.ts` y enmarcado como mensajes de conexión.
- Reproduce el estado de la conversación a través de blobs con contenido direccionado, mapea las llamadas de la herramienta del servidor a Codex, descubre modelos Cursor en vivo a través del protobuf `GetUsableModels` RPC, y reintenta solo antes de un La solicitud de ejecución está comprometida con el cable.
- Después de un giro sin herramientas exitoso, el adaptador mantiene Cursor ConversationStateStructure devuelto en un almacén de proceso local y reutiliza ese punto de control en la siguiente continuación lineal validada en lugar de reconstruir toda la historia raíz. Los turnos de resultados de herramientas reutilizan el último turno completado punto de control más solo el sufijo descubierto cuando se conoce el límite del mensaje cubierto. La búsqueda de prefijos sin refrescar requiere una conversación Cursor recordada o un hilo de cliente estable (incluyendo la sesión de escritorio limitada / retroceso del hilo) y un punto de control propiedad de ese mismo conversación con el proveedor; de lo contrario, se reproduce completamente. Compactación, aislamiento helper/shadow, desajuste cuenta/modelo, falta de refs, fallos de decodificación, recuperación forzada-fresca, y invalid_argument reintentos caen de nuevo a la repetición completa existente. A El reinicio del proceso elimina el almacén en memoria y las repeticiones completas. Cursor Conectar todavía no expone cache_read_tokens autorizada, por lo que el uso de OpenCodex no es un contador de aciertos en caché. El respaldo de escritorio limitado almacena solo un propietario derivado de HMAC de proceso; sesión/hilo en bruto cabeceras y OAuth/material de autorización nunca se escriben en el estado del punto de control. Cursor El transporte en vivo respaldado por OAuth y el descubrimiento de modelos filtrados por cuenta siguen siendo experimentales; vea el
  [guía del proveedor](/es/guides/providers/) y [Configuración del proveedor Cursor](/es/reference/configuration/providers/#cursor-provider-adapter-cursor)
  para los configuración de inicio de sesión y transporte. La reutilización del punto de control es automática y no tiene ninguna configuración de usuario.
- Las continuaciones de herramientas de modelo externo mantienen la última solicitud real del usuario en la acción activa; Los resúmenes automáticos y el contexto del navegador ambiental independiente siguen siendo contexto histórico. La entrada de usuario en blanco o solo imagen no revive una solicitud anterior. Guía de modo de código Grok 4.6 requiere una emisión explícita del resultado y nunca supone una salida emitida de celda completada vacía. La salida faltante requiere una comprobación de estado de solo lectura, no repetición de un efecto secundario completado. El aviso de repetición se restablece en un nuevo turno de usuario / desarrollador y permite las encuestas solicitadas. Si las raíces del punto de control transportadas exceden la repetición presupuesto, la historia disponible se reconstruye bajo los mismos límites. Estas reparaciones no garantizan idéntica redacción o comportamiento de razonamiento entre las rutas Cursor y xAI.
- Honores `upstreamHttpVersion` tanto para el descubrimiento de modelos en vivo como para la inferencia. `auto`, `http2`, y `h2`
  preservar el transporte HTTP/2 existente; solo `http1.1` y `h1` Seleccione el modo de compatibilidad.
- Expone el router Cursor como `cursor/auto` más explícito `cursor/auto-cost`,
  `cursor/auto-balance`, y `cursor/auto-intelligence` entradas. Los niveles explícitos están codificados en
  `requested_model.parameters` Mientras que el legado `cursor/auto` La entrada conserva la cuenta/equipo por defecto.
- Envía regularmente `cursor/grok-4.5` niveles con los identificadores de cable de descubrimiento en vivo exactos de Cursor (`cursor-grok-4.5-low`, `-medium`, o `-high`) Conserva `cursor/grok-4.5-fast` seleccionable mientras El envío de la canónica `grok-4.5` modelo con separado `effort` y `fast=true` parámetros.
- La ejecución local nativa de Cursor-sistema de archivos/shell/red se niega de forma predeterminada. Explícito `mcpServers`
  y `desktopExecutor` Las integraciones tienen opt-ins separados; `nativeLocalExec: "on"` permite el un ejecutor incorporado más amplio y evita la aprobación / semántica de sandbox Codex y el legado
  `unsafeAllowNativeLocalExec: true` Es equivalente sólo cuando `nativeLocalExec` es inestable. Primer plano `shellArgs` y `shellStreamArgs` son una excepción: ambos son rechazados antes de la aparición en cada plataforma hasta que la propiedad descendiente respaldada por kernel esté disponible. Usar herramientas de shell cliente; La ejecución de background-shell y otras operaciones nativas conservan su política existente.
- La respuesta de denegación sigue al catálogo de solicitudes. Los modelos explícitos de la familia Claude Cursor reciben redacción factual que nombra las herramientas disponibles sin instrucciones para ocultar o evitar discutir la redirección. El comentario de enrutamiento de hecho puede preceder a la siguiente llamada de herramienta sin finalizar el turno. Cuando no hay ningún cliente o herramientas MCP configuradas disponibles, se pide a los modelos Claude que respondan sin herramientas o informar de la limitación en lugar de llamar inexistentes herramientas de shell / edición. Otros modelos, incluyendo Auto/predeterminado, conservan la redacción y los comentarios de redirección silenciosa existentes. guardia. La disponibilidad de la herramienta, la política de ejecución y el comportamiento de aprobación/caja de arena no cambian. En el modo de código — una forma libre unificada `exec` y no hay puente de cáscara desnuda — los puntos de redirección en el interior `exec`donde: shell, archivo, búsqueda y fetch están anidados `tools.<name>(...)` Ayudantes de la celda JavaScript, y nunca recomienda que el modo de código de puente de shell de nivel superior no exponga. Un catálogo que lleva `shell_command`/`exec_command` o una forma no libre unificada `exec` mantiene la redacción del puente; un catálogo que no lleva ni — un cliente orquestador exponiendo solo sus propias herramientas Responses, por ejemplo, — se redirige a los nombres de cable reales de la solicitud, por lo que el herramienta que existe en lugar de un alias que no puede ver.
- Se informa de una puerta de política de datos Cursor reconocida con su título, la acción que requiere y el Cursor Revisión del panel de control URL en lugar de desnudo `failed_precondition: Error`. El reconocimiento se limita al detalle estructurado conocido: los detalles desconocidos o mal formados mantienen el error de conexión genérico, ningún texto ascendente, botón, URL, o la acción de consentimiento se reenvía o ejecuta, y el fallo permanece inretenible. Revisar y aceptar una política de datos sigue siendo una acción del usuario en Cursor sí mismo.

Los esquemas de shell compatibles con Codex retienen los permisos de sandbox, la justificación y el uso reutilizable reglas de prefijo y modo de inicio de sesión. Herramientas de forma libre exponen una cadena requerida `input`
y preservar su orientación específica de la herramienta, como la envoltura de parche requerida; bare `exec_command` y `shell_command` Los nombres están reservados para shell no freeform. Puentes. Espacio de nombres es una herramienta de forma libre personalizada que utiliza cualquiera de los nombres. Estos esquemas Las declaraciones no otorgan aprobación ni cambian la política de ejecución.

## `devin`

**Objetivos:** Cognición `exa.api_server_pb.ApiServerService/GetChatMessage` sobre HTTPS Conectar streaming en `server.codeium.com`.
**Auth:** Devin/Cognición API clave de `provider.apiKey` o la cabecera de autorización reenviada. Login primero intenta importar la credencial que Devin CLI ya tiene instalada: `devin auth
login` completa el CLIEl propio PKCE Inicie sesión y escriba un `devin-session-token` a su
`credentials.toml`que es la misma credencial `SeatManagementService.RegisterUser` mentas para un inicio de sesión del navegador. Cuando no existe una credencial CLI utilizable, el inicio de sesión vuelve al inicio de sesión del navegador Auth0 e intercambia el token pegado a través de `RegisterUser` para una clave API de larga duración. `devin-cli` sobrevive solo como un alias obsoleto — `ocx login devin-cli` Todavía rutas a `devin`y un salvado configuración que nombra el id antiguo se reescribe al inicio.

- Usos `runTurn` en lugar de la ruta ordinaria fetch/parse. Las solicitudes y los eventos del servidor están codificados con encuadre protobuf manual `devin/cloud-direct/wire.ts`; el ordinario `buildRequest` /
  `parseStream` El camino está desactivado.
- Las conversaciones nombradas reutilizan una trayectoria a través de giros secuenciales, con alcance a la credencial resuelta y anfitrión inquilino. La identidad de hilo propio tiene prioridad sobre los marcadores de sesión (`session_id`,
  `session-id`, o `x-session-affinity`) Cuando una identidad de hilo propio y un no vacío
  `x-codex-parent-thread-id` ambos se suministran, su pareja identifica la conversación, así que las identificaciones propias iguales bajo diferentes padres permanecen separadas. Independiente propio y solo de sesión Las identidades conservan su precedencia existente; un padre compartido solo no es una identidad de conversación. Los turnos superpuestos reciben distintas ID. El proxy retiene como máximo 256 entradas en la memoria, desaloja solo las entradas inactivas y libera las reclamaciones después de la finalización, falla o cancelación. Reiniciar el proxy borra la retención. Las llamadas sin nombre continúan asignando un ID por solicitud. Esto admite continuidad pero no garantiza un éxito de caché ascendente o un ahorro particular.
- La continuidad del razonamiento lleva firmas de proveedores a través de turnos. Si la cognición rechaza una firma Anthropic reproducción antes de la salida visible, Devin reintenta una vez con la firma retenida y el Pensamiento texto preservado.
- Descubrimiento de modelos en vivo a través `GetCascadeModelConfigs`; la semilla estática se filtra contra el la lista en vivo de la cuenta para que los modelos que no están en el plan se retiren en lugar de fallar a pedido.
- Las definiciones de la herramienta se codifican en la solicitud y los eventos de llamada a la herramienta se descodifican a partir de la respuesta. Flujo. Cognición impone un límite de longitud por herramienta-descripción (6.998 caracteres) y una frase exacta blocklist; el adaptador desinfecta los disparadores conocidos y trunca las descripciones demasiado largas antes de codificación.
- Las teclas API de Devin/Cognition no tienen punto final de actualización. Si Cognition rechaza una clave almacenada con 401, OpenCodex marca esa cuenta para la reautenticación y puede usar otra cuenta de inicio de sesión para El turno. Correr `ocx login devin` de nuevo para una clave de inicio de sesión del navegador revocada. Una cuenta importada por CLI Puede seguir un `devin auth login` rotación de teclas solo cuando su ID de cuenta o correo electrónico almacenados coincide con la identidad CLI acuñada. Importaciones sin una identidad almacenada requieren un
  `ocx login devin` Después de la rotación. Un legado `devin-cli` slot para esa misma cuenta ya puede Mantenga la nueva clave; una cuenta diferente que la mantenga bloquea la adopción. Si el archivo CLI es temporalmente ilegible o la verificación de identidad no está disponible, reintente después de que se recupere. Una cuenta en pausa permanece en pausa durante esta recuperación y devuelve 403.
- Solo la credencial es local cuando se usa la ruta de importación CLI. El giro en sí mismo va a Cognición de cualquier manera, por lo que la importación y las rutas de inicio de sesión del navegador difieren en nada, pero donde el La credencial vino de. Instalar el CLI con
  `curl -fsSL https://cli.devin.ai/install.sh | bash` o `brew install --cask devin-cli`, correr
  `devin auth login` Una vez, agregue el proveedor.
- Una construcción anterior envió un segundo adaptador bajo el id `devin-cli` que corrió el giro como un Sesión de protocolo de cliente de agente contra un servidor local `devin acp` proceso infantil. Se ha ido. A salvo configuración que todavía nombra ese adaptador se reescribe a `devin` En el arranque, incluyendo a fila con nombre personalizado como `"devin-acp"`.
- La solicitud de chat está calibrada, no adivinada. Tres cosas lo unen: la credencial es el sesión token se duplicó y se unió `Authorization: Basic` mientras el cuerpo protobuf mantiene una copia, el sobre de solicitud sube sin comprimir, y `Metadata` .31 Lleva un 732 caracteres cuya longitud — no valora — el servicio comprueba. Dentro
  `CompletionConfiguration`, 2 es el límite de salida y 3 es `max_newlines`, enviado a un gran fijo valor; intercambiar esos dos hace que cada turno falle con un `invalid_argument`. Sin llamada o tapa configurada, la tapa de salida es el propio techo del modelo seleccionado del catálogo, y 8192 solo cuando el catálogo no está disponible. Se rechaza una temperatura de exactamente 0, por lo que se fija al valor aceptado más pequeño.
- Una pre-salida 429 con un retardo de recuperación indicado aparece inmediatamente por defecto, liberando el capacidad compartida de turno admitido. Establecer `OPENCODEX_DEVIN_STATED_RESET_WAIT_MS` a una acumulación positiva Permite en milisegundos esperar el retraso completo y reproducir la misma solicitud hasta dos veces. La asignación tiene un límite máximo de una hora; un valor ausente, vacío, inválido o negativo desactiva la espera. Una espera independiente opcional mantiene el giro HTTP y su ranura de giro activo compartida abiertos durante todo el retraso. Los giros de transmisión inician SSE en un latido cardíaco seguro y luego programan los latidos cada 500 ms o menos durante la espera para que el perro guardián del puesto se mantenga alimentado. Una presalida posterior 429 puede rotar a otra salida. cuenta OAuth elegible; sin una, se informa dentro de la secuencia ya abierta. Buffered Grok mantener un HTTP 429 y `Retry-After` En un rechazo final. Los niños combinados muestran la pre-salida 429 inmediatamente, incluso cuando la espera está habilitada, por lo que el combo puede intentar su próximo objetivo sin mantener una respuesta no comprometida. Retrasos superiores a los restantes asignación en la superficie de giros independientes el original 429 sin un reintento temprano. Los final 429 conserva el retraso declarado como una pista de enfriamiento. A `~` en su mensaje marca un retraso recuperado a partir de una frase de remolque de segunda mano en lugar de un valor de encabezado exacto.
- Para los flujos Codex Responses, los fallos conocidos de límite de velocidad tipificados con un retardo válido se normalizan a
  `rate_limit_exceeded` con `Please try again in Ns.` antes del detalle redactado original. Esto permite a Codex cumplir con el retraso establecido y usar su notificación de reconexión nativa sin agregar un elemento de razonamiento al historial de conversaciones. Los reintentos de clientes son finitos y están controlados por El cliente `stream_max_retries`; esto no promete recuperación después de apagar o reiniciar la aplicación. Salir `OPENCODEX_DEVIN_STATED_RESET_WAIT_MS` Desactivado o `0` para que el cliente tenga la espera. Una asignación proxy positiva mantiene la espera existente de propiedad de proxy; el cliente solo se entera de una rechazo final después, y los reintentos del cliente pueden multiplicar los intentos por solicitud del proxy. La conmutación por error de destino/cuenta combinada y el manejo de Grok HTTP 429 conservan su pedido existente. La ubicación exacta de la interfaz de usuario y el texto dependen de la versión Codex; esto no es una cuenta atrás personalizada. Los errores de límite de velocidad de solo mensaje usan el mismo formato de retardo más largo. Errores tipificados sin un retraso útil conservar su código original. Los reintentos de cliente crean nuevas solicitudes HTTP; no comparten el contador de envío o la asignación de espera acumulativa de una solicitud proxy. Esto compatibilidad no reemplaza los controles de una espera proxy explícitamente habilitada.
- Puente no oficial experimental; no se muestra en el panel de control predeterminado. Ver la
  [guía del proveedor](/es/guides/providers/) para instrucciones de inicio de sesión.

La identificación del modelo que usted elige es una familia de modelos, y el esfuerzo de razonamiento escoge la Variante. Sin esfuerzo, se utiliza la variante por defecto de la familia: `swe-1-7`
selecciona `swe-1-7-medium` y `swe-2` selecciona `swe-2-high`. Un esfuerzo cambia solamente el esfuerzo y aterriza en la variante más baja en o por encima de él, o la más alta abajo cuando nada está arriba, así que un peldaño perdido nunca rechaza el razonamiento:
`swe-1-7` en `high` selecciona la fila Max `swe-1-7`, `swe-2` en `low` selecciona
`swe-2-medium`, y `kimi-k3` en `medium` selecciona `kimi-k3-high`. `fast` selecciona la variante Fast y `1m`, `max-1m` o `none-1m`
la variante de contexto 1M donde la familia tiene una; de lo contrario no cambian nada. Una identificación con sufijo tal como `claude-opus-5-high-fast` mantiene su variante sin una esfuerzo, y con uno mantiene su configuración rápida y contextual a menos que eso baje el esfuerzo: sin una fila rápida en o por encima del esfuerzo, se usa la fila regular. Una identificación que nombra una variante que tu cuenta ha deshabilitado se envía como nombre cuando el esfuerzo todavía aterriza en él, por lo que la solicitud falla con el propio error de esa variante en lugar de cambiar de nivel silenciosamente. La resolución nunca se mueve a otra familia. Cuando el catálogo de la cuenta no está disponible, el esfuerzo es En lugar de ello.

## `zed`

**Objetivos:** Zed Hosted AI's `POST /completions` punto final en `cloud.zed.dev`.
**Auth:** Zed identidad de cuenta de aplicación nativa más acceso token, intercambiado por un LLM de corta duración token.

- Utiliza el inicio de sesión de devolución de llamada nativo RSA (`ocx login zed`) y pares el devuelto `user_id` Con el acceder a token para búsquedas de usuarios y organizaciones con alcance de cuenta.
- Envuelve los constructores de chat Anthropic Messages, Google Gemini, OpenAI Responses y xAI existentes dentro de la envolvente del proveedor de Zed, luego desenvuelve los eventos NDJSON/SSE de Zed de nuevo en `AdapterEvent`.
- Se ajusta a una lista de modelos en vivo limitada y con alcance de cuenta para la visualización y la inferencia del proveedor-familia; la lista no es una lista de modelos permitidos, por lo que todavía se reenvía un identificador de modelo proporcionado por la persona que llama.
- Experimental, no oficial y no respaldado por Zed. Usarlo puede romper los términos de servicio de Zed y puede limitar o suspender la cuenta de Zed; ese riesgo es el del usuario para aceptar.

## `azure-openai` (alias: `azure`)

**Objetivos:** **Azure OpenAI**. Envolturas `openai-responses` (Así también `passthrough: true`).
**Auth:** `key` vía el `api-key` encabezado (no Bearer).

- Los delegados solicitan la creación en el paso Responses, valida que `baseUrl` no contiene plantilla no resuelta marcador de posición, y reemplaza `Authorization` con `api-key`. El URL configurado apunta directamente a Azure's v1 Responses API, por lo que el adaptador no se adjunta `api-version`.
- Comparte la recuperación de Responses para el estado de razonamiento producido por otro proveedor:
  `400 invalid_encrypted_content` se reenvía una vez sin ese estado. Véase
  [Formatos proxy](/es/reference/proxy-formats/) en "Cambiar de proveedores en una conversación existente".

<a id="image-utilities-imagets"></a>

## Utilidades de imagen (`image.ts`)

Ayudantes compartidos utilizados por los adaptadores con visión clara:

- `parseDataUrl(url)` — dividir a `data:<type>;base64,<data>` URL en `{ mediaType, base64 }` por Bloques de imagen Anthropic/Google.
- `contentPartsToText(content)` — aplanar partes de contenido a texto para mensajes de herramienta de solo texto (Una imagen no descrita se convierte en un corto `[image]` marcador, nunca una burbuja base64 que explote token).

<a id="grok-build-terminal-snapshots"></a>

## Instantáneas de terminal Grok Build

Solicitudes marcadas con `x-opencodex-grok: 1` opt en un terminal estrecho Responses reparación. Si `response.completed.response.output` falta o está vacío, opencodex puede reconstruirlo a partir de datos reales, indexados de forma única, contiguos `output_item.done`
elementos cuyos campos sin procesar satisfacen las formas admitidas. Los deltas por sí solos no crean salida. La evidencia malformada, contradictoria, duplicada, abierta o de gran tamaño mantiene El terminal vacío sin cambios; las respuestas fallidas e incompletas nunca se convierten en éxito.

El marcador es una opción de compatibilidad seleccionada por el cliente, no una identidad autenticada. o una concesión de permiso. Los clientes no identificados conservan su comportamiento existente. Esto La reparación corre antes que el proveedor separado `responsesSnapshotRepair` opción y no permite esa reparación más amplia del ciclo de vida. Herramienta-búsqueda existente, herramienta personalizada, La función de finalización y el manejo de herramientas no declaradas mantienen su orden establecido.

<a id="deepseek-and-claude-code-artifact"></a>

### DeepSeek y Claude Code artefacto

Para el endpoint oficial DeepSeek Chat Completions, opencodex relaja la
`anyOf` restricciones en el Claude Code incorporado `Artifact` esquema de herramientas a evitar errores de validación de esquema HTTP 400. Se omite el modo estricto para esta herramienta. Campos definido sólo dentro de un `anyOf` ya no están limitados por esa unión; la herramienta debe validar sus entradas. Otras herramientas y proveedores conservan su comportamiento existente.
