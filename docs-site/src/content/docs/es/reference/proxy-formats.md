---
title: "Formatos de API del proxy"
description: "Referencia a nivel de cable para las superficies Responses, Chat Completions, Anthropic Messages, catálogo de modelos, WebSocket, tiempo real y compactación."
---

opencodex presenta un proxy local en varios dialectos de cliente. Un cliente Codex puede hablar Responses API, una aplicación compatible con OpenAI puede hablar Chat Completions, y Claude Code puede hablar Anthropic Messages sin necesidad de que cada proveedor de origen implemente todos los formatos.

La ruta de traducción normal es:

```text
client dialect → internal Responses model → provider adapter → provider wire format
provider events → internal adapter events → client dialect
```

La representación Responses es el centro del puente. Las rutas compatibles nativas pueden omitir partes de la traducción y pasar una solicitud, pero autenticación, enrutamiento, control de admisión, y La seguridad de respuesta sigue ocurriendo en el límite del proxy. Configure el oyente y las claves de admisión en
[Configuración](/es/reference/configuration/); utilizar [Combos](/es/guides/combos/) Cuando un modelo público Debe seleccionar entre varios objetivos.

<a id="mimo-bare-tool-call-recovery"></a>

## Recuperar llamadas sin estructura de MiMo

En las rutas convertidas a OpenAI Chat, `mimo-v2` y los identificadores con puntos `mimo-v2.*` pueden recuperar un bloque `<tool_call>` completo como una llamada a una herramienta freeform declarada con ese nombre exacto cuando la respuesta no incluye llamadas estructuradas. Se conserva el texto alrededor del bloque. Los ejemplos en bloques de código o código en línea, los encabezados anidados, las herramientas no declaradas y los envoltorios con identificadores permanecen literales. La recuperación está acotada a 128 llamadas, 4 MiB en total y 2 MiB por candidato. Un texto largo en streaming puede liberar el marcado original antes de la recuperación final; los errores nunca despachan las llamadas recuperadas.

<a id="upstream-redirects"></a>

## Redirecciones ascendentes

Las solicitudes de modelo, imagen, vídeo y búsqueda que llevan credenciales no siguen automáticamente las redirecciones de HTTP, incluidas las redirecciones del mismo origen. Configure el API ascendente final URL en lugar de un alias de redirección. Una redirección no hace que el servidor vuelva a enviar las credenciales o el cuerpo de la solicitud a su destino. El propietario de la respuesta conserva su error existente o comportamiento de retransmisión; las rutas nativas Responses y compactas pueden devolver el 3xx original y `Location` al cliente. El comportamiento de redirección del cliente es independiente de esta política de transporte del servidor.

<a id="console-upload-rejections"></a>

## Rechazos de carga de consola

Una consola exacta o consola Go `Invalid upload request.` HTTP 400 desde un canonical El punto final de generación Zen/Go recibe un reintento después de 800 ms. El proxy reutiliza la misma solicitud seriada y registra la recuperación en Logs. 400 errores, destinos personalizados, cancelaciones y repetidos rechazos de carga siguen siendo fallas. Esto no reintenta respuestas de modelo filtradas o flujos interrumpidos.

<a id="codex-native-ordinary-lite-hosted-search-history"></a>

## Historial de búsquedas alojadas de Codex-nativo Lite ordinario

Cuando la solicitud de salida final no declara ninguna herramienta de búsqueda alojada (no `web_search` o `web_search_preview` Entrada en `tools` o en un Lite `additional_tools` Envoltorio, incluso después de que se eliminaron las herramientas alojadas no compatibles del proveedor), cada destino Responses recibe una repetición sin referencia `web_search_call` historia como las mismas notas de referencia del asistente etiquetadas que se describen a continuación, con o sin la opción de inclusión. Native Sol respondió a esa historia con un genérico `server_error` (7250), por lo que una conversación que busca en otro modelo puede continuar en una ruta cuya solicitud actual no tiene herramienta de búsqueda. Una herramienta de función llamada `web_search` No es una declaración alojada. No se agrega ninguna herramienta de búsqueda, no se vuelve a ejecutar la búsqueda y no se inventa ningún resultado; igual entrada `item_reference` Las células permanecen estructurales. Una solicitud que declare la búsqueda alojada mantiene el historial estructural a menos que se aplique la opción de aceptación a continuación.

Las solicitudes ordinarias que declaran la búsqueda alojada conservan el historial estructural de la búsqueda alojada de forma predeterminada, incluidas las solicitudes Responses Lite. Para optar por notas de referencia con pérdida, establezca `providers.openai.projectResponsesLiteHostedSearchHistory: true` en `config.json` (un booleano real, no la cadena `"true"`) La configuración por defecto del proveedor se desactiva; omisión o `false` mantiene la historia estructural. Incluso cuando está habilitado, la proyección se aplica a los giros ordinarios y a la v2 nativa. `compaction_trigger` solicitudes cuyo destino final es exactamente canónico ChatGPT Codex `/responses` y cuya solicitud efectiva seleccione explícitamente Responses Lite. Convierte el resto no referenciado `web_search_call` Historial en notas de referencia del asistente etiquetadas. La final `x-openai-internal-codex-responses-lite` El encabezado selecciona Lite solo cuando su valor es exactamente `true`; un explícito `false` Anula los metadatos del marco. Sin un valor de encabezado reconocido, un string-map válido `client_metadata.ws_request_header_x_openai_internal_codex_responses_lite` valor de `true` se utiliza, coincidiendo con el manejo de metadatos WS existente. Intención efectiva no-Lite o no reconocida retiene el historial estructural; los metadatos mal formados no anulan un HTTP explícito `true`. Nombres de modelo, autenticación de suscripción, declaraciones alojadas faltantes y `additional_tools` solo no seleccione esta directiva; no se reescribe ningún encabezado ni metadatos para que se aplique. Una vez habilitado, se aplica a nuevos hilos/bifurcaciones, continuaciones de modelos cruzados y errores/reiniciaciones de caché, sin configuración de diagnóstico. Solo una nota puente válida del mismo alcance demuestra una llamada/resultado de función original que se puede restaurar primero; un prefijo de ID, nombre de modelo o nota faltante no puede determinar el emisor. Una celda alojada exactamente referenciada por una misma entrada `item_reference.id` es retenido. `store:false` elimina las referencias anteriores y se puede proyectar el historial de host restante. Declaraciones de herramientas/Lite `additional_tools`, opciones, pares de llamadas/resultados del cliente, texto cifrado de razonamiento/nativo, orden no alojado e historial sin procesar de la persona que llama conservan sus contratos existentes.

Dentro de ese límite de Lite opcional, esta es una **política de historia lossy**, no es una afirmación de que las llamadas alojadas no son válidas esquema o que todos los errores de flujo ascendente son fijos. Las notas llevan metadatos de estado/acción no confiables y URL/título/tipo permitidos tanto de fuentes de acción como de nivel superior, nunca instrucciones ni cuerpos de página buscados: 2.048 unidades UTF-16 por cadena, 20 entradas por lista, 65.536 bytes seriados para todas las notas proyectadas, luego una nota de omisión. Los ID y los campos desconocidos se eliminan de las celdas convertidas. HTTP/SSE y WS comparten el constructor ordinario final.

Aparte de la regla de faltante-declaración anterior, público OpenAI API y otros destinos no ganan proyección ordinaria o nativa compacta. Nativo `/responses/compact` sigue siendo su ruta de salida opaca oficial/oficial/depurador de cuentas/endpoint existente y conserva el historial estructural alojado. Los resúmenes portátiles/enrutados reutilizan su comportamiento de activación de proyección y referencia predeterminado existente; el renderizador compartido también conserva las fuentes de nivel superior listadas allí. No se introduce ningún nuevo reintento, clasificación de fuentes o resumen de compactación.

<a id="empty-search-answers"></a>

## Respuestas de búsqueda vacías

Después de la búsqueda alojada, un pase de respuesta forzada limpio pero vacío recibe una respuesta adicional. Intentar con las herramientas eliminadas y los resultados existentes retenidos. Esto puede implicar otro modelo solicitud. Una segunda respuesta vacía falla; llamadas mal formadas y rechazo o truncamiento del proveedor Los resultados se conservan sin este reintento.

<a id="xai-policy-refusals"></a>

## Rechazos de política xAI

Algunas denegaciones xAI Chat Completions llegan como HTTP 403 con una denegación de modelo exacta Sentencia como `I can't help with that request.` en lugar de HTTP 200 más
`finish_reason: content_filter`. Codex trata un 403 como un fallo de transporte, por lo que el El turno del usuario nunca se registra y se vuelve a intentar la misma solicitud.

En un no-combo Responses solicitud, OpenCodex reescrituras que permiten incluir 403 en un
HTTP 200 Responses Carga útil con `status: "incomplete"` y
`incomplete_details.reason: "content_filter"`. La reescritura se ejecuta en el openai-chat ruta del adaptador y en el paso de respuestas abiertas (grok-4.6 / gruk-4.5 OAuth). Streaming utiliza el mismo límite incompleto. Vacío o espacios en blanco 403 cuerpos permanecen Errores. Suscripción, crédito, derecho y `not allowed to use this
model` 403 errores de permanencia. La conmutación por error combinada sigue viendo el HTTP 403 original.

