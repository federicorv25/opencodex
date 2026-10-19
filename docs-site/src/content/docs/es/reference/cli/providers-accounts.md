---
title: "CLI Proveedores, cuentas y modelos"
description: "Comandos de configuración, credenciales, cuota y catálogo de proveedores."
---

Estos comandos configuran los proveedores de flujo ascendente, autentican las cuentas, administran los grupos de credenciales y controlan el catálogo de modelos expuestos a Codex.

Errores del argumento sobrante de `account list`, `account current`, perfiles principales nativos, y comandos de proveedor redactan valores de opciones de credenciales, incluyendo `--code`, `--token`,
`--api-key`, `--key`, `--secret`, `--password`, y `--admin-token`, en ambos
`--option value` y `--option=value` formas. El registro de proveedores locales utiliza
`ocx provider add <name> --api-key <key>`; un en línea `--api-key=<key>` es rechazada con su valor redactado. `ocx provider edit` No acepta `--api-key`.

<a id="providers"></a>

## Proveedores

### `ocx provider <subcommand>`

Gestión de proveedores no interactivos. Las entradas del registro se siembran por nombre; un nombre personalizado requiere ambos `--adapter` y `--base-url`.

| Subcomando | Banderas soportadas | Acción |
| --- | --- | --- |
| `list` | `--json`, `--jsonl` | Listar los proveedores configurados y las entradas de registro restantes; `--jsonl` Emite un objeto de proveedor configurado por línea. |
| `add <name>` | `--adapter <adapter>`, `--base-url <url>`, `--api-key <key>`, `--responses-path <path>`, `--auth-mode <key\|forward\|oauth\|local>`, `--default-model <model>`, `--set-default`, `--force`, `--json`, `--sync`, `--live` | Guardar localmente de forma predeterminada; `--sync` intenta la sincronización del cliente en cualquier modo de salida. `--live` escribe a través del proxy en ejecución y no puede combinar con `--sync`. `--force` Permite sobreescribir. |
| `edit <name>` | banderas de campo del proveedor, `--headers <json>`, `--model-context-tier <model=default\|long_context>`, `--upstream-http-version <http1.1\|->`, `--fast <on\|off>`, `--context-window <N\|->`, `--json` | Edite los campos de proveedores activos validados sin reemplazar los grupos de claves. Repetir `--model-context-tier` para múltiples modelos de Copiloto. `--headers` combina encabezados de solicitud personalizados; pase `{}` o `-` para despejarlas. |
| `test <name>` | `--model <id>`, `--yes`, `--json` | Comprobar descubrimiento; con `--model`, solicite una prueba de finalización confirmada. |
| `show <name>` | `--json` | Mostrar la configuración con las teclas API enmascaradas. |
| `remove <name>` | `--json`, `--live`, `--yes` | La eliminación local rechaza el proveedor predeterminado y el último. La eliminación en vivo requiere `--yes` y utiliza comprobaciones de dependencia del servidor, reasignación predeterminada y limpieza de cuenta/modelo personalizado. |
| `set-default <name>` | `--json`, `--live` | Seleccione un valor predeterminado local o actualice el proxy en ejecución con `--live`. |
| `pacing <name>` | `--json`, `--enabled <on\|off>`, `--rpm <number>`, `--min-interval-ms <integer>`, `--max-concurrent <integer>`, `--file <FILE\|->` | Lea las reglas configuradas y el estado en entorno de ejecución; actualice escalares o reemplace las reglas de un archivo. Las banderas de archivo y escalar son exclusivas. |
| `snapshot` | `--json` | Lea un documento de proveedor-editor público redactado y validado desde el proxy en ejecución. |
| `apply` | `--baseline <FILE\|->`, `--file <FILE\|->`, `--yes`, `--json` | Aplicar un documento editor revisado con una comparación de línea de base; las eliminaciones/renombramientos requieren `--yes`. |
| `selected <name>` | `--set <ids>`, `--clear`, `--json` | Lea o actualice la lista de permisos del modelo de proveedor. |
| `quota` | `--refresh`, `--json` | Lea los informes de cuotas del proveedor. |
| `resets` | `--limit <n>`, `--json` | Listar los restablecimientos de ventana de cuota detectados recientemente. |
| `presets` | `--json` | Listar los configuración preestablecidos del proveedor del panel de control. |
| `account-mode` | `pool`, `direct`, `--json` | Seleccione el enrutamiento de cuenta agrupado o directo Codex. |

```bash
ocx provider list --json
ocx provider list --jsonl        # one configured provider object per line
ocx provider test ark
ocx provider add anthropic --set-default --sync
ocx provider add local-dev --adapter openai-chat --base-url http://localhost:11434/v1
ocx provider show anthropic --json
ocx provider edit github-copilot --model-context-tier gpt-5.6-luna=long_context
ocx models --provider anthropic --json
ocx models live --provider ark --json
```

`--jsonl` escribe solo proveedores configurados, un objeto JSON por línea y omite el
`registryCount` Resumen de `--json`. Cada objeto tiene los mismos campos que un elemento en el `configured` matriz. Utilícelo para scripts que procesan un objeto de proveedor configurado por línea.
`--json` y `--jsonl` No se puede combinar.

:::caution[Los encabezados personalizados no son un canal para credenciales]
`--headers` es para los metadatos de solicitud no secreta — sugerencias de enrutamiento, inquilino o selectores de proyectos, identificaciones de rastreo. Es **no** un lugar para poner autenticación material, y el validador rechaza los nombres de encabezado de credenciales estándar (`Authorization`, `X-Api-Key`, `Cookie`, y el resto) con un puntero a
`apiKey` / `authMode`.

El validador no puede reconocer un nombre arbitrario como `X-My-Token`, así que La frontera es tuya para respetarla. Dos razones por las que importa:

- El JSON es un argumento de línea de comandos, por lo que un secreto en él aterriza en la historia de la shell y en la lista de procesos, donde cualquier otro proceso en la máquina puede leerlo antes de que el CLI redacte algo.
- Los valores de encabezado se mantienen en `config.json` en texto claro, a diferencia de las teclas API, que tienen su propio camino de almacenamiento y enmascaramiento.

Utilice el inicio de sesión de credenciales compatible o el flujo stdin para la entrada secreta. No coloque claves en una transcripción de agente o copiarlas en ejemplos de comandos.
:::

<a id="local-saves-and-live-provider-state"></a>

### Estado de los locales guardados y del proveedor en vivo

Comience con el descubrimiento fuera de línea: `ocx provider --help`Entonces la hoja `--help`.
`list` y `show` leer la configuración local; `add`, `remove`, y `set-default`
También puede utilizar la configuración local a menos que se indique `--live`. Otros proveedores de gestión Las operaciones a continuación requieren un proxy en ejecución. Comprobar `ocx ready --json` y
`ocx status --json` antes del trabajo en vivo para confirmar el objetivo y la versión previstos. Una lista local no establece que el proxy adoptó un cambio guardado.

Local `provider add <name> --json` informes `needsSync: true`. Adición `--sync`
realmente intenta la sincronización tanto en JSON como en los modos de salida humanos. Es recibo añade `sync: {status, ok}`; sólo `status: "applied"` con `ok: true` borra
`needsSync`. Sin proxy (`not-running`), la sincronización rechazada o la sincronización fallida devuelve no cero mientras se preserva el ahorro local. Los resultados omitidos por políticas o solo por catálogo pueden salir 0 con `needsSync: true`; no son una sincronización de cliente aplicada. La propiedad del catálogo o los rechazos de seguridad de configuración guardada dejan el catálogo sin cambios, salida de retorno 1, y mostrar la guía de recuperación en la producción humana o `sync.warning` en JSON, incluso si la inyección de configuración tuvo éxito.

Para cambios en vivo autorizados:

```bash
ocx provider snapshot --json
ocx provider add anthropic --live --json
ocx provider set-default anthropic --live --json
ocx provider snapshot --json
```

Live add utiliza los configuración preestablecidos del objetivo y rechaza un proveedor existente observado sin `--force`. El upsert de comprobación y servidor no son atómicos: cambios concurrentes Puede competir. Los proveedores personalizados aún necesitan `--adapter` y `--base-url`. `--live`
nunca vuelve a caer en un ahorro local; combinándolo con `--sync` es inválida. Las credenciales pertenecen al login humano o flujo stdin admitido, no a los ejemplos de CLI.

Para eliminar un proveedor autorizado, utilice `ocx provider remove <name> --live --yes --json`. El servidor comprueba las dependencias y aplica la reasignación predeterminada y cuenta/modelo personalizado Limpieza. Inspeccione el recibo y lea de nuevo el destino después de escribir.

Un recibo en vivo puede ser `{"success":true,"name":"example","catalogRefresh":{"status":"committed","changed":true,"degraded":false,"notices":[]}}`.
`success` significa que la configuración persiste; no prueba por sí mismo el catálogo convergencia. Por ejemplo, `{"success":true,"name":"example","catalogRefresh":{"status":"skipped","reason":"busy","retryable":true}}`
devuelve la salida 1 aunque el salvamento haya tenido éxito. Falló la actualización, o salta para
`stale`, `refused` y `catalog-unavailable`, también devuelve nonzero. Conservar degradado avisos. Nulo, ausente o `not-requested` puede salir 0 sin sincronización de cliente. Lea antes de la recuperación; no repita una escritura persistente para reparar la convergencia. Los errores usan prosa segura en stderr, incluso en el modo JSON, en lugar de una envolvente de error JSON.

`provider test <name>` sin `--model` comprueba la conectividad de descubrimiento de modelo ascendente. Una conexión fallida sale 1; éxito y un catálogo estático sin salida 0 de punto final de descubrimiento aplicable.
`applicable: false` es un resultado estático-catalógico esperado, inferencia no exitosa o una conexión fallida.

Para enviar una solicitud de finalización para un modelo elegido, utilice:

```bash
ocx provider test my-relay --model my-model
ocx provider test my-relay --model my-model --yes --json
```

Esta prueba puede incurrir en cargos del proveedor. Un terminal interactivo pide confirmación;
`--yes` acepta la advertencia de cargo. Uso no interactivo y `--json` requieren
`--yes`. Usando `--yes` sin `--model` es un error de uso. Rechazar la confirmación no envía ninguna petición y sale 1. El comando utiliza la administración del proxy en ejecución API.

La prueba de finalización envía el mensaje fijo `Reply exactly OK.`, solicita un límite de salida 32-token, se detiene después de 20 segundos o 64 KiB y nunca vuelve a intentar o falla. Es compatible con los proveedores de chat OpenAI y Responses locales, incluidos por-modelo de anulaciones de cables. Deshabilitado, OAuth, reenviado-auth y adaptador no compatible ni las configuración de transporte devuelven una razón de aplicabilidad sin enviar una finalización. Perfiles TLS, pines de versión HTTP, ritmo de solicitud habilitado y ejecutores personalizados con Actualmente no se admite la anulación de un proxy de proveedor.

Los resultados incluyen el tiempo hasta el primer delta de texto (TTFT), la latencia total, la ID de modelo de cable, metadatos de modelo ascendente desinfectados y una coincidencia distinta, desajuste o comparación desconocida. Se desconocen los metadatos faltantes o conflictivos. La comparación usa el id de flujo ascendente antes del enmascaramiento, contra el id enviado realmente después del alias y manejo de sufijos. Los metadatos reportados por el proveedor no pueden verificar la identidad del modelo:
`identityVerified` es siempre `false`. No se devuelve el texto generado. Un fracaso la terminación sale 1; el éxito y un resultado no aplicable salen 0.

<a id="transport-settings-and-request-pacing"></a>

### Configuración de transporte y ritmo de solicitud

`provider edit` ya está vivo. Uso `--upstream-http-version http1.1` Para fijar que protocolo, o `--upstream-http-version -` No lo puedo evitar. `--fast on|off` alternar rápido;
`--context-window N` establece una anulación de proveedor positiva y `--context-window -`
Lo aclara. Los configuración omitidos permanecen sin cambios; cero no es una operación clara.

```bash
ocx provider pacing anthropic --json
ocx provider pacing anthropic --enabled on --rpm 30 --min-interval-ms 1000 --max-concurrent 2 --json
ocx provider pacing anthropic --json
```

Vuelve la lectura `{provider, rules, status}`. `rules: null` significa no configurado;
`status` contiene observaciones de cola/temporización en entorno de ejecución separadas. Banderas numéricas solas no habilitar un bloque no configurado; `--enabled off` Desactiva el ritmo. RPM acepta Validación de los valores fraccionarios positivos. Intervalo/concurrencia requieren enteros positivos.

Las ediciones escalares preservan las reglas de modelo observadas, pero PATCH reemplaza el conjunto bloque sin CAS, por lo que se puede sobrescribir una edición concurrente. Usar instantánea/aplicación por debajo de cuando se requiere la comparación inicial. Para un objeto de reglas completo, incluyendo reglas específicas del modelo, uso `ocx provider pacing anthropic --file pacing.json --json`. Un archivo de reglas mínimas es `{"enabled":true,"requestsPerMinute":30}`. Modo de archivo reemplaza todo el bloque y no se puede combinar con banderas escalares. `--file -`
lee stdin canalizado; se aplican los límites de entrada a continuación.

<a id="snapshot-edit-and-apply-with-a-baseline"></a>

### Instantánea, editar y aplicar con una línea de base

