---
title: "Sidecars: búsqueda web y visión"
description: "Ofrece a los modelos enrutados una búsqueda web real y comprensión de imágenes de modelos solo de texto a través de sidecars nativos ChatGPT."
---

Los modelos enrutados no exponen todos los hosted **búsqueda web** o nativo **entrada de imagen**. Rellenos opencodex Esas capacidades con dos sidecars. Ambos admiten un inicio de sesión ChatGPT (`forward`) proveedor o almacenado Anthropic Proveedor de OAuth; la búsqueda web puede usar adicionalmente Grok almacenado OAuth a través de la
`xai` backend. Los errores de sidecar se convierten en resultados de herramientas limitadas o marcadores de imagen en lugar de fallar el resultado. todo el giro.

:::note[Selección automática del backend]
Explícito `backend` La configuración gana. Los dos sidecares por defecto de manera diferente cuando `backend` Está unset:
**búsqueda web** siempre por defecto a `openai` — `anthropic` se ejecuta solo cuando está configurado explícitamente.
**Visión** por defecto a `anthropic` Si un habilitado Anthropic OAuth El proveedor tiene una cuenta activa no marcada `needsReauth`, en caso contrario `openai`. Explícito `anthropic` sin esa credencial falla Cerrado. Explícito `xai` requiere un almacenamiento utilizable Grok OAuth cuenta y no retrocede. `openai`
requiere tanto la autenticación de inicio de sesión ChatGPT como una autorización habilitada `forward` proveedor.
:::

<a id="additional-web-search-backends-explicit-only"></a>

### Backends de búsqueda web adicionales (solo explícitos)

Existen otros tres backends de búsqueda web más allá de las rutas ChatGPT y Claude. Cada uno es
**explícito-sólo** — nunca se activa desde la presencia de credenciales — y **falla cerrado**: una credencial faltante no produce ningún plan de sidecar y la solicitud toma la ruta normal.

| Backend | Carreras | Credenciales | Notas |
| --- | --- | --- | --- |
| `xai` | Grok alojado `web_search` (+ opt-in) `x_search`) en `api.x.ai` Responses | Almacenado Grok OAuth`ocx login xai`) | `webSearchSidecar.xSearch` Permite buscar con X `allowedXHandles`/`excludedXHandles` (máximo 20, mutuamente excluyentes) y ISO `fromDate`/`toDate`. Modelo predeterminado `grok-4.6`. |
| `gemini` | `google_search` En el transporte de antigravedad | Antigravedad almacenada OAuth con proyecto descubierto (`ocx login google-antigravity`) | Modelo predeterminado `gemini-3.8-flash`; el razonamiento selecciona el nivel de coincidencia. |
| `exa` | Exa Search API (resumen de resultados no-LLM) | `webSearchSidecar.exaApiKey` | La clave es solo escritura a través de la administración API (nunca se hizo eco, se redactó desde los registros). No se aplica ningún modelo de sidecar. |

<a id="web-search-sidecar"></a>

## Sidecar de búsqueda web

Cuando Codex solicita alojado `web_search` para un modelo enrutado sin paso, opencodex:

1. **Gotas** El hospedado `web_search` herramienta y expone un material sintético `web_search(query)` herramienta de función En su lugar, al modelo enrutado. Las opciones originales de la herramienta alojada se conservan para la llamada de sidecar.
2. Ejecuta el modelo enrutado en un pequeño **bucle angélico**. Cuando llama `web_search`, opencodex utiliza el Sidecar seleccionado: OpenAI se ejecuta alojado `web_search` con `gpt-5.6-luna` por defecto; Se ejecuta Anthropic `web_search_20250305` con `claude-sonnet-5` por defecto. La respuesta transmitida y Las citas se convierten en un resultado de herramienta. xAI ejecuta Grok alojado `web_search` con `grok-4.6` por defecto y, cuando está habilitado, agrega alojado `x_search` a la misma petición.
3. **Bucles** hasta que el modelo responda o el presupuesto total de la consulta real alcance `maxSearchesPerTurn`
   (predeterminado 3), luego quita la herramienta de búsqueda y fuerza una respuesta final. Herramientas de cliente reales como
   `apply_patch` o shell finalizar el turno para que esas llamadas lleguen a Codex.

