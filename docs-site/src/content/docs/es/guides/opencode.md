---
title: "OpenCode"
description: "Utilice cualquier modelo enrutado de código abierto — opencodex inyecta un bloque de proveedor de entorno de ejecución y deja su propia configuración de código abierto intacta."
---

opencode lee a sus proveedores desde las capas de configuración JSON fusionadas en lugar del entorno variables, por lo que no hay `ANTHROPIC_BASE_URL`- Ranura de estilo para inyectar. `ocx opencode`
bridges that gap: asegura que el proxy se está ejecutando, construye un bloque de proveedor desde el catálogo visible, y lo inyecta a través de la capa de entorno de ejecución en línea de OpenCode (`OPENCODE_CONFIG_CONTENT`).

<a id="quickstart"></a>

## Inicio rápido

```bash
ocx opencode
```

Esto asegura que el proxy se está ejecutando y lanza código abierto con el código generado.
`provider.opencodex` y `providers.opencodex` bloques inyectados para ese proceso — el La ortografía heredada lee el código abierto V1 y la ortografía nativa V2. Ambos llevan el esfuerzo de razonamiento variantes en el formato que lee su cliente. Los argumentos adicionales pasan por:
`ocx opencode run "hello"`.

Los modelos enrutados aparecen en el selector debajo de la `opencodex` proveedor:

```text
opencodex/kiro/glm-5
opencodex/gpt-5.6-sol      # native slugs stay unprefixed
```

<a id="reasoning-effort"></a>

## Esfuerzo de razonamiento

Opencode expone el esfuerzo de razonamiento como modelo *variantes*. opencodex escribe una variante por esfuerzos declarados, incluyendo `none` cuando el modelo apoya explícitamente el razonamiento discapacitante. La selección llega al proxy como un esfuerzo de razonamiento, no solo una etiqueta de selector. Existentes Los pines de esfuerzo ascendente en opencodex aún se aplican.

Se generan dos bloques de proveedores para esto:

| Bloquear | Leer por | Lleva variantes |
|---|---|---|
| `provider.opencodex` | código abierto V1 (`npm` + `options`) | Mapa de opciones heredadas |
| `providers.opencodex` | código abierto V2 (`package` + `settings`) | configuración nativa array |

V2 utiliza su matriz variante nativa en lugar del mapa heredado. Los bloques nombran el mismo proveedor y los ID de modelo y se fusionan en una entrada de proveedor. Ningún modelo aparece dos veces. V2 siempre escribe un matriz de variantes, vacía cuando no se declaran opciones, para suprimir automáticamente baja/media/alta Opciones. Los razonadores de profundidad fija conocidos en el bloque heredado desactivan cada uno generado automáticamente Por la misma razón; esas entradas deshabilitadas no son esfuerzos seleccionables.

Se exporta un valor predeterminado de modelo conocido; al seleccionar una variante se anula ese valor predeterminado de cliente. No se inventa ningún valor predeterminado cuando el catálogo declara ninguno. El lanzador regenera estos configuración cada vez; actualizar una integración administrada o volver a exportar una instantánea manual después de cambiar el valor predeterminado en opencodex.

<a id="images-and-attachments"></a>

## Imágenes y archivos adjuntos

opencode decide si un modelo toma una imagen de la entrada del modelo en sí, y no puede preguntar models.dev sobre `opencodex` — este proveedor no está allí. Los bloques generados Llevar los campos de capacidad por modelo tomados de los metadatos efectivos de los informes proxy en
`GET /api/models`. Por ejemplo, el bloque heredado lleva `attachment` y `modalities`:

```json
"gpt-5.6-luna": {
  "name": "gpt-5.6-luna (native)",
  "limit": { "context": 272000, "output": 128000 },
  "attachment": true,
  "modalities": { "input": ["text", "image"], "output": ["text"] }
}
```