Mantenga el mismo host previsto y el contexto CLI en estos pasos. Fijación de objetivos dura dentro de una invocación; las instantáneas no contienen ninguna identidad de destino token.

```bash
ocx provider snapshot --json > providers.baseline.json
cp providers.baseline.json providers.next.json
```

Edite el siguiente archivo y revise la diferencia mientras conserva la línea base original. Cada documento contiene exactamente `{defaultProvider, providers}`. Snapshot es un Proyección del editor redactado de solo lectura, no exportación de configuración sin procesar. No añadas secretos, campos derivados o desconocidos: credenciales, cualquier `headers` Campo y marcadores de visualización (`hasApiKey`, `hasHeaders`, `xaiResponsesOptInState`, `initialModelSelection`) son no editable por lotes. La exportación de configuración en bruto puede exponer credenciales y pertenece en un terminal operado por humanos fuera de una sesión de agente.

```bash
ocx provider apply --baseline providers.baseline.json --file providers.next.json --json
ocx provider snapshot --json
```

Añadir `--yes` solo para eliminaciones o cambios de nombre revisados y autorizados. Lote PUT conserva valores privados intactos y utiliza la línea de base pública para detectar conflictos. Lo hace **no** Realizar un solo proveedor DELETE's OAuth limpieza de cuentas. HTTP 409 devuelve la salida 5: tome una nueva instantánea, revise los cambios simultáneos y reconstruya la edición propuesta. No reemplace la línea base ni vuelva a intentarlo automáticamente. Los resultados de escritura desconocidos requieren inspección, no una suposición de retroceso.

Utilice archivos UTF-8 JSON regulares o canalizados explícitos `-`; a lo sumo una entrada de lote puede Sean Stdin. Cada entrada tiene un límite de 4 MiB y una fecha límite de lectura de 30 segundos. El combinado serializado `{baseline,next}` solicitud también debe caber 4 MiB. Stdin interactivo, archivos especiales, banderas en conflicto, campos no válidos y eliminaciones no confirmadas son Rechazado antes de la mutación con salida 2. Los errores de entrada nunca se hacen eco de los valores enviados.

<a id="authentication"></a>

## Autenticación

<a id="diagnosing-missing-main-account-quota"></a>

### Diagnosticar la cuota de cuenta principal faltante

`ocx account list openai --quota --refresh --json` Incluye un `quotaRefresh` objeto en la fila de la cuenta principal cuando esa operación intenta leer el uso de WHAM. El existente
`GET /api/codex-auth/accounts?refresh=1` La respuesta expone el mismo diagnóstico.

Es `status` es `ok`, `not_reported` (sin cuota parseable en una respuesta exitosa),
`http_error`, `timeout`, `network_error`, `invalid_response`, o `internal_error`. Solo `http_error` Incluye un número `httpStatus`. Sin respuesta en bruto, mensaje de error, credencial, o identificador de cuenta se incluye en este objeto. Cache-sólo lee, Los aplazamientos de credenciales y las instantáneas de cuenta invalidadas lo omiten; servidores más antiguos También lo omite. La ausencia no es prueba de éxito. Se mantiene un estado HTTP sin éxito
`http_error` aunque su cuerpo de error no pueda ser leído; `timeout` y `network_error`
describir fallos antes de los encabezados o mientras se lee una respuesta exitosa.

Un inicio de sesión válido no garantiza que esta solicitud de uso por separado tenga éxito. Estas categorías no cambian la autenticación, la selección de cuentas o la cuota. frescura reglas, y no convertir cuota desconocida en uso cero. Este diagnóstico actualmente cubre la cuenta principal nativa, no las actualizaciones de la cuenta de grupo. Cuando informe de la cuota faltante, comparta la categoría y el estado HTTP en lugar de las credenciales archivos o una captura de red sin formato.

### `ocx login <provider>`

Inicie el flujo de acceso registrado del proveedor. Los proveedores de cuentas estilo OAuth abren un navegador y una tienda credenciales bajo `~/.opencodex/` (tokens actualizable gira automáticamente; la llave durable concede tal como OrcaRouter son reutilizados hasta que el proveedor los revoca); Los proveedores de inicio de sesión API-key abren su panel de control clave, clave, validarlo cuando sea posible y guardar la configuración del proveedor resultante. El comando imprime el Los identificadores de proveedor OAuth y API actualmente aceptados cuando el nombre falta o es desconocido.

El OAuth fallido inicia sesión con el estado 1 e imprime un diagnóstico fijo: el estado y el estándar HTTP Código de error OAuth (por ejemplo: `invalid_grant`) cuando el proveedor devolvió uno, `network_error` o
`timeout` cuando no se pudo contactar al proveedor, `configuration_error` La razón cuando a configuración local, como un espacio de nombres de cuenta Codex, bloquea el inicio de `oauth_authentication_failed`
De lo contrario. Pool 2 (`anthropic2`) también informes `configuration_error` antes de indicar cuando una costumbre proveedor posee ese nombre o su archivo de configuración no se puede leer ni analizar.

Utilice el mismo comando para **reautenticar** después `ocx status` / `ocx doctor` informes Se requiere una reautenticación o un fallo de actualización del terminal (o utilice Reauthenticate en el panel de control). Las cuentas de grupo Codex no son uno de esos proveedores de claves OAuth o API, pero `ocx login codex` alcances De todos modos: se dirige al inicio de sesión del grupo de cuentas, por lo que `ocx login codex --reauth` es lo mismo que
`ocx account reauth codex`. El grupo de cuentas del panel Codex (Reautenticate) también lo hace. Esa ruta se ejecuta dentro del proxy, por lo que necesita uno en ejecución.

Para el proveedor de ChatGPT OAuth, un terminal explícito OAuth confirma que ha expirado o la concesión de actualización revocada requiere volver a iniciar sesión. Las descripciones de texto libre nunca requieren una reautenticación. Temporal token-servicio fallas, tiempos de espera y cancelación salir de la cuenta elegibles para una actualización posterior. Navegador token intercambio y actualizar cada uno tiene un segundo 30 plazo por-fetch que cubre los encabezados y el cuerpo. Los errores derivados de HTTP solo muestran el estado y un código OAuth permitido. Cancelación, tiempo de espera y fallos de transporte uso fijo mensajes sin la razón o causa original.

```bash
ocx login xai
ocx login anthropic
ocx login orcarouter-oauth # browser consent + S256 PKCE
ocx login orcarouter       # paste an existing API key
ocx login anthropic --headless # no browser, no local port
```

`--headless` corre el **code-display** inicio de sesión para los hosts cuyo navegador no puede llegar al loopback del proxy callback (contenedores, servidores remotos). El comando imprime una autorización URL; apruébela en cualquier navegador, y el proveedor muestra un `code#state` string para volver a pegar en el indicador. Sin puerto de devolución de llamada No se abre ningún navegador. Solo `anthropic` y `anthropic2` soporte hoy; cualquier otro proveedor sale con la lista de proveedores que lo hacen. Para las cuentas Codex, utilice el inicio de sesión con código de dispositivo en su lugar,
`ocx account login codex --device` — `ocx login codex --headless` Es rechazado en lugar de transmitido. La ventana de pegado es de 10 minutos, y cada inicio de sesión acepta un código: si el intercambio falla, inicie un nuevo inicio de sesión. Un inicio de sesión exitoso se convierte en la cuenta activa del proveedor, exactamente como un inicio de sesión en el navegador.

La reautenticación OAuth conserva la configuración del operador, como selecciones de modelo, anulaciones de precios, y preferencias de conmutación por error de cuenta. Campos de transporte/autenticación de inicio de sesión y de registro Se actualizan los metadatos del catálogo. Un proveedor de live-discovery mantiene su modelo predeterminado seleccionado; un El proveedor estático puede reemplazar un valor predeterminado que ya no existe en su catálogo actualizado.

Para la antigravedad, un upstream `401` puede actualizar las credenciales OAuth de la cuenta rechazada y Vuelva a intentar la solicitud una vez. El reintento utiliza el proyecto Cloud Code Assist de esa credencial. Si refresca Si el proyecto no se puede utilizar o falla, la solicitud devuelve un error de autenticación; use el flujo de reautenticación arriba. Un segundo `401` no inicia otro ciclo de actualización/reintentar. A `403` solicitar verificar las cuarentenas de la cuenta que acreditan como `needs-reauth(verify)`; Cuando la conmutación por error de la cuenta está habilitada, la solicitud puede volver a intentar en otra cuenta elegible. Completar Verificación de cuenta de Google, luego ejecutar `ocx login google-antigravity`. Actualización silenciosa token no aclara este requisito de verificación. Si OpenCodex no puede guardar la cuarentena, este intercambio de adaptador conserva el original `403` sin otro envío de recuperación; la cuenta no se ha puesto en cuarentena de forma duradera. Si no se puede construir o admitir una solicitud de hermano para el envío, el intercambio entrega el original. `403` mediante el formato de error normal. Un combo adjunto o una ruta de directiva aún pueden aplicar sus reglas de reserva existentes.

Para las solicitudes de búsqueda web basadas en fetch, la rotación automática de hermanos solo acepta una rotación completa y limitada. Sobre de error Google que contiene `error.details[].reason === "VALIDATION_REQUIRED"`. Verificación La redacción por sí sola no rota. Esta recuperación con alcance de solicitud utiliza el token y el proyecto del hermano Sin persistir a `needs-reauth` marca; cancelación, producción comprometida, agotamiento del presupuesto o un El hermano no disponible preserva el fracaso.

Un proxy que ya se está ejecutando recoge la nueva credencial sin reiniciar: el CLI le pide que recargar ese único proveedor desde el disco, y la solicitud no lleva ninguna credencial propia. Si el El proxy en ejecución no puede aceptar esa solicitud — la mayoría de las veces porque comenzó desde una compilación anterior — el inicio de sesión todavía tiene éxito y la credencial todavía está escrita en el disco, pero el El proceso en vivo sigue sirviendo al anterior. El CLI lo dice y te pide que reinicies:

```
⚠️  A proxy is running but could not reload this provider (unattested-target).
   The credential is saved to disk; the running proxy keeps using the previous one.
   Restart it to pick this up: ocx restart
```

### `ocx logout <provider>`

Quite la credencial OAuth almacenada localmente de forma predeterminada. `--json` informes
`{schemaVersion:1, ok, provider, removed}`; falta de credenciales volver
`reason: "not_found"` y salida 4, mientras que la eliminación devuelve la salida 0.

Para un cierre de sesión solicitado en el proxy en ejecución, `ocx logout <provider> --live --json`
acepta proveedores públicos de OAuth y devoluciones
`{schemaVersion:1, success:true, provider, live:true}`. No cierra sesión Codex/native-main o eliminar una cuenta seleccionada. Nunca elimina las credenciales locales antes de la solicitud en vivo o vuelve a la eliminación local después del fallo.

<a id="accounts-and-key-pools"></a>

## Cuentas y grupos de claves

<a id="pool-policy-account-thresholds-and-paid-credit-intent"></a>

### Política Pool, umbrales de cuenta e intención de crédito pagado

Lee la ayuda sin conexión y, a continuación, la política del objetivo seleccionado antes de cambiarla:

```bash
ocx account pool --help
ocx account pool openai --json
ocx account pool anthropic --json
```

Estas son las lecturas de gestión en vivo. La respuesta incluye `provider`, `kind`,
`supported`, política de almacenamiento nullable, `enabledEffective` y opcional `inert`. Solo campos nombrados por `supported` puede ser escrito; nulo no es falso, y un inerte La política no es la agrupación activa. Umbral cero y `enabled:false` son independientes. Uso `--enabled on|off`, `--threshold 0..100`, `--strategy`, `--sticky 1..100`, y
`--quota-window` sólo donde se apoya. OpenAI no admite grupo habilitado/ventana escribe; `reset-first` es para OpenAI y grupos genéricos OAuth (nunca Anthropic), `least-loaded` Solo Kiro y ventanas Anthropic son `five-hour`, `weekly`, `max-utilization`. Los campos omitidos permanecen sin cambios. Leer campos DTO como rutas, concurrencia por cuenta o Anthropic `nativeMessages`
no implica un setter en este comando; use solo las opciones listadas de CLI. Un salvo que devoluciones `warning: "config_bookkeeping_failed"` fue persistente, pero necesita una nueva lectura para confirmar el estado en vivo.

```bash
ocx account pool anthropic --threshold 80 --quota-window five-hour --json
ocx account pool anthropic --json
ocx account auto-switch openai status --account <id-or-alias-or-main> --json
```

Una explícita `--account` selecciona el umbral OpenAI por cuenta. Acciones son
`status`, `on` (80), `off` (0), `inherit` (nulo), o `threshold N` (0–100). Sin `--account`, el comando de conmutación automática existente permanece con alcance de grupo. El resultado es `{ok, id, autoSwitchThresholdOverride, autoSwitchThreshold}`; lea la anulación anulable y el valor efectivo observado por separado.

El uso de crédito pagado después de la cuota incluida es una política distinta que requiere explícito intención de gasto. `ocx account credits openai <id-or-alias-or-main> on|off --json`
objetivo una cuenta. `ocx account credits openai --all on|off --json` es exclusivo con ese selector: en los registros actuales ID seleccionables más principal, lista. Los recibos son `{ok, id, creditsAfterLimit}` o `{ok, all, ids}`; retener el ID reales devueltos y leídos `ocx account list openai --json`. Mostrando crédito equilibrios con `--show-codex-credits` No permite esta política. No habilite créditos para recuperar de un inicio de sesión fallido o lectura de cuota.

