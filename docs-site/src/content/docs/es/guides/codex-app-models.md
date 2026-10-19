---
title: "Codex Selector de modelos de aplicaciones"
description: "¿Cómo opencodex Los modelos aparecen en Codex App, Codex CLI, y Codex TUI A través de la compartida Codex catálogo."
---

opencodex no parchea la aplicación Codex. Escribe la misma configuración Codex y catálogo de modelos que Uso de Codex CLI/TUI. El servidor de aplicaciones lee ese estado compartido, pero algunas versiones de escritorio Codex aplican un segunda lista de permisos de modelo remoto en el renderizador y aún puede eliminar filas enrutadas del selector.

Las entradas de OpenAI usan dos rutas de credenciales: inicio de sesión nativo de Codex y el espacio de nombres
`openai-apikey/<model>` API-clave de transporte. Cambio `codexAccountMode` entre Pool y Direct por no cambia los identificadores de los selectores. Cuando las filas de selectores calificados por cuenta están habilitadas por
`codexAccountPickerEnabled` y `codexAccountNamespaces` Tiene selectores elegibles cuyos Las cuentas asignadas todavía existen, sin embargo, opencodex añade separado `<selector>/<native-openai-model>` filas para las cuentas asignadas y oculta las filas nativas del selector Codex. Las etiquetas selectoras son nombres públicos elegidos por el usuario sin incorporado en el significado de rol de cuenta. La selección de una fila calificada utiliza solo su cuenta asignada, no cambiar la cuenta Pool activa y se cierra en lugar de cambiar de cuenta cuando el objetivo es No disponible. Si el catálogo de cuentas de Codex contiene una identificación visible de la familia API compatible con OpenAI que aún no está en el conjunto estático de opencodex, el id exacto se conserva como una fila calificada por el selector para selectores de cuenta principal elegibles; no se copia en una cuenta no relacionada y no se agrega a la lista de modelos desnuda o API-key. La fila coincide en la forma del campo que tiene una fila de catálogo real, que filtra las entradas mal formadas — no prueba que el id provenga de una respuesta ascendente, ya que el caché es un archivo propiedad del usuario. Véase [Selectores de cuenta Codex exactos](/es/reference/configuration/routing/#exact-codex-account-selectors).

`gpt-daybreak-blue-latest` está cerrada por cuenta. opencodex comprueba cada cuenta autenticada de ChatGPT propia lista de modelos Codex antes de anunciarla o enrutarla. En el modo Pool, la fila desnuda solo existe cuando al menos una cuenta Pool elegible informa la babosa. En el modo Direct, la fila desnuda sigue la cuenta utilizada por el catálogo local, y cada solicitud también comprueba la credencial de llamada reenviada (o la credencial principal almacenada cuando se sustituye una portadora de admisión OpenCodex). A
`<selector>/gpt-daybreak-blue-latest` fila solo existe cuando la cuenta asignada de ese selector lo informa. El enrutamiento Pool excluye las cuentas sin derecho. Si no se puede confirmar ninguna lista, la fila cerrada falla en lugar de gastar una prompt en un 400 ascendente.

`gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` y `gpt-6-astra` Están deliberadamente **no** cerrada de esa manera: se enumeran en cada instalación, independientemente de lo que diga la lista de derechos. opencodex pregunta de origen bajo una versión de cliente lo suficientemente nueva como para devolverlos, pero no puede hacer que aparezca una respuesta — una cuenta no confirmada, una búsqueda de tiempo de espera o un fragmento que no se ha puesto al día haría que el modelo desaparezca del selector sin explicación. Enumerarlos significa que se envía la solicitud y en su lugar se ve el estado ascendente real. Una cuenta que no tiene uno de estos modelos obtendrá un rechazo ascendente en el momento de la solicitud en lugar de una fila ausente, y en una cuenta múltiple Pool la solicitud ya no se dirige primero a la cuenta que posee el modelo. `disabledModels` Es la palanca para Escondiendo cualquiera de ellos.

Una diferencia, explícita `customModels` entrada puede exponer el mismo identificador de cable que
`openai/gpt-daybreak-blue-latest` a través del proveedor de reenvío canónico Codex:

```json
{
  "customModels": [
    {
      "id": "daybreak-codex-forward",
      "provider": "openai",
      "modelId": "gpt-daybreak-blue-latest"
    }
  ]
}
```

Solo ese proveedor exacto, el punto final y la identificación del modelo reciben la instantánea de capacidad de Sol fijada: 922.000 contexto, 829.800 compactación automática, la escalera de razonamiento nativa y la herramienta nativa Codex Metadatos. La solicitud sigue enviando `gpt-daybreak-blue-latest`; opencodex no lo reescribe a Sol o conceder derechos de cuenta. Los facturados por separado
`openai-apikey/daybreak-blue-latest` La fila API es una ruta diferente y sus límites son 1.050,000 / 922,000 nunca se copian en la fila de inicio de sesión Codex.

Para las filas personalizadas de Astra y Daybreak en esa canónica `openai` Codex-destino directo, explícito `reasoningEfforts` están limitados por las capacidades Codex ancladas del modelo. Una costumbre
`["none", "minimal", "low"]` se convierte `["low"]` en el catálogo; una lista no vacía sin Los valores soportados también vuelven al valor predeterminado nativo como una sola opción. Una explícita `[]`
permanece vacío y no tiene anuncios predeterminados. Un valor predeterminado declarado se conserva solo si pertenece a la lista resultante; de lo contrario, el valor predeterminado nativo se usa cuando está presente, luego el primer elección. La configuración personalizada almacenada no cambia y las sincronizaciones repetidas no agregan `max` Volver a la página Lista personalizada estrecha.

El mismo vínculo de catálogo se aplica cuando el identificador de modelo personalizado ha fijado metadatos de capacidad nativa, incluyendo una puerta de enlace arbitraria, tal como `YYLJ/gpt-6-astra`. El escritorio valida el id del modelo, así que
`none` y `minimal` se eliminan de esa fila de catálogo. La identidad nativa completa requiere proveedor exacto, destino e identidad de modelo respaldada por capacidad; una puerta de enlace no hereda Responses Lite, multiagente o ventanas nativas de su nombre. Astra nativa de Codex `ultra` opción se conserva: es un modo de delegación de cliente convertido a El esfuerzo de alambre apoyado, distinto del [Lista de esfuerzo del modelo API](https://developers.openai.com/api/docs/models/gpt-6-astra). La normalización de catálogos no reescribe los configuración de hilos existentes. Esfuerzo nativo en tiempo de solicitud Las pinzas permanecen canónicas hacia adelante solamente.

Cuando el `codexAccountNamespaces` mapa está vacío, las filas de selector calificadas para cuenta están apagadas. Si
`codexAccountPickerEnabled` se omite con un mapa no vacío, se tratan como habilitados para retrocompatibilidad. Ponlo a `false` para ocultar filas calificadas generadas y restaurar el nativo desnudo filas en el selector sin eliminar asignaciones o deshabilitar exactamente
`<selector>/<native-openai-model>` enrutamiento.

API Las entradas GPT-5.6 y Daybreak usan 1,050,000 contexto / 922,000 entrada máxima, y `*-pro` ids del selector resuelven al modelo del alambre base con
`reasoning.mode: "pro"` mientras que los registros, el uso y el estado del selector mantienen la identificación virtual. El catálogo API se fija a exactamente diez ids: `gpt-5.5`, `gpt-5.6`, Sol/Terra/Luna, sus tres Pro ID virtuales, `daybreak-red-latest`, y `daybreak-blue-latest`; no hay ningún genérico
`gpt-5.6-pro` alias. Las solicitudes compactas mantienen el nivel seleccionado pero envían el modelo base sin un objeto de razonamiento.

Seleccione la ruta de credenciales representada por el identificador de selector. Cambiar Pool/Direct en la página de proveedores;
`<selector>` a continuación es una etiqueta pública elegida por el usuario mapeada a través de `codexAccountNamespaces`:

```text
gpt-5.6-sol                         # bare Codex-login route via Pool or Direct
<selector>/gpt-5.6-sol              # stored Codex account mapped by that selector
openai-apikey/gpt-5.6-sol           # API key
openai/gpt-daybreak-blue-latest     # explicit Codex-forward custom row (922,000)
<selector>/gpt-daybreak-blue-latest # account-qualified native id, only when that account reports it
openai-apikey/daybreak-blue-latest  # separate API-key route (1,050,000 / 922,000)
```

Instalación y configuración nuevas sin modo guardado por defecto en Pool. Las configuración actuales usan el marcador 2 y mantener la fuente v1 enviada en `~/.opencodex/config.json.pre-openai-tiers-v2.bak`; restaurarlo con:

```sh
cp ~/.opencodex/config.json.pre-openai-tiers-v2.bak ~/.opencodex/config.json
```

Las configuración anteriores de tres proveedores v1 migran automáticamente a la fila con una sola opción.

<a id="desktop-remote-allowlist-limitation"></a>

## Limitación de lista remota de escritorio

Si `codex debug models` y app-server `model/list` contiene un modelo enrutado pero el escritorio no muestra it, verifique el flujo ascendente [Codex problema   ?19694](https://github.com/openai/codex/issues/19694). Con el remoto `use_hidden_models` política activa, el escritorio puede guardar solamente ids en su nativo
`available_models` lista y también puede mostrar filas nativas cuya visibilidad del catálogo es `hide`. Las actualizaciones de catálogo y los reinicios proxy por sí solos no pueden cambiar esa directiva de renderizador.

Para un modelo enrutado equivalente, opencodex proporciona un modo combo de alias nativo explícito por defecto. Publica una babosa desnuda listada con una etiqueta de visualización personalizada honesta y rutas que hacen la babosa exacta. a través del combo configurado antes del enrutamiento canónico OpenAI. También omite el nativo desnudo discapacitado filas del catálogo efectivo mientras existan alias de compatibilidad, por lo que Desktop no puede resucitar Ellos, ignorando `visibility`. Véase [Codex Compatibilidad con la lista de permisos nativa del escritorio](/es/guides/combos/#codex-desktop-native-allowlist-compatibility)
para el comando, la semántica de la clave de desactivación y las restricciones de seguridad.

<a id="what-this-means-for-a-disabled-native-model"></a>

### Lo que esto significa para un modelo nativo discapacitado

Sin un alias nativo configurado, la desactivación de una babosa GPT nativa no lo elimina del catálogo. La fila se queda con `visibility: "hide"`, que `/v1/models` y el panel de instrumentos ambos honran — dejan de enumerar el modelo — mientras que Desktop, bajo la política anterior, puede seguir mostrándolo. Así que El modelo todavía se puede elegir en el escritorio después de deshabilitarlo, y las superficies no están de acuerdo sobre si existe.

La selección no se rechaza por estar deshabilitado. `disabledModels` visibilidad del catálogo, no admisión, por lo que la solicitud se enruta por las reglas ordinarias como si el modelo estuviera habilitado: se ejecuta en el modelo que deshabilitó o falla en cualquier ruta que se resuelva. De cualquier manera el El resultado no es el que implica la palanca.

La fila se mantiene deliberadamente. Contiene los metadatos ascendentes reales, por lo que vuelve a habilitar el modelo restaura esos metadatos en lugar de una suposición sintetizada. Cuando necesites que la fila desaparezca por completo más que oculto, configurar un `nativeAlias` combo: mientras uno existe, las filas nativas desnudas desactivadas son omitido del catálogo efectivo por completo.

Si Codex `config.toml` pins una raíz `model` que este proxy no expone — un modelo deshabilitado entre ellos — cada nueva sesión comienza en un modelo opencodex no sirve. `ocx doctor` informes que bajo **Exposición del modelo predeterminado Codex**, como una advertencia en lugar de un fracaso, y dice cuando No se pudo determinar el conjunto expuesto en absoluto.

<a id="integration-path"></a>

## Ruta de integración

`ocx init`, `ocx start`, y `ocx sync` cablear la configuración y el catálogo compartidos de Codex en el proxy; ver
[Integración con Codex](/es/guides/codex-integration/) para inyección de configuración, sincronización de catálogo, shims, WebSocket fallback, y restaurar la mecánica.

<a id="native-quota-fallback-limitation"></a>

## Limitación de reserva de cuota nativa

Cuando la aplicación Codex agota su cuota nativa de cinco horas, puede cambiar a una reserva modelo de reserva y gris las otras filas en su selector. Reportado en
[#2813](https://github.com/lidge-jun/opencodex/issues/2813), que el gating también oculta enrutado filas opencodex, aunque estas utilizan credenciales de proveedor no relacionadas y no consumen ninguna de las Cuota ChatGPT.

Esta puerta es aplicada por el cliente antes de que una solicitud llegue al proxy, por lo que opencodex no puede levantar - Sí. Las filas enrutadas se escriben con `visibility: "list"`, solo consulta de filtrado de catálogo
`disabledModels` Cada proveedor de `selectedModels`, y ningún valor de cuota participa en la ruta Visibilidad.

La selección de un modelo encaminado explícitamente no pasa por el selector. Establecer el modelo en
`config.toml`:

```toml
model = "anthropic/claude-sonnet-5"
```

o enviarlo directamente:

```bash
ocx access test anthropic/claude-sonnet-5 --protocol responses
```

Ambos caminos se encaminan correctamente **Una vez que la solicitud llega al proxy** — esa parte está cubierta por Pruebas. Sin embargo, la aplicación de escritorio Codex no envía el modelo configurado mientras se está reservando el modo activo: decide reservar desde su propio `wham/usage` encuesta (`luna_reserve` upsell más un permitido
`gpt-reserve` ej., un límite adicional) y obliga al ajuste del modelo a `gpt-reserve` antes de la solicitud Así que el `config.toml` La ruta se anula en la aplicación. Uso `ocx access test`, Claude Code a través del proxy (`ocx claude`), o cualquier `/v1` cliente hasta que se restablezca la ventana. Véase
[Modelos encaminados durante el modo de reserva Codex](/es/guides/codex-integration/#routed-models-during-codex-reserve-mode).

<a id="why-routed-models-show-up"></a>

## Por qué aparecen los modelos enrutados

El selector de modelos de Codex espera entradas de catálogo en forma de Codex. opencodex construye entradas enrutadas mediante clonación una plantilla de modelo nativo Codex, y luego reemplazar la identidad del modelo enrutado:

```text
slug = "anthropic/claude-sonnet-..."
display_name = "anthropic/claude-sonnet-..."
visibility = "list"
```

El clon mantiene campos de análisis estrictos, como niveles de razonamiento, tipo de shell, indicadores de soporte API, y instrucciones básicas. opencodex luego elimina las capacidades solo nativas que la ruta no puede cumplir, incluyendo metadatos de nivel de servicio OpenAI.

<a id="current-stable-model-coverage"></a>

## Cobertura actual del modelo estable

El conjunto de reserva nativo incluye `gpt-5.5` y GPT-5.6 Sol / Terra / Luna. Para la familia GPT-5.5, conserva opencodex las entradas en vivo más ricas del catálogo Codex instalado y solo sintetiza una entrada faltante. El paquete upstream snapshot se utiliza solo para GPT-5.6, donde proporciona la identidad real por modelo y metadata en lugar de una aproximación de plantilla anterior.

| Ruta | Identificadores de selección y metadatos de catálogo |
| --- | --- |
| Inicio de sesión Codex (filas calificadas por cuenta deshabilitadas) | Desnudos ids nativos como `gpt-5.6-sol`, `gpt-5.6-terra`, y `gpt-5.6-luna`; Pool o Direct se selecciona a través `codexAccountMode`. Las filas GPT-5.6 usan una ventana de catálogo 922,000-token. |
| Inicio de sesión Codex (filas calificadas para la cuenta habilitadas con selectores elegibles) | Uno `<selector>/<native-openai-model>` fila por selector elegible y modelo nativo compatible; cada fila utiliza solo su cuenta asignada, y las filas nativas desnudas están ocultas para el selector. Se conservan los metadatos nativos y las ventanas de contexto. |
| Inicio de sesión Codex (fila directa explícita de Daybreak) | `openai/gpt-daybreak-blue-latest` sólo cuando la exacta `customModels` La fila está configurada en el canónico `openai` proveedor. Mantiene la identidad de cable Daybreak y utiliza la instantánea de capacidad Sol fijada (922,000 contexto; 829.800 compactación automática). |
| OpenAI (llave API) | Exactamente diez filas de nombres: `gpt-5.5`, `gpt-5.6`Sol/Terra/Luna, los tres `*-pro` id virtuales, y los dos alias Daybreak (1.050.000 contextos; 922.000 entradas máximas para todos los diez) |
| OpenRouter | `openrouter/openai/gpt-5.6-sol`, `openrouter/openai/gpt-5.6-terra`, `openrouter/openai/gpt-5.6-luna` (922,000) |
| Cursor | El fallback incluye `cursor/gpt-5.6-sol`, `cursor/gpt-5.6-terra`, y `cursor/gpt-5.6-luna` (1,000,000), más filas regulares/rápidas para Grok 4.5, 4.6 y 4.7 (500,000); 4.6 y 4.7 añadir `xhigh`, y el descubrimiento de cuenta real decide qué filas permanecen visibles. |
| xAI | El descubrimiento en vivo es autoritario. El catálogo incluye `xai/grok-4.6` y `xai/grok-4.7` y por defecto `xai/grok-4.5`; los tres tienen 500,000-token ventanas. Grok 4.6 y 4.7 exponer `low` / `medium` / `high` / `xhigh` (por defecto: `high`), mientras que Grok 4.5 se detiene en `high`. |

Las entradas GPT-5.6 fijas conservan la escalera ascendente exacta. Sol y Terra exponen `low` a través
`ultra`; Luna se detiene en `max`. Sol por defecto a `low`, mientras que Terra y Luna `medium`. La fila explícita Codex-forward Daybreak Blue hereda la escalera de Sol y el valor predeterminado sin cambiar su identidad cableada.
`ultra` es una opción orientada al cliente para el razonamiento máximo más delegación proactiva y llega a la backend como `max`. Una entrada de selector solo significa que el catálogo está listo: la cuenta conectada o la clave API debe seguir teniendo derecho a utilizar ese modelo.

<a id="native-and-routed-model-toggles"></a>

## Conmutadores de modelo nativo y enrutado

La página de Modelos del panel expone `disabledModels` cambia para los ids nativos desnudos y enrutado
`provider/model` Ids. Cuenta-calificada `<selector>/<native-openai-model>` Los ID también son apoyados por
`disabledModels`, pero el panel de control no lista ni cambia esas filas de selectores exactas; agréguelas a Configuración manual:

- Los identificadores de ruta son namespaced (`provider/model`) Deshabilitar uno lo excluye del catálogo sincronizado y `/v1/models`.
- Uso de ID nativos calificados para la cuenta `<selector>/<native-openai-model>`. Agregando uno a
  `disabledModels` solo oculta esa fila selectora.
- Los ID nativos de GPT son babosas desnudas. Deshabilitar uno mantiene su entrada de catálogo pero cambia `visibility` a
  `hide`En el que se ocultan la verdad y todo lo oculto. clon calificado por el selector para ese modelo a partir del descubrimiento.
- Con al menos un combo de alias nativo configurado, las filas nativas desnudas deshabilitadas se omiten en lugar de mantenido oculto porque las versiones de escritorio afectadas ignoran la bandera oculta. Una babosa nativa desnuda sombreado por un alias nativo también se omite de la página Modelos, por lo que no tiene ningún conmutador nativo allí; solo las filas nativas no sombreadas permanecen conmutables. Sync restaura metadatos nativos prístinos cuando un La fila desactivada no sombreada está habilitada de nuevo.
- Las filas nativas no sombreadas provienen del conjunto estático admitido, por lo que un modelo no sombreado desactivado permanece visible en el panel de control y se puede volver a encender.

El pase de visibilidad se ejecuta después de las actualizaciones de instantáneas, y la administración API actualiza el catálogo y fuerza el modelo de caché rancio de Codex después de un cambio.

<a id="multi-agent-surface-mode"></a>

## Modo de superficie multiagente

El control Models-page v1/base/v2 cambia qué superficie de colaboración Codex usa cada entrada del selector; ver [Interfaz de subagentes](/es/guides/sub-agent-surface/) para el modo canónico, delegación, herencia, fallback, y comportamiento de tareas encriptadas.

<a id="reasoning-top-tiers"></a>

## Razonamiento de los niveles superiores

La visibilidad del nivel de razonamiento es independiente del modo de superficie v1/base/v2. Razonamiento generado-capaz Entradas anunciar `max` así que el esfuerzo directo del sub-agente valida; actual generado enrutado entradas y más viejo nativo GPT entradas también anunciar `ultra`. Las escaleras GPT-5.6 son preservado, por lo que Luna ha `max` pero no `ultra`.

En el cable, los adaptadores enrutados mapean o sujetan niveles no compatibles. Para los modelos nativos más antiguos, cuyo verdadero La escalera se detiene en `xhigh`, `nativeEffortClamp` Mapas a directo `max` o un `ultra` selección a `xhigh`
(por ejemplo, GPT-5.5). Sol, Terra y Luna tienen un verdadero `max` peldaño.

La publicidad del catálogo de los dos niveles superiores es incondicional: `ocx sync` ya no elimina `max` o
`ultra` Cuando el instalado Codex binario es demasiado viejo para ofrecerlos — Codex Otros peldaños todavía se cruzan con la escalera de entorno de ejecución observada, y un diagnóstico de pinza registrado por un binario anterior deja de aplicarse una vez que el binario en ese camino informa de una versión diferente (el caso de actualización en el lugar), por lo que `ocx status` y `ocx doctor` stop advertising sobre una abrazadera el actualizado El entorno de ejecución ya no es necesario. La visibilidad del catálogo no es un derecho: la publicidad `max`/`ultra` No garantiza el upstream cuenta o proveedor acepta el nivel, y para los modelos nativos más antiguos cuya escalera real se detiene en
`xhigh` la abrazadera de alambre anterior todavía mapea la selección hacia abajo en el momento de la solicitud.

<a id="fast-tier-rules"></a>

## Reglas de nivel rápido

Codex almacena el modo rápido como:

```toml
service_tier = "fast"

[features]
fast_mode = true
```

Pero el catálogo de modelos y la solicitud en entorno de ejecución usan el ID de nivel `priority`. opencodex conserva esa división. Los modelos de paso nativo OpenAI mantienen un soporte rápido; los proveedores enrutados tienen capacidad de —
`service_tier` se elimina solo cuando el proveedor declara `supportsServiceTier: false` (El Registro clasifica la OpenAI canónica como `true`, DeepSeek y Volcengine Ark como `false`), mientras que sin clasificar Las puertas de enlace personalizadas mantienen intactos los valores suministrados por el llamante y nunca reciben una inyección. Una puerta de enlace personalizada puede optar globalmente con `supportsServiceTier: true`o estrechamente con
`modelSupportsServiceTier: { "verified-model": true }`; un exacto `false` estrecha un proveedor por defecto de `true`Mientras que a nivel de proveedor `false` Sigue siendo cerrado. El mismo modelo/adaptador final la decisión controla tanto los metadatos del catálogo como la inyección en entorno de ejecución, por lo que la opción rápida nunca es Anunciado donde no puede ser honrado. Un `openai-chat` destino puede autorizar todo lo contrario modelo elegible con `chatServiceTier: true`, o autorizar solo modelos exactos con
`modelSupportsServiceTier`; Las rutas Responses no necesitan esa autorización de cable de chat adicional.

<a id="selecting-ultra-fast-in-codex-desktop"></a>

### Selección ultra rápida en el escritorio Codex

Para un proveedor que apoya `service_tier: "ultrafast"`, declara que el mapeo de cables una vez. opencodex luego publica **Ultra rápido** en el menú de velocidad Codex nativo del modelo encaminado; No hay necesidad de editar `opencodex-catalog.json` Después de cada sincronización. Por ejemplo, fusione estos campos en un proveedor API configurado para GPT-6.1 Sol:

```json
{
  "models": ["gpt-6.1-sol"],
  "modelSupportsServiceTier": { "gpt-6.1-sol": true },
  "fastWire": {
    "kind": "service-tier",
    "canonicalToWire": { "priority": "priority", "ultrafast": "ultrafast" },
    "foreignCallerTiers": "verbatim"
  }
}
```

La asignación se aplica a todos los modelos Fast-elegibles en ese proveedor. Utilice un proveedor separado entrada si solo algunos de sus modelos son compatibles con Ultra Fast. Mantener el modo Rápido de opencodex activado **Automático**
(omitir `fastMode`) para que la selección de velocidad de la aplicación llegue al proveedor; forzado
`priority`, y forzado por defecto cae el nivel. Actualizar el catálogo de modelos, reiniciar Codex Escritorio si todavía tiene la lista anterior, seleccione el modelo enrutado y luego elija **Ultra rápido**
en su menú de velocidad. El estándar sigue siendo el valor predeterminado.

Sólo un elegible `service-tier` cable con un explícito `ultrafast → ultrafast` Mapeo agrega esta opción a filas enrutadas; soporte rápido ordinario o un nombre similar a GPT es insuficiente. Esa asignación enrutada no se aplica a filas nativas/de cuenta o alias combinados. Eliminando el asignación o desactivación del soporte de nivel de servicio de ese modelo elimina la opción enrutada generada desde el catálogo y la caché en la siguiente sincronización exitosa. La declaración activa también controla la opción Ultra Fast cuando Codex carga su lista de modelos a través de HTTP.

Para filas enrutadas, `ultraFastTier` mantiene los niveles Ultra Fast suministrados de forma independiente desde el misma fila persistente exacta; los niveles enrutados generados no se tratan como suministrados por el operador. Para los nativos desnudos `gpt-6-astra` / `gpt-6.1-sol` sus filas y sus clones de confianza, habilitación `ultraFastTier` también genera una opción ultrarrápida que falta sin cambiar el Nivel por defecto nativo. Deshabilitarlo retira solo los metadatos de nivel nativo rastreados según se generan; Se conservan los descriptores de nivel nativos suministrados o editados independientemente.

[OpenAI's API guía](https://developers.openai.com/api/docs/guides/ultrafast-mode) documentos Ultrarrápido para GPT-6 Astra y GPT-6.1 Sol. API acceso y
[Acceso al plan/espacio de trabajo Codex](https://learn.chatgpt.com/docs/agent-configuration/speed)
están separados. La elección del menú no otorga acceso al proveedor ni garantiza la velocidad medida; Ultra Fast aumenta el uso / costo, y los propios requisitos de características de Codex aún se aplican.

<a id="subagent-selection"></a>

## Selección de subagentes

Codex ordena las entradas del catálogo visible por ascendente `priority` y anuncia los primeros cinco como
`spawn_agent` modelo anula. La página de subagentes del panel de control puede seleccionar y guardar hasta cinco id nativos o enrutados `provider/model` Ids. Configurado manualmente `subagentModels` También acepta cuenta-calificada `<selector>/<native-openai-model>` ID, pero el panel de control no ofrece ID exactos; guardar la página reemplaza la lista con opciones visibles en el panel de control. opencodex asigna bajo prioridades del catálogo en el orden seleccionado; cuando se habilitan las filas de selectores calificados para la cuenta, selecciones nativas básicas expandirse en grupos selectores calificados. Otros modelos siguen siendo invocables por id exacto.

La lista de modelos destacados está separada de la lista del Dashboard. **Delegación de subagentes** selección. Lo controles que anula Codex ofrece primero; no selecciona un modelo o designe delegación por sí mismo.

<a id="desktop-remote-servers"></a>

## Servidores remotos de escritorio

Codex El modo de servidor remoto del escritorio filtra el selector contra el propio cliente
`available_models` allowlist (activo cuando el control remoto `use_hidden_models` El ajuste está activado). Encaminado Las entradas del catálogo todavía se cargan y sirven - `model/list` devuelve y el CLI incluido lee - pero el renderizador de escritorio deja caer cualquier cosa que no esté en esa lista de permisos solo nativa antes renderizado. opencodex no tiene ningún gancho en esa lista; el error de flujo ascendente se rastrea en
[openai/códex : 19694](https://github.com/openai/codex/issues/19694).

Until Desktop expone un control para la lista de permisos:

- Establecer el modelo directamente en `~/.codex/config.toml` en la máquina remota, por ejemplo
  `model = "input/grok-4.5"`. El selector puede mostrar `Custom`, pero las solicitudes siguen utilizando el modelo encaminado.
- Utilice Codex CLI o TUI en lugar del selector de escritorio; no aplican la lista de permisos y la lista modelos normales.

<a id="refreshing-model-state"></a>

## Estado del modelo refrescante

Si el selector sigue mostrando entradas obsoletas, actualice el catálogo y reinicie la superficie Codex de destino:

```bash
ocx sync
```

opencodex reescribe `models_cache.json` con un envoltorio de caché deliberadamente rancio cada vez que catálogo visibilidad, prioridad o cambios de metadatos, por lo que la próxima actualización del modelo Codex lee el nuevo catálogo.

Después de escribir un catálogo o modelo-caché, OpenCodex invalida su observación del servidor de aplicaciones en caché para que la siguiente solicitud verifique la frescura del proceso nuevamente. Una sincronización de configuración también invalida la observación cuando el contenido del catálogo no cambia. Esta actualización no reinicia los procesos Codex.
