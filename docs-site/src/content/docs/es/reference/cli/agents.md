---
title: "Agentes, enrutamiento e integraciones de CLI"
description: "Comandos multiagente, combo, observabilidad, acceso, ruta de protocolo, integración, sistema y configuración."
---

Estos comandos controlan la política del agente y el enrutamiento, inspeccionan el proxy en vivo y conectan los clientes compatibles con opencodex.

<a id="agent-policy"></a>

## Política del agente

### `ocx agent <status|injection|effort|subagents|fallback|roles|sidecar|memory-models|compaction-routing> ...`

Administre la lista de agentes múltiples sin cabeza, los límites de esfuerzo, la inyección rápida, la reserva y la configuración del sidecar. Uso `status` para la política actual. Véase [Superficies de los subagentes](/es/guides/sub-agent-surface/) por cómo Los modos de superficie, la delegación, el esfuerzo y el comportamiento de reserva encajan.

```bash
ocx agent subagents set ark/model-a,openai/gpt-5.5
```

`ocx agent roles` es para omo (Codex / LazyCodex). Enumera cada rol de agente Codex en
`$CODEX_HOME/agents` con su pin modelo y si `~/.omo/omo.jsonc` puede ser actualizado, o decir LazyCodex no está instalado, en cuyo caso `set` es rechazada. `ocx agent roles set <role> <model> [--effort <level>]` Sólo reescribe La raíz de ese rol `model` línea, y su `model_reasoning_effort` línea con `--effort`, y refleja ambos en omo.jsonc en
`[codex].agents.<role>` como `model` y `reasoning`. Un esfuerzo para el que LazyCodex no tiene nivel, como `ultra`, se escribe solo en el archivo de rol. Una omo.jsonc faltante, o una que contiene comentarios, se deja sin cambios Y el comando lo dice. Véase [modelos de rol omo (Codex / LazyCodex)](/es/guides/integrations/#omo-codex--lazycodex-role-models).

```bash
ocx agent roles set explorer xai/grok-4.5 --effort medium
```

`ocx agent roles suggest` es omo (Codex / LazyCodex) solamente, rechazado como `set` cuando LazyCodex no es instalado. Dimensiona cada rol con una llamada al modelo Codex predeterminado (o `--model`) imprime un modelo propuesto y un esfuerzo por rol sin escribir nada. `--apply` Escribe cada propuesta A través de la misma escritura como `set`, saltándose y nombrando los roles cuyo modelo y esfuerzo ya coinciden. Véase [Asignación automática](/es/guides/integrations/#auto-assign).

La salida de sugerencias legible por humanos muestra los caracteres de control del terminal como escapes visibles. Uso `--json` cuando necesite los valores de sugerencia originales sin que se escape la presentación.

`ocx agent injection suggest <work>` hace lo mismo para el modelo de delegación: mide el tamaño trabajo, propone el modelo más barato suficiente y un esfuerzo de la lista del selector de delegación, y escribe Nada a menos que `--apply` se da, lo que ahorra a través de la misma escritura como `injection set`. Véase
[Modelo de delegación y esfuerzo](/es/guides/sub-agent-surface/#delegation-model-and-effort).

`ocx agent sidecar web --list` y `ocx agent sidecar vision --list` imprimir los modelos el servidor actualmente ofrece para cada sidecar — el conjunto filtrado exacto que muestra el selector de panel (filas visibles de selector más las ranuras de autenticación Luna/Haiku con nombre de inicio de sesión, intersectadas con ejecutor) disponibilidad para la búsqueda web, menos modelos de solo texto para la visión). Listas legibles por humanos mostrar el backend de cada modelo entre paréntesis. Una búsqueda web `--model` write resuelve que el servidor ofrecido fila y persiste su backend y modelo juntos, por lo que cambiar a una opción Anthropic no puede mantener un backend OpenAI (o viceversa). Las escrituras van a la misma ruta de administración que el GUI y sujeto a la misma puerta por sidecar: la búsqueda web rechaza un par backend/modelo fuera de los listados establecido (miembro cerrado), mientras que la visión se niega sólo un modelo probablemente incapaz de ver (ids desconocidos) escrito en escritura).

```bash
ocx agent sidecar web --list
ocx agent sidecar web --model gpt-5.6-luna
ocx agent sidecar web --enabled off
```

`--enabled off` es el mismo switch que la fila Off del Dashboard: OpenCodex sidecar y la integración Codex escribe `web_search = "disabled"` en `~/.codex/config.toml`, que es lo que permite que un servidor de búsqueda MCP sea la única ruta de búsqueda. `--enabled on` elimina ese Marcador de la línea de nuevo. Cuando el guardar realmente mueve el interruptor, el comando informa el Codex-side escribirlo activado (`codexWebSearch` en `--json`, un seguimiento `Codex config:` línea de otra manera) y señala en `ocx sync` cuando no podía suceder; un salvamento que deja el interruptor donde estaba no tiene nada que informar y no imprime `Codex config:` línea. La bandera trabaja para
`vision` También.

<a id="injection-defaults-and-sidecar-runtime-settings"></a>

### Configuración predeterminados de inyección y entorno de ejecución del sidecar

```bash
ocx agent injection status --json
ocx agent injection set --sync-codex-defaults off --json
ocx agent injection status --json
ocx agent sidecar web --stream-routed-output on --json
ocx agent sidecar vision --timeout-ms 30000 --json
ocx agent sidecar status --json
```

Ejecutar escribe solo para el cambio solicitado. Inyección `--sync-codex-defaults on|off`
actualizaciones `syncCodexSubagentDefaults`; modelo/esfuerzo/pronta/orientación omitido permanecen intactos, y `-` despeja el modelo/esfuerzo/pronta. El recibo se ha normalizado
`model`, `effort`, `prompt`, `multiAgentGuidanceEnabled` y
`syncCodexSubagentDefaults`, no un resultado de catálogo fabricado.

Web `--reasoning` Sigue siendo apoyado. `--max-descriptions` y `--timeout-ms` son vision-only; timeout acepta enteros de 1 a 2147483647 milisegundos.
`--stream-routed-output` Es sólo web. Las escrituras parciales conservan la configuración de hermanos. El recibo de la nueva opción expone solo al público seleccionado `webSearch` o `vision`
Estado y `codexWebSearch` Informe de aplicación. `{applied:false, reason, retryable}`
se distingue nativo aplica aplazamiento/rechazo de un ajuste guardado; falta o La nueva configuración no coincidente es no verificada y distinta de cero. Leer el estado para la observación completa configuración, incluyendo el razonamiento web. No vuelvas a intentar ciegamente el rechazo de la propiedad.

<a id="memory-and-compaction-routing-overrides"></a>

### Anulaciones de enrutamiento de memoria y compactación

```bash
ocx agent memory-models show --json
ocx agent memory-models set --extract-model <route> --extract-effort high --consolidation-model <route> --json
ocx agent memory-models show --json
ocx agent compaction-routing show --json
ocx agent compaction-routing set --model <route> --effort high --triggers manual,auto --sources '<exact-source>,<provider>/*' --json
ocx agent compaction-routing show --json
```

Cada conjunto reemplaza el bloque entero. Memoria acepta modelo de extracción/consolidación y pares de esfuerzos opcionales; se rechaza un esfuerzo sin el modelo de esa fase. Las fases omitidas usan su ruta existente/predeterminada, no una canalización detenida.
`--file memory.json` En su lugar, lee el bloque en sí:

```json
{"extract":{"model":"example/model","reasoningEffort":"high"}}
```

Un archivo de memoria explícito `{}` es válido y sigue siendo un bloque de anulación vacío;
`ocx agent memory-models clear --json` Escribe nulo. Ambos significan que no hay anulación personalizada, no deshabilitado el procesamiento de memoria. El modo de archivo es exclusivo con opciones escalares. Archivos UTF-8 regulares o canalizados `--file -` Utilice los 4 MiB/30 segundos de entrada limitada contrato, incluyendo un límite de solicitud seriada de 4 MiB.

Archivos de compactación contienen requerido `model`, opcional `reasoningEffort`, `triggers`
y `sourceModels`. Los desencadenantes son únicos `manual`/`auto`Los selectores de fuentes deben ser exacto y único, o patrones de proveedor/*. Los desencadenadores omitidos usan valores predeterminados del servidor; Las fuentes omitidas seleccionan todas las fuentes, no el alcance personalizado anterior.
`ocx agent compaction-routing clear --json` escribe nulo y restaura ordinario enrutamiento de compactación sin deshabilitar la compactación. Ninguna llamada de modelo sintético verifica Estos salva.

Las lecturas regresan solamente `{memoryModels: blockOrNull}` o `{compactionRouting: blockOrNull}`. Escribe añadir `catalogRefreshPending`: salidas falsas 0 sin prometer a cada cliente aplicado, verdaderas salidas 1 después de guardar. Faltante / pruebas pendientes mal formadas es nula con
`verification:"unverified"` Salida 1. Lee antes de la recuperación.

### `ocx effort [status|set|clear]`

Inspeccione o cambie los límites del esfuerzo de razonamiento principal y subagente a través del proxy en vivo, o el proxy local. configuración cuando no hay proxy disponible. Los valores máximos son `low`, `medium`, `high`, `xhigh`, `max`, y `ultra`; `-` Despeja la tapa seleccionada. `none` y `minimal` no son niveles de límite y son rechazados antes de probar el proxy o enviar una actualización, incluso cuando otra opción en el mismo comando es válida. Siguen siendo válidas para `--injection`, que establece el esfuerzo de inyección separado en lugar de una tapa.

```bash
ocx effort status --json
ocx effort set --main high --subagent low
ocx effort set --subagent -
```

El estado conserva los valores de límite almacenados/en entorno de ejecución existentes e informa de los valores no admitidos en `warnings`
(una matriz vacía cuando no hay ninguna sin soporte). Las mismas advertencias aparecen en la salida humana y el nombre de la campo que se ignora con un comando de corrección. El estado nunca repara o reescribe esos valores. Un campo de subagente ignorado no elimina un límite principal válido. `ocx effort clear` Limpia ambas tapas mientras se mantiene el ajuste separado del esfuerzo de inyección. Véase [Superficies de los subagentes](/es/guides/sub-agent-surface/)
para las superficies de solicitud donde se aplican tapas.

### `ocx v2 <status|on|off|mode <v1|default|v2>|keep-native-v1 <on|off>|threads <n>|mode-hint <text|--clear>>`

Administrar el Codex `multi_agent_v2` bandera característica y el modo de superficie multiagente de tres estados. Estos funcionan localmente por defecto. `--live` utiliza el proxy de ejecución seleccionado sin apoyo local; ambos objetivos apoyan `--json`. Releer el estado en el mismo objetivo después de un cambio y distinguir la configuración almacenada del comportamiento de sesión nueva.

| Subcomando | Acción |
| --- | --- |
| `status` (predeterminado) | Reportar la bandera v2 actual, el modo multiagente y la concurrencia de hilos. |
| `on` | Habilitar el global `multi_agent_v2` característica; los cambios locales vuelven a sincronizar el catálogo. Rechazado mientras el pin híbrido v2 está activo porque la anulación global lo derrotaría. |
| `off` | Desactivar el `multi_agent_v2` Caracterizar y volver a sincronizar el catálogo. |
| `mode v1` | Forzar a todos los modelos a v1, deshabilitar v2 nativo y preservar el límite de subproceso activo. |
| `mode default` | Respete los pines de superficie del modelo de origen. |
| `mode v2` | Forzar los modelos a v2 y preservar el límite de rosca activa. Con `keep-native-v1` apagado, habilite la v2 nativa global; con ella, deshabilite la anulación global y use pines de catálogo. |
| `keep-native-v1 on\|off` | Bajo `mode v2`, mantenga los modelos nativos ChatGPT en v1 y los modelos enrutados en v2. Habilitarlo desactiva la anulación global de V2 antes de la sincronización del catálogo. |
| `threads <n>` | Establezca el límite de hilo v1/v2 activo en un número entero de al menos 1. |
| `mode-hint <text>` | Establezca la sugerencia de delegación proactiva (modo Ultra) para cada modelo y esfuerzo. |
| `mode-hint --clear` | Elimine la sugerencia para que se reanude la política derivada del esfuerzo (ultra + proactiva). |

```bash
ocx v2 status
ocx v2 mode v1
ocx v2 mode default
ocx v2 on
ocx v2 threads 16
ocx v2 mode-hint "Proactive multi-agent delegation is active."
ocx v2 mode-hint --clear
```

Los `mode` Subcomando escribe `multiAgentMode` a la configuración de opencodex y vuelve a sincronizar el catálogo de Codex. Las transiciones de modo y bandera mueven el límite de subproceso numérico actual entre las teclas válidas v1/v2 Codex; una transición fallida restaura el original `config.toml`. Los cambios se aplican a las nuevas sesiones Codex, mientras Las sesiones de running mantienen su superficie fijada.

Codex resuelve un problema global habilitado `multi_agent_v2` Anular antes del catálogo del modelo seleccionado Pin. El híbrido `keep-native-v1` Por lo tanto, el contrato mantiene esa anulación global fuera; de lo contrario, un fila nativa estampada `v1` aún se iniciaría en V2 y produciría tareas secundarias cifradas en backend.

`mode-hint` escribe `features.multi_agent_v2.multi_agent_mode_hint_text` en Codex
`$CODEX_HOME/config.toml` Incluso cuando `multi_agent_v2` Actualmente está deshabilitado. Los El comando solo persiste la anulación; no habilita ni deshabilita la función, por lo que la pista tiene efecto cuando una superficie Codex coincidente está activa. La pista anula Política multiagente derivada del esfuerzo de codex-rs, por lo que cualquier modelo y cualquier esfuerzo de razonamiento recibe el mensaje de delegación proactiva. Lo hace **no** Cambiar el razonamiento sí mismo. Se rechaza un argumento faltante o un valor de solo espacio en blanco; solo `--clear`
Elimina la pista. El modo Ultra del panel de Subagentes **on** toggle tiene un más estricto puerta: requiere que la función nativa esté habilitada con una superficie v2 explícita (`ocx v2 mode v2`); `ocx v2 on` por sí sola no satisface esa puerta de panel.

<a id="explicit-v2-target-and-outcome"></a>

#### Objetivo y resultado explícitos de la versión 2

```bash
ocx v2 status --json
ocx v2 status --live --json
ocx v2 mode v1 --live --json
ocx v2 status --live --json
```

La escritura en vivo utiliza la ruta de gestión existente. Sólo en directo explícito `mode`
acepta `--acknowledge-surface-advisory`; añádalo solo cuando reconozca que Se solicita asesoramiento. Modo local y estado/encendido/apagado/mantenimiento-nativo/hilos/pista rechazar - Sí. No hay reconocimiento automático.

Para el texto literal reservado, pase un operando citado después de `--`:

```bash
ocx v2 mode-hint --live --json -- '--clear'
```

Esto es literal `--clear`; sin `--`, `mode-hint --clear` Elimina la pista. El sufijo no se escanea en busca de ayuda, en vivo, JSON o controles claros; los controles pertenecen antes `--`. Los operandos adicionales y las banderas duplicadas se niegan antes de la mutación.

Local JSON es `{ok, target:"local", action, changed, state, sync}` utilizando el real estado post-escritura. Modo/mantenimiento-nativo y cambiado encendido/apagado mantienen su intento de sincronización real incluso sin un puerto descubierto; hilos/sugerencias y encendido/apagado sin cambios no agregan sincronización. Un resultado de sincronización ausente/malformado no se verifica con la salida 1, no con éxito.
`changed` o el estado puede ser desconocido después del fallo; no reclame la reversión. Informes de estado en vivo validados estado / asesor / recomendación con `target:"live"`; escribe añadir `ok:true` y `catalogRefresh`. Solo salidas de refresco comprometidas y no degradadas 0. HTTP 502 puede significar un estado nativo parcialmente aplicado: inspeccione antes de volver a intentarlo. Los errores de uso local retienen la salida 1; los nuevos errores de uso en vivo usan la salida 2.

<a id="combo-routing"></a>

## Ruteo combinado

### `ocx combo <list|show|set|remove|stats> ...` · `ocx route combo ...`

Gestione la conmutación por error combinada y los modelos virtuales round-robin. `ocx route combo` es el alias jerárquico; Los combos y los perfiles de enrutamiento son recursos distintos. Uso de objetivos combinados
`provider/model[:weight],provider/model[:weight]`.

```bash
ocx combo list
ocx route combo set reliable --targets ark/model-a:2,openai/gpt-5.5
```

`set` acepta `--strategy`, `--sticky`, `--effort`, `--alias`, `--rename-from`, `--native-alias`, y
`--display-name <label|->` (`-` borra la etiqueta). Un alias nativo captura solo uno actualmente soportado, id modelo OpenAI desnudo no calificado. Desnudo `gpt-5.6-*` Alias nativos Codex Pool/Direct credenciales. Cuenta-calificado OpenAI Las rutas siguen siendo distintas, mientras que las rutas calificadas por el proveedor, como
`openai-apikey/gpt-5.6-*` utilizar su clave API configurada y nunca pasar al alias nativo. Lea el contrato de seguridad y visibilidad en la guía antes de habilitar el par de compatibilidad. Con `--strategy jev` solo, el método de decisión se elige mediante uno de dos indicadores mutuamente excluyentes.
`--decision-provider <provider|->` Nombres a configurados `jev-decision` fila (por ejemplo, un auto-alojado Ollama `tev1`) como un servidor compatible con System One. `--decision-model <route|->` Nombres ordinarios Ruta opencodex (por ejemplo `ollama/qwen3:4b`) que responde a la misma elección que JSON; no puede ser este combo o cualquier combo JEV. Omitir ambos usos TypeSafe. `--decision-timeout <ms|->` establece el plazo de decisión (1000–120000, por defecto 4000); `-` Despeja cualquiera de los tres.

`ocx combo set <id> --decision-quota-signals on|off|-` controles por evidencia consultiva Combo.
`--decision-quota-tiers '{"limited":80}'` establece anulaciones de umbral parciales; `-` los limpia. Ambos son solo JEV. La política omitida sobrevive `--targets-file` sustitución, `--targets` con `--strategy jev`y renombrar (`--targets` solo mantiene el valor predeterminado de conmutación por error existente). Retención de los umbrales; Alejarse de JEV elimina ambas configuración. Esto agrega datos de cuotas a la decisión seleccionada backend, no sondas, nueva selección de cuenta o exclusiones duras. Véase
[cuotas predeterminadas, frescura y privacidad](/es/guides/combos/#advisory-quota-signals-for-jev).

`ocx combo test [--combo <id>] [--decision-provider <provider|jev> | --decision-model <route>]
[--decision-timeout <ms>]` envía una sonda de decisión sintética a través del método de un combo guardado o selección no guardada e informa de la puerta, backend y latencia; puede pasar una llamada de decisión.
`ocx combo discover [--query <text>]` listas configuradas System One filas y modelos de catálogo que parecen como modelos de decisión, con el punto final derivado.

Para metadatos de destino estructurados, inspeccione la ayuda sin conexión y el combo actual:

```bash
ocx combo set --help
ocx combo list --json
ocx combo show reliable --json
```

A `--targets-file` documento es una matriz ordenada no vacía, por ejemplo esta forma con valores de proveedor/modelo reemplazados por candidatos configurados reales:

```json
[{"provider":"example","model":"raw/model","weight":1,"reasoningEfforts":["high"],"modelProfile":"Reasoning tasks","lastResort":false}]
```

Los campos opcionales son `weight`, `reasoningEfforts`, `modelProfile` y `lastResort`. Los esfuerzos son una lista única y no vacía de `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; vacío/ninguno/mínimo modelo personalizado semántica no se aplican. Archivos o canalizaciones explícitas
`-` tener un límite de 4 MiB y una fecha límite de lectura de 30 segundos; el organismo de gestión serializado También debe caber 4 MiB. Los campos desconocidos se niegan antes de la escritura.

```bash
ocx combo set reliable --targets-file targets.json --image-input auto --reasoning-effort-mode strict --json
ocx combo show reliable --json
```

`--targets-file` y `--targets` son mutuamente excluyentes. Omitir ambas conservas Metadatos de destino completos para ediciones parciales; los archivos de reemplazo conservan el orden y explícito `lastResort: false`. `--image-input auto|disabled` y
`--reasoning-effort-mode strict|adaptive` preservar la omisión, mientras que explícito `auto`
y `strict` Anular los valores deshabilitados/adaptativos guardados. El modo de esfuerzo de razonamiento es Separados de `--effort-mode fallback|force`, que rige el esfuerzo por defecto.
`--allow-metered-targets on|off` otorga o borra el consentimiento del operador para los objetivos combinados marcados en un proxy de solo loopback; las personas que llaman públicas y vinculadas aún necesitan consentimiento de clave configurada.
`--native-alias on|off` preserva explícito falso; la bandera desnuda legado significa verdadero. Desactivarlo puede requerir el alias deseado. `--native-alias off --alias -`, para evitar la retención de un alias nativo incompatible. Establecer/renombrar es un upsert sin CAS, así que relee después de los cambios. El recibo es `{success, id, model, combo, catalogRefresh}`; omitido, fallido o degradado devuelve actualización de catálogo no cero después de guardar.

<a id="observe-combo-decision-statistics"></a>

### Observar las estadísticas de decisiones combinadas

```bash
ocx combo stats reliable --range 30d --json
```

Utilice el ID combinado almacenado exacto de list/show, no su modelo público o alias. Los rangos son `7d`, `30d` (predeterminado), y `all`. Esto lee las observaciones registradas de JEV sin ejecutar una investigación de decisión pagada. Inspeccionar las decisiones, los intentos modelo, intentos medidos, modelo tokens y decisión tokens por separado. Mantenga la
`measuredModelAttempts/modelAttempts` y `decisionUsageReported/decisions`
ratios de cobertura con los totales. Los promedios nulos no están disponibles, no son cero. Conservar `usageIncomplete`, `historyTruncated`, `entriesTruncated`, caída de entrada Cuentas y límites de ventana instantánea. Cero observaciones no prueban el éxito. No hay costos monetarios ni ahorros comparativos en este informe.

Véase [Combos](/es/guides/combos/) para el comportamiento de enrutamiento y la guía de configuración.

<a id="routing-profiles"></a>

## Perfiles de enrutamiento

Los perfiles existentes apoyan la inspección y evaluación a través del API en vivo:

```bash
ocx route policy list --json
ocx route policy show reliable --json
ocx route policy dry-run reliable --model-context 128000 --tools --image --structured-output --json
```

Solo ejecute esta evaluación con autoridad para activar Lab en el destino. La administración POST puede activar Lab e iniciar la automatización que ya está habilitada allí, incluidas las sondas ascendentes. Use list/show para la observación sin ese efecto de activación.

Sustituir `reliable` con una ID enumerada. `evaluate` Es un alias para `dry-run`; ambos enviar los requisitos al evaluador del perfil guardado sin una solicitud de inferencia. La creación, actualización y eliminación utilizan el flujo de trabajo explícito de archivo/revisión a continuación. Combo escribe editar un recurso separado. Perfiles faltantes regresan salida 4 y falta Los operandos regresan 2.

<a id="edit-a-routing-profile-with-its-observed-revision"></a>

### Editar un perfil de enrutamiento con su revisión observada

Crear/actualizar puede activar la automatización de Lab y ya habilitada, incluida la ascendente Sondas. Sólo guárdalos con esa autoridad. La lista/el espectáculo son observacionales; primero lee la ayuda offline y guarda el perfil deseado:

```bash
ocx route policy update --help
ocx route policy show reliable --json > profile.observed.json
jq 'del(.id, .model, .revision) | if .alias == null then del(.alias) else . end' profile.observed.json > profile.next.json
```

Editar y revisar el siguiente archivo; mantener el archivo observado sin cambios. La entrada contiene Sólo editable `alias`, `candidates`, `require`, `optimize`, `limits`,
`unknownEvidence`, y `compatibility` con campos anidados soportados. `id`, `model`,
`revision`, claves desconocidas y alias nulo no son entradas editables. El servidor todavía valida la semántica de proveedor, alias y políticas. `--file -` acepta piped stdin; Los archivos/stdin UTF-8 normales tienen el contrato de lectura de 4 MiB y 30 segundos.

```bash
ocx route policy update reliable --file profile.next.json --expected-revision '<exact-revision-from-observed-show>' --json
ocx route policy show reliable --json
```

Utilice la revisión opaca original explícitamente. HTTP 409 / salida 5 significa lectura show de nuevo, revise los cambios concurrentes y reconstruya la edición. Nunca en silencio fetch a reemplazo revisión, reintento o convertir actualización en crear. Para un nuevo autorizado Uso de ID `ocx route policy create <new-id> --file profile.next.json --json` Sin un revisión. La eliminación autorizada es `ocx route policy remove <id> --yes --json` y No tiene guardia de revisión.

Crear/actualizar devoluciones `{success, id, model, profile, catalogRefresh}` con el nuevo
`profile.revision`; eliminar devoluciones `{success, id, catalogRefresh}`. Sólo comprometidos, La actualización no degradada sale por 0. Un recibo guardado con actualización omitida/fallida/degradada exits 1: inspeccionar antes de la recuperación en lugar de repetir la escritura de configuración.

<a id="compatibility-lab"></a>

## Laboratorio de compatibilidad

Lab es inspección local **y** Evidencia explícita/gestión de la automatización. Lee utilice la proyección local y no requiera una administración en ejecución API:

```bash
ocx lab status --json
ocx lab catalog --json
ocx lab subjects --limit 10 --json
ocx lab automation status --json
ocx lab automation runs --limit 10 --json
ocx lab public community --json
```

`subject`, `observations`, `event`, `artifact`, y `production-signals` seguir linaje de evidencia local. La familia pública ofrece una vista previa / exportación por repetidos
`--event <id>`, verificación/importación a través de `--file <bundle.json>`, y comunidad contexto. Exportar e importar escribe evidencia local. La verificación puede imprimir su resultado y aún salir de no cero cuando el paquete no es criptográficamente válido.

Habilitar/deshabilitar la automatización cambia la política local; manual `lab run` selecciona una capa y puede gastar cuota de origen. Leer `ocx help lab` y el correspondiente antes de estas operaciones autorizadas. Una política local guardada no prueba que el programador de un proxy que ejecuta por separado lo adoptó. Política de automatización completa La edición y la cancelación de ejecución no están expuestas por estos controles CLI.

<a id="observability-and-debug"></a>

## Observabilidad y depuración

### `ocx observe <logs|usage|storage|memory|debug|claude-inbound|injection> ...`

Inspeccione las solicitudes de proxy, el uso, el almacenamiento, la memoria y los datos de depuración. Los alias directos son:

| Alias | Recursos equivalentes |
| --- | --- |
| `ocx logs [filters] [--follow] [--json|--jsonl|--events]` | `ocx observe logs` |
| `ocx usage [--range <today|1d|7d|30d|all>] [--since <timestamp> --until <timestamp>] [--surface <all|codex|claude|grok>] [--provider <name>] [--model <id>] [--api-key-id <id>] [--search <text>] [--top <1-1000>] [--json]` | `ocx observe usage` |
| `ocx usage compare [--range <today|1d|7d|30d>] [--json]` | `ocx observe usage compare` |
| `ocx storage [--json]` | `ocx observe storage` |
| `ocx memory [--json]` | `ocx observe memory` |

```bash
ocx observe usage --range 30d --json
ocx usage --since 2026-09-01T09:00:00Z --until 2026-09-01T10:59:59.999Z --json
```

`--since` y `--until` deben suministrarse conjuntamente. Aceptan milisegundos de época enteros o ISO completa datetimes con una zona horaria explícita, incluye ambos extremos y anula `--range`. Los límites no válidos o invertidos fallan antes de la solicitud. La salida humana imprime el intervalo solicitado;
`--json` incluye `customWindow`, `since`, y `until`. Filtros existentes de superficie/proveedor/modelo Todavía se aplica. Estos comandos consultan el proxy en ejecución; no proporcionan informes sin conexión.

`--range today` (alias `1d`) informa el día local actual. `--provider` y
`--model` reducir el informe a un objetivo ascendente — distinto de
`--surface`, que selecciona el cliente llamante (Codex, Claude Code, Grok) en lugar de que el proveedor atienda la solicitud.

La vista predeterminada imprime la solicitud, token y los totales de costos estimados más por proveedor y por modelo. Los costos son API list-price equivalents, no un recibo de facturación: los planes de suscripción y los créditos del proveedor se facturan por separado, y las solicitudes sin fila de precios coincidentes se cuentan como
`unpriced`/`unmetered` en lugar de ser doblado como cero.

```bash
ocx usage --range today --provider xai
```

Cuando no se pueden incluir algunos registros de uso, la salida humana advierte, incluso cuando hay cero filas legibles. Los totales mostrados reflejan solamente registros legibles. Si un filtro no tiene coincidencias legibles, la salida muestra la advertencia y la guía en lugar de las líneas totales; los registros omitidos pueden contener coincidencias.
`--json` preserva el nivel de respuesta `usageIncomplete` diagnóstico y la razón.

<a id="compare-a-range-with-the-previous-equal-window"></a>

### Comparar un rango con la ventana igual anterior

```bash
ocx usage compare --range today --json
ocx usage compare --range 7d --provider xai
```

`ocx observe usage compare` es la forma familiar equivalente. El comando lee `GET /api/usage`
dos veces: el rango nombrado termina ahora, luego el mismo rango evaluó una ventana igual antes (Un día local para `today`/`1d`Siete por `7d`Treinta por `30d`) El rango predeterminado es `30d`.
`--range all` Se rechaza porque el historial abierto no tiene una ventana igual anterior. `--since` y
`--until` No se aceptan; las ventanas se derivan. Superficie, proveedor, modelo y API-clave Los filtros se aplican a ambas lecturas. Salida humana imprime delta actual, anterior, firmado y por ciento cambio. `--json` es `{schemaVersion,range,current,previous,delta,change,incomplete}`. Los dos Las lecturas son secuenciales, no una instantánea atómica. Personalizado `since`/`until` En cada respuesta debe Coincide con la ventana solicitada. Ambas lecturas usan la misma conexión y credencial. Si el conexión, cuenta o cambios de credenciales durante el comando, informa a un propietario no coinciden y le pide que vuelva a intentar en lugar de imprimir una comparación.

<a id="page-indexed-request-history"></a>

### Historial de solicitudes indexadas de página

```bash
ocx logs history --provider xai --status 200 --limit 50 --json
ocx logs history --cursor '<nextCursor>' --json
ocx logs get <request-id> --json
```

`ocx observe logs history` y `ocx observe logs get` es la familia equivalente formas. Estos leen el índice de historial de solicitudes derivado, no el índice reciente. `ocx logs`
anillo. `--limit` es 1–100 (por defecto 50). `--from` y `--to` aceptar época milisegundos o fechas ISO completas con una zona horaria y son inclusivas. `--json`
devoluciones `{entries,hasMore,nextCursor,index}`. `--jsonl` solo emite filas; cuando Más páginas existen, `nextCursor=…` se imprime en stderr para que una persona que llama pueda reanudar sin mezclar el token en el flujo de filas. Los partidos vacíos tienen éxito. `get`
devuelve una fila canónica por ID de solicitud; `ocx logs explain` Sigue siendo el vista ruta-decisión para ese mismo ID.

<a id="filter-a-bounded-log-snapshot"></a>

### Filtrar una instantánea de registro limitado

```bash
ocx logs filter --surface claude --status errors --time-window 1h --scan-limit 2000 --limit 50 --json
```

`ocx observe logs filter` es la forma familiar equivalente. Esto dice una reciente ventana, filtra localmente, luego mantiene las coincidencias más recientes en su orden original.
`--scan-limit` controles obtenidos filas (1–2000, por defecto 2000); `--limit` controles filas devueltas (1–2000, por defecto 200). Informes de JSON
`{schemaVersion:1,logs,cursor,filters,window:{scanLimit,loaded,matched,returned,limit}}`Los recuentos describen esta ventana observada, no toda la historia. JSONL solo emite filas; las coincidencias vacías tienen éxito. Cursor metadata no es una búsqueda resumible token.

Los selectores incluyen `--surface all|codex|claude|grok`, `--status all|success|errors`,
`--time-window all|15m|1h|24h`, `--model`, `--provider`, `--conversation`
(alias `--conversationId`), `--intercepted-only`, `--min-tok-per-sec`,
`--max-tok-per-sec`, y `--protocol-mode all|native|translated|legacy-bridge|blocked|none`. La igualdad del modelo/proveedor se recorta y no distingue entre mayúsculas y minúsculas, incluyendo Modelos resueltos/servidos e intentos. Claude incluye escritorio; Codex significa ausente superficie. El éxito es HTTP 200–299, errores 400–599. Los límites inferiores de tiempo son inclusivos. La velocidad utiliza tok/s de valor observado, con un mínimo inclusivo y exclusivo máximo; los valores no disponibles fallan los filtros de velocidad activos. El protocolo no incluye rastros ausentes o inválidos. La coincidencia de conversaciones utiliza los mismos ID de hash que Registros ordinarios. La interceptación selecciona marcadores de reescritura con valor de cadena.

Banderas desconocidas/repetidas/conflictivas, límites inválidos y eventos siguientes/fallos antes descubrimiento. Las lecturas malformadas, de gran tamaño o fallidas no son cero, no son resultados vacíos. Para reducir el tamaño de la respuesta, reduzca el límite de exploración; la reducción del límite de salida no cambiar el fetch. Para la transmisión, use los formularios de seguimiento separados a continuación.

<a id="search-usage-model-rows"></a>

### Buscar filas de modelo de uso

```bash
ocx usage --range 7d --search 'model-a' --json
```

`--search` coincide con una subcadena recortada que no distingue entre mayúsculas y minúsculas en el modelo, proveedor o Resolver el modelo después de leer el informe. Ordena las filas del modelo descendiendo el total tokens con lazos estables y mantiene hasta 100 por defecto. JSON añade
`modelView:{query,matchedModelCount,returnedModelCount,limit:100,truncated}`; La salida humana etiqueta la vista y muestra las filas del modelo seleccionado. Totales de los informes, Las filas proveedor/día/cuenta, filtros exactos y metadatos incompletos/ventana permanecen sin cambios. Ninguna coincidencia de modelo no significa que no se utilice el informe.

Una consulta en blanco explícita (`--search=`) selecciona la vista top-100; omitiendo la búsqueda Conserva la salida existente. Exacto `--provider`/`--model` Alcance de la informe subyacente. La búsqueda no amplía la clave seleccionada o el cliente conectado auto alcance y nunca se envía como un nuevo parámetro de consulta Hub API.

`ocx usage --top 25` (También `ocx observe usage --top 25`) establece el límite de la tabla del modelo humano a un número entero de 1 a 1000. El valor predeterminado es 10, o 100 con `--search`; el límite se aplica después del filtrado de búsqueda. Solo cambia la visualización local: los totales de los informes, las filas del proveedor/cuenta y los parámetros API permanecen sin cambios. Con `--json`, un válido `--top` es ignorado; JSON conserva su informe completo existente o vista de búsqueda de 100 filas. Límites no válidos devuelven la salida 2 antes de buscar.

<a id="saved-companion-usage-totals"></a>

### Totales de uso de compañeros guardados

```bash
ocx companion show --json
ocx companion usage --json
```

El segundo comando lee la configuración del compañero guardada, luego hoy y el uso 30d secuencialmente en el mismo entorno de ejecución de la gestión. Aplica el guardado `models` y
`hiddenProviders` preferencias y preserva los costos desconocidos / no medidos y tokens. La selección de modelo nulo significa todo; una selección vacía significa nada. No es así. cambiar la configuración, operar ventanas nativas o retransmitir a través de un cliente conectado.

JSON devuelve `schemaVersion:1`, `filters`, `settingsUpdatedAt`,
`settingsCorrupt`, `settingsFallback`, `ranges` y `partial`. Cada rango tiene
`status:"available"` con filtrado `data`, o `status:"unavailable"`. Un rango no disponible establece el parcial y la salida 1 mientras que retiene el otro rango. Los datos incompletos disponibles conservan sus propios metadatos; no se mide en cero. Los valores predeterminados válidos del servidor retienen una marca de tiempo de configuración nula y establecen la reserva; Los valores predeterminados de archivos corruptos también establecen corruptos y advierten en la salida humana. Los configuración incorrectos se detienen antes de que se lea el uso. Estas lecturas no son atómicas instantánea. Cada GET tiene una fecha límite de 10 segundos fetch / cuerpo después del descubrimiento y un Límite de respuesta de 32 MiB; esta no es una fecha límite de comando completo. Salida de señales 130/143 sin resultados tardíos.

<a id="follow-request-windows-or-injection-sequences"></a>

### Siga las ventanas de solicitud o secuencias de inyección

```bash
ocx logs --help
ocx logs --limit 200 --json
ocx logs --follow --events --limit 200
```

`--events` requiere seguir e implica JSONL; redundante `--jsonl` es aceptada.
`--json` sigue siendo one-shot y entra en conflicto con el seguimiento / eventos. Cada línea events-v1 es `{schemaVersion:1,type:"snapshot"|"append",rows,cursor,limit}`. Reemplazar el ventana del consumidor en la instantánea, agregar / recortar en anexar, preservar el orden y repetir IDs. Se emiten instantáneas iniciales vacías y de reinicio/eliminación; sondeos vacíos estables Quédate callado. Las matrices heredadas son instantáneas con cursor nulo, no con cursores inventados. Estas son ventanas observadas, no una repetición sin pérdidas del tráfico perdido entre las encuestas. o después del desalojo del anillo.

`ocx logs --follow --jsonl --limit 200` conserva la salida en forma de fila. Se re-emite cambiado ocurrencias, incluido el estado del mismo ID/modificaciones token e ID repetidos. No lo hagas colapsar todo por ID de solicitud. Esta salida heredada no puede codificar eliminaciones, restablece o orden exacto de la ventana; elija eventos cuando esas distinciones importan. El límite de seguimiento del registro es 1–2000, por defecto 200.

```bash
ocx observe injection --limit 500 --json
ocx observe injection --follow --jsonl --limit 500
```

La inyección emite ordenado `{seq,at,line}` filas, donde `at` es milisegundos de época; interno `after` Avances con Seq. El límite de seguimiento es 1–2000, por defecto 500. JSON es one-shot y JSONL requiere seguimiento. La observación no permite la captura. Vacío Las encuestas no identifican la captura de discapacitados o prueban la ausencia de brechas. Tiempo de ejecución detectable se detiene la deriva; reinicio indetectable / última-N brechas no pueden ser excluidos sin un API Marcador de época/brecha.

Ambos bucles de seguimiento utilizan esperas de un segundo en serie, plazos de 10 segundos fetch / cuerpo y Límites de respuesta de 32 MiB. Errores mal formados/sobredimensionados/de transporte se detienen con stderr salida 1, sin reintento/reconexión automática. Reducir el límite para ventanas de gran tamaño. SIGINT/Ctrl-C sale 130, SIGTERM 143, sin sondeos/salidas posteriores. Inspeccione el estado de salida y retuvo filas en lugar de tratar la cancelación como un historial completo.

<a id="companion-timeline-and-key-scoped-usage"></a>

### Línea de tiempo complementaria y uso de key-scoped

```bash
ocx companion timeline --help
ocx companion timeline --hours 24 --bucket-minutes 60 --metric total --aggregation sum --grouping model --model example/model-a --hide-provider excluded-provider --json
```

Reemplace los ID ficticios con los filtros seleccionados. Repetir `--model` por individual ID de proveedor/modelo (se permiten barras anidadas; no CSV); repetir `--hide-provider` a Excluir proveedores. Positivo `--provider` No es compatible. Horario: 6/24/72/168, 1–1440 con un máximo de 2000 cucharones, métrico total/entrada/salida/caché, suma de agregación/promedio/máx, modelo de agrupación/modelAccount. El filtro de límites API entradas a 100 ítems. Esto lee el uso sin cambiar la configuración del compañero.

Comprobar `appliedFilters.models/hiddenProviders`. Los límites de la línea de tiempo son segundos de época, con final exclusivo, a diferencia de la ventana personalizada de milisegundos de uso ordinario. El fin debe coincide con el depósito de tiempo de solicitud, o su sucesor inmediato si la solicitud se cruza un límite de cubo; se rechaza una ventana alineada más antigua. Vacío La serie retiene metadatos de cubo/filtro. `missingMeasurements` y `truncated` debe permanecen visibles: los puntos llenos de cero no prueban un uso cero completo.

En un host de gestión no cliente:

```bash
ocx access key list --json
ocx usage --api-key-id key-example --range 7d --json
```

Utilice un identificador de clave real no secreto. El CLI requiere un acuse de recibo de respuesta exacto en
`filter.apiKeyId`; los filtros ignorados fallan en lugar de mostrar totales no explorados. Una identificación desconocida puede regresar `matched:false` y tráfico vacío, no 404. Mantenga los datos incompletos/de ventana personalizada. Los clientes conectados rechazan `--api-key-id`
antes del acceso o transporte con clave inscrita; omitalo para el uso de Hub auto-solamente existente o realice la vista de clave seleccionada en el concentrador. Ninguna autoridad de gestión de concesiones de claves de datos.

### `ocx debug <provider|usage|injection|claude> <on|off|status|reset|logs [-f]>`

Lea o cambie las anulaciones de depuración en entorno de ejecución a través de la administración del proxy en ejecución API.

```bash
ocx debug provider on|off|status|reset
ocx debug provider logs [-f|--follow]
ocx debug usage on|off|status|reset
ocx debug usage logs [-f|--follow]
```

Sin ningún alcance, `ocx debug` imprime el uso y, cuando se detiene el proxy, el entorno de siguiente inicio valores predeterminados. Depuración de proveedores predeterminados desde `OCX_DEBUG=1` (legado) `OCX_DEBUG_FRAMES=1` también funciona); uso debug defaults desde `OPENCODEX_USAGE_DEBUG=1`.

<a id="api-access"></a>

## Acceso API

### `ocx access <key|endpoints|models|test|audio> ...`

Inspeccione las claves de admisión, los puntos finales externos y los modelos con la familia de acceso.
`ocx api-key` Alias de la familia de claves de acceso. Creación y rotación-inicio devuelven un Credencial de texto sin formato única en texto y salida JSON. Los agentes deben dejar los pasos a un terminal operado por humanos fuera de la sesión del agente; ID de confirmación y clave/rotación no secreta, nunca la credencial.

```bash
ocx access key list --json
```

Después de que el humano configure y verifique el reemplazo, compromete su rotación o la eliminación de la clave antigua requiere una autoridad de revocación explícita por separado. Seguro Los seguimientos no secretos son `ocx access key rotate commit <id> <rotation-id> --json`
y `ocx access key rotate abort <id> <rotation-id> --json`, con autoridad para la acción elegida. Volver a la lista después. Faltar estado pendiente por sí solo no prueba commit: la expiración o el aborto también pueden borrarlo. No enrutar el consentimiento mediante la emisión la solicitud de gestión de devolución de secretos directamente.

<a id="rename-one-key-without-changing-its-access-policy"></a>

### Cambiar el nombre de una clave sin cambiar su política de acceso

```bash
ocx access key rename key-example 'Research client' --json
ocx access key list --json
```

Utilice un ID único real o un nombre inequívoco. Renombrar solo envía `{id,name}` y preserva los alcances de proveedor/modelo; no rota/elimina una clave. La respuesta contiene id/name/createdAt y opcional allowedProviders/allowedModels, nunca texto plano o un prefijo. La lista sigue enmascarada. Los nombres son libres de control, recortado, no vacías y como máximo 64 unidades de cadena JavaScript. La secuencia de lectura/cambio de nombre no es CAS; inspeccione la lista enmascarada después de un resultado desconocido antes de volver a intentarlo. Los raíz `api-key rename` Alias utiliza el mismo comando.

<a id="explicit-key-model-and-audio-checks"></a>

### Modelo de clave explícita y comprobaciones de audio

Descubre la sintaxis instalada sin contactar con upstream:

```bash
ocx access test --help
ocx access audio transcribe --help
ocx access audio live-check --help
```

Las solicitudes de modelos, las cargas de audio y las verificaciones en vivo requieren un operador explícito autorización para esa operación previa particular y posible cuota/coste. El operador suministra la clave seleccionada de una fuente privada aprobada en un terminal operado por humanos fuera de la sesión de agente. Los agentes no deben capturarlo o pedirlo en el chat. Nunca lo ponga en argv / medio ambiente. Estos son los lados ocx de esa tubería privada, no indicaciones directas de teclas interactivas o un lote administrado por el agente:

```bash
ocx access test example/model --protocol responses --api-key-stdin --json
ocx access audio transcribe sample.wav --model gpt-4o-mini-transcribe --api-key-stdin --json
ocx access audio live-check --model gpt-live-1-codex --api-key-stdin --json
```

Elija solo la tarea autorizada y el modelo/archivo real. Se rechaza la entrada TTY. Entrada está limitado a 4096 bytes/30 segundos, UTF-8 válido imprimible ASCII, sin exterior espacios en blanco, controles o líneas adicionales; se permite un LF/CRLF final. Esto deliberadamente cubre las claves emitidas actualmente, no todos los valores Unicode de la configuración del servidor puede aceptar. Las ocurrencias exactas de la clave suministrada en el texto permitido se convierten en `[redacted]`; No se garantizan las codificaciones arbitrarias detectadas. No se imprime ningún portador de claves codificado.

Los objetivos son el origen de servicio local verificado o el Hub inscrito normalizado existente. origen, con la identidad comprobada alrededor del trabajo asíncrono. No hay un origen personalizado, admin o reserva de clave inscrita, seguimiento de redireccionamiento, caché de credenciales o automático Reintento. El operador solo informa al agente sobre el resultado no secreto.

<a id="model-control-and-response-limits"></a>

#### Control del modelo y límites de respuesta

Los protocolos son chat (predeterminado), respuestas o mensajes. Modo de clave seleccionada primero envía un control malformado JSON sin credenciales a ese punto final. Sólo el nativo 401 requerido por la clave avanza a una solicitud de modelo 16-token fija utilizando el modelo suministrado clave. El control tiene un presupuesto de respuesta de 5 segundos/4096 bytes; la solicitud tiene un Presupuesto de respuesta de 60 segundos/2 MiB, incluidas las lecturas del cuerpo. Authless/no reconocido Los controles se detienen antes de la inferencia. La contabilidad local de registro/admisión puede seguir ocurriendo.

JSON es `{schemaVersion:1,control:{outcome,status?},request:{outcome,status?},response?}`. La respuesta segura contiene el protocolo, el texto ordenado, la finalización completa / limitada y recuentos de token medidas opcionales. Una respuesta útil de longitud limitada es `limited`; rechazo/contenido-filtro/herramienta-sólo o respuestas mal formadas no son compatibles, incluso con HTTP 2xx. Los metadatos de error, ID, herramientas y razonamiento no se imprimen. El fallo operativo retiene un informe versionado más el stderr/exit 1 fijo; entrada inválida de gramática/clave sale 2 sin un informe fabricado.

El éxito solo dice: “La solicitud sin credenciales fue rechazada; la solicitud modelo usando La clave suministrada ha tenido éxito. Los cambios de oyente/política entre llamadas siguen siendo posibles; Esto no certifica el alcance clave, la admisión atómica o la identidad de facturación. Sin
`--api-key-stdin`JSON sigue siendo su carga útil original y no dice nada sobre una clave recién seleccionada.

<a id="transcription-and-live-readiness"></a>

#### Transcripción y preparación en vivo

La transcripción requiere un archivo regular no vacío de un máximo de 25.000.000 bytes con un Límite de lectura local de 30 segundos, y un cuerpo multiparte limitado a 32 MiB. Los modelos son gpt-4o-transscribe, gpt-4o-mini-transscribe o susurro-1, sujeto a soporte objetivo. Compartir carga/respuesta 130 segundos; la respuesta se limita a 2 MiB. Retornos de éxito solo `{text}`, incluyendo texto vacío, con redacción exacta. El fracaso deja stdout vacío e imprime stderr/nonzero fijo; sin sobre de error JSON o cuerpo sin procesar.

El audio utiliza la admisión de clave explícita sin el control del modelo. Live-check envía Solo session.update y session.close fijos. La preparación requiere session.started o session.updated con ID de sesión nativa no en blanco en 15 segundos; socket abierto o session.created solo es insuficiente. Después de la disposición espera como máximo 2 segundos para el cierre normal del código-1000. Cada cuadro UTF-8 tiene un límite de 64 KiB, agregado 2 MiB; no hay un historial de fotogramas retenidos.

Vivo JSON es `{schemaVersion:1,ready,close:"confirmed"|"unverified",check:"session-readiness",event?}`. El fallo operacional preserva esa observación sin marcos en bruto. Preparación parcial con salidas cerradas no verificadas 1; un cierre normal posterior no puede borrar un error anterior. Salida de señales 130/143. Esto comprueba la preparación / cierre solamente, no el micrófono, carga, ejecución de herramientas, liberación completa de ida y vuelta por voz o arrendamiento de servidores. Abriendo el upstream La sesión no está garantizada de forma gratuita. Ninguna reconexión o reintento es automático.

### `ocx api <protocols|explain|policy> ...`

Inspeccione y establezca cómo viajan las solicitudes entre las API del cliente y los cables del proveedor. Véase
[Rutas de protocolo](/es/guides/protocol-paths/) para el vocabulario.

| Comando | Ruta | Cambia el estado |
| --- | --- | --- |
| `ocx api protocols [--provider <name>] [--json]` | `GET /api/protocols` | No |
| `ocx api explain --model <id> --inbound <responses\|chat\|messages> [--feature <key>]... [--json]` | `POST /api/protocols/plan` | No |
| `ocx api policy [--json]` | `GET /api/protocols` | No |
| `ocx api policy [--messages <on\|off>] [--unrepresentable <legacy\|reject>] [--rollout <switch>=<on\|off>]... [--json]` | `PATCH /api/protocols/settings` | Sí |

- `protocols` imprime la versión del contrato, si cada cliente API es servido y por qué, el política no representable, cada interruptor de implementación y la revisión de la política. `--provider` añade el corriente arriba que el proveedor recibe, quién lo decidió y los modelos en otro cable.
- `explain` previsualiza la ruta que tomaría un modelo de un cliente API. `--feature` Es repetible y acepta una lista separada por comas; `ocx api protocols --json` enumera las claves de características conocidas. Los vista previa se calcula a partir de la configuración: nada se envía de origen, no hay avances de rotación combinada, y La entrada no se registra.
- `policy` sin una bandera de ajuste solo lee. Con uno envía un solo cambio a la carrera proxy, que lo valida, guarda la configuración y responde con la nueva política.
  `--messages off` también desactiva la integración Claude, como lo hace el conmutador del panel de control. Interruptor nombres y combinaciones son validados por el proxy; por ejemplo
  `--rollout managedMessagesNativeOAuth=on` Es rechazado a menos que `managedMessagesNative` es En el mismo comando se activa o se activa.

```bash
ocx api explain --model combo/main --inbound chat --feature request.seed,request.tools
ocx api policy --rollout shadowPlan=on
```

Los errores de uso salen 2 antes de que se envíe cualquier solicitud. `--json` imprime el cuerpo de gestión API tal cual.

<a id="client-integrations"></a>

## Integraciones de clientes

<a id="basic-integration-commands"></a>

### Comandos básicos de integración

| Comando | Acción |
| --- | --- |
| `ocx integration client status [--client <id>] [--profile <id>] [--json]` | Lea todas las integraciones de archivos administrados, un cliente o perfiles Aside. `show` y `list` alias `status`. |
| `ocx integration client history [--client <id>] [--profile <id>] [--json]` | Lea las operaciones de reversión y la disponibilidad de instantáneas. `journal` alias `history`. |
| `ocx integration client enable --client <id> [--profile <id>] [--overwrite-conflict] [--json]` | Aplicar la integración de archivos administrados. Sobrescribir un bloque en conflicto requiere la bandera explícita. |
| `ocx integration client disable --client <id> [--profile <id>] [--json]` | Elimine la integración administrada seleccionada a través de su propietario en entorno de ejecución. |
| `ocx integration client restore --op <opId> [--client aside --profile <id>] [--confirm-drift] [--json]` | Restaurar una operación registrada; reemplazar ediciones posteriores requiere confirmación explícita de deriva. |
| `ocx integration native [list] [--json]` | Leer estado de integración nativa. |
| `ocx integration native <claude\|claude-desktop\|codex\|grok> <on\|off> [--json]` | Escriba la configuración del cliente nativo seleccionado a través de su propietario en entorno de ejecución. |

Estos comandos requieren un proxy en ejecución. `--profile` selecciona un ID de cuenta Aside no negativo y requiere `--client aside`; los perfiles omitidos seleccionan el agregado para lecturas y todos los perfiles para Activar/desactivar desvinculado. Conmutaciones nativas cambian la configuración del cliente; Cursor tiene solo lectura separada Comandos de inspección a continuación. Para obtener una vista previa y opciones de escritura limitada, continúe con las recetas a continuación.

<a id="preview-and-recover-managed-file-integrations"></a>

### Vista previa y recuperación de integraciones de archivos administrados

```bash
ocx integration client preview --client hermes --operation apply --json
ocx integration client restore --op op-example --preview --json
```

`op-example` es ficticio; use una identificación de la historia. Se aplican las operaciones de vista previa, sobrescribir y deshabilitar; restaurar usos `--preview` sobre su mando existente. Revisión Cambios estructurales y `canApply`/`willChange`; rechazo válido / no-op sale 0 sin Aplicación. Habilitar/deshabilitar/restaurar aceptar opcional `--plan-fingerprint` por un Compromiso explícito. Las escrituras heredadas de Direct permanecen disponibles. Aside vista previa o bound escribe requiere `--client aside --profile N`. Confirmar y sobrescribir nunca son automáticas; viejas salidas de enlace 5 con stdout vacío y una re-preview instrucciones en stderr. Siga el [recetas completas de vista previa/compromiso y deriva](/es/guides/integrations/#preview-and-bind-a-terminal-write).

Droid aplicar/sobreescribir los soportes repetidos `--reasoning-default MODEL=EFFORT` por reemplazo de mapa completo, o exclusivo `--clear-reasoning-defaults` por `{}`. Omisión Conserva el mapa. Repita el mapa exacto en vista previa y confirmación; ver
[Valores predeterminados de Droid](/es/guides/integrations/#factory-droid).

La eliminación del historial es irreversible y requiere un opId más exacto. `--yes`:
`ocx integration client history remove --op op-example --yes --json` Abordar el Diario global. Solo `--client aside` y opcional `--profile N` proporcionar más estrecho eliminar ámbitos. La última fila está protegida. `snapshotRemoved:false` Salidas 1 después jubilación con la limpieza incompleta; no vuelva a intentar la eliminación o la revocación de la reclamación.

`ocx integration client sync --client aside --json` actualiza los perfiles elegibles a través del propietario certificado, sin selector de perfil o reserva local. Vacío
`results` es la observación exitosa de perfiles no elegibles; una fila fallida hace el agregado distinto de cero mientras se preservan otros éxitos. Leer estado y recuperación hechos antes de volver a intentarlo; [Controles Aside](/es/guides/integrations/#aside-profile-controls)
Explicar la intención del perfil versus el estado del archivo.

<a id="inspect-cursor-without-installing-it"></a>

### Inspeccione Cursor sin instalarlo

```bash
ocx integration native cursor status --json
ocx integration native cursor local-installer --json
```

El estado puede reunir el inventario del modelo; la búsqueda del instalador puede fetch un manifiesto público. No se descargan/instalan ni alternan Cursor. El estado distingue la credencial del modo de puerta de enlace de marcador de posición; el marcador de posición no es una credencial de acceso. `{available:false,url:null,version:null,reason:null}` es válido, incluyendo Cuando la inferencia privada ya está instalada. Una lectura no disponible válida sale de 0.

### `ocx integration <claude|grok> ...`

Administre las integraciones compatibles de Claude y Grok. Las familias de mando directo a continuación exponen su controles específicos del cliente.

### `ocx claude [claude args...]`

Asegúrese de que el proxy se está ejecutando, luego inicie Claude Code con `ANTHROPIC_BASE_URL`,
`ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`, y las ranuras del modelo de
`config.claudeCode`. Los modelos enrutados aparecen en el nativo `/model` selector a través de alias de ranura estable con Claude Code 2.1.129 o más reciente. En versiones anteriores, seleccione `ANTHROPIC_MODEL` o `/model <id>`. Usuario-exportado `ANTHROPIC_*` Las variables siempre tienen prioridad.

Claude Los comandos de perfil de escritorio son:

```text
ocx claude desktop [apply]                         Save and apply the four-family profile
ocx claude desktop show [--json]                   Show routes, families, and defaults
ocx claude desktop status [--json]                 Show applied state, drift, and health
ocx claude desktop move <route> <family> [--default]
ocx claude desktop default <family> <route|none>
ocx claude desktop export <path|->                 Export versioned JSON (`-` = stdout)
ocx claude desktop import <path> [--apply]         Validate and import JSON
```

Las familias son `opus`, `fable`, `sonnet`, y `haiku`; nuevas rutas comienzan en `opus`. `none` es válido Sólo cuando la familia está vacía. Legado aplicar banderas `--static`, `--hybrid`, y `--discovery-only`
seguir siendo apoyados. Uso `ocx claude config <status|set> ...` para la configuración de Claude Code.

<a id="read-or-save-the-selected-runtimes-desktop-profile"></a>

#### Leer o guardar el perfil de escritorio del entorno de ejecución seleccionado

Los comandos show/import existentes son locales. Los `profile` Objetivos familiares el entorno de ejecución de administración en ejecución y puede recopilar inventario de modelos:

```bash
ocx claude desktop profile show --json > desktop-observed.json
jq '.profile' desktop-observed.json > desktop-profile.json
```

Editar/revisar el perfil versionado, preservando los marcadores aplicados propiedad del servidor. Porque un guardado autorizado, y luego una lectura:

```bash
ocx claude desktop profile import desktop-profile.json --json
ocx claude desktop profile show --json
```

La importación acepta el perfil en sí, no el externo `{profile,models,rendered,port}`
respuesta, utilizando archivos JSON regulares limitados o stdin explícito `-` (4 MiB/30 segundos). Devuelve los campos observados más `ok:true`, significa solo salvado. `--apply` y Las banderas de modo nativo son rechazadas; el guardado en entorno de ejecución fallido no tiene respaldo local. Aplicar es una acción de escritorio existente separada en su máquina, por lo que verifica el host/contexto antes de elegirlo. Los modelos renderizados no son prueba de aplicación nativa.

### `ocx opencode [opencode args...]`

Asegúrese de que el proxy se está ejecutando, luego inicie código abierto con el `provider.opencodex` y
`providers.opencodex` bloques en la capa de ejecución en línea de OpenCode (`OPENCODE_CONFIG_CONTENT`) Los bloque heredado mantiene a los clientes V1 trabajando con mapas variantes; el bloque V2 lleva matrices nativas para las mismas opciones de razonamiento-esfuerzo y valores predeterminados. La configuración en línea existente se conserva y solo se reemplazan esas dos claves para este lanzamiento. Global o proyecto `opencode.json` Los archivos pueden ser leídos para advertir sobre un sobreescribir, pero los archivos en el disco nunca se modifican. Los modelos enrutados aparecen como
`opencodex/<provider>/<model>`. Lanzamiento llano `opencode` más tarde se comporta exactamente como antes.

### `ocx grok <status|exclude|include|set|clear|apply> ...`

Administre y aplique la valla modelo Grok Build.

<a id="client-config-export"></a>

## Exportación de configuración de cliente

### `ocx export --client <opencode|pi|omp|hermes|openclaw|kimi|gajae|dsh|mcode|zcode|prime|aside|raycast|omo|cline|kilo|commandcode|droid>`

Imprima una configuración de cliente conectada al proxy en ejecución. El comando serializa el
`opencodex` proveedor bloque — base URL, lista de modelos y credencial del cliente — en el formato nativo del cliente seleccionado.

El proxy debe estar en ejecución; el comando resuelve su puerto activo, lee `/api/models`, y emite sólo modelos Codex puede ver actualmente.

Las exportaciones de OpenCode y Kilo preservan los límites efectivos del modelo, las capacidades conocidas y el razonamiento declarado. opciones y valores predeterminados, incluidos los metadatos heredados por filas personalizadas. Las anulaciones explícitas siguen ganando; capacidades desconocidas y los valores predeterminados no se inventan. El lanzador de OpenCode utiliza los mismos metadatos. Véase [Integraciones de clientes](/es/guides/integrations/) para el comportamiento de actualización y actualización administrados.

| Bandera | Acción |
| --- | --- |
| `--client <opencode\|pi\|omp\|hermes\|openclaw\|kimi\|gajae\|dsh\|mcode\|zcode\|prime\|aside\|raycast\|omo\|cline\|kilo\|commandcode\|droid>` | Requerido. Selecciona el dialecto de configuración del cliente. |
| `--json` | Imprima el documento generado como JSON en stdout para scripts. Esto es JSON incluso cuando el formato nativo del cliente seleccionado es YAML, TOML o JSON5. |
| `--out <path>` | Escribe el formato de configuración nativo del cliente en `<path>`. Se niega a reemplazar un archivo existente. |
| `--force` | Permitir `--out` para reemplazar un archivo existente. |

```bash
ocx export --client opencode                     # config plus destination, merge warning, and counts
ocx export --client pi --json > pi-models.json   # JSON document for a pipe or a diff
ocx export --client omp --out ./omp-models.yml    # native OMP YAML
ocx export --client opencode --out ~/opencodex-opencode.json
```

Sin `--json` la configuración generada lleva, luego la ruta canónica de destino, el aviso de fusión, el env línea de exportación donde el cliente tiene uno, y un recuento de modelos con cuántas filas omite los límites de contexto (el cliente aplica sus propios valores predeterminados para ellos).

| Cliente | Destino canónico | Descargar nombre de archivo | Env var |
| --- | --- | --- | --- |
| `opencode` | `~/.config/opencode/opencode.json` (`XDG_CONFIG_HOME` gana cuando se establece) | `opencode.json` | `OPENCODEX_OPENCODE_API_KEY` |
| `pi` | `~/.pi/agent/models.json` (`PI_CODING_AGENT_DIR` gana cuando se establece; se rechaza un valor relativo) | `pi-models.json` | ninguno — el bloque lleva el literal `opencodex-loopback` |
| `omp` | `~/.omp/agent/models.yml` (`OMP_PROFILE` gana sobre `PI_PROFILE`, incluso cuando están vacíos; los perfiles con nombre usan el `PI_CONFIG_DIR` Nombre del directorio e ignorar `PI_CODING_AGENT_DIR`, mientras que el perfil predeterminado permite `PI_CODING_AGENT_DIR` ganar) | `omp-models.yaml` | ninguno — marcador de posición de bucle |
| `hermes` | `~/.hermes/config.yaml` | `hermes-config.yaml` | `OPENCODEX_HERMES_API_KEY` |
| `openclaw` | `~/.openclaw/openclaw.json` | `openclaw.json5` | `OPENCODEX_OPENCLAW_API_KEY` |
| `kimi` | `~/.kimi-code/config.toml` | `kimi-config.toml` | ninguno — marcador de posición de bucle |
| `gajae` | `~/.gjc/agent/models.yml` | `gajae-models.yaml` | marcador de posición de bucle de retroceso no secreto |
| `dsh` | `$DSH_HOME/settings.yaml` (por defecto) `~/.dsh/settings.yaml`) | `settings.yaml` | ninguno — portador de bucle de retorno no secreto marcador de posición |
| `mcode` | `~/.minimax/config.yaml` (`MINIMAX_DATA_DIR`Entonces el legado `MAVIS_DATA_DIR`, ganar cuando se establece; se rechaza un valor relativo) | `mcode-config.yaml` | ninguno — marcador de posición de bucle |
| `zcode` | `~/.zcode/v2/config.json` (`dataBaseDir` En el caso de `setting.json` Reubica la raíz; `ZCODE_DATA_DIR` gana cuando se establece; los valores relativos son rechazados) | `config.json` | ninguno — marcador de posición de bucle |
| `prime` | `~/.prime/agent/models.json` (`PRIME_AGENT_CODING_AGENT_DIR` gana cuando se establece; se rechaza un valor relativo) | `prime-models.json` | ninguno — marcador de posición de bucle |
| `aside` | `~/.aside/u/<account>/models.json` para la cuenta Aside propia `accounts.json` nombres como actuales; se rechaza un manifiesto ilegible en lugar de por defecto a una cuenta | `aside-models.json` | ninguno — marcador de posición de bucle |
| `raycast` | `~/.config/raycast/ai/providers.yaml` en macOS y Windows por igual (Raycast no honra `XDG_CONFIG_HOME`) | `raycast-providers.yaml` | ninguno — solo loopback, no `api_keys` La entrada está escrita |
| `omo` | `~/.omo/agent/models.json` (`OMO_CODING_AGENT_DIR`Entonces, `SENPI_CODING_AGENT_DIR`Entonces, `PI_CODING_AGENT_DIR` gana en ese orden cuando se establece; se rechaza un valor relativo) | `omo-models.json` | ninguno — marcador de posición de bucle |
| `kilo` | Primero existente `kilo.jsonc`, `kilo.json`, `opencode.jsonc`, `opencode.json`, o `config.json` bajo `~/.config/kilo` (`XDG_CONFIG_HOME` relocaliza ese directorio); utiliza `kilo.jsonc` Cuando no existe | `kilo.jsonc` | `OPENCODEX_KILO_API_KEY` |
| `commandcode` | `~/.commandcode/providers.json` (en Windows con el inicio predeterminado: usar `HOME ?? USERPROFILE` solo si no está en blanco y Windows-absoluto, de lo contrario `homedir()`; se conserva una vivienda suministrada por separado; adjuntar `.commandcode\providers.json`) | `providers.json` | solo loopback; `apiKey: false`; no hay variable de entorno |
| `droid` | `~/.factory/settings.json` (`%USERPROFILE%\.factory\settings.json` en Windows) | `factory-settings.json` | loopback solamente; no hay variable de entorno |

La exportación DSH administrada requiere DSH 0.1.0-rc.6 o más reciente y solo posee
`llm-pi-ai.providers.opencodex`. DSH recarga ese proveedor; el modelo predeterminado del usuario y
`deepseek-official` permanecen intactos. Esta exportación es solo loopback y no tiene credenciales reales. DSH 0.1.7 y importación más reciente `settings.yaml` una vez en el primer perfil que arranca y luego cambia el nombre Por lo tanto, la integración del dashboard escribe el mismo proveedor en el `llm-pi-ai` El origen de la palabra perfil's `$DSH_HOME/profiles/desktop/cordis.patch.yml` Una vez que el perfil existe.

interpolaciones de código abierto `{env:OPENCODEX_OPENCODE_API_KEY}`. Las exportaciones generadas de Pi y OMP hacen no requiere una variable de entorno: cada uno lleva el literal `opencodex-loopback` marcador de posición. Esto es de carga porque ambos clientes resuelven `apiKey` Al crear sus listas de modelos y ocultar todo el proveedor cuando una configuración existente contiene una referencia env no establecida. El proxy nunca comprueba el marcador de posición generado en loopback. OMP admite encabezados a nivel de proveedor, pero esta inicial integración deliberadamente permanece solo loopback; remoto `x-opencodex-api-key` cableado es diferido.

La exportación de Raycast es independiente `providers.yaml` Documento con una `id: opencodex` elemento en el `providers` secuencia: `name: OpenCodex`, el proxy `/v1` base URL, y cada modelo enrutado con su `abilities` (`tools` y `system_message` siempre apoyados, `vision` del catálogo modalidades de entrada, `reasoning_effort` cuando el modelo tiene una escalera de esfuerzo, `temperature` fuera por modelos de razonamiento). Proveedores personalizados es una función de Raycast Pro, y Raycast observa el archivo, por lo que un El cambio guardado entra en vigor sin reiniciar. El formato está documentado en
[manual.raycast.com/ai/proveedores personalizados](https://manual.raycast.com/ai/custom-providers). No
`api_keys` entrada está escrita, por lo que esta exportación es solo loopback y se rechaza un enlace no loopback.

Las exportaciones de MCode, ZCode y Prime son solo loopback por la misma razón y también llevan el mismo nombre.
`opencodex-loopback` lugar en lugar de una credencial real. El primer agente lee lo mismo
`models.json` contrato Pi, por lo que las dos exportaciones producen el mismo documento; solo el destino difiere. Se rechaza una ruta relativa en cualquiera de esas tres anulaciones de entorno, porque el proxy y el cliente puede tener diferentes directorios de trabajo y de lo contrario no estaría de acuerdo sobre qué archivo significa.

ZCode 3.8.1 puede ahorrar entorno de ejecución derivado `reasoning`, `limit.output`y metadatos de contexto predeterminados volver En el generado `provider.opencodex.models` entradas. Solo trata el estado de integración administrada esas adiciones documentadas como deriva actualizable. Configuración de identidad y conexión del proveedor, incluyendo `options.baseURL`, membresía de modelo, nombres, modalidades y cualquier límite de contexto OpenCodex permanecen protegidos; editando los informes `conflict / foreign-edit` en lugar de sobrescribir el archivo. Un registro de propiedad creado por una versión anterior de OpenCodex puede recuperarse automáticamente cuando el catálogo generado no cambia. Si tanto el catálogo como el bloque cambiado, vuelva a aplicar solo después de revisar el archivo porque el registro anterior no puede probar qué cambio fue derivado de Zcode.

:::caution[Combina la configuración; no la reemplaces]
`ocx export` nunca escribe su configuración de cliente real. El destino está impreso para que usted se fusione con mano, y `--out` se niega a sobrescribir un archivo existente sin `--force`, porque reemplazando a config destruye los otros proveedores, agentes y entradas MCP que ya están en él.
:::

Ninguna llave se serializa nunca. Las configuración llevan una referencia de entorno documentada o una Marcador de posición de bucle no secreto. Una dirección de bucle (`127.0.0.1`) por sí solo no establece sin llave admission: comprueba la política de destino y el punto final. Comandos de modelo/audio de clave seleccionada todavía requieren entrada de clave explícita en loopback. Establezca una variable referenciada solo cuando el esquema del cliente lo admita y el proxy se une más allá del bucle de retorno; véase
[Acceso remoto](/es/reference/configuration/server/#remote-access) cómo se emiten las llaves de admisión. Claves para los propios proveedores ascendentes son una cosa completamente separada, configurada por
[Proveedores](/es/guides/providers/). La integración gjc generada utiliza un marcador de posición de bucle de retroceso no secreto y no necesita ninguna variable de entorno. Sigue siendo solo loopback; no configura las credenciales de admisión remotas.

La misma carga útil es servida por `GET /api/client-config` y renderizado en la pestaña API del panel de control, el CLI, el API y el GUI usan los mismos bytes.

<a id="runtime-and-configuration"></a>

## Tiempo de ejecución y configuración

### `ocx system <status|settings|startup|diagnostics|sync|codex-app-server|codex-restart|update|codex-cli-update> ...`

Administre la configuración de entorno de ejecución sin cabeza, el inicio, la sincronización, los diagnósticos y las actualizaciones.

`ocx system codex-restart --yes` reinicia los servidores de aplicaciones Codex a través del mismo módulo que
`ocx sync --restart-codex`. Se cierra y vuelve a iniciar la aplicación de escritorio Codex cuando la aplicación se lanzó antes de que se escribiera el catálogo de modelos actual o se cambiara esta solicitud su `model_catalog_json` Encuadernación, porque el selector de modelos está construido en lanzamiento. De lo contrario, la aplicación permanece abierta, reaparece su propio servidor de aplicaciones y mantiene los borradores no guardados. pendientes de aprobaciones. Si no se puede leer el estado de la aplicación o del catálogo, se reinicia por completo. Cuando el proxy en sí se está ejecutando dentro de la aplicación Codex, el reinicio del escritorio se niega con una acción mensaje en lugar de prometer un traspaso que no puede completar.

A `model_catalog_json` La vinculación cambiada por esta solicitud también fuerza el reinicio del escritorio, incluso cuando el shell se inició después de que se escribió el archivo de catálogo.

```bash
ocx system settings --stream-mode eager-relay
```

Sistema booleanos adicionales toman en / off: `--show-codex-credits`, `--account-picker`,
`--main-account-hard-lock`, `--ultra-fast-tier`, y `--fast-rows`. Sólo escriben campos explícitos y puede combinarse con opciones de sistema existentes. Mostrar los créditos es una preferencia de visualización, no opt-in de crédito pagado; el sistema Ultra Fast está separado de proveedor rápido.

Ultra Fast es una configuración opt-in, por defecto desactivado. Con `--ultra-fast-tier on`, el El catálogo generado añade la opción de velocidad ultrarrápida a la opción nativa `gpt-6-astra` y
`gpt-6.1-sol` (incluidas las filas vinculadas a la cuenta), por lo que el selector Codex lo ofrece junto a Rápido. Ultrafast requiere un plan ChatGPT elegible; el catálogo no puede verificar eso, Así que activa la configuración solo si tu plan lo incluye. Otros modelos y el predeterminado La velocidad no cambia.

Para modelos enrutados, la sincronización y la convergencia del catálogo conservan una ruta existente row's operador-suministrado `ultrafast` Entradas en `service_tiers` y
`additional_speed_tiers` junto con su capacidad actual de Fast. Las declaraciones pertenecen a la babosa exacta del proveedor/modelo; no se copian a otros modelos. El ajuste no crea declaraciones faltantes ni restaura modelos eliminados. Apagarlo elimina Ultra Fast de las filas enrutadas ordinarias y la opción nativa generada en el siguiente regeneración de catálogo.

El modo rápido del proxy decide qué llega al backend: cuando se desactiva, se selecciona La solicitud ultrarrápida se envía como `service_tier: "ultrafast"`; `fastMode: true`
reemplaza cualquier nivel con Rápido (`priority`), y `fastMode: false` elimina el nivel. Deje el modo Rápido sin configurar para usar Ultrarápido.

```bash
ocx system settings --json
ocx system settings --show-codex-credits on --json
ocx system settings --json
```

Nueva opción escribe informe `{ok:true, settings: observedFields, catalogRefreshPending}`. Ultra Fast realiza la lectura GET del mismo objetivo porque PUT omite ese valor. A ausencia/desajuste/fallo de lectura `verification:"unverified"` con
`unverifiedFields` y una salida distinta de cero después de la aceptación; los valores solicitados nunca son sustituyendo las observaciones. Los interruptores de escritorio combinados retienen el almacenamiento/efectividad y aplicar hechos. El catálogo pendiente o aplicación nativa diferida/rechazada es distinto de una configuración guardada. Falsa pendiente no es prueba de que cada cliente ha recargado.

`ocx system update` actualizaciones OpenCodex sí mismo. La superficie de inspección separada Codex CLI es:

```bash
ocx system codex-cli-update check --json
```

`check` no realiza ninguna solicitud de registro de paquetes e inspecciona la evidencia de procedencia configurada-candidata limitada, incluyendo una ubicación ejecutable redactada y evidencia de propiedad. Autenticación de contexto de lanzador publicado de confianza la instantánea candidata, ejecución no exitosa de Codex. En POSIX, la selección se certifica solo cuando el entorno de ejecución resolutor selecciona el mismo candidato de entorno canónico sin ejecutarlo. Un manifiesto vinculado npm-global puede entonces establecer `managed: true` cuando demuestre la propiedad y, si se informa de una versión candidata, esa versión coincide con el manifiesto; los candidatos persistentes permanecen sin certificar. El informe JSON expone `candidateAvailable`, `candidateVersion`, `candidateSource`, y `selectionAttested`. Inspeccionar el candidato configurado requiere un contexto de lanzador publicado de confianza; un lanzamiento directo de Bun/source no tiene tal prueba, ignora el estado del candidato ambiental y persistente, y puede informar
`candidate_unavailable` en POSIX. En Windows este primer segmento no realiza ninguna E/S candidata o de sistema de archivos de configuración: solo un candidato a entorno absoluto capturado por la prueba puede recibir etiquetas léxicas de paquete de aplicaciones o gestor de versiones; cualquier otro candidato Windows falla cerrado. Debido a que ese segmento nunca consulta el estado persistente, se ejecuta un Windows sin informes de candidatos a entorno capturados `windows_inspection_deferred` en lugar de `candidate_unavailable`: el comando no puede observar si un Codex CLI está instalado, por lo que informa el aplazamiento en lugar de que ningún candidato existe. El comando no ejecuta Codex o un administrador de paquetes, reparar una shim, escribir configuración o estado de caché, detener un proceso o instalar cualquier cosa. App-bundled, reconocido version-manager, independiente no verificado, y estados de shim ambiguos se reportan como no administrados o desconocidos y nunca se clasifican como gestionados.

En Windows, un comando bare capturado como `CODEX_CLI_PATH=codex`, una ruta remota o un informe de ruta de dispositivo `candidate_path_unavailable` En su lugar. Esos casos tienen un candidato capturado; su trayectoria no es elegible para esta inspección.

<a id="read-only-codex-cli-update-plan"></a>

#### Plan de actualización de solo lectura Codex CLI

```bash
ocx system codex-cli-update plan --channel latest --json
```

Ejecutar a través del lanzador de Nodos publicado con el `CODEX_CLI_PATH` en el ambiente de shell. El plan requiere una instalación certificada de POSIX npm-global y una versión de manifiesto de paquete vinculado. Consulta el registro oficial de npm para obtener una versión exacta, integridad de SHA-512 y tarball del mismo origen. utilizando el PATH capturado del lanzador y la configuración temporal aislada de npm, caché y registros. Proxy configuración y `NODE_EXTRA_CA_CERTS` permanecer apoyado; la limpieza es el mejor esfuerzo. No se ejecuta ningún comando Codex.

Informes de planes aplicables `applicable: true` y un determinista `planId` plataforma de enlace, resumen de instalación-raíz, versión instalada, canal y versión/integridad de destino. El plan nunca es persistió. Rechaza degradaciones, versiones ya actuales, sesiones Codex activas e incompletas proceso de observación. Windows devuelve `windows_inspection_deferred` antes de las consultas de registro/proceso. Una salida de denegación 0: inspeccionar `applicable` y `refusal`. El argv de instalación impreso es indicativo; esto El comando no instala nada, no cambia el estado de la aplicación y nunca señala una sesión. No aplicar comando está expuesto, y un ID de plan no es autorización de instalación.

<a id="explicit-installation-observation-on-windows-x64"></a>

#### Observación explícita de la instalación en Windows x64

```text
ocx system codex-cli-update attest [--json]
ocx system codex-cli-update attest --candidate <absolute-path> --npm-prefix <absolute-path> --npm-cli <absolute-path> --node <absolute-path> [--json]
```

`attest` es una observación opt-in y de solo lectura de una instalación Windows x64 npm. Sin opciones, identifica el candidato seleccionado a partir de la instantánea del lanzador de prueba — configurada `CODEX_CLI_PATH` o el primer `codex` en el PATH capturado, con una envoltura OpenCodex resolviendo a su nombre `codex.opencodex-real.cmd` Soporte npm. Suministrar los cuatro caminos absolutos anula el descubrimiento; el descubrimiento solo propone caminos y la observación manual sigue siendo la autoridad. `--candidate` debe nombrar el estándar npm `<prefix>/codex.cmd` o `<prefix>/node_modules/@openai/codex/bin/codex.js`. `--npm-cli` debe terminar en `node_modules/npm/bin/npm-cli.js`; `--node` Nombres explícitos `node.exe`. Los paquetes de aplicaciones, los diseños reconocidos del administrador de versiones, las shims propiedad de opencodex sin su respaldo npm y los envoltorios personalizados se rechazan.

Los controladores nativos mantienen los directorios y archivos antecesores durante las lecturas limitadas. Las plataformas no soportadas, los puntos de revisión / uniones, los escritores en conflicto, las rutas inseguras y los archivos de gran tamaño son rechazados. El informe fijo no contiene rutas: `status` es `observed` o `refused`, con `installationIdentityObserved`; `selectionAttested`, `managed`, y `applyAllowed` permanecer `false`. Comprobar `status`, no solo el código de salida del proceso: un rechazo informado puede salir 0.

Una identidad o resumen observado describe esos archivos durante esta observación. No es un permiso de actualización duradero y no prueba el entorno de ejecución seleccionado, el instalador anterior, la configuración efectiva de npm o la autenticidad de la herramienta. El Nodo suministrado se observa solamente, no se ha demostrado que sea el Nodo que un lanzador seleccionaría. No se ejecuta ningún objetivo; no se produce ninguna solicitud de registro, instalación, escritura de configuración o control de procesos. El Windows existente `check` El comando sigue sin realizar ninguna E/S del sistema de archivos candidato/configuración.

### `ocx config [show|get|set|unset|validate|export|import] ...`

`ocx config [show] [--json] [--source]` muestra la configuración local sin un proxy en ejecución. Omisión `show` También funciona con cualquiera de las banderas o ambas, en cualquier orden. `--source` incluye la fuente de diagnóstico, error y campos de advertencia y solo se acepta para su visualización. `--json` puede preceder a una acción explícita; no cambia qué acción se ejecuta. Repetición `--json` o `--source` Se rechazan las banderas y los argumentos desconocidos.

Inspeccione y modifique de forma segura la configuración OpenCodex validada. `show` y `get` Secretos de máscaras. Importación valida antes de escribir y requiere `--yes`.

La visualización y la mutación eliminan las credenciales de las URL proxy al tiempo que retienen el host y el puerto.
`direct` y los valores de proxy sin credenciales se mantienen legibles. `export` conserva las credenciales para que el copia de seguridad puede restaurar la configuración; almacenar los archivos exportados como secretos.

<a id="usage-from-a-connected-client"></a>

### Uso desde un cliente conectado

`ocx usage` lee el concentrador conectado con la clave de datos registrada de este cliente. La salida humana identifica la fuente del concentrador y el alcance de la clave del cliente; `--json` devuelve los mismos datos. Gama, superficie, filtros de proveedor / modelo y personalizados `--since`/`--until` Los límites siguen estando disponibles. Los desgloses de cuentas y los registros de otros clientes no se comparten. Un concentrador antiguo o no disponible produce un error explícito en lugar de sustituir el uso local; actualice el concentrador si no admite esta lectura.

El punto final del plano de datos de solo lectura es `GET /v1/usage`, utilizando `x-opencodex-api-key` con una clave de cliente configurada. En todo el entorno y las claves de administración son rechazadas. Acepta `range`, `surface`, `provider`, `model`, `since`, y `until`; se rechazan las opciones desconocidas/repetidas y los identificadores de clave seleccionados por el llamante. Las filas sobredimensionadas omitidas retienen la advertencia explícita de historial incompleto.

<a id="explain-a-listed-request"></a>

## Explicar una solicitud listada

Humanos `ocx logs` La salida incluye `id=<request-id>`. Pasa ese valor a `ocx logs explain <request-id>` para inspeccionar las decisiones de enrutamiento. Las filas sin ID o con caracteres de control en su ID omiten el campo en lugar de mostrar una clave de búsqueda diferente. La salida JSON y JSONL conserva su esquema existente.

<a id="routing-profile-lookup-status"></a>

## Estado de búsqueda del perfil de enrutamiento

`ocx route policy show <id>` sale 4 cuando el perfil no existe. Faltan o no son válidos los argumentos de comando. Los scripts pueden distinguir un perfil que falta del uso incorrecto.

<a id="upstream-error-details"></a>

## Detalles de error ascendentes

Cuando una envolvente de error ascendente contiene varios campos de mensaje, OpenCodex utiliza la primera cadena no en blanco en su orden de prioridad establecido. Los campos vacíos o mal formados ya no ocultan un diagnóstico alternativo válido.

<a id="forced-claude-code-subagent-model"></a>

### Modelo de subagente forzado Claude Code

La página Subagentes ofrece **Fuerza a todos los subagentes en un modelo**, fuera por defecto. Seleccione una identificación de estilo de lista expuesta, como `combo/tev-auto`A continuación, habilite el interruptor. La lista se ofrece primero; las entradas de la lista guardadas no disponibles no pueden ser objetivos forzados.

`ocx agent subagents force combo/tev-auto` conjuntos `claudeCode.subagentModelForce`; `ocx agent subagents force -` Lo aclara. `ocx agent status` informa el establecimiento. `GET /api/subagent-models` devoluciones `force`, `forceAvailable`, y `forceStatus`; `PUT` acepta `{ "force": "combo/tev-auto" }` o `{ "force": null }` Sin cambiar el roster. Omisión `force` Lo deja sin cambios. Los objetivos inválidos o no expuestos son rechazados en la escritura; los objetivos obsoletos son reportados y omitidos en el lanzamiento.

Esto tiene efecto en el **siguiente routed `ocx claude` lanzamiento**, inyección `CLAUDE_CODE_SUBAGENT_MODEL` como un alias proxy explícito (con `[1m]` solo para una ventana autorizada de un millón de token; los objetivos nativos Claude usan un alias nativo reversible) y `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. Cada variable no vacía exportada por el shell gana independientemente. Los lanzamientos nativos no inyectan ninguna variable; simple `claude` No se ve afectado. No hay archivos de plugin o `settings.json` son modificados por esta configuración.

Claude Code **2.1.257 o más reciente** es necesario para FORCE. Los argumentos del modelo Plugin y los agentes integrados (incluyendo Explorar/Plan) y por llamada se anulan. bifurcaciones y habilidades de subagente con `model: inherit` mantener el modelo de conversación principal. El bucle principal y los sidecars de pequeño-rápido no se ven afectados. Los archivos de la lista existentes permanecen disponibles.

El panel de control advierte sobre versiones antiguas o desconocidas de CLI, objetivos no disponibles y cualquier variable que ya esté presente en el sistema. `settings.json` → `env` (que anula env de lanzamiento). La detección es de solo lectura y local en el servidor: no puede inspeccionar otro shell de lanzamiento, otra máquina o la configuración local del proyecto. Un resultado desconocido no es prueba de apoyo a la fuerza.
