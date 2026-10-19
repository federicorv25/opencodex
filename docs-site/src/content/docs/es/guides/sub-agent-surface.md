---
title: "Superficie del subagente (v1 / base / v2)"
description: "Controle cómo Codex genera y gestiona subagentes en todos los modelos."
---

<a id="what-sub-agents-are"></a>

## Qué son los subagentes

Un subagente es un trabajador Codex separado que el agente principal puede crear para una tarea enfocada. Tiene su contexto y herramientas propias, por lo que varias tareas independientes pueden ejecutarse en paralelo. opencodex controla qué La superficie de colaboración Codex expone a esos trabajadores, qué modelos ofrece Codex para ellos y cómo El modelo fallido puede retroceder. No decide cuándo su agente principal debe delegar.

<a id="modes"></a>

## Modos

Elige el modo para **Nuevas sesiones**. Las sesiones existentes mantienen la superficie con la que comenzaron.

| Modo | Lo que obtiene Codex | Quién debe escogerlo |
| --- | --- | --- |
| **v1** (predeterminado) | Namespaced clásico `spawn_agent`, `send_input`, `resume_agent`, y `close_agent` herramientas. Un engendro puede seleccionar otro modelo directamente. | Cualquier persona que delega a través de los proveedores, especialmente los niños nativos. Esto es lo que una nueva instalación de barcos con. |
| **base** | Alfileres del modelo ascendente: GPT-5.6 Sol/Terra usan v2, Luna usa v1, y los modelos sin pines siguen a Codex `multi_agent_v2` bandera característica. | Operadores que desean pines por modelo de Codex y cuyos modelos padre e hijo se sientan en el mismo lado del límite del proveedor. Tenga en cuenta que sus pines ponen Sol y Terra en la v2. |
| **v2** | Plano `spawn_agent`, `send_message`, `followup_task`, `interrupt_agent`, y herramientas de lista de agentes, con sesiones concurrentes. | Los usuarios que desean el flujo de trabajo concurrente más reciente y entienden la herencia del modelo y la limitación de tareas cifradas a continuación. |

En marcha **v2**, una opción **Mantener ChatGPT en v1** interruptor (`keepNativeChatGptOnV1`) hojas Sol/Terra en la superficie v1 para que aún puedan generar Grok o Claude. Los padres nativos ChatGPT cifran v2
`NEW_TASK` cuerpos; los modelos enrutados no pueden leerlos. Los padres enrutados se quedan en la v2, donde las tareas del niño Son texto plano. OpenCodex desactiva el `multi_agent_v2` para este híbrido porque Codex aplica esa anulación antes de los pines de catálogo por modelo. Esto es un cambio *interior* v2, no a Cuarto modo de catálogo.

:::tip[¿Tienes dudas?]
Quédate ahí. **v1**, el valor predeterminado enviado. Seleccionar **base** o **v2** solo cuando tus padres y tu hijo modelan sentarse en el mismo lado del límite del proveedor — en ambos, una tarea entregada de un modelo ChatGPT a un Enrutado uno llega cifrado y falla. El panel pregunta antes de cualquiera, y los enlaces a
[Por qué v1 es el valor predeterminado](/es/guides/subagent-v1-default/).
:::

<a id="model-switches-and-side-chat-compaction"></a>

## Interruptores de modelo y compactación de chat lateral

Codex puede compactar el historial heredado antes del primer turno de un chat lateral o después de un cambio de modelo. Un disparador compara los modelos anteriores y de destino. `comp_hash` marcadores de compatibilidad: cuando ambos están presentes y difieren, Codex se compacta incluso si el historial se ajusta al contexto del destino.

OpenCodex representa compatibilidad desconocida para modelos enrutados como `comp_hash: null`, en lugar de Inventando un `"opencodex"` marcar o copiar uno de una plantilla nativa. Catálogo reconstruye también claro esos marcadores antiguos en las filas de OpenCodex retenidas durante una interrupción de detección del proveedor. modelos nativos y explícitos alias Codex-forward mantienen sus marcadores ascendentes, por lo que la incompatibilidad nativa genuina los cheques siguen siendo aplicables. Este comportamiento es independiente de la superficie del subagente v1/v2 y del modelo. configurado para realizar la compactación.

