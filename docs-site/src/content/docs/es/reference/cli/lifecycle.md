---
title: "Ciclo de vida CLI"
description: "Comandos de instalación, inicio, parada, servicio, diagnóstico, sincronización y actualización."
---

Estos comandos instalan, ejecutan, inspeccionan, reparan y actualizan el proxy local opencodex y su integración con Codex.

<a id="discover-before-starting-services"></a>

## Descubre antes de comenzar los servicios

`ocx help`, `ocx help <family>` y `ocx help <family> <leaf>` están fuera de línea. Uso `ocx help --all` cuando la raíz compacta es insuficiente. Ayuda, configuración local La validación y la inspección local de laboratorio no requieren iniciar un proxy.

Antes de un flujo de trabajo de administración en vivo, ejecute `ocx ready --json` y `ocx status --json`. La preparación distingue `pending`, `failed` y `unreachable`; sólo `ready: true`
Confirma la disposición. Compruebe el objetivo y `versionSkew.relation`: `unknown` no es Prueba de versiones coincidentes. Un desajuste de versión requiere resolver el problema previsto. instalación, no intentar repetidamente una bandera más nueva contra un servidor más antiguo.

Las convenciones de salida y salida son específicas de los comandos. `ready` y `resolve` Rechazar argumentos inválidos con 64, mientras que `doctor --json` no es compatible y sale 2. Una solicitud de guardado local o de reinicio aceptada satisfactoriamente no prueba convergencia; lea el recibo del comando y vuelva a verificar el estado después de la operación solicitada.

Cuando el descubrimiento de destino en vivo no encuentra proxy, comandos de directiva/catálogo, uso Informe de sincronización de perfil Aside: “El proxy no se está ejecutando. Inicie el proxy previsto con: ocx start. No se envió ninguna solicitud”. Una solicitud de administración que se envió aún puede tener una escritura incierta resultado; leer de nuevo del objetivo previsto antes de volver a intentarlo. Integración de clientes heredada las negativas añaden una guía de recuperación fija basada en la razón de la negativa (nunca el propio texto del escritor); Los avisos de copia de seguridad y recuperación residual permanecen disponibles.

`ocx system update run --yes` imprime el ID de trabajo aceptado y el estado del trabajo observado. Síguelo con `ocx system update status <job-id>`; la aceptación no establece una instalación exitosa o reiniciar. `--json` conserva la respuesta completa del servidor.

<a id="setup"></a>

## Configuración

### `ocx init` · `ocx setup`

Asistente de configuración interactiva (`setup` Es un alias de `init`) Avisos para un proveedor (preestablecido o personalizado), API clave (literal o `${ENV}`), modelo predeterminado y puerto proxy; guarda `~/.opencodex/config.json`; opcionalmente inyecta el proxy en `$CODEX_HOME/config.toml` (por defecto) `~/.codex/config.toml`); y opcionalmente instala la shim de inicio automático Codex.

<a id="proxy-lifecycle"></a>

## Ciclo de vida del proxy

### `ocx start [--port <port>] [--socks5 [host:port] | --socks5-off]`

Iniciar el servidor proxy (puerto preferido) `10100`) Escribe el estado PID/runtime-port y se niega a Inicie una segunda instancia en vivo. Cuando el puerto preferido está ocupado, `start` pregunta al titular quién está y se detiene de cualquier manera: se niega rotundamente cuando un opencodex responde allí, e informa de un titular no identificado de otro modo. Nunca mueve al oyente a otro puerto por sí solo, porque eso dejaría el primer proxy en ejecución y volvería a apuntar Codex en el segundo. Una explícita diferente
`--port` se rechaza cuando el proxy en vivo comparte esta `OPENCODEX_HOME`, porque solo observa y la contabilidad de gastos forzada ambos escriben el mismo diario. Utilice un `OPENCODEX_HOME` por un hermano independiente; `port: 0` solo le pide al sistema operativo el puerto de esa instancia y no separa su Estado. Al inicio, sincroniza los modelos de cada proveedor en el catálogo de Codex. En el cierre se restaura Codex nativo — a menos que se haya lanzado como un servicio administrado (`OCX_SERVICE=1`) Un hermano comenzó al lado de un proxy en ejecución no hace ninguna: sirve solicitudes directas en su propio puerto solamente, y Codex, Grok y Claude permanecen apuntando al proxy que ya se estaba ejecutando. Con una separación
`OPENCODEX_HOME`, el inicio comprueba el registro de entorno de ejecución de la casa predeterminada y administra Grok y Los destinos de bucle Codex para un propietario de opencodex en vivo antes de la sincronización. Un hogar personalizado con ningún propietario en vivo todavía se sincroniza normalmente; explícito `ocx sync` y `ocx grok apply` permanecen disponibles. Detener a ese hermano con `ocx stop` o una señal deja su configuración sola también. Mientras se ejecuta, el proxy también mantiene Codex apuntado a sí mismo: cuando el enrutamiento opencodex `~/.codex/config.toml` Nombra otro puerto local donde ningún opencodex ha respondido durante unos 20 segundos (una instancia que lo entonces murió, por ejemplo), el proxy vuelve a señalar Codex en su propio puerto e imprime una advertencia. Codex Mientras tanto, mantén la dirección muerta hasta que la vuelvas a abrir.

`--socks5` (por defecto) `127.0.0.1:10808`) ahorra `config.proxy` como SOCKS5 URL y rutas de salida HTTP(S) a través de un túnel SOCKS5 real. `--socks5-off` borra solo el proxy SOCKS5 guardado; es no elimina un proxy HTTP. El valor sobrevive `ocx update` porque vive en configuración, no en el paquete instalado. Se puede incluir un nombre de usuario y una contraseña proxy en el URL, pero Los registros los redactan.

```bash
ocx start
ocx start --port 8080
ocx start --port 10100 --socks5
ocx start --socks5-off
```

### `ocx stop [--json]`

Detenga el proxy en ejecución (por PID), elimine el archivo PID y restaure el Codex nativo. Si un el servicio de background está instalado, `ocx stop` también lo detiene primero para que no pueda reaparecer el proxy. Mientras se ejecuta la aplicación de escritorio OpenCodex, `ocx stop` no mantiene el proxy abajo: la aplicación trata como una salida inesperada e inicia un proxy de nuevo, en cuestión de segundos para uno comenzó y después de un minuto para uno que sólo se había unido a. Usa la bandeja de la aplicación **Detener proxy** (Para un proxy la aplicación comenzado) o **Salir** para mantenerlo detenido. Por la misma razón, el dashboard **Detener** Botón Rechazar con `desktop_supervised`, y no cambia nada, para un proxy la aplicación comenzó. El panel web **Detener** el botón ejecuta la misma acción (`POST /api/stop`) en cada backend excepto el programador de tareas Windows. Allí, la envoltura puede reaparecer el proxy después de que termine la tarea, y solo una parada fuera del proxy puede verificar que la ventana de reinicio antes de restaurar su configuración de cliente — para que el panel de control se niegue con `respawnable_service`, no cambia nada, y te pide que corras `ocx stop`.

El panel de control también se niega cuando el proxy está funcionando *como* el lanzamiento instalado o systemd Servicio. Detener ese administrador desde dentro del proxy terminaría el proceso antes de nativo Codex se restaura, dejando su configuración de cliente apuntado a un proxy que se ha ido, por lo que el dashboard devuelve `self_unload_service`No cambia nada y te pide que corras. `ocx stop` — que detiene el servicio desde fuera y completa la restauración.

Una salida proxy por sí sola no confirma que la restauración compartida Codex/Grok haya tenido éxito. Si la parada la respuesta informa de un fallo, es ilegible o no confirma el modo de desmontaje asignado, el CLI mantiene la restauración con el padre que se detiene después de los cheques de propiedad y reaparición existentes. No entra en el repliegue forzado para un proceso que ya se ha observado que ha salido. A El aplazamiento respaldado por recibos todavía deja la restauración final y la limpieza del recibo con el padre; El fallo en la restauración de la configuración del cliente compartido mantiene la parada fallida y su recepción pendiente.

`ocx stop --json` ejecuta exactamente la misma ruta de parada e imprime un documento de resumen versionado (`schema: "ocx-stop/1"`) en stdout, mientras que las líneas de progreso humano se mueven a stderr. El resumen La clase de resultado (`stopped`, `not-running`, `history-incomplete`, `history-deferred`, o `failed`), las clasificaciones de servicio y proxy, si el entorno de ejecución está inactivo, y un mensaje de una línea. Los códigos de salida son idénticos con y sin `--json`: 0 en el éxito, 1 en el fracaso, 79 cuando solo la limpieza del historial de Codex no se completó, y 80 cuando se aplazó el desmontaje compartido y todavía se le debe.

Para una adquisición aprobada por el escritorio, `ocx stop --json` También acepta el conjunto completo de
`--expect-*` valores suministrados por `ocx resolve --json`. En Windows, esta parada vigilada puede detener una tarea del Programador de tareas solo cuando su definición, estado en ejecución y envoltura registrados ancestro prueba que posee el proxy aprobado. Un servicio WinSW debe probar su binario instalado ruta y servicio PID ascendencia. Después de detener cualquiera de los gestores, el CLI señala la proxy por separado y verifica que la tarea ya no se esté ejecutando, que no sobreviva ningún contenedor, y WinSW se detuvo. A `wscript.exe`, `cscript.exe`, o `cmd.exe` proceso con un línea de comandos ilegible en la cadena de supervisión del proxy aprobado (o sobrevivir bajo el stop manager) deja la propiedad del envoltorio desconocida, por lo que el stop vigilado no puede informar sobre el éxito. La evidencia faltante o ilegible bloquea la parada vigilada.

### `ocx restart`

