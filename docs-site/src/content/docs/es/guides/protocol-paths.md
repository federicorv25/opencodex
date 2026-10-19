---
title: "Rutas de protocolo"
description: "Cómo una solicitud en el Responses, Chat Completions o Messages API llega a un proveedor, cómo obtener una vista previa y rastrear esa ruta, y los switches por etapas que la cambian."
---

opencodex sirve a tres API de cliente: **Responses** (`/v1/responses`), **Chat Completions**
(`/v1/chat/completions`), y **Messages** (`/v1/messages`) Cada proveedor recibe una alambre, decidido por su adaptador. Cuando el cliente API y el cable ascendente difieren, la solicitud es convertido en el camino de entrada y la respuesta se convierte en el camino de vuelta. Esta página explica cómo Se nombra la ruta, cómo verla antes y después de una solicitud y qué configuración la cambian.

Todos los configuración de esta página están desactivados por defecto. Con los valores predeterminados, las solicitudes viajan exactamente como lo hacen antes de que existieran estas configuración.

<a id="delivery-modes"></a>

## Modos de entrega

Una ruta es una lista de saltos desde el cliente API al cable ascendente. Los saltos son los tres API nombres, `ir` (Solicitud y formulario de evento neutrales del adaptador de opencodex), y `responses-internal`
(Responses JSON o SSE producido solo como un puente interno, nunca visto por un cliente).

| Modo | Significado | Ruta de solicitud de ejemplo |
| --- | --- | --- |
| `native` | Mismo API en ambos extremos; el cuerpo del cliente es lo que recibe el proveedor | `chat > chat` |
| `translated` | Convertido una vez, a través del códec del cable de destino o el IR | `chat > responses`, `responses > ir > messages` |
| `legacy-bridge` | Convertido a través del formulario interno Responses primero | `chat > responses-internal > ir > messages` |
| `blocked` | Rechazado antes de que nada fuera enviado | ninguno |

`native` Describe cómo viaja una solicitud. No es un veredicto de compatibilidad: un camino nativo puede todavía cumplir con un proveedor que rechaza un campo, y los resultados verificados de la Compatibility Lab son una cosa separada.

Con cada apagado, una ruta de proveedor único elegible toma estos caminos:

| Cliente API → de origen | Ruta |
| --- | --- |
| Responses → Responses | Nativo |
| Responses → Chat o Messages | Traducido a través de IR |
| Chat → Chat | nativo (JSON cuando el cliente envía `stream: false`) |
| Chat → Responses, Messages → Responses | traducido a través del códec Responses |
| Chat → Messages, Messages → Chat | Puente legado |
| Messages → Messages | nativo solo cuando el llamante reenvía su propia credencial Anthropic; puente heredado para una clave opencodex |

Los combos, las políticas de enrutamiento y el esfuerzo sintético o las filas de modelos rápidos toman el puente heredado de Chat y Messages a menos que un interruptor debajo diga lo contrario.

<a id="feature-effects"></a>

## Efectos de función

Algunas características de solicitud no pueden sobrevivir a cada conversión. Por ejemplo, los campos Chat `n`,
`logprobs`, `logit_bias`, `seed`, `audio`, y `prediction` no tienen lugar en un cuerpo Responses, y el Messages `top_k` campo se deja caer en el camino a Responses. opencodex registra cada efecto como
`passthrough`, `translated`, `degraded`, o `unsupported` (Se muestra como *Caído* en el panel). Estos se declaran desde el código de los convertidores; no son resultados medidos.

<a id="preview-a-path"></a>

## Previsualizar una ruta

Una vista previa se calcula solo a partir de su configuración. No envía nada a ningún proveedor, no rotación combinada avanzada, y no se registra.

- Panel de control: **API** página, **Solicitar vista previa de ruta**.
- CLI:

  ```bash
  ocx api explain --model combo/main --inbound chat --feature request.seed
  ocx api explain --model claude-sonnet-4-5 --inbound messages --json
  ```

La vista previa muestra cada ruta candidata con su ruta de solicitud, modo de entrega, efectos de función y Si el `reject` política (abajo) lo rechazaría. `ocx api protocols --json` enumera la característica nombres que acepta. Se muestra una solicitud Messages que reenvía la credencial Anthropic del llamante con `caller-credential-required` en lugar de asumir, porque una vista previa no tiene llamante.

<a id="trace-a-request"></a>

## Rastrear una solicitud