<a id="cursor-context-overflow"></a>

## Desbordamiento de contexto Cursor

El primer desbordamiento de contexto desnudo de Cursor se muestra al cliente. Solicitudes elegibles posteriores con un hilo de cliente estable puede recuperar hasta tres repeticiones de conversación por retenido alcance. La asignación en memoria expira después de una hora de inactividad, desalojo o reinicio. Solicitudes sin un hilo estable, ayudantes aislados, hojas de vida de resultados de herramientas, salida parcial, compactación y los errores de cuota no utilizan esta recuperación. Los desbordamientos elegibles continuos mantienen el activos incluso después de que se agoten; no la reponen. Esto no infiere si una tarea está progresando.

<a id="live-sideband-connection-failures"></a>

## Fallos de conexión de banda lateral en vivo

El proxy completa el protocolo de enlace ascendente de banda lateral antes de aceptar al cliente WebSocket. Un rechazo ascendente falla la actualización con 502; un tiempo de espera de saludo de diez segundos devuelve 504, y la cancelación del cliente devuelve 499. Bun no expone el estado de enlace ascendente exacto, por lo que un enlace ascendente 404/410 Actualmente no se puede enviar con precisión. Una conexión exitosa preserva la sesión inicial marcos en orden. Esta política de intercambio es independiente del transporte Responses WebSocket.

<a id="undeclared-tool-calls"></a>

## Llamadas de herramientas no declaradas

En el punto final Responses, cuando una solicitud declara un catálogo de herramientas, una respuesta de paso a través nativa que llama a una herramienta ejecutada por el cliente fuera de ese catálogo falla el turno en lugar de Llamada: a `response.failed` Evento con código de error `undeclared_tool_call`Entonces, `data: [DONE]`; JSON devuelve HTTP 502 con el mismo código. El rechazo se produce antes de que la respuesta pueda entrar en el estado de continuación, y se retira solo por `authMode: "forward"` proveedores o a solicitud sin catalogo declarado.

Los endpoints Chat Completions y Messages honran los catálogos de herramientas diferidas: esos clientes pueden declarar un catálogo parcial y descubrir el resto en entorno de ejecución a través de su propio registro de herramientas, que — no la instantánea del catálogo traducido — posee el límite de declaración completo. Una llamada fuera de la lista declarada se retransmite para que el cliente valide; una llamada inventada contra un explícitamente vacío `tools: []` todavía se rechaza, porque no existe un registro diferido bajo una Declaración vacía. Esto se aplica a las rutas nativas administradas y las respuestas traducidas, que incluyen Llamadas de herramientas cliente en la búsqueda alojada final, imágenes o respuestas de video. Solo se aplica la declaración del turno actual; Los catálogos omitidos, parciales y solo alojados mantienen su comportamiento existente. Rutas de desvío de llamadas conservar su exención, y las operaciones internas alojadas no se verán afectadas. Esas negativas mantienen la
`undeclared_tool_call` código en cada cable:

- **Chat Completions:** a `data:` marco que contiene un estilo OpenAI `error` objeto que lleva el código, entonces el flujo se cierra sin una finalización exitosa o `[DONE]`; devuelve JSON almacenado en buffer HTTP 502 con el código.
- **Messages:** un Anthropic `event: error` marco cuyo cuerpo es
  `{ "type": "error", "error": { "type": "api_error", "code": "undeclared_tool_call", ... } }`, sin éxito `message_stop` o `[DONE]`; almacenado en memoria intermedia JSON devuelve HTTP 502 `api_error`
  con el código. Una violación del catálogo determinista nunca se informa como una violación reintentable.
  `overloaded_error` (HTTP 529).

Messages nativo también reconoce definiciones de herramientas de mensajes del sistema en línea junto con `tools: []`. Esos nombres permanecen accesibles hasta que se eliminen permanentemente; una declaración en línea no autoriza Herramientas de cliente no relacionadas. Las llamadas MCP alojadas y los flujos de argumentos de herramienta de servidor conservan su forma nativa.

Por separado, en cada cable de entrada, un proveedor `default.`-namespace call está normalizado de nuevo al nombre de la herramienta desnuda que declaró la solicitud (`default.Read` → `Read`).

<a id="endpoint-overview"></a>

## Visión general de punto final

| Superficie del cliente | Punto de conexión | Resultado exitoso no-stream | Resultado de transmisión o socket exitoso |
| --- | --- | --- | --- |
| OpenAI Responses | `POST /v1/responses` | Responses JSON | Responses SSE, o Responses JSON marcos de texto sobre WebSocket |
| OpenAI Chat Completions | `POST /v1/chat/completions` | `chat.completion` JSON | `chat.completion.chunk` SSE termina en `[DONE]` |
| Anthropic Messages | `POST /v1/messages` | Anthropic `message` JSON | Anthropic Messages SSE |
| Anthropic Cantidad de token | `POST /v1/messages/count_tokens` | `{ "input_tokens": number }` | No se requiere |
| Descubrimiento del modelo | `GET /v1/models` | Catálogo o instantánea de escritorio explícita | No se requiere |
| Transcripción de archivos | `POST /v1/audio/transcriptions` | `{ "text": string }` o texto plano | No se admite en este punto final de archivo |
| Dictado de streaming | `WS /v1/audio/transcriptions/stream` | No se requiere | Dictado de escritorio JSON eventos |
| Voz y tiempo real | `POST /v1/live`, `POST /v1/realtime/calls` | Respuesta retransmitida de creación de llamadas | Una banda lateral separada WebSocket retransmite tramas en ambas direcciones |
| compactación Responses | `POST /v1/responses/compact` | Historial de sustitución JSON | No se requiere |

<a id="file-transcription"></a>

## Transcripción de archivos

Conexiones > Las teclas API tienen **Dictado** y **Voz en vivo** bloques. Introduzca una clave de datos OpenCodex, no una clave de proveedor o administración. Cargas de dictado el archivo que seleccione y ofrece cancelación y copia de la transcripción. Voz en vivo
**Comprobar la conexión** abre una sesión sin acceso al micrófono ni a los marcos de audio, espera el reconocimiento de la sesión del proveedor y se desconecta después de un minuto o cuando salga del panel. La clave solo queda en la memoria de ese panel.
**Configurado, no verificado** describe la configuración del proveedor, no la cuenta salud o derecho. Utilice la acción explícita para observar un resultado. Los ejemplos usan nunca incluya el secreto ingresado. Un servidor más antiguo sin metadatos de audio deja estos controles no disponibles.

`POST /v1/audio/transcriptions` acepta una clave de plano de datos OpenCodex
`Authorization: Bearer`, `x-opencodex-api-key`, o `x-api-key`También en un local Oyente. Se rechaza una clave no válida suministrada explícitamente. Cargar un archivo de audio como multiparte `file` y proporcionar `model=gpt-4o-transcribe` para un ChatGPT conectado cuenta. OpenCodex resuelve la credencial ascendente; nunca proporcione una ChatGPT token como la clave cliente API.

```bash
curl "$OPENCODEX_BASE_URL/audio/transcriptions" \
  -H "Authorization: Bearer $OPENCODEX_API_KEY" \
  -F 'model=gpt-4o-transcribe' \
  -F 'file=@recording.wav' \
  -F 'language=ko'
```

Establecer `OPENCODEX_BASE_URL` a su proxy URL que termina en `/v1`. Los campos opcionales son
`prompt`, `language`, y `response_format` (`json`, el valor predeterminado, o `text`) Los JSON resultado contiene `text` Sólo. Los archivos no deben estar vacíos y no ser más grandes que 25.000.000 bytes; los cuerpos de varias partes están limitados a 32 MiB y campos de texto para 16 KiB. El límite del cuerpo del oyente configurado puede imponer un techo más pequeño. Campos duplicados o no admitidos, incluidos `stream`son rechazadas. Este endpoint no promete marcas de tiempo, diarización, subtítulos o metadatos de uso token.

La ruta de suscripción ChatGPT utiliza `gpt-4o-transcribe` como un identificador de compatibilidad y no envía un nombre de modelo al punto final de transcripción privado. No es evidencia del modelo interno del backend. OpenAI API-proveedor de clave también soporta `gpt-4o-mini-transcribe` y `whisper-1`cuando se selecciona un proveedor ChatGPT, un fallo de autenticación no cambia silenciosamente a ese proveedor pagado. El modo Direct utiliza la cuenta principal almacenada bajo la admisión de perfil existente normas; El modo Pool utiliza la cuenta almacenada seleccionada. Falta, caduca o drenante Devuelve un error. Cancelación detiene la solicitud de salida y audio El contenido no se escribe para solicitar el historial.

<a id="streaming-dictation"></a>

## Dictado de streaming

`WS /v1/audio/transcriptions/stream` es una extensión OpenCodex para una conexión Cuenta ChatGPT. Está separado de la transcripción pública en tiempo real de OpenAI protocolo. Autenticar con los mismos encabezados de clave proxy que la transcripción de archivos. Los clientes del navegador en su lugar ofrecen estos dos subprotocolos WebSocket:

```text
opencodex-audio
opencodex-key.<canonical-base64url-of-UTF8-proxy-key>
```

