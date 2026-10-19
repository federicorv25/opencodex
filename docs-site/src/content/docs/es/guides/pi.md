---
title: "Pi"
description: "Utilice cualquier modelo enrutado de Pi — ocx export escribe un bloque de proveedor personalizado para el models.json de Pi, conectado al proxy en ejecución."
---

Pi lee a sus proveedores desde un único archivo global JSON en lugar de variables de entorno, por lo que opencodex no lo lanza. En cambio, `ocx export` serializa el `opencodex` bloque de proveedores — base URL, la lista de modelos y la referencia env Pi interpolan — y usted lo fusiona en su propio config.

<a id="quickstart"></a>

## Inicio rápido

Inicie el proxy y, a continuación, imprima la configuración:

```bash
ocx start
ocx export --client pi
```

La salida lleva con el JSON, entonces imprime la ruta de destino, el aviso de fusión, el env línea de exportación, y cuántos modelos llevan límites de contexto autorizados.

```json
{
  "providers": {
    "opencodex": {
      "baseUrl": "http://127.0.0.1:10100/v1",
      "api": "openai-completions",
      "apiKey": "$OPENCODEX_API_KEY",
      "compat": {
        "sendSessionAffinityHeaders": true,
        "supportsDeveloperRole": false
      },
      "models": [
        {
          "id": "anthropic/claude-opus-5",
          "name": "Claude Opus 5 (anthropic)",
          "input": ["text"],
          "contextWindow": 200000,
          "maxTokens": 128000
        }
      ]
    }
  }
}
```

Los proveedores de Pi generados permiten `compat.sendSessionAffinityHeaders`. Mantenga este indicador al fusionar o editar manualmente el proveedor: Pi proporciona una identidad de sesión estable y OpenCodex deriva afinidad canónica OpenCode Go de ella. Pi puede omitir la identidad cuando `cacheRetention` es `none`.

Los proveedores de Pi generados también se establecen `compat.supportsDeveloperRole` a `false`, por lo que Pi envía su mensaje de sistema como `system` en lugar de `developer`. OpenCodex reenvía los roles Chat Completions tal como se envían, y varios flujos ascendentes compatibles con OpenAI rechazan `developer` con un 400; cada corriente ascendente acepta `system`.

Los ID de modelo son los selectores canónicos del proxy, por lo que los modelos enrutados aparecen como `provider/model`
(`anthropic/claude-opus-5`) y las babosas nativas OpenAI permanecen sin prefijar (`gpt-5.6-sol`) Los `name`
sufijo — `(anthropic)`, `(native)`, `(routed)` — es lo que hace que dos modelos con el mismo nombre de diferentes de origen distinguibles en el selector de Pi.

<a id="where-it-goes"></a>

## A donde va

La configuración del modelo global de Pi es:

```text
~/.pi/agent/models.json
```

:::caution[Combina la configuración; no la reemplaces]
`ocx export` Nunca escribe ese archivo. Combinar el `providers.opencodex` bloque en él — reemplazar el El archivo destruye todos los demás proveedores que haya configurado allí. `--out` existe para un camino de rasguño y se niega a sobrescribir un archivo existente sin `--force`:

```bash
ocx export --client pi --out ~/opencodex-pi-models.json
ocx export --client pi --json > ~/opencodex-pi-models.json   # or redirect the byte-exact JSON
```
:::

El bloque exportado es una instantánea estática, no una vista en vivo. Relanzamiento `ocx export` Después de añadir a proveedor o cambiar la visibilidad del modelo, y combinar el nuevo bloque sobre el antiguo.

<a id="the-admission-key"></a>

## La clave de admisión

Dos claves diferentes son fáciles de confundir aquí, y solo la primera aparece en este archivo:

| Clave | Qué es | Donde vive |
| --- | --- | --- |
| Clave de admisión proxy | La credencial propia de opencodex, generada en el panel **API** ficha | referenciado por `apiKey` como `$OPENCODEX_API_KEY`; el valor permanece en su entorno |
| Clave del proveedor | su clave Anthropic / OpenAI / OpenRouter | La propia configuración de opencodex, por [Proveedores](/es/guides/providers/) |

La configuración exportada lleva solo la referencia, nunca un secreto. Pi interpola a bare `$NAME`, así La variable es:

```bash
export OPENCODEX_API_KEY=<your key>
```

Ese nombre es solo de Pi. opencode utiliza una variable diferente (`OPENCODEX_OPENCODE_API_KEY`, en `{env:…}` forma) — ver el [Guía de código abierto](/es/guides/opencode/).