Cuando este CLI es más nuevo que un proxy POSIX independiente certificado, reiniciar puede detener el antiguo Instalar y lanzar esta. Esta actualización requiere un hogar físico no reclamado, un proxy separado cuyo padre es PID 1, supervisión de servicio inactiva positiva y un conocido CLI versión. Un registro de servicio systemd instalado pero descargado solo es elegible cuando no tiene ninguna reclamación de propiedad. Ambos dominios lanzados deben estar ausentes; systemd debe informar inactivo con MainPID cero. La evidencia de un gerente ilegible o incierto se niega. El comando se congela todos los registros de servicio y la definición de la plataforma y los verifica a través de stop, launch y child publicación. Cualquier reescritura, reemplazo, cambio de permiso o creación / eliminación de registros se niega; reintento después de la inspección `ocx status`. El stop usa la misma conexión que probó la identidad del viejo proxy. El comando se lanza solo una vez después del apagado confirmado, entonces requiere el hijo exacto PID, punto final, nueva identidad Prueba y versión coincidente. Versión faltante, parada incierta, tiempo de espera o un reemplazo inesperado Informes de fracaso sin otra parada o inicio. Si el entorno de ejecución de este lanzamiento CLI sigue siendo el pequeño marcador de posición npm instalar hojas antes de su postinstalación, reiniciar se niega antes detener cualquier cosa; después de una parada confirmada, espera el entorno de ejecución dentro del mismo plazo y No lanza nada si no llega. Windows, en primer plano, supervisado por el escritorio, servicio activo, Los tiempos de ejecución conectados al cliente y hermanos no usan esta ruta de actualización; usen su ciclo de vida de posesión controles. Un proxy más nuevo o una versión incomparable aún rechaza una degradación in situ. Utilice el nuevo instalación `ocx` reiniciar; inspeccionar `which -a ocx` y `ocx status` para identificarlo. Las denegaciones de elegibilidad nombran la razón y la siguiente acción: use el nombre de la instalación propietaria.
`ocx service restart` para un servicio, el terminal propietario para un proxy en primer plano, o el tener una aplicación de servicio / escritorio en Windows. Una ascendencia desconocida o un objetivo cambiado requiere
`ocx status` antes de cualquier reinicio.

Si los archivos del paquete o el entorno de ejecución de Bun permanecen incompletos después de que el instalador haya salido o haya fallado, ejecutar `ocx status`, detener cualquier proxy corriendo a través de su propietario (`ocx stop`o su servicio o aplicación de escritorio), luego vuelva a instalar con el mismo administrador de paquetes y vuelva a iniciarlo. Véase
[Fallo de actualización](/es/troubleshooting/update-failed).

Cuando un proxy se está ejecutando, pida que PID y puerto certificados exactos se reinicien en su lugar, espere a que su normal, y verificar un entorno de ejecución diferente PID en el mismo puerto. Enrutamiento y servicio gestionados La supervisión permanece instalada en todas partes; una petición incierta se observa más bien que se repite como un problema. Parada/Inicio por separado. Si no se está ejecutando ningún proxy, el comando vuelve a la posición normal. `ensure` Inicio. Si un reinicio aceptado pierde su reemplazo, el comando intenta un inicio de recuperación limitado incluso cuando el inicio automático Codex está deshabilitado, e informa de un error si no se inicia ningún proxy. Cuando el proxy inicia su propio reemplazo (ningún servicio en segundo plano lo supervisa) después del drenaje terminado normalmente, un reemplazo que sale antes de que responda se inicia de nuevo hasta dos veces. ¿Qué Las impresiones de reemplazo van a `~/.opencodex/restart-handoff.log`, que se mantiene cerca de 256 KiB: a El reinicio lo vacía una vez que alcanza ese tamaño, y el reemplazo en ejecución lo verifica una vez por minuto. Un proxy que la aplicación de escritorio OpenCodex inició no inicia su propio reemplazo: sale y la aplicación inicia el nuevo proxy en el mismo puerto. Si no se puede certificar un oyente en vivo a un PID en entorno de ejecución (incluido un proxy de actualización previa), se produce un error de reinicio Cerrado sin un `ensure` o detener/iniciar el retroceso. Después de confirmar la propiedad, el uso `ocx stop` entonces
`ocx start` para un proxy independiente. Para un proxy administrado por servicio, use `ocx stop` seguido por
`ocx service start` Se restablece la supervisión. Una invocación vuelve a observar las razas de descubrimiento transitorias. Un inicio fallido se vuelve a intentar solo cuando el intento anterior nunca lanzó un niño o se sabe que el niño lanzado ha salido. Si un inicio aún puede estar en ejecución, reinicie los informes del error original sin iniciar un segundo proxy, incluso cuando una investigación de salud no encuentra nada. Cuando un reinicio aceptado nunca publica un reemplazo, el comando vuelve a observar una vez antes de renunciar a — un proxy que se estrelló a mitad de reinicio lee ausente y se inicia fresco, mientras que un reemplazo que aterrizó justo después de la espera de reemplazo acortada todavía demuestra el éxito dentro del plazo general de observación. Fuera de la ruta de actualización CLI más reciente, un destino en vivo es nunca se detuvo para hacer espacio, por lo que un proceso de escucha rancio no puede ser reemplazado por un segundo Para el puerto. Cada intento fallido de inicio es seguido por un ritmo y una fuerte re-observación antes de la siguiente intento: un niño que acaba de ser lanzado puede seguir siendo vinculante, y los pasos posteriores a la salud puede haber lanzado en un proxy que ya sirve. Una lectura en vivo significa no se genera un segundo comienzo: un rechazo limpio luego da fe del éxito, mientras que un tiro se propaga como un fallo de inicio porque el trabajo posterior a la salud falló en un proceso de servicio. Durante la recuperación de un accidente después de un reinicio en vivo aceptado, el éxito requiere una entorno de ejecución PID en el puerto original: si el PID original se vuelve a leer en vivo, el reinicio falla como un reemplazo perdido en lugar de informar el éxito. Pruebas de ausencia y lanzamiento-salida confirmadas juntas permiten otro intento de inicio. Mientras que el PID anterior todavía está activo, o una sonda es incierta, la La ventana de confirmación mantiene la votación para un reemplazo dentro de la reserva en lugar de Fracasó de inmediato. Un segundo proxy nunca se genera junto a uno vivo. La espera de reemplazo termina lo suficientemente temprano como para que la ventana de confirmación aún se ajuste dentro del plazo de observación general.

La recuperación del puerto después de la parada o actualización respeta una comprobación de proceso OCX fallida incluso cuando el PID era registrado antes del cierre. Un soporte vivo rechazado se deja en funcionamiento y evita la limpieza de la fila TCP. Si permanece sin verificar, la espera de recuperación limitada puede caducar con el puerto todavía ocupado. Compruebe el titular del puerto actual y reintente el reinicio después de resolver el conflicto.

### `ocx ensure`

Asegúrese de que se está ejecutando un proxy en segundo plano y, a continuación, sincronice su catálogo de modelos en vivo. Si
`codexAutoStart` es `false`, imprime que el inicio automático está desactivado y no hace nada.

Con una configuración de cliente conectado validada, `ensure` Tiene éxito sin iniciar un local proxy del proveedor después de conciliar el diario del cliente. Esto no prueba ni certifica el control remoto Disponibilidad del hub. El estado del cliente no válido o no coincidente sigue fallando.

### `ocx restore [back]` · `ocx eject [back]`

Restaurar Codex nativo **sin** detener el proxy — quita las líneas de configuración inyectadas y enrutadas Entradas de catálogo tan sencillas `codex` Trabaja de forma nativa otra vez. `eject` Es un alias de `restore`.

La salida del catálogo restaurado excluye los modelos nativos retirados, incluyendo `gpt-5.3-codex-spark`, ya sea que se almacenen como ID desnudos o filas calificadas para cuentas de confianza. Esto se aplica con o sin una copia de seguridad del catálogo; se conservan la copia de seguridad original y la configuración histórica seleccionada por el usuario.