Solo `opencodex-audio` se selecciona en la respuesta. La codificación es la sintaxis de transporte, No cifrado. Los encabezados explícitos de credenciales HTTP tienen prioridad. ChatGPT tokens permanecer en el proxy; un API-key-only upstream no puede servir este protocolo de dictado.

Después de conectar, envíe:

```json
{"type":"session.start","config":{"input_audio_format":"pcm16","sample_rate_hz":48000,"num_channels":1,"max_buffer_size_bytes":4194304,"max_utterance_duration_ms":30000,"session_ttl_ms":300000,"provider_mode":"streaming_sse","transcript_delivery_mode":"segment","vad":{"type":"server_vad","threshold":0.5,"prefix_padding_ms":300,"silence_duration_ms":500}}}
```

Utilice la frecuencia de muestreo real del audio mono PCM16. Espere `session.started`Entonces, enviar `{"type":"audio.append","audio":"<base64 PCM bytes>"}`. Estos son texto JSON marcos, no archivos WAV o marcos binarios WebSocket. La puerta de enlace acepta muestra tarifas de 8,000 a 192,000 Hz; El soporte ascendente depende de la cuenta / servicio. Los marcos de cliente están limitados a 64 KiB y las sesiones a cinco minutos. Sin apoyo o Los campos de evento/configuración mal formados cierran el flujo con el código 1008.

`transcript.segment` y `transcript.final` contiene `utterance_id`, `revision`, y
`text`. Sustituir el texto anterior por la misma pronunciación cuando su revisión aumente. No concatene las revisiones. Terminar con `{"type":"session.close"}` y espera para el texto final y `session.updated` con `session.status="closed"`.

## `POST /v1/responses`

Esta es la forma nativa del plano de datos opencodex. El cuerpo de la solicitud debe ser un objeto JSON con una no vacío `model`. `input` puede ser una cadena o una matriz de elementos Responses.

<a id="caller-conversation-header"></a>

### Cabecera de conversación de llamante

Para HTTP `POST /v1/responses`, `POST /v1/messages`, y `POST /v1/chat/completions`, un cliente puede enviar un estable
`x-session-id` para cada conversación. Cuando no `session_id`, `session-id`, o `thread-id`
está presente, opencodex promueve el marcador para `session_id`. Identidad Grok administrada en Responses también tiene prioridad. Incluso un encabezado explícito vacío suprime la promoción.

Utilice 1–128 ASCII letras, dígitos, `.`, `_`, `:`, o `-`, comenzando con una letra o un dígito. Se recorta el espacio en blanco circundante; se ignoran los marcadores no válidos o faltantes. Loopback La admisión conserva el marcador. La admisión autenticada deriva un identificador opaco del marcador y el principal de credenciales admitido, por lo que las diferentes credenciales no compartir un identificador recién promocionado. La rotación cambia este identificador; autenticado solicitudes sin un principal de confianza se dejan sin cambios.

Utilice marcadores distintos para conversaciones distintas. Esto preserva la continuidad de la conversación para los consumidores intermedios, pero no garantiza un éxito de caché ascendente o ahorros medidos. Los marcos WebSocket, compactos y count_tokens no utilizan esta promoción.

Sobre canónica ChatGPT-respalda Responses El envío, explícito y no vacío `session_id` gana. De lo contrario, el primer alias no vacío entre `session-id`Entonces, `thread-id`, suministros
`session_id` si su valor es seguro; un alias ganador no válido suprime la identidad más débil. Los valores de encabezado vacíos se eliminan antes de este paso en cada ruta (encabezado Responses auth) ej., la selección y los puentes Claude Messages y Chat Completions), por lo que un encabezado vacío cuenta como ausente: un vacío `session-id` permite un valor válido `thread-id` Gane. El derivado de metadatos Claude La sesión solo se aplica cuando no queda ningún encabezado canónico o alias no vacíos. Los alias mantienen sus nombres originales en el cable; se reenvían sus valores de llamada sin procesar validados como un explícito `session_id`, sin el alcance principal utilizado para promover `x-session-id`. Esta conversión de salida no cambia la afinidad de entrada. Los destinos personalizados y API-key son sin cambios, y no se inventa ninguna identidad para las solicitudes sin un marcador de conversación.

Para clientes externos, mantenga un marcador de propiedad de la persona que llama por conversación, incluido el repetido
`curl` solicitudes. A compartido `prompt_cache_key` o el prefijo de sistema/herramientas idéntico es una cohorte de caché, No hay prueba de que dos solicitudes pertenezcan a una conversación. Solicitudes sin marcador de conversación No recibir una sesión estable inventada. OpenCodex tampoco se hace pasar por Codex sintetizando an `originator`; un originador suministrado por la persona que llama conserva sus reglas de reenvío normales. Encabezado La continuidad no establece un éxito de caché: compare la entrada en caché reportada del flujo ascendente tokens para sus propias solicitudes de prefijo repetido. Un recuento de escritura en caché omitido no es evidencia de no escritura.

<a id="accepted-request-fields"></a>

### Campos de solicitud aceptados

| Zona | Forma aceptada |
| --- | --- |
| Modelo y entrada | Requerido no vacío `model`; cadena opcional `input` o una matriz de elementos |
| Elementos del mensaje | `user`, `developer`, `system`, y `assistant` mensajes; contenido de cadena o bloques de contenido mecanografiados apropiados para el rol |
| Bloques de contenido | Texto, imágenes de entrada, archivos de entrada, texto de salida, rechazos y bloques de resumen / texto de razonamiento donde su elemento principal los permita |
| Historial de herramientas | `function_call`, `function_call_output`, `custom_tool_call`, y `custom_tool_call_output` temas |
| Herramientas | Herramientas de función más entradas sueltas de herramientas incorporadas o alojadas; `tool_choice` acepta `auto`, `none`, `required`, opciones de función/personalizadas nombradas, opciones alojadas, o `allowed_tools` |
| Razonamiento | `reasoning.effort` y `reasoning.summary` (`auto`, `concise`, `detailed`, o `none`) |
| Continuación y almacenamiento en caché | `previous_response_id`, `store`, y `prompt_cache_key` |
| Controles de generación | `max_output_tokens`, `temperature`, `top_p`, `stop`, `presence_penalty`, y `frequency_penalty` |
| Servicio y ejecución | `stream`, `service_tier`, `parallel_tool_calls`, `instructions`, `metadata`, y `user` |
| Campos Responses extendidos | `background`, `include`, `prompt`, `text`, y `truncation` Se aceptan para rutas compatibles |

Los tipos de elementos desconocidos se aceptan como elementos mecanografiados sueltos para la compatibilidad directa. Los adaptadores traducidos manejan solo los tipos de elementos que reconocen y pueden rechazar una característica que su proveedor no puede representar. ChatGPT Codex ruta de avance, solo texto `system` Los mensajes de entrada se pliegan en nivel superior `instructions`, y `truncation` se elimina porque ese destino rechaza tanto a los Formas de Responses. Otros destinos Responses los conservan. El mismo límite canónico elimina solo cliente anidado `prompt_cache_breakpoint` marcadores y gotas
`item_reference` Entradas sólo en `store: false` continuaciones; el emparejamiento de llamada/resultado de herramienta no cambia.
`metadata` se elimina en cada ruta directa para compatibilidad con el backend canónico ChatGPT, que lo rechaza. `max_output_tokens`
se elimina solo en esa ruta canónica, que rechaza el campo por completo; cualquier otro destino hacia adelante recibe el límite de salida del llamante sin cambios, pero el límite limita el turno solo cuando el destino lo impone.

Los ID de archivo de imagen son referencias con alcance de proveedor, no bytes de imagen portátiles. Paso Responses los retiene; los adaptadores de traducción reciben un `[image: file_id]` marcador de texto para la imagen de solo archivo partes en mensajes o funciones/salidas de herramientas personalizadas. Use una imagen URL o datos base64 URL cuando se El modelo traducido necesita ver la imagen. Alojado `computer_call_output` artículos requieren un Responses ruta de paso; las rutas traducidas devuelven HTTP 400 en lugar de dejar caer silenciosamente la captura de pantalla. Para una observación de captura de pantalla sin semántica de herramienta de computadora alojada, use un usuario `input_image`.

<a id="json-and-sse-output"></a>

### Salida JSON y SSE

Con `stream: true`La respuesta es: `text/event-stream`. El puente emite eventos Responses tales como
`response.created`, output-item y deltas de texto/herramienta, y exactamente un terminal
`response.completed`, `response.failed`, o `response.incomplete` evento. Una corriente normal termina con
`data: [DONE]`.

Con `stream: false` o no `stream`, los mismos eventos de adaptador se recopilan en un Responses JSON objeto. Ambas formas conservan el modelo seleccionado, los elementos de salida, el estado del terminal y el uso. La ruta canónica ChatGPT Codex todavía usa `stream: true` en su solicitud de solo ascendente porque eso El destino es SSE solamente; OpenCodex valida y vuelve a plegar el flujo de terminales en la JSON forma el cliente solicitado. Esta coerción del transporte no altera una `store` valor. El primer terminal debe ser válido; un terminal posterior no puede reemplazar uno no válido. ndices de producción debe ser contigua y cubierta por un elemento completado o la salida del terminal, por lo que un texto / herramienta delta izquierda abrir por un terminal disperso falla cerrado en lugar de convertirse en JSON parcial. El camino tapa cada marco en 4 MiB, cada transcripción y fuente de reconstrucción a 32 MiB, la corriente a 100.000 fotogramas, y producción reconstruida a 10.000 artículos. El configurado `stallTimeoutSec` gobierna tanto el primer río arriba cuerpo byte y más tarde huecos silenciosos. Cuando el reloj está desactivado (`0`, incluyendo el valor predeterminado para a de origen local), no expira inmediatamente; solo el techo independiente de 15 minutos Queda. Un terminal EOF, mal formado o de gran tamaño, error de lectura, pérdida, cancelación o falta devuelve un error en lugar de JSON parcial con HTTP 200. Las llamadas de streaming no han cambiado.

