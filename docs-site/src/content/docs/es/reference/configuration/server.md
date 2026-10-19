---
title: "Configuración de servidor y entorno de ejecución"
description: "Escuchador, acceso remoto, claves de admisión, tiempos de espera, almacenamiento, sidecars, llamadas de sombra y comportamiento de inicio."
---

La configuración del servidor controla cómo escucha el proxy local, protege el tráfico remoto, administra los recursos y ejecuta funciones de ayuda en torno a las solicitudes del proveedor.

<a id="server-fields"></a>

## Campos del servidor

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `port` | `number` | `10100` | Puerto de escucha proxy. |
| `hostname?` | `string` | `"127.0.0.1"` | Vinculación de direcciones. Un enlace sin bucle requiere una entrada de datos token, resuelto desde `OPENCODEX_API_AUTH_TOKEN`Entonces, `OCX_API_TOKEN_FILE`, entonces el propietario instalado-sólo `service-api-token` — nada tiene que ser exportado a mano. Véase [Acceso remoto](#remote-access). |
| `proxy?` | `string` | — | HTTP(S) o SOCKS5 proxy de salida URL (`socks5://host:port`), `${ENV_VAR}`, o `"auto"`. Las URL de HTTP se aplican a `HTTP_PROXY` / `HTTPS_PROXY` cuando éstos no son SOCKS5 Las URLs usan OpenCodex's real SOCKS5 transporte y también están expuestos a través de `ALL_PROXY` (`ocx start --socks5`); heredada `HTTP(S)_PROXY` se despeja en este proceso. Loopback se queda en `NO_PROXY`. `"auto"` lee la configuración estática de Windows o WinINET macOS HTTP/HTTPS una vez al iniciar. Las variables proxy heredadas HTTP(S) omiten el descubrimiento; en macOS, heredadas `ALL_PROXY`/`all_proxy` También lo omite. Windows mantiene separados `http=` y `https=` entradas; un bare `ProxyServer` Se aplica a ambos. macOS traduce literales de IP, `*`, y una válida `*.<domain>` de glob a Bun `.<domain>` derivación. Ese globo también pasa por alto el ápice desnudo `<domain>`. Los rangos exactos de link-local `169.254/16`, `169.254.0.0/16`, y `fe80::/10` se omiten con un diagnóstico: los literales IP de enlace-local usan el proxy. Otros CIDR, globs y excepciones de host simple rechazan el descubrimiento sin cambiar el entorno proxy. Deshabilitado, mal formado, PAC/WPAD, SOCKS-only, y los cambios en vivo no se siguen. Reinicie después de cambiar la configuración del sistema. |
| `noProxy?` | `string \| string[]` | — | Anfitriones que evitan `proxy`, fusionado con el heredado `NO_PROXY` y entradas de bucle. Una cadena puede usar comas separadas `NO_PROXY` sintaxis o `${ENV_VAR}`. |
| `emptyCompletionRetry?` | `boolean` | `false` | Opte por un reintento idéntico de Responses cuando un turno no tiene llamada de texto o herramienta, incluyendo una secuencia que termina antes de un evento terminal y una IA de Vertex `MALFORMED_FUNCTION_CALL` falla que llega antes de cualquier salida. El reintento puede ser facturable. `OCX_EMPTY_COMPLETION_RETRY=0` lo deshabilita sin cambiar la configuración; quedan excluidos los turnos combo y de compresión enrutada. |
| `dropCodexSafetyBuffering?` | `boolean` | `false` | Eliminar sugerencias opcionales orientadas al cliente del paso canónico Codex Responses: los dos `x-codex-safety-buffering-enabled` / `x-codex-safety-buffering-faster-model` cabeceras de respuesta, `response.metadata` eventos cuyo tipo de metadatos es `safety_buffering`, y de alto nivel `safety_buffering` campos. Se conservan otros encabezados, datos de respuesta, rechazos y fallos de políticas. Esto no inhabilita la aplicación de seguridad del proveedor o el almacenamiento en búfer ascendente. Nativo `codex.response.metadata.headers` WebSocket metadatos y `/responses/compact` fuera de este filtro. |
| `stallTimeoutSec?` | `number` | `300` (público) / discapacitado (local) | Segundos sin progreso ascendente significativo (Responses y Chat nativo) antes de que se corte el flujo. Desactivado, a **local** de origen (loopback, privado o a `.local`/`.lan` nombre) por defecto a inhabilitado y un público ascendente a 300 s; un valor positivo se aplica a ambos (mínimo 1 s); `0` Desactiva el perro guardián del silencio en todas partes. La discapacidad deja un modelo local silencioso pero saludable conectado (los Keep-Alive aún fluyen). Canonical ChatGPT Responses plegado de SSE en JSON sin transmisión retiene un techo de giro completo separado de 15 minutos incluso cuando el regulador de silencio está desactivado. Pendiente `/v1/responses/compact` cuerpo lee compartir este presupuesto, pero por defecto a 300 s incluso para un local de origen — la ruta almacena el cuerpo completo mientras se mantiene un contrato de arrendamiento activo-turno — y un valor explícito, incluyendo `0`Todavía gana. |
| `oauthOpenBrowser?` | `boolean` | `true` | Si un inicio de sesión puede abrir un navegador en la máquina que ejecuta el proxy. Ausente y `true` abierto, por lo que una instalación existente no cambia; solo una instalación `false` declina. Rechazar cuando necesite el enlace de autorización en un perfil de navegador diferente, o cuando el panel de control no esté en la máquina del proxy —, el inicio de sesión aún se inicia y el URL todavía se devuelve y se muestra. `POST /api/oauth/login` y `POST /api/codex-auth/login` Aceptar una solicitud `openBrowser` booleano que anula esto, y el panel expone la misma opción al lado del botón de inicio de sesión. Ambas rutas informan el resultado como `browserLaunch`: `started`, `failed` (no se podía abrir nada; el panel lo dice), o `skipped`. Los flujos de código de dispositivo nunca abren un navegador de ninguna manera. |
| `connectTimeoutMs?` | `number` | `200000` | Por intento DNS/TCP/TLS/final-header fecha límite; termina antes de la generación del cuerpo. |
| `shutdownTimeoutMs?` | `number` | `5000` | Fecha límite de drenaje elegante antes de turnos activos son abortados. |
| `websockets?` | `boolean` | `false` | Anuncie y admita la orientación al cliente Responses WebSocket camino. Falso mantiene a los clientes en HTTP/SSE; no desactiva un canónico elegible ChatGPT Las solicitudes de entrada completa pueden reutilizar una conexión ascendente dentro de la misma credencial, cuenta, subproceso y giro seleccionados; la política de enlace cambiada o la identidad faltante mantienen las solicitudes en conexiones separadas. HTTP ingrese o cree ID de respuesta anterior. |
| `codexNativeSteering?` | `boolean` | `false` | Experimental, solo nativo a mitad de giro de la dirección en el Responses WebSocket Endpoint. Requiere `websockets: true`, un cliente ascendente compatible y una cuenta/modelo/superficie de la herramienta anclada. La configuración de generación validada puede cambiar en las continuaciones explícitas de resultados guardados. No habilita los modelos traducidos o HTTP. Véase [Dirección nativa](/es/guides/codex-integration/#experimental-native-mid-turn-steering). |
| `codexNativeInjection?` | `boolean` | `false` | Inyección experimental guardada de resultados de función en espiras multiagente nativas compatibles WebSocket. Requiere `websockets: true`, explícito `multi_agent.enabled`y un proveedor elegible. Separado de la dirección; no se crea ninguna herramienta automática de reejecución o recuperación. Véase [Inyección nativa](/es/guides/codex-integration/#experimental-native-function-result-injection). |
| `nativeReasoningRetention?` | `{ modelSwitch?: boolean; accountSwitch?: boolean }` | ambos `false` | Permitir el reenvío de texto cifrado de razonamiento a través de un modelo conocido o cambio de cuenta en el mismo backend canónico ChatGPT. La retención de cuentas es experimental. Véase [Retención del razonamiento nativo](#native-reasoning-retention). |
| `corsAllowOrigins?` | `string[]` | `[]` | Orígenes exactos adicionales permitidos por CORS. Los orígenes de Loopback siempre están permitidos. Origenes de extensiones de navegador basadas en autoridad, como `chrome-extension://<extension-id>` son apoyados; `*` No es un comodín. Firefox y Safari regeneran la extensión UUID (por instalación / por lanzamiento del navegador), así que actualice la entrada cuando cambie el origen. |
| `apiKeys?` | `OcxApiKey[]` | `[]` | Generado `ocx_…` credenciales de admisión en el plano de datos en enlaces no loopback. No autorizan las API de administración; el acceso de administración utiliza la credencial separada documentada en el [referencia de gestión](/es/reference/management-api/). Panel de control administrado. |
| `storageCleanupPolicy?` | `StorageCleanupPolicy` | discapacitados | Política de limpieza de sesiones archivadas. Nunca se activa implícitamente. |
| `usageLedgerMaxBytes?` | `number` | unset | Techo opt-in en bytes para `usage.jsonl`. Ausente significa que el historial de solicitudes crece sin límite, lo que permanece como predeterminado. Véase [tamaño del historial de uso](#usage-history-size). |
| `appOwnedMemoryBudgetMb?` | `number` | `256` | Capture en MiB para registros, cachés, blobs y cargas útiles de continuación propiedad de aplicaciones desalojables. Rango 64–4096; no es una tapa RSS. |
| `metricsExport.enabled?` | `boolean` | `false` | Habilite las métricas de solicitud agregadas locales de proceso en autenticadas `GET /api/metrics`. Se requiere reiniciar; el modo desactivado devuelve 404 y no inicia ninguna actividad de exportador. |
| `serviceHealthRecovery.enabled?` | `boolean` | `false` | Recuperación opt-in para el servicio en segundo plano: una pequeña sonda de proceso centinela `/healthz` y, cuando el proxy se mantiene activo pero no responde nada durante aproximadamente un minuto de sondeos consecutivos, lo termina para que el administrador del servicio (Programador de tareas, launchd, systemd, WinSW) lo reinicie. Solo el hijo de servicio administrado inicia uno; las solicitudes del proceso bloqueado no se reproducen. Como máximo tres recuperaciones por hora. Reiniciar requerido. La recuperación automática requiere una dirección de enlace numérica (o la asignación localhost/wildcard predeterminada); Los nombres de enlace DNS no se supervisan. Una dirección grabada o puerto modificados detiene la supervisión. |
| `spend?` | `{ root?: { maxTokens?: number }; identity?: { maxTokens?: number }; pool?: { maxTokens?: number }; retentionDays?: number }` | unset | Techos token duraderos, apagados a menos que escriba uno. Cada alcance limita el gasto liquidado más las reservas en vuelo más el gasto no resuelto: `root` es una tarea que incluye todo su abanico, `identity` es una cuenta en cada tarea que sirve, y `pool` es un grupo de proveedores. Se cruzan, por lo que una solicitud se admite solo cuando los tres tienen espacio —, que es lo que mantiene un techo contra un cliente que acuña una nueva identificación de tarea por solicitud. Una reserva es toda la entrada de la solicitud más su límite de salida exigible, contado como si cada prefijo en caché se perdiera. Observar solo el modo sigue siendo diarios, por lo que cada servidor posee el arrendamiento de un solo escritor del directorio de estado; un hermano explícito debe usar un contrato de arrendamiento separado `OPENCODEX_HOME`. El gasto sobrevive a un reinicio del proceso ordinario cuando sus escrituras llegaron al sistema de archivos, pero el diario no promete supervivencia a través de la pérdida de energía del host porque cada apéndice no está sincronizado. Elevar o eliminar un límite máximo cambia la asignación para las solicitudes iniciadas después; las solicitudes que ya se están ejecutando mantienen su política de inicio. `maxTokens` debe ser un entero positivo (0 rechazaría todo), `retentionDays` es 1–365 y tiene por defecto 7, y se rechaza una clave desconocida en esta sección en lugar de ignorarla. Un rechazo es un HTTP 429 local que lleva `x-opencodex-local-refusal: workflow_spend_exhausted`, y su mensaje nombra el alcance y el techo; ningún proveedor es contactado. Con un límite máximo aplicable, el envío también se rechaza si su reserva token no se puede reservar, incluida la capacidad total de seguimiento. Las solicitudes sin un límite máximo aplicable permanecen solo para observación. |

| `codexAutoStart?` | `boolean` | `true` | Deje que la shim Codex funcione `ocx ensure` antes de iniciar Codex. Falso hace asegurar un no-op. | | `codexShimAutoRestore?` | `boolean` | `true` | Restaurar una shim instalada después de una actualización externa completa Codex lo reemplaza. Exclusión del medio ambiente: `OPENCODEX_CODEX_SHIM_AUTO_RESTORE=0`. |
| `codexDesktopAuthless?` | `boolean` | `false` | Opt-in Codex Enrutamiento de escritorio en un enlace de bucle de retorno: inyecte el `opencodex` proveedor con `requires_openai_auth = false` así que el escritorio se abre sin un inicio de sesión ChatGPT. Ignorado en los enlaces no loopback. `ocx system settings --desktop-authless on`. Véase [Integración Codex](/es/guides/codex-integration/#authless-codex-desktop-opt-in). |
| `codexAccountPickerEnabled?` | `boolean` | unset | Ya sea filas de catálogo calificadas para la cuenta generadas (`<selector>/<model>`) se anuncian. Habilitarlo una vez llena un vacío o ausente `codexAccountNamespaces` con selectores por defecto; `false` oculta las filas generadas sin eliminar los enlaces de enrutamiento exactos. Un indicador omitido mantiene habilitado un mapa selector escrito a mano no vacío. La fila Luna Reserve está calificada para la cuenta, por lo que se escribe solo cuando un selector se dirige a la cuenta principal Codex; cuando se suprime, la sincronización de catálogo registra la razón y la acción que la restaura. | | `codexAccountNamespaces?` | `Record<string, string>` | unset | Selector público para Codex Los principales mapas de inicio de sesión al centinela de solo configuración `@main`; agregado mapa de cuentas a su ID de cuenta. Normalmente se genera al permitir `codexAccountPickerEnabled` En lugar de escribir a mano. Un mapa vacío significa que no existen filas calificadas para la cuenta, incluida la fila de la Reserva Luna. | | `codexClientCompaction?` | `boolean` | `false` | Opt en la compactación del lado del cliente Codex en un enlace de bucle autenticado. Utiliza el dedicado `opencodex` identidad del proveedor con `requires_openai_auth = true`, evitando que las nuevas compactaciones enrutadas almacenen OpenCodeX `ocx1:` Estado. `codexDesktopAuthless` tiene prioridad cuando ambos están habilitados y mantiene `requires_openai_auth = false`. El enrutamiento del subagente V2 no cambia. `ocx system settings --client-compaction on`. Véase [Integración Codex](/es/guides/codex-integration/#client-side-compaction-opt-in). |
| `codexProviderDisplayName?` | `string` | `"OpenCodex Proxy"` | Etiqueta Codex muestra para el inyectado `opencodex` proveedor, escrito como su `name` campo en `config.toml` y el perfil de referencia. Solo presentación: el enrutamiento se resuelve a través del ID del proveedor `opencodex`, por lo que un nombre nunca se mueve `model_provider = "opencodex"` o el `[model_providers.opencodex]` cabecera y no puede huérfano hilos ya etiquetados con ese id. Codex se niega a cargar un proveedor sin nombre, por lo que no hay forma de omitir el campo — elegir una etiqueta neutral en su lugar. Se ignora un valor en blanco, de más de 128 caracteres o de carácter de control y se escribe la etiqueta predeterminada. | | `codexMainAccountHardLock?` | `boolean` | `true` | Bloquear nuevas solicitudes de cuenta principal coincidentes con identidad en su umbral por ventana. Sólo explícito `false` Opta por salir. Véase [Protección de la cuenta principal](/es/reference/cli/providers-accounts/#main-account-quota-protection). |
| `codexMainAccountHardLockThresholds?` | `{ short?: number; long?: number }` | `{ short: 90, long: 98 }` | Umbrales independientes de 5h y semanales/mensuales. Entero 80–100, con `short <= long`. Los campos persistentes no válidos vuelven a los valores predeterminados; la configuración que API rechaza escribe antes de la mutación. | | `codexMainAccountHardLockFallback?` | `{ enabled?: boolean; model?: string; reasoningEffort?: string }` | fuera de | Configuración de bloqueo duro extendida: mientras que los bloques de bloqueo y ninguna cuenta Codex pueden servir la solicitud, las solicitudes de modelo nativo calificado Codex se redirigen a `model` con `reasoningEffort` en lugar de fracasar. `enabled: false` pausa el desvío y mantiene el modelo. Una sección o modelo ausente mantiene el comportamiento de rechazo; una cuenta Pool utilizable todavía sirve primero. `reasoningEffort` debe ser un esfuerzo declarado; las secciones inválidas persistentes se degradan a off y la configuración API rechaza escrituras inválidas antes de la mutación. Véase [Protección de la cuenta principal](/es/reference/cli/providers-accounts/#main-account-quota-protection). |
| `nativeMainRefresh?` | `"codex" \| "opencodex"` | auto | ¿Quién actualiza el inicio de sesión principal nativo ChatGPT? `CODEX_HOME`. `"codex"` pregunta el binario Codex (app-server `getAuthStatus`, Codex 0.130.0 o más reciente, que se encuentra a través de la misma resolución en entorno de ejecución que `ocx sync`, incluido el paquete de aplicaciones ChatGPT) y nunca escribe `auth.json`; esto también funciona cuando Codex almacena su inicio de sesión en el anillo de claves del sistema operativo. `"opencodex"` mantiene vigilado el OpenCodex `auth.json` Escritor. Púas sueltas `"codex"` cuando se encuentra un binario soportado; sin uno, tanto unset como `"codex"` Volvamos al escritor guardado. `ocx doctor` muestra el modo activo en Native main refresca. | | `resetCreditAutoRedeem?` | `{ enabled?: boolean; leadTimeMinutes?: number }` | fuera de | Opt-in: canjear el crédito de restablecimiento más pronto de la cuenta principal Codex `leadTimeMinutes` (1–60, por defecto 10) antes de que expire. Cada intento vuelve a leer la lista de crédito ascendente primero y se salta cuando el crédito se ha ido (por ejemplo, canjeado a mano); `redeem_request_id` Es journalizado en `$OPENCODEX_HOME/reset-credit-auto-redeem.json` antes de la llamada, por lo que un bloqueo reproduce la misma solicitud idempotente en lugar de gastar un segundo crédito. Los servidores que comparten este directorio de configuración coordinan las reservas y liquidaciones para que un proceso no reemplace el registro de solicitud de otro. Los registros solo llevan una clave de cuenta hash. | | `syncResumeHistory?` | `boolean` | `true` | Reversible Codex Compatibilidad con el historial de aplicaciones. Los metadatos originales están respaldados y restaurados por `ocx stop` / `ocx restore`. |
| `spendPoolAliases?` | `Record<string, string>` | unset | Alias de grupo salteado histórico explícito a asignaciones canónicas de proveedores. Mantenga esta clave en el nivel superior, fuera `spend`. Véase [Continuidad histórica de la grupo](#historical-pool-continuity). |
| `shadowCallIntercept?` | `{ enabled?: boolean; model?: string; sourceModels?: string[] }` | de | Redirect reconoció las llamadas de ayuda/sombra Codex a un modelo elegido al tiempo que preserva el esfuerzo de razonamiento configurado de la solicitud. Los prefijos de origen predeterminados son `gpt-6-luna` y `gpt-5.6-luna`; clientes mayores a través de 0.144.x utilizados `gpt-5.4-mini`, que `sourceModels` puede restaurar. | | `memoryModels?` | `{ extract?: { model: string; reasoningEffort?: string }; consolidation?: { model: string; reasoningEffort?: string } }` | fuera de | Ruta Codex dos fases de memoria a un modelo elegido, con un esfuerzo de razonamiento opcional por fase. Véase [Enrutamiento de memoria](#memory-routing). |
| `webSearchSidecar?` | `OcxWebSearchSidecarConfig` | activado cuando se pueden usar las opciones de búsqueda web de |. | | `visionSidecar?` | `OcxVisionSidecarConfig` | activado cuando se pueden usar las opciones de sidecar de descripción de imágenes |. | | `images?` | `OcxImagesConfig` | automático OpenAI selección | Opciones de retransmisión de imágenes independientes para Codex `image_gen`. |

En Linux x64/arm64 con soporte pidfd, la recuperación del estado del servicio vincula la terminación al proxy identidad del proceso del kernel, por lo que la reutilización de PID no puede redirigirlo. El registro de observación del centinela termina en
`(pidfd)`. Los núcleos o arquitecturas no compatibles conservan la comprobación y el registro PID de padres vivos existentes. ese respaldo; otros fallos vinculantes deshabilitan la recuperación para ese proxy. macOS conserva el padre vivo comprobar, y Windows conserva su proceso de encuadernación del mango.
<a id="native-reasoning-retention"></a>

## Retención del razonamiento nativo

El resumen del panel de control expone dos opciones independientes: retener el razonamiento al cambiar de modelo y conservarlo al cambiar de cuenta. Ambos default desactivados. La misma política se puede guardar en `config.json`:

```jsonc
{
  "nativeReasoningRetention": {
    "modelSwitch": true,
    "accountSwitch": false
  }
}
```

Este ejemplo mantiene el razonamiento `encrypted_content` en un conmutador de modelo conocido dentro del mismo destino y credencial nativos ChatGPT. Establecer `accountSwitch` a `true` solo para optar por el envío experimental de cuentas cruzadas. Cuando tanto el modelo como la cuenta cambian, ambos interruptores deben estar habilitados. La política se aplica a cada destino Combo nativo real y al reintento de grupo; no otorga retención a destinos de terceros o API-clave.

La retención significa que OpenCodex puede reenviar el texto cifrado transportado. No puede confirmar que el flujo ascendente acepte o reutilice ese razonamiento. Un rechazo de descifrado detectado todavía entra en la recuperación de limpieza limitada existente, y la nota de rechazo tiene prioridad sobre cualquiera de los conmutadores. Las referencias de respuesta y conversación, los identificadores de elementos de razonamiento extranjero, las restricciones de la cuenta del archivo cargado y el aislamiento de caché continúan utilizando sus propias reglas de propiedad. Los bloques de compactación nativos mantienen su comportamiento de limpieza existente; nativo directo `/v1/responses/compact` La desinfección no ha cambiado.

Uso `GET /api/native-reasoning-retention` para leer los booleanos resueltos y `PUT` con un objeto booleano parcial para actualizarlos. `PUT` con JSON `null` Restaura ambos valores predeterminados. Los campos no válidos o las claves desconocidas se rechazan; un bloque de archivos mal formado desactiva la retención con una advertencia. Los cambios en el panel de control/API se aplican a las solicitudes posteriores. Local `ocx config set/unset` Las ediciones requieren un reinicio para converger el proxy en ejecución.

<a id="upstream-transport-recovery"></a>

## Recuperación de transporte ascendente

Mientras que el canónico ChatGPT de origen WebSocket espera el primer evento Responses después Enviando el marco de creación, observa la vitalidad en lugar de una fecha límite fija. Cuando el socket admite pings de protocolo, el proxy lo hace cada 15 segundos. Cualquier marco entrante — cuota, metadatos de respuesta, o un pong — restablece un reloj de silencio de 90 segundos, por lo que un socket sin ping soporte sigue vivo en sus propios marcos, y solo 90 segundos sin nada en absoluto resuelve la solicitud como un HTTP 504 con un `upstream_no_response` Error. Un origen lento pero vivo, por lo tanto, espera el plazo del cliente o para `connectTimeoutMs` (por defecto 200s), lo que ocurra primero; a el tiempo de espera de conexión que se dispara después de que se envió la trama de creación se establece como el mismo 504. Un enchufe que se cierra o errores antes de que el primer evento Responses se resuelva como un HTTP 502 con
`upstream_closed_before_response`. El proxy no vuelve a intentar ninguno de los dos estados por sí solo: el marco ya se está ejecutando upstream, por lo que el cliente aplica su propia política de reintento exactamente como lo haría cuando se conecta directamente al backend. La única excepción es que 502 en un proveedor que optó por en `retryOnReset`, que se describe a continuación. Una vez que la respuesta ha comenzado, una caída posterior dentro de la corriente como antes. `stallTimeoutSec` No tiene relación con esta ventana.

Un envío HTTP ordinario tiene un tercer caso. Cuando la conexión muere antes de cualquier cabecera de respuesta llega, el proxy no puede decir si el modelo ya procesó la solicitud, por lo que se niega para enviarlo de nuevo y responde HTTP 429 con `upstream_reset_replay_refused`. El estatus es deliberada: un 5xx aquí es una instrucción a la mayoría de los clientes, incluyendo Codex, para enviar el conjunto a su vez de nuevo, que es el duplicado de la negativa existe para evitar. No `Retry-After` es y la respuesta lleva `x-should-retry: false`, que el oficial OpenAI y Los SDK de Anthropic leen antes que sus propias reglas de estado — sin que esos clientes vuelvan a intentar un 429 en De todos modos, vuelve a enviar el turno. El mismo comportamiento de repetición-rechazo se aplica en
`/v1/responses` y `/v1/chat/completions`, si la solicitud se reenvía de forma nativa o traducida. Encaminado `/v1/messages` las solicitudes traducen a través de Responses y proyectan el mismo estado, código y reintentar encabezados en una envolvente de error en forma de Anthropic. El proxy no realiza rotación de teclas, conmutación por error de cuenta o repetición del mismo objetivo en él, ni rechazo como prueba de límite de tasa o cuota contra la credencial que tenía. Lado de llamada de herramienta solicitudes como la visión y la búsqueda web se reproducen normalmente, porque repetirlas no puede duplicar un turno.

ChatGPT nativa Responses y HTTP compactas cuyas cadenas JSON serializadas son al menos 1 MiB en UTF-8 usa cargas de byte-buffer para evitar que Bun restablezca una carga de cadena grande antes de la respuesta Llegan los encabezados. Esto preserva la solicitud contenido y no permite reintentos automáticos. Un restablecimiento de conexión genuino sigue al La política de reproducción-rechazo arriba.

Un proveedor nativo de Responses puede optar por reemplazar ese envío con
[`retryOnReset`](/es/reference/configuration/providers/#provider-entries-ocxproviderconfig). La misma subvención cubre el caso donde la conexión sobrevive al encabezado y el cuerpo SSE luego muere llevando solo control eventos, porque el llamador no ha observado nada en ninguno de los dos. También cubre la canónica ChatGPT WebSocket anterior: un socket que se cierra o comete errores antes del primer evento Responses reemplazado por un HTTP enviar, nunca por un segundo socket. Un socket silencioso mantiene su 504, y un socket El giro de dirección o inyección nunca se reemplaza. El reemplazo sólo ocurre cuando La petición es autónoma (`store: false`, entrada completa, herramientas ejecutadas por el cliente solamente, no estado de continuación del lado del servidor), y una solicitud lógica obtiene el número configurado de reemplazos en total — en cada pierna de recuperación y cada niño combinado, no uno cada uno. Los La negativa regresa tan pronto como se gasta esa subvención, la pierna no queda enviada o un reemplazo falla. por cualquier otra razón. Una solicitud que ya ha emitido la salida o una llamada de herramienta mantiene el rechazo. Independientemente. Una persona que llama y cancela a mitad del reemplazo obtiene la cancelación, no el rechazo.

Porque WebSocket La recuperación, antes de la primera Responses evento” es más estricto que “antes del primer texto”: incluso `response.created`, un evento de herramienta o una respuesta de soporte de uso cierra el ventana de reemplazo. Los metadatos de ping/pong y cuotas por sí solos no lo hacen. Un cierre posterior no puede Convierta una cancelación ya establecida o un tiempo de espera de conexión/silencio en un reintento HTTP.

`noProxy` acepta una cadena separada por comas o una matriz. Ambas formas añaden entradas sin Sustituyendo a los heredados `NO_PROXY`:

```jsonc
{ "proxy": "http://proxy.corp:8080", "noProxy": "internal.example,10.0.0.0/8" }
```

```jsonc
{ "proxy": "http://proxy.corp:8080", "noProxy": ["internal.example", "10.0.0.0/8"] }
```

SOCKS5 (incluye escuchas de puertos mixtos) `ALL_PROXY`, no `HTTP_PROXY`:

```jsonc
{ "proxy": "socks5://127.0.0.1:10808" }
```

`ocx start --socks5` escribe ese valor; `ocx start --socks5-off` Lo aclara.

Las solicitudes HTTPS a través de SOCKS5 tienen una fecha límite de intercambio de 30 segundos TLS. Un apretón de manos atascado falla sin deshabilitar la verificación del certificado; llamante La cancelación puede detenerlo antes.

Si una compilación de desarrollo anterior cambió los metadatos del historial de reanudación antes de que existiera el soporte de copia de seguridad, ejecute
`ocx recover-history --legacy-openai --yes` para forzar la recuperación del proveedor nativo. Obliga a reetiquetar cada mensaje de usuario `opencodex` fila, incluido el proveedor dedicado legítimo historial; revise la advertencia de alcance completo en la referencia del ciclo de vida antes de ejecutarla.

<a id="native-chat-timeouts-and-completion"></a>

### Tiempos de espera y finalización del chat nativo

El chat nativo también usa `stallTimeoutSec` mientras se espera la salida de flujo ascendente, con el mismo valor predeterminado local vs público: un presupuesto no establecido está deshabilitado para un flujo ascendente local y 300 s para uno público, y `0` lo desactiva en todas partes. El texto no vacío, el razonamiento, el rechazo, las actualizaciones de herramientas y los marcos de acabado renuevan la asignación; los comentarios de mantenimiento, los marcos solo de rol y el uso por sí solos no lo hacen. Esperar a que un cliente lento lea pausa la asignación. Un establo produce `upstream_stall_timeout`: una trama de error para clientes de transmisión o HTTP 502 para clientes que no transmiten. La cancelación antes de un resultado de terminal devuelve un error de cancelación en lugar de una respuesta parcial exitosa. Los resultados del chat almacenado aceptan tanto el encuadre LF como CRLF SSE, incluidos los datos multilínea.

<a id="codex-quota-network-diagnostics"></a>

## Diagnósticos de red de cuota Codex

La fila principal de la cuenta Codex puede incluir `quotaRefresh` cuando una cuota fetch era Intento. Esto describe que fetch, no cuota restante, modelo de acceso o Permiso para reintentar. Las lecturas en caché y las filas sin fetch pueden omitirlo; ausencia No significa éxito. A `null` valor de cuota significa no disponible, no cuota cero.

Para solicitar datos nuevos y mostrar solo el diagnóstico en PowerShell:

```powershell
$quotaReport = ocx account list openai --quota --refresh --json | ConvertFrom-Json
$quotaReport.accounts |
    ForEach-Object { if ($_.quotaRefresh) { $_.quotaRefresh } } |
    ConvertTo-Json -Depth 3
```

Si no hay diagnóstico presente, esta proyección no produce ningún objeto de diagnóstico. Compartir solo estos campos al comparar los modos de red, en lugar de la lista completa de cuentas.

| `quotaRefresh.status` | Significado |
| --- | --- |
| `ok` | Se completó el fetch y se analizó un objeto de cuota. |
| `not_reported` | La respuesta no contenía ningún objeto de cuota utilizable. |
| `http_error` | El flujo ascendente devolvió un fallo HTTP; `httpStatus` Contiene su código de estado. |
| `timeout` | La cuota fetch se agotó. |
| `network_error` | La solicitud falló antes de una respuesta clasificada HTTP. |
| `invalid_response` | La respuesta no fue un documento de cuota utilizable. |
| `internal_error` | Un paso de actualización interno falló. |

Solo `http_error` incluye `httpStatus`. Otros estados no implican HTTP 0 o un problema de derecho a cuenta. Un `http_error` También puede incluir `code` Cuando el proveedor nombre una razón por la que solo se corrige un nuevo inicio de sesión (`token_invalidated`, `invalid_refresh_token`,
`invalid_workspace_selected`). A `token_invalidated` la respuesta indica una sesión revocada; la fila muestra `needsReauth: true` con el último plan conocido.

Si el punto final token rechaza la concesión de actualización principal almacenada, las solicitudes automáticas dejan de intentarse. esa misma concesión incluso si una actualización de uso tiene éxito. Inicie sesión de nuevo `codex login` para reemplazar la credencial. El proceso mantiene hasta 64 registros de rechazo de perfil y concesión; La expulsión de un registro antiguo permite un cheque nuevo. Rate-limit y los fallos del servidor permanecen reintentable y no retirar la subvención. Las credenciales suministradas por la persona que llama siguen siendo propiedad de la persona que llama.


<a id="which-proxy-path-is-used"></a>

### ¿Qué ruta proxy se utiliza?

El servicio proxy en ejecución obtiene la cuota. Utiliza su propio entorno, no el shell interactivo que luego corre `ocx account list`. Configurar el servicio entorno o configuración de proxy, y luego reiniciarlo; cambiando variables en otro El terminal no actualiza un servicio ya en ejecución.

Un unset `proxy` deja sin cambios las variables proxy heredadas. Un HTTP(S) explícito proxy URL llena `HTTP_PROXY` y `HTTPS_PROXY` solo donde no se han establecido.
`"proxy": "auto"` lee Windows estático WinINET o macOS estático HTTP/HTTPS configuración una vez al inicio. Las variables de entorno proxy existentes tienen prioridad; macOS descubrimiento también omite heredado `ALL_PROXY`/`all_proxy`. A macOS `*.<domain>`
La excepción se convierte `.<domain>`: `foo.local` bypass para `*.local`, `xlocal`
no lo hace, y el desnudo `local` Apex también pasa. Enlace exacto-CIDR locales se eliminan con una advertencia, por lo que los literales de IP locales de enlace usan el proxy. Otros Las excepciones no representables rechazan el descubrimiento sin cambiar las variables proxy. El autodescubrimiento no resuelve Configuración de solo PAC/WPAD, SOCKS o cambios de proxy en vivo. Usar una HTTP estática admitida configuración de proxy o un proxy explícito HTTP(S) URL cuando sea necesario.

Comparar el diagnóstico en la misma máquina y cuenta bajo las dos redes Modos. Una prueba exitosa de TUN por sí sola no identifica por qué el proxy HTTP del servicio ruta falló, y no establece una solución general.

<a id="connection-reuse-for-specific-upstream-hosts"></a>

## Reutilización de conexión para hosts ascendentes específicos

Algunos upstreams mantienen una conexión abierta después de haber dejado de servirla. La próxima solicitud reutiliza ese conector agrupado y falla sin llegar al proveedor. `OCX_FRESH_CONNECTION_HOSTS` Nombres de los hosts que nunca deberían reutilizar una conexión agrupada, como una variable de entorno en lugar de una configuración campo, por lo que se puede aplicar a una máquina sin editar la configuración compartida:

```bash
OCX_FRESH_CONNECTION_HOSTS="api.example.com, relay.example.net" ocx start
```

El valor es una lista separada por comas de nombres de host. El emparejamiento es insensible a las mayúsculas y minúsculas, cubre cada uno de los nombres host y sus subdominios, e ignora los puntos principales, `.example.com` y `example.com` ambos partidos
`api.example.com`. No incluya un esquema, puerto o ruta. Una variable vacía o sin definir deja el Comportamiento de conexión predeterminado sin cambios.

Un envío a juego lleva `Connection: close` y se envía con keep-alive discapacitados. Los La decisión se toma en contra de la dirección utilizada en el cable, por lo que todavía se aplica cuando un proveedor transport reescribe el destino después de seleccionar las credenciales. La latencia por solicitud aumenta ligeramente para esos hosts, ya que cada solicitud paga un nuevo protocolo de enlace TCP y TLS; nombre solo los hosts que Lo necesito.

<a id="remote-access"></a>

## Acceso remoto

El valor predeterminado `127.0.0.1` bind es solo bucle. Una dirección no loopback como `0.0.0.0` o una red de cola IP requiere autenticación token en ambos `/api/*` y el plano de datos.

No tiene que producir ese token. `ocx service install` uno en un enlace no loopback, En este orden: `OPENCODEX_API_AUTH_TOKEN` desde el shell de instalación, luego un propietario existente
`service-api-token` archivo, luego 32 nuevos bytes aleatorios. El resultado está escrito `0600` y el lanzamiento wrapper (lanzamiento de plist, unidad systemd, Windows wrapper) lee el archivo al inicio, por lo que el valor nunca ingresa una definición de servicio o argv. Un primer plano `ocx start` aplica la misma prioridad — El medio ambiente, entonces `OCX_API_TOKEN_FILE`Luego, el instalado `service-api-token` — por lo que se une a nombre de host no loopback sin un token exportado también.

A **administración admin token** se rechaza en cualquier lugar puede aparecer — la variable de entorno o a reutilizado `service-api-token` archivo — y el mensaje nombra el remedio para ese lugar: unset the variable, o eliminar el archivo y ejecutar `ocx service repair`. Ambas verificaciones se ejecutan antes del bucle de retorno cortocircuito, porque el envoltorio de lanzamiento lee el archivo en `OPENCODEX_API_AUTH_TOKEN` lo que sea el nombre de host, por lo que un archivo admin-token cerca la administración API cerrado incluso en un enlace de bucle.
`ocx status` Informes que declaran como `admin-collision (file)` en un hub.

La configuración de la variable usted mismo todavía se admite para un operador que desee poseer el valor:

```bash
export OPENCODEX_API_AUTH_TOKEN="your-secret-token"
ocx start
```

Los clientes deben enviar:

```text
x-opencodex-api-key: your-secret-token
```

| Punto de conexión | `Authorization: Bearer` | `x-opencodex-api-key` | `x-api-key` |
| --- | --- | --- | --- |
| `/v1/responses` | No aceptado | **requerido** | No aceptado |
| `/v1/chat/completions` | No aceptado | **requerido** | No aceptado |
| `/v1/messages` | aceptado | aceptado | aceptado |
| `/v1/messages/count_tokens` | aceptado | aceptado | aceptado |
| `/v1/models` | aceptado | aceptado | aceptado |

Responses y Chat Completions reservan `Authorization` para el posible paso Codex Direct, por lo que solo Se acepta el encabezado de admisión dedicado allí. Generado por panel `apiKeys` puede sustituir el ambiente token después del inicio; los candidatos se comparan en tiempo constante.

Messages y `count_tokens` siga aceptando los tres formularios de admisión para la compatibilidad con el cliente enrutado. Nativo El paso a través de Anthropic es más estricto en un enlace no loopback: la admisión proxy debe usar
`x-opencodex-api-key`, mientras `Authorization` y `x-api-key` están reservados para las credenciales Anthropic. Cualquier secreto de admisión proxy colocado en esos encabezados de proveedor se elimina antes del reenvío.

:::caution[Exposición a la LAN]
A `0.0.0.0` bind expone el proxy y el acceso del proveedor configurado a la LAN. Utilícelo solo en el confiable redes con un fuerte token.
:::

<a id="local-clients-that-cannot-receive-the-token"></a>

### Clientes locales que no pueden recibir el token

Un enlace remoto requiere una credencial de cada persona que llama, incluidas las locales. Esto rompe una específica caso: a `codex app-server` lanzado por un proceso host que resuelve el punto de entrada Codex directamente (`require.resolve('@openai/codex/bin/codex.js')`) nunca pasa a través de los `codex` shim, Nunca heredó `OPENCODEX_API_AUTH_TOKEN` y cada llamada de modelo falla con `401` Antes de a Se abre el stream.

`unauthenticatedLoopbackListener` abre un segundo oyente vinculado a `127.0.0.1` Esto admite que sin un Credencial. El oyente principal no está afectado Las personas que llaman a distancia — todavía necesitan el token.

```json
{
  "hostname": "0.0.0.0",
  "port": 10100,
  "unauthenticatedLoopbackListener": { "enabled": true, "port": 10200 }
}
```

`ocx sync` Entonces escribe `base_url = "http://127.0.0.1:10200/v1"` en el bloque de proveedor administrado Codex y omite el encabezado auth, por lo que un servidor de aplicaciones directamente generado funciona sin ninguna fontanería de credenciales.

Cuando estableces `port`, debe diferir del puerto proxy. Nunca se asigna OS: un puerto efímero cambiaría a través de los reinicios mientras que los servidores de aplicaciones ya en ejecución mantenían el anterior `base_url`.

Omisión `port` selecciona el **compañero** desde — el oyente enlaza el puerto proxy en `127.0.0.1`:

```json
{
  "hostname": "100.76.170.81",
  "port": 10100,
  "unauthenticatedLoopbackListener": { "enabled": true }
}
```

Dial de clientes remotos `100.76.170.81:10100` con una credencial; marcación de procesos locales
`127.0.0.1:10100` sin uno. Esa es la dirección que toda integración local ya escribe, así que
`ocx claude`, Claude Desktop, Cursor y la inyección de env del sistema siguen trabajando en un host cuyo público que no pueden alcanzar. La forma de acompañante se acepta sólo cuando `hostname` es un específico dirección no-loopback, no-wildcard: on `127.0.0.1`, `localhost` o `0.0.0.0` El público oyente ya tiene esa dirección de bucle, por lo que OpenCodex rechaza el par en el momento de la escritura y en el inicio en lugar de fallar el segundo atadura. En esos enlaces no necesita el oyente en absoluto — a loopback bind ya admite llamadas locales.

Con un `port` las integraciones locales siguen al oyente: `ocx claude`, el `system-env`
inyección, el perfil de escritorio Claude, el valor de puerta de enlace Cursor y el asistente de visión enrutado todo escribir `http://127.0.0.1:<listener port>`El mismo puerto `ocx sync` escribe en Codex. En el compañero esas mismas integraciones siguen escribiendo el puerto proxy, que es donde el compañero El socket es.

**Reinicie el proxy después de cambiar este campo, en cualquier forma.** Los sockets se unen una vez en el inicio y los valores de cliente exportados se escriben desde el puerto resuelto, por lo que un proxy en ejecución mantiene su respuesta anterior — en un oyente portado que es la diferencia entre una solicitud servida y una
`404` del oyente.

En un `runtimeRole: "hub"`, este campo es también la puerta en si el concentrador reescribe **Su propio** local configuración de cliente. Con el oyente apagado, `ocx sync`, `ocx ensure` y `ocx restore back` Saltarse el Codex/Grok/Claude escribe y lo dice, nombrando
`unauthenticatedLoopbackListener` En lugar de la `clientIntegrations` alternar.

El oyente sólo sirve `POST /v1/responses`, su actualización WebSocket, `POST /v1/responses/compact`,
`POST /v1/messages` (el cable Anthropic Claude Code y Claude Desktop hablar),
`POST /v1/chat/completions` (el cable de chat OpenAI Cursor y el asistente de visión hablan),
`POST /v1/alpha/search` (el relé de búsqueda web nativo Codex), `GET /v1/models`, y el tiempo real superficie de voz: las actualizaciones independientes WebSocket, creación de llamadas WebRTC (`POST /v1/live`,
`POST /v1/realtime/calls`), y la banda lateral con teclas se unen a las actualizaciones (`/v1/live/{callId}`,
`/v1/realtime/calls/{callId}`, `/v1/realtime?call_id=`) Todo lo demás, incluyendo `/api/*`,
`/healthz`, `/readyz` y el dashboard, vuelve `404` — gestión local lee como
`ocx claude`'s descubrimiento llamada ir a la superficie de gestión autenticada con una gestión Credencial, nunca aquí.

:::danger[Esta interfaz no requiere autenticación]
Cada proceso en la máquina puede usar este oyente. Gasta cuota de cuenta y proveedor pagado credenciales, y puede agotar la capacidad de giro compartida que dependen los clientes remotos autenticados encendido. No lo habilite en un host compartido o multi-tenant.

Vinculación a `127.0.0.1` significa que el kernel rechaza conexiones remotas, pero no detiene un navegador: una página que visita puede hacer que su navegador se conecte a `127.0.0.1`. Por lo tanto, el oyente misma `Host` y `Origin` como un enlace de bucle de retorno ordinario. Desactivado por defecto.
:::

<a id="ssh-port-forwarding"></a>

### Reenvío de puertos SSH

El uso remoto no requiere un enlace remoto. Mantén el loopback y reenvíalo:

```bash
ssh -L 20100:localhost:10100 you@remote
```

Cualquier puerto local funciona. Solicitudes cuyo anfitrión resuelve `localhost`, `127.0.0.1`, o `::1` permanecer Loopback independientemente del puerto, así que `http://localhost:20100/v1` funciona. Establecer esa base URL en el cliente;
`ocx` escribe solo el valor predeterminado local `127.0.0.1` dirección en la configuración del cliente administrado.

El proveedor OAuth escucha las devoluciones de llamada en un puerto remoto fijo. Inicie sesión en la máquina remota o reenvíe que puerto también:

```bash
ssh -L 20100:localhost:10100 -L 1455:localhost:1455 you@remote
```

Si un puerto de devolución de llamada registrado ya está en uso y la superficie de inicio de sesión ofrece entrada manual, OpenCodex mantiene el redireccionamiento registrado URI y devuelve la autorización del proveedor URL. Completar el inicio de sesión del proveedor, luego pegue la redirección final URL desde la barra de direcciones del navegador o la autorización código en OpenCodex. El flujo pendiente conserva el estado y la validación PKCE. Llamadas sin manual entrada sigue fallando cerrado.

:::caution[El bucle local reenviado no requiere autenticación]
Llanura `ssh -L` escucha en su bucle local y es seguro para el enlace no autenticado predeterminado. No lo hagas uso `ssh -g -L`, amplia publicación de contenedores o modos de reenvío que exponen el lado del cliente en
`0.0.0.0`. Vinculación explícita con `ssh -L 127.0.0.1:20100:localhost:10100` cuando no están seguros.
:::

<a id="account-email-masking-privacy"></a>

## Enmascaramiento de correo electrónico de la cuenta (`privacy`)

Los correos electrónicos de la cuenta almacenados están enmascarados en todas partes, dejan el proxy — en las listas de cuentas del panel,
`GET /api/codex-auth/accounts`, `GET /api/oauth/status`, y el `ocx status` logins section todos mostrar `p***n@example.com` En lugar de la dirección en el archivo.

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `privacy.maskEmails?` | `boolean` | `true` | Configurar `false` para mostrar los correos electrónicos almacenados en su totalidad. Ausente, `true`, y cualquier valor mal formado todos siguen enmascarando, por lo que sólo una deliberada `false` revela una dirección. |

Apáguelo cuando ejecute muchas cuentas en una máquina que controle y no pueda diferenciarlas de las demás. formas enmascaradas. Lea el indicador como una decisión de divulgación en lugar de una preferencia de visualización: administración no siempre es loopback, por lo que en un concentrador `remoteGui` una dirección desenmascarada llega a cada principal de gestión que puede llegar al centro, no solo a alguien sentado en la máquina. La bandera mueve solo el campo de correo electrónico — tokens, actualiza tokens y los identificadores de cuenta permanecen redactados De ninguna manera.

```json
{ "privacy": { "maskEmails": false } }
```

`ocx config set privacy.maskEmails false` Fracasa con `config parent path not found` Hasta que el El bloqueo existe, porque `config set` se adentra en los objetos existentes y nunca los crea. Escriba el todo el objeto en su lugar — `ocx config set privacy '{"maskEmails":false}'` — o añadir el bloque
`config.json` mano.

<a id="storage-cleanup"></a>

## Limpieza de almacenamiento

`storageCleanupPolicy` está deshabilitado por defecto. Cuando está habilitado, se ejecuta en `startup`, `daily`, `weekly`, o `manual` después de que los bytes archivados exceden `trigger.archivedBytesOver`. Selecciona los archivos más antiguos para o bien `target.reduceToBytes` o `target.removeOldestPercent`. `mode` por defecto a `quarantine`; utilizar
`permanent` sólo como una opción destructiva explícita. La política persiste `lastRun` y `nextRun`. Configurarlo en la página de almacenamiento o con `GET`/`PUT /api/storage/cleanup-policy`; activar una ejecución manual con `POST /api/storage/cleanup-policy/run`.

<a id="usage-history-size"></a>

## Tamaño del historial de uso

`usageLedgerMaxBytes` está desactivado por defecto, y unset significa que el historial de `usage.jsonl`
Crece sin límites. Nada borra el historial que no pediste haber borrado.

Fijarlo en un techo de bytes y el proxy recorta el archivo después de que un apéndice lo cruza, manteniendo el más reciente filas enteras y dejar caer la más antigua. Se recorta un poco por debajo del techo en lugar de exactamente para que el siguiente apéndice no vuelva a cruzar la línea inmediatamente. El valor mínimo aceptado es 1 MiB; un número más pequeño, o uno que no es un entero seguro, deja el límite fuera en lugar de Falla en la configuración.

Las filas se copian byte por byte y nunca se reescriben, por lo que cada campo sobrevive a un — de recorte que incluye fields una construcción más nueva escribió que una más vieja no entiende. El reemplazo es rechazado directamente si algo se adjunta al libro mayor mientras se ejecuta, por lo que una solicitud registrada durante un ajuste es nunca se perdió; el siguiente agregado lo intenta de nuevo. El recorte también actualiza lo que muestra el panel, por lo que
`/api/logs` deja de servir filas que el libro mayor ya no tiene.

No hay control de panel para esto todavía; configúralo en `config.json` o con
`ocx config set usageLedgerMaxBytes <bytes>`.

<a id="catalog-auto-refresh-catalogautorefresh"></a>

## Auto-actualización de catálogo (`catalogAutoRefresh`)

Habilitado de forma predeterminada cuando OpenCodex administra su cliente local Codex: la sección o `enabled`
puede estar ausente. El proxy actualiza su catálogo de modelos cada 60 minutos, con una actualización inicial Tres minutos después del inicio. Cuando la integración Codex está desactivada, o la instancia se ejecuta como un concentrador o al lado de otro proxy en vivo, la actualización en segundo plano solo se ejecuta con una
`"enabled": true`, y nunca lee fuentes Codex.

```json
{
  "catalogAutoRefresh": { "enabled": true, "intervalMinutes": 60 }
}
```

| Campo | Predeterminado | Significado |
| --- | --- | --- |
| `enabled` | `true` | Configurar `false` para desactivar la actualización automática. |
| `intervalMinutes` | `60` | Actualizar la cadencia; los valores positivos por debajo de 15 se fijan a 15. `0` Desactiva la actualización. |

Cada actualización observa el catálogo incluido del entorno de ejecución Codex seleccionado y, a continuación, calienta autenticado Codex listas de modelos antes de converger la lista servida. Las fallas de origen utilizan la evidencia existente y volver a intentarlo en una garrapata posterior. Las ediciones de cadencia y habilitación tienen efecto en una marca posterior.

Un modelo nativo de OpenAI que la lista de la lista ChatGPT de su cuenta Codex, pero que este OpenCodex lanzamiento no lo sabe todavía, se añade con los metadatos de origen publica para él (nombre, niveles de razonamiento, ventana contextual). OpenCodex recuerda tales modelos en
`discovered-native-models.json` en su directorio de inicio y olvida uno que no ha sido visto durante 14 días. Un lanzamiento posterior que envía el modelo se hace cargo de su fila.

La ejecución de sesiones Codex conserva una lista de modelos en memoria. Cuando el conjunto servido cambia mientras Los servidores de aplicaciones Codex se están ejecutando, el proxy registra una sugerencia de reinicio y registra `reloadRequired`
en su estado de actualización automática. Correr `ocx sync --restart-codex` cuando esté listo para reiniciar esas sesiones. La actualización automática nunca los reinicia.

Cuando una actualización en segundo plano cambia el conjunto servido, OpenCodex también actualiza las integraciones de cliente ya ha escrito: un bloque Grok Build existente, el perfil de puerta de enlace de escritorio Claude lo aplicado (solo mientras ese perfil aún está seleccionado y sin editar, manteniendo su estático, híbrido o ej., modo de descubrimiento), y los bloques propios de integraciones de archivos como OpenCode, Kilo, Pi, omo y Aside. Nunca conecta a un cliente por primera vez, nunca actualiza Cline (detenga Cline y ejecutar `ocx sync` en su lugar), y se salta clientes locales en un concentrador sin el loopback listener. A cliente que no pudo actualizar se cuenta en el registro proxy; `ocx sync` Lo intentaré.

<a id="quota-reset-notifications-quotaresetnotify"></a>

## Notificaciones de restablecimiento de cuotas (`quotaResetNotify`)

Desactivado por defecto. Cuando la sección está ausente, no se ejecuta ninguna detección, no se inicia ningún temporizador y no hay estado El archivo está escrito.

Habilitar que se le diga cuando una ventana de uso restablece — tanto el rollover programado que puede predecir y un restablecimiento fuera de banda no puede:

```json
{
  "quotaResetNotify": {
    "enabled": true,
    "webhookUrl": "https://hooks.slack.com/services/...",
    "kinds": ["scheduled", "surprise"],
    "pollSeconds": 900
  }
}
```

| Campo | Predeterminado | Significado |
| --- | --- | --- |
| `enabled` | `false` | Interruptor maestro. También requiere al menos un fregadero, abajo. |
| `kinds` | ambos | `scheduled` (el plazo ha pasado) o `surprise` (La cuota regresó temprano). |
| `pollSeconds` | `900` | Intervalo de sondeo inactivo; piso 600. `0` Sólo observa el tráfico en vivo. |
| `webhookUrl` | — | `https` POST objetivo para el evento JSON. tratado como un secreto. |
| `allowPrivateNetwork` | `false` | Permitir un destino de bucle invertido o webhook de red privada. |
| `timeoutMs` | `5000` | Tiempo de espera Webhook. |
| `command` | — | Array Argv se ejecuta con el evento JSON en stdin. |

`enabled: true` Con ninguno `webhookUrl` ni `command` resuelve a apagado: un subsistema habilitado sin ningún lugar para entregar es una configuración incorrecta, no un estado medio encendido.

El piso es de 600 segundos porque una encuesta más rápida no puede ver nada nuevo: la observación está limitada por la caché de 10 minutos por cuenta, por lo que un intervalo más corto solo agrega carga a un punto final de cuota los límites de velocidad. Se adopta un valor configurado en la siguiente marca sin reiniciar.

Establecer `pollSeconds` a `0` solo si acepta que se produzca un restablecimiento mientras el proxy está inactivo en la próxima solicitud en lugar de cuando suceda. La encuesta existe porque la noche El caso es el que vale la pena conocer.

<a id="the-delivered-event"></a>

### El evento entregado

```json
{
  "type": "quota_reset",
  "kind": "surprise",
  "scope": "codex",
  "accountTag": "k3f9x2ab",
  "window": "weekly",
  "percentBefore": 96,
  "percentAfter": 4,
  "previousResetAt": 1772000000000,
  "resetAt": 1772400000000,
  "detectedAt": 1771900000000
}
```

`accountTag` es un hash salado por instalación, no un identificador de cuenta: distingue su cuentas entre sí sin decirle al receptor quiénes son. Sin correo electrónico, token, ruta o URL siempre está incluido.

`detectedAt` es cuando el proxy NOTICED, no cuando ocurrió el restablecimiento. La observación está limitada por el caché del proveedor de 5 minutos y el caché de 10 minutos por cuenta, por lo que el instante de restablecimiento solo puede entre paréntesis entre dos observaciones.

<a id="security-notes"></a>

### Notas de seguridad

`webhookUrl` es una credencial — para Slack y Discord, mantener la URL es suficiente para publicar — Así que es redactado por `ocx config show` y excluidos de `ocx config export`.

Un objetivo de webhook que se resuelve a una dirección privada o loopback es rechazado a menos que establezca
`allowPrivateNetwork: true`. El proxy puede llegar a los hosts que su navegador no puede, incluida la nube metadata, por lo que el valor predeterminado asume un receptor externo.

`webhookUrl` debe usar `https`. La carga útil y el URL en sí son sensibles, y un
`http` objetivo los pondría en texto claro; un `http` valor es rechazado cuando la configuración es escrito en lugar de rebajado en silencio.

Se rechaza una redirección en lugar de seguirla. La comprobación de destino anterior valida el URL que configurados, siguiendo un `3xx` entregaría la carga útil en algún lugar no validado — un público El punto final podría rebotar el POST en loopback o una dirección de metadatos. Configurar el URL final directamente; un informe de entrega redirigido `blocked-destination`.

`command` es una matriz argv y nunca se pasa a través de un shell, por lo que sus valores no pueden convertirse en superficie de inyección. La entrega se intenta una vez; no hay reintento.

Lea las detecciones recientes con `ocx provider resets` o `GET /api/quota-resets`.

<a id="api-surfaces-apisurfaces"></a>

## API superficies (`apiSurfaces`)

Responses (`/v1/responses`y Chat Completions (`/v1/chat/completions`) siempre se sirven. El Messages API (`/v1/messages` y `/v1/messages/count_tokens`) se puede cerrar por sí solo.

| Clave | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `apiSurfaces.messages.enabled?` | `boolean` | herede | `true` sirve el Messages API, `false` Rechaza ambas rutas con 403. Unset hereda `claudeCode.enabled`, por lo que una integración Claude que está desactivada también cierra Messages. |

Un valor presente pero mal formado (un no-objeto) `apiSurfaces` o `messages`, o un no booleano
`enabled`) cierra el Messages API en lugar de volver al valor heredado. Ambos Las rutas siempre están de acuerdo.

La página API del panel muestra una tarjeta por cada API con el origen de la configuración (explícito, heredada de la configuración de Claude, o no válida) y una palanca para Messages. Desactivar Messages Allí escribe `apiSurfaces.messages.enabled: false` **y** `claudeCode.enabled: false` en el mismo guardar, por lo que una versión proxy anterior a esta configuración, que solo lee `claudeCode.enabled`, mantiene el punto final cerrado después de una degradación. Encenderlo solo escribe
`apiSurfaces.messages.enabled: true`Una versión anterior sigue
`claudeCode.enabled` y puede mantener Messages cerrado, que es la dirección segura.

<a id="protocol-paths-protocols"></a>

## Vías de protocolo (`protocols`)

Cómo una solicitud Chat Completions o Messages puede comunicarse con un proveedor. Cada valor predeterminado para el comportamiento antes de que existieran estas claves; ver [Rutas de protocolo](/es/guides/protocol-paths/) para la entrega modos, la vista previa y el seguimiento por solicitud.

| Clave | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `protocols.unrepresentable?` | `"legacy" \| "reject"` | `"legacy"` | `legacy` envía una solicitud cuya ruta deja caer una característica y registra la pérdida en el rastro. `reject` se niega con HTTP 400 antes de cualquier envío, nombrando solo las claves de función. |
| `protocols.rollout.nativeChatCombos?` | `boolean` | `false` | Enviar un candidato de Chat elegible dentro de una combinación de forma nativa desde su propia copia del cuerpo del cliente. |
| `protocols.rollout.managedMessagesNative?` | `boolean` | `false` | Envíe Messages de forma nativa a un proveedor directo de Anthropic autenticado por clave en lugar de a través del puente interno Responses. |
| `protocols.rollout.managedMessagesNativeOAuth?` | `boolean` | `false` | Nativo Messages para el `anthropic` Proveedor de OAuth en `api.anthropic.com`, incluidos los fondos de cuentas almacenados. Requiere `managedMessagesNative`. Para el asentado `anthropic` proveedor, una agrupación habilitada proporciona verdadero para banderas nativas ausentes cuando `anthropicAccountPool.nativeMessages` está ausente o es cierto. Los indicadores explícitos falsos/malformados y una preferencia de grupo falso/malformado permanecen desactivados. Otros proveedores y pool-off mantienen el comportamiento de despliegue explícito. Las solicitudes agrupadas elegibles retienen la selección compartida, la afinidad y la recuperación previa de salida limitada. Reconocido JSON-cadena `metadata.user_id` Los UUID de la cuenta están alineados con la credencial OAuth de servicio; se conservan los campos del dispositivo y de la sesión. |
| `protocols.rollout.directEncoders?` | `boolean` | `false` | Codifica las respuestas de Chat y Messages desde un flujo ascendente que no sea Responses directamente desde los eventos del adaptador. |
| `protocols.rollout.antigravityDirect?` | `boolean` | `true` | Envíe una solicitud de Chat o Messages a una única ruta de Antigravedad Google sin el cuerpo interno Responses en ninguna dirección. La configuración de la solicitud aún pasa por las políticas habituales, y una solicitud que el carril no puede llevar usa el puente. Establecer `false` para apagarlo. |
| `protocols.rollout.shadowPlan?` | `boolean` | `false` | Compare cada ruta de Chat o solicitud Messages con el plan que predice una vista previa y marque un desacuerdo como `planMismatch` en su fila de troncos. No envía nada extra. |

Los bloques de protocolo mal formados conservan una directiva nativa deshabilitada conservadora cuando se cargan desde el disco. Los indicadores nativos ausentes válidos pueden heredar valores predeterminados del grupo Anthropic elegibles; explícito falso o mal formado Las banderas se quedan fuera. Las escrituras validadas rechazan la entrada malformada.

```json
{
  "protocols": {
    "unrepresentable": "legacy",
    "rollout": { "shadowPlan": true }
  }
}
```

`ocx api policy` muestra los valores resueltos y los cambia a través del proxy en ejecución (`--unrepresentable <legacy|reject>`, `--rollout <switch>=<on|off>`, `--messages <on|off>` por
[`apiSurfaces`](#api-surfaces-apisurfaces)) Escribe solo cuando se da una bandera de ajuste. Los página API del panel y `PATCH /api/protocols/settings` utilizar la misma validación.

## Claude Code (`claudeCode`)

Estos configuración gobiernan `/v1/messages`, `/v1/messages/count_tokens`, el `ocx claude` y la página del panel de control Claude. Si el Messages API es servido en absoluto se decide por [`apiSurfaces`](#api-surfaces-apisurfaces)que heredan `claudeCode.enabled` mientras que unset.

| Clave | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `claudeCode.bodyStallSec?` | `number` | `90` | El presupuesto de inactividad del cuerpo pasa a través de nativo en segundos mientras una lectura está pendiente, no la duración total. Mínimo 1; exactamente `0` Desactivación. |
| `claudeCode.bodyMaxBytes?` | `number` | `67108864` | Tapa corporal de paso natural acumulativa para respuestas transmitidas y tamponadas. Exactamente. `0` Desactivación. |
| `claudeCode.compatibility?` | `"shadow" \| "enforce"` | unset | Admisión de compatibilidad opcional para traducciones `/v1/messages` solicitudes. `shadow` registra características no compatibles y continúa; `enforce` devuelve un 400 en forma de Anthropic antes de la inferencia. El paso de Anthropic nativo permanece sin cambios. |
| `claudeCode.authMode?` | `"proxy" \| "subscription"` | auto | Cómo se maneja el lanzamiento `ANTHROPIC_AUTH_TOKEN`. Detecta automáticamente cada lanzamiento; nunca se anula un valor explícito. |
| `claudeCode.authModeMigratedAt?` | `string` | unset | Marcador interno de actualización única. No lo configure manualmente. |
| `claudeCode.classifierModel?` | `string` | unset | Objetivo explícito para el clasificador de modo automático Claude Code gira, como calificado `provider/model` (Por ejemplo `RelayA/claude-opus-5`) El modo automático envía controles de seguridad desnudos, como `claude-opus-5` sin proveedor, así que sin esto caen a través `defaultProvider` — que puede no hablar Anthropic en absoluto. No se infiere nada automáticamente: solo se utiliza un objetivo que declaras aquí. |
| `claudeCode.classifierFallbacks?` | `string[]` | unset | Los objetivos del clasificador se utilizan cuando `classifierModel` no está establecido. Mismo calificado `provider/model` La primera entrada útil gana. Una explícita `modelMap` La entrada para el modelo de clasificador sigue superando a ambos. |
| `claudeCode.subagentEffort?` | `"low" \| "medium" \| "high" \| "xhigh" \| "max"` | herede | Esfuerzo escrito a generado `~/.claude/agents/ocx-*.md`; separado de la guía Codex y las tapas del proxy. Reiniciar a través `ocx claude` para regenerar. |

La política de compatibilidad se aplica a Claude Code, Desktop y otros clientes que utilizan traducciones Messages, incluyendo `?beta=true` Solicitudes de no streaming. Todos los objetivos traducidos utilizan el misma política conservadora, incluidos los adaptadores Anthropic y Responses nativos. Rechaza contenido del documento, repetición de pensamiento/pensamiento redactado, herramientas de búsqueda y ejecución alojadas, referencias de búsqueda de herramientas, carga diferida activa, herramientas estrictas, modos de llamada no predeterminados, Formatos de salida estructurados, intención explícita de nivel de servicio, características del conector MCP, contexto gestión, contenedores, colocación de inferencias y campos o bloques de protocolo no compatibles.

Unset conserva la traducción heredada. Sugerencias de caché, ejemplos de entrada de herramientas y ejemplos ordinarios Los configuración de pensamiento/esfuerzo se admiten deliberadamente con posible degradación: este ajuste no garantiza puntos de interrupción de caché ni TTL, ejemplos retenidos, presupuestos de pensamiento exacto o Traducción sin pérdidas. Los encabezados beta por sí solos no se validan para el soporte de características. Sombra La evidencia contiene solo códigos de protocolo fijos y razones derivadas, retenidas en los registros de solicitudes. y `usage.jsonl` y restablecido al reiniciar. Un modo no válido devuelve un 503 fijo error de configuración en Messages traducido. Configure el valor en `config.json` y reinicie el proxy para cargarlo; no hay un setter GUI dedicado. Count-tokens y directo Las API de Responses/Chat están fuera de esta política; contar exitosamente con token no implica Admisión Messages. Esta configuración no agrega un límite de autorización global.

La autenticación automática selecciona la suscripción cuando se encuentra la autenticación Claude almacenada, proxy cuando no se encuentra ninguna y suscripción con una advertencia cuando la detección no es concluyente. Véase
[Modo de autenticación Claude Code](/es/guides/claude-code/#auth-mode).

<a id="retained-requests-after-compaction"></a>

## Solicitudes retenidas después de la compactación

Para proveedores traducidos y puertas de enlace Responses enrutadas, OpenCodex encuadra automáticamente solicitudes de usuario en texto plano antes del último punto de control Codex legible como contexto histórico. No se deben repetir los informes de los puntos de control completados; el texto retenido permanece disponible para trabajos inconclusos dentro de su autorización existente. Más tarde, la entrada del usuario tiene prioridad. incluyendo pausas, cancelaciones y cambios de alcance. Un punto de control no otorga ningún permiso nuevo.

Esto está habilitado de forma predeterminada y no necesita configuración. Texto original de la solicitud y hilo canónico/reproducción La historia se conserva. Nativo OpenAI Responses passthrough, summer turns, envoltorios de contexto, Las imágenes/archivos y los elementos del asistente/herramienta no se modifican. El encuadre se aplica a los puntos de control de texto plano comenzando con el prefijo sumario de Codex; los puntos de control decodificados de OpenCodex conservan sus valores existentes orientación continua. El sintetizador del lado del cliente gira utilizando el indicador de compactación estándar de Codex También evitar el encuadre. El encuadre es una instrucción rápida, por lo que el comportamiento del modelo puede variar.

<a id="compaction-routing"></a>

## Enrutamiento de compactación

En **Cuadro de mandos → Descripción general → Enrutamiento de compactación**, elija un modelo, que activa se aplica a, un esfuerzo de razonamiento opcional, y si la anulación cubre todos los modelos fuente o solo los seleccionados fuentes. Para fuentes seleccionadas, verifique los modelos individuales o el proveedor en general. `provider/*` entradas, luego haga clic **Guardar**. Seleccionar **Usar el modelo de conversación** y guardar para eliminar la anulación. Cambios aplicar a la siguiente solicitud de compactación sin reiniciar el proxy.

Establecer `compactionRouting` en OpenCodex `config.json` para anular la compactación del modelo Codex Solicitudes de uso. La configuración está desactivada cuando se omite.

```json
{
  "compactionRouting": {
    "model": "provider/model-id",
    "reasoningEffort": "low",
    "triggers": ["manual"]
  }
}
```

`model` acepta ID de modelo nativos, ID de modelo calificados por el proveedor y combos configurados. Opcional `sourceModels` limita la anulación a los ID de modelo entrantes exactos o `provider/*` patrones, por ejemplo `["kimi/*", "google-antigravity/*"]`. El emparejamiento es sensible a las mayúsculas. Omitalo por el comportamiento existente de todos los modelos; las listas vacías, duplicadas o mal formadas no son válidas. El Dashboard source-scope selector puede editar la lista de permisos y conserva los selectores guardados ausentes del actual catálogo. La lista de verificación del modelo muestra como máximo 300 entradas coincidentes; use su campo de búsqueda para reducir grandes catálogos sin eliminar las selecciones guardadas. También puedes editarlo a través de `config.json` o `PUT /api/settings`. Esto comprueba el modelo de compactación entrante, no un modelo de conversación inferido. Si Codex envía un modelo de compactación nativo desnudo para un hilo enrutado, no coincide con esos patrones de proveedor y mantiene su ruta existente. Este comportamiento conservador protege a GPT pero puede dejar algunos compactaciones en el camino nativo. Los turnos ordinarios de no compactación nunca cambian.

`reasoningEffort` es opcional; omítelo para preservar el esfuerzo entrante. Declaraciones apoyadas son `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, y `ultra`. Se siguen aplicando las reglas de esfuerzo del proveedor existentes. El nativo `/responses/compact` punto final mantiene su comportamiento existente y no reenvía configuración de razonamiento.

`triggers` Nombres que la compactación solicita que cubra la anulación, usando el propio nombre de Codex
`compaction.trigger` valores: `"manual"` por a `/compact` usted escribió, `"auto"` Para el automatico Codex se ejecuta cuando un subproceso se acerca a su límite de contexto. Omita `triggers` y el Anular se aplica a manual `/compact` solo, dejando la compactación automática exactamente donde Rutas hoy. Uso `["auto"]` o `["manual", "auto"]` También para la compactación automática.

La compactación automática de enrutamiento es lo que permite que un hilo largo en un proveedor enrutado siga adelante cuando la cuota canónica OpenAI se ha agotado. Codex elige un modelo nativo desnudo para la compactación a su vez, y OpenCodex reserva eso para un canónico habilitado `openai` proveedor cada vez que uno existe, por lo que la compactación falla con un error de cuota antes de que comience el giro enrutado, aunque El hilo mismo corre a otra parte. Naming `"auto"` Aquí señala la compactación a modelo calificado por el proveedor con sus propias credenciales y cuota solo cuando `sourceModels` se omite o coincide con el modelo entrante. Una lista que contiene sólo `provider/*` Las entradas no cubren un modelo de compactación nativo.

OpenCodex solo cambia las solicitudes con explícito `request_kind: "compaction"` metadatos, cuyos
`compaction.trigger` es uno de los valores que usted enumeró, enviado a `/v1/responses/compact` o a
`/v1/responses` con un `compaction_trigger` elemento de entrada. Más tarde la conversación se convierte en mantener su Enrutamiento y configuración originales. Los metadatos faltantes, mal formados o conflictivos no activan el anular, incluso en clientes antiguos sin metadatos de activación; cuando varias copias del Los metadatos se suministran y deben nombrar el mismo desencadenante. Las peticiones WebSocket utilizan cada fotograma metadatos en lugar de los metadatos de enlace anteriores de la conexión.

El proveedor del modelo seleccionado recibe toda la conversación para su resumen, incluyendo conversaciones que normalmente se ejecutan en otro proveedor. Un combo selecciona un destino por su estrategia de enrutamiento y puede volver a intentar la misma conversación en otro. objetivo después de un fallo reintentable, por lo que uno o más objetivos pueden recibirlo. El panel de control indica esto junto al selector de modelos y nombra el proveedor de destino, o los proveedores de destino del combo, una vez que se elige un modelo. Cuando la anulación cubre la compactación automática, esa transferencia ocurre sin que usted lo pida, en cualquier punto que Codex decida compactar; el panel del panel también lo dice. La anulación reutiliza los manejadores de compactación y los formatos de resumen existentes. Cuando el modelo comparte el proveedor del modelo de conversación y la identidad de enrutamiento de la cuenta (nombre del proveedor, ej., modo de cuenta Codex y espacio de nombres de cuenta), la solicitud conserva la credencial del llamante y puede use el punto final compacto nativo de ese backend. De lo contrario, incluso cuando cualquiera de los lados es un combo o el modelo de conversación se recuerda como un objetivo combinado, OpenCodex ejecuta el sintetizador portátil en su lugar, por lo que el resumen se mantiene legible cuando la conversación se reanuda en su propio La credencial de la persona que llama no se cruza con el otro proveedor. El modelo seleccionado debe apoyar el tamaño de entrada y contenido. Para resúmenes portátiles de Responses, alojados `web_search_call` historia artículos se convierten en notas de referencia etiquetadas del asistente, porque la solicitud de resumen no tiene herramientas. Conocidos estado, consultas de búsqueda, URLs visitadas, patrones de búsqueda y metadatos de origen se conservan, con valores y listas recortados y como máximo 64 KiB de notas por solicitud de resumen; estado opaco y Los campos desconocidos o mal formados se omiten. Estas notas describen las acciones de búsqueda pasadas, no buscadas contenido de la página o nuevas instrucciones. El texto de la respuesta existente, las citas y los resultados ordinarios de la herramienta permanecen disponible. Las solicitudes Lite retienen `parallel_tool_calls=false`, lo que requiere el flujo ascendente incluso Sin declaraciones de herramientas. Esto cambia solo la solicitud de resumen, no el historial almacenado o el nativo compactación; un resumen fallido no reemplaza la historia. Reiniciar el proxy después de editar
`config.json` mano. Las reservas del panel de control se aplican inmediatamente.

<a id="reasoning-retention-during-compaction"></a>

### Razonamiento de retención durante la compactación

La retención de razonamiento legible es una opción avanzada, explícita y **por defecto**. Solo `reasoningRetention.enabled: true` lo habilita; un bloque omitido, `enabled: false`, o límites heredados sin `enabled: true` dejar el comportamiento de compactación ordinario sin cambios. Cuando está habilitado para la v1 enrutada `POST /v1/responses/compact` Enrutado v2 `compaction_trigger` peticiones, el razonamiento legible se mantiene local mientras El modelo resume otro contexto. Después de que un resumen legible tenga éxito, el texto exacto retenido regresa a su lado en mensajes contextuales históricos enmarcados, no como nuevos razonamientos o instrucciones auxiliares. La compactación repetida retiene esos mensajes de nuevo. Los giros posteriores ordinarios los repiten como historia.

```json
{
  "reasoningRetention": {
    "enabled": true,
    "maxContextPercent": 20,
    "maxTokens": 100000
  }
}
```

Ambos campos de límite son opcionales y, **cuando está habilitado**, por defecto en entorno de ejecución `20` porcentaje y `100000` estimado tokens. El límite efectivo es el menor del porcentaje de la ventana de contexto del modelo de compactación. y el límite absoluto token; cuando se desconoce la ventana de contexto, solo se aplica el límite absoluto. La estimación incluye el marco histórico-contexto de cada mensaje retenido, no solo su texto de razonamiento. Por encima del límite, el texto legible está escrito textualmente bajo la resolución OpenCodex
`reasoning-archive/` (normalmente `~/.opencodex/reasoning-archive/`) El resumidor recibe un Nota de ruta en lugar del texto, y el resumen legible terminado incluye un aviso que nombra ese archivo. Los nuevos archivos son privados para el usuario en POSIX. Un archivo es provisional hasta la historia de reemplazo exitosa. devuelve su camino, ya sea en un resumen legible o en un aviso separado junto con un resultado nativo después de la conmutación por error combinada v1 enrutada. Fallos, cancelaciones y resúmenes no válidos el archivo del intento actual. Los reintentos internos lo reutilizan; los archivos previamente exitosos se conservan. La compactación fallida no devuelve ningún historial de reemplazo.

Los límites porcentuales y de tokens acotan el razonamiento devuelto al contexto, **no el almacenamiento acumulado de los archivos**. Cada archivo contiene solo el razonamiento legible admitido en esa solicitud; la admisión está limitada por `maxInboundBodyBytes` (256 MiB de forma predeterminada, configurable hasta 512 MiB), más pequeños separadores de bloques.

El directorio de archivos tiene un límite independiente, fijado en el código, de **512 MiB y 256 archivos**. Incluye los archivos completos, los restos provisionales y los demás archivos regulares del directorio. Un recorrido acotado y en streaming se detiene cuando ya es seguro que debe rechazar la operación; las entradas que no sean archivos regulares o que no puedan inspeccionarse provocan un rechazo seguro.
Una transacción SQLite en un archivo adyacente serializa el recorrido, la creación exclusiva, la escritura y el cierre entre los procesos que usan este mecanismo. La capacidad se comprueba **antes de escribir el contenido de un archivo nuevo**; adquirir el bloqueo y registrar la propiedad local todavía puede escribir archivos de bloqueo o metadatos.
Este límite no garantiza que haya espacio físico libre ni controla las escrituras de versiones anteriores o herramientas externas. **No hay vencimiento automático ni limpieza de archivos en segundo plano**.

Si el almacenamiento está lleno, la compactación enrutada rechaza el contenido nuevo con HTTP 503 `reasoning_archive_quota_exceeded`: revisa y elimina manualmente los archivos antiguos antes de reintentar la misma solicitud. HTTP 503 `reasoning_archive_busy` indica que otro proceso mantiene el bloqueo; espera a que termine y reintenta. HTTP 503 `reasoning_archive_unavailable` requiere comprobar los permisos del directorio y el estado del almacenamiento. Estas respuestas no exponen rutas del sistema de archivos ni causas internas, y no inventan un plazo Retry-After. Un archivo rechazado no trunca el razonamiento ni elimina archivos anteriores; una compactación fallida no devuelve un historial de reemplazo.

Los archivos completados se conservan hasta que los elimines manualmente, incluso después de desactivar la retención o restablecer esa opción. Están en texto sin cifrar, contienen razonamiento de conversaciones potencialmente sensible y usan el directorio de datos de OpenCodex resuelto para esa instancia del proxy. Si eliminas un archivo, los avisos que indiquen su ruta ya no podrán recuperar el contenido; guarda primero lo que necesites. Un cierre inesperado del proceso o un fallo al escribir o limpiar el sistema de archivos también puede dejar un archivo provisional que debas eliminar manualmente.



**Panel de control → Visión general → Configuración avanzada → Razonamiento retención** proporciona el interruptor explícito y ambos límites; **Restablecer y desactivar** elimina la anulación y desactiva la retención. GET/PUT `/api/settings` exponga `reasoningRetention`: null despeja el bloque, y la omisión lo preserva. `enabled` Debe ser un booleano cuando esté presente. Los porcentajes deben ser mayores que 0 y como máximo 100; token tapas deben ser enteros positivos, y los campos desconocidos son rechazados. Las ediciones de mano no válidas solo desactivan esto Bloquear con una advertencia, manteniendo proveedores y configuración no relacionadas.

El texto cifrado del proveedor privado y las firmas no se descifran ni se copian en un dispositivo portátil retenido. mensajes. Una respuesta de compactación opaca nativa de origen conserva su elemento de salida exacto y texto cifrado. Si la conmutación por error combinada v1 alcanza un resultado nativo después de retener el razonamiento legible, El historial de reemplazo también incluye los mensajes históricos retenidos o un aviso que nombra su archivo. Los puntos finales nativos compactos mantienen su comportamiento existente.

La ruta v2 todavía devuelve exactamente un elemento de compactación. Su propiedad proxy `ocx2:` tiendas de sobres el resumen y el razonamiento histórico retenido por separado como JSON/Base64; esto es codificación, no cifrado del proveedor. Las solicitudes posteriores restauran mensajes históricos separados, y La compactación repetida retiene el razonamiento de nuevo. Viejo `ocx1:` Los resúmenes siguen siendo apoyados. La recuperación de compactación de emergencia opt-in también preserva esta separación para JSON y SSE. La recuperación explícita de la historia nativa también restaura mensajes de razonamiento histórico y resumen separados.

<a id="memory-routing"></a>

## Enrutamiento de memoria

En **Dashboard → Descripción general → Enrutamiento de memoria**, elegir un modelo y un esfuerzo de razonamiento opcional para cada una de las dos fases de memoria de Codex, luego haga clic en **Guardar**. Seleccionar **Desactivado** y guardar en Retire el override. Los cambios se aplican a la siguiente solicitud de memoria sin reiniciar el proxy.

Establecer `memoryModels` en OpenCodex `config.json` encaminar esas solicitudes. Con el bloque omitido, Ambas fases mantienen su ruta existente. Las fases son independientes: configurar uno deja el otros solos.

```json
{
  "memoryModels": {
    "extract": { "model": "provider/model-id", "reasoningEffort": "low" },
    "consolidation": { "model": "provider/model-id", "reasoningEffort": "medium" }
  }
}
```

`extract` es el pase que resume una sesión terminada en una memoria en bruto; `consolidation` es el un solo agente que fusiona esas memorias en bruto en los archivos bajo `$CODEX_HOME/memories`.
`model` acepta ID de modelos nativos, ID de modelos calificados por proveedores y combos configurados.
`reasoningEffort` es opcional; omitalo para mantener el esfuerzo Codex solicitado. Las declaraciones apoyadas son
`none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, y `ultra`. Códigos duros Codex `low` por extracto y `medium` para la consolidación, por lo que un esfuerzo configurado reemplaza ese valor.

OpenCodex reconoce estas solicitudes desde los metadatos de turno propios de Codex: `request_kind: "memory"` en la `x-codex-turn-metadata` el encabezado marca un paso de extracción, y `thread_source:
"memory_consolidation"` marca el hilo de consolidación. En HTTP, una solicitud cuya
`x-openai-subagent` Nombres de encabezado `memory_consolidation` cuenta como un paso de consolidación solo cuando Los metadatos están ausentes. Los metadatos explícitos no relacionados con la memoria ganan sobre esa reserva. El ID del modelo es deliberadamente no es una señal: el paso de extracción se ejecuta en el mismo modelo de ayudante Codex utiliza títulos y mensajes de confirmación, por lo que una regla basada en modelos también capturaría los mensajes ordinarios. Llamadas de ayuda. Los metadatos faltantes, mal formados o conflictivos no activan la anulación; cuando Se suministran varias copias de los metadatos que deben nombrar la misma fase. WebSocket solicitudes de uso metadatos de cada marco en lugar de los metadatos de enlace anteriores de la conexión — el puente vuelve a unir el apretón de manos `x-openai-subagent` encabezado a cada marco, de modo que el encabezado nombre el conexión, no el paso de corriente, y no es una señal websocket.

Una fase configurada gana cuando `shadowCallIntercept` coincidiría con la misma petición. Una fase sobrante mantiene su enrutamiento actual, incluyendo cualquier regla de llamada a la sombra existente que coincida con su modelo. Los proveedor del modelo seleccionado recibe el texto de sesión Codex resume para la memoria, incluyendo sesiones que normalmente se ejecutan en otro proveedor; el panel de control indica esto junto al modelo recolectores. Una fase cuyo objetivo dejó de resolver — el proveedor es desactivado o eliminado, o su combo ya no existe — falla esa llamada de memoria con `409` y código de error
`memory_model_target_unavailable` en lugar de volver al proveedor predeterminado. El registro de solicitudes nombre de la fase (`memory-extract` o `memory-consolidation`) como la razón de enrutamiento. Reinicie el proxy después de editar `config.json` mano. Las reservas del panel de control se aplican inmediatamente.

<a id="shadow-calls"></a>

## Llamadas de sombra

Codex utiliza pequeños modelos de ayuda para tareas como títulos y mensajes de confirmación. Habilitar
`shadowCallIntercept` para redirigir prefijos de modelo de origen reconocidos a otro modelo configurado. Los El reemplazo mantiene el esfuerzo de razonamiento configurado de la solicitud. Establecer `sourceModels` Solo cuando un cliente utiliza diferentes identificadores de ayuda. Un no vacío `sourceModels` reemplaza los prefijos predeterminados en lugar de Extendiéndolos, así que incluya `gpt-6-luna` (y `gpt-5.6-luna` para clientes 0.145.0-0.153.x) en el lista cuando los clientes actuales aún deben ser interceptados. Los identificadores de modelos desnudos que coincidan son elegibles para la interceptación, pero los turnos explícitos del usuario mantienen sus preferencias. modelo: `x-codex-turn-metadata` Debe contener ambos `request_kind: "turn"` y `thread_source: "user"`. Los niños desvencijados también mantienen su modelo, identificado por el `x-openai-subagent: collab_spawn` cabecera de conexión (solicitud HTTP o WebSocket) actualización) o metadatos `subagent_kind: "thread_spawn"`. En WebSocket, los metadatos de giro provienen solo de cada marco `client_metadata["x-codex-turn-metadata"]`; los metadatos de turno de la actualización nunca clasifican fotogramas posteriores. Los metadatos faltantes o mal formados mantienen el comportamiento de interceptación existente. Los ayudantes también pueden llevar
`request_kind: "turn"`, por lo que el campo por sí solo no los exime. Procedencia de mantenimiento como
`x-openai-subagent: compact`/`review` o `thread_source: "memory_consolidation"` sigue siendo elegible, Sujeto a enrutamiento de memoria configurado. Estas reglas se aplican a los objetivos concretos y combinados.

```json
{
  "shadowCallIntercept": {
    "enabled": true,
    "model": "gpt-5.5",
    "sourceModels": ["gpt-6-luna", "gpt-5.6-luna"]
  }
}
```

<a id="when-the-target-is-unavailable"></a>

### Cuando el objetivo no está disponible

El reemplazo es el único destino que eligió el operador, por lo que un objetivo que deja de resolverse falla. el ayudante llama en lugar de enviarlo a otra parte. Cuando el proveedor del objetivo está deshabilitado o eliminado, o su combo ya no existe, una petición interceptada devuelve `409` con código de error
`intercept_target_unavailable` antes de que cualquier cosa sea enviada de origen. El registro de solicitudes registra lo mismo código. La solicitud no se pasa al modelo de ayudante nativo y no vuelve a caer en el proveedor predeterminado, porque cualquiera de los dos cambiaría el destino, las credenciales y el costo sin su elección. Un objetivo combinado o de perfil de enrutamiento aún falla entre sus propios miembros. Un cualificado Objetivo como `provider/model` cuyos nombres de segmento de proveedor nada configurado se trata de la misma manera manera, y la configuración API se niega a guardar uno. Un id de modelo desnudo que se resuelve a través del valor predeterminado El proveedor permanece válido.

Desactivación (`PATCH /api/providers?name=<provider>` con `disabled: true`) o eliminar a un proveedor que El objetivo se resuelve para tener éxito; la respuesta añade `dependentShadowIntercept: { model, enabled }`
y el panel muestra una advertencia. Volver a habilitar el proveedor, o elegir otro objetivo, restaura interceptación.

<a id="sidecars"></a>

## Sidecares

### `images` (`OcxImagesConfig`)

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `provider?` | `string` | selección automática OpenAI | API-clave personalizada explícita `openai-responses` proveedor para `/v1/images/generations` y `/v1/images/edits`. Los ID gestionados por el registro son rechazados. |
| `timeoutMs?` | `number` | `300000` | Tiempo de espera de solicitud completa para una solicitud de imágenes independiente. |

La selección explícita no se cierra cuando el proveedor está ausente, desactivado, incompatible o carece de un clave utilizable; nunca vuelve a caer a otra pagada de origen. El endpoint debe implementar el OpenAI Imágenes API rutas y forma de respuesta esperado por Codex.

Ambos bucles de búsqueda se mantienen `web_search` declarado después de que se agote el presupuesto de búsqueda. Las llamadas adicionales reciben un resultado de límite alcanzado emparejado sin otra búsqueda física; como máximo `maxSearchesPerTurn + 3` Las iteraciones del modelo se ejecutan antes de un error de terminal. Las herramientas ordinarias de llamadas y la cancelación aún terminan el ciclo. La recuperación de respuesta vacía elimina todas las herramientas.

### `webSearchSidecar` (`OcxWebSearchSidecarConfig`)

Los adaptadores RunTurn también utilizan el sidecar de búsqueda configurado. Los giros de búsqueda preservan los latidos del corazón. Un primer evento OAuth 429 rota la cuenta en la solicitud inicial y en cada solicitud de respuesta posterior a la búsqueda. La repetición mantiene la herramienta de búsqueda y los resultados recopilados. Con `emptyCompletionRetry: true`, una respuesta vacía antes del límite de búsqueda recibe un reintento usando la conversación actual y los resultados recopilados. La recuperación sin herramientas existente después del límite de búsqueda sigue estando disponible independientemente de esa configuración. Las fallas de origen detienen el turno en lugar de desencadenar otra búsqueda.

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `enabled?` | `boolean` | encendido cuando usable | Interruptor maestro. Cuando es false, OpenCodex deja de interceptar `web_search` AND escribe la integración Codex `web_search = "disabled"` en `~/.codex/config.toml`. |
| `backend?` | `"openai" \| "anthropic" \| "xai" \| "gemini" \| "exa"` | `openai` | Explícito gana; unset siempre resuelve a `openai`. `anthropic` y `xai` ejecutar solo cuando esté configurado explícitamente; `gemini` y `exa` permanecerán reservados hasta que sus ejecutores naveguen. |
| `model?` | `string` | backend-dependiente | `gpt-5.6-luna` para OpenAI, `claude-sonnet-5` para Anthropic, o `grok-4.6` para xAI. Legado explícito `gpt-5.4-mini` migra al comienzo. |
| `exaApiKey?` | `string` | ninguno | La clave de operador para el `exa` backend. Solo escritura: las lecturas de administración nunca devuelven el valor almacenado. |
| `xSearch?` | `object` | omitido | xAI-only opt-in para alojado `x_search`: `enabled`mutuamente excluyentes `allowedXHandles` / `excludedXHandles` matrices (máximo 20), y ISO `fromDate` / `toDate` (`YYYY-MM-DD`). |
| `reasoning?` | `string` | `low` | Esfuerzo de sidecar. `minimal` Se rechaza con la búsqueda web. |
| `maxSearchesPerTurn?` | `number` | `3` | Búsquedas reales permitidas por turno de modelo principal. |
| `routedModelStallTimeoutMs?` | `number` | `200000` | Fecha límite de inactividad del modelo raw-body. Integer 1–2147483647; cada fragmento no vacío lo restablece. |
| `timeoutMs?` | `number` | `60000` | Fecha límite para una búsqueda alojada. |

El backend OpenAI requiere un inicio de sesión ChatGPT y habilitada ChatGPT `forward` proveedor. Claude-inbound enrutado repeticiones inyectar principal ChatGPT auth en la solicitud interna. El Anthropic backend utiliza la credencial almacenada activa de un Anthropic OAuth proveedor. Una selección explícita Anthropic
backend sin cuenta utilizable falla cerrado en lugar de caer hacia atrás. El Anthropic El ejecutor utiliza su `web_search_20250305` herramienta. El xAI backend requiere un almacenamiento utilizable Grok OAuth cuenta, usos alojados `web_search`, y añade alojado `x_search` cuando `xSearch.enabled` Es cierto. Malformado `xSearch`
entradas de gestión `400`; un bloque persistente mal formado falla cerrado durante la planificación. Los
`gemini` y `exa` Los carriles nunca se activan desde el descubrimiento de credenciales o reserva; el operador debe seleccionarlas explícitamente. `exaApiKey` se acepta en escrituras pero se omite de las respuestas de la administración.

Cuatro relojes gobiernan la búsqueda: base `stallTimeoutSec`, `connectTimeoutMs`, inactividad de modelo dirigido, y tiempo de espera de búsqueda alojada. El perro guardián del puente efectivo es el máximo más 30 segundos. El puesto de ruta es un guardia de inactividad, no una fecha límite de generación total.

### `visionSidecar` (`OcxVisionSidecarConfig`)

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `enabled?` | `boolean` | encendido cuando usable | Interruptor maestro de descripción de imágenes. |
| `backend?` | `"openai" \| "anthropic"` | auto | Ganancias explícitas; unset prefiere un almacenamiento utilizable Anthropic OAuth credencial, si no `openai`. |
| `model?` | `string` | backend-dependiente | `gpt-5.6-luna` para OpenAI o `claude-sonnet-5` para Anthropic. |
| `maxDescriptionsPerTurn?` | `number` | `8` | Nueva descripción caché falla admitido por turno principal. `0` Deshabilita las llamadas; los valores no válidos usan el valor predeterminado. |
| `timeoutMs?` | `number` | `45000` | Sidecar fetch tiempo de espera. Integer 1–2147483647. |

La visión se activa solo para las imágenes enviadas a un modelo en el `noVisionModels`. OpenAI tiene el mismos requisitos de inicio de sesión/reenvío que la búsqueda; Anthropic explícitamente seleccionado falla cerrado sin una Credencial. Exitoso `data:` descripciones utilizan una caché limitada por el backend, modelo, detalle, bytes de imagen, y contexto normalizado del mensaje. Los hits y duplicados del mismo turno no consumen el límite. Remota `https:` Las imágenes y descripciones fallidas o vacías no se almacenan en caché.

Anthropic OAuth sidecars reutilización opencodex's existentes Claude Code OAuth huella dactilar. Remoje-prueba la cuenta prevista y la carga de trabajo.

<a id="remote-hub-keys-and-defaults"></a>

## Claves y valores predeterminados del concentrador remoto

`runtimeRole` por defecto a `standalone`. Un hub utiliza `hub.managementPublicOrigin`, solo bucle `hub.managementIngress` (`enabled:false` cuando están ausentes), y exacto `remoteGui.allowedTailscaleUsers` (vacío cuando está ausente). Una clave de datos del cliente vive en `service-api-token`, nunca `config.json`; rotación puede crear temporalmente `service-api-token.prev`. Las tiendas de uso no se reflejan.

| Clave | Tipo | Predeterminado cuando está ausente | Lo que hace |
| --- | --- | --- | --- |
| `hub.managementPublicOrigin` | cadena | unset | El origen de administración canónico al que se puede acceder desde un concentrador anuncia, por ejemplo, las impresiones Tailscale Serve de origen HTTPS. Es lo que `/readyz` Informes como `managementUrl` mientras `runtimeRole` es `hub`; con él, el concentrador vuelve a cualquier origen en el que haya llegado cada solicitud, por lo que a un cliente detrás de un frontend diferente se le puede entregar una dirección a la que no pueda llegar. |
| `hub.dataPublicOrigin` | cadena | unset | El origen canónico que un cliente remoto debe marcar para el **datos** plano, por ejemplo el origen HTTPS un frontend TLS publica delante del enlace de red de cola. Solo asesoramiento: nunca es una dirección de enlace y cambiarla no mueve ningún socket. `ocx hub invite` imprime como el URL posicional de la `ocx connect` línea, volviendo a `http://<hostname>:<port>` —, que es una dirección LAN/tailnet que un equipo remoto puede no ser capaz de alcanzar más de TLS, así que configure esto en cualquier concentrador con un frontend. A diferencia de la mayoría de las teclas opcionales, es **no** silenciosamente caído cuando está mal formado: se rechaza un error tipográfico en el momento de escribir, porque volver a la dirección de enlace es exactamente lo que el campo existe para evitar. |
| `hub.managementIngress` | `{enabled:false}` o `{enabled:true, port}` | `{enabled:false}` | Un oyente adicional solo de administración para un frontend local HTTPS. El nombre de host no es configurable: cuando está habilitado, el socket siempre se enlaza `127.0.0.1`, y sólo GUI, arranque de sesión y gestión API Se admiten rutas de plano de datos. Las rutas de plano de datos se rechazan antes del envío. |
| `remoteGui.allowedTailscaleUsers` | string[] | `[]` (vacía — nadie) | Se permite que las identidades de inicio de sesión exactas de escala de cola se emitan en una sesión GUI remota automática. Los `Tailscale-User-Login` El encabezado es de confianza **solo** en la entrada de gestión separada; una lista vacía significa que ninguna identidad remota puede acuñar una sesión, que es el valor predeterminado seguro en lugar de un descuido. Las identidades se comparan exactamente, por lo que un error tipográfico niega silenciosamente el acceso. |
| `remoteGui.allowInsecureHttp` | booleano | unset | **El — retirado no tiene efecto.** Una vez permitió un intercambio de emparejamiento único sobre HTTP de texto plano no bucle. Una concesión de emparejamiento ahora solo cruza el bucle de retorno o HTTPS autenticado. La clave sigue siendo analizada, por lo que un `config.json` sigue cargando (el esquema es estricto, y soltar la clave directamente haría que una configuración más antigua no se cargue por completo); `true` se informa una vez y luego se ignora. Elimínelo de su configuración. |

Un concentrador al que se puede acceder desde un navegador necesita `hub.managementPublicOrigin` Al menos una entrada en `remoteGui.allowedTailscaleUsers`. Establecer el origen sin la lista de usuarios produce un concentrador que se anuncia correctamente y luego rechaza cada sesión; configurando la lista de usuarios sin origin produce sesiones señaladas en cualquier origen que la solicitud haya utilizado.

`dataPublicOrigin` y `managementPublicOrigin` dos anuncios independientes, y en un verdadero implementación son dos sockets diferentes: la gestión es el ingreso solo de bucle publicado en 443, datos es el enlace tailnet publicado en su propio puerto HTTPS. Son las dos mitades de lo que
`ocx hub invite` impresiones, y `managementPublicOrigin` es el más estricto de los dos — una concesión de emparejamiento lo registra como el origen del servidor de la concesión y el intercambio se compara con él, por lo que
`ocx hub invite --management-url` Sólo puede *confirmar* el valor configurado y rechaza uno que difiere. `--data-url` realmente es una anulación, porque nada está ligado a ella. Con ninguno
`dataPublicOrigin` ni `--data-url` conjunto, `invite` vuelve a la dirección de enlace — y en un loopback o comodín, donde eso resolvería el propio loopback de esta máquina, se niega en lugar de anunciar una dirección que la otra máquina no puede usar.

Un centro que sirve a sus propios clientes locales también establece
[`unauthenticatedLoopbackListener`](#local-clients-that-cannot-receive-the-token). Su puerto-menos La forma complementaria es lo que hace que un concentrador sea una implementación de un solo puerto, y se rechaza en un bucle de retroceso o comodín `hostname`donde el público oyente ya `127.0.0.1:<port>`.


<a id="experimental-native-response-controls"></a>

## Controles de respuesta nativos experimentales

`codexNativeSteering` y `codexNativeInjection` Activar por separado, por defecto nativo WebSocket rutas de control. Vea la guía canónica para
[Rutas y configuración de dirección compatibles](/es/guides/codex-integration/#steering-continuation-settings),
[resultado tipeado y continuaciones de aprobación](/es/guides/codex-integration/#rich-tool-results-and-explicit-approvals-after-response-completion), y [los plazos de confirmación y el contexto conservado](/es/guides/codex-integration/#steering-confirmation-deadlines-and-retained-context).

<a id="forced-claude-code-subagent-model"></a>

### Modelo de subagente forzado Claude Code

La página Subagentes ofrece **Fuerza a todos los subagentes en un modelo**, fuera por defecto. Seleccione una identificación de estilo de lista expuesta, como `combo/tev-auto`A continuación, habilite el interruptor. La lista se ofrece primero; las entradas de la lista guardadas no disponibles no pueden ser objetivos forzados.

`ocx agent subagents force combo/tev-auto` conjuntos `claudeCode.subagentModelForce`; `ocx agent subagents force -` Lo aclara. `ocx agent status` informa el establecimiento. `GET /api/subagent-models` devoluciones `force`, `forceAvailable`, y `forceStatus`; `PUT` acepta `{ "force": "combo/tev-auto" }` o `{ "force": null }` Sin cambiar el roster. Omisión `force` Lo deja sin cambios. Los objetivos inválidos o no expuestos son rechazados en la escritura; los objetivos obsoletos son reportados y omitidos en el lanzamiento.

Esto tiene efecto en el **siguiente routed `ocx claude` lanzamiento**, inyección `CLAUDE_CODE_SUBAGENT_MODEL` como un alias proxy explícito (con `[1m]` solo para una ventana autorizada de un millón de token; los objetivos nativos Claude usan un alias nativo reversible) y `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. Cada variable no vacía exportada por el shell gana independientemente. Los lanzamientos nativos no inyectan ninguna variable; simple `claude` No se ve afectado. No hay archivos de plugin o `settings.json` son modificados por esta configuración.

Claude Code **2.1.257 o más reciente** es necesario para FORCE. Los argumentos del modelo Plugin y los agentes integrados (incluyendo Explorar/Plan) y por llamada se anulan. bifurcaciones y habilidades de subagente con `model: inherit` mantener el modelo de conversación principal. El bucle principal y los sidecars de pequeño-rápido no se ven afectados. Los archivos de la lista existentes permanecen disponibles.

El panel de control advierte sobre versiones antiguas o desconocidas de CLI, objetivos no disponibles y cualquier variable que ya esté presente en el sistema. `settings.json` → `env` (que anula env de lanzamiento). La detección es de solo lectura y local en el servidor: no puede inspeccionar otro shell de lanzamiento, otra máquina o la configuración local del proyecto. Un resultado desconocido no es prueba de apoyo a la fuerza.

<a id="historical-pool-continuity"></a>

## Continuidad histórica de la grupo

Los techos de la agrupación de proveedores utilizan el proveedor enrutado canónico. Para cada proveedor actualmente configurado
`P`, OpenCodex enlaza automáticamente su alias de grupo salado, `h(pool, P)`, a `P` cuando lees balanzas. No se necesita un automapeo manual o cálculo de sal para la independencia. techos de proveedores. Esta regla también se aplica a los saldos históricos retenidos con ese alias exacto.

Los registros de solicitudes todavía usan etiquetas de visualización específicas de la cuenta. Una etiqueta histórica diferente, incluyendo un ordinal de la cuenta, no establece la propiedad del proveedor. Con `spend.pool.maxTokens`Cada original El equilibrio contribuye una vez a su grupo de proveedores vinculados o, cuando aún no está unido y es positivo, a cada uno de los grupos de proveedores. Candidatos de pool. El uso establecido, reservado y no resuelto cuenta; el uso desconocido no es un reembolso. Por lo tanto, el historial no vinculado puede restringir un grupo que de otro modo no se usaría. Orden y visualización de la cuenta corriente Los nombres no resuelven esa historia. Los techos de raíz e identidad siguen siendo independientes.

Para etiquetas históricas distintas cuya propiedad haya verificado, agregue asignaciones al nivel superior
`spendPoolAliases` objeto en `config.json`. Cada clave es un hexadecimal en minúsculas exacto de 32 caracteres pool alias de la revista de esta instalación; cada valor es el ID exacto de un archivo verificado, actualmente proveedor canónico configurado, sin espacios en blanco circundantes. Mantenga la evidencia para el mapeo y mantenga el diario y la sal en privado.

Autoencuadernaciones automáticas y asignaciones explícitas se aplican solo cuando se leen los saldos. Ellos no se mueven saldos originales o persisten vínculos de identidad en la revista. Eliminación de un mapeo histórico explícito hace que el historial se desvincule de nuevo a menos que su alias sea un alias del proveedor configurado actualmente. Conservar `spendPoolAliases` fuera `spend`, porque las versiones más antiguas rechazan campos desconocidos dentro de esa Sección estricta. Las asignaciones no válidas se rechazan en las escrituras; las ediciones de mano inválidas retienen los techos y los límites. Rechazar la entrada a la grupo. Un alias de grupo salado propio de un proveedor configurado no puede asignarse a otro proveedor. Esto se comprueba de nuevo cuando el proveedor establece cambios. La validación lee una sal existente sin Creando uno.

La historia inactiva no enlazada expira sólo después de que su última actividad sea estrictamente más antigua que la anterior.
`spend.retentionDays`. La presión de capacidad no puede acortar ese intervalo para la historia positiva desconocida. Las reservas en vivo y los objetivos iniciales permanecen protegidos, incluso a cero tokens. La limpieza persiste a un nivel normal El registro de eliminación de diario antes de la admisión utiliza el total reducido. Los grupos conocidos mantienen lo ordinario protecciones activas/agotadas. Ninguna herramienta automática reconstruye asignaciones no verificables.

<a id="token-reservations-and-reporting"></a>

### Reservas de tokens e informes

Cuando se aplica un techo de raíz, identidad o grupo, el primer envío físico para cada destino/clave seleccionado Requiere una reserva de capacidad normal. Si esto no se puede registrar, el envío es rechazado antes de que llega a upstream. Los reintentos estables reutilizan los alcances de esa reserva; un objetivo/clave diferente necesita un nueva. `L` es el límite de envío físico de toda la solicitud, congelado cuando se inicia la solicitud (por defecto cuatro; el perfil de solicitud OAuth acotado existente permite hasta dieciocho). Cada envío físico adicional comparte este límite finito.

El estado de aplicación, los techos token raíz/identidad/grupo aplicables, y `L` Son capturados cuando cada Solicitud de inicio. Los cambios de configuración se aplican solo a las solicitudes iniciadas después del cambio. Solicitudes mantener su política de partida para todos los reintentos y continuaciones: habilitar o reducir un techo no los aprieta, y levantar o quitar un techo no los relaja. Una solicitud que se inició en el modo de solo observación permanece solo observación hasta que finaliza.

Los informes retrasados retienen el uso ya iniciado. Asentamiento de terminales espera a reporteros y envía identificaciones se olvidan solo después de que su contabilidad es duradera; olvidar una identificación no elimina su saldo. El límite de límites se reintenta, no la factura final: el uso real o los reintentos ya iniciados pueden exceder un límite. token estiman, y su responsabilidad total sigue siendo contada. Sin techo aplicable, el comportamiento se mantiene Observar solo, incluyendo las reservas omitidas cuando la capacidad de seguimiento está llena. No hay controles de identidad agregado para el tráfico no configurado.

Claude CLI, CodeBuddy y Qoder cuentan cada invocación CLI como un envío. Su primera invocación todavía necesita una reserva normal y es rechazada si esa reserva no se puede obtener. Interno Los reintentos y giros de herramientas CLI no consumen por separado este límite de envío para toda la solicitud; su costo se liquida a partir del uso real reportado, incluyendo cantidades por encima de la estimación inicial. Esta excepción preserva el uso de CLI con gastar techos mientras se limita el número de invocaciones de niños.

<a id="rollback-to-2800-contract-c"></a>

### Retroceder a 2.80.0: contrato C

Los nuevos registros utilizan el formato v1 existente y `pool` Dominio alias. **2.80.0 sin modificar los lee Sus propias reglas por etiqueta**, incluida la compactación y retención ordinarias. No se requiere backport, valla lanzadora o comando de reconciliación. Mantenga el diario actual y la sal: restaurar una copia anterior pierde el gasto registrado desde esa copia.

Esto no preserva la agregación canónica después de la degradación, ni promete el mismo resto. asignación que 2.80.0 habría calculado para tráfico idéntico sin la actualización. Puede reservar nuevo tráfico bajo las etiquetas de cuenta. En la re-actualización, los actuales auto-encuadernaciones del proveedor configurado y explícito Las asignaciones de alias se aplican a los saldos originales que aún se conservan en 2.80.0. Los nuevos puntos de control no contienen metadatos de enlace de identidad que Un lector más viejo debe preservar.

Revistas escritas por compilaciones experimentales no publicadas con `pool-current` alias o `poolContinuity`
los metadatos están excluidos de este contrato de compatibilidad, incluidos los puntos de control posteriores que Alias. Sus saldos originales y objetivos siguen siendo conservadores historia hasta la normalidad retención expira; no se convierten ni se eliminan inmediatamente.

Un registro diario inválido completo (incluyendo un final `null`) hace que la admisión configurada se niegue. La compactación aún puede preservar la contabilidad válida en un punto de control limpio; el rechazo en vivo permanece hasta que se complete el proceso. un reinicio limpio lo reproduce. Una línea final desgarrada e inconmensurable mantiene el comportamiento de recuperación existente. Uso de denegaciones de almacenamiento/corrupción `workflow_spend_undurable`; los archivos inseguros y las fallas de propiedad permanecen errores de almacenamiento. Uso de fallos de validación de Alias `workflow_pool_history_unresolved`.
