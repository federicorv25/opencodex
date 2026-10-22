---
title: "Sidecars: búsqueda web y visión"
description: "Ofrece a los modelos enrutados una búsqueda web real y comprensión de imágenes de modelos solo de texto a través de sidecars nativos ChatGPT."
---

Los modelos enrutados no exponen todos los host **búsqueda web** o **entrada de imagen** nativos. opencodex rellena esas capacidades con dos sidecars. Ambos soportan un proveedor de inicio de sesión ChatGPT (`forward`) o un proveedor Anthropic OAuth almacenado; la búsqueda web puede usar adicionalmente el Grok OAuth almacenado a través del backend `xai` explícito. Los errores de sidecar se convierten en resultados de herramientas o marcadores de imagen en lugar de fallar todo el turno.

:::note[Selección automática del backend]
La configuración explícita de `backend` tiene prioridad. Cuando no se configura, cada sidecar usa su propio valor predeterminado:
**Búsqueda web** usa `openai` por defecto; `anthropic` y `xai` solo se usan cuando se configuran explícitamente. El backend de búsqueda web `xai` requiere una cuenta Grok OAuth almacenada y utilizable, y no cambia a otro backend si esa cuenta no está disponible.
**Visión** usa `anthropic` cuando un proveedor Anthropic OAuth habilitado tiene una cuenta activa que no está marcada como `needsReauth`; de lo contrario, usa `openai`. Seleccionar `anthropic` explícitamente sin esa credencial rechaza la operación. Visión solo admite `openai`, `anthropic` y `routed`; los modelos de visión xAI elegibles usan `routed`. Para ambos sidecars, `openai` requiere autenticación de inicio de sesión ChatGPT y un proveedor `forward` habilitado.
:::

<a id="additional-web-search-backends-explicit-only"></a>

### Backends de búsqueda web adicionales (solo explícitos)

Existen otros tres backends de búsqueda web más allá de las rutas ChatGPT y Claude. Cada uno es **explícito-sólo** - nunca se activa desde la presencia de credenciales - y **falla cerrado**: una credencial faltante no produce ningún plan de sidecar y la solicitud toma la ruta normal.

| Backend | Carreras | Credenciales | Notas |
| --- | --- | --- | --- |
| `xai` | Grok alojado `web_search` (+ opt-in `x_search` ) en `api.x.ai` Responses | Almacenado Grok OAuth (`ocx login xai`) | `webSearchSidecar.xSearch` permite la búsqueda X con `allowedXHandles` / `excludedXHandles` (máximo 20, mutuamente excluyentes) e ISO `fromDate` / `toDate`. Modelo predeterminado `grok-4.6`. |
| `gemini` | `google_search` puesta a tierra en el transporte Antigravity | Almacenado Antigravity OAuth con un proyecto descubierto (`ocx login google-antigravity`) | Modelo predeterminado `gemini-3.8-flash`; el razonamiento selecciona el nivel coincidente. |
| `exa` | Exa Search API (resumen de resultados no LLM) | `webSearchSidecar.exaApiKey` | La clave es solo escritura a través de la administración API (nunca se hizo eco, se redactó desde los registros). No se aplica ningún modelo de sidecar. |

<a id="web-search-sidecar"></a>

## Sidecar de búsqueda web

Cuando Codex solicita `web_search` para un modelo enrutado sin paso, opencodex:

1. **Gotas** la herramienta `web_search` alojada y expone una herramienta de función sintética `web_search(query)` al modelo enrutado en su lugar. Las opciones originales de la herramienta alojada se conservan para la llamada de sidecar.
2. Ejecuta el modelo enrutado en un pequeño **bucle angélico**. Cuando llama a `web_search`, opencodex usa el backend de sidecar seleccionado: OpenAI ejecuta `web_search` con `gpt-5.6-luna` de forma predeterminada; Anthropic ejecuta `web_search_20250305` con `claude-sonnet-5` por defecto. La respuesta transmitida y las citas se convierten en un resultado de herramienta. xAI ejecuta Grok hospedado `web_search` con `grok-4.6` de forma predeterminada y, cuando está habilitado, agrega `x_search` hospedado a la misma solicitud.
3. **Bucles** hasta que el modelo responda o el presupuesto total de la consulta real alcance `maxSearchesPerTurn` (por defecto 3), luego elimina la herramienta de búsqueda y fuerza una respuesta final. Las herramientas de cliente real como `apply_patch` o shell finalizan el turno para que esas llamadas lleguen a Codex.