**Un proxy loopback no necesita ninguna clave.** opencodex se une `127.0.0.1` por defecto y autentica No hay nada allí, así que el `$OPENCODEX_API_KEY` referencia es inerte y puede dejar la variable sin establecer. Importa sólo cuando `hostname` se establece más allá de loopback, que también es el caso donde el proxy se niega a iniciar sin un token — ver [Acceso remoto](/es/reference/configuration/server/#remote-access).

<a id="model-metadata"></a>

## Metadatos modelo

`contextWindow` y `maxTokens` solo se emiten cuando el catálogo informa de un contexto autorizado ventana. Cuando no lo hace, ambos campos se omiten para ese modelo y Pi aplica sus propios valores predeterminados;
`ocx export` imprime cuántas filas cayeron en ese caso.

Los límites de salida utilizan el máximo conocido del modelo a partir del catálogo o metadatos generados. Solo los límites desconocidos vuelven a caer `32000`. El límite de salida siempre está sujeto a la ventana de contexto, incluidos los límites conocidos a continuación. `32000`.

Dos campos están deliberadamente ausentes. `cost` requiere los cuatro campos de precio y opencodex no tiene Los datos de precios para los modelos enrutados — que emiten ceros afirmarían que cada modelo es gratuito.

`reasoning` es el único campo que solía estar ausente y ahora no lo está: Pi almacena un booleano mientras el El catálogo lleva una escalera de esfuerzo, y mapear uno sobre el otro solía ser una suposición. Desde el La escalera del catálogo es la propia declaración del proxy sobre si un modelo acepta parámetros de razonamiento. (adaptadores honor `reasoning_effort`), una fila de exportación con un **no vacío** La escalera ahora emite
`"reasoning": true`y una fila sin uno (o con una escalera explícitamente vacía) se queda Razonamiento libre. Pi ofrece su control de esfuerzo para exactamente los modelos que opencodex aceptará encendido. La exportación también emite un `thinkingLevelMap` que oculta todos los niveles de pi sin objetivo declarado (`null`), por lo que pi nunca ofrece — y nunca envía — un esfuerzo que la escalera no contiene. Uno fallback mantiene el modelo utilizable: cuando `ultra` Se declara sin `max`, pi's `max` mapas de nivel a `ultra` (todavía un miembro de la escalera). Si necesita un mapeo diferente, edite a mano `thinkingLevelMap` Según lo documentado por Pi.

Tratar `reasoning` como metadatos Pi-UI: se deriva de la escala de catálogo, no prueba que el upstream soporta de forma nativa un parámetro de razonamiento. Lo que el proxy realmente envía para un determinado
`reasoning_effort` el valor depende del adaptador del proveedor y del modelo — puede pasar el valor a través de él, traducirlo (alias de alambre), sujetarlo a la escalera configurada, emularlo u omitirlo completamente (e.g. `noReasoningModels`) El booleano solo controla si Pi ofrece el control en Todo.

<a id="attachment-and-request-compatibility"></a>

## Compatibilidad con archivos adjuntos y solicitudes

:::note[Comportamiento pendiente de publicación]
Los cambios de paridad de proveedor descritos aquí están en la pila de relaciones públicas de desarrollo; una pila instalada más antigua. release puede seguir teniendo el comportamiento de conversión anterior.
:::

OpenCodex normaliza las imágenes de usuario en forma de Pi/MCP y Anthropic antes de elegir el Chat nativo o ruta traducida. Las imágenes devueltas por las herramientas utilizan un portador de mensaje de usuario traducido después de la resultados de herramientas emparejadas; las imágenes de usuario ordinarias y los resultados de herramientas solo de texto pueden mantener la ruta nativa. Usar moderno `tool_calls` y `role: "tool"` con `tool_call_id`: legado `function`-resultado de la imagen la traducción es rechazada en lugar de descartar silenciosamente el resultado.

Un razonamiento explícito de `none` Sobrevive a la conversión de chat. Límites de salida y muestreo Los controles se conservan para los objetivos genéricos API-key Responses; el objetivo canónico ChatGPT sigue aplicando sus propias restricciones. Esto no hace que los controles de todos los proveedores sean equivalentes.

El audio WAV/MP3 en línea de un mensaje de usuario o de un resultado de herramienta se conserva al convertirlo a OpenAI Chat como una parte `input_audio`. El audio de herramientas se coloca en un mensaje de usuario posterior a los resultados emparejados, porque los mensajes de herramienta de Chat solo admiten texto. También se conservan los documentos que incluyen sus propios bytes base64 en un mensaje de usuario: llegan a Anthropic, OpenAI Chat y Google como documento nativo, parte de archivo o datos en línea. El resto devuelve un error explícito, en lugar de continuar sin el adjunto: audio remoto o incompatible, identificadores de archivo o referencias remotas que el proxy no pueda resolver, adjuntos en mensajes de sistema, documentos en resultados de herramientas y documentos enviados a protocolos sin un soporte para sus bytes. Las imágenes que solo tienen un identificador de archivo comparten esa restricción, porque los adaptadores de conversión no pueden resolverlo. Convierte primero el adjunto a texto o usa un protocolo nativo y un modelo que lo admitan. Chat nativo y Responses sin conversión, incluido Azure, mantienen su comportamiento; esto no garantiza que todos los modelos admitan esos medios. Los límites de conversión de video siguen dependiendo del adaptador.

<a id="schema-status"></a>

## Estado del esquema

:::note[Sin verificar en una instalación real]
La forma anterior sigue la documentación personalizada de Pi. Tiene **no** ha sido verificado contra un real `~/.pi/agent/models.json` en una máquina con Pi instalado. Si Pi rechaza la exportación bloque, el desajuste está de nuestro lado — por favor
[abrir un problema](https://github.com/lidge-jun/opencodex/issues) Lo que dice Pi.
:::

<a id="requirements"></a>

## Necesidades

Un proxy opencodex en ejecución (`ocx start`) y Pi instalado. `ocx export` lee el catálogo en vivo a través de la administración del proxy API, por lo que nunca se puede emitir una configuración con una lista de modelos vacía.