V2 recibe nativo `capabilities.input` y `capabilities.output` campos; soporte de herramientas conocido usos `capabilities.tools`. Los clientes heredados leen los campos del ejemplo anterior. Cuando el catálogo informa la entrada de imagen para un modelo que cubre el sidecar de visión, opencode permite adjunto a través de modo que el sidecar pueda describirlo antes de la llamada de origen.

V2 requiere un `tools` booleano siempre que exista el objeto de capacidades nativas. Cuando soporte de herramientas es desconocido, ese objeto se omite; las modalidades de entrada conocidas aún alcanzan V2 a través del legado migración del bloque. Esto evita inventar el soporte de herramientas o invalidar la configuración nativa del proveedor.

Las capacidades desconocidas dejan en su lugar las propias suposiciones de reserva de OpenCode; no se detectan proveedores de hechos. Los metadatos explícitos de solo texto evitan las solicitudes de imágenes en el lado del cliente.

Los modelos personalizados heredan metadatos de catálogo conocidos a menos que se almacene una anulación explícita. Una costumbre La declaración de entrada de texto solo permanece como texto. Las capacidades desconocidas se omiten en lugar de Una escalera de razonamiento vacía explícita no declara al modelo incapaz de razonar.

<a id="your-own-config-is-never-modified"></a>

## Su propia configuración nunca se modifica

El lanzador no copia ni reescribe `~/.config/opencode/opencode.json`, proyecto `opencode.json` / `opencode.jsonc`o cualquier otra capa de configuración en disco. Puede lean la configuración global o de proyecto para detectar que un proveedor anula — bajo `provider.opencodex`
o `providers.opencodex` — mientras sus proveedores, agentes, combinaciones de teclas, entradas MCP existentes, y relativo `{file:…}` referencias siguen resolviendo de sus archivos originales.

Solo para este lanzamiento, opencodex agrega ambos bloques generados — `provider.opencodex` y
`providers.opencodex` — a través de la capa de ejecución en línea de OpenCode. Esa capa se fusiona después de la configuración global/custom/proyecto y anula solo las claves contradictorias para el proceso hijo.

| Capa | Comportamiento con `ocx opencode` |
| --- | --- |
| Global / custom / config del proyecto | Dejado en el disco exactamente como lo escribiste |
| Tiempo de ejecución en línea (`OPENCODE_CONFIG_CONTENT`) | Recibe el generado `provider.opencodex` y `providers.opencodex` bloques (fusionados en cualquier configuración heredada en línea) |
| Relativo `{file:…}` trayectorias | Sigue resolviendo contra el archivo de configuración que los definió originalmente |

Si una configuración global o de proyecto también define el proveedor bajo `provider.opencodex` o
`providers.opencodex`, el lanzador imprime una nota informativa: la capa de entorno de ejecución de
`ocx opencode` lo anula para ese lanzamiento.

<a id="putting-the-block-into-your-own-config"></a>

## Poner el bloque en su propia configuración

`ocx opencode` inyecta el bloque de proveedor para un solo lanzamiento, lo que significa `opencode` todavía No se sabe nada del proxy. Cuando usted quiere modelos encaminados disponibles de llano `opencode` — o desde una extensión de editor que nunca pasa por el lanzador — `ocx export` Imprime lo mismo bloque de proveedor para que usted pueda combinar en su propia configuración:

```bash
ocx export --client opencode
```

El proxy debe estar en ejecución. El comando imprime la configuración, el destino canónico (`~/.config/opencode/opencode.json`, o bajo `XDG_CONFIG_HOME` cuando se establece), la combinación aviso, y la línea de exportación env. Nunca toca ese archivo — la sección anterior se mantiene verdadera, y mover el bloque a su configuración es su acto explícito.

:::caution[Combina la configuración; no la reemplaces]
Combinar ambos bloques — `provider.opencodex` y `providers.opencodex` — en su configuración existente. Reemplazar todo el archivo con el exportado destruye sus otros proveedores, agentes, keybinds, y entradas MCP. `ocx export --out` se niega a sobrescribir un archivo existente por exactamente esta razón, así punto `--out` en una ruta de rasguño y copiar los bloques a través de:

```bash
ocx export --client opencode --out ~/opencodex-opencode.json
```
:::

A diferencia del bloque de entorno de ejecución del lanzador, un bloque fusionado es una instantánea estática: no sigue su catálogo. Relanzamiento `ocx export` después de agregar un proveedor o cambiar la visibilidad del modelo o los metadatos. Alternativamente, [Habilitar la integración gestionada](/es/guides/integrations/): `ocx sync` con seguridad refresca sus bloques ya propios, dejando intactos los bloques editados a mano o eliminados.

Una vez combinado, exportar la clave de admisión antes de iniciar opencode — a menos que el proxy está en bucle, donde no se necesita:

```bash
export OPENCODEX_OPENCODE_API_KEY=<your key>
```

<a id="the-admission-key-is-not-written-to-disk"></a>

## La clave de admisión no se escribe en el disco

Cuando el proxy requiere una clave API, la configuración de entorno de ejecución en línea lleva código abierto
`{env:…}` referencia en lugar del secreto. Loopback vincula el uso de esa referencia como
`apiKey`; los enlaces non-loopback lo envían solo a través de `x-opencodex-api-key` así proxy La admisión se mantiene separada de cualquier `Authorization` cabecera.

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

El valor real se transmite solo a través del entorno de proceso hijo.
`OPENCODEX_API_AUTH_TOKEN` tiene prioridad, luego el archivo token de servicio endurecido, luego una clave API configurada — que es lo que requiere un enlace sin bucle.

Un enlace de bucle invertido (`127.0.0.1`, el valor predeterminado) no autentica nada, por lo que la `{env:…}` referencia es inerte y puede dejar la variable sin ajustar. Importa sólo cuando `hostname` se establece más allá de loopback; ver [Acceso remoto](/es/reference/configuration/server/#remote-access). Esta clave de admisión es opencodex propio, y no está relacionado con las claves de proveedor de origen configuradas bajo
[Proveedores](/es/guides/providers/).

<a id="reverting"></a>

## Revertir

No hay nada que deshacer — ningún archivo de configuración generado está escrito bajo `~/.opencodex`. Ejecutar llano
`opencode` y lee tu propia configuración exactamente como antes.

<a id="model-limits"></a>

## Límites de modelo

`limit.context` se escribe solo cuando el catálogo informa de una ventana de contexto autorizada; No, el conjunto `limit` bloque se omite y el código abierto mantiene sus propios valores predeterminados.

Los límites de salida utilizan el máximo conocido del modelo a partir del catálogo o metadatos generados. Solo los límites desconocidos vuelven a caer `32000`. El límite de salida siempre está sujeto a la ventana de contexto, incluidos los límites conocidos a continuación. `32000`.

Los límites de entrada conocidos también se transportan y se fijan al contexto; se omiten los límites de entrada desconocidos. CLI exportar, exportación de panel de instrumentos, actualización administrada y el lanzador comparten los metadatos efectivos.

Los `opencodex` El bloque del proveedor se regenera en cada lanzamiento, por lo que los configuración por modelo se realizan dentro de él No sobrevivirá. Mantenga las entradas personalizadas bajo su propia clave de proveedor.

<a id="requirements"></a>

## Necesidades

código abierto debe estar instalado y en `PATH`:

```bash
npm install -g opencode-ai
```

El lanzador lee el catálogo de modelos con el administrador local token desde el entorno o desde la casa proxy en ejecución. Se conecta directamente a un oyente de administración de loopback y rechaza las redirecciones. Un concentrador vinculado solo a una dirección no local necesita su loopback `hub.managementIngress` habilitado. El administrador token no se pasa al hijo de OpenCode; la inferencia continúa usando su clave de datos separada. Si falta el administrador local token, el lanzador informa del problema en lugar de volver a intentar con una clave de datos.