Cuando el modelo agrupa varias consultas en una `web_search` sus resultados comparten una Resultado de herramienta de 8.000 caracteres. El presupuesto se divide entre las consultas antes de que se corte nada, por lo que no La consulta desaparece del resultado. Las respuestas acortadas y las fuentes no listadas están marcadas con sus tamaños originales, lo que permite que el modelo indique los resultados recortados de las búsquedas que encontró Nada. Los giros de salida estructurada reciben la misma información que un documento JSON válido. Si una llamada pide más consultas que un resultado puede describir, opencodex enumera el estado de cada consulta sin su contenido y cuenta cualquier consulta que no pueda enumerar.

Cada iteración de modelo enrutado solicita upstream `stream: true`, pero por defecto opencodex totalmente Almacena internamente los eventos semánticos antes de decidir si buscar o devolver la respuesta final. Solo los encabezados/estados finales de la primera iteración y 429 rotaciones de teclas se adquieren con entusiasmo. Así que Las llamadas de búsqueda sintéticas y la salida preliminar nunca se exponen como salida del modelo visible para el cliente.

Opt-in `webSearchSidecar.streamRoutedModelOutput` (por defecto) `false`) fluye cada iteración Los deltas principales del texto/del pensamiento viven en lugar de — el cliente ve la salida tan pronto como el modelo produce exactamente igual que el camino sin sidecar. La ventana activa se cierra permanentemente en la primera llamada a herramientas límite, por lo que la decisión de interceptar `web_search` permanece atómica y nada se entrega nunca dos veces (la repetición del terminal omite lo que ya se transmitió). Tradeoff: texto que emite el modelo *antes*
decidir buscar — qué modo almacenado en búfer cae silenciosamente — se vuelve visible y puede repetirse parcialmente en la respuesta post-búsqueda. La página de resumen del panel expone esto como el **Transmitir respuestas en vivo**
activar la tarjeta sidecar de búsqueda web (`PUT /api/sidecar-settings` con
`webSearch.streamRoutedModelOutput`).

Esta opción también se aplica a los adaptadores que administran sus propios turnos, incluidos Devin y Cursor. Cuando los sidecars de búsqueda y de imagen/vídeo son elegibles, la búsqueda tiene prioridad. Un primer evento OAuth 429 rota la cuenta en la solicitud inicial y en cada solicitud de respuesta posterior a la búsqueda, reproducir la solicitud con la herramienta de búsqueda y los resultados recopilados. Cancelar una solicitud detiene las búsquedas posteriores, y conserva la salida del bucle de búsqueda comparte la memoria intermedia de traducción de la solicitud límite; exceder ese límite falla la respuesta en lugar de iniciar otra iteración del modelo.

El comentario de Kiro es independiente de esta opción: el texto de la fase de comentario ya se transmite antes que el evento terminal en modo almacenado en memoria intermedia, y esa derivación no cambia — con o sin
`streamRoutedModelOutput`, solo los eventos de decisión de búsqueda (llamadas a herramientas y todo después de la primera de llamada de herramienta) permanecen amortiguados para el `web_search` decisión.

El resultado inyectado se envuelve en un límite de datos no confiables, con la longitud rematada y desduplicada por fuente URL. En los giros de salida estructurada (`json_schema` / `json_object`) se entrega como compacto JSON en lugar de prosa. Para los modelos enrutados solo de texto, también se le dice al modelo de búsqueda que describa imágenes relevantes en palabras e incluyen sus URL de origen.

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

El backend explícito de xAI utiliza la credencial almacenada creada por `ocx login xai`. Su opcional
`xSearch` bloque habilita la búsqueda X y puede restringirla a una lista de identificadores y un intervalo de fechas ISO:

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

`allowedXHandles` y `excludedXHandles` son mutuamente excluyentes y cada uno acepta como máximo 20 cuerdas. Fechas de uso `YYYY-MM-DD`. La gestión malformada escribe retorno `400`; persistente malformado Los bloques fallan al cerrarse en el momento de la planificación en lugar de ampliar silenciosamente la búsqueda.

