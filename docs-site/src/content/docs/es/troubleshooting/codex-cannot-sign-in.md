---
title: "Codex no puede iniciar sesión ni cargar"
description: "Qué hacer cuando Codex falla al iniciar sesión o cada error de solicitud después de aplicar opencodex, y cómo devolver Codex a su propia cuenta sin iniciar el proxy."
---

Si Codex se detiene en una pantalla de inicio de sesión, informa que no puede cargar el inicio de sesión requisitos, o falla en cada solicitud de modelo después de configurar opencodex, la mayoría causa probable es que Codex sigue apuntando al proxy opencodex, mientras que el El proxy no se está ejecutando. Esto fue reportado como
[#5261](https://github.com/lidge-jun/opencodex/issues/5261).

<a id="why-this-happens"></a>

## Por qué sucede esto

En la configuración de bucle de retorno predeterminada, opencodex no le da a Codex una configuración separada proveedor. Señala el propio Codex incorporado `openai` Provider en el proxy, por escribir un root override en `$CODEX_HOME/config.toml` (`%USERPROFILE%\.codex`
en Windows):

```toml
model_catalog_json = "/absolute/path/to/opencodex-catalog.json"
# Auto-injected by opencodex (undo: ocx restore)
openai_base_url = "http://127.0.0.1:10100/v1"
# Auto-injected by opencodex (undo: ocx restore)
experimental_realtime_ws_base_url = "http://127.0.0.1:10100/v1"
```

Esas líneas están en el disco, por lo que sobreviven a un reinicio. Si el proxy no se está ejecutando cuando se inicia Codex, esa dirección no responde a nada, y Codex no tiene segundo Endpoint para volver. La pantalla que obtienes no dice nada sobre opencodex, es por eso que el estado es fácil de leer mal como un problema Codex.

El proxy puede estar ausente por razones ordinarias. Aplicación de la integración Codex no instala un servicio en segundo plano — que es un servicio separado `ocx service install`
paso — para que después de un reinicio no pueda haber nada para recuperar el proxy. A La tarea programada registrada Windows comienza en el inicio de sesión en lugar de en el arranque, y se También se puede desactivar, no iniciar o perder el puerto a otro proceso.

<a id="get-codex-working-again"></a>

## Haga que Codex vuelva a funcionar

Elija el resultado que desee. Ambos son seguros para ejecutar mientras el proxy está abajo.

**Devuelva Codex a su propia cuenta y puntos finales:**

```bash
ocx restore
```

Esto elimina el enrutamiento inyectado, la anulación en tiempo real y la opencodex puntero de catálogo, y no necesita proxy en ejecución, sin sesión de panel de control y no red. Codex inicia sesión y funciona normalmente después. Cuando quieras opencodex atrás, `ocx restore back` Codex en el proxy.

**O traer el proxy de vuelta en su lugar:**

```bash
ocx start
ocx service install   # keep it running across restarts
```

`ocx status` informa si el proxy está respondiendo y si Codex es En la actualidad se enrutan a través de él. `ocx doctor` explica el mismo estado en más detalle y nombre la reparación que recomienda.

<a id="if-ocx-is-not-available"></a>

## Si ocx no está disponible

Puede deshacer el enrutamiento a mano. Abrir `$CODEX_HOME/config.toml` y eliminar Tres cosas: el `openai_base_url` línea, el
`experimental_realtime_ws_base_url` línea, y cualquier `model_catalog_json` línea termina en `opencodex-catalog.json`. Eliminar el
`# Auto-injected by opencodex` Comentarios sentados directamente encima de cada uno de los primeros dos junto con ellos.

Vaya por el nombre de la clave, no por el comentario. opencodex utiliza la misma propiedad comentario por encima de otras claves que maneja, como una inyección
`developer_instructions`y eliminarlos no te ayudará a iniciar sesión mientras que le cuesta la configuración que usted puede querer atrás.

Los comentarios de propiedad independientes repetidos no cambian los valores o el enrutamiento de TOML. La reinyección y eliminación de la tabla del proveedor consumen el marcador desnudo exacto o su
`(undo: ocx restore)` forma inmediatamente por encima `[model_providers.opencodex]`. Se conserva el texto del marcador dentro de otro comentario de usuario o una cadena multilínea; Los comentarios existentes separados de la tabla no son reclamados por esa transformación. La propiedad de enrutamiento raíz utiliza un marcador adyacente exacto en una raíz estructural asignación. Un valor inyectado coincidente registrado en la revista también demuestra La propiedad después de una reescritura de la aplicación Codex deja comentarios. Citando el marcador en un comentario de usuario o una cadena multilínea no prueba la propiedad. Administrado
`web_search` Los reemplazos registran la asignación original completa, incluyendo valores multilínea, por lo que volver a encenderlo o restaurarlo puede devolverlo. La eliminación y la captura validan las asignaciones completas sin convertir una válida Número entero de 64 bits en un número JavaScript. La propiedad basada en el valor aún requiere decodificación de valor satisfactoria; se rechazan las asignaciones no válidas o incompletas. Fallback eliminación compactos documento líneas en blanco fuera de los valores multilínea, preservando las líneas en blanco dentro de esos valores.

Borrar el `model_catalog_json` línea **con** el enrutamiento, no por sí solo. A
`model_catalog_json` que nombra un archivo que ya no existe hace que Codex falle para cargar su configuración en absoluto, que parece el mismo bloqueo para un diferentes razones.

<a id="accounts-that-would-not-add-or-display"></a>

## Cuentas que no agregarían ni mostrarían

Los errores al agregar cuentas al grupo, o las cuentas agregadas que no aparecen, son una separar la materia del bloqueo de arriba, incluso cuando ocurren en el mismo sesión. El grupo de cuentas es servido por la administración del proxy API, por lo que tanto el
`ocx account login openai` flujo y la lista del panel de control necesitan un proxy en ejecución antes de que cualquier otra cosa pueda funcionar. El inicio de sesión del navegador también vuelve a
`http://localhost:1455/auth/callback`una dirección fija que no puede moverse a otro puerto. Si algo más tiene puerto 1455, o un navegador no puede ser lanzado, utilice el flujo del dispositivo en su lugar:

```bash
ocx account login openai --device
```

Véase [Integración con Codex](/es/guides/codex-integration/) para lo que la inyección escribe y cómo se elige el enrutamiento.

<a id="oauth-refresh-capacity-reached"></a>

## Capacidad de actualización OAuth alcanzada

Si una solicitud Responses informa `OAuth token refresh capacity reached`, espera en al menos un segundo antes de volver a intentarlo. El proxy limita el trabajo de actualización pendiente OAuth a 256 consumidores por proceso, incluidas las solicitudes que esperan la misma actualización. Una solicitud desconectada mantiene su reserva de actualización hasta que se resuelva ese trabajo; las solicitudes que usan credenciales en caché nuevas aún pueden continuar.

Antes de que comience una respuesta, este rechazo temporal devuelve HTTP 503 con
`Retry-After: 1`. Un flujo que ya ha comenzado en su lugar termina con un servidor Error. La denegación de capacidad no marca la cuenta como que necesita una nueva autenticación, Por lo tanto, iniciar sesión de nuevo es innecesario por este error. Un refresco que nunca se asienta puede seguir ocupando capacidad; el límite no impone un plazo de actualización.