Cada solicitud que llegó a un proveedor, o que fue rechazada antes de enviarla, registra la ruta que realmente tomó. tomó en su fila de registro: el modo final y las rutas, las razones, la efectos característicos, y un camino por intento físico. En el panel, **Registros** muestra una insignia de camino, a **Ruta de protocolo** filtro, y a **Ruta de protocolo** en el detalle de la solicitud. Las filas más antiguas tienen No hay datos de ruta y decirlo; nada se adivina.

<a id="unrepresentable-features"></a>

## Características irrepresentables

`protocols.unrepresentable` decide lo que sucede cuando una solicitud lleva una característica que su camino gota:

- `legacy` (predeterminado): la solicitud se envía como antes, y la pérdida aparece solo en el archivo de seguimiento. efectos característicos.
- `reject`: la solicitud se rechaza con HTTP 400 antes de que se envíe nada, nombrando solo la función llaves. Respuestas de chat `invalid_request_error` con código `unsupported_feature`; Respuestas de Messages
  `invalid_request_error`. El rastro es `blocked`.

Bajo `reject`, una ruta directa se juzga en la entrada una vez que su proveedor y alambre se establecen. Los combos y las políticas no se juzgan en el ingreso; con `nativeChatCombos` en, un combo de chat jueces cada candidato y se salta uno que no puede llevar la petición.

<a id="rollout-switches"></a>

## Interruptores de despliegue

Estos interruptores preparan los nuevos caminos. Cada uno de los valores predeterminados se desactiva, excepto `antigravityDirect`, y un interruptor que está apagado no cambia nada.

| Cambiar | Cuando esté |
| --- | --- |
| `nativeChatCombos` | Un candidato de chat elegible dentro de un combo se envía de forma nativa desde su propia copia del cuerpo del cliente; los otros candidatos mantienen el puente. |
| `managedMessagesNative` | Una solicitud Messages cuya ruta es un proveedor Anthropic directo y autenticado por clave se envía como Messages en lugar de a través del puente. Las rutas que necesitan un comportamiento de solo puente (un esfuerzo anclado, elisión de habilidades bloqueadas, el sidecar de búsqueda web, preprocesamiento de visión, filas sintéticas) permanecen en el puente. |
| `managedMessagesNativeOAuth` | Nativo Messages para el unpooled `anthropic` Proveedor de OAuth en `api.anthropic.com`. Eficaz sólo con `managedMessagesNative`; un conjunto de cuentas Anthropic agrupadas OAuth permanece en el puente. |
| `directEncoders` | Para un flujo ascendente que no sea Responses, la respuesta a un cliente Chat o Messages se codifica directamente desde los eventos del adaptador en lugar de a través del flujo interno Responses. El lado de la solicitud no cambia. |
| `antigravityDirect` | **Activado por defecto**; lo puso a `false` para apagarlo. Una solicitud de Chat o Messages cuya ruta es un proveedor de Antigravedad Google salta el cuerpo interno Responses en ambas direcciones: la conversación se decodifica desde el cuerpo del cliente directamente a lo que compila el adaptador Google, y la respuesta se codifica directamente como con `directEncoders`. El camino lee `chat -> ir -> other` o `messages -> ir -> other`. Las configuración de solicitud (modelo, esfuerzo, límites, elección de herramientas) aún pasan por las políticas habituales, por lo que la rotación de la cuenta, las reglas de esfuerzo y el uso no se modifican. Combos, políticas, una herramienta de búsqueda web alojada, imágenes para un modelo marcado solo texto, un modelo que la intercepción de llamada de sombra podría reescribir y el texto que el proxy reescribe (un catálogo de habilidades, un enlace de imagen generada) permanecen en el puente y la fila de registro nombra la razón. |
| `shadowPlan` | Al final de cada solicitud de Chat o Messages, el plan que una vista previa habría predicho se compara con la ruta que tomó la solicitud; un desacuerdo agrega `planMismatch: true` al registro de ruta de la fila de registro. No se envía ninguna segunda solicitud. |

