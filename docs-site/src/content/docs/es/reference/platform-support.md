---
title: "Soporte de plataforma"
description: "Lo que OpenCodex puede hacer en macOS, Windows y Linux, y por qué algunas capacidades siguen siendo específicas de la plataforma."
---

OpenCodex se ejecuta en macOS, Windows y Linux. La mayoría se comporta de manera idéntica en todos los tres; algunas capacidades dependen de algo que el sistema operativo proporciona, y Esta página dice cuál y por qué.

<a id="everywhere"></a>

## En todas partes

| Capacidad | Notas |
| --- | --- |
| Proxy, enrutamiento, adaptadores de proveedores | El entorno de ejecución del núcleo es neutral para la plataforma. |
| Servicio en segundo plano | Tres backends nativos: lanzados en macOS, Programador de tareas **o** WinSW en Windows, una unidad de usuario systemd en Linux. |
| Inicio de sesión del navegador | Se abre a través del propio controlador de la plataforma. |
| Detección de clientes | Las instalaciones de Cursor, Claude Desktop, Kiro y Codex se encuentran por plataforma. |

<a id="provider-keys-in-the-os-credential-store"></a>

### Claves de proveedor en la tienda de credenciales del sistema operativo

Compatible con las tres plataformas, **cuando un servicio de credenciales del sistema operativo desbloqueado es disponible**: Llavero en macOS, Gestor de credenciales en Windows, libsecret en Linux. Un llavero cerrado con llave o una sesión sin cabeza no tienen servicio desbloqueado, por lo que el La tienda no está disponible y OpenCodex lo dice en lugar de retroceder silenciosamente. Véase [Proveedores](/es/reference/configuration/providers/) para las reglas de almacenamiento.

<a id="macos-only"></a>

## Solo macOS

<a id="claude-code-auto-connect"></a>

### Claude Code auto-conexión

Inyección `ANTHROPIC_BASE_URL` y las palancas Claude Code en su sesión ocurre a través del dominio de usuario launchd, que no tiene un solo equivalente En otra parte.

En Linux los tres mecanismos plausibles alcanzan cada uno un conjunto diferente de procesos:
`systemctl --user set-environment` alcanza sólo unidades engendradas por el sistemad,
`~/.profile` solo login shells, y `~/.bashrc` solo no inicio de sesión interactivo conchas. No hay un solo lugar que cubra toda la sesión de un usuario.

En Windows el equivalente es `HKCU\Environment`que es realmente persistente en lugar de per-boot. Ese es el problema: movería un portador token desde un dominio que se vacía en el reinicio en una colmena del registro que no lo hace, que es un Cambio en el tiempo que la credencial permanece en el disco y quién puede leerla. Eso La decisión requiere una revisión de seguridad en lugar de un puerto.

Todo lo demás que Claude Code necesita funciona en todas las plataformas. Puede establecer el mismo variables usted mismo, o ejecutar `ocx claude`, que los pasa al proceso del niño directamente.

<a id="import-versus-paste"></a>

## Importación versus pasta

<a id="meta-muse-code"></a>

### Código de Meta Muse

En macOS, un inicio de sesión simple primero prueba la clave API ya almacenada por `muse login`. Si no hay ninguno disponible, o en otra plataforma, OpenCodex inicia la aprobación del dispositivo sin necesidad de iniciar el Muse CLI. Agregar cuenta y reautenticación omitir importación. Un inicio de sesión fallido y sin cancelación del dispositivo puede volver a una clave manual cuando el llamante Ofrece una superficie de entrada. Las teclas pegadas utilizan el mismo formato y la validación del modelo API como los importados. El inicio de sesión de administración requiere una sesión en el panel antes de camino de adquisición de credenciales; ver el [guía del proveedor](/es/guides/providers/).

El símbolo del llavero macOS aparece en la máquina que ejecuta el proxy, que puede ser separado de su navegador de panel. OpenCodex permite aprobar hasta 120 segundos - Sí. Cancele el inicio de sesión del panel de control para detener la lectura pendiente. Entradas faltantes, denegadas acceso, interacción no disponible con el llavero, tiempo de espera, credenciales mal formadas y Los errores de validación del modelo API tienen mensajes de recuperación separados. Si la importación es bloqueado, el panel ofrece un campo de pegado para una clave existente de Muse Code API; no inicia automáticamente otra concesión de dispositivo. Para usar el inicio de sesión del navegador, elegir **Añadir cuenta** en un proveedor ya configurado. OpenCodex no cambia Controles de acceso de llavero.

Si el inicio de sesión sigue fallando, informe el error Muse que se muestra exacto (incluido cualquier error HTTP). estado), versión OpenCodex, `muse --version`, si el panel de control es remoto de el proxy, y cuánto tiempo era visible el mensaje. En herramientas de desarrollo de navegador → Red, copia solo el `error` campo de `/api/oauth/login` o
`/api/oauth/status?provider=meta-muse`. No comparta un HAR, encabezados de solicitud, archivos auth, salida de llavero, detalles de la cuenta o el resto de la respuesta de estado. Estos diagnósticos seguros distinguen la importación local de los errores de validación Meta; No se necesita volcado de credenciales.

Para las solicitudes Responses a Meta, omitidas o `auto` Se admite la selección de herramientas. Explícito `none` envía `tools: []` y elimina `additional_tools` de la entrada. Obligados, nombrados y `allowed_tools` selecciones devolver HTTP 400 antes de la petición llega a Meta porque Muse solo acepta `auto`. Otros Responses Los destinos mantienen su comportamiento de selección de herramientas existente.

<a id="windows-notes"></a>

## Notas de Windows

El servicio Windows se puede ejecutar en el Programador de tareas o como un servicio nativo de WinSW, Y éstos son mutuamente excluyentes. `ocx service repair` Se niega a proceder cuando encuentra el estado para ambos, porque adivinar a cuál te refieres es cómo una máquina termina con dos representantes peleando por un puerto.

La salida de la consola en una instalación Windows no inglesa llega a la página de código del sistema en lugar de UTF-8. OpenCodex lo decodifica en consecuencia, por lo que un nombre de cuenta con caracteres non-ASCII se resuelve correctamente.

<a id="when-something-is-unavailable"></a>

## Cuando algo no está disponible

OpenCodex indica la razón real en lugar de deshabilitar un control en silencio. Si una capacidad no está disponible en su plataforma, el error o el panel dice qué mecanismo falta y cuál es la alternativa apoyada. Si le pegas a uno que no lo hace, es un bug digno de reportar.