`minimal` El razonamiento no se utiliza porque el backend alojado rechaza las herramientas en ese esfuerzo. Un fracaso la búsqueda se devuelve al modelo enrutado como un resultado de error limitado, lo que le permite responder desde el contexto que ya tiene.

Se aplican cuatro relojes separados. `stallTimeoutSec` es el presupuesto base de eventos de bridge.
`connectTimeoutMs` (por defecto) `200000`) cubre solo los encabezados DNS/TCP/TLS y de respuesta final. Config-file-only `webSearchSidecar.routedModelStallTimeoutMs` (por defecto) `200000`, entero
`1..2147483647`) limita la inactividad de bytes de respuesta bruta continua para cada iteración del modelo encaminado y se restablece en cada byte no vacío. `webSearchSidecar.timeoutMs` Por separado limita una búsqueda alojada solicitud. El vigilante del puente efectivo es
`max(base stall, connect timeout, routed-model stall, sidecar timeout) + 30 seconds`. El ruteado El tiempo muerto no es una generación completa. Fallos antes de que SSE comience a devolver non-2xx JSON; generación los errores después de que los encabezados de la respuesta han comenzado se entregan como `response.failed` SSE.

<a id="vision-sidecar"></a>

## Sidecar de visión

El preajuste del proveedor registra `zai-glm-5-3` de Mistral como modelo de solo texto. Si el sidecar de visión está habilitado y disponible, OpenCodex describe las imágenes adjuntas y envía sus descripciones a GLM. El catálogo de Codex anuncia adjuntos de imagen para esta ruta. Después de actualizar, ejecuta `ocx sync` y cierra por completo y vuelve a abrir Codex Desktop, o recarga la ventana de VS Code. Sin una opción de reinicio, la sincronización no reinicia un app-server existente de Codex, que puede conservar el catálogo anterior. También puedes usar `ocx sync --restart-codex` para sincronizar y reiniciar los procesos de Codex coincidentes y Desktop. Termina antes el trabajo activo: ese reinicio finaliza las conversaciones en curso. Consulta la [referencia de sincronización y reinicio](/es/reference/cli/lifecycle/#ocx-sync---restart-codex---restart-app-server-only). Después de abrirlo de nuevo, elige `mistral/zai-glm-5-3` y comprueba que puedas adjuntar imágenes. No necesitas modificar la modalidad del modelo. Mistral documenta la entrada nativa en su [referencia de GLM 5.3](https://docs.mistral.ai/models/zai-glm-5-3).

El enrutamiento de imágenes es consciente de la capacidad. Antes de enviar un flujo ascendente con imágenes, opencodex resuelve las modalidades de entrada efectivas del modelo seleccionado a partir de la evidencia del proveedor en entorno de ejecución, las declaraciones explícitas del operador, los metadatos del backend/registro y los metadatos del proveedor generados. Un objetivo que se sabe que es solo texto pasa primero por el Sidecar de Visión; la imagen se describe **antes** la llamada principal y reemplazado en línea con el texto. Un objetivo conocido positivamente para soportar imágenes recibe la imagen directamente. Los modelos personalizados desconocidos mantienen el comportamiento de compatibilidad existente en lugar de ser adivinados solo por texto.

Para la ruta canónica ChatGPT Codex, opencodex utiliza el `openai-codex` bundle de metadatos en lugar de los metadatos públicos OpenAI API, por lo que se respetan las diferencias de modalidad específicas del backend. La ruta rápida nativa de Chat utiliza la misma puerta y no puede omitir un veredicto conocido de solo texto. Sin un plan de sidecar disponible, las imágenes en bruto se eliminan antes de un backend probado solo de texto. Con `visionSidecar.enabled: false`, el catálogo del modelo no agrega la entrada de imagen respaldada por sidecar a modelos solo de texto, incluidas filas personalizadas y miembros combinados. Soporte de imagen nativa y explícitamente Se conservan las modalidades de imagen configuradas. Omisión `enabled` mantiene el anuncio de sidecar encendido; La visibilidad del catálogo no establece que las credenciales o la capacidad del sidecar estén disponibles. Los combos anuncian la entrada de imágenes solo cuando cada miembro acepta imágenes, ya sea de forma nativa o a través de un dispositivo habilitado. y el sidecar, y el combo `imageInput` configuración no está deshabilitada, por lo que los clientes como la aplicación Codex permitir accesorios en lugar de bloquearlos antes de que el sidecar corra. Cuando
`visionSidecar.model` ausentes o en blanco, el OpenAI ruta de ejecución, Dashboard y administración API
utilizar el `gpt-5.6-luna` fallback. Startup sigue migrando un legado explícitamente persistente
`gpt-5.4-mini` valor a `gpt-5.6-luna`; esa migración se aplica a un valor almacenado, no a un valor ausente campo de modelo. Guardar un combo multimodal desde el panel de control inscribe automáticamente a sus miembros que no son imagen: el La página Combos los envía como `visionSidecarTargets` on `PUT /api/combos`, que escribe la exacta solo texto en el proveedor del miembro, por lo que no es necesario editar y volver a cargar la configuración manual. La inscripción nunca sobrescribe una declaración con capacidad de imagen existente, y los miembros cuyas modalidades son desconocido o no tienen entrada de texto no están inscritos — el panel les nombra y mantiene el combo interruptor de imagen no disponible. El DeepSeek de primera parte `deepseek-flash` modelo es multimodal nativo (`text` y `image`) y hace No utilice este sidecar por defecto. Explícito `noVisionModels` o las declaraciones de sólo texto permanecen Autoritativo. Primera parte `deepseek-chat`, `deepseek-reasoner`, y `deepseek-v4-flash` permanecer sidecar-respaldado por defecto; Las rutas Zen no han cambiado y no se probaron en esta actualización.

- Las imágenes pueden provenir de mensajes de usuario, desarrollador y resultado de herramientas, incluidos los de Codex. `view_image`.
- En la ruta OpenAI (paso de inicio de sesión ChatGPT), cada imagen se envía al modelo de visión configurado sobre el endpoint Responses con el `reasoning.effort` (`low` por defecto), y su La descripción sustituye a la parte de imagen en línea. La ruta Anthropic utiliza el punto final Messages con su propia asignación de presupuesto-pensamiento e ignora esta configuración específica de OpenAI.
- Para los modelos nativos con metadatos de capacidad conocidos, el razonamiento no soportado se normaliza a la El peldaño soportado más alto en o por debajo del nivel solicitado; si no existe ninguno, el peldaño soportado más bajo se utiliza. Los modelos desconocidos o personalizados siguen siendo permisivos cuando no hay metadatos de capacidad confiables.
- Las descripciones se ejecutan con concurrencia limitada (3 a la vez, orden de entrada preservado). Contexto de usuario enviado El número de caracteres de la descripción está limitado a 800, y cada descripción inyectada está limitada a 2.000. personajes. La solicitud no envía `max_output_tokens`, que el backend ChatGPT rechaza.
- Las URL de las imágenes se validan antes del reenvío: las URL de los datos deben usar `png` / `jpeg` / `jpg` / `webp` /
  `gif`, y los datos de base64 se limitan a aproximadamente 20 MB. Solo `data:` y `https:` Se aceptan esquemas; remoto `https` Las imágenes son obtenidas por el backend OpenAI, no por el proxy.
- `noVisionModels` coincidencia ignora un estilo Ollama `:size` Sufijo, así que `gpt-oss` La entrada también cubre
  `gpt-oss:120b`.
- Si la descripción falla, el modelo recibe un marcador de error de procesamiento corto. Sidecar plan, no se intenta ninguna descripción — la imagen sin procesar es despojada, como se ha descrito anteriormente.)
- `maxDescriptionsPerTurn` (predeterminado 8) limita las nuevas descripciones por turno de modelo principal. Caché hits y Los duplicados del mismo turno no lo consumen. Exitoso `data:` Las descripciones de las imágenes se almacenan en caché backend, modelo, detalle, bytes de imagen y contexto de mensaje — más el esfuerzo de razonamiento en OpenAI (las teclas Anthropic lo omiten, ya que ese campo se ignora allí); mutable `https:` Las imágenes no son en caché.

