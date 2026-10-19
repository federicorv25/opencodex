---
title: "Espacio de trabajo remoto"
description: "Mantenga Codex, Claude Code, Pi y sus inicios de sesión en un concentrador OCX mientras que los equipos solo OCX proporcionan el espacio de trabajo y el entorno de compilación."
---

Para enlaces de máquina SSH, vea [Enlace remoto](/es/guides/remote-link/).

El espacio de trabajo remoto permite que un concentrador OpenCodex ejecute sus agentes de codificación mientras que otro equipo suministra el archivos de proyecto, comandos, pruebas y compilación. Un teléfono o una tercera computadora puede controlar la sesión. a través del panel de Hub.

```text
Phone browser -> Computer 1 OCX Hub -> encrypted channel -> Computer 2 OCX Executor
                 Codex / Claude / Pi                       project and commands
                 logins and sessions                      no coding CLI login
```

El Ejecutor solo necesita OpenCodex. No necesita Codex, Claude Code, Pi, un inicio de sesión ChatGPT o una proveedor API clave. Abre un WebSocket saliente al concentrador, por lo que el Ejecutor no necesita ningún puerto público o puerto del router.

:::caution[Base experimental]
El espacio de trabajo remoto es opt-in y no un despliegue de producción. Linux ofrece herramientas de archivo y condicionales Ejecución de comandos bubblewrap. Windows y macOS solo ofrecen herramientas de archivo: su nativo oficial Los ayudantes rechazan las solicitudes de sonda y comando. Los comandos Windows permanecen sin soporte hasta que se verifique El propietario del ciclo de vida puede retener la autoridad de limpieza a través de la cancelación. Falta apoyo de comando nunca En el siguiente paso.
:::

<a id="rpc-compatibility-and-timeouts"></a>

## Compatibilidad con RPC y tiempos de espera

El espacio de trabajo remoto utiliza cifrado RPC v2. El Hub y cada Ejecutor deben soportar v2; RPC pares v1 Falla cerrada en lugar de caer de nuevo a la ejecución inmediata, por lo que actualizar el concentrador y ejecutores Juntos.

Un tiempo de espera solicita la cancelación del ejecutor, pero no lo confirma. Una subvención ya puede estar en tránsito, o su funcionamiento puede estar ya en marcha. El tiempo de espera predeterminado de RPC es de 65 segundos, y `timeoutMs`
acepta valores inclusivos de 1 a 120,000 milisegundos.

<a id="set-up-the-hub"></a>

## Configurar el Hub

El ordenador 1 posee cada inicio de sesión de agente de codificación y cada sesión de modelo. Instalar e iniciar sesión en cualquiera de los agentes que desea usar allí, luego ejecute OpenCodex como un concentrador:

```bash
ocx config set runtimeRole hub
OCX_REMOTE_WORKSPACE_ENABLED=1 ocx start
ocx gui
```

Establecer `OCX_REMOTE_WORKSPACE_ENABLED=1` en el proceso de Hub mismo; configurándolo solo para un panel El comando no habilita un servicio ya en ejecución. Un Hub sin devoluciones explícitas desactivadas estado sin crear claves de espacio de trabajo ni sondear los tiempos de ejecución del agente de codificación.

Utilice una implementación HTTPS autenticada al abrir el panel de control desde un teléfono u otro equipo. Véase [Despliegue de Remote Hub](/es/guides/remote-hub/) para la gestión-ingreso compatible y Tailscale patrón. No publique un puerto de panel local no autenticado.

Codex Remote Workspace utiliza los perfiles de permisos actuales del servidor de aplicaciones. Si el Hub seleccionado Codex configuración sigue estableciendo legado `sandbox_mode` o `sandbox_workspace_write`, los informes del panel de control Codex como no disponible en lugar de comenzar con un límite más débil. Migrar ese perfil Codex antes usando la función; no configure tanto el sandbox heredado como un perfil de permisos.

<a id="inspect-the-hub-without-starting-a-session"></a>

## Inspeccione el Hub sin iniciar una sesión

```bash
ocx remote-workspace hub --help
ocx remote-workspace hub status --json
ocx remote-workspace hub runtimes --json
ocx remote-workspace hub sessions --json
```

Estos utilizan el concentrador de gestión en ejecución seleccionado. Existentes `remote-workspace status`
Sigue leyendo el estado del ejecutor local. Retornos de estado
`{available:true,devices,runtimes,sessions}`; entorno de ejecución devuelve
`{runtimes:{codex:{available,...},claude:{available,...},pi:{available,...}}}`; Sesiones de retorno `{sessions:[...]}`. La disponibilidad en entorno de ejecución es un objeto, no un array, y comprobarlo puede probar la disponibilidad ejecutable. Las raíces del dispositivo exponen los ID y etiquetas, no rutas del sistema de archivos Ejecutor. Las sesiones incluyen eventos públicos recientes; La salida del terminal humano escapa a los caracteres de control.

