---
title: "OpenCode"
description: "Utilice cualquier modelo enrutado de código abierto — opencodex inyecta un bloque de proveedor de entorno de ejecución y deja su propia configuración de código abierto intacta."
---

opencode lee sus proveedores desde las capas de configuración JSON fusionadas en lugar de las variables de entorno, por lo que no hay una ranura de estilo `ANTHROPIC_BASE_URL` para inyectar. `ocx opencode` une ese espacio: asegura que el proxy se está ejecutando, construye un bloque de proveedor desde el catálogo visible e inyecta a través de la capa de entorno de ejecución en línea de OpenCode (`OPENCODE_CONFIG_CONTENT`).

<a id="quickstart"></a>

## Inicio rápido

```bash
ocx opencode
```

Esto asegura que el proxy se está ejecutando y lanza código abierto con los bloques `provider.opencodex` y `providers.opencodex` generados inyectados para ese proceso: las lecturas de código abierto de ortografía heredada V1 y la ortografía nativa V2. Ambos llevan variantes de esfuerzo de razonamiento en el formato que lee su cliente. Los argumentos adicionales pasan: `ocx opencode run "hello"`.

Los modelos enrutados aparecen en el selector bajo el proveedor `opencodex`:

```text
opencodex/kiro/glm-5
opencodex/gpt-5.6-sol      # native slugs stay unprefixed
```

<a id="reasoning-effort"></a>

## Esfuerzo de razonamiento

Opencode expone el esfuerzo de razonamiento como modelo *variantes*. opencodex escribe una variante por esfuerzo declarado, incluyendo `none` cuando el modelo explícitamente apoya el razonamiento incapacitante. La selección llega al proxy como un esfuerzo de razonamiento, no solo una etiqueta de selector. Los pasadores de esfuerzo corriente arriba existentes en opencodex todavía se aplican.

Se generan dos bloques de proveedores para esto:

| Bloquear | Leer por | Lleva variantes |
|---|---|---|
| `provider.opencodex` | Código abierto V1 ( `npm` + `options` ) | Mapa de opciones heredadas |
| `providers.opencodex` | Código abierto V2 ( `package` + `settings` ) | configuración nativa array |

V2 utiliza su matriz variante nativa en lugar del mapa heredado. Los bloques nombran los mismos ID de proveedor y modelo y se fusionan en una entrada de proveedor. Ningún modelo aparece dos veces. V2 siempre escribe una matriz variante, vacía cuando no se declaran opciones, para suprimir las opciones automáticas baja/media/alta. Los razonadores de profundidad fija conocidos en el bloque heredado deshabilitan cada peldaño generado automáticamente por la misma razón; esas entradas deshabilitadas no son esfuerzos seleccionables.

Se exporta un valor predeterminado de modelo conocido; al seleccionar una variante se anula ese valor predeterminado de cliente. No se inventa ningún valor predeterminado cuando el catálogo declara ninguno. El lanzador regenera estos ajustes cada vez; actualizar una integración administrada o volver a exportar una instantánea manual después de cambiar el valor predeterminado en opencodex.

<a id="images-and-attachments"></a>

## Imágenes y archivos adjuntos

opencode decide si un modelo toma una imagen de la entrada del modelo en sí, y no puede preguntar a models.dev sobre `opencodex` - este proveedor no está allí. Por lo tanto, los bloques generados llevan campos de capacidad por modelo tomados de los metadatos efectivos que el proxy informa en `GET /api/models`. Por ejemplo, el bloque heredado lleva `attachment` y `modalities`:

```json
"gpt-5.6-luna": {
  "name": "gpt-5.6-luna (native)",
  "limit": { "context": 272000, "output": 128000 },
  "attachment": true,
  "modalities": { "input": ["text", "image"], "output": ["text"] }
}
```

V2 recibe campos nativos `capabilities.input` y `capabilities.output`; el soporte de herramientas conocido utiliza `capabilities.tools`. Los clientes heredados leen los campos del ejemplo anterior. Cuando el catálogo informa de la entrada de imagen para un modelo que cubre el sidecar de visión, el código abierto permite que el archivo adjunto pase para que el sidecar pueda describirlo antes de la llamada ascendente.

