---
title: "Configuración del agente"
description: "Superficies multiagente, guía de delegación, modelos preferidos, cadenas de reserva, sincronización por defecto nativo y límites de esfuerzo."
---

Control de configuración del agente qué superficie de colaboración Codex se anuncia y cómo opencodex guías, rutas y límites del trabajo delegado.

<a id="agent-fields"></a>

## Campos de agente

<a id="skills-catalog-refresh"></a>

### Actualización de catálogo de habilidades

`skills.catalog_refresh` acepta `"per_session"` (el valor predeterminado) o `"per_turn"`
en opencodex `config.json`. El modo de sesión reutiliza las primeras habilidades recibidas instrucciones para una conversación, protegiendo el prefijo de caché del catálogo Cambios entre turnos. El modo Turn reenvía el catálogo actual del cliente. Véase [Mantener el catálogo de habilidades estable](/es/guides/codex-prompt/#keeping-the-skills-catalog-stable)
para detalles de configuración y duración de instantáneas.

<a id="astra-roster-upgrade"></a>

### Actualización de la lista de Astra

En el primer inicio después de la actualización, `subagentModels` listas reciben
`gpt-6-astra` Primero. Las primeras cuatro opciones únicas no-Astra se conservan y la La vieja quinta opción se perdió. Si `gpt-5.5` Se mantiene, se mueve hasta el final. Por lo tanto, la lista predeterminada anterior se convierte en Astra, Sol, Terra, Luna, 5.5. Una lista de legado no establecida recibe los valores predeterminados actuales; una lista de legado vacía explícita se convierte en
`["gpt-6-astra"]`. Las entradas Astra existentes no están duplicadas.

El valor predeterminado actual es `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`. En el primer inicio después de la actualización, se limpia una lista almacenada de filas retiradas: `gpt-5.6-sol` y
`gpt-5.6-luna` convertidos `gpt-6-sol` y `gpt-6-luna` en la misma posición, y cada otros `gpt-5.5` o `gpt-5.6` El modelo se ha eliminado. Ids con un `/` (enrutado)
`provider/model` ej., opciones calificadas para la cuenta) se dejan tal como están escritas. Una lista que Solo las filas retiradas reciben el valor predeterminado actual; una lista vacía permanece vacía.

GPT-6.1 Sol reemplazó a GPT-6 Sol como predeterminado el 30 de septiembre de 2026. En el primer inicio Después de esa actualización, un `gpt-6-sol` en una lista almacenada se convierte `gpt-6.1-sol` en el mismo posición (sin un duplicado si ya está en la lista 6.1 Sol). GPT-6 Sol permanece disponible: agrégalo Después vuelve y se queda.

