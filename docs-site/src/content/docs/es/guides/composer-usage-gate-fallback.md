---
title: "Alternativa ante límites de uso de Composer"
description: "Cola texto a un subproceso Codex existente bajo demanda, sin cambiar el enrutamiento o la autenticación de escritorio OpenCodex, al tiempo que se conservan las cuotas del lado del servidor."
---

Un escritorio **Compositor** La puerta de uso puede evitar nuevas entradas incluso cuando se configura un subproceso La ruta OpenCodex tiene capacidad disponible. En una instalación compatible, `codex queue` presenta a través de la cola nativa de aplicaciones-servidor de Codex sin usar ese cuadro de entrada. No parchea la aplicación, intercepte TLS, instale un certificado o cambie la autenticación.

Esto es **no es una solución para cada estado de límite de uso**. No restablece la cuota agotada ni Desbloquea el selector de modelos. Un hilo que ya está usando `gpt-reserve` mantiene ese modelo; texto en cola no lo cambie a otro proveedor. Autorización del servidor, cuotas de proveedores, aprobaciones, y la configuración de ejecución del hilo aún se aplica.

<a id="identify-the-blocked-layer"></a>

## Identificar la capa bloqueada

Un compositor deshabilitado antes del envío es diferente de un rechazo real del proveedor después del envío. presentación. Una etiqueta de modelo personalizada no demuestra ser un proveedor independiente ni la capacidad disponible. Utilice este recurso solo para un hilo seleccionado deliberadamente con una ruta utilizable de otro modo; Compruebe las aprobaciones pendientes, los giros activos y la conectividad app-server por separado.

El bloqueo de la cuenta principal sigue siendo autorizado. Es un guardia de admisión previo al agotamiento, no es una forma de restaurar una cuenta ya agotada. Este ayudante ni desactiva ese guardia ni cambia qué proveedor usa un hilo. No cambie las respuestas de las cuotas ni apague la guardia para hacer que se ejecute una solicitud de cuenta nativa en cola.

<a id="opencodex-integration-and-ownership"></a>

## Integración y propiedad de OpenCodex

Mantener el existente [Integración Codex](/es/guides/codex-integration) y
[modelo de enrutamiento](/es/guides/model-routing) configuración. El camino es:

```text
helper -> native Codex queue -> the selected thread's app-server
       -> the thread's configured provider -> OpenCodex, when already routed there
```

Los ayudantes no implementan otro router de proveedor. Solo envían el objetivo y el texto, no modelo, cuenta, nivel de servicio, aprobación, sandbox o base-URL anula. Un incorporado `openai`
proveedor enrutado a OpenCodex y un `opencodex` proveedor mantenga su configuración existente. La selección de Pool/Direct, las vinculaciones de cuentas, las credenciales de proveedores y los cheques de admisión siguen siendo propiedad por OpenCodex y el demonio servidor. La aceptación de colas por sí sola no prueba que se haya llamado a un proveedor.

Utilice el **misma `CODEX_HOME` y compatible CLI/app-server** como la instalación de escritorio.
`CODEX_HOME` por defecto a `~/.codex`; otra casa puede descubrir otro daemon y almacén de hilo.
`OPENCODEX_HOME` es el hogar del proxy, no un sustituto de `CODEX_HOME`. Los ayudantes dejan a ambos variables y los archivos de configuración de ambas aplicaciones sin cambios. En PowerShell, niños nativos heredar la ubicación del sistema de archivos del shell, incluso cuando `CODEX_HOME` es relativo.

El proxy ya debe estar ejecutándose y el subproceso de destino ya debe usar la ruta prevista. El ayudante no inicia/sincroniza/reconfigura OpenCodex, vuelve a habilitar una integración deshabilitada, o reemplazar silenciosamente una ruta OpenAI directa. No se requiere alternancia `codexDesktopAuthless`. Un proveedor remoto OpenCodex URL no es lo mismo que un servidor de aplicaciones remoto Codex: estos ayudantes utilizar el descubrimiento de demonios locales, no el enrutamiento automático a una conversación en otro equipo.