La restauración informa de un fallo en lugar de reemplazar los archivos de configuración modificados cuando se guarda un diario carece de los correspondientes hashes de inyección. Los archivos actuales y el diario permanecen disponibles para ver; ver [recuperación sin hashes de inyección](/es/guides/codex-integration/#recovery-without-injection-hashes).

Pase `back` para deletrear para volver a apuntar claro `codex` en un proxy ya en ejecución sin cambiar el ciclo de vida del proxy:

```bash
ocx restore back
ocx eject back
```

### `ocx recover-history --legacy-openai --yes`

Recuperación explícita para compilaciones de desarrollo anteriores que volvieron a mapear el historial de la aplicación Codex antes que reversible El soporte de backup existía. Cierre Codex primero si su base de datos de historial está bloqueada.

Este es un relabel amplio y destructivo: cada hilo de mensaje de usuario etiquetado actualmente `opencodex` es Cambiado a `openai`, `exec` Está normalizada para `cli`, y el marcador de evento está establecido. Esto incluye historia legítima de proveedores dedicados. Haga una copia de seguridad del estado y ejecútelo solo cuando el alcance completo sea previsto.

### `ocx recover-history --ocx-compaction <thread-id> --yes`

Reparar un hilo que fue compactado a través de un proveedor enrutado antes de reanudarlo a través de nativo Codex. El comando lee el hilo exacto seleccionado por UUID, guarda una copia de seguridad privada byte a byte, entonces convierte solo OpenCodeX-propiedad `ocx1:`/`ocx2:` estado de compactación en un simple resumen que Codex nativo puede reproducir. El contenido cifrado nativo y otros hilos se dejan sin cambios. Cerrar la selección hilo antes de ejecutar el comando; un cambio de despliegue simultáneo hace que la recuperación se detenga sin Reemplazar el archivo.

### `ocx uninstall` · `ocx remove`

Detener el servicio y proxy, quitar el servicio y Codex shim, restaurar nativo Codex, a continuación, eliminar opencodex configuración local solo si todos los pasos de restauración tuvieron éxito. `remove` Es un alias de `uninstall`. La limpieza de configuración requiere metadatos de propiedad creados por una nueva instalación; directorios heredados o compartidos quedan en su lugar.

Ambos comandos no aceptan argumentos. Banderas sin soporte (incluyendo `--dry-run` y `--yes`) salir con el estado de uso 2 antes del vuelo previo o el desmontaje; no se realizan cambios. Para obtener ayuda, corre `ocx help uninstall` o `ocx help remove`.

<a id="status-and-health"></a>

## Situación y salud

### `ocx status [--json]`

Situación y `ocx doctor` compare esta versión de CLI con el proxy en ejecución. Si el CLI es más nuevo, reiniciar el proxy utilizando la instalación actual prevista; para un servicio en segundo plano, ejecutar
`ocx service restart`. En macOS, un sesgo de versión deja la definición del servicio idéntica a bytes, por lo que
`ocx service repair` No recargaría nada y mantendría el viejo proceso en servicio. Si el proxy es más nuevo, actualice el CLI o resolver `PATH` a la instalación prevista. Estos diagnósticos no reparan el servicio o cambiar si se permiten solicitudes.

Las cadenas de versión idénticas y el `unknown` / `0.0.0` Los observadores suprimen la advertencia, al igual que Una versión proxy ausente. El doctor no reporta marcadores de posición como un partido confirmado. Diferentes Las cadenas aún producen una advertencia neutral cuando no pueden analizarse estrictamente como SemVer o diferir. solo en los metadatos de compilación; ninguno de los lados se llama más antiguo. Las versiones no se recortan y un `v`
No está normalizado. JSON expone el mismo consejo en `versionSkew`, cuyos campos permanecen
`cliVersion`, `proxyVersion`, `skewed`, y `warning`.

Imprima un resumen de diagnóstico de solo lectura: proxy PID, `/healthz` URL, ruta de configuración, proveedor predeterminado, ajuste de inicio automático Codex, estado del servicio, estado de compensación y el Codex efectivo redactado casa. Solo la firma explícita y de alta confianza Windows Orca runtime-home agrega una App-home procesable advertencia de desajuste; nunca cambia `CODEX_HOME` automáticamente. También advierte cuando el enrutamiento Codex opencodex escribió nombres de un puerto local que el proxy en ejecución no sirve. `ocx sync` Repararlo inmediatamente, y un proxy propietario en ejecución también puede volver a apuntarlo por sí mismo una vez que nada responde en ese puerto. El estado de un hermano no lo informa, porque su enrutamiento nombra el proxy al lado del cual se ejecuta.

Cuando un proxy en vivo ya ha pasado la verificación de identidad / vitalidad, `ocx status` Prefieren ese proceso Informe de salud de inicio certificado para reiniciar la seguridad y la viabilidad del servicio. Evita los falsos negativos de un shell-local service-manager sonda que carece del entorno de administrador del servicio en ejecución. Los live report está validado por esquema; si no está disponible o está mal formado, el estado vuelve al estado local Servicio y diagnóstico de shims. `ocx doctor` utiliza la misma regla de live-first para su **Codex seguridad de reinicio**
sección, por lo que los dos comandos deben estar de acuerdo en reiniciar la protección. Si usted está diagnosticando una discrepancia, comparar el veredicto de inicio en vivo reportado con los detalles del servicio local en lugar de tratar la cáscara Sondear como más autoritativo.

La lectura en vivo permite que la sonda de servicio limitada termine: hasta 6,5 segundos en macOS/Linux y 16,5 segundos en Windows cuando la caché de diagnóstico está fría o ha caducado. Cached lee retorno Rápidamente. Un tiempo de espera sigue cayendo de nuevo a los diagnósticos locales; un saludable `/healthz` Solos no establecer la protección de reinicio.

Los `clients=pending-restart(...)` Listas de diagnóstico Codex Clientes CLI que son anteriores al enrutamiento inyección. En macOS, renderizador de electrones, utilidades y ayudantes de panel de bloqueo bajo el marco de trabajo de Codex.app se excluyen de esa lista de clientes, incluidos los ayudantes cuyas rutas ejecutables contienen espacios.

La producción humana también incluye un **OAuth salud** bloque después del resumen de inicios de sesión OAuth: `OAuth health:
ok` cuando cada cuenta conocida es saludable, o `OAuth health: warning` con una línea redactada por cuenta no saludable (proveedor, ID de cuenta enmascarada, estado como la reautenticación requerida, cuota limitada, o conflicto de actualización) más una opción `Action:` pista. Los ID de cuenta están redactados; tokens y los correos electrónicos nunca se imprimen. Los `--json` Actualmente, el contrato no incluye este bloqueo de salud.

```bash
ocx status
ocx status --json
```

Forma de ejemplo abreviada:

```json
{
  "schemaVersion": 1,
  "proxy": {
    "running": false,
    "pid": null,
    "health": {
      "ok": false,
      "url": "http://127.0.0.1:10100/healthz",
      "message": "unreachable"
    }
  },
  "dashboard": {
    "url": "http://localhost:10100/"
  },
  "paths": {
    "config": "/Users/example/.opencodex/config.json",
    "pid": "/Users/example/.opencodex/ocx.pid",
    "runtime": "/path/to/bun"
  },
  "runtime": {
    "source": "bundled"
  },
  "codexHome": {
    "effectiveCodexHome": "C:\\Users\\[USER]\\.codex",
    "appCodexHome": "C:\\Users\\[USER]\\.codex",
    "mismatch": false,
    "warning": null,
    "action": null
  },
  "codexAutostart": true,
  "defaultProvider": "openai",
  "service": {
    "summary": "not installed (logs: /Users/example/.opencodex/service.log)"
  },
  "codexShim": {
    "summary": "Codex autostart shim: not installed"
  }
}
```

El objeto real también incluye `listen` (puerto, nombre de host, entorno de ejecución/fuente de configuración), carga de configuración diagnósticos y diagnósticos de complementos Codex incluidos. El esquema JSON es solo aditivo: versiones futuras puede agregar campos, pero los campos existentes deben permanecer estables. Excluye intencionadamente las teclas API, OAuth tokens, encabezados de autorización, contenido de solicitud, correos electrónicos e identidades de cuenta.

### `ocx health [--json]`

Verifique la identidad del proxy en vivo. Informes de producción humana PID/port; `--json` Emite `{ok, pid, port}`. Los El comando sale 0 solo cuando está sano y 1 si no, haciéndolo adecuado para las sondas de servicio.

### `ocx system health [--json]`

```bash
ocx health --json
ocx system health --json
```

La salud de la raíz es la sonda de vitalidad. La salud del sistema es una gestión separada observación: `{status:"ok",service:"opencodex",version,uptime,pid,spendLedger}`, con tiempo de actividad en segundos. `system status` permanece su configuración/arranque/agregado de memoria. Una observación válida de la salud del sistema sale 0 incluso si el libro mayor de gastos se degrada. Leer propiedad retenida/no retenida, inicializada, configurada, degradada, persistFailures y corruptRecords; el estado ok no certifica que todos los subsistemas estén sanos. Fallo/malformado Las lecturas siguen siendo distintas de cero con datos sanos seguros, no fabricados.

Para diagnósticos limitados, [solicitud/inyección seguir](/es/reference/cli/agents/#follow-request-windows-or-injection-sequences)
se detiene en caso de error o se detecta un cambio de destino en lugar de volver a conectarse automáticamente. SIGINT sale 130 y SIGTERM 143. Los eventos de registro con versiones reconstruyen las ventanas observadas, no se pierda el tráfico entre las encuestas; la inyección no puede excluir las brechas de reinicio / desalojo.

### `ocx ready [--json] [--wait [--timeout <seconds>]]`

Compruebe la preparación post-sincronización a través de la `GET /readyz` punto final. Vuelve `200` cuando listo, o `503` con `Retry-After: 1` por `pending` y terminal `failed`. Su identidad HTTP saneada es `{service, version, uptime, pid, port, status}` más los campos de protocolo de concentrador remoto
`{protocol, minimumClientProtocol, managementUrl}`. `protocol` es el protocolo de concentrador este proxy Habla y `minimumClientProtocol` el cliente más antiguo que todavía acepta, por lo que un cliente puede rechazar una emparejamiento incompatible antes de enviar cualquier otra cosa. `managementUrl` Es el origen que un cliente debe uso para el plano de gestión: el configurado `hub.managementPublicOrigin` cuando `runtimeRole` es
`hub`, y de lo contrario el origen de la propia solicitud llegó. Una solicitud sin El origen HTTP(S) es rechazado en lugar de ser respondido con una conjetura. Viejos proxies sin `/readyz` fail Cerrado como `unreachable`; `/healthz` es la vida separada, no la disposición. El comando realiza una sonda por defecto; `--wait` encuestas hasta que estén listas o con tiempo de espera, pero sale inmediatamente cuando observa la terminal `failed` Estado. Los El tiempo de espera predeterminado es de 45 segundos; `--timeout <seconds>` requiere `--wait` y acepta segundos enteros positivos de 1–300. El propio CLI `--json` la salida es deliberadamente más estrecha que el cuerpo HTTP: emite
`{ready, status, pid, port}`donde: `status` es `ready`, `pending`, `failed`, o
`unreachable`. Los códigos de salida son 0 para listo; 1 para no-listo, pendiente, fallado, tiempo de espera, o inalcanzable; y 64 para argumentos no válidos.

### `ocx resolve [--json]`

Resolver los hechos en entorno de ejecución que necesita un shell sin volver a implementarlos: la configuración home, la configuración de inicio y la configuración de red. puerto efectivo, y el veredicto de vivacidad verificado por la identidad. `--json` Emite una versión documento (`schema: "ocx-resolve/1"`) con `cliVersion`, `configHome`, `port`
(`effective`, `configured`, y `source`), y `liveness` (`status`, `pid`, `port`,
`source`, más `version`, `role`, y `hostname` cuando el proxy en vivo los informa). Cuando un proxy está activo, el documento también `versionSkew` — la misma comparación
`ocx status` y `ocx doctor` superficie — con `cliVersion`, `proxyVersion`, `skewed`,
a `relation` de `match`, `cli-newer`, `proxy-newer`, `incomparable`, o `unknown`, y el operador `warning`. Shells leído `relation` En lugar de reparar el aviso; el escritorio usa `proxy-newer` para evitar que una toma de posesión disminuya el oyente. Liveness tiene tres respuestas: `live`, `absent-proven` (cada punto final registrado y configurado definitivamente rechazado o contestado no-opencodex), y — desconocido una sonda de tiempo de espera o un oyente que retiene `/healthz` 1 en lugar de leer como ausente, por lo que solo `absent-proven` mayo autorizar el inicio de un nuevo entorno de ejecución. El puerto es el puerto del oyente en vivo cuando un proxy responde, de otro modo el puerto configurado (predeterminado 10100). La salida 0 lleva un veredicto confiable; la salida 1 significa el CLI no pudo resolver — incluyendo un inválido `config.json`que nunca se repara para por defecto aquí — y el llamante debe negarse a adivinar; cualquier argumento desconocido sale 64. Descubrimiento utiliza el mismo presupuesto de prueba seguro para la propiedad que `ocx start`, porque una falsa respuesta de "nada escuchando" es cómo suceden los proxies duplicados. El verbo es de solo lectura y omite la función de restauración automática previa.

### `ocx doctor`

El informe predeterminado incluye el estado del coordinador de escritura nativa y la ruta exacta usando inmutable inspección SQLite de solo lectura. Los estados de byte cero, vacío-sin versionar y sin filas se muestran por separado de la salud del catálogo/app-server, por lo que una actualización de catálogo exitosa no se confunde con éxito Codex inyección de configuración.

La comprobación de historial pendiente lee un modo WAL con punto de control `state_5.sqlite` incluso cuando Codex es cerrado y su `-wal`/`-shm` Los archivos están ausentes. Los sidecares que faltan por sí solos no indican una historia Fracaso de integridad. Los manifiestos de copia de seguridad y los objetivos de restauración aún se someten a validación de integridad.

Después de detener el proxy/servicio OpenCodex, conserve y mueva explícitamente un proxy no autorizado probado coordinador, luego reintente la sincronización:

```bash
ocx doctor --recover-zero-byte-coordinator --yes
ocx sync
```

La recuperación solo acepta un remanente probado de cero bytes. Rechaza todo lo no vacío, válido, desconocido, base de datos cambiada, insegura u ocupada y crea un mismo directorio `.zero-byte-backup-*` archivo en su lugar borrar cualquier cosa.

Ejecutar diagnósticos de conectividad y entorno de solo lectura: rutas de estado y tipo de sistema de archivos, WSL dual instala, entorno/configuración proxy, accesibilidad ChatGPT, plugin Codex y advertencias de configuración de proyecto, La migración histórica pendiente. La sección de orientación de la aplicación Codex también detecta el estrecho Windows Orca runtime-home desajuste y explica la migración del servicio cuando sea aplicable. Los caminos que muestra esta El nombre de usuario del sistema operativo. El médico imprime pistas de reparación, pero no las aplica.

Los diagnósticos de Project-config ignoran los ejemplos de proveedores dentro de las cadenas multilínea TOML, que incluyen
`developer_instructions`. Los configuración reales del proveedor y del perfil después del delimitador de cierre siguen siendo comprobado, incluso cuando una cita escapada precede inmediatamente a ese delimitador.

Los **OAuth fiabilidad** sección informa si el almacenamiento de credenciales es escribible, si actualizar Los archivos de un solo vuelo/bloqueo se pueden crear bajo `OPENCODEX_HOME`, grupo OAuth o Codex no saludable cuentas (ids redactados) con una recuperación `Action:`, y un OK estático que hace la ruta de reenvío Codex no fabricar metadatos de clientes oficiales. El médico nunca muta las credenciales ni aplica reparaciones.

<a id="catalog-sync"></a>

## Sincronización de catálogo

<a id="read-saved-state-separately-from-synchronization"></a>

### Leer el estado guardado por separado de la sincronización

El modelo, el proveedor, la configuración y los recibos v2 tienen diferentes contratos de finalización. Los cambios de modelos personalizados locales se sincronizan oportunistamente: ningún proxy significa un éxito guardar, `needsSync:true`, `sync.status:"not-attempted"` Salida 0. Un local explícito proveedor `--sync` sin un proxy en su lugar devuelve no cero después de guardar.

Configuración que usa writes `catalogRefreshPending`, mientras que en vivo v2/catalog escribe usar un lleno `catalogRefresh` disposición. Modo local v2/nativo y encendido/apagado cambiado todavía intentan su sincronización establecida incluso cuando no se descubrió ningún puerto. JSON reporta evidencia de estado y sincronización reales; la sincronización no verificada/no verificada es distinta de cero. Hilos/sugerencias y encendido/apagado sin cambios no introducen un nuevo intento de sincronización.

Inspeccione el mismo objetivo con `ocx v2 status --json` o `ocx v2 status --live --json`, y uso `ocx system settings --json` para la lectura de configuración. Un ahorrado pero pendiente o resultado desconocido no prueba retroceso y no es permiso para reproducir un escrito. Véase [v2 resultados](/es/reference/cli/agents/#explicit-v2-target-and-outcome) y
[política de cuenta](/es/reference/cli/providers-accounts/#pool-policy-account-thresholds-and-paid-credit-intent)
objetivos, alcance y límites de gasto. Una lectura de estado de reset-grant puede contactar estado ascendente, pero nunca consume ni reanuda una subvención.

### `ocx sync [--restart-codex] [--restart-app-server-only]`

Un reinicio explícitamente solicitado también se ejecuta después de un compromiso exitoso. `config.toml` cambiar, incluso si el catálogo y los bytes de caché no cambian. Una escritura de solo configuración sin opción, de rechazo, previa o reversión no la activa. Sin un indicador de reinicio, la sincronización nunca reinicia automáticamente Codex.

Extraiga la lista de modelos en vivo de cada proveedor configurado y vuelva a inyectar el catálogo combinado en Codex. Ejecutarlo después de agregar un proveedor o para actualizar los modelos disponibles.

Antes de la detección del proveedor o el reemplazo del catálogo/caché, `ocx sync` Valida que la gestión La configuración de Codex se puede inyectar. Si esa validación rechaza la configuración, el comando sale no cero, imprime la razón concreta en stderr, y deja el catálogo existente y caché sin cambios.
`ocx restore back` utiliza el mismo prevuelo sin escritura antes de volver a habilitar el enrutamiento.

Si Codex de larga duración `app-server` Los procesos siguen funcionando, `ocx sync` Advierten que pueden mantenerse servir a la lista de modelos en memoria anterior, aunque `opencodex-catalog.json` / `models_cache.json`
fueron actualizadas. Pase `--restart-codex` para reiniciar la coincidencia `codex … app-server` y
`codex-code-mode-host` procesos **y** cerrar completamente y volver a iniciar la aplicación de escritorio Codex, en macOS, Linux y Windows, por lo que el selector de modelos vuelve a leer el catálogo. Las conversaciones en vivo terminan. Amplio
`pkill -f codex` Se evita intencionalmente el emparejamiento.

`--restart-desktop-app` es un alias obsoleto de `--restart-codex`. Todavía funciona, imprime un aviso de desaprobación, y no es Windows-solo.

`--restart-app-server-only` restablece el comportamiento más antiguo y estrecho: `SIGTERM` solo a juego procesos app-server y code-mode-host propiedad del usuario actual, con la aplicación de escritorio izquierda corriendo. Los giros activos aún pueden interrumpirse. Si se combina con `--restart-codex` o
`--restart-desktop-app`, el estrecho alcance gana, porque perder conversaciones en vivo es irrecuperable y un viejo recolector no lo es.

Cuando el comando se ejecuta desde el interior de la aplicación Codex, el reinicio se transfiere a un ayudante separado y esta sesión termina con la aplicación.

### `ocx sync-cache [--restart-codex] [--restart-app-server-only]`

Invalide la caché del selector de modelos local de Codex para que se reconstruya a partir del catálogo activo de opencodex. Los mismo rancio-`app-server` advertencia y los indicadores de reinicio opcionales como `ocx sync` aplicar.

Si la caché derivada ya tiene bytes idénticos, el comando se ejecuta correctamente sin reescribirlo o reiniciar Codex. Con `--json`Esto se reporta como `ok: true`, `wrote: false`, `skipped: true`, y `skippedReason: "unchanged"`; un catálogo no válido o una escritura en caché fallida sigue saliendo como no cero.

<a id="catalog-write-diagnostics"></a>

### Diagnósticos de escritura de catálogo

Catalog write auditing records delimitado diagnóstico en `opencodex-catalog-audit.jsonl` bajo
`CODEX_HOME`. Un catálogo o caché sin cambios no produce ningún evento; un error de auditoría no falla publicación de catálogo.

En Windows, **como máximo se registra el evento de creación de nuevo archivo exitoso**. Se crea el archivo vacío y endurecido antes de que se escriban los datos de diagnóstico. Todos los eventos posteriores omiten el archivo existente, tanto en el mismo proceso como después de reiniciar. Un fallo de endurecimiento puede dejar un archivo vacío, que eventos posteriores también saltar. Los archivos existentes y sus ACL no se cambian para la auditoría, incluyendo cuando otra casa OpenCodex posee el catálogo. Este es un primer recurso de privacidad, no un completo Flujo de auditoría Windows; el comportamiento nativo de NTFS para esta ruta de auditoría aún no se ha validado.

La auditoría POSIX continúa anexando y reteniendo registros limitados. La limitación Windows no Deshabilitar la protección del catálogo o la curación del propietario. Auditoría de archivos en una `CODEX_HOME` permanecer cleanup residuals porque el manifiesto de desinstalación de configuración no puede reclamar rutas fuera de su propia raíz.

### `ocx catalog pull <https-url> [--auth-env <NAME>] [--json] [--restart-codex] [--restart-app-server-only]`

Instalar un catálogo completo servido por otra instancia de OpenCodex `/v1/catalog` Endpoint, entonces sincronizar `models_cache.json`. A diferencia `ocx sync`, este comando no descubre configurado proveedores o inyectar la configuración de Codex. A diferencia `ocx sync-cache`, reemplaza el catálogo activo Antes de reconstruir el caché. Funciona incluso cuando el estado deseado de integración Codex local está desactivado.

El URL debe ser HTTPS; se acepta el loopback HTTP para pruebas locales. Credenciales URL incrustadas, consultas, fragmentos, redirecciones, respuestas de gran tamaño, JSON mal formado, babosas duplicadas o inseguras, y Desconocido `input_modalities` Se rechazan antes de cualquier escritura local.

Las solicitudes de Loopback HTTP se rechazan antes de que se adjunten encabezados de autenticación o se envíe cualquier solicitud cuando `HTTP_PROXY` o `http_proxy` se aplica sin una coincidencia `NO_PROXY` o `no_proxy` derivación. `ALL_PROXY`/`all_proxy` y configuración limitados a `HTTPS_PROXY`/`https_proxy` no active esta restricción HTTP; La adquisición del catálogo HTTPS permanece permitida. El mensaje de rechazo no incluye ni la dirección proxy ni la autenticación token. No vacío `http_proxy` y `no_proxy` tener precedencia sobre `HTTP_PROXY` y `NO_PROXY`, respectivamente. Para reglas de derivación compatibles con Bun, use nombres de host, coincidencia `host:port` Las direcciones IPv6 entre corchetes, como `[::1]`, o `*`; no utilice URL, rutas o `*.` prefijos.

La autenticación es opcional y es leída únicamente por referencia variable al entorno:

```bash
export OPENCODEX_CATALOG_AUTH_TOKEN='...'
ocx catalog pull https://proxy.example.com/v1/catalog \
  --auth-env OPENCODEX_CATALOG_AUTH_TOKEN
```

El valor se envía como Bearer token, pero nunca se acepta como un valor argv. Las redirecciones son rechazadas, Así que la autorización no puede cruzar orígenes. Las escrituras de catálogo y caché usan el bloqueo de catálogo compartido Codex El escritor atómico. Un error fetch, validación, bloqueo de adquisición, escritura de catálogo o reconstrucción de caché conserva los últimos archivos conocidos. Los bytes de catálogo idénticos son una opción prohibida que conserva mtimes y Nunca toca los procesos. `--restart-codex`, `--restart-app-server-only`Y el desaprobado
`--restart-desktop-app` Alias significa lo mismo aquí que en `ocx sync` y
`ocx sync-cache`, y se aplican solo después de un escrito real.

El URL debe nombrar `/v1/catalog` En la raíz del host. Un proxy inverso que sirve al endpoint bajo un Este comando no admite el prefijo path.

El comando descarga el catálogo completo y compara bytes localmente en lugar de emitir un `ETag` /
`If-None-Match` Solicitud condicional. Los bytes idénticos se tratan como un no-op completo, por lo que Codex casa cuyo catálogo es correcto, pero cuya `models_cache.json` falta o es rancio no reparado por este comando; usar `ocx sync-cache` Por eso.

`--json` Emite un sobre estable en stdout. `schemaVersion`, `ok`, `status`, `catalogWritten`,
`cacheSynced`, y `codexRestarted` están siempre presentes. `codexRestarted` todavía significa servidores de aplicaciones Sólo. `desktopAppRestarted` solo está presente cuando se solicitó un reinicio del escritorio, y es `true`
solo cuando el relanzamiento realmente comenzó; un traspaso no es un éxito. `status` es `updated`,
`unchanged`, o `failed`. Un tirón exitoso añade `modelCount`; un fracaso añade `code`, que es el En el campo un script se ramifica:

| `code` | Significado | Salir |
| --- | --- | --- |
| `usage` | Los argumentos no eran válidos `catalog pull` invocación | 2 |
| `auth_env_missing` | `--auth-env` Nombrar una variable que no está establecida | 1 |
| `url_invalid`, `insecure_http_refused` | El URL fue rechazado antes de cualquier solicitud | 1 |
| `request_failed`, `redirect_refused`, `http_error` | La solicitud no produjo una respuesta utilizable | 1 |
| `body_too_large`, `body_invalid`, `catalog_invalid` | La respuesta fue rechazada antes de cualquier escritura local. | 1 |
| `write_failed`, `lock_database`, `unsafe_path` | La escritura coordinada no se completó; los archivos no han cambiado | 1 |
| `lock_busy` | Otro escritor tiene el bloqueo de catálogo Codex | 3 |
| `restart_incomplete` | El catálogo y la caché aterrizaron, pero sobrevivió un servidor de aplicaciones Codex `--restart-codex` o `--restart-app-server-only` | 1 |

`restart_incomplete` es el único fallo que reporta que escribe real: `catalogWritten` y
`cacheSynced` Permanece fiel y `ok` es falso, porque un servidor de aplicaciones sobreviviente todavía sirve a la Catálogo anterior de memoria.

<a id="background-service"></a>

## Servicio en segundo plano

Un servicio administrado puede iniciar una instalación más reciente que sirvió anteriormente el mismo servicio. OpenCodex hogar, incluso cuando su definición de servicio todavía apunta a una instalación anterior. Si ese hijo más nuevo sale antes de vincularse, con cualquier código de salida, el servicio original se inicia en su lugar. y aplica sus propios controles antes de servir. Los inicios de primer plano y los proxies lanzados por el cliente mantienen su ejecutable seleccionado. En Windows, esto se aplica al Programador de tareas y a WinSW nativo recién instalado o reparado servicios. Una definición nativa de WinSW creada antes de que este comportamiento necesite `ocx service repair`
para actualizar su XML antes de que pueda pasar a una instalación más reciente.

### `ocx service [install|repair|restart|start|stop|status|uninstall|remove]`

En el programador de tareas Windows, la envoltura de servicio reinicia el proxy después de cinco segundos incluso cuando una herramienta externa termina con el código de salida 0. Si otro proxy opencodex ya posee el puerto, la envoltura sale deliberadamente. Uso `ocx stop` o
`ocx service stop` para detener el servicio y su bucle de reinicio. Después de actualizar un instalación existente, ejecutar `ocx service repair` para refrescar la envoltura generada.

Ejecutar opencodex como un servicio de segundo plano administrado por inicio de sesión (macOS) **launchd**, Linux **unidad de usuario systemd**, Windows **Programador de tareas**) que se inicia automáticamente en el inicio de sesión y se reinicia automáticamente en el bloqueo. Conjunto de ejecuciones de servicio
`OCX_SERVICE=1` así que un reinicio no altera la configuración de Codex.

Windows Programador de tareas instala el uso de prioridad de proceso normal (`Priority=4`) El fondo más viejo prioridad (`7`, también el planificador predeterminado cuando se omite) puede retrasar las respuestas de salud del proxy bajo Contención CPU, haciendo que el informe de bandeja esté desconectado incluso mientras el proceso está en marcha. Después de la actualización, ejecutar `ocx service repair` para migrar esa prioridad registrada y reiniciar el servicio. Esta migración puede solicitar la aprobación de UAC; una prioridad ya establecida en normal o alta no desencadena el reemplazo.

El envoltorio Windows admite fechas de configuración regional que contienen paréntesis, incluidos coreano y japonés Formatos de fecha. Después de actualizar, ejecute `ocx service repair` para reemplazar un envoltorio generado más antiguo que sale antes de iniciar Bun en esas configuración regionales.

La envoltura Windows verifica su entorno de ejecución Bun horneado y la entrada CLI antes de cada intento de inicio. Si un actualización del paquete interrumpido eliminado cualquiera de los archivos, registra uno `installation is incomplete` mensaje y se detiene en lugar de volver a intentar el mismo ejecutable faltante cada cinco segundos. Vuelva a instalar opencodex, entonces ejecutar `ocx service repair` para actualizar la tarea con las rutas de paquetes restauradas.

Las definiciones de servicio omiten los directorios multishell version-manager locales de su guardado
`PATH`. Esto incluye el servicio nativo Windows instalado con `ocx service install --native`; ejecutar `ocx service repair` para regenerar una definición más antigua de WinSW con un `PATH`.

En Linux, la unidad systemd invoca el primer ejecutable normal `ocx` archivo encontrado en `PATH` en tiempo de instalación en lugar de las rutas Bun y CLI dentro del árbol de paquetes instalado. Administradores de versiones como el **mise** y **asdf** instalar en un directorio versionado y eliminar el antiguo en la actualización; su shim estable mantiene la unidad resolviendo. Fuente checkouts sin un `ocx` lanzador mantener el forma directa Bun + CLI. Un confiable `OPENCODEX_BUN_PATH` seleccionado antes de Bun se inicia se conserva a través de la shim; las rutas de paquetes locales Bun se redescubren después de las actualizaciones.

En marcha macOS, launched en su lugar utiliza el paquete local Bun y CLI rutas de acceso seleccionadas durante la instalación o reparación. Esto evita que un PATH de recibir el servicio API token Después de actualizar una instalación del administrador de versiones, ejecute el comando version-manager.
`ocx service repair` para actualizar esas rutas antes de reiniciar el servicio. Launched reinicia el proxy después de un fallo o un traspaso de reinicio fallido, pero lo deja detenido cuando el servicio sale deliberadamente de forma limpia porque la aplicación de escritorio es propietaria del entorno de ejecución. Correr
`ocx service repair` una vez para aplicar este comportamiento a un servicio instalado por una versión anterior.

Las definiciones instaladas antes de este cambio todavía llevan las rutas versionadas antiguas y no pueden migrar. — una vez que se elimina el ejecutable antiguo, no se ejecuta ningún código opencodex para solucionarlo. Correr
`ocx service repair` una vez después de la actualización. El servicio Linux se inicia y luego sigue el lanzador; macOS repair escribe las rutas de paquetes nuevas en la definición lanzada. Un proxy ya en ejecución no se reemplaza por una actualización externa: cuando la CLI instalada es más nueva que el proxy de ejecución, ejecutar `ocx service restart` para que la nueva construcción sirva. En macOS, `repair` no es bastante allí: la definición no cambió, y una reparación que no cambia nada no recarga nada. Si el proxy es más nuevo en su lugar, compruebe la instalación CLI y `PATH` como se describe en
[`ocx status`](#ocx-status---json).

| Subcomando | Acción |
| --- | --- |
| ninguno | Instalar y comenzar cuando esté ausente; de lo contrario `repair` el servicio existente. Una definición de planificador Windows saludable se reutiliza; una definición obsoleta puede volver a registrarse y requerir elevación. |
| `install` | Crear e iniciar el servicio. Lo registra, que en Windows necesita elevación. |
| `repair` | Actualizar un servicio instalado en su lugar. En macOS, el administrador se recarga solo cuando algo cambia, por lo que un trabajo saludable y sin cambios sigue funcionando y la reparación no es una interrupción. En Linux y Windows, el servicio se reinicia; se reutiliza una definición de planificador Windows saludable, mientras que una definición obsoleta puede volver a registrarse y requerir elevación. |
| `restart` | La misma actualización y un reinicio garantizado en todas las plataformas. En macOS, un trabajo sin cambios y ya cargado se inicia en su lugar. No es un alias de `repair`. |
| `start` | Iniciar un servicio instalado. |
| `stop` | Detenga el servicio y restaure el Codex nativo. |
| `status` | Reportar diagnósticos de servicio y proxy más rutas de registro. |
| `uninstall` | Quitar el servicio y restaurar Codex nativo. |
| `remove` | Alias de `uninstall`. |

En Windows, un `ocx service` ejecuta la ruta de instalación solo después de que tanto el Programador de tareas como WinSW estén demostrado estar ausente. Si cualquiera de las consultas de estado no es concluyente, se niega a registrar nada y le pide que para correr `ocx service status`; usar explícito `ocx service install` Sólo después de confirmar la ausencia.

<a id="runtime-ownership"></a>

### Propiedad en entorno de ejecución

La aplicación de escritorio OpenCodex puede tomar el proxy en segundo plano de una instalación CLI. Cuando lo hace, registra el traspaso en el estado de instalación del servicio compartido, y ese registro es lo que La toma de posesión sobrevive a un reinicio. Su registro de servicio es **mantenido, nunca eliminado** — el registro reemplazarlo en lugar de reemplazarlo.

Un archivo de estado sin registro de propiedad significa que la instalación CLI es propietaria del entorno de ejecución, que es lo que cada instalación realizada antes de que esta característica esté disponible. Nada cambia para ti hasta que una aplicación se hace cargo.

Los niños de servicio supervisado también verifican al propietario registrado antes del inicio y una vez más mientras mantener el arrendamiento de propiedad inicial, antes de elegir un puerto o publicar un PID. Si el escritorio app reclama el entorno de ejecución durante el inicio, el hijo del servicio se apaga incluso si el proxy del escritorio Todavía no ha empezado a escuchar. Un registro de propiedad ilegible tiene el mismo comportamiento de stand-down.

Las rutas Home dentro de un registro de estado se comparan con la casa actual por el directorio físico que tienen. resolver, no sólo su ortografía. Una unión o enlace simbólico registrado bajo una instalación antigua todavía Nombra la misma casa y sigue trabajando después de la mudanza; un alias que ya no se resuelve solo tratado como un hogar diferente cuando su ortografía registrada también difiere de la actual, El montaje rancio todavía produce la negativa del propietario extranjero en lugar de reclamar silenciosamente el entorno de ejecución.

Mientras que algo más que este CLI posee el entorno de ejecución, los subcomandos que se **activar** su Registro rechazar en su lugar:

| Subcomando | Comportamiento bajo un propietario extranjero |
| --- | --- |
| `repair`, `restart` | Rechazar antes de cambiar nada. El registro no se vuelve a habilitar, reescribir o reiniciar. |
| `start` | Se niega por la misma razón, por lo que un inicio automático de bandeja no puede poner un segundo proxy al lado de la aplicación. |
| `stop`, `uninstall` | Sin cambios. Se desactivan, por lo que nunca están cerradas. |
| `install` | Devuelve el entorno de ejecución. Limpia el registro de propiedad después de que el registro tenga éxito, e informa de quién fue. |

`ocx update` se comporta de la misma manera: no detiene el proxy en ejecución ni actualiza el servicio mientras que la aplicación posee el entorno de ejecución, porque el servidor en ejecución es el propio binario incluido de la aplicación y el refresh volvería a habilitar el lanzador que la toma de posesión reemplazó. La aplicación actualiza su propio entorno de ejecución.

La denegación nombra la instalación propietaria y la generación de consentimiento, por ejemplo:

```text
Background service repair stopped: the desktop app owns the runtime (install <id>, consent generation 2).
The service registration was left exactly as it is — not re-enabled, not rewritten and not restarted.
Quit the desktop app and run 'ocx service install' to hand the runtime back to this CLI.
```

Un registro que no puede ser leído o no analiza produce el mismo rechazo con una primera respuesta diferente. línea, porque una reclamación ilegible no es lo mismo que ninguna reclamación — tratándola como "nadie posee esto" es cómo un error de permisos reactivaría silenciosamente su servicio.

**La recuperación en todos los casos es `ocx service install`.** Es deliberadamente el único verbo que nunca es cerrado, por lo que eliminar la aplicación sin devolver el entorno de ejecución, o un archivo de estado dañado, aún deja Una manera de recuperar el servicio:

```bash
ocx service install
```

```bash
ocx service
ocx service install
ocx service repair
ocx service restart
ocx service status
ocx service uninstall
```

`install`, `start`, y `repair` Confirmar que un proxy realmente responde en el puerto horneado en el servicio instalado antes de informar el éxito — en las tres plataformas. Esperan hasta 20 segundos y luego imprimen el puerto de servicio:

```
✅ opencodex service installed and serving on port 10100.
```

Si nada responde, advierten y **Salida no cero**:

```
⚠️  Service installed, but no proxy answered on port 10100 within 20s.
   The manager registered the job; that is not the same as serving.
   Log:       ~/.opencodex/service.log
   Meanwhile: ocx start   (serves in the foreground)
```

Una salida no cero significa aquí *Registrados pero sin servicio* — no *no instalado*. Los El administrador de servicios aceptó el trabajo; el proxy detrás de él nunca ató el puerto. Lea el nombre en el mensaje, y usar `ocx start` Mientras tanto, servir en primer plano.

`ocx service status` reporta los mismos tres estados en lugar de la salida del administrador en bruto:

```
✅ installed and loaded (launchd; logs: …)
   Serving on port 10100.
```

```
⚠️  installed and loaded (launchd; logs: …)
   Registered, but no proxy is answering on port 10100.
   launchd is running an OLDER plist than the one on disk.
   Fix:    launchctl bootout gui/$(id -u)/com.opencodex.proxy && ocx service repair
   Log:    ~/.opencodex/service.log
   Repair: ocx service repair
   Meanwhile: ocx start           (serves in the foreground)
```

Ya no imprime el crudo `launchctl list` / `systemctl status` línea, que reportar un trabajo registrado de manera idéntica si estaba sirviendo, no vinculado a nada, o ejecutar una definición anterior. Los `Diagnostics:` línea todavía lleva la ruta de registro y cualquier búsqueda rancio-cocinado-camino.

En Windows el backend del programador mantiene su propia salida de estado más rica, que ya informó el registro del Programador de tareas por separado de la accesibilidad del proxy.

<a id="service-logs"></a>

### Registros de servicio

El proxy administrado escribe stdout y stderr para `~/.opencodex/service.log`
(o `$OPENCODEX_HOME/service.log` con un hogar personalizado). Cuando `OCX_SERVICE` está establecido,
`ocx start` cada línea de registro de la consola, incluyendo diagnósticos multilínea, con un UTC ISO-8601 marca de tiempo como `2026-10-14T03:04:05.678Z`. La salida en primer plano y otros comandos CLI mantienen su formato existente.

El servicio comprueba el tamaño del registro en el inicio y una vez por minuto. Por encima de 20 MiB copia los últimos 20 MiB en `service.log.1`, mueve el archivo anterior a
`service.log.2`, y trunca el archivo activo en su lugar para que el administrador del servicio Las manillas abiertas de apéndice siguen siendo utilizables. El archivo activo puede exceder el umbral entre comprobaciones; cada archivo está limitado a 20 MiB. Las fallas de rotación no se detienen El servicio. Copy-truncate puede perder líneas escritas durante la copia y un archivo puede comenzar a través de una línea. Los mensajes de envoltura Windows existentes mantienen su formato de envoltura.

En macOS esto también cubre un fallo más sutil: `launchctl load` Informes de fracaso en stderr al salir 0, por lo que una carga que no se usó para salir de la ejecución lanzada un
**anterior** versión de la definición del servicio mientras el comando imprime una marca de verificación.
`install` ahora falla en voz alta en ese caso y nombra el `launchctl bootout` comando que Limpia el trabajo rancio.

En Windows, `ocx service status` informa el registro del Programador de tareas por separado de Acceso a proxy verificado por identidad OpenCodex. No imprime el localizado `schtasks` mesa, para que el resumen siga siendo legible en las páginas de código Windows. Recuperación de backup transaccional registra un mensaje de éxito fijo en lugar del nombre del directorio de copia de seguridad; los nombres de copia de seguridad que contienen Los metacaracteres de shell no se convierten en comandos en ese mensaje de registro.

En Windows, la creación de la entrada del Programador de tareas requiere elevación. Reconocido localizado El texto denegado mantiene la ruta de guía existente. Si ese texto es ilegible, el retroceso Requiere la forma de comando propia `/create /tn opencodex-proxy /xml <non-empty-path> /f`, estado 1, y un token confirmado no elevado; la acción de seguridad de inicio del panel puede solicitar UAC automáticamente. Si esa reserva no puede determinar el estado token, conserva el planificador original Error. Las tareas y operaciones en el extranjero nunca pueden emitir el marcador de elevación automática. Aprobar el panel de instrumentos UAC prompt o reejecución `ocx service install` en una ventana PowerShell elevada.

Para una nueva instalación donde la tarea del planificador OpenCodex se confirma ausente, aprobación UAC ahora ocurre antes de que el instalador detenga cualquier proxy existente. Su registro único XML se organiza en un directorio privado endurecido por ACL fuera de la raíz de configuración de OpenCodex, y la tarea está registrada sin ser corrido. Solo después registro tiene éxito hace OpenCodex eliminar que XML, requieren metadatos de propiedad para una genuina nueva raíz de configuración, detener el antiguo oyente, eliminar y volver a verificar de forma limitada cualquier WinSW nativo registro, publicar los activos de servicio e iniciar la tarea programada. Cancelar o denegar UAC, o no reclamar una nueva raíz de forma segura, por lo tanto, deja el proxy de trabajo y su enrutamiento Codex en lugar. Los registros de programadores existentes o conflictivos continúan fallando en lugar de ser borrado como un seguro mejor esfuerzo de retroceso.

Si los informes de inicio `another process owns the runtime mutation lease` o `ocx service status` muestra
`Runtime mutation lease busy`, el contrato de arrendamiento está bloqueando el inicio o los cambios en el servicio, incluso si el El proxy no se está ejecutando. El mensaje incluye la ruta de bloqueo, PID grabado, la vida actual, nombre ejecutable cuando esté disponible, y edad de arrendamiento. La identidad del proceso no está verificada: el PID pueden haber sido reutilizados, por lo que la vivacidad y el nombre ejecutable describen cualquier proceso que PID ahora. Espere a que la operación termine y vuelva a intentarlo; no elimine el bloqueo ni detenga una proceso basado solo en este PID. Un intento de mutación posterior puede reclamar un contrato de arrendamiento obsoleto una vez que su La edad supera los 30 segundos y el PID grabado ya no está vivo; el estado solo lo inspecciona.

En Windows, este diagnóstico compartido de Nodo/Bun no inicia un ejecutable para buscar el nombre de la imagen; el PID grabado, la vitalidad, la edad de arrendamiento y la guía de recuperación permanecen disponibles.

### `ocx codex-shim <install|status|uninstall|remove>`

En macOS y Linux, instale un envoltorio de inicio automático privado en `<OPENCODEX_HOME>/bin/codex` y a fuenteble `<OPENCODEX_HOME>/codex-shell-env.sh`, usando la OpenCodex casa resuelta. El nativo launcher se queda donde brew, npm o fnm lo instalaron; actualizaciones de administrador de paquetes y versiones revertidas seguir trabajando sin volver a envolver ese lanzador. En Windows, los lanzadores basados en scripts todavía están envuelto en su lugar. Real `codex.exe` Los objetivos no han sido tocados. Si se rechaza la instalación o el contenedor no puede ejecutarse, el comando sale de no cero y el panel de control Reporta la razón del fracaso. Una envoltura Unix ejecutable cuenta como una instalación exitosa incluso antes activación en el shell actual; una shim saludable ya instalada también cuenta como éxito. Para instalaciones Windows que solo exponen `codex.exe`, uso `ocx service install` para el autoarranque.

En macOS/APFS, un reinicio puede cambiar los números de dispositivo del sistema de archivos. Una envoltura privada sin cambios y El entorno de shell sigue siendo propiedad después de ese cambio, por lo que el estado, la reparación y la desinstalación continúan trabajo. OpenCodex todavía comprueba sus inodos registrados, rutas, propietario, permisos y contenido / lanzador vinculante; archivos reemplazados o no validados se conservan.

Después de brew/fnm y otra configuración PATH, ejecute el comando de activación impreso por install. Con el valor predeterminado casa, es:

```sh
. "$HOME/.opencodex/codex-shell-env.sh"
```

Para un hogar personalizado, use la ruta impresa y cotizada. El abastecimiento es idempotente: elimina el duplicado privado bin entradas y pone ese directorio primero en PATH. Para activar shells futuros, agregue esa línea de origen después de su paquete-gerente PATH configurar usted mismo; OpenCodex nunca edita archivos de inicio de shell. Instalar no puede cambiar su shell padre. `ocx status`, `ocx codex-shim status`, `ocx doctor`, y `ocx connect`
reporte un contenedor ejecutable pero no seleccionado como **No activo**Con el comando Activation. Shell Los alias/funciones y los lanzadores de escritorio o servicios configurados por separado aún necesitan su propia configuración.

Para Codex administrado por fnm, la instalación resuelve el directorio multishell temporal al duradero Instalación de nodos mientras se conserva el nombre de archivo del lanzador. Si ese directorio no se puede resolver, La instalación se niega en lugar de envolver una ruta temporal. Cuando se selecciona Codex, `ocx connect`
También informa de la preparación de la shim. Esta comprobación de preparación omite las entradas del archivo especial PATH y, en macOS y Linux, archivos sin permiso de ejecución, incluidos los objetivos de enlace simbólico. Conserva el orden de Lanzadores ejecutables regulares, incluyendo npm y enlaces simbólicos fnm. Windows mantiene su búsqueda PATHEXT. Si un envoltorio PATH diferente oculta una shim que se puede ejecutar, arregle el orden PATH; reinstalar la misma shim no cambia qué comando encuentra primero tu shell. Si la shim de orugas Es manejable, pero no `codex` Se encuentra el comando, se conecta a los informes como inactivos e imprime la activación comando. Una inspección PATH fallida informa la activación como no verificada en lugar de reclamar que no existe ningún comando. Estas advertencias no cambian el estado de salida del comando connect.

Antes de realizar una instalación o reparación, OpenCodex ejecuta el lanzador guardado con `--version` mientras El inicio del servicio se omite. Rechaza el cambio y retrocede cuando el lanzador se resuelve
`codex` volver a la shim, sale no cero, excede los cinco segundos, deja a los descendientes corriendo, o no se puede validar y limpiar de forma segura. Por lo tanto `codex-shim install` No es incondicional. Si se rechaza, reinstale Codex para que la entrada PATH sea un ejecutable concreto o lanzador y reintente; uso `ocx service install` en su lugar, cuando un lanzador de administrador de comandos dinámico no puede cumplir con estas comprobaciones. Los rechazos de limpieza incluyen un sufijo de diagnóstico limitado que identifica la fase de la sonda, un código de error nativo o señal, y el estado de salida cuando se conoce. No incluye rutas de lanzamiento o la salida del niño en bruto, y no relaja las comprobaciones de validación o reversión. Una shim Unix más antigua instalada en su lugar es migrada solo por un servidor explícito. `ocx codex-shim install`. La migración restaura el lanzador nativo registrado sin reemplazar un lanzador más nuevo ya presente, luego instala el contenedor privado. Si la instalación privada falla después de la restauración nativa, el El lanzador permanece restaurado y la operación se puede volver a intentar. Lanzadores nativos faltantes o inutilizables requieren reparación del paquete-gerente; OpenCodex no adivina otra instalación ni vuelve a envolver la ruta del administrador. La migración también se niega cuando el registro `codex-shim.json` no es un archivo regular de su propiedad o es Escribible en grupo o en el mundo. Las versiones anteriores escribieron ese archivo con el proceso umask, por lo que un umask de `002`
lo dejó en modo `0664`. La denegación nombra el expediente y el `chmod 600` que sólo limpia el rechazo escrito en grupo o en el mundo. Se mantienen Symlink y las denegaciones de propietarios extranjeros; OpenCodex no cambiar los permisos en sí.

La instalación del lanzador por sí sola no prueba que las solicitudes de Codex usen OpenCodex. Después de un runnable instalar, el comando comprueba el enrutamiento Codex actual e informa de una advertencia en lugar de un resultado verde cuando el enrutamiento es externo, de propiedad del usuario o no verificable. También advierte cuando las variables proxy salientes solo existen en el proceso actual mientras que `config.proxy` no está configurado o sin resolver, porque Codex Los lanzadores y los servicios en segundo plano pueden no heredar ese entorno. Estos controles son de solo lectura y nunca imprima valores proxy; resuelva el traspaso y la ejecución informados `ocx doctor` Antes de confiar en autoarranque.

En Unix, la reparación automática actualiza solo el envoltorio privado y nunca reescribe el gestor de paquetes Lanzadores o migra una shim más antigua en el lugar. En Windows, si se ha completado una actualización externa de Codex sobrescribe una shim instalada, el siguiente ordinario `ocx` El comando respalda el nuevo lanzador estable y restablece la shim antes del envío. El efecto cero
`ocx system codex-cli-update check` de inspección e invocaciones malformadas en su reserva
`ocx system codex-cli-update` El espacio de nombres nunca realiza esa reparación. `ocx status`, `ocx doctor`, y
`ocx codex-shim status` también omita la reparación automática de la shim e informe el estado observado. Un lanzador que todavía está cambiando se deja intacto y se vuelve a intentar más tarde. Fallas de reparación advierten sin fallar el pedido comando; fallback manual: `ocx codex-shim install`. Establecer `codexShimAutoRestore` a `false`, o establecer
`OPENCODEX_CODEX_SHIM_AUTO_RESTORE=0` para una opción de exclusión a nivel de proceso.

El contenedor Unix conserva su ruta nativa de lanzador registrada. Los cambios en el gestor de paquetes detrás de eso La entrada duradera se sigue automáticamente; la eliminación de esa entrada requiere la reparación del gestor de paquetes. Los lanzadores de administradores de comandos dinámicos todavía tienen que pasar la validación anterior. Windows reparación in situ necesita el original guardado al lado de la shim; si un gestor de versiones destruye todo el árbol y la copia de seguridad, OpenCodex informa de la condición y se detiene en lugar de inventar un original de reemplazo.

Si el lanzador del gestor de versiones no puede pasar la validación, enruta a través de la configuración Codex en lugar de la lanzador: `ocx start` escribe `openai_base_url`, y `ocx service install` proporciona autoarranque. Correr
`ocx status` para confirmar — informa el enrutamiento activo y advierte cuando un proxy en ejecución no es el un Codex es señalado.

| Subcomando | Acción |
| --- | --- |
| `install` | Instalar la shim (o reparar si es rancio). |
| `uninstall` | Elimine los artefactos privados de Unix, dejando intacto el Codex nativo; en Windows, restaure el lanzador original. |
| `remove` | Alias de `uninstall`. |
| `status` | Informe el estado de la shim y si el envoltorio privado está activo en PATH. |

```bash
ocx codex-shim install
ocx codex-shim status
ocx codex-shim uninstall
```

Después de desinstalar Unix, quite la línea de origen del archivo de inicio del shell y reinicie el shell o eliminar la entrada de bin privado de su PATH. Desinstalar elimina el envoltorio propio, entorno de shell archivo y estado; deja el lanzador de administrador de paquetes intacto. Una shim Unix más antigua en el lugar es publicado utilizando sus datos de restauración registrados.

:::note[Entorno del token en Windows]
Windows CMD y las shims PowerShell recientemente generadas restauran el número de la persona que llama `OPENCODEX_API_AUTH_TOKEN` Después de la ejecución. Codex y sus procesos secundarios aún pueden heredar el token.

Después de actualizar OpenCodex, vuelva a crear una shim Windows existente con `ocx codex-shim uninstall` seguido por `ocx codex-shim install` para obtener este comportamiento. Una actualización ordinaria no reescribe una shim Windows saludable.
:::

:::tip[Servicio y shim]
Uso `ocx service` para un proxy de fondo siempre activo (recomendado). Uso `ocx codex-shim` por arranque ligero bajo demanda sin un demonio — el proxy se inicia solo cuando `codex` es lanzado.
:::

<a id="token-injection-into-codex"></a>

#### Inyección de token en Codex

En una unión no loopback el proveedor inyectado lleva `env_key = "OPENCODEX_API_AUTH_TOKEN"`. Eso línea le dice a Codex qué variable leer; no la crea. Codex se niega a iniciar una solicitud Cuando falta la variable (`Missing environment variable: OPENCODEX_API_AUTH_TOKEN`), y el proxy nunca se alcanza. El valor vive en `$OPENCODEX_HOME/service-api-token`; el proceso de lanzamiento debe suministrarlo en el entorno de Codex.

Utilice la shim mantenida instalada por `ocx codex-shim install`. Cuando el contexto de lanzamiento se resuelve esta shim, lee el archivo token creado por OpenCodex y suministra la variable a Codex. Los lanzamientos de escritorio, cron y servicio deben usar una ruta PATH o launcher que seleccione la shim; La instalación no configura esos entornos automáticamente. Procesos hijo propios de Codex puede heredar el token.

No exporte este portador token desde un archivo de inicio de shell ni lo copie en `config.toml`. Los
`service-api-token` archivo contiene el token sin procesar, no `NAME=value` asignaciones, por lo que no se puede utilizar directamente como un sistema `EnvironmentFile=`.

Un `EnvironmentFile=` o `OCX_API_TOKEN_FILE` on `opencodex-proxy.service` configura el proceso proxy solo y nunca fluye hacia un lanzado independientemente `codex exec`.

Las actualizaciones de Unix package-manager dejan el envoltorio privado intacto. Una envoltura ejecutable que es **no activo** no inyecta el token: obtiene el archivo de activación impreso en el shell de inicio. En Windows o con una shim en el lugar anterior, una actualización de Codex que reemplaza el lanzador elimina la shim; en Windows el siguiente ordinario `ocx` comando restaura (Ver arriba), pero a `codex exec` que corre antes de que eso falle. `ocx doctor` informa de esta exacta estado bajo "Codex env_key preparación de lanzamiento" (env_key configurado, variable sin establecer, calza faltante o no saludable, archivo token presente) con reparación o guía de activación, y nunca imprime el token. Leyendo el token El archivo no es parte de la inyección `env_key` contrato; el proceso de lanzamiento debe suministrar esa variable.

### `ocx tray <install|start|stop|status|uninstall|remove> [--json] [--no-start]`

Instale y controle el icono de la bandeja de estado Windows. Se inicia en el inicio de sesión Windows y proporciona un solo clic Controles proxy. `start` y `stop` controlar el icono solamente; utilice su menú para controlar el proxy.
`--no-start` se aplica a `install` e instala la bandeja sin lanzarla inmediatamente. En desuso: la aplicación de escritorio OpenCodex proporciona la bandeja en Windows, macOS y Linux; `ocx tray`
permanece para las instalaciones sin la aplicación de escritorio. Cuando se conoce una versión de paquete más reciente, la bandeja agrega un punto azul a su icono y muestra en línea, advertencia o sin conexión. **Actualización disponible**. La bandeja comprueba su insignia local almacenada en caché aproximadamente una vez por minuto; los resultados obsoletos o no disponibles eliminan el punto. El elemento de menú abre el panel, donde puede iniciar la actualización del paquete. No se instala automáticamente.

<a id="dashboard"></a>

## Panel

### `ocx gui`

Abrir el [panel web](/es/guides/web-dashboard/) en `http://localhost:<port>` — o en
`http://127.0.0.1:<management port>` cuando se habilita la entrada de administración de concentrador — Si no se está ejecutando.

<a id="updating"></a>

## Actualización

`ocx update` actualiza la propia OpenCodex; no actualiza la Codex CLI. Utilice el
[comandos de inspección del sistema](/es/reference/cli/agents/) para inspeccionar el candidato configurado Codex CLI con inspección limitada de procedencia de solo lectura. `ocx system codex-cli-update check` No consulta a registro de paquetes o instalar una actualización.

### `ocx update [--tag latest|preview]`

Las instalaciones independientes compiladas, incluido el paquete de escritorio Windows MSI, se actualizan a través **Buscar actualizaciones…** en el Escritorio OpenCodex, o reinstalando el binario independiente desde [Lanzamientos de GitHub](https://github.com/lidge-jun/opencodex/releases). `ocx system update check` informes `installer: "standalone"`, `canUpdate: false`, y `reason: "standalone_install"` con esa orientación. `ocx update` sale sin éxito con la misma pista; no ejecuta una actualización de gestor de paquetes para el ejecutable compilado. Una verdadera fuente de comprobación todavía informa `installer: "source"` y `reason: "source_checkout"`.

Cuando OpenCodex se instala a través de mise, este comando sale sin éxito antes de detener el proxy o cambiar los archivos del paquete y muestra `mise upgrade <tool>`, utilizando el alias local verificado mise. Las comprobaciones de actualización permanecen disponibles e informan la instalación como administrada externamente. Un registro de propiedad de mise ilegible o inconsistente no se cierra sin adivinar un nombre de herramienta, y `--tag preview` nunca cambia la selección configurada de mise.

En Linux, un servicio en segundo plano cuyo lanzador registrado es el lanzador de paquetes de mise (`<tool>/latest/node_modules/.bin/ocx`, no es una mise shim) sigue `mise upgrade` por sí mismo: dentro de unos diez segundos de la nueva versión se establece, drena las solicitudes activas y se reinicia en ella, y se recupera de la misma manera si mise poda más tarde la versión que estaba ejecutando. En macOS, para un servicio instalado a través de una shim de mise, y para un proxy en primer plano, reinicie el servidor después de actualizar (en macOS, `ocx service repair` primero).

Auto-actualización opencodex de npm. Uso de instalaciones estables `@latest`; vista previa de las instalaciones `@preview`
A menos que pases `--tag latest|preview`. Detecta una comprobación de origen y le dice que
`git pull && bun install` en su lugar, y es un no-op si ya está en la versión más reciente para eso etiqueta. Antes de detener cualquier cosa, las instalaciones de npm ejecutan una propiedad y acceso a la caché Unix limitada Compruebe. Los enlaces simbólicos anidados se comprueban con `lstat` pero no seguido; Windows explícitamente se salta esto Solo cheque Unix. Un error se aborta mientras la bandeja y el proxy siguen ejecutándose. Un proxy es luego se detiene antes de que los archivos sean reemplazados; un servicio instalado se reconstruye y se inicia automáticamente, mientras una instalación en primer plano imprime `ocx start` como el siguiente paso. Registros de actualización del panel de control redactar rutas de perfil/caché y valores UID/GID antes de que persistan. Cuando la dirección IP literal de un oyente detenido deja caer el dial de Liveness en lugar de rechazarlo (por ejemplo, en una red de cola), el actualizador intenta brevemente vincular esa misma dirección y puerto. Un enlace exitoso confirma la ausencia en ese instante; un enlace fallido o un nombre de host no concluyente La sonda sigue impidiendo la actualización.

En Windows, el valor predeterminado de Scoop `nodejs` y `nodejs-lts` `npm` Las instalaciones se pueden utilizar del directorio de inicio del usuario cuando su `current` La unión se queda dentro de la aplicación Node directorio; el valor predeterminado persistente `bin` También se admite el directorio. Corriendo dentro esa instalación (incluyendo su directorio de versión resuelta o persistente `bin`), proyecto-local `npm`, `NO_JUNCTION` entradas de directorio de versión y raíces Scoop personalizadas Bajo el hogar quedan excluidos.

Si el paso de instalación falla, la versión anterior permanece instalada y se reinicia su servicio; el la salida del terminal nombra el siguiente paso, y [Fallo de actualización en Windows](/es/troubleshooting/update-failed/)
cubre terminar la actualización y las carpetas que un intento fallido puede dejar atrás.

```bash
ocx update
ocx update --tag preview
```

Las nuevas versiones estarán disponibles cuando el [Liberar el flujo de trabajo](https://github.com/lidge-jun/opencodex/actions/workflows/release.yml)
los publica en npm.

<a id="save-cleanup-thresholds-without-starting-a-cleanup"></a>

## Ahorre umbrales de limpieza sin iniciar una limpieza

```bash
ocx storage policy show --json
ocx storage policy set --archived-bytes-over 1073741824 --reduce-to-bytes 536870912 --json
ocx storage policy show --json
```

El setter escribe anidado `trigger.archivedBytesOver` y un objetivo. Valores de bytes son enteros no negativos seguros. Alternativamente, elija `--remove-oldest-percent 10`
o legado `--percent 10`; las dos banderas de porcentaje y las banderas de reducción son mutuamente Exclusivo. Los porcentajes de CLI son enteros con rango compatible con el servidor 1–100. Se omite `--enabled` deja el valor almacenado sin cambios; los valores explícitos son `true`
y `false`. Set no ejecuta limpieza, pero se mantiene un horario ya habilitado en vigor. No agregue habilitar o ejecutar una política inmediata a menos que esté previsto.

El recibo del nuevo campo es `{ok:true,policy,job:{status}}`con el disparador observado, objetivo, modo, programación y hechos opcionales de última/siguiente ejecución. `job.status` describe un estado inactivo/ejecutado, no una limpieza iniciada por este comando. Vuelve a leer un resultado desconocido en lugar de reproducir la escritura.

<a id="forced-link-revoke-and-remote-recovery"></a>

## Revocación de enlace forzado y recuperación remota

Solo cuando se pretenda explícitamente omitir la limpieza remota, use el ID de enlace (`lnk_0123456789abcdef` abajo es ficticio):

```bash
ocx link revoke --link-id lnk_0123456789abcdef --force --yes --json
```

`--force` requiere `--yes`; `--yes` Sólo es inválida. La revocación ordinaria no cambia. Vuelve el éxito forzado `{linkId,remoteCleanup:"skipped",recovery}`. Idempotente link-not-found en lugar de informes `remoteCleanup:"unverified"`. Ambos pueden salir de 0; estos hechos se derivan de la intención CLI, no un informe de limpieza del servidor. Tampoco significa La desconexión remota se intentó o confirmó. Siga las instrucciones de recuperación,
`ocx disconnect` en el cliente remoto, cuando esa acción está autorizada.

<a id="observe-remote-workspace-from-the-hub"></a>

## Observar el espacio de trabajo remoto desde el Hub

```bash
ocx remote-workspace hub status --json
ocx remote-workspace hub runtimes --json
ocx remote-workspace hub sessions --json
```

Estas lecturas de administración fija están separadas del ejecutor-local
`ocx remote-workspace status`. La disponibilidad en entorno de ejecución es un objeto clave; un Hub sin dispositivos/sesiones es un éxito vacío. La observación del Hub discapacitado puede llegar como HTTP 200 con `available:false` pero sale 1; no es un éxito vacío. Interior HTTP 409 sale 5. Nunca registra dispositivos, crea sesiones ni envía mensajes. Véase [Observación y recuperación del Hub](/es/guides/remote-workspace/#inspect-the-hub-without-starting-a-session).

<a id="remote-hub-client-lifecycle"></a>

## Ciclo de vida del cliente de Remote Hub

Uso `ocx connect <url> --pairing-code-stdin`, `ocx connect status`, `ocx sync`, y `ocx connect rotate --pairing-code-stdin`. La descarga del catálogo inicial falla después de cinco segundos sin bytes entrantes, pero las transferencias activas pueden ejecutarse por más tiempo; use `--catalog-timeout <seconds>` (1–120) para anular esa ventana de inactividad. `ocx disconnect` restaura el estado local sin conexión y no revoca la clave de concentrador. Mientras que sólo están conectados, `ocx connect revoke --admin-token-stdin` Revoca el persistente `apiKeyId`; después de la desconexión utilice el concentrador **Conecte las teclas → API** página. Los secretos son solo Stdin y nunca pertenecen a Argv.

<a id="setup-port-validation"></a>

## Validación del puerto de configuración

`ocx init` acepta los puertos TCP 1–65535 como números enteros decimales. Presione Enter para usar 10100. Entradas no válidas como `0`, `10100oops` o `1.5` nunca se reemplaza o trunca silenciosamente; la configuración lo informa y vuelve a solicitar el puerto.

<a id="login-registration-diagnostics"></a>

## Iniciar sesión registro diagnósticos

En Linux, `ocx service install` controles `loginctl show-user <current-user> -p Linger` antes de imprimir el consejo de arranque. La demora habilitada se informa como ya habilitada. La persona discapacitada se queda con el `loginctl enable-linger $USER` hint; los diagnósticos faltantes o ilegibles indican la incertidumbre y no fallan la instalación.

En macOS, `ocx service status` distingue un elemento de inicio de sesión de escritorio cargado de un registro válido habilitado en espera del siguiente inicio de sesión. `ocx status` acredita a este último en la seguridad de reinicio cuando la misma aplicación de escritorio supervisa actualmente el proxy. Una etiqueta o comando de lista incorrecto, una entrada deshabilitada, una sonda de carga no verificada o una identidad de proceso cambiada aún no pueden obtener protección.

<a id="custom-codex-provider-consent"></a>

## Consentimiento personalizado del proveedor Codex

`ocx codex-provider status` enumera los ID de proveedor aprobados para la casa Codex seleccionada.
`ocx codex-provider allow <id>` pregunta antes de permitir la administración solo de URL en inicio/sincronización;
`--yes` es el consentimiento explícito no interactivo para ese proveedor nombrado.
`ocx codex-provider revoke <id>` restaura un URL administrado sin cambios y revoca el permiso. Estos comandos son locales y no requieren un proxy en ejecución. Véase
[enrutamiento de proveedor personalizado](/es/guides/codex-integration/#opt-in-a-custom-provider-to-managed-local-routing)
para la elegibilidad, restaurar el comportamiento y la preservación del transporte.
