---
title: "Integración con Codex"
description: "Cómo se inyecta opencodex en Codex, sincroniza el catálogo de modelos, instala shims y restaura limpiamente."
---

opencodex hace la ruta Codex a través del proxy editando dos cosas que Codex lee: su configuración (`$CODEX_HOME/config.toml`, por defecto `~/.codex/config.toml`) y su catálogo de modelos. Cada edición es idempotente y reversible.

Los **Conectar** Vista general tiene un conmutador Codex para esta integración nativa. Su interruptor muestra el último estado deseado guardado de la configuración de OpenCodex, incluyendo inmediatamente después de un cambio, mientras que la insignia informa si Codex es observado actualmente usando el proxy; durante la limpieza, esos pueden diferir brevemente mientras la insignia Informe del estado observado. Deshabilitar los nombres de la configuración efectiva de Codex archivo, elimina los artefactos de enrutamiento generados por OpenCodex y deja el proxy en ejecución para otros clientes. Volver a habilitar reconstruye el catálogo de los modelos disponibles en ese momento, por lo que no restaurar el byte de archivos Codex para el byte.

Para modelos Codex nativos desnudos y filas de selector de cuenta generadas por OpenCodex, el catálogo incluye Metadatos autenticados del programa de acceso. Los modelos desnudos usan la cuenta principal Codex; cuenta calificada Los modelos usan su cuenta seleccionada. Actualizar la integración actualiza estas filas cuando se está en el flujo ascendente Cambia los programas de acceso a la cuenta. OpenCodex lleva la solicitud de disponibilidad del modelo en vivo de la cuenta principal iniciada a las filas del modelo nativo desnudo.

El proxy expone uno desnudo `openai` Ruta de inicio de sesión Codex con los modos de cuenta Pool(predeterminado) y Direct, más `openai-apikey/<model>` para la clave API configurada. Pool incluye las principales cuentas añadidas; Direct utiliza solo el llamante/portador principal. Las rutas no se vuelven a caer unas a otras. Enviado v1 configs migran al marcador 2 y preservan `config.json.pre-openai-tiers-v2.bak` para la restauración manual.

Dentro del modo Pool, una solicitud que lleve un inicio de sesión nativo validado de Codex puede usar ese inicio de sesión cuando se la cuenta almacenada seleccionada se está enfriando y no hay alternativa almacenada elegible o sonda de recuperación disponible. Esto también cubre una nueva solicitud bloqueada antes de enviar, siguiendo la misma llamada. Validación utilizada después de un rechazo ascendente. Política de permisos modelo y cuenta principal existente los cheques siguen siendo aplicables. El respaldo conserva el tiempo de reutilización de la cuenta almacenada y no persiste el credencial de llamada como la selección Pool. Una cuenta exacta sigue vinculada a esa cuenta.

<a id="config-injection"></a>

## Inyección de configuración

`ocx sync` elimina los esfuerzos de razonamiento no soportados por el entorno de ejecución Codex seleccionado del catálogo. Informa de una pinza cuando cambia su identidad en entorno de ejecución, elimina esfuerzos o modelos afectados; sin cambios syncs preserva la marca de tiempo de diagnóstico y no repite ese aviso. Esta compatibilidad La proyección no requiere correr `ocx doctor`. Si una abrazadera se limpia y luego regresa, se informa nuevamente.

OpenCodex serializa su escritura de configuración Codex. En Windows, un archivo se mantiene temporalmente abierto por otro proceso obtiene un breve, limitado reintento. Si el acceso permanece ocupado, vuelva a intentar la operación en breve; OpenCodex conserva la evidencia de bloqueo existente y no utiliza ese fallo de acceso para asumir el control El bloqueo de otro escritor.

`ocx init`, `ocx start`, y `ocx sync` Llame al inyector. En el enlace de bucle predeterminado, se mantiene Codex incorporado `openai` ID de proveedor y apunta a ese proveedor en opencodex:

```toml
# root keys, before the first table
model_catalog_json = "/absolute/path/to/opencodex-catalog.json"
# Auto-injected by opencodex (undo: ocx restore)
openai_base_url = "http://127.0.0.1:10100/v1"
# Auto-injected by opencodex (undo: ocx restore)
experimental_realtime_ws_base_url = "http://127.0.0.1:10100/v1"

# only when fastMode is set; unset adds no [features] table
[features]
fast_mode = true
```

La segunda clave es la anulación de banda lateral de voz. Codex crea una llamada de voz WebRTC
`openai_base_url`, pero desde el códice 0.146 (openai/codex .35830) se une a la banda lateral de esa llamada WebSocket en `api.openai.com` directamente a menos que `experimental_realtime_ws_base_url` Lo redirecciona. En El modo Pool la llamada se crea bajo la cuenta que selecciona opencodex, así que una unión directa bajo el nombre de la aplicación Inicio de sesión propio falla con `realtime websocket handshake failed` (404). La llave inyectada envía la unión volver a través de opencodex (`GET /v1/live/{callId}`), donde el Pool reutiliza la cuenta vinculada a esa par sesión/hilo (un enlace process-local). Una llamada que el propio cliente creó es la excepción: cuando la voz de ChatGPT entrega una llamada a un hilo Codex, o Codex Desktop crea la llamada por sí sola, la llamada pertenece a su inicio de sesión ChatGPT y solo su combinación de banda lateral alcanza opencodex, por lo que opencodex reenvíos que se unen con la credencial ChatGPT propia de la persona que llama en lugar de una cuenta Pool. En Direct modo ambas piernas ya usan la llamada portadora actual, por lo que la clave solo mantiene la unión en la ruta proxy. Está escrito solo en el bucle
`openai_base_url` forma, se elimina junto con ella, y un usuario
`experimental_realtime_ws_base_url` Nunca se sobrescribe.

<a id="voice-transport-and-task-handoffs"></a>

### Transporte de voz y traspasos de tareas

Codex posee el micrófono y el altavoz, negociación de medios WebRTC, subtítulos, controles de silencio y limpieza de voz al cambiar de hilo. OpenCodex retransmite la creación de llamadas y la conexión de banda lateral; trabajo delegado por voz utiliza la ruta de enrutamiento Responses normal. Elegir un proveedor de texto hace no reemplazar el modelo de voz en tiempo real o habilitar la voz en un cliente que no lo soporta.