Estos son **Ayudantes de repositorio bajo demanda**, no una instalación `ocx queue` comando o un panel de control control. La lista de permisos de archivo del paquete npm no incluye `scripts/`; use un repositorio coincidente o el nativo. `codex queue` comando. Esta estrecha reserva evita agregar un segundo transporte, escucha persistente, caché de estado de cuenta o monitor de límite de uso a OpenCodex.

<a id="onoff-and-normal-usage-behavior"></a>

## Activación/desactivación y comportamiento normal

Hay un **sin interruptor de activación/desactivación persistente**: ejecutar el ayudante es el opt-in para uno presentación. Simplemente instalar / actualizar OpenCodex o mantener los scripts en disco no los ejecuta.

| Situación | Lo que hace este fallback |
| --- | --- |
| No invocado, tanto si hay contingente disponible como si se ha agotado | Nada: ningún proceso, temporizador, sondeo, oyente de fondo o solicitud originada por el ayudante. |
| Invocado normalmente mientras el uso está disponible | Hace colas para un mensaje ordinario. No se salta solo porque el compositor de escritorio está trabajando. El uso/facturación normal del proveedor se puede aplicar cuando se envía. |
| Invocado mientras solo el compositor está bloqueado | Intenta el mismo envío de cola nativa. La ruta configurada debe estar autorizada y disponible. |
| El proveedor real no tiene capacidad ni autorización | No pasa por alto esa restricción ni cambia de proveedor/cuenta; la ejecución en sentido ascendente aún puede fallar después de la aceptación de la cola. |
| `-DryRun` / `--dry-run` | Selecciona un destino y prueba la ayuda de CLI, pero nunca envía texto ni comprueba la cuota de cuenta, el estado del demonio o la disponibilidad del proveedor. |
| La puerta de uso se levanta más tarde | Utilice el compositor normal de nuevo. No hay una configuración específica de ayudante para revertir. |

Para dejar de usar la reserva, deja de invocarla. Hacer **no** ejecutar `ocx restore` o desactivar el Codex integración solo para desactivar este ayudante; eso también cambia el enrutamiento OpenCodex normal. Si ha programado el comando de forma independiente, desactive esa programación externa. Ya aceptado Los elementos de cola pertenecen a Codex y aún pueden ejecutarse: eliminar el script, salir de su proceso o recuperar la cuota no los cancela. Inspeccionar/eliminar elementos no deseados a través de la cola normal controles en la misma conversación. No envíe el mismo mensaje tanto en el ayudante como en el compositor.

<a id="check-compatibility-before-sending"></a>

## Compruebe la compatibilidad antes de enviar

Prefiera el CLI empaquetado en la aplicación; instalado por separado `codex` en PATH puede ser mayor. Comprobar
`codex queue --help` por `--thread` y `--message`. Los ayudantes prueban esta capacidad CLI, pero solo una solicitud real puede verificar el `thread/queue/add` apoyo. Si Codex informa un método de cola no compatible, guarde el trabajo en curso antes de actualizar/reiniciar la coincidencia instalación. Los ayudantes nunca reinician un demonio o reintentan con otro servidor. No añadir
`--no-daemon` a un comando de cola. Las actualizaciones de App/CLI aún pueden cambiar la compatibilidad.

Primero abra la conversación prevista y confirme su proyecto, modelo y proveedor. Prefiero su
**explícito UUID**; el CLI nativo también acepta un nombre de sesión exacto:

```powershell
codex queue --thread 'my-project-review' --message 'continue with the next step'
```

Desde la comprobación de un repositorio, el asistente Windows puede descubrir el paquete nativo `codex.exe`:

```powershell
.\scripts\codex-queue.ps1 -Thread 'my-project-review' -Message 'continue with the next step'
```

