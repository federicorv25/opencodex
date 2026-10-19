---
title: "CLI Referencia"
description: "Despacho de comandos, códigos de salida y enlaces a cada familia de comandos ocx."
---

El opencodex CLI es `ocx`. Se distribuye en el primer nombre de comando, con alias documentados tales como `setup`/`init`, `restore`/`eject`, y `models`/`model` alcanzar la misma operación. Desconocido Los comandos y las formas de comando no válidas son errores.

Ejecuta `ocx`, `ocx help`, `ocx --help`, o `ocx -h` para el mismo índice de comando compacto, agrupados en Comenzar aquí, Tareas comunes, Explorar y Más ayuda. Uso `ocx help --all` o `ocx --help --all` para la referencia completa de alto nivel, incluyendo las variantes de comando detalladas omitidas del índice compacto. Correr `ocx help <command>`, `ocx <command> --help`, o `ocx <command> -h` por un comando registrado en la tabla de ayuda; `ocx <command> help` También sigue siendo apoyado. Ayuda y versión Los comandos son de solo lectura: no inician, detienen, instalan, desinstalan o reescriben Codex o Estado opencodex.

<a id="nested-help"></a>

## Ayuda anidada

La ayuda familiar como `ocx help models` preserva el uso y los detalles de la familia, entonces enumera las rutas hijo declaradas conocidas con resúmenes. Estas listas describen niños declarados; no garantizan una cobertura exhaustiva del entorno de ejecución. Alias ayuda conserva el uso propio del alias y detalles y puntos a su familia canónica: `ocx help model` lleva a `ocx help models`. Los modelos también ayudan a vincular la curada `models context` separado de las capacidades declaradas.

Ayuda acepta una ruta con más de una palabra de comando:

```bash
ocx help models context
ocx models context --help
ocx model context --help
ocx help account list
ocx help account main
```

Las tres primeras formas muestran el mismo tema de contexto-cap, incluyendo la `model` alias:

```text
ocx models context <status|value <tokens> [--set-all]|provider <name> on [--value <tokens>]|provider <name> off|all <on|off>> [--json]
```

`ocx models context status --json` lee la configuración actual. `value <tokens>` establece el por defecto para los cambios futuros; añadiendo `--set-all` aplica a todos los proveedores encaminados.
`provider <name> on` permite una tapa de proveedor, opcionalmente con `--value <tokens>`; `off`
Lo deshabilita. `all on|off` cambia todos los proveedores de rutas juntos.

Temas de capacidad declarados tales como `account list` mostrar su resumen, banderas conocidas y detalles, con un puntero a la ayuda de los padres. Estos metadatos no cubren todos los operandos o tiempos de ejecución. subcomando, por lo que un tema puede mostrar `Command: ocx ...` Sin pretender una completa `Usage:` Gramática. Un prefijo como `account main` enumera a sus hijos declarados y marca esa cobertura como incompleta. Un tema explícito no declarado (`ocx help <path>`) sale 1 con una ayuda detallada concisa no disponible mensaje y un puntero padre conocido o de referencia completa en el error estándar. Salida estándar vacío, y no se imprime ningún banner de ayuda completo. Falta detalle no establece si el comando runtime es válido. Anexado `--help`/`-h` preserva el comportamiento de ayuda de comandos existente: cuando los metadatos detallados no están disponibles, Muestra la ayuda de padre conocida con éxito, sin ejecutar el comando.

En el cabezal Bun CLI, desnudo `help` se reconoce solo en la raíz o inmediatamente después de la raíz comando. Uso `--help` o `-h` para caminos anidados. Valores posteriores como el `help` en
`ocx alias set demo help` Siguen siendo argumentos de comando. Un exacto `--` termina la ayuda de la cabeza que explora, así que `ocx claude -- --help` conserva los argumentos para el despacho de comandos.

<a id="recovering-from-command-typos"></a>

## Recuperación de errores tipográficos de comando