<a id="quota-activation-and-reset-grant-observations"></a>

### Observaciones de activación y reset-grant de cuotas

```bash
ocx account quota-activation openai <id-or-alias-or-main> --window fiveHour off --json
ocx account list openai --json
ocx account anthropic-reset-grants --json
```

La activación de cuotas acepta `fiveHour` o `weekly`, deliberadamente diferente de Anthropic grupo `five-hour`. Escribe una cuenta/ventana toggle; habilitando puede programar la actualización de cuotas. `{ok, id, window, enabled, available}` política de informes y disponibilidad observada, actualización no completada. La habilitación no disponible puede regresar 409; todavía se permite la desactivación. Nunca consume una concesión de reinicio.

Anthropic acepta un ID de cuenta Anthropic exacto opcional, no un Codex alias/selector principal; la omisión utiliza la opción activa/retroactiva existente. El GET puede ponerse en contacto con el servicio de estado ascendente. Informa la elegibilidad/razón, Conteos de subvenciones, fechas anulables, tiempo de reutilización, funcionamiento pendiente y disponibilidad del diario. Las subvenciones vacías no son lo mismo que el estado no disponible. Nunca consume una subvención o reanude un gasto pendiente. El consumo sigue siendo una operación humana GUI.

<a id="use-remaining-included-quota"></a>

### Utilizar la cuota incluida restante

Para seguir utilizando una cuenta seleccionada más allá de un umbral de conmutación proactivo o la cuenta principal umbral de protección, permita explícitamente su preferencia por el contingente restante:

```bash
ocx account use-remaining openai main on
ocx account use openai main
ocx account use-remaining openai main status --json
ocx account use-remaining openai main off
```

Sustituir `main` con un ID o alias de cuenta de grupo único para orientar una cuenta añadida. Al habilitarlo, se desactiva el cambio de uso proactivo para esa cuenta. Para el inicio de sesión principal, también mueve ambos umbrales de bloqueo duro efectivos al 100%, por lo que una lectura del 95% aún puede admitir una solicitud. La preferencia persiste en los reinicios hasta que se desactiva; la configuración del umbral original permanece se almacena y se reanuda la aplicación cuando está deshabilitado. No selecciona una cuenta en sí o anula programación round-robin, pausa manual/automática, comprobaciones de derechos, reautenticación o flujo ascendente Enfriamientos. El permiso de crédito pagado sigue siendo una configuración separada; habilitar esto nunca opta por una cuenta en créditos o canjea una subvención de reinicio. La cerradura rígida principal por defecto todavía se niega al 100%.

`GET /api/codex-auth/accounts/use-remaining?id=<account-id>` Lee la política en vivo.
`PUT /api/codex-auth/accounts/use-remaining` acepta `{ id, useRemainingQuota: boolean }`. Ambos requieren la autenticación de gestión existente. Este control está actualmente expuesto a través de los modelos CLI y API.

<a id="main-account-quota-protection"></a>

### Protección de la cuota de cuenta principal

En **Configuración de Codex → Multi-auth →**, **Bloquear cuenta principal**
está activado por defecto junto a Ultra Fast. Apagarlo se aplica inmediatamente; volver a encenderlo primero muestra las consecuencias, y la cancelación no cambia la configuración. La tarjeta de cuenta principal muestra monitoreo, uso desconocido o un bloque de directiva actual incluso cuando la configuración avanzada está cerrada.