Cámbialos con el CLI o editando `protocols` en `config.json`
([referencia](/es/reference/configuration/server/#protocol-paths-protocols)):

```bash
ocx api policy                                   # show the current policy; changes nothing
ocx api policy --rollout shadowPlan=on           # change one switch
ocx api policy --unrepresentable reject
```

`ocx api policy` escribe solo cuando pasa una bandera de configuración, y solo cuando la ejecuta.

<a id="shadow-plan"></a>

### Plano de sombra

`shadowPlan` es el primer paso seguro: no cambia ninguna solicitud. Verifica si la vista previa está de acuerdo con la realidad para el tráfico que realmente envías. La comparación usa la ruta que resolvió la solicitud (para un combo, el objetivo que respondió), y compara el modo de entrega, el cable ascendente, y la ruta de solicitud. El camino de la respuesta no se compara, porque `directEncoders` Lo cambia y el vista previa no modela ese cambio. Una solicitud Messages reenviada por el llamante y una compatibilidad con Claude El rechazo no se compara. Las solicitudes Responses no se comparan.

`planMismatch` aparece en el `protocolTrace` de una fila devuelta por `GET /api/logs`. El panel No lo muestra todavía.

<a id="what-has-not-moved-yet"></a>

## Lo que aún no se ha movido

Estas rutas siguen utilizando el puente interno Responses o no están cubiertas:

- Las solicitudes de chat y Messages todavía se decodifican en un cuerpo con forma de Responses antes del IR, incluyendo en un camino traducido. La excepción es una solicitud de Chat o Messages a una única ruta antigravedad Google. a menos que `antigravityDirect` está configurado para `false`.
- Los candidatos de la política de enrutamiento, combos alcanzados a través de una fila de esfuerzo, combo candidatos mientras
  `nativeChatCombos` está apagado, y combos Messages.
- codificación Direct (`directEncoders`) cubre solo una ruta concreta, no Responses en streaming entrega. Hijos combinados y de políticas, compactación enrutada, adaptadores de giro (Cursor, Devin, CLIs del agente de codificación, CodeBuddy), y las vueltas del sidecar mantienen el puente.
- Un candidato combinado de chat nativo que falla en la banda antes de que cualquier salida no pase al siguiente candidato; uno puenteado lo haría.
- Los sidecares de búsqueda web, visión y generación de imágenes solo se ejecutan en la tubería Responses.
- `previous_response_id`, `store`, `background`, y las características Responses estancia de compactación.
- Los adaptadores cuyo cable no es ninguna de las tres API (Gemini, Kiro, Cursor y otros) se traducen a través de la IR sin afirmaciones de características.
- Messages nativo administrado a Anthropic de primera parte preservar un coherente observado Claude Code CLI agente de usuario, UUID de sesión y encabezados SDK permitidos en la actualización y selección de cuenta de token. La colocación de credenciales sigue siendo propiedad de un proxy y la lista de permisos beta aún se aplica. Desaparecidos o no válidos usa los encabezados de compatibilidad existentes; los hosts compatibles y Responses generados retienen su comportamiento actual. Los encabezados por sí solos no autorizan solicitudes ni establecen soporte oficial. El agente de TypeScript SDK `sdk-ts` punto de entrada usuario-agente se reconoce con el mismo requerido encabezados de identidad, preservando sus betas de características nativas permitidas en las solicitudes Anthropic de origen.
- El chat nativo sobre OAuth no está planeado. Nativo Messages sobre Anthropic OAuth cubre solo un cuenta no compartida; un conjunto de cuentas agrupadas permanece en el puente.
- La ruta de acceso nativa administrada Messages reenvía un `anthropic-beta` valores solo de un corto Permitido y sólo para `api.anthropic.com`, gotas campos de nivel superior fuera de su lista de permisos sin un efecto de característica, y no se aplica
  `claudeCode.stabilizePromptCache`. Un cliente reconocido de Claude Code mantiene `context-management-2025-06-27` junto con su
  `context_management` Campo de cuerpo. Para las solicitudes de clave Anthropic y OAuth de origen, cualquier El cliente Messages puede enviar `thinking-binding-controls-2026-08-01` con `thinking.block_binding`
  en el pensamiento adaptativo o habilitado. Las tiras proxy que anidaron el campo cuando la beta está ausente o el destino no lo soporta, conservando el resto de la configuración de pensamiento. Nube Los puntos finales de proveedores y los proveedores compatibles con terceros no heredan el soporte beta de terceros. El emparejamiento utiliza el encabezado final, incluidas las betas configuradas por el operador; solo una beta es válida para
  [Diagnósticos de transformación del pensamiento](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking). Los nombres beta caídos aparecen una vez en el registro del proxy como `anthropic-beta-dropped=<names>`.