El interior `subagentModelsVersion` Marcador (actualmente `3`) hace cada paso a Actualización única. Después puede reordenar, eliminar Astra o guardar una lista vacía sin que la startup vuelva a cambiar sus opciones. Los modelos con discapacidad permanecen inhabilitados. Disponibilidad de Astra todavía depende del soporte de upstream para su cuenta.

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `multiAgentMode?` | `"v1" \| "default" \| "v2"` | `"default"` | `v1` estampa cada modelo de catálogo como v1; `v2` Sella cada modelo como v2. `default` restaura los pines de origen (Sol/Terra v2, Luna v1) y, de lo contrario, sigue el patrón nativo `multi_agent_v2` bandera. Se aplica a nuevas sesiones. |
| `keepNativeChatGptOnV1?` | `boolean` | `false` | Cuando `multiAgentMode` es `"v2"`, deshabilite la anulación global de V2, marque las filas nativas ChatGPT como v1 y mantenga las filas enrutadas en v2. Codex resuelve la anulación global antes de los pines del catálogo, por lo que se requieren ambas partes para que un padre ChatGPT genere hijos enrutados sin tareas cifradas en el backend ([#92](https://github.com/lidge-jun/opencodex/issues/92)) Ignorado en `v1` y `default`. |
| `subagentModels?` | `string[]` | `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna` | Hasta cinco nativos desnudos, cuenta-calificado `<selector>/<native-openai-model>`, o enrutado `provider/model` En el caso de la primera aparición. El panel de control solo ofrece identificadores nativos y enrutados y omite las opciones exactas calificadas para la cuenta cuando se guarda; use `ocx agent subagents set` o edite la configuración para elegir exactamente. Después de la [Actualización única de Astra](#astra-roster-upgrade), se conserva una lista vacía explícita. |
| `injectionModel?` | `string` | — | Modelo de subagente nativo o encaminado preferido usado en la guía de delegación v2 de autor proxy. |
| `injectionEffort?` | `string` | — | Esfuerzo preferido (`low` a través `ultra`), significante solo con `injectionModel`. |
| `injectionPrompt?` | `string` | — | Reemplaza el cuerpo de guía v2 incorporado. Apoyos `{{model}}`, `{{effort}}`, `{{roster}}`, y `{{fallback}}`. Un configurado `injectionModel` es suficiente para mostrar el mensaje personalizado. |
| `multiAgentGuidanceEnabled?` | `boolean` | `true` | Controla solo la guía para desarrolladores v1/v2 de opencodex; no cambia los valores predeterminados, las herramientas, el enrutamiento, las listas o los límites de esfuerzo de los agentes nativos. |
| `syncCodexSubagentDefaults?` | `boolean` | `false` | Optar por escribir `injectionModel` y opcional `injectionEffort` como los valores predeterminados nativos de Codex durante la sincronización/reinicio. Requiere `injectionModel`. |
| `subagentModelFallback?` | `string[]` | `[]` | Modelos de reserva globales ordenados por prioridad para turnos infantiles generados. |
| `subagentModelFallbackByModel?` | `Record<string, string[]>` | `{}` | Cadenas de reserva por modelo primario, encadenadas por el ID del modelo primario solicitado. Este es el hogar admitido para los metadatos de reserva por función; `model_fallback` dentro del agente Codex TOML hace que Codex 0.146+ omita el rol ( +1190). |
| `subagentModelFallbackPollMs?` | `number` | `60000` | Intervalo de caché de sonda de disponibilidad. Los valores por debajo de 1000 ms vuelven al valor predeterminado. |
| `codexRoleTiers?` | `{ fast?, standard?, frontier?: string[] }` | — | Nivel de capacidad de los modelos con nombre para [función auto-asignación](/es/guides/integrations/#auto-assign). Los modelos listados toman ese nivel; otros modelos están escalonados por precio, y nunca se proponen modelos no listados. |
| `effortCap?` | `string` | — | Techo duro para los giros principales de calificación v2 y los giros marcados de niño engendrado. Acepta `low` a través `ultra`. |
| `subagentEffortCap?` | `string` | — | Techo adicional para giros de niños engendrados solamente. Cuando se aplican ambas tapas, la más baja gana. |
| `plaintextV2AgentMessages?` | `boolean` | — (desactivado) | Opt-in experimental. Se ejecuta solo cuando se establece explícitamente en `true` y pide a los padres ChatGPT v2 que emitan `spawn_agent`, `send_message`, y `followup_task` argumentos como texto plano. Véase [Mensajes de agente de texto sin formato v2](#plaintext-v2-agent-messages). |
| `agentTaskRecovery?` | `object` | — | Recuperación opt-in experimental para tareas v2 cifradas en backend enviadas a proveedores enrutados. Discapacitados a menos que `enabled: true`; ver [Recuperación de tareas cifradas v2](#encrypted-v2-task-recovery). |

Gestione la superficie con el panel de control o
`ocx v2 status|on|off|mode <v1|default|v2>|keep-native-v1 <on|off>|threads <n>|mode-hint <text|--clear>`. Los cambios de modo se aplican a las sesiones nuevas. `maxConcurrentThreadsPerSession` es un `PUT /api/v2` campo, no a
`config.json` clave; `ocx v2 threads <n>` escribe `max_concurrent_threads_per_session` bajo
`[features.multi_agent_v2]` en Codex `$CODEX_HOME/config.toml` después de que se habilite v2.

**Delegación siempre proactiva** en Subagentes → Avanzado (anteriormente **Modo Ultra**) cambia el delegación sin cambiar el esfuerzo de razonamiento. Su preajuste conserva las instrucciones del usuario, límites de autoridad, alcance de tareas y reglas de herramientas. El panel de instrumentos alterna, `PUT /api/v2` campo
`multiAgentModeHintText`, y `ocx v2 mode-hint` escribir
`features.multi_agent_v2.multi_agent_mode_hint_text` en Codex
`$CODEX_HOME/config.toml`. El CLI `ocx v2 mode-hint` comando persiste esta clave incluso cuando `multi_agent_v2` está deshabilitado; no cambia la función. El hint sustituye La política multiagente derivada del esfuerzo de codex-rs cuando esa superficie nativa está activa. A `null` valor elimina la clave para que la política derivada del esfuerzo (ultra  + proactivo, explícitamente); los valores vacíos o solo de espacio en blanco se rechazan porque un La anulación vacía presente suprimiría incluso el mensaje Proactivo ultraderivado. Los Panel de Subagentes **Delegación siempre proactiva** requiere tanto de la característica nativa como una superficie v2 explícita (`multiAgentMode: "v2"`, equivalente a `ocx v2 mode v2`);
`ocx v2 on` por sí sola no satisface esa puerta de panel.

`GET` y `PUT /api/v2` También regreso `multiAgentModeHintRecommendation: { text, revision }`. El panel de control utiliza este texto proporcionado por el servidor al habilitar o restaurar el preset, sin hardcoded fallback. Si un servidor antiguo omite la recomendación o devuelve un valor mal formado, la instalación y restauración preestablecidas no están disponibles; editar o borrar una sugerencia personalizada existente sigue estando disponible. **Restaurar preajuste** cambia solo el borrador local; **Guardar** Y lo hizo.

La configuración de lectura, las actualizaciones no relacionadas y las actualizaciones no migran una pista almacenada. Sólo una explícita actualización de pista que coincide con cualquiera de los dos preconfiguración heredados reconocidos OpenCodex byte por byte es reemplazado por la recomendación actual. Otro texto personalizado válido, incluidas las variantes de espacio en blanco, Se conserva byte por byte. El soporte de indicación de modo aún se comprueba antes de escribir, y se aplican cambios a nuevas sesiones Codex.

La gestión API expone `GET`/`PUT /api/v2`, `/api/injection-model`, `/api/effort-caps`,
`/api/subagent-models`, y `/api/subagent-model-fallback`. Las actualizaciones del modelo de inyección son parciales; el prompt personalizado es `prompt` campo en ese API.

La página de Autonomía Codex también puede alternar la propia Codex `default_mode_request_user_input`
bandera característica (`GET`/`PUT /api/codex-auth/features/default-mode-request-user-input`) Habilitarlo añade `[features] default_mode_request_user_input = true` a Codex
`$CODEX_HOME/config.toml` a través del oficial `codex features enable|disable` CLI (edición de conservación de formato, se elimina de nuevo cuando está desactivado), lo que permite a Codex pausar una Por defecto-modo de sesión y hacerle preguntas con el `request_user_input` herramienta. Los bandera está en desarrollo de origen y solo se aplica a nuevas sesiones; el toggle falla en voz alta cuando la compilación Codex instalada aún no conoce el indicador.

<a id="roster-and-guidance"></a>

## Lista y orientación

La lista efectiva de v2 son los primeros cinco modelos configurados, visibles para el selector y clasificados por prioridad que están presentes en el catálogo inyectado y no están explícitamente marcados `"disabled"`. Una explícita `"v2"`
pin apoya trabajadores recursivos; `"v1"`, `null`, y los pines ausentes siguen siendo elegibles como trabajadores de hojas. Las entradas excluidas permanecen en la configuración para que puedan ser elegibles más adelante.

La detección de superficies utiliza la forma de la herramienta. Un espacio de nombres `spawn_agent` con `send_input`, `resume_agent`, o
`close_agent` es v1. Un piso `spawn_agent` con `send_message`, `followup_task`, `interrupt_agent`, o
`list_agents` Es V2.

La guía V1 es texto proactivo solo en `max` o `ultra`. V2 recibe un desarrollador de autor proxy mensaje solo cuando existe un modelo preferido, una lista elegible o una cadena de reserva. Guía v2 incorporada tiene un presupuesto de 700 caracteres y elimina la lista primero si es necesario. La guía es deduplicada prefijos de reproducción e insertados antes de un `compaction_trigger`.

Tanto la guía de subagente v2 incorporada como la personalizada `injectionPrompt` uso de cuerpos
`<opencodex_subagent_guidance>`, separado del nativo de Codex `<multi_agent_mode>` mensajes. El texto incorporado informa el modelo preferido resuelto, la lista y la cadena de reserva sin recetar delegación, anulaciones de modelos, o `fork_turns`. Los cuerpos personalizados conservan su sustitución de marcador de posición y contenido. `injectionModel` y `injectionEffort` seguir siendo asesor a menos que la sincronización por defecto nativo sea habilitado; los valores de marcador de posición personalizados que faltan todavía se reemplazan con una cadena vacía.

La deduplicación de reproducción compara el texto exacto más reciente de cada familia de etiquetas. Cuando ambos valores utilizan el nueva familia de proxy, cambiando la guía personalizada al formulario incorporado agrega el valor actual; Los cambios de modo nativo que intervienen no duplican la orientación del proxy sin cambios. existentes nativos y Se conserva la historia legacy-tagged. Este cambio de envoltura no identifica al autor de mensajes o revocar instrucciones previas. Las historias de versiones mixtas no se pueden clasificar a partir de la etiqueta heredada sola, y la detección de transición a través de tales historias no está garantizada.

<a id="native-codex-default-sync"></a>

## Codex nativo sincronización predeterminada

Cuando está habilitado, `syncCodexSubagentDefaults` escribe marker-own
`[agents] default_subagent_model` y `default_subagent_reasoning_effort` campos. Sin marcar Los campos de destino propiedad del usuario se tratan como conflictos y siguen siendo autorizados; TOML parcial o ambigua escritura fallida. Liquidación `injectionModel` También elimina el opt-in. Estos valores predeterminados afectan nuevamente creó tareas Codex y no causa delegación por sí mismas.

<a id="fallback-chain"></a>

## Cadena de fallback

El orden de reserva de hijo desove es:

1. el modelo primario solicitado;
2. cadenas por modelo de `subagentModelFallbackByModel` (en clave por el modelo primario); luego
3. mundial `subagentModelFallback` entradas.

Las cadenas de reserva por función deben vivir en la configuración opencodex. Escritura `model_fallback` en
`$CODEX_HOME/agents/*.toml` hace que Codex 0.146+ rechace todo el archivo de rol como desconocido campo y omita el rol (n.o 1190). Un legado `model_fallback` La línea en el TOML sigue siendo compatibilidad con versiones anteriores, pero `ocx doctor` banderas.

opencodex omite los candidatos deshabilitados, no enrutables, poco saludables, de enfriamiento o de umbral de cuota. Los snapshot de disponibilidad se almacena en caché para `subagentModelFallbackPollMs`. Restringir las tareas secundarias cifradas la cadena a los objetivos canónicos nativos ChatGPT más rutas directas clave-auth Responses explícitamente Confiado con `allowEncryptedV2AgentTasks: true`; si ninguno puede consumir la carga útil cifrada, el solicitud falla en lugar de encaminar texto cifrado ilegible a otro lugar. Combo routing primero prueba un objetivo nativo canónico disponible; cuando ninguno es seleccionable o sus intentos se han agotado, y
`agentTaskRecovery` está habilitado, un cifrado `NEW_TASK` se recupera una vez antes del combo enrutado despacho. La recuperación combinada se ejecuta solo en giros hijo generados; el camino directo también se recupera en un interruptor de modelo de rosca media.

```json
{
  "multiAgentMode": "v2",
  "subagentModels": ["gpt-5.5", "anthropic/claude-sonnet-5"],
  "injectionModel": "gpt-5.5",
  "injectionEffort": "high",
  "syncCodexSubagentDefaults": true,
  "subagentModelFallback": ["gpt-5.6-luna"],
  "subagentModelFallbackByModel": {
    "gpt-5.5": ["gpt-5.6-luna"]
  },
  "subagentModelFallbackPollMs": 60000,
  "subagentEffortCap": "high"
}
```

<a id="plaintext-v2-agent-messages"></a>

## Mensajes de agente de texto sin formato v2

`plaintextV2AgentMessages` es unset en una nueva configuración y se ejecuta solo cuando se establece explícitamente a `true`. La persona que llama debe usar el cable Responses, y el destino final debe usar el cable canónico ChatGPT. Codex transporte directo: `adapter: "openai-responses"`, `authMode: "forward"`y la base exacta URL
`https://chatgpt.com/backend-api/codex`. OpenAI API-proveedores clave, personalizados OpenAIpasarelas compatibles, rutas cuyo destino final es otro proveedor, yResponses Las llamadas nunca se reescriben.

Para una solicitud v2 elegible, opencodex reconoce el catálogo por un `collaboration`
espacio de nombres con un `spawn_agent` niño. El catálogo puede estar en el nivel superior `tools`En el desarrollador del primer elemento de entrada `additional_tools` cuando `tools` está ausente (Responses Lite). Un catálogo explícito de nivel superior tiene prioridad; los catálogos de rol de usuario y posteriores no tienen prioridad. Activa la opción. Elimina
`parameters.properties.message.encrypted: true`Cuando está presente, sólo de `spawn_agent`,
`send_message`, y `followup_task`. ChatGPT se reserva tanto el `collaboration` El espacio de nombres y aquellos tres nombres de herramienta, por lo que la solicitud utiliza alias privados fijos para las cuatro identidades. Antes de hacer ese cambio, opencodex comprueba el nivel superior y `additional_tools` catálogos, espacios de nombres anidados,
`tool_search_output` declaraciones, `tool_choice`, y los elementos de llamada anteriores para el espacio de nombres privado y Alias fijos. Cualquier conflicto deja toda la solicitud sin cambios. OpenCodex restaura solo el Alias con alcance de solicitud en respuestas JSON, SSE y WebSocket antes de que Codex reciba la llamada a la herramienta. Los `encrypted_function_args: []` El campo se conserva de manera que los clientes Codex compatibles reconocen el mensaje como texto plano.

Esta ruta no agrega ninguna solicitud de recuperación y, por lo tanto, no gasta la cuota adicional ChatGPT utilizada por un cache miss in `agentTaskRecovery`. No puede cambiar las tareas que ya están cifradas. Si la petición ya declara el alias privado o una referencia conflictiva, opencodex deja esa solicitud Sin cambios; la recuperación habilitada por separado aún puede manejar una tarea enrutada que luego se cifra. Si ChatGPT rechaza o ignora el esquema modificado, o el cliente Codex no reconoce el texto sin formato campos de respuesta, la llamada puede fallar. OpenCodex no vuelve a intentar la solicitud principal con el original esquema porque al hacerlo podría duplicar el uso de la cuota o las llamadas a herramientas.

La restauración utiliza un presupuesto transversal de 10.000 identidades para cada carga útil de respuesta. Si una carga útil se agota ese presupuesto, JSON delimitado devuelve HTTP 502 y devuelve un flujo `response.failed`; ni camino envía los alias privados a Codex o guarda la `previous_response_id`
continuación.

Para las llamadas reescritas correctamente, la opción elimina el cifrado de la capa de aplicación del agente argumentos de mensaje. HTTPS todavía cifra el transporte de la red, pero el texto del mensaje puede aparecer en Codex historial de tareas, solicitudes de proveedores enrutados, `responses-state.json` o sus archivos de derrame, y
`usage-debug.jsonl` cuando la captura de depuración está habilitada. El comportamiento depende de ChatGPT indocumentado campos de esquema y respuesta y puede dejar de funcionar después de una actualización de cliente o backend. Startup imprime un aviso mientras esté habilitado.

```json
{
  "plaintextV2AgentMessages": true
}
```

El comando equivalente CLI es `ocx config set plaintextV2AgentMessages true`. Reiniciar el proxy Después de cambiar la configuración.


<a id="encrypted-v2-task-recovery"></a>

## Recuperación de tareas cifradas v2

`agentTaskRecovery` es una ruta de compatibilidad experimental para tareas v2 cifradas en backend que alcanzan un proveedor encaminado. Dos formas de solicitud califican: un padre nativo ChatGPT que genera un hijo v2 enrutado, y un hilo en vivo cambió de un modelo nativo ChatGPT a uno enrutado, cuyo historial reproduce una mensaje de agente encriptado en cada turno posterior ([#4089](https://github.com/lidge-jun/opencodex/issues/4089)) Está deshabilitado por defecto. Cuando explícitamente habilitada y la tarea enrutada final contiene una carga útil de Fernet ilegible, opencodex utiliza una solicitud de paso Responses sin procesar a la
`https://chatgpt.com/backend-api/codex/responses` extremo con autenticación en modo directo. ChatGPT devuelve la asignación de texto plano a través de una llamada a función forzada; opencodex luego convierte solo ese elemento de tarea a un mensaje de usuario estándar antes del envío del proveedor encaminado. Direct enrutado recuperación, repetición del historial en caché y el detector de tareas ilegibles reconocen los cuatro codex-rs tipos de agente-mensaje: `NEW_TASK`, `MESSAGE`, `FOLLOWUP_TASK`, y `FINAL_ANSWER`. Combo recuperación sigue limitado a los giros de niños engendrados. A `FINAL_ANSWER` El envoltorio puede omitir `Task name` línea. La recuperación entonces no tiene ninguna dirección del encabezado para comparar con el destinatario del artículo, de modo que la sola comprobación cruzada no se ejecuta; la comparación del remitente y el alcance de la caché, que aún vincula al destinatario estructurado, No han cambiado.

Esto no es descifrado local y no corrige el protocolo de cable Codex. Depende de los indocumentados Comportamiento del backend ChatGPT y puede dejar de funcionar después de un cambio en el backend. La asignación recuperada es salida del modelo, no es un texto plano criptográficamente verificado, por lo que la fidelidad byte por byte no es garantizado. Un error de caché con alcance puede agregar una solicitud ChatGPT autenticada, consumir cuota de cuenta y agregar latencia antes de la solicitud enrutada. Solicitudes concurrentes para la misma tarea de ámbito comparten una solicitud de recuperación. El inicio imprime una advertencia cada vez que la función está habilitada.

La admisión y la retención son deliberadamente estrechas:

- La recuperación solo está disponible mientras el proxy está vinculado al bucle de retorno;
- Solo es elegible un llamador nativo de Codex con un par portador/cuenta ChatGPT coincidente. Este es el forma de credencial utilizada por el canónico `openai` proveedor con `authMode: "forward"`; usos de recuperación solo el par en la solicitud entrante y nunca sustituye la autenticación de clave API, otra credencial de proveedor u otra cuenta Codex;
- Llamadas usando `x-opencodex-api-key`, `x-api-key`, credenciales genéricas API o una admisión proxy mantener en secreto lo existente `unreadable_encrypted_agent_task` fracaso;
- Las credenciales ChatGPT sin procesar se envían solo al punto final ChatGPT codificado y nunca se colocan en el cuerpo de la solicitud, registros, claves de caché o solicitud del proveedor; el ámbito de caché en memoria usa solo un resumen de claves aleatorias de proceso de la credencial y cuenta de la persona que llama;
- La solicitud de recuperación solo se envía `authorization`, la coincidencia `chatgpt-account-id`,
  `originator`, y opcional `openai-beta` y `user-agent` metadatos; Conjuntos de opencodex `content-type`
  y `accept` en sí mismo, y ningún otro encabezado de llamada cruza este límite;
- El texto plano recuperado nunca se registra ni persiste; la caché local del proceso es credencial, padre o thread-, y ciphertext-scoped, expira después de 15 minutos, y está limitado por ambas entradas configuradas cuenta (200 por defecto, 512 máximo) y 8 MiB total;
- cualquier sobre mal formado, recuperación fallida, tiempo de espera o error de validación conserva el error cerrado; la cancelación del cliente devuelve 499. Ninguno de los dos caminos reenvía texto cifrado a la proveedor de servicios.

La recuperación acepta una ejecución consecutiva de hasta 32 partes cifradas en forma de Fernet completas, con como máximo 2 MiB de texto cifrado combinado. Las partes conservan su orden y sus límites en un solicitud. La identidad de caché incluye la secuencia; la entrada original se revalida antes de la asignación reemplazo. Los fallos HTTP conservan la razón de diagnóstico limitada existente. No desencadenan una Intento interno a menos que `retries` se establece: con un valor de 1 a 2, opencodex vuelve a enviar el mismo solicitud admitida solo en un estado transitorio ascendente (500/502/503/504/52x) o un estado de transporte fracaso, después de un corto retroceso, y aún dentro de la misma credencial, fecha límite y vuelo compartido. Los estados de terminal y la salida de recuperación no válida nunca vuelven a intentarlo.

Split tokens no se reconstruyen para la recuperación. Una carrera acotada cuya concatenación exacta tiene La estructura de Fernet permanece clasificada como texto cifrado a través de la normalización de la ranura de texto plano. Si la tarea no tiene texto legible independiente, falla cerrado sin una recuperación o solicitud de proveedor de ruta. El texto legible independiente conserva la política de contenido mixto existente. Otras representaciones de fragmentos permanecer sin soporte; esto no establece la recuperación general token-split o multipart de origen fidelidad.

<a id="threat-model"></a>

### Modelo de amenazas

Esta ruta de acceso supone que el llamador nativo local Codex ya tiene una credencial válida ChatGPT y que el punto final fijo ChatGPT es de confianza para autenticarlo. Protege contra proxy genérico/API-clave los llamantes que utilizan la función como un oráculo de texto plano, redireccionando las credenciales a otro destino, Reutilización de caché entre cuentas o entre hilos, y registro o persistencia de datos sensibles. Admisión comprueba el emisor token, la audiencia, el cliente Codex, los límites de caducidad/no antes y la coincidencia exacta de la cuenta antes cada búsqueda de caché; el punto final sigue siendo la autoridad de firma.

No protege contra otro proceso que se ejecuta como el mismo usuario del sistema operativo, un ChatGPT comprometido modelo de backend o recuperación, inyección rápida dentro de la tarea cifrada, errores de transcripción del modelo, o inspección de memoria del proxy en ejecución. Por lo tanto, la salida de recuperación debe tratarse como no confiable. modelo en lugar de texto plano autenticado.

```json
{
  "agentTaskRecovery": {
    "enabled": true,
    "model": "gpt-5.6-sol",
    "timeoutMs": 45000,
    "cacheEntries": 200,
    "retries": 0
  }
}
```

Habilite esto solo cuando la solicitud autenticada adicional, el uso de cuota, el límite de texto en proceso plano, y la dependencia del backend privado son aceptables. Prefiero un hijo nativo ChatGPT o v1 heterogéneo delegación cuando no lo son.

Esta ruta de recuperación se aplica a los niños con enrutamiento directo y el combo cifrado. `NEW_TASK` desove. En más de 32 solicitudes de recuperación pueden estar activas a la vez; errores adicionales fallan cerrado. Un combo con un El objetivo nativo canónico disponible todavía envía texto cifrado directamente; la recuperación se ejecuta solo cuando no El objetivo nativo es seleccionable. Después de la actualización de una cuenta Pool almacenada y la repetición de la misma cuenta se agotado, la recuperación puede usar la credencial de llamada entrante para un destino enrutado disponible sin Probar otra cuenta nativa. Las denegaciones de políticas siguen siendo terminales. Recuperación fallida, objetivos agotados, o los objetivos no disponibles aún no se cierran sin reenviar el texto cifrado a un proveedor enrutado.

<a id="effort-caps"></a>

## Tapas de esfuerzo

Las tapas se aplican solo a la función de colaboración v2: un turno principal califica cuando sus herramientas exponen v2, mientras que un niño califica cuando lleva codex-rs exacto `x-openai-subagent: collab_spawn` o
`"subagent_kind": "thread_spawn"` Marcadores en `x-codex-turn-metadata`, incluso si las herramientas de hoja ya no exponen la colaboración. V1 giros principales, `multiAgentMode: "v1"`, compactación, revisión, y la consolidación de memoria gira tapas de derivación.

Los topes solo reducen el esfuerzo. Se ajustan al peldaño más alto anunciado en o por debajo de la tapa. Si un modelo tiene sin control de esfuerzo o sin configuración de peldaño compatibles, opencodex elimina el esfuerzo y permite que el proveedor predeterminado aplicar. `max` y `ultra` son aceptados, mientras que el panel ofrece `low` a través `xhigh`.

Las tapas configuradas también se aplican a los giros Chat Completions nativos elegibles que no llevan ningún pin de esfuerzo del modelo. La asignación de cable del proveedor se ejecuta cuando se aplica un pin o cuando un límite cambia el valor; un valor nativo de la persona que llama mantiene su ortografía original de cable cuando no ocurre nada.

Para obtener una explicación orientada a los principiantes de v1, por defecto y v2 comportamiento, consulte
[Superficies de los subagentes](/es/guides/sub-agent-surface/).

<a id="global-model-effort-pins"></a>

## Pins de esfuerzo modelo global

La raíz opcional `modelPinnedEfforts` mapa llena o anula las opciones de esfuerzo entrantes cuando ni se configura un pin de modelo de proveedor ni un pin de todo el proveedor. Por ejemplo:

```json
{
  "modelPinnedEfforts": {
    "example-provider/example-model": "high"
  }
}
```

La búsqueda comprueba el selector final antes de la normalización del proveedor-prefijo, entonces el
`provider/model` destino, luego su ID de modelo ascendente desnudo. Alias combo originales y ID de selector de fila de esfuerzo sintético no son claves de pin globales; configure el destino concreto. Los valores predeterminados de esfuerzo y combo de fila sintética se conservan como la entrada efectiva antes de fijar. Cada destino seleccionado resuelve su propio pin, a continuación, tapas aplicables y la normalización del cable. Las solicitudes de compactación están exentas. `none` significa omisión de esfuerzo y comportamiento predeterminado del proveedor, No garantiza la incapacidad de razonamiento.

`GET /api/effort-caps` Incluye el mapa. `PUT /api/effort-caps` acepta `modelPinnedEfforts`
junto con los límites existentes: los campos omitidos permanecen sin cambios, `null` Despeja el mapa, y un mapa entrada establecida para `null` o `""` Elimina solo esa clave. Las actualizaciones combinadas no válidas dejan ambas tapas y pines sin cambios. Guardar un pin no altera la lista de subagentes destacados.