Cuando el modelo agrupa varias consultas en una llamada `web_search`, sus resultados comparten un resultado de herramienta de 8.000 caracteres. El presupuesto se divide entre las consultas antes de que se corte nada, por lo que ninguna consulta desaparece del resultado. Las respuestas acortadas y las fuentes no listadas están marcadas con sus tamaños originales, lo que permite que el modelo indique los resultados recortados de las búsquedas que no encontraron nada. Los giros de salida estructurada reciben la misma información que un documento válido JSON. Si una llamada solicita más consultas de las que un resultado puede describir, opencodex enumera el estado de cada consulta sin su contenido y cuenta las consultas que no pudo enumerar.

Cada iteración del modelo enrutado solicita `stream: true` upstream, pero por defecto opencodex almacena completamente los eventos semánticos internamente antes de decidir si buscar o devolver la respuesta final. Solo los encabezados/estados finales de la primera iteración y 429 rotaciones de teclas se adquieren con entusiasmo. Por lo tanto, las llamadas de búsqueda sintéticas y la salida preliminar nunca se exponen como salida del modelo visible para el cliente.

Opt-in `webSearchSidecar.streamRoutedModelOutput` (por defecto `false`) transmite en vivo los deltas principales de texto / pensamiento de cada iteración: el cliente ve la salida tan pronto como el modelo lo produce, exactamente como la ruta sin sidecar. La ventana activa se cierra permanentemente en el primer límite de llamada de herramienta, por lo que la decisión de interceptar `web_search` permanece atómica y nada se entrega dos veces (la repetición del terminal omite lo que ya se transmitió). Tradeoff: el texto que el modelo emite *antes* decide buscar - qué modo almacenado en memoria intermedia cae silenciosamente - se vuelve visible y puede repetirse parcialmente en la respuesta posterior a la búsqueda. La página de visión general del tablero de instrumentos expone esto cuando el **Transmitir respuestas en vivo** alterna en la tarjeta de sidecar de búsqueda web (`PUT /api/sidecar-settings` con `webSearch.streamRoutedModelOutput`).

Esta opción también se aplica a los adaptadores que gestionan sus propios turnos, incluidos Devin y Cursor. Cuando los sidecars de búsqueda y de imagen/vídeo son elegibles, la búsqueda tiene prioridad. Un primer evento OAuth 429 gira la cuenta en la solicitud inicial y en cada solicitud de respuesta posterior a la búsqueda, reproduciendo la solicitud con la herramienta de búsqueda y los resultados recopilados. La cancelación de una solicitud detiene las búsquedas posteriores, y la salida del bucle de búsqueda retenido comparte el límite de la memoria intermedia de traducción de la solicitud; exceder ese límite falla la respuesta en lugar de iniciar otra iteración del modelo.

El comentario Kiro es independiente de esta opción: el texto de la fase de comentario ya fluye antes del evento terminal en modo almacenado en memoria intermedia, y esa derivación no cambia - con o sin `streamRoutedModelOutput`, solo los eventos de decisión de búsqueda (llamadas de herramienta y todo después del primer límite de llamada de herramienta) permanecen almacenados en memoria intermedia para la decisión atómica `web_search`.

El resultado inyectado se envuelve en un límite de datos no confiables, con límite de longitud y desduplicado por URL de origen. En los giros de salida estructurada (`json_schema` / `json_object`) se entrega como compacto JSON en lugar de prosa. Para los modelos con ruta de solo texto, también se le dice al modelo de búsqueda que describa imágenes relevantes en palabras e incluya sus URL de origen.

```json
{
  "webSearchSidecar": {
    "enabled": true,
    "backend": "anthropic",
    "model": "claude-sonnet-5",
    "reasoning": "low",
    "maxSearchesPerTurn": 3,
    "routedModelStallTimeoutMs": 200000,
    "timeoutMs": 200000,
    "streamRoutedModelOutput": false
  }
}
```

El backend explícito xAI usa la credencial almacenada creada por `ocx login xai`. Su bloque opcional `xSearch` permite la búsqueda X y puede restringirlo a una lista de identificadores y un rango de fechas ISO:

```json
{
  "webSearchSidecar": {
    "backend": "xai",
    "model": "grok-4.6",
    "xSearch": {
      "enabled": true,
      "allowedXHandles": ["xai"],
      "fromDate": "2026-08-01",
      "toDate": "2026-08-21"
    }
  }
}
```

