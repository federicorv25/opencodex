---
title: "Orden de modelos"
description: "Cómo determina opencodex el orden del modelo en el selector Codex y el modelo spawn_agent anula."
---

El selector de modelos Codex no conserva el orden de las declaraciones del proveedor o los arrays de modelos en el Configuración de opencodex. Su orden final proviene de las prioridades del catálogo, con un enfoque determinista. orden alfabético para modelos enrutados que comparten la misma prioridad.

<a id="the-rule-codex-applies"></a>

## La regla Codex se aplica

Codex's models-manager ordena entradas de catálogo visibles por `priority` en orden ascendente. Lo descarta el orden de la matriz de catálogo, por lo que mover una entrada anterior en una matriz JSON generada no se mueve En el caso de los niños. La implementación registra esta restricción directamente en
`src/codex/catalog/sync.ts`.

Por lo tanto, opencodex controla la ubicación de las funciones asignando prioridades más bajas, no confiando en posición de matriz. A menos que se indique lo contrario, las prioridades fijas y el ejemplo trabajado a continuación describen un catálogo sin selectores de cuenta Codex elegibles. Con `N` selectores elegibles, prioridades destacadas uso `N` como un paso: una elección nativa desnuda en el rango configurado `i` se expande a las filas selectoras en prioridades `i * N + j`donde: `j` es la posición basada en cero del selector; una opción enrutada usa
`i * N`; y una elección exacta calificada por el selector `i * N + j` por su selector. Enrutado no seleccionado las filas se mueven fuera de esos grupos selectores. Codex sigue anunciando solo los primeros cinco Selector de filas visibles.

Sin el pedido completo del seleccionador, las prioridades relevantes de no selector son:

| Entrada de catálogo | Prioridad | Fuente |
| --- | ---: | --- |
| `subagentModels[i]` | `i` (`0` a través `4`) | El mapa de rango destacado en `src/codex/catalog/sync.ts` |
| Otros modelos ruteados | `5` | Creación de entradas en `src/codex/catalog/sync.ts` |
| Modelos ruteados no destacados listados en `modelPickerOrder` | `1000 + i` | Rango de selector solo de visualización en `src/codex/catalog/sync.ts` |
| De forma predeterminada, las babosas nativas GPT | `9` | Creación de la entrada nativa en `src/codex/catalog/sync.ts` |
| Modelos nativos no seleccionados mientras existe una lista destacada | Al menos. `featured.length + 100` | Catálogo nativo merge in `src/codex/catalog/sync.ts` |

Los límites de gestión API `subagentModels` Cinco entradas con `slice(0, 5)` en
`src/server/management/agent-settings-routes.ts`. Esto coincide con el Codex `spawn_agent` superficie, que anuncia solo los primeros cinco modelos anulados. Los modelos fuera de esos cinco pueden seguir siendo visibles. en el selector principal y llamable por su id exacto.

<a id="how-ties-are-ordered"></a>

## Cómo se ordenan los lazos

Todos los modelos ordinarios tienen prioridad `5`, por lo que necesitan un desempate. Antes de que las entradas del catálogo sean construido, `gatherRoutedModels()` ordena la lista de modelos enrutados por nombre de proveedor y luego por ID de modelo, tanto alfabéticamente (`src/codex/catalog/provider-fetch.ts`).

Esto significa que ninguno de estos detalles de configuración cambia el orden final:

- orden de las llaves en la declaración `providers` objeto;
- el orden de los ids en un proveedor `models` matriz.

`orderForSubagents()` luego usa un orden estable para mover las selecciones destacadas configuradas al frente en el El mismo orden que `subagentModels`. Los modelos no destacados mantienen el orden relativo alfabético del proveedor/identificador establecido anteriormente (`src/codex/catalog/sync.ts`) El rango destacado también se convierte en prioridades `0` a través `4` cuando se construyen las entradas, por lo que el orden de prioridad de Codex conserva ese valor principal secuencia.

<a id="visibility-is-separate-from-ordering"></a>

## La visibilidad está separada del orden

`selectedModels` y `disabledModels` decidir qué modelos enrutados están expuestos; no están ordenando controles. `filterCatalogVisibleModels()` convierte ambas selecciones en `Set` búsquedas y filtra el lista sin usar las matrices como rangos (`src/codex/catalog/provider-fetch.ts`).

Como resultado, reordenar `selectedModels` o `disabledModels` no tiene ningún efecto sobre la posición del selector. Puede solo cambia si se incluye un modelo.

<a id="effective-picker-pattern"></a>

## Patrón de selector efectivo

Sin selectores de cuenta elegibles y una lista de características no vacía, el pedido resultante es:

1. Modelos en la configuración exacta `subagentModels` orden, con prioridades `0` a través `4`.
2. Todos los modelos enrutados restantes, ordenados alfabéticamente por el proveedor y luego la identificación del modelo, con prioridad `5`.
3. Modelos nativos no seleccionados, empujados por debajo del bloque destacado durante la fusión del catálogo.