En macOS/Linux, utilice Bash (incluido Bash 3.2 de macOS):

```bash
bash scripts/codex-queue.sh --thread 'my-project-review' --message 'continue with the next step'
```

Pin un binario de confianza coincidente con `-CodexExe 'C:\path\to\codex.exe'`,
`--codex '/path/to/codex'`, o `CODEX_EXE`. Una selección explícita no válida falla en lugar de silenciosamente escogiendo otro ejecutable. En Windows use un nativo `.exe`, no un npm `.cmd` o PowerShell shim, para mantener el mensaje citando fuera de `cmd.exe`. Paquetes de aplicaciones compatibles con colas y Los diseños independientes se prueban antes de PATH. El descubrimiento automático de PATH ignora el vacío y la relativa entradas en lugar de probar un CLI del proyecto actual implícitamente. Un binario local de confianza Se puede seleccionar explícitamente con `--codex './codex'` o `-CodexExe '.\codex.exe'`. Las raíces de instalación configuradas y las entradas PATH absolutas aún deben ser confiables para el operador; este ayudante no verifica firmas binarias. Discovery no prueba una versión de la aplicación que coincida.

<a id="private-diagnostics-and-optional-latest-thread-discovery"></a>

### Diagnósticos privados y descubrimiento opcional de última generación

Una ejecución seca oculta rutas ejecutables, UUID/nombres de hilo y el cuerpo del mensaje de forma predeterminada:

```powershell
.\scripts\codex-queue.ps1 -Thread 'my-project-review' -DryRun
```

Informa sobre la capacidad de CLI y la selección de destino solamente, no la validación exitosa del lado del servidor. Para tiendas basadas en despliegue heredado, `-Latest` / `--latest` explícitamente opta por un **el último-archivo heurística**. Para ver esa selección, utilice un terminal privado no redireccionado:

```powershell
.\scripts\codex-queue.ps1 -Latest -DryRun -ShowTarget
```

```bash
bash scripts/codex-queue.sh --latest --dry-run --show-target
```

`-ShowTarget` / `--show-target` requiere una ejecución en seco y una salida de terminal local. Revela el ruta seleccionada y UUID/nombre solo por esta petición explícita, escapa a los caracteres de control, y rechaza la salida redirigida, como la captura CI. No lo utilice en terminales grabados/compartidos o Publicar la salida en público. Nunca imprime el mensaje. Salida nativa ordinaria Codex durante un El envío real se pasa a través y puede contener identificadores; revíselo antes de compartir registros.

Búsquedas más recientes de descubrimiento `CODEX_HOME/sessions` por tiempo de modificación, con el orden del nombre de archivo como un desempate. Es **No es la conversación de escritorio actual** y puede seleccionar otro proyecto o un subagente. Verifique la vista previa local y, a continuación, envíe con el UUID explícito elegido. La última lata también enviar cuando se proporciona un mensaje, pero sigue siendo una opción deliberada para esta heurística.

Reconocido `rollout-*.jsonl` Los nombres de archivo contienen un hilo UUID, a veces seguido por
`_<rollout-uuid>`; el ayudante utiliza el primer UUID. Los nombres mal formados se omiten. Falta o Las tiendas ilegibles fallan sin seleccionar desde otra casa. Tiendas migradas/paginadas y las conversaciones solo remotas pueden no tener una implementación local coincidente; use un nombre/UUID explícito.

Mantenga todo el mensaje en un solo argumento. Bash acepta `--message '- start with this'` o
`-- '- start with this'`; PowerShell acepta `-Message '- start with this'`. Historial de Shell y Los listados de procesos locales pueden exponer el texto de la línea de comandos, por lo que no incluya credenciales en las solicitudes.

<a id="queued-is-not-the-same-as-executed"></a>

## Queued no es lo mismo que ejecutado

