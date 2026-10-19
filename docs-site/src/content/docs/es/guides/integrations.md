---
title: "Integraciones"
description: "Conectar opencodex a OpenCode, Pi, Concha suave, OMP, Hermes, OpenClaw, Kimi Código, gjc, DeepSeek Harness, MiniMax Código, ZCode, Primer Agente, Aside, Raycast, omo, Cline CLI, Kilo, Código de Comando y Factory Droid desde el panel — un interruptor por cliente, con una copia de seguridad tomada antes de cada escritura."
---

Los **Conectar** página escribe el bloque de proveedor de opencodex en la propia configuración del cliente archivo, y lo elimina de nuevo. Veinte clientes trabajan de esta manera, cada uno con un interruptor:

| Cliente | Archivo de configuración | Formato | Cuando el cambio entra en vigor | Credenciales |
|---|---|---|---|---|
| OpenCode | `~/.config/opencode/opencode.json` | JSON | Próximo lanzamiento directo | `OPENCODEX_OPENCODE_API_KEY` |
| Pi | `~/.pi/agent/models.json` | JSON | Nuevas sesiones | marcador de posición loopback |
| Concha suave | `~/.gentle-shell/agent/models.json` (Persistente casa seleccionada) | JSON | después de reiniciar Gentle Shell | marcador de posición loopback |
| OMP | `~/.omp/agent/models.yml` | YAML | después de reiniciar OMP | `opencodex-loopback` marcador de posición |
| Hermes | `~/.hermes/config.yaml` | YAML | Nuevas sesiones | `OPENCODEX_HERMES_API_KEY` |
| OpenClaw | `~/.openclaw/openclaw.json` | JSON5 | inmediatamente, en una puerta de enlace en ejecución | `OPENCODEX_OPENCLAW_API_KEY` |
| Código Kimi | `~/.kimi-code/config.toml` | TOML | en el reinicio, o `/reload` | marcador de posición loopback |
| gjc | `~/.gjc/agent/models.yml` | YAML | nuevas sesiones, o cuando abres `/model` |marcador de posición de bucle de retroceso no secreto |
| DeepSeek Harness (DSH) | `$DSH_HOME/profiles/desktop/cordis.patch.yml` (por defecto) `~/.dsh/profiles/desktop/cordis.patch.yml`); `$DSH_HOME/settings.yaml` hasta que DSH Desktop cree ese perfil | YAML | recarga caliente | marcador de posición portador de bucle de retorno no secreto |
| Código MiniMax | `~/.minimax/config.yaml` | YAML | nuevas sesiones, o después de abrir el selector de modelos | marcador de posición loopback |
| Primer agente | `~/.prime/agent/models.json` | JSON | Nuevas sesiones | marcador de posición loopback |
| ZCode | `~/.zcode/v2/provider_config.json` (schemaVersion 1); retroceso heredado: `~/.zcode/v2/config.json` | JSON | al reiniciar | marcador de posición loopback |
| Aside | `~/.aside/u/<account>/models.json` | JSON | después de salir completamente y reabrir Aside | marcador de posición loopback |
| Raycast | `~/.config/raycast/ai/providers.yaml` | YAML | inmediatamente en guardar — Raycast mira el archivo | ninguno — solo loopback |
| omo (Pi / senpi) | `~/.omo/agent/models.json` | JSON | Nuevas sesiones | marcador de posición loopback |
| Qoder | `settings.json` en `$QODER_CONFIG_DIR`, por defecto `~/.qoder` | JSON | Nuevas sesiones | marcador de posición loopback |
| Cline CLI | `~/.cline/data/settings/providers.json` y hermano `models.json` | JSON par | después de detener y reiniciar Cline | marcador de posición loopback |
| Kilo | Primero existente `kilo.jsonc`, `kilo.json`, `opencode.jsonc`, `opencode.json`, o `config.json` bajo `~/.config/kilo` | JSONC | Nuevas sesiones | `OPENCODEX_KILO_API_KEY` |
| Código de comando | `~/.commandcode/providers.json` (en Windows con el inicio predeterminado: usar `HOME ?? USERPROFILE` solo si no está en blanco y Windows-absoluto, de lo contrario `homedir()`; se conserva una vivienda suministrada por separado; adjuntar `.commandcode\providers.json`) | JSON | El próximo lanzamiento de Command Code | ninguno — loopback sin llave (`apiKey: false`) |
| Factory Droid | `~/.factory/settings.json` (`%USERPROFILE%\.factory\settings.json` en Windows) | JSON | inmediatamente a través de la observación de archivos | Ninguno — loopback sin llave |

<a id="gentle-shell"></a>

## Concha suave

Seleccionar **Conectar → Gentle Shell**, o utilice los mismos comandos de integración administrada:

```bash
ocx export --client gentle-shell --json
ocx integration client enable --client gentle-shell
ocx integration client disable --client gentle-shell
```

Gentle Shell tiene un destino separado y un historial de reversión de Pi. Solo
`providers.opencodex` se gestiona; otros proveedores y preferencias permanecen intactos. Los cambios de catálogo actualizan un bloque ya conectado, sin cambios. Un existente manualmente copiado es un conflicto, no un permiso para sobrescribirlo: inspeccione la vista previa y utilice la confirmación explícita de sobrescritura solo si tiene la intención de reemplazarla.

Los salvados `home` en `~/.gentle-shell/config.json` seleccione el destino. A salvo gana la ruta personalizada; usos aislados/por defecto `GENTLE_SHELL_HOME` o
`~/.gentle-shell/agent`. `GENTLE_SHELL_CONFIG` selecciona una configuración de lanzador alternativa. Estas variables de entorno deben establecerse en el **Proceso OpenCodex**No sólo en un más tarde. Los selectores deben ser rutas absolutas; literales `~` y los caminos relativos se niegan. Una sola vez `gentle-shell --home` Las banderas no pueden ser descubiertas por un proxy de fondo.

Modo de enlace o un aliasing casero Pi se niega con un remedio de integración de Pi; uso **Conectar → Pi**
para ese archivo compartido. OpenCodex no cambia las preferencias del lanzador. Un configuración del lanzador ilegible/inseguro se niega; JSON mal formado vuelve a aislarse, Coincidiendo con el lanzador. Si mueve una casa conectada, desactive su antes de volver a conectar el nuevo. Reinicie Gentle Shell después de una actualización del catálogo. Esta integración conserva la política de exportación de Pi solo loopback y no almacena ninguna clave API real.

