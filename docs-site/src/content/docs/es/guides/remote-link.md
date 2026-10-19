---
title: "Enlace remoto"
description: "Conecte una computadora OpenCodex Home a una computadora Child a través de SSH."
---

Un enlace de máquina conecta un OpenCodex **Home** ordenador a **Child** ordenador sobre SSH. El Home sirve al Child a través del túnel SSH, mientras que ambos equipos mantienen su servicio local OpenCodex en el puerto `10100`. El panel transfiere la clave de enlace por hijo a través de SSH, por lo que no escribe un token.

<a id="requirements"></a>

## Necesidades

- La computadora Home puede iniciar sesión en la Child con una clave OpenSSH.
- Para un enlace iniciado por Child, el Child puede iniciar sesión en Home con una clave OpenSSH (no se admite el inicio de sesión con contraseña).
- OpenCodex 2.66.0 o posterior está instalado en el equipo Child y en Home para un enlace iniciado por Child.
- Ambos equipos ejecutan macOS o Linux.
- El panel de control que agrega un Child desde Home se abre en el propio Home o a través de una sesión Hub emparejada. Convertir el equipo actual en un Child requiere una sesión de panel emparejada con el operador; una sesión de panel local sin credenciales no puede confirmar ese cambio de enrutamiento.

Contraseña SSH y Windows están fuera del flujo actual. Se puede iniciar un enlace desde cualquier lado: desde el Home, como se describe a continuación, o desde el Child, como se describe en [Conecte este equipo como un Child](#connect-this-computer-as-a-child).

<a id="add-a-child-from-remote"></a>

## Añadir un Child de `#remote`

1. Abra el panel de control en `#remote` y activar el enlace remoto.
2. Seleccionar **Home**Entonces, **Continuar**. Se abre la lista de hosts SSH.
3. Elija un host de los candidatos SSH o introduzca un alias de configuración SSH.
4. Ejecute la prueba de conexión y compare la huella dactilar del host ofrecida con la huella dactilar de la máquina que desea utilizar. Compararlo ayuda a detectar un host incorrecto o una clave de host cambiada antes de que SSH confíe en el host.
5. Confirme la huella digital y luego conecte el Child.

El panel de control no le pide que ingrese un token. Primero sondea el host y no puede aplicar el enlace hasta que confirme explícitamente la huella digital.

La hoja Agregar Child explica que el Child utiliza los proveedores de este Home sobre SSH y enumera los requisitos previos anteriores. Los alias de host vienen de `~/.ssh/config` en el Home que ejecuta OpenCodex, no necesariamente la computadora que muestra el navegador. Si el descubrimiento tiene éxito sin hosts, agregue un `Host` entrada como esta, luego elige **Volver a buscar equipos**. También puede introducir un alias existente manualmente; seleccionar o introducir un alias permite **Conexión de prueba**. La hoja enlaza con esta guía.

```sshconfig
Host devbox
  HostName devbox.example.com
  User you
  IdentityFile ~/.ssh/id_ed25519
```

Si el descubrimiento falla, la hoja muestra **No se pudo cargar los hosts SSH**, el motivo de la solicitud disponible y **Reintentar**, en lugar de reclamar que la lista de hosts está vacía. Un error de prueba de conexión mantiene su razón específica y la pista SSH desinfectada en la hoja activa, no duplicada detrás de ella. Compruebe la razón, utilice el diagnóstico SSH en Solución de problemas a continuación cuando sea relevante y vuelva a intentarlo. El rescanning mantiene el alias ingresado pero requiere una nueva revisión de huellas dactilares antes de conectarse.

<a id="connect-this-computer-as-a-child"></a>

## Conecte este equipo como un Child

En el equipo que debería usar los proveedores de Home:

1. Abra el panel de control en `#remote` y activar el enlace remoto.
2. Seleccionar **Child**. Se abre la lista de hosts SSH.
3. Elija el host Home del SSH, ejecute la prueba de conexión, luego compare y confirme su huella digital del host.
4. Lea el aviso y elija **Conectar como Child**.

La conexión reinicia OpenCodex en este equipo. Los giros Codex que ya se están ejecutando terminan primero, y las nuevas solicitudes pueden fallar hasta un minuto mientras se reinicia. El panel de control se recarga por sí mismo y muestra el enlace Child. Codex sigue usando `http://127.0.0.1:<port>/v1` en este equipo, sin token y sin variable de entorno para establecer: el local OpenCodex retransmite cada solicitud al Home, que le sirve con sus propios proveedores y cuentas.

El Child espera su puerto configurado mientras el proceso anterior lo libera. Si un reinicio administrado por CLI sigue fallando, ejecute `ocx start` en el Child y comprobar `~/.opencodex/restart-handoff.log`. En la aplicación de escritorio, la aplicación inicia y supervisa el reemplazo automáticamente.

Si **Child** dice emparejar esta máquina primero, abrir el loopback literal configurado de esta computadora HTTP Dashboard, por ejemplo `http://127.0.0.1:<configured-port>`. El formulario de emparejamiento local aparece solo cuando falta el emparejamiento y el panel de control y API usan el mismo origen de bucle invertido. Copia el formulario `ocx gui pair --origin "http://127.0.0.1:<configured-port>"` use el origen exacto que se muestra en el formulario; un proveedor puede usar el código de un solo uso en el formulario. API clave o admin token El emparejamiento que falta está separado de un desajuste de puerto configurado.

En un panel de Hub abierto a través de una dirección que no sea loopback, es posible que el navegador no tenga sesión de loopback o que tenga una sesión compartida que no pueda administrar los enlaces de la máquina. Cuando Remote Link informe de ese problema de sesión o permiso, elija **Conecte este panel al concentrador** en la página Enlace remoto para abrir el formulario de emparejamiento único. Ejecute el comando mostrado en el Hub e introduzca su código. La página valida el acceso de enlace remoto de la nueva sesión antes de que cierre el formulario.

Los **Child** rol también requiere un entorno de ejecución OpenCodex independiente que se ejecuta en su puerto configurado, porque el Child se reinicia exactamente en ese puerto. Si el panel de control dice que OpenCodex no se está ejecutando en su puerto configurado, reinicie allí primero.

<a id="link-status"></a>

## Estado del enlace

- **Conectado** significa que el túnel SSH está listo y el Child puede usar el enlace Home.
- **Reconexión** significa que el túnel se está volviendo a intentar. Las solicitudes pueden regresar temporalmente `503` con `Retry-After` mientras el reintento está en progreso. En un Child que se conecta desde su propio panel de control, una solicitud primero espera hasta 15 segundos para que regrese el túnel.
- **Falló** El enlace necesita atención. Compruebe la autenticación SSH, la clave de host confirmada, el reenvío o el motivo de tiempo de espera que se muestra en el panel. El lado que ejecuta el túnel SSH sigue intentando por sí mismo, después del sueño, una interrupción o un reinicio: Home para un Child que agregó, y el Child para un enlace al que se unió desde su propio panel de control. Se reintenta aproximadamente una vez por minuto después de un tiempo de espera o error de reenvío, y cada cinco minutos después de un error de autenticación. Una clave de host cambiada nunca se vuelve a intentar. Para volver a intentarlo de una vez, seleccione **Reintentar** en el panel de control de la Home o ejecutar `ocx link reconnect --link-id <id>` en el Home. Reinicia el túnel de ese enlace sin reiniciar OpenCodex.

Un enlace fallido no cambia silenciosamente a un proveedor local. El Child devuelve un `503` sin reenviar la clave de enlace o solicitud cuando su túnel falla, se detiene o no se supervisa. También mantiene la clave local cuando otro proceso posee el puerto del túnel; libere ese puerto para que el túnel Child del SSH pueda enlazarlo.

<a id="what-a-child-shows-and-manages"></a>

## Lo que un Child muestra y administra

Un Child se ejecuta en los proveedores, cuentas y configuración del Home, por lo que el Home es donde los cambia.

- **Panel.** El panel de control del Child muestra el estado del Home de solo lectura y dice "Administrado por Home <name> sobre el enlace remoto". El panel de control y los proveedores leen el Home a través del enlace, y la franja de uso en el encabezado muestra la cuota del Home. La lista de modelos no se muestra en un Child, ya que su construcción ejecuta el descubrimiento de proveedores en el Home; Codex en el Child ya ofrece los modelos del Home. Por la misma razón, los selectores de modelos de delegación y sidecar en una lista Child los modelos nativos y las opciones actuales de la Home, no la lista de rutas completa de la Home. Guardar un cambio allí se rechaza con un mensaje que nombra el Home; realizar el cambio en el panel de instrumentos del Home. El navegador del Child nunca recibe una credencial Home.
- **Configuración de Codex.** `ocx sync` en el Child (y conectándolo) se aplica la configuración de Codex que administra OpenCodex en el Home: modo rápido, el modo multiagente, el conmutador de sidecar de búsqueda web y el subagente nativo predeterminados cuando el Home los sincroniza. `ocx sync` y `ocx status` listar los valores que provienen de la Home. El esfuerzo de razonamiento predeterminado y los niveles de esfuerzo que se muestran en el selector de modelos de la aplicación Codex son la configuración de la aplicación Codex en cada computadora; OpenCodex no los administra en ningún equipo.
- **CLI.** Comandos que solo leen, como `ocx account list`, `ocx provider quota` y `ocx usage`, lea el Home. Muestran lo que el Home ya ha observado: una lectura de un Child nunca hace que el Home sea un proveedor, refresque un token o inicie un proceso, por lo que los detalles de la cuota y la cuenta son tan frescos como la propia actividad del Home los mantiene. Lee que solo existen para ejecutar el descubrimiento de proveedores o una actualización forzada, como `ocx models live`, `ocx models preset show` y `ocx account list --quota`son rechazados como cambios. Los comandos que cambian la configuración se rechazan con un mensaje que nombra el Home y el enlace y dice que no se envió ninguna solicitud. `ocx status` describe el Home y el enlace. `ocx provider list` y `ocx config get` todavía muestran la propia configuración de este equipo, etiquetada como local e inactiva mientras el equipo está vinculado. `ocx config set`, `ocx config unset` y `ocx config import` escribir localmente, cada uno con la misma nota, y `ocx provider add`, `remove` y `set-default` se rechazan porque esos proveedores no se utilizan mientras están vinculados.

Estas lecturas necesitan una versión OpenCodex con el relé de gestión de enlace remoto tanto en la Home como en la Child. Un Home antiguo responde con un mensaje que le pide que lo actualice.

<a id="remove-a-child"></a>

## Eliminar un archivo Child

Seleccionar **Desconectar** para el Child y confirmar el alias. El Home detiene el túnel, revoca la clave de enlace del Child y elimina el registro de enlace guardado.

Si el Home no puede alcanzar el Child para ejecutar su comando de desconexión, elija **Eliminar aquí solamente**. Esto elimina el túnel local, la clave y el registro. A continuación, inicie sesión en el Child y ejecute:

```bash
ocx disconnect
```

Para desconectar un enlace iniciado por Child, ejecute `ocx disconnect` en el Child. Desconecta el túnel del cliente y revoca el enlace en Home sobre SSH. Si falla la revocación de Home, se imprime: `Home revoke failed; run ocx link revoke --link-id <linkId> on the home.`

<a id="troubleshooting"></a>

## Solución de problemas

Cuando un paso falla, el panel de control muestra la razón y, cuando SSH informó de uno, una breve pista desinfectada de su última línea de error no vacía debajo del mensaje. Los errores de shell remoto pueden aparecer allí incluso cuando el shell remoto emite texto que no es UTF-8; OpenCodex elimina los controles de terminal, las teclas de enlace y las consultas de URL y limita la longitud de la pista.

- **No se pudo conectar al host SSH**: el host debe aceptar su clave SSH sin una solicitud de contraseña; `ssh -o BatchMode=yes <alias> true` Debe tener éxito desde una terminal. A `ProxyCommand` ayudantes como `cloudflared` debe ser instalado en `/opt/homebrew/bin`, `/usr/local/bin`, `~/.bun/bin`, `~/.local/bin` u otro directorio en el PATH OpenCodex se ejecuta con.
- **No se encontró ocx en el equipo remoto**: OpenCodex busca `ocx` en la PATH de una sesión no interactiva SSH primero, luego en `~/.bun/bin`, `~/.local/bin`, `/opt/homebrew/bin` y `/usr/local/bin`. Si está instalado en otro lugar, agregue ese directorio a PATH en un archivo que el shell remoto lee para sesiones no interactivas, como `~/.zshenv` por zsh.
- **OpenCodex en el equipo remoto es demasiado viejo**: run `ocx update` en esa computadora. El enlace remoto necesita 2.66.0 o posterior.
- **El equipo remoto no informó de una versión OpenCodex**: `ocx --version` en ese equipo imprimió otra cosa, por ejemplo el texto de uso de una instalación Windows no compatible.

<a id="security"></a>

## Seguridad

El Child utiliza los proveedores y las credenciales del proveedor de la computadora Home a través del enlace. La Home crea una clave de enlace separada para cada Child; al eliminar el enlace se revoca esa clave. En el Child, la clave permanece dentro de OpenCodex: las credenciales que Codex o Claude Code envían allí no se reenvían al Home, incluidos Bearer, Azure `api-key`, Anthropic-compatible `x-api-key`y Google `x-goog-api-key` formas. Cualquier programa en el Child que alcance `127.0.0.1:<port>` utiliza el Home sin una clave, la misma confianza local que da una instalación independiente. Las páginas web de otros sitios son rechazadas. Compare la huella digital del host antes de la confirmación para que no se acepte por error una máquina incorrecta o una clave de host modificada. Las sesiones del panel de control emitidas desde una identidad de escala de cola no pueden administrar enlaces de máquina.

<a id="cli-reference"></a>

## Referencia CLI

```text
ocx link probe <alias> [--json]
ocx link add <alias> [--expect-fingerprint SHA256:…] [--json]
ocx link port [--json]
ocx link issue --alias <alias> --tunnel-port <port> [--json]
ocx link status [--json]
ocx link revoke --link-id <id> [--json]
ocx link reconnect --link-id <id> [--json]
```

<a id="related-guides"></a>

## Guías relacionadas

- [Despliegue de Remote Hub](/es/guides/remote-hub/)
- [Espacio de trabajo remoto](/es/guides/remote-workspace/)

<a id="relay-authentication-compatibility"></a>

### Compatibilidad con autenticación de relés

Actualice tanto el Home como el Child al actualizar a la autenticación de retransmisión con conexión. Antes de enviar una credencial o cuerpo de enlace de una solicitud retransmitida, la Child verifica la Home en la misma conexión que utilizará para esa solicitud. Una conexión cerrada no se reemplaza silenciosamente. Un Home sin este protocolo provoca un error de autenticación reintentable; actualice el Home y el Child, y vuelva a vincular cuando el enlace almacenado ya no se reconozca. No hay un interruptor de reserva inseguro. Una rotación pendiente API-clave sigue siendo válida hasta que expire o la rotación se confirma o aborta.

Eliminar los drenajes finales de enlace Home pendientes de solicitudes de retransmisión autenticadas antes de liberar su oyente. Detener el proceso aún cancela las conexiones activas. Esto no cambia qué credenciales de llamada se eliminan o qué rutas se pueden retransmitir, y no reemplaza la verificación de clave de host de SSH.


<a id="standalone-pairing-authorization"></a>

### Autorización de emparejamiento independiente

El existente `ocx gui pair --origin <local-origin>` El comando funciona mientras OpenCodex se ejecuta como un servicio en segundo plano. Ejecutarlo bajo la cuenta que posee la casa privada del servicio OpenCodex, a continuación, introduzca el código de un solo uso devuelto en el panel local. No se requiere ningún terminal de servidor, contraseña adicional, Windows Hello o clave de hardware. El servidor CLI debe usar la misma versión actual y configuración inicial; reinicie un servidor anterior después de la actualización. Las invitaciones Hub de versión mixta también requieren actualizar el CLI y el servidor juntos. El emparejamiento rechaza un directorio de inicio o intent de configuración sincronizada; use el directorio protegido real como `OPENCODEX_HOME`.

Internamente, el CLI crea un compromiso de autorización de corta duración e intenta eliminarlo después de su uso o fallo. La lectura de la información en entorno de ejecución por sí sola no autoriza el emparejamiento, y el verificador no se almacena en disco. Este es un límite de acceso de escritura privado-doméstico, no biométrico o autenticación de presencia humana: un programa con acceso completo a los archivos de ese usuario sigue siendo de confianza. La autorización de invitación de Hub existente no se modifica. Si una solicitud de emparejamiento falla, ejecute un comando nuevo después de resolver el problema reportado. Esto no agrega soporte para Windows SSH Remote Link.

Si un proceso se interrumpe durante el emparejamiento, vuelva a ejecutar el comando para obtener una nueva autorización. No elimine manualmente el estado de emparejamiento mientras se ejecuta el servicio o un comando de emparejamiento.

En Windows, el emparejamiento no se cierra si la carpeta o registro intent no es privada para la cuenta de servicio, o si su propietario y permisos no pueden verificarse. Ambas entradas deben ser propiedad de esa cuenta; La propiedad de los administradores solo se acepta cuando los administradores son el propietario predeterminado de token y su función de administrador está habilitada. La lista de permisos debe estar protegida de la herencia y contener una entrada de permiso de control total ordinaria para la cuenta servidora. Además de eso, solo se aceptan entradas de permiso simple para SYSTEM y el grupo Administradores, porque SYSTEM y un administrador elevado ya pueden tomar posesión de cualquier archivo; un administrador no elevado no gana nada de esa entrada. Solo se permite la herencia Child en la carpeta. Esta es la lista que Windows informa: se ignoran las entradas duplicadas compatibles para el mismo número de cuentas que una, y las entradas que no conceden nada. El cheque deja registros rechazados en su lugar y no repara sus permisos ni cambia la propiedad. Restaurar una casa de configuración privada y, a continuación, ejecutar un nuevo comando de emparejamiento.

La comprobación cubre la carpeta de intención y el registro. No protege contra el reemplazo de carpetas anteriores, derechos de eliminación en una carpeta principal, operaciones de restauración con privilegios o acceso a través de identificadores abiertos antes de que los permisos se vuelvan privados. Una solicitud con un compromiso coincidente puede bloquear el servidor durante un subproceso de verificación limitado a cinco segundos, incluso si su carpeta falla más tarde en la verificación de permiso. La configuración de inicio de proceso y búsqueda ejecutable precede a ese tiempo de espera. La limpieza de CLI puede realizar una verificación más. El presupuesto de subproceso de cinco segundos deja espacio dentro del tiempo de espera de solicitud de diez segundos del comando, pero la verificación lenta aún puede rechazar el emparejamiento.

<a id="add-a-child-from-the-terminal"></a>

## Agregar un Child desde el terminal

En el Home, ejecute `ocx link probe child-a --json` para inspeccionar la oferta SSH huella dactilar, tipo de llave y OpenCodex version. Verifique la huella digital a través de una fuente confiable. Luego ejecute `ocx link add child-a --expect-fingerprint SHA256:… --json`. El comando sondea de nuevo y rechaza un desajuste antes de almacenar la confianza o emitir una clave. Sin el indicador de huella dactilar, se requiere un terminal interactivo y una `yes` Después de mostrar la huella digital. Nunca imprime la clave de enlace.

Las conexiones iniciadas por Home ahora reinician la Child después de guardar su conexión, incluidas las instalaciones Child más antiguas y capaces. El Child ya debe servir independiente OpenCodex en su puerto configurado, exponer el soporte de reinicio vinculado y tener curl instalado. Actualice o desconecte un Child que falle en esta fase previa. Las instalaciones de escritorio y sistema OpenCodex tienen prioridad sobre las shims genéricas PATH; se omiten los candidatos rotos. Windows Los niños siguen sin soporte.

Reiniciar espera los giros y puede tardar varios minutos. El éxito requiere que el Child reiniciado cumpla la función de cliente y transmita un catálogo completo nuevo a este Home. La configuración de SSH tiene una asignación limitada derivada de la latencia medida; la verificación del relé comienza después del reinicio con su propia ventana de 15 segundos. Los errores nombran la fase fallida. Si un error notifica una configuración residual de Child, ejecute `ocx disconnect` y `ocx restart` en ese Child antes de volver a intentarlo. La limpieza de Home por sí sola no restaura la configuración de Child. Un tiempo de espera CLI informa un resultado incierto; inspeccionar Home `ocx link status` y Child `ocx connect status` Primero.

En un Home iniciado por Child, `ocx link status` función de informes `child`, identidad de enlace y puerto de túnel desde su conexión guardada aunque su almacén de enlaces del lado Home esté vacío. El estado del túnel no observado localmente es `idle`. `ocx status` llama al par un enlace remoto Home. Cuando Home se ejecuta en modo Hub, el estado lee su proyección admitida a través del relé local Child. Un Home independiente informa que no publica el estado de Hub. La identidad del túnel iniciada por Child proviene de su sidecar válido; la evidencia ilegible no reclama una dirección.