Sin `subagentModels`, los modelos enrutados siguen siendo prioritarios `5`, las entradas nativas de GPT usan sus valores normales Prioridad (normalmente `9` para entradas creadas por opencodex), y el grupo enrutado permanece proveedor/id alfabético.

<a id="example"></a>

## Ejemplo

Supóngase `subagentModels` contiene estos cinco ID en este orden exacto:

```toml
subagentModels = [
  "gpt-5.5",
  "opencode-go/glm-5.2",
  "anthropic/claude-opus-4-6",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
]
```

El selector comienza de la siguiente manera:

| Posición del selector | Modelo | Prioridad | Por qué aparece allí |
| ---: | --- | ---: | --- |
| 1 | `gpt-5.5` | `0` | Primero `subagentModels` selección |
| 2 | `opencode-go/glm-5.2` | `1` | Segunda selección, aunque su proveedor clasifique `anthropic` |
| 3 | `anthropic/claude-opus-4-6` | `2` | Tercera selección |
| 4 | `gpt-5.6-sol` | `3` | Cuarta selección |
| 5 | `gpt-5.6-terra` | `4` | Quinta selección |
| 6 | `anthropic/claude-fable-5` | `5` | Primer id enrutado restante en orden alfabético proveedor/id |
| 7 en adelante | Los modelos enrutados restantes | `5` | Proveedor alfabéticamente, luego modelar id alfabéticamente |
| Después de modelos enrutados | Los modelos nativos | `featured.length + 100` o más alto | Los nativos no seleccionados se mueven por debajo del bloque destacado |

Las primeras cinco entradas son las anulaciones anunciadas a `spawn_agent`El resto continúa en el orden de recogida normal. Con los selectores de cuenta, el límite de cinco entradas se aplica después de elegir opciones nativas básicas. se han expandido a grupos selectores calificados.

<a id="changing-the-order"></a>

## Cambiar el orden

Uso `subagentModels` para elegir y ordenar los modelos líderes que Codex también anuncia a
`spawn_agent`. El panel de control **Subagentes** página puede reordenar ids nativos y ruteados. Uso
`ocx agent subagents set` o edite la configuración de opencodex para obtener
`<selector>/<native-openai-model>` opciones; el panel de control conserva esas ID una vez guardadas, incluidas las opciones actualmente no disponibles. Utilice como máximo cinco ID configurados. Con selectores de cuenta, un nativo desnudo opción puede expandirse en múltiples filas de catálogo calificadas por selector, por lo que las opciones configuradas y Las filas anunciadas no son necesariamente uno a uno.

Si ninguna cuenta configurada admite un modelo nativo con apertura de cuenta, la solicitud falla como no válida. elección de modelo. Si las cuentas de soporte existen pero están temporalmente agotadas o no están disponibles, falla como un límite de tasa reintentable. Estos estados nunca se informan como una clave API no válida; elija otra modelo disponible o esperar a que se vuelva a abrir la ventana de cuota de la cuenta capaz.

Uso `modelPickerOrder` para el orden de solo visualización de enrutado `<provider>/<model>` filas más allá de eso Bloque destacado:

```json
{
  "modelPickerOrder": [
    "tyler/deepseek-v4-flash",
    "jd-chat/kimi-k3",
    "jd-chat/glm-5.2"
  ]
}
```

Las filas enrutadas aparecen en el orden configurado. Una fila enrutada omitida de la matriz mantiene su prioridad normal, por lo que se mantiene por delante de la `modelPickerOrder` banda de visualización; listar cada fila enrutada cuya posición relativa desea controlar. Una fila también presente en `subagentModels` mantiene su Prioridad destacada. Con una lista solo encaminada, las filas nativas mantienen sus posiciones normales.

Para pedir el selector completo, incluya un identificador nativo desnudo:

```json
{
  "modelPickerOrder": ["gpt-5.6-sol", "opencode-go/glm-5.3"]
}
```

Las filas listadas aparecen primero en orden de array, seguidas por las filas no listadas en prioridad natural Orden. Matching utiliza ID de catálogo exactos: `gpt-5.6-sol` y `openai/gpt-5.6-sol` Están separados filas. También se aceptan ortografías crudas y codificadas del mismo id enrutado, con precisión exacta. Los partidos tienen prioridad. Las entradas vacías son ignoradas. Las filas calificadas para la cuenta necesitan su selector de identificación calificada en la lista.

<a id="migration-note-native-ids-in-existing-orders"></a>

### Nota de migración: ID nativos en pedidos existentes

Anteriormente, los nativos en `modelPickerOrder` fueron ignorados. Una lista existente que contiene un id nativo desnudo ahora activa el pedido de selector completo, incluidas las filas destacadas. Retire los id nativos desnudos para mantener el comportamiento anterior solo enrutado. Desactivado, vacío y Las listas de solo enrutado conservan su comportamiento; El cálculo del candidato de orientación de prioridad natural de OpenCodex no cambia.