El valor predeterminado se deduce de lo que hace una cuenta principal drenada a Codex Desktop: una vez que el ChatGPT informes de ventana de cuenta **0%** restante, Desktop deshabilita su botón de enviar y la cuenta se detiene aceptar turnos hasta que se restablezca la ventana. Mantener el propio tráfico de ocx por debajo de ese punto mantiene la cuenta utilizable ([#5694](https://github.com/lidge-jun/opencodex/issues/5694)) El costo es Luna Reserva: mientras el bloque esté en vigor, la reserva de esa cuenta principal no puede activarse. Para dejar que el principal cuenta correr hasta el agotamiento y entregar a la reserva, apagar el interruptor.

Los **Ventana de 5h y la ventana semanal cada bloque por su cuenta**: la ventana de 5h alcanza el 90% o la ventana semanal alcanza el 98% de bloques inmediatamente, incluso mientras el otro todavía tiene espacio para la cabeza. Las cuentas mensuales solo usan sus cuentas mensuales ventana. El bloque se libera automáticamente, con el interruptor todavía encendido, una vez cada ventana de bloqueo informa de una nueva lectura por debajo de su umbral (un 0% de recuentos de reinicio); la siguiente observación en el umbral bloquea de nuevo. Configurar `codexMainAccountHardLockThresholds` en `config.json` con opcional `short` y `long`
porcentajes, por ejemplo `{ "short": 90, "long": 98 }`. Ambos deben ser números enteros de 80 a 100, y `short` No debe exceder `long`; los campos omitidos usan los valores predeterminados. La configuración API acepta la mismo objeto y devuelve los valores efectivos en `mainAccountHardLock.thresholds`.

**Mientras que el bloqueo bloquea, las solicitudes pueden recaer en otro modelo en lugar de fallar.** Los
**Retroceso mientras está bloqueado** fila se sienta al lado del interruptor de protección y funciona como la llamada a la sombra fila: elegir un modelo — por ejemplo `deepseek/deepseek-chat` — enciende el desvío inmediatamente, el esfuerzo de pensamiento opcional se aplica a él, y el interruptor pausa la redirección sin olvidar el modelo. Mientras el bloque esté en vigor y ninguna cuenta Codex pueda atender una solicitud de una Codex nativa modelo, esa solicitud se enruta al modelo de reserva (con el esfuerzo configurado) Rechazado. Una cuenta Pool utilizable sigue sirviendo la solicitud primero; selectores calificados por el proveedor, Los combos, las filas calificadas para la cuenta y la Reserva Luna mantienen sus propios destinos; y una reserva que nombre propio se ignora un modelo nativo Codex, porque el redireccionamiento gpt-* a gpt-* solo volvería a entrar la misma negativa. La cerradura en sí no cambia: se libera por sí misma como antes, y el desvío No lo olvidemos. Configurar `codexMainAccountHardLockFallback` en `config.json` como
`{ "model": "deepseek/deepseek-chat", "reasoningEffort": "low" }`; `enabled: false` pausa el desviarse mientras se mantiene el modelo. Una sección ausente, un modelo omitido, o una sección mal formada significa Las solicitudes son rechazadas como de costumbre; `reasoningEffort` debe ser un esfuerzo declarado. La configuración API acepta el mismo objeto, rechaza escrituras inválidas antes de la mutación, y `null` Limpia la sección.

El panel de control y `ocx status` mostrar **posible uso fuera de opencodex** Cuando las lecturas frescas suben por al menos un punto en el mismo episodio de reinicio sin actividad reciente de la cuenta principal a través de este proxy. Esta es una observación consultiva, no una prueba: un giro de larga duración también puede causarlo. La cerradura no puede evitar el agotamiento del tráfico exterior. El aviso local del proceso aclara la identidad o El restablecimiento cambia y expira después de seis horas o en el restablecimiento observado, lo que ocurra primero.
`ocx status --json` expone el estado, umbrales efectivos, tipo de ventana de bloqueo y
`externalUsage` Aviso bajo `mainAccountHardLock` cuando la evidencia de gestión en vivo está disponible.

Una lectura de 5 horas que no pueda interpretarse no oculta un bloqueo semanal. El uso desconocido no se inventa como cero, y una lectura ausente no elimina una condición de bloqueo ya medida. La hora prevista de restablecimiento no lo levanta por sí sola. Durante el bloqueo, la recuperación consulta los metadatos de uso de la cuenta con una secuencia acotada de 5/10/20/40/60 minutos, para detectar un restablecimiento ocurrido fuera de opencodex antes de la hora prevista. La primera consulta espera cinco minutos, las siguientes se separan al menos cinco minutos y la próxima se adelanta si corresponde a la última hora conocida de restablecimiento. Una cuenta principal pausada o que requiera autenticarse de nuevo no recibe consultas antes de su restablecimiento previsto. Un `Retry-After` más largo también retrasa la preparación del perfil y del token. Solo un uso válido reciente o evidencia autorizada de que la ventana no existe puede levantar el bloqueo. En modo Pool, consultar la cuota con `--refresh` omite la vigencia de la caché, pero respeta la espera tras lecturas fallidas; una consulta diferida no crea otro intento de diagnóstico. Las pausas, la reautenticación y los límites del proveedor siguen aplicándose de forma independiente.

La protección trata una nueva respuesta de uso válida WHAM como un reemplazo para la antigua lectura de 5h cuando Su ventana principal dura explícitamente **al menos 24 horas** e informa sobre el uso válido, o su ventana principal es explícitamente `null` y un secundario medido suministra el uso semanal. En cualquier caso, secundario/terciario Las ventanas deben ser explícitas `null` o explícitamente duran al menos 24 horas e informan sobre el uso válido. Esto sigue el límite corto/largo del analizador, por lo que un Ventana de un día califica, así como ventanas semanales / mensuales. La ventana actual sigue utilizando el mismo umbral de ventana larga configurado (98% por defecto). Esto se basa en la única instantánea reportada; no se requieren observaciones repetidas. Cualquier campo de ventana omitido, una duración desconocida o encabezados de respuesta parcial no pueden borrar un bloque anterior. Las respuestas totalmente nulas con solo créditos y lecturas complementarias mensuales tampoco pueden establecer la recuperación. El proxy comprueba la credencial almacenada de nuevo antes de aplicar una respuesta retardada. Un archivo ilegible o portador reemplazado no puede actualizar el caché de uso, liberar el bloqueo o poner en cuarentena la nueva credencial, incluso para la misma cuenta sin segunda cuota leída. Su uso ordinario analizado aún se puede devolver al llamante solicitante, sin actualizaciones de estado compartido. o evidencia de recuperación. La tarjeta de cuenta muestra el uso publicado en caché, manteniendo su cuota alineada con el estado de bloqueo; La cuota de proveedor de Direct omite una respuesta no publicada y su informe en caché anterior. Cuenta en conflicto las identidades y las respuestas obsoletas 401/403 retienen el información almacenada en caché y no puede borrar o establecer el estado de reautenticación de la cuenta actual.

Responses a las solicitudes enviadas con la credencial principal identificada actualizar su caché uso de sus encabezados de cuota, ya sea que el proxy sustituya la credencial el llamante envió la misma credencial. La respuesta sólo se aplica si credencial sigue siendo la principal credencial observada cuando llega; una credencial propiedad de la persona que llama credenciales para otra cuenta o espacio de trabajo nunca actualiza el uso de la cuenta principal.

La opción persistente es `"codexMainAccountHardLock"` en OpenCodex `config.json`. Una llave ausente o
`true` significa en; solo un explícito `false` lo apaga, y eso es lo que desactiva la configuración tiendas. El valor predeterminado cambió aquí: la política solía ser opt-in y el interruptor anterior eliminó la clave cuando estaba apagado, por lo que una instalación que lo había apagado ahora se lee como encendido. Si quieres el viejo comportamiento, apáguelo una vez para registrar la opción de exclusión. La protección cubre las nuevas solicitudes que utilizan el cuenta principal identificada, no el último 2% en sí: solicitudes ya en ejecución, propiedad de la persona que llama sin igual Las credenciales de keyring y el tráfico fuera del proxy aún pueden gastar cuota. Cuentas añadidas y otras Los proveedores permanecen disponibles.

Con la protección activada, una startup propia restaura la identidad en memoria de la credencial principal vinculante después de la recuperación y limpieza del perfil nativo, por lo que un bloque de directiva persistente sobrevive a un reinicio. Las solicitudes Direct, exact-main, main-fallback y main-pin pueden recibir brevemente 503 mientras que la vinculación está pendiente; cuentas Pool almacenadas saludables siguen siendo elegibles en todo momento. No La credencial se lee de un hogar de servicio extranjero o no confirmado para esta inicialización.

Mientras que esta política bloquea la principal, la Reserva Luna en esa cuenta también está bloqueada. Permaneciendo por debajo de lo común El agotamiento de las cuotas puede impedir la activación de la Reserva. Deshabilitar el switch restablece la configuración local normal manejo, no derecho adicional de origen. Utilice la acción de actualización de cuota de cuenta para obtener un observación fresca; no se consume automáticamente ningún crédito de reinicio.

<a id="luna-reserve-alongside-routed-models"></a>

### Luna Reserve junto a modelos enrutados

El opcional [Modo de escritorio](/es/guides/codex-integration/#authless-codex-desktop-opt-in)
mantiene inactiva la puerta del selector de solo reserva de Desktop. También deshabilita la función automática de Desktop. Manejo de reservas: La reserva es una elección explícita del modelo, no una alternativa automática.

Mantenga el proveedor integrado OpenAI habilitado en modo ChatGPT-forward, habilite el selector de modelo de cuenta, y configurar un selector público para la cuenta principal almacenada. Con el modo efectivo de loopback sin autorización habilitada, `ocx sync` incluye `<main-selector>/gpt-reserve` junto con los modelos de proveedores enrutados. Un desnudo
`gpt-reserve`, un selector de cuenta añadida y descubrimiento de modelo de clave API no se añaden al catálogo. La configuración authless se ignora para el enrutamiento de cliente remoto o un oyente que necesita un encabezado de admisión. Cuando los oyentes públicos y locales se ejecutan juntos, la compatibilidad de reserva solo se aplica a las solicitudes admitidas. por el oyente local. Una solicitud pública autenticada permanece en la ruta normal, incluso si se origina de la misma máquina; los encabezados de las solicitudes no pueden seleccionar la directiva local.

Habilitar el modo de escritorio sin autless con `ocx system settings --desktop-authless on`, correr `ocx sync`, luego salga completamente y vuelva a abrir el escritorio Codex para que vuelva a cargar la configuración y el catálogo reescritos. Siga el [canónica flujo de trabajo de escritorio authless](/es/guides/codex-integration/#authless-codex-desktop-opt-in).

Cada solicitud de compatibilidad comprueba una autorización de servidor vinculada a credenciales, almacenada en caché como máximo 60 segundos. OpenCodex envía el encabezado de capacidad de reserva en una lectura y requiere que el uso ordinario sea prohibido, la bandera de la Reserva Luna, y exactamente una Reserva permitida cubo. La evidencia faltante, denegada, rancia o no coincidente rechaza la solicitud; no cambia las cuentas o usar silenciosamente la Luna ordinaria. El uso pasivo puede revocar la autorización, pero no puede crearla. El tiempo de reutilización global, la pausa, la reautenticación y el bloqueo de la cuenta principal aún se aplican. Apague la cerradura dura si desea utilizar Reserve en una cuenta principal agotada; hacerlo no otorga derecho de servidor. Esta ruta de compatibilidad admite las solicitudes de conversación y compactación, no la reserva como visión o web-search helper o un modelo de relé de búsqueda independiente. Elija otro modelo para esos ayudantes.

El selector prefiere los metadatos de reserva reales. Cuando no se ha observado ninguna, utiliza una marca Adaptación de metadatos de Luna, siguiendo la asignación preestablecida de Reserva o Luna de Desktop. Una entrada visible no es Prueba de disponibilidad. Se verificaron las rutas de origen del escritorio y las respaldadas por accesorios; una reserva activa en vivo no se utilizó para validar esta ruta de compatibilidad.

### `ocx account <subcommand>`

Listar y cambiar cuentas de proveedores y agrupaciones de claves API a través del proxy en ejecución. La ayuda enviada superficie es:

```text
Usage: ocx account <list|history|current|use|clear|refresh|auto-switch|alias|priority|pause|resume|pause-exhausted|strategy|sticky|remove|clear-cooldown|add-key|import|import-orca|login|reauth|code|cancel|reset-credits|grok-reset-coupons|main> ...

list [provider]     Codex account pool, OAuth accounts and API keys (identifiers shown masked as the API returns them).
history openai <pool-account-id> [--limit <1-200>]  Recent routing decisions for one Codex pool account.
current <provider>  Show the active account or key.
use <provider> <id|alias|main|auto> Switch the active credential; 'main' selects the Codex App login, 'auto' clears the selection unless an account carries that id.
clear <provider>  Clear the manual Codex account selection unconditionally.
refresh <provider>  Force-refresh Codex or provider quota reports.
auto-switch <provider> <on|off|status|threshold N>  Control the Codex pool threshold.
alias <provider> <id|alias> <display-name|->  Set or clear an account's display name; '-' clears it.
pause <provider> <id|alias|main>  Hold an account out of automatic selection.
resume <provider> <id|alias|main>  Return a paused account to automatic selection.
pause-exhausted <provider>  Pause every account whose quota is spent.
clear-cooldown <openai|anthropic> <id|alias|main>  Drop a cooldown the proxy set after an upstream failure.
strategy <provider> [<quota|round-robin|fill-first|least-loaded|reset-first>]  Pool placement strategy; least-loaded is Kiro-only.
sticky <provider> [<1-100>]  Requests a bound thread keeps on one account; omit the value to read it.
priority <provider> <id|alias|main> [first|earlier|normal|later|last|-100..100|reset]  Selection order; omit the value to read it.
remove <provider> <id|alias|main> --yes  Remove a stored account or key after an existence check.
add-key <provider> [--label <label>]  Add a key read only from piped stdin.
login/reauth/code/cancel  Run browser or manual-code auth from a headless shell.
reset-credits <id|main> [--consume --yes]  Inspect or consume Codex reset credits.
grok-reset-coupons [<id>] [--consume --yes] [--token-id <token-id>] [--operation-id <uuid>]  Inspect or redeem Grok reset coupons.
import <provider> --format <format> (--file <path>|--stdin)  Import credentials from a named external format.
import-orca --source <dir> --registry <file> [--apply]  Preview or apply imports from Orca-managed Codex homes.
main <doctor|list|register|add|reauth|switch|recover>  Manage the Codex App login the pool calls 'main'.
Switching the active account takes effect immediately; running threads move on their next request, and in-flight requests keep the account they captured.
A selection-order change applies from the next unbound request and never moves a bound thread.
```

Los subcomandos de cuenta requieren que el proxy se ejecute y resuelva automáticamente su puerto de entorno de ejecución registrado. excepto `import-orca`: la vista previa es solo local, y `import-orca --apply` El proxy debe ser detenido. Las operaciones exitosas salen de 0. Uso inválido, un proveedor desconocido o ID de cuenta/clave, un inalcanzable proxy, o un error API sale 1. Los campos de credenciales se muestran exactamente como la administración API devuelve (incluido su enmascaramiento); las claves API sin procesar y OAuth tokens nunca se devuelven. Mostrar Las comodidades se sintetizan en el lado del cliente, al igual que el panel de control: `main` es el alias de CLI para el Codex Inicio de sesión en la aplicación `openai` grupo de cuentas, las cuentas OAuth sin un correo electrónico aparecen como `Account N`, y la columna de plan/etiqueta vuelve a caer sobre el plan, el correo electrónico enmascarado, la etiqueta y la clave enmascarada.

`--json` Las filas de la cuenta usan esta forma común (los campos opcionales se omiten cuando no están disponibles):

```json
{
  "provider": "openai",
  "type": "codex | oauth | api-key",
  "id": "__main__",
  "label": "plus",
  "email": "m***@example.com",
  "plan": "plus",
  "masked": "sk-ab****wxyz",
  "priority": 0,
  "active": true,
  "needsReauth": false,
  "quota": null
}
```

### `ocx account import-orca --source <orca-data-directory> --registry <orca-data.json> [--apply] [--json]`

Reutilice los inicios de sesión locales administrados por Orca Codex sin otro inicio de sesión del navegador. La fuente El directorio debe contener `codex-accounts/<account>/home/auth.json`. Suministrar la orca directorio de datos y el perfil elegido `orca-data.json` explícitamente. Solo cuentas registrado en ese perfil se consideran; las casas de la cuenta sobrantes o removidas no importados. Cada casa debe llevar el fósforo de Orca `.orca-managed-home` marcador. El comando no escanea hogares o hosts remotos no relacionados.

```powershell
# Windows: preview only; no account is registered.
ocx account import-orca --source "$env:APPDATA\orca" --registry "$env:APPDATA\orca\profiles\local-default\orca-data.json" --json

# Finish active proxy requests and stop the proxy before applying.
ocx stop
ocx account import-orca --source "$env:APPDATA\orca" --registry "$env:APPDATA\orca\profiles\local-default\orca-data.json" --apply
ocx start
```

Los perfiles de Orca más antiguos pueden usar `orca-data.json` directamente bajo el directorio de datos. En otras plataformas, pase el directorio de datos local de Orca y el registro del perfil con el mismo diseño. El importador omite las identidades ya presentes en el inicio de sesión principal nativo, cuenta grupo, o almacén de credenciales, incluyendo duplicados dentro de la fuente. Esto deliberadamente utiliza el ID de cuenta ChatGPT como un depósito conservador: miembros separados que comparten una El ID de cuenta del espacio de trabajo también se omite, no se fusiona ni se importa individualmente. Repetir una Importación conserva las cuentas existentes. Si una importación anterior se detuvo entre el ahorro credenciales y el registro de la fila de la grupo, reintento puede terminar ese registro con el mismo ID solo cuando su registro pendiente intacto aún coincide con la fuente. Inválido Las entradas se cuentan por código de razón fijo. Un resultado mixto con al menos un La cuenta sale con éxito; un resultado donde cada entrada descubierta no es válida sale No cero. La salida contiene códigos de cuenta y razón, no correos electrónicos, identificadores de cuenta, rutas, o tokens.

**Orca conserva la propiedad de actualización.** OpenCodex almacena un enlace fuente de solo lectura y una instantánea de acceso-token, nunca la actualización token de Orca. Al resolver las credenciales, lee la fuente de nuevo y verifica que todavía pertenece a la importada identidad. Orca debe mantener ese inicio de sesión disponible y actualizado. Desaparecidos, mal formados, caducado, o las credenciales de origen de identidad no coinciden cerrado; OpenCodex no hace vuelva a la instantánea anterior o actualice el inicio de sesión de origen. Este es un enlace local, no una exportación portátil o una transferencia de propiedad de actualización. Las solicitudes que ya se envían de origen mantienen las credenciales que capturaron.

Las cuentas nuevas se registran como **validación pendiente**. Después de iniciar el proxy, abierto **Codex Autonomía** y haga clic **Actualizar las cuotas** Autorizar el modelo existente paso de validación, que puede consumir una pequeña cantidad de cuota. Importación offline y El análisis JWT no establece la autenticación ascendente. CLI cuota actualización solo no realiza esa validación. El importador nunca inicia ni detiene ninguna aplicación, cambia los archivos Orca o cambia la cuenta del grupo activo.

### `ocx account list [provider] [--json] [--all] [--quota [--refresh]]`

Sin un proveedor, enumera el grupo Codex, las cuentas OAuth y los grupos de claves API configurados. Vacío Los proveedores se omiten a menos que `--all` está presente. Con un proveedor, enumera solo esa familia de credenciales. Usos de la producción humana `PROVIDER TYPE ID PLAN/LABEL PRIORITY STATUS`; se marca una fila Codex elegida manualmente
`selected`. `PRIORITY` es el orden de selección firmado Codex (`0` cuando no está configurado) y muestra `-` para las filas donde el pedido no se aplica, como cuentas OAuth y claves API. Con dos cuentas Kiro almacenadas, tasa, cuota mensual confirmada y denegaciones de suspensión pueden rotar a una cuenta elegible antes de la salida; se prefiere la evidencia de la lista de modelos en caché positiva entre las cuentas elegibles antes de la estrategia de pool ordinaria. La rotación reactiva es presencia y no se puede desactivar — `oauthAccountFailover.enabled: false` Disminuciones la preferencia de cuenta previa al envío, no la recuperación de rechazo, y una anulación del proveedor tiene prioridad; `ocx account login kiro`
Agrega cuentas a la grupo de una en una. Un resultado vacío sigue siendo un éxito. `--json`
devuelve:

```text
{ accounts: AccountRow[], notes: string[] }
```

Un listado de proveedores vacío nombra el siguiente comando en la salida humana y JSON `notes`:
`ocx account login <provider>` para OAuth/Codex, o `ocx account add-key <provider>`
con una fuente de canalización controlada por humanos para las teclas API. Un listado global vacío puntos a `ocx account login <provider>` y `ocx help account login`.

Las filas de la cuenta incluyen un `health` etiqueta y, cuando la recuperación está disponible,
`healthAction`. La salida humana imprime la recuperación debajo de la tabla. Reautenticación apunta a la cuenta almacenada con `ocx account reauth <provider> --id <id>`; Principales usos nativos `ocx account main reauth --device`. Verificación del proveedor, Los conflictos de credenciales y la validación pendiente retienen una orientación distinta. Las filas Codex preservan el booleano del servidor `creditsAfterLimit` en la lista/actualidad JSON; humano filas mostrar `paid-credits: on` Solo cuando el permiso esté habilitado. Estas lecturas hacen No cambiar el permiso de crédito pagado.

`--quota` añade un `QUOTA` columna con el uso propio de cada cuenta, para los proveedores que admiten un sonda por cuenta (Anthropic, Kiro, Google Antigravedad, y Devin hoy). Es opt-in porque el proxy sondea el upstream una vez por credencial almacenada; el listado predeterminado permanece como lectura local. `--refresh` se pasa por el resultado en caché. Se muestra una cuenta sin cuota por cuenta `-`y uno cuya sonda falló muestra
`unavailable` — en blanco se leería como "sin uso" en lugar de "no medido". `--json` lleva el desglose completo por cuenta, no solo las ventanas resumidas.

Los grupos de teclas API también admiten `ocx account list <provider> --quota [--refresh]`. Sin `--quota`, su listado no solicita una investigación de cuotas. La lectura opt-in utiliza el propietario de la cuota de cada clave almacenada; `--refresh` solicita nuevas pruebas de que propietario y puede ponerse en contacto con el proveedor de upstream. No reemplaza las claves almacenadas o leer el agregado de todo el proveedor devuelto por `account refresh`.

API-clave JSON filas preservar `quotaMode` (`probe`, `passive`, `unsupported`), opcional/null `quota`, y `quotaUnavailable` Cuando regresó. La cuota pública puede incluyen ventanas personalizadas, saldos de crédito USD, créditos Kiro y tiempos de actualización, no solo los porcentajes de estilo Codex. La producción humana distingue entre no apoyados, no mediciones medidas, no disponibles y reales. Desconocido no es cero; observado El cero es retenido. Campos consumidos mal formados o una fila de claves devuelta sin La evidencia de modo de cuota falla en lugar de fabricar soporte. Una grupo vacía permanece válido. Las llaves permanecen enmascaradas.

Google Antigravedad filas llevan el mismo `Gem` / `Cla` ventanas como la cuota a nivel de proveedor, calculada desde la credencial propia de esa cuenta y el ID del proyecto Cloud Code Assist. La sonda por cuenta siempre habla con el host Cloud Code Assist de Google a través del transporte de salida anclado, independientemente de una configurado `baseUrl`: una base personalizada URL es una opción de enrutamiento para solicitudes, no una segunda fuente de La contabilidad de Google para una credencial almacenada. Una cuenta sin un id del proyecto, o uno cuya sonda es redireccionado o falla, muestra `unavailable`. Cuando el descubrimiento del modelo de reserva suministra lecturas de cuota, Las pantallas detalladas retienen hasta 256 diagnósticos de modelo con distintas etiquetas acotadas. Estas filas no afectar titulares de resumen del proveedor, gravedad, clasificación de la cuenta, enrutamiento o restablecer notificaciones.

Las filas de Devin provienen de Cognition's `GetUserStatus` por la propia clave de esa cuenta, enviada a su Host de servidor api. Si una credencial anterior no tiene host, la sonda usa el proveedor base URL cuando se indica en la lista de permisos, o el valor predeterminado de EE. Muestran las fechas diarias y semanales ventanas que expone el plan, y una ventana de crédito mensual solo en un plan de crédito facturado que informa un saldo de crédito; una estrategia de facturación desconocida utiliza ese crédito solo si ambas fechas de restablecimiento Están ausentes. Las ventanas vencidas diarias y semanales permanecen ocultas sin convertirse en una cuota de crédito mensual. Un saldo ilimitado, o un estado sin saldo en absoluto, no muestra ninguna ventana de crédito. Solo una tecla rechazada (401) borra una lectura almacenada en memoria caché; otros fallos de sondeo retienen la última lectura.

```text
$ ocx account list anthropic --quota
PROVIDER   TYPE   ID        PLAN/LABEL         PRIORITY  STATUS  QUOTA
anthropic  oauth  1278f8da  a***r@examp***.com  -                5h 7% wk 62%
anthropic  oauth  e112f28b  k***1@examp***.net  -        active  5h 9% wk 45%
```

Kiro factura una asignación mensual y no reporta una ventana más corta, por lo que sus cuentas `mo`
figura en su lugar:

```text
$ ocx account list kiro --quota
PROVIDER  TYPE   ID        PLAN/LABEL         PRIORITY  STATUS  QUOTA
kiro      oauth  3f0a91c2  a***r@examp***.com  -        active  mo 15%
kiro      oauth  8b24de70  k***1@examp***.net  -                mo 88%
```

`ocx account list kiro` marca una cuenta excluida de la selección automática como
`not-auto-selected(<reason>)`. JSON lleva `autoSelectable` Y cuando es falso, se cierra
`skipReason` (`paused`, `needs_reauth`, `suspended`, `cooldown`, o `quota_exhausted`) Un activo Singleton o grupo todo-excluido todavía puede enviar. Kiro `providerCredits` Provienen de medidas
`meteringEvent` valores: se conserva la última lectura dentro de una respuesta física, y Los envíos facturados por separado agregan al gasto de la solicitud. Los créditos nunca se estiman a partir de tokens.

Con dos o más cuentas Kiro iniciadas, tasa de solicitud, cuota mensual confirmada y Los rechazos de suspensión confirmados pueden rotar antes de la salida. El agotamiento mensual excluye solamente Ese inicio de sesión hasta que se restablezca o expire la evidencia; el servicio completado borra un veredicto más antiguo. La rotación reactiva permanece disponible cuando la preferencia de cuenta proactiva está desactivada. Las cuentas se agregan una a la vez —
`ocx account login kiro` entrega a la Kiro CLI y añade la nueva cuenta a la grupo. En el panel de control, las cuentas Login y Add también ofrecen Builder ID, Google y GitHub junto con la opción Kiro CLI; el inicio de sesión nativo del dispositivo agrega una cuenta sin cerrar sesión en el CLI. Los usuarios de un perfil de organización (IAM Identity Center) comparten su perfil ARN, por lo que una cuenta Kiro CLI se identifica por ese perfil junto con el correo electrónico `kiro-cli whoami` Informes de la sesión. Por lo tanto, dos usuarios de la misma organización permanecen cuentas separadas y al iniciar sesión el mismo usuario vuelve a actualizar la cuenta de ese usuario. Cuando `kiro-cli whoami` Si ese perfil ya tiene una cuenta con un usuario conocido, tal inicio de sesión solo actualiza la cuenta cuyo perfil almacenado no se ha registrado. Kiro CLI sesión continúa; se rechaza cualquier otro inicio de sesión en lugar de reemplazar una cuenta, y un inicio de sesión de Agregar cuenta cambia el Kiro CLI Volver a la sesión anterior. Run `kiro-cli whoami` La re-autenticación de una cuenta guardada antes de que su usuario fuera conocido registra al usuario que inicia sesión, a menos que ese usuario ya tenga otra cuenta del mismo perfil. Para agregar una cuenta sin el Kiro CLI, uso `ocx account login kiro --method builder-id`,
`--method google`, o `--method github`. Abra la verificación impresa URL, introduzca el usuario código, y esperar la aprobación. `--no-wait` imprime el ID de flujo; cancele con
`ocx account cancel kiro --flow <flow-id>`. El inicio de sesión nativo solo agrega cuentas. Para reautenticar uno, quitarlo y agregarlo de nuevo. Un perfil social repetido ARN crea otra ranura e imprime
`duplicate_profile_arn`; cada ranura lleva su propia cuota y estado de carga. Kiro puede optar por proactivo `least-loaded` Colocación con `pool.kernel` y la preferencia de cuenta habilitada. La preferencia proactiva del modelo también requiere que la preferencia de cuenta esté habilitada explícitamente a nivel mundial. o para Kiro; una configuración no establecida o falsa deja una cuenta activa saludable en su lugar. Las listas de modelos son aprendido después de que una cuenta sirve, por lo que un hermano inactivo puede inicialmente no tener evidencia. Un modelo El ID ausente de cada lista en caché todavía se envía de origen. Su opcional `maxConcurrentPerAccount` cap es una cola limitada por cuenta: una cuenta completa seleccionada espera hasta 250 ms, luego devuelve 503 `account_capacity` con `Retry-After: 1`. El cap es local para cada proceso proxy y no mueve una solicitud; la rotación reactiva permanece disponible después de un rechazo.

### `ocx account current <provider> [--json]`

Muestra la cuenta activa o clave. Una grupo Codex sin pin manual informa la prioridad-consciente selección automática: se elige el nivel elegible de mayor prioridad y la cuenta de menor uso dentro de ese nivel se selecciona bajo enrutamiento de cuota; otra familia sin informes de credenciales activos ese estado y sigue saliendo 0. `--json` devuelve:

```text
{ provider, type, activeId: string | null, autoSwitchThreshold?: number, account: AccountRow | null }
```

### `ocx account use <provider> <account-or-key-id|alias|main|auto> [--json]`

`auto` borra la selección manual para que el grupo vuelva a trabajar por su propia estrategia — a menos que una cuenta Codex lleve literalmente el id `auto`, que gana por la precedencia exacta-id; `ocx account clear <provider>` Restaura siempre la selección automática. Cualquier cuenta Codex puede ser nombrada por el alias establecido con `ocx account alias` en lugar de su id; eso se mantiene para `priority`, `pause`, `resume`, `clear-cooldown`, `remove` y `alias` También. Para cuentas Codex, `auto`, `main` y `__main__` están reservados independientemente del caso y no se pueden asignar como alias. OAuth y API-nombres de visualización clave mantener sus reglas existentes.

Selecciona una cuenta existente de Codex, una cuenta de OAuth o una clave de API. Porque `openai`, `main` selecciona el Codex Inicio de sesión de la aplicación. Una selección Codex Pool borra la afinidad de proceso local y se aplica a la siguiente solicitud, incluir uno de una tarea visible existente; el reinicio por proxy o el desalojo por afinidad también pueden dejar una tarea desvinculado, mientras que las solicitudes en vuelo mantienen su cuenta capturada. Esto controla el enrutamiento Pool solamente; El modo Direct sigue utilizando la credencial principal nativa o propiedad de la persona que llama. Cambio proactivo basado en el uso, Reautenticación 401/403, 429/reintentar después de los tiempos de reutilización, exclusión y fallo previo a la salida 429/402 recuperación puede seleccionar más tarde otra cuenta Pool elegible. Estas vías de recuperación permanecen activas cuando La conmutación basada en el uso está desactivada. OpenCodex reproduce la conversación después de un cambio de cuenta, pero el La caché de mensajes del lado del proveedor puede estar fría. Proveedores desconocidos o identificadores de salida 1. En un **401/403**, el inicio de sesión de la aplicación borra la afinidad de proceso local de esa cuenta y requiere una reautenticación. En un **429**, honores de opencodex `Retry-After`, inicia el enfriamiento de la cuenta, borra la afinidad y puede rotar la solicitud a otra cuenta Pool elegible. Estas transiciones de falla permanecen activas con
`autoSwitchThreshold: 0`; esa configuración deshabilita solo la conmutación proactiva basada en el uso.
`--json` devuelve:

```text
{ ok: true, provider, type, activeId }
```

### `ocx account clear <provider> [--json]`

Borrar la selección manual de la cuenta Codex sin resolver un identificador de cuenta, por lo que funciona incluso cuando una cuenta se nombra literalmente `auto`. Solo los grupos Codex; otros tipos de proveedores no tienen selección automática para restaurar.

### `ocx account pause|resume <provider> <id|alias|main> [--json]`

Cuentas pausadas por el opt-in [Política de pausa automática por proveedor](/es/reference/configuration/providers/#auto-pause-permanently-refused-accounts) Utilice los mismos comandos. El listado muestra la razón de pausa fija; el currículum lo borra.

Pausa o reanuda una cuenta en el grupo de proveedores de claves Codex, Anthropic, OAuth genérico o API, que incluye
`google-antigravity`. Para la grupo Codex, `main` identifica solo la cuenta Codex integrada; Las cuentas OAuth deben identificarse mediante id o un alias único. Una cuenta OAuth pausada se excluye de la selección de solicitudes, la conmutación por error 429 y la actualización proactiva token, y no puede seleccionados manualmente. La pausa de la cuenta activa cambia a la siguiente cuenta utilizable cuando existe una. Si todas las cuentas están en pausa, solicita que se devuelva ese grupo 403 hasta que se reanude una cuenta.

Porque Anthropic y genérico OAuth proveedores, identifiquen la cuenta por id o por un alias único exacto o insensible al caso. JSON La respuesta indica el id de la cuenta, el estado de pausa y el id de la cuenta activa.

Anthropic pausa se aplica incluso cuando la agrupación proactiva está deshabilitada, incluyendo la afinidad de sesión y 429 sucesores. Sobrevive al reinicio y la reautenticación, preserva las credenciales y la salud, y no interrumpe un turno ya enviado. Eliminar la cuenta elimina su estado de pausa. Los umbrales de conmutación automática Anthropic por cuenta no forman parte de este control.

Anthropic's reserva de pausa automática mantiene el orden de la cuenta, omite las cuentas pausadas y las cuentas que requieren reautenticación, y excluye Claude Code Las cuentas heredadas sin una fuente registrada siguen siendo elegibles utilizando solo sus propias credenciales almacenadas y las cuentas normales almacenadas.token refrescan; nunca adoptan CLI- credenciales de disco. Todavía válidas Claude Code Más tarde, la readopción automática acepta un acceso compartido, no vacío o actualización. token. Si ambos tokens rotar, OpenCodex Requiere una cuenta autenticada UUID prueba para el portador almacenado e importado. Guarda esa prueba de forma privada cuando está disponible desde la búsqueda de inicio de sesión, actualización o perfil; las etiquetas de cuenta, correo electrónico, organización y ubicación del archivo de credenciales no pueden sustituirla.

Cuando el portador anterior ha expirado y no se guardó ninguna prueba de cuenta vinculada, la recuperación automática puede ser imposible. Un perfil no disponible o un par girado no verificado deja la cuenta almacenada sin cambios y no reproduce una actualización potencialmente consumida token. Usar el inicio de sesión explícito para importar el actual Credencial Claude Code. La importación conserva espacios sin identidad no relacionados y puede crear un espacio separado cuenta; seleccione la cuenta deseada y elimine las ranuras obsoletas solo después de verificarlas. Un perfil El fallo de búsqueda puede dejar una nueva identidad de importación sin identidad, con la misma limitación de recuperación automática.

Si no se permite ninguna reserva, la detección de cuotas y modelos en vivo espera una cuenta activa utilizable. Puede seleccionar explícitamente una cuenta heredada sin pausa existente con
`ocx account use anthropic <account-id-or-alias>`; su propia credencial válida y normal almacenada-token La actualización permanece disponible incluso cuando no se registró su fuente de credenciales original.

```bash
ocx account pause google-antigravity <account-id-or-alias>
ocx account resume google-antigravity <account-id-or-alias>
```

### `ocx account clear-cooldown <openai|anthropic> <id|alias|main> [--json]`

Elimina un tiempo de reutilización de fallos locales del proceso sin cambiar las credenciales almacenadas. Uso `openai` para un Codex cuenta de pool o `anthropic` para una cuenta Anthropic OAuth; se rechazan otros proveedores. Ambas formas aceptar un id de cuenta o alias único, mientras `main` es específico para el grupo Codex.

```bash
ocx account clear-cooldown anthropic <id-or-alias>
```

El comando informa el éxito incluso cuando no hay un tiempo de reutilización activo, con `cleared: false` en JSON. Liquidación un tiempo de reutilización Anthropic también avanza la generación de cuentas, por lo que una sonda de cuota en vuelo más antigua no puede restaurar el estado aprobado o publicar la elegibilidad obsoleta derivada de la cuota después.

### `ocx account refresh <provider> [--json]`

Para la grupo Codex, utilice `ocx account refresh openai [--json]`. Se actualizan las cuotas de cuenta y imprime los porcentajes semanales/mensuales disponibles y los tiempos de restablecimiento; los datos de cuota faltantes se informan como desconocido, no 0%. Su sobre JSON es `{ accounts: AccountRow[] }`, con `quota` en cada fila Codex.

Para los proveedores de claves OAuth y API, esta fuerza actualiza el punto final de informe de cuota del proveedor; no es un token volver a iniciar sesión o una lista de cuentas simple volver a leer. `--json` devoluciones
`{ provider, report: ProviderQuotaReport | null }`. Un proveedor sin impresión de informe de cuota compatible
`no quota report available for <provider>` y sale 0. Proveedores y gestión desconocidos-API Fallos de salida 1; una sonda de cuota ascendente que falla o se agota se degrada a un informe nulo o obsoleto en su lugar (salida 0), haciendo coincidir las barras de cuota del panel.

### `ocx account auto-switch <provider> <on|off|status|threshold <0-100>> [--json]`

Controla el `openai` Umbral de agrupación Codex, o almacena un umbral para una agrupación genérica OAuth. `on` Almacena el 80%, `off` almacena el 0%, y `threshold <n>` acepta 0–100. Un umbral de grupo genérico dirige la selección solo mientras `pool.kernel` es con `strategy: "fill-first"`; con el indicador desactivado, guardar uno no permite la conmutación basada en umbral. Nunca cambia la anulación de habilitación del proveedor o desactiva la rotación reactiva 429. `status` y la salida de mutación para grupos genéricos usan la respuesta confirmada del servidor. Para grupos genéricas, `poolEnabled` es el proveedor almacenado override (`null` significa no especificado), no heredado estado efectivo; `inert: true` significa que el umbral se almacena pero no se aplica, `inert: false` significa que la grupo lo está aplicando, y un ausente `inert` es una capacidad desconocida, que nunca reporta `enabled: true`. Se rechazan los proveedores de claves API y los valores no válidos.

### `ocx account auto-switch anthropic … --account <id>`

Porque Anthropic OAuth, uso `ocx account auto-switch anthropic threshold 90 --account <id>` (entero 0–100), `off --account <id>` (0), `on --account <id>` (80), `inherit --account <id>` (reinicio), o `status --account <id>` (solo lectura); añadir `--json` para la producción estructurada. La tarjeta de cuenta ofrece la misma palanca de umbral personalizado. Herencias faltantes/nula `anthropicAccountPool.autoSwitchThreshold` (predeterminado 80); 0 deshabilita la conmutación basada en el uso para esa cuenta, no la pausa o la recuperación reactiva 429. Las anulaciones sobreviven al reinicio y al reinicio y se eliminan con la cuenta. Con la agrupación habilitada, la cuota y el relleno primero comparan cada fuente/candidato con su propio umbral en la ventana de cuota seleccionada. La precedencia manual/afinidad, el comportamiento sin identidad de round-robin/fill-first, la reserva de cuota desconocida y la reserva totalmente drenada permanecen sin cambios. Round-robin no está controlado por el uso; los grupos deshabilitados ignoran estos umbrales. Las listas de permisos de ruta de modelo aún restringen a todos los candidatos.

```text
openai: { provider, autoSwitchThreshold: number, enabled: boolean }
generic OAuth: { provider, autoSwitchThreshold: number | null, enabled: boolean, poolEnabled: boolean | null, inert: boolean | null }
```

### `ocx account preserve-signed-in openai [on|off|status] [--apply-to-bound] [--json]`

Optar por **utilizar primero otras cuentas elegibles y mantener el escritorio de ChatGPT/Codex Identidad como fallback**. Una invocación o `status` lee la política del proxy en ejecución, afectado IDs de entrada, pin manual y siguiente opción no enlazada. `on` persiste `codexPreserveSignedInAccount: true`;
`off` restaura el pedido de su cuenta personalizada existente sin volver a escribir ninguna prioridad.

El grupo reservado incluye nativos `__main__` y entradas de grupo ordinarias con la misma selección Cuenta/espacio de trabajo ChatGPT **y** Correo electrónico normalizado de los miembros. Compartir un espacio de trabajo solo es insuficiente. El grupo sigue el último inicio de sesión físico observado por el ciclo de vida de inicio de sesión nativo del proxy; ninguna credencial de solicitud entrante puede definirlo. Si la evidencia del miembro/espacio de trabajo no está disponible,
`identityKnown: false` informes que solo se pueden identificar principales. Estado obtiene una nueva propiedad observación; un perfil nativo ocupado o ilegible devuelve 503 sin aplicar el cambio.

Las cuatro estrategias Codex prefieren otras identidades con margen de cuotas, preservando el orden personalizado dentro de cada grupo. Las entradas reservadas permanecen como reserva cuando los niveles preferidos se agotan. **Lata de repliegue Consumir la cuota de acceso**, sujeto a acceso de modelo existente, pausa, tiempo de reutilización, reautenticación, Verificaciones de consentimiento de bloqueo y crédito pagado. Esta política no otorga el consentimiento de crédito pagado.

Las fijaciones existentes saludables permanecen en su lugar, y los pines manuales y las rutas de modelo exactas calificadas para la cuenta Anule la preferencia. Para aplicarlo al trabajo en curso, ejecute:

```bash
ocx account preserve-signed-in openai on --apply-to-bound
```

Esto libera explícitamente solo las fijaciones afectadas y cualquier pin manual afectado para el **siguiente solicitud**; Las solicitudes en vuelo mantienen su cuenta capturada. Permanecen fijaciones y pasadores no relacionados. El trabajo en movimiento puede perder su caché rápida y caliente, y las cargas o el estado de continuación con alcance de cuenta pueden evitar un movimiento.
`codexAccountPriorityFailback` sigue siendo un opt-in separado, con su estrategia de cuotas existente, positivo-umbral y nuevas condiciones de observación; también puede mover el trabajo hacia un grupo preferido.

Porque **Nunca use esta identidad a través de la grupo.**, uso `ocx account pause openai main` en su lugar: La pausa vinculada excluye las entradas del grupo principal y coincidentes sin cambiar el archivo de inicio de sesión del escritorio. Solo se controlan las solicitudes que llegan a OpenCodex. Esto no desbloquea una ya desactivada compositor de escritorio o promesa de arreglar la puerta de cuota del lado del cliente.

### `ocx account priority <provider> <account-id|alias|main> [<-100..100|first|earlier|normal|later|last|reset>] [--json]`

Lee o establece el orden de selección de una cuenta de grupo Codex: **más alto se utiliza antes**, el valor predeterminado es
`0`, y el rango es `-100` a través `100`. Solo el `openai` Codex grupo está ordenado, por lo que otros proveedores salida 1. `main` apunta al inicio de sesión en el escritorio Codex, que se ordena como cualquier otro grupo cuenta. `ocx account priority openai main last` reduce solo esa entrada; use
`preserve-signed-in` para reservar sus entradas de grupo ordinarias que coincidan también.

Las palabras preestablecidas representan números enteros pequeños: `first` es `+2`, `earlier` es `+1`, `normal` es `0`,
`later` es `-1`, y `last` es `-2`. `reset` devuelve la cuenta al valor predeterminado y deja caer su entrada. **Omitir el valor leído** el orden actual en lugar de escribir uno.

Ordenar las cuentas que se consideran primero, no las que son utilizables: la selección aún se ejecuta entre cuentas elegibles, tomando el nivel de orden más alto que aún tiene margen de cuota y
`accountPoolStrategy` para elegir dentro de ella. La pausa, el tiempo de reutilización y la reautenticación no se ven afectados. Los cambios se aplican desde el **siguiente solicitud no vinculada**, no solo de las sesiones recién iniciadas: movimientos de anticipación una solicitud no vinculada tan pronto como un orden superior recupere espacio libre. Hilos ya vinculados a una cuenta normalmente mantenerlo hasta que se agote esa cuenta; un fallo de reautenticación o un tiempo de reutilización de la cuota todavía Libera el enlace de inmediato. Una racha de fallos transitorios (5xx y otros fallos no contingentarios) llegar `upstreamFailoverThreshold`, por defecto 3) ya no elimina una vinculación en vivo: la solicitud es servido por otra cuenta mientras se mantiene la vinculación, y la tarea vuelve a su propia cuenta tan pronto como como esa cuenta sirve de nuevo. Si la cuenta sigue fallando después de 10 minutos, la vinculación es Liberados con normalidad. Esta posición es independiente de `pool.cacheAffinity`. Cualquier escritura aceptada también libera un manual. "usar esta cuenta ahora", pin, en cualquier cuenta que lo celebró, incluyendo un escrito que almacena el ordenar una cuenta ya tenía — esta es la única manera de borrar un pin mientras se mantiene la cuenta (Eliminar la cuenta activa a través de la administración API libera un pin también, pero deja caer esa selección junto con él.) Un proxy inalcanzable, id de cuenta desconocida, o un valor fuera del conjunto aceptado sale 1. `--json` devuelve:

```text
{ ok: true, provider, id, priority: number, preset: string | null }
```

### `ocx account login|reauth|code|cancel ...`

Ejecute la autenticación de cuenta basada en navegador o código manual desde un shell sin cabeza. Uso
`ocx account --help` para la forma de comando específica del proveedor. Si se guarda un inicio de sesión de cuenta Codex, pero su validación o actualización de catálogo de modelo permanece pendiente, tanto los modos humano como JSON salen 1. El inicio de sesión guardado permanece visible; no reinicie la autenticación solo porque el trabajo de seguimiento esté pendiente. Impresiones de salida humana fijas `ocx sync` stderr para un catálogo pendiente.
`--json` mantiene stdout analizable y conserva las banderas pendientes sin la advertencia humana.

Las nuevas opciones de inicio de sesión son específicas para el flujo:

| Flujo | `--open-browser on\|off` | `--add-account on\|off` |
| --- | --- | --- |
| Proveedor ordinario fresco OAuth | Compatible con proveedores compatibles con el navegador | Se admite; se omiten los valores predeterminados para agregar una cuenta |
| Reauth proveedor ordinario | Flujos compatibles con el navegador solamente | Rechazado; la omisión retiene el comportamiento reauth |
| Codex inicio de sesión del navegador | Apoyado | Rechazado |
| Dispositivo Codex, o kimi/nous/github-copilot nativo | Rechazado | Rechazado para Codex; reglas ordinarias OAuth para otros proveedores |
| Nativo Kiro `--method` | Rechazado | Rechazado; este flujo es solo para agregar |

Explícita add-account off permite la preferencia de importación existente; no eliminar una cuenta. Omission conserva los valores predeterminados anteriores de CLI. El operador debe Verificación completa del navegador/dispositivo. Conservar `flowId`, ID de cuenta y verificación código separado; una concesión de dispositivo devuelta no es un lanzamiento exitoso del navegador.
`--no-wait --json` informa de la transferencia, no completado inicio de sesión. En espera, estado caducado, cancelado, pendiente de validación y pendiente de catálogo; nunca en silencio reiniciar un flujo, credenciales de captura o verificación completa para el operador.

`ocx account login openai --device` ejecuta el inicio de sesión de código de dispositivo de OpenAI en lugar del navegador callback. Utilícelo cuando el host proxy no tiene navegador, o cuando nada puede llegar a su
`localhost:1455` — un contenedor, un VPS o cualquier concentrador alcanzado a través de SSH:

```bash
ocx account login openai --device --no-wait --json
# Read the returned flowId, URL and deviceCode; the operator completes verification.
```

Abra URL en cualquier otra máquina, ingrese el código corto y se completa el inicio de sesión. Sin
`--no-wait` las encuestas de comando hasta que termine; la concesión del dispositivo vive 15 minutos, y el El comando espera tanto tiempo en lugar de los 5 minutos que permite un inicio de sesión del navegador, porque el punto es que te alejas a otro dispositivo. `kimi`, `nous`, y `github-copilot` aceptar la bandera como no-op porque su único inicio de sesión ya es un flujo de dispositivos; un proveedor sin concesión de dispositivos Lo rechaza.

En el panel de control, el mismo inicio de sesión es seleccionado por el **"No abras un navegador en el proxy máquina"** En el cuadro de diálogo Agregar cuenta. Esta configuración ya significa que el operador no está sentado en el host proxy, que es exactamente cuando una devolución de llamada URL es inútil — así que marcándolo cambia el inicio de sesión Codex al flujo del dispositivo y muestra un código copiable en su lugar.

### `ocx account remove <provider> <id|alias|main> --yes [--json]`

Esta eliminación protegida y no interactiva requiere `--yes`. Antes de eliminarlo, verifica que el id existe; un id que falta sale 1 sin enviar DELETE. El inicio de sesión principal de la aplicación Codex no se puede eliminar, por lo que
`remove openai main --yes` es rechazada. Después de la eliminación, la familia se lee de nuevo: eliminar el anclado La cuenta Codex borra el pin y vuelve a la selección automática; OAuth promueve el primer restante cuenta o informes ninguno; Los grupos de claves API promueven la primera clave restante o no reportan ninguna. `--json`
Las formas de éxito y fracaso son:

```text
{ ok: true, provider, id, removedActive: boolean, promotedActiveId: string | null, catalogRefreshPending?: boolean }
{ error: string } // stderr, exit 1
```

`catalogRefreshPending` solo está presente en las eliminaciones de Codex. Cuando es `true`La eliminación de la cuenta es ya guardado; salida humana imprime genérico `ocx sync` guía de recuperación en stderr y todavía sale 0. Los sobres de eliminación de OAuth-account y API-key no obtienen este campo.

### `ocx account add-key <provider> [--label <label>] [--json]`

Agrega y activa una clave para un proveedor de claves API. La clave se lee solo desde no-TTY canalizado/redirigido stdin; entrada interactiva TTY, entrada vacía, proveedores OAuth/Codex y errores API salen 1. La clave es nunca hizo eco, incluso cuando aparece dentro de una etiqueta. Prefiero un administrador secreto o una cadena de aquí:

```bash
ocx account add-key openrouter --label personal <<< "$OPENROUTER_API_KEY"
security find-generic-password -w openrouter | ocx account add-key openrouter --json
```

`--json` devoluciones `{ ok: true, id: string | null, label?: string }` Nunca incluye la llave.

### `ocx account reset-credits <id|main> [--consume --yes]`

Inspeccione los créditos de restablecimiento de Codex para una cuenta. El consumo de un crédito es destructivo y requiere ambos
`--consume` y `--yes`.

Después de una confirmación `reset`, el nuevo uso puede recuperar la misma cuenta elegible existente Reutilización derivada del reinicio compartido. Cuentas en pausa, cuentas que necesitan reautenticación y Los tiempos de reutilización propiedad de una sonda en vuelo permanecen excluidos de esta recuperación. Un fracaso u ocupado actualización de uso después del consumo confirmado no requiere otro crédito: comprobar el uso De nuevo en lugar de repetir `--consume`. Consumir el éxito no garantiza la capacidad de rotación; ver el [gestión API contrato de recuperación](/es/reference/management-api/#codex-authentication-delegation)
para restablecer/reproducir, frescura y límites de alcance.

### `ocx account grok-reset-coupons [<account-id>] [--consume --yes [--token-id <id>] [--operation-id <uuid>]] [--json]`

Inspecciona los cupones restantes o canjea uno por una cuenta xAI / Grok.

Cuando se invoca sin `--consume`, devuelve el cupón disponible tokens y ventanas de validez:

```bash
ocx account grok-reset-coupons
ocx account grok-reset-coupons acc_xai_01 --json
```

Canjear un cupón de restablecimiento muta el estado de facturación y agota permanentemente un cupón token. `--consume` estrictamente requiere `--yes`:

```bash
ocx account grok-reset-coupons --consume --yes
ocx account grok-reset-coupons --consume --yes --token-id <token-id>
```

Pase `--operation-id <uuid>` (debe ser un UUIDv4 válido) para garantizar la liquidación idempotente. Si la red cae o se vuelve a intentar el commando, IDs de operación idénticos reproducen el resultado grabado de forma duradera en lugar de consumir un segundo cupón.

El comando sale de no cero a menos que el código establecido sea `redeemed` (Incluyendo una repetición `redeemed`) Cuando el resultado no está confirmado (falta o no se reconoce un código establecido, `attempt_unresolved`, `attempt_in_progress`, `attempt_reconcile_failed`, `operation_state_changed`, `operation_token_mismatch`, `attempt_mark_failed`, o `ledger_unavailable`/`capacity` ej., con un ID de operación), imprime el `--operation-id` para conservar; vuelva a ejecutar con el mismo ID en lugar de iniciar una nueva operación. Una negativa registrada (`auth_failed`, `fetch_resets_failed`, `no_coupons_available`, `coupon_unavailable`, o `token_unresolved`), como un fallo repetido, imprime `Coupon was not redeemed (<code>)`; cualquier otro código establecido cuenta como no confirmado.

### `ocx account main <subcommand>`

Administre los perfiles de inicio de sesión principal nativos con nombre Codex sin cambiar el enrutamiento de grupo de cuentas OpenCodex:

```text
ocx account main doctor [--json]
ocx account main list [--json]
ocx account main register <label> [--json]
ocx account main add <label>
ocx account main reauth --device [--no-wait] [--json]
ocx account main reauth status --flow <id> [--json]
ocx account main reauth cancel --flow <id> [--json]
ocx account main switch <profile-id-or-label> --yes [--json]
ocx account main recover [--rollback --yes] [--json]
```

Una lista de perfiles nativos vacía sugiere `ocx account main add <label>` en humanos salida y JSON `notes`; no supone que un inicio de sesión nativo existente esté disponible.

`ocx account main reauth --device --no-wait --json` escribe un objeto JSON a stdout en el éxito, sin el ser humano-legible `follow up:` línea. Utilice su `flowId` con `ocx account main reauth status --flow <id> --json` para comprobar el progreso.

Cada comando de mutación informa el canónico efectivo `CODEX_HOME` devuelto por el proxy en ejecución. Este camino puede diferir del de la persona que llama `CODEX_HOME`; comandos que soportan JSON exponen lo mismo valor como `effectiveCodexHome`.

La versión 1 admite la autenticación Codex basada en archivos, cifra los perfiles almacenados con AES-256-GCM, y mantiene la clave de cifrado en el almacén de credenciales del sistema operativo. `add` etapas el oficial Codex flujo de inicio de sesión antes de importar la credencial resultante. Cerrar Codex antes de cambiar los perfiles; a switch exitoso conserva las tareas locales y el historial, luego requiere que se reinicie Codex. Uso
`doctor` para inspeccionar el estado del perfil y `recover` para terminar o revertir una transición interrumpida.
`switch` acepta el ID de perfil o su etiqueta.

`reauth` Re-autentica el *existentes* identidad principal nativa con un código de dispositivo OpenAI (n.o 3898) en lugar de inscribir un nuevo perfil. Es la ruta de recuperación sin cabezal: no hay aplicación local Codex, no `codex` binario, y no se requiere ningún llavero del sistema operativo. El inicio de sesión del dispositivo debe completarse para la misma cuenta ChatGPT que ya tiene la ranura principal nativa; la escritura de credenciales está cercada por la reclamación exclusiva y una instantánea de ruta / hash /inodo, y la salida del comando solo lleva el ID de flujo, la verificación URL, el código del dispositivo y el estado. La ruta de inicio de sesión de la grupo permanece solo en la grupo y sigue rechazando `__main__`; la superficie del panel de instrumentos equivalente es el Re-login de la tarjeta principal Codex Auth con control de código del dispositivo.

La matriz de recuperación v1 cubre un proceso OpenCodex que sale después de que se ha eliminado un archivo de transacción. Publicado por Rename. No reclama durabilidad a través de un sistema operativo o fallo del kernel o potencia repentina pérdida: `atomicWriteFileAsync()` no hace `fsync` El archivo o su directorio padre.

La bóveda encriptada, el diario de cambio, el marcador de recuperación y la cuarentena del diario en vivo en el entorno canónico
`<real CODEX_HOME>/.opencodex-native-main-profiles` directorio, por lo que cada instancia compartida OpenCodex que Codex casa observa un propietario y un estado de recuperación. La puesta en escena de inicio de sesión de texto plano permanece aislada debajo de cada `<OPENCODEX_HOME>/native-main-profile-staging` directorio.

Antes de que se admita el tráfico principal nativo o la recuperación del diario, el propietario de por vida toma la decisión exclusiva. Reclamación de credenciales y elimina solo exactamente `auth.json.ocx.<pid>.<sequence>.tmp` Residuos de choque. Cada El candidato debe seguir siendo un archivo regular vinculado bajo el canónico inalterado. `CODEX_HOME`; es truncado, enrojecido y luego desvinculado. Sustituciones de enlace/reparación, cambios de identidad y otros ambiguedad mantener el tráfico principal nativo cerrado, mientras que casi miss nombres nunca se eliminan automáticamente. Esto protege contra las fallas cooperativas de OpenCodex, no un proceso malicioso que ya se está ejecutando como el mismo usuario del sistema operativo. Ese usuario y el sistema de archivos que contiene `CODEX_HOME` seguir siendo de confianza, y truncamiento no promete borrado físico del almacenamiento de copia en escritura, instantáneas o remanencia SSD.

Previsualizar las compilaciones utilizadas `<OPENCODEX_HOME>/native-main-profiles`. Ese diseño nunca se importa en silencio. Si `doctor` informa el estado del perfil heredado, detenga todos los proxy OpenCodex que comparten el mismo `CODEX_HOME`. Luego, retroceda y mueva la coincidencia `*.vault.json`, `*.journal.json`, marcador de recuperación, y cualquier referenciado journal-quarantine archivo junto en el directorio canónico, preservando solo propietario permisos, o eliminar el conjunto de vista previa anterior y ejecutar `ocx account main register` De nuevo. No elijas entre múltiples raíces antiguas o ejecutar ambos diseños mientras cualquier proxy de uso compartido está activo. En Windows, el estado de vista previa tecleado por la identidad de inicio plegada en mayúsculas y minúsculas anterior debe restablecerse en lugar de se mueven porque su AAD encriptada y su identidad de llavero del sistema operativo no se reutilizan intencionalmente.

<a id="models"></a>

## Modelos

### `ocx models [subcommand]` · `ocx model <subcommand>`

`ocx model` Es un alias de `ocx models`. Sin subcomando, lista los modelos sembrados estáticamente en proveedores configurados. `--provider` filtra un proveedor configurado y `--json` devuelve el modelo Metadatos. `live` lee el catálogo en ejecución; `add`, `edit`, `remove`, y `list-custom` administrar manual entradas de catálogo; `enable`, `disable`, y `provider` Visibilidad de control; `selected` controles a lista de proveedores; `context` controla los límites de contexto del proveedor; y `shadow` gestiona el fondo intercepción de llamadas de sombra.

Los precios de los modelos son estimados en USD por millón tokens. `ocx models --json` Incluye un
`price` Objeto con `cost4` las tarifas y su fuente; `ocx models price --json` se mantiene
`cost` para la anulación guardada y los informes tasas resueltas en `effectiveCost`. Los precios manuales (incluido cero) tienen prioridad, seguido del catálogo compartido y Verificado oficial-precio fallbacks. Los modelos desconocidos regresan `null`No se inventa ningún precio. Los valores predeterminados automáticos se derivan de la lectura y no se rellenan `modelCosts` en su configuración, Así que las actualizaciones de catálogo siguen siendo eficaces. Uso `set-price` para ahorrar tarifas específicas del proveedor.

`price --json` También conserva un `promptLengthPricing` política en `cost`; los cuatro
`effectiveCost` Las tarifas son las tarifas base, antes de evaluar la longitud o el nivel de una solicitud. Uso **Modelos → Precio** o la administración API para editar una directiva de longitud de prompt. Existentes `set-price`
Los comandos reemplazan las cuatro tasas base y mantienen la política de umbral plana o personalizada guardada del modelo;
`--auto` Elimina tanto las tarifas como cualquier política.

Descubra la sintaxis de comandos con `ocx models --help` antes del trabajo en vivo. `list-custom`
lee la configuración local; `add` y `remove` Salvar localmente a menos que se `--live`. La costumbre local escribe de forma oportunista cuando existe un proxy. El resto Las operaciones de gestión de modelos utilizan el proxy en ejecución. Verificar disponibilidad y versión antes de las llamadas en vivo; la inspección sin conexión no requiere iniciar un proxy. Las anulaciones de nombre de pantalla para modelos descubiertos tienen su propio comando, separado por Custom-Model `edit`.

| Subcomando | Banderas soportadas | Acción |
| --- | --- | --- |
| `list` (predeterminado) | `--provider <name>`, `--json` | Lista de modelos sembrados en proveedores configurados, con precios estimados de entrada/salida. |
| `live` | `--provider <name>`, `--json` | Lea el catálogo en ejecución, incluidos los modelos descubiertos en entorno de ejecución. Las filas están marcadas `native`/`routed`, `custom`, y `enabled`/`disabled`. |
| `price <provider/model>` | `--json` | Lea la anulación manual guardada y el precio efectivo, incluidos los valores predeterminados automáticos del catálogo. |
| `set-price <provider/model>` | `--input <rate>`, `--output <rate>`, `--cache-read <rate>`, `--cache-write <rate>`, `--auto`, `--json` | Establezca los precios de visualización en USD por 1M tokens. Se requieren entradas/salidas cuando se establece; las tasas de caché omitidas se vuelven cero. `--auto` elimina solo la anulación de este modelo. |
| `add <provider> <modelId>` | `--display-name <name>`, `--context-window <tokens>`, `--modalities <text,image,audio>`, `--reasoning-efforts <levels>`, `--default-reasoning-effort <level>`, `--live`, `--json` | Registrar un modelo personalizado localmente o, con `--live`, en el proxy de ejecución. |
| `edit <custom-id>` | `--model-id <id>`, `--display-name <name\|->`, `--context-window <tokens\|0>`, `--modalities <text,image,audio\|->`, `--json` | Edite un modelo personalizado. `-` despeja un campo; `0` Despeja la ventana contextual. |
| `remove <custom-id\|provider/modelId>` | `--yes`, `--live`, `--json` | Elimine un modelo personalizado localmente o en el destino activo. La eliminación en vivo y la eliminación local de JSON requieren `--yes`; el modo de texto local conserva la confirmación interactiva. |
| `display-name <provider/raw-model-id>` | `--set <text>` o `--clear`, `--json` | Establezca o borre la anulación de visualización del modelo descubierto; conserve el ID ascendente sin procesar. |
| `order status` | `--json` | Lea el orden/modo guardado, los candidatos enrutados y el estado destacado conocido. |
| `order set` | `--models <CSV>` o `--mode <default\|alphabetical\|provider\|most-used>`, `--json` | Establezca una permutación enrutada completa u obtenga un orden preestablecido. |
| `order reset` | `--json` | Borrar el orden y el modo guardados, conservando la selección destacada. |
| `list-custom` | `--json` | Mostrar todos los modelos personalizados con el `custom-id` los otros subcomandos toman. |
| `enable <provider/model\|native-model>` | `--native`, `--json` | Haga que un modelo sea visible para Codex. |
| `disable <provider/model\|native-model>` | `--native`, `--json` | Ocultar un modelo de Codex. |
| `provider <name> <on\|off>` | `--json` | Habilitar o deshabilitar cada modelo de un proveedor en una sola escritura. |
| `selected <provider>` | `--set <id,id...>`, `--clear`, `--json` | Lea o sustituya la lista de permisos del modelo de proveedor. `--clear` elimina la lista de permisos para ofrecer cada modelo. |
| `preset show` | `--provider <name>`, `--json` | Lea las versiones preestablecidas enviadas y el modo aplicado, opcionalmente para un proveedor. |
| `preset apply <provider>` | `--all`, `--json` | Aplicar el preajuste seleccionado; `--all` Despeja la lista de permisos. Un ajuste preestablecido de coincidencia cero deja la selección sin cambios e informa `fallback: "preset-empty"`. |
| `new-policy [on\|off]` | `--provider <name>`, `--json` | Lea o cambie la política de exposición para los modelos recién descubiertos; la omisión del proveedor selecciona la política global. Un proveedor de lectura puede informar `inherit`. |
| `new-arrivals` | `--json` | Lea los descubrimientos recientes registrados por el proveedor; no fuerza un nuevo descubrimiento de origen. |
| `context <status\|value <tokens> [--set-all]\|provider <name> on [--value <tokens>]\|provider <name> off\|all <on\|off>>` | `--json` | Lea o establezca el límite de la ventana de contexto, globalmente o por proveedor. `value <tokens> --set-all` también vuelve a apuntar a cada proveedor enrutado (como el conmutador del panel de control); sin él, el valor solo se convierte en el predeterminado. `provider ... on --value <tokens>` establece un límite explícito solo para ese proveedor (`--value` Es válido con `on` solamente). |
| `shadow <status\|set> [model\|-]` | `--enabled <on\|off>`, `--json` | Lea o establezca el modelo de reemplazo para las llamadas de ayudante de fondo de Codex. `-` Limpia el modelo. `status` también informes `sourceModels`, el ayudante lanza las intercepciones proxy (por defecto: `gpt-6-luna`, `gpt-5.6-luna`; clientes a través de 0.144.x utilizados `gpt-5.4-mini`, lo cual es explícito `sourceModels` puede restaurar). |

```bash
ocx models live --json                                  # what Codex can actually see right now
ocx models disable anthropic/claude-haiku-4             # hide one routed model
ocx models enable gpt-5.6-sol                           # no slash, so it is treated as native
ocx models provider zenmux off                          # hide a noisy provider wholesale
ocx models selected anthropic --set claude-opus-5,claude-fable-5
ocx models selected anthropic --clear                   # drop the allowlist again
ocx models add deepseek deepseek-v4 --display-name 'DeepSeek V4' --context-window 128000 --modalities text,image
ocx models list-custom --json                           # read the custom-id for edit/remove
ocx models remove deepseek/deepseek-v4 --yes
```

Se enruta un selector de modelo con una barra (`anthropic/claude-opus-5`); una identificación desnuda se trata como un modelo nativo OpenAI, así `--native` solo es necesario forzar esa lectura para un id que De lo contrario, parece enrutado.

`--modalities` acepta solo `text`, `image`, y `audio`. Codex analiza ese campo como una entrada cerrada y rechaza un catálogo completo que contiene cualquier otro valor, `add`, `edit`, y la gestión API todos rechazan el mal valor en lugar de almacenar algo que el escritor del catálogo tendría que despojar más tarde (759).

<a id="live-custom-models-and-local-save-outcomes"></a>

### Modelos personalizados en vivo y resultados de guardado locales

Utilice nombres de proveedores configurados e ID de modelo ascendente sin procesar. Para un autorizado adición o eliminación en vivo, inspeccione el objetivo previsto y vuelva a leer después:

```bash
ocx ready --json
ocx status --json
ocx models add <provider> <raw-model-id> --live --display-name 'Research model' --context-window 128000 --modalities text --json
ocx models live --json
```

Mantener la devolución almacenada `id`. Usos de eliminación `ocx models remove <complete-stored-id> --live --yes --json`
o un selector de proveedor/modelo inequívoco de ese objetivo. Mostrar etiquetas e ID Los prefijos no son selectores. No hay respaldo local, eliminación protegida por revisión o reintento de identificación alternativa. `models list-custom --json` es una lista local, no una lista en vivo Registro leído para otro objetivo.

Sin `--live`, agregar/eliminar JSON devuelve `{action, model, needsSync, sync}`. No hay medios proxy `sync: {"status":"not-attempted","ok":false}`, `needsSync: true`
y salida 0: se ha realizado con éxito el guardado local y no se ha intentado la sincronización oportunista. Los intentos de fallos/rechazos de sincronización no son cero mientras se conserva el guardado. Solo Completa la sincronización aplicada `needsSync`El éxito omitido puede salir de 0 con Sigue siendo cierto. La eliminación de JSON requiere `--yes` incluso en un terminal interactivo.

<a id="display-names-and-picker-identities"></a>

### Mostrar nombres e identidades de selector

```bash
ocx models display-name <provider>/<raw-model-id> --set 'Research model' --json
ocx models live --json
```

Este comando se divide en la primera barra y retiene cada barra restante en el ID del modelo raw upstream. No sustituya un identificador o alias de selector público codificado.
`--clear` Es la alternativa a `--set` y envía nulo. Las anulaciones de etiquetas no cambiar precios o identidad pública. Un resultado reconocido guardado pero no actualizado ha `saved: true` y salida 1; inspeccione el estado antes de otra escritura.

```bash
ocx models order status --json
ocx models live --json
ocx models order set --models '<complete-public-id-permutation>' --json
ocx models order status --json
```

El pedido manual utiliza los identificadores públicos en `pickerAvailable`, cada candidato derrotado exactamente una vez, con los modelos actuales en su orden inicial exacta requerida. Las entradas en blanco, duplicadas, faltantes, desconocidas y ambiguas se niegan. El CLI vuelve a leer configuración e identidades de modelo inmediatamente antes del manual PUT; estado cambiado Devuelve el conflicto. Esta es una comprobación observacional, no CAS, así que vuelve a leerla después. Nunca silenciosamente deja caer identidades natales o modifica la selección ofrecida.

Alternativamente, seleccione `--mode alphabetical`, `--mode provider`, o `--mode most-used`. Estos configuración preestablecidos no preceden al prefijo de la función manual. Las lecturas más utilizadas de todos los tiempos, uso de toda la superficie, retiene candidatos no clasificados y rechaza la historia incompleta. Tanto los modos manuales como los no predeterminados rechazan los pedidos guardados que contienen ID nativos desnudos. Si se pretende borrar esa orden guardada, use `ocx models order reset --json` o
`ocx models order set --mode default --json` Primero. No reajuste automáticamente el rechazo.

Las escrituras personalizadas y de orden en vivo incluyen `catalogRefresh`. Sólo comprometidos, refrescar no degradado sale 0; refrescar omitido, fallado o degradado devuelve el guardado Recepción con salida 1. Recepción del pedido `applied` es el roster destacado, no el cliente convergencia. Los resultados desconocidos requieren inspección, no una suposición de retroceso.

<a id="apply-a-preset-and-verify-selection"></a>

### Aplicar un preajuste y verificar la selección

```bash
ocx models preset show --provider anthropic --json
ocx models preset apply anthropic --json
ocx models selected anthropic --json
ocx models new-policy --provider anthropic --json
ocx models new-policy off --provider anthropic --json
ocx models new-policy --provider anthropic --json
ocx models new-arrivals --json
```

Las escrituras requieren la intención de cambiar la política de selección o descubrimiento. Leer de nuevo el selección y política; una reserva preestablecida guardada puede dejar la selección anterior intacto. `preset apply <provider> --all` es el modo de todos los modelos soportado; el El preajuste personalizado deshabilitado del panel de control no agrega otro modo seleccionable.

<a id="mark-one-model-text-only"></a>

### Marcar un solo texto de modelo

Uso `ocx provider add mine --adapter openai-chat --base-url https://example.com/v1 --default-model model-a --text-only` al registrar un proveedor, o `ocx provider edit mine --model model-a --text-only` para un proveedor existente. Añadir puede utilizar `--model` o su modelo predeterminado; editar requiere `--model`. La bandera actualiza solo el modelo exacto `modelCapabilities.inputModalities` a `["text"]`, conservando otros modelos y ejes.

<a id="cached-quota-history"></a>

### Historial de cuotas en caché

Los cheques automáticos de agotamiento de la cuenta OpenAI distinguen los créditos de uso comprados del reinicio Entradas. El gasto permanece desactivado de forma predeterminada: habilitar **Usar créditos** para esa cuenta (almacenada en
`creditCodexAccountIds`) Solo que opt-in junto con un saldo gastable positivo fresco o Los créditos ilimitados pueden mantener una cuenta elegible después de que el uso incluido alcance el 100%; un rechazo ascendente o límite de exceso de edad todavía Bloquea esa evidencia. La evidencia de crédito expira después de cinco minutos, y los encabezados de uso no renovar su reloj. `pause-exhausted` utiliza esta regla. Restablecer entradas por sí solo nunca conceder automático espacio libre, y una respuesta de solo créditos no puede borrar un tiempo de reutilización de la solicitud. La cuenta principal predeterminada hard lock sigue siendo una política local separada y no se levanta por el interruptor de créditos.

`ocx account history openai <pool-account-id> [--limit 1-200] [--json]` lee las observaciones almacenadas sin contactar con el proveedor. La salida separa el tiempo de observación real, WHAM o la fuente del encabezado de respuesta, la familia de ventanas y el porcentaje de uso. Como máximo 200 observaciones por cuenta se conservan durante 30 días, con límites de almacenamiento global.

La actualización ordinaria de token conserva la historia. La reautenticación, eliminación o reemplazo de cuenta retira la publicación anterior. No se incluyen las sondas principales nativas realizadas antes de publicar un inicio de sesión. La historia que falta significa observaciones insuficientes, no uso cero. Este comando no gasta cuota. Las estimaciones efectivas, cuando se apoyan en observaciones, llevan las limitaciones a continuación.

La salida del historial también incluye estimaciones efectivas de token reportadas cuando las observaciones de la misma ventana y el uso atribuible las respaldan. Cada estimación incluye un recuento de muestras y baja confianza. El redondeo de cuotas, el uso externo y la continuidad supuesta de la etiqueta de registro limitan la inferencia; no es la asignación token de su proveedor. La evidencia del libro mayor faltante o truncado devuelve evidencia insuficiente. `--limit` controles muestran el historial, no la entrada de estimación limitada.

### `ocx account routes anthropic`

Lea las rutas del modelo Anthropic OAuth guardadas, reemplácelas de una matriz JSON local o límpielas:

```sh
ocx account routes anthropic --json
ocx account routes anthropic --file routes.json
ocx account routes anthropic --clear
```

El archivo está limitado a 64 KiB. El servidor valida cada ruta y la almacena en `anthropicAccountPool.routes`; writes requieren el proxy en ejecución. Utilice los ID de cuenta almacenados de `ocx account list anthropic --json`. Las reglas solo afectan al grupo habilitado y nunca afirman que una cuenta tiene derecho a un modelo. Los registros de solicitud identifican una regla coincidente como `route:#<n>` (1 posición de lista basada), sin su nombre de operador.

Los ayudantes de visión y de búsqueda web coinciden con su propio modelo de forma independiente y pueden fallar localmente cuando sus resultados se actualizan. ruta estricta no tiene cuenta elegible. Véase [Anthropic routing de cuenta auxiliar](/es/reference/configuration/providers/#anthropicaccountpool-experimental).
