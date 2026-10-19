---
title: "Plugins locales"
description: "Cargue su propio código en el proxy al inicio para reescribir los envíos del proveedor, por ejemplo, para poner un proxy de compresión local frente a los proveedores."
---

Un plugin local es un archivo JavaScript que `ocx start` carga antes de que comience el proxy Servir. Puede ver a cada proveedor enviar justo antes de que abandone el proceso y redirigirlo o agregar cabeceras — suficiente para colocar un sidecar local (un proxy de compresión, una grabadora) frente a los proveedores sin cambiar la propia opencodex.

Los plugins son locales para una instalación. opencodex no los descarga, actualiza ni firma.

<a id="where-plugins-live"></a>

## Donde viven los plugins

Ponga los archivos del plugin en `plugins/` dentro del hogar opencodex (`~/.opencodex/plugins/` o `$OPENCODEX_HOME/plugins/` cuando esa variable esté establecida):

```text
~/.opencodex/plugins/
  my-sidecar.ts
```

- Los archivos que terminan en `.ts`, `.js` o `.mjs` se cargan en orden de nombre.
- Los nombres que comienzan con `.` o `_`, y `*.d.ts`, se ignoran: cambie el nombre de un complemento a `_my-sidecar.ts` para apagarlo.
- El directorio es opcional. Sin ella no hay nada cargado.
- Un plugin se ejecuta dentro del proxy con sus credenciales, por lo que opencodex rechaza un archivo plugin o un directorio `plugins/` que es propiedad de otro usuario o escribible por grupo u otros, y rechaza enlaces simbólicos. Cada directorio por encima de `plugins/`, hasta `/`, también debe ser propiedad de usted o root y no escribirse por grupo u otros, a menos que sea pegajoso como `/tmp`. Arreglar permisos con `chmod go-w ~/.opencodex/plugins ~/.opencodex/plugins/*`; en sistemas cuya máscara predeterminada es `002`, compruebe los directorios padre también. En macOS, una concesión de ACL a otro usuario o grupo que puede escribir, eliminar, cambiar permisos o agregar / quitar bloques de entradas de ruta de carga, incluso si el modo es `0600`; inspeccionar la ruta en sí con `/bin/ls -lebd -- <path>`. Solo lectura, denegación, solo herencia y concesiones solo al propietario de la ruta o al usuario en ejecución no bloquean la carga. Los nombres de visualización ACL como `root` o `0` no se tratan como prueba UID numérica. En Linux, se comprueban las ACL extendidas cuando `getfacl` está instalado. Sin ella, solo se verifican los bits de propietario y modo.
- En Windows, la carga automática del complemento está desactivada hasta que esté disponible una verificación de confianza ACL.

Reinicie el proxy después de agregar, cambiar o eliminar un plugin (`ocx service restart`, o detener e iniciar `ocx start` ). Cada plugin cargado imprime una línea `Plugin loaded: <name>` al inicio; un plugin omitido imprime una categoría de razón limitada. El texto de excepción del complemento RAW nunca se imprime automáticamente.

Para empezar una vez sin plugins, establece `OCX_PLUGINS=0`.

<a id="writing-a-plugin"></a>

## Escribir un plugin

Un complemento predeterminado exporta un objeto con una función opcional `name` y una función `setup`. `setup` recibe un contexto. Un `setup` asíncrono tiene cinco segundos para terminar; los plugins se ejecutan en el propio hilo del proxy, por lo que un `setup` que se bloquea de forma síncrona no se puede interrumpir y retrasa el inicio hasta que regrese. Un `setup` que expira tampoco se detiene: los servidores o temporizadores ya comenzaron a funcionar, así que inicie recursos de larga duración solo después del trabajo que puede fallar.

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

Los plugins no pueden importar módulos opencodex - en el binario empaquetado no están en disco. Declare las interfaces pequeñas que necesita localmente, como anteriormente.

<a id="how-rewrites-behave"></a>

## Cómo se comportan las reescrituras

- El rewriter se ejecuta sincrónicamente en cada proveedor envía más de HTTP y en la conexión Codex WebSocket, después de opencodex ha elegido el transporte. Manténgalo rápido; haga comprobaciones de red (sondas de salud) en segundo plano y lea un resultado almacenado en caché en el rewriter.
- Un envío redirigido a una dirección de loopback (`127.0.0.1`, `::1`, `localhost`) conecta directamente, sobre HTTP y sobre el Codex WebSocket, ignorando los proxies del proveedor y `HTTP_PROXY`: un proxy en otro lugar no puede alcanzar el loopback de esta máquina. Cualquier otro destino sigue la configuración de salida normal (incluyendo `NO_PROXY`), evaluado contra la URL reescrita, en ambos transportes.
- La reescritura Codex WebSocket se ejecuta por cada turno, antes de que se reutilice un socket agrupado inactivo, y un socket solo se reutiliza para el mismo destino y los mismos encabezados reescritos, aparte de los dos encabezados `x-codex-turn-state` y `x-codex-turn-metadata` por turno. Aquellos que viajan dentro de cada marco de solicitud y pueden diferir entre intercambios en un zócalo; los cambios que realiza un reescritor se descartan. Un plugin que inicia o detiene la redirección tiene efecto en el siguiente turno.
- Se ejecuta después de que opencodex haya elegido el proveedor, la cuenta y la ruta, por lo que no cambia el enrutamiento, la selección de cuentas, los reintentos ni los registros de solicitudes.
- Un envío redirigido va al host que usted eligió. Ese host ve la solicitud exactamente como lo haría el proveedor, credenciales incluidas.
- Si un reescritor lanza, opencodex deshace las ediciones de ese reescritor en el envío y lo deshabilita para el resto del proceso. Ediciones hechas por los reescritores que se ejecutaron antes de que se mantuvieran, por lo que el envío sale como los dejó (sin modificar cuando es el único complemento). Si `setup` se agota o se agota el tiempo, se omite el complemento, se elimina cualquier cosa registrada y se ignoran los intentos de registro posteriores; otros complementos y el proxy comienzan normalmente.
- Un directorio de plugins que existe pero no se puede leer (por ejemplo, permisos incorrectos) se informa al inicio en lugar de tratarse como vacío.