`modelPickerOrder` preserva el cálculo de prioridad natural de OpenCodex de hasta cinco preferidos candidatos a la orientación subagente. Cada fila movida conserva su prioridad natural por separado de Su Nativo `priority`; cambiar el orden del selector por sí solo no debe cambiar ese cálculo OpenCodex. No restringe la elegibilidad para una anulación de modelo de nombre exacto: la lista nativa anunciada no es una lista de permisos, y aún se aplican las restricciones existentes de autenticación, modelo/esfuerzo y backend.

Nativo Codex usa nativo `priority` para seleccionar los primeros cinco modelos elegibles de selector visible Anunciado por `spawn_agent` en V1 y en V2 cuando se exponen las anulaciones del modelo. Los anunciados Por lo tanto, cinco pueden cambiar con el orden de selección, incluso cuando los candidatos preferidos de OpenCodex permanecen sin cambios. V1 no recibe ninguna inyección de OpenCodex. V2 puede recibir adicionalmente La orientación de prioridad natural de OpenCodex cuando el estado del catálogo del cliente lo permite; esa orientación sí lo hace no reordenar la lista anunciada de la herramienta nativa.

`disabledModels` Cada proveedor de `selectedModels` Siguen siendo campos de visibilidad, No ordenando controles. No hay separación `modelOrder`, `providerOrder`, o configuración de mapa de prioridad.

<a id="dashboard-picker-presets"></a>

## Configuración preestablecidos del selector de panel

En marcha **Modelos**, elige **Predeterminado**, **A–Z por modelo**, **Grupo por proveedor**, o **Instantánea más utilizada**Entonces, **Aplicar orden**. Esto guarda los identificadores de ruta actualmente visibles y `modelPickerOrderMode` (`alphabetical`, `provider`, o `most-used`) La mayoría de las lecturas usadas retienen el uso una vez cuando se aplican; las recargas restauran la instantánea sin recuperar el uso nuevamente. Los modelos nuevos o eliminados no lo vuelven a calcular automáticamente. Un pedido guardado manualmente, incluyendo un pedido completo/nativo, permanece intacto hasta que aplique explícitamente un reemplazo. El valor predeterminado borra ambos campos de selección, incluso cuando no hay modelos enrutados disponibles.

Los controles utilizan `GET/PUT /api/subagent-models`: `chosen` y `available` conservar las opciones guardadas de la lista, incluidos los modelos discapacitados o desaparecidos; `pickerAvailable` contiene solo los identificadores de catálogo enrutados elegibles. La página Modelos envía `pickerOrder` y `pickerOrderMode`, nunca `models`. La lista solo guarda la configuración del selector de conservación. Las actualizaciones combinadas no válidas y la persistencia fallida dejan intacto el estado anterior del selector/roster.

Los configuración preestablecidos de solo ruta mantienen las bandas de prioridad existentes destacadas/nativas. Afectan al catálogo Codex y a los grupos enrutados de descubrimiento Claude; El prefijo nativo de Claude y la propiedad explícita de perfil/alias de escritorio permanecen sin cambios. Se conservan los rangos de orientación de OpenCodex y las configuración de reserva configuradas, pero los cinco anuncios de Codex nativos y los valores predeterminados recomendados pueden cambiar con la prioridad de visualización. Guardar no reinicia clientes; puede que una actualización de catálogo permanezca pendiente, y los clientes que tengan un catálogo antiguo pueden necesitar volver a abrir.


<a id="custom-routed-order"></a>

### Orden enrutada personalizada

Seleccionar **Orden de encargo** en Modelos para cargar una instantánea nueva. Arrastre una fila móvil antes otra fila, o utilice sus botones Arriba/Abajo, **Guardar borrador**. Las filas enrutadas destacadas permanecen en el frente a su rango configurado y no puede moverse. No se muestran las filas nativas; esto no es una vista previa de los nativos completos. Las filas guardadas que sobreviven mantienen su orden relativo y nuevos candidatos Siga la lista de candidatos actual. Cada guardado envía la lista completa, sin cambiar El roster destacado.

Una orden que contiene ids nativos desnudos permanece protegida hasta que aplique explícitamente un preajuste encaminado. o por defecto. Seleccionar una opción diferente por sí sola no la reemplaza. Bloques estatales desconocidos edición. Antes de guardar, el editor comprueba una nueva instantánea; los cambios preservan su borrador y bloquean Ahorrar hasta **Recargar y descartar borrador** carga los configuración actuales. Las solicitudes de fallos retienen el proyecto. Los archivos guardados aceptados aún pueden tener una actualización de catálogo pendiente; vuelva a cargar antes de volver a editar.

El editor también requiere una identidad de modelo inequívoca para cada candidato enrutado. Si el modelo catálogo está incompleto, actualice la página Modelos antes de editar; solo recargue la configuración del selector No se puede restaurar las identidades de catálogo que faltan. Las opciones destacadas se combinan exactamente sin recortar; opciones duplicadas usan su última posición configurada, y los id canónicos tienen prioridad sobre los id sin procesar.