El upstream [Cambio de ayudante WebRTC](https://github.com/openai/codex/commit/1b53f6a44eff890b5169bde8d3bd5b12b8766946)
y [Integración de voz TUI](https://github.com/openai/codex/commit/b01c3986fd2e79b8a477a08d81430f52f22bc0dc)
describa estas responsabilidades del cliente, incluidas las respuestas finales de los traspasos de voz. Sus fechas de fusión no se establecen cuando el mismo comportamiento llegó a la aplicación de escritorio.

Opcional `OCX_LIVE_FRAME_LOG` diagnosis write only frame timestamp, dirección, tipo, recuento de bytes, y una bandera de caracteres de reemplazo (`ts`, `dir`, `kind`, `bytes`, `fffd`) No almacenan la voz Texto o extractos de marcos. Para tramas binarias, la decodificación UTF-8 puede producir por sí misma un reemplazo Por lo tanto, la bandera por sí sola no identifica dónde ocurrió la corrupción. Archivos de registro existentes no se reescriben.

<a id="fast-mode"></a>

### Modo rápido

El inyectado `fast_mode` sigue el tri-estado `fastMode` ajuste: `true` escribe `fast_mode = true`,
`false` escribe `fast_mode = false`, y unset deja una existencia `fast_mode` Sin tocar sin Añadir un `[features]` mesa.

El modo rápido está separado del transporte de voz. Descripción de la velocidad del nivel de servicio de un modelo compatible no garantiza un micrófono inferior, WebRTC o latencia de voz de extremo a extremo a través de OpenCodex.

<a id="chatgpt-family-channel-and-latency"></a>

### Canal y latencia de la familia ChatGPT

Solicitudes enrutadas a través de opencodex a través del registro canónico ChatGPT `openai` proveedor — adaptador
`openai-responses`, `authMode: "forward"`, y el `https://chatgpt.com/backend-api/codex`
Endpoint, que cubre los modos Pool y Direct —, utiliza el endpoint público ChatGPT. Enrutamiento del proveedor o la selección de cuenta no pasa por alto el canal ChatGPT ascendente. El upstream puede pasar tiempo poner en cola una solicitud antes de la primera salida, incluso cuando el proxy local y la ruta de red están sanos.

Solo algunas vueltas toman el transporte ChatGPT websocket — lo mismo `responses_websockets` carril Codex CLI por defecto. Un turno es elegible cuando el entorno de ejecución Bun admite el relé limitado, la solicitud es un `POST` Responses URL o una ruta WebSocket configurada, y sus conjuntos de cuerpo JSON
`stream` a `true` en la raíz. Todo lo demás permanece en SSE sobre HTTP, y un giro elegible todavía Cuando la solicitud no puede ser preparada, el `response.create` El marco supera su tamaño límite, o la ruta proxy no puede llevar el socket.

Para mantener el proveedor integrado de ChatGPT en HTTP/SSE, establezca `providers.openai.upstreamWebsocket`
a `false` en `~/.opencodex/config.json` Reiniciar el proxy. Combinar este campo en el existentes `openai` proveedor; preservar su modo de cuenta y otras configuración. Omita el campo para restaurar la selección WebSocket ascendente predeterminada. Esta configuración no cambia el cara al cliente `websockets` switch o la cuenta ChatGPT utilizada para la solicitud. Nativo La dirección y la inyección a mitad de vuelta necesitan corriente arriba WebSocket y no están disponibles mientras está apagada.

El ritmo del proveedor local también puede contener una solicitud antes de que se envíe. Así que un lento primero La salida tiene varios posibles contribuyentes, y la cola ascendente es solo uno de ellos. `ocx doctor`
clasifica la configuración y no mide ninguno de estos: comparar el transporte real, el ritmo, la red, y observaciones del proveedor antes de concluir.

Lo que decide si una solicitud toma ese canal público es el destino al que se resuelve, no el nombre de la entrada del proveedor. Un proveedor que resuelve en otro lugar — `openai-apikey`, o a entrada personalizada que apunta a su propio API — llega a ese punto final directamente y no ve ninguna cola ChatGPT. Una entrada con nombre personalizado que resuelve `https://chatgpt.com/backend-api/codex` con el auth hacia adelante toma el mismo canal público que la fila incorporada, porque la clasificación lee el adaptador, modo auth y destino en lugar del nombre de la entrada.

Los `ocx doctor` es más estrecho que el comportamiento de punto final que describe: inspecciona solo el incorporado `openai` fila, por lo que su ausencia no le dice nada acerca de dónde se resuelve cualquier otro proveedor.

`service_tier: priority` es una preferencia de petición. En el backend ChatGPT el eco
`service_tier` no puede confirmar o denegar el nivel concedido: los turnos programados como prioridad aún pueden echo `default`, por lo que los registros de solicitud muestran el nivel de respuesta como una observación con confirmación
`assumed`. Para el trabajo sensible a la latencia, compare los tiempos de primera salida observados entre los proveedores que usted en lugar de asumir que cualquier canal en particular es más rápido.

Para un reenvío de puerta de enlace a un backend con la misma limitación de metadatos, declarar explícitamente
[`responseTierAuthoritative: false`](/es/reference/configuration/providers/#response-service-tier-authority)
en ese proveedor. La solicitud sigue enviando prioridad y registra el eco sin procesar, mientras que la Fast real La programación sigue sin confirmarse. Los gateways no declarados y el API oficial mantienen su existencia interpretación basada en respuestas. La actualización de OpenCodex por sí sola no agrega esta declaración a la existente Entradas de puerta de enlace: sin ella, una solicitud de prioridad elegible seguida de una `default` Echo todavía registros
`response-declined`.

El proxy escucha en el puerto `10100` por defecto y sirve `POST /v1/responses`,
`POST /v1/responses/compact`, `POST /v1/images/generations`, `POST /v1/images/edits`,
`GET /v1/models`, `GET /healthz`, y el `/api/*` superficie de gestión.

<a id="experimental-context-management-codex-0153"></a>

### Gestión de contexto experimental (Codex 0.153+)

Para una cuenta elegible de ChatGPT, habilite la función experimental en el propio Codex
`config.toml` (Mezclar esto en una `[features]` cuadro):

```toml
[features]
context_management.experimental_mode = true
```

En la integración de loopback integrada predeterminada, el siguiente `ocx sync` o proxy inicio cambia el root administrado `openai_base_url` a `http://127.0.0.1:10100/backend-api/codex`. Codex comprueba esto backend antes de habilitar su `new_context`, historia y herramientas de notas. Iniciar un nuevo Codex sesión después de la sincronización. La función sigue siendo opt-in; URLs base de propiedad del usuario y remoto La inyección de proveedor personalizado no se reescribe. Sin ventana de contexto o limitación de compactación Es necesario o añadido.

El prefijo backend alias las rutas de plano de datos existentes, incluyendo Responses WebSocket Actualizaciones. El original `/v1` rutas y la anulación de banda lateral en tiempo real permanecen disponibles. Los proxy también transmite los diez nativos `alpha/history/v2/*` y `alpha/notes/v2/*` POST puntos finales A través de la incorporada `openai` proveedor con el `openai-responses` adaptador y canónico ChatGPT destino hacia adelante. Direct utiliza el inicio de sesión actual de la persona que llama/principal; Pool selecciona un Codex cuenta. `openai-apikey` utiliza su clave API configurada, y Responses personalizada o no canónica Los proveedores no son candidatos para este contexto y no reciben credenciales de cuenta Codex de ella. Estos endpoints privados no son implementados por otros proveedores de modelos o por el OpenAI. Ruta API-key.

Los encabezados de las llamadas están restringidos a la lista de permisos de reenvío Codex compartida: `authorization`,
`chatgpt-account-id`, y aprobado OpenAI beta, originador, sesión, y metadatos de protocolo Codex. El relé de contexto se adelanta adicionalmente `x-openai-encrypted-tool-arguments` y
`x-openai-tool-output-truncation-policy`Los encabezados de llamadas arbitrarios, como las cookies, no son Reenviado. Una clave de plano de datos proxy presentada como portadora se sustituye por la Codex seleccionada. credencial (el inicio de sesión principal almacenado en Direct); las credenciales faltantes fallan antes del reenvío. Las credenciales de admisión de proxy nunca van hacia arriba. Los argumentos cifrados, los cuerpos de respuesta y Se conservan los estados de error ascendentes.

Una respuesta de modelo ChatGPT exitosa registra la cuenta de servicio real de la sesión raíz en un limitado, registro de propiedad local del proceso. El historial y las notas usan ese propietario registrado, incluyendo una cuenta seleccionada explícitamente, incluso cuando cambia la cuenta activa actual. Cuenta almacenada token actualizar puede continuar para la misma cuenta física; se rechaza una identidad de cuenta reemplazada. Las sesiones propiedad del llamante Direct mantienen la credencial del llamante y no pueden ser tomadas por un portador proxy. Esto no migra el historial del lado del servidor entre cuentas.

La propiedad está particionada por la clave opencodex API que admitió la solicitud, por lo que dos claves nunca llegar a las sesiones del otro incluso cuando ambos se resuelven en el mismo espacio de trabajo ChatGPT. Un ID de espacio de trabajo nombres de una organización en lugar de una persona, por lo que el registro también vincula al usuario la credencial aceptada: una actualización ordinaria de token para ese mismo usuario continúa sesión, mientras que un usuario diferente en el mismo espacio de trabajo no lo hace. Cuando la credencial no demuestra un usuario estable, solo que la credencial exacta continúa. Ese principal es la clave opencodex API que presenta la solicitud. Un enlace remoto ya requiere uno, Así que la propiedad funciona allí. En el bucle de retorno predeterminado, la opencodex admite solicitudes sin leer un y la inyección de bucle invertido incorporada no puede llevar el `x-opencodex-api-key` encabezado, por lo que Codex no presenta ninguna clave opencodex y el historial de contexto devuelve HTTP 403. **Por lo tanto, el relé está disponible en un enlace remoto con una clave configurada, o a un cliente que envía `x-opencodex-api-key` propio, y no a través de la integración built-in loopback predeterminada.** Si un proxy enlazado por bucle debería ser poder nombrar a una persona que llama es una decisión abierta de mantenimiento, por lo que el comportamiento actual se niega en lugar de adivinar.

La propiedad desconocida, caducada, desalojada, conflictiva o reiniciada-perdida devuelve HTTP 409 antes de la cuenta selección o E/S de origen. El relé no se calcula a partir de la cuenta activa actual. Existentes Las sesiones deben guardar un punto de control u otro resumen duradero antes de habilitar la función o restablecerla. contexto. Habilitarlo no rellena la historia anterior o notas, y una nueva observación de propiedad no prueba que exista contenido backend más antiguo. Después de un reinicio, establezca la propiedad con un solicitud de modelo exitosa antes de usar herramientas de contexto; inicie una nueva sesión cuando haya conflictos de propiedad.

Las reglas de afinidad, tiempo de reutilización y reintento del modelo existente no cambian. Las solicitudes de contexto no son Recuperado automáticamente, incluyendo notas escritas; Las solicitudes de reenvío ChatGPT no usan la misma clave 429 repetición. El tráfico del historial no consume ni establece una sonda de recuperación de cuotas del modelo.

Una fecha límite de 35 segundos cubre toda la operación de retransmisión, comenzando antes de que se lea el cuerpo de la solicitud. y cubriendo la selección de credenciales, por lo que un cliente estancado no puede mantener abierta una ranura de giro admitida. Una desconexión del cliente devuelve 499 y una fecha límite vencida devuelve 504; no se envía nada de origen después de cualquiera de ellos.

Para desactivar la función, quite la clave experimental (o configúrela `false`), correr `ocx sync`, e iniciar una nueva sesión Codex. La base raíz administrada vuelve a `/v1`.

La clave está ausente o `false` el relé no existe: los diez puntos finales responden 404 para cualquier La persona que llama, incluyendo uno que los publica directamente, y un modelo de turno no registra la propiedad del historial. opencodex decide esto leyendo la propia configuración de Codex, por lo que el conmutador no depende de la URL inyectado o en cualquier cosa que envíe un cliente, y desactivarlo tiene efecto sin reiniciar.

<a id="hosted-image-results-in-codex-app"></a>

### Resultados de imágenes alojadas en la aplicación Codex

Cuando un proveedor de Responses enrutado devuelve un servidor alojado completado `image_generation_call`
con datos de imagen base64, opencodex guarda la imagen validada en su
`artifacts/` directorio y entrega un mensaje final de imagen de asistente a un cliente Codex conectado. La imagen permanece fuera de la sección de progreso plegable. Esto se aplica a la transmisión y no transmisión Responses, sin otra generación solicitud o un cambio en el proveedor seleccionado.

Cuando un cliente reproduce estos mensajes de imagen generados como historial de asistente, opencodex reemplaza sus enlaces de imagen local generados con referencias de artefactos opacos antes de reenviar esa historia. Esto protege las rutas de visualización sin cambiar la imagen mensaje que ya se muestra en la aplicación. No elimina rutas no relacionadas suministradas por el usuario.

Esta compatibilidad de pantalla requiere la admisión de loopback y un cliente reconocido Codex. Los clientes API remotos y genéricos conservan el formato de respuesta alojado del proveedor. Las previsualizaciones parciales y los resultados solo de URL no se representan en esta capa de compatibilidad. Los artefactos usan el límite de retención existente, por lo que debes guardar las imágenes que quieras conservar antes. Los archivos más antiguos están podados. Una imagen no válida o una escritura local fallida produce una imagen visible. mensaje de error en lugar de un enlace de imagen roto. Mostrar lotes rechazar imagen duplicada identidades, metadatos de enrutamiento sobredimensionados y salida que exceda el límite de bytes de visualización; estos fallos devuelven HTTP 502 antes de la transmisión o un evento de terminal fallido después de que se inicia.

<a id="built-in-image-generation-image_gen"></a>

### Generación de imágenes incorporada (`image_gen`)

Codex incorporado `image_gen` La herramienta no pasa `/v1/responses` — la extensión códex-rs POSTs `{base_url}/images/generations` (o `/images/edits` cuando se adjuntan imágenes de referencia) directamente, con la misma autenticación de portador ChatGPT que utiliza para el chat. Porque el inyectado `base_url`
puntos en opencodex, el proxy retransmite esas llamadas a la OpenAI de origen.

Esto es separado de la [Puente de imágenes](/es/guides/image-bridge/), que solo se activa cuando un
**Responses** turn lista los hosts `image_generation` herramienta mientras se selecciona un modelo que no sea OpenAI. Independiente `/images/generations` Las llamadas nunca entran en ese puente.

- **Un candidato avanzado con conciencia de modo:** Pool selecciona una cuenta principal/añadida elegible y utiliza su ChatGPT credencial incluso cuando el cliente se autentica opencodex con un portador de admisión proxy. Direct Utiliza el llamador ChatGPT OAuth portador y no puede reenviar una admisión proxy token. El modo configurado se aplica de manera coherente a la solicitud de imagen.
- **OpenAI Proveedor de clave API:** solo se utiliza cuando ningún candidato posee una autenticación fracaso. Una credencial Pool rota / expirada nunca se oculta detrás del uso facturado por separado API.
- **Proveedor personalizado explícito:** conjunto `images.provider` al id de una clave API personalizada
  `openai-responses` proveedor cuyo punto final implementa las imágenes OpenAI API. Selección explícita falla cerrado y nunca cae de nuevo a un diferente pagado de origen. ID de proveedor administrado por el registro no se aceptan aquí; omita `images.provider` para usar los niveles OpenAI incorporados.
- **xAI Imagine (Grok OAuth) relé:** cuando `images.bridgeEnabled` es `true`, `images.provider` es Omitido, y un `xai` El proveedor está configurado, `/v1/images/generations` y `/v1/images/edits`
  son enviados a `https://api.x.ai/v1`. La credencial depende del proveedor `authMode`: con
  `"oauth"` el relé reutiliza la concesión Grok CLI de `ocx login xai`con cualquier otro modo que utilice la clave API del proveedor. Un inicio de sesión OAuth no activa un proveedor con llave, y viceversa. ChatGPT No se reenvían las credenciales. Si falta la credencial, el proxy devuelve 400 en lugar de 400. facturación ChatGPT. Configuración `images.provider` explícitamente manos `/v1/images` a ese proveedor; su Los errores de validación propios se devuelven tal cual y el relé xAI nunca se prueba. Los mapas de retransmisión Codex `size` / `aspect_ratio` en el cuerpo Imagine de xAI y regresa El mismo `{created, data:[{b64_json}]}` forma. Bytes decodificados combinados y salida codificada en base64 a través del lote (en línea `b64_json` URLs descargadas) permanecen por debajo de 100 MiB; un lote que sobrepasar ese límite devuelve 502. Cuando xAI devuelve una imagen URL en lugar de bytes en línea, el proxy obtiene ella misma sin credencial: el URL debe ser público HTTPS (sin redirecciones, sin
  `file:`, sin loopback o direcciones privadas), cada descarga está limitada a 50 MiB, y el resultado es materializado como un artefacto local que se sirve solo a través de la gestión autenticada punto final. Esto es independiente del bucle de puente de imagen Responses (que permanece solo en la clave API).
- **Antigravedad Google (CCA) fallback:** cuando ni un candidato a reenvío OpenAI ni un candidato con clave El proveedor está configurado, `/v1/images/generations` (no `/images/edits`) vuelve a la Antigravedad **Asistencia de código en la nube** usando el comando `gemini-3.1-flash-image` modelo. El fallback también se dispara después de que falla la resolución de autenticación de OpenAI (e.g. una credencial ChatGPT caducada o faltante), no solo cuando no se configura ningún candidato OpenAI. Esto requiere `ocx login google-antigravity`; el OAuth token se envía solo al registro CCA anclado host, nunca a un nivel de configuración `baseUrl` Anular. La respuesta se devuelve en el mismo
  `{created, data:[{b64_json}]}` forma que Codex espera.
- **Tampoco:** el proxy devuelve un error claro en lugar de un 404 genérico. Proveedores encaminados (Cursor, Gemini, Kiro, …) `image_generation` herramienta de retransmisión; si no desea el herramienta que se ofrece en absoluto, desactivarlo en Codex con `codex features disable image_generation`
  (`[features] image_generation = false` en `config.toml`).

La declaración de la herramienta sigue viajando con la solicitud Responses del modelo. Para API-llave Responses proveedores, opencodex reduce la privacidad de Codex `image_gen` espacio de nombres a un nivel seguro
`image_gen__<inner-name>` alias (por ejemplo `image_gen__imagegen`) Cuando ese alias utilizable reemplaza la declaración de cliente, opencodex elimina un duplicado alojado `image_generation` declaración. Se mapea Llamada a la función explícita `image_gen` espacio de nombres antes de que Codex lo vea y codifique el llamar de nuevo cuando el historial posterior se reproduce de origen. Esto mantiene la generación de imágenes del lado del cliente llamable en upstreams compatibles con el público que reservan el espacio de nombres o rechazan los nombres de funciones punteadas. ChatGPT El modo de avance permanece intacto y mantiene su forma nativa Responses Lite.

Para una puerta de enlace personalizada compatible con OpenAI, configure un proveedor dedicado y selecciónela solo para Solicitudes de imágenes independientes:

```json
{
  "providers": {
    "custom-images": {
      "adapter": "openai-responses",
      "baseUrl": "https://gateway.example.com/v1",
      "authMode": "key",
      "apiKey": "${IMAGE_GATEWAY_API_KEY}"
    }
  },
  "images": {
    "provider": "custom-images",
    "timeoutMs": 300000
  }
}
```

El endpoint personalizado debe aceptar `POST /v1/images/generations` y `/v1/images/edits` y devolver el OpenAI Forma de respuesta de las imágenes esperada por Codex. La clave configurada por el proveedor reemplaza a cualquier llamante portadora antes de la solicitud ascendente.

> **Nota:** Esto se refiere solo a la Codex `image_generation` herramienta (`/images/generations` relé). > Los modelos Gemini que son capaces de producir imágenes en línea de forma nativa a través del `google` adaptador > (vía `responseModalities: ["TEXT", "IMAGE"]`), independiente de este relé — ver
> [Adaptadores](/es/reference/adapters/#google).

Para un no-loopback `hostname`, Codex debe enviar la cabecera de autenticación API generada. Por lo tanto, el inyector Utiliza un proveedor dedicado en su lugar:

```toml
# root keys
model_provider = "opencodex"
model_catalog_json = "/absolute/path/to/opencodex-catalog.json"

# appended at the end of the file
# Auto-injected by opencodex (undo: ocx restore)
[model_providers.opencodex]
name = "OpenCodex Proxy"
base_url = "http://your-host:10100/v1"
wire_api = "responses"
requires_openai_auth = true
env_key = "OPENCODEX_API_AUTH_TOKEN"
# supports_websockets = true   # only when config.websockets is true
```

Cuando OpenCodex posee enrutamiento, ambos modos escriben `$CODEX_HOME/opencodex.config.toml` como a configuración de referencia/retroceso. En loopback que contiene las claves de raíz se puede combinar manualmente si automático se eliminó la inyección; en no bucle de retorno contiene el formulario de proveedor dedicado. Proveedor externo El modo deja este perfil intacto.

:::caution
Claves de raíz como `openai_base_url`, `model_provider`, y `model_catalog_json` **debe** sentarse antes de la primero `[table]` cabecera. El inyector garantiza esa colocación, elimina su propio rancio / duplicado copia, y nunca sobrescribe una raíz propiedad del usuario `openai_base_url`; si existe, la sincronización actualiza el catálogo, pero informa que el enrutamiento no fue inyectado.
:::

<a id="shared-model-catalog"></a>

## Catálogo de modelos compartido

Codex CLI, TUI, App y SDK leen la misma casa Codex. opencodex resuelve ese directorio desde
`CODEX_HOME`, cayendo de nuevo a `~/.codex`, y gestiona:

```text
$CODEX_HOME/config.toml
$CODEX_HOME/opencodex.config.toml
$CODEX_HOME/opencodex-catalog.json
$CODEX_HOME/models_cache.json
```

En marcha macOS, opencodex comprueba la Codex Apps agrupadas CLI en `/Applications/ChatGPT.app` y luego `~/Applications/ChatGPT.app` después de selecciones explícitas, shims, PATH, instalaciones establecidas y el ejecutable bare `codex` fallback, requiere XML del paquete `Info.plist` identidad para ser `com.openai.codex`, y nunca reemplaza automáticamente una selección persistente ejecutable con un candidato de aplicación.

En WSL, si `CODEX_HOME` está desactivado y el Linux `~/.codex` directorio está ausente o no contiene ningún estado Codex (`config.toml`, `auth.json`, `sessions`, `history.jsonl`), opencodex también comprueba si hay un único Windows Codex Escritorio `/mnt/c/Users/*/.codex/config.toml`. Cuando existe exactamente un candidato, utiliza ese directorio para WSL modo de aplicación-servidor y Windows Codex El escritorio comparte los mismos archivos de configuración y autenticación. `CODEX_HOME` explícitamente para anular esta detección. Cuando Windows Codex Desktop ejecuta su aplicación-servidor dentro de WSL, envía el binario Linux Codex bajo ese hogar como `bin/wsl/<hash>/codex`; opencodex lo encuentra allí cuando el servicio PATH no tiene `codex`, después de cualquier entorno de ejecución configurado explícitamente y PATH.

Si existe la casa Codex pero Codex no ha escrito `config.toml` (por ejemplo, una nueva instalación de escritorio que nunca se ha iniciado sesión en OpenAI), opencodex crea un `config.toml` allí y continúa. Si el directorio principal en sí no existe, inicie Codex una vez para que lo cree o establezca `CODEX_HOME`.

Codex puede mantener el estado del subproceso respaldado por SQLite en un directorio separado. Uso de operaciones del historial OpenCodex la misma precedencia que Codex: root `sqlite_home` en `config.toml`Entonces, `CODEX_SQLITE_HOME`Entonces, el eficaz `CODEX_HOME`. Los hogares SQLite relativos se resuelven desde el directorio de trabajo actual. Cuando un explícito `CODEX_SQLITE_HOME` está presente durante la instalación o reparación de servicio, el lanzador durable almacena su ruta absoluta de tiempo de instalación para que el proxy en segundo plano continúe dirigiendo la misma base de datos. Si `config.toml` o su raíz `sqlite_home` clave está ausente, OpenCodex continúa ambiente / casa fallback. Si el archivo no se puede leer o analizar, o la clave está presente pero en blanco o no es una cadena, la resolución SQLite-home se detiene en lugar de arriesgar las operaciones del historial contra una cadena diferente base de datos.

En Windows, un shell Orca puede establecer ambos `CODEX_HOME` y `ORCA_CODEX_HOME` El entorno de ejecución de Orca mientras la aplicación ChatGPT/Codex sigue leyendo `%USERPROFILE%\\.codex`. `ocx status` y `ocx doctor`
advierta sobre esta desadaptación exacta e imprima rutas de destino redactadas. Si se instaló un servicio en segundo plano de ese shell de Orca, desinstálalo del shell original primero, luego configura `CODEX_HOME` Ir a la página casa, sin set `ORCA_CODEX_HOME`, vuelva a ejecutar la sincronización/restauración e instale el servicio de nuevo.

En el modo de proveedor dedicado, `requires_openai_auth = true` mantiene Codex App/TUI superficies cerradas por cuenta alineados con Codex nativo. opencodex también sirve `/v1/responses` sobre WebSocket. El dedicado proveedor anuncia `supports_websockets = true` Solo cuando `"websockets": true`; en el bucle Codex proveedor incorporado puede probar WebSocket primero, y un proxy deshabilitado devuelve `426` así que Codex vuelve a HTTP/SSE.

El proxy admite hasta 128 clientes Responses WebSocket conexiones. Cuando una nueva conexión encuentra las 128 ranuras ocupadas, cierra la conexión inactiva menos recientemente utilizada para hacer espacio. Conexiones con una respuesta activa, herramienta cliente pendiente o resultados de aprobación, una sesión de dirección / inyección nativa o salida almacenada en buffer están protegidos. Si no se puede liberar ninguna conexión inactiva, la nueva conexión recibe la conexión existente `503` Capacidad de respuesta. Un cliente recuperado puede volver a conectarse para más tarde utilizando el manejo de continuación existente. Esto ocurre solo bajo conexión presión, no necesita configuración y no cambia las conexiones de voz o la reutilización de la conexión ascendente.

Si una continuación de reenvío canónica ChatGPT hace referencia a un estado de repetición local vencido o ausente, opencodex devuelve `previous_response_not_found` antes de enviar cualquier cosa upstream. Codex El cliente WebSocket reconoce este error y puede volver a conectarse con su contexto completo retenido. incluyendo las llamadas a herramientas completadas y sus resultados, dentro de su presupuesto normal de reintento de flujo. Un Por lo tanto, la tarea inactiva no necesita una nueva tarea únicamente porque la caché de reproducción del proxy expiró. El estado de continuación reproducido se conserva durante 24 horas y permanece limitado por su memoria existente. disco y techos de entrada; esto no recupera el historial que el cliente ya no tiene. Clientes HTTP debe manejar el error explícitamente y reenviar su contexto completo sin `previous_response_id`. Volver a intentar solo el mismo ID no puede recuperar el estado faltante.

El mismo rechazo se aplica cuando el estado referenciado pertenece a un ámbito de tareas cliente diferente. incluyendo cuando la nueva solicitud parece llevar entrada completa. El proxy no puede probar que la entrada está completo, por lo que no elimina silenciosamente `previous_response_id` o revelar si el estado coincidente existe. Vuelve a intentar con la conversación completa y omite `previous_response_id`; hacer coincidir los alcances y Las continuaciones heredadas en las que ambos ámbitos están ausentes o en blanco continúan reproduciéndose normalmente.

La misma señal de recuperación se aplica a todos los destinos enrutados, porque solo el Responses nativo passthrough puede responder a un turno cuyo historial este proxy perdió — que reenvía `previous_response_id`
a un backend que almacenaba la cadena. Cada cable reconstruye la conversación de cada solicitud entrada propia, por lo que una expansión perdida allí enviaría el giro actual solo y en silencio Perder la conversación. Eso incluye a los tres que parecen con estado: Devin reenvía el todo Conversación cada vez, la referencia de punto de control de Cursor vive en la misma tienda vencida y cae volver a la reproducción completa sin él, y Kiro reconstruye su historial de conversaciones desde los giros que fue mano. También se aplica a los proveedores Responses configurados con
`statelessResponses: true`, y a las solicitudes enrutadas donde se bajó una herramienta personalizada a una función pero un resultado delta no tiene una llamada local para establecer su tipo original. La reproducción completa preserva el llamada, resultado y razonamiento juntos; opencodex no adivina el tipo de resultado ni lo descarta. Los proveedores con estado todavía resuelven la función nativa y las continuaciones personalizadas solo nativas. Estas comprobaciones siguen el protocolo de cable seleccionado y las declaraciones de la herramienta, no el nombre del modelo. Por un puerta de enlace que no puede resolver IDs de respuesta almacenados, habilitar `statelessResponses` en dicho proveedor; otros proveedores mantienen sus valores predeterminados.

<a id="client-side-compaction-opt-in"></a>

### Compactación del lado del cliente (opcional)

El enrutamiento de bucle de retorno autenticado normalmente mantiene Codex en su función integrada `openai` identidad del proveedor. Eso preserva la identidad del hilo nativo, pero también hace que Codex solicite compactación remota nativa. Cuando un proveedor enrutado no puede devolver un blob de compactación nativo, OpenCodeX almacena el resumen propio `ocx1:`/`ocx2:` sobre. El ChatGPT nativo no puede verificar ese sobre si OpenCodeX se elimina más tarde de la ruta de solicitud.

En una ruta de bucle de retorno autenticada, habilite la compactación en el lado del cliente para mantener el enrutamiento de subagentes V2 al tiempo que se evitan nuevas operaciones. `ocx1:`/`ocx2:` resúmenes de compactación. Las rutas no loopback y API-key conservan su comportamiento de proveedor y autenticación existente:

```bash
ocx system settings --client-compaction on   # or "codexClientCompaction": true in config.json
ocx sync                                     # rewrites the active config (default: ~/.codex/config.toml); restart Desktop
```

El ajuste predeterminado es off. Para el enrutamiento autenticado de bucle invertido, OpenCodeX selecciona su formulario de proveedor dedicado con `requires_openai_auth = true`. Si `codexDesktopAuthless` es también habilitado, esa configuración de compatibilidad más fuerte tiene prioridad y escribe
`requires_openai_auth = false`:

```toml
model_provider = "opencodex"

[model_providers.opencodex]
name = "OpenCodex Proxy"
base_url = "http://127.0.0.1:10100/v1"
wire_api = "responses"
requires_openai_auth = true
```

Codex entonces posee compactación y almacena un resumen de texto plano portátil en lugar de un nuevo OpenCodeX sobre. La solicitud de compactación sigue enrutando a través de OpenCodeX y puede consumir cuota en el proveedor seleccionado. Las solicitudes de subagentes V2 mantienen su selección y cuota de proveedores existentes contabilidad. La compactación del lado del cliente no cambia la entrega de texto plano, el paso de tareas encriptadas a través `allowEncryptedV2AgentTasks`, o comportamiento de recuperación y fallback configurado.

Esta preferencia afecta solo a las compactaciones futuras, y no reescribe ninguna `ocx1:`/`ocx2:` carga útil en cualquier configuración, así que use el flujo de trabajo explícito de recuperación del historial para un subproceso que lo necesite.

Si se vuelve a etiquetar los metadatos del historial de reanudación depende de la forma que tome la inyección. En su propio, en un enlace de bucle autenticado, la compactación del lado del cliente no vuelve a etiquetar nada: mantiene la raíz en su lugar, como se describe a continuación. Habilitado junto con `codexDesktopAuthless`, o en un non-loopback bind, la forma más fuerte gana y esas formas se comportan exactamente como lo hacen hoy, incluyendo su historial de currículums con los originales respaldados para su restauración.

Volver de una de esas formas a Diseño B simple migra los hilos reetiquetados hacia atrás. Turning apagado `codexDesktopAuthless` mientras deja la compactación del lado del cliente no: eso aterriza en el forma de solo compactación, que omite la unidad de historia, por lo que los hilos ya etiquetados `opencodex` mantener Esa etiqueta. Todavía llegan a este proxy, a través de la tabla del proveedor en lugar de la anulación raíz.

En la forma de solo compactación, los hilos existentes siguen funcionando porque la inyección mantiene la raíz
`openai_base_url` Anular junto a la tabla del proveedor. Nuevos hilos predeterminados para `opencodex` y obtener la compactación del lado del cliente, mientras que un hilo ya está etiquetado `openai` todavía resuelve a Codex de proveedor incorporado — que la anulación retenida todavía apunta a este proxy. Sin ella eso hilo se reanudaría contra OpenAI directamente, teniendo enrutamiento configurado con él. Los authless y Los formularios no loopback no pueden usar la clave raíz, por lo que siguen reetiquetando.

Esa garantía cubre la anulación que administra OpenCodeX. Una raíz `openai_base_url` tú escribiste nunca es reemplazado, y en ese caso el proveedor integrado mantiene el destino elegido, por lo que un `openai`-tagged thread sigue su configuración en lugar de este proxy. Turning el ajuste y la sincronización quitan la tabla y vuelven al diseño B normal, a menos que
`codexDesktopAuthless` o la admisión sin loopback todavía requiere el formulario de tabla de proveedores; dos formas no pueden usar la clave raíz y no cambian.

Mientras el modo está activo, la banda lateral de voz en tiempo real (`experimental_realtime_ws_base_url`) no se inyecta — el formulario de tabla de proveedor dedicado no puede — para que la voz de escritorio Codex use su punto final nativo en lugar del proxy.

<a id="emergency-compaction-model-opt-in"></a>

### Modelo de compactación de emergencia (opcional)

Cuando OpenCodeX traduce la compactación remota para proveedores como Google, reemplaza las imágenes de turnos anteriores con breves notas de reapertura si existe una respuesta final explícita posterior. Existentes Las referencias de análisis y archivo permanecen en la entrada de resumen; las imágenes después de la última respuesta permanecen disponibles para trabajos no resueltos. Se conservan las historias sin fase y solo comentarios. Esto afecta solo la solicitud de compactación, no los archivos adjuntos almacenados o las solicitudes de modelo ordinarias. Reduce las repeticiones entrada de visión, pero no garantiza que un largo historial de texto se ajuste al límite de contexto del proveedor.

`compactionRecovery` deja la compactación inicial en la ruta seleccionada de la conversación. Lo permite un intento de emergencia solo después de un fallo de compactación previo a la salida soportado. Es Separados de `compactionRouting`, que elige otro modelo antes de que comience la compactación, y Desde `codexClientCompaction`, que cambia el formulario de proveedor de Codex.

```json
{
  "compactionRecovery": {
    "enabled": true,
    "model": "provider/emergency-model",
    "allowDevinInvalidArgument": false
  }
}
```

Utilice un modelo autorizado configurado independientemente con suficiente contexto para la entrada fallida. La habilitación de la recuperación permite que el proveedor del modelo reciba el historial de compactación y la carga para el intento extra cuando se ejecuta la recuperación; las compactaciones ordinarias exitosas no incurren en llamadas adicionales. La opción está desactivada cuando está ausente o desactivado. La administración autenticada existente API acepta Este bloqueo a través `PUT /api/settings`; enviar `compactionRecovery: null` Para eliminarlo. Un directo La edición del archivo debe seguir el flujo de trabajo normal de configuración de stop-proxy. Esta configuración no cambie el inicio de sesión, el modelo ordinario de la conversación, el ID del proveedor de Codex o el compositor del escritorio.

La recuperación no se reproduce después de la cancelación, la salida semántica, los efectos secundarios de la herramienta, un agotado enviar presupuesto, o una autenticación, admisión o rechazo de la política. Genérico `400` Los errores no Habilitar reserva. Devin responde a una historia sobredimensionada con una preproducción opaca
`invalid_argument`cuando el tamaño estimado de la solicitud está en o cerca de la ventana de entrada del modelo, el adaptador lo informa como `context_length_exceeded` en su lugar, por lo que Codex compacta en un turn y una compactación fallida califican como un desbordamiento de contexto sin ninguna opción específica de Devin. La estimación utiliza descripciones de herramientas después de la desinfección y truncamiento de Cognition, que coinciden con el solicitud enviada upstream. Una solicitud más pequeña que obtiene el mismo código permanece simple `400`. Los Por separado opt-in `allowDevinInvalidArgument` El caso cubre solo a los que quedan `invalid_argument` fracasos, y solo en una solicitud de compactación identificada. El intento de emergencia comparte la solicitud original Envíe presupuesto y nunca comience un segundo intento de recuperación.

La compactación encriptada nativa está fuera de esta ruta de recuperación: se conserva su error original. No hay modo de truncamiento local automático. Una respuesta aceptada no es prueba de que un larga conversación retuvo sus objetivos; verificar el siguiente turno en el modelo original antes de tratar un resumen de emergencia como una tarea recuperada.

<a id="authless-codex-desktop-opt-in"></a>

### Authless Codex Escritorio (opcional)

En **Panel de control → Visión general**, **Abrir Codex sin iniciar sesión** Controla esta situación existente preferencia opt-in. El switch predeterminado es **apagado** cuando el ajuste es ausente o falso; Una explícita ya existente `codexDesktopAuthless: true` Permanece habilitado. El dashboard guarda la preferencia y ejecuta una sincronización completa. Reinicie Codex Desktop después de cambiarlo. Si la sincronización falla, la preferencia guardada permanece y el panel de control muestra el error; reintentar **Sincronización** antes de reiniciar. Las funciones de escritorio cerradas por cuenta pueden no estar disponibles cuando esté habilitado. Credenciales ascendentes, elegibilidad local, autenticación de admisión remota y la configuración de la puerta de enlace propiedad del usuario mantiene sus requisitos existentes.

Codex Desktop muestra su pantalla de inicio de sesión ChatGPT cada vez que el proveedor activo requiere OpenAI auth. Si su configuración OpenCodex nunca usa credenciales ChatGPT (solo proveedores enrutados, o una
`chatgpt.com`), puede optar por salir de esa puerta:

```bash
ocx system settings --desktop-authless on    # or "codexDesktopAuthless": true in config.json
ocx sync                                     # rewrites ~/.codex/config.toml; restart Desktop
```

Con el interruptor activado, un enlace de loopback inyecta el formulario de proveedor dedicado en lugar del formulario raíz.
`openai_base_url` Anúltese:

```toml
model_provider = "opencodex"

[model_providers.opencodex]
name = "OpenCodex Proxy"
base_url = "http://127.0.0.1:10100/v1"
wire_api = "responses"
requires_openai_auth = false
```

El escritorio se inicia sin un inicio de sesión y enruta cada turno a través del proxy. El escenario sobrevive
`ocx start`, reiniciar, `ocx sync`, y `ocx ensure`Apagarlo (`--desktop-authless off`) hace el siguiente sync restaurar el formulario de loopback predeterminado, y `ocx restore` lo tira como cualquier otro inyectado enrutamiento. Qué esperar mientras está encendido:

- ChatGPT-gated Chrome de escritorio (cuenta, uso, modo rápido) se mantiene oscuro: Codex deriva esas superficies del requisito de autenticación del proveedor.
- Los nuevos hilos están etiquetados con el `opencodex` como en un enlace no loopback, y la historia es Manejado de la misma manera.
- Las versiones de escritorio que filtran el selector de modelos contra una lista de permisos solo nativa pueden mostrar un mensaje vacío. o `Custom` selector en este modo también; las solicitudes todavía usan el modelo configurado. Establecer
  `model = "<provider>/<id>"` en `config.toml` como se describe en
  [Servidores remotos de escritorio](/es/guides/codex-app-models/#desktop-remote-servers).

Esto solo cambia la puerta de inicio de sesión del escritorio. Non-loopback une mantener `requires_openai_auth = true` y la `env_key` credencial de admisión independientemente del interruptor; nunca expone un oyente OpenCodex Sin autenticación.

<a id="thread-identity-and-history"></a>

## Identidad e historia del hilo

El formulario de bucle predeterminado mantiene los nuevos hilos etiquetados con el nativo de Codex `openai` proveedor, tan normal reanudar la historia no necesita reasignación. Sincronizar y restaurar aplicar solo un manifiesto de copia de seguridad coincidente y Restaurar el proveedor original exacto de cada hilo, fuente y marcador de evento. Un desnudo `opencodex` fila con no se deja ningún manifiesto sin cambios; uso `ocx recover-history --legacy-openai --yes` Sólo cuando explícitamente pretende forzar ese legado a reetiquetar. El comando es intencionalmente amplio: reescribe cada hilo con un mensaje de usuario etiquetado actualmente `opencodex` a `openai`, normaliza `exec` a `cli`, y conjuntos el marcador de eventos—incluyendo el historial legítimo de proveedores dedicados. Respalda el estado y úsalo solo cuando se pretende ese alcance completo. El modo de proveedor dedicado sin loopback sigue reflejando el historial debajo de la `opencodex` proveedor mientras está activo y restaura los metadatos de copia de seguridad al salir. Establecer
`syncResumeHistory: false` dejar la historia intacta.

<a id="model-catalog-sync"></a>

## Sincronización de catálogo de modelos

Codex muestra modelos de un catálogo en el disco (`$CODEX_HOME/opencodex-catalog.json` por defecto). En marcha Inicio y encendido `ocx sync`, opencodex:

1. **Respalda** el catálogo prístino una vez para `~/.opencodex/catalog-backup.json` (Por lo tanto, la presentación es reversible).
2. **Pies** catálogos de modelos en vivo de los proveedores elegibles (caché ~5 min; vuelve a la última buena lista, luego configurado `models[]`) El auth directo no tiene punto final del modelo, y Cursor usa su
   `GetUsableModels` RPC en lugar de `/models`.
3. **Combinaciones** modelos enrutados en entradas con nombre (`provider/model`), clonado a partir de un Codex nativo plantilla de catálogo, por lo que el analizador estricto de Codex los acepta.
4. **Filtros** `config.disabledModels` y cada proveedor no está vacío `selectedModels` Allowlist.
5. **Re-rangos** así que los modelos destacados ordenan primero (ver más abajo), luego escribe el catálogo combinado de nuevo.

Las entradas del catálogo enrutado también obtienen su identidad GPT-5 reescrita al nombre del modelo ascendente real. Los controles de razonamiento provienen de metadatos de proveedor / modelo en Codex `low | medium | high | xhigh |
max | ultra` escalera; los valores no compatibles se asignan o fijan antes de la solicitud ascendente.

<a id="coordinator-diagnosis-and-recovery"></a>

### Diagnóstico y recuperación del coordinador

Las escrituras de configuración/historia nativas usan un coordinador SQLite por usuario con la clave canónica `CODEX_HOME`. Si un proceso termina en la ventana de creación inicial de SQLite, un coordinador de cero bytes puede permanecer igual. aunque no contiene ninguna fila de transición autorizada. `ocx doctor` informa la ruta exacta del coordinador y distingue los estados de cero bytes, sin versionar, sin filas, válidos, inseguros e ilegibles sin creación de sidecares SQLite. La sincronización automática tolera solo un archivo de cero bytes estable a la identidad que tiene se conformó durante al menos un segundo y cuya instantánea inmutable SQLite tiene la versión cero sin tablas; un archivo de cero bytes recién creado permanece en la ruta del coordinador bloqueada.

Para un estado que el doctor prueba que es un remanente de creación de cero bytes, detenga el proxy/servicio OpenCodex y correr:

```bash
ocx doctor --recover-zero-byte-coordinator --yes
ocx sync
```

La recuperación mueve el archivo de byte cero todavía idéntico a un mismo directorio `.zero-byte-backup-*` camino; no elimina la evidencia ni adopta el estado enrutado heredado. Rechaza un proxy de ejecución, bloqueo contienda, enlaces simbólicos/puntos de reparación, propiedad extranjera, archivos cambiados, cada base de datos no vacía, y cualquier coordinador que ya tenga una fila autorizada. El filtrado del renderizador de escritorio es un capa separada: un catálogo y un coordinador correctos no evitan por sí mismos el modelo de aplicación Codex Allowlist.

<a id="routed-local-tools"></a>

### Herramientas locales enrutadas

Uso de filas de catálogo enrutadas no nativas `tool_mode: "code_mode_only"`. Esto permite que Codex exponga su oficial
`exec` MCP y las herramientas anidadas, incluyendo el navegador y el uso del ordenador, mientras que opencodex rutas solo la llamada de función ordinaria del modelo. La ejecución de la herramienta, los permisos y las confirmaciones permanecen local a Codex; opencodex no implementa un segundo navegador o ejecutor de control de escritorio.

Para los proveedores clave Responses que no aceptan Codex `exec` Gramática de herramientas personalizadas, opencodex codifica esa declaración y su historial como una herramienta de función ascendente, luego restaura el flujo ciclo de vida de llamada a `custom_tool_call` antes de que Codex lo vea. Enrutamiento de reenvío nativo OpenAI y el apoyo `apply_patch` herramienta personalizada se mantienen sin cambios.

Si un modelo enrutado envía un parche completo como el modo de código completo `exec` entrada, opencodex lo convierte en el anidado `tools.apply_patch` llamar antes de que lleguen los eventos de finalización de la herramienta Codex. Las llamadas personalizadas nativas y las llamadas a funciones convertidas usan la misma regla de finalización; Las vistas previas de parches se mantienen mientras su forma ejecutable no está resuelta. JavaScript que simplemente contiene texto de parche y las cargas útiles personalizadas nativas no relacionadas permanecen sin cambios.

Un modelo enrutado también puede enviar erróneamente un objeto de argumento de shell como
`{"cmd":"git status --short"}` a modo de código `exec`. Para un catálogo de modos de código verificado, opencodex convierte un objeto de shell inequívoco en `tools.exec_command(...)` JavaScript y envía su salida a través de `text(...)`. Las opciones de Shell se conservan y Codex aún Ejecuta y autoriza el comando. Valid JavaScript campos de reserva, objetos ambiguos, y los espacios de nombres de herramientas no relacionados no se convierten. Esta reparación de compatibilidad no pasa por alto limites de velocidad del proveedor o cambie la directiva de reintento configurada.

La misma reparación cubre a los ayudantes de la meta. Un modelo que llama `create_goal`, `get_goal`, o
`update_goal` (o un `default.`-prefijo la ortografía de uno) como una herramienta, mientras que el catálogo declara solo modo de código `exec` tiene la llamada convertida en la coincidencia `tools.<helper>(...)` Llamar dentro
`exec`. Un catálogo que declara genuinamente la herramienta de objetivo desnudo lo mantiene, y un catálogo que declara Ni la herramienta ni `exec` sigue rechazando la llamada como no declarada.

En las conversiones enrutadas con un modo de código de forma libre verificado `exec` catálogo, llamadas estructuradas enviado directamente a
`mcp__<server>__<tool>` (Incluyendo un `default.` El prefijo también es envuelto como llamadas de herramienta de host anidada. Esto evita un reintento únicamente por un modelo que omite la `exec` Envoltorio. Herramientas MCP declaradas explícitamente mantener su comportamiento normal; una función JSON ordinaria llamada `exec` No permite Esta reparación. Las herramientas desconocidas aún fallan en el host. Registros de llamada de herramientas impresos como El texto de respuesta ordinario no se ejecuta por esta regla de compatibilidad.

Para los turnos Responses enrutados, una política explícita de ejecución de herramientas también rechaza las llamadas a herramientas cliente si El catálogo de herramientas declaradas de la solicitud no está disponible. Un catálogo declarado vacío rechaza a todos los clientes llamada de herramientas; Los clientes de Chat y Anthropic conservan su propia responsabilidad de validación de herramientas.

Los giros en modo de código encaminados también se les dice las reglas del host para los ayudantes anidados antes de la primera vuelta. Llamar: `tools.apply_patch` toma una cadena que se abre y se cierra con las líneas de marcador de parche desnudo, El aislado no tiene `import`, y los comandos de larga duración son encuestados a través de `write_stdin`. Cuando a El resultado de ejecución en modo código en la ruta nativa Responses, Kiro o Cursor sigue llevando uno de los mensajes de error, opencodex anexa una pista de una línea que da nombre a la regla. Este cambio no se reescribe el código del modelo o su texto de parche.

Las llamadas a la función Responses enrutadas ordinarias también usan el esquema de parámetros declarado original en completion: los floats integrales en campos enteros y los números integrales en campos de solo cadena son normalizado, mientras que las fracciones y las uniones numéricas permanecen sin cambios. Un explícitamente vacío completado Argumentar cadena se convierte en `{}`. Los eventos finales y el historial de continuación almacenado localmente están de acuerdo. Las ortografías de espacio de nombres punteadas inequívocas se restauran al espacio de nombres declarado y al nombre de la herramienta.

El proveedor seleccionado debe admitir llamadas de función/herramienta. Un proveedor de solo texto sin llamada a herramientas El apoyo no se puede utilizar `exec`, Navegador o Uso de la computadora. Las filas nativas de OpenAI mantienen su herramienta ascendente moda sin cambios.

Después `ocx sync` cambia estos metadatos, reinicia la aplicación Codex y abre una tarea nueva. Aplicación-servidor existente Los procesos y tareas pueden retener el catálogo y el plan de herramientas que cargaron al inicio.

<a id="inline-visualizations-with-routed-models"></a>

### Visualizaciones en línea con modelos enrutados

El complemento Visualizar de la aplicación Codex le pide al modelo que responda con una referencia envuelta en uso privado caracteres (U+E200 … U+E201). Algunos proveedores eliminan esos caracteres antes de que el modelo los vea — cada ruta Claude que verificamos hace —, por lo que el modelo solía responder con una
`visualize{"path":…}` línea que la aplicación Codex imprimió como texto.

opencodex reescribe esas referencias en la directiva que la propia aplicación renderiza,
`::codex-inline-vis{path="/absolute/path/chart.html"}`, en el texto de conversación enviado a Enrutado modelos. Cualquier modelo puede leer y repetir esa forma, por lo que la visualización se renderiza en línea. Nativo OpenAI Las solicitudes passthrough se reenvían sin cambios. Respuestas que ya estaban guardadas en la nada
`visualize{…}` La forma permanece como está; pide la visualización de nuevo en una nueva respuesta.

<a id="custom-model-display-names"></a>

### Nombres de visualización de modelo personalizados

Un modelo personalizado puede llevar un **mostrar nombre** que anula la etiqueta Codex muestra en su selector de modelos, sin cambiar nada sobre cómo se enruta el modelo. El nombre de visualización se asigna a La entrada del catálogo `display_name` campo solo — el slug de enrutamiento (`<provider>/<model>`), alias orden de colisión, proveedor y nombres de marketing nativos OpenAI se dejan intactos.

Agregue un nombre de visualización desde el CLI (el proxy sincroniza el catálogo de inmediato cuando está activo):

```bash
ocx models add deepseek deepseek-v4 --display-name "DeepSeek V4" --context-window 128000
```

Para proveedores personalizados, omitir una ventana de contexto explícito permite que el catálogo
[reglas de respaldo de ventana contextual](/es/reference/configuration/providers/#context-windows-on-custom-providers). Las estimaciones de ID de modelo se aplican solo cuando el proveedor establece `inferContextWindow: true`; establecer un explícito ventana o límite de contexto cuando el relé admite menos que la ventana del proveedor del modelo.

Los clientes remotos de Codex pueden fetch el mismo catálogo generado con un **plano de datos** clave — la misma credencial que ya utilizan para `/v1/responses`, no un administrador token:

```bash
dest="${CODEX_HOME:-$HOME/.codex}/opencodex-catalog.json"
tmp="$(mktemp "${dest}.XXXXXX")"
curl -fsS -H "x-opencodex-api-key: $OPENCODEX_API_AUTH_TOKEN" \
  "https://proxy.example.com/v1/catalog" > "$tmp" \
  && mv "$tmp" "$dest"
ocx sync-cache
```

La respuesta es la RAW `opencodex-catalog.json` documento (sin credenciales de proveedor). Cuando disponible, el `x-opencodex-codex-version` cabecera informa de la versión en entorno de ejecución Codex en el servidor para que los clientes puedan detectar el sesgo de versión.

`GET /v1/catalog` existe para que la lectura de una lista de modelos no cuesta un administrador token. Es Solo lectura (`GET` y `HEAD`), acepta `x-opencodex-api-key`, un portador token, o
`x-api-key`, y sirve exactamente los mismos bytes que la ruta de gestión. Responses llevar a fuerte `ETag` — volver a pasar como `If-None-Match` para revalidar y obtener un `304` de la documento completo — y `Cache-Control: private, no-cache`, ya que el cuerpo se sienta detrás de un Credencial.

Una clave de plano de datos admitida aquí gana **nada** En el plano de gestión: `/api/catalog` y cada otro `/api/*` ruta todavía requieren el administrador token o una sesión de dashboard. El viejo
`/api/catalog` ruta sigue funcionando sin cambios para el panel de control y para los scripts que ya mantener un administrador token.

También puede configurarlo o editarlo a través de la administración API (`POST /api/custom-models`,
`PUT /api/custom-models/<id>` con un `displayName` string) y el panel web. A `/` es rechazada porque chocaría con el separador de balas enrutadas.

El nombre mostrado es **solo pantalla y estable a través de la regeneración**. Cada `ocx sync` y catálogo actualizar las entradas enrutadas de re-derivadas `config.json` (incluyendo `customModels`), por lo que la configuración El nombre se vuelve a aplicar en lugar de regresar a la babosa encaminada. Un reinicio del servicio administrado también intenta Esta sincronización poco después de que el proxy se une. Si la sincronización de arranque del mejor esfuerzo falla, por ejemplo durante un inicio de sesión sin conexión, el catálogo previamente persistente se conserva y el siguiente éxito `ocx sync`
Reaplica el nombre configurado. Nombres nativos originales (e.g. `gpt-5.6-sol` → "GPT-5.6-Sol") provienen de la instantánea de de origen anclada y nunca son anulados por una pantalla personalizada nombre.

<a id="external-provider-managers"></a>

### Gerentes de proveedores externos

Si `config.toml` Seleccione un proveedor que no sea `openai` o `opencodex`, OpenCodex deja el archivo sin cambios y omite escrituras de perfil, actualización de catálogo/caché, y tanto inmediata como en segundo plano Restauración de metadatos del historial Codex. Las herramientas que administran un proveedor personalizado a menudo etiquetan las sesiones existentes con eso. id proveedor; reemplazar el id activo puede hacer que esas sesiones intactas desaparezcan del historial de Codex vista. La misma protección se aplica a un proveedor externo seleccionado por un perfil raíz heredado.

Un proveedor externo posee `config.toml`, los configuración informan que
`GET /api/settings` y `ocx system settings --json` Devuelve una descripción del escritorio sin autorización y client-compaction switches — y el requisito de inicio de sesión Codex — controlado por eso proveedor en lugar de mostrar el estado efectivo que produciría OpenCodex. Voltear también switch sigue almacenando la preferencia, pero `config.toml` no se reescribe; el valor almacenado tiene efecto si cambia Codex de nuevo a un proveedor OpenCodex administra y vuelve a ejecutar `ocx start`.

Si `config.toml` existe pero no se puede leer (permisos, o un borrado de la lectura), el mismo informe retiene los valores efectivos y la respuesta de inicio de sesión como indeterminados en lugar de mostrar el estado OpenCodex calcularía localmente. El registro de aplicación mantiene esa explicación — incluyendo un salvamento cuya puerta de inyección ya está cerrada por una integración desactivada o un proxy detenido — y Esto es reintentable, así que un `ocx system settings --json` leer informes de la respuesta establecida una vez el archivo es legible de nuevo. Con la integración Codex desactivada, `ocx sync` es solo de catálogo y no puede aplicarlo.

Mantenga una herramienta como propietario de la configuración del proveedor Codex. Para usar OpenCodex detrás de un archivo existente gerente de proveedores, señale a ese proveedor en `http://127.0.0.1:10100/v1` con paso Responses (`wire_api = "responses"` en Codex TOML), no en la traducción Chat Completions. Cuando el proxy API auth es habilitado, también pasar `x-opencodex-api-key` Desde `OPENCODEX_API_AUTH_TOKEN`, igualando el no-loopback formulario de proveedor arriba. Para permitir que OpenCodex inyecte el enrutamiento directamente, primero cambie Codex de nuevo a su incorporado `openai` proveedor y eliminar cualquier usuario root `openai_base_url`y luego relanzar `ocx start`.

<a id="explicit-tool_search-troubleshooting"></a>

### Explícito `tool_search` solución de problemas

Las herramientas locales enrutadas tienen dos rutas de descubrimiento distintas. En el modo de código enrutado normal, Codex puede exponer diferido MCP/herramientas de la aplicación a través del oficial `exec` herramienta `tools` global y `ALL_TOOLS`; ese camino no requiere que el modelo vea o llame `tool_search`.

Por separado, `tool_search` es una superficie de descubrimiento Codex ejecutada por el cliente. No es un OpenCodex bandera de características, y un upstream `tool_choice: "auto"` El valor no lo crea ni lo habilita. OpenCodex puede retransmitir la superficie explícita solo cuando Codex ya incluyó una declaración como esta en el Solicitud Responses:

```json
{
  "tools": [
    { "type": "tool_search", "description": "Load deferred tools" }
  ]
}
```

Para los modelos locales/de chat enrutados, OpenCodex expone esa declaración como una función normal llamada
`tool_search`. Si el modelo lo llama, OpenCodex convierte la llamada a un Responses
`tool_search_call`; Codex ejecuta la búsqueda y proporciona las definiciones de herramientas resultantes en un más tarde `tool_search_output`. Las definiciones cargadas de esa manera están disponibles en el siguiente turno del modelo.

Compruebe el límite de fallos antes de cambiar la configuración del proveedor:

1. **No `type: "tool_search"` En la solicitud entrante:** el cliente/sesión Codex activo no Anunciar el explícito `tool_search` superficie. OpenCodex no puede inventar esa declaración. Esto no significa que las herramientas normales de modo de código no estén disponibles: compruebe si el modelo enrutado puede usar
   `exec` y descubrir la herramienta anidada necesaria a través `tools` / `ALL_TOOLS` Primero.
2. **La declaración entrante existe, pero no `tool_search` La función alcanza la petición enrutada:**
   capturar solo la lista de nombres/tipo de herramienta redactada y abrir un error OpenCodex. Nunca ata el portador, ID de cuenta, entrada de conversación, encabezados completos o cuerpo completo de la solicitud.
3. **La solicitud enrutada contiene `tool_search`Pero el modelo local nunca lo llama:** El relé es trabajando. Use un modelo/plantilla con llamadas a funciones confiables e instrucciones que explícitamente Decidle que busque una herramienta diferida que necesite. LM Studio's `tool_choice: "auto"` permite el uso de herramientas; no obliga al modelo a llamar a esta función.
4. **Una llamada se emite repetidamente o las herramientas cargadas nunca se vuelven utilizables:** Capturar lo redactado
   `tool_search_call` / `tool_search_output` tipos de elementos y llamadas. OpenCodex conserva ambos en El modelo debe ver la búsqueda completa en lugar de emitirla para siempre.

Véase [El analizador y el puente](/es/reference/architecture/#the-parser) para el mapeo explícito de cables. No hay una configuración de nivel de proveedor que pueda agregar un `tool_search` declaración; ordinario El descubrimiento en modo código sigue siendo una ruta separada.

<a id="cache-read-diagnostics"></a>

### Diagnósticos de lectura en caché

Establecer `OPENCODEX_CACHE_DEBUG=1` antes de iniciar el proxy para escribir un registro de diagnóstico por Solicitud Finalizada para `<config-dir>/cache-debug.jsonl`. El interruptor está desactivado por defecto; configúrelo en `0`
o eliminarlo para desactivar la captura. El archivo es solo para el propietario (`0600`) en el directorio de configuración endurecido y rueda después de 200 líneas, conservando las 100 más nuevas.

Cada registro JSONL contiene el protocolo, el proveedor/modelo enrutado, la presencia del contador de caché y procedencia, etiquetas de igualdad de proceso local para la cuenta, clave de caché de solicitud y sesión listada encabezados, además de huellas dactilares ordenadas para instrucciones, herramientas y bloques de mensaje / entrada. Prefijo Las secciones retienen como máximo 128 etiquetas e identifican solo la primera sección/índice divergente. Los diagnóstico nunca almacena mensajes de texto, nombres de herramientas, encabezados sin procesar, caché sin procesar/sesión/cuenta identificadores, o una etiqueta duradera derivada de ellos. Su clave aleatoria HMAC se crea al inicio del proceso, separada de otras claves de depuración, y nunca se mantiene; por lo tanto, las etiquetas comparan valores solo dentro de Un proceso proxy.

<a id="catalog-troubleshooting"></a>

### Solución de problemas de catálogo

Si falta un modelo en Codex, o si el orden/visibilidad del catálogo parece incorrecto, compruebe en orden:

1. **`selectedModels`** en el proveedor — una lista de permisos no vacía expone solo esos identificadores a Codex; vacío u omitido expone todos los modelos descubiertos. Un id que no está en la lista nunca llega a la catálogo.
2. **`disabledModels`** (nivel superior) — oculta los modelos del catálogo y `/v1/models`, y voltea desnuda nativa GPT slugs a `visibility: "hide"`.
3. **`liveModels: false`** — con `liveModels: false`, un vacío u omitido `models` listar las semillas configuradas `defaultModel`
   primero, seguido por `retainModels`; los ID duplicados se eliminan mientras se conserva la primera aparición. Un explícito no vacío `models` lista en lugar de semillas `models` seguido por `retainModels`, sin Agregando implícitamente una `defaultModel`. Ese valor predeterminado todavía se puede enumerar explícitamente en
   `models` o `retainModels`. Si ninguno de estos campos proporciona un id, la semilla estática está vacía. Este es el orden de la semilla, no una promesa del orden final del selector. `selectedModels`, `disabledModels` y La política de proveedores discapacitados sigue siendo aplicable. `authMode: "forward"` mantiene su rama separada y hace no utilizar esta semilla estática enrutada. Estas reglas no cambian el fracaso del descubrimiento en vivo.
4. **Cursor `GetUsableModels`** — el adaptador Cursor descubre modelos a través de su protobuf
   `GetUsableModels` RPC, no `/models`, por lo que un cambio en el lado Cursor puede alterar qué id son visibles independientemente de otros proveedores.
5. **Caché y `ocx sync`** Los catálogos en vivo de — se almacenan en caché durante unos cinco minutos (`modelCacheTtlMs`, predeterminado `300000`) Correr `ocx sync` para forzar un fetch nuevo y reescribir el catálogo inmediatamente.
6. **Ejecución de Codex `app-server`** — reescribir el catálogo en el disco no es suficiente, mientras que una larga vida Codex `app-server` (Hospedador de escritorio / CLI en segundo plano) mantiene la lista anterior en memoria. `ocx sync`
   y `ocx sync-cache` avisar cuando se detecten esos procesos. `ocx sync --restart-codex` reinicios esos procesos y cierra y vuelve a lanzar completamente la aplicación de escritorio Codex en macOS, Linux y Windows para que el selector vuelva a leer el catálogo. Para dejar la aplicación de escritorio en ejecución, pase
   `--restart-app-server-only` o detenga la coincidencia `app-server` Procesarse a sí mismo.

:::caution[Otros procesos locales que escriben la configuración]
El catálogo escribe (`opencodex-catalog.json`, `config.toml`) son atómicos **interior** opencodex, que solo evita archivos a medio escribir cuando dos escritores propiedad de opencodex compiten. Eso sí. **no** Detener a otro proceso local, observador de archivos o agente de sincronización de reescribir la visibilidad del catálogo u ordenar después de opencodex ha escrito. Codex mantiene su separación `models_cache.json` y puede refrescarlo independientemente, cambiando la lista visible sin reescribir `opencodex-catalog.json`. Si los modelos se voltean inesperadamente mientras proxy está ejecutando, deteniendo o reconfigurando a los escritores competidores, luego ejecuta `ocx sync` — esto es un riesgo de escritura externa, no un defecto confirmado opencodex.
:::

<a id="proxy-connection-errors"></a>

## Errores de conexión proxy

Si Codex reintenta y luego falla con un error como
`stream disconnected before completion: error sending request for url (http://127.0.0.1:10100/v1/responses)`
— o Claude Code informa de un error de conexión similar — el proxy opencodex no es Ejecutar: nada está escuchando en el puerto configurado, por lo que el cliente hace que raw error de conexión en sí. Reinicie el proxy:

```bash
ocx start              # foreground
ocx service install    # persistent: auto-starts on login and respawns on crash
```

`ocx status` muestra si el proxy se está ejecutando e imprime la misma pista de reinicio cuando no lo es; `ocx doctor` informa sobre el reinicio de la seguridad (servicio/cobertura del shim).

<a id="upstream-overload-before-any-output"></a>

### Sobrecarga ascendente antes de cualquier salida

Cuando el backend ChatGPT declina un giro Codex `server_is_overloaded` o otro error del servidor antes de que haya producido cualquier salida, opencodex reintenta la misma cuenta con un retroceso corto y limitado y luego mueve el turno a otra cuenta Pool elegible. Una cuenta anclada (un modelo calificado para la cuenta) se vuelve a probar pero nunca se mueve. Una vez que cualquier salida ha alcanzado Codex el turn nunca se envía de nuevo. Si se rechaza cada intento, Codex recibe el mismo error que habría recibido sin los reintentos. Las solicitudes compactas nativas se mueven a otra cuenta Pool en un error de servidor de la misma manera.

<a id="codex-autostart-shim"></a>

### Codex calza de inicio automático

Ejecuta `ocx codex-shim install` para instalar el envoltorio de lanzador opcional. Se ejecuta
`ocx ensure` antes de que Codex ordinario se inicie y luego reenvía los argumentos originales y el estado de salida. El comando también funciona con el `ocx` enviado en el escritorio paquetes: tanto la sonda de instalación como el contenedor instalado usan ese ejecutable, sin necesidad de una instalación Bun separada o una comprobación de fuente.

En macOS y Linux, active el envoltorio privado en su shell actual después de otra configuración de PATH. Con el inicio OpenCodex predeterminado, ejecute:

```sh
. "$HOME/.opencodex/codex-shell-env.sh"
```

Con un custom `OPENCODEX_HOME`, utilice el camino citado impreso por `ocx codex-shim install`. Agregue esa línea de origen después de otra configuración de PATH en su archivo de inicio de shell para activar futuros shells. OpenCodex no edita ese archivo ni cambia el shell principal. Las shims Unix heredadas en el lugar no son auto-migrar; correr `ocx codex-shim install` explícitamente para migrarlos.

Uso `ocx codex-shim status` para inspeccionarlo. En macOS y Linux, `ocx codex-shim uninstall`
elimina los archivos de superposición privados y deja intacto el Codex nativo. Windows mantiene en su lugar script wrappers; la desinstalación restaura el lanzador guardado. Ver la
[Referencia del ciclo de vida CLI](/es/reference/cli/lifecycle/#ocx-codex-shim-installstatusuninstallremove).

<a id="experimental-windows-desktop-compatibility"></a>

## Experimental compatibilidad de escritorio Windows

**Codex Establecer → Compatibilidad con equipos de escritorio** proporciona controles locales para una compatibilidad limitada prueba mientras conserva el inicio de sesión nativo Codex. Este es un relevo experimental, no una garantía que cada compilación Codex o estado de cuenta agotado puede recuperar su compositor.

1. Inspeccione el estado, prepare el certificado cifrado y revise su huella digital antes de Registrar la confianza. Windows puede pedir confirmación. La confianza se aplica a la Windows actual usuario y permite que el relé local `chatgpt.com` tráfico.
2. Comience la observación. Guardar borradores, cerrar Codex y luego usar **Abrir Codex** en este panel para lanzar la aplicación empaquetada con la conexión administrada. El panel nunca cierra por la fuerza una aplicación existente.
3. Solo después de observar el agotamiento elegible, **Ejecutar prueba de 3 minutos** Ofrece una cuenta separada en todo el consentimiento. Ajusta dos banderas de interfaz de usuario en la cuenta iniciada, no solo en el modelo seleccionado. El uso real, los créditos, las restricciones de gasto y los límites del servidor permanecen sin cambios. A producido La respuesta por sí sola no establece que el compositor se recuperó.

Una respuesta original que muestre el uso disponible o un estado protegido finaliza el juicio inmediatamente. Los créditos disponibles o la Reserva Luna activa también dejan la respuesta sin cambios y finalizan el ensayo. incluso cuando se agota el uso ordinario. Esto preserva el estado de derecho existente de la aplicación. Si el agotamiento elegible aparece de nuevo, se requiere otro juicio explícito; el consentimiento previo no reactiva silenciosamente la corrección.

**Volver a la observación** Desarma la corrección. Corrección de los límites de respuesta de tres minutos, No es el momento hasta que Codex actualiza su pantalla. Caducidad y retorno a la observación respuesta de uso fresco; la aplicación puede conservar su pantalla anterior hasta que llegue esa respuesta. El panel muestra esta limitación antes del consentimiento del juicio y mientras espera la respuesta original; no puede confirmar la actualización de caché de la aplicación. **Detener el servicio** cierra sus conexiones y se va el certificado para su reutilización; las conexiones activas pueden interrumpirse. Para renovación o remoción de fideicomiso, detener el servicio y cerrar Codex primero. La renovación prepara un nuevo certificado no confiable; revise el nueva huella digital antes de registrarla. Una acción incierta no se vuelve a intentar automáticamente. Los certificados están restringidos a la autenticación del servidor TLS. Si el estado muestra `renewal-required`, detenga el servicio y cierre Codex, luego renueve el certificado anterior antes de comenzar de nuevo. El nativo API URL Las direcciones IPv4 e IPv6 no son intercambiables aquí; ambiguo `localhost` Se rechazan los alias.
Codex's automático MCP Los cambios en el modelo, la autenticación, el perfil y el enrutamiento aún requieren un contexto de observación nuevo; el servicio no adopta silenciosamente esos cambios durante una prueba.

El servicio conserva su dirección PAC y puertos de conexión locales para su reutilización después de un reinicio. Con el mismo certificado de confianza, una aplicación ya configurada puede volver a conectarse a través de su caché. PAC; reiniciar el servicio nunca reanuda una prueba de corrección. Si un puerto guardado no se puede enlazar o los metadatos de conexión no son válidos, el inicio se niega en lugar de asignar silenciosamente otro dirección. El primer comienzo exitoso posee `codex-desktop-compatibility/connection.json` bajo el hogar OpenCodex. No elimine ese archivo como una solución de reinicio de rutina: una dirección diferente Requiere iniciar la aplicación con una nueva conexión administrada.

El soporte actual se limita a la compilación Windows evaluada. `26.924.2738.0`, basado en archivos nativos inicio de sesión. Los proxies HTTP/HTTPS y los proxies SOCKS5 autenticados se admiten a través de la función compartida política de salida; NO_PROXY puede seleccionar explícitamente una ruta directa. Las conexiones proxy no funcionan Volver a la salida directa. El modo de cliente administrado OpenCodex aún no es compatible con estos controles. Para este relé de escritorio, HTTP(S) `ALL_PROXY` También se aplica cuando `HTTPS_PROXY` es inestable. Un inválido
`HTTPS_PROXY` Rechaza la operación en lugar de volver a `ALL_PROXY`. Una aplicación desconocida crea una corrección de rechazos; la integración no parchea los archivos de la aplicación o cambiar al modo libre de inicio de sesión. La configuración raíz nativa y su perfil seleccionado deben enrutar `openai_base_url` a este proceso escucha de datos locales. Un proveedor, destino o anulación no admitida diferente rechaza Inicio de observación. Esta comprobación no determina el modelo seleccionado de una conversación o prueba que las anulaciones locales del proyecto están ausentes. Si el enrutamiento o la compilación de la aplicación instalada cambia durante un ensayo, la corrección se rechaza antes de la siguiente respuesta de uso; los controles periódicos también regresan un ensayo ocioso a la observación. Las respuestas originales y otro tráfico de aplicaciones continúan retransmitiendo. El reemplazo nativo del archivo de inicio de sesión o la rotación token también invalidan la prueba, incluso cuando el Devuelve la misma cuenta. Detener y comenzar la observación para vincular el inicio de sesión actual antes de otro prueba explícita; las respuestas antiguas no pueden autorizar la sesión de reemplazo. Cambios en la configuración raíz de Codex (excepto su tabla y formato de servidor MCP), configuración del proveedor, alias de modelo, perfiles de enrutamiento, Las rutas de reserva, compactación o modelo de memoria también invalidan el contexto de observación. Restaurando el anterior configuración no restablece su consentimiento: detener y comenzar la observación, a continuación, confirmar un nuevo ensayo cuando sean elegibles. Esto detecta los cambios en las rutas configuradas, no qué modelo de una conversación realmente selecciona; una configuración de proveedor mixto sin cambios no es prueba de aislamiento del proveedor.

Después de la preparación del certificado y un inicio manual exitoso, habilite **Reanudar la observación cuando OpenCodex comienza** en el mismo panel. La configuración opcional OpenCodex
`"desktopCompatibility": { "startOnProxyStart": true }` reanuda **Sólo observación** Cuando el modelo proxy comienza. Omisión o `false` Desactiva este inicio automático. Reutiliza los puntos finales guardados y certificado de confianza, nunca inicia Codex ni registra confianza, y nunca reanuda una prueba de Aplicar. La observación automática espera a que termine la sincronización de configuración de inicio. Fallo de sincronización o espera más de dos minutos deja la observación; inspeccione su estado y comience manualmente después resolver el problema de inicio. El proxy del modelo continúa siguiendo su propia política de preparación. Si faltan requisitos previos, la observación permanece desactivada y el proxy del modelo continúa ejecutándose. Guardar esta preferencia no inicia ni detiene el servicio actual. Utilice su servicio separado Controles para cambios inmediatos. Si no se puede confirmar un guardado, actualice su estado antes de volver a intentarlo.

Un servicio en ejecución no establece que Codex esté conectado a través de él. Un lanzamiento normal de la aplicación o un actualizador de aplicaciones puede omitir el argumento de conexión administrada. Guardar borradores, cerrar Codex y, a continuación, utilizar
**Abrir Codex** en este panel para restaurar esa conexión. Este control nunca cierra la aplicación para usted. Después de una actualización de Codex, una versión de aplicación no evaluada rechaza la corrección hasta que su compatibilidad es Revisado; reinstalar el certificado no hace que una compilación no evaluada sea compatible.

El panel también puede informar la última comprobación de compilación completada como metadatos de diagnóstico: el paquete versión contra la que se evaluó esta compilación, la versión del paquete observada en ese control, si coincidían, y cuando el cheque terminaba. Es una observación pasada, no una lectura en vivo de la paquete instalado. Una vez que el servicio se detiene, la aplicación se actualiza o una comprobación sigue ejecutándose o se ha realizado. interrumpido, puede retrasar la instalación real; solo una sonda completa lo actualiza y un
`verified` resultado describe el paquete observado en esa comprobación, no lo que está instalado ahora.

En Windows, un reinicio explícito de la aplicación completa OpenCodex conserva un bucle ya activo compatibilidad argumento PAC solo cuando el proceso actual OpenCodex posee la compatibilidad de servicio En entorno de ejecución. Se rechaza un punto final obsoleto o extraño antes de detener Codex; reemplazo del entorno de ejecución durante el reinicio también impide el relanzamiento administrado. La aplicación se inicia a través de la activación del paquete Windows. Se comprueba el identidad del paquete y argumento de enrutamiento después del lanzamiento; causa argumentos de enrutamiento de la aplicación principal ilegibles o conflictivos Rechazo antes del reinicio. Esto no permite un modo de compatibilidad, instalar un certificado, o ver y reiniciar la aplicación automáticamente. Lanzamientos normales sin ese argumento de enrutamiento keep su comportamiento existente.

<a id="transport-coverage-and-recovery-evidence"></a>

### Cobertura de transporte y evidencia de recuperación

El panel de compatibilidad informa de las respuestas de uso JSON/SSE comprobadas por identidad y actualmente flujos enlazados por separado de las conexiones abiertas. Estas son observaciones de retransmisión de por vida, incluyendo las solicitudes realizadas por los clientes de diagnóstico. No identifican el envío nativo probar que la aplicación actualizó su caché autorizado o probar la recuperación del compositor. No se agrega ningún cuerpo de solicitud, token, ID de cuenta o IP de origen a este estado de diagnóstico.

[Número .6196](https://github.com/lidge-jun/opencodex/issues/6196) reporta una construcción macOS cuya Las solicitudes de puerta autorizadas se originan en el servidor de aplicaciones Rust incluido y en la derivación de Chromium Configuración de PAC. Un PAC saludable, certificado o solicitud sintética no puede establecer la cobertura de ese transporte. Este experimento Windows no es una solución para ese bloqueador de diseño macOS.

Antes de agregar otra plataforma o transporte, documente y valide esta secuencia:

1. Identifique el proceso y el transporte reales que envían cada solicitud de puerta autorizada.
2. Demostrar que una solicitud de origen de aplicación llega al relé previsto, por separado de los clientes de prueba.
3. Verifique el esquema de respuesta y la ruta de caché/actualización de la aplicación para la compilación instalada exacta.
4. En el agotamiento natural de la cuenta, verifique la presentación del compositor original, proveedor independiente Finalización y conservación de inicio de sesión, chat, hilos existentes y conexiones remotas.
5. Verifique el comportamiento de apagado, lanzamiento ordinario, reinicio y actualización; no infiera uno de otro.

La política actual sólo `/backend-api/wham/usage` y su `/stream` punto final. Inicialización de conversaciones y otros puntos finales, incluyendo sus `blocked_features` y
`limits_progress`Su presencia no es un permiso para limpiarlos: pueden representar restricciones no relacionadas. Windows build's renderer-to-Electron (en inglés) fetch path no establece la ruta de red de un sistema operativo/construcción diferente o de cada aplicación-servidor RPCEl enrutamiento del servidor de aplicaciones requiere su propio diseño revisado; cambiar las URL del proveedor de modelos por sí solo no es prueba de que el tráfico de la cuenta, el inicio de sesión o el control remoto siga la misma ruta. Estos controles no instalan ningún envoltorio automático de servidor de aplicaciones, cambio de proxy global o reescritura de inicio de sesión.

<a id="routed-models-during-codex-reserve-mode"></a>

## Modelos encaminados durante el modo de reserva Codex

Codex Pool puede proteger opcionalmente las cuentas de grupo almacenadas en un uso seleccionado de 5 horas o semanal umbral. La cuenta de escritorio/principal mantiene su bloqueo separado del 98%. Establecer `codexPool.lowQuotaProtection` en la configuración para pausar cuentas, registrar un log-and-API alerta, o ambos; ver [configuración de enrutamiento](/es/reference/configuration/routing/#codex-pool-low-quota-protection). Una pausa tiene efecto para la siguiente selección inmediatamente, mientras que guardarla en el disco se aplaza. Las respuestas de cuota Pool pueden autorizar una pausa solo con el uso válido y una credencial capturada Eso sigue siendo actual. Una respuesta sin esa prueba puede actualizar el uso mostrado sin pausar una cuenta. Compruebe el servidor autenticado `GET /api/codex-auth/low-quota-events` historia para `logged`
alertas o guardar fallos. El curriculum vitae manual permanece en vigor para el episodio de cuota actual. Los La alerta predeterminada solo llega al registro y API. Añadir `actions.desktop: true` para mostrar también un macOS o Notificación Linux en la máquina que ejecuta el proxy; Windows permanece solo en el registro.

Cuando se agote la cuota de 5 horas de ChatGPT, Codex puede ofrecer un modelo de reserva (`gpt-reserve` / Reserva Luna). Mientras ese estado está activo, el selector de modelos Codex puede hacer
**cualquier otra entrada inseleccionable — incluyendo modelos enrutados opencodex**, aunque esos Ejecutar en proveedores independientes y credenciales y no consumir ninguna de la cuota agotada.

**Este es un comportamiento del cliente Codex que el enrutamiento proxy de modelo ordinario no puede cambiar.** El Estado de reserva llega desde el backend ChatGPT en la propia conexión autenticada del cliente, no a través de El proxy. Las encuestas de aplicaciones de escritorio `backend-api/wham/usage` y trata la reserva como activa cuando La respuesta lleva `rate_limit_upsell.banner_type = "luna_reserve"`, el primario
`rate_limit.allowed` es `false`, y `additional_rate_limits[]` Contiene una entrada con
`limit_name = "gpt-reserve"` Eso todavía está permitido. Mientras eso se mantiene, la aplicación obliga a El modelo de conversación para `gpt-reserve` y reescribe cualquier otra elección a ella — el El selector es contraído a la entrada de reserva por el cliente, y un `model =` valor en
`config.toml` Se reemplaza de la misma manera. Nada de esto consulta el catálogo de modelos, por lo que no La representación de nuestro lado participa en la decisión. opencodex no tiene concepto de reserva para ajuste, y la alternativa — informar mal su propia cuota a su propio cliente — sería un bicho peor que el que cubría.

**Solución:** Los modelos en sí permanecen completamente utilizables; solo el modelo de la aplicación Codex La selección está cerrada. Llegar a ellos desde un cliente que no consulta el uso de ChatGPT instantánea:

- Claude Code a través del proxy (`ocx claude`).
- Cualquier cliente HTTP contra el local `/v1` punto final.
- Las propias rutas de solicitud del panel.

El comportamiento normal del selector vuelve cuando se restablece la ventana de 5 horas.

**Lo que el proxy responde mientras ese estado se mantiene.** Una vez que la aplicación se ha colapsado, el selector que envía
`gpt-reserve`, y sin el [opt-in de escritorio authless](#authless-codex-desktop-opt-in) opencodex no tiene derecho de reserva para enviar con él. Esta solicitud solía ser enviada como un modelo nativo y volver como el propio upstream `The usage limit has been reached`, cuyos nombres ni la verdadera causa ni el escenario que lo cambiaría. Ahora se rechaza localmente con un HTTP 400 que dice `codexDesktopAuthless` está apagado y da el comando que lo enciende (`ocx system settings --desktop-authless on`) Nada se envía de origen y no se gasta ninguna cuota.

El rechazo es deliberadamente estrecho. Se aplica solo a `gpt-reserve` en una solicitud de loopback-admitida que alcanzaría la ruta canónica ChatGPT. A `gpt-reserve` El selector que tiene el operador alias o enrutado a otro proveedor sigue funcionando, una solicitud admitida en un oyente no loopback En el caso de que se utilice un proxy, `client` El rol runtime no cambia. Habilitar el opt-in restaura el camino normal de la Reserva en lugar del rechazo.

<a id="the-subagent-picker"></a>

## El selector de subagentes

La sincronización de catálogos pone a disposición de Codex los modelos de subagentes seleccionados; ver [Codex Selector de modelos de aplicaciones](/es/guides/codex-app-models/#subagent-selection) para el pedido del recolector y [Interfaz de subagentes](/es/guides/sub-agent-surface/) para la delegación v1/base/v2 y el comportamiento de reserva.

<a id="codex-account-warmup"></a>

## Codex calentamiento de la cuenta

Cuando a ChatGPT se agrega o reautentica la cuenta, OpenCodex normalmente lo verifica antes de guardarlo con una pequeña solicitud de transmisión al Codex Responses Esperando por el éxito. `response.completed`, por defecto `gpt-5.6-luna`, y reintentos con `gpt-5.5` en HTTP 400 o HTTP 404. Los errores públicos contienen categorías de fallos fijos en lugar de cuerpos de respuesta ascendentes sin procesar.

Un HTTP 429 de un intento de calentamiento se reporta como `codex_warmup_rate_limited`. Vuelva a intentar después de que se elimine la restricción temporal o se restablezca el límite de uso; iniciar sesión nuevamente no restablece estos límites. Un intento fallido de calentamiento no agrega una nueva cuenta ni reemplaza las credenciales existentes. Esto difiere del registro diferido confirmado por cuota a continuación, que puede guardar una cuenta restringida sin una solicitud de modelo. Los errores HTTP 401/403 conservan la guía de autenticación.

Si la búsqueda de uso autenticada de la nueva credencial OAuth confirma una cuota agotada de 5 horas, semanal o mensual, la cuenta se guarda sin esta solicitud de modelo y muestra **Validación pendiente**. No puede servir solicitudes de grupo, incluso después de reiniciar o actualizar token. Una vez que la cuota se recupera, **Actualizar las cuotas** Finaliza la validación: una lectura de uso fresca y completa con espacio libre permite una pequeña solicitud de modelo, y solo una respuesta completa habilita la cuenta. Las lecturas fallidas o incompletas y la validación fallida preservan la restricción. Las encuestas de cuentas pasivas no activan la validación diferida. El uso desconocido durante el registro inicial conserva la puerta de calentamiento normal.

`ocx account refresh openai` y `ocx account list openai --quota --refresh` Solo lee el uso. La validación del modelo gasta cuota y requiere una sesión de panel humano: abrir `ocx gui` y haga clic **Actualizar las cuotas** después de la recuperación. Para un host sin cabeza, acceda a su panel de control desde su navegador; un administrador token solo no autoriza la validación. La validación se puede completar mientras una cuenta está en pausa sin reanudarla o seleccionarla. Los errores de autorización del modelo permanecen visibles hasta que la validación o re-autenticación exitosa los borra.

En **Codex Set → Multi-auth**, habilite el **Créditos Codex** En el **Codex Autonomía** encabezado para mostrar los últimos créditos observados de cada cuenta principal y de grupo directamente debajo de la semana. Está desactivado por defecto y persiste como `showCodexCredits`. El saldo es un número con formato local, con advertencia ilimitada o de exceso cuando se informa; la barra indica disponibilidad, no un porcentaje, porque no se proporciona ningún límite de crédito total. Solo se muestran los cambios de ocultación de créditos, y un nuevo inicio de sesión espera su propia observación.

Cuando una cuenta llega al 100% en una ventana de uso y aún tiene créditos, la parte superior sigue sirviéndola y obtiene el saldo. OpenCodex no permite que eso suceda de forma predeterminada: una cuenta al 100% se apaga mientras su ventana semanal o mensual (solo mensualmente en planes de 30 días) o su ventana de 5 horas está llena, y se usa nuevamente una vez que se restablece esa ventana. El orden de las otras cuentas no cambia, y cuando no hay otra cuenta disponible, la selección no encuentra nada en lugar de gastar créditos. Una solicitud para la cuenta principal se rechaza como un rechazo de bloqueo duro hasta el restablecimiento. Una ventana completa de 5 horas sin un tiempo de reinicio mantiene una cuenta solo mientras esa lectura está fresca. Permitir que la cuenta principal no levante su bloqueo duro (encendido por defecto al 98%), lo que aún lo detiene primero; apague el bloqueo si la cuenta principal debe gastar créditos (un bloqueo al 100% todavía lo detiene al 100%). Para que las cuentas sigan funcionando de sus créditos, active **Usar créditos** al lado de la **Créditos Codex** cambiar en el encabezado Auth Codex. El interruptor permite todas las cuentas. Para elegir las cuentas una por una, abra una tarjeta de cuenta **⋯** menú y uso **Usar créditos después del límite** allí; el interruptor de encabezado muestra una posición media cuando solo algunas cuentas están activadas. Una cuenta que se le permite gastar lleva un **Utiliza créditos** insignia en su tarjeta. Comienzan nuevas cuentas. La elección se almacena en `creditCodexAccountIds` y nunca reembolsa los créditos; el **Créditos Codex** display switch solo muestra los saldos y nunca cambia el enrutamiento.

En el caso de una cuenta principal con acceso opcional y sin pausa y con una ventana de uso completa, el ciclo de recuperación en segundo plano renueva las observaciones de crédito a plazos a partir de los tres minutos de edad, incluso cuando el panel de control está cerrado. Prepara un token válido antes de la búsqueda de uso autenticado para que el saldo pueda observarse nuevamente antes de su límite de frescura de cinco minutos. Los créditos faltantes, nulos, restringidos o retractados mantienen la cuenta elegible para búsquedas de recuperación bajo el reintento de retroceso existente. Las solicitudes siguen siendo rechazadas hasta que se observe un nuevo saldo positivo o créditos ilimitados. `has_credits` Los recuentos de mensajes solos o aproximados no prueban un saldo gastable. Con el consentimiento, esta negativa de crédito-evidencia `Retry-After` es como máximo cinco minutos, o un reinicio de la cuota incluida más pronto; sin consentimiento todavía sigue el reinicio de la cuota incluida. Una búsqueda fallida o incompleta no actualiza la evidencia de equilibrio anterior. El bloqueo duro de la cuenta principal separada, la cuarentena por necesidad-reauth y los retrasos de reintento de origen aún se aplican. Esta búsqueda de metadatos no envía una solicitud de validación de modelo ni establece o borra el estado de área de necesidades de la cuenta.

La revalidación de fondo es separada y desactivada por defecto. Requiere Token Guardian, el `openai` proveedor `proactive` política de actualización, y `tokenGuardian.codexWarmupEnabled`. Se salta las cuentas a la espera de la validación de registro diferido.

<a id="after-a-chatgpt-plan-upgrade"></a>

### Después de una actualización del plan ChatGPT

Actualizar la cuota de la cuenta principal en Auth Codex después de cambiar su plan ChatGPT. Cuando el La respuesta de uso autenticada confirma que una ventana larga ha reemplazado la ventana de cinco horas, opencodex elimina la lectura antigua de cinco horas tanto de la admisión de solicitudes como de la selección de cuentas. Una respuesta permitida con ventanas primarias y secundarias puede omitir la ventana terciaria opcional. Esta recuperación utiliza la asignación del plan incluida y no requiere habilitar **Usar créditos**. Los datos de uso parciales o no válidos retienen el bloque anterior hasta que se confirma la recuperación.

<a id="cancelling-main-account-device-reauthentication"></a>

### Cancelación de la reautenticación del dispositivo de la cuenta principal

Cuando se cancela la reautenticación del dispositivo de la cuenta principal, un fallo temporal de red o DELETE, o una respuesta con un estado desconocido o no terminal, mantiene el flujo activo y la indicación de falla de cancelación para que se pueda volver a intentar la cancelación. El sondeo de estado normalmente continúa, por lo que aún se puede detectar un inicio de sesión que se complete. Si un fallo de cancelación reintentable se superpone a una respuesta de estado non-2xx GET mientras el flujo está `pending` o `committing`, cualquier orden de respuesta conserva el reintento de cancelación en ese mismo flujo, con su último código de dispositivo proporcionado por el servidor, verificación URL y fase. El error GET HTTP aún deja de ser encuestado, pero la cancelación se puede volver a intentar sin iniciar un segundo inicio de sesión POST. Una terminal `failed` La respuesta libera el flujo y muestra la razón de fallo normalizada; solo `succeeded` Informes de inicio de sesión exitoso. A confirmado `cancelled` La respuesta libera el flujo para que se pueda iniciar un nuevo inicio de sesión del dispositivo. Una respuesta definitiva de HTTP 404 con código `unknown_flow` también libera el ID de flujo vencido para que se pueda iniciar un nuevo inicio de sesión del dispositivo, pero no informa un inicio de sesión exitoso o una cancelación confirmada. Las respuestas POST tardías, GET o DELETE de un flujo anterior no pueden cambiar el nuevo flujo ni informar el éxito del inicio de sesión.

<a id="why-an-account-stopped-serving-requests"></a>

### Por qué una cuenta dejó de servir solicitudes

Cuando una cuenta deja la selección de grupo, la razón viaja con la decisión en lugar de ser recalculada para su visualización, por lo que una superficie nunca puede informar una cuenta saludable mientras el enrutamiento la está abandonando. `GET /api/codex-auth/accounts` lleva `reauthReason` al lado `needsReauth` En cada cuenta: `missing_credential` por una credencial que nunca fue almacenada, `refresh_failed` para una actualización de credenciales que sigue fallando, y `quota_unauthorized` cuando la propia búsqueda de uso fue rechazada.

Una actualización de la cuenta principal que no se completa aún responde `503` con `Retry-After`, porque un reintento todavía puede tener éxito. El mensaje ahora agrega que un fallo que persiste significa que la cuenta principal necesita reautenticación, en lugar de solo pedir otro intento.

<a id="optional-idle-window-steering"></a>

### Dirección de ventana inactiva opcional

`codexPool.startIdleWindows` es un booleano opcional y por defecto `false`. Cuando se activa, una nueva La solicitud real no vinculada podrá ser colocada en una cuenta elegible cuya ventana de cupos cortos observados esté al 0% con evidencia de que su reloj de cinco horas no ha comenzado. Esta comprobación va después de la conversación y la afinidad familiar, por lo que un La vinculación sigue siendo autorizada; también gana un pin de cuenta explícito o una preferencia de cuenta manual. Se omiten los ámbitos de cuota del modelo independiente y el cursor activo compartido no cambia. Después de la opción de ventana inactiva, la selección de estrategia normal se reanuda para otras conversaciones.

La observación no debe ser mayor de cinco minutos, y la ventana corta debe ser explícitamente 18.000 segundos. Su reinicio debe ser observado dentro de los 60 segundos de `observation + 5h` (en lugar de un tic-tac o un restablecimiento transcurrido). Un síncrono, process-local reservation evita selecciones duplicadas para la misma cuenta y ventana. Los El plazo de reserva es de al menos 5 horas más un minuto después de la selección; una observación fresca es requerido después de esa fecha límite antes de que la misma cuenta pueda ser dirigida nuevamente. Las reservas se borran cuando el proxy El proceso se reinicia y nunca se mantiene en disco.

Habilitarlo en su configuración existente:

```json
{
  "codexPool": { "startIdleWindows": true }
}
```

Si ninguna cuenta cumple con los criterios, se aplica el enrutamiento ordinario. Esta característica solo dirige una solicitud entrante real. No crea ninguna petición sintética ni temporizador.

<a id="keeping-a-downgraded-account-out-of-rotation"></a>

### Mantener una cuenta degradada fuera de rotación

`codexPool.excludedPlans` enumera las claves de plan que la selección automática de grupo omite, emparejadas insensiblemente a las mayúsculas y minúsculas contra el plan almacenado en cada cuenta. Está ausente por defecto, por lo que una instalación existente gira exactamente como antes.

```bash
ocx config set codexPool '{"excludedPlans":["free"]}'
```

Esta es una política de selección, no un bloqueo. Una cuenta excluida mantiene su credencial, historial de cuotas y afinidad de hilos, permanece visible en la superficie de la cuenta y aún se puede acceder a ella mediante una selección explícita de la cuenta, como `work/gpt-5.5`. Lo que cambia es que la rotación automática deja de elegirla, incluso cuando ya está activa o ya está vinculada a un subproceso —, que es el estado que deja una suscripción caducada.

La cuenta principal de Codex permanece exenta de la exclusión del plan; el enrutamiento solo de selección no lee su credencial nativa vallada. Si se excluyen todas las cuentas de grupo elegibles, la selección automática no devuelve ninguna cuenta. Las rutas con calificación de cuenta explícita permanecen disponibles y aún imponen pausa, autenticación y derecho de modelo. La tarjeta de cuenta y CLI muestran el plan de enrutamiento excluido por separado del estado de la credencial. No hay ninguna `minimumPlan` porque los nombres de los planes no definen un orden total.
<a id="restoring-native-codex"></a>

## Restauración de Codex nativo

`ocx stop` detiene el proxy y cualquier servicio en segundo plano instalado, luego intenta restaurar Codex nativo. OpenCodex elimina los artefactos de enrutamiento verificados e informa de una restauración incompleta cuando no puede recuperar archivos de configuración de forma segura.

La recuperación puede requerir una revisión manual cuando la revista no puede verificar los archivos actuales. [recuperación sin hashes de inyección](#recovery-without-injection-hashes).

```bash
ocx stop       # stop the proxy + service, restore native Codex
ocx restore    # restore without stopping  (alias: ocx eject)
ocx restore back # point plain Codex at the running proxy again
```

Cuando opencodex se ejecuta como un [servicio de fondo](/es/reference/cli/lifecycle/#background-service), se establece
`OCX_SERVICE=1` Un reinicio impulsado por el servicio hace **no** thrash el Codex config — solo un explícito
`ocx stop` / `ocx service stop` restaura Codex nativo.

<a id="recovery-without-injection-hashes"></a>

### Recuperación sin hashes de inyección

El diario guarda el original `config.toml` y `opencodex.config.toml` Más hashes del estado OpenCodex inyectado. Un diario heredado o una interrupción antes de que se registraran esos hashes no pueden ser eliminados. probar que el contenido del archivo posterior pertenece a OpenCodex. Si alguno de los archivos difiere de su original guardado y carece de su propio hash de estado inyectado, recuperación automática del diario y falla en el informe de restauración nativa sin cambiar ni el archivo ni la revista. El original guardado permanece disponible para la comparación; revisarlo junto con los archivos actuales antes de elegir una acción de recuperación manual.

Los archivos que ya son iguales a sus originales guardados se aceptan sin reescribirlos. Un archivo que falta es distinto de un archivo vacío. Los hashes inyectados verificados aún permiten la restauración normal de las instantáneas. y ediciones posteriores en configuración respaldadas por hash conservan el comportamiento de limpieza de campo propio existente.

Sincronización y `ocx restore back` también rechazan una configuración enrutada existente cuyo diario no coincide con el valor basal previo a la inyección. Esto evita que se coloque un nuevo hash de inyección. a un original más antiguo. Una configuración genuinamente nativa se puede guardar como una nueva línea de base antes de inyección. El comportamiento explícito de exclusión voluntaria del proveedor externo no cambia.


<a id="sub-agent-fallback-and-v2-compatibility"></a>

### Subagente de reserva y compatibilidad con V2

En **Subagentes → Configuración de delegación**, edite la cadena de reserva ordenada y su intervalo de sondeo de disponibilidad (5000–600000 ms), luego guárdela por separado de la lista destacada. Un destino configurado que ya no se anuncia permanece en la cadena hasta que lo elimine. La lista y la cadena de reserva son configuración separadas; este editor no hace que la lista reemplace la política de reserva.

Cuando un modelo preferido enrutado puede recibir trabajo V2 de un padre nativo ChatGPT, el panel explica la limitación de tareas cifradas ascendentes. Las tareas legibles de los padres enrutados no se ven afectadas. La orientación utiliza `/api/v2` modo y estado de pin V1 nativo; el API actual no expone la activación de recuperación o la elegibilidad específica de la solicitud, por lo que el panel informa que son desconocidos. La delegación V1/plaintext-compatible sigue siendo una alternativa. La recuperación experimental de V2, donde es elegible y explícitamente habilitada, agrega uso de cuota, latencia, dependencia del backend y posible pérdida de fidelidad; no repara el protocolo ascendente. Véase [superficies de subagentes](/es/guides/sub-agent-surface/) y [La limitación de origen](https://github.com/lidge-jun/opencodex/issues/92).

<a id="paginated-history-safety-refusal"></a>

## Historial paginado de rechazo de seguridad

Cuando una tienda de historial afectada admite registros paginados, la transición de un proveedor puede regresar. `history_paginated_requires_native_writer`. Esa razón ya no rechaza la configuración Codex, el perfil de referencia o el catálogo de modelos. `ocx sync` y `ocx start` todavía escribir esos archivos y establecer `model_catalog_json`, por lo que el selector de modelos Codex sigue mostrando todos los modelos con enrutamiento OpenCodex. Solo esta es la única razón por la que el historial de conversaciones se vuelve a etiquetar, porque Codex asigna ordinales de implementación paginados en su propio escritor y no cambia eso. Cualquier otra razón de pre-vuelo historia — una base de datos de estado ilegible, un despliegue cuya identidad cambió, o un pre-vuelo que no podía ejecutar — todavía rechaza toda la transición y lo devuelve, porque esos pueden tener éxito en un intento posterior. OpenCodex nunca modifica los archivos de despliegue paginados o las filas de hilos en este estado. Las conversaciones existentes mantienen el proveedor con el que ya están etiquetadas y no se migran; las nuevas conversaciones se enrutan normalmente a través del proxy. Cuando se retira la etiqueta, a `[model_providers.opencodex]` La tabla que la casa ya tenía se mantiene en lugar de retirarse, incluso en la forma de anulación de raíz (loopback), por lo que las conversaciones cuyas filas están etiquetadas `opencodex` mantener un identificador de proveedor que todavía existe. Esto incluye filas heredadas en una tienda con capacidad de migración. Las impresiones CLI `Codex resume history: left to Codex's native writer (history_paginated_requires_native_writer)`.

Al volver al formulario de anulación de raíz, OpenCodex conserva una `[model_providers.opencodex]` definición antes de realizar la configuración, incluso si el historial pasa actualmente. Esto mantiene más viejo `opencodex` conversaciones solucionables si Codex migra el historial después de ese commit o mientras se inicia el trabajador en segundo plano. Las nuevas conversaciones aún usan el proveedor raíz seleccionado; la restauración explícita mantiene sus protectores de eliminación separados.

`ocx restore`, `ocx stop` y `ocx uninstall` Ya no se niegan a `history_paginated_requires_native_writer`. Toman cada clave de enrutamiento raíz OpenCodex y mantienen la `[model_providers.opencodex]` definición en el disco, por lo que las conversaciones cuyas filas todavía nombran ese proveedor siguen resolviendo mientras se `codex` Deja de apuntar al proxy. El resultado se informa como una restauración parcial que nombra las líneas retenidas, y `ocx restore --remove-codex-provider-table` También los elimina, después de lo cual esas conversaciones dejan de abrirse.

Habilitar la integración en su formulario de tabla de proveedores en un hogar cuyo `openai`-etiquetado conversaciones Codex ya ha paginado solía ser rechazado directamente con `history_paginated_openai_requires_native_writer`: no se escribió nada y la integración quedó deshabilitada. OpenCodex ahora completa esa transición manteniendo la raíz administrada `openai_base_url` Anular al lado del `[model_providers.opencodex]` mesa. Codex fusiona la anulación en su `openai` proveedor, por lo que esas conversaciones siguen llegando al proxy sin ser reetiquetadas y no se toca ningún byte de despliegue o fila de hilos. Solo un formulario de enrutamiento que requiere el `x-opencodex-api-key` cabecera de admisión todavía se niega, porque el proveedor incorporado de Codex no puede llevar esa cabecera; sus nombres de mensaje los dos configuración que resolverlo — ruta Codex a través del loopback oyente por lo que la anulación puede ser retenido, o establecer `syncResumeHistory` a `false` aceptar que esas conversaciones se reanuden contra el propio punto final Codex de OpenAI.

<a id="remote-thread-list-provider-filters"></a>

### Filtros de proveedor de listas de hilos remotos

El enrutamiento de tabla de proveedor cambia el ID de proveedor predeterminado para que las nuevas conversaciones `opencodex` mientras El historial que no se puede volver a etiquetar de forma segura puede permanecer etiquetado `openai`. Algunos nativo app-server/mobile versiones tratan a un omitido `thread/list.modelProviders` como el proveedor predeterminado actual solamente, para que esas conversaciones existentes puedan desaparecer de esa lista remota aunque su fila de base de datos y el despliegue están intactos. Un cliente de lista compatible puede enviar `modelProviders: []` Para solicitar todo proveedores. OpenCodex no puede volver a escribir ese RPC porque el cliente remoto habla directamente con el Codex App-Server nativo en lugar del proxy de inferencia.

`ocx sync` y `ocx start` incluir la advertencia cuando se aplica una ruta de mesa del proveedor. Si a usuario-propiedad raíz URL envía el comando por la rama sin enrutamiento, el CLI omite la advertencia. En cliente-modo de compactación, el CLI puede retener ese URL, aplicar el `opencodex` tabla de proveedores, y Incluya la advertencia. El panel de control muestra una sugerencia de preferencia separada cuando cualquiera de las opciones está habilitada. Aparece una vez si ambas configuración están habilitadas, independientemente de la raíz URL. Los informes de sugerencias habilitados preferencias; esto no significa que Authless Desktop sea efectivo en la ruta actual. Escritorio Authless se aplica solo al enrutamiento efectivo sin bucle de retorno y se ignora para el enrutamiento de cliente remoto o oyentes que requieren un encabezado de admisión. La advertencia no es una migración: OpenCodex no edita etiquetas de proveedor simplemente para influir en un filtro de lista del lado del cliente. Verifique la conversación en Codex nativo y la versión app-server/client; no reescriba el historial paginado para hacer que una lista remota lo incluya.

No reescriba una implementación paginada activa o una fila de hilos para migrar esas conversaciones usted mismo. Cierre la conversación afectada antes de cualquier recuperación e informe el error exacto y las versiones sin cargar el historial privado. Una copia de seguridad o un script exitoso por sí solos no prueban que la conversación sea visible nuevamente. Compruebe la conversación restaurada en Codex después de reabrir.

<a id="experimental-native-mid-turn-steering"></a>

## Dirección a mitad de giro nativa experimental

Para un modelo compatible en la ruta canónica de reenvío ChatGPT y un cliente que envía `response.steer`, habilita ambas opciones en `~/.opencodex/config.json` y reiniciar OpenCodex antes de comenzar un nuevo giro:

```json
{
  "websockets": true,
  "codexNativeSteering": true
}
```

Fusione estas claves en la configuración existente; no reemplace la configuración de su proveedor/cuenta. Esta opción está desactivada por defecto. Reenvía la dirección al mismo WebSocket nativo configurado explícitamente conexión y la cuenta seleccionada, preservando las respuestas automáticas sucesoras y pendientes continuación de saved-tool-result. Aceptación significa en cola, aún no aplicada.

Suministrar los resultados de la herramienta requerida o las decisiones de aprobación **Una vez por padre**, en el mismo carril. Los resultados pueden llegar antes `response.steer.pending`: el relé también coincide con el completado llamadas y aprobaciones anunciadas por los padres. A `name` en un stub de salida de función pendiente es opcional en el resultado, como en el esquema nativo. Los mensajes de usuario adicionales pueden acompañar estos resultados; se rechazan los mensajes del sistema/desarrollador, los resultados duplicados y los identificadores de llamadas no relacionados. No vuelva a ejecutar las herramientas ni reenvíe el texto de la dirección aceptado. Las declaraciones de modelo, cuenta, herramienta y enrutamiento permanecen sin cambios. Configuración de generación validada puede cambiar en una continuación explícita de resultados guardados como se describe a continuación. Otros cambios requieren un giro explícitamente detenido o terminado y un nuevo envío normal. Múltiples conversaciones independientes utilizan conexiones independientes.

HTTP fallback, puertas de enlace no canónicas, rutas públicas API-key, modelos traducidos, sidecars, intentos Combo y texto sin formato V2 La restauración no admite esta opción. No añade capacidad de dirección a un modelo o Un cliente que no lo tiene. Las rutas no soportadas devuelven un error de protocolo en lugar de hacerlo de forma silenciosa. Ignorar la entrada. La entrega desconectada o con tiempo de espera puede ser desconocida: nunca automáticamente volver a enviar herramientas o texto de dirección. Los controles pendientes tienen plazos absolutos de confirmación de 90 segundos por presentación; Las esperas guardadas tienen un límite de 30 minutos.

La implementación tiene protocolo sintético y cobertura de regresión, no Astra / cliente en vivo Certificación. Mantenga la opción desactivada para el trabajo de producción hasta que su ruta cliente / modelo ha sido verificada. Establecer `codexNativeSteering` a `false` y reiniciar para restaurar el Relé de respuesta única; no es necesario eliminar archivos de cuenta o conversación.


<a id="steering-confirmation-deadlines-and-retained-context"></a>

### Dirección de los plazos de confirmación y contexto retenido

Cada dirección enviada tiene una ventana de acuse de recibo fija de 90 segundos. Otros productos y los novillos adicionales no lo extienden. Una vez aceptado, la entrada permanece en cola mientras que la respuesta actual alcanza un límite seguro; Todavía se aplica. Después de que la respuesta termina, el sucesor debe comenzar dentro de los 90 segundos. Una solicitud de resultados o aprobación de la herramienta permite 30 minutos desde el primer notificación. Los avisos repetidos no renuevan esta espera. Presentación de resultados guardados inicia una nueva ventana sucesora de 90 segundos, que incluye controles locales de marcapasos/auth. Los reconocimientos que faltan siguen sujetos a sus plazos individuales anteriores.

La conexión propia no tiene un límite de vida absoluto. Hasta 128 respuestas pueden compartirlo, y cada uno puede consumir legítimamente su propio reconocimiento, sucesor, flujo inactivo y entrada requerida. espera, por lo que los plazos por etapa anteriores componen el peor caso del orden de decenas de horas. Durante ese tiempo, el turn tiene un socket físico y una credencial anclada que no puede rotar. porque el canal deliberadamente nunca vuelve a entrar en la selección de cuenta. Trate una dirección habilitada conexión como un recurso de sesión de larga duración en lugar de una solicitud limitada ordinaria.

Los marcos de dirección también comparten los límites de cuerpo y memoria configurados del proxy. Un marco de control arriba
[`maxInboundBodyBytes`](/es/reference/inbound-body-admission/) Es rechazado antes se analiza en una conexión de control establecida (una trama inicial todavía se analiza antes de se aplica su límite basado en el tipo), y el cuerpo reconstruido enviado de origen se rechaza cuando excede
[`maxUpstreamBodyBytes`](/es/reference/configuration/providers/). Cada El diario de reproducción de la conexión tiene un límite de 32 MiB y se cuenta como estado anclado contra
[`appOwnedMemoryBudgetMb`](/es/reference/configuration/server/); admitiendo a journal degrada los cachés desalojables primero en lugar de fallar, y el agregado a través de revistas en vivo Tiene un límite de 128 MiB independientemente del presupuesto configurado.

Un tiempo de espera significa **La entrega es desconocida**El servidor no rechazó la entrada. No vuelva a enviar una instrucción aceptada ni vuelva a ejecutar una herramienta automáticamente. Inspeccione el estado de la tarea real antes de decidir cómo reanudarla. Sin cambio de cuenta o API pagado Se realiza el fallback. La salida completada ya recibida en el cable se retiene para el historial de continuación local, incluso cuando el resumen del terminal lo omita. Conflictos El contenido u orden de los elementos causa un fallo explícito en lugar de una pérdida de contexto silenciosa.

Para una comparación en vivo, use la misma versión, modelo y cuenta de cliente compatibles en conversaciones de prueba aisladas, una vez sin el proxy y una vez con él habilitado. Use una tarea de solo lectura, dirija mientras la salida está activa y compare la aceptación y el La verdadera adhesión de instrucción del sucesor. Repita mientras se obtiene una herramienta sintética o La aprobación está pendiente y después de una desconexión explícita. Registrar solo tipos de eventos, tiempos relativos y resultados redactados, no credenciales o cuerpos de tareas. Pasando simulacro Las pruebas de transporte no establecen soporte en vivo para el cliente / backend; no hay cuenta real La prueba de humo está implícita en estas instrucciones.

<a id="experimental-native-function-result-injection"></a>

## Inyección experimental de resultado de función nativa

Para un cliente compatible que envía OpenAI multiagente `response.inject` mensajes, combinar estas claves en la configuración OpenCodex existente y reiniciar antes de Un giro fresco. No reemplace la configuración de su proveedor o cuenta:

```json
{
  "websockets": true,
  "codexNativeInjection": true
}
```

La inicial `response.create` debe incluir explícitamente `"multi_agent": { "enabled": true }`. OpenCodex no lo habilita basado en un nombre de modelo. Un proveedor público OpenAI API debe usar `adapter: "openai-responses"`, `baseUrl: "https://api.openai.com/v1"`, su autenticación normal API-key y `upstreamWebsocket: true`. Ruta de la inicial modelo a través del prefijo configurado de ese proveedor. El relé añade el requerido
`responses_multi_agent=v1` beta token en esa conexión pública API solamente, preservando otros configurados beta tokens. No sustituye una credencial de suscripción, cree una cuenta API o cambie automáticamente a una cuenta API facturada por separado.

Las conexiones directas Canonical ChatGPT pueden optar por el mismo transporte experimentalmente, pero el contrato público API lo hace **no** establecer la suscripción a ChatGPT o a Codex Compatibilidad con App/CLI. Todavía se requiere un modelo ascendente compatible y un modo de ejecución. Ver la [Protocolo multiagente OpenAI](https://developers.openai.com/api/docs/guides/responses-multi-agent).

Devuelve un resultado de la herramienta guardada después de que se haya completado la llamada a la función de desarrollador correspondiente:

```json
{
  "type": "response.inject",
  "response_id": "resp_example",
  "input": [
    { "type": "function_call_output", "call_id": "call_example", "output": "saved result" }
  ]
}
```

Utilice los identificadores de respuesta/llamada de la **La misma conexión**, no estos ID de ejemplo.
`response.inject` acepta valor de cadena `function_call_output` Sólo. Usuario/sistema mensajes, arrays de salida enriquecidos, resultados de herramientas alojadas y `response.steer`
No son aceptados por esta operación. La continuación más amplia del resultado guardado a continuación es a por separado `response.create` operación, no una conversión oculta de inyección rechazada. Múltiples resultados de función guardados pueden compartir un una sola inyección. Cada llamada se puede enviar solo una vez, incluso mientras está en cola.

Los resultados de la herramienta paralela se ponen en cola y se envían un fotograma a la vez, ya que el éxito El evento identifica la respuesta en lugar de una inyección individual. El relé conservas `response.inject.created` y `response.inject.failed`. Mantiene el conexión viva después de que un terminal de respuesta mientras los resultados presentados esperan la confirmación o llamadas anunciadas esperan resultados, por lo que los resultados asincrónicos tardíos no se descartan.

Cuando el servidor rechaza una inyección con `response_already_completed`, use su salidas guardadas devueltas en **Un cliente enviado** `response.create` Con el fin de
`previous_response_id`, modelo/configuración sin cambios y el mismo carril. Incluye cada resultado excepcional exactamente una vez; no incluya productos ya aceptados. Los relay mantiene esa continuación en la cuenta / socket original y conserva la normalidad Solicitud de ritmo. Nunca ejecuta la herramienta de nuevo o crea una solicitud de recuperación en sí. Otras fallas permanecen visibles para que el cliente las maneje.

Un reconocimiento faltante o una desconexión significa que la entrega puede ser **Desconocido**. Hacer no vuelva a enviar un resultado automáticamente, reinicie una herramienta o cambie de cuenta para volver a intentarlo. La cola pendiente está limitada a 32 tramas y 8 MiB, con 1.024 funciones anunciadas. llamadas, un diario de reproducción de 32 MiB y como máximo 128 respuestas por conexión propia. Los diarios de inyección comparten el presupuesto de memoria fijado y el techo agregado de 128 MiB con los diarios de dirección; ver [límites de memoria de dirección](#steering-confirmation-deadlines-and-retained-context). El límite de cuerpo configurado de origen se comprueba antes de que un resultado entre en la cola. incluso mientras otro resultado espera reconocimiento. Un `outbound_body_too_large`
rechazo deja la conexión utilizable para un resultado corregido sin volver a ejecutar su herramienta. Cada inyección enviada tiene un plazo de confirmación de 90 segundos que no está relacionado con la salida. No se puede extender; una espera de resultados guardados está limitada a 30 minutos. Límites de trama existentes y los tiempos muertos todavía se aplican.

Los proveedores traducidos, las pasarelas personalizadas, las rutas Combo/sidecar y la reserva HTTP hacen no ganar soporte de inyección. Los intentos no soportados devuelven un error explícito de desaparecer. La opción permanece desactivada por defecto; las pruebas de transporte sintético son No hay certificación de compatibilidad en vivo. Establecer `codexNativeInjection` a `false` y Reiniciar para retroceder. No es necesario eliminar ningún archivo de cuenta o conversación.


<a id="rich-tool-results-and-explicit-approvals-after-response-completion"></a>

### Resultados enriquecidos de la herramienta y aprobaciones explícitas después de completar la respuesta

Con `codexNativeInjection` habilitado, un cliente enviado `response.create` en el mismo conexión propia ahora puede volver **no enviado** función/resultados personalizados que contienen texto, partes de imagen o archivo después `response.completed`. Suministrar la respuesta completada
`previous_response_id`, el mismo carril y modelo/configuración sin cambios. Incluya cada resultado pendiente o la aprobación solicitada exactamente una vez; omita ya aceptado resultados inyectados. El proxy reenvía esta continuación llamador-enviado usando el cuenta original y toma con los controles de envío existentes.

Los elementos de continuación soportados son `function_call_output`, `custom_tool_call_output`
y `mcp_approval_response`. La salida de la herramienta puede ser una cadena o una matriz de `input_text`,
`input_image` y `input_file` partes. Las piezas de imagen requieren `detail` (`auto`, `low`,
`high` o `original`); el detalle del archivo es opcional (`auto`, `low`, `high`) Usar exactamente Una fuente de imagen/archivo. Los datos de archivo en línea requieren un nombre de archivo. Opcional
`prompt_cache_breakpoint: { "mode": "explicit" }` se conserva. Campos no soportados son rechazados, no eliminados. Las referencias no se descargan o vuelven a subir por el proxy. Cada resultado tiene como máximo 1.024 partes de contenido dentro del límite de solicitud de 8 MiB existente. Una persona que llama al programa suministrado debe coincidir con la llamada anunciada; no puede suplantar otra herramienta o agente. El orden del contenido, las referencias de archivos y la ortografía original sobreviven.

Para un servidor-emitido `mcp_approval_request`Pasa su ID como `approval_request_id` y Un explícito `approve: true` o `approve: false`. La denegación se envía sin cambios. El proxy no decide, por defecto, aprueba automáticamente ni ejecuta la herramienta solicitada. Se rechaza una decisión faltante o no relacionada. Alojado `multi_agent_call` acciones y Otras herramientas de servidor son **no** funciones de desarrollador: sus eventos, salidas y Los mensajes de agente cifrados se conservan, nunca se ejecutan ni se inyectan por OpenCodex.

Esto no permite ricos / costumbre / aprobación **inyección de respuesta media**Ni simultáneos dirección en una respuesta multiagente. Esas operaciones tienen diferentes de origen contratos. La inyección no admitida es rechazada antes de reservar una llamada, por lo que un El resultado permanece disponible para una continuación explícita posterior. No hay automático conversión, reintento, reejecución de la herramienta o cuenta / conmutador API. Un giro de dirección de un solo agente puede seguir un turno multiagente completado como una nueva solicitud explícita usando enrutamiento. El soporte al cliente y el derecho de backend aún requieren verificación en vivo.


<a id="steering-continuation-settings"></a>

## Configuración de continuación de dirección

Un resultado guardado explícito `response.create` puede anular `reasoning` (esfuerzo y resumen), `text` (verbosidad y formato de salida estructurada compatible), y
`stream_options`. Las rutas de suscripción se niegan a `max_output_tokens` Anular en lugar de ignorarlo silenciosamente. Alfileres de proveedor normales, tapas de subagente, esfuerzo Todavía se aplican exclusiones de capacidad de resumen/verbosidad.

Los configuración omitidos retienen los valores efectivos actuales; el valor nulo explícito restablece ese valor. donde el upstream acepta null. Reemplaza la configuración suministrada objetos, no campos anidados individuales. Los valores cambiados se trasladan a valores explícitos posteriores. continuaciones. Una anulación rechazada no reserva el resultado guardado, por lo que un La solicitud corregida se puede enviar sin volver a ejecutar su herramienta. El servidor todavía decide qué configuración acepta el modelo elegido. Cambios en el modelo, cuenta, El proveedor, las herramientas, las instrucciones o el nivel de servicio requieren un turno ordinario separado.

La dirección nativa está restringida a la ruta de suscripción canónica ChatGPT. Público API-clave y rutas de puerta de enlace no son orientables; sus respuestas ordinarias se conservan y un intento de dirección recibe un error explicativo. Esto impide que el sucesor generaciones en un socket retenido de eludir la admisión normal por solicitud. Los La vía de inyección de múltiples agentes API pública cerrada por separado permanece disponible.

<a id="executable-direct-versus-proxy-wire-probe"></a>

### Sonda de alambre directa contra proxy ejecutable

Desde una comprobación de origen, ejecute el control positivo fuera de línea:

```sh
bun scripts/steering-smoke.ts --self-test
```

Planifique una comparación sin leer tokens o abrir ninguna conexión:

```sh
bun scripts/steering-smoke.ts --direct wss://api.openai.com/v1/responses \
  --proxy ws://127.0.0.1:1455/v1/responses --model <supported-model> \
  --proxy-model <provider-prefix/same-model>
```

Para una comparación de suscripción, el URL directo es
`wss://chatgpt.com/backend-api/codex/responses`. Seleccione el mismo modelo real y cuenta en ambas rutas; el script no puede probar que una configuración proxy seleccionada la misma cuenta. El proxy URL debe ser un punto final de bucle Responses y no debe contienen credenciales, parámetros de consulta o un fragmento.

Solo después de revisar el plan, el suministro `STEERING_DIRECT_TOKEN` y
`STEERING_PROXY_TOKEN` a través de su entorno de shell y añadir **ambos** `--live`
y `--allow-model-requests`. Una conexión ChatGPT directa puede necesitar adicionalmente
`STEERING_DIRECT_ACCOUNT_ID`; ese encabezado nunca se copia al público API o el proxy. No ponga credenciales en argumentos de comando, registros, capturas de pantalla o relaciones públicas. El script no lee el inicio de sesión Codex guardado, actualiza tokens o cambia la configuración.

La ejecución en vivo envía cuatro solicitudes iniciales sintéticas (dos escenarios por ruta), más los sucesores resultantes o las continuaciones de resultados requeridos, y **puede consumir Uso del modelo**. Un escenario comprueba un sucesor automático; el otro devuelve un resultado sintético fijo solo para la función y los cambios anunciados del propio script razonamiento/verbosidad en su continuación explícita. No se ejecuta ninguna herramienta externa y No se infiere ninguna aprobación. No hay reintentos ni solicitudes de recuperación automática. Cada escenario está limitado a 120 segundos, 5.000 eventos y 2 MiB de datos recibidos.

El informe JSON contiene solo resultados, tiempos y puntos de control booleanos. Un pase requiere una aceptación en cola, un sucesor creado y el marcador sintético en su Resultado completado. Faltan confirmaciones `unknown`Si el modelo nunca entra La ruta de entrada requerida es el resultado `not_exercised`. Tampoco se cuenta como pase. El proceso sale de 0 solo si pasan los cuatro escenarios en vivo, 1 de lo contrario y 2 para el siguiente. argumentos no válidos o credenciales faltantes. Esto es un **diagnóstico de alambre**, no un Prueba de interfaz de extremo a extremo de la aplicación Codex / CLI, certificación en vivo o instrucciones para habilitar la característica experimental para el trabajo de producción.

<a id="streaming-line-endings"></a>

## Finales de línea de streaming

El decodificador compartido SSE acepta LF, CRLF y terminaciones de línea CR independientes, incluso cuando un delimitador abarca fragmentos de red. Esto permite a los proveedores compatibles transmitir eventos sin requerir encuadre de solo LF.


<a id="account-qualified-requests-and-credits"></a>

### Solicitudes y créditos calificados para cuentas

Elegir un modelo calificado para la cuenta no permite el gasto de crédito. Las cuentas guardadas obedecen **Usar créditos después del límite** durante la autenticación, cuando se preparan las credenciales, y antes de Responses HTTP o WebSocket envío después de ritmo o reintento esperas. Una solicitud retenida informa la política de crédito, no un fallo de autenticación; espere a que se restablezca, elija otra cuenta o habilite explícitamente el gasto de crédito de esa cuenta.

Los ayudantes de visión y búsqueda web de cuenta almacenada también vuelven a verificar esta política antes de enviarla, incluidos los reintentos. Si el consentimiento cambia o se alcanza un límite después de la selección del ayudante, el ayudante informa el rechazo de la política sin enviar ese intento. El relé de búsqueda independiente devuelve un 429 unido por reinicio. Las credenciales Direct propiedad de la persona que llama conservan su comportamiento existente.

<a id="opt-in-a-custom-provider-to-managed-local-routing"></a>

## Optar por un proveedor personalizado para administrar el enrutamiento local

Un proveedor personalizado como `chatgpt-http` puede usar `supports_websockets = false`
para mantener el transporte HTTP. OpenCodex deja a los proveedores personalizados intactos por defecto. Para delegar solo URL de ese proveedor en OpenCodex, ejecute:

```sh
ocx codex-provider allow chatgpt-http
ocx start
```

El primer comando explica el alcance y pide confirmación, por defecto a No. Para una operación con scripts explícitamente aprobada, use `allow chatgpt-http --yes`. El consentimiento se aplica a este ID de proveedor en el `CODEX_HOME`; no lo hace aprobar otros proveedores u otros hogares. Iniciar y sincronizar la actualización solo su `base_url`
para el proxy local. Su identidad, configuración WebSocket, otros campos e historial TOML permanecer sin cambios. Mantenga el proxy en ejecución mientras usa esta ruta. Al activar la integración Codex, OFF también evita que las actualizaciones de proveedor aprobado URL se inicio o sincronización; el consentimiento del proveedor guardado permanece disponible cuando lo vuelve a activar.

Este modo admite tablas de proveedores Responses explícitas con `requires_openai_auth = true`
y sin credenciales o encabezados personalizados. Objetivos no loopback, modo Escritorio sin authless y la compactación del cliente requieren la integración dedicada existente.

`ocx stop` y `ocx restore` restaurar las URL grabadas mientras se mantiene el consentimiento para una versión posterior Inicio. Correr `ocx codex-provider status` para enumerar aprobaciones, o
`ocx codex-provider revoke chatgpt-http` para restaurar su URL administrado y eliminar el consentimiento. Un URL cambiado fuera de OpenCodex se conserva y requiere una revocación seguida de un nuevo aprobación; OpenCodex no adopta silenciosamente el reemplazo como una nueva línea de base. La asignación URL original se conserva en los metadatos de recuperación privados bajo
`OPENCODEX_HOME`, por separado del diario de configuración nativo.

La seguridad de inicio reconoce el enrutamiento URL administrado registrado por un proveedor aprobado como OpenCodex. Esto no instala protección de reinicio: un proxy iniciado manualmente todavía necesita una protección viable. servicio en segundo plano para recuperar automáticamente después de un reinicio.

<a id="native-desktop-relay-connect-validation"></a>

## Validación de relé de escritorio nativo CONNECT

El relé de escritorio existente HTTP/HTTPS CONNECT transport ahora rechaza las cabeceras de respuesta proxy mal formadas y ambiguas HTTP Los nombres de usuario básicos que contienen dos puntos. Los pares de credenciales decodificadas están limitados a 4096 UTF-8 bytes. Si el proxy seleccionado es rechazado, corrija su configuración o respuesta; el relé no cambia silenciosamente a una conexión directa.

Selección de proxy, compatibilidad con SOCKS5/SOCKS5h, verificación de certificados y conexión El ciclo de vida no ha cambiado. Ambas ortografías SOCKS retienen la resolución DNS de destino remoto.
