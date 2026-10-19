---
title: "Plugins locales"
description: "Cargue su propio código en el proxy al inicio para reescribir los envíos del proveedor, por ejemplo, para poner un proxy de compresión local frente a los proveedores."
---

Un plugin local es un archivo JavaScript que `ocx start` carga antes de que comience el proxy Servir. Puede ver a cada proveedor enviar justo antes de que abandone el proceso y redirigirlo o agregar cabeceras — suficiente para colocar un sidecar local (un proxy de compresión, una grabadora) frente a los proveedores sin cambiar la propia opencodex.

Los plugins son locales para una instalación. opencodex no los descarga, actualiza ni firma.

<a id="where-plugins-live"></a>

## Donde viven los plugins

Poner los archivos del plugin en `plugins/` dentro de la casa opencodex (`~/.opencodex/plugins/`, o
`$OPENCODEX_HOME/plugins/` cuando se establece esa variable):

```text
~/.opencodex/plugins/
  my-sidecar.ts
```

- Archivos que terminan en `.ts`, `.js` o `.mjs` se cargan en orden de nombre.
- Nombres que comienzan con `.` o `_`, y `*.d.ts`, se ignoran — cambiar el nombre de un plugin a `_my-sidecar.ts`
  para apagarlo.
- El directorio es opcional. Sin ella no hay nada cargado.
- Un complemento se ejecuta dentro del proxy con sus credenciales, por lo que opencodex rechaza un archivo de complemento o un
  `plugins/` directorio que es propiedad de otro usuario o escribible por grupo u otros, y se niega Enlaces simbólicos. Todos los directorios de arriba `plugins/`, hasta `/`, también debe ser propiedad de usted o root y no se puede escribir por grupo u otros, a menos que sea pegajoso como `/tmp`. Arreglar permisos con
  `chmod go-w ~/.opencodex/plugins ~/.opencodex/plugins/*`; en sistemas cuya máscara predeterminada es
  `002`, comprueba también los directorios padre. En macOS, una concesión ACL a otro usuario o grupo que puede escribir, eliminar, cambiar permisos o agregar/eliminar bloques de entradas de ruta de acceso cargando, incluso si el moda es `0600`Inspeccione el camino mismo con `/bin/ls -lebd -- <path>`. Solo lectura, negación, solo herencia, y las concesiones solo para el propietario de la ruta o usuario en ejecución no bloquean la carga. ACL Mostrar nombres como `root` o `0` no se tratan como prueba UID numérica. En Linux, extendido Los ACL se comprueban cuando `getfacl` está instalado. Sin ella, solo se verifican los bits de propietario y modo.
- En Windows, la carga automática del complemento está deshabilitada hasta que esté disponible una verificación de confianza de ACL.

Reinicie el proxy después de agregar, cambiar o eliminar un complemento (`ocx service restart`o parar y Inicio `ocx start`) Cada plugin cargado imprime un `Plugin loaded: <name>` línea en el inicio; un salto plugin imprime una categoría de razón limitada. El texto de excepción del complemento RAW nunca se imprime automáticamente.

Para comenzar una vez sin plugins, establezca `OCX_PLUGINS=0`.

<a id="writing-a-plugin"></a>

## Escribir un plugin

Un plugin por defecto exporta un objeto con una opción `name` y a `setup` función. `setup` recibe un contexto. Un asíncrono `setup` tiene cinco segundos para terminar; los plugins se ejecutan en el propio hilo del proxy, por lo que a `setup` que bloquea sincrónicamente no se puede interrumpir y retrasa el inicio hasta que vuelva. A
`setup` que los tiempos de espera no se detiene tampoco: servidores o temporizadores ya comenzó a seguir funcionando, por lo que iniciar recursos de larga duración solo después del trabajo que puede fallar.

```ts
interface UpstreamTarget {
  url: string;            // absolute upstream URL; assign a new one to redirect
  headers: Headers;       // outbound headers, including credentials — never log them
  readonly transport: "http" | "websocket";
}

export default {
  name: "my-sidecar",
  setup(ctx: {
    log(message: string): void;
    registerUpstreamRewriter(rewrite: (target: UpstreamTarget) => void): void;
    onShutdown(teardown: () => void): void;
  }) {
    ctx.registerUpstreamRewriter(target => {
      const upstream = new URL(target.url);
      if (!upstream.pathname.endsWith("/chat/completions")) return;
      target.url = `http://127.0.0.1:9000${upstream.pathname}${upstream.search}`;
      target.headers.set("x-original-origin", upstream.origin);
    });
  },
};
```

El contexto también lleva `name`, `configDir` (la casa opencodex) y `pluginDir`.

Los plugins no pueden importar módulos opencodex — en el binario empaquetado que no están en disco. Declarar el pequeñas interfaces que necesita localmente, como arriba.

<a id="how-rewrites-behave"></a>

## Cómo se comportan las reescrituras

- El rewriter se ejecuta sincrónicamente en cada proveedor enviar sobre HTTP y en el Codex WebSocket conexión, después de que opencodex haya elegido el transporte. Manténgalo rápido; haga comprobaciones de red (salud sondas) en segundo plano y leer un resultado almacenado en caché en el rewriter.
- A enviar redirigido a una dirección de bucle (`127.0.0.1`, `::1`, `localhost`) conecta directamente, sobre HTTP y sobre el Codex WebSocket, ignorando los proxies del proveedor y `HTTP_PROXY`: un proxy en otro lugar no puede alcanzar el loopback de esta máquina. Cualquier otro destino sigue la configuración normal de salida (incluyendo `NO_PROXY`), evaluado contra el URL reescrito, en ambos transportes.
- El rewriter Codex WebSocket se ejecuta para cada turno, antes de que se reutilice un socket agrupado inactivo, y socket solo se reutiliza para el mismo destino y los mismos encabezados reescritos, aparte de los dos cabeceras por giro `x-codex-turn-state` y `x-codex-turn-metadata`. Los que viajan dentro de cada marco de solicitud y puede diferir entre intercambios en un socket; cambia un rewriter hace a ellos están descartados. Un plugin que inicia o detiene la redirección toma efecto en el siguiente turno.
- Se ejecuta después de que opencodex haya elegido el proveedor, la cuenta y la ruta, por lo que no cambia el enrutamiento, selección de cuentas, reintentos o registros de solicitudes.
- Un envío redirigido va al host que usted eligió. Ese host ve la solicitud exactamente como el proveedor Lo haría, las credenciales incluidas.
- Si un rewriter lanza, opencodex deshace las ediciones de ese rewriter al enviar y lo deshabilita para el resto del proceso. Ediciones hechas por reescritores que corrieron antes de que se guardaran, por lo que el envío sale como quienes lo dejaron (sin modificar cuando es el único plugin). Si `setup` se lanza o se agota el tiempo, se omite el plugin, todo lo que registró se elimina, y los intentos posteriores de registro se ignoran; plugins y el proxy comienzan normalmente.
- Un directorio de plugins que existe pero no se puede leer (por ejemplo, permisos incorrectos) se reporta en en lugar de ser tratados como vacíos.