Cuando un proveedor filtra o trunca una respuesta, se mantiene una llamada de herramienta sin terminar. `incomplete`
en JSON y SSE. La salida parcial se conserva y el puente no emite un argumento evento de finalización para esa convocatoria abierta. Las llamadas ya completadas mantienen su estado. Esto preserva el resultado del proveedor.

En el cable de transmisión Responses, una parada explícita de filtro de contenido no reintentable desde Anthropic (`refusal` / `content_filter`o Kiro (`CONTENT_FILTERED` /
`GUARDRAIL_INTERVENED`) termina con `response.failed`, `error.code: "invalid_prompt"`, y `retryable: false`. Esto evita que los clientes que reintentan flujos incompletos de reenviar el contexto rechazado. Se conservan el uso y la salida parcial. Búsqueda en la web y los sidecares de imagen se detienen sin ejecutar llamadas de esa iteración o preguntando al modelo de nuevo, en cada cable entrante.

Tamponado Responses JSON conserva `status: "incomplete"`; Chat Completions retiene
`finish_reason: "content_filter"`, y Messages retiene `stop_reason: "refusal"`. Un filtro de contenido sin un veredicto explícito no re-intentable, límites token, puestos, y EOFs mantienen su comportamiento incompleto existente.

Las razones explícitas incompletas usan el mismo vocabulario en respuestas respaldadas por adaptadores y nativas. Responses Entrega de JSON, SSE y WebSocket: Alias de límite de salida tales como `length` y `max_tokens` convertidos `max_output_tokens`, y rechazo/filtro Alias como `refusal` convertidos `content_filter`. Otras razones permanecen sin cambios, junto con la mensaje del proveedor, capacidad de reintento y uso. Los codificadores Direct Chat y Messages aplican la misma asignación.

Sobre el pendiente `dev` implementación para el número 4112, un HTTP 413 final ascendente en esta superficie Se clasifica como `invalid_request_error` / `context_length_exceeded`. Llamadas que no se transmiten retener HTTP 413 con un JSON `error`; los llamantes de flujo continuo retienen el fallo del terminal SSE. Ambos usan un mensaje fijo en lugar de exponer el cuerpo de error ascendente. Enrutado sintético La compactación propaga el fallo clasificado; esto no reduce la entrada o reintenta la compactación. Los errores de transferencia compacta nativa y los errores de límite de admisión local retienen sus contratos separados.

Para el paso de HTTP/SSE nativo, una cancelación de cliente sin un terminal ascendente observado es Registrado como `499` con `closeReason: "client_cancel"` y no penaliza el grupo de cuentas. Esto se aplica tanto a la inspección de salida como al relé ansioso, incluido el tráfico de reescritura Windows, incluso cuando la lectura de origen rechaza antes de que corra el gancho de cancelación del cuerpo de respuesta. Un terminal capturado durante el drenaje de desconexión posterior limitado conserva su resultado real.

Si falla la reescritura de passthrough nativo, incluso cuando excede la traducción presupuesto de búfer, el relé informa del fallo sin esperar a la inspección de origen para terminar. Cancela el trabajo anterior y emite `response.failed` seguido por
`data: [DONE]`; un desbordamiento del presupuesto utiliza el `translation_buffer_limit` código de error.

Responses SSE acepta finales de líneas CR, LF y CRLF, incluyendo finales mixtos y división CRLF a través fragmentos de red. Validación de herramientas, traducción de chats, inspección de terminales y proyección WebSocket Utilice los mismos límites de eventos. Una terminación solo CR no espera a que se cierre la conexión ascendente.

Orientación al cliente Responses SSE marcos están limitados a 4 MiB por marco, medidos en bytes en bruto antes de la
SSE bloque delimitador. On HTTP, un marco de origen no terminado que excede el límite falla cerrado con un `response.failed` Evento seguido de `data: [DONE]`. En el Responses WebSocket puente, la misma condición emite un 502 `websocket_protocol_error` y cancela el lector ascendente. Un cuadro de terminal Responses completo es autoritativo: bytes finales sobredimensionados o malformados después de que la terminal se caiga en lugar de reemplazar el giro completo con un fallo de transporte.

:::note
Para passthrough nativo, un evento terminal Responses tiene autoridad. Un prematuro `data: [DONE]` es mantenido hasta ese evento. En la ruta nativa ordinaria, un HTTP 200 EOF limpio sin un terminal analizado Emite una `response.incomplete` con `incomplete_details.reason: "adapter_eof"`, seguido por un
`data: [DONE]`; terminal sintácticamente válido sin delimitador JSON se acepta exactamente una vez, mientras JSON mal formado o truncado permanece incompleto. Para los proveedores que optaron por el terminal de modelo reparación, sufijos tipo terminal sin marco y un prematuro `data: [DONE]` en el error EOF cerrado con
`missing_terminal_event` cuando no se puede promover un candidato del ciclo de vida completo; un candidato completo Se promueve para `response.completed`. Alta confianza `cyber_policy`
Las formas de terminal se normalizan `response.failed` con `error.code: "cyber_policy"` por semántica registro/contabilidad (estado 400), mientras que una respuesta HTTP transmitida ya iniciada sigue siendo 200. Esto El límite de petición comprometida no vuelve a intentarlo ni a reproducirse y no resuelve
[#2423](https://github.com/lidge-jun/opencodex/issues/2423) o
[#2486](https://github.com/lidge-jun/opencodex/issues/2486).
:::

Por canónico ChatGPT transmisión directa, estable Bun 1.4.0 o más reciente puede usar de forma transparente
Codex's de origen WebSocket transporte. Paquete Bun 1.3.14, prelanzamientos, e identidades en entorno de ejecución no verificables HTTP/SSE. El adaptador WS de origen mantiene el mismo del cliente SSE contrato, tapas tanto el crudo JSON marco y su SSE envolvente en 4 MiB, y cierra el upstream cuando su cola de bytes de 8 MiB se desbordaría. Ese desbordamiento emite un terminal downstream `response.failed` Evento seguido de
`[DONE]`.

Las comprobaciones WebSocket anteriores `NO_PROXY`/`no_proxy` Primero. De lo contrario, utiliza el primer no vacío
`HTTPS_PROXY`, `https_proxy`, `ALL_PROXY`, o `all_proxy` valor; `HTTP_PROXY` No es solo un proxy Conexión WSS. Las direcciones URL de proxy HTTP y HTTPS se pasan a Bun. Si el valor seleccionado no es válido o utiliza un protocolo no compatible, opencodex omite el intento de WebSocket y utiliza HTTP/SSE en lugar de marcar el flujo ascendente directamente.

Estas reglas pertenecen al transporte WebSocket ascendente, independientemente del proveedor seleccionado. adaptador. HTTP Las solicitudes fetch basadas en Responses, incluida la reserva SSE, utilizan el
[fetch de salida configurada](/es/reference/configuration/server/#server-fields). Un servidor proxy SOCKS5 — conjunto con `config.proxy` o heredado de un SOCKS5 `ALL_PROXY` — utiliza el túnel incorporado de OpenCodex cuando
`NO_PROXY`/`no_proxy` No exime al objetivo. Esquema específico
`HTTP_PROXY`/`HTTPS_PROXY` Los valores retienen el manejo nativo de HTTP(S) de Bun, mientras que un manejo que no es SOCKS
`ALL_PROXY` No es un nativo HTTP fetch ruta. `config.proxy` llena faltante
`HTTP_PROXY`/`HTTPS_PROXY` valores; el valor específico del esquema resultante también tiene prioridad sobre Un existente `ALL_PROXY` para WebSocket. Para un HTTPS de origen que requiere un proxy, establezca
`HTTPS_PROXY` o `config.proxy`; `HTTP_PROXY` solo deja tanto WSS y su HTTPS reserva sin un proxy de esquema coincidente.

Cada objeto de uso Responses del terminal incluye ambos objetos de detalle, incluso cuando el proveedor no lo hizo informe esos detalles:

```json
{
  "input_tokens": 0,
  "output_tokens": 0,
  "total_tokens": 0,
  "input_tokens_details": { "cached_tokens": 0 },
  "output_tokens_details": { "reasoning_tokens": 0 }
}
```

Cuando esté disponible, `input_tokens_details` También puede incluir `cache_write_tokens`. El siempre presente Los objetos de detalle son una garantía de compatibilidad para clientes Responses estrictos; cero puede significar "no" No necesariamente "el proveedor no realizó tal trabajo".

Para Anthropic de origen, un informe `usage.output_tokens_details.thinking_tokens` Se conserva como Responses `output_tokens_details.reasoning_tokens` y Chat `completion_tokens_details.reasoning_tokens`, para JSON y respuestas de transmisión. Ya está incluido en el total de salida-token, no se agrega nuevamente; Los detalles faltantes o no válidos no se estiman a partir del texto de pensamiento visible. Véase [Contrato de uso de Anthropic](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost).

<a id="correlating-a-response-with-its-request-log"></a>

### Correlacionar una respuesta con su registro de solicitudes

Cada respuesta admitida HTTP Responses lleva una `x-opencodex-request-id` cabecera que sostiene un id generado por el proxy del formulario `ocx-<32 hex>`. Es la clave que ata una respuesta a su fila en el registro de solicitudes y los informes de uso.

El proxy siempre genera este valor y sobrescribe cualquier id proporcionado por la persona que llama o devuelto por el flujo ascendente, por lo que es único para este proxy y seguro confiar como una clave de correlación. El encabezado es Nombrado en `Access-Control-Expose-Headers`, que es lo que permite al navegador JavaScript leerlo cross-origin — una costumbre `x-` El encabezado es invisible para `response.headers.get()` Incluso cuando Está en el cable.

Responses rechazado en la autenticación o la admisión de origen nunca llega a este contenedor y no lleva id.

Registrado `POST /v1/chat/completions` Las respuestas también llevan `x-opencodex-request-id`expuestos a través de CORS, para JSON, transmisión, errores de controlador y rechazos de controlador previos registrados. Este es el gateway id de la historia, independientemente del id de finalización del cuerpo de respuesta. Los valores de llamada y ascendente no pueden Lo sustituyen. Rechazos sin un propietario de registro de solicitudes, incluyendo autenticación, origen, drenaje y denegaciones de giro activo, no llevar identificación. Los encabezados de transmisión identifican la fila del historial eventual antes Se guarda el uso final.

Registrado `POST /v1/messages` respuestas llevan el mismo id de historial de solicitudes OCX en **ambos**
`request-id` y `x-opencodex-request-id`. Esto se aplica a las respuestas nativas y traducidas, streaming y JSON, y los rechazos registrados. Claude Code puede utilizar su persistente `requestId`
Metadatos de `request-id` para unir futuras transcripciones a esa fila de historia OCX.

En respuestas entregadas nativas y errores HTTP ascendentes, una Anthropic ascendente opaca
`request-id` emparejar `req_[A-Za-z0-9_-]{1,128}` Se conserva por separado como
`x-opencodex-upstream-request-id`. Es un identificador de diagnóstico del proveedor, no una clave del libro mayor OCX. Se omiten los identificadores de flujo ascendente faltantes o no conformes, y los identificadores de adaptador traducidos. Estos Las cabeceras de respuesta se pueden leer a través de CORS junto con las cabeceras expuestas existentes.

No se agrega ningún id de OCX a los rechazos de autenticación, origen, drenaje o giro activo que no tienen propietario del registro de solicitudes, o a count_tokens. Los encabezados de transmisión identifican el eventual giro fila de historial; no dan fe de que el uso final ya se ha guardado. Transcripciones antiguas sin una clave compartida permanecen desvinculados; sello de tiempo o similitud token no es una unión exacta.

<a id="websocket-upgrade-on-the-same-path"></a>

### Actualización WebSocket en la misma ruta

Cuando `websockets` está habilitado, un cliente puede actualizar `/v1/responses` en lugar de abrir un HTTP POST. La autenticación y la admisión de origen ocurren durante el apretón de manos WebSocket. No se repiten dentro de cada marco.

Esta actualización orientada al cliente es independiente de la selección transparente ascendente ChatGPT WebSocket descrito anteriormente; el `websockets` configuración controla solo el extremo orientado al cliente.

El cliente envía marcos de texto JSON:

```json
{
  "type": "response.create",
  "model": "provider/model",
  "input": "Hello",
  "tools": [],
  "generate": true
}
```

Todo excepto `type` se convierte en el cuerpo de solicitud Responses, y el proxy fuerza la transmisión Gire. Un nuevo `response.create` reemplaza y cancela el giro anterior en ese enchufe.
`response.processed` Se acepta como un reconocimiento de no-op. Tipos de fotogramas no analizables o no relacionados son ignorados.

Los marcos de servidor son marcos de texto JSON. La salida transmitida con éxito utiliza las mismas cargas útiles JSON que aparecería en SSE `data:` líneas, sin el sobre SSE o `[DONE]`. Un no-streaming interno El resultado se reformula como `response.created`, cero o más `response.output_item.done` Marcos, entonces a marco de terminal. Los errores usan este sobre:

```json
{
  "type": "error",
  "status": 502,
  "error": {
    "type": "upstream_error",
    "message": "..."
  },
  "headers": {}
}
```

Un marco de calentamiento con `generate: false` no llama a un upstream. Devuelve un sintético
`response.created` seguido por `response.completed`, ambos con un id de respuesta vacío y sin salida.

:::note
Cuando WebSockets está desactivado, un intento de actualización recibe HTTP 426 con código
`upgrade_required`. Codex trata ese resultado de apretón de manos como una señal para volver a HTTP para el sesión. No es un giro modelo fallido.
:::

## `POST /v1/chat/completions`

Este punto final acepta solicitudes OpenAI compatibles con Chat Completions con una `model` y a no vacío `messages` matriz. Traduce mensajes de sistema, usuario, asistente y herramienta a mensajes internos. Elementos Responses; traduce herramientas de función, elección de herramientas, imágenes, esfuerzo de razonamiento y compatibilidad formatos de respuesta; ejecuta la canalización de enrutamiento Responses normal; luego traduce el resultado de nuevo.

Las URL de las imágenes y las URL de los datos de base64 usan Chat `image_url` partes de contenido. La traducción preserva apoyado `detail` valores (`auto`, `low`, `high`) En las rutas traducidas, OpenCodex también acepta matrices de resultados de herramientas portadoras de imágenes como extensión de compatibilidad: las rutas Responses conservan la estructura La producción, mientras `openai-chat` El adaptador envía las imágenes de la herramienta en un mensaje de usuario siguiente porque Chat El contenido de la herramienta es solo texto. Otros adaptadores posteriores tienen su propia ubicación específica del proveedor. Texto sin formato Los resultados siguen siendo strings. El passthrough nativo sigue su contrato ascendente; el soporte de imagen aún depende en el modelo seleccionado y la configuración del proveedor.

El razonamiento es parte de esa traducción. `reasoning_effort` (o `reasoning.effort`) se convierte en interno `reasoning.effort`. Porque el analizador Responses oculta el pensamiento a menos que
`reasoning.summary` Está establecido y no es `none`, Chat Completions solicita que se Esfuerzo predeterminado `reasoning.summary: "auto"` Así que pensar fluye hacia atrás como
`delta.reasoning_content`. Los clientes aún pueden ocultar rastros con `include_reasoning: false` o
`reasoning.summary: "none"`. Una explícita `reasoning.summary` de `auto`, `concise`,
`detailed`, o `none` gana sobre `include_reasoning`.

La salida estructurada es parte de esa traducción: `response_format` con `json_object` o
`json_schema` Se envía a Enrutado `openai-chat` modelos. En marcha `POST /v1/responses` la El campo de solicitud equivalente es `text.format`: las rutas nativas de Responses lo conservan en bruto Responses cuerpo, y se traduce a `response_format` cuando el modelo se dirige a un
`openai-chat` proveedor. Un modelo que aparece en la lista del proveedor `noStructuredOutputModels` omite
`response_format` en ese cable de chat; los modelos hermanos mantienen la traducción. Backends no clasificados recibir el campo y devolver su propio error en lugar de que el proxy adivine su capacidad.

La salida no de streaming tiene `object: "chat.completion"`. La salida de transmisión usa objetos SSE con
`object: "chat.completion.chunk"`, deltas de elección, una opción terminal con `finish_reason`, y
`data: [DONE]`. La información de llamada a herramientas y uso se traducen de nuevo donde los eventos fuente llevan A ellos.

Si una solicitud de Chat de transmisión recibe un JSON Responses resultado en sentido ascendente, el proxy sintetiza SSE Conserva el contenido de la respuesta y el razonamiento, las llamadas a las herramientas de función (con un flujo separado) `index` para cada llamada), el uso y la conversión
`finish_reason`, incluyendo `tool_calls` y `length`. Este fallback entrega el resultado completado en trozos; no puede proporcionar la entrega token por token antes de que llegue la respuesta JSON ascendente. No emite una solicitud de inferencia adicional. Una respuesta incompleta causada por la salida El límite de token o el filtrado de contenido retienen `length` o `content_filter`Aunque incluye la herramienta salida. Otros límites incompletos devuelven un error ascendente en lugar de reclamar un final normal.

El texto de rechazo permanece separado del texto de respuesta: las terminaciones JSON usan nullable `message.refusal`, y el uso de fragmentos de transmisión `delta.refusal`. Chat nativo JSON a SSE y SSE a JSON conversiones preservar ese campo; el relé de transmisión nativo conserva los deltas de rechazo del proveedor. On traducido Los flujos Responses, las partes de rechazo se almacenan en búfer hasta el evento terminal y se emiten una vez en su dirección. salida original/orden de contenido. Las instantáneas repetidas o dispersas compatibles no duplican ni borran texto. Las instantáneas de rechazo contradictorias y el desbordamiento del búfer producen un error tipificado sin éxito. terminar o `[DONE]`. Esto preserva el rechazo ascendente; no introduce una decisión de política proxy.

Debido a que la ruta de ejecución interna está basada en Responses, un adaptador de proveedor puede imponer una conjunto de características. Por ejemplo, una característica de petición que no puede ser representada por el adaptador seleccionado es devuelto como un error en lugar de cambiar silenciosamente su significado.

<a id="post-v1messages-and-count_tokens"></a>

## `POST /v1/messages` y `count_tokens`

Estos puntos finales hablan el dialecto Anthropic Messages utilizado por Claude Code y clientes compatibles. La mayoría de las solicitudes se traducen a Responses, se enrutan normalmente y luego se traducen a Anthropic JSON o Anthropic SSE

En las solicitudes Messages traducidas, la repetición razonada comparte el presupuesto de traducción de la solicitud. La admisión de sobres incluye la sobrecarga de codificación/decodificación de copias, no solo la firma original longitud. Las solicitudes que excedan este presupuesto devuelven HTTP 413 con `translation_buffer_limit`; firmas y datos de razonamiento opacos nunca se truncan para hacer que una solicitud se ajuste. Nativo El passthrough Anthropic conserva su contrato de tamaño de cuerpo separado.

Las fuentes de imagen Base64 y URL se traducen en mensajes de usuario y resultados de herramientas anidadas. Archivo respaldado imágenes (`source.type: "file"`) requieren paso nativo Anthropic; las rutas traducidas devuelven un corregido error HTTP 400 pidiendo entrada base64 o URL. OpenCodex no resuelve el problema de otro proveedor almacenamiento de archivos o cargar la imagen referenciada en nombre del llamante.

Cuando el historial de reproducción contiene un resultado de herramienta portadora de imagen sin su llamada adyacente, el Los adaptadores Anthropic y Command Code retienen la imagen en un portador de usuario etiquetado con procedencia que incrustar sus bytes en el texto prompt. No inventan una llamada de herramientas exitosa. Resultados para Las llamadas válidas pendientes aún preceden a estas portadoras, preservando el contrato de emparejamiento ascendente.

Para los modelos externos Cursor, las capturas de pantalla data-URL en el lote activo de resultados de herramientas finales son adjunta a la solicitud de continuación. El límite actual de 12 imágenes activas se aplica a Todo el lote. Las etiquetas de fuente limitadas permanecen al lado de los archivos adjuntos, incluso si la historia anterior es podado. Manejo de Native Composer/MCP, recuperación de imágenes históricas y directiva de omisión remota URL Esto no promete que todos los modelos puedan ver todas las fuentes de imágenes.

El pase nativo de Anthropic solo es elegible cuando todos estos son verdaderos:

- No se ha deshabilitado el passthrough nativo en la configuración de Claude Code;
- El modelo solicitado comienza con `claude` o `anthropic`;
- la solicitud lleva un portador nativo Anthropic o `x-api-key` credencial;
- en un oyente que no es loopback, la solicitud también lleva una admisión proxy válida solo en
  `x-opencodex-api-key`; y
- ningún alias configurado o mapa de modelo reclama ese id de modelo para un destino encaminado.

Una solicitud elegible se reenvía en el dialecto Anthropic para que los encabezados beta nativos, pensando firmas y la identidad de suscripción permanecen de extremo a extremo. De lo contrario, toma el Responses ida y vuelta.

El encabezado de admisión dedicado nunca se reenvía. Secretos de admisión proxy encontrados en
`Authorization` o `x-api-key` también se eliminan; una credencial Anthropic genuina separada es preservado. Las cabeceras de credenciales unidas por coma ambiguas fallan en lugar de ser reenviadas.

`POST /v1/messages/count_tokens` sigue el mismo modelo de resolución y decisión de paso. A La solicitud elegible nativa se reenvía al punto final de recuento de Anthropic. Otras solicitudes usan el local estimación documentada sobre el contenido del sistema, mensajes y herramientas y retorno:

```json
{ "input_tokens": 123 }
```

Un ID de escritorio en forma de fecha no resuelta también puede ser un modelo nativo genuino que falta en el descubrimiento. Messages y count-tokens devuelven HTTP 503 con el fijo `desktop_model_mapping_unavailable` error cuando el disponible La evidencia no puede resolver ese ID; esto no establece que el modelo no es válido. Legado desconocido Los alias hash aún devuelven HTTP 400. Ninguno de los casos quita la fecha o vuelve a otra ruta. IDs conocidos, asignaciones registradas y exactas `modelMap` mantiene su comportamiento existente, incluyendo identificaciones nativas reales. Actualizar el descubrimiento del modelo o volver a aplicar el perfil del concentrador conectado antes Intentar de nuevo; volver a intentarlo por sí solo no garantiza la resolución.

## `GET /v1/models`

Sin `format=desktop-config`, los contratos ordinarios de catálogo son:

| Contrato | Desencadenante | Forma de nivel superior | Comportamiento de ID de modelo |
| --- | --- | --- | --- |
| Lista de modelos de Anthropic | `anthropic-version` encabezado o `?flavor=anthropic`, sin `client_version` | `{ "data": [...] }` con entradas de información del modelo Anthropic | Claude Code recibe identificadores legibles; Desktop puede recibir su familia de alias específica del perfil |
| Codex catálogo | `client_version` parámetro de consulta | `{ "models": [...] }` | Las entradas nativas y enrutadas llevan los campos de catálogo Codex más ricos, visibilidad, esfuerzo, WebSocket y metadatos multiagente |
| Plain OpenAI lista | Ninguno de los gatillos | `{ "object": "list", "data": [...] }` | Los identificadores nativos visibles están desnudos; los identificadores enrutados son alias o `provider/model` |

<a id="desktop-configuration-snapshot"></a>

### Instantánea de configuración del escritorio

`GET /v1/models?ids=desktop&format=desktop-config` selecciona explícitamente la instantánea del escritorio, independientemente de la detección de usuario-agente. La respuesta es `{ "version": 1, "models": [...] }`
con `Cache-Control: no-store`. El cliente conectado envía `Accept: application/json`,
`anthropic-version: 2023-06-01` y su credencial de datos existente; sin administración token o perfil subir está involucrado. Las entradas son los modelos de configuración de escritorio emitidos por el concentrador, no las filas del catálogo Codex.

Combinando este formato con `ids=cli` o cualquier `client_version` devuelve HTTP 400. Sin el selector de formato, los contratos ordinarios anteriores permanecen sin cambios. Cuando Claude está deshabilitado, La instantánea es `{ "version": 1, "models": [] }`; connected Desktop apply trata esto como No está disponible y no escribe un perfil de reemplazo. Hubs antiguos que devuelven un catálogo ordinario en lugar de la versión 1 no son compatibles; el cliente no recurre a los ID generados localmente.

La instantánea sigue siendo un contrato de lista de modelos de solo lectura; no es una rotación de claves ni una carga de perfil. API. La migración, recuperación y desconexión de claves de escritorio conectadas funcionan a través del cliente existente ciclo de vida. La rotación conserva las entradas y selecciones del modelo; CLI `rotation` distingue
`committed` Desde `rolled_back`. Desconectar restaura la configuración propia o informa de una herencia conocida reserva estándar, preservando los campos de usuario y selecciones válidas posteriores. Conflictos o incompletos La recuperación evita una reclamación de finalización. Reinicie el escritorio para cargar los cambios de disco; la desconexión no Revocar automáticamente la clave de concentrador. Véase [Claude Ciclo de vida del escritorio](/es/guides/claude-code/). La repetición de pensamientos y el trabajo de caché rápida permanecen separados en [#3719](https://github.com/lidge-jun/opencodex/issues/3719).

<a id="post-v1live-and-realtime-sideband"></a>

## `POST /v1/live` y banda lateral en tiempo real

<a id="external-api-keys"></a>

### Teclas API externas

Los clientes externos utilizan una clave OpenCodex en cualquier encabezado de credenciales de audio compatible, o el par de subprotocolos del navegador descrito anteriormente. Independiente
`WS /v1/live?model=gpt-live-1-codex` utiliza el protocolo Frameless; un modelo omitido por defecto a ese identificador y `gpt-live-1` es su alias de proxy. Esto no es un afirman que todas las claves públicas OpenAI en tiempo real SDK o API son compatibles con GPT-Live.

Para una nueva conexión independiente, envíe la inicialización compatible con la fuente a continuación después de abrir el enchufe y esperar a `session.started` con un no vacío `session.id`. Un evento de sesión actualizada con la misma forma también es aceptado por el cliente nativo.

```json
{"type":"session.update","session":{"instructions":"","audio":{"output":{"voice":"cove"}},"delegation":{"type":"client"}}}
```

Usos sin marco `input_audio.append` y `output_audio.delta`A diferencia del dictado
`audio.append`. Una comprobación de solo conexión no necesita micrófono ni marcos de audio; envíe
`{"type":"session.close"}` y cerrar el zócalo después de la preparación. Delegación Los eventos son solicitudes de trabajo, no señales de preparación, y el cliente externo posee su ejecución y respuestas.

Para WebRTC, publique una oferta SDP para `/v1/live` como multiparte `sdp` y opcional JSON
`session`, JSON `{sdp, session?}`, o crudo `application/sdp`. La respuesta contiene la respuesta y un proxy-relativo `Location` con un opaco `rtc_ocx_` Llamada ID. Unirse esa ubicación usando la misma clave proxy. El proxy resuelve el proveedor de creación y cuenta física incluso si la selección Pool cambia. Desconocido, caducado o otros alias de clave fallan antes de una conexión ascendente. Rotación de clave de cliente preserva la propiedad por ID de clave; reemplazo de una credencial upstream con clave Requiere una nueva llamada. Las bandas laterales de llamada existentes no necesitan otra actualización de sesión.

Los enlaces de llamadas duran 30 minutos, están limitados a 1024 entradas por servidor y terminan en Reiniciar servidor. Los tiempos de vida del socket están limitados independientemente; los medios viajan directamente sobre WebRTC y no está representada. El proxy nunca ejecuta delegación solicitudes. La disponibilidad de la cuenta OpenAI se establece por el flujo ascendente real no por la presencia de un nombre de modelo en el panel.

<a id="native-codex-compatibility"></a>

### Compatibilidad nativa con Codex

Las personas que llaman en modo clave API nativas en el oyente local de confianza pueden usar la función exacta credencial configurada para el nivel canónico OpenAI API. Otros presentados portador Los valores requieren una clave proxy registrada o una ChatGPT token/par de cuentas; un prefijo de clave arbitrario no es prueba de credenciales nativas. Las llamadas nativas locales de confianza sin credenciales conservan su comportamiento existente.

`POST /v1/live` acepta la superficie de creación de llamadas sin marco de la aplicación ChatGPT/Codex.
`POST /v1/realtime/calls` acepta la superficie de creación de llamadas en tiempo real OpenAI. opencodex selecciona un OpenAI-family ruta elegible, normaliza la solicitud de creación de llamada para la autenticación ascendente y retransmite la respuesta limitada.

Después de la creación de llamadas, los clientes pueden unirse a una banda lateral WebSocket utilizando cualquier formulario entrante admitido:

- `/v1/live/{callId}`
- `/v1/realtime/calls/{callId}`
- `/v1/realtime?call_id={callId}`

El proxy normaliza la unión ascendente URL y luego retransmite de forma transparente el texto y las tramas binarias en ambas direcciones. Las cabeceras de protocolo de cliente se conservan mientras la autenticación ascendente permanece propiedad de proxy.

La creación de la llamada y la combinación de banda lateral deben ejecutarse en la misma cuenta OpenAI, o se rechaza la combinación de origen (`404`) Ambas piernas llevan Codex `session-id` y `thread-id` cabeceras; en el modo Pool el cuenta está vinculada a ese par (process-local), por lo que una unión que llega al proxy reutiliza el cuenta que creó la llamada, mientras que el modo Direct reenvía el portador actual de la persona que llama en ambas piernas. Las cabeceras de cliente retransmitidas son exactamente `openai-alpha`, `x-session-id`, `session-id`, `thread-id`,
`originator`, `x-oai-attestation`, y `x-codex-turn-metadata`
(`LIVE_CLIENT_PROTOCOL_HEADERS` en `src/server/live.ts`); cada uno se retransmite solo cuando el llamante Lo ha enviado, y nadie lo ha inventado.
`Authorization` y el id de la cuenta ChatGPT son propiedad de proxy en rutas respaldadas por ChatGPT (Pool reemplaza con la cuenta almacenada, Direct reenvía el portador de llamadas validado) y un proveedor de claves API obtiene su propio portador. Codex solo envía la unión al proxy cuando `experimental_realtime_ws_base_url`
puntos en ella; `ocx start` Inyecta esa llave al lado de `openai_base_url` (ver
[Integración Codex](/es/guides/codex-integration/)).

## `POST /v1/responses/compact`

La compactación devuelve el historial de reemplazo para los clientes que necesitan acortar un Responses largo Conversación.

| Tipo de ruta | Comportamiento |
| --- | --- |
| Canonical ChatGPT o ruta oficial OpenAI | Prueba el nativo `/responses/compact` punto final con la autenticación de cuenta y modelo resuelta; HTTP 404 vuelve a un giro de compactación Responses normal |
| explícitamente opt-in personalizado `openai-responses` pasarela | `supportsNativeCompactEndpoint: true` intenta el punto final v1 nativo para la clave/local/directo usando el transporte Responses normal del proveedor; HTTP 404 utiliza respaldo portátil; OAuth conserva la compactación enrutada y la resolución de credenciales |
| Otro modelo ruteado | Ejecuta un giro de compactación interno, sin transmisión, sin herramientas con un `compaction_trigger`; requiere exactamente un sintético `compaction` artículo cuyo `encrypted_content` es un `ocx1:` envolvente; decodifica ese resumen en el historial de reemplazo de v1 |

La capacidad de punto final v1 personalizada es independiente de v2 `supportsNativeCompactionTrigger`
y de `decodesNativeCompactionBlobs` para la repetición. Ninguno otorga la identidad canónica OpenAI o Reenvío de credenciales del llamante. Las anulaciones de proveedores cruzados siguen siendo portátiles; solo el éxito v2 No establece apoyo para `/responses/compact`. Véase [configuración del proveedor](/es/reference/configuration/providers/).

Si el punto final compacto nativo devuelve HTTP 404, OpenCodex vuelve a intentar la compactación a través de un Responses gire con el mismo selector de modelo y encabezados de sesión. Canonical ChatGPT fallback utiliza de origen SSE; el llamante compacto aún recibe JSON. Un opaco nativo completo compactación se conserva, mientras que un `ocx1:` El resumen se decodifica en el historial de usuario de reemplazo. Los giros de reserva fallidos o incompletos devuelven un error en lugar del historial de reemplazo. Otros Los estados compactos nativos conservan su manejo existente.

Codex nombra un modelo desnudo de la familia OpenAI (por ejemplo `gpt-5.6-sol`) por sus vueltas de compactación independientemente del proveedor al que el operador dirige los giros ordinarios. Solicitudes ordinarias reservar Para el caso de la canónica `openai` proveedor. Solo en la superficie de compactación — `POST
/v1/responses/compact` y a `POST /v1/responses` Llevar un `compaction_trigger` — a desnudo modelo nativo sin habilitación canónica `openai` El proveedor vuelve a la configuración
`defaultProvider` como el resumen en lugar de devolver 404. El fallback solo se aplica cuando el El proveedor predeterminado está habilitado y no es en sí mismo una entrada de la familia OpenAI; selectores calificados para cuentas como el `side/gpt-5.6-sol` Aún fallan cerrados. El proxy registra un aviso por proveedor cuando fallback se compromete. Configuraciones con un canónico habilitado `openai` proveedor no ha cambiado.

Cuerpos entrantes en ambos `/v1/responses` y `/v1/responses/compact` Conservar los 256 MiB compartidos límite de admisión de alambre / descompresión. El rechazo de tamaño a nivel de aplicación devuelve HTTP 413 con
`type` y `code` ambos `invalid_request_error`. Su mensaje incluye un sufijo de diagnóstico limitado, Por ejemplo:

```text
Decompressed request body exceeds 268435456 bytes [measurement=decoded_lower_bound; bytes=268435457]
```

| Medición | Significado de `bytes` |
| --- | --- |
| `declared_wire` | Numérico `Content-Length` declarado por el remitente; rechazado antes de la lectura, no un tamaño decodificado medido |
| `observed_wire_lower_bound` | Bytes de alambre encontrados cuando se lee detenido; el cuerpo completo puede ser más grande |
| `decoded_exact` | Tamaño exacto de la memoria intermedia suministrada al descodificador de identidad o devuelta por un descodificador |
| `decoded_lower_bound` | Límite de admisión más uno después de abortar la inflación; un límite inferior, nunca el tamaño decodificado exacto |

El sufijo contiene solo una categoría fija y un valor de byte numérico finito. Los cuerpos rechazados son no leer o inflar más, analizar para el recuento de artículos, o retenido para diagnósticos. Errores heredados sin procedencia de la medición, retenga el mensaje de solo límite. El oyente de Bun puede rechazar un cuerpo de alambre de gran tamaño antes de que se ejecute el diagnóstico de la aplicación, por lo que no cada 413 lleva este sufijo. Un diagnóstico de límite inferior no puede establecer el tamaño completo de la carga útil compacta. La admisión El límite y el comportamiento de reintento no cambian.

Las respuestas compactas nativas se almacenan en buffer con un máximo separado de 32 MiB, incluidas las respuestas declaradas.
`Content-Length` ya supera el límite. Los fallos específicos de los compactos incluyen:

| Estado | Tipo o código | Significado |
| --- | --- | --- |
| 400 | `invalid_request_error` | Inválido JSON/forma del cuerpo o modelo faltante |
| 404 | `invalid_request_error` | El modelo solicitado no se puede enrutar |
| 499 | `client_cancelled` | El cliente canceló mientras reenviaba o almacenaba búfer |
| 502 | `compact_response_too_large` | La salida compacta nativa superó los 32 MiB |
| 502 | `upstream_error` | Fallo de conexión, lectura o compactación sintética |
| 502 | `invalid_response_error` | El giro sintético no produjo exactamente uno válido, no vacío. `ocx1:` elemento de compactación |

<a id="authentication-matrix"></a>

## Matriz de autenticación

En un enlace de solo retorno de bucle, la admisión del plano de datos no requiere una clave configurada. En un aprieto remoto, utilizar la matriz de abajo. "Dedicado" significa `X-OpenCodex-API-Key`Las otras columnas significan
`Authorization: Bearer ...` y `x-api-key`.

| Superficie | Dedicado | Bearer | `x-api-key` |
| --- | --- | --- | --- |
| `/v1/responses` HTTP y WebSocket | Aceptado | Aceptado | Rechazado |
| `/v1/responses/compact` | Aceptado | Aceptado | Rechazado |
| `/v1/chat/completions` | Aceptado | Aceptado | Rechazado |
| `/v1/messages` y `/v1/messages/count_tokens` | Aceptado | Aceptado | Aceptado |
| `/v1/models` | Aceptado | Aceptado | Aceptado |
| `/v1/live`, `/v1/realtime/calls`, y la banda lateral se une | Aceptado | Aceptado | Aceptado |

Las solicitudes de familia y chat Responses aceptan una clave proxy en el encabezado dedicado o en el campo Bearer. En rutas nativas, la credencial Codex almacenada seleccionada reemplaza al portador de admisión; en otras rutas se elimina. Nunca es una credencial ascendente. Utilice la cabecera dedicada cuando también suministre un portador de proveedor separado.

Una ruta OAuth sin clave, que no es Cursor, puede usar ese portador de llamadas separado, pero nunca un secreto proxy o enriquecimiento automático de ChatGPT. La selección combinada/de políticas y las reescrituras reales de sombra/encadenamiento de hilos no transfieren credenciales de llamadas sin procesar a nuevos objetivos. El enrutamiento OpenAI de Canonical puede restaurar el único portador no proxy de la persona que llama después de un cambio de ruta interna solo cuando su JWT lleva una reclamación de cuenta ChatGPT y cualquier encabezado de cuenta explícito coincide con esa reclamación. El reenvío de la autenticación del llamante a los sidecares OpenAI opcionales requiere un único JWT y una coincidencia explícita. `chatgpt-account-id`. Los portadores opacos no se restauran a través de los cambios de ruta, incluso con un encabezado de cuenta explícito. De lo contrario, el destino final necesita su propia credencial configurada, OAuth o almacenada; de lo contrario, falla localmente. Un marcador de engendro de hilo por sí solo no elimina las credenciales.

El enriquecimiento principal almacenado opcional de Chat para una solicitud Cursor sin llave se aplaza hasta que se planifique realmente un ayudante OpenAI y esté disponible un candidato canónico Direct. Una solicitud Cursor no relacionada no adquiere una reclamación principal nativa a través de este enriquecimiento, por lo que no retrasa la conmutación del perfil. Las credenciales de los ayudantes siguen obedeciendo a las vallas de inicio y cambio y permanecen separadas del portador Cursor. Pool y los ayudantes calificados para la cuenta conservan su selección de cuenta existente.

La repetición de Claude conserva la autenticación principal solo como una instantánea en memoria reclamada por turnos y la reconstruye solo para una ruta canónica final ChatGPT.

:::caution
Las claves del plano de datos no son credenciales de gestión. La administración API utiliza un secreto de administración separado; ver [API de administración](/es/reference/management-api/). Nunca reutilices un secreto para ambos aviones.
:::

<a id="common-error-vocabulary"></a>

## Vocabulario de error común

Los errores usan la envolvente del dialecto del cliente cuando es necesario, pero estos significados de estado/código son estables:

| Estado | Tipo o código | Significado |
| --- | --- | --- |
| 401 | `authentication_error` | Una credencial de admisión proxy requerida falta o no es válida |
| 403 | `origin_rejected` | Una solicitud de plano de datos Responses/OpenAI o una actualización de WebSocket procedían de un origen no permitido |
| 503 | `combo_unavailable` | Todos los objetivos del combo seleccionado no están disponibles, en tiempo de reutilización, desactivados o no son elegibles |
| 400 | `unreadable_encrypted_agent_task` | Una tarea de trabajador encriptada v2 no tiene un objetivo canónico elegible ChatGPT ni un objetivo directo de autenticación de clave Responses explícitamente confiable con `allowEncryptedV2AgentTasks: true` que puede consumirlo |
| 426 | `upgrade_required` | El transporte Responses WebSocket está deshabilitado o la actualización falló; use HTTP |

Los errores de origen Anthropic se representan en la envolvente de error de Anthropic, por lo que el rechazo de origen es un 403 `permission_error` en ese dialecto en lugar del estilo OpenAI `origin_rejected` cuerpo.

<a id="encrypted-content-hygiene"></a>

## Higiene de contenido cifrado

El proxy trata el texto cifrado de backend genuino como opaco. Se conserva el texto cifrado estructuralmente válido byte por byte: opencodex no lo descifra, traduce su contenido ni lo vuelve a cifrar para otro proveedor.

Algunos hooks de agentes han colocado históricamente texto de control en un `encrypted_content` Ranura. Para la compatibilidad, el proxy separa ese texto plano en partes de texto mientras conserva cualquier Fernet estructuralmente válido se ejecuta sin cambios. Si un `agent_message` pierde todas las partes encriptadas durante que la reparación, se convierte en un mensaje de usuario normal. Si una tarea v2 actual permanece genuinamente cifrada pero el destino enrutado seleccionado no puede leer el texto cifrado nativo ChatGPT, opencodex falla con
`unreadable_encrypted_agent_task` en lugar de enviar bytes ilegibles a ese proveedor. Véase
[Interfaz de subagentes](/es/guides/sub-agent-surface/) para el comportamiento del cliente en torno a las tareas de los trabajadores.

La historia también se maneja, y de manera diferente, porque perder un mensaje repetido no debería terminar con un error. Conversación. Una repetición `agent_message` que mezcla texto legible con texto cifrado backend no puede ser bajado a un mensaje público, por lo que un destino Responses enrutado recibiría el texto cifrado junto con un tipo de elemento que solo declara el backend ChatGPT. Antes del envío, opencodex reemplaza ese texto cifrado con `[encrypted content omitted]` — el mismo marcador que ya substitutos después de un fallo de descifrado ascendente — que deja el elemento más baja y legible Texto intacto. El proveedor nunca ve el texto cifrado o el elemento privado, y la conversación continúa. Los objetivos combinados se reparan individualmente, ya que cada uno recibe su propia copia de la solicitud. El backend canónico ChatGPT Codex está exento porque es el destino que acuñó y puede leer esos bytes; a `forward` proveedor señaló que cualquier otro origen no está exento. Confianza explícita `allowEncryptedV2AgentTasks` las rutas y los cables traducidos del Chat o de Anthropic son no se ven afectados, al igual que otros tipos de elementos, como el razonamiento y las burbujas de salida de herramientas, que mantienen sus existente recuperación de fallo de descifrado.

<a id="switching-providers-in-an-existing-conversation"></a>

### Cambiar de proveedor en una conversación existente

Un elemento de razonamiento repetido lleva `encrypted_content` que solo el proveedor y la credencial que producido puede leer. Cuando opencodex sabe que la conversación fue servida por última vez por una persona diferente proveedor, elimina esa mancha antes de enviar y mantiene el resumen del artículo. Si ese proveedor también utilizado un punto final o credencial diferente, el elemento `rs_…` id también se elimina, porque nombra un el nuevo destino no puede buscar. Cuando no puede saber, por ejemplo, después de un reinicio proxy, el nuevo destino rechaza la mancha en su lugar: OpenAI y Azure Respuesta OpenAI `400 invalid_encrypted_content`. opencodex luego reenvía la solicitud una vez sin el estado de razonamiento del proveedor anterior. La mancha va, y también lo hace el elemento de razonamiento `rs_…` id, porque ese id nombra un elemento que el proveedor anterior almacenó y el nuevo destino respondería
`Item with id 'rs_…' not found`.

Esta recuperación se aplica a todos los adaptadores que hablan el cable Responses, así `openai-responses` y
`azure-openai` Comportarse de la misma manera. Después de una recuperación exitosa, los giros posteriores de esa conversación en el mismo destino, deje caer el estado extranjero antes del primer envío para los próximos cinco minutos, sin otro viaje rechazado. El reenvío cuenta con el presupuesto de envío normal de la solicitud. Un ordinario 400 y un 429 nunca se vuelven a intentar de esta manera, y tampoco lo es un 5xx, con una estrecha. excepción: un 502 cuyo cuerpo es la herramienta encriptada exacta descifra el rechazo, enviado para una solicitud que lleva la salida de la herramienta cifrada, obtiene el mismo reenvío único. Un segundo rechazo llega a cliente sin cambios. Si eso sucede, inicie una nueva conversación en el proveedor de destino.

<a id="malformed-tool-call-history"></a>

### Historial de llamadas de herramientas mal formado

Las solicitudes enrutadas toleran los argumentos de función serializados mal formados como un objeto vacío. Dos reparaciones de historial acotado preservan argumentos utilizables: falta un prefijo de objeto JSON, y el rastro de MiMo `</function></tool_call>` sobre con una cita de cierre o soporte que falta. Una reparación debe decodificar a un objeto JSON. Se conservan los valores válidos de JSON que contienen esas etiquetas.