V2 requiere un booleano `tools` siempre que exista el objeto de capacidades nativas. Cuando se desconoce el soporte de la herramienta, se omite ese objeto; las modalidades de entrada conocidas aún alcanzan V2 a través de la migración del bloque heredado. Esto evita inventar el soporte de herramientas o invalidar la configuración nativa del proveedor.

Las capacidades desconocidas dejan en su lugar las propias suposiciones de reserva de OpenCode; no se detectan hechos del proveedor. Los metadatos explícitos de solo texto evitan las solicitudes de imágenes en el lado del cliente.

Los modelos personalizados heredan metadatos de catálogo conocidos a menos que se almacene una anulación explícita. Una entrada personalizada que declara texto solo permanece como texto. Las capacidades desconocidas se omiten en lugar de inventarse; una escalera explícita de razonamiento vacía no declara que el modelo sea incapaz de razonar.

<a id="your-own-config-is-never-modified"></a>

## Su propia configuración nunca se modifica

El lanzador no copia ni reescribe `~/.config/opencode/opencode.json`, proyecto `opencode.json` / `opencode.jsonc`, o cualquier otra capa de configuración en el disco. Puede leer la configuración global o del proyecto para detectar la anulación de un proveedor (bajo `provider.opencodex` o `providers.opencodex`), mientras que sus proveedores, agentes, combinaciones de teclas, entradas MCP y referencias relativas `{file:…}` siguen resolviendo sus archivos originales.

Solo para este lanzamiento, opencodex agrega ambos bloques generados, `provider.opencodex` y `providers.opencodex`, a través de la capa de entorno de ejecución en línea de OpenCode. Esa capa se fusiona después de la configuración global/custom/project y anula solo las claves conflictivas para el proceso hijo.

| Capa | Comportamiento con `ocx opencode` |
| --- | --- |
| Global / custom / config del proyecto | Dejado en el disco exactamente como lo escribiste |
| Tiempo de ejecución en línea ( `OPENCODE_CONFIG_CONTENT` ) | Recibe los bloques `provider.opencodex` y `providers.opencodex` generados (fusionados en cualquier configuración heredada en línea) |
| Rutas relativas `{file:…}` | Sigue resolviendo contra el archivo de configuración que los definió originalmente |

Si una configuración global o de proyecto también define el proveedor bajo `provider.opencodex` o `providers.opencodex`, el iniciador imprime una nota informativa: la capa de entorno de ejecución de `ocx opencode` la anula para ese inicio.

<a id="putting-the-block-into-your-own-config"></a>

## Poner el bloque en su propia configuración

`ocx opencode` inyecta el bloque de proveedor para un solo lanzamiento, lo que significa que el simple `opencode` todavía no sabe nada sobre el proxy. Cuando desee que los modelos enrutados estén disponibles desde el plano `opencode`, o desde una extensión de editor que nunca pasa por el lanzador, `ocx export` imprime el mismo bloque de proveedor para que pueda fusionarlo en su propia configuración:

```bash
ocx export --client opencode
```

El proxy debe estar en ejecución. El comando imprime la configuración, el destino canónico (`~/.config/opencode/opencode.json`, o bajo `XDG_CONFIG_HOME` cuando está establecido), la advertencia de fusión y la línea de exportación env. Nunca toca ese archivo: la sección anterior se mantiene verdadera, y mover el bloque a su configuración es su acto explícito.

:::caution[Combina la configuración; no la reemplaces]
Combinar ambos bloques — `provider.opencodex` y `providers.opencodex` — en su configuración existente. Reemplazar todo el archivo con el exportado destruye sus otros proveedores, agentes, keybinds, y entradas MCP. `ocx export --out` se niega a sobrescribir un archivo existente por exactamente esta razón, así punto `--out` en una ruta de rasguño y copiar los bloques a través de:

```bash
ocx export --client opencode --out ~/opencodex-opencode.json
```
:::