Los modelos de la lista de gestión API y del selector del panel de instrumentos que pueden aceptar la entrada de imágenes. Cuando el El backend está disponible, `gpt-5.6-luna` (OpenAI) y `claude-haiku-4-5` (Anthropic) siempre se ofrecen como opciones de línea de base. `PUT /api/sidecar-settings` puede conservar una identificación personalizada/anticipada al catálogo desconocida. Por lo tanto, un Vision Sidecar enrutado explícitamente configurado es utilizable a menos que la evidencia de capacidad demuestre ese modelo no puede aceptar imágenes; esto preserva los sidecares personalizados seleccionados por el operador sin permitir un conocido sidecar de solo texto para recibir bytes de imagen.

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

La tarjeta de sidecar Dashboard Visión puede habilitar o deshabilitar el sidecar, configurar
`maxDescriptionsPerTurn`, y establecer `timeoutMs`Junto con el modelo existente, Backend y controles de razonamiento. Deshabilitar el sidecar no borra los configuración; volver a encenderlo mantiene el modelo anterior, backend, razonamiento, Tiempo de espera y límite.

`PUT /api/sidecar-settings` Acepta los mismos campos. Salida parcial de actualizaciones Omitió las teclas sin cambios. `timeoutMs` usa los límites enteros en entorno de ejecución (1–2147483647 ms).