"Omo" nombra tres productos que comparten la misma `~/.omo` carpeta. Los **omo** tab administra omo basado en Pi (el motor senpi) a través de `~/.omo/agent/models.json`Como en la tabla de arriba. Omo basado en Codex (LazyCodex) tiene su propia sección en la misma pestaña, que se muestra solo cuando se detecta LazyCodex, descrita en
[modelos de rol omo (Codex / LazyCodex)](#omo-codex--lazycodex-role-models). Omo basado en OpenCode (oh-my-opencode) mantiene su propia configuración bajo OpenCode; opencodex no lo lee ni lo escribe.

Qoder IDE / qodercli admite la exportación y la configuración administrada a través del panel de control y CLI:

```bash
ocx export --client qoder --json
ocx integration client enable --client qoder
ocx integration client disable --client qoder
```

Qoder utiliza `settings.json` en `QODER_CONFIG_DIR` cuando se establece esa variable, y
`~/.qoder/settings.json` de otra manera; un relativo `QODER_CONFIG_DIR` es rechazada. Habilitar fusiones `providers.opencodex` y OpenCodex entradas en `modelConfigs.customModels`, conservando otros proveedores, modelos personalizados, y configuración. Deshabilitar elimina las entradas OpenCodex grabadas; la restauración usa las entradas existentes flujo de trabajo de instantáneas. El modelo predeterminado del proveedor es el primer modelo de la exportación ordenada. Los modelos personalizados utilizan su ventana de contexto de catálogo, volviendo a la entrada 128000 tokens. La clave API generada es un marcador de posición no secreto: la integración de Qoder requiere loopback acceso y rechaza un enlace no loopback autenticado. Cuando el dedicado no está autenticado Loopback listener está habilitado, exporta Qoder a ese listener. `ocx sync` y catálogo changes actualiza una integración de Qoder ya habilitada como los otros clientes administrados.

Los catálogos generados incluyen solo modelos habilitados de cada selección de proveedor. Esto se aplica a ambos descargas e integraciones administradas, incluyendo Pi y Aside. La lista de modelos de gestión sigue mostrando la lista completa para que pueda habilitar modelos adicionales.

`ocx uninstall` desactiva las integraciones registradas, incluidos todos los perfiles Aside propios, antes de eliminar Estado de recuperación de OpenCodex. Propiedad ilegible, falta de registro en el perfil o una edición conflictiva Detiene esa eliminación. La limpieza es secuencial: las inhabilitaciones anteriores no se deshacen cuando se realiza una limpieza posterior. Uno falla. Si la compensación también falla, un archivo cliente puede dejarse en un estado intermedio. Inspeccionar los archivos de cliente notificados y las instantáneas de recuperación retenidas antes del reintento; el estado retenido no significa que cada cliente fue restaurado o dejado sin cambios.

Para los preconfiguración integrados de Gajae, mantenga la opción de enrutamiento en `~/.gjc/agent/config.yml`:

```yaml
modelProfile:
  proxyProvider: opencodex
  proxyMode: always
```

Mantenga su elección `modelProfile.default` para aplicarlo cuando sea sencillo `gjc` Empieza. La integración gestionada solo posee `providers.opencodex` en `models.yml`; actualizar o deshabilitar ese proveedor no reescribe su elección preestablecida. Actualizar la integración después de cambiar la selección del modelo exportado.

Modelos GJC con una exportación de escalera de esfuerzo de razonamiento compatible `reasoning: true`, `thinking.levels`, y `compat.supportsReasoningEffort`, por lo que GJC puede ofrecer una opción de esfuerzo. Los modelos nativos Codex reciben su escalera estándar incluso cuando el catálogo la omite. Los modelos sin una escalera conocida omiten estos campos; `none` y `ultra` No se ofrecen porque `none` No hace ningún esfuerzo y `ultra` pliegues a `max` en el cable. Actualice la integración para actualizar estas opciones de modelo.

La integración gestionada de OpenCode posee dos fragmentos: `provider.opencodex` (código abierto V1) y
`providers.opencodex` (código abierto V2). Ambos llevan las mismas opciones de razonamiento por modelo declaradas y defaults — el bloque heredado deletrea el valor predeterminado de un modelo en sus opciones y sus elecciones como variante mapa, el bloque V2 utiliza la configuración del modelo y una matriz de variantes nativa — para que ambos se escriban y se mantienen sincronizados; nombran los mismos identificadores de proveedor y modelo, y opencode V2 los fusiona en uno entrada del proveedor. Aplicar, Actualizar, Desactivar y Restaurar actúan sobre ambos fragmentos y sus otros Las entradas de proveedores, agentes, combinaciones de teclas y MCP permanecen intactas.

Ambos fragmentos se construyen a partir de los metadatos del modelo canónico efectivo —, como lo son la exportación y el procesamiento de Kilo. la `ocx opencode` lanzador. Una anulación personalizada explícita siempre gana, y una escalera que usted borró para Vacío permanece vacío; una escalera de razonamiento o defecto nunca se inventa para un modelo que no declara ninguno. Un límite de contexto autorizado se lleva con un presupuesto de salida al lado: un valor de salida conocido — explícito o de metadatos de catálogo — gana, de lo contrario el esquema requerido 32000 reserva sujetado a contexto, y sin un contexto autorizado se omite todo el bloque de límite. Capacidades, Las escalas de esfuerzo, los valores predeterminados y un límite de entrada opcional aparecen solo cuando se conocen; el bloque V2 El objeto de capacidades nativas requiere un valor de herramientas conocido, por lo que cuando se desconoce el soporte de la herramienta se se omite por completo en lugar de escribirse parcialmente, y las declaraciones de modalidad heredada permanecen. "No hay escalera inventada" todavía escribe los controles, nunca las opciones: el bloque V2 siempre lleva un — de matriz de variantes explícitas vacía cuando no se declara nada, porque omitirlo haría que OpenCode sintetiza bajo/medio/alto — y un modelo con razonamiento fijo conocido pero sin escalera ajustable obtiene supresión solo para discapacitados en lugar de un esfuerzo: el bloque OpenCode heredado y Kilo ambos desactivan cada id del peldaño que el cliente generaría de otro modo. Tampoco añade un esfuerzo seleccionable. Los variantes seleccionables anulan el modelo predeterminado — `none` incluido, ofrecido solo cuando la escalera declarada del modelo lo contiene. Lo que sea Si el cliente selecciona, la política de razonamiento ascendente del proxy aún rige la solicitud que No lo hagas.

El soporte administrado DSH tiene un piso de compatibilidad de **DSH 0.1.0-rc.6**. DSH 0.1.7+ lee el proveedor Rutas desde `[id=llm-pi-ai].config.providers.opencodex` en el parche Perfil de escritorio,
`$DSH_HOME/profiles/desktop/cordis.patch.yml`, que DSH recarga en caliente. OpenCodex escribe esa fila cuando existe el perfil de escritorio y su parche. Si
`$DSH_HOME/profiles/desktop/package.json` Existe pero `cordis.patch.yml` falta, Apply se niega: Crear `cordis.patch.yml` que contiene `[]` (el parche vacío DSH escribe para un nuevo perfil), luego permitir la integración de nuevo. Solo cuando no hay un perfil de escritorio, OpenCodex lo usa
`llm-pi-ai.providers.opencodex` en `$DSH_HOME/settings.yaml`. OpenCodex solo posee ese proveedor Fragmento: Aplicar y actualizar reemplazarlo, Desactivar lo elimina, y Restaurar pone de nuevo una grabación instantánea. Estas operaciones no cambian el modelo por defecto del usuario o el
`deepseek-official` proveedor. La integración administrada de DSH es actualmente solo loopback y nunca escribe una credencial real.

MiniMax Código sigue `MINIMAX_DATA_DIR`Entonces, `MAVIS_DATA_DIR`Antes de caer volver a `~/.minimax`. Su bloque administrado solo posee `custom_provider.opencodex`. No cambia `defaultModel`, la fuente de credenciales MiniMax seleccionada, o el inicio de sesión MiniMax del usuario. Elegir un `custom_provider:opencodex/<provider/model>`
entrada en MCode después de conectarlo. Actualizar la integración también actualiza ventanas de contexto autoritativas por modelo y opciones de esfuerzo de razonamiento; desconocido Las capacidades se omiten, y el esfuerzo actual de MCode se conserva.

El agente principal sigue `PRIME_AGENT_CODING_AGENT_DIR` Antes de volver a caer
`~/.prime/agent`Se rechaza un valor relativo, por lo que el proxy y el agente no pueden No estoy de acuerdo sobre qué archivo se quiere decir. Su bloque administrado solo posee
`providers.opencodex`otros proveedores y cualquier `modelOverrides` vosotros habéis fijado Quédate intacto. El agente principal lee `models.json` Cuando se inicia una sesión, así que empieza una nueva sesión después de conectarlo.

Aside mantiene un catálogo de modelos separado para cada perfil registrado, incluidos los perfiles locales. Listas de OpenCodex todos los perfiles registrados, incluidos los perfiles locales, y pueden sincronizarlos o controlar un perfil a la vez. Cambiar una integración nunca cambia la cuenta activa de Aside. Un prior La conexión Aside permite todos los perfiles de forma predeterminada; las exclusiones individuales sobreviven a las sincronizaciones posteriores.

Una advertencia específica para Aside: la aplicación en ejecución reescribe `models.json` El mismo, así completamente salir y reabrir Aside después de aplicar, de la misma manera que Claude Desktop necesita un reiniciar. El bloque de Aside es solo loopback y nunca lleva una credencial real.

La integración administrada de Raycast es compatible **macOS y Windows**. Proveedores personalizados es un **Raycast Pro** característica: en un plan libre el archivo todavía está escrito, pero
`ocx integration client status --client raycast` y el **Conectar** informe de página Una advertencia, porque Raycast no lo leerá. En macOS o Windows, abra Raycast → Configuración → AI → **Revelar proveedores Config** Una vez así, el `ai` La carpeta existe. En estas plataformas compatibles, opencodex utiliza esa carpeta como su señal de instalación. e informa que el cliente no está instalado hasta que existe. Linux no es compatible, Incluso si la carpeta existe.

El campo de estado `aiDirPresent` Sólo los informes sobre si `~/.config/raycast/ai` existe, independientemente de si la aplicación Raycast está instalada o la plataforma es compatible. No prueba que Raycast esté instalado o sea utilizable. Las impresiones CLI `plan` en un línea separada y agrega la instrucción de configuración macOS/Windows cuando `aiDirPresent` es Falso; `--json` preserva el estado en bruto, incluyendo el estado anidado `raycast` bloque. Raycast lee `~/.config/raycast/ai/providers.yaml` en macOS y Windows por igual y No honra `XDG_CONFIG_HOME`, por lo que el camino no es reubicable.

El bloque administrado es un elemento, `id: opencodex`En el archivo de `providers`
secuencia: `name: OpenCodex`, `base_url: http://<host>:<port>/v1`, y cada modelo con su `abilities` — el conjunto de exportadores `tools` y `system_message` a
`true` como un convenio de exportación de clientes, `vision` sigue las modalidades de entrada del catálogo, `reasoning_effort`
se establece cuando el modelo tiene una escalera de esfuerzo, y `temperature` se apaga por Modelos de razonamiento. Otros proveedores en el archivo se conservan, y deshabilitar elimina solo el elemento OpenCodex. Raycast recoge el cambio tan pronto como el archivo es guardado, no se necesita reiniciar; los modelos aparecen en el selector de modelos de Raycast agrupados bajo **OpenCodex**. Raycast soporta opcional `api_keys`, pero OpenCodex intencionadamente los omite y rechaza objetivos que no son de bucle invertido o autenticados para admisión; esta integración no puede suministrar el encabezado de admisión requerido de OpenCodex.

La preferencia privada macOS es solo una sugerencia Pro de asesoramiento; Windows nunca lo lee y informa el plan como desconocido. La detección de planes no autoriza ni bloquea una escritura. Los metadatos de exportación no tienen una bandera autorizada de soporte de herramientas, por lo que `tools: true` no hace Demostrar que cada modelo enrutado soporta herramientas. Las banderas de visión y esfuerzo siguen los metadatos del catálogo; Apagar la temperatura para una escalera de esfuerzo es un comportamiento conservador de exportación. Se conservan los valores de los proveedores; No se garantiza que el formato y los comentarios de YAML sobrevivan. El formato está documentado en
[manual.raycast.com/ai/proveedores personalizados](https://manual.raycast.com/ai/custom-providers).

Las exportaciones y descargas de paneles de Raycast CLI utilizan el destino del servidor en ejecución y política de admisión, incluyendo un oyente de bucle de retorno no autenticado configurado. `ocx ensure`
no actualiza Raycast desde su instantánea de configuración guardada: puede diferir de la Ejecutar el servidor. El inicio del servidor y la sincronización explícita siguen siendo las rutas de actualización del catálogo.


Cursor tiene una pestaña, pero no es uno de estos interruptores. Cursor regular llama a los puntos finales personalizados desde su propio backend, por lo que un proxy de bucle es inalcanzable sin un túnel público, y Cursor La construcción de inferencia privada separada está configurada dentro de Cursor. Los **Cursor** La pestaña es de solo lectura: detecta qué compilación está instalada, muestra la clave Base URL y API para pegar en Cursor, y informa la última solicitud Cursor hecha al proxy. Véase
[Inferencia privada de Cursor](/es/guides/cursor-private-inference/).

Los caminos honran el propio entorno de cada cliente anulan donde tiene uno. Para OMP,
`OMP_PROFILE` gana sobre `PI_PROFILE` por la presencia, incluso cuando está explícitamente vacío. Un perfil con nombre usos `PI_CONFIG_DIR` como un nombre de directorio relativo a la casa del usuario e ignora `PI_CODING_AGENT_DIR`; sin un perfil con nombre,
`PI_CODING_AGENT_DIR` gana. OMP admite encabezados a nivel de proveedor, pero esta integración inicial es deliberadamente loopback-only; remoto `x-opencodex-api-key` cableado es diferido. Reubicado
`HERMES_HOME`, `KIMI_CODE_HOME`, y `XDG_CONFIG_HOME` Los caminos son seguidos en lugar de No lo creo. La tabla muestra el valor predeterminado de cada cliente.

Para los modelos nativos OpenAI, el bloque generado OMP selecciona su nivel de modelo Responses API, preservando Entrada de imágenes y controles de esfuerzo de razonamiento. Los modelos enrutados conservan el Chat Completions del proveedor dialecto para que sus adaptadores existentes sigan siendo compatibles.

OpenClaw tiene varios, y hacen diferentes trabajos. `OPENCLAW_CONFIG_PATH` selecciona el archivo; `OPENCLAW_STATE_DIR`, `OPENCLAW_PROFILE` y `OPENCLAW_HOME` seleccionar el estado directorio, que es también lo que la detección mira a — para un perfil o reubicado a casa todavía se lee como instalado, mientras que una anulación de ruta de configuración mueve solo el archivo. Si usted Todavía en el más viejo `.clawdbot` diseño, que se encuentra también: el directorio moderno gana cuando existe, y el legado se usa cuando es el único allí.

Estos deben ser **Caminos absolutos** o comenzar con `~`. A uno relativo se le niega más bien resuelto, porque significaría cualquier directorio que cada proceso iniciar en — y esa ruta se almacena con la copia de seguridad, por lo que tiene que nombrar el mismo archivo Mañana como hoy.

opencodex los lee desde su propio entorno. Si su puerta de enlace se ejecuta con un perfil o una casa reubicada, inicie opencodex con el mismo conjunto de variables, o siga correctamente una instalación diferente.

<a id="the-other-five-surfaces-are-not-switches"></a>

## Las otras cinco superficies no son interruptores

**API Llaves** administra las credenciales de opencodex y no es un cliente en absoluto. **Codex CLI** está cableado por el propio servicio proxy — a partir de opencodex lo aplica, deteniéndolo restaura el enrutamiento nativo — para que no haya nada que cambiar por archivo. **Claude** mantiene su propio indicador de habilitación y flujo Guardar/Aplicar del Escritorio, y **Grok Build** mantiene su select-then-apply modelo de cerca. Esas semánticas son anteriores a esta característica y no cambian.
**Cursor** escribe nada en absoluto: su pestaña muestra la detección, los valores de puerta de enlace y el último solicitud vista, y el resto ocurre dentro de la Inferencia Privada Cursor.

<a id="rollback"></a>

## Reversión

Cada escritura exitosa toma una instantánea de su archivo *primero*Así que el estado que tenías es Siempre recuperable:

- **Deshacer** aparece en la operación más reciente cuando el archivo aún coincide con lo que escribimos.
- **Restaurar este punto…** aparece en operaciones más antiguas, o cuando el archivo esa operación. Restaurar a través de tal cambio pide una segunda vez antes de reemplazar sus ediciones más recientes — y los respalda también, de modo que la restauración se puede deshacer.
- Se mantienen 10 copias de seguridad por cliente. Más allá de eso, se eliminan los archivos de instantánea más antiguos y sus filas de historia leen **La copia de seguridad expiró**.

Desactivar elimina solo las entradas opencodex registradas como propias. Si su archivo ha cambiado Después de que lo escribimos, lo que sucede depende de si nuestras propias entradas aún están intactas. y en el formato del archivo. Para configuración estrictas JSON (OpenCode, Pi), una edición **al lado**
nuestro bloque — agregando un servidor MCP, un proveedor de su propio — se muestra como **Actualización necesaria**: refrescante se fusiona alrededor de sus entradas y las mantiene, aunque el formato puede ser normalizado. La excepción es algo JSON no puede reescribir exactamente — un no-finito número como `1e999`, un número que una reescritura redondearía (un entero muy grande, o un tan pequeño que colapsa a cero), `-0`, la misma clave escrita dos veces en un objeto, o anidando más profundamente que 1000 niveles — que bloquea el interruptor en su lugar, por lo que nada se cambia o se cae silenciosamente.
**OMP, DSH y Hermes** no se ven afectados por las ediciones de hermanos también, por una razón diferente: sus escritores parchear solo sus propios rangos de proveedores administrados en byte, por lo que el resto de la El archivo nunca se reescribe. Para el resto de formatos que pueden contener comentarios (OpenClaw, Código Kimi, gjc, Código MiniMax, Raycast — JSON5 y TOML escritos como documentos completos, o genéricos YAML sin preservación de la fuente), o cada vez que nuestras propias entradas fueron editadas, el interruptor se bloquea y desactiva. que adivinar qué ediciones eran tuyas.

Esa cerradura ya no es un callejón sin salida. Un cliente conflictivo muestra **Sustituir** junto a su cambiar, tanto en la tarjeta de visión general como en la propia página del cliente. Reemplaza lo que mantiene nuestra configuración con el bloque que opencodex escribiría, y pregunta primero: El diálogo nombra el archivo, dice lo que se pierde y señala la instantánea que lo hace Inhabitable. El interruptor en sí permanece bloqueado, porque el interruptor no puede saber qué ediciones que querías mantener — solo tú puedes decirlo. Nada más está relajado: un archivo que no podemos parse, o uno cuya estructura no podemos razonar, todavía se niega.

<a id="hermes-session-affinity"></a>

## Afinidad de sesión Hermes

Los generados `providers.opencodex` El bloque incluye `session_affinity_header: session-id` para todos modelos. Esto nombra un encabezado; Hermes proporciona su identificador de conversación dinámica. OpenCodex hace No escribir un identificador estático compartido o cambiar `api_mode` para permitir la afinidad.

Usar una versión de Hermes compatible [Opciones de solicitud por proveedor](https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models#per-provider-request-options). Las versiones anteriores pueden ignorar o descartar la opción; una configuración válida por sí sola no prueba que Hermes envía el encabezado. Aislamiento de conversación, linaje de compactación y solicitudes auxiliares/niños seguir la semántica de afinidad de Hermes. Esta configuración no garantiza una tasa de éxito de caché particular.

Para una integración administrada existente, abra **Conectar Hermes →**, revisión **Aplicar**, y confirmar la actualización. Hasta entonces, se muestra **Actualización necesaria** y actualización implícita del catálogo lo deja sin cambios, incluyendo su lista de modelos. Leer la página no actualiza la configuración. Después de aplicar, normal la actualización del catálogo reanuda y conserva la configuración; **Sustituir** también lo incluye.

Si ya has añadido exactamente `session_affinity_header: session-id` dentro del bloque administrado, Aplicar puede adoptarlo cuando todas las demás configuración administradas aún coinciden con el registro de propiedad. Este es el estrecho excepción a la regla de conflicto anterior: otras ediciones, un nombre de encabezado diferente o un bloque sin un El registro de propiedad coincidente aún requiere resolución de conflictos. Configuración y comentarios de YAML no relacionados permanecer intacto, y el flujo de trabajo existente de instantáneas y restauración se aplica a la actualización.

<a id="preview-and-confirm-changes"></a>

## Vista previa y confirmación de cambios

En el panel, Aplicar, Reemplazar, Deshabilitar y Restaurar comienzan con una vista previa. El diálogo muestra exactamente cuál La configuración administrada cambiará, incluyendo las rutas de cambio limitadas y si cada cambio se agrega, actualiza o elimina un valor. Revisa ese plan antes de confirmarlo.

Cuando un plan informa que no hay cambios, significa que el documento del cliente administrado ya tiene el documento solicitado. Estado. Para un perfil seleccionado de Aside, la confirmación aún puede guardar la preferencia de sincronización de ese perfil incluso aunque el documento administrado no cambia.

Si el archivo cambia después de revisarlo, la escritura se rechaza como obsoleta. El diálogo sustituye el viejo plan con el actualizado y te pide que confirmes de nuevo; nunca vuelve a intentar automáticamente. Si una vista previa no está disponible temporalmente, vuelva a cargar la página normalmente e inicie el acción de nuevo.

Aside utiliza la misma vista previa y flujo de confirmación para un perfil seleccionado a la vez. **Sincronizar todo perfiles** sigue siendo una acción masiva separada y no está vinculada a una vista previa combinada.

<a id="what-to-expect-honestly"></a>

## Qué esperar, honestamente

**Los archivos de configuración administrados están limitados a 4 MiB (4,194,304 UTF-8 bytes).**
El lector de integración compartida rechaza los archivos más grandes como inseguros para leer, y el escritor rechaza una configuración combinada que excede el mismo límite con `write_failed`, dejando la configuración original sin cambios. El marcador de recuperación de Cline también tiene este límite; incluye el contenido de antes y después de ambos archivos, además de metadatos, por lo que Cline puede presionar el botón límite incluso cuando cada archivo individual es menor de 4 MiB.

Realice una copia de seguridad de la configuración del cliente usted mismo, luego elimine las entradas innecesarias o reduzca la lista de modelos exportados antes de volver a intentarlo. **Sustituir** No sobrepasa el límite. Si el La configuración debe seguir siendo más grande, administrarla manualmente en lugar de usar el interruptor Connect.

**El formato generalmente no se conserva.** Aplicando parses a una configuración y la escribe de nuevo JSON, JSON5 y TOML pueden reformatearse y los comentarios en JSON5 o TOML se pierden. OMP, DSH y Hermes son las excepciones: solo los parches OMP y Hermes `providers.opencodex`. Solo parches DSH `[id=llm-pi-ai].config.providers.opencodex` en el parche Perfil de escritorio, o `llm-pi-ai.providers.opencodex` en `settings.yaml` cuando no hay perfil de escritorio. Sus escritores YAML conservan comentarios de proveedores no relacionados y formatean byte por byte. Si eso es exacto El rango de fuente no se puede identificar de manera segura, la operación se niega en su lugar. Para otros clientes, use Restablezca cuando necesite los bytes de archivo anteriores: la instantánea es una copia literal.

**Si un valor no puede ser reescrito fielmente, el interruptor se niega.** La ronda trip cubre los tipos de valor que estos formatos usan en la práctica, y donde no lo hace — un archivo TOML usando `inf` o `nan`Por ejemplo, que el analizador a nuestra disposición no puede leer con precisión — aplicando paradas y lo dice en lugar de escribir un cambió de valor y lo llamó éxito. Verá el archivo con nombre y nada en El disco se habrá movido. La edición de ese archivo a mano todavía funciona; es solo nuestro reescribir automáticamente que declina.

Las fechas y horas de TOML también rechazan las reescrituras administradas: el paso de fusión convertiría estas valores mecanografiados en cadenas citadas. Esto incluye valores dentro de arrays y mesas. Las cadenas de fecha citadas siguen siendo compatibles; debe conservarse una fecha no citada editando la configuración manualmente.

**Pi, Kimi Code, gjc, MiniMax Code, Prime Agent, Aside, Raycast, omo y la integración administrada de DSH solo funcionan contra un enlace de bucle.**
Los cuatro primeros no tienen ningún campo de configuración para el `x-opencodex-api-key` Encabezado de un enlace non-loopback requiere. DSH tiene un mapa genérico de cabeceras, pero rc.6 no documenta esa admisión dedicada encabezado como un contrato de integración compatible, por lo que el escritor administrado falla cerrado en lugar de Adivinando. El bloque del proveedor del agente principal acepta encabezados, pero el cableado remoto de credenciales es aplazado desde su integración inicial. Déles acceso de bucle a través de un túnel SSH o un reenviador local que agregue el encabezado.

**La integración OMP generada también es solo de bucle deliberadamente.** OMP hace apoyo cabeceras a nivel de proveedor, pero esta integración inicial no emite
`x-opencodex-api-key` cableado de credenciales. La configuración manual remota de OMP está fuera del Integración gestionada por ahora.

**El código Kimi no puede contener una referencia de entorno,** por lo que su configuración lleva un
`opencodex-loopback` En lugar de una llave. Nunca se escribe una credencial real en cualquier configuración de cliente.

**Porque `ocx opencode`, los bloques de proveedores del lanzador ganan.** Ese lanzador inyecta
`provider.opencodex` y `providers.opencodex` a través `OPENCODE_CONFIG_CONTENT`, que supera en rangos a las mismas entradas en el disco — el resto de la configuración de código abierto sigue siendo aplicable como De costumbre. Esos bloques se construyen a partir de los mismos metadatos eficaces del modelo canónico que el modelo canónico. las exportaciones, por lo que el lanzador y la integración administrada describen los mismos modelos, límites y opciones de razonamiento. El interruptor aquí es lo que importa cuando se inicia `opencode` directamente.

<a id="from-the-terminal"></a>

## Desde la terminal

Las mismas operaciones están disponibles sin rumbo:

```bash
ocx integration client status
ocx integration client enable --client hermes
ocx integration client disable --client hermes
ocx integration client history --client hermes
ocx integration client restore --op <opId> [--confirm-drift]
```

<a id="preview-and-bind-a-terminal-write"></a>

### Previsualizar y enlazar una escritura de terminal

Los comandos directos existentes siguen siendo compatibles. Para vincular un escrito a un escrito revisado primero, inspeccionar el estado y guardar una vista previa:

```bash
ocx integration client preview --help
ocx integration client status --client hermes --json
ocx integration client preview --client hermes --operation apply --json > hermes-preview.json
```

Revisión `state`, `foreignEdit`, estructural `changes`, `canApply` y `willChange`. Valid rechazó y no-op planes de salida 0 porque la inspección tuvo éxito; nada fue aplicado. El plan no contiene valores secretos ni diferencias de archivos completos. Utiliza los ya existentes evidencia de catálogo pasiva y nunca actualiza en secreto a los proveedores. Si no está disponible, resolver la disponibilidad del catálogo por separado antes de solicitar una nueva vista previa.

Solo después de revisar un plan aplicable y elegir la escritura:

```bash
PLAN_FINGERPRINT="$(jq -er 'select(.canApply == true) | .fingerprint' hermes-preview.json)"
ocx integration client enable --client hermes --plan-fingerprint "$PLAN_FINGERPRINT" --json
ocx integration client status --client hermes --json
```

La huella digital es evidencia de concurrencia, no autorización. El compromiso acepta `pN:`
seguido de 32 dígitos hexadecimales en minúsculas; a `pN:unbound` no puede comprometerse. Repetir cliente/acción/perfil/opciones exactos. Vista previa `overwrite` mapas para habilitar con
`--overwrite-conflict`; vista previa `disable` mapas a desactivar. Salidas 5 de confirmación de estado, Imprime la guía de re-previsualización en stderr y deja stdout vacío. Nunca adopta una huellas dactilares o reintentos. Otros fallos usan el uso 2, no encontrado 4, entorno de ejecución/malformado 1, con stderr seguro en lugar de una envolvente de error JSON.

<a id="inspect-restoration-drift-before-replacing-it"></a>

### Inspeccione la deriva de restauración antes de reemplazarla

Usar un historial real opId; `op-example` A continuación es ficticio:

```bash
ocx integration client history --client aside --profile 1 --json
ocx integration client restore --op op-example --client aside --profile 1 --preview --json
```

Si se rechaza la deriva, inspeccione las ediciones. Cuando la sustitución de ellos se pretende explícitamente, vista previa con `--confirm-drift`, revisar, luego vincular esa misma intención:

```bash
ocx integration client restore --op op-example --client aside --profile 1 --preview --confirm-drift --json > restore-preview.json
```

Después de la revisión:

```bash
RESTORE_FINGERPRINT="$(jq -er 'select(.canApply == true) | .fingerprint' restore-preview.json)"
ocx integration client restore --op op-example --client aside --profile 1 --confirm-drift --plan-fingerprint "$RESTORE_FINGERPRINT" --json
ocx integration client status --client aside --profile 1 --json
```

Las escrituras de previsualización/vinculación de Aside requieren un perfil, no un destino agregado. Genérico restaurate omite cliente/perfil; el servidor obtiene el cliente que no es Aside de opId. El plan devuelto no contiene opId o todas las entradas de comando originales, por lo que debe ese contexto. `--preview` No se puede combinar con `--plan-fingerprint`.

<a id="retire-an-old-recovery-record"></a>

### Retirar un registro de recuperación antiguo

Esto retira permanentemente el registro y la copia de seguridad; no restaura ni desactiva la integración. Después de inspeccionar el historial y elegir perder ese punto de recuperación:

```bash
ocx integration client history remove --op op-example --client aside --profile 1 --yes --json
ocx integration client history --client aside --profile 1 --json
```

Utilice el opId seleccionado. Ningún selector se dirige a la revista global; `--client aside`
direcciones agregar el historial de Aside y opcional `--profile` Lo acorta. Otro cliente Los selectores son rechazados para su eliminación. La última fila está protegida. Un recibo con
`snapshotRemoved:false` se ha comprometido la jubilación con limpieza incompleta y salida 1; no es reversión y no debe desencadenar la eliminación repetida. `journal remove` Es un alias.

`--overwrite-conflict` Es la forma terminal de **Sustituir**:

```bash
ocx integration client enable --client zcode --overwrite-conflict
```

Como `--confirm-drift`, nunca se supone que — sin él un conflicto sigue siendo rechazado. Se aplica solo a `enable`; forzando a *desactivar* sobre un conflicto borraría un bloque nunca escribimos, por lo que esa combinación es rechazada.

Para MiniMax Code, conecte el proveedor una vez y ejecute a través del envoltorio verificado:

```bash
ocx integration client enable --client mcode
ocx mcode
```

Una vez conectados, `ocx sync` y `POST /api/sync` actualizar propiedad MCode, Pi, Aside, catálogos de Raycast, omo, OpenCode y Kilo con la selección actual del modelo, Escaleras de razonamiento-esfuerzo. El inicio proxy actualiza un catálogo de Raycast propio. Cambios en visibilidad del modelo, selección del proveedor o configuración preestablecidos también actualizan Pi conectado, Aside, Catálogos de Raycast, omo, OpenCode y Kilo. Los bloques perdidos, editados en el extranjero o inseguros permanecen intactos, al igual que los bloques de propiedad anterior. que eliminaste manualmente. Un perfil Aside habilitado es una excepción a la actualización habitual de propiedad exclusiva: si su cuenta El directorio existe y nunca ha tenido un bloque propio, la sincronización puede crear su primer bloque cuando Esta ranura está vacía. Una conexión Aside anterior habilita este comportamiento para todos los registros. perfiles por defecto. La sincronización no crea directorios de cuenta faltantes ni reemplaza los bloques manuales. Una actualización rechazada o superpuesta se informa por separado para cada cliente. Empezar una nueva pi, OpenCode, o sesión Kilo o completamente salir y volver a abrir Aside para cargar el archivo actualizado. Aside actualización requiere un [proxy de ejecución compatible](#aside-profile-controls).

Si los modelos informan **“Selección de modelo guardada”** junto con una advertencia de actualización del cliente, el la selección ya está guardada; no se pudieron actualizar uno o más archivos de cliente. Los nombres de advertencia el cliente afectado y el perfil de Aside, cuando corresponda, y explica la negativa. Abrir
**Conectar** Inspeccionar a ese cliente o perfil antes de comenzar una nueva sesión. Resolver el problema reportado, luego reintento `ocx sync`; una operación de superposición debe terminar primero. Si el advertencia incluye una ruta de respaldo o dice que la recuperación no terminó, inspeccionar ese estado de recuperación antes de volver a intentarlo. Una selección exitosa guardar solo no confirma la recuperación del archivo de cliente.

La plataforma MiniMax separada CLI (`mmx`) no es una integración de archivos-toggle. Sus comandos de texto usan MiniMax's Anthropic- punto final compatible, así OpenCodex proporciona un lanzador aislado en loopback:

```bash
ocx mmx text chat --model anthropic/claude-opus-5 --message "Hello"
ocx mmx text repl --model openai/gpt-5.6-sol
```

Solo `mmx text chat` y `mmx text repl` están representados. Ejecutar llano `mmx` por MiniMax-nativo de la imagen, vídeo, discurso, música, visión, búsqueda, cuota, autenticación, configuración, archivo y actualizar los comandos. El contenedor utiliza una configuración temporal que contiene solo un no secreto loopback placeholder; nunca carga su `~/.mmx` credenciales de clave OAuth o API, y Se niega `--api-key`, `--base-url` y `--region` Anulaciones. Véase
[Clientes MiniMax](/es/guides/minimax/) para el flujo de trabajo completo y los límites.

`--confirm-drift` Nunca se asume. Si el archivo ha cambiado después de la operación restauración, el comando se niega y le dice, porque reemplazar sus ediciones más recientes es su decisión de tomar.

Los detalles del cliente se verificaron con el formato de configuración propio de cada proyecto; vea el notas de investigación en `devlog/_fin/260802_client_toggle_api/002_client_toggle_matrix.md`
para lo que se comprobó y cuándo.

<a id="aside-profile-controls"></a>

## Aside controles de perfil

Los controles de perfil Aside y la actualización Aside se realizan mediante `ocx sync` requieren un funcionamiento Proxy ocx que admite las API de perfil Aside. Actualizar el CLI solo no actualiza un ya en ejecución proxy. Si el proxy no está disponible o es demasiado antiguo, la operación Aside no puede completo; el CLI nunca vuelve a escribir archivos de perfil Aside localmente.

Actualice la instalación de ocx utilizada por el proxy y, a continuación, reinicie el proxy (o inícielo si se detiene). Reintentar `ocx sync` o el comando profile. Después de la actualización de los archivos de perfil con éxito, salga completamente y vuelva a abrir Aside para que cargue los nuevos catálogos.

```bash
ocx integration client status --client aside --json
ocx integration client enable --client aside
ocx integration client disable --client aside --profile 1
ocx integration client history --client aside --profile 1
ocx integration client restore --client aside --profile 1 --op <opId>
```

El número de perfil es el ID de cuenta mostrado por el comando status. Omisión `--profile` en un Aside toggle aplica el estado deseado a cada perfil registrado. Un cambio de perfil deja hermanos sin cambios. La configuración de sincronización deseada se guarda antes de los cambios de archivo; estado real y cualquier Se informa de la negativa para cada perfil. Un resultado de volumen parcial no es un éxito totalmente aplicado y el CLI sale distinto de cero. Deshacer restaura la intención de sincronización del perfil seleccionado, así como su archivo, por lo que una sincronización posterior no invierte silenciosamente Deshacer.

Los [perfil API](/es/reference/management-api/#aside-profile-controls) devuelve HTTP 200 por un operación a granel exitosa y HTTP 207 con `ok: false` si algún perfil se niega. Inspeccione cada Entrada en `results`Los perfiles exitosos no se devuelven cuando otro falla. Deseado las configuración permanecen guardadas, por lo que vuelve a intentarlo después de abordar el perfil afectado en lugar de asumir Todo el cambio falló. Si se produce un error al guardar esas configuración, no se cambiarán los archivos de perfil.

Para una actualización específica de perfiles Aside elegibles, en lugar de una amplia sincronización de catálogo:

```bash
ocx integration client sync --client aside --json
ocx integration client status --client aside --json
```

Esto utiliza el propietario certificado Aside existente y no tiene selector de perfil ni local fallback. `{results:[]}` sale 0 y significa que no hay perfiles elegibles, no se aplican escrituras. Cualquier fila fallida devuelve la salida 1 mientras los perfiles exitosos permanecen actualizados. Conservar rechazo por perfil, información de copia de seguridad residual y etiquetada por separado; Inspeccione el perfil afectado antes de volver a intentarlo. Esta actualización está separada de cada flujo de trabajo de vista previa/mutación enlazada del perfil.

Sincronizar actualiza solo los perfiles cuya preferencia de sincronización está activada, por lo que un resultado vacío no es un error. Si `ocx integration client status --client aside` Muestra un perfil como `off (stale)`, estado imprime los comandos para volver a conectarlo: review `ocx integration client preview --client aside
--operation apply --profile N`, y correr `ocx integration client enable --client aside --profile N`
solo si la vista previa permite el cambio y usted lo acepta. Nada se vuelve a habilitar automáticamente. Un mal formado `asideProfileSync` Bloquear en `config.json` desactiva cada perfil y registra un Cuando se carga la configuración.

Cada perfil tiene una propiedad e historia separadas. Ediciones de usuarios existentes, rutas inseguras y enlaces catálogos son rechazados; los controles explícitos de sobreescritura y confirmación de deriva disponible. Cierre completamente y vuelva a abrir Aside para cargar los archivos de modelo modificados.


<a id="zcode-314-and-later"></a>

## ZCode 3.14 y posteriores

De forma predeterminada, ZCode 3.14 almacena sus proveedores personalizados en `~/.zcode/v2/provider_config.json` e izquierda
`~/.zcode/v2/config.json` solo se puede acceder a través de una importación de un solo disparo que se ejecuta cuando el nuevo archivo está desaparecido. ZCode crea el nuevo archivo la primera vez que se ejecuta, por lo que en cualquier instalación que haya sido lanzado la importación ya se gastó y un escribir a `config.json` No llega a nada.

ZCode puede reubicar su raíz de datos con un valor absoluto `dataBaseDir` en
`~/.zcode/v2/setting.json`. Este archivo bootstrap siempre se queda bajo el home predeterminado; El proveedor se mueve a `<dataBaseDir>/.zcode/v2/provider_config.json`.
`ZCODE_DATA_DIR` tiene precedencia y nombra el `.zcode` raíz directamente, mientras que
`ZCODE_PERSONAL_PROVIDER_CONFIG_FILE` Tiene prioridad para el archivo del proveedor.
`ZCODE_DATA_BASE_DIR` es un selector nativo separado y no es un alias para `ZCODE_DATA_DIR`.

Los configuración de arranque ilegibles, mal formados o relativos dejan la raíz activa desconocida. El bootstrap debe ser un archivo regular de como máximo 4 MiB; enlaces simbólicos y archivos especiales se rechazan durante el descubrimiento de rutas de exportación e integración. Reparar el archivo bootstrap o Suministrar una explícita `ZCODE_DATA_DIR` para seleccionar la raíz de datos deseada. Aplicar, sobrescribir y actualizar los residuos con un mensaje de reparación en lugar de reclamar un éxito Legado escrito. Un archivo de proveedor explícito existente todavía puede establecer el almacén activo. La propiedad registrada en la configuración o tienda predeterminada original mantiene su ruta, huellas dactilares y el registro de la propiedad. y deshacer el historial; deshabilitar elimina ese bloque original antes de que una habilitación posterior pueda tienda reubicada. Un viejo deshacer también se niega, mientras que otro camino es dueño de la integración. Si un selector explícito anterior ya no identifica el archivo de propiedad, restaure ese selector antes de la desactivación; opencodex retiene el registro y se niega a abandonar el bloque.

opencodex escribe `provider_config.json` directamente donde pueda. Al permitir la integración se agrega el
`opencodex` regla del proveedor para ese archivo, una actualización del catálogo lo actualiza y la desactivación elimina exactamente lo que opencodex puso allí. Cada otra regla en el archivo se deja sola, incluyendo una regla de otro proveedor mantiene para un ID de modelo que también aparece en la nuestra. Una regla que lleva el `opencodex` id que opencodex no escribió es un conflicto en lugar de algo para asumir el control; resolverlo en ZCode, o Utilice la sobreescritura explícita.

Un almacén de proveedor ilegible o que no es de archivos también rechaza las escrituras; no se trata como un almacén ausente que permite la importación heredada.

Otras dos situaciones aún se niegan en lugar de escribir. Un bloque opencodex aplicado antes de que ZCode mantiene la integración en `config.json`: deshabilitelo allí primero, luego vuelva a habilitarlo para escribir La nueva tienda. Y un `provider_config.json` cuyo `schemaVersion` no es un opencodex ha observado se informa en lugar de fusionarse, porque ese archivo contiene todos los proveedores que ZCode tiene y afirma una forma en ella cambiaría un silencioso no-op por una pérdida silenciosa. Nombres de estado del archivo ZCode lee cuando la integración no lo está escribiendo.

En ese segundo caso, agregue el proveedor en la configuración de ZCode: base URL
`http://127.0.0.1:10100/v1` (ajuste el puerto a su enlace), cualquier clave no vacía y los ID de modelo Desde `ocx export --client zcode`. Borrar `provider_config.json` para volver a activar la importación de ZCode es no compatible — descarta todos los proveedores ZCode mantiene allí.

## Cline CLI

Esta integración se dirige a la actual Cline CLI/compartido SDK proveedor, cuyo esquema nativo tiene
`version: 1`. Legacy VS Extensión de código `globalState`El almacenamiento /secret no se migra ni se detecta como esta integración. Ejecute Cline una vez para inicializar su directorio de configuración.

**Detenga Cline antes de habilitar, sincronizar, deshabilitar o restaurar la integración.** OpenCodex escribe
`providers.opencodex` en ambos `providers.json` y hermano `models.json`. El primer archivo contiene la conexión OpenAI Responses con un marcador de posición de bucle de retroceso no secreto; el segundo mantiene la catálogo de modelos enrutados filtrados, incluido el contexto disponible y los metadatos de imágenes. Proveedor existente las entradas y la selección de proveedor por defecto permanecen sin cambios.

```bash
ocx integration client list --json
ocx integration client enable --client cline
ocx integration client history --client cline
ocx integration client restore --op <operation-id>
```

Después de habilitar, reinicie Cline y seleccione OpenCodex, o inicie con
`cline --provider opencodex --model <provider/model>`. Los cambios de catálogo se leen cuando Cline se reinicia. Cline se excluye de la actualización de catálogo desatendida; después de cambiar la ruta selección de modelo, detener Cline y ejecutar `ocx sync` o habilitar la integración de nuevo para actualizarlo. Un modelo seleccionado se conserva mientras sigue siendo encaminado y borrado si se elimina del catálogo exportado.

`CLINE_PROVIDER_SETTINGS_PATH` Anula el archivo principal. En caso contrario `CLINE_DATA_DIR` selecciona el directorio de datos, entonces `CLINE_DIR` Selecciona la raíz, luego `~/.cline` se utiliza. El modelo de archivo es siempre
`models.json` junto al archivo de proveedor seleccionado. Las anulaciones deben ser absolutas o comenzar con `~`. Mirror command-local Cline `--config` Vías con `CLINE_PROVIDER_SETTINGS_PATH` al comenzar OpenCodex. Un camino primario llamado `models.json` se rechaza porque los archivos deben ser distintos.

Cada reemplazo de archivos es atómico, pero ninguna operación del sistema de archivos reemplaza a ambos simultáneamente. Una operación de diario captura ambos archivos originales; un error de escritura o contabilidad compensa Ambos. Una operación interrumpida conserva un registro de recuperación privado. Informes de estado incompletos recuperación como insegura, y la mutación explícita siguiente recupera solamente si ni archivo ni su La propiedad tiene una edición no relacionada. Si la recuperación se niega, preservar los archivos y la ruta de recuperación reportado por la operación; resolver el conflicto antes de volver a intentarlo.

Deshacer restauraciones **ambas cadenas de bytes originales**incluyendo un archivo que originalmente no existía. Las ediciones después de la operación requieren el explícito existente. `--confirm-drift`; el par editado es Respaldado primero. Una entrada OpenCodex ocupada requiere la `--overwrite-conflict` opt-in. Deshabilitar elimina las dos entradas administradas; no restaura una entrada externa anterior. Usar Deshacer Por eso. La retención y caducidad de instantáneas siguen las mismas reglas que otras integraciones.

La descarga `cline-config-bundle.json` Contiene dos miembros nativos del documento: `settings` por
`providers.json`, y `catalog` por `models.json`. No es en sí mismo un archivo de configuración de Cline. Prefiero el comando de integración para una combinación y retroceso diarios. El cableado de admisión remota no es apoyado por esta integración generada; requiere acceso de loopback no autenticado.

<a id="github-copilot-app"></a>

## GitHub Aplicación de piloto conjunto

La aplicación de escritorio GitHub Copilot puede usar opencodex como proveedor de modelos compatible con OpenAI. Esto es un configuración manual del cliente sin interruptor **Conectar**y está separado de la corriente
`github-copilot` proveedor, que utiliza una suscripción de Copilot como backend para opencodex.

1. Inicie opencodex y confirme que responde:

   ```bash
   curl http://127.0.0.1:10100/healthz
   curl http://127.0.0.1:10100/v1/models
   ```

2. En la aplicación Copilot, abra **Configuración → Proveedores de modelos → Añadir proveedor** y entre:

   | Campo | Valor |
   |---|---|
   | Nombre | cualquier etiqueta, por ejemplo `OpenCodex` |
   | URL base | `http://127.0.0.1:10100/v1` (Ajuste el puerto a su enlace) |
   | Clave API | Dejar en blanco en loopback |

3. Sincronizar modelos desde el endpoint, o añadir uno por su `provider/model` id, y seleccionarlo.

La aplicación utiliza `GET /v1/models` para el descubrimiento y `POST /v1/chat/completions` por turnos. Esos giros pasar por el enrutamiento de modelo normal de opencodex, por lo que se aplican las credenciales de proveedor, las cuentas y los combos de OAuth como lo hacen con cualquier otro cliente. Los campos de solicitud aceptados se enumeran en el
[Referencia de formatos proxy](/es/reference/proxy-formats/).

Si la aplicación informa que no hay modelos, compruebe que la base URL termina en `/v1` en lugar de
`/v1/chat/completions` y que `/v1/models` devuelve un no vacío `data` matriz. Cuando opencodex escucha en una dirección no loopback, ponga una clave de admisión de datos (la token descrita bajo
[acceso remoto](/es/reference/configuration/server/#remote-access), o un panel generado `ocx_…`
clave) en el campo de clave API de la aplicación. La aplicación lo envía como `Authorization: Bearer`, que
`/v1/chat/completions` acepta como admisión proxy y nunca se adelanta de origen; ver el
[matriz de autenticación](/es/reference/proxy-formats/#authentication-matrix).

<a id="omo-codex--lazycodex-role-models"></a>

## modelos de rol omo (Codex / LazyCodex)

Cuando LazyCodex está instalado, la pestaña omo muestra un **omo (Codex / LazyCodex)** sección debajo de los controles omo basados en Pi, listado cada rol de agente Codex encontrado en `$CODEX_HOME/agents/*.toml`, con el modelo cada uno se fija a. Codex ejecuta un rol en ese pin sin importar el modelo que pida el padre, así que aquí es donde un El modelo de rol está decidido. LazyCodex cuenta como instalado cuando el `omo@sisyphuslabs`
El complemento Codex está habilitado en `$CODEX_HOME/config.toml` y una copia instalada bajo
`$CODEX_HOME/plugins/cache/sisyphuslabs/omo/` lleva su `lazycodex-install.json`. A `~/.omo`
carpeta por sí sola no cuenta, porque el omo basado en Pi también lo crea. Sin LazyCodex el La sección está oculta y la línea de comandos informa que no está instalada. Elige un modelo y un razonamiento Esfuerzo en una fila y pulse Guardar. Una fila cuyo papel no tiene pin de modelo puede ahorrar un esfuerzo por sí misma; El rol sigue heredando su modelo:

- opencodex actualiza solo la raíz `model = "..."` y `model_reasoning_effort = "..."` claves del archivo de ese rol. Las clavijas que faltan se insertan cerca de la parte superior. Elegir **Heredar el esfuerzo**, disponible en cada fila, envía `"effort": null` para borrar el pin de esfuerzo, eliminando su línea y comentario posterior. Las instrucciones del papel, otros comentarios y otras claves se dejan exactamente como estaban.
- El modelo está escrito para `[codex].agents.<role>.model` en `~/.omo/omo.jsonc`, que LazyCodex 5.1.1 y posteriores se lee, y un esfuerzo cambiado LazyCodex apoya va a
  `[codex].agents.<role>.reasoning` en la misma entrada. Si ese archivo no existe, no se crea. Si contiene comentarios se deja intacto, porque guardarlos los eliminaría; la pestaña lo dice, y puede Fije el valor allí a mano. Los enlaces simbólicos y los archivos no regulares son rechazados; en macOS y Linux, Un FIFO es rechazado sin esperar a un escritor. Un espejo omitido no deshace el archivo de rol guardado.

Si el archivo de rol guardado tiene éxito pero la escritura omo.jsonc falla, el botón de la fila se convierte en
**Reintentar omo.jsonc**, que reenvía la misma elección de esfuerzo, incluyendo un **Heredar el esfuerzo** claro (`null`) Hasta que ese reintento tenga éxito, un Guardar o Asignación automática posterior se aplica para el papel que deja el El esfuerzo por sí solo lleva consigo la elección pendiente; un esfuerzo explícitamente escogido toma su lugar.

No pasa nada hasta que presiona Guardar; la sincronización o el reinicio de opencodex nunca cambia un archivo de rol. Las nuevas sesiones Codex recogen el cambio. Los mismos controles existen en la línea de comandos:

```bash
ocx agent roles
ocx agent roles set explorer xai/grok-4.5
```

`ocx agent roles set <role> <model> --effort <level>` también establece el esfuerzo de razonamiento del rol: es Inserta o reemplaza el archivo de rol `model_reasoning_effort` Valorar y escribir `[codex].agents.<role>.reasoning`
en omo.jsonc cuando LazyCodex tiene ese nivel (`ultra` se queda en el archivo de rol solamente, y un
`reasoning` se elimina). En marcha `PUT /api/codex-agent-roles/{role}`Omitiendo `effort` mantiene el pin, un nivel lo establece, y `null` elimina el archivo de rol `model_reasoning_effort` La línea, su trail comentario, y el omo.jsonc `reasoning`. A Guardar que cambia solo el modelo deja ambos valores de esfuerzo como estaban. Omisión `model` deja el archivo de rol `model` pin y el omo.jsonc `model` Exactamente como eran, así que un rol sin un pin sigue heredando su modelo mientras su esfuerzo cambia o se borra; el panel de instrumentos envía esta solicitud de solo esfuerzo para tal fila. Cuando omo.jsonc se puede escribir, un rol sin una entrada allí obtiene una celebración solamente `reasoning` si el esfuerzo ahorrado es uno LazyCodex apoya (`none` Está escrito como
`off`); para tal función, despejar el esfuerzo o ahorrar `ultra` No añade ninguna entrada. A `null` El modelo es rechazado con 400 `invalid_model`, porque un guardar nunca elimina un modelo pin, y una petición con ninguno `model` ni `effort` Fue rechazado con 400 `empty_update` antes del archivo de rol o omo.jsonc es lee. `ocx agent roles set` Siempre hay un modelo. Solo se puede eliminar un valor de cadena de una línea existente; se rechaza un valor multilínea o no de cadena con 409 `unsupported_model_value`, dejando ambos archivos sin cambios. La limpieza elimina solo el la anulación propia del rol: Codex resuelve entonces el esfuerzo como lo hace para cualquier rol sin uno (una valor de generación, el `[agents]` ej., por defecto, o la sesión principal), no un modelo fijo predeterminado.

<a id="auto-assign"></a>

### Asignación automática

Autoasignación es parte de omo (Codex / LazyCodex): se encuentra encima de la tabla de roles en esa sección y existe solo mientras se detecta LazyCodex. Sin él, el panel de control no muestra ninguno, el API Respuestas 409 `lazycodex_not_detected`, y `ocx agent roles suggest` es rechazada.

Auto-assign propone un modelo para cada rol a la vez. opencodex pide su modelo Codex predeterminado (la raíz `model` en Codex `config.toml`) una pregunta: para cada función, dada su descripción y el inicio de sus instrucciones, qué nivel de capacidad (rápido, estándar o fronterizo) y ¿cuánto razonamiento (mirada, medida, completo o exhaustivo) necesita? Ese modelo nunca Elige un modelo. opencodex luego elige el modelo más barato de su lista de selector que alcanza el nivel:

- Modelos listados bajo `codexRoleTiers` en la configuración opencodex (`{ "fast": [...], "standard": [...], "frontier": [...] }`) tiene ese nivel.
- Otros modelos con un precio conocido se clasifican por precio y se dividen uniformemente en los tres niveles. Con sólo Uno o dos modelos de precio, el más caro es la frontera y el otro, si lo hay, es estándar.
- Los modelos sin precio y sin nivel listado nunca son propuestos. Enumerarlos para incluirlos.

Cada propuesta muestra el modelo, el nivel, el esfuerzo de razonamiento, una razón de una línea y lo que se movería. arriba o abajo. Un papel que el modelo no podría dimensionar claramente se muestra como no dimensionado, con la razón, y No se puede aplicar. No se escribe nada hasta que presione Aplicar en una fila o Aplicar todo. La aplicación utiliza el mismo guardar como picking a mano. Cada papel de tamaño cuyo modelo elegido tiene una escalera de esfuerzo no vacía obtiene una propuesta de esfuerzo, y aplicar o `--apply` Inserta o reemplaza su `model_reasoning_effort` valor. El esfuerzo se coloca en los propios niveles del modelo elegido: su nivel más bajo, su valor predeterminado, uno por encima de la otra. Por defecto, o su más alto. Una escalera vacía no da ninguna propuesta de esfuerzo (`proposedEffort: null`); Aplicar omite `effort` y deja cualquier pin de esfuerzo existente como estaba. Una propuesta nula nunca borra un alfiler.

```bash
ocx agent roles suggest
ocx agent roles suggest --model xai/grok-4.5 --apply
```

## Kilo

Kilo CLI, VS Code y JetBrains comparten una configuración global. Esta integración escribe
`provider.opencodex` En el primer archivo existente entre `kilo.jsonc`, `kilo.json`,
`opencode.jsonc`, `opencode.json`, y `config.json` bajo `~/.config/kilo`
(`XDG_CONFIG_HOME` relocalizar ese directorio). Si no existe, el destino es
`kilo.jsonc`. Las configuración del proyecto nunca se escriben. Kilo fusiona todos estos archivos globales. Si el candidato también define
`provider.opencodex`, el estado nombra todos los archivos competidores y aplica y reemplaza la basura; eliminar `provider.opencodex` de esos archivos antes de permitir la integración. Un ilegible o inseguro El candidato también bloquea la escritura. Deshabilitar aún puede eliminar un bloque propiedad del archivo grabado mientras otro candidato entra en conflicto o no puede ser analizado; el otro candidato queda intacto.

El fragmento de propiedad es sólo `provider.opencodex` (OpenCode V1 forma: `npm`, `options`,
`models`) El esquema publicado de Kilo no tiene OpenCode V2 `providers` clave, por lo que el bloque es no emitidos; Kilo en su lugar recibe las opciones de razonamiento por modelo como una variante del mapa interior. su bloque de proveedor, construido a partir de los mismos metadatos canónicos efectivos que el OpenCode exportación. `$schema`, `model`, `enabled_providers`, MCP, y otras llaves se quedan usuario. Seleccionar `opencodex/<provider/model>` en Kilo después de aplicar.

Loopback utiliza `{env:OPENCODEX_KILO_API_KEY}` como `options.apiKey`. Un enlace sin bucle mueve la admisión a `options.headers["x-opencodex-api-key"]` nunca serializa un verdadero clave. Aplicar reescribe todo el archivo global como bastante JSON, por lo que los comentarios y el seguimiento Las comas en otras teclas no se conservan. Kilo está en el catálogo implícito: `ocx
sync`, `POST /api/sync`, y la visibilidad, el proveedor o los cambios preestablecidos actualizan un Kilo propio Bloquear bajo las mismas reglas de propiedad segura que cualquier otro cliente, y una nueva sesión de Kilo carga el archivo actualizado.

```bash
ocx integration client enable --client kilo
ocx export --client kilo --out ./kilo.jsonc
```

<a id="command-code"></a>

## Código de comando

Código de Comando mantiene sus proveedores personalizados en `~/.commandcode/providers.json`. Esto La integración escribe `provider.opencodex` en ese archivo y es solo loopback.

**La raíz que escribe.** El código de comando resuelve su mapa de proveedor como
`document.provider ?? document.providers`, así que la raíz singular gana siempre que existe. Por lo tanto, la integración lee primero el archivo de destino y escribe en el raíz que el archivo ya utiliza: un documento que ya lleva una `providers` mapa mantiene y sus otros proveedores se mantienen legibles. Un archivo fresco obtiene el singular `provider`
raíz. Ambas raíces se declaran como rutas administradas, por lo que Deshabilitar elimina el bloque de Cualquiera que sea el texto en el que fue escrito.

**La forma de credencial.** El proveedor está escrito con `apiKey: false`, el documentado forma para un endpoint que no necesita clave. Una cadena en bruto es rechazada por el Código de Comando, y ningún archivo service-token es leído, referenciado o exportado por esta integración.

**Resolución Home.** No hay ninguna `COMMANDCODE_HOME` Anular aquí. El publicado El cliente resuelve `HOME ?? USERPROFILE` y luego añade `/.commandcode/providers.json`; no consulta esa variable. Una anulación de esta integración honrada, pero la cliente ignorado haría Aplicar éxito del informe en una ruta Código de comando nunca se abre, por lo que El camino es siempre `~/.commandcode/providers.json`. En Windows con el hogar predeterminado, la integración utiliza `HOME ?? USERPROFILE`
solo cuando el valor seleccionado no está en blanco y Windows-absolute; de lo contrario, usa
`homedir()`. Se conserva una casa suministrada por separado. A `HOME` establecido por Git para Por lo tanto, Windows o MSYS2 solo se respetan cuando pasan esas comprobaciones.

Pegue la clave usted mismo si luego mueve el proveedor fuera del bucle de retorno: Código de comando guarda las llaves en `~/.commandcode/auth.json` (vía `/connect`), no en `providers.json`.

```bash
ocx integration client enable --client commandcode
ocx export --client commandcode --out ./providers.json
```

`ocx commandcode restore --op <opId>` acepta solo operaciones de Código de Comando, incluyendo
`--preview` y `--plan-fingerprint` solicitudes. Rechaza las anulaciones de cliente/perfil. El proxy en ejecución debe admitir la restauración con alcance de cliente; los proxies más antiguos devuelven un error sin volver al punto final de restauración genérico. Uso `ocx integration client restore` para la revista genérica y el explícito Aside Comandos de perfil anteriores para operaciones Aside.

## Factory Droid

Ejecute Droid una vez para crear `~/.factory`, entonces permite explícitamente esta integración con
`ocx integration client enable --client droid`. OpenCodex agrega solo documentado
`customModels` Entradas a su personal `settings.json`, usando un local sin llave Endpoint Chat Completions. Elija una fila de Droid `/model` Recolector. Desactivar elimina las filas administradas; Deshacer restaura el archivo guardado exacto. Otros configuración y Los modelos personalizados siguen siendo suyos. Si Droid normaliza un `customModels` Rema por añadir `id` o `index`, OpenCodex ignora esos dos los campos de cliente al comprobar la propiedad, por lo que los valores predeterminados de razonamiento guardados permanecen disponibles.

Abrir **Conectar → Factory Droid** (`/#integrations/droid`) para establecer un razonamiento por defecto para cada modelo conectado. Elija entre los esfuerzos apoyados del modelo, Revisa los cambios y luego confirma. **Sin valores predeterminados** borra el borrador de ese modelo; uso **Guardar / revisar cambios** y confirme que aplica la eliminación. Los modelos sin una lista de esfuerzo declarada muestran que no hay ningún valor predeterminado disponible.

El CLI admite los mismos valores predeterminados en Droid apply/overwrite. Por ejemplo, reemplazar el modelo ficticio a continuación con un ID conectado exacto y esfuerzo soportado:

```bash
ocx integration client preview --client droid --operation apply --reasoning-default example/model-a=high --json > droid-preview.json
```

Después de revisar el plan aplicable y elegir la escritura:

```bash
DROID_FINGERPRINT="$(jq -er 'select(.canApply == true) | .fingerprint' droid-preview.json)"
ocx integration client enable --client droid --reasoning-default example/model-a=high --plan-fingerprint "$DROID_FINGERPRINT" --json
ocx integration client status --client droid --json
```

Repetir `--reasoning-default MODEL=EFFORT` para presentar el mapa de reemplazo completo. El último signo igual separa el modelo y el esfuerzo; se conservan los identificadores de caso y exactos. Las claves de modelo duplicadas se rechazan. Las banderas omitidas preservan los valores predeterminados;
`--clear-reasoning-defaults` explícitamente envía un mapa vacío. Para aclarar, vista previa con que marca y lo repite en el comando de habilitación de coincidencia. Claro y las entradas no pueden Combinar. Estos indicadores son solo Droid y no se aplican a la desactivación/restauración. Repetir el mismo mapa en vista previa y confirmación; el servidor valida los esfuerzos específicos del modelo y rechaza la encuadernación rancia en lugar de aceptar silenciosamente un mapa cambiado.

Para una clara intención completa, previsualizar esa acción separada:

```bash
ocx integration client preview --client droid --operation apply --clear-reasoning-defaults --json > droid-clear-preview.json
```

Después de revisarlo y elegirlo:

```bash
DROID_CLEAR_FINGERPRINT="$(jq -er 'select(.canApply == true) | .fingerprint' droid-clear-preview.json)"
ocx integration client enable --client droid --clear-reasoning-defaults --plan-fingerprint "$DROID_CLEAR_FINGERPRINT" --json
```

El valor predeterminado se aplica solo cuando Droid omite un esfuerzo de su solicitud. Una explícita el esfuerzo de solicitud tiene prioridad sobre este valor predeterminado; los pines OpenCodex existentes y Los capuchones todavía se aplican. Droid puede continuar mostrando **Dinámico** incluso cuando OpenCodex aplica el valor predeterminado configurado. Las solicitudes sin el encabezado predeterminado Droid son no afectada; el encabezado es una preferencia de solicitud, no una prueba de identidad del cliente. Para combos y políticas de enrutamiento, cada objetivo concreto comprueba la preferencia contra su propia lista de esfuerzos, por lo que un primer objetivo incompatible no lo elimina de una reserva compatible.

Un valor predeterminado guardado que el modelo enrutado ya no admite se ignora para las solicitudes. Si la lista de esfuerzo declarada del modelo conectado ya no incluye el valor guardado, se omite de los valores predeterminados del panel y se elimina de la fila administrada en la actualización. Revisar sin editar permite que OpenCodex conserve los valores predeterminados compatibles restantes.

Actualizar conserva los valores predeterminados mientras que el exacto `provider/model` Selector permanece conectado y declara el esfuerzo ahorrado. Cambiar el nombre de un proveedor, modelo o alias combinado reemplaza a esa fila administrada y borra su valor predeterminado; elija un valor predeterminado para la fila renombrada de nuevo. Desactivar elimina los valores predeterminados con las filas del modelo administrado y Deshacer restaura el valor guardado sus filas y sus valores por defecto juntos.

Modelos cuyos ID o nombres de visualización contienen `,` o `]` Se omiten porque el El selector administrado no puede abordarlos de forma segura; la configuración de exportación y administrada muestra las mismas filas. Se rechaza un catálogo no vacío sin modelos direccionables.

Droid también lee legado `config.json` y locales `settings.local.json`. Resolver filas heredadas que usan el punto final OpenCodex, un ID de modelo generado o una
`OpenCodex:` nombre, y cualquier local `customModels` Anular, antes de habilitar; OpenCodex rechaza esos configuración ambiguos. También rechaza un objetivo inseguro o una fila editada desde que se aplica. La integración es solo loopback y Nunca copie las credenciales del proveedor. La fábrica documenta el [Esquema BYOK](https://docs.factory.ai/model-independence/byok)
y [configuración personal](https://docs.factory.ai/droid-cli/settings).
