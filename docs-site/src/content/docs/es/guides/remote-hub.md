---
title: "Despliegue de Remote Hub"
description: "Ejecute un concentrador opencodex de un puerto en Linux, macOS o Docker con un loopback acompañante, un token de datos autoaprovisionado, ocx hub invite, una entrada de administración solo loopback, Tailscale Serve y OAuth sin cabeza."
---

Para enlaces de máquina SSH, vea [Enlace remoto](/es/guides/remote-link/).

Un concentrador opencodex mantiene las credenciales del proveedor y el estado de uso en un host mientras los clientes autenticados utilizar su plano de datos de forma remota. El plano de gestión orientado al navegador está separado: un oyente opcional Sólo se une `127.0.0.1`, sirve el panel y `/api/*`y está destinado a sentarse detrás de Tailscale Servir u otra interfaz HTTPS propiedad del operador.

El plano de datos es **Un puerto**. Dial de máquinas remotas `hostname:port` con su propia clave por cliente; los procesos propios del concentrador marcan `127.0.0.1:<the same port>` sin credencial, a través del loopback compañero oyente. Empezar desde [La receta abajo](#linux-systemd-or-macos-launchd)Luego, la mano a segunda máquina un comando listo para usar con [`ocx hub invite`](#inviting-another-machine).

La entrada de la gerencia nunca sirve `/v1/*`, `/healthz`, o `/readyz`. Cuando está explícitamente habilitado, Espacio de trabajo remoto admite solo su agente autenticado por portador emparejado WebSocket y el emparejamiento único intercambio; ver [Espacio de trabajo remoto](/es/guides/remote-workspace/). No publique su puerto directamente, no agregue una regla de nube-firewall para él y no use Tailscale Funnel. El embudo es un superficie de Internet pública y está fuera de este modelo de despliegue.

Con la entrada de administración habilitada, se abre el comando del panel local `http://127.0.0.1:<management port>` para que la dirección coincida con el oyente solo IPv4 sin resolver `localhost`.

Las configuración de cliente exportadas o aplicadas a través de ese panel aún apuntan a la inferencia oyente, no el puerto de gestión. Los clientes locales usan el puerto asociado de loopback configurado (o el puerto del oyente público real cuando el compañero no tiene un puerto explícito).

<a id="trust-and-consent-boundaries"></a>

## Límites de confianza y consentimiento

- Las credenciales de proveedor y OAuth permanecen en el concentrador. Nunca copiarlos en un cliente, capa de imagen, definición de servicio, paquete de soporte, captura de pantalla o línea de comandos.
- La admisión de datos token se entrega a través del propietario `service-api-token` archivo o
  `OCX_API_TOKEN_FILE`. No es una credencial de gestión.
- Un cliente configurado `allowedModels` debe incluir tanto al ejecutor como cualquier facturado por separado Modelo de asesor utilizado por Anthropic nativo administrado Messages. ID de modelo desnudo y el concentrador configurado
  `provider/model` Los nombres son aceptados. Un destino de Asesor no permitido o sin nombre devuelve HTTP 403 antes del envío del proveedor; las claves solo para proveedores y sin restricciones conservan su alcance existente.
- GitHub Copilot Auto vuelve a comprobar el modelo concreto seleccionado durante la negociación y renovación. Un modelo fuera del alcance permitido del cliente finaliza la solicitud con
  `model_not_allowed_for_key` (HTTP 403 antes de la transmisión, o un error de terminal en ej., un flujo ya iniciado). La rotación de credenciales o un objetivo alternativo no pueden Anule esa negativa.
- Un administrador en bruto token puede realizar la administración ordinaria, pero no puede menta un navegador sesión o autorizar acciones de consentimiento, como protagonizar el repositorio. Dichas acciones requieren un servidor-emitido `gui-session`, origen del navegador coincidente y CSRF token.
- `Tailscale-User-Login` Solo se confía en la entrada de gestión por separado. El mismo encabezado El público oyente es ignorado. `remoteGui.allowedTailscaleUsers` Controla la emisión de sesiones; es no crea un nuevo principio de propósito general.

<a id="roles-and-direct-data-flow"></a>

## Roles y flujo directo de datos

`standalone` Mantiene los datos y la gestión en una sola máquina. A `hub` las credenciales de los proveedores, el catálogo y registros de uso. A `client` almacena solo sus metadatos de conexión y uno por cliente clave. El tráfico Codex y Claude va directamente desde el cliente al receptor de datos del concentrador; no es túnel a través del panel de instrumentos o el relé de administración de loopback.

Conéctese con exactamente una fuente de autoridad transitoria. La autoridad se lee de Stdin y nunca es escrito en la configuración o el archivo token:

```bash
ocx connect https://hub-name.tailnet-name.ts.net --pairing-code-stdin
ocx connect status
ocx sync
```

Los diagnósticos de preparación legibles por humanos muestran los caracteres de control en los valores del catálogo como escapes hexadecimales visibles, tanto cuando se conecta por primera vez como cuando `ocx sync` rechaza un catálogo de concentrador actualizado. El estado estructurado JSON conserva el valor de diagnóstico original.

No tienes que armar esa línea a mano. `ocx hub invite`, ejecutar en el concentrador, acuña el código y imprime el comando exacto — incluyendo ambos orígenes — para la máquina que se está uniendo. Véase
[Invitar a otra máquina](#inviting-another-machine).

El concentrador emite automáticamente una clave por cliente. El cliente lo escribe al propietario existente
`service-api-token` archivo, nunca `config.json`. Mientras está conectado, el uso proviene de la tienda de uso del concentrador filtrado a la estabilidad de ese cliente `apiKeyId`. Después de la desconexión, el uso proviene de la tienda local. OpenCodex no refleja el uso entre las dos tiendas.
`ocx service uninstall` elimina el servicio local, pero conserva una clave existente cuando el cliente conectado, sus metadatos de conexión no son válidos o no coinciden, o un marcador de conexión pendiente coincide la clave actual. Un marcador válido para una clave anterior no retiene una clave de servicio no relacionada. Si un marcador no es seguro, está mal formado o es ilegible, no se puede verificar la limpieza de token; El comando advierte en lugar de reclamar que la clave se mantuvo. Uso `ocx disconnect` para eliminar una conexión clave y estado local del cliente.

Si un cliente guarda un control remoto `http://` Hub URL antes de la regla de transporte seguro, su Hub Ahora las operaciones regresan `insecure_http_refused`. Correr `ocx disconnect` local, luego volver a conectar hacia el Hub con `https://` (o utilice el bucle HTTP cuando ambos lados estén en la misma máquina).

Rotar un cliente conectado con una nueva autoridad transitoria:

```bash
ocx connect rotate --pairing-code-stdin
# or, only over HTTPS:
ocx connect rotate --admin-token-stdin
```

La rotación mantiene las claves de datos antiguas y nuevas válidas durante un máximo de diez minutos bajo el mismo nivel. `apiKeyId`. El cliente realiza una copia de seguridad del antiguo token como `service-api-token.prev`, instala atómicamente y sondea el nuevo clave, luego se compromete. Si una respuesta de confirmación es incierta, vuelva a ejecutar el comando rotar con transitorios. autoridad; la recuperación examina ambos archivos antes de cometer o restaurar. Nunca borre ninguno de los archivos cuando Los informes de recuperación indican que ambos candidatos fueron rechazados.

`ocx disconnect` es local y funciona mientras el concentrador está fuera de línea. Restaura el estado cliente local y no revoca la clave de concentrador. Después de desconectar, revoque esa clave de **Conecte las teclas → API** on El hub. `ocx connect revoke --admin-token-stdin` solo está disponible mientras sigue conectado y utiliza El persistente `apiKeyId`; no acepta anulación de id. La sesión del navegador cerrar sesión/caducidad está separada de rotación de clave de datos, revocación y desconexión.

<a id="what-a-connected-client-shows"></a>

### Lo que muestra un cliente conectado

`ocx connect` y `ocx connect status` comprobar la disponibilidad del catálogo con el primer local válido Tiempo de ejecución Codex en orden de selección. Los candidatos preferidos fallidos pueden retroceder, pero con menor prioridad Las alternativas no se prueban después de seleccionar un entorno de ejecución válido. Esta comprobación deja el entorno de ejecución guardado Selección sin cambios. Generalidades `ocx status` todavía descubre alternativas para el diagnóstico en entorno de ejecución.

Un cliente no almacena credenciales de proveedor y ningún catálogo propio, por lo que su configuración local y La tienda de credenciales está vacía por diseño — y leerlas como la verdad produce una confianza, equivocada respuesta sobre lo que el centro puede servir. En un cliente conectado `ocx status` Por lo tanto, lleva con
`State from hub <origin>` y obtiene las líneas de inicio de sesión OAuth, proveedores y modelos delegables de el concentrador sobre el plano de datos, etiquetando las líneas que realmente describen esta máquina `(local)`: el proxy, el servicio, el binario Codex y shim, y los puertos locales. `ocx status --json` lleva el La misma respuesta que `runtimeRole` más a `remoteHub` Bloque cuyo `stateSource` es `hub`, `cache`, o
`unavailable` — nunca el propio estado del cliente. Un hub más antiguo que no sirve `/v1/hub-state`
informes `unavailable` con una instrucción para actualizar el concentrador en lugar de volver a caer silenciosamente estado de inicio de sesión local, y `ocx config show` en un cliente imprime un `_remoteHub` Nota que dice el credenciales y la disponibilidad del modelo en vivo en el concentrador. La lectura del concentrador utiliza la clave de datos por cliente solo; ningún administrador token y ningún secreto de proveedor llega a un cliente.

`ocx status` realiza una solicitud de estado de concentrador en vivo solo cuando la conexión guardada aún coincide con la snapshot de estado y el archivo data-token coincide con esa conexión. Si cualquiera de las dos comprobaciones falla, se salta la solicitud y muestra el estado del concentrador en caché coincidente, o `unavailable` si no existe ninguna caché coincidente.

<a id="linux-systemd-or-macos-launchd"></a>

## Lanzamiento de Linux systemd o macOS

Vincule el oyente de datos a la dirección Tailscale del concentrador, habilite el compañero de bucle para que el concentrador Los procesos propios llegan a ese mismo puerto sin una credencial y publican la administración por separado. Los Los valores a continuación son ejemplos:

:::danger[Usa un servidor dedicado para un solo usuario]
El compañero de loopback no está autenticado: cada proceso y usuario del sistema operativo en esta máquina puede usar el credenciales del proveedor del concentrador y la cuota de cuenta, y puede agotar la capacidad de giro compartida que clientes remotos autenticados dependen de. No lo habilite en un host compartido o multi-tenant. Si el host es compartido, deja el `unauthenticatedLoopbackListener` configuración deshabilitada y no ejecute el local del concentrador integraciones.

Vinculación a `127.0.0.1` significa que el kernel rechaza conexiones remotas, pero no detiene un navegador: una página que visita puede hacer que su navegador se conecte a `127.0.0.1`. Por lo tanto, el oyente misma `Host` y `Origin` como un enlace de bucle de retorno ordinario.
:::

```bash
ocx config set runtimeRole hub
ocx config set hostname 100.64.0.10
ocx config set corsAllowOrigins '["http://localhost:10100"]'

# A fresh standalone config has no `hub` or `remoteGui` object, and `ocx config set` does not
# create a missing parent: a nested set fails with `config parent path not found: hub`. Setting
# `runtimeRole` does not create it either. Create each object first, then set its fields.
ocx config set hub '{}'
ocx config set remoteGui '{}'
ocx config set hub.managementPublicOrigin '"https://hub-name.tailnet-name.ts.net"'
ocx config set hub.dataPublicOrigin '"https://hub-name.tailnet-name.ts.net:8443"'
ocx config set hub.managementIngress '{"enabled":true,"port":10101}'
ocx config set remoteGui.allowedTailscaleUsers '["operator@example.com"]'

# One port. Remote machines dial 100.64.0.10:10100 with their own key; the hub's own local
# processes dial 127.0.0.1:10100 with no credential, on that same port.
ocx config set unauthenticatedLoopbackListener '{"enabled":true}'

# No token to export: install provisions the hub's own data-plane token. See below.
ocx service install
ocx service status
ocx status                # the "Hub:" block summarizes every line above
```

En una configuración genuinamente vacía, puede establecer cada objeto en una llamada:

```bash
ocx config set hub '{"managementPublicOrigin":"https://hub-name.tailnet-name.ts.net","dataPublicOrigin":"https://hub-name.tailnet-name.ts.net:8443","managementIngress":{"enabled":true,"port":10101}}'
ocx config set remoteGui '{"allowedTailscaleUsers":["operator@example.com"]}'
```

Utilice esa forma solo cuando el objeto no existe todavía. Un conjunto de objetos enteros **sustituye** El objeto en lugar de fusionarse en él, por lo que ejecutar la línea anterior contra una configuración que ya tenía
`hub.managementIngress` silenciosamente deja caer la entrada. Cuando se está adaptando una configuración, establezca un campo a la vez — el padre ya está allí, por lo que el formulario anidado funciona y No toca nada más.

Dos detalles que deciden si se acepta una línea. El valor se analiza primero como JSON y cae volver a la cadena sin procesar, por lo que un URL se escribe como `'"https://…"'`: objetos, arrays, booleanos y los números deben ser válidos JSON. Y `hub` y `remoteGui` son estrictos, por lo que se rechaza una clave mal escrita En el tiempo de escritura como `schema_invalid: hub.<field>` en lugar de convertirse en un escenario que nunca toma efecto. `managementPublicOrigin` y `dataPublicOrigin` cada uno debe ser un origen desnudo sin camino, consulta o fragmento.

<a id="the-data-plane-token-provisions-itself"></a>

### El plano de datos token se aprovisiona

No hay ninguna `export OPENCODEX_API_AUTH_TOKEN=…` paso antes `ocx service install`. En un no-loopback enlazar el instalador resuelve la token de entrada de datos del concentrador por precedencia y escribe el resultado en El propietario-sólo `service-api-token` archivo, modo `0600`:

1. **`OPENCODEX_API_AUTH_TOKEN`**, cuando el shell de instalación exporta uno. Un operador que quiere El valor sigue siendo suyo.
2. **El existente `service-api-token` Archivo.** Reutilizarlo es lo que hace `ocx service install`,
   `ocx service repair` y un reinicio idempotente; la regeneración invalidaría silenciosamente cada La clave por cliente ya se intercambiaba con el valor anterior. Un archivo reutilizado se vuelve a verificar, no — de confianza vea el párrafo admin-token a continuación.
3. **32 bytes aleatorios frescos, hexadecimal.** Esta es la rama que elimina el paso manual.

El comando imprime el **ruta**Nunca el valor. La lista lanzada y la unidad de usuario systemd leían ese archivo protegido cuando se inicia el proceso; ni incrusta el token literal. No pegue el valor en `ocx config show`, salida de unidad/plista, capturas de pantalla o paquetes de soporte. Un primer plano
`ocx start` en el concentrador lee el mismo archivo, por lo que une el nombre de host non-loopback sin exportado token tampoco.

A **administración admin token** se rechaza dondequiera que aparezca, y el rechazo nombra el remedio para ese lugar. En `OPENCODEX_API_AUTH_TOKEN`: `unset OPENCODEX_API_AUTH_TOKEN` y reestreno. En el reutilizados `service-api-token` archivo — la forma del incidente original, y aún accesible en un máquina donde el administrador token fue una vez pegado allí a mano — eliminar el archivo y ejecutar
`ocx service repair`, ya que la anulación de una variable no dice nada acerca de un archivo. Ambos cheques funcionan antes del cortocircuito de bucle, por lo que también se comprueba una instalación de bucle: el envoltorio de lanzamiento lee ese archivo en `OPENCODEX_API_AUTH_TOKEN` cualquiera que sea el nombre de host, que es lo que cerca el administración API cerrado en el arranque.

Los dos planos son diferentes credenciales — los datos token admite `/v1/*` Llamadores y administradores Nada. Dado que el servicio proporciona su propio token, no hay razón para exportar ninguno de los dos.
`ocx service repair` nunca más exige la variable una vez que existe el archivo.

`ocx status` reporta el estado de la token sin su valor: `present (file)`, `unsafe (file)` (es existe pero no es propietario-solamente — fijar los permisos), `admin-collision (file)` (la forma del incidente; el bloque añade la consecuencia y la corrección), o `missing`. El Estado siempre trata de la **archivo**, porque el envoltorio de lanzamiento sobrescribe el entorno desde él antes de ejecutar — una sublínea separada informes `OPENCODEX_API_AUTH_TOKEN` puesto en su caparazón, ya que eso es lo que un primer plano
`ocx start` En ese shell se usaría.

<a id="one-port-and-the-ported-alternative"></a>

### Un puerto, y la alternativa porteada

`unauthenticatedLoopbackListener: {"enabled": true}` con **no** `port` es el *compañero* Forma: a segundo enchufe en `127.0.0.1:<proxy port>` — el mismo número de puerto que el oyente público usa en la dirección tailnet. Esa es la dirección que toda integración local ya escribe, así que nada en el hub tiene que enseñar un nuevo puerto, y un puerto mantiene toda la superficie de datos remota.

La forma de acompañante se acepta sólo cuando `hostname` es un no-loopback específico, no-wildcard dirección. En marcha `127.0.0.1`, `localhost`, `0.0.0.0` o `::` El lector público ya sostiene que dirección de bucle, por lo que opencodex rechaza el par en el momento de la escritura y nuevamente en el inicio — nombrando el colisión — en lugar de dejar que el segundo enlace falle. En esos lazos no necesitas al oyente en all: un enlace de bucle ya admite llamadas locales.

El viejo *ported* forma todavía funciona y es la alternativa cuando se quiere que las dos superficies en Puertos separados:

```bash
ocx config set unauthenticatedLoopbackListener '{"enabled":true,"port":10104}'
```

La forma porteada es la misma superficie no autenticada: la advertencia de host dedicado anterior se aplica a Este comando también.

Con un `port` conjunto, las integraciones locales siguen al oyente y escriben `http://127.0.0.1:10104`
En su lugar. El puerto debe diferir del puerto proxy y nunca está asignado al sistema operativo: un puerto efímero sería cambiar entre reinicios mientras los servidores de aplicaciones que ya se están ejecutando mantienen el anterior `base_url`.

**Reinicie el proxy después de cambiar este campo.** Los sockets están enlazados una vez al inicio y el Los archivos cliente se escriben a partir del valor resuelto, por lo que un concentrador en ejecución mantiene su respuesta antigua. En un ported hub que es la diferencia entre `ocx claude` llegar al oyente y obtener un `404` de ella. En marcha un servicio de fondo el verbo es `ocx service restart`, que siempre reinicia — ver
[Operaciones de servicio macOS](#macos-service-operations). `ocx restart` es un verbo diferente: rebota el proceso de proxy que comenzó usted mismo, no el servicio que supervisa el gerente.

<a id="the-hubs-own-local-clients"></a>

### Los propios clientes locales del hub

Un concentrador solía ser la única máquina que no podía usarse a sí misma: `ocx claude`, Escritorio Claude, Cursor, la `system-env` la inyección y el ayudante de visión enrutado todo dial `http://127.0.0.1:<port>`, que no existe cuando el oyente está vinculado a una dirección tailnet. Con el loopback listener habilitado Trabajando en el hub:

```bash
ocx sync          # the hub now writes its own Codex/Grok blocks
ocx claude        # Claude Code wired to the hub's own loopback address
```

El oyente lleva cables de inferencia solamente: `POST /v1/responses` y su actualización WebSocket,
`POST /v1/responses/compact`, `POST /v1/messages`, `POST /v1/chat/completions`,
`POST /v1/alpha/search`, `GET /v1/models`, y la superficie de voz en tiempo real.
`POST /v1/messages/count_tokens` Es deliberadamente **no** admitido, por lo que Claude Code vuelve a local token estimación — una pérdida cosmética, no un lanzamiento roto. `/api/*`, `/healthz`, `/readyz` y el dashboard todo vuelve `404` Aquí: la administración local lee como `ocx claude`El descubrimiento llama a go a la superficie de administración autenticada con una credencial de administración, nunca a una Enchufe. Es por eso que la entrada de la gerencia y este oyente siguen siendo dos cosas diferentes.

Con el oyente **apagado**, un concentrador deliberadamente no reescribe sus propias configuración de cliente, y cada omitir los nombres de la puerta que lo detuvo:

```text
This machine is a hub; it does not rewrite its own Codex/Grok/Claude configs unless
unauthenticatedLoopbackListener is enabled.
```

Esa frase significa la puerta del cubo, no su `clientIntegrations` alternar. `ocx ensure` deja un existente administrado Grok bloque en su lugar cuando está cerrado en lugar de despojarlo, y
`ocx restore back` informa sobre la puerta en lugar de culpar a un escritor competidor.

<a id="acceptance-on-the-data-plane"></a>

### Aceptación en el plano de datos

Demostrar vivacidad y disposición en el oyente de datos públicos:

```bash
curl --fail --silent http://100.64.0.10:10100/healthz
curl --fail --silent http://100.64.0.10:10100/readyz
```

A `200` Desde `/healthz` Sólo demuestra que el proceso está vivo. La aceptación del despliegue también requiere
`/readyz`, una autenticada `GET /v1/catalog`, y una verdadera respuesta encaminada.

<a id="tailscale-serve"></a>

## Escala de cola Servir

Primero prueba que el socket de administración es solo loopback, luego publícalo a través de Serve:

```bash
ss -ltnp | grep 10101        # Linux: expected 127.0.0.1:10101 only
lsof -nP -iTCP:10101 -sTCP:LISTEN  # macOS: expected 127.0.0.1 only

tailscale serve --bg --https=443 http://127.0.0.1:10101
tailscale serve status
```

Establecer `hub.managementPublicOrigin` al origen exacto HTTPS mostrado por Serve. Añadir el exacto del operador Iniciar sesión en Tailscale `remoteGui.allowedTailscaleUsers`; una lista vacía significa que ninguna identidad remota puede acuñar una sesión. Verifique ambas direcciones:

```bash
# Negative: the loopback-only port must not be reachable through the node's tailnet address.
curl --fail --connect-timeout 3 http://100.64.0.10:10101/ && echo "unexpected exposure"

# Positive: the HTTPS dashboard loads through Serve from an allowed tailnet user.
curl --fail --silent --show-error https://hub-name.tailnet-name.ts.net/ >/dev/null
```

La prueba de navegador positiva debe usar una sesión de escala de cola con inicio de sesión real; una `curl` puede no llevar el Se necesitan encabezados de identidad para la emisión automática de sesiones. El emparejamiento sigue siendo la alternativa cuando el HTTPS El frontend no puede proporcionar una identidad de escala de cola confiable.

<a id="giving-the-data-listener-tls"></a>

### Dar al oyente de datos TLS

El mapa de arriba publica el **gestión** Sólo ingreso. Ese ingreso nunca sirve
`/v1/*`, `/healthz` o `/readyz`, por lo que por sí solo no le da a un cliente remoto datos utilizables Avión. opencodex también termina ningún TLS de su propio: el oyente es llano HTTP y HTTPS es siempre un frontend de propiedad del operador.

Servir puede ser ese frontend para el plano de datos también, en un segundo puerto HTTPS. En macOS necesita uno salto extra, porque Tailscale Servir proxies solo para `127.0.0.1` — no puede apuntar al oyente que enlazado a la propia dirección tailnet del nodo, y la compilación de App Store del cliente macOS destino remoto absoluto. Ejecutar un reenviador de bucle en el concentrador y apuntar Servir en eso:

```bash
# Any loopback TCP forwarder works; socat is one. Pick a port the hub is not already using:
# with the loopback companion enabled, 127.0.0.1:10100 belongs to opencodex itself.
socat TCP-LISTEN:10110,bind=127.0.0.1,fork,reuseaddr TCP:100.64.0.10:10100 &

tailscale serve --bg --https=8443 http://127.0.0.1:10110
tailscale serve status   # expect both mappings: 443 -> 10101, 8443 -> 10110
```

**No apuntes Servir al oyente acompañante del loopback.** Es un socket real en
`127.0.0.1:10100`, por lo que se crearía la asignación y luego fallaría de la misma manera que la trampa de abajo describe: el compañero ejecuta la política de admisión de loopback, que requiere un loopback `Host`
encabezado, y servir hacia adelante `Host: hub-name.tailnet-name.ts.net`. El compañero existe para los procesos
*on* el concentrador, que envía un bucle `Host` por su cuenta. El forwarder lleva la tailnet de los cuales, cuya acreditación y `Host` manejo es lo que necesita un frontend TLS.

Servir acepta un conjunto limitado de puertos HTTPS; confirme que la asignación se creó realmente con
`tailscale serve status` En lugar de asumir que el puerto estaba permitido.

Dar al promotor la misma vida útil que el hub. Un trabajo de shell en segundo plano muere en el reinicio mientras que el El servicio vuelve a aparecer, lo que deja un concentrador que se ejecuta e inalcanzable sobre TLS; ejecútelo desde lanzamiento o systemd junto `ocx service install`.

Luego conéctese con los dos orígenes establecidos por separado. El URL posicional es el **datos** origen — es donde `/readyz` y `/v1/catalog` se obtienen — y `--management-url` es el dashboard origen utilizado para el emparejamiento y la emisión de claves. No tienen que compartir un puerto:

```bash
# This is exactly the line `ocx hub invite` prints, with the code filled in.
echo '<pairing-code>' | ocx connect https://hub-name.tailnet-name.ts.net:8443 \
  --management-url https://hub-name.tailnet-name.ts.net \
  --pairing-code-stdin
```

Recordar esos dos orígenes en el centro como `hub.dataPublicOrigin` y `hub.managementPublicOrigin`, y
`ocx hub invite` te las imprimirá en lugar de pedirte que las recuerdes.

Cuando `--management-url` se ha omitido se toma de la `/readyz` La respuesta, que informa
`hub.managementPublicOrigin`. Establecerlo explícitamente es más claro cuando los dos orígenes difieren.

**No acorte esto vinculando el oyente de datos a `127.0.0.1`.** Un enlace de bucle es cómo opencodex reconoce una implementación puramente local: deja de requerir una credencial de datos y se inicia Requerir la solicitud `Host` Y el loopback también. Un frontend TLS hacia adelante
`Host: hub-name.tailnet-name.ts.net`, así `/v1/catalog` respuestas `403 origin_rejected` — mientras
`/readyz`, que no ejecuta ese cheque, todavía devuelve `200`. El despliegue parece saludable y No puede servir a un modelo. Nada en la ruta de solicitud lee `X-Forwarded-Host`Así que el frontend no puede Repararlo. Mantenga al oyente en la dirección de la red de cola, donde se mantiene la admisión de credenciales y el
`Host` check no se aplica.

Esa trampa es acerca de la **enlace**, y sigue siendo cierto. Obteniendo un `127.0.0.1` En un momento dado, el Los procesos propios del hub son un problema diferente, y
[`unauthenticatedLoopbackListener`](#one-port-and-the-ported-alternative) es la respuesta sancionada a it: el enlace público permanece en la dirección de la red de cola con la admisión activada, y un segundo socket sirve a los locales Llamadas. No es un objetivo TLS, por la razón dada anteriormente.

Encuadernación `0.0.0.0` también funciona y elimina la necesidad de un promotor, ya que el oyente es entonces También es accesible en bucle. Publica el puerto de datos en cada interfaz, por lo que solo lo prefiere donde el host no tiene otra red que le interese — y tenga en cuenta que la forma complementaria de
`unauthenticatedLoopbackListener` es rechazado en un enlace comodín, porque el oyente público ya bodegas `127.0.0.1:<port>` Ahí.

Vuelva a ejecutar las comprobaciones de aceptación contra el origen de datos HTTPS una vez que Serve esté activo: `/readyz`, un autenticado `GET /v1/catalog`, y una verdadera respuesta encaminada.

<a id="operator-owned-tsnet-certificate-proxy"></a>

### Proxy de certificado ts.net propiedad del operador

Si usted opera su propio TLS proxy, obtener un certificado solo para el ts.net FQDN:

```bash
tailscale cert hub-name.tailnet-name.ts.net
```

Proteja la clave privada, renuévela a través del mecanismo compatible de Tailscale y provide solo para
`127.0.0.1:10101`. Un proxy genérico TLS no proporciona una identidad fiable de escala de cola. No lo hagas Fabricar `Tailscale-User-*` cabeceras; use el flujo de emparejamiento enlazado a origen de un solo uso.

<a id="inviting-another-machine"></a>

## Invitar a otra máquina

Ejecutar esto en el hub en lugar de escribir un `ocx connect` Línea a mano:

```bash
ocx hub invite
```

Acuña un código de emparejamiento de un solo uso y de corta duración e imprime el comando para ejecutarse en la otra máquina:

```text
# Run on the other machine:
echo '<code>' | ocx connect https://hub-name.tailnet-name.ts.net:8443 --management-url https://hub-name.tailnet-name.ts.net --pairing-code-stdin
```

El origen de los datos proviene de `--data-url`Entonces, `hub.dataPublicOrigin`, luego la dirección bind. Eso último fallback solo funciona cuando el bind **es** una dirección que otra máquina puede marcar: en un bucle o wildcard bind se resolvería a `http://localhost:<port>`, que le dice a la otra máquina que marque Se gasta el código de un solo uso por nada, así que `invite` En su lugar, se niega e imprime el
`ocx config set hub.dataPublicOrigin` línea (más el per-invite `--data-url` formulario). Una explícita
`--data-url` o `hub.dataPublicOrigin` nunca se cuestiona — un origen de datos loopback es legítimo sobre un túnel SSH.

El origen de la gestión es `hub.managementPublicOrigin`, y en `invite` la `--management-url` bandera es un **confirmación, no una anulación**: la concesión está vinculada al origen configurado y el El intercambio se compara con él, por lo que un valor que difiere es rechazado con ambos orígenes nombrados más bien. que imprimir un código que el concentrador rechazaría.

Cada invitación exitosa también imprime el **origen del navegador vinculado** en Stderr. Una subvención está vinculada a un origen, y un remoto `ocx connect` presenta `Origin: http://localhost:<its own configured port>`, si el origen enlazado no es el predeterminado `http://localhost:10100` La otra máquina ya tiene que se ejecute en ese puerto antes de que ejecute la línea —, de lo contrario el concentrador rechaza el intercambio y el El código está gastado. La nota dice qué puerto, y ofrece admitir el origen predeterminado en su lugar.

`invite` Rechazar *antes* acuñar cualquier cosa cuando la configuración no puede funcionar — a `runtimeRole` que no es
`hub`, un desaparecido `hub.managementPublicOrigin`, un origen de gestión no loopback de texto plano, a malformado `--data-url`, un origen de datos que sería el propio loopback de esta máquina, o no funcionaría Proxy certificado. Una condición previa merece su propio párrafo.

**`corsAllowOrigins` tiene que nombrar el origen del navegador local de la máquina de unión.** `ocx connect` envía
`Origin: http://localhost:<its own proxy port>` cuando intercambia la subvención, y las subvenciones son de origen, así que solo `hub.managementPublicOrigin` sí mismo o una entrada de bucle de `corsAllowOrigins`
Nunca puede coincidir. sin presente, `invite` sale no-cero, no acuña nada, y nombra el nombre exacto comando:

```bash
ocx config set corsAllowOrigins '["http://localhost:10100"]'
```

Utilice el puerto **afiliarse** El proxy de la máquina escucha; `10100` es el valor predeterminado. El bloque de configuración por encima ya lo establece. Un conjunto de matriz completa reemplaza la matriz, por lo que cuando el concentrador ya tiene entradas Ejecutar la línea `invite` imprime — lleva los existentes más el nuevo origen. `ocx config get
corsAllowOrigins` muestra lo que hay ahora.

`ocx hub invite --json` Emite `{ code, expiresAt, dataUrl, managementUrl, command }` con `expiresAt`
como ISO 8601. El código es un secreto: de un solo uso, cinco minutos de vida útil, tasa limitada en el centro, y no para ser persistente, registrado o pegado en un problema. `--clients codex,claude` elige qué configuración de cliente el comando impreso apuntará al concentrador.

`invite` es una conveniencia sobre el flujo de emparejamiento existente, no un segundo mecanismo. Conduce lo mismo Ruta local certificada `ocx gui pair` utiliza, por lo que no necesita ningún administrador token y nada tiene que ser exportado en tu caparazón. Todo en [Roles y flujo directo de datos](#roles-and-direct-data-flow) Acerca de rotación, revocación y desconexión se aplican sin cambios a una máquina que se unió de esta manera.

<a id="macos-service-operations"></a>

## Operaciones de servicio macOS

`ocx service install` y `ocx service repair` son seguros para volver a correr contra un centro en vivo. Una reparación renderiza la lista primero y la compara: cuando los bytes renderizados son iguales a los bytes en el disco, la token El archivo no ha cambiado, y `launchctl print` reporta el trabajo cargado de esa lista, la reparación reafirma
`0600`, actualiza su estado de instalación, imprime `service is already loaded from the current plist;
nothing to do.` y devuelve — lanzamiento nunca se toca. Más temprano construye desalojado un trabajo saludable incondicionalmente, lo que hizo que un comando de diagnóstico fuera un corte.

**`ocx service restart` es el verbo que siempre se reinicia.** Ya no es un alias de `repair`. Lo ejecuta la misma actualización, y cuando se recarga nada — el caso saludable, sin cambios por encima de — lo reiniciar el trabajo ya cargado en su lugar con `launchctl kickstart -k`, vuelve a leer `launchctl print` a confirmar que el trabajo sobrevivió, e imprime una línea:

```bash
ocx service restart
# ℹ️  service restarted (launchctl kickstart -k gui/501/com.opencodex.proxy).
```

Eso es lo que hay que correr después de cambiar `unauthenticatedLoopbackListener`, `hostname` o `port`. Los kickstart no abre ninguna ventana de desalojo, por lo que no es el apagón que fue la antigua reparación incondicional.

Un desnudo `ocx service` todavía selecciona `repair`, no `restart`: es un idempotente "hacerlo actual", no una solicitud para rebotar un centro saludable. Uso `ocx service repair` para el caso es realmente para — a trabajo cargado desde una lista anterior, o no cargado en absoluto — y esperar que siga sin hacer nada en un saludable uno.

`launchctl kickstart -k gui/$(id -u)/com.opencodex.proxy` a mano, o `ocx service stop` seguido por
`ocx service start`, ambos siguen funcionando y la ruta de error nombra el primero como reserva. Tampoco es La ruta recomendada ya no más.

Linux y Windows nunca tuvieron esta brecha: `ocx service restart` allí termina en `systemctl --user restart`
y un stop-then-start de la tarea programada, respectivamente, el verbo que se le pida.

`ocx service status` distingue cuatro estados lanzados, y el último es el que la gente malinterpretó:

| Resumen | Significado |
| --- | --- |
| `installed and loaded` | Un dominio responde y ejecuta el comando que esta plist hornea. Nominal. |
| `installed and loaded from an OLDER plist` | El trabajo se está ejecutando, desde una definición que ya no coincide. Esto es lo que `ocx service repair` es para. |
| `installed, not loaded` | Cada dominio respondió "ausente", lo que es una prueba de que el trabajo se ha ido. La reparación lo vuelve a registrar. |
| `installed; launchd state could not be verified` | `launchctl` no se le puede pedir a —, por ejemplo, desde un contexto que `gui/<uid>` dominio. Esto es **no** evidencia de que el centro está caído: nada recomienda una reparación, y una sonda sin respuesta nunca marca a un proxy en ejecución como muerto. |

Una sonda que no podía ejecutarse solía ser reportada como "no cargada", lo que les decía a los operadores que repararan un dispositivo. servidor y deje que el actualizador inicie un proxy competidor en el propio puerto del servicio.

<a id="headless-oauth"></a>

## Sin cabeza OAuth

Deshabilitar el inicio del navegador en el concentrador:

```bash
ocx config set oauthOpenBrowser false
```

1. Desde el panel de control remoto o el cliente de administración autenticados, inicie `POST /api/oauth/login` por el proveedor. El concentrador devuelve la autorización URL e instrucciones sin abrir un navegador.
2. Abra el URL en la máquina del operador y autorice allí.
3. Si la devolución de llamada de bucle no puede llegar al concentrador, pegue el redireccionamiento final URL o el código en el panel/CLI. Envía `POST /api/oauth/login/code` con `{provider,input}`.
4. Sondear el punto final de estado existente hasta que se complete y, a continuación, realizar una solicitud de modelo enrutado.

Nunca ponga el código OAuth en argv de shell, registros, texto de emisión, capturas de pantalla o evidencia de implementación. Los manual-code route mantiene su proveedor desconocido existente, sin flujo activo, código inválido y 4096 bytes Comprobaciones de entrada.

## Docker Compose

opencodex no publica una imagen de contenedor oficial. El repositorio mantiene un source-build
[`Dockerfile`](https://github.com/lidge-jun/opencodex/blob/main/Dockerfile),
[`compose.yaml`](https://github.com/lidge-jun/opencodex/blob/main/compose.yaml), y un estrecho
`.dockerignore`. La compilación fija el índice de imagen Bun 1.4.2 multiplataforma por resumen, ejecuta el proxy como La no-raíz `bun` usuario, mantiene el sistema de archivos raíz de solo lectura, elimina las capacidades de Linux y publica solo el oyente de datos en el host `127.0.0.1:10100` por defecto. El proceso en primer plano utiliza
`OCX_SERVICE=1`, por lo que detener o recrear el contenedor conserva el estado Codex enrutado de restaurar una configuración de escritorio nativa. Docker proporciona supervisión; no hay administrador de servicios del sistema operativo Está instalado en la imagen. Use Compose para reiniciar/recrear el contenedor; esto no se extiende Soporte para cada ruta de reinicio del panel.

La imagen siembra una primera carrera `hub` configuración que une al oyente del contenedor a `0.0.0.0`. Antes del primer inicio normal, transmita un plano de datos recién generado token al ayudante de arranque. El ayudante acepta como máximo una línea de 4096 bytes, nunca imprime la token, se niega a reemplazar una línea existente token, y lo persiste como el propietario canónico `service-api-token` en el `ocx-state` volumen.

El despliegue persiste en dos viviendas separadas: `ocx-state` en `/home/bun/.opencodex` por Configuración de OpenCodex, credenciales y uso del proveedor, y `codex-state` en
`/home/bun/.codex` para el estado Codex y `opencodex-catalog.json`. La imagen y la composición explícitamente establecido `CODEX_HOME=/home/bun/.codex`, por lo que esta ruta de catálogo sigue siendo escribible con `read_only: true` y sobrevive a la recreación de contenedores. La imagen crea ambos directorios para el no-root `bun` usuario con modo `0700`; volumen existente La propiedad y los permisos no se migran automáticamente.

No combinar `CODEX_HOME` y `OPENCODEX_HOME`Ambos productos utilizan un `auth.json`
archivo con diferentes formatos. Este cambio en el empaque agrega persistencia, no una Generador de catálogo. Materializar o importar un catálogo válido en
`/home/bun/.codex/opencodex-catalog.json` antes de la verificación de aceptación del catálogo a continuación; sin uno, `catalog_not_found` sigue siendo la respuesta esperada.

La actualización preserva lo existente `ocx-state` volumen y añade `codex-state`; sin archivos se migran automáticamente. Si una solución previa colocó un catálogo directamente bajo `/home/bun/.opencodex`, respaldarlo y copiar deliberadamente solo el catálogo para el nuevo hogar Codex, preservando el acceso solo del propietario. No copie ninguno de los productos
`auth.json` sobre el otro. Despliegues con un personalizado `CODEX_HOME` Debe retener su entorno explícito y mapeo de volumen grabable hasta que se complete la migración. Cuando se anula `CODEX_HOME`, monte ese directorio exacto escribible y persista el catálogo predeterminado en `${CODEX_HOME}/opencodex-catalog.json`. Si `model_catalog_json`
selecciona explícitamente otro archivo, esa ruta resuelta también debe persistir.

Mantenga estable el nombre del proyecto de redacción durante las actualizaciones para que se reutilicen los mismos volúmenes con nombre. Montajes con propiedad extranjera existente, montajes de solo lectura y montajes que utilizan `volume-nocopy`
no son reparados por la configuración del directorio de la imagen. Persistir catálogo seleccionado por separado o SQLite rutas por separado; un almacén de credenciales del sistema operativo no está respaldado por estos dos volúmenes.

Cuando se ejecute sin Compose, proporcione explícitamente ambos montajes con nombre. Dockerfile `VOLUME`
declaraciones crean volúmenes anónimos que luego `docker run` No lo hace automáticamente Reutilización. Estas opciones de montaje usan nombres de ejemplo independientes; para reutilizar los datos de Compose, sustituya Nombres de volumen predefinidos por proyecto:

```sh
--mount type=volume,src=ocx-state,dst=/home/bun/.opencodex \
--mount type=volume,src=codex-state,dst=/home/bun/.codex
```

El host necesita Git y Docker Compose para un clon local, o solo Docker Compose para un Git remoto. contexto. No se requiere Bun ni un paso de preparación manual. El build-only La etapa de manifiesto deriva el inventario canónico de la instantánea Git seleccionada, escribe el
`src/generated/compatibility-version.json`, y verifica cada SHA-256 registrado contra el Construir contexto antes de la fuente `COPY` instrucciones pueden desreferenciar un enlace simbólico. Los archivos de entorno de ejecución copiados se verifican de nuevo dentro de la imagen. Los metadatos de Git se admiten solo para ese montaje de enlace; no `COPY`
lugares `.git` en una capa de imagen, y el ejecutable Git permanece confinado a la etapa de manifiesto.

"Git metadata" aquí significa dos archivos. El inventario canónico proviene de `git ls-files`, que dice el índice y nunca abre un objeto o una ref, por lo que el contexto de compilación admite solo `.git/index` y
`.git/HEAD` — alrededor de 1 MB, en lugar del almacén de objetos completo del repositorio. Las copias de la etapa manifiesta los coloca en un directorio Git que posee y suministra el directorio vacío `objects/` y `refs/` directorios La comprobación del repositorio de Git requiere. Un contexto sin un manifiesto ni un índice Git falla la compilación con un mensaje que nombra ambas entradas soportadas; nunca vuelve a un marcador de posición.

Un manifiesto generado por host existente sigue siendo compatible: la compilación lo verifica y lo usa en lugar de silenciosamente sustituyéndolo. Archivos faltantes o no coincidentes, archivos de origen adicionales ausentes del manifiesto, y symlinks (incluyendo directorios padre) fallan la compilación. El inventario requiere `package.json`,
`bun.lock`, y `scripts/model-metadata.source.json`; el manifiesto generado es la única fuente archivo exento del inventario. No lo cometas ni lo edites a mano.

```bash
git clone https://github.com/lidge-jun/opencodex.git
cd opencodex
docker compose build
openssl rand -hex 32 | docker compose run --rm -T hub bun run docker/bootstrap-token.ts
docker compose up -d
```

Para un contexto Git remoto, establezca el argumento integrado BuildKit que conserva los metadatos de Git. Por ejemplo, Reemplazar el bloque de construcción del servicio con:

```yaml
services:
  hub:
    pull_policy: build
    build:
      context: https://github.com/lidge-jun/opencodex.git#main
      dockerfile: Dockerfile
      target: runtime
      args:
        BUILDKIT_CONTEXT_KEEP_GIT_DIR: "1"
```

Establecer un puerto host alternativo sin cambiar el contenedor fijo `10100` Oyente:

```bash
OPENCODEX_PORT=10190 docker compose up -d
```

El acceso remoto es una opción explícita. Establecer `OPENCODEX_BIND_ADDRESS` a la LAN o escala de cola del host IP, o usar `0.0.0.0` Publicar en **todos** interfaces de host:

```bash
OPENCODEX_BIND_ADDRESS=0.0.0.0 docker compose up -d
```

Utilice un firewall y un frontend TLS/tailnet autenticado antes de exponer el puerto. El enlace override cambia solo la publicación del host; el oyente del contenedor permanece `0.0.0.0:10100`. Mantenga la misma anulación de enlace en invocaciones posteriores de Compose que recrean el concentrador. Para actualizar una implementación existente, ejecutar `docker compose build` y recrear el centro con `docker compose up -d`; no repita la inicialización token de una sola vez.

Configure los proveedores con el panel de control a través de un frontend de administración propiedad del operador, o con comandos CLI de una sola vez que comparten el volumen de estado. Los siguientes comandos muestran el concentrador remoto existente configuración; sustituya el origen y la identidad del ejemplo antes de habilitarlos:

```bash
docker compose run --rm hub bun run src/cli/index.ts config set hub.managementPublicOrigin '"https://hub-name.tailnet-name.ts.net"'
docker compose run --rm hub bun run src/cli/index.ts config set hub.managementIngress '{"enabled":true,"port":10101}'
docker compose run --rm hub bun run src/cli/index.ts config set remoteGui.allowedTailscaleUsers '["operator@example.com"]'
docker compose restart hub
```

Estos conjuntos anidados funcionan porque la imagen siembra una primera ejecución `hub` configuración, por lo que el objeto Ya existe. En una nueva instalación independiente no lo hace, y las mismas líneas fallan hasta que se crea es — ver [Lanzamiento de Linux systemd o macOS](#linux-systemd-or-macos-launchd) arriba.

El oyente del contenedor se une `0.0.0.0`, por lo que ya es accesible en el propio loopback del contenedor dirección y la forma acompañante de `unauthenticatedLoopbackListener` no se aplica allí — es Rechazado en un enlace comodín. El arranque token a continuación es el equivalente de contenedor del servicio propio paso de aprovisionamiento, y también se ejecuta una vez.

No ponga un token en `ARG`, `ENV`, `COPY`, Componer YAML, historial de imágenes o argumentos de comando. No lo hagas monte el socket Docker, el hogar del host o el hogar Codex, el agente SSH o los archivos de clave de proveedor. Una gestión Ingreso obligado a `127.0.0.1:10101` dentro del contenedor es accesible solo por un frontend TLS/tailnet en el mismo espacio de nombres de red; nunca publique `10101` como un atajo.

Después de que el recipiente esté sano, ejecute una prueba de promoción de preparación por separado:

```bash
docker compose exec hub bun -e \
  "const r=await fetch('http://127.0.0.1:10100/readyz');console.log(r.status,await r.text());if(!r.ok)process.exit(1)"

docker compose exec hub bun -e \
  "const t=(await Bun.file('/home/bun/.opencodex/service-api-token').text()).trim();const r=await fetch('http://127.0.0.1:10100/v1/catalog',{headers:{'x-opencodex-api-key':t}});console.log(r.status);if(!r.ok)process.exit(1)"
```

A continuación, envíe una respuesta enrutada autenticada real con un modelo configurado. Si el secreto está ausente o ilegible, un concentrador no de bucle no debe aceptarse como listo. Nunca trates a la vida sola como prueba.

`docker compose down` elimina el contenedor y la red, pero conserva ambos volúmenes con nombre. Tratar
`docker compose down --volumes` como destructivo: elimina la configuración, las credenciales OAuth, el uso historia, el plano de datos token y el estado persistente Codex juntos.

CI multiplataforma construye la imagen de origen y comprueba el inicio, la admisión token del plano de datos y Recreación de contenedores utilizando un proyecto de Compose aislado con credenciales desechables. Verifica que tanto los volúmenes con nombre como un catálogo sintético sobreviven al reemplazo. Esta comprobación no valida un cuenta de proveedor real, devolución de llamada OAuth, migración de montaje personalizada o cada arquitectura CPU; realizar la comprobación de respuesta enrutada autenticada anterior para su implementación.

<a id="rollback"></a>

## Reversión

Inspeccione las asignaciones de servicio existentes antes de cambiarlas. `tailscale serve reset` Elimina todos los mapas en el nodo; use un comando de eliminación compatible más estrecho cuando existan asignaciones no relacionadas.

```bash
tailscale serve status
tailscale serve reset
ocx config set hub.managementIngress '{"enabled":false}'
ocx service repair
```

Para una reversión de contenedor, conserve tanto los volúmenes de estado con nombre como sus asignaciones. Una imagen más antigua todavía puede usar `CODEX_HOME=/home/bun/.codex` cuando ese directorio permanezca montado; no vuelva a a un archivo de composición anterior que elimina el montaje Codex. No fusione las casas ni vuelva a ejecutar token bootstrap. Para una reversión del servicio, detenga el servicio de la sucursal y repare la versión anterior contra la misma
`OPENCODEX_HOME`. Deshabilitar la entrada de administración o Servir no requiere cambiar el oyente de datos.

<a id="troubleshooting"></a>

## Solución de problemas

- **Hub abajo:** `ocx connect status` Muestra la conexión guardada. `ocx disconnect` puede restaurar estado local sin conexión; no puede revocar la clave remota.
- **Catálogo Stale:** `ocx sync` mantiene un último catálogo válido solo para el concentrador transitorio fracasos. Las fallas de autenticación, esquema, tamaño y protocolo son errores difíciles y nunca vuelven a caer. a proveedores locales.
- **Rotado token o `.prev` recuperación:** reejecución `ocx connect rotate` con un código de emparejamiento o administración token. No edite ni elimine ninguno de los candidatos a token antes de que termine la sonda de recuperación.
- **Desajuste de protocolo:** actualizar el lado más antiguo nombrado por el `hub-too-new` o `hub-too-old` mensaje. La negociación falla antes de que se escriba token, catálogo, diario o estado cliente.
- **Código de emparejamiento perdido o quemado:** ejecutar `ocx hub invite` De nuevo. Las subvenciones son de un solo uso y repetidas Las fallas son limitadas en la velocidad sin revelar si existe un código.
- **`ocx hub invite` dice `No loopback browser origin is admitted for pairing`:** El hub admite que no origen del navegador loopback, por lo que una concesión vinculada al origen nunca podría coincidir. Nada fue acuñado. Ejecutar el
  `ocx config set corsAllowOrigins` rellene las impresiones de error, con el puerto proxy de la máquina de unión. Véase [Invitar a otra máquina](#inviting-another-machine).
- **`ocx hub invite` dice que el origen de los datos anunciados sería el propio bucle de esta máquina:** la bind es solo loopback o un comodín y `hub.dataPublicOrigin` está sin establecer, por lo que no hay dirección para anunciar y nada adivina una red de cola o LAN uno. Nada fue acuñado. Establecer
  `hub.dataPublicOrigin`, o pasar `--data-url` Sólo para esta invitación.
- **Se rechaza el intercambio de la máquina de unión y se gasta el código:** La concesión estaba ligada a un origen que la máquina no presenta. Vuelva a leer el `Bound browser origin:` línea de la invitación — nombra el puerto en el que la otra máquina debe estar funcionando, u ofrece admitir
  `http://localhost:10100` En cambio, en el hub.
- **`ocx hub invite` Se niega a `--management-url`:** en un centro que la bandera confirma
  `hub.managementPublicOrigin` en lugar de anularlo, porque la concesión está vinculada a la valor configurado. Cambie la configuración o suelte la bandera.
- **`ocx claude` en el concentrador lanza Codex/Claude nativo, o el concentrador se niega a escribir su propio cliente configuración:** `unauthenticatedLoopbackListener` Está apagado. El mensaje de omisión nombra la puerta. Habilitar el escuchar y reiniciar el proxy (`ocx service restart` ej., en una instalación de servicio).
- **`ocx claude` en el hub obtiene `404` del oyente:** El proxy sigue siendo el proceso que comenzó antes de que existieran los cables del oyente, o antes de que cambiara el puerto. Reiniciar con
  `ocx service restart` — ver [Operaciones de servicio macOS](#macos-service-operations).
- **`ocx service repair` impreso `nothing to do` y el proceso no rebotó (macOS):** Esperado. Una reparación de un trabajo saludable es deliberadamente una opción prohibida. Cuando quieras un nuevo proceso, ejecuta
  `ocx service restart`, que inicia el trabajo cargado en su lugar e informa
  `service restarted (launchctl kickstart -k …)`. Sólo si eso falla es
  `launchctl kickstart -k gui/$(id -u)/com.opencodex.proxy` el fallback manual — el fallo El mensaje lo nombra.
- **`ocx service install` Rechazar `OPENCODEX_API_AUTH_TOKEN`:** ese valor es un administrador de administración token. `unset OPENCODEX_API_AUTH_TOKEN` y reejecución; el servicio proporciona su propio plano de datos token. Véase [El plano de datos token se aprovisiona](#the-data-plane-token-provisions-itself).
- **El buje se bloquea en el arranque y `ocx status` muestra `admin-collision (file)`:** la
  `service-api-token` archivo contiene la gestión token, por lo que el centro cerca su gestión API cerrado. Eliminar el archivo y ejecutar `ocx service repair` para proporcionar un plano de datos token. Desactivar el variable de entorno no ayuda aquí — el archivo es la fuente.
- **Plain HTTP se negó:** el emparejamiento sobre HTTP no loopback se rechaza por completo, y no hay bandera que opta por salirse de ella. Ponga el origen de administración detrás de HTTPS, o pare sobre loopback. Admin tokens nunca se envían sobre HTTP.
- **`403 origin_rejected` Desde `/v1/catalog` mientras `/readyz` devoluciones `200`:** El oyente de datos es Está obligado a retroceder detrás de una interfaz TLS. Véase [Dar al oyente de datos TLS](#giving-the-data-listener-tls).
- **Finalizó la sesión remota:** Inicie sesión o vuelva a emparejar. El cierre de sesión y la expiración invalidan solo el navegador sesión, no una clave de datos del cliente.
- **Revocación excepcional después de la desconexión:** usar el panel de control del concentrador **Conecte las teclas → API**
  página. Es el único camino de revocación posterior a la desconexión.
<a id="usage-from-a-connected-client"></a>

### Uso desde un cliente conectado

`ocx usage` lee el concentrador conectado con la clave de datos registrada de este cliente. La salida humana identifica la fuente del concentrador y el alcance de la clave del cliente; `--json` devuelve los mismos datos. Gama, superficie, filtros de proveedor / modelo y personalizados `--since`/`--until` Los límites siguen estando disponibles. Los desgloses de cuentas y los registros de otros clientes no se comparten. Un concentrador antiguo o no disponible produce un error explícito en lugar de sustituir el uso local; actualice el concentrador si no admite esta lectura.

El punto final del plano de datos de solo lectura es `GET /v1/usage`, utilizando `x-opencodex-api-key` con una clave de cliente configurada. En todo el entorno y las claves de administración son rechazadas. Acepta `range`, `surface`, `provider`, `model`, `since`, y `until`; se rechazan las opciones desconocidas/repetidas y los identificadores de clave seleccionados por el llamante. Las filas sobredimensionadas omitidas retienen la advertencia explícita de historial incompleto.

Las credenciales de uso del cliente se envían solo a través de HTTPS o loopback HTTP. Tanto la solicitud como la respuesta deshabilitan el almacenamiento en caché.

<a id="pairing-this-browser-with-a-hub"></a>

### Emparejar este navegador con un hub

La inscripción de la máquina y la autenticación del navegador son independientes. El panel de emparejamiento nombra el concentrador y muestra un `ocx gui pair --origin` comando para el origen exacto actualmente abierto en su navegador. Ejecute ese comando en el concentrador o envíelo al operador del concentrador y solicite un código de emparejamiento único. Pegue ese código en el panel; una clave API de datos o admin token no es un código de emparejamiento.

Mientras la autenticación del navegador está pendiente, el panel de control no recomienda reiniciar un cliente conectado saludable. Completar el emparejamiento actualiza los datos del panel de control inmediatamente, incluido un error de autenticación previamente almacenado en caché. La expiración de la sesión vuelve al emparejamiento; la denegación de permiso mantiene su propia guía de configuración de acceso. Otras actualizaciones fallidas pueden mostrar los últimos datos recibidos con un aviso de datos obsoletos y una acción de reintento.

Si se ha intercambiado el código, pero la validación de Remote Link no está disponible temporalmente, mantenga la página abierta y use **Reintentar validación**. Esto comprueba la sesión pendiente del navegador sin gastar otro código de emparejamiento. Las respuestas a los desafíos de Cloudflare también mantienen la sesión pendiente para reintentar. Emparejar solicitudes de intercambio y validación cada vez después de 10 segundos, incluida la lectura del cuerpo de la respuesta, para que el formulario vuelva a ser utilizable. Un tiempo de espera de validación mantiene la sesión instalada pendiente para **Reintentar validación**; una respuesta de intercambio que llega después de su tiempo de espera no puede instalar credenciales. Si el concentrador rechaza definitivamente la sesión con HTTP 401 o 403, el panel de control restaura la sesión del navegador anterior solo mientras el traspaso aún posee el estado de sesión actual y no se ha reemplazado ningún inicio de sesión, cierre de sesión o cambio de destino más reciente; solicite al operador del concentrador un código nuevo para este origen del navegador. Un intercambio de emparejamiento captura la revisión actual de la sesión y el objetivo antes de enviar el código; las respuestas retrasadas no pueden reemplazar una sesión después de que cambie esa revisión. El arranque automático de descubrimiento y la recuperación en segundo plano siguen la misma regla, incluida la conmutación de objetivos hacia atrás y lejos; ninguno anula el cierre de sesión. El cierre de sesión pendiente y completado suprime la recuperación automática hasta que cambie un nuevo inicio de sesión explícito o un nuevo objetivo. Un tiempo de espera de recuperación informa una sesión no disponible solo si su solicitud sigue siendo actual, sin cancelación y sin credenciales; los resultados de arranque tardío se descartan.

Si un oyente auxiliar no puede enlazar, los nombres de inicio `unauthenticatedLoopbackListener` o `hub.managementIngress` y la dirección real. Corregir ese oyente o liberar su dirección; cambiar solo el puerto proxy público no repara un puerto auxiliar fijo. Los bloques de escucha mal formados editados a mano advierten y permanecen desactivados mientras se conservan las configuración no relacionadas.

<a id="return-a-hub-to-standalone"></a>

## Devolver un concentrador a autónomo

Ejecuta `ocx hub disable [--json]` en el concentrador para eliminar `hub`, `unauthenticatedLoopbackListener`, `runtimeRole` y `hostname` juntos en una escritura validada. La configuración del proveedor, el puerto y las teclas API guardadas se conservan. Se rechaza una configuración de cliente o independiente sin cambios.

Las claves no llevan un origen de inscripción verificado y los nombres son editables. Para revocar las claves de cliente, primero inspeccione los ID con `ocx access key list --json`A continuación, seleccione explícitamente cada ID:

```sh
ocx hub disable --revoke-clients --client-key <client-key-id> --json
```

Repetir `--client-key` para varios clientes. Con las llaves guardadas presentes, `--revoke-clients` sin ID seleccionados se rechaza antes de cambiar la configuración. Las identificaciones desconocidas también se niegan. Solo se eliminan las teclas seleccionadas y sus rotaciones pendientes; la salida contiene metadatos seguros en lugar de secretos. El comando imprime el paso de reinicio para el supervisor detectado; no reinicia el proxy. Revisión `tailscale serve status` y otros frontends externos para asignaciones a puertos hub antiguos. La configuración y revocación persistentes se aplican al proxy en ejecución después del reinicio; Los registros de enlace remoto y los túneles permanecen sin cambios.