A diferencia del bloque de entorno de ejecución del lanzador, un bloque fusionado es una instantánea estática: no sigue su catálogo. Vuelva a ejecutar `ocx export` después de agregar un proveedor o cambiar la visibilidad del modelo o los metadatos. Alternativamente, [Habilitar la integración gestionada](/es/guides/integrations/): `ocx sync` actualiza de forma segura sus bloques ya propiedad, dejando bloques editados a mano o eliminados intactos.

Una vez combinado, exportar la clave de admisión antes de iniciar opencode - a menos que el proxy está en loopback, donde no se necesita:

```bash
export OPENCODEX_OPENCODE_API_KEY=<your key>
```

<a id="the-admission-key-is-not-written-to-disk"></a>

## La clave de admisión no se escribe en el disco

Cuando el proxy requiere una clave API, la configuración de entorno de ejecución en línea lleva la referencia `{env:…}` de código abierto en lugar del secreto. Loopback vincula el uso de esa referencia como `apiKey`; non-loopback vincula enviarlo solo a través de `x-opencodex-api-key` por lo que la admisión proxy se mantiene separada de cualquier encabezado `Authorization` aguas arriba.

Ejemplo de Loopback:

```json
"options": {
  "baseURL": "http://127.0.0.1:10100/v1",
  "apiKey": "{env:OPENCODEX_OPENCODE_API_KEY}"
}
```

Ejemplo no loopback:

```json
"options": {
  "baseURL": "http://192.168.1.10:10100/v1",
  "headers": {
    "x-opencodex-api-key": "{env:OPENCODEX_OPENCODE_API_KEY}"
  }
}
```

El valor real se transmite solo a través del entorno del proceso hijo. `OPENCODEX_API_AUTH_TOKEN` tiene prioridad, luego el archivo de token de servicio endurecido, luego una clave configurada API, que es lo que requiere un enlace sin bucle.

Un enlace de loopback (`127.0.0.1`, el valor predeterminado) no autentica nada, por lo que la referencia `{env:…}` es inerte y puede dejar la variable sin establecer. Importa solo cuando `hostname` se establece más allá de loopback; ver [Acceso remoto](/es/reference/configuration/server/#remote-access). Esta clave de admisión es propia de opencodex y no está relacionada con las claves de proveedor de origen configuradas bajo [Proveedores](/es/guides/providers/).

<a id="reverting"></a>

## Revertir

No hay nada que deshacer - ningún archivo de configuración generado está escrito bajo `~/.opencodex`. Ejecute el plano `opencode` y lee su propia configuración exactamente como antes.

<a id="model-limits"></a>

## Límites de modelo

`limit.context` se escribe solo cuando el catálogo informa de una ventana de contexto autorizada; cuando no lo hace, se omite todo el bloque `limit` y el código abierto mantiene sus propios valores predeterminados.

Los límites de salida utilizan el máximo conocido del modelo a partir del catálogo o de los metadatos generados. Solo los límites desconocidos se remontan a `32000`. El límite de salida siempre se fija a la ventana de contexto, incluidos los límites conocidos por debajo de `32000`.

Los límites de entrada conocidos también se transportan y se fijan al contexto; se omiten los límites de entrada desconocidos. CLI exportación, exportación de tablero de instrumentos, actualización administrada y el lanzador comparten los metadatos efectivos.

El bloque de proveedores `opencodex` se regenera en cada lanzamiento, por lo que los ajustes por modelo realizados en su interior no sobrevivirán. Mantenga las entradas personalizadas bajo su propia clave de proveedor.

<a id="requirements"></a>

## Necesidades

opencode debe estar instalado y en `PATH`:

```bash
npm install -g opencode-ai
```

El lanzador lee el catálogo del modelo con el token de administración local desde el entorno o desde la casa proxy en ejecución. Se conecta directamente a un oyente de administración de loopback y rechaza las redirecciones. Un concentrador vinculado solo a una dirección no local necesita su loopback `hub.managementIngress` habilitado. El token de administración no se pasa al hijo de OpenCode; la inferencia continúa usando su clave de datos separada. Si falta el token de administración local, el lanzador informa el problema en lugar de volver a intentar con una clave de datos.