Un concentrador disponible con el dispositivo/sesión vacío muestra las salidas 0. Cuando la activación de Hub es apagado, el despachador exterior puede devolver HTTP 200 con `available:false`, dispositivos vacíos y sesiones, y `runtimes:{}`. El CLI emite esa estrecha observación no disponible con una instrucción Hub/activación fija y salidas 1. No se presenta no disponible como un éxito vacío. Un HTTP 409 interno sin hub devuelve la salida 5 con orientación stderr; cliente-role, transporte y respuestas mal formadas también siguen siendo fallas.

Compruebe el Hub previsto y su `OCX_REMOTE_WORKSPACE_ENABLED=1` Activación cuando no disponible; no cambie silenciosamente la configuración como recuperación. Estas observaciones no autorice ni realice emparejamientos, creación de sesiones, solicitudes, revocación o Cambios de confianza. Esos siguen siendo los flujos de trabajo separados del panel de control / sesión a continuación.

<a id="pair-an-executor"></a>

## Emparejar a un ejecutor

1. Empareje el navegador con Hub a través del panel de control. Ejecute el programa
   `ocx gui pair --origin` comando en el Hub e introduzca su código de un solo uso; automáticamente bootstrapped local o Tailscale sesión puede ver el estado, pero no puede controlar el espacio de trabajo remoto.
2. Abrir **Espacio de trabajo remoto** en ese panel de Hub emparejado.
3. Seleccionar **Crear código de emparejamiento**.
4. En el equipo 2, cambie al directorio del proyecto que desea exponer.
5. Copie el archivo generado **Terminal de Linux / macOS** o **Windows PowerShell** comando para esa computadora. Parea el directorio actual y mantiene
   `ocx remote-workspace agent` conectados en ese terminal.

El flujo manual equivalente es:

```bash
cd /path/to/project
printf '%s\n' 'ONE-TIME-CODE' | ocx remote-workspace pair 'https://your-hub.example' \
  --pairing-code-stdin --root "$PWD"
ocx remote-workspace agent
```

En PowerShell Windows, utilice el comando que se muestra en el panel. La forma manual equivalente es:

```powershell
$pairingCode = 'ONE-TIME-CODE'
$pairingCode | ocx remote-workspace pair 'https://your-hub.example' `
  --pairing-code-stdin --root (Get-Location).Path
if ($LASTEXITCODE -eq 0) { ocx remote-workspace agent }
```

El actual OCX Bun ejecutable se agrega como un archivo de solo lectura al Linux Si el proyecto necesita una cadena de herramientas instalada por el usuario fuera de las rutas del sistema, empareje explícitamente sin exponer el resto del directorio principal:

```bash
printf '%s\n' 'ONE-TIME-CODE' | ocx remote-workspace pair 'https://your-hub.example' \
  --pairing-code-stdin --root "$PWD" \
  --toolchain-root "$HOME/.nvm/versions/node/v24/bin"
