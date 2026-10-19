---
title: "Configuración del proveedor"
description: "Entradas de proveedores, autenticación, puntos finales, catálogos de modelos, cuotas, límites de contexto y opciones específicas del proveedor."
---

<!-- Created: 2026-10-16; Updated: 2026-10-18; Version: 1.1 (Vertex endpoint note) -->

Un proveedor le dice a opencodex dónde vive un modelo, qué adaptador de cable habla y cómo se realizan las solicitudes autenticado.

<a id="deepseek-tokens-versus-image-bytes"></a>

## DeepSeek: tokens y bytes de imágenes

DeepSeek documenta un [límite independiente de 48 MiB para el cuerpo de la solicitud](https://api-docs.deepseek.com/guides/files_api/). Una sesión con muchas capturas puede alcanzarlo antes de llenar el contexto de tokens; aumentar `model_auto_compact_token_limit` no lo evita.

Las subidas están **desactivadas de forma predeterminada**. Configura `modelCapabilities: { "deepseek-flash": { deepseekImageFiles: true } }` en tu proveedor si aceptas que las imágenes se guarden por separado en los servidores de DeepSeek durante una hora. Enviar `null` mediante PATCH para ese campo o para la entrada del modelo elimina la opción.

En los modelos que habiliten esta opción y usen las URL oficiales de Responses, los cuerpos de más de 40 MiB reemplazan las imágenes en línea más antiguas por [referencias de Files API](https://api-docs.deepseek.com/guides/files_api/), buscando reducirlos a 32 MiB. Los bytes de las imágenes, el historial y el uso de tokens no cambian. Los archivos solicitan un vencimiento de una hora; las subidas parciales que hayan terminado se conservan hasta vencer, aunque falle la generación. La caché de referencias está acotada, se aísla por credencial y dura como máximo 50 minutos, o menos si el proveedor indica un vencimiento anterior. Un reintento puede reutilizar las subidas completadas; otra credencial sube su propia copia.

Las pasarelas de terceros y Chat Completions conservan su comportamiento. Un `detail: low` explícito mantiene la imagen en línea, porque las referencias de archivo lo ignoran. Si falla, la operación se detiene sin descartar imágenes ni reintentar la generación. La reparación tiene un plazo de subida de 60 segundos, un límite de entrada de 128 MiB y un máximo de dos preparaciones simultáneas; siguen aplicándose el ritmo y la concurrencia del proveedor. El texto demasiado grande y las imágenes que no puedan convertirse aún necesitan compactación. Esta reparación del transporte no amplía la ventana de contexto del modelo.

<a id="context-windows-on-custom-providers"></a>

## Ventanas de contexto en proveedores personalizados

Cuando un proveedor personalizado omite la ventana de contexto de un modelo, OpenCodex puede inferirla desde el paquete Metadatos del modelo. Esto está desactivado por defecto: set `inferContextWindow: true` en el proveedor para convertirlo encendido. Sin él, un modelo sin ventana utiliza la tapa de Contexto habilitada como su ventana, luego la 128k. compatibilidad fallback. Con él, el orden es: límites descubiertos / configurados (las ganancias más pequeñas), Azure metadatos, metadatos de ID de modelo, habilitado Cap Contexto como la ventana, a continuación, 128k. Un habilitado El límite de contexto sigue limitando el resultado. Los proveedores incorporados mantienen su comportamiento existente e ignoran la bandera.

`GET /api/providers` incluye `inferContextWindow` solo cuando se configura, preservando ambos `true` y
`false`. Para cambiarlo, `PATCH /api/providers?name=<provider>` acepta `true`, `false`, o `null` a borrar la configuración y restaurar el comportamiento de omisión; otros tipos devuelven `400`. Omitirlo se mantiene la configuración actual. Un mismo nombre `POST /api/providers` también mantiene una configuración omitida, incluyendo
`false` y cualquier cambio cometido mientras se validaba la salvación. Un booleano enviado gana, incluyendo
`false`Si el valor almacenado es `true`.

```json
{ "providers": { "my-relay": { "adapter": "anthropic", "baseUrl": "https://relay.example/v1", "inferContextWindow": true } } }
```

Las tablas API del proveedor original tienen prioridad sobre las tablas de agregador. Se prefieren los IDs exactos; Las variantes de caso y punto / guión solo se aceptan cuando no son ambiguas. IDs desconocidos, flotando `~` No se adivinan alias y coincidencias conflictivas. OpenAI API Windows no describe Codex límites de suscripción. Una ventana inferida afecta Codexel presupuesto de compactación y otros catálogos de clientes conectados, incluyendo Claude selección de contexto largo, pero se registra por separado de la capacidad de enrutamiento afirmada.

Un ID de modelo coincidente hace **no** Verifique la capacidad real de su relé. Si sirve menos que el ventana de vendedor, conjunto `modelContextWindows` o el proveedor **Cap. de contexto** antes de usar sesiones largas. OpenCodex no habilita una tapa automáticamente ni prueba el modelo. Las solicitudes más pequeñas no probar las obras de ventana inferidas completas. Las ventanas configuradas existentes permanecen bajo control.

<a id="initial-model-selection"></a>

## Selección inicial del modelo

Las nuevas conexiones que no son OAuth esperan una lista de modelos confiable antes de exponer los modelos. Si esa lista contiene al menos 20 filas de ficha Modelos distintas, todos los conmutadores de modelo inician OFF; el proveedor en sí permanece ACTIVE. Las conexiones OAuth y ChatGPT-login mantienen sus valores predeterminados, según el modo de autenticación efectivo.

Esto se ejecuta solo para un nuevo registro de proveedor. Las selecciones existentes sobreviven a las actualizaciones, re-login y reemplazo de claves. Después de la inicialización, habilite los modelos que necesita en Modelos o con la CLI a continuación; la política de llegada de nuevos modelos por separado no cambia. Sustituir `<model-id>` con un ID de la lista.

```sh
ocx models live --provider openrouter
ocx models enable '<model-id>'
ocx models disable '<model-id>'
ocx models provider openrouter on
```

Después del registro GUI o del inicio de sesión OAuth, el cuadro de diálogo de confirmación le permite abrir la página Modelos. CLI registro y comandos de gestión de modelo de impresión de acceso; JSON incluye los próximos pasos estructurados. `--no-wait` informes pendientes de inicio de sesión, no finalización. Comience el proxy con `ocx start` antes de usar los comandos del modelo en vivo.

<a id="zai-coding-plan-quota-endpoints"></a>

## Z.ai Coding Plan puntos finales de cuota

La sonda de cuotas de Z.ai reconoce la base internacional de codificación
`https://api.z.ai/api/coding/paas/v4`, el documentado
[Claude Code Base Anthropic](https://docs.z.ai/devpack/tool/claude)
`https://api.z.ai/api/anthropic`, y el documentado
[Codex Base Responses](https://docs.z.ai/devpack/tool/codex)
`https://api.z.ai/api/v1`. Los tres leen la cuota del monitor internacional Autenticación Bearer; esto no cambia la inferencia URL o implica diferente consumo entre adaptadores. La selección de monitores BigModel CN existente permanece separados. URL de solicitud completa como `/api/v1/responses` No son URLs base de proveedores.

<a id="provider-related-top-level-fields"></a>

## Campos de nivel superior relacionados con el proveedor

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `providers` | `Record<string, OcxProviderConfig>` | — | Mapa del nombre del proveedor a la configuración del proveedor. |
| `openaiProviderTierVersion?` | `2` | establecido por la migración | Marca la proyección OpenAI como completa. |
| `disabledModels?` | `string[]` | — | Modelos ocultos del catálogo de Codex y `/v1/models`, pero no bloqueado de las llamadas proxy directas. Un id enrutado se elimina de los listados. Un id nativo calificado para la cuenta oculta solo esa fila selectora; un id nativo desnudo GPT id oculta la fila desnuda y todas las filas del selector de cuentas para ese modelo. La página Modelos del panel de control solo expone filas nativas enrutadas y desnudas; use este campo de configuración directamente para ocultar una fila calificada por selector. |
| `providerContextCaps?` | `Record<string, number>` | `{}` | Límites de contexto del proveedor activo. Las ventanas ordinarias se bajan; los modelos nativos con una ventana larga compatible pueden expandirse solo hasta su propio techo compatible. |
| `providerContextCapValues?` | `Record<string, number>` | `{}` | Límites del último proveedor seleccionado, retenidos mientras están desactivados. Estos valores no activan un límite. Un valor habilitado tiene prioridad sobre un valor recordado. |
| `contextCapValue?` | `number` | `350000` | Por defecto se utiliza en la primera habilitación. Una habilitación posterior restaura el valor del proveedor seleccionado. Actualizando el valor global con `setAll: true` Solo se habilitaron cambios en las tapas; `setAll: true` sin un valor habilita a todos los proveedores configurados al valor global actual. |
| `codexAccounts?` | `CodexAccount[]` | `[]` | Metadatos de la cuenta del grupo ChatGPT/Codex administrados por Codex Auth. Los secretos viven por separado en `codex-accounts.json`. |
| `pausedCodexAccountIds?` | `string[]` | `[]` | Cuentas excluidas de la selección de Pool hasta que se reanuden, incluyendo la principal `__main__` cuenta cuando se detiene. La pausa manual y el reinicio también actualizan las entradas principales y de grupo existentes para la misma cuenta y espacio de trabajo. |
| `codexUseRemainingQuotaAccountIds?` | `string[]` | `[]` | Las cuentas optaron por usar su cuota incluida restante. Desactiva el cambio de uso proactivo para las cuentas enumeradas; para `__main__`, los umbrales de bloqueo duro cortos/largos efectivos se convierten en 100%. Los umbrales originales permanecen almacenados y se aplican de nuevo después de la desactivación. Todavía se aplican la pausa, la autenticación, la elegibilidad, el tiempo de reutilización y el permiso de crédito pagado. Gestionado por: `ocx account use-remaining openai <id-or-main> on`Esta preferencia persistente no selecciona la cuenta. |
| `creditCodexAccountIds?` | `string[]` | `[]` | Cuentas permitidas para seguir sirviendo desde créditos ChatGPT después de un límite de uso, incluyendo el principal `__main__` cuenta. Upstream no rechaza una cuenta que tiene créditos al 100%; sirve a la solicitud y extrae el saldo. El gasto es opt-in: una cuenta que no aparece aquí se salta por selección, mientras que una de sus ventanas de uso (semanal o mensual, solo mensualmente en planes de 30 días o la ventana de 5 horas) lee el 100% con su restablecimiento aún por delante y regresa una vez que ese restablecimiento pasa. Una lectura semanal o mensual sin un tiempo de reinicio no mantiene la cuenta; una lectura de 5 horas al 100% sin un reinicio lo mantiene solo mientras esa lectura aún está fresca. Cuando no hay otra cuenta disponible, la selección automática no encuentra ninguna en lugar de gastar créditos. Un no listado `__main__` También se rechaza, como un rechazo de bloqueo, cuando una solicitud lo nombra o lleva su credencial. Listado `__main__` no levanta el bloqueo duro de la cuenta principal (encendido por defecto al 98%), que aún detiene primero el inicio de sesión principal; apague el bloqueo para dejar que la cuenta principal gaste créditos (un bloqueo al 100% todavía lo detiene al 100%). Las cuentas nuevas comienzan a no estar listadas. Administrado por el **Usar créditos** En el Codex La cabecera de Auth y el **Usar créditos después del límite** cambiar en cada tarjeta de cuenta **⋯** menú. |
| `codexQuotaAutoRefresh?` | `Record<string, object>` | `{}` | Por-Codex-login-cuenta opt-in para automático `fiveHour` y `weekly` activación de ventana en modo Pool; El modo Direct no ejecuta este trabajador. En Proveedores/Codex Auth **Configuración avanzada**, un control habilita o deshabilita las ventanas compatibles en todas las cuentas principales y agregadas actuales. Las cuentas nuevas no se aceptan automáticamente. Habilitar omite ventanas ausentes de los datos en vivo de WHAM; deshabilitar también borra las ventanas obsoletas habilitadas. La interfaz de usuario reutiliza granular `/api/settings` escribe, reconcilia fallos parciales y vuelve a intentar la intent original ON/OFF sin reemplazar los configuración no relacionados o los marcadores de restablecimiento completados. El API todavía rechaza habilitar una ventana no disponible con HTTP 409. En un tiempo de reinicio informado, opencodex envía un mensaje mínimo no almacenado de Codex usando la cuota de esa cuenta y persiste la marca de tiempo activada. Esto no se aplica a los proveedores de claves API. |
| `codexAccountNamespaces?` | `Record<string, string>` | — | Mapeo opcional desde un selector de modelo público arbitrario hasta un destino de cuenta Codex almacenado. Cuando se habilitan las filas de selectores calificados para la cuenta, cada selector cuyo destino está presente agrega filas separadas. `<selector>/<native-openai-model>` filas al selector Codex; cada fila usa solo esa cuenta. Con cualquier selector activo, las filas nativas desnudas están ocultas en el selector, pero sus ids permanecen enrutables y enumerados por raw. `/v1/models` A menos que esté explícitamente deshabilitado. |
| `codexAccountPickerEnabled?` | `boolean` | cuando el mapa está vacío | Controla si es elegible `codexAccountNamespaces` asignaciones generan filas de selector Codex calificadas para cuenta. `true` permite que aparezcan las filas asignadas. Si se omite con un mapa no vacío, se trata como habilitado para la compatibilidad con versiones anteriores; si el mapa está vacío, está desactivado. `false` oculta las filas generadas y restaura las filas del selector nativo desnudo sin eliminar asignaciones ni deshabilitar Exact `<selector>/<native-openai-model>` enrutamiento. |
| `activeCodexAccountId?` | `string` | — | Seleccione manualmente la cuenta Pool para la próxima solicitud. La selección borra la afinidad del hilo; las solicitudes en vuelo mantienen las credenciales capturadas. |
| `codexAccountPriorities?` | `Record<string, number>` | — | Orden de selección por cuenta para el grupo Codex: identificador de cuenta → entero de `-100` a `100`, **más alto se utiliza antes**Ausente significa `0`. Este es un límite de pedido, no uno de elegibilidad: la selección reduce las cuentas ya elegibles al nivel más alto que aún tiene margen de cuota, y `accountPoolStrategy` Un nivel se omite solo cuando cada miembro se encuentra en o por encima de su propio umbral de uso efectivo distinto de cero (anulación de cuenta o valor predeterminado global), se enfría, se evita el uso de software, se pausa o necesita reautenticación. — cuota desconocida nunca agota un nivel. El pedido nunca hace que una cuenta no elegible se pueda seleccionar y, de forma predeterminada, nunca vuelve a vincular un hilo que ya tiene una cuenta. `__main__` cuenta participa en igualdad de condiciones, que es la forma en que el inicio de sesión del escritorio Codex se puede configurar para drenar el último. Sin entradas, el grupo se comporta exactamente como antes. Un mapa mal formado se ignora con una advertencia de consola (ordenando apagado, sin reparación de configuración). Gestionado por: `ocx account priority` y la página Codex Auth. |
| `activeCodexAccountPinned?` | `string` | — | ID de cuenta que el operador seleccionó por última vez a mano. Mientras se establece, una mayor `codexAccountPriorities` tier no puede evitarlo hasta que el pin se libere por drenaje, exclusión, eliminación o una conmutación por error / promoción explícita. El movimiento ordinario de round-robin dentro del nivel con tapa no lo libera. Escribir cualquier `codexAccountPriorities` entrada también libera el pin, por lo que un pin hecho antes de que existiera una orden no puede superar a un conjunto después. `GET /api/codex-auth/active` informa tanto si la cuenta efectiva está anclada (`pinned`) y la cuenta que lleva el techo (`pinnedAccountId`). |
| `codexPreserveSignedInAccount?` | `boolean` | `false` | Prefiera otras identidades elegibles de Codex Pool antes de las entradas nativas principales y ordinarias que coincidan con su espacio de trabajo seleccionado y el correo electrónico del miembro. Las prioridades personalizadas existentes se conservan dentro de cada grupo. Permanecen fijaciones y pines manuales saludables; las rutas exactas de la cuenta y el modo Direct no cambian. El retroceso puede consumir la cuota de inicio de sesión bajo todos los guardias existentes. Uso [cuenta preserve-signed-in](/es/reference/cli/providers-accounts/#ocx-account-preserve-signed-in-openai-onoffstatus---apply-to-bound---json) para el estado o una transición de enlace explícita de la siguiente solicitud. |
| `codexAccountPriorityFailback?` | `boolean` | `false` | Devolución opt-in de las tareas Codex Pool en curso a una cuenta de mayor prioridad utilizable bajo la `quota` estrategia. Las solicitudes activan una actualización de cuota en segundo plano como máximo una vez cada cinco minutos, incluidos los intentos fallidos de actualización. Cuando las observaciones recientes de la cuota muestran margen, la siguiente solicitud puede volver a vincularse incluso si su cuenta corriente está por debajo del umbral. Esta preferencia explícita puede descartar una caché de solicitud caliente; no cambia la afinidad predeterminada de la caché. Ninguna solicitud significa que no hay votación. Los pines manuales, el acceso al modelo, los tiempos de reutilización, las pausas y las exclusiones de reautenticación aún se aplican; Las solicitudes en vuelo mantienen su cuenta capturada. Requiere que el umbral efectivo de la cuenta de origen actual sea positivo (una anulación de 0 lo desactiva; una anulación positiva funciona con el 0 global); las rutas exactas de la cuenta y el modo Direct no se modifican. |
| `autoSwitchThreshold?` | `number` | `80` | Umbral de uso para la colocación de trabajo nuevo/no vinculado. `quota` puede volver a evaluar las tareas no vinculadas en su próxima solicitud una vez que el uso cruce este umbral. Las tareas vinculadas mantienen su cuenta más allá del umbral por defecto (`pool.cacheAffinity`); se van solo cuando esa cuenta está agotada o no puede servir, y luego solo para una cuenta con un margen de cuota genuino y un uso estrictamente menor. Establecer `pool.cacheAffinity: false` para reevaluar las tareas encuadernadas en este umbral, aún solo en tal destino. `fill-first` utiliza solo como el punto de drenaje para la asignación sin límites; normal `round-robin` La selección no la utiliza. La puntuación utiliza la ventana de cuota más caliente conocida de 5h, semanal o 30d. `0` desactiva solo la conmutación proactiva basada en el uso, no la asignación sin límites ni la recuperación de errores. |
| `codexAccountAutoSwitchThresholds?` | `Record<string, number>` | — | Anulaciones por cuenta para `autoSwitchThreshold`: cuenta id → entero de `0` a `100`. Una entrada ausente hereda el valor global; `0` Desactiva la conmutación basada en el uso solo cuando esa cuenta es la fuente. `quota` utiliza el umbral efectivo de la cuenta de origen actual para la reevaluación de tareas vinculadas y la conmutación no vinculada. El margen de nivel de primer drenaje y de orden de selección se evalúa con respecto al umbral efectivo propio de cada cuenta; los pines de la cuenta principal y el retroceso del subagente también usan el umbral efectivo de la cuenta relevante. Apoya el principal `__main__` cuenta. Un mapa mal formado se ignora con una advertencia. Administrado por cada tarjeta de cuenta en la página Codex Auth; deshabilitar una anulación elimina su entrada. Al habilitar la anulación, se copia el umbral global actual en un valor de cuenta fijo. La anulación, incluyendo `0`tiene prioridad sobre los cambios globales posteriores. Deshabilitar que envía `threshold: null`, elimina la entrada y restaura la herencia del umbral global actual y los cambios globales futuros. |
| `accountPoolStrategy?` | `"quota" \| "round-robin" \| "fill-first" \| "reset-first"` | `"quota"` | Estrategia de asignación para solicitudes Codex nuevas/desvinculadas. Una solicitud no está vinculada cuando no tiene afinidad en vivo (identificador de subproceso principal, ámbito de cuota); una tarea existente visible puede liberarse después de reiniciar el proxy o restablecer la afinidad. `quota` elige la cuenta elegible de menor uso cuando no existe una cuenta activa, mantiene una cuenta activa elegible a continuación `autoSwitchThreshold`, y después del umbral puede mover una solicitud no enlazada. Las tareas ligadas siguen `pool.cacheAffinity` (activado por defecto): permanecen hasta que la cuenta se agote (uso conocido al 100%) o de lo contrario no puede servir, y luego pueden volver a unirse solo a una cuenta con espacio libre de cuotas genuino y un uso estrictamente menor. Establecer la bandera `false` para volver a vincular proactivamente una tarea encuadernada en el umbral, aún solo en dicho destino. `round-robin` Distribuye las solicitudes sin ataduras de manera uniforme; `fill-first` sigue asignando solicitudes no vinculadas a la cuenta activa hasta el tiempo de reutilización, la falta de disponibilidad o el umbral de drenaje configurado.  `reset-first`: Prefiera el restablecimiento de 5 horas o semanal más cercano entre las cuentas por debajo del umbral de uso. Las tareas vinculadas siguen la política de afinidad configurada. Las cuotas modelo independientes utilizan la ordenación de cuotas. Los restablecimientos mensuales no determinan este orden. |
| `pool.cacheAffinity?` | `boolean` | `true` | Ordenación de afinidad de caché para hilos Codex encuadernados, independientemente `pool.kernel`. Activado de forma predeterminada; omitiendo la clave o el ajuste `true` mantiene una tarea atada en su cuenta hasta que esa cuenta realmente no pueda servir. Sólo una explícita `false` restaura el reenlace basado en umbral de las tareas vinculadas. Un enlace en vivo supera el espacio de la cuota: `quota` no mueve el hilo simplemente porque el uso cruzado `autoSwitchThreshold`. El hilo aún se va si esa cuenta no puede servir — pausado, inutilizable o genuinamente agotado (uso conocido al 100%) — y luego solo a una cuenta con margen de cuota genuino y uso estrictamente más bajo. En cualquier configuración, una cuenta con uso desconocido nunca se elige como destino para una tarea encuadernada, por lo que cuando cada cuenta se encuentra por encima del umbral, la tarea se mantiene. La afinidad es un reordenamiento, no un pin. |
| `pool.credentialGroups?` | `Array<{ id: string; credentials: string[]; note?: string }>` | `[]` | Aceptado y validado, pero aún no consumido por el enrutamiento: declarar que un grupo no cambia ninguna decisión de enrutamiento hasta que una capa consumidora aterriza. Dominios de cuota declarados por el operador: grupos de credenciales que comparten demostrablemente un límite de uso ascendente. Los miembros de un grupo cuentan una vez para la capacidad disponible, y un rechazo de cuota dentro de un grupo no se responde girando a otro miembro — el límite es el mismo, por lo que el movimiento pagaría un prefijo frío por cero nueva capacidad. Los grupos declarados solo hablan de cuota; compartir un límite no dice nada sobre la compatibilidad de caché de solicitud, que se clasifica por separado. Cada miembro está calificado como proveedor `"<provider>:<credential-id>"`, porque un ID de credencial significa algo solo dentro de su proveedor; el segmento del proveedor acepta los alias habituales (`chatgpt:` y `codex:` ambos significan OpenAI). Las identificaciones de grupo deben ser únicas, `credentials` debe ser no vacía, y una credencial puede aparecer en un máximo de un grupo — una declaración ambigua se rechaza en escribir y se dejó caer con una advertencia sobre la carga en lugar de resolverse por el grupo que aparece primero, ya que combinaría dos dominios de cuota no relacionados. Una lista malformada cuesta solo la agrupación: `pool.kernel` y `pool.cacheAffinity` son preservados. Ausente o vacío significa que no se declara agrupación, por lo que una instalación no configurada se comporta exactamente como antes. |
| `accountPoolStickyLimit?` | `number` | `1` | Las asignaciones de tareas nuevas/no enlazadas se conservan en una selección round-robin antes de avanzar; el contador avanza cuando una tarea está enlazada, no después de un éxito ascendente. Rango 1–100. |
| `upstreamFailoverThreshold?` | `number` | `3` | Fallos transitorios consecutivos antes de que las nuevas sesiones futuras fallen. Establecer `0` para desactivar. Para envíos compactos nativos y Responses regulares, los errores de accesibilidad probados de preconexión DNS/TCP se rastrean a nivel de proveedor-anfitrión: nunca afectan el estado de la cuenta, los tiempos de reutilización de la cuenta, la afinidad de hilo/sesión, la selección de cuenta activa o el enrutamiento Pool, y nunca cuentan para este umbral. |
| `codexFailureWindow?` | `boolean` | `true` | Deslizamiento de la relación de fallos transitorios de 60 segundos para los nuevos hilos Codex, utilizados junto con el contador consecutivo. Al menos 20 muestras y una proporción de fallos del 25% o más marcan la cuenta degradada; se borra después de que la proporción permanezca en o por debajo del 10% durante 30 segundos. Las cuentas degradadas se omiten solo para nuevos hilos. Hilos que ya tienen una estancia vinculante en su cuenta. Establecer `false` para dirigir desde el contador consecutivo solo. |
| `codexPinnedTransientPolicy?` | `"hold" \| "detour-new-threads"` | `"hold"` | Mientras una cuenta anclada manualmente está en la ventana de error, `hold` sigue enviándole nuevos hilos y registra una advertencia degradada. `detour-new-threads` coloca solo nuevos hilos en otra cuenta. Un turno en vuelo nunca se mueve, y un turno que ya ha sido enviado nunca se reenvía. |
| `codexWsReuseAcrossTurns?` | `boolean` | `false` | Opt-in Codex WebSocket reutilización a través de turnos de una cuenta y el hilo. Cuando está activado, se espera un socket ocupado como máximo 750 ms antes de otro dial, se mantienen hasta dos sockets cuando cambia el modelo o el nivel de servicio, y las cabeceras de estado de giro permanecen en cada mensaje en lugar del apretón de manos. Los cambios de autorización, cuenta, proxy o dial-URL aún retiran el socket anterior. |
| `upstreamHostCircuitThreshold?` | `number` | `0` | Umbral de circuito Opt-in para la preconexión comprobada DNS/TCP fallas en OpenAI nativo reenvía Responses y envía compacto. `0` lo deshabilita; `1`–`20` abre un tiempo de reutilización de origen del proveedor de 30 segundos después de muchas solicitudes lógicas de terminal. Mientras está abierto, las solicitudes reciben `503` con `Retry-After` antes de la selección de la cuenta o el envío ascendente; después del tiempo de reutilización, se admite una solicitud a medio abrir. Los tiempos de espera y las respuestas HTTP nunca cuentan, y cualquier respuesta HTTP cierra el circuito. Se aplica solo al enrutamiento Codex Pool sin cuenta anclada; es inerte para `codexAccountMode: "direct"` y selectores cualificados. |
| `maxUpstreamBodyBytes?` | `number` | `0` | Techo opt-in, en bytes, en un Responses nativo serializado **passthrough** cuerpo. `0` u omitido lo desactiva — no se infiere ningún límite para ningún destino. Cuando se establece, un cuerpo construido por encima del techo se rechaza localmente antes del envío: turnos de transmisión reciben un terminal `response.failed` / `context_length_exceeded` de modo que el cliente compacta en lugar de reenviar, y los giros no `413` nombre del tamaño, el número de incrustados `input_image` elementos, y aproximadamente cuántos megabytes de datos de imagen representan. Se comprueba en cada punto de compilación y reconstrucción, incluida la repetición de actualización OAuth y el reintento de cuenta alternativa. Las rutas de adaptador traducidas no están cubiertas. No hay un valor predeterminado: el único techo medido aquí pertenece al transporte WebSocket, que ya vuelve a HTTP para giros de gran tamaño, por lo que un valor predeterminado rechazaría las solicitudes que actualmente tienen éxito. Configúrelo cuando su puerta de enlace tenga un límite de tamaño de solicitud conocido y prefiera ver un error local procesable que un fallo opaco en el flujo ascendente. |
| `maxInboundBodyBytes?` | `number` | `0` | Techo opt-in, en bytes, en un descomprimido **entrantes** cuerpo de solicitud de plano de datos — el espejo de `maxUpstreamBodyBytes` arriba. `0` o se omite mantiene el 256 MiB por defecto incorporado. Auméntelo cuando una sesión de contexto grande ya no pueda compactarse: Codex reproduce todo el historial al modelo de compactación, por lo que en la ventana opt-in 922k-token la solicitud de compactación es la que cruza el límite, y la sesión está atascada en la única operación que la habría reducido. Sujeto a 1 MiB–512 MiB. El techo no es negociable: el lector materializa el cuerpo varias veces (bytes de cable, bytes decodificados, la cadena decodificada y el gráfico de objeto analizado), por lo que la memoria máxima es un múltiplo de lo que se admite, y un valor ilimitado sería una palanca de agotamiento de memoria. Se aplica a `/v1/responses`, `/v1/responses/compact`, `/v1/chat/completions`, y `/v1/messages`. El tamaño de aceptación del oyente se fija cuando el proxy se une, por lo que un cambio tiene efecto al reiniciar. Un cuerpo por encima del límite es rechazado localmente con HTTP 413 y `code: "inbound_body_too_large"`que es deliberadamente distinta de la `context_length_exceeded` 413 produce un rechazo del tamaño del proveedor. |
| `upstreamRequestCompression?` | `"off" \| "gzip" \| "zstd"` | `"off"` | Compresión opt-in de cuerpos de solicitud nativos ChatGPT Responses HTTP. Codex reenvía toda la conversación en cada turno, y cuando ese turno pasa HTTP OpenCodex de lo contrario lo reenvía a `chatgpt.com` sin comprimir; en una salida medida o de larga distancia que carga es el costo dominante. Cuando está configurado, se envían cuerpos de cuerda de 1 KiB a 16 MiB `https://chatgpt.com/backend-api/codex/responses` y `/compact` son comprimidos en el envío final y etiquetados con `Content-Encoding`. WebSocket gira, cada otro destino, cuerpos que ya declaran un `Content-Encoding`, y los cuerpos fuera de esa ventana de tamaño se envían sin cambios, y un fallo del códec vuelve al envío sin comprimir. `zstd` es la codificación Codex que el propio CLI utiliza con este backend y es la opción más rápida para giros pesados de imagen; `gzip` (nivel 1) también está disponible. En una medición local, el historial de código pesado se redujo aproximadamente 2–4×, mientras que las imágenes incrustadas apenas se reducen. La compresión se ejecuta sincrónicamente en el bucle de eventos del proxy, por lo que cada envío elegible retrasa brevemente otras solicitudes en vuelo — del orden de 2–3 ms por MiB para texto en una computadora portátil reciente CPU, más para datos incompresibles con `gzip`. Límites de bytes como `maxUpstreamBodyBytes` Mide el cuerpo sin comprimir. Ponlo con `ocx config set upstreamRequestCompression zstd` (se rechaza un valor desconocido) o mediante la edición `config.json`, donde se ignora un valor desconocido y, a continuación, reinicie el proxy para aplicarlo. |
| `modelCacheTtlMs?` | `number` | `300000` | Ventana de frescura para el proveedor `/models` caché. |
| `cacheRetention?` | `"none" \| "short" \| "long"` | Anthropic oficial: `"long"`; otros endpoints compatibles con Anthropic: `"short"` | Política de caché de instrucciones de Anthropic: desactivada, efímera de cinco minutos o extendida de una hora. Si no se especifica, las solicitudes a `api.anthropic.com`, con clave API o grupos de cuentas OAuth, usan una hora de TTL. Las tareas de agentes suelen pausarse más de cinco minutos, por lo que una escritura de una hora, con costo de 2 veces la entrada base frente a 1,25, se compensa en la primera reutilización. Las pasarelas compatibles y otros endpoints mantienen cinco minutos porque no está documentado que admitan una hora. En el paso directo nativo de `/v1/messages`, los puntos de caché del cliente sin `ttl` reciben `"1h"`, salvo que la solicitud fije alguno a `"5m"`; en ese caso se reenvía sin cambios. En una ruta convertida de `/v1/messages`, que todos los puntos pidan `ttl: "1h"` significa `"long"`, y cualquier `"5m"` explícito significa `"short"`. Un valor explícito siempre tiene prioridad. Cambiar el TTL hace que cada conversación abierta escriba su caché otra vez, porque las entradas de cinco minutos y una hora son distintas. Los costos estimados valoran las escrituras declaradas de una hora con su tarifa correspondiente. |
| `tokenGuardian?` | `OcxTokenGuardianConfig` | apagado | Actualización proactiva opcional de OAuth y política de calentamiento de cuenta Codex. |

Las cuentas del grupo que habiliten el uso de créditos y tengan agotada su ventana de uso incluida renuevan la evidencia de crédito mediante el barrido existente en segundo plano cuando esa evidencia tiene tres minutos de antigüedad. Los encabezados habituales de respuesta no renuevan el saldo de créditos. Una lectura fallida de metadatos nunca extiende la vigencia de cinco minutos de la evidencia que autoriza el gasto.


A través de estas estrategias, el umbral efectivo de cada cuenta es `codexAccountAutoSwitchThresholds` entrada cuando está presente, de lo contrario global `autoSwitchThreshold`. Una anulación cero desactiva solo el cambio de uso proactivo; la vinculación de inicio, el bloqueo duro, el tiempo de reutilización, las comprobaciones de derechos y la recuperación de fallas siguen vigentes.

Establecer el umbral de conmutación de una cuenta en `0` no deshabilita el bloqueo duro de la cuenta principal, inicio protección, tiempos de reutilización o comprobaciones de elegibilidad del modelo. En el modo Pool, una credencial de llamada anclada que coincide con la cuenta principal observada no puede pasar por alto el tiempo de reutilización aplicable de esa cuenta: Se utiliza la alternativa Pool, o se rechaza la solicitud. Las credenciales de llamadas no relacionadas no heredan El tiempo de reutilización de la cuenta principal; el comportamiento explícito de Direct no cambia.

Los nombres de selector son etiquetas públicas elegidas por el usuario; opencodex no les asigna semántica de rol de cuenta.
`codexAccountNamespaces` son caracteres 1–64, comenzando y terminando con un ASCII letra o número, con letras, números, `.`, `_`, o `-` dentro. Objeto JavaScript reservado Los nombres son rechazados. Cada valor es un identificador válido de cuenta de grupo (nunca interno). `__main__`) `"@main"`
para la cuenta de escritorio Codex. Proveedor y Reservado `openai` / `combo` / `policy` Las colisiones son case-insensitively comprobado; un alias de perfil de enrutamiento o combo namespaced no puede reutilizar un selector como su prefijo de espacio de nombres, y los identificadores de grupo configurados o los objetivos del selector tampoco pueden reutilizar un selector. Conservar raw ID de cuenta y correos electrónicos privados; el selector es el nombre público. Véase [Configuración de enrutamiento](/es/reference/configuration/routing/)
para el comportamiento de selección exacta y la precedencia.

El control del panel de control Codex Auth posee mapas que `codexAccountPickerEnabled` campo. Habilitar un mapa administrado vacío crea selectores seguros para la privacidad; las adiciones posteriores de cuentas amplían ese mapa incluso mientras las filas del selector están ocultas, sin cambiar el nombre de los selectores existentes. Un mapa escrito a mano que omite la bandera permanece manual y nunca se expande automáticamente. Eliminar una cuenta mantiene su mapeo tan exacto Las rutas fallan cuando faltan; añadir la misma cuenta restaura el público existente Selector en lugar de asignar uno nuevo.

<a id="reserved-openai-providers"></a>

## Proveedores reservados de OpenAI

`openai` y `openai-apikey` son ID reservados fijos. `openai.codexAccountMode` es `"pool"` por defecto y selecciona a través de las principales cuentas añadidas; `"direct"` usa solo el nombre de usuario actual. API utiliza solo su clave o grupo de claves configurados API. Utilice un modelo desnudo o `openai-apikey/<model>`; allí no es una reserva de credenciales de ruta cruzada. API GPT-5.6 filas llevan 1.000.000 contexto / 922.000 entrada máxima metadatos, y las ID virtuales Pro reescribir al modelo de cable base con `reasoning.mode: "pro"`.

`openaiProviderTierVersion: 2` marca la proyección actual de un solo proveedor. Antes de migrar a enviado v1 config, opencodex crea `config.json.pre-openai-tiers-v2.bak` Sin sustituir a Diferentes copias de seguridad y reescribe los nombres heredados conocidos.

<a id="gpt-6-astra-sol-luna-and-astra-minor"></a>

### GPT-6 Astra, Sol y Luna

`gpt-6-astra` utiliza la ruta Codex-login; `openai-apikey/gpt-6-astra` utiliza su clave API. La disponibilidad todavía depende de la cuenta ascendente. Astra nativo mantiene los valores predeterminados de Codex enviados: 272.000 contextos, `low` El razonamiento, y el `low`/`medium`/`high`/`xhigh`/`max`/`ultra` escalera. Su descripción rápida del catálogo es **2x velocidad**; ese no es el multiplicador de facturación.

Establecer `providerContextCaps.openai` a `922000` Optar por el grupo nativo en un contexto largo. Astra se detiene en su propio **872,000** techo. Por modelo `providers.openai.modelContextWindows`
y `modelAutoCompactTokenLimits` puede reducir su ventana y el presupuesto de compactación suave. Por ejemplo,
`modelAutoCompactTokenLimits: { "gpt-6-astra": 700000 }` reduce el valor predeterminado de larga ventana de 784.800. Un límite de proveedor explícito más pequeño o un límite objetivo aún gana, incluidos los combos de alias nativos.

Sin un límite rígido configurado, el catálogo nativo mantiene el `max_context_window`
separado del valor predeterminado `context_window` (para Astra, 872.000 frente a 272.000). Todavía compactación utiliza la ventana por defecto efectiva. Para dar un modelo de 500.000 tokens y los otros 300.000, conjunto
`providers.openai.contextWindow` a `300000` y
`providers.openai.modelContextWindows` a `{ "gpt-6.1-sol": 500000 }`. El valor por modelo anula la ventana del proveedor; `providerContextCaps.openai`, cuando está habilitado, sigue siendo un techo para cada modelo nativo y debe ser al menos `500000` Para este ejemplo. La capacidad de cada modelo limita el resultado.

La fila API tiene 1,050,000 contexto, 922,000 entrada máxima, 128,000 salida máxima, entrada de texto / imagen, y API esfuerzos de razonamiento a través `max`. El control Ultra sintético enrutado de OpenCodex conserva su mapeo de esfuerzo de cable existente; no es un esfuerzo adicional API. No hay astra `-pro` alias. Utilizar el existente `fastMode` ajuste, o Codex de `service_tier = "fast"` con
`[features].fast_mode = true`; API `fast` y `priority` Se aceptan ortografías rápidas.

[GPT-6 Sol y Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/) (anunciado 22 de septiembre de 2026) son nativos de Codex-login: `gpt-6-sol` y `gpt-6-luna`, mostrado como **GPT-6-Sol**
y **GPT-6-Luna**. Al igual que Astra, se enumeran en cada instalación y no están cerradas en una cuenta. lista; si su cuenta no puede usarlos todavía, la solicitud aún se apaga y ve el Error. Sus metadatos provienen de la Codex `/models` que sirve a estas dos filas sólo para
`client_version` **0.155.0 o más tarde**; opencodex envía una copia de esas filas, por lo que aparecen incluso cuando el catálogo Codex instalado los precede.

| Modelo | Contexto predeterminado | Techo opt-in | Esfuerzo predeterminado | Razonamiento escalera |
| --- | ---: | ---: | --- | --- |
| `gpt-6-sol` | 272,000 | 872,000 | `medium` | `low` a través `ultra` |
| `gpt-6-luna` | 272,000 | 872,000 | `medium` | `low` a través `max` (no `ultra`) |

[GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/) (anunciado el 29 de septiembre de 2026) es la actualización a GPT-6 Sol; Astra y Luna no obtuvieron un lanzamiento de 6.1. Se enumera como
`gpt-6.1-sol` (**GPT-6.1-Sol**), sin denominar como Sol, y su fila proviene del catálogo Codex, donde necesita `client_version` **0.153.0 o más tarde** y es el valor predeterminado Codex. GPT-6 Sol permanece en la lista.

| Modelo | Contexto predeterminado | Techo opt-in | Esfuerzo predeterminado | Razonamiento escalera |
| --- | ---: | ---: | --- | --- |
| `gpt-6.1-sol` | 500,000 | 872,000 | `low` | `low` a través `ultra` |

OpenAI elevó el contexto predeterminado de GPT-6.1 Sol en Codex y Work de 272,000 a 500,000 tokens en El 11 de octubre de 2026, por lo que la fila nativa ahora tiene por defecto 500,000 y se compacta en 450,000. El paquete El catálogo de Codex sigue siendo de 272.000, por lo que opencodex establece el nuevo valor predeterminado. Una ventana configurada o El límite del proveedor aún lo reduce, y la opción de suscripción de ventana larga aún se detiene en 872,000: OpenAI describe el máximo del modelo como 1M sin decir cómo eso asigna en la ventana y los límites de entrada de Codex, así opencodex no anuncia más que el techo que puede verificar.

El mismo `providerContextCaps.openai`, `modelContextWindows` y `modelAutoCompactTokenLimits`
Las palancas se aplican como para Astra. En el OpenAI API (`openai-apikey`), `gpt-6.1-sol` Tiene 1.050.000 contexto, 922.000 entradas máximas, 128.000 salidas máximas y esfuerzos `low` a través `max`, con precios de $2 por entrada, $0.10 por entrada en caché y $10 por salida por cada millón de tokens. Las solicitudes de más de 272K se facturan con la tarifa de contexto largo. GitHub Copilot, OpenRouter, Vercel AI Gateway, Kilo y OpenCode Zen también lo incluyen.

Cuando OpenAI envía un modelo GPT que esta versión aún no conoce, agréguelo a través de config en lugar de esperando una actualización, de la misma manera que un nuevo id Claude pasa por debajo `providers.anthropic.models`:

```json
{
  "providers": {
    "openai": {
      "adapter": "openai-responses",
      "authMode": "forward",
      "baseUrl": "https://chatgpt.com/backend-api/codex",
      "models": ["gpt-6-nova"]
    }
  }
}
```

Cada uno desnudo `gpt-*` El identificador que aparece en el proveedor de inicio de sesión Codex aparece como modelo nativo (aquí
**GPT-6-Nova**) con la escalera de razonamiento, el esfuerzo predeterminado y las modalidades de GPT-6.1 Sol, un contexto predeterminado de 272,000-token y un techo opt-in 872,000-token. Levantar o reducir con `modelContextWindows`Por ejemplo,
`"modelContextWindows": { "gpt-6-nova": 872000 }`. Nunca está cerrado por cuenta: si su cuenta no puede usar el modelo, la solicitud aún se apaga y ve el error ascendente. Ids que son Se ignoran las ya incorporadas y al eliminar un id de la lista se elimina el modelo. Un combo
`nativeAlias` no puede apuntar a un id configurado.

`gpt-6-astra-minor` (**GPT-6-Astra-Minor**) es una variante inédita de Astra. Está cerrado por cuenta: permanece oculto, y las solicitudes para ello se rechazan localmente, hasta que una lista autenticada de Codex para su cuenta lo enumera. Cuando aparece utiliza el contexto, la escalera y las modalidades de Astra.

Consultado el 5 de septiembre de 2026:

| Astra API (USD por millón de tokens) | Entrada | Entrada en caché | Escribir caché | Salida |
| --- | ---: | ---: | ---: | ---: |
| Estándar, hasta 272k de entrada | 10 | 1 | 12.5 | 50 |
| Estándar, por encima de la entrada 272k | 20 | 2 | 25 | 75 |
| Rápido, hasta 272k de entrada | 20 | 2 | 25 | 100 |
| Rápido, por encima de la entrada 272k | 40 | 4 | 50 | 150 |

Los [Tabla de precios API](https://developers.openai.com/api/docs/pricing) revaloriza el **Toda la solicitud**
por encima de 272k, contando tokens en caché hacia el umbral. Las tasas de contexto rápido y largo se combinan; Esto también se aplica a las filas publicadas GPT-5.6 API y sus selecciones virtuales Pro.

Todas las estimaciones en dólares incorporadas usan **Precios de referencia API**, incluidas las rutas Codex-login. Por lo tanto, Astra y GPT-5.6 usan las mismas tasas de base/caché API, **2x Rápido** multiplicador, y publicado bandas de largo contexto en `openai` y `openai-apikey`. Los dos selectores Daybreak Blue siga la referencia Sol API. Estas son estimaciones de comparación, no facturas o saldos crediticios Predicciones. Las anulaciones explícitas de precios de proveedor/modelo siguen teniendo prioridad.

<a id="provider-namespace-aliases"></a>

## Alias de espacio de nombres de proveedor

Los proveedores pueden exponer una taquigrafía incorporada, como `agy` por `google-antigravity`. Un nombre de proveedor configurado o alias explícito afirma que taquigrafía case-insensible; la taquigrafía incorporada de un proveedor diferente se suprime entonces en ambos nombres de catálogo y enrutamiento de alias. Por ejemplo, configurar un proveedor llamado `agy` mantiene los modelos de Google bajo `google-antigravity/<model>`, mientras `agy/<model>` Seleccione el proveedor configurado. Los nombres de proveedores canónicos todavía requieren una coincidencia exacta de casos, y los prefijos no reconocidos conservan el respaldo de enrutamiento de modelo existente.

<a id="provider-entries-ocxproviderconfig"></a>

## Entradas de proveedores (`OcxProviderConfig`)

| Campo | Tipo | Significado |
| --- | --- | --- |
| `adapter` | `string` | Uno de `openai-chat`, `openai-responses`, `anthropic`, `claude-cli`, `google`, `kiro`, `cursor`, `ollama-native`, `azure-openai` (o alias) `azure`), `codebuddy`, `qoder`. |
| `baseUrl` | `string` | API base de flujo ascendente URL. La mayoría de los puntos finales fijos incorporados ignoran una falta de coincidencia; los configuración preestablecidos de clave seguros contra colisiones conservan un destino personalizado con el mismo nombre más antiguo. |
| `proxy?` | `string \| null` | Ruta de salida por proveedor. Omite heredar la decisión de proxy global; uso `"direct"` o `null` para forzar la salida directa; o proporcionar una `http://`, `https://`, `socks5://`, o `socks5h://` proxy URL. Se rechaza una cadena vacía. |
| `noProxy?` | `string \| string[]` | Destinos a los que este proveedor llega directamente, utilizando `NO_PROXY` Sintaxis de patrón de host. Una coincidencia pasa por alto tanto el propio proxy de este proveedor como un proxy global heredado. |
| `requestPacing?` | `{ enabled, requestsPerMinute?, minIntervalMs?, maxConcurrentRequests?, models?, keySelection?, keys? }` | Indicadores opcionales de inicio de solicitud saliente del lado del cliente, separados del uso ascendente, la facturación y los indicadores de límite de tarifa. RPM se convierte en un intervalo par; `minIntervalMs` puede imponer un intervalo más largo. `maxConcurrentRequests` es un límite de enteros positivo en las solicitudes en vuelo. Una regla de proveedor o modelo puede usar el límite de concurrencia solo; los límites de proveedor se aplican en todos los modelos, mientras que `models` las entradas usan ID de modelo ascendente exactos (por ejemplo: `nvidia/llama-3.1-nemotron-ultra-253b-v1`) y sólo puede añadir retardo o estrecha concurrencia. Los esperas de cola no consumen el tiempo de espera del encabezado de respuesta ascendente. HTTP y adaptador explícito `fetchResponse`/`runTurn` Se cubren los despachos. Una concurrencia-capped canónica Responses WebSocket a su vez utiliza HTTP/SSE por lo que su arrendamiento puede ser liberado cuando el cuerpo de respuesta completa, errores, o se cancela. `runTurn` adaptadores, incluido Cursor, el límite cuenta los giros activos en lugar de los envíos físicos: RunSSE y BidiAppend pueden superponerse en un turno, mientras que otro turno espera. Seguimiento envía todavía obedecer intervalos de inicio. |
| `requestPacing.keySelection?` | `"active"`, `"round-robin"` | Selección normal de la tecla de petición. Predeterminado `active` conserva la clave guardada y la rotación de fallo existente; `round-robin` distribuye selecciones locales de solicitud entre referencias de grupo de claves API elegibles sin cambiar la clave activa guardada. Equilibra las asignaciones, no tokens o el costo. |
| `requestPacing.keys?` | `{ requestsPerMinute?, minIntervalMs?, maxConcurrentRequests? }` | RPM uniforme por referencia clave, intervalo de inicio mínimo y límites de concurrencia, compartidos entre modelos. Estos componen con el proveedor y el modelo exacto de los límites superiores. Las referencias duplicadas comparten un cubo; las referencias separadas en un proyecto ascendente no implican una cuota independiente. TPM y cuotas diarias no se aplican. |
| `upstreamHttpVersion?` | `"auto" \| "http1.1" \| "h1" \| "http2" \| "h2"` | Fije la versión HTTP utilizada para las solicitudes ascendentes a este proveedor. Predeterminados a `auto`, que permite a Bun negociar. Un pin explícito requiere un objetivo HTTPS y falla localmente cuando no se puede cumplir. Establecer `http1.1` cuando la transmisión HTTP/2 SSE de un proveedor se detiene en lugar de entregar eventos —, el síntoma es una solicitud de transmisión de larga duración que no produce nada y finalmente expira. Para Cursor, `http1.1`/`h1` selecciona su `RunSSE` + `BidiAppend` compatibilidad de transporte para inferencia y también pines en vivo modelo descubrimiento. Gestión `POST`/`PATCH` aceptar `null` para limpiarlo de nuevo a `auto`. |
| `tlsProfile?` | `"antigravity-browser"` | **Usar bajo su propio riesgo.** Opt-in navegador-como TLS apretón de manos (a través de la opción `wreq-js` para el canónico `google-antigravity` Proveedor OAuth. Cambia solo cómo se ve la conexión en el cable; no es un cliente oficial de Google, y no cambia lo que permiten los términos de Google. Google aún puede detectar, limitar la tarifa, suspender o prohibir la cuenta con la que inició sesión, y solo usted conlleva ese riesgo. Está desactivado por defecto y solo se acepta con el adaptador Google, el modo Cloud Code Assist y los hosts canónicos Google Antigravedad de HTTPS. Redirigir manual de estancia. El propio proveedor `proxy`/`noProxy` ruta se lleva a cabo por el transporte TLS; una ruta que no puede mantener falla la solicitud en lugar de salir por otra ruta, que incluye cualquier ruta directa mientras `HTTP_PROXY`, `HTTPS_PROXY`, o `ALL_PROXY` está establecido. `GET /api/providers` informa el estado del perfil como `pending`, `active`, o `failed`. Omitir el campo mantiene el transporte Bun normal y nunca carga la dependencia. |
| `responsesPath?` | `string` | Ruta de recursos relativos para key-auth `openai-responses` solicitudes. Debe comenzar con `/` y no contienen esquema, consulta o fragmento. |
| `chatCompletionsPath?` | `string` | Ruta de recursos relativos para `openai-chat` El espejo, el espejo de `responsesPath` y sujeto a las mismas reglas de forma. Necesario cuando uno ascendente sirve Chat Completions y Responses bajo diferentes prefijos: una anulación de cable por modelo cambia el adaptador y deja `baseUrl` solo, por lo que sin esto, se enviaría una solicitud de chat opcional a la base Responses. Z.AI es el ejemplo enviado. |
| `allowEncryptedV2AgentTasks?` | `boolean` | Deshabilitado por defecto. Confía en una clave directa `openai-responses` proveedor para consumir o retransmitir tareas subagente V2 cifradas opacas sin cambios. Saltar rutas elegibles `agentTaskRecovery`; todas las demás rutas mantienen la recuperación existente o el comportamiento cerrado por error. OpenCodex no descifra, traduce ni recupera las tareas enviadas a través de esta opción. |
| `projectResponsesLiteHostedSearchHistory?` | `boolean` | Por defecto. Establecer el booleano real `true` para optar por este proveedor en la proyección con pérdida del historial de búsqueda alojada no referenciada para giros ordinarios y v2 nativa `compaction_trigger` solicitudes para precisar canónica ChatGPT Codex `/responses` con intención explícita Responses Lite. Omisión o `false` conserva la historia estructural; cadenas y números no son válidos. No habilita Lite, cambia el transporte ni afecta la versión nativa `/responses/compact`, OpenAI público API/otros destinos, o proyección de compactación portátil/enrutada existente. Véase [Historial de búsquedas alojadas Lite](/es/reference/proxy-formats/#codex-native-ordinary-lite-hosted-search-history). |
| `upstreamWebsocket?` | `boolean` | Responses WebSocket transporte ascendente para `openai-responses` solicitudes (falso predeterminado). Honrado solo para el first-party `https://api.openai.com/v1` Los puntos finales de proveedores personalizados siempre usan HTTP/SSE con límites porque Bun no puede imponer un límite de mensaje entrante WebSocket antes de asignar el mensaje completo. Para el canónico ChatGPT `openai` proveedor, omitiendo que mantiene la corriente ascendente WebSocket en turnos elegibles, una `false` envía entregas de transmisión HTTP/SSE, y la administración del proveedor rechaza `true`; con `false`, la dirección y la inyección a mitad de giro no están disponibles. El campo es independiente de la orientación al cliente `websockets` no cambia ni el endpoint ni la credencial. HTTP llano permanece en rutas SSE; no Responses y `openai-chat` solicitudes permanecen en HTTP. |
| `supportsServiceTier?` | `boolean` | Repliegue de capacidad rápida canónica tri-estatal. `true` publica Fast en el catálogo, satisface los requisitos de enrutamiento de nivel de servicio, aporta una huella dactilar compatible y permite que el modo rápido inyecte el valor de cable canónico del proveedor en un adaptador final compatible. `false` despoja el campo y nunca se inyecta, y las declaraciones exactas del modelo no pueden volver a abrirlo. Ausente deja al proveedor sin clasificar: el modo rápido no inyecta ni normaliza un valor canónico de la persona que llama, y los valores de la persona que llama obedecen el permiso de reenvío del cable final (`chatServiceTier` en Chat; paso a través en Responses). El registro clasifica canónica OpenAI (`true`), DeepSeek, y el arca de Volengine (`false`); lo establece explícitamente solo para puertas de enlace personalizadas que realmente admitan niveles. |
| `responseTierAuthoritative?` | `boolean` | Si el nivel de respuesta puede confirmar o denegar Fast. Establecer `false` explícitamente para rutas con metadatos de respuesta no autoritativa; la omisión preserva el comportamiento existente. Esto no permite cambiar los parámetros de salida. Véase [Autoridad de nivel de servicio de respuesta](#response-service-tier-authority). |
| `fastEnabled?` | `boolean` | Cambio de operador para el carril rápido del proveedor. `false` se apaga rápidamente (sin palanca rápida, no `--fast` fila, sin campo de cable rápido) y anula `supportsServiceTier`. `true` habilita un carril de las marcas de registro opt-in. Ausente mantiene el valor predeterminado del registro: desactivado para `anthropic` y `anthropic-apikey`, cuyo modo rápido gasta créditos de uso a un precio de 2x, y sin cambios para todos los demás proveedores. La página Modelos del panel de control muestra una fila de Off/On para proveedores opt-in. |
| `modelSupportsServiceTier?` | `Record<string, boolean>` | Anulaciones de capacidad exactas del modelo ascendente. Exacto `true` habilita el Fast canónico para ese modelo; exacto `false` reduce los valores predeterminados del proveedor. Un nivel de proveedor explícito `supportsServiceTier: false` permanece cerrado y no se puede reabrir. Exacto `true` no autoriza el reenvío de llamadas extranjeras en Chat. Los modelos no declarados vuelven a caer en el comportamiento de todo el proveedor. Gestión `PATCH /api/providers` fusiona entradas y acepta `null` para despejar uno. |
| `chatServiceTier?` | `boolean` | Chat-wire en todo el proveedor opt-in para el reenvío de llamadas `service_tier` valores. En una ruta clasificada gobierna valores extranjeros como: `flex`, no canonical propiedad de proxy después de la validación de capacidad; en una ruta no clasificada rige cada valor de llamada porque no se ha validado ninguna capacidad Fast. La capacidad del modelo exacto no autoriza el reenvío extranjero. Las rutas Responses conservan su comportamiento de reenvío de llamadas basado en la capacidad. |
| `promptCacheKey?` | `boolean` | Proveedor en todo el país `openai-chat` Opt-in para el envío de un `prompt_cache_key`. El adaptador reenvía la clave que se le da y nunca inventa una, pero la clave no siempre es la del llamante: Claude La traducción de Messages deriva de `metadata.user_id`, o de una cohorte modelo/sistema/herramientas cuando no se envían metadatos. Por defecto. Habilite solo cuando los documentos ascendentes sean compatibles, ya que las puertas de enlace estrictas pueden rechazar el campo desconocido con HTTP 400. |
| `preserveResponsesReasoningContent?` | `boolean` | Por defecto para los proveedores personalizados. En **Proveedores → Configuración**, habilitar **Replay razonamiento de texto plano** para un punto final Responses personalizado solo si acepta este historial. Esto envía razonamiento de texto plano previo a ese punto final y puede aumentar el uso de token. Mantenga el contenido de razonamiento de texto plano en los elementos de razonamiento Responses reproducidos en lugar de borrarlo, incluida la entrada compacta nativa personalizada v1 (blanking es la regla del backend ChatGPT). Habilitar para los flujos ascendentes cuyo contrato acepta la repetición de razonamiento, como DeepSeek o un Kimi autohospedado en vLLM. Proxy-minted `ocxr1` Los sobres siempre son despojados. Un configurado a mano `openai-responses` proveedor sin él registra una advertencia por host la primera vez que se elimina el razonamiento de texto sin formato. `preserveReasoningContentModels` no afecta a este cable. |
| `preserveResponsesInputItemIds?` | `boolean` | Por defecto. Conservar válido `input[].id` cuando `store: false` para relés lanzadores de confianza explícita que requieren identidad por turnos. Los proveedores ordinarios de Responses siguen eliminando las identificaciones; La reparación del ID de llamada personalizada xAI permanece activa. |
| `preserveResponsesMessageMetadata?` | `boolean` | Por defecto. Preservar privado `internal_chat_message_metadata_passthrough` en elementos de entrada para relés de lanzador explícitamente confiables, incluidas las solicitudes compactas nativas personalizadas v1. Esto reenvía metadatos privados de turno/sesión a ese destino; no habilite las puertas de enlace ordinarias. |
| `dropResponsesReasoningItems?` | `boolean` | Eliminar replayed Responses `reasoning` elementos de la entrada de continuación por completo, incluidas las solicitudes compactas nativas v1 personalizadas, en lugar de reenviarlas con contenido en blanco. Esto es pérdida: resúmenes, item ids, y `encrypted_content` ir con ellos, por lo que ningún elemento de razonamiento del turno anterior permanece en la entrada reenviada. No elimina `previous_response_id`, por lo que un estado de origen que mantiene su propio estado de giro aún puede alcanzarlo. Habilitar solo para un flujo ascendente que rechaza la repetición de razonamiento — el preajuste del Plan de codificación Volcengine Ark incorporado lo establece porque las continuaciones de herramientas validadas responden `400 InvalidParameter` De lo contrario. Ponlo a `false` en ese proveedor para reenviar elementos de razonamiento nuevamente. |
| `disabled?` | `boolean` | Mantenga el proveedor en el disco, pero excluyalo de los listados de enrutamiento y modelo/catálogo. |
| `apiKey?` | `string` | API clave, un `${ENV_VAR}` / `$ENV_VAR` referencia, o a `keychain:<provider>` Referencia escrita por `ocx provider keychain <name> store`. Las referencias se resuelven en el momento de la solicitud. Véase [Almacenar claves en el llavero del sistema operativo](#storing-keys-in-the-os-keychain). |
| `apiKeyTransport?` | `"x-api-key" \| "bearer"` | Estilo de encabezado de clave Anthropic. Predeterminados a nativo `x-api-key`; válido solo para clave-auth `anthropic` proveedores. |
| `apiKeyPool?` | `ApiKeyPoolEntry[]` | Piscina multi-clave. `apiKey` refleja la entrada activa; cada elemento tiene `id`, `key`, opcional `label`, y opcional numérico `addedAt`. |
| `apiKeyPoolStrategy?` | `"round-robin" \| "fill-first" \| "quota"` | Cómo se elige una llave caliente **antes** el primer intento cuando la clave comprometida ya se está enfriando. Omitido mantiene la rotación reactiva solamente: el grupo se mueve después de un 429 o 401 y no antes. `round-robin` toma la siguiente llave en la grupo, `fill-first` mantiene la primera elegible, y `quota` prefiere la llave con la mayor cantidad de espacio libre restante, volviendo a `fill-first` para un proveedor cuya cuota por clave es desconocida. Una clave comprometida saludable nunca se anula, por lo que se mantiene una selección manual de la clave. |
| `defaultModel?` | `string` | Modelo utilizado cuando se selecciona este proveedor sin un modelo explícito. |
| `models?` | `string[]` | Lista de modelos de semillas/retroceso. Con `liveModels: false`, un no vacío `models` La lista es seguida por `retainModels`; un vacío u omitido `models` lista en lugar de semillas `defaultModel` (si está configurado), entonces `retainModels`, eliminando los ID duplicados en orden de primera vista. |
| `liveModels?` | `boolean` | Obtener el catálogo en vivo en start/sync (por defecto) `true`) Los proveedores personalizados utilizan `${baseUrl}/models`; los built-ins pueden usar un registro URL y filtro. |
| `selectedModels?` | `string[]` | Catálogo allowlist después del descubrimiento. No vacía expone solo esos ids; vacía u omitida expone todos los modelos descubiertos. |
| `retainModels?` | `string[]` | Los identificadores se mantienen en el catálogo incluso cuando el descubrimiento en vivo los omite. No es necesario repetirlo en `models`. Vacío u omitido mantiene el comportamiento de hoy. |
| `modelDisplayNames?` | `Record<string, string>` | Las etiquetas duraderas se utilizan solo para la visualización, con la identificación exacta del modelo ascendente de este proveedor. Las etiquetas ganan los metadatos del catálogo del proveedor, sobreviven a las actualizaciones de descubrimiento y las ediciones del proveedor, y nunca cambian la autenticación, el comportamiento del adaptador, el enrutamiento, la facturación, la construcción de solicitudes ascendentes, la ruta. `provider/model` Selector, o el modelo de cable ascendente. Las teclas son exactas y sensibles a las mayúsculas. Los identificadores de modelo desconocidos se guardan para que un modelo que falta temporalmente reciba su etiqueta cuando regrese. El mapa acepta como máximo 2.000 entradas, lo que coincide con el límite de descubrimiento. |
| `contextWindow?` | `number` | Rechazo del contexto en todo el proveedor cuando los metadatos ascendentes están ausentes; de lo contrario, un límite que retiene metadatos activos más pequeños. El panel Modelos expone esto por separado de `providerContextCaps`. |
| `modelContextWindows?` | `Record<string, number>` | Por-modelo contexto fallbacks/caps. Estos anulan `contextWindow`: una ventana desconocida utiliza el valor configurado, mientras que los metadatos en vivo más pequeños siguen siendo autorizados. |
| `inferContextWindow?` | `boolean` | Solo proveedores personalizados, por defecto desactivado. `true` llena una ventana que falta de metadatos de ID de modelo agrupados ([detalles](#context-windows-on-custom-providers)); el valor es una estimación, no una capacidad de retransmisión verificada. |
| `modelContextTiers?` | `Record<string, "default" \| "long_context">` | Nivel ascendente por modelo para `github-copilot`. `long_context` envía `contextTier: "long_context"`. Los metadatos del catálogo crecen solo con un modelo exacto `modelContextWindows` valor que documenta la ventana soportada; ese valor gana antes de la tapa del proveedor. Un modelo desconocido mantiene su ventana observada. Las solicitudes passthrough no configuradas retienen una llamada suministrada `contextTier` campo en cualquier proveedor. |
| `modelInputModalities?` | `Record<string, string[]>` | Sugerencias de entrada por modelo, como `["text"]` o `["text", "image"]`. |
| `modelMaxInputTokens?` | `Record<string, number>` | Límites de entrada máximos positivos por modelo utilizados para las sugerencias de autocompactación del catálogo. |
| `modelAutoCompactTokenLimits?` | `Record<string, number>` | Presupuestos de autocompactación suaves positivos por modelo. Los valores solo pueden reducir la envolvente efectiva del 90% de contexto/entrada máxima y se omiten cuando no se resuelve ninguna ventana de contexto. Por canónico `openai`, las claves deben ser identificadores de modelo nativos compatibles exactos sin prefijos de proveedor o selector de cuenta. Proveedor PATCH fusiona entradas; establecer una clave para `null` para eliminarlo o todo el campo `null` Para limpiar el mapa. Estos `null` lápidas son PATCH-solamente. |
| `minMaxOutputTokens?` | `number` | Piso entero positivo opcional para positivo explícito `max_output_tokens` Presupuestos sobre `azure-openai`/`azure` Rutas Responses. Desactivar conserva la tapa de la persona que llama. Configurarlo autoriza el aumento de un límite más pequeño, lo que puede aumentar el uso de salida. Los presupuestos de solicitudes omitidas o no válidas no se modifican. |
| `defaultMaxOutputTokens?` | `number` | Proveedor en todo el país `openai-chat` fallback cuando el cliente omite `max_output_tokens`. |
| `modelMaxOutputTokens?` | `Record<string, number>` | Positivo por modelo `openai-chat` presupuestos de reserva; coincidencias exactas/patrón superan el valor predeterminado del proveedor. |
| `modelCosts?` | `Record<string, ProviderCostOverlay>` | Precios de visualización por modelo (USD por 1M tokens), tecleado por el id exacto del modelo ascendente de ese proveedor — no un identificador de proveedor o una ruta `provider/model` etiqueta, e.g. `{ "deepseek-v4-flash": { "input": 0.14, "output": 0.28, "cacheRead": 0.0028, "cacheWrite": 0 } }`. Cualquier id de modelo es una clave válida Los proveedores personalizados de — pueden dirigirse a cualquier punto final compatible con OpenAI a través del `openai-chat` adaptador y los identificadores de proveedores locales o internos funcionan incluso cuando están ausentes de los catálogos integrados. Los precios configurados por el usuario ganan sobre los catálogos incorporados en los registros `~$` y Estimaciones de uso; las entradas históricas se revalorizan a partir de la superposición actual, por lo que editar un precio puede moverse más allá de los totales. La orden de reserva es usuario `modelCosts` → exacta corrección oficial → catálogo de código de mandíbula → esperado-precio superposición → vendedor a nivel de modelo de reserva, y un explícito todo cero entrada de usuario significa un conocido cero estimación; borrar esa entrada de modelo para restaurar el precio automático. Todos los metadatos de catálogo cero todavía fallan. Cada velocidad debe ser un número finito no negativo como máximo 1.000.000 (USD por 1M tokens); las filas fuera de rango son rechazadas por el límite de administración y se eliminan en la carga. Estimación del tiempo de visualización solamente: las superposiciones nunca afectan el enrutamiento, la selección de cuentas, las cuotas o la facturación. |
| `headers?` | `Record<string, string>` | Autorización, cookies, archivos de texto, API-se rechazan los encabezados de las teclas, las líneas nuevas incrustadas y los nombres no válidos. — descubrimiento de modelos, pruebas de conexión y otros diagnósticos originados por proxy, como el Ollama mostrar sonda — enviar `User-Agent: opencodex` a menos que se establezca un agente de usuario aquí o por el proveedor preestablecido. |
| `forwardClientHeaders?` | `string[]` | `openai-responses` only: opte por copiar encabezados de metadatos de clientes entrantes en solicitudes de inferencia cuando el proveedor aún no ha establecido ese encabezado. Credenciales y nombres de propiedad del transporte, tales como `Authorization`, cookies, encabezados de teclas API, `Content-Type`, `Content-Length`, `Host`, y `x-oai-attestation` son rechazados y también filtrados en entorno de ejecución. Los nombres de encabezado son insensibles a mayúsculas y minúsculas y no pueden repetirse. `headers` sigue siendo autoritativo; el llamador existente `User-Agent` La reserva todavía se aplica cuando ninguna superficie pone uno. Nombres soportados: `originator`, `x-client-request-id`, `x-codex-app-version`, `user-agent`Todos los demás nombres son rechazados. |
| `supportsNativeCompactionTrigger?` | `boolean` | `openai-responses` solo: declara soporte para v2 nativo `compaction_trigger` elementos de entrada. Predetermina las puertas de enlace no canónicas; preserva la compactación nativa en lugar de solicitar un resumen de texto portátil. Independiente de las capacidades de reproducción v1 endpoint y blob. |
| `supportsNativeCompactEndpoint?` | `boolean` | `openai-responses` solo: declara soporte para v1 nativo `POST /responses/compact`. Desactivado por defecto para las puertas de enlace personalizadas. Las rutas clave/local/directas usan el Responses URL más `/compact` y su autenticación normal de transporte; OAuth mantiene la compactación enrutada y su ciclo de vida de credenciales existente. No habilita los disparadores v2 ni otorga la identidad oficial de OpenAI. |
| `decodesNativeCompactionBlobs?` | `boolean` | Declarar que este destino puede reproducir nativo, no`ocx1:` blobs de compactación. Independientemente de cualquier capacidad de generación; un desajuste de proveedor de servicio conocido todavía degrada el texto cifrado extraño. Habilite solo después de probar el compacto y una vuelta posterior en el mismo backend. |
| `openRouterRouting?` | `OpenRouterProviderRouting` | Por defecto OpenRouter `order`, `only`, y `allowFallbacks` preferencias; válido solo para canónicos OpenRouter con `openai-chat`. |
| `modelOpenRouterRouting?` | `Record<string, OpenRouterProviderRouting>` | El ID de modelo exacto reemplaza la preferencia OpenRouter de todo el proveedor. |
| `vercelGatewayRouting?` | `VercelGatewayRouting` | Puerta de enlace predeterminada de Vercel AI `order`, `only`, y `sort` (`"cost"` \| `"ttft"` \| `"tps"`) preferencias; válido solo para el canónico Vercel AI Gateway con `openai-chat`. |
| `modelVercelGatewayRouting?` | `Record<string, VercelGatewayRouting>` | El ID de modelo exacto reemplaza la preferencia de Vercel AI Gateway para todo el proveedor. |
| `authMode?` | `"key" \| "forward" \| "oauth" \| "local"` | Modo de autenticación (predeterminado) `key`) OAuth / credenciales de suscripción se almacenan fuera `config.json`; `local` se limita a los proveedores cuyo registro de entrada lo permita. |
| `codexAccountMode?` | `"pool" \| "direct"` | Canónico `openai` solo; por defecto es Pool. Direct evita el estado del grupo. |
| `refreshPolicy?` | `"proactive" \| "lazy-only" \| "disabled"` | Anule la política de Token Guardian de este proveedor de OAuth. |
| `reasoningEfforts?` | `string[]` | Etiquetas de razonamiento Codex para todo el proveedor para anunciar y enviar. Porque `google`proveedores de adaptadores, una escalera configurada también afirma `thinkingLevel` capacidad: las solicitudes directas y sin imagen de Vertex envían el esfuerzo seleccionado como `generationConfig.thinkingConfig.thinkingLevel`, mientras que Cloud Code Assist utiliza su ruta específica de envolvente. |
| `modelReasoningEfforts?` | `Record<string, string[]>` | Etiquetas por modelo. Una lista vacía oculta el control del esfuerzo. Como con `reasoningEfforts`Cada uno configurado `google`-adaptador de escalera afirma `thinkingLevel` capacidad; las solicitudes directas y sin imagen de Vertex utilizan la ruta plana Gemini, mientras que Cloud Code Assist la envía bajo su envolvente de solicitud. Un adaptador que envía su propia tabla por modelo (actualmente `command-code`) deja que la mesa gane en el alambre para los modelos que conoce, así que establece `modelReasoningEffortsAuthoritative` También para ampliar tal fila. |
| `modelReasoningEffortsAuthoritative?` | `boolean` | Trate a este proveedor `modelReasoningEfforts` como autoritativo en el cable, no solo en el catálogo. Sin él, un adaptador que envía su propia tabla de esfuerzo por modelo (actualmente `command-code`) anuncia su escalera ensanchada en el selector y luego despoja el peldaño extra en la salida. Es opt-in porque los configuración preestablecidos se siembran con la tabla enviada, por lo que una fila almacenada por sí sola no puede probar que la escribió en lugar de una versión anterior. Con él establecido, un peldaño que el flujo ascendente rechaza se devuelve como ese error en lugar de volver a intentarlo silenciosamente sin el esfuerzo — que solicitó, por lo que verá la respuesta. |
| `modelSuppressSyntheticMax?` | `Record<string, boolean>` | Interruptor por modelo solo para catálogo. `true` evita que OpenCodex agregue un material sintético faltante `max` peldaño mientras se mantiene un proveedor declarado `max` y continuar añadiendo `ultra` Escaleras de razonamiento. Una fila conservada que ya contiene `max` lo mantiene hasta que el descubrimiento sano reconstruye esa fila, porque el catálogo no persiste si un `max` Era sintético. Si un nombre predeterminado configurado falta `max`, el catálogo vuelve al peldaño real más alto debajo de él. Codex utiliza la misma membresía de escalera para el selector y explícito `spawn_agent` validación del esfuerzo, por lo que un `max` puede fallar en el lado del cliente antes de la sujeción proxy; `ultra` sigue siendo el camino del arnés soportado. |
| `modelSupportsReasoningSummaries?` | `Record<string, boolean>` | Establece un modelo para `false` para detener los resúmenes publicitarios y eliminar los campos de entrega de resumen. |
| `modelReasoningSummaryDelivery?` | `Record<string, "sequential" \| "sequential_cutoff" \| "concurrent" \| "concurrent_cutoff">` | Enum entrega Responses por modelo; reescribe un campo de entrega existente. |
| `modelAdapters?` | `Record<string, string>` | Por modelo `openai-chat` o `openai-responses` wire override para puertas de enlace mixtas. Las entradas explícitas superan a los valores predeterminados del registro. El preajuste OpenCode Go selecciona Responses para `gpt-5.6-luna` dejando los modelos hermanos en sus cables documentados; DeepSeek puede seleccionar Responses nativo para `deepseek-v4-flash`; Alibaba Token Plan (Pekín) pines `qwen3.8-flash`, `qwen3.7-plus`, y `glm-5.3` a su Responses nativo API para Responses solo entrante (verificado en vivo en esa puerta de enlace, incluida la reproducción de razonamiento de texto sin formato; Chat y Anthropic estancia entrante en Chat, y el resto de la familia se puede optar aquí); y GitHub Copiloto declara Responses-por defecto para los siguientes modelos (`gpt-5.3-codex`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.5`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `grok-4.5`, `grok-4.6`, `mai-code-1.1-flash`, `mai-code-1-flash-picker`porque esos modelos rechazan `/chat/completions` para el tráfico de agentes. Modelos sin un valor predeterminado incorporado (por ejemplo: `gpt-5.4-nano`) se puede optar aquí. Pines de un solo cable y anulaciones canónicas de rechazo directo ChatGPT. |
| xAI Chat Completions (panel / CLI) | interruptor | Grok 4.5/4.6 OAuth Responses solicita por defecto a Responses. Las anulaciones de chat existentes se migran una vez en la actualización; las opciones de chat posteriores se conservan. Activar para seleccionar Chat para ambos modelos, desactivar para seleccionar Responses. CLI: `ocx provider edit xai --xai-chat on` o `--xai-chat off` (correr proxy requerido). Mixto significa que solo un modelo utiliza actualmente Chat. Otras anulaciones y políticas de nivel permanecen sin cambios. Los valores predeterminados de API-key y Chat/Anthropic traducidos no cambian. Grok 4.7 por defecto a Responses en OAuth a través de su cable de registro predeterminado y puede usar Chat a través de una conexión explícita `modelAdapters["grok-4.7"] = "openai-chat"` Anular. |
| `xaiResponsesXSearch?` | `boolean` | Deshabilitado por defecto. En un xAI Responses destino, añade el proveedor alojado `x_search` declaración solo cuando una vida `web_search` La herramienta sobrevive a la normalización de la solicitud final. Las declaraciones existentes no están duplicadas, llamante `tool_choice`/`allowed_tools` Los selectores nunca se amplían, y esto está separado del sidecar de la búsqueda web. `search.xSearch` opciones. |
| `modelPreferHostedTools?` | `Record<string,string[]>` | Opción de modelo exacto para puertas de enlace Responses no directas que reservan un espacio de nombres de herramienta alojada. Actualmente solo acepta `["image_generation"]`; un modelo coincidente debe usar el `openai-responses` cable y soporte de esa herramienta alojada. Elimina el cliente en colisión `image_gen` declaraciones y reescribe sus selectores para preservar la elección de la herramienta de llamadas. Para OpenAI virtual API `-pro` modelos, el ID público seleccionado se empareja primero y el ID de modelo de cable base resuelto es un respaldo. `modelAdapters` primero resuelve el ID público, luego el ID base; la segunda resolución determina el cable final. Otros modelos conservan el comportamiento normal de alias. |
| `annotateEmptyToolOutputs?` | `boolean` | Reemplace un resultado de herramienta presente pero vacío con un marcador corto antes de que llegue al modelo, de modo que un resultado en blanco no se lea como faltante. Se aplica a cadenas en blanco y matrices de partes solo de texto; nunca se tocan imágenes, archivos ni partes cifradas. Predeterminados a `true` para DeepSeek desde el registro integrado y de lo contrario no está configurado. Establecer `false` para optar por un proveedor fuera de — un explícito `false` se conserva en ediciones posteriores que omiten el campo. `PATCH /api/providers?name=<provider>` acepta `true`, `false`, o `null` para borrar la anulación y volver al comportamiento predeterminado del registro. |
| `unsupportedHostedTools?` | `string[]` | La herramienta alojada declara que este destino Responses rechaza, por lo que se eliminan de `tools`, desde el cliente-cargado `additional_tools`, y desde `tool_choice` En lugar de ser reenviado y rechazado de origen. Utilícelo para una puerta de enlace compatible con OpenAI con un conjunto de capacidades más estrecho — que acepte solicitudes simples Responses y `function` herramientas, pero devuelve HTTP 400 para alojado `web_search` — para que un mensaje de solo texto no falle por una capacidad que nunca necesitó. Acepta solo nombres de tipo de herramienta alojados (`web_search`, `web_search_preview`, `file_search`, `computer_use_preview`, `computer_use`, `code_interpreter`, `image_generation`, `image_gen`, `mcp`, `tool_search`, `local_shell`, `x_search`); un nombre no reconocido es rechazado en lugar de silenciosamente ignorado. Las variantes de ortografía de una capacidad se aliased, así que `["web_search"]` También niega `web_search_preview`. Un proveedor no puede negar una herramienta alojada aquí y preferirla en `modelPreferHostedTools`. Xiaomi MiMo Responses destinos (`xiaomimimo.com` y sus subdominios, incluyendo `api.xiaomimimo.com` y `token-plan-cn.xiaomimimo.com`) automáticamente tira `web_search` y `web_search_preview` conservando las herramientas de función; no se necesita ninguna declaración para estos hosts. Esto es independiente de `supportsResponsesCustomTools`; establece ambos para una puerta de enlace que también rechaza las herramientas personalizadas nativas. `PATCH /api/providers?name=<provider>` Acepta una matriz o `null` No lo puedo evitar. |
| `reasoningEffortMap?` | `Record<string, string>` | Alias de cable en todo el proveedor para etiquetas de razonamiento. Asignar una etiqueta a `"__omit__"` para eliminar el campo de razonamiento de la solicitud ascendente por completo: `reasoning_effort` en un cable compatible con OpenAI, y nativo de Ollama `think` campo en el adaptador nativo Ollama (no 2356). |
| `modelReasoningEffortMap?` | `Record<string, Record<string, string>>` | Alias de cable por modelo para etiquetas de razonamiento. Asignar una etiqueta a `"__omit__"` para eliminar por completo el campo de razonamiento de la solicitud ascendente. |
| `reasoningWireFormat?` | `"gateway-object"` | Para pasarelas compatibles con OpenAI que acepten `reasoning: { enabled, effort }` en lugar de `reasoning_effort`. El preajuste ClinePass lo establece automáticamente. Un proveedor de guardar que mantiene el destino lo mantiene; ver [Lo que un proveedor guarda](#what-a-provider-save-keeps). `PATCH` acepta `"gateway-object"` o `null` No lo puedo evitar. |
| `noReasoningModels?` | `string[]` | Modelos que rechazan los parámetros de razonamiento/pensamiento. |
| `noTemperatureModels?` | `string[]` | Modelos que rechazan la llamada especificada `temperature`. |
| `noTopPModels?` | `string[]` | Modelos que rechazan la llamada especificada `top_p`. |
| `noStopModels?` | `string[]` | Modelos que rechazan la llamada especificada `stop`. Los `openai-chat` el adaptador, el paso de chat y el paso de Responses omiten el campo para esos ids. El incorporado `xai` preestablecido enumera sus modelos de razonamiento (`grok-4.7`, `grok-4.6`, `grok-4.5`, `grok-4.3`, `grok-4.20-multi-agent-0309`, `grok-4.20-0309-reasoning`, `grok-build-0.1`), que xAI documentos como rechazarlo; `grok-4.20-0309-non-reasoning`, `grok-composer-2.5-fast` mantener llamante `stop`. |
| `noPenaltyModels?` | `string[]` | Modelos que rechazan penalizaciones de presencia/frecuencia. El incorporado `xai` preestablecido enumera sus modelos de razonamiento (`grok-4.7`, `grok-4.6`, `grok-4.5`, `grok-4.3`, `grok-4.20-multi-agent-0309`, `grok-4.20-0309-reasoning`, `grok-build-0.1`), que xAI documentos como rechazarlos; ID no razonando mantener las sanciones de llamada. |
| `noStructuredOutputModels?` | `string[]` | IDs de modelo exactos cuyos `openai-chat` Endpoint rechaza `response_format`. Solo una coincidencia exacta del modelo solicitado omite el campo; la traducción de salida estructurada permanece habilitada para todos los demás `openai-chat` modelo. |
| `noJsonSchemaModels?` | `string[]` | IDs de modelo exactos cuyos `openai-chat` El endpoint rechaza a `json_schema` `response_format` pero aún así acepta `json_object`. Dicha solicitud se rebaja a `json_object` en lugar de ser eliminado, por lo que una persona que llama pidiendo JSON todavía obtiene JSON. `noStructuredOutputModels` gana cuando un modelo está en ambas listas. Los `opencode go` y `opencode zen` presets envía esto para sus rutas DeepSeek. |
| `foldDeveloperRoleToSystem?` | `boolean` | Si un `openai-chat` destino acepta el `developer` Rol. `foldDeveloperRoleToSystem` unset envía `system`, `true` envía `system`, y `false` envía `developer`. Inestable significa que no se ha registrado nada sobre este destino; `true` registra un flujo ascendente que rechaza el rol; `false` graba uno que lo acepta. El mensaje mantiene su posición en la conversación en todos los casos — solo cambia el rol. Un destino que rechaza las respuestas de rol `400 role 'developer' is not allowed` y el turno nunca comienza, por lo que el estado no registrado es el plegado. Un proveedor de guardar que mantiene el destino lo mantiene; ver [Lo que un proveedor guarda](#what-a-provider-save-keeps). `PATCH` acepta un booleano o `null` No lo puedo evitar. |
| `omitReasoningEffortWithToolsModels?` | `string[]` | Exacto `openai-chat` ID de modelo que aceptan un campo de esfuerzo de razonamiento en un turno ordinario pero lo rechazan una vez que las herramientas de función están presentes. El modelo mantiene su escalera de esfuerzo anunciada; OpenCodex omite el campo de cable solo para solicitudes de soporte de herramientas y se aplica el valor predeterminado ascendente. Más estrecho que `noReasoningModels`, que elimina el razonamiento de cada solicitud y le cuesta al modelo su selector por completo. Un proveedor de guardar que mantiene el destino lo mantiene; ver [Lo que un proveedor guarda](#what-a-provider-save-keeps). |
| `parallelToolCalls?` | `boolean` | Alternar las llamadas de herramientas paralelas. OpenAI Chat se activa por defecto; los adaptadores que no son de chat se anuncian solo en explícito `true`. |
| `terminalContinuationGuard?` | `boolean` | Optar por un `openai-chat` proveedor a uno interno limitado vuelve a preguntar cuando un turno accionable anuncia el trabajo, luego se detiene limpiamente sin una llamada a la herramienta. Predeterminados a `false`; explícito `false` Se comporta como una omisión. Se excluyen los intentos combinados y los giros de compactación enrutados, y no`openai-chat` Los adaptadores ignoran esta opción. |
| `responsesItemIdRepair?` | `{ message?: string[]; reasoning?: string[]; repairMissingTerminalIds?: boolean; repairInvalidIds?: boolean }` | Deshabilitado por defecto del cliente SSE reparación para los identificadores de marcador de posición exactos, los identificadores de terminales faltantes y (con `repairInvalidIds`) message/rasoning ids falta el canónico `msg_`/`rs_` prefijo. Los identificadores de llamada de función nunca se reescriben. El DeepSeek incorporado habilita los dos últimos de forma predeterminada. |
| `responsesSnapshotRepair?` | `boolean` | Reparación orientada al cliente desactivada por defecto para las escasas instantáneas del ciclo de vida Responses en SSE y JSON. Rellena el estado canónico faltante, la salida y los metadatos de la herramienta mientras que la inspección en bruto y la persistencia permanecen sin cambios. |
| `webSearchBridge?` | `{ enabled?: boolean; backend?: "ollama" \| "openai" \| "anthropic" \| "xai" \| "gemini" \| "exa"; maxSearches?: number; timeoutMs?: number; endpoint?: string }` | Clave-auth `openai-responses` Solo proveedores PassThrough. Desactivado por defecto. Codex siempre declara el hosted `web_search` herramienta, y el paso a través lo retransmite en la suposición de que el destino lo ejecuta. Una puerta de enlace que no ejecuta las respuestas de búsqueda alojadas con un `function_call` nombrados `web_search` que nada corre, y el guardia de herramientas no declaradas termina el turno. Con `enabled: true` y una explícita `backend` OpenCodex intercepta esa llamada, ejecuta la búsqueda en sí misma, devuelve el resultado al mismo flujo ascendente y muestra a Codex un hosted `web_search_call` celda. Nunca armados para `authMode: "forward"` (ChatGPT ya busca) o un proveedor que ejecuta la búsqueda alojada en sentido ascendente. `backend` es necesario; no hay un valor predeterminado implícito y una credencial faltante para el backend nombrado deja el puente desarmado en lugar de caer a través de otra búsqueda pagada. `ollama` reutiliza la clave API de este proveedor en `POST <origin>/api/web_search`El origen debe ser `https://ollama.com` A menos que el operador nombre `endpoint` explícitamente. `openai` / `anthropic` / `xai` / `gemini` / `exa` Reutilizar el ejecutor de sidecar correspondiente y la credencial del propio ejecutor (`webSearchSidecar.exaApiKey` por Exa). El modelo de búsqueda viene de `webSearchSidecar.model` Solo cuando `webSearchSidecar.backend` resuelve el mismo backend que los nombres de este puente; de lo contrario, el puente ejecuta el propio valor predeterminado de ese backend, porque un modelo elegido para un proveedor es rechazado por otro. Un unset `webSearchSidecar.backend` resuelve a `openai`, por lo que un modelo unset-backend alcanza un `openai` puente y no otro. No hay anulación del modelo de puente por proveedor. Streaming de giros solamente. Un giro que mezcla `web_search` con otra llamada a la herramienta cliente aún falla cerrada en lugar de dejar caer la llamada del cliente. Texto del asistente como XML-like `<web_search>` La prosa no es ejecutada. Predeterminados: `maxSearches: 3` (1..10), `timeoutMs: 60000` (1000..600000). |
| `retryOn429?` | `{ enabled?: boolean; attempts?: number; intervalMs?: number; maxIntervalMs?: number; respectRetryAfter?: boolean }` | Solo proveedores de claves API (`authMode: "key"`) 429 reintentar: cuando `retryOn429` está ausente la característica está desactivada, excepto que el código de comando y el código de OpenCode clave-auth (puntos finales canónicos) vuelven a una política del paciente (6 repeticiones, intervalo de 10 s, límite de 60 s); la presencia de objetos lo habilita a menos que `enabled: false`, lo que también hace que ese retroceso se desvíe. En 429 el proxy espera (de origen) `Retry-After` o el intervalo fijo) y reproduce la solicitud idéntica en la misma clave antes de cualquier conmutación por error de clave — a través del bucle de recuperación de giro de texto principal, el cable de paso Responses, el puente de imagen/vídeo, el sidecar de búsqueda web y las continuaciones de terminal. Solo las respuestas previas a la transmisión HTTP 429 son elegibles para la repetición; personalizado `runTurn` Los transportes están fuera del bucle de reintento HTTP. `attempts` Cuenta las repeticiones de la misma clave después de los primeros 429 (envíos totales). `attempts` + 1) y es un presupuesto de toda la solicitud compartido por el bucle de recuperación principal, la continuación de la protección de terminal y los reintentos de puente. Agotamiento `attempts` solo se detiene más repeticiones de la misma clave: la conmutación por error de la tecla normal o el manejo del error final se aplica según los objetivos disponibles — en el cable de paso de la autenticación de la tecla no hay conmutación por error, por lo que el 429 agotado aparece tal cual. Codex en sí nunca vuelve a intentar 429, por lo que esta es la única defensa para los proveedores de una sola clave. Predeterminados: `enabled: true`, `attempts: 3`, `intervalMs: 5000`, `maxIntervalMs: 60000` (Cualquier espera se limita a `maxIntervalMs`, en sí mismo limitado a 600000), `respectRetryAfter: true`. |
| `transientRetryOn5xx?` | `{ enabled?: boolean; attempts?: number }` | Clave-auth `openai-chat` y `openai-responses` proveedores solamente. `authMode: "forward"` Los proveedores (el grupo de cuentas ChatGPT) nunca leen esta opción y mantienen la escalera predeterminada. Reintentar el reintento de pre-flujo de estados ascendentes transitorios (500, 502, 503, 504, 520, 521, 522): medios ausentes desactivados, la presencia del objeto lo habilita a menos que `enabled: false`. Cubre la solicitud inicial Responses, el carril de paso Responses y cada una de sus etapas de recuperación (reproducción OAuth-401, reproducción 429 del mismo objetivo, reconstrucción validada), la continuación del protector terminal y la reconstrucción nativa. `/v1/chat/completions`. `attempts` es el número TOTAL de los envíos ascendentes permitidos para una solicitud, incluido el primero (1..10, por defecto 3) — es un presupuesto compartido con la recuperación de conexión-reset, por lo que `3` significa que como máximo tres solicitudes reales llegan al proveedor. En el carril de paso Responses, el valor configurado se cruza adicionalmente con la asignación de envío de toda la solicitud, por lo que un valor por debajo de esa asignación estrecha la escalera exactamente mientras que un valor por encima de ella no eleva el límite. Cada objetivo Combo incluye su primer envío prepagado en el total configurado de ese objetivo; `attempts: 1` envía una vez, sin reembolsar la reserva ni ampliar el límite combo compartido. Una negativa o cancelación local antes del envío libera una reserva no enviada. Las esperas usan un retroceso exponencial fijo de 400 ms limitado a 5 s y honor `Retry-After`. Separado de `retryOn429`, que maneja la limitación de velocidad; los fallos a mitad de transmisión nunca se repiten. |
| `retryOnReset?` | `{ enabled?: boolean; replacements?: number }` | Nativo `openai-responses` proveedores, incluyendo `authMode: "forward"`, más el despacho genérico traducido de Responses antes de los encabezados ascendentes. Reemplazo opt-in de un envío que falló mientras la persona que llamó no había observado nada: ausencia de medios, presencia de objeto lo habilita a menos que `enabled: false`. Cubre ambas etapas ambiguas — una conexión que murió antes de cualquier encabezado de respuesta, y un SSE cuerpo que murió después del encabezado mientras llevaba solo eventos de control. ChatGPT de origen WebSocket que se cerró o se equivocó después de su creación, antes de que cualquier Responses evento, se cubre de la misma manera, y su reemplazo se envía sobre HTTP. Solo se sustituye una solicitud autónoma: `store: false`, completa `input`, no `previous_response_id`, `conversation` o `stream_id`y solo herramientas ejecutadas por el cliente. `replacements` es el número de envíos de reemplazo que ONE puede realizar en cada pierna y en cada hijo combinado (1..2, por defecto 1) — no es un recuento de reintentos por pierna y no un presupuesto de envío, por lo que un reemplazo aún tiene que caber dentro de la asignación de envío que ya tenía la pierna. Una solicitud que ya ha emitido una salida o una llamada a la herramienta nunca se reemplaza, cualquiera que sea el valor establecido. La inferencia de reemplazo aún puede facturarse si el origen ya había iniciado la primera, por lo que está desactivada por defecto. El despacho traducido genérico admite el reemplazo de reinicio previo a la cabecera para los envíos iniciales y reconstruidos bajo el mismo presupuesto de subvención y envío. Los transportes propiedad del adaptador y los errores de flujo traducidos después de que se excluyen las cabeceras ascendentes. |
| `autoToolChoiceOnlyModels?` | `string[]` | Modelos cuyos `tool_choice` acepta solo `auto` o `none`; las opciones forzadas son degradadas. |
| `preserveReasoningContentModels?` | `string[]` | Modelos que requieren asistente previo `reasoning_content` en la historia del chat. Un proveedor de guardar que mantiene el destino mantiene la lista almacenada, incluyendo `[]`; ver [Lo que un proveedor guarda](#what-a-provider-save-keeps). `PATCH /api/providers?name=<provider>` Acepta una matriz o `null` No lo puedo evitar. |
| `inlineThinkTagModels?` | `string[]` | Recuperación opt-in para `openai-chat` gateways sin un analizador de razonamiento del lado del servidor. Un líder `<think>` / `<thinking>` / `<reasoning>` bloque (opcionalmente después de espacio en blanco) activa la división en las respuestas transmitidas y almacenadas en búfer. Toda la respuesta se conserva en blanco. Las etiquetas posteriores son delimitadoras en cualquier lugar, incluyendo el intercalado de la misma línea y las vallas de código; este modo no interpreta Markdown. El texto ordinario o una cerca de código antes de la primera etiqueta mantiene toda la respuesta intacta. Por defecto; prefiere el razonamiento ascendente estructurado o `reasoningSplitModels` donde se apoya. |
| `reasoningDetailsModels?` | `string[]` | Modelos cuyo punto final devuelve el pensamiento como una estructura `reasoning_details` matriz (MiniMax M-series con `reasoning_split`); los deltas de flujo son instantáneas acumulativas que se diffed por prefijo, y conserva las repeticiones de razonamiento como un `reasoning_details` array en lugar de a `reasoning_content` cadena. |
| `requiresReasoningPlaceholderModels?` | `string[]` | Modelos cuyo flujo ascendente rechaza una continuación tool_call que falta `reasoning_content` (Modo de pensamiento DeepSeek); se inyecta un marcador de posición mínimo cuando la caché de reproducción falla. Predeterminados a `preserveReasoningContentModels`; set `[]` para optar por no participar. Un proveedor de guardar que mantiene el destino mantiene la lista almacenada, incluyendo `[]`; ver [Lo que un proveedor guarda](#what-a-provider-save-keeps). `PATCH /api/providers?name=<provider>` Acepta una matriz o `null` No lo puedo evitar. |
| `showThinkingSummary?` | `boolean` | Muestra los resúmenes redactados por el proveedor cuando un cliente de Responses omite `reasoning.summary`. Un `"none"` explícito en el protocolo tiene prioridad; no se puede distinguir un cliente que expresa su preferencia omitiendo el campo. El razonamiento sin procesar sigue siendo contenido y nunca se renombra como resumen. El preajuste `google-antigravity` usa `true` de forma predeterminada; un `false` explícito lo desactiva. Las solicitudes compatibles de CCA, Vertex y Gemini directo también habilitan `generationConfig.thinkingConfig.includeThoughts` al habilitar la visualización; las solicitudes de imágenes, Claude, gpt-oss y Vertex sin escala de razonamiento no lo hacen. No cambia la configuración del cliente ni los valores globales de resumen del catálogo. |
| `hideRawReasoning?` | `boolean` | Mantenga la cadena de pensamiento de un proveedor enrutado fuera del canal de contenido orientado al cliente (openai-chat) `reasoning_content`, etiquetas kiro, `response.reasoning_text.*`) mientras que los resúmenes de autoría del proveedor todavía se transmiten en el canal de resumen. Alambre explícito `reasoning.summary: "none"` Sigue ocultando ambos. Esto controla lo que muestra un cliente; no guarda el texto del cliente. Una ruta de puente Responses todavía lo envía dentro del `ocxr1` En el caso de la `encrypted_content`, que es base64 JSON en lugar de cifrado, por lo que el cliente puede hacer eco de nuevo en el siguiente turno. Los codificadores directos Chat y Messages no tienen envolvente en su cable, por lo que esos clientes no reciben copia y la reproducción proviene de la caché de reproducción razonada del lado del servidor. `preserveReasoningContentModels` La reproducción y las continuaciones al estilo DeepSeek no se ven afectadas de ninguna manera. Desactivado de forma predeterminada; una ruta de paso nativa transmite los propios fotogramas del flujo ascendente e ignora esta opción. Un guardado del mismo nombre de proveedor mantiene un valor omitido incluso después de un movimiento de destino; `PATCH` acepta un booleano o `null` No lo puedo evitar. |
| `thinkingToggleModels?` | `string[]` | Modelos de chat usando `thinking.enabled` en lugar de una escalera de esfuerzo. |
| `thinkingBudgetModels?` | `string[]` | Modelos de chat usando enteros `thinking_budget`; mapas de esfuerzo a una fracción de presupuesto. |
| `noVisionModels?` | `string[]` | Modelos de solo texto enviados a través del sidecar de visión; la coincidencia tolera un Ollama `:size` etiqueta. |
| `escapeBuiltinToolNames?` | `boolean` | Escápese de los nombres de herramientas incorporados para las puertas de enlace compatibles con Anthropic y restaurelas en las llamadas devueltas. |
| `anthropicEofTolerance?` | `boolean` | Deje que una puerta de enlace compatible con Anthropic complete un flujo que termina antes `message_stop`, solo cuando se recibió texto visible o una entrada completa de la herramienta JSON-objeto. Desactivado por defecto. |
| `googleMode?` | `"ai-studio" \| "vertex" \| "cloud-code-assist"` | Modo de transporte/auth Google. Predeterminado `ai-studio`. |
| `googleToolSchemaPolicy?` | `"compatible" \| "reject-lossy"` | Solo Google. Omitidos/`compatible` conserva el esquema de herramienta compatible y la reparación no directa 400 existente. `reject-lossy` Rechaza la pérdida inicial del esquema o una comparación limitada indeterminada antes del envío y retiene una reparación de Vertex o Cloud Code Assist que abriría restricciones. Direct AI Studio nunca realiza esa reparación. |
| `directGeminiWireRenames?` | `boolean` | Solo Google. Se aplica en el modo AI Studio, incluidas las URL personalizadas compatibles con Google. Omitido o `true` mantiene la `-tiered` cambiar el nombre del cable para Gemini Flash ids (`gemini-3.7-flash` -> `gemini-3.7-flash-tiered`); `false` envía los ids desnudos solicitados al cable sin cambios. Las rutas Vertex y OpenCode Zen con clave canónica conservan el ID del modelo solicitado independientemente de esta configuración; El enrutamiento de Cloud Code Assist no cambia. Establecer `false` cuando el configurado de origen todavía sirve a los ID desnudos. |
| `project?` | `string` | Id. del proyecto Vertex o Antigravety Cloud Code Assist. Las teclas Vertex API usan este punto final del proyecto cuando está configurado; sin él usan el modo expreso, incluso si `GOOGLE_CLOUD_PROJECT` está establecido. ADC vuelve a `GOOGLE_CLOUD_PROJECT` / `GCLOUD_PROJECT`. |
| — | — | Sondas de cuota de la cuenta antigravedad (`retrieveUserQuota` y `retrieveUserQuotaSummary`) siempre vaya al host de código en la nube de Google a través del transporte saliente anclado, independientemente de si está configurado `baseUrl`; el portador de la cuenta nunca se envía a un punto final configurado por el operador y una redirección aborta la sonda. Solo la lista de modelos sigue honrando `baseUrl`. |
| — | — | Si el resumen de cuota de antigravedad devuelve 403 para una cuenta OAuth válida, OpenCodex reintenta ese punto final una vez con la cuenta heredada. `antigravity/1.0` User-Agent y el mismo token y proyecto. Un 401 no es reintentado. La inferencia y el descubrimiento de modelos retienen el agente de usuario IDE. |
| — | — | Cuota de antigravedad muestra Gemini 4 argón como separado `Argon` / `Argon (Weekly)` ventanas junto a Gem y Cla. Solo se muestran: la clasificación de la cuenta, el agotamiento de la cuota, el restablecimiento de las notificaciones de pedido y restablecimiento siguen utilizando las ventanas Gemini y Claude, y las solicitudes de argón aún se evalúan por la ventana Gemini. |
| `location?` | `string` | Ubicación de Vertex. Los endpoints de proyecto API-key tienen por defecto `global` e ignorar `GOOGLE_CLOUD_LOCATION`; ADC requiere este campo o el `GOOGLE_CLOUD_LOCATION` fallback. Gemini 4 Soportes de argón `global`, `us`, y `eu`. |
| `mcpServers?` | `Record<string, CursorMcpServerConfig>` | Cursor solo: stdio o Streamable HTTP MCP servidores. |
| `desktopExecutor?` | `DesktopExecutorConfig` | Solo Cursor: comandos externos de uso del ordenador y de pantalla de registro. |
| `unsafeAllowNativeLocalExec?` | `boolean` | Cursor legado booleano, equivalente a `nativeLocalExec: "on"` solo cuando el campo más nuevo no esté establecido. |
| `nativeLocalExec?` | `"off" \| "codex-sandbox" \| "on"` | Política de Cursor local-exec. `off` es por defecto; `codex-sandbox` Actualmente falla cerrado como `off`. |

Los valores predeterminados de esfuerzo por modelo enviados de Command Code incluyen mediciones API en vivo. DeepSeek v4/v4.1 Flash (incluyendo v4 Flash Visión), GLM-5.3 y GLM-5.3-Flash, Qwen3.8-Flash, y soporte para Gemini-3.7-Flash `low`, `medium`, `high`, `xhigh`, y `max`. Las escaleras permanecen modelo específico: `poolside/laguna-s-2.1-free` Solo ofertas `medium`, mientras que Gemini-3.8-Flash y oferta MiMo-v2.5-Pro `low`, `medium`, y `high`. Para anular un código de comando anclado fila, conjunto `modelReasoningEffortsAuthoritative: true` Junto con este modelo
`modelReasoningEfforts` lista.

Registro y sustitución de proveedores (`POST /api/providers`) validar `responsesPath` y `chatCompletionsPath` antes de cambiar la configuración en vivo o el estado del disco. `PATCH /api/providers?name=<provider>` fusiona el cuerpo de la solicitud con el proveedor almacenado; actualiza los campos de contacto más allá `disabled` — excepto `requestPacing`-sólo actualiza — validar las rutas del proveedor fusionado de la misma manera antes de guardar, y una ruta retenida no válida vuelve `400` con la configuración sin cambios. Las mismas reglas de ruta se aplican cuando se carga un archivo de configuración.

Por ejemplo, esto aplica un límite de concurrencia para todo el proveedor y un límite más estricto a un modelo exacto, sin configurar un intervalo:

```json
{
  "requestPacing": {
    "enabled": true,
    "maxConcurrentRequests": 8,
    "models": {
      "nvidia/llama-3.1-nemotron-ultra-253b-v1": {
        "maxConcurrentRequests": 2
      }
    }
  }
}
```

El intervalo de simultaneidad permanece ocupado hasta que finaliza la solicitud ascendente, incluyendo los bytes de respuesta transmitidos finales. Las solicitudes por encima de los límites aplicables del proveedor y del modelo esperan en la cola de estimulación; cuando se libera un intervalo, se admite la siguiente solicitud elegible. La espera de cola no consume el tiempo de espera del encabezado de respuesta ascendente.

Para múltiples entradas de grupo de claves API, opte por la distribución normal-request por separado de la selección de fallos existente. `apiKeyPoolStrategy`:

```json
{
  "requestPacing": {
    "enabled": true,
    "keySelection": "round-robin",
    "maxConcurrentRequests": 10,
    "keys": { "requestsPerMinute": 15, "maxConcurrentRequests": 1 }
  }
}
```

Esto admite como máximo diez solicitudes activas en todo el proveedor y una por referencia de credencial, con inicios en cada referencia con al menos cuatro segundos de diferencia. Estos son límites superiores locales, no una promesa de capacidad ascendente. Una configuración RPM para todo el proveedor, cuando está presente, sigue siendo un límite agregado y no se multiplica con el recuento de claves. Los límites clave abarcan modelos; las reglas del modelo siguen siendo restricciones adicionales. Los proyectos que comparten cuota necesitan un límite agregado apropiado. TPM y las cuotas diarias no se rastrean aquí.

Round-robin selecciona claves por solicitud sin guardar una nueva clave activa. Se omiten los tiempos de reutilización 401/429 conocidos; cuando ninguno sigue siendo elegible, las nuevas solicitudes reciben un 429 reintentable en lugar de enviarse repetidamente. El trabajo ya puesto en cola normalmente retiene su clave seleccionada y puede esperar detrás de esa clave incluso cuando otra está inactiva. Si esa selección se enfría o no es válida, la solicitud vuelve a seleccionar una clave elegible y vuelve a adquirir la admisión de estimulación; la cola limitada expira en lugar de esperar para siempre. La selección y los diagnósticos son locales de proceso, se restablecen al reiniciarse y no igualan el uso o la facturación equilibrados de token. Comienza a contar las admisiones de estimulación, incluido el trabajo cancelado antes del envío. OAuth y las credenciales reenviadas mantienen su selección existente. El panel de control muestra los identificadores de teclas, los inicios, el trabajo en vuelo, el trabajo en cola y los tiempos de reutilización conocidos, nunca los valores de las claves secretas. Estos límites cubren el ejecutor de estimulación de inferencia, no el fetch directo del relé de imágenes independiente.

<a id="azure-openai-model-metadata-discovery"></a>

### Azure OpenAI descubrimiento de metadatos del modelo

Para una base URL cuyo nombre de host termina en `.openai.azure.com`, descubrimiento llena la imagen/texto faltante soporte de entrada y límites de contexto/salida incluso cuando el proveedor tiene un nombre personalizado. Azure
`/models` Los indicadores de inferencia y chat por sí solos no describen el soporte de imágenes o los límites de token. opencodex los complementa con el público [models.dev catálogo](https://models.dev), usando su Azure filas antes de los metadatos Azure agrupados y otros paquetes de proveedores. La búsqueda de ID de modelo es exacta o insensible a mayúsculas; un modelo recién publicado no requiere una nueva versión de opencodex.

La instantánea de metadatos públicos se actualiza durante el descubrimiento como máximo una vez cada 24 horas, con un 2 segundos y un límite corporal de 16 MiB. Se almacena en `azure-model-metadata-cache.json`
bajo el directorio de configuración opencodex. No se envían credenciales Azure al catálogo público. El descubrimiento sin conexión mantiene los metadatos obsoletos en caché o vuelve a las sugerencias agrupadas; generación solicitudes no hacen fetch esta instantánea.

Las declaraciones de insumos explícitos y las modalidades notificadas siguen teniendo prioridad, incluidas las notificadas
`vision: false`. Todavía se aplica la cobertura de sidecar de visión existente. Límites informados/configurados siguen siendo autoritativos y las tapas de los proveedores aún los sujetan. Los metadatos describen el soporte del modelo, no una capacidad de despliegue particular. Alias de despliegue arbitrarios como
`my-production-model` no se puede asignar desde los indicadores de inferencia Azure; establecer `modelInputModalities`
y `modelContextWindows` para esa identificación exacta cuando sea necesario. Los identificadores desconocidos no se adivinan.

<a id="what-a-provider-save-keeps"></a>

### Lo que un proveedor guarda

`POST /api/providers` con el nombre de un proveedor existente reemplaza la fila almacenada por una construida a partir de la solicitud. El formulario de agregar/editar del panel no puede enviar todos los campos, por lo que el guardar guarda algunos campos almacenados que omite la solicitud. Ocho de ellos registran cómo se comporta un flujo ascendente: `preserveReasoningContentModels`, `requiresReasoningPlaceholderModels`, `foldDeveloperRoleToSystem`, `reasoningWireFormat`, `omitReasoningEffortWithToolsModels`, `retryOn429`, `transientRetryOn5xx` y `retryOnReset`.

| Guardar | Los ocho escenarios | Almacenado `apiKeyPool` |
| --- | --- | --- |
| Mismo destino, campo omitido | El valor almacenado se mantiene, incluyendo un valor explícito. `[]` o `false` | Conservado |
| Nuevo destino, campo omitido | No se mantiene; pueden aplicarse los valores predeterminados del registro para el nuevo destino | No se conserva |
| Campo enviado en la solicitud | El valor de la solicitud | El valor de la solicitud |

El destino es el adaptador, la base URL (esquema y host comparado sin tener en cuenta el caso, barras diagonales ignoradas) y, cuando la solicitud nombra uno, el modo de autenticación. Mover un proveedor a otro destino elimina las ocho configuración porque describen el flujo ascendente anterior y elimina el grupo de claves porque se emitieron sus claves para él. Un salvamento nunca fusiona el resto de la fila antigua en la nueva.

`hideRawReasoning` es una directiva de visualización del operador, por lo que guardar el mismo nombre de proveedor mantiene su valor almacenado cada vez que la solicitud lo omite, incluso después de un movimiento de destino. Un valor enviado en la solicitud gana, incluyendo `false`.

El opcional `inferContextWindow` también sobrevive al mismo nombre guarda que lo omite, incluyendo destino se mueve. Su comportamiento de lectura, actualización y claridad se describe en
[Ventanas de contexto en proveedores personalizados](#context-windows-on-custom-providers).

`PATCH /api/providers?name=<provider>` cambia solo los campos que nombra y mantiene todos los demás campos almacenados, cualquiera que sea el destino. Acepta los ocho configuración; `null` Aclara uno. También acepta un booleano `hideRawReasoning` o `null` No lo puedo evitar. Para las dos listas de razonamiento, una matriz vacía se almacena como una exclusión explícita en lugar de eliminarla.

Con `webSearchBridge` activado, una continuación de búsqueda permanece vinculada a la selección de clave API que Sirvió la primera petición. Cambiar la clave seleccionada, su valor de referencia o resuelto, autenticación modo, o base URL durante la búsqueda o el ritmo del proveedor termina el turno con un error de puente antes de otro Se envía la solicitud del proveedor. El cambio y la vuelta también terminan esa continuación. Iniciar un nuevo turno para Utilice la nueva selección. La selección cambia antes de que el primer proveedor envíe la retención de reselección normal.

Un resultado de búsqueda puenteado se muestra al proveedor nuevamente en el siguiente turno de la conversación solo para la misma persona que llama, conversación, proveedor, modelo y clave seleccionada. El llamador es identificado por el opencodex API clave que presenta, por lo que un cliente que envía ninguna opencodex API clave no obtiene tal reproducción: sus celdas de búsqueda anteriores llegan al proveedor sin cambios, como lo hacen para un proveedor sin el puente.

Una explícita `inlineThinkTagModels` list reemplaza los valores predeterminados del registro coincidentes; `[]` Desactiva la recuperación.

Solicitudes Responses traducidas con un esfuerzo de razonamiento activo validado cuando `reasoning.summary` se omite. Explícito `"none"` lo mantiene oculto para la repetición; omisión sin un esfuerzo activo también permanece oculto. Un combo inyectado por defecto agrega `summary: "auto"`
solo cuando la persona que llama no ha elegido un modo de resumen. Razonamiento crudo nunca es reetiquetado como un resumen de autoría del proveedor, y Codex todavía controla su pantalla con `show_raw_agent_reasoning`.

Modelo personalizado `reasoningEfforts` normalmente anulan los metadatos del proveedor descubierto. El limitado excepción es una fila personalizada explícita cuyo identificador de modelo ha fijado las capacidades nativas de Codex, incluyendo Astra o Daybreak en una puerta de enlace arbitraria: su lista anunciada se cruza con Ese modelo tiene capacidades nativas. La identidad nativa completa todavía requiere el canónico
`openai` Codex-destino directo. Una lista vacía explícita permanece vacía sin defecto; a lista incompatible no vacía vuelve al valor predeterminado nativo como una sola opción. Los valores predeterminados deben Pertenece a la lista final. Esto cambia la proyección del catálogo, no la configuración almacenada. Véase [ejemplos de catálogo nativos personalizados](/es/guides/codex-app-models/).

<a id="per-provider-egress"></a>

### Salida por proveedor

Establecer `proxy` en un proveedor cuando ese flujo ascendente necesita una salida diferente del proxy de todo el proceso:

- Omita `proxy` para heredar el proxy global y `NO_PROXY` decisión.
- Establecer `proxy` a `"direct"` o `null` para obligar a este proveedor a conectarse directamente, incluso cuando se establece un proxy global.
- Establecer `proxy` a un absoluto `http://` o `https://` URL para usar ese proxy HTTP para este proveedor.
- Establecer `proxy` a un absoluto `socks5://` o `socks5h://` URL para usar ese proxy SOCKS5 para este proveedor.

Una cadena vacía o de solo espacio en blanco se rechaza a propósito. Un campo despejado no debe cambiar silenciosamente de “heredar el proxy global” a “forzar directamente”; eliminar el campo para heredar, o escribir `"direct"`
para elegir la salida directa explícitamente.

`noProxy` acepta una cadena separada por comas o una matriz de cadenas en `NO_PROXY` sintaxis. Es evaluados para cada solicitud. Un destino coincidente va directo si el proveedor lo haría de otra manera Utilice su propio `proxy` o heredar un proxy global.

<a id="what-the-route-covers"></a>

#### Lo que cubre la ruta

La ruta se aplica a la inferencia enrutada, las pruebas de descubrimiento y conexión del proveedor y la clave API Sondas de cuota. Algunos transportes no pueden transportarlo, y OpenCodex lo dice en lugar de fingir en caso contrario:

- **OAuth token Intercambio y actualización** Siga usando el proxy de todo el proceso. Estos llegan al vendedor fijo puntos finales de código que no contiene ninguna configuración de proveedor, por lo que un proveedor se fija a su propio proxy o a `"direct"` actualiza sus credenciales por la ruta global. Sondas de cuotas respaldadas por OAuth y las sondas de validación de clave API se comportan de la misma manera.
- **El carril rápido Responses WebSocket** selecciona su proxy cuando marca y no puede llevar ruta por proveedor, por lo que un proveedor que declara que uno sirve esas vueltas sobre HTTP/SSE en su lugar y registra un aviso único.
- **Cursor's por defecto HTTP/2 transporte**, el **Proveedores de hilos CodeBuddy y Qoder** (Sus entorno hijo omite variables proxy), y el **Laboratorio de compatibilidad** El remitente no aplicarlo.
- Endpoints que no enrutan un modelo de generación y edición de imágenes —, transcripción de audio, llamadas en tiempo real, y sin reservas `/v1/alpha/search` — no tiene ruta de proveedor para aplicar.

Un proveedor configurado con un `fetch` El ejecutor es rechazado en lugar de ser enviado silenciosamente por el propia ruta del ejecutor.

Este ejemplo mantiene un proxy global para el tráfico ordinario, envía un proveedor a través de un HTTP regional proxy, y fija otro proveedor a una conexión directa:

```json
{
  "proxy": "http://global-proxy.example:8080",
  "providers": {
    "regional-gateway": {
      "adapter": "openai-chat",
      "baseUrl": "https://regional-api.example/v1",
      "proxy": "http://regional-proxy.example:3128"
    },
    "direct-gateway": {
      "adapter": "openai-chat",
      "baseUrl": "https://direct-api.example/v1",
      "proxy": "direct"
    }
  }
}
```

<a id="operator-pinned-reasoning-effort"></a>

### Esfuerzo de razonamiento fijado por el operador

Establecer `pinnedReasoningEffort` en un proveedor existente para anular las opciones de esfuerzo entrantes, o uso `modelPinnedReasoningEfforts` para ID de modelo ascendente individuales. Pins de proveedor por modelo ganar sobre el pin de todo el proveedor; la raíz `modelPinnedEfforts` El mapa es el fallback Estos son configuración del operador, no los valores predeterminados de proveedor-registro. No cambian el modelo de descubrimiento o la Escalera de esfuerzo anunciada.

```json
{
  "pinnedReasoningEffort": "high",
  "modelPinnedReasoningEfforts": {
    "example-model": "max"
  }
}
```

Combina estos campos en la fila de proveedores existente. Los valores aceptados son `none`, `minimal`,
`low`, `medium`, `high`, `xhigh`, `max`, y `ultra`. **`none` Elimina el campo de esfuerzo explícito**; utiliza el comportamiento predeterminado del proveedor y no garantiza que el razonamiento esté deshabilitado. Los límites de esfuerzo aplicables aún se ejecutan después del pin, y el mapeo / normalización del cable del proveedor puede omite un valor no soportado. `ultra` se normaliza antes de que alcance un cable de origen. Las solicitudes de mantenimiento de compactación están exentas de pines.

`PATCH /api/providers?name=<provider>` acepta estos campos. Omite un campo para preservarlo; uso `null` para limpiar un escalar o todo el mapa. Una entrada de mapa establecida para `null` o `""` elimina ese entrada, preservando otras entradas. Las escrituras mal formadas son rechazadas antes de guardarlas. Un mal formado El pin opcional en un archivo editado a mano se ignora cuando se carga sin descartar el resto de la configuración.

<a id="auto-review-approval-model-selection"></a>

### Selección del modelo de revisión automática (aprobación)

Codex lee `auto_review_model_override` de la fila del catálogo del modelo actual de turno para Seleccione el modelo que revisa las solicitudes de aprobación. La raíz `auto_review_model` establecer en
`$CODEX_HOME/config.toml` Suministra la reserva de Codex. El dashboard global **Anulación de revisión automática**
en tiendas de configuración de modelos `autoReviewOverride` en `~/.opencodex/config.json` y tiene prioridad sobre esa reserva; los campos de abajo con alcance de proveedor aún ganan en sus propias filas. El escenario global Debe estar habilitado y nombrar un modelo. Una configuración habilitada sin modelo permanece sin aplicar y deja el Codex fallback en efecto. Una actualización de catálogo es un estado separado: después de guardarlo puede permanecer pendiente, y la página Modelos informa de ello para que pueda volver a intentarlo con `ocx sync`. Los usuarios de CLI pueden leer la configuración con
`ocx models auto-review status` o cambiarlo con
`ocx models auto-review set <model|-> [--enabled <on|off>]`; utilizar `-` Para limpiar el modelo. Salida CLI recomienda `ocx sync` cuando se puede volver a intentar una actualización. Si falla una actualización, la configuración permanece guardada y el comando sale 1. Resolver el fallo antes de la sincronización. Los [proveedor guía](/es/guides/providers/#approval-reviewer-per-provider) tiene el flujo de trabajo del operador y un ejemplo trabajado.

Cuando se incluyen filas nativas OpenAI y el catálogo final tiene una fila nativa desnuda ordinaria aparte de reservar (recuento de filas ocultas), OpenCodex mantiene el `codex-auto-review` fila así Codex puede seleccionar su revisor de aprobación preferido cuando no se configura la anulación. Se queda fuera de selectores de modelos, opciones de subagentes, listas de escritorio y públicos `/v1/models` listas. Proveedor y root reviewer anula el mantenimiento de su precedencia y no sella esta fila interna. Catálogos sin una fila nativa desnuda ordinaria, incluidos los catálogos solo de reserva, omítela y preserve El fallback de Codex al modelo de tareas. El revisor recibe la misma proyección de modo multiagente como las filas nativas ordinarias.

`autoReviewModel` es el objetivo del revisor de todo el proveedor. Un valor puede ser un id modelo desnudo de ese mismo proveedor (la fila del catálogo está normalizada al `provider/model` slug) o un catálogo público completo slug como `opencode-go/deepseek-v4-flash`. Un valor desnudo se resuelve contra las filas de ese proveedor primero y luego contra una fila de catálogo desnuda, que es cómo un modelo nativo como `gpt-5.6-terra` es nombre, y un valor desnudo que aterriza fuera del proveedor imprime una nota proporciona al revisor; un valor que no coincide con ninguno de los dos queda sin resolver. `autoReviewModelOverrides`
claves son los identificadores de modelo ascendente exactos de ese proveedor, o el alias publicado por el proveedor para una (`modelAliases`); o bien la ortografía nombra la misma fila enrutada, cuya slug lleva el id de origen. Un La entrada gana sobre el valor de todo el proveedor para su modelo. Un proveedor stamp gana sobre el selector de raíz en sus propias filas, y el selector de raíz sigue siendo el fallback para filas nativas y filas enrutadas sin un sello de proveedor. Eliminar un selector de proveedor borra solo los sellos de ese proveedor; eliminar el selector raíz nunca borra los sellos del proveedor. Los identificadores de modelo que contienen una barra pueden escribirse sin procesar o en su forma de catálogo codificada; ambos deletrear resolver a la misma fila enrutada. Las llaves del modelo conservan el caso. Los selectores se resuelven con el catálogo final en cada sincronización, independientemente uno del otro, y cada uno falla por sí solo: una `autoReviewModel` emite un diagnóstico y sellos no filas de proveedores, un problema no resuelto `autoReviewModelOverrides` entrada emite un diagnóstico y sellos no hay anulación por modelo, por lo que un objetivo válido para todo el proveedor sigue siendo su alternativa. Se sigue aplicando cualquier selector que se resuelva. Filas sin proveedor stamp mantenga el selector raíz, o el comportamiento normal de revisión automática ascendente cuando no esté establecido. Los canónica `openai` El proveedor no acepta estos campos.

Eliminar el selector de raíz borra los sellos de raíz de cada fila, incluidas las filas nativas lanzamientos anteriores que son anteriores al marcador de procedencia de OpenCodex. La limpieza reconoce un legado sello por su forma — un valor en todo el catálogo que una fila encaminada también lleva — así un genuino por fila que coincide con esa forma se borra con él, y un catálogo que desde entonces divergir de esa forma necesita una sincronización manual. Los sellos de proveedores nunca son tocados por la eliminación de raíces.

`PATCH /api/providers?name=<provider>` Acepta ambos campos. Uso `null` Para limpiar el escalar o todo el mapa; utilice una entrada de mapa de `null` o `""` eliminar ese modelo mientras se preservan otros entradas. El proveedor no relacionado guarda los valores previamente configurados.

Estos campos están disponibles en `config.json`, la administración de proveedores API y el Dashboard raw JSON editor de proveedores. Los controles de formulario dedicados no están presentes. Los sellos de raíz nativa registran el valor anterior y restaurarlo en la eliminación cuando el valor estampado no se ha cambiado externamente.

<a id="discovered-model-display-names"></a>

### Nombres de modelo descubiertos

Uso `modelDisplayNames` cuando un proveedor devuelve los ID compatibles con la máquina, pero el selector de modelos Codex Necesita etiquetas más cortas. El mapa pertenece a un proveedor, por lo que el mismo identificador de modelo puede tener una configuración diferente. etiqueta bajo otro proveedor. Agregar el campo a la fila de proveedores existente `config.json` y mantener todos los demás configuración del proveedor. El ejemplo incluye los campos requeridos para el contexto:

```json
{
  "providers": {
    "xai": {
      "adapter": "openai-chat",
      "baseUrl": "https://api.x.ai/v1",
      "modelDisplayNames": {
        "grok-4.6": "Grok 4.6"
      }
    }
  }
}
```

Las filas GPT nativas desnudas compatibles en el catálogo local Codex también aceptan etiquetas exactas en
`providers.openai.modelDisplayNames`Por ejemplo, `"gpt-6-astra": "GPT 6 Astra"`. Tanto la sincronización de inicio como la convergencia de catálogo local vuelven a aplicar estas etiquetas. Eliminar una etiqueta restaura el nombre nativo original solo cuando el nombre de visualización de la fila coincide con el nombre aplicado Anular. Se conserva un nombre de visualización externo más reciente sujeto a la normalización de metadatos nativos existente; Por ejemplo, Astra (`gpt-6-astra`) todavía reemplaza un nombre no fijado con su nombre nativo fijado. La superposición de etiquetas deja IDs de modelo, metadatos (incluidas las capacidades), Enrutado combo alias, y cuenta-calificado filas sin cambios. Este catálogo local anula no volver a etiquetar los listados de modelos HTTP ni los anuncios virtuales `*-pro` filas.

El orden efectivo de la etiqueta es el operador `modelDisplayNames`, luego metadatos de catálogo del proveedor, luego el normal `provider/model` fallback. El selector enrutado permanece `xai/grok-4.6`Mientras que el upstream El modelo de alambre permanece `grok-4.6`. Las etiquetas solo se muestran. No cambian la autenticación, el comportamiento del adaptador, el enrutamiento, la facturación o la construcción de solicitudes ascendentes. La eliminación de una entrada de mapa solo restablece su etiqueta. OpenAI API modelos, uso
`providers.openai-apikey.modelDisplayNames`; la etiqueta sobrevive a las actualizaciones del catálogo. Un cliente de administración puede establecer o restablecer una etiqueta con
`PUT /api/providers/:provider/model-display-names` y un cuerpo de
`{ "modelId": "grok-4.6", "displayName": "Grok 4.6" }`; enviar `displayName: null` para resetearlo. Proveedor `PATCH` No edita este mapa. Utilice este dedicado `PUT` para cambiar o eliminar etiquetas.

El panel expone la misma configuración duradera en **Modelos**. Expandir el proveedor, encontrar un modelo descubierto, y elegir **Nombre**. El diálogo mantiene la exacta `provider/model` selector visible mientras guardas una etiqueta amigable. Seleccionar **Restablecer nombre** para volver a los metadatos del proveedor o la normal Selector de fallback. **Nombre** solo cambia la presentación; el alias separado cambia el alias de enrutamiento corto y no es un editor de nombre de pantalla. OpenAI nativo y las filas de modelos personalizados mantienen su controles existentes.

Si el cambio se guarda pero falla la actualización, el cuadro de diálogo refleja la anulación guardada y mantiene
**Reintentar** disponible. Reintentar repite la convergencia de catálogo cuando el servidor informó que falló, o Recarga la lista cuando solo falló la solicitud de lista. La recuperación de restablecimiento mantiene la operación de restablecimiento; No restablece el antiguo nombre. Las solicitudes tienen un plazo de 60 segundos que cubre el escrito y su Actualización de la lista de seguimiento. Un tiempo de espera no deshace una escritura: use **Reintentar** para comprobar el nombre actual antes de hacer otro cambio.

<a id="codex-catalog-and-root-configtoml-settings"></a>

## Codex catálogo y raíz `config.toml` configuración

Estos configuración pertenecen a la raíz de `$CODEX_HOME/config.toml`, junto
`approvals_reviewer`; no son campos de proveedores.

| Campo | Tipo | Significado |
| --- | --- | --- |
| `auto_review_model` | `string` | Selector de catálogo público en `provider/model` Forma, por ejemplo `opencode-go/deepseek-v4-flash`. Después de cada fusión de catálogo, OpenCodex lo resuelve contra el catálogo final y estampa el valor recortado como `auto_review_model_override` en las entradas del catálogo. Se elimina el espacio en blanco límite; los componentes delimitados por barras del selector no cambian. Si el valor está ausente o en blanco, las anulaciones enrutadas existentes se borran y se conserva la selección normal de auto-revisión ascendente. Si es sintácticamente inválido o está ausente del catálogo final (incluso después de la eliminación del proveedor / modelo), OpenCodex falla cerrado solo para la anulación: borra la anulación muerta, conserva el comportamiento normal de flujo ascendente y emite un diagnóstico. Volver a agregar el proveedor/modelo en una sincronización posterior permite que el selector configurado se selle nuevamente. |

La configuración se evalúa después del descubrimiento del proveedor, el filtrado del modelo, la fila nativa/cuenta. proyección, y combinar la precedencia, por lo que sólo un selector presente en el catálogo producido por Esa sincronización puede convertirse en una anulación. Los valores ascendentes nativos se conservan cuando la configuración aclarado o sin resolver. El campo de catálogo persistente es leído por Codex para el turno actual modelo, por lo que se copia un selector configurado válido en cada entrada aplicable. Los selectores con alcance de proveedor (arriba) se aplican antes de esta reserva raíz y ganan en filas enrutadas.

<a id="response-service-tier-authority"></a>

### Autoridad de nivel de servicio de respuesta

Establecer `providers.<name>.responseTierAuthoritative` a `false` en `config.json` cuando eso Respuesta del proveedor `service_tier` no puede establecer si se concedió el ayuno. Esto es un declaración del operador sobre toda la ruta del proveedor, independientemente de `supportsServiceTier` y
`fastWire`. No permite ni rápido ni cambia la salida `service_tier`.

Por ejemplo, agregue este campo a un proveedor de puerta de enlace existente cuyo backend Codex tiene Metadatos de respuesta no autoritativa:

```json
{ "responseTierAuthoritative": false }
```

**El soporte de Gateway es opt-in.** La actualización de OpenCodex por sí sola no agrega esta declaración a proveedores existentes. Sin ella, una solicitud de prioridad elegible seguida de `service_tier: "default"`
Conserva el legado `response-declined` interpretación. Configurar `false` Solo cuando el Se sabe que los metadatos de respuesta de ruta no son autoritativos.

Para una solicitud elegible serializada como `priority`, ambos a `default` y a `priority` eco permanece observaciones. Conservar registros `responseServiceTier` y registro
`tierOutcome.responseTierAuthoritative: false`, `fastOutcome: "applied"`, y
`confirmation: "assumed"`, sin `response-declined`. Aquí. **aplicado significa el parámetro de petición fue enviado**, y **supuesto significa que el efecto rápido real no está confirmado**. El modelo muestra tooltip la solicitud y la respuesta en bruto por separado con esa confirmación. Ni este escenario ni estos Los registros prueban una aceleración o un nivel facturado.

Las estimaciones de costos usan el nivel de reserva solicitado existente en lugar de tratar el eco crudo como un recurso alternativo. nivel de precios confirmado; las reglas de precios que requieren confirmación de respuesta no pueden usar ese eco. Registros históricos sin que una bandera de autoridad conserve su interpretación anterior.

El campo solo acepta booleanos. Omisión y explicito `true` Retener la confirmación basada en respuestas para otros destinos, incluyendo el API oficial y puertas de enlace no declaradas. Canónico
`https://chatgpt.com/backend-api/codex` con `authMode: "forward"` permanece automáticamente no autorizado, aunque `true` está configurado. Los nombres de puerta de enlace y las URL nunca se infieren. Si una puerta de enlace mezcla contratos de respuesta, use entradas de proveedor separadas para esas rutas y aplicar la declaración solo a la entrada correspondiente.

<a id="fastwire-b1-capability-migration"></a>

### FastWire B1 migración de capacidad

La capacidad rápida y el reenvío arbitrario del nivel de llamada de Chat son independientes después de FastWire B1. Los
[definiciones de campo proveedor](#provider-entries-ocxproviderconfig) Por encima de todo, sigue siendo autoritativo contrato; configuración existentes ver estos deltas de migración:

1. Un proveedor/modelo de chat declarado Fast-capable ya no necesita `chatServiceTier: true` por canónica Rápido. La publicación, la elegibilidad de enrutamiento y la inyección aún requieren una póliza elegible y una compatible FastWire en el adaptador final. En rutas clasificadas, `fastMode: false` todavía Elimina el canónico Fast. Establecer `supportsServiceTier: false` o un modelo exacto `false` cuando la ruta No es capaz de rápido.
2. En una ruta clasificada elegible, la ortografía de la llamada `fast` y `FAST` Normalizar a través
   `fastWire.canonicalToWire.priority`; llamante `priority` Sigue siendo canónico. Configurar un verificado Mapeo a `fast` solo cuando ese es el valor canónico del flujo ascendente. Las rutas no clasificadas retienen su comportamiento de reenvío existente.
3. Modelo exacto `true` ya no autoriza niveles de Chat extranjeros como `flex` o específico del proveedor valores. Los que todavía requieren `chatServiceTier: true`En caso contrario, se eliminarán y registrarán como niveles de llamadas caídos.

Capacidad explícita `false` y Responses reenvío de llamadas-nivel conservan sus contratos existentes.

<a id="anthropic-fast-anthropic-speed"></a>

### Anthropic rápido (`anthropic-speed`)

El incorporado `anthropic` (almacenado Claude OAuth) y `anthropic-apikey` Entradas solo se anuncian rápido por `claude-opus-5-5`, `claude-opus-5`, y `claude-opus-4-8`. Otros modelos Claude no están clasificados; las entradas no tienen un valor predeterminado rápido para todo el proveedor.

Anthropic es rápido **por defecto** porque gasta créditos de uso (suscripción) o modo rápido acceso (API) a un precio de 2x. Enciéndalo por proveedor con la fila Off/On en la página Modelos del panel de control, o establecer `providers.anthropic.fastEnabled: true` (o el mismo campo en `anthropic-apikey`) Si bien es apagado, esos modelos no publican ninguna palanca rápida o `--fast` y el proxy nunca envía `speed`, incluso con un mundial `fastMode: true`. Claude Code paso nativo sigue reenviando un `speed` campo el llamador se envía (por ejemplo Claude Code `/fast`), porque esa solicitud nunca llega al proxy política. Cursor Fast y otros proveedores no se ven afectados.

Cuando está habilitado, un `--fast` o Selector rápido envía
`speed: "fast"` y añade `fast-mode-2026-02-01` a los existentes `anthropic-beta` cabecera. El proxy conserva los valores beta de OAuth y envía un encabezado deduplicado. `fastMode: false` Desactiva esto inyección.

Anthropic `usage.speed` echo determina el resultado: `fast` Confirma rápido, `standard` registra a downgrade, y un eco faltante no está confirmado. Solo el uso rápido confirmado recibe el precio de lista 2x Estimación (Opus 5.5 $ 8 de entrada / $ 40 de salida; Opus 5 y 4.8 entrada de $ 10 / salida de $ 50 por millón tokens). Si el primer envío rápido es rechazado porque se requieren créditos de uso, una organización desactivada El modelo rechaza `speed`, o la grupo rápida está vacía, el envío del adaptador principal puede hacer uno presupuestado Reenviar velocidad estándar. Los límites de velocidad genéricos y los errores de capacidad mantienen su manejo habitual. Posterior Las compilaciones de esa solicitud se mantienen a la velocidad estándar; un nuevo giro puede encontrar el rechazo nuevamente.

Suscripción Fast en Pro/Max necesita créditos de uso; Las organizaciones de equipos/empresas también necesitan administrador habilitación. API Fast es una vista previa de investigación que requiere acceso. Véase
[Anthropic Modo rápido](https://platform.claude.com/docs/en/build-with-claude/fast-mode) y
[Claude Code Modo rápido](https://code.claude.com/docs/en/fast-mode) para acceso y condiciones de facturación.

<a id="cursor-fast-cursor-variant"></a>

### Cursor rápido (`cursor-variant`)

Cursor no tiene `service_tier` campo. Su producto rápido es diferente **variante modelo** —
`claude-opus-5-thinking-high-fast`, a `{id:"fast",value:"true"}` parámetro de solicitud para Grok 4.5/4.6, o un aplanado `grok-4.7-{effort}-fast` ID de cable para Grok 4.7 — para que el Cursor entrada declara `fastWire.kind: "cursor-variant"` y el constructor de solicitudes resuelve la variante en lugar de establecer un campo de solicitud.

Solo las bases que realmente declaran una variante rápida anuncian Fast: `claude-opus-4-7`,
`claude-opus-4-8`, `claude-opus-5`, `claude-opus-5-5`, `grok-4.5`, `grok-4.6`, `grok-4.7`. Cada otra fila Cursor publica
`supportsServiceTier: false`, por lo que Codex no muestra ningún interruptor en lugar de uno muerto.

Una base cuya fila de paraguas dirige las actualizaciones de pensamiento a su **pensamiento-rápido** Variante, no para el hermano rápido llano — ese hermano es un producto diferente con una escalera de esfuerzo más corta, y por `claude-opus-5` su familia regular está en cuarentena de origen.

`fastMode` se comporta de manera diferente por superficie, porque solo Codex tiene un conmutador rápido propio:

| Superficie | `fastMode: true` |
|---|---|
| Codex | filas permanecen filas de paraguas; la palanca Fast de la aplicación selecciona la variante |
| Claude Code (`?ids=cli`) | enumera la identidad rápida, e.g. `ocx-claude-cursor--claude-opus-5-thinking-fast` |
| OpenAI `/v1/models` | listas `cursor/claude-opus-5-thinking-fast` |
| Claude Desktop (3P) | sin cambios — sus alias están hashed del nombre del modelo |
| Panel `/api/models` | ids de fila sin cambios; son las teclas de activación/desactivación |

Las solicitudes se promueven de cualquier manera: con `fastMode: true`, recogiendo la identificación del paraguas todavía se resuelve a la variante rápida, por lo que un cliente cuya configuración guardada es anterior al switch no necesidad de redescubrir. Cada ID de variante heredada mantiene el enrutamiento sin cambios.

<a id="xai-priority-processing"></a>

### xAI Procesamiento prioritario

El incorporado `xai` preset soporta Fast en ambos de sus transportes, con diferente alcance. Objetivos de modo de clave API `https://api.x.ai/v1`; rutas resueltas a `openai-chat` enviar
`service_tier: "priority"` a través de Chat Completions, mientras que los valores predeterminados y anulaciones del modelo pueden seleccione el `openai-responses` transporte en su lugar. `ocx login xai`
en su lugar almacena las credenciales de OAuth para la pasarela de suscripción Grok (`https://cli-chat-proxy.grok.com/v1`; estas credenciales se actualizan automáticamente), donde Fast se clasifica por modelo (sondeado en vivo 2026-09-13 y 2026-09-23): gruk-4.7, gruk-4.6, gruk-4.5, gruk-4.3, gruk-4.20-0309-razonamiento, gruk-4.20-0309-no razonar, gruk-construir-0,1, y gruk-composer-2.5-rápido aceptar
`service_tier: "priority"` sobre Grok OAuth y hazte eco, por lo que esas filas se anuncian rápidamente, acepta
`--fast` selectores, y reenvía un nivel de llamada enviada en cualquiera de los cables. se excluye: el gateway responde `service_tier: "default"` Cuando se envía `priority`Así que se queda no clasificado y su nivel de llamada no se reenvía. Los modelos no listados permanecen sin clasificar en ambos transportes.

En la puerta de enlace OAuth, el Fast de Grok 4.7 funciona de manera diferente. La puerta de enlace también enumera
`grok-4.7-build-fast`, que es el mismo modelo en hardware de servicio más rápido, y midió alrededor de 1.6× más rápido que `grok-4.7`. Procesamiento prioritario en `grok-4.7` no se mide más rápido y se consume alrededor de 6× el uso de suscripción por salida token. Por lo tanto, la lista Modelos muestra una fila Grok 4.7. Seleccionando su Fila rápida (`xai/grok-4.7--fast`), enviando `service_tier: "priority"`, o activar el modo Rápido envía la Solicitud como `grok-4.7-build-fast` sin un nivel de servicio. Solicitar registros mantener el modelo como `grok-4.7` y registro `grok-4.7-build-fast` como el modelo de alambre. El modo de clave API no cambia: el compilador rápido no está en el xAI público API, por lo que Grok 4.7 Fast todavía significa procesamiento prioritario. Una explícita
`xai/grok-4.7-build-fast` selección de una configuración anterior sigue funcionando.

Cuando ningún proveedor explícito `fastWire` opencodex API está configurado, una clave restringida por
`allowedModels` Debe permitir `xai/grok-4.7-build-fast` (o su ID de modelo desnudo) para OAuth Fast. Permitiendo sólo `xai/grok-4.7` no autoriza esta variante del modelo Fast. Una clave que permite sólo el modelo de cable rápido puede usarlo; solicitudes simples o desactivados Fast aún requieren `xai/grok-4.7`. Con un proveedor explícito `fastWire`, permita el modelo de cable real en su lugar. Por ejemplo, un
`service-tier` alambre mantiene `xai/grok-4.7` y requiere permiso para ese modelo. Proveedor Se siguen aplicando restricciones. Estas reglas se aplican a las solicitudes de compactación Responses, Chat Completions, Messages y enrutadas.

xAI cobra el procesamiento prioritario en 2× el precio estándar token para entrada, salida, caché y tokens de razonamiento; los descuentos de caché se aplican antes del multiplicador. Las estimaciones de costos usan esa prima solo cuando la respuesta de xAI confirma `service_tier: "priority"`. Un nivel de respuesta faltante o sin analizar es No hay confirmación, y un eco `default` es una rebaja; los tres se quedan al precio estándar.

Porque `grok-4.6` y `grok-4.7`, la tasa estándar por 1M tokens es de $ 2.00 de entrada, $ 0.50 de entrada en caché y $ 6.00 salida. Un aviso de al menos 200,000 tokens revaloriza toda la solicitud en $ 4.00 / $ 1.00 / $ 12.00. xAI no ha publicado cómo se combina esa banda de contexto largo con el procesamiento prioritario. Cuando a La respuesta de largo contexto confirma `priority`, el panel de control muestra el contexto largo publicado costo con un `≥` Un marcador y una explicación encuadernada inferior; nunca inventa un multiplicador apilado.

<a id="openrouter-fast"></a>

### OpenRouter Rápido

El canónico `https://openrouter.ai/api/v1` preset anuncia rápido solo para estos exactos OpenAI-respaldadas por las balas del modelo:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

`anthropic/claude-sonnet-5` y los modelos OpenRouter no declarados permanecen sin clasificar. Un nivel de proveedor
`supportsServiceTier` intencionalmente ausente, y un conjunto de usuarios `supportsServiceTier: false`
Siguen deshabilitando las declaraciones del modelo exacto. Las declaraciones de registro se aplican solo mientras el proveedor todavía apunta a la base canónica OpenRouter URL; un destino personalizado con el mismo nombre no es Se supone que comparte el contrato de OpenRouter.

Envíos rápidos `service_tier: "priority"`. No añade ni reescribe `provider.only`,
`provider.order`, o `provider.allow_fallbacks`. OpenRouter documenta los puntos finales prioritarios como primera opción de enrutamiento, seguida de un elegante retorno a otros puntos finales cuando se No disponible. La facturación sigue el punto final realmente utilizado y la respuesta informa el valor real. nivel superior `service_tier`. Por lo tanto, fijar los puntos finales de nivel y deshabilitar las opciones alternativas reduciría disponibilidad sin mejorar la seguridad de facturación.

Los registros de solicitud usan ese eco de respuesta como autoridad. `priority` Confirmar rápido tal como se aplica;
`default` registra una rebaja y utiliza la estimación del precio estándar; un campo que falta deja el intento asumido en lugar de adivinar una rebaja. El multiplicador de prioridad de OpenRouter varía según de origen y no está incluido aquí. Cuando se confirma la prioridad pero no se conoce el precio exacto de la prioridad, el panel mantiene la estimación de precio estándar como un límite inferior documentado y lo prefija con
`≥`; los intentos degradados no tienen un marcador de límite inferior.

Los proveedores de claves API pueden tener una clave literal o una referencia de entorno. Los proveedores de OAuth utilizan el tienda de credenciales poblada por `ocx login`; el comportamiento de lanzamiento de Claude Code respaldado por suscripción es configurado bajo [`claudeCode.authMode`](/es/reference/configuration/server/#claude-code-claudecode).

OrcaRouter expone ambas formas explícitamente: `orcarouter` es el proveedor manual de llaves API y
`orcarouter-oauth` ejecuta el consentimiento del navegador con S256 PKCE, luego almacena la clave API duradera devuelta como una credencial de cuenta. Los valores predeterminados públicos intencionalmente dividen la autenticación (`https://www.orcarouter.ai`) por inferencia (`https://api.orcarouter.ai/v1`) Establecer
`ORCAROUTER_BASE_URL` antes de iniciar sesión en la primera cuenta para una implementación autoalojada de un origen, o usar
`ORCAROUTER_AUTH_BASE_URL` y `ORCAROUTER_API_BASE_URL` por orígenes separados. Para un loopback/endpoint privado auto-alojado, **antes del primer inicio de sesión**, crear o actualizar
`providers["orcarouter-oauth"]` con `adapter: "openai-chat"`, la intención `baseUrl`,
`authMode: "oauth"`, y una explícita `allowPrivateNetwork: true`. Login conserva ese operador configuración y nunca la otorga desde una anulación URL. Sin ella, la validación del destino rechaza la punto final local para inferencia y descubrimiento de modelos. El propio oyente de devolución de llamada del navegador OAuth no requiere esta opción de proveedor. Ver la [Ejemplo de configuración de OrcaRouter](/es/guides/providers/).

<a id="provider-diagnostic-outbound-safety"></a>

## Seguridad de salida de diagnóstico del proveedor

Las pruebas de conexión del panel de control y la detección de modelos en vivo utilizan un transporte limitado solo GET. Sin un proxy de salida, opencodex resuelve el nombre de host una vez y se conecta solo a esa dirección validada. HTTPS conserva el host original, SNI y la verificación de certificados; la configuración del proveedor no puede desactivarse Verificación de certificados.

Estas operaciones utilizan el [servidor configurado fetch](/es/reference/configuration/server/). Un servidor proxy SOCKS5 — establecido con
`config.proxy` o heredado de un SOCKS5 `ALL_PROXY` — utiliza el túnel incorporado de OpenCodex cuando
`NO_PROXY` No exime al objetivo. Esquema específico `HTTP_PROXY` y
`HTTPS_PROXY` conservar el manejo nativo de HTTP(S) de Bun, mientras que un manejo no SOCKS `ALL_PROXY` No es un nativo Ruta HTTP fetch. URL y las comprobaciones de direcciones literales aún se ejecutan, pero un proxy seleccionado elige el final ruta, respuesta DNS y par, por lo que opencodex no puede fijar o verificar ese par. Este es un explícito Limitación de seguridad.

Los destinos privados/locales requieren `allowPrivateNetwork: true` Cuando se activa un proxy de salida una coincidencia `NO_PROXY` entrada. Loopback se añade automáticamente; lista de cada host LAN explícitamente porque Las entradas CIDR no se interpretan. El emparejador soporta hosts exactos, sufijos de dominio, puertos opcionales, IPv6, y `*`Por ejemplo, la lista `192.168.1.50` explícitamente. Metadatos y link-local Los destinos permanecen bloqueados. Diagnóstico Las solicitudes rechazan redirecciones e informan sobre un destino con credenciales eliminadas. Redirección de solicitud de proveedor ordinario revisión permanece separada de este guardia diagnóstico.

Dos falsos IP DNS existen adaptaciones para los usuarios de Clash / Surge / Mihomo, y ambos se aplican a DNS
*respuestas* solo — una dirección literal en el URL sigue siendo rechazada. La gama de referencia IANA
`198.18.0.0/15` (y su ortografía IPv4-mapped IPv6) se acepta siempre que un proxy saliente aplique al anfitrión. El rango de IPv6 fake-IP predeterminado de Mihomo `fdfe:dcba:9876::/48` es aceptado en un estricto puerta: la variable proxy que coincide con el esquema URL (`HTTPS_PROXY` por
`https:`, `HTTP_PROXY` por `http:`o un SOCKS5 `ALL_PROXY` debe ser establecido (un non-SOCKS `ALL_PROXY` hace no contar), el anfitrión no debe coincidir `NO_PROXY`, y el La solicitud se vincula a ese proxy explícitamente. Cualquier otro ULA, un prefijo adyacente o una respuesta de IP falsa mezclada con una respuesta privada real todavía requiere `allowPrivateNetwork: true`. Tiempo de ahorro del proveedor La validación nunca aplica la acomodación IPv6.

<a id="codex-account-pool"></a>

## Grupo de cuentas Codex

Uso **Codex Autonomía** en el panel de control para agregar cuentas de grupo y actualizar cuotas. `config.json` tiendas metadatos no secretos; acceder y actualizar tokens utilizar el almacén de credenciales endurecido. Pool enrutamiento separa la asignación nueva/no vinculada, la conmutación proactiva basada en el uso y la recuperación de fallas. Una tarea encuadernada Normalmente mantiene la afinidad. Por defecto (`pool.cacheAffinity`) `quota` no lo reengancha simplemente porque el umbral de uso se cruza; ese rebind espera hasta que la cuenta vinculada se agote o de otro modo no puede servir, y luego solo en una cuenta con un margen de cuota genuino y un uso estrictamente menor. Establecer `pool.cacheAffinity: false` para restablecer el umbral de religación de las tareas vinculadas, aún solo en un destino. La pausa, el tiempo de reutilización, la reautenticación y los rechazos de cuotas aún liberan una vinculación en vivo inmediatamente. Una racha de fallas transitorias sirve la solicitud de otra cuenta mientras se mantiene la vinculante, y la tarea vuelve una vez que la cuenta sirve de nuevo; después de 10 minutos Liberados con normalidad. Una solicitud no vinculada no tiene vinculación a una cuenta real; esto puede incluir un vínculo visible existente. tarea después del reinicio proxy o el restablecimiento de afinidad. Un pre-flujo 429 o 402, o una respuesta 5xx cuyo límite organismo notifica explícitamente el agotamiento de las cuotas, reintentos una vez en una cuenta alternativa elegible en la misma solicitud, incluso cuando la conmutación proactiva basada en el uso está desactivada. Se ejecuta la política ordinaria transitoria-5xx En primer lugar, por lo que una respuesta de cuota puede completar hasta tres envíos en la cuenta agotada antes del grupo. rotación. Los cambios en la cuenta preservan y reproducen el contexto de la conversación, pero por parte del proveedor La reutilización de la memoria caché rápida en todas las cuentas no está garantizada y es posible que la memoria caché deba calentarse nuevamente.

En un **401/403**, el inicio de sesión de la aplicación borra la afinidad de proceso local de esa cuenta y requiere una reautenticación. En un **429**, honores de opencodex `Retry-After`, inicia el enfriamiento de la cuenta, borra la afinidad y puede rotar la solicitud a otra cuenta Pool elegible. Estas transiciones de falla permanecen activas con
`autoSwitchThreshold: 0`; esa configuración deshabilita solo la conmutación proactiva basada en el uso.

La pausa de una cuenta conserva sus metadatos de cuota, pero la excluye de la conmutación, conmutación por error y recuperación. Sondas y activación manual. También aclara las afinidades de hilo de esa cuenta. Solicitudes en vuelo credenciales capturadas; los giros posteriores se redirigen. Si todas las cuentas están en pausa, el enrutamiento Pool falla más bien en lugar de elegir silenciosamente uno. **Pausa agotada** Actualiza las cuentas elegibles con credenciales disponibles y pausa solo las cuentas recién confirmadas al 100%; las actualizaciones desconocidas o fallidas permanecen sin cambios.

| Estrategia | Comportamiento |
| --- | --- |
| `quota` (predeterminado) | Si no existe una cuenta activa, elija la cuenta elegible de menor uso en ventanas de 5 horas, semanales y de 30 días. De lo contrario, mantenga una cuenta activa elegible debajo `autoSwitchThreshold`; después de cruzar el umbral, una solicitud no vinculada puede pasar a una cuenta elegible de menor uso. Las tareas vinculadas mantienen la afinidad de caché por defecto y permanecen hasta que la cuenta se agote (uso conocido al 100%) o no pueda servir (pausa, inutilizable); un movimiento requiere espacio libre de cuota genuino y un uso estrictamente menor en el destino, por lo que la tarea se mantiene cuando cada cuenta supera el umbral o la única cuenta más fresca tiene un uso desconocido. Establecer `pool.cacheAffinity: false` para permitir que la siguiente solicitud de una tarea encuadernada se mueva en el umbral, aún solo hacia tal destino. `0` desactiva esta reevaluación basada en el uso, no la recuperación de fallos. |
| `round-robin` | Asignar uniformemente solicitudes no vinculadas a través de cuentas elegibles. La rotación es contra e ignora los umbrales de uso, pero el filtro de nivel de prioridad compartido aún evalúa el margen de cada cuenta utilizando su umbral efectivo (anulación de cuenta o valor predeterminado global). `accountPoolStickyLimit` (1–100) cuenta las asignaciones en una selección, sin éxito en las respuestas ascendentes. |
| `fill-first` | Asignar solicitudes no vinculadas a la cuenta activa hasta el tiempo de reutilización, la re-autenticación o el umbral de drenaje efectivo de esa cuenta (anulación de cuenta o valor predeterminado global); el uso desconocido no fuerza un cambio. Las tareas atadas saludables mantienen la afinidad. |

La rotación no protege contra la aplicación del proveedor; el uso de múltiples cuentas puede violar los términos del proveedor.

### `anthropicAccountPool` (experimental)

Esta opción agrupa varias cuentas Anthropic OAuth ya almacenadas en `auth.json`. Está apagado por por defecto y experimental, y Anthropic no ha respaldado la agrupación automatizada de cuentas. Cuentas en el La misma organización puede compartir cuotas, y el cambio de cuentas no protege contra proveedores restricciones. Ver la [Guía Claude Code](/es/guides/claude-code/#claude-oauth-account-pool-experimental)
para la suscripción y las condiciones de cliente para las que está destinado el grupo.

| Clave | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `anthropicAccountPool.enabled?` | `boolean` | `false` | Habilita la afinidad de sesión pegajosa y la selección de nueva sesión con clasificación de cuota. **429 failover no está cerrado aquí**: se activa cada vez que se almacenan dos o más cuentas utilizables, exactamente como cualquier otro proveedor multi-credencial, y no se puede desactivar. |
| `anthropicAccountPool.nativeMessages?` | `boolean` | `true` | Prefiera Claude nativo Messages para las rutas directas elegibles de Anthropic cuando la agrupación esté habilitada. Todavía se aplican las opciones de exclusión de implementación nativa explícita. `false` selecciona el puente heredado para las solicitudes agrupadas; pool-off conserva el comportamiento de despliegue explícito. |
| `anthropicAccountPool.autoSwitchThreshold?` | `number` | `80` | Para nuevas sesiones, cuando la cuenta activa alcanza este umbral, elija el uso de caché más bajo conocido en la ventana configurada; la cuenta elegida no tiene que estar en o por encima del umbral. `0` Desactiva **Proactivo** solo — nueva sesión de selección y recuperación de enrutamiento después de un elegible 429 todavía consultar `quotaWindow`. |
| `anthropicAccountPool.strategy?` | `"quota" \| "round-robin" \| "fill-first"` | `"quota"` | Nueva estrategia del período de sesiones; `quota` Cuentas por la ventana establecida por `quotaWindow`, y `fill-first` evalúa su umbral de drenaje en esa misma ventana. |
| `anthropicAccountPool.quotaWindow?` | `"five-hour" \| "weekly" \| "max-utilization"` | `"five-hour"` | La barra de utilización reportada por el proveedor en caché utilizada para la selección de cuentas conscientes del uso. `five-hour` mantener el comportamiento original. `weekly` puntúa la barra semanal y salta cuentas cuya barra de 5 horas está agotada mientras que otra cuenta elegible permanece, pero vuelve a caer en candidatos agotados cuando ninguno lo hace. `max-utilization` puntúa la barra más alta conocida, por lo que puede usar 5 horas de uso antes de que el uso semanal esté disponible; si ninguno de los dos se conoce, la cuenta sigue un orden de uso desconocido. El uso conocido se clasifica antes del uso desconocido bajo el opt-in. `weekly` y `max-utilization` ventanas solamente; una omitida o explícita `five-hour` Conserva el orden heredado. Si se desconocen todas las cuentas elegibles, la selección aún devuelve una en orden. Después del tie-break documentado de menos de 5 horas, los lazos exactos preservan el orden elegible. Una sesión de afinidad saludable no se reequilibra proactivamente. Para la asignación de nueva sesión y la recuperación de enrutamiento después de un reemplazo elegible 429, `quota` clasifica a los candidatos elegibles directamente con esta ventana; `fill-first` avance en orden estable utilizando el umbral de esta ventana y las reglas de agotamiento; `round-robin` Lo ignora. El tiempo de reutilización, los límites de conmutación por error y la elegibilidad para reautenticación siguen siendo estados locales separados. Las barras semanales por cuenta provienen de sondas de uso o encabezados de respuesta observados. |
| `anthropicAccountPool.stickyLimit?` | `number` | `1` | Nueva sesión exitosa se une retenido en una selección round-robin. Rango 1–100. |
| `anthropicAccountPool.routes?` | `{name, match, accounts, fallback?}[]` | — | Rutas de modelo ordenado para el habilitado Anthropic OAuth grupo. `match` es un glob completo de ID de modelo sensible a mayúsculas (`*` y `?`); el primer partido gana. `accounts` contiene ID de cuenta almacenados, no alias. Las cuentas elegibles están limitadas a la ruta para la selección inicial y 429 reintentos. Sin reserva, una ruta vacía devuelve un 401 o 429 local con alcance de ruta. `Retry-After` si todas sus cuentas declaradas se están enfriando. Con `fallback: true`, un grupo ordinario de enfriamiento completo devuelve 429 con su primer tiempo de reutilización utilizable, incluso si se eliminó una cuenta de ruta guardada; la respuesta del cliente nunca nombra la ruta; el registro de proxy usa `route:#<n>` para la posición basada en la regla 1. `fallback: true` se amplía solo cuando ninguna cuenta enrutada es elegible; primero llene y luego use el orden de grupo ordinario. Ninguna regla coincidente conserva la selección normal; al deshabilitar el grupo, las rutas guardadas quedan inactivas. Las reglas no válidas no validan las escrituras y evitan el envío enrutado hasta que se corrige. `null` borra las rutas a través de la configuración API. |

Anthropic Los ayudantes de visión y búsqueda web de OAuth coinciden con estas rutas utilizando el modelo propio de cada ayudante, independientemente del modelo de solicitud principal. Cada ayudante se autentica con su cuenta enrutada, que puede diferir de la cuenta globalmente activa. Si una ruta de ayuda estricta no tiene una cuenta elegible, la helper falla localmente antes de cualquier solicitud del proveedor; no utiliza silenciosamente una cuenta fuera del servidor. ruta. Cuando la solicitud principal funciona, pero la descripción de la imagen o la búsqueda web fallan, compruebe el modelo configurado y las cuentas elegibles para la ruta de ese modelo.

Cuota compartida 429s (ventanas compartidas 5h/7d rechazadas) enfrían la cuenta de servicio y pueden recuperarse en un hermano elegible. Reintentar-después de gana, de lo contrario se utiliza el último restablecimiento rechazado válido, con un valor predeterminado de 60 segundos cuando no se puede usar una fecha límite. Un acelerador de velocidad transitoria solo hace una pausa esa cuenta, preserva afinidad y permite un breve reintento de la misma cuenta más como máximo un desvío de hermanos por solicitud. Un 429 sin encabezado permite como máximo un breve reintento en la misma cuenta, deja intacta la salud de la cuenta y no agrega ningún Reint-Después sintético. Estos Los reintentos comparten el presupuesto de envío físico y se detienen en la cancelación o la salida transmitida comprometida. El comportamiento predeterminado de una sola cuenta no cambia. El modelo solicitado comparte 5 horas / semana y La evidencia semanal familiar determina su admisión en el grupo. Un rechazo solo de fábula mantiene Sonnet elegibles en la misma cuenta. La evidencia pasiva de fábula envejece después de treinta minutos o su reinicialización conocida y es revalidada por una solicitud de servicio a la vez. Los umbrales de uso permanecen preferencias blandas con un recurso alternativo totalmente drenado; estos controles no son límites de uso o facturación difíciles. Las sondas de uso activo conservan las ventanas de familia ausentes a menos que la respuesta enumere los límites con autoridad. Afinidad es proceso-local y el tamaño limitado. Los fallos de las credenciales Token-refresh conservan la política de autenticación existente. Pre-salida cuenta-derecho/facturación 403s clara afinidad y enfriar la cuenta para `Retry-After`, o diez minutos por defecto, antes de intentar un reemplazo elegible. Los 403 genéricos o de nivel de solicitud siguen siendo terminales; véase [Recuperación de cuenta Claude](/es/guides/claude-code/). Si todas las cuentas elegibles se están enfriando, los clientes reciben 429
`Retry-After` Cuando se conoce, no es un error de autenticación.

Cuando cada cuenta que puede usar la solicitud se mantiene en la cuota gastada (una ventana compartida de 5 horas o semanal, o la ventana semanal de la familia de modelos solicitada), que 429 es un límite de uso en lugar de un límite de tarifa: el cuerpo Responses lleva `error.type` y `error.code` `usage_limit_reached` Y, cuando el Se conoce el restablecimiento ascendente de cada cuenta mantenida, `resets_at` (Epoca segundos del primer reinicio). Codex se detiene en esta respuesta y muestra cuándo intentarlo de nuevo en lugar de volver a intentarlo hasta que "excedido el límite de reintento". La propia negativa de la cuota gastada de la última cuenta obtiene la misma respuesta una vez que no El reemplazo queda. Si alguna cuenta mantenida solo se estrangula, revalidando una familia de modelos, o negado el derecho, la respuesta se mantiene `rate_limit_exceeded`. Los objetivos combinados se mantienen la forma de límite de velocidad para que el combo pueda moverse a su siguiente objetivo. Nativo `/v1/messages` se mantiene Anthropic `rate_limit_error` type; su mensaje nombra el límite de uso.

Una cuota de enfriamiento se levanta temprano una vez que un nuevo uso de la lectura (el panel de proveedores de página, o
`ocx account list anthropic --quota --refresh`) muestra cada ventana la negativa rechazada a continuación 100%, ya sea que el tiempo de reutilización provenga de `Retry-After` o un restablecimiento de ventana. Esto cubre una actualización del plan o una ventana que se volvió a abrir temprano. Una lectura tomada antes de la negativa nunca lo levanta, y 403 tiempos de reutilización esperan su fecha límite.

Las respuestas de Anthropic también informan la utilización semanal y de 5 horas de la cuenta de servicio, y lo que sea de esos dos una respuesta dada lleva se registra contra esa cuenta — cada ventana independientemente, tanto en rechazos como en éxitos. Por lo tanto, la selección consciente del uso funciona desde las cuentas que en realidad, sin esperar a que la página de proveedores del panel los interrogue. Estas lecturas refrescan la fila existente en lugar de reemplazarla, por lo que las barras semanales con alcance de modelo que solo el uso Los informes de punto final se conservan hasta que pasa su tiempo de reinicio conocido. Las mediciones expiradas se convierten desconocido, incluyendo las ventanas estándar retenidas omitidas por encabezados posteriores. Un encabezado de solo reinicio no puede extender una medición de utilización más antigua. Los valores sin reset conocido conservan su comportamiento existente; Las mediciones que faltan nunca se reemplazan con uso cero.

Las observaciones de encabezado no posponen las sondas de uso ni borran un error El estado de la sonda no está disponible. Después de reiniciar, las observaciones de Anthropic en caché permanecen disponibles mientras la siguiente cuota lee las sondas de nuevo, porque las observaciones guardadas no incluyen el reloj de la sonda.

:::caution[Experimental]
Deje esto deshabilitado a menos que entienda el riesgo de la política de cuenta Anthropic. Prefiero manual
`ocx account use anthropic <id>` Cambiar cuando no está seguro.
:::

<a id="anthropic--pool-2-anthropic2"></a>

### Anthropic · Pool`anthropic2`)

`anthropic2` ("Anthropic · Pool 2") es un segundo proveedor incorporado de Anthropic OAuth con su propio cuenta pool. Ejecuta la misma implementación Anthropic que `anthropic`: el mismo flujo de inicio de sesión, cable formato, puente nativo Messages y Responses, y metadatos del modelo. Solo las cuentas y la grupo Alrededor de ellos están separados. Elija un grupo con el prefijo del modelo: `anthropic/claude-sonnet-5` utiliza el grupo primaria y `anthropic2/claude-sonnet-5` utiliza Pool 2.

Pool 2 permanece inactivo hasta que lo agregue. Inicie sesión `ocx login anthropic2` o añadir **Anthropic · Pool 2**
en la página de proveedores del panel. Un primer inicio de sesión exitoso crea `providers.anthropic2` Con el marcador `"anthropicOAuthInstance": "anthropic2"`. Pool 2 nunca se convierte en el proveedor predeterminado: bare
`claude-*` nombres de modelos, el modelo predeterminado y el desvío de llamadas Claude Code siguen resolviendo
`anthropic`. Un sin marcar `anthropic2` La entrada que creaste anteriormente mantiene su significado personalizado; login rechaza la colisión del nombre y no reescribe ni la entrada ni sus credenciales.

Pool 2 lee la configuración de su grupo desde su propia entrada de proveedor. Las claves, valores predeterminados y comportamiento coinciden El nivel superior [`anthropicAccountPool`](#anthropicaccountpool-experimental)y nada se hereda de la grupo principal. `providers.anthropic.anthropicAccountPool`o el campo en cualquier otro proveedor, es rechazada.

```json
{
  "anthropicAccountPool": { "enabled": true, "strategy": "quota" },
  "providers": {
    "anthropic2": {
      "adapter": "anthropic",
      "authMode": "oauth",
      "baseUrl": "https://api.anthropic.com",
      "anthropicOAuthInstance": "anthropic2",
      "anthropicAccountPool": { "enabled": true, "strategy": "round-robin" }
    }
  }
}
```

Los dos grupos están aislados dentro de opencodex:

- **Credenciales:** Las cuentas de Pool 2 se almacenan bajo su propia cuenta. `anthropic2` clave en el protegido tienda de credenciales. Un inicio de sesión cuya cuenta token o Anthropic verificada ya está almacenada en el otro El pool es rechazado.
- **Configuración de Pool y estado en entorno de ejecución:** selección, afinidad de sesión, tiempos de reutilización, pausas, rutas modelo y los umbrales por cuenta pertenecen a un grupo. Ruta `fallback: true` se amplía solo dentro de la misma grupo.
- **Cuota y uso:** uso de sondas, cachés de cuota y atribución de uso se registran por grupo, El ID de cuenta que existe en ambos grupos todavía tiene dos registros separados.
- **Restablecer subvenciones:** Pool 2 mantiene su propio diario (`anthropic2-reset-grant-ledger.json`) junto a la El diario sin cambios de Primary Pool
- **Recuperación:** a directo `anthropic2/<model>` La petición nunca vuelve a la grupo principal, y un El límite de tarifa o el rechazo de Pool 2 nunca enfría una cuenta de grupo principal. Un combo explícito que nombra a ambos pools mantiene los objetivos declarados.

Esta separación es un límite de enrutamiento dentro de opencodex. No cambia cómo Anthropic trata su cuentas o el [riesgo de política de cuenta](#anthropicaccountpool-experimental) descrito anteriormente.

Las cuentas de Pool 2 se agregan solo a través del navegador OAuth. A diferencia `anthropic`, Pool 2 nunca importa, adopta o escribe de nuevo un Claude Code CLI token; esta diferencia es intencional. Pool 2 comienza vacío, y una solicitud Pool 2 sin cuenta Pool 2 no usable falla con un error de autenticación en lugar de tomando prestada una credencial de grupo primario o Claude Code.

Los comandos de la cuenta y las API de administración toman el grupo por su nombre: `ocx account pool anthropic2 …`,
`ocx account auto-switch anthropic2 …`, `ocx account routes anthropic2 …`, y
`ocx account anthropic-reset-grants --provider anthropic2`. La configuración de la grupo y el restablecimiento-subvención Los endpoints aceptan `provider: "anthropic2"`; omitiéndola mantiene el grupo primario.

<a id="helper-pool-selection-anthropicinstance"></a>

#### Selección de grupos de ayuda (`anthropicInstance`)

Los ayudantes de búsqueda y visión aceptan una opción `anthropicInstance`, en el global
`webSearchSidecar` y `visionSidecar` en el Claude Code se anula
`claudeCode.webSearchSidecar` y `claudeCode.visionSidecar`. El panel de control lo muestra como un **Pool**
seleccione cuando el soporte auxiliar es Anthropic.

| Valor | Comportamiento |
| --- | --- |
| unset (por defecto) | Siga el grupo de la solicitud actual: un `anthropic2/<model>` solicitud utiliza Pool 2 y un `anthropic/<model>` request utiliza el grupo principal. Una solicitud de otro proveedor mantiene el descubrimiento de ayudante existente, que nunca selecciona Pool 2. |
| `"anthropic"` | Utilice siempre la grupo principal. |
| `"anthropic2"` | Siempre use Pool 2. |

El campo solo se aplica cuando el backend del ayudante se resuelve en Anthropic. Poniéndolo con otro backend es un error de validación; debido a que la búsqueda web tiene por defecto OpenAI, establece
`"backend": "anthropic"` También. Un modelo de ayudante calificado con la otra grupo, como
`anthropic/claude-sonnet-5` con `"anthropicInstance": "anthropic2"`También es rechazada. Si el elegido pool no tiene cuenta utilizable, el ayudante falla antes de enviar nada; no cambia al otro grupo. La solicitud principal continúa sin ese ayudante. Una elección no establecida se guarda como ausente, nunca como `"anthropic"`.

```json
{
  "webSearchSidecar": { "backend": "anthropic", "anthropicInstance": "anthropic2" }
}
```

:::caution[Volver a una versión anterior]
Las versiones sin Pool 2 no entienden la `anthropic2` entrada. Antes de instalar un viejo versión, detener el proxy, copia de seguridad `config.json` y `auth.json`, y eliminar
`providers.anthropic2` Desde `config.json`. Las credenciales de grupo primario nunca se mueven ni reescriben Pool 2. No se admite una degradación in situ con un Pool 2 activo.
:::

### `oauthAccountFailover`

Rota a otra cuenta de inicio de sesión del mismo proveedor cuando uno está limitado por tarifa, para OAuth proveedores que no tienen un grupo de su propio — xAI, Cursor, Kimi, GitHub Copiloto, Google Antigravedad, y Nous.

**Entrar en una segunda cuenta es lo que enciende esto, y nada lo apaga.** Rotación activa para cualquiera de esos proveedores que posean 2 o más cuentas que no estén marcadas para Reautenticación — la misma regla `apiKeyPool` ya se aplica a un grupo de claves 2+. Un proveedor con una cuenta almacenada se comporta exactamente como antes.

La rotación aquí solo funciona *después* El upstream ya ha rechazado la solicitud, por lo que la única opción desactivar el cambio podría ofrecer es entre reintentar en una segunda cuenta que inició sesión deliberadamente y Devolver un 429 mientras esa cuenta permanece inactiva. La rotación de rechazo se expresa al no almacenar un segunda cuenta.

| Clave | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `oauthAccountFailover.enabled?` | `boolean` | presencia-conducido | Global Anular para el **Preferencia de cuenta pre-envío** Sólo. `false` impide que una solicitud saludable se dirija hacia la cuenta con más espacio libre conocido. Lo hace **no** Deshabilitar la rotación 429. |
| `providers.<name>.oauthAccountFailover.enabled?` | `boolean` | hereda | Anulación por proveedor para la misma preferencia; supera la configuración global en cualquier dirección. `false` declina la preferencia por este proveedor incluso cuando el ajuste global es `true`, y `true` opta por este proveedor en incluso cuando la configuración global es `false`. La rotación reactiva 429 no se ve afectada de ninguna manera. |
| `providers.<name>.oauthAccountFailover.sessionAffinity?` | `"conversation" \| "none"` | `"none"` | Fijación de conversación para grupos genéricos OAuth. Requiere proactivo `enabled: true` (proveedor o valor global heredado). Las sesiones existentes mantienen su cuenta por delante de la estrategia de la nueva sesión hasta que no esté disponible. |
| `providers.<name>.oauthAccountFailover.strategy?` | `"quota" \| "round-robin" \| "fill-first" \| "reset-first" \| "least-loaded"` (solo Kiro) | — | Kiro `least-loaded` elige la cuenta elegible con la menor cantidad de solicitudes en vuelo, utilizando el pedido de cuenta para los lazos. Se requiere `pool.kernel` y preferencias proactivas; otras estrategias conservan sus reglas existentes. `reset-first` También requiere `pool.kernel`: entre las cuentas elegibles que no se agotan, el primer intento (mientras la preferencia proactiva está activada) y una rotación de 429 prefieren la cuenta cuya cuota se restablece lo antes posible (la ventana semanal cuando se informa, de lo contrario la ventana de 5 horas), con más espacio para romper lazos. Las cuentas agotadas son las últimas. Sin evidencia de cuotas, o cuando un proveedor pasivo tiene evidencia solo para algunas cuentas, vuelve al orden de margen. El grupo Anthropic no lo acepta. |
| `providers.kiro.oauthAccountFailover.maxConcurrentPerAccount?` | número entero 1–100 | ilimitado | Una cola por cuenta de proceso local mantiene una ranura hasta la finalización o cancelación de la respuesta. Una cuenta completa seleccionada espera como máximo 250 ms, luego devuelve 503 `account_capacity` con `Retry-After: 1`. El límite no mueve la solicitud a otra cuenta. |
| `providers.<name>.oauthAccountFailover.autoSwitchThreshold?` | `number` | `80` | 0–100 porcentaje de uso en el que `fill-first` adelantos fuera de la cuenta activa (695). Conjunto con `ocx account auto-switch <provider> threshold <n>`. Leer solo bajo `pool.kernel` con `strategy: "fill-first"`; una cuenta sin uso medido cuenta por debajo del umbral. |
| `providers.<name>.oauthAccountFailover.stickyLimit?` | `number` | `1` | Los envíos exitosos se conservan en uno `round-robin` selección, 1–100 (-695). Leer solo bajo `pool.kernel` con `strategy: "round-robin"`. |

Para rechazar la dirección proactiva de la cuenta para un proveedor cuyos términos preferiría no probar, mientras se recupera de un límite de velocidad:

```json
{
  "providers": {
    "cursor": {
      "oauthAccountFailover": { "enabled": false }
    }
  }
}
```

Esa configuración sobrevive al inicio de sesión, la adición de una cuenta y la reautenticación.

Proveedores genéricos de OAuth (Google Antigravedad, xAI, Cursor, Kimi, GitHub Copiloto, Nous y cualquier otros proveedores de OAuth fuera de los grupos Codex y Anthropic) también aceptan `strategy` y
`autoSwitchThreshold` en la misma clave, a través de `GET`/`PUT /api/oauth/accounts/pool?provider=<name>`
y el `ocx account strategy` / `ocx account auto-switch` / `ocx account sticky` Verbos. La respuesta lleva
`"inert"` solo para esos tres campos — `true` mientras se almacenan pero no se consumen,
`false` una vez `pool.kernel` está activado y en realidad seleccionan una cuenta — `enabled` es vivo y gobierna el pre-despacho preferencia. `quotaWindow` No forma parte del contrato genérico. Codex (`/api/codex-auth`y Anthropic (`anthropicAccountPool`) mantener sus propios contratos sin cambios.

Establecer `providers.<name>.oauthAccountFailover.sessionAffinity` a `"conversation"` junto con
`enabled: true` mantener una conversación en su cuenta admitida. La identidad de sesión utiliza el cliente marcador de hilo, encabezados de sesión, encabezado de hilo, luego `prompt_cache_key`; una caché de escritorio compartida Se excluye la cohorte. Los enlaces se aíslan por proveedor, configuración de inicio y llamada autenticada Principal. Las llamadas locales no autenticadas comparten el alcance local. Sin marcador de sesión significa que no hay unión.

Las nuevas sesiones utilizan la estrategia existente (`pool.kernel` still ports round-robin/fill-first). Las sesiones existentes permanecen ancladas incluso cuando otra cuenta tiene más cuota. Una pausa, una reautenticación requisito, tiempo de reutilización de la familia o lista de modelos incompatibles libera el enlace; la recuperación de fallos une el reemplazo admitido. El límite de concurrencia de Kiro aún espera o se niega en lugar de mover una conversación saludable simplemente para equilibrar la carga.

En este modo, las opciones automáticas, incluidas las solicitudes sin claves y las conmutación por error, permanecen locales: La cuenta seleccionada del panel de control sigue siendo la selección del operador. Solicitar atributos de historial la cuenta de servicio. Selección manual, reselección de la misma cuenta y cambios en la lista/revisión de políticas invalidar enlaces de proveedores, incluyendo escrituras de otro proceso. Un refresco ordinario mantiene el misma cuenta. Fill-first conserva su cuenta actual en la memoria sin cambiar la selección guardada. Los enlaces caducan después de 24 horas sin admisión, están limitados a 2.000 entradas en todo el proceso (incluyendo los cursores de relleno), y se pierden al reiniciar. Establecer `sessionAffinity: "none"` o desactivar preferencia proactiva para liberarlos. Codex y Anthropic conservan sus propios contratos de afinidad.

El grupo Codex y el grupo Anthropic están excluidos y mantienen su propia rotación; habilitando esto Tampoco cambia. Un proveedor con una sola cuenta almacenada es un estricto no-op, y no hay tiempo de reutilización grabado para ello.

Antes del envío, OAuth genérico captura la lista elegible. En un 429 se enfría la cuenta fallida usando `Retry-After` cuando está presente (limitado a 15 minutos) o un retroceso predeterminado, y la solicitud es Se reproduce en la siguiente cuenta seleccionada de la lista en vivo. El techo de rotación estable es
`max(3, min(eligibleCount, 6) - 1)` por solicitud; la selección en vivo sigue filtrando los tiempos de reutilización y una cuenta No se selecciona nunca la marca para reautenticación. Los enfriamientos son locales, por lo que se olvida un reinicio A ellos.

Cuando al menos dos cuentas son elegibles, la asignación por defecto de propiedad de ingreso cubre hasta tres envía por cuenta elegible, contando como máximo seis cuentas, por lo que una solicitud no hace más de 18 envíos, sin embargo muchas cuentas están inscritas. Una sola cuenta elegible mantiene la asignación base existente de tres y Asignación total de cuatro. Los techos de llamadas explícitas y los ámbitos combinados mantienen sus límites existentes.

La rotación lleva la cuenta alternativa **lleno** snapshot de credenciales, no solo su portador, por lo que un proveedor que empareja los metadatos de enrutamiento con su token — Antigravity's Cloud Code Assist id del proyecto, por ejemplo — no puede terminar enviando token de una cuenta con los metadatos de otra cuenta.

Para la inferencia de antigravedad primaria a través del envío principal del adaptador Google, se actualiza por primera vez 401 y repite la misma cuenta. Si esa repetición sigue siendo 401, o falla la actualización con una credencial de terminal rechazo que requiere reautenticación, la solicitud puede cambiar una vez a un hermano vivo elegible. Esa solicitud hermana mantiene los reintentos transitorios ordinarios del adaptador, y cada envío físico cuenta. contra el presupuesto de envío existente de la solicitud. Un fallo de actualización transitoria mantiene el error de autenticación desinfectado. Se omiten las cuentas de pausa, de reautenticación requerida y de enfriamiento; la credencial fallida obtiene un tiempo de reutilización en proceso de 60 segundos solo mientras su generación es actual. El mismo despacho principal también puede cambiar una vez en un 403 cuando Google limita la normalización de errores encuentra una estructura completa `VALIDATION_REQUIRED` Razón. Las rutas 401 y 403 comparten un hermano intento por solicitud; un 403 no relacionado o incompleto mantiene su error original. Un hermano rechazado, La cancelación o el presupuesto de envío agotado no causa otro envío ascendente. El bucle de búsqueda web basado en fetch también gira una vez en esta razón 403 estructurada, utilizando el OAuth token y el proyecto Cloud Code Assist correspondiente. Acepta solo error completo, limitado Google sobres con `error.details[].reason === "VALIDATION_REQUIRED"`; solo la redacción de verificación hace no autoriza la rotación, y esta ruta no persiste una marca de reautenticación. Cada envío físico, incluyendo un reintento 429, consume el mismo presupuesto de solicitud exactamente una vez. Una grupo para discapacitados, cancelación, presupuesto agotado o hermano no disponible conserva el fracaso. Si el hermano solicita la construcción o Si falla el despacho, el 403 delimitado original sigue siendo el error; una repetición rechazada antes de la física envío devuelve su asignación de envío no utilizada. Continuaciones, paso nativo Responses, sidecars de imagen y salida ya enviados El cliente no debe utilizar esta rotación.

El ámbito actual son las rutas de solicitud Responses ordinarias. Cursor informa de los límites de velocidad como adaptador eventos en lugar de un estado HTTP, y el punto final de imagen antigravedad independiente tiene su propio petición de ruta; ni gira todavía.

:::caution[Experimental]
Rotar entre cuentas de suscripción gasta la cuota de una segunda cuenta y puede violar algunas términos de los proveedores. Si eso no es una compensación que desea, establezca `enabled: false` globalmente o para el proveedor en cuestión.
:::

<a id="managed-record-shapes"></a>

### Formas de registro administradas

`apiKeys[]` Las entradas contienen `id`, `name`, generado `key`y ISO `createdAt` cuerdas. Opcional `allowMeteredComboTargets: true` Permite explícitamente los objetivos marcados `metered: true`Omitido o falso consentimiento los niega. El entorno token nunca califica. Las llamadas locales solo de bucle pueden usar per-combo `allowMeteredTargets: true`; las personas que llaman con clave configurada y vinculada aún necesitan el consentimiento de la clave. Véase [Consentimiento de fallback medido](/es/guides/combos/#metered-fallback-consent).
`codexAccounts[]` entradas requieren `id`, `email`, y `isMain`, con opcional `plan`,
`chatgptAccountId`, y seguro para la privacidad `logLabel`. Estos registros normalmente se administran en el panel de control.

### `tokenGuardian` (`OcxTokenGuardianConfig`)

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `enabled?` | `boolean` | `false` | Interruptor proactivo-actualizado global. |
| `tickSeconds?` | `number` | `21600` | Intervalo de barrido (6 horas, mínimo 60 segundos). |
| `jitterSeconds?` | `number` | `300` | Retraso aleatorio antes de un barrido. |
| `concurrency?` | `number` | `3` | Máximas actualizaciones simultáneas. |
| `leadSeconds?` | `number` | `900` | Tiempo de espera de actualización adicional más allá de una marca. |
| `failureBackoffBaseSeconds?` | `number` | `300` | Retroceso transitorio inicial. |
| `failureBackoffMaxSeconds?` | `number` | `3600` | Techo de retroceso y retraso de falla permanente. |
| `codexWarmupEnabled?` | `boolean` | `false` | Opte por la validación sintética de la cuenta de grupo Codex. |
| `codexWarmupMaxAgeSeconds?` | `number` | `691200` | Revalida una cuenta después de 8 días. |
| `codexWarmupModel?` | `string` | `gpt-5.6-luna` | Modelo nativo utilizado para el calentamiento opcional. |

<a id="fixed-provider-endpoints"></a>

## Endpoints de proveedores fijos

El enrutamiento resuelve un extremo del proveedor antes del adaptador. Para la mayoría de las funciones integradas, el punto final del registro gana sobre configurado `baseUrl`. Cuatro tipos de entrada mantienen el URL configurado:

- Proveedores habilitados para anulación: `ollama`, `vllm`, `lm-studio`, `litellm`, `qwen-cloud`, y
  `alibaba-token-plan-intl`;
- plantillas de registro completadas por el usuario, como `azure-openai` y `cloudflare-ai-gateway`;
- promocionó preconfiguración fijos de API-key preservando un destino personalizado del mismo nombre más antiguo; y
- proveedores ausentes del registro.

Los adaptadores pueden ajustar el URL resuelto posteriormente. Kiro, por ejemplo, sigue la credencial importada API región para canónica `runtime.{region}.kiro.dev`. Véase [Adaptadores](/es/reference/adapters/).

Cuando el enrutamiento descarta `baseUrl`, opencodex registra el punto final del registro y solo el origen configurado; una ruta configurada puede contener por sí misma una credencial. Elimine la URL no utilizada o elija la entrada del proveedor que coincida con la región prevista. `alibaba-token-plan` está anclado a Beijing, mientras que
`alibaba-token-plan-intl` cubre los puntos finales internacionales.

Para un roto `openai-responses` gateway, la reparación pertenece al objeto proveedor:

```json
{
  "providers": {
    "custom-gateway": {
      "adapter": "openai-responses",
      "baseUrl": "https://gateway.example/v1",
      "apiKey": "${GATEWAY_KEY}",
      "responsesItemIdRepair": {
        "reasoning": ["rs_0"],
        "message": ["msg_0"],
        "repairMissingTerminalIds": true
      }
    }
  }
}
```

Las listas de marcadores son coincidencias exactas. Deje el campo sin configurar para los proveedores Responses normales / con estado Así que el passthrough permanece byte por byte idéntico.

<a id="cursor-provider-adapter-cursor"></a>

## Proveedor de Cursor (`adapter: "cursor"`)

El puente Cursor es experimental. Después `ocx login cursor`Añadir o editar `providers.cursor`.

Si un proxy no puede Cursor's por defecto HTTP/2 corriente, conjunto `upstreamHttpVersion` a `"http1.1"`
o su `"h1"` alias. Esto cambia la inferencia a Cursor `RunSSE` + `BidiAppend` compatibilidad transporte y usos HTTP/1.1 para `GetUsableModels` descubrimiento también. El valor requiere un HTTPS `baseUrl`. Déjalo Desactivar o usar `"auto"` para el comportamiento HTTP/2 existente. En el panel de control elija
**Proveedores → Cursor → Configuración → Cursor transporte**.

La escalera de optimización del router Cursor está expuesta como identificadores Codex separados porque el selector no puede procesar Parámetros del modelo específico Cursor:

| Modelo Codex | Modo de enrutador Cursor |
| --- | --- |
| `cursor/auto` | Equipo/cuenta predeterminada |
| `cursor/auto-cost` | Coste |
| `cursor/auto-balance` | Saldo |
| `cursor/auto-intelligence` | Inteligencia |

Las variantes explícitas envían Cursor `default` modelo con su `optimization` parámetro, preservando el selección en cada solicitud. Permanecen disponibles cuando el descubrimiento vivo omite `default`.

<a id="vision"></a>

### Visión

Usos nativos de la visión Cursor `SelectedImage` (JPEG soft-cap + `blobIdWithData`) para los modelos que pueden ver imágenes de forma nativa — Claude, Gemini, GPT, Kimi y Grok entre ellas — usando el giro activo `data:`
Sólo imágenes. Las imágenes anteriores se reproducen como `[image attached]` marcadores de texto; remotos o no decodificables Las imágenes se convierten en marcadores de omisión. Auto, la familia Composer y GLM (`glm-5.2`, `glm-5.3`) permanecer en el curado `noVisionModels` Enumere y use la visión describa sidecar en su lugar.

Las herramientas locales impulsadas por el servidor Cursor están desactivadas de forma predeterminada. Codex continúa utilizando sus propias herramientas como
`apply_patch` y `exec_command` con su propia aprobación y política de sandbox:

- `"off"` (predeterminado) rechaza Cursor-nativo `read`, `write`, `delete`, `ls`, `grep`, `shell`, y
  `fetch` ejecución.
- `"on"` opta por la ejecución local de confianza y evita la aprobación / semántica de caja de arena Codex, excepto la ejecución de shell nativo en primer plano, que sigue sin estar disponible.
- `"codex-sandbox"` se mantiene por compatibilidad pero falla cerrado como `"off"`; solicitar prosa No es digno de confianza certificado sandbox.

```json
{
  "providers": {
    "cursor": {
      "adapter": "cursor",
      "baseUrl": "https://api2.cursor.sh",
      "authMode": "oauth",
      "defaultModel": "auto",
      "nativeLocalExec": "off"
    }
  }
}
```

Establecer `nativeLocalExec` on `providers.cursor`No en el nivel superior. En el panel de control **Proveedores
→ Cursor → Editar JSON**, guardar y reiniciar. Legado `unsafeAllowNativeLocalExec: true` es igual
`nativeLocalExec: "on"` Solo cuando `nativeLocalExec` es inestable. MCP, grabación de pantalla y uso del ordenador están controlados por separado por `mcpServers` y `desktopExecutor`.

Primer plano `shellArgs` y `shellStreamArgs` Las solicitudes son rechazadas antes de la creación del proceso en Windows, macOS y Linux, incluso con `nativeLocalExec: "on"`. Necesitan un kernel descendiente propietario que esta implementación no proporciona; use la herramienta de shell del cliente en su lugar. El formulario de transmisión aún devuelve el inicio, la salida abortada, un fallo escrito y la transmisión se cierra para que el Cursor giro puede terminar. No recoge ningún stdout/stderr y no tiene asignación activa de bytes de salida. Esta restricción no cambia la ejecución de shell en segundo plano ni las otras opciones de ejecución explícitas del ejecutor.

Cada `mcpServers.<name>` acepta también `command` (stdio) o `url` (Streamable HTTP). Stdio también acepta `args`, `env`, y `cwd`; HTTP acepta `headers`. Ambos apoyos `enabled` (Default true) y
`toolPrefix`. `desktopExecutor` acepta `computerUseCommand`, `recordScreenCommand`, `cwd`, `env`, y `timeoutMs` (por defecto) `30000`) Los comandos pasan `sh -c`, lea una solicitud JSON de stdin, y debe escribir un resultado JSON en stdout.

:::caution[Seguridad]
El enlace de bucle de retorno predeterminado admite cualquier proceso local sin autorización, incluidos otros usuarios en un host multiusuario. Deje de lado al ejecutivo local a menos que se confíe en cada persona que llama al plano de datos y usted deliberadamente aceptar sin pasar por la aprobación Codex y la semántica de sandbox.
:::

<a id="zed-provider-adapter-zed"></a>

## Proveedor Zed (`adapter: "zed"`)

El puente Zed Hosted AI es experimental y solo para inicio de sesión. Correr `ocx login zed` antes de utilizarlo; el login almacena la identidad de la cuenta Zed con su acceso nativo a la aplicación token en la tienda OAuth normal.

```json
{
  "providers": {
    "zed": {
      "adapter": "zed",
      "baseUrl": "https://cloud.zed.dev",
      "authMode": "oauth",
      "defaultModel": "auto"
    }
  }
}
```

El puente obtiene una inferencia alojada de corta duración token y envía `POST /completions`. La vida
`/models` La lista se utiliza solo para metadatos de selector específicos de cuenta: los identificadores arbitrarios del modelo permanecen reenviable, con la familia de backend inferida del campo de proveedor en vivo o el nombre del modelo.

:::caution[No oficial: úsalo bajo tu responsabilidad]
Zed no proporciona ni respalda esta integración, y puede estar fuera de los términos de servicio de Zed. Zed puede limitar o suspender una cuenta que la utiliza. El proveedor nunca está habilitado de forma predeterminada.
:::

<a id="openrouter-provider-routing"></a>

## Enrutamiento del proveedor OpenRouter

OpenRouter puede servir a un modelo a través de varios proveedores de inferencia. `openRouterRouting` se mantiene solicitudes de proveedores preferidos; `modelOpenRouterRouting` lo reemplaza por los ID de modelo exactos. Esto es útil para la afinidad de caché rápida porque el soporte de caché, la retención, las tasas de éxito y los precios varían según proveedor de inferencias.

Los nombres de los proveedores son babosas OpenRouter. `allowFallbacks: false` falla cerrado; `true` permite otro proveedor elegible después de la lista ordenada. `only` Siempre es una lista.

```json
{
  "providers": {
    "openrouter": {
      "adapter": "openai-chat",
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "${OPENROUTER_API_KEY}",
      "openRouterRouting": {
        "order": ["deepseek"],
        "allowFallbacks": false
      },
      "modelOpenRouterRouting": {
        "anthropic/claude-sonnet-5": {
          "only": ["anthropic"],
          "allowFallbacks": false
        }
      }
    }
  }
}
```

<a id="vercel-ai-gateway-provider-routing"></a>

## Enrutamiento del proveedor de Vercel AI Gateway

Vercel AI Gateway puede enrutar un modelo a través de múltiples proveedores de inferencia subyacentes. `vercelGatewayRouting` configura las preferencias del proveedor; `modelVercelGatewayRouting` lo reemplaza por IDs de modelo exactos. Dejando ambas marcas unset `resolveVercelGatewayRouting()` volver `undefined`, por lo que los creadores de solicitudes de chat omiten el `provider` field y Vercel AI Gateway conservan su comportamiento de enrutamiento dinámico predeterminado.

- `order`: Vercel AI Gateway upstream proveedor babosas en orden de prioridad.
- `only`: lista de permisos explícita que restringe los proveedores de upstream de Vercel AI Gateway elegibles.
- `sort`: ordenar automáticamente los proveedores elegibles por `"cost"` (costo más bajo), `"ttft"` (tiempo hasta la primera token), o `"tps"` (tokens por segundo).

```json
{
  "providers": {
    "vercel-ai-gateway": {
      "adapter": "openai-chat",
      "baseUrl": "https://ai-gateway.vercel.sh/v1",
      "apiKey": "${VERCEL_AI_GATEWAY_KEY}",
      "vercelGatewayRouting": {
        "sort": "ttft"
      },
      "modelVercelGatewayRouting": {
        "zai/glm-5.2": {
          "only": ["novita", "deepinfra"],
          "order": ["novita", "deepinfra"]
        }
      }
    }
  }
}
```

Las claves de modelo son selectores de modelo públicos Vercel sin el prefijo de proveedor OpenCodex externo. Seleccionar
`vercel-ai-gateway/zai-glm-5.2` Restauración Nativa `zai/glm-5.2` antes de aplicar la regla modelo. Los mismo mapa se aplica a un nativo `vercel/<model-id>` selector: use el código
`vercel-ai-gateway/vercel-<model-id>` selector en OpenCodex y mantener `vercel/<model-id>` Como el clave de modelo.

<a id="static-model-allowlists"></a>

## Listas de modelos estáticos

<a id="storing-keys-in-the-os-keychain"></a>

## Almacenar claves en el llavero del sistema operativo

Para Vertex, la entrada de grupo de teclas API dedicada (`POST /api/providers/keys`) acepta GCP completa
`service_account` o `authorized_user` credencial JSON después de que se haya creado el proveedor. El proveedor crea/edita la forma y `ocx provider add --api-key` rechazar la credencial JSON antes ahorro: cree el proveedor sin una clave, luego agregue el JSON a través de su grupo de claves. Pegar el Contenidos de JSON, no una ruta de archivo Windows, Unix o relativa. Múltiples Los objetos JSON separados por comas o espacios en blanco se almacenan juntos como entradas de grupo separadas; El primero se vuelve activo. La configuración contiene solamente `gcp-sa:<account>` referencias, nunca el credenciales JSON. Mezclado JSON / literal-key pastas a granel se rechazan en su conjunto; añadir teclas literales separadamente. Los errores de almacenamiento dejan la configuración sin cambios y notifican un error fijo sin material de credencial de eco. Las cuentas de marcador vacías no son válidas y no vuelven a las credenciales del host. Pegue un objeto de credencial o una secuencia de objetos, sin un array envolvente ni una cadena citada. Se rechaza el texto de credenciales mal formado. Si una credencial almacenada seleccionada se elimina o se vuelve ilegible, Vertex rechaza la solicitud incluso cuando previamente almacenó en caché una token de acceso para esa credencial. Eliminar una clave o proveedor, o reemplazar un proveedor con `ocx provider add --force`, elimina sus credenciales GCP no referenciadas después de que la configuración es guardado; se conserva una credencial referenciada por otro proveedor. Si falla la limpieza de OS-store, a La advertencia solicita la inspección manual sin deshacer la eliminación de configuración comprometida. Las acciones ordinarias de almacenamiento / restauración de llaveros dejan los marcadores GCP y JSON en la tienda del sistema operativo. Restauración credencial JSON a través de un `keychain:` alias es rechazado, y la limpieza conserva las cuentas aún referenciado a través de cualquiera de los marcadores ortográficos. Usando un `keychain:` alias que contiene GCP JSON como una clave API también rechaza la solicitud;
`gcp-sa:` referencia para autenticación de Vertex en su lugar. Las claves literales de API deben ser texto token simple: se rechazan los objetos JSON, las matrices y las cadenas JSON citadas en la resolución y restauración de clave literal, incluyendo envolturas que contienen texto de credenciales escapado. escrituras de credenciales y persistencia del marcador comparten el bloqueo de la transacción de limpieza, por lo que concurrente La eliminación no puede eliminar la JSON almacenada entre la lectura y la confirmación del marcador.

De forma predeterminada, un proveedor `apiKey` y `apiKeyPool` sentarse en `config.json` (modo 0600, escritura atómica). Si prefiere mantener el material clave fuera del archivo, muévalo a la tienda de credenciales del sistema operativo:

```bash
ocx provider keychain deepseek status    # store: file | env | keychain, and whether the keychain answers
ocx provider keychain deepseek store     # move active key + pool into the OS keychain
ocx provider keychain deepseek restore   # bring the plaintext back and delete the keychain items
```

Las mismas operaciones son `GET`/`POST /api/providers/keychain`. Después `store`, `config.json` bodegas
`"apiKey": "keychain:deepseek"` (entradas de grupo) `keychain:deepseek/<id>`) y el secreto vive bajo la
`opencodex.provider-api-key.v1` servicio en el llavero macOS, el administrador de credenciales Windows o el Linux Servicio Secreto. Copias de seguridad de `config.json` Por lo tanto, solo llevan referencias. Rotación de claves y conmutación por error keep working: las entradas de grupo se comparan por referencia, por lo que una rotación nunca escribe texto sin formato.

Antes de tocar la configuración, `store` escribe y lee cada entrada; si el llavero no está disponible o la lectura no coincide, se rechaza con 503 y deja el archivo como estaba. A petición de tiempo una referencia que no se puede leer no produce credenciales y una advertencia por clave — no hay texto sin formato fallback, por diseño.

Cuándo no optar por: un proxy que se ejecuta como un servicio sin cabeza (systemd, launchd, Task Scheduler) o en un Por lo general, el contenedor no tiene sesión de llavero desbloqueada, por lo que las solicitudes fallarían. Utilice un
`${ENV_VAR}` referencia en el entorno de servicio allí. Las referencias de Env se dejan intactas por `store`.

Los `zhipu-bigmodel-responses` semillas predefinidas `glm-5.3`, `glm-5.3-flash` y `glm-5-turbo` con
`liveModels: false` por `https://open.bigmodel.cn/api/v1`. Su static roster y contexto, esfuerzo y metadatos de resumen por modelo provienen del
[Guía BigModel Responses](/es/guides/providers/#bigmodel-coding-plan-over-responses). El local oficial `models.json` El ejemplo no establece una `/models` API.

Con `liveModels: false`, un vacío u omitido `models` listar las semillas configuradas `defaultModel`
primero, seguido por `retainModels`; los ID duplicados se eliminan mientras se conserva la primera aparición. Un explícito no vacío `models` lista en lugar de semillas `models` seguido por `retainModels`, sin Agregando implícitamente una `defaultModel`. Ese valor predeterminado todavía se puede enumerar explícitamente en
`models` o `retainModels`. Si ninguno de estos campos proporciona un id, la semilla estática está vacía. Este es el orden de la semilla, no una promesa del orden final del selector. `selectedModels`, `disabledModels` y La política de proveedores discapacitados sigue siendo aplicable. `authMode: "forward"` mantiene su rama separada y hace no utilizar esta semilla estática enrutada. Estas reglas no cambian el fracaso del descubrimiento en vivo.

Live discovery rechaza más de 4 MiB o 2.000 filas de modelos sin procesar antes del almacenamiento en caché; Los preconfiguración incorporados pueden usar límites inferiores y filtrar a filas elegibles para chat. Resultados sobredimensionados o malformados seguir fallback rancio/configurado. Un resultado válido cero-elegible sigue siendo autorizado y no es válido. reemplazados o truncados silenciosamente.

Uso `selectedModels` Cuando el descubrimiento todavía debería ejecutarse, pero solo los ids seleccionados deberían aparecer en Codex y
`/v1/models`. El panel de control conserva la lista completa descubierta para cambios posteriores en la lista de permisos.

Uso `retainModels` Para el problema opuesto: un proveedor cuyo `/models` Endpoint omite un id todavía llamable (una implementación privada, un id de vista previa, una puerta de enlace compatible con OpenAI con un listado). Los ids listados se mantienen en el catálogo con el mismo contexto y sugerencias de esfuerzo que
`models`, y sobreviven `liveModels: false` También. `selectedModels` aún estrecha lo visible, así que un id debe estar en ambas listas cuando una lista de permisos está activa. Retener un ID no hace que el upstream aceptarlo; un id incorrecto falla en el momento de la solicitud con el error upstream. Desde el CLI:
`ocx provider edit <name> --retain-models gemini-3.7-flash,other-id` (`-` , por ejemplo).

Vista previa GPT-5.6 entradas fallback utilizan el mismo mecanismo. La base de semillas preestablecida OpenAI API-key y Pro Ids con contexto `1050000` y entrada máxima `922000`; OpenRouter semillas `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra`, y `openai/gpt-5.6-luna` con contexto `1050000`. Nativo Pool/Direct Las ventanas siguen el [Política de proveedor de OpenAI](#reserved-openai-providers). El sincronizado catálogo anuncia `max` mientras se mantiene `xhigh` distinto.

```json
{
  "providers": {
    "openrouter": {
      "adapter": "openai-chat",
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "${OPENROUTER_API_KEY}",
      "liveModels": false,
      "models": ["deepseek/deepseek-v4-flash", "qwen/qwen3-coder-plus"]
    }
  }
}
```

<a id="complete-example"></a>

## Ejemplo completo

```json
{
  "port": 10100,
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "adapter": "openai-responses",
      "baseUrl": "https://chatgpt.com/backend-api/codex",
      "authMode": "forward"
    },
    "anthropic": {
      "adapter": "anthropic",
      "baseUrl": "https://api.anthropic.com",
      "authMode": "oauth",
      "defaultModel": "claude-sonnet-4-6"
    },
    "ollama-cloud": {
      "baseUrl": "https://ollama.com/v1",
      "apiKey": "${OLLAMA_API_KEY}",
      "defaultModel": "glm-5.2",
      "noVisionModels": ["glm-5.2", "glm-5.3", "gpt-oss", "qwen3-coder", "deepseek-v4-flash"]
    }
  },
  "subagentModels": ["anthropic/claude-opus-5", "ollama-cloud/glm-5.2"],
  "disabledModels": [],
  "websockets": false,
  "webSearchSidecar": {
    "maxSearchesPerTurn": 3,
    "routedModelStallTimeoutMs": 200000,
    "timeoutMs": 60000
  },
  "visionSidecar": { "enabled": true }
}
```

<a id="opencode-go-responses-compatibility"></a>

## Compatibilidad con OpenCode Go Responses

En solicitudes no reenviadas cuyo punto final resuelto es `https://opencode.ai/zen/go/v1/responses`, OpenCodex se mueve Codex `additional_tools` Declaraciones de entrada al nivel superior `tools` herramienta y espacio de nombres normalización. Las herramientas alojadas compatibles se conservan hasta el filtrado específico del modelo; malformado envolturas permanecen sin cambios. Esto no descarta el texto cifrado o el contenido de agente-mensaje desconocido. La verificación utiliza el URL final, por lo que las URL base y la división incluyen puntos finales. `baseUrl`/`responsesPath`
Las configuración reciben el mismo comportamiento. Un camino personalizado resolver en otro lugar no lo hace.

El canónico `opencode-go` predeterminados a `statelessResponses: true`: solicitudes uso explícito historia con `store: false`, sin `previous_response_id`, `conversation`, `background`,
`metadata`, o almacenados `prompt` referencias. Esto evita el rechazo de Go al texto cifrado de razonamiento. Combinado con `previous_response_id`. El caché de continuación registra el razonamiento en el mismo representación devuelta al cliente, incluyendo la reescritura de contenido a resumen visible, La historia completa con `previous_response_id` No duplica esa historia. Resumen oculto Las solicitudes y las manchas de razonamiento opacas conservan su representación existente. Cache hits también puede suministrar la historia anterior para las continuaciones delta; después de un error de caché, el proxy devuelve `previous_response_not_found` antes de la expedición ascendente, así que el El cliente puede reenviar la conversación completa sin `previous_response_id`. Apátridas reparar las etiquetas resultados huérfanos y los resultados de la herramienta que faltan; no puede reconstruir el historial perdido o demostrar si una ejecución de herramienta faltante tuvo éxito.

Una explícita `statelessResponses: false` se conserva. Configuración preestablecida canónica existente reciba el valor predeterminado solo cuando la configuración esté ausente; las entradas renombradas personalizadas mantengan sus configuración valor y no adquiera este valor predeterminado por coincidencia de destino. Las rutas de modelos de chat mantienen su Protocolo existente. La bandera sin estado no fuerza la transmisión de Responses en JSON.

<a id="opencode-go-session-affinity"></a>

## Afinidad de sesión OpenCode Go

Cada ruta opencodex de solicitud a un destino OpenCode Go lleva una `x-opencode-session` cabecera. El flujo ascendente comenzó a rechazar solicitudes sin él en 2026-09-06, por lo que la cabecera no es una optimización.

El valor depende de lo que la solicitud ya sabe sobre sí misma:

- Un operador configurado `x-opencode-session` en el proveedor se conserva exactamente como está escrito.
- Una solicitud que lleva la identidad de conversación — Codex cabeceras de hilo, un Claude `metadata.user_id`,
  a `session_id`o una entrada `x-opencode-session` — se hashed en un valor por conversación estable, así cada turno de una conversación llega a Ir bajo la misma sesión.
- Una solicitud sin identidad alguna, como una sonda de disponibilidad del modelo o una primera solicitud antes de cualquier metadatos de conversación existe, recibe un valor asignado una vez para esa solicitud. Se encuentra aislada de otras solicitudes en lugar de compartidas, y sobrevive a los lugares donde opencodex reconstruye la solicitud: el traducción a la forma interna de Responses, compactación, combo niños y política-retroceso que le da el turno al siguiente candidato.

Los destinos Non-Go no se ven afectados: opencodex nunca obtiene o agrega el encabezado de sesión para ellos. A encabezado de un operador configurado en dicho proveedor todavía se envía, porque opencodex deja ese configuración por sí sola.

<a id="opencode-go-reasoning-efforts"></a>

## Esfuerzos de razonamiento OpenCode Go

Las filas de catálogo de Go conservan sus esfuerzos de razonamiento configurados exactamente, incluso durante Sincronización de catálogo. OpenCodex no añade sintético `max` o `ultra` opciones para estas filas. Uso `modelReasoningEfforts` y `modelDefaultReasoningEfforts` Para cada modelo aceptado valores ascendentes. Teclee estos mapas por proveedor mediante el ID de modelo ascendente, no el enrutado
`opencode-go/<model-id>` Catálogo Slug. Por ejemplo, una configuración `["high", "max"]` lista exactamente esas dos opciones; una configuración `["high", "xhigh"]` La lista no gana `max`. Ver la [Lista de modelos de OpenCode](https://opencode.ai/docs/go/#models) para la lista actual. Un subconjunto configurado puede excluir los niveles inferiores. Otros proveedores mantienen su comportamiento existente.

Para un recolector nativo-primero, incluya ids nativos en `modelPickerOrder` El resultado de la Enrutado ids. Esto ordena el selector completo preservando la prioridad natural separada de OpenCodex cálculo de orientación. Codex nativo anuncia cinco prioridad de selector de seguimiento y puede cambiar; La elegibilidad de anulación de nombre exacto no se limita a ese anuncio. Las órdenes de solo ruta se mantienen su comportamiento anterior. Ver la
[Ordenar nota de migración](/es/guides/model-ordering/#migration-note-native-ids-in-existing-orders).
`modelDisplayNames` en un proveedor controla las etiquetas legibles sin cambiar los identificadores de cable.

<a id="routed-agent-messages"></a>

## Mensajes de agentes enrutados

Con el [`openai-responses` adaptador](/es/reference/adapters/#openai-responses), Codex
`agent_message` Los elementos que contienen matrices no vacías de partes de texto plano admitidas se convierten en mensajes de usuario cuando `authMode` no es `"forward"`
(Por ejemplo, `"key"`) Proveedores que utilizan `authMode: "forward"` mantener estos elementos sin cambios.
`agent_message` es privado al backend ChatGPT Codex, y los destinos enrutados reportado hasta el momento responder a toda la solicitud con
`422 unknown item type "agent_message"`; Codex reproduce el historial de subagentes en cada giro posterior, por lo que el hilo sigue fallando hasta que se convierte el elemento. El autor y el destinatario siguen siendo metadatos de texto explícito, y se conservan las partes del contenido. Para HTTPS `api.x.ai` y `cli-chat-proxy.grok.com` en el puerto estándar, no hacia adelante El despacho Responses también acepta un resultado hijo de cadena no en blanco y lo convierte en uno
`input_text` parte. La cadena original, incluyendo el espacio en blanco y las líneas nuevas, se conserva. Otros destinos mantienen sin cambios los mensajes de agente con valor de cadena. Vacío o Las cadenas de solo espacio en blanco permanecen sin cambios, al igual que las formas incompletas y mezcladas cifradas/desconocidas. El contenido encriptado y desconocido no está normalizado; las tareas encriptadas nativas aún requieren el opt-in separado [recuperación de tareas](/es/reference/configuration/agents/#encrypted-v2-task-recovery).

Con la recuperación de tareas activada, se reproduce `NEW_TASK`, `MESSAGE`, `FOLLOWUP_TASK`, y `FINAL_ANSWER`
Los elementos reutilizan una asignación en caché solo después de validar el llamador y hacer coincidir el subproceso padre. alcance. La restauración de reproducción no realiza una nueva solicitud de recuperación ni extiende la caducidad de la caché. Caducados o El texto cifrado no visto no es reemplazado. Cifrado fresco `NEW_TASK`, `MESSAGE`, `FOLLOWUP_TASK`, y
`FINAL_ANSWER` los elementos utilizan la misma ruta de recuperación opt-in, incluyendo el padre nativo `send_message`
entrega. El tipo de mensaje, el remitente, el destinatario, el alcance de los padres y las credenciales de la persona que llama siguen siendo parte de Validación o identidad de caché. A `FINAL_ANSWER` Sin un `Task name` La línea no tiene una dirección de encabezado para cross-check, pero su destinatario sigue explorando la caché.

Cuando una solicitud contiene varios mensajes de agente, la restauración de reproducción en caché comprueba cada mensaje de forma independiente. La memoria caché separa el tipo de mensaje, remitente, destinatario y texto cifrado dentro del alcance admitido de llamada/cuenta y padre. La recuperación fresca solo maneja el mensaje de cola actual (ignorando el seguimiento `compaction_trigger` o `additional_tools` metadata). No recupera por lotes mensajes históricos no vistos; esos permanecen sin cambios. Un error de caché o la expiración no extiende el contrato de recuperación del historial.

El remitente y el destinatario enrutados Responses son contexto para el modelo de recepción, no un nuevo Protocolo de enrutamiento legible por máquina. El enrutamiento de herramientas continúa utilizando la colaboración existente contratos.

<a id="per-model-capability-declarations"></a>

### Declaraciones de capacidad por modelo

`modelCapabilities` guarda declaraciones explícitas por identificador exacto del modelo en el proveedor. Los identificadores conservan mayúsculas y minúsculas y no admiten espacios al principio o al final. Cada entrada puede contener `inputModalities` (`text`, `image`, `audio`, `video`), `contextTier` (`default`, `long_context`), `video.processing` (`static`, `agentic`) y `deepseekImageFiles` (`boolean`; consulta [bytes de imágenes de DeepSeek](#deepseek-tokens-versus-image-bytes)). Son declaraciones del operador, no pruebas de compatibilidad del proveedor. Los campos de nivel de contexto y video registran la intención; no activan funciones del proveedor ni aumentan las ventanas del catálogo.

El editor de proveedores sin procesar y el proveedor API exponen este mapa. POST/PUT reemplaza un mapa suministrado explícitamente y rechaza entradas nulas. PATCH fusiona ejes individuales; nulo borra un valor de procesamiento de mapa, modelo, eje o vídeo, mientras `{}` No hace ningún cambio. El proveedor omitido sobrescribe el mapa existente. Los archivos mal formados editados a mano retienen ejes independientes válidos y tratan las modalidades de entrada explícitas mal formadas como solo texto, con un diagnóstico.

Una explícita `modelCapabilities.<id>.inputModalities` ahora tiene prioridad sobre las sugerencias de modalidad heredadas para ese modelo enrutado exacto. Una declaración de solo texto utiliza el sidecar de visión existente para reemplazar las imágenes con descripciones; si no hay un sidecar disponible, la solicitud recibe un marcador de omisión explícito antes del envío. Las solicitudes de imagen de chat nativo se desvían a través de esta ruta. El catálogo aún puede anunciar el soporte de archivos adjuntos de imagen porque el proxy proporciona el paso de descripción. Las declaraciones de nivel contextual y de procesamiento de vídeo permanecen inertes hasta que se soporte su transporte.

Declaración de modalidad de entrada sobre a **fila de modelo personalizado** — las casillas de verificación de las modalidades de entrada en el Pestaña Modelos, o `inputModalities` on `customModels[]` — también tiene prioridad sobre el proveedor Sugerencias de visión heredada (`noVisionModels`, `modelInputModalities`para ese proveedor y modelo exactos id. Declarar `text, image` en una fila personalizada y las imágenes llegan a ese modelo incluso cuando el proveedor lo enumera como solo texto; declare solo `text` y se enruta a través del sidecar de visión. Esto es la misma precedencia que el catálogo ya aplicado, por lo que la fila anunciada y la solicitud ahora están de acuerdo.
`modelCapabilities` permanece por encima de él, porque ese es el eje de capacidad dedicado por modelo — Incluyendo la escritura hecha por `ocx provider edit <provider> --model <id> --text-only`. Una fila personalizada que deja las modalidades en blanco hereda la fila del proveedor en lugar de reclamar solo texto. Cada consumidor que responde "puede este modelo tomar una imagen" aplica una regla a la declaración: La imagen está ausente de la lista. Una fila declarando solamente `audio` o `video` Por lo tanto, cuenta como imagen incapaz, en lugar de ser tratado como un modelo de texto por un predicado y un objetivo de imagen por el otro.

<a id="prompt-length-pricing"></a>

### Precios puntuales

En **Modelos → Precio**, mantenga cuatro tarifas base y elija un modo de longitud rápida:

- **Automático** mantiene las reglas de contexto del catálogo. También es el comportamiento de las anulaciones de cuatro tasas existentes sin una política.
- **Tarifa fija** utiliza las tasas base en cada longitud de solicitud, desactivando los configuración de contexto del catálogo.
- **Umbral personalizado** selecciona cuatro tipos alternativos absolutos usando `>` o `≥` y un umbral token. La directiva personalizada reemplaza la regla de contexto de catálogo en ambos lados del umbral.

Todo el recuento de tokens del mensaje, incluidas las lecturas y escrituras en caché, antes de la sustracción de entrada facturable. La salida no cuenta hacia el umbral. Una vez cruzadas, las tasas alternativas se aplican a la solicitud completa, incluida la salida, no solo el exceso tokens. Las tarifas personalizadas son de velocidad estándar Tarifas: se aplica una prima rápida/prioritaria aplicable una vez que se hayan seleccionado las tarifas. la relación del catálogo entre Prioridad y precios de contexto largo para ese modelo. A confirmado La solicitud de prioridad muestra la estimación personalizada como un límite inferior solo cuando el catálogo declara que La relación como `lower-bound`, en cuanto a xAI Grok, que publica ninguna tarifa combinada. Un modelo sin La regla de contexto del catálogo aplica cualquier multiplicador de prioridad una vez. Estos configuración controlan las estimaciones; No cambie la facturación del proveedor.
**Restablecer a automático** elimina la anulación completa y restaura los precios y las reglas del catálogo. Ahorrar o edición de las actualizaciones de configuración en vivo estimaciones y totales históricos.

Por ejemplo, una anulación de Haiku 5.5 con tasas alternativas estrictamente superiores a 100,000 tokens:

```json
{
  "modelCosts": {
    "claude-haiku-5-5": {
      "input": 0.10,
      "output": 0.50,
      "cacheRead": 0.01,
      "cacheWrite": 0.125,
      "promptLengthPricing": {
        "mode": "custom",
        "thresholdTokens": 100000,
        "comparison": "gt",
        "rates": { "input": 0.50, "output": 2.50, "cacheRead": 0.05, "cacheWrite": 0.625 }
      }
    }
  }
}
```

Este es un ejemplo de precios definidos por el usuario, no una lista oficial de precios de Haiku. Cualquier umbral entero de seguridad positivo, incluyendo `272000`, es compatible; uso `"gte"` por inclusivo comparación. Se requieren las cuatro tasas alternativas y siguen los límites de la tasa base, incluido cero. La otra política es `{ "mode": "flat" }`. Omita `promptLengthPricing` Mantener el contexto automático reglas con sus precios base; una `{ "mode": "automatic" }` es aceptado y significa lo mismo, y se guarda desde el panel o API almacenarlo como un campo ausente.

Legado `openai-multi` Las anulaciones del precio del modelo conservan políticas válidas de longitud de prompt cuando se inician migrarlos a `openai`, incluyendo anulaciones en clave por `openai-multi/<model>`.

<a id="renamed-api-key-presets"></a>

### Renombrado API-key presets

Un proveedor guardado bajo otro nombre, como `CommandCode`, hereda metadatos faltantes de esfuerzo de razonamiento cuando su adaptador y el punto final fijo API-key coinciden con un ajuste preestablecido del registro. Sus listas explícitas por modelo, incluyendo `[]`Permanezca con autoridad. Una lista omitida en todo el proveedor hereda el valor predeterminado preestablecido; una lista explícita permanece sin cambios. Esto no coincide con OAuth, puntos finales no relacionados o configuración preestablecidos de punto final personalizado/plantilla.

<a id="azure-model-validation-output-budgets"></a>

### Azure presupuestos de salida de validación de modelos

Algunos Azure Responses despliegues rechazar Claude Code's pequeño presupuesto de validación de cambio de modelo. Si su implementación informa que `max_output_tokens` está por debajo de su mínimo, configurar
`minMaxOutputTokens` en ese proveedor Azure al mínimo que su punto final requiere (para ejemplo, `16` ej., para un punto final que informa de ese mínimo). Esto es opt-in: aumenta cada un presupuesto entero positivo más pequeño en ese proveedor, no solo solicitudes de validación. Más grande se conservan los presupuestos y otros adaptadores no aplican esta configuración en este cambio. La admisión de gastos se reserva el presupuesto efectivo antes del envío, incluyendo cada target's prepago enviar. Por lo tanto, un techo de gasto configurado puede rechazar una solicitud cuya El aumento de la producción superaría ese límite máximo.

```json
{
  "providers": {
    "azure": {
      "adapter": "azure-openai",
      "baseUrl": "https://YOUR_RESOURCE.openai.azure.com/openai/v1",
      "apiKey": "${AZURE_OPENAI_API_KEY}",
      "minMaxOutputTokens": 16
    }
  }
}
```

<a id="native-chat-thinking-replay"></a>

### Chat nativo pensando repetición

Estas listas de razonamiento de chat también se aplican a los nativos `/v1/chat/completions` continuación de llamada de herramienta. El proxy conserva el suministro `reasoning_content` y restablece el razonamiento omitido desde arriba Respuestas JSON o SSE usando identificadores de llamada a herramientas. La repetición del razonamiento original requiere una
`thread-id`, `session_id`, o `session-id` encabezado en cada solicitud y el mismo proveedor, punto final, modelo y credencial. La caché es local y limitada al proceso; un reinicio, caducidad, desalojo o La cabecera de conversación que falta utiliza el marcador de posición mínimo configurado. Un marcador de posición No se puede reconstruir el razonamiento perdido. Los clientes deben mantener upstream `reasoning_content` en sus Historial de asistente para conversaciones reanudadas confiables.

Cuando `preserveReasoningContentModels` es unset, DeepSeek Los nombres de los modelos Flash/Pro son reconocidos en todas las versiones, incluyendo `deepseek-v4.1-flash`, identificadores namespaced y sufijos de puerta de enlace. Explícito Las listas siguen siendo autoritativas: `preserveReasoningContentModels: []` Desactiva la reparación automática, mientras `requiresReasoningPlaceholderModels: []` Desactiva los marcadores de posición y sigue permitiendo caché Razonamiento original. Otras familias modelo requieren la declaración de conservación. Las solicitudes DeepSeek habilitadas para herramientas también requieren razonamiento en respuestas de asistentes anteriores sin la herramienta Llamadas. El marcador de posición configurado llena estas omisiones; no se puede recuperar ningún razonamiento original de la caché de llamadas de herramientas para esos giros. Preservar su razonamiento suministrado para la plena fidelidad.

<a id="auto-pause-permanently-refused-accounts"></a>

## Pausa automática de cuentas permanentemente rechazadas

`providers.<provider>.accountAutoPause` es opt-in y predeterminado para desactivar. Se aplica a eso cuentas OAuth del proveedor, cuentas de grupo Codex (incluida la cuenta principal en modo de grupo), y entradas de grupo de teclas API configuradas. Por ejemplo:

```sh
ocx config set providers.anthropic.accountAutoPause.enabled true
ocx config set providers.anthropic.accountAutoPause.consecutiveFailures 2
```

`consecutiveFailures` es un número entero de 1 a 100; omitiendo se usa 2. Sólo exacto, Los rechazos de HTTP 401/403 califican: una organización que prohíbe OAuth, un inactivo o suscripción caducada, una cuenta denegada API/Claude Code acceso, o una rebaja a un libre Plan sin créditos. Un error de permiso de modelo, token de acceso caducado, ventana de cuota, 429 5xx, la respuesta mal formada o el fallo de red nunca pausan una cuenta.

El contador es de proceso local, serializado por cuenta y se restablece en un HTTP exitoso respuesta, currículum explícito o un nuevo inicio de sesión. La actualización del token por sí sola no restablece un OAuth cuenta de racha. Los errores transitorios dejan el contador sin cambios. Reiniciar los borrados proxy contadores; pausas completadas, sus códigos de razón fijos y marcas de tiempo persisten. Independiente Los procesos proxy mantienen contadores independientes. Cambiar, deshabilitar o volver a habilitar la póliza, deshabilitar al proveedor, o el cambio de su punto final descarta las observaciones de rechazo en vuelo, por lo que una negativa de una solicitud La política anterior nunca puede pausar una cuenta después. Un rechazo cuenta solo para la credencial que realmente Cuando un plugin local reescribe la credencial o el destino de un envío, Enviar nunca cuenta hacia una pausa. Para las cuentas de grupo Codex, esto incluye el espacio de trabajo (`chatgpt-account-id`) la solicitud fue enviada.

En el umbral, OpenCodex excluye la cuenta utilizando su mecanismo de pausa existente y intenta un hermano elegible para la solicitud actual dentro del presupuesto de reintento/envío existente. Los selectores de cuenta Codex fijos y los archivos cargados vinculados a la cuenta conservan sus restricciones. Una pausa nunca cancela el trabajo ya enviado ni cambia las credenciales. Emite un genérico línea de registro sin identificadores de cuenta o texto de error ascendente.

`ocx account list <provider>` Muestra la razón de pausa. La insignia Pausada del panel expone La razón y el tiempo. Uso `ocx account resume <provider> <account-id-or-alias>` Para limpiar el Razón y permitir la selección de nuevo. En una fila de teclas API, al hacer clic en Reanudar también se activa la tecla. Esta política nunca reanuda una cuenta automáticamente.