Cuando cambia el switch de Visión efectivo, guardar también actualiza el catálogo administrado Codex y modelo de caché. Los informes de respuesta `catalogRefreshPending: true` si esa actualización no se completó; Se conserva el modificador guardado y la publicación de catálogo no confirma que un cliente en ejecución lo haya recargado.

La tarjeta del sidecar de búsqueda web tiene la misma forma de control: la primera fila del selector del modelo es
**Desactivado**. Off hace dos cosas, y la segunda es la razón por la que existe la fila. OpenCodex se detiene interceptar `web_search`, y el Codex La integración escribe CodexEl propio
`web_search = "disabled"` mode in `~/.codex/config.toml` — porque Codex sigue declarando su Nativo alojado `web_search` herramienta hasta que su propio modo diga lo contrario, y la herramienta un cliente La publicidad es la que el modelo busca. Un operador que quiere un servidor de búsqueda MCP para ser la única ruta de búsqueda necesita ambas mitades; de lo contrario, el modelo sigue llamando a la herramienta nativa.

`web_search` es la clave de Codex con su propio espacio de valor (`disabled`, `cached`, `indexed`, `live`) OpenCodex solo escribe `disabled` mientras el sidecar está apagado, y elimina su línea de marcaje una vez que el sidecar está de vuelta en — un sidecar re-habilitado cuyo cliente todavía tenía la herramienta nativa Apagado no tendría nada que interceptar. La escritura necesita una gestión `~/.codex/config.toml` (`ocx
sync`); la respuesta de la gerencia lo reporta como `codexWebSearch`y ambas superficies que pueden mostrarlo hacer: la tarjeta de búsqueda web del panel advierte cuando la escritura no sucedió, y `ocx agent sidecar web
--enabled off` imprime si sucedió. Solo un guardado que mueve el interruptor activa la escritura, por lo que los informes de respuestas "nada ha cambiado" ordinarios `not_requested` y no imprime nada extra. Una raíz
`web_search` línea el operador fijado a mano se sustituye mientras el sidecar está apagado, ya que dos llaves de raíz del mismo nombre no son válidas TOML. Su texto exacto se registra en el diario Codex y se vuelve a colocar en su lugar cuando el sidecar se enciende de nuevo — incluso para una línea añadida después del diario Se tomó una instantánea, que `ocx restore` Solos no pueden cubrir. El mismo récord es el que aún Reconocer nuestro propio `disabled` línea cuando la aplicación Codex ha reescrito `config.toml` y dejó caer el comentario que nombraba a su dueño.

Todavía puedes establecer `enabled: false` en `config.json` Si prefieres editar el archivo directamente. Anthropic-OAuth búsqueda y descripción de la imagen reutilizar el existente Claude Code OAuth precedente de huellas dactilares, pero debe ser probado en remojo con el cuenta y carga de trabajo previstos.

Ver la [Referencia de configuración](/es/reference/configuration/server/#sidecars) para cada campo.