Todavía se aplica el contexto normal y la compactación de límite token. Este cambio elimina el sintético Desajuste de hash; no selecciona qué mensajes visibles hereda un chat lateral ni restaura el original mensajes de un contexto ya compactado. El soporte de contenido del proveedor sigue siendo una restricción separada.

<a id="external-task-input"></a>

## Entrada de tarea externa

Codex puede entregar la entrada inicial o el seguimiento de una tarea en un sobre con forma de resultado Sin un `call_id`. En las rutas traducidas, OpenCodex reconoce solo la información completa.
`function_call_output` forma con nonblank `id`, `name` y `namespace` y apoyado salida de texto/imagen, luego lo trata como un turno de usuario. Esto también inicia la nueva conversación. límite durante la continuación y borra el razonamiento pendiente del giro anterior. La guía del desarrollador generado se coloca antes de la tarea actual en ambos analizados mensajes e historial en bruto guardado, preservando el mismo orden cuando se reproduce ese historial.

Los sobres mal formados, vacíos, opacos o incompletos aún fallan en la validación. Herramienta real Los resultados mantienen sus requerimientos `call_id`; el paso nativo y la compactación enrutada (portátil) aplican el mismo mapeo de turnos de usuario a sus cuerpos crudos; el nativo directo `/responses/compact` forward mantiene su manejo de entrada en bruto existente. Véase [el contrato del adaptador](/es/reference/adapters/#external-task-input-on-translated-responses-routes).

<a id="how-it-works"></a>

## Cómo funciona

El modo seleccionado controla el `multi_agent_version` campo en cada entrada del catálogo Codex lee:

- **v1** sellos `multi_agent_version = "v1"` en cada modelo.
- **base** restaura los pines de de origen. Las entradas no marcadas siguen al nativo `multi_agent_v2` bandera característica.
- **v2** sellos `multi_agent_version = "v2"` en cada modelo, excepto cuando **Mantener ChatGPT en v1** está habilitado: ChatGPT-nativo filas estancia `"v1"` y las filas enrutadas o combinadas permanecen `"v2"`.

opencodex aplica esto como el pase final tanto a la `/v1/models` catálogo y el catálogo sincronizado en el disco. Es por eso que un cambio de modo afecta a las sesiones recién creadas de App, CLI y TUI de manera consistente.

Para una lista v2, la elegibilidad tiene tres estados: una entrada sellada `"v2"`explícitamente establecido a `null`, o Con no `multi_agent_version` El campo es elegible. Una auténtica `"v1"` El pin está excluido porque dice que el modelo pertenece a la otra superficie de colaboración.

<a id="delegation-model-and-effort"></a>

## Modelo de delegación y esfuerzo

El panel de control **Delegación de subagentes** controla tres configuración relacionadas:

- `injectionModel` es el modelo de trabajador preferido nombrado en la guía opencodex.
- `injectionEffort` es el opcional `reasoning_effort` para solicitar dicho modelo.
- `injectionPrompt` reemplaza el texto de guía v2 incorporado.

¿No sabes a qué modelo delegar? **Sugerir** al lado del modelo de delegación pide un breve descripción de la obra Codex generalmente manos fuera, tamaños con una llamada a su modelo predeterminado Codex, y propone el modelo más barato suficiente y un esfuerzo de la lista que ofrece el recolector, con el razonamiento y las señales que lo moverían hacia arriba o hacia abajo. Nada cambia hasta que tú eliges
**Utilice este**, que ahorra exactamente como elegir el modelo y el esfuerzo a mano. Los niveles provienen de
`codexRoleTiers` o precio, como en [función auto-asignación](/es/guides/integrations/#auto-assign).

`multiAgentGuidanceEnabled` por defecto a encendido y es el conmutador maestro para la guía de autoría opencodex en ambas superficies. Apagarlo suprime tanto el bloque de designación v2 como el texto proactivo v1.

Para las solicitudes Responses sin estado en forma de matriz, opencodex coloca la guía generada después del líder Metadatos del sistema y del desarrollador, incluido el desarrollador `additional_tools`Antes de la conversación entrada. Declarativo `previous_response_id` Las continuaciones reutilizan la guía etiquetada solo cuando coincide con la última elemento etiquetado en su prefijo de repetición de confianza. Otra orientación generada se reutiliza cuando se genera una dirección exacta. elemento desarrollador existe en ese prefijo. Cuando la guía cambia, el protocolo de la herramienta líder permanece primero y el reemplazo se inserta antes de la entrada conversacional actual.

Estas son instrucciones para el agente principal, no un router de generación del lado del proxy. En v2, una bifurcación de historia completa hereda el modelo padre y rechaza las anulaciones de modelo o esfuerzo. Por lo tanto, la guía le dice a Codex que uso `fork_turns: "none"` (o un conteo de giros parcial positivo, como `"3"`) al pasar `model` o
`reasoning_effort`, y para hacer que el mensaje de tarea sea autónomo.

Personalizado `injectionPrompt` El texto puede usar los cuatro marcadores de posición:

| Marcador de posición | Reemplazado por |
| --- | --- |
| `{{model}}` | El modelo preferido efectivo para esta solicitud. Un nativo desnudo `injectionModel` es calificado por cuenta solo cuando la solicitud se dirige a un selector de cuenta explícito. Un valor desnudo no resuelto o ambiguo se convierte en una cadena vacía; un id explícito no resuelto calificado o encaminado permanece sin cambios. |
| `{{effort}}` | El configurado `injectionEffort`o una cadena vacía |
| `{{roster}}` | La lista resuelta de selector visible y superficie compatible |
| `{{fallback}}` | La guía de respaldo global configurada |

La guía v2 incorporada tiene un presupuesto de 700 caracteres. Si se excede el presupuesto, opencodex cae primero la lista en lugar de truncar las instrucciones básicas de generación. Solo fuegos de guía incorporados cuando se resuelve un modelo preferido, una lista elegible o una cadena de reserva. Un configurado `injectionModel`
es suficiente para representar un mensaje personalizado; si un valor desnudo no puede resolverse de forma única, `{{model}}`
se expande a una cadena vacía.

En v1, opencodex inyecta la misma orientación de delegación proactiva que el preajuste recomendado v2 solamente en `max` o `ultra` esfuerzo. Solo cambia el desencadenante de delegación: no se solicita delegación por separado necesario; las instrucciones del usuario, la autoridad, el alcance de la tarea y las reglas de herramienta de colaboración aún se aplican. No agrega un modelo preferido, una lista, una lista de reserva o un mensaje personalizado en la v1. En el modo de código Codex, opencodex ve las herramientas v1 cuando `exec` La descripción de la herramienta los enumera. Cuándo
Codex los defiere para la búsqueda de herramientas, lo que hace para cada opencodex modelo de catálogo, opencodex
se basa en la lista de herramientas diferidas Codex El escritorio envía con la conversación; si esa lista
`multi_agent_v1`, se añade la orientación proactiva. Un cliente Codex que no envía la lista da opencodex no muestra que v1 esté disponible, por lo que la guía no se agrega allí.

El default-off `syncCodexSubagentDefaults` La opción está separada de la orientación. Cuando opencodex posee El enrutamiento, sincronización o reinicio Codex activo puede escribir los valores seleccionados como propiedad del marcador
`[agents] default_subagent_model` y `default_subagent_reasoning_effort` entradas en Codex TOML. opencodex actualiza o elimina solo los campos que llevan sus marcadores. Si cualquiera de los campos objetivo es propiedad del usuario, el par se deja sin cambios en lugar de parcialmente escrito; ambiguo TOML se rechaza sin un Escribe. Los administradores de proveedores externos y el enrutamiento raíz propiedad del usuario también siguen siendo autorizados.

<a id="fallback-chains"></a>

## Cadenas de fallback

Para un trabajador generado, opencodex crea este orden de prioridad:

1. El modelo primario solicitado.
2. Una cadena por modelo de `subagentModelFallbackByModel` en la configuración opencodex, con clave El modelo primario solicitado.
3. El Global `subagentModelFallback` lista en la configuración opencodex.

Las cadenas de reserva por función pertenecen a la configuración opencodex, no a la
`$CODEX_HOME/agents/*.toml`. Codex 0.146+ estrictamente deserializa los archivos de rol del agente y rechaza `model_fallback` como un campo desconocido, que omite toda la definición de rol (1190 libras esterlinas). opencodex todavía puede leer un legado `model_fallback` línea de la TOML para Compatibilidad con versiones anteriores, pero `ocx doctor` advierte al respecto y Codex sí ignorará El rol afectado.

Los identificadores de modelos duplicados se eliminan mientras se conserva la primera aparición. Durante la selección, opencodex omite candidatos que están deshabilitados, no enrutables, respaldados por un proveedor discapacitado, marcados como insalubres, dentro de un tiempo de reutilización, falta una cuenta Codex agrupada utilizable o más allá del umbral de cuota configurado. Las sondas de disponibilidad se almacenan en caché para `subagentModelFallbackPollMs` (60 segundos por defecto).

Fallback no hace legibles las tareas cifradas incompatibles. Cuando la tarea hijo está encriptada para ChatGPT, la selección está restringida a los objetivos nativos canónicos ChatGPT y a la clave directa Responses rutas explícitamente confiables con `allowEncryptedV2AgentTasks: true`Aunque otro modelo externo aparece antes en la cadena. Los combos siguen siendo canónicos.

<a id="encrypted-v2-task-delivery"></a>

## Entrega de tareas cifradas v2

Codex puede enviar una tarea hija nativa a enrutada v2 solo como backend encriptado `encrypted_content`. Eso carga útil puede ser leída por el backend nativo ChatGPT, pero no por un proveedor externo. Este es el conocidos [Limitación 92](https://github.com/lidge-jun/opencodex/issues/92).

opencodex falla de forma segura en lugar de reenviar una tarea vacía o ilegible:

- Una ruta no nativa directa no elegible devuelve HTTP 400 con
  `error.code = "unreadable_encrypted_agent_task"` y no hace eco del texto cifrado. Un elegible proveedor directo de llave-auth Responses que explícitamente opta por
  `allowEncryptedV2AgentTasks: true` recibe el texto cifrado opaco y evita este error.
- Un combo primero considera los objetivos canónicos nativos ChatGPT. Si no hay ninguno disponible o sus intentos Cuando se agotan, la recuperación habilitada puede hacer que la tarea sea legible para un destino enrutado disponible. Sin una recuperación exitosa y un objetivo elegible, el texto cifrado ilegible nunca se reenvía.
- Una tarea de texto plano legible mantiene la ruta normal y el comportamiento de reserva.

Las opciones de recuperación son seleccionar un hijo nativo ChatGPT, confiar explícitamente en una clave directa-auth Responses relé que puede consumir la carga útil opaca, agregar un objetivo nativo ChatGPT al combo, usar v1 para delegación de proveedor heterogéneo, o reenviar la tarea como texto sin formato v2 `agent_message` contenido cuando Tú controlas a la persona que llama.

Un experimento, desactivado por defecto `agentTaskRecovery` La opción puede recuperar este nativo específico a-enrutado forma a través de un paso Responses sin procesar a la ChatGPT fija `/responses` Endpoint usando la forma de credencial entrante utilizada por el canónico `openai` proveedor con `authMode: "forward"`. La recuperación solo está disponible mientras el proxy está vinculado a loopback. Nunca sustituye a API-key autenticación, otra credencial de proveedor u otra cuenta Codex. Solo `authorization`, a juego
`chatgpt-account-id`, `originator`, y opcional `openai-beta`/`user-agent` se envían metadatos;
`content-type` y `accept` se generan localmente, y ninguna otra cabecera de llamada cruza el límite. Consume la cuota, agrega latencia, retiene brevemente el texto plano recuperado en una caché limitada en memoria, y depende del comportamiento de backend ChatGPT indocumentado. Como un modelo devuelve el texto recuperado, La fidelidad byte por byte no está garantizada. Rechaza las llamadas proxy genéricas / API-key. Falló la recuperación antes de que cualquier intento nativo regrese
`unreadable_encrypted_agent_task`Después de que los intentos nativos han fallado, su último error se mantiene. Véase
[Configuración del agente: recuperación de tareas cifradas v2](/es/reference/configuration/agents/#encrypted-v2-task-recovery)
para el límite de confianza completo y la configuración.

La misma recuperación también cubre un hilo en vivo cambiado de un modelo nativo ChatGPT a uno enrutado. Tal hilo reproduce un mensaje de agente cifrado en cada turno posterior, así que antes
[#4089](https://github.com/lidge-jun/opencodex/issues/4089) fracasó a cada paso y el La única solución era comenzar un nuevo hilo. Ese cambio de turno no es un engendro, por lo que el enrutado path ya no restringe la recuperación a los turnos de niño generados; la recuperación combinada aún lo hace.

El enrutamiento combinado prefiere un destino canónico nativo seleccionable ChatGPT para las tareas cifradas. Si ninguno es utilizable, o los intentos de autorización nativa se han agotado, una recuperación hacer que la tarea sea legible para un destino enrutado disponible. Toda la confianza en la recuperación y la no persistencia Los protectores anteriores aún se aplican; un objetivo nativo configurado pero deshabilitado o que se enfríe no bloquea este La cancelación nunca se convierte en un error de tarea ilegible.

<a id="rejected-encrypted-history"></a>

## Rechazado el historial cifrado

Un servidor Responses ascendente puede rechazar partes cifradas en funciones/herramientas personalizadas anteriores salida o `agent_message` contenido con `Encrypted function output content could not be decrypted or decoded.`. Antes cualquier salida se confirma, opencodex sustituye esas piezas con `[encrypted content omitted]`
y reconstruye la solicitud una vez. El contenido legible circundante permanece intacto; el El contenido omitido no es descifrado ni recuperado por este reintento.

Si la solicitud reconstruida recibe otra SSE vacía `error` seguido por EOF, ambos relés Los modos preservan el mensaje de error en `response.failed` terminal en lugar de informar
`adapter_eof`. Otros de origen `response.failed` los eventos siguen siendo errores SSE. Esta historia la recuperación no cambia las restricciones de entrega de tareas v2 cifradas descritas anteriormente.

<a id="changing-the-mode"></a>

## Cambiar el modo

### GUI

- **Panel** → primera celda de estado: elija **v1**, **base**, o **v2**.
- **Modelos** → control segmentado de la fila superior: elija el mismo modo global.
- **Panel** → **Delegación de subagentes**: establece el modelo/esfuerzo de guía y la opción de opt-in por defecto nativa.
- **Subagentes**: elija y ordene la lista y configure la cadena de reserva global.

### CLI

Uso `ocx v2` para la superficie de colaboración y la configuración de características nativas:

```bash
ocx v2 status
ocx v2 mode v1
ocx v2 mode default
ocx v2 mode v2
ocx v2 threads 8
```

Uso `ocx agent` para configuración de delegación, lista, límite de esfuerzo y reserva:

```bash
ocx agent status
ocx agent injection set --model anthropic/claude-sonnet-5 --effort xhigh
ocx agent injection suggest "read-only searches across the repo" --apply
ocx agent subagents set gpt-5.6-sol,anthropic/claude-sonnet-5
ocx agent fallback set gpt-5.6-luna,xai/grok-4.5 --poll-ms 60000
ocx effort set --subagent max
```

El nivel superior `ocx effort` comando es el punto de entrada canónico para la inspección de esfuerzo y tapas (e.g. `ocx effort high`, `ocx effort status`, `ocx effort clear`), con `ocx agent effort` Se conserva como una ruta compatible con versiones anteriores. Observe que: `ocx effort clear` elimina los caps activos del agente principal y el subagente al mismo tiempo que deja la delegación `injectionEffort` sin tocar (utilizar `ocx effort set --injection -` o `ocx agent injection set --effort -` ej., para eliminar el esfuerzo de inyección).

Pase `-` Para borrar un nullable `ocx agent injection` valor, o usar el valor relevante `clear` Acción por a lista o lista de reserva. Ver la [Referencia CLI](/es/reference/cli/) para todas las familias de mando.

### API

La gestión API expone coincidencia `GET` y `PUT` puntos finales:

| Punto de conexión | Administra |
| --- | --- |
| `/api/v2` | Modo de superficie, bandera de función nativa y configuración de hilos |
| `/api/injection-model` | Modelo preferido, esfuerzo, prompt personalizado, orientación y sincronización predeterminada nativa |
| `/api/effort-caps` | Límites máximos de esfuerzo del agente principal y del subagente |
| `/api/subagent-models` | Lista de pedidos de hasta cinco modelos |
| `/api/subagent-model-fallback` | Orden de reserva global e intervalo de encuesta |

Por ejemplo:

```bash
curl -X PUT http://localhost:10100/api/v2 \
  -H 'Content-Type: application/json' \
  -d '{"multiAgentMode":"v2"}'

curl -X PUT http://localhost:10100/api/injection-model \
  -H 'Content-Type: application/json' \
  -d '{"model":"anthropic/claude-sonnet-5","effort":"xhigh"}'
```

## FAQ

<a id="does-choosing-a-delegation-model-force-codex-to-spawn-it"></a>

### ¿La elección de un modelo de delegación obliga a Codex a generarlo?

No. La guía puede recomendar un modelo, y la sincronización nativa predeterminada puede proporcionar un Codex predeterminado, pero el El agente principal todavía decide si delegar.

<a id="why-did-my-v2-child-use-the-parent-model"></a>

### ¿Por qué mi hijo v2 usó el modelo de padre?

Un fork v2 de historia completa hereda el modelo padre. Usar un engendro que establece `fork_turns` a `"none"` o un recuento parcial positivo antes de pasar una anulación de modelo o esfuerzo.

<a id="why-is-a-configured-model-missing-from-the-v2-roster"></a>

### ¿Por qué falta un modelo configurado en la lista de v2?

Puede estar escondido por el selector, fuera del límite de visualización de cinco modelos, falta en el catálogo o está anclado. a v1. A `"v2"`, `null`, o el valor de superficie ausente es elegible; un `"v1"` El pin no lo es.

<a id="do-mode-changes-affect-running-sessions"></a>

### ¿Los cambios de modo afectan a las sesiones de running?

No. Inicie una nueva sesión Codex después de cambiar el modo. Si un host de aplicación de larga duración todavía muestra rancio catalogar estado, ejecutar `ocx sync` y reinicie esa superficie Codex.

<a id="what-happens-when-opencodex-cannot-trust-the-catalog"></a>

### ¿Qué sucede cuando opencodex no puede confiar en el catálogo?

opencodex compara el catálogo de modelos en disco con la hora de inicio de cada app-servidor Codex propiedad por el usuario actual, produciendo uno de los cuatro estados:

| Estado | Significado | v2 Orientación |
|---|---|---|
| `fresh` | Todos los servidores de aplicaciones comenzaron después de que se escribió el catálogo | Orientación completa: modelo preferido, plantel, fallbacks |
| `not_running` | No se detectó ningún servidor de aplicaciones | Orientación completa |
| `stale` | Al menos un servidor de aplicaciones precede al catálogo | **Sin guía de modelo de autoría opencodex** |
| `unknown` | La comparación no se pudo hacer | **Sin guía de modelo de autoría opencodex** |

Porque `stale` y `unknown`, opencodex retiene sus propias reclamaciones derivadas del disco — modelo preferido, lista, — porque el Codex en ejecución puede no ser capaz de generar lo que el disco Catálogo de anuncios.

Lo hace **no** indicar al modelo que deje de configurar `model` o `reasoning_effort`. Esta observación es global en todos los servidores de aplicaciones para el usuario, mientras que una solicitud entrante no lleva ninguna identidad de remitente, por lo que un proceso rancio no puede atribuirse a la petición que tenemos delante. Prohibir las anulaciones en ese base bloquearía las opciones activas `spawn_agent` herramienta anuncia legítimamente, para una sesión Puede ser fresco. El esquema de la herramienta activa sigue siendo autoritario.

`unknown` No es sinónimo de `stale`. Significa que la comparación en sí falló — un catálogo ilegible timestamp, un tiempo de inicio de proceso ilegible o una enumeración de proceso fallido — y se informa Por separado por `ocx doctor`. `stale` borra solo después de que cada app-server Codex detectado se inicie después el catálogo final escribir; no necesariamente claro `unknown`.

En Windows, esta comprobación de aviso utiliza el descubrimiento asíncrono de PowerShell/CIM en la ruta de solicitud v2. Las comprobaciones en frío simultáneas comparten un descubrimiento en vuelo. Los estados observados se almacenan en caché durante cinco segundos; an `unknown` el fallo se almacena en caché durante solo 250 milisegundos, por lo que un error transitorio CIM se reintenta rápidamente. A lenta o defectuosa consulta CIM puede retrasar o suprimir solo la guía del modelo OpenCodex-authored; no bloquear el bucle de eventos Bun, `/healthz`o tráfico proxy no relacionado. Explícito CLI/ciclo de vida del servicio Las operaciones retienen el colector de procesos síncrono, cerrado por error, porque pueden señalizar procesos.

Solo un cambio real cuenta. Una sincronización cuyo resultado es byte-idéntico al catálogo ya en disco deja el archivo intacto, por lo que reiniciar el proxy o volver a sincronizar un conjunto de modelos sin cambios no hacer que un Codex en ejecución se vea obsoleto.

<a id="reasoning-effort"></a>

### Esfuerzo de razonamiento

`injectionEffort` afecta solo a la orientación del trabajador delegado y, cuando está explícitamente habilitada, a la Codex nativa sub-agentes predeterminados. No cambia el esfuerzo de la sesión de padres. `ultra` es un top orientado al cliente nivel que Codex convierte en `max`; opencodex luego mapea o fija el valor para el proveedor seleccionado.

<a id="context-cap"></a>

### Cap. de contexto

El límite de contexto del modelo es independiente del modo de subagente. Configurarlo en la página Modelos; nativo Los modelos OpenAI conservan sus ventanas de contexto real.

El experimental `plaintextV2AgentMessages` campo no está establecido en una configuración nueva y se ejecuta solo cuando se establece a `true`. La persona que llama debe usar el cable Responses, y el destino final debe usar
`adapter: "openai-responses"`, `authMode: "forward"`y la base exacta URL
`https://chatgpt.com/backend-api/codex`. OpenAI Proveedores de clave API, pasarelas compatibles personalizadas, Se excluyen las rutas a otros proveedores y las personas que no llaman a Responses. Para un nuevo nativo elegible ChatGPT v2 tool call, la opción asigna alias con alcance de solicitud al espacio de nombres y tres reservados nombre de la herramienta de mensajes, elimina el marcador del mensaje y restaura las identidades originales en el respuesta. Se maneja
`spawn_agent`, `send_message`, y `followup_task` y no añade ninguna solicitud de recuperación. HTTPS permanece cifrado, pero el texto de la tarea se puede conservar en el historial de Codex, las solicitudes del proveedor de rutas y las solicitudes locales respuesta/estado de depuración. El texto cifrado existente no cambia, y la opción depende de los documentos indocumentados. Comportamiento de ChatGPT y Codex. Véase
[Configuración del agente: Mensajes de agente de texto sin formato v2](/es/reference/configuration/agents/#plaintext-v2-agent-messages). Si una respuesta ChatGPT transmitida no contiene ningún tipo de contenido, o una que no es `application/json`
ni un flujo de eventos reconocible, opencodex comprueba un prefijo de evento Responses limitado antes de restaurar los nombres de las herramientas de mensajes. Un `application/json` respuesta toma la ruta JSON limitada en su lugar. Los Sonda espera en la mayoría `stallTimeoutSec` por su prefijo, y un cuerpo que permanece en silencio, no reconocido, o ilegible falla cerrado en lugar de llegar a Codex como una respuesta exitosa.