`Queued message ... for thread ...` confirma **aceptación de cola**, no ejecución modelo o Terminación. Un hilo ocupado puede esperar su turno o aprobación actual. En la inspección de origen En la implementación, un hilo guardado descargado puede retener el mensaje hasta que otro cliente lo reanude.

Compruebe la cola y la actividad en el **La misma conversación**. Si no está cargado, ábralo en el aplicación o uso `codex resume <thread-id>` sin añadir el mensaje de nuevo. Revisión de aprobaciones pendientes y el estado de cola. Cada invocación de cola puede crear otro elemento; después de un fallo ambiguo, Inspeccione antes de volver a intentarlo. Los ayudantes preservan el estado de salida CLI y nunca vuelven a enviar automáticamente.

El CLI nativo tiene `--remote` opciones (ver `codex queue --help`), distinto de asumir La conexión de control remoto del escritorio se reutiliza. Mantener la configuración de autenticación sin cambios no repara fallos de autenticación/red no relacionados ni garantiza la continuidad del control remoto.

<a id="starting-or-resuming-work-without-the-composer"></a>

## Iniciar o reanudar el trabajo sin el compositor

`codex exec '<prompt>'` inicia una tarea no interactiva, **no** un mensaje en el escritorio abierto hilo. Compruebe su directorio de trabajo, proveedor, permisos y configuración.
`codex resume <thread-id>` Reanuda una sesión explícita. `codex resume --last` Filtros normalmente por el directorio de trabajo actual; `--all` desactiva ese filtro, mientras que otros filtros de elegibilidad pueden Todavía se aplica. Una selección global no es necesariamente la sesión del sistema de archivos visible o más reciente. Prefiere una identificación explícita para el trabajo de escritorio en curso.

<a id="scope-and-verification"></a>

## Alcance y verificación

Esta alternativa deja solos los derechos de la cuenta y los archivos de la aplicación. No es una reparación consciente del proveedor del compositor/recolector de modelos, una función automática de recuperación de cuotas o limpieza de cambios de proxy/certificado de experimentos anteriores.

La sonda original Windows (de escritorio) `26.917.9434.0`) aceptación de cola reportada para un hilo en vivo y un error esperado para un hilo inexistente. Esto no es una inferencia general de extremo a extremo, garantía de hilo descargado, control remoto o multiplataforma. La fuente ascendente fue verificada en
`7dae8c53d97e61cd774e4d6bcca5243c29ca615c`:

- [Opciones de cola CLI](https://github.com/openai/codex/blob/7dae8c53d97e61cd774e4d6bcca5243c29ca615c/codex-rs/cli/src/queue_cmd.rs)
  y [presentación de app-server](https://github.com/openai/codex/blob/7dae8c53d97e61cd774e4d6bcca5243c29ca615c/codex-rs/tui/src/session_queue_commands.rs).
- [Envío de cola de hilo cargado](https://github.com/openai/codex/blob/7dae8c53d97e61cd774e4d6bcca5243c29ca615c/codex-rs/ext/queue/src/service.rs)
  y [Opciones de selección de reanudación](https://github.com/openai/codex/blob/7dae8c53d97e61cd774e4d6bcca5243c29ca615c/codex-rs/cli/src/main.rs).

Ejecute regresiones de envoltura sin conexión con `node --test scripts/codex-queue.test.mjs` (Nodo 20+). Utilizan CLIs nativos falsos y hogares temporales, nunca cuentas reales o solicitudes de modelos. Los
**Ayudantes de cola Codex** flujo de trabajo ejecuta estas pruebas en Windows PowerShell 5.1 y PowerShell 7
macOS sistema Bash, y Linux Bash; falla un shell requerido que falta en lugar de omitirse silenciosamente. Los accesorios de configuración-preservación cubren la configuración del proveedor incorporado/personalizado y ambos valores de estado de uso, no en vivo OpenCodex Validar el despacho de escritorio real, el éxito del proveedor y la continuidad del control remoto por separado en las instalaciones compatibles.