```

La fuente de ayuda nativa está empaquetada para su revisión. Construirlo no habilita Windows o macOS Los comandos en este carry. `--executor-helper` sigue siendo un selector de ayuda revisada; existencia binaria o una ruta configurada no prueba soporte de comandos.

El código de una sola vez se lee de la entrada estándar, no de los argumentos de la línea de comandos. El emparejamiento crea un local clave de firma del dispositivo y un portador con alcance de dispositivo. El Hub almacena solo su hash y nunca recibe el verdadero camino Ejecutor. Detener el agente en primer plano con Ctrl + C; ejecutarlo nuevamente vuelve a conectar el mismo dispositivo.

Compruebe la inscripción local sin imprimir secretos:

```bash
ocx remote-workspace status
```

<a id="start-a-remote-coding-session"></a>

## Iniciar una sesión de codificación remota

En el panel de control, elija:

1. el ordenador en línea;
2. una carpeta de espacio de trabajo aprobada localmente;
3. Codex, Claude Code o Pi desde el Hub; y
4. un modo de acceso.

**Solo lectura** es el valor predeterminado y expone la lista de directorios y la lectura de archivos. La opción de escritura es Se muestra como **Editar archivos y ejecutar comandos** solo cuando ese Ejecutor pasó una sonda de caja de arena de comandos; De lo contrario, se muestra como **Editar solo archivos**. El panel muestra dos ubicaciones separadas para que que el modelo y el inicio de sesión permanezcan en el concentrador mientras las operaciones del espacio de trabajo se ejecutan en el computadora.

Envía mensajes desde el panel de Hub en el ordenador 1, el ordenador 3 o un teléfono. La sesión no se puede cambiar a otra computadora o carpeta en silencio. Si el Ejecutor se desconecta, la sesión entra
**Ejecutor offline** y nunca vuelve al sistema de archivos del Hub.

La presentación inmediata reconoce la aceptación de inmediato; el panel de control sondea la sesión para el progreso y la finalización. Si se pierde el acuse de recibo, el borrador permanece visible con un aviso de envío desconocido. Compruebe el progreso de la sesión antes de volver a enviarla; el panel nunca vuelve a intentar un mensaje automáticamente.

**Detener** permanece disponible mientras se ejecuta un mensaje. Interrumpe el giro del agente de codificación Hub, cancela un comando activo de Ejecutor y evita que una respuesta tardía vuelva a abrir el comando detenido sesión.

<a id="work-with-sessions-side-by-side"></a>

## Trabajar con sesiones lado a lado

La lista de sesiones de la izquierda abre una sesión en el panel enfocado. Arrastre una sesión hacia la izquierda, borde derecho, superior o inferior de otro panel para dividir el área de conversación. Puedes mostrar hasta Cuatro sesiones diferentes a la vez. Una sesión ya visible se mueve entre paneles en lugar de Abrir un compositor duplicado.

Uso **Dividir a la derecha** o **Dividir a continuación** junto a una sesión para la alternativa accesible por teclado. Arrastre un divisor para cambiar el tamaño de los paneles, o enfoque el divisor y use sus teclas de flecha. **Home** y
**Fin** establecer el divisor en su tamaño mínimo y máximo. Cada sesión mantiene su propio borrador, estado de envío y acción Stop, por lo que un turno pendiente en un panel no Bloquear una sesión diferente. **Cerrar panel** cambia el diseño solamente; no detiene la sesión.

El diseño del panel se restaura para este Hub en el mismo navegador. Solo identificadores de sesión y panel Se guardan las posiciones y los tamaños de los divisores; el texto borrador y la salida del modelo no se escriben en el almacenamiento del navegador. Recarga la página borra los borradores no enviados. En pantallas de hasta 760px de ancho, los paneles se apilan verticalmente sin redimensionar los divisores; las posiciones divididas y los tamaños guardados regresan cuando la pantalla es más ancha.

Esta vista es compartida por el panel del navegador y el panel de escritorio OpenCodex. Usuarios de CLI puede abrir el panel con `ocx gui` y seleccione **Espacio de trabajo remoto** después de su configuración normal de Hub. No cambia la interfaz del terminal de `codex` o el diseño de la conversación dentro del separado oficial ChatGPT/Codex aplicación de escritorio.

<a id="restart-and-reconnect-behavior"></a>

## Reiniciar y reconectar el comportamiento

El concentrador mantiene los metadatos de sesión limitados y una pequeña instantánea de evento reciente. Después de reiniciar un Hub, una sesión inacabada espera a su Ejecutor original. Una vez que el dispositivo se vuelve a conectar, el siguiente reanuda el subproceso Codex original, la sesión Claude Code o el ID de sesión Pi.

Claude Code crea su historial duradero en el primer mensaje completado. Si el Hub se detiene antes de nueva sesión Claude ha completado cualquier mensaje, no hay conversación para reanudar; iniciar una nueva sesión sesión en su lugar.

Un manifiesto de capacidad cambiado no debilita silenciosamente una sesión existente. Iniciar una nueva sesión si el Ejecutor pierde la contención del comando o cambia sus herramientas disponibles. Revocar una computadora cierra su Socket y detiene las sesiones vinculadas a él.

<a id="security-boundaries"></a>

## Límites de seguridad

- Las credenciales del proveedor y el historial de agentes de codificación permanecen en el concentrador.
- Las claves privadas del ejecutor, el portador del dispositivo y las rutas raíz reales permanecen en su estado OCX exclusivo del propietario.
- Los errores de código de emparejamiento están limitados por par observado en cada oyente. Diez códigos fallidos en diez minutos devuelven un genérico `429` con `Retry-After`; el Hub solo conserva límites, expirando hashes de esas identidades de origen. Los usuarios de Tailscale Serve comparten el bucle de retorno del oyente de la administración bucket porque un llamador local directo podría forjar su encabezado de identidad.
- Cada sesión de trabajo utiliza un protocolo efímero P-256 ECDH firmado por Ed25519 y ordenado AES-256-GCM mensajes.
- Un socket no se muestra como en línea hasta que ambas partes estén de acuerdo en su manifiesto de capacidad actual.
- La reconexión puede eliminar una capacidad cuando su sandbox local no está disponible, pero nunca agrega una función. capacidad fuera de la subvención registrada en el emparejamiento.
- Cada solicitud está vinculada a un hilo de modelo, dispositivo, raíz, modo de acceso y conjunto de capacidades.
- Las rutas son relativas, canónicas, limitadas y rechazadas en enlace simbólico, unión o directorio padre. Escapar. Se deniegan los nombres de dispositivos Windows, flujos de datos alternativos y alias de espacio/punto final.
- Las operaciones del ejecutor se serializan, las identidades de archivo abiertas se vuelven a verificar y los hashes de escritura se Verificar inmediatamente antes de la sustitución atómica. Reemplazar una raíz aprobada requiere emparejamiento de nuevo, y las raíces de la cadena de herramientas se revalidan antes de cada comando.
- Las lecturas/escrituras de archivos rechazan los archivos vinculados. Antes de la ejecución del comando, OCX escanea como máximo 250.000 entradas de espacio de trabajo y desactiva la ruta de comando si alguna entrada que no sea de directorio tiene varios enlaces; path sandboxes no puede probar si el otro nombre para ese inodo está fuera de la raíz aprobada.
- Los comandos Linux se ejecutan a través de bubblewrap con un espacio de trabajo escribible, entorno despejado, privado espacios de nombres de proceso, el ejecutable actual OCX Bun como un archivo de solo lectura, salida limitada y tiempo de espera, y la red desactivada por defecto. Las pruebas de confinamiento específicas requieren una Entorno alojado configurado; una suite genérica verde no prueba que se ejecutaron.
- macOS solo anuncia herramientas de archivos. Un grupo de procesos no puede contener un descendiente después de llamar
  `setsid()`, e importar un amplio perfil del sistema de cinturón de seguridad de Apple simplemente para iniciar un comando sería Exponer la autoridad de servicio de host no relacionada. Por lo tanto, el ayudante nativo rechaza tanto su sonda como dirigir las solicitudes de comando hasta que OCX tenga un propietario de contención descendiente estrecho y revocable.
- Las solicitudes de comandos nativos Windows y macOS fallan. Sus pruebas de rechazo de la ayuda directa deben ser distinguirse de las pruebas de confinamiento de mando en funcionamiento; La aceptación del comando Windows está abierta.
- El ayudante nativo anclado debe estar fuera de cada espacio de trabajo escribible aprobado. OCX comprueba esto tanto antes del soporte de comandos publicitarios e inmediatamente antes de cada comando, por lo que el código del espacio de trabajo no puede reemplazar el binario que impone su siguiente sandbox.
- Detener una sesión cancela un comando activo de Ejecutor y limpia el proceso del modelo Hub y puente de herramienta loopback. Windows detiene el árbol de procesos propio de la envoltura npm en lugar de Nodo niño detrás; Linux y macOS fuerza de parada un CLI solo si ignora la elegante ventana de parada.

El Hub ve intencionadamente mensajes y salidas del modelo porque ejecuta el agente de codificación. De extremo a extremo El cifrado protege las cargas útiles de Executor RPC. Se confía en el concentrador emparejado para seleccionar raíces aprobadas sobre autenticado WSS; no es ciego a su propia conversación de modelo.

<a id="current-scope"></a>

## Alcance actual

Remote Workspace no copia ni sincroniza credenciales con otros equipos. Está separado de Enrutamiento del proveedor de Remote Hub y desde cualquier futuro producto de computación o Super Sync alojado. Una producción lanzamiento todavía requiere firmado Windows helper embalaje, prueba nativa de CI en los binarios exactos, revisión independiente del mantenedor, y una verdadera ejecución de aceptación de tres computadoras.

<a id="prompt-acceptance-api"></a>

## Rápida aceptación API

`POST /api/remote-workspace/sessions/:id/prompt` devuelve HTTP 202 con la instantánea de sesión aceptada. Su ID de sesión y la secuencia de eventos monotónicos identifican la instantánea de aceptación; 202 no significa que el modelo se haya completado. Encuesta `GET /api/remote-workspace/sessions` para eventos posteriores y estado de la terminal. Reconectar y reanudar el entorno de ejecución permanecen ocupados mientras ese turno está activo. Un acuse de recibo perdido deja la aceptación desconocida, por lo que los clientes deben encuestar antes de elegir si enviar nuevamente.