Comandos de raíz desconocidos y rutas de ayuda explícitas no resueltas salen 1 con un breve diagnóstico y guía de navegación sobre el error estándar, dejando la salida estándar vacía. Cerrar los errores tipográficos pueden recibir sugerencias conservadoras extraídas de nombres de comandos visibles y la familia de ayuda actual documentada niños. Las sugerencias son solo orientativas: la CLI nunca las ejecuta ni vuelve a intentar el comando.

| Entrada | Orientación |
| --- | --- |
| `ocx modles` o `ocx help modles` | Sugiere `ocx help models`. |
| `ocx help account lisst` | Sugiere `ocx help account list` dentro de la familia de cuentas. |
| `ocx help qzxv` | Ofertas `ocx help --all` Sin adivinar un comando. |
| `ocx help models qzxv` | Informes no disponibles ayuda detallada y señala a la familia de modelos conocidos. |

El Bun CLI rechaza una raíz desconocida antes de la restauración automática de shim u otro comando previo al vuelo. Los comandos reconocidos retienen su prevlight existente; comandos ocultos y el corredor interno siguen siendo objetivos de envío válidos, pero están excluidos del descubrimiento y las sugerencias. Anexado flag-help fallback, capacidad JSON y manejo de errores específicos del proveedor conservan su comportamiento existente.

<a id="command-families"></a>

## Familias de mando

### `ocx message`

`ocx message sessions [--json]` descubre sesiones Codex locales cargadas.
`ocx message send (--thread <uuid> | --name <exact-name>) --stdin [--json]`
envía un mensaje correlacionado entre iguales, sin iniciar un demonio o reanudar un hilo. Véase [Mensajería local Codex](/es/reference/cli/messaging/) para el contexto del remitente, tipos, el entorno de ejecución probado y `not_sent`/`queued`/`unknown` recibos. No incluye transporte remoto.

### `ocx provider`

`ocx provider`, `ocx help provider`, `ocx provider help`, `ocx provider --help`, y
`ocx provider -h` mostrar la misma ayuda del proveedor, con sintaxis de comandos, ejemplos, preset/custom guía, y punteros declarados del tema. La ayuda se imprime correctamente en la salida estándar y sale 0. Desnudo `ocx provider` todavía sigue el prevuelo del comando ordinario; formas explícitas de ayuda para la cabeza salen antes de ese prevuelo. Una acción de proveedor desconocido imprime su diagnóstico y ayuda del proveedor a error estándar, deja la salida estándar vacía y sale 1.

### `ocx alias`

`ocx alias list [--json]` muestra usuario efectivo y alias incorporados. Uso `ocx alias set <provider>[/<native-model-id>] <alias>` y `ocx alias rm <provider>[/<native-model-id>]` para editarlos. Los identificadores de modelo nativos pueden contener barras adicionales porque el selector se divide solo en la primera barra. Habilitar los valores predeterminados enviados con `ocx alias defaults on|off [--provider <name>]`.

### `ocx remote-workspace`

`ocx remote-workspace pair <hub-url> --pairing-code-stdin --root <absolute-path>` Inscribe el local como un ejecutor solo OCX. Repetir `--root` para aprobar más carpetas y usar `--name` a Anule el nombre de host. Repetir `--toolchain-root <absolute-directory>` para exponer un usuario instalado Nodo, Rust, Go u otro directorio de cadena de herramientas de solo lectura dentro del sandbox de comandos. En macOS y Windows construye el perro privado, `bun run build:remote-workspace-helper` crea el ayudante de óxido que el comando pair descubre automáticamente; `--executor-helper <absolute-file>` Selecciona otro explícitamente revisado construir y pines su resumen en el estado Ejecutor local.
`ocx remote-workspace agent` mantiene la conexión cifrada saliente;
`ocx remote-workspace status [--json]` reporta el Hub, el dispositivo, las raíces y las capacidades anunciadas sin imprimir su portador o clave privada. Véase [Espacio de trabajo remoto](/es/guides/remote-workspace/).

Familias de comandos adicionales:

| Familia | Sintaxis y referencia |
| --- | --- |
| `ocx chatgpt` | `ocx chatgpt <launch\|restore\|status>` — experimental macOS shim de aplicación-servidor, por defecto desactivado. Véase [Escritorio ChatGPT](/es/guides/chatgpt-desktop/). |
| `ocx hub` | `ocx hub invite [--json] [--data-url <origin>] [--management-url <origin>] [--clients codex,claude]` — crea un código de emparejamiento secreto de un solo uso en un concentrador en ejecución. Véase [Hub remoto](/es/guides/remote-hub/); invita requiere autorización explícita y su código no debe ingresar una transcripción del agente. |
| `ocx inspect` | `ocx inspect <subcommand>` — leyó la configuración efectiva, el catálogo, el análisis de enrutamiento, el ritmo, el inventario del proveedor de claves, el indicador Codex, la configuración del cliente, el estado de estrella o el estado de la bandeja Windows. Correr `ocx help inspect` para los enlaces temáticos. |
| `ocx mcode` | `ocx mcode [mcode args...]` — iniciar MiniMax Código después de su integración de archivos administrados está habilitado. Véase [Clientes MiniMax](/es/guides/minimax/). |
| `ocx mmx` | `ocx mmx text <chat\|repl> [mmx args...]` — iniciar MiniMax CLI texto a través del proxy; uso sencillo `mmx` para otras superficies. Véase [Clientes MiniMax](/es/guides/minimax/). |
| `ocx zcode` | `ocx zcode [status\|enable\|disable\|history\|restore] [--json]` — administró los comandos de integración de ZCode. Véase [Tiendas ZCode](/es/guides/integrations/#zcode-314-and-later). |

- [Ciclo de vida](/es/reference/cli/lifecycle/) — configuración, proxy y ciclo de vida del servicio, salud, diagnósticos, Sincronización del catálogo, el panel de control y actualizaciones.
- [Proveedores, cuentas y modelos](/es/reference/cli/providers-accounts/) Configuración del proveedor —, autenticación, grupos de credenciales, cuota, modelos personalizados, visibilidad, modelos seleccionados y contexto Caps.
- [Agentes, enrutamiento e integraciones](/es/reference/cli/agents/) — controles multiagente, combos, observabilidad, claves de admisión, rutas de protocolo, integraciones de clientes, configuración en entorno de ejecución, validado Codex CLI inspección de actualización de solo lectura.

<a id="headless-behavior"></a>

## Comportamiento sin cabeza

La administración ordena la administración del proxy en vivo API, utilizando el puerto de entorno de ejecución registrado y verificación de identidad en lugar de mantener una segunda ruta de configuración. Un proxy detenido o inaccesible se representa como HTTP 503 y produce una salida CLI distinta de cero. Los comandos explícitamente documentados como las operaciones de configuración sin conexión pueden validar y editar el archivo de configuración sin un live proxy.

`ocx system codex-cli-update check` no necesita proxy en vivo y no hace ninguna solicitud de registro de paquetes. Lo revisa los metadatos de procedencia limitada para el candidato de instalación configurado, incluido su ubicación ejecutable y evidencia de propiedad. El contexto del lanzador publicado de confianza autentica esa instantánea candidata, no una ejecución exitosa de Codex. En POSIX, `selectionAttested` puede ser `true` Cuando el entorno de ejecución selecciona el mismo candidato de entorno canónico sin ejecutarlo. Un paquete vinculado npm-global El manifiesto puede entonces establecer `managed: true` cuando demuestre la propiedad y, si se informa de una versión candidata, esa versión coincide con el manifiesto; los candidatos persistentes permanecen sin certificar. El informe JSON expone `candidateAvailable`, `candidateVersion`, `candidateSource`, y `selectionAttested`. Inspeccionar el candidato configurado requiere un contexto de lanzador publicado de confianza; un lanzamiento directo de Bun/source no tiene tal prueba, ignora el estado del candidato ambiental y persistente, y puede informar
`candidate_unavailable` en POSIX o `windows_inspection_deferred` en Windows. En Windows este primer segmento no realiza ninguna E/S candidata o de sistema de archivos de configuración: solo un candidato a entorno absoluto capturado por la prueba puede recibir etiquetas léxicas de paquete de aplicaciones o gestor de versiones; cualquier otro candidato Windows falla cerrado. El comando no instala ni repara software, Codex o npm, controla un proceso en ejecución o escribe el estado de configuración/caché.

`ocx system codex-cli-update plan --json` agrega una decisión de actualización de solo lectura para un POSIX certificado Instalación npm-global. Se resuelve `latest` a través del registro oficial npm, valida el Versión exacta e integridad SHA-512, y rechaza sesiones activas o observación incompleta del proceso. Las consultas del registro utilizan la configuración temporal aislada de npm, la caché y los registros con la limpieza del mejor esfuerzo. No hay software instalado y ningún proceso está señalizado. Windows devuelve `windows_inspection_deferred`. Véase [detalles de planificación](/es/reference/cli/agents/#read-only-codex-cli-update-plan).

Para ver la observación de la instalación de Windows x64, consulte [la `attest` comando](/es/reference/cli/agents/#explicit-installation-observation-on-windows-x64). Sin rutas explícitas, observa el candidato seleccionado identificado a partir de la instantánea del lanzador vinculado a prueba; no otorga autoridad de actualización ni da fe de la selección en entorno de ejecución.

La lista o el estado es el valor predeterminado cuando no es ambiguo. Uso `--json` solo en hojas que lo apoyan, y
`ocx observe logs --follow --jsonl` para la producción en fila modificada, o
`ocx logs --follow --events` para instantáneas/agregados de ventanas observadas versionadas. Tampoco es historia sin pérdida; [seguimiento, la línea de tiempo y el uso de key-scoped](/es/reference/cli/agents/#follow-request-windows-or-injection-sequences)
límites de cursor/reset/incomplete-data del documento. [Modelo de clave seleccionada/comprobaciones de audio](/es/reference/cli/agents/#explicit-key-model-and-audio-checks)
requieren el trabajo ascendente autorizado por el operador y la transferencia privada; sus informes son observaciones, no certificados de alcance de clave. Tema, idioma, navegación, y otro estado del navegador puramente visual no tienen equivalente CLI; La configuración del túnel Cloudflare está fuera Este conjunto de comandos.

Para tareas de lectura de estilo panel, use [selección de registro limitado, búsqueda del modelo de uso y totales de compañeros salvados](/es/reference/cli/agents/#filter-a-bounded-log-snapshot).
`logs filter` distingue la ventana escaneada de las coincidencias devueltas;
`usage --search` cambia las filas del modelo sin volver a calcular los totales del informe;
`companion usage` conserva la disponibilidad por rango y los configuración de reserva.
[Cuota de agrupación de claves API](/es/reference/cli/providers-accounts/#accounts-and-key-pools)
Es un explícito `account list --quota` leer y puede contactar a los proveedores.

<a id="liveness-probe-ceiling-override"></a>

## Sonda Liveness techo override

`ocx health`, `ocx status`, `ocx account *`, `ocx login codex`, y `ocx ready` encontrar el funcionamiento Proxy a través de una sonda corta: 750 ms por intento por defecto, y 1500 ms con reintentos para Parar y empezar a tomar decisiones. En hosts donde hay una capa de seguridad (un filtro de contenido o una red de estilo EDR) extensión) agrega un costo fijo a cada conexión de bucle invertido, esos techos pueden expirar antes de una respuestas proxy saludables, por lo que estos comandos informan al proxy como
`curl http://127.0.0.1:10100/healthz` Tiene éxito.

Establecer `OCX_PROBE_TIMEOUT_MS` para elevar los techos de tales anfitriones, por ejemplo
`OCX_PROBE_TIMEOUT_MS=5000 ocx status`. El valor es milisegundos enteros de 1 a 30000. Los override solo aumenta: el valor predeterminado de 750 ms y los presupuestos de parada / inicio de 1500 ms mantienen sus pisos, por lo que
`1000` Alarga solo la sonda por defecto. Valores indeterminados, vacíos, fraccionarios, negativos, cero o mayores se ignoran y se aplican los límites máximos enviados.

En Windows, el proxy también eleva su propio proceso a la prioridad ABOVE_NORMAL cuando se inicia, lo que reduce los retrasos de programación en un host saturado por otro trabajo prioritario NORMAL (exploradores de antivirus, codificadores, emuladores) sin garantizar que la sonda permanezca debajo de estos techos con una carga extrema. El impulso se aplica al proceso proxy solo trabajo — que genera todavía se ejecuta en NORMAL — y un El proxy pesado CPU puede retrasar las aplicaciones prioritarias NORMAL. El cambio es el mejor esfuerzo; set
`OCX_DISABLE_PRIORITY_BOOST=1` en el entorno del proxy para dejar la prioridad sin cambios.

<a id="exit-codes-and-confirmation"></a>

## Códigos de salida y confirmación

Los comandos exitosos salen 0. Uso no válido, comandos o recursos desconocidos, operaciones API fallidas, y servicios requeridos no disponibles salen de cero. `ocx health` específicamente 0 sólo cuando el proxy es saludable y 1 cuando no se encuentra ningún proxy saludable; argumentos inválidos salida 2, por lo que puede ser utilizado como una sonda de servicio. Los scripts deben probar la salida código en lugar de raspar la salida legible por humanos.

Muchos comandos de administración comparten estas asignaciones; otras familias CLI conservan sus propios contratos de salida:

| Código | Causa |
|---|---|
| 0 | éxito |
| 2 | Rechazo de uso local en manejadores de gestión; también sin soporte `doctor --json` |
| 64 | argumentos inválidos a `capabilities`, `ready`, o `resolve`, antes de su descubrimiento / solicitud de trabajo |
| 4 | HTTP 404 — la cuenta, proveedor, clave o ruta nombradas no existe |
| 5 | Conflicto HTTP 409 —; se mantiene un bloqueo o se cambia el estado debajo |
| 1 | todo lo demás, incluyendo fallos de transporte y otros errores HTTP |

Salida 0 significa que no se informó ningún error. Previsualizar verbos (por ejemplo `ocx storage cleanup` sin `--yes`) también salga 0 sin mutar. Una configuración guardada todavía puede llevar un resultado de aplicación omitido o incompleto; lea las advertencias de recibo y stderr.

Operaciones destructivas de eliminación, importación, consumo de crédito y actualización que anuncian confirmación requieren `--yes` en uso no interactivo. La bandera es un opt-in explícito; omitiéndola no debe ser silenciosa. confirmar la acción.

`ocx storage cleanup` va más allá: sin `--yes` ejecuta la vista previa e imprime lo que *se habría* be liberado, luego sale 0 sin haber cambiado nada. No hay confirmación interactiva para ninguno de estos — un aviso que una persona que llama automatizada puede responder no es un límite de seguridad, por lo que el indicador es el límite.

<a id="driving-the-cli-from-an-agent"></a>

## Conducir el CLI desde un agente

Descubra progresivamente, sin iniciar un proxy:

```bash
ocx help
ocx help models
ocx help models preset show
```

Lea el capítulo correspondiente en el repositorio `skills/ocx/references/01_management_surface.md`
o una de las páginas públicas de la familia de comandos de arriba. Lleno `ocx help --all` es un escapar a la referencia de nivel superior. Un amplio inventario de máquinas es opcional:

```bash
ocx capabilities --json
ocx capabilities --mutating-only --json
ocx capabilities --route '/api/providers/{provider}/model-costs' --json
```

La búsqueda de ruta coincide con la plantilla declarada literal, no con los ID de proveedor concretos o un método HTTP. Un error sale 4 y no prueba que un comando runtime esté ausente. Las declaraciones incluyen comandos locales, así como comandos de gestión; solo el Este último necesita un objetivo en vivo. Antes de las operaciones en vivo, ejecute `ocx ready --json` y
`ocx status --json`Inspeccione el objetivo y `versionSkew.relation`, y resolver versión no coincidente. `unknown` no confirma las compilaciones coincidentes. Ayuda offline, La configuración local y la inspección de laboratorio local no requieren el inicio.

`ocx status --json` incluye `cliCommand`: intent de escritorio configurado, el ejecutable esperado, candidatos observados PATH, `pathFirst`, `desktopFirstOnPath`, emitir códigos, y `shellResolution: "unobserved"`. El informe de estado humano imprime una línea de selección de comandos. `ocx doctor` agrega una sección de “Selección de comandos ocx”: no válido, inseguro (`record-unsafe`) o los registros pendientes habilitados y los objetivos de escritorio que faltan / inutilizables no pasan la comprobación, mientras que los registros pendientes de limpieza desactivados, PATH que ordena conflictos y exploraciones incompletas advierten. `OCX_NO_DESKTOP_HANDOFF=1` suprime el traspaso de paquete-lanzador para una invocación; deja en su lugar la configuración de la shim de escritorio y PATH. Estas observaciones de solo lectura no ejecutan candidatos, resuelven alias/funciones de parent-shell ni identifican al propietario del entorno de ejecución del proxy. En Windows, el traspaso de paquete-lanzador está deshabilitado; usuario `Path` El orden selecciona el escritorio `ocx.exe`. El estado y el médico aún leen el registro y reportan al primer candidato PATH. Un posible candidato de directorio actual cmd se informa por separado del orden PATH.

Los indicadores de salida son por comando. `doctor` rechaza `--json` con la salida 2;
[`v2` (referencia de la familia)](/es/reference/cli/agents/)
apoyos `--json` por locales y `--live` objetivos. Incluso para los comandos de administración compatibles con JSON, falla API normalmente usar prosa stderr con opcional `reason:` y `hint:` líneas, no un JSON Sobre de error. Mantén separados el estado stdout, stderr y exit.

La cobertura se mide por flujos de trabajo con nombre, no por prefijos de ruta compartidos. Existentes preconfiguración de modelo, visibilidad, controles de cuenta y lecturas de perfil de enrutamiento no implican soporte para modificaciones de nombre de pantalla de modelo descubierto o escrituras de perfil de enrutamiento. Las acciones de consentimiento de solo sesión y la presentación del navegador siguen siendo límites separados. Creación de clave de acceso y credenciales de texto plano de retorno de inicio de rotación: los agentes deben entregar esos pasos a una terminal operada por humanos fuera de la sesión y aceptar solo ID no secretas y confirmación. Nunca pida credenciales en el chat o evite un acción de solo sesión con otro cliente API.

<a id="recent-behavior-changes"></a>

## Cambios de comportamiento recientes

Estas son correcciones a comandos que previamente informaron mal sus propios resultados:

- `doctor` y `sync-cache` Ahora salga no-cero en caso de fallo. Anteriormente se había producido un fracaso y Salió 0, por lo que un script no podía distinguir el éxito del fracaso.
- Los errores del cliente de `account` Mapa HTTP 404 a la salida 4 y HTTP 409 a la salida 5, en lugar de contraerse Todo en 1.
- `ocx restore back --json` ahora honra su bandera de salida, que previamente aceptó e ignoró. Esto no hace `--json` una opción global para cada comando.
- `ocx logs --model` De hecho, los filtros. Fue aceptado y silenciosamente ignorado, por lo que la salida parecía filtrada mientras mostraba cada fila.
- `ocx storage` ganado `cleanup`, `trash`, y `policy` Subcomandos. Un desnudo `ocx storage` todavía imprime el informe de almacenamiento, como lo hizo cuando era un alias de `ocx observe storage`.

<a id="version-and-internal-dispatch-targets"></a>

## Objetivos de versión y despacho interno

`ocx --version`, `ocx -v`, y `ocx version` imprimir una línea de versión amigable con el script y salir.

Dos objetivos de envío se omiten intencionalmente de la ayuda normal: `__refresh-version [preview]`
actualiza la caché de notificación de actualización en un proceso separado, y
`__gui-update-worker <job-id> [latest|preview] [restart]` ejecuta un trabajo de actualización del panel de control. Ellos son detalles de la implementación, no comandos estables orientados al usuario. El panel de control registra al trabajador PID, recupera un trabajo activo cuyo trabajador murió, trata los registros activos PID más antiguos como obsoletos después de diez años minutos, y protege a un trabajador en vivo de las actualizaciones simultáneas.

<a id="capability-argument-validation"></a>

## Validación del argumento de capacidad

`ocx capabilities` rechaza argumentos desconocidos, banderas repetidas y espacios en blanco `--route` valores con salida 64. Una ruta válida sin capacidad declarada sale 4.

<a id="integer-option-values"></a>

## Valores de opción enteros

Opciones enteras como `--limit` requieren números enteros decimales dentro de los límites enteros seguros de JavaScript. Separadores de dígitos como `1_000` y `1,000` son aceptados. Los valores vacíos, hexadecimales, notación de exponente y fracciones se rechazan antes de enviar una solicitud.

<a id="windows-json-configuration-files"></a>

## Windows JSON archivos de configuración

`ocx config validate <file>` y `ocx config import <file> --yes` aceptar UTF-8 JSON con o sin un BOM líder, incluyendo stdin (`-`) Esto admite las exportaciones de UTF-8 desde PowerShell y editores de Windows. No se acepta la entrada UTF-16.

<a id="default-alias-listing"></a>

## Listado de alias predeterminado

`ocx alias --json` es equivalente a `ocx alias list --json`. La bandera de salida puede preceder o seguir una acción de alias explícita.

<a id="local-config-output-and-validation"></a>

## Salida y validación de configuración local

`ocx config validate [path|-] [--json]` sale 1 cuando falla la validación. El modo JSON emite uno `{ok:false,error}` carga útil; el modo humano nombra el fallo de validación.

Cuando la configuración guardada no es válida o ilegible, `ocx config`, `ocx config show`, y `ocx config get` advierta en stderr que los valores predeterminados se muestran para configuración no válidas y salga de no cero. Stdout conserva su formato existente. Correr `ocx config validate` para examinar el error, o `ocx config show --source` para los diagnósticos de configuración y fuente. El explícito `--source` La inspección sale de 0 cuando informa con éxito una reserva y aún emite la advertencia.

`ocx config export <file> --json` escribe la configuración raw en el archivo y emite solo `{ok:true,path}` En Stdout. Exportar a `-` siempre emite el documento de configuración en bruto, incluidas las credenciales; manténgalo fuera de las transcripciones del agente.

Local `ocx provider add` valida la configuración completa del candidato antes de guardarla. Un error de validación deja el archivo guardado sin cambios. Los proveedores locales requieren `--allow-private-network` a menos que su entrada en el registro ya permita destinos privados. El indicador no permite los puntos finales de metadatos bloqueados.

`ocx health` Acepta solo una opción `--json` bandera. Los argumentos desconocidos o los indicadores repetidos devuelven la salida 2 antes de sondear. Los errores de uso de Alias también devuelven la salida 2 con un error legible; nombre de acciones desconocidas `ocx help alias`.

<a id="log-model-selectors"></a>

### Selectores de modelo de registro

`ocx logs --model` acepta un ID de modelo desnudo o el completo `provider/model` etiquetas impresas en filas humanas, incluyendo modelos cuyas identificaciones desnudas contienen barras. Los intentos de conmutación por error se comparan como destinos completos. El filtrado ocurre antes `--limit`, y `--follow` utiliza el mismo filtro de servidor. Un resultado humano filtrado vacío dice que no hay entrada de registro coincidente; `--json` y `--jsonl` mantener su salida legible por máquina.

`ocx hub disable [--revoke-clients --client-key <id> ...] [--json]` devuelve un concentrador a autónomo en una escritura de configuración validada. La revocación de la clave del cliente requiere identificadores explícitos porque los nombres de clave no prueban el origen. Véase [Devolver un concentrador a autónomo](/es/guides/remote-hub/#return-a-hub-to-standalone).