`allowedXHandles` y `excludedXHandles` son mutuamente excluyentes y cada uno acepta como máximo 20 cadenas. Las fechas usan `YYYY-MM-DD`. La administración malformada escribe el retorno `400`; los bloques malformados persistentes fallan en el momento de la planificación en lugar de ampliar silenciosamente la búsqueda.

El razonamiento `minimal` no se utiliza porque el backend alojado rechaza las herramientas en ese esfuerzo. Una búsqueda fallida se devuelve al modelo enrutado como un resultado de error limitado, lo que le permite responder desde el contexto que ya tiene.

Se aplican cuatro relojes separados. `stallTimeoutSec` es el presupuesto base para eventos. `connectTimeoutMs` (por defecto `200000`) cubre solo DNS/ TCP / TLS y cabeceras de respuesta final. Config-file-only `webSearchSidecar.routedModelStallTimeoutMs` (por defecto `200000`, integer `1..2147483647` ) limita la inactividad continua de los bytes de respuesta sin procesar para cada iteración del modelo enrutado y se restablece en cada byte no vacío. `webSearchSidecar.timeoutMs` limita por separado una solicitud de búsqueda alojada. El control efectivo del puente es `max(base stall, connect timeout, routed-model stall, sidecar timeout) + 30 seconds`. El tiempo de espera no es una generación total. Los fallos antes de que SSE comience devuelven non-2xx JSON; los fallos de generación después de que se hayan iniciado las cabeceras de respuesta se entregan como `response.failed` SSE.

<a id="vision-sidecar"></a>

## Sidecar de visión

El preajuste del proveedor registra `zai-glm-5-3` de Mistral como modelo de solo texto. Si el sidecar de visión está habilitado y disponible, OpenCodex describe las imágenes adjuntas y envía sus descripciones a GLM. El catálogo de Codex anuncia adjuntos de imagen para esta ruta. Después de actualizar, ejecuta `ocx sync` y cierra por completo y vuelve a abrir Codex Desktop, o recarga la ventana de VS Code. Sin una opción de reinicio, la sincronización no reinicia un app-server existente de Codex, que puede conservar el catálogo anterior. También puedes usar `ocx sync --restart-codex` para sincronizar y reiniciar los procesos de Codex coincidentes y Desktop. Termina antes el trabajo activo: ese reinicio finaliza las conversaciones en curso. Consulta la [referencia de sincronización y reinicio](/es/reference/cli/lifecycle/#ocx-sync---restart-codex---restart-app-server-only). Después de abrirlo de nuevo, elige `mistral/zai-glm-5-3` y comprueba que puedas adjuntar imágenes. No necesitas modificar la modalidad del modelo. Mistral documenta la entrada nativa en su [referencia de GLM 5.3](https://docs.mistral.ai/models/zai-glm-5-3).

El enrutamiento de imágenes es consciente de la capacidad. Antes de un envío ascendente con imágenes, opencodex resuelve las modalidades de entrada efectivas del modelo seleccionado a partir de la evidencia del proveedor en entorno de ejecución, las declaraciones explícitas del operador, los metadatos del backend/registro y los metadatos del proveedor generados. Un objetivo que se sabe que es solo texto pasa primero por el Sidecar de Visión; la imagen se describe como **antes** la llamada principal y se reemplaza en línea con texto. Un objetivo conocido positivamente para soportar imágenes recibe la imagen directamente. Los modelos personalizados desconocidos mantienen el comportamiento de compatibilidad existente en lugar de ser adivinados solo por texto.

Para la ruta canónica ChatGPT Codex, opencodex utiliza el paquete de metadatos `openai-codex` en lugar de los metadatos públicos OpenAI API, por lo que se respetan las diferencias de modalidad específicas del backend. La ruta rápida nativa de Chat utiliza la misma puerta y no puede omitir un veredicto conocido de solo texto. Sin un plan de sidecar disponible, las imágenes en bruto se eliminan antes de un backend probado solo de texto. Con `visionSidecar.enabled: false`, el catálogo de modelos no agrega entrada de imagen respaldada por sidecar a los modelos de solo texto, incluidas las filas personalizadas y los miembros combinados. Se conservan el soporte de imagen nativa y las modalidades de imagen configuradas explícitamente. Omitir `enabled` mantiene activado el anuncio de sidecar; la visibilidad del catálogo no establece que las credenciales o la capacidad de sidecar estén disponibles. Los combos anuncian la entrada de imágenes solo cuando cada miembro acepta imágenes, ya sea de forma nativa o a través de un sidecar habilitado, y la configuración `imageInput` del combo no está deshabilitada, por lo que los clientes como la aplicación Codex permiten archivos adjuntos en lugar de bloquearlos antes de que se ejecute el sidecar. Cuando `visionSidecar.model` está ausente o en blanco, la ruta de ejecución OpenAI, el tablero de instrumentos y la administración API usan el retroceso `gpt-5.6-luna`. El inicio sigue migrando un valor `gpt-5.4-mini` heredado explícitamente persistente a `gpt-5.6-luna`; esa migración se aplica a un valor almacenado, no a un campo de modelo ausente. Guardar un combo multimodal desde el panel inscribe automáticamente a sus miembros que no son imagen: la página Combos los envía como `visionSidecarTargets` en `PUT /api/combos`, que escribe la declaración exacta de solo texto en el proveedor del miembro, por lo que no se necesita editar y recargar la configuración manual. La inscripción nunca sobrescribe una declaración con capacidad de imagen existente, y los miembros cuyas modalidades son desconocidas o no tienen entrada de texto no están inscritos: el panel los nombra y mantiene el interruptor de imagen del combo no disponible. El modelo DeepSeek `deepseek-flash` de origen es multimodal nativo (`text` y `image`) y no usa este sidecar por defecto. `noVisionModels` explícitas o declaraciones de solo texto siguen siendo autoritativas. El primer partido `deepseek-chat`, `deepseek-reasoner` y `deepseek-v4-flash` permanece respaldado por sidecar por defecto; Las rutas Zen no han cambiado y no se probaron en esta actualización.

- Las imágenes pueden provenir de mensajes de usuario, desarrollador y resultado de herramientas, incluidos los `view_image` de Codex.
- En la ruta OpenAI (paso de inicio de sesión ChatGPT), cada imagen se envía al modelo de visión configurado sobre el punto final Responses con el `reasoning.effort` seleccionado (`low` por defecto), y su descripción reemplaza la parte de imagen en línea. La ruta Anthropic utiliza el punto final Messages con su propia asignación de pensamiento-presupuesto e ignora esta configuración específica OpenAI.
- Para los modelos nativos con metadatos de capacidad conocidos, el razonamiento no compatible se normaliza al peldaño más alto soportado en o por debajo del nivel solicitado; si no existe ninguno, se usa el peldaño más bajo soportado. Los modelos desconocidos o personalizados siguen siendo permisivos cuando no hay metadatos de capacidad confiables.
- Las descripciones se ejecutan con concurrencia limitada (3 a la vez, orden de entrada preservado). El contexto del usuario enviado al descritor tiene un límite de 800 caracteres, y cada descripción inyectada tiene un límite de 2.000 caracteres. La solicitud no envía `max_output_tokens`, que el backend ChatGPT rechaza.
- Las URL de las imágenes se validan antes del reenvío: las URL de datos deben usar `png` / `jpeg` / `jpg` / `webp` / `gif`, y los datos de base64 están limitados a aproximadamente 20 MB. Solo se aceptan los esquemas `data:` y `https:`; las imágenes `https` remotas son buscadas por el backend OpenAI, no por el proxy.
- La coincidencia de `noVisionModels` ignora un sufijo Ollama-style `:size`, por lo que una entrada `gpt-oss` también cubre `gpt-oss:120b`.
- Si falla la descripción, el modelo recibe un marcador de error de procesamiento corto. (Sin un plan de sidecar disponible, no se intenta ninguna descripción - la imagen sin procesar se elimina, como se describió anteriormente).
- `maxDescriptionsPerTurn` (por defecto 8) limita las nuevas descripciones por turno de modelo principal. Los golpes de caché y los duplicados del mismo turno no lo consumen. Las descripciones de imágenes exitosas de `data:` se almacenan en caché por backend, modelo, detalle, bytes de imagen y contexto de mensaje, más el esfuerzo de razonamiento en OpenAI teclas (Anthropic teclas lo omiten, ya que ese campo se ignora allí); las imágenes mutables de `https:` no se almacenan en caché.

La gestión API y la lista de selector de tablero modelos que pueden aceptar la entrada de imágenes. Cuando el backend correspondiente está disponible, `gpt-5.6-luna` (OpenAI) y `claude-haiku-4-5` (Anthropic) siempre se ofrecen como opciones de referencia. `PUT /api/sidecar-settings` puede conservar una identificación personalizada/anticipada al catálogo desconocida. Por lo tanto, se puede usar un sidecar Vision enrutado explícitamente configurado a menos que la evidencia de capacidad demuestre que el modelo no puede aceptar imágenes; esto preserva los sidecares personalizados seleccionados por el operador sin permitir que un sidecar conocido solo de texto reciba bytes de imagen.

```json
{
  "visionSidecar": {
    "enabled": true,
    "backend": "openai",
    "model": "gpt-5.6-luna",
    "reasoning": "medium",
    "maxDescriptionsPerTurn": 8,
    "timeoutMs": 45000
  }
}
```

Un modelo está marcado solo con texto por proveedor:

```json
{
  "providers": {
    "ollama-cloud": {
      "baseUrl": "https://ollama.com/v1",
      "noVisionModels": ["glm-5.2", "gpt-oss", "qwen3-coder", "deepseek-v4-flash"]
    }
  }
}
```

<a id="dashboard-controls-and-disabling"></a>

## Controles del panel de control y desactivación

La tarjeta de sidecar Dashboard Vision puede habilitar o deshabilitar el sidecar, establecer `maxDescriptionsPerTurn` y establecer `timeoutMs`, junto con el modelo existente, el backend y los controles de razonamiento. Deshabilitar el sidecar no elimina esas configuraciones; volver a activarlo mantiene el modelo anterior, el backend, el razonamiento, el tiempo de espera y el límite.

`PUT /api/sidecar-settings` acepta los mismos campos. Las actualizaciones parciales dejan las teclas omitidas sin cambios. `timeoutMs` utiliza los límites enteros de entorno de ejecución (1-2147483647 ms).

Cuando cambia el switch de Visión efectivo, el ahorro también actualiza el catálogo Codex administrado y la caché del modelo. La respuesta informa `catalogRefreshPending: true` si esa actualización no se completó; el modificador guardado se conserva y la publicación del catálogo no confirma que un cliente en ejecución lo haya recargado.

La tarjeta del sidecar de búsqueda web tiene la misma forma de control: la primera fila del selector del modelo es
**Desactivado**. Off hace dos cosas, y la segunda es la razón por la que existe la fila. OpenCodex se detiene interceptar `web_search`, y el Codex La integración escribe CodexEl propio
`web_search = "disabled"` mode in `~/.codex/config.toml` — porque Codex sigue declarando su Nativo alojado `web_search` herramienta hasta que su propio modo diga lo contrario, y la herramienta un cliente La publicidad es la que el modelo busca. Un operador que quiere un servidor de búsqueda MCP para ser la única ruta de búsqueda necesita ambas mitades; de lo contrario, el modelo sigue llamando a la herramienta nativa.

`web_search` es la clave de Codex con su propio espacio de valor (`disabled`, `cached`, `indexed`, `live`). OpenCodex solo escribe `disabled` mientras el sidecar está apagado, y elimina su línea propiedad del marcador una vez que el sidecar está de nuevo encendido: un sidecar habilitado cuyo cliente aún tenía la herramienta nativa apagada no tendría nada que interceptar. La escritura necesita un `~/.codex/config.toml` administrado (`ocx
sync`); la respuesta de la administración lo informa como `codexWebSearch`, y ambas superficies que pueden mostrarlo lo hacen: la tarjeta de búsqueda web del tablero advierte cuando la escritura no sucedió, y `ocx agent sidecar web
--enabled off` imprime si sucedió. Solo un guardado que mueve el interruptor desencadena la escritura, por lo que la respuesta "nada cambió" ordinaria informa `not_requested` e imprime nada extra. Una línea raíz `web_search` el operador establecido a mano se reemplaza mientras el sidecar está apagado, ya que dos claves raíz del mismo nombre no son válidas TOML. Su texto exacto se registra en la revista Codex y se vuelve a colocar en su lugar cuando se enciende de nuevo el sidecar, incluso para una línea agregada después de que se tomó la instantánea de la revista, que `ocx restore` por sí solo no puede cubrir. El mismo registro es lo que todavía reconoce nuestra propia línea `disabled` cuando la aplicación Codex ha reescrito `config.toml` y ha eliminado el comentario que nombró a su propietario.

Todavía puede establecer `enabled: false` en `config.json` si prefiere editar el archivo directamente. Anthropic - OAuth búsqueda y descripción de la imagen reutilizan el precedente de huellas dactilares Claude Code OAuth existente, pero deben ser probados en remojo con la cuenta prevista y la carga de trabajo.

Vea el [Referencia de configuración](/es/reference/configuration/server/#sidecars) para cada campo.
