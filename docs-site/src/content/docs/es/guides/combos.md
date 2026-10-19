---
title: "Combos: conmutación por error y equilibrio de carga"
description: "Enruta un modelo virtual a varios proveedores, con respaldo ante fallos o reparto ponderado de carga."
---

Un **combo** es un modelo virtual que muestra una lista ordenada de objetivos reales de proveedor/modelo. Su cliente solicita `combo/<id>`; opencodex elige un objetivo, reescribe la solicitud a ese concreto `provider/model` y puede probar otro objetivo cuando el primero tiene un fallo reintentable.

Esto es útil cuando usted quiere:

- **Failover:** prefiere un modelo, pero mantenga las copias de seguridad listas.
- **Equilibrio de carga:** difunde solicitudes exitosas entre modelos o proveedores en lotes ponderados.

Los combos se sientan frente al enrutamiento normal del proveedor. Lea primero [Enrutamiento de modelo](/es/guides/model-routing/) si los selectores `provider/model` son nuevos para usted.

<a id="metered-fallback-consent"></a>

## Consentimiento de fallback medido

Marque un objetivo combinado de pago por uso con `"metered": true` cuando siga los objetivos de suscripción. El consentimiento omitido o falso niega el envío medido. Elija el consentimiento para su implementación:

- **Local Claude Code o Codex:** en un proxy solo loopback, establezca `"allowMeteredTargets": true` en el combo o ejecute `ocx combo set <id> --allow-metered-targets on`. Esto permite explícitamente a las personas que llaman locales usar sus objetivos marcados. El valor predeterminado es falso; `off` borra el consentimiento. La autenticación de loopback no lee las claves API.
- **Llamadas en red o vinculadas:** la entrada `apiKeys[]` configurada por el llamante debe tener `"allowMeteredComboTargets": true`. Un proxy con un oyente que no es loopback ignora la bandera combinada, incluso en su oyente de loopback secundario. Las personas que llaman vinculadas también retienen su requisito de consentimiento de clave configurada cuando el oyente principal es loopback. El token de entorno nunca califica.

Los encabezados de solicitud no pueden otorgar consentimiento. Los alcances de modelo/proveedor todavía se aplican. Esto cubre la selección inicial, la conmutación por error y la recuperación a través de estrategias combinadas, compactación, Messages, Chat Completions y WebSocket, y un modelo de subagente alternativo que nombra un alias combinado. Una reserva colapsada intenta un objetivo no medido utilizable antes de rechazarlo. Los objetivos no marcados conservan el comportamiento existente; el operador declara la medición en lugar de detectarla automáticamente.

Por ejemplo, una cadena de conmutación por error puede Anthropic OAuthEntonces, CursorEntonces, `{ "provider": "anthropic-apikey", "model": "claude-opus-5-5", "metered": true }`. Sin consentimiento, el agotamiento devuelve el último error no medido, con una excepción: un rechazo de cuota anterior 429 o 402 tiene prioridad sobre un 400, 401 o 403 posterior. Si el destino de la suscripción devuelve 429 y Cursor se niega con 401 o 403, la persona que llama recibe el 429 de la suscripción, porque la suscripción gastada explica el fallo y el rechazo de credenciales de Cursor no lo hace. El panel de control guarda la medición de destino omitida y el consentimiento combinado; si se establece explícitamente en false, se borra. Estos campos de consentimiento se configuran a través del archivo de configuración o API; el indicador combinado también está disponible a través del CLI, mientras que el panel de control no lo expone.

<a id="60-second-quickstart"></a>

## 60 segundos de inicio rápido

Este ejemplo crea `combo/main` con Anthropic primero y OpenAI segundo. Ambos proveedores ya deben existir y estar habilitados.

```bash
ocx combo set main --targets anthropic/claude-opus-4-8,openai/gpt-5.6-sol
```

La estrategia predeterminada es la conmutación por error, por lo que una solicitud normal va a `anthropic/claude-opus-4-8`. Si ese intento tiene un fallo reintentable, opencodex puede saltar a `openai/gpt-5.6-sol`.

Utilice el modelo virtual en cualquier lugar donde normalmente proporcione un ID de modelo:

```json
{
  "model": "combo/main",
  "input": "Explain why the sky looks blue."
}
```

Confirme la definición guardada:

```bash
ocx combo show main
```

:::tip
Comience con conmutación por error y pesos iguales. Cambie a round-robin solo cuando desee intencionalmente distribuir tráfico y añadir ponderaciones solo cuando no sea apropiada una distribución igual.
:::

<a id="how-combo-names-work"></a>

## Cómo funcionan los nombres combinados

La identificación combinada en `ocx combo set <id>` debe comenzar con una letra o número. Puede contener letras, números, `.`, `_` o `-`, hasta 64 caracteres en total. Su modelo canónico id es siempre `combo/<id>`; por ejemplo, id `main` se convierte en `combo/main`.

El espacio de nombres `combo/` está reservado mientras se configuran los combos. Un proveedor llamado `combo` no puede ocuparlo, y un identificador combinado no puede duplicar un nombre de proveedor configurado.

Un alias opcional le da al combo un nombre de modelo público diferente. Un alias:

- utiliza los mismos caracteres que un id;
- puede estar desnudo, como `daily-fast`, o contener un `/`, como `team/daily-fast`;
- no puede ser `combo` o empezar con `combo/`;
- no puede duplicar otro alias combinado; y
- Normalmente no puede ser un nombre de familia OpenAI nativo desnudo que comienza con `gpt-`, `o1-`, `o3-`, `o4-` o `codex-`. El modo de compatibilidad de escritorio explícito a continuación es la única excepción.

Incluso cuando se establece un alias, el formulario canónico `combo/<id>` todavía se resuelve. La búsqueda canónica se ejecuta antes de la coincidencia de alias, por lo que un alias no puede hacerse cargo del id canónico de otro combo.

:::note
Los alias cambian la solicitud de nombre público de los clientes; no cambian el id almacenado del combo ni el proveedor de concreto/selectores de modelos detrás de él.
:::

<a id="compaction-after-switching-combos"></a>

## Compactación después de cambiar los combos

Cuando un cliente compacta usando un nombre de modelo desnudo después de cambiar combos, opencodex puede recordar el combo que se completó con éxito más recientemente en ese carril de conversación. El modelo debe coincidir con la respuesta completada, y el combo y su objetivo aún deben existir en la configuración actual. La solicitud sigue entonces la selección combo normal y la conmutación por error.

Los selectores explícitos de proveedor/combo y los alias combinados configurados tienen prioridad sobre esta recuperación. Las respuestas fallidas, incompletas o canceladas no reemplazan la última selección exitosa. El retiro es proceso-local y limitado a 256 conversaciones durante 30 minutos, y a 1 KiB por nombre de modelo recordado y 64 KiB en total; las entradas caducadas también se limpian en segundo plano. Una respuesta cuyo nombre de modelo es demasiado grande para retener deja intacta la selección anterior en lugar de borrarla. Recall no almacena credenciales de cuenta. Sin identidad de conversación utilizable o estado válido recordado, se aplica el enrutamiento de compactación normal. Un reinicio despeja el estado recordado.

<a id="codex-desktop-native-allowlist-compatibility"></a>

## Codex Compatibilidad con la lista de permisos nativa del escritorio

Algunas versiones de escritorio Codex aplican una lista de permisos remota nativa `available_models` después de que el servidor de aplicaciones ya haya cargado `model_catalog_json`. Los identificadores encaminados normales tales como `Nova1/codex-gpt-5.6-sol` son entonces utilizables por el CLI pero ausentes del selector de escritorio. Este es el [Codex Error de escritorio](https://github.com/openai/codex/issues/19694) aguas arriba rastreado por [opencodex #241](https://github.com/lidge-jun/opencodex/issues/241).

Cuando controlas un destino enrutado equivalente, un combo puede hacerse cargo explícitamente de una babosa nativa:

```bash
ocx combo set nova-sol \
  --targets Nova1/codex/gpt-5.6-sol \
  --alias gpt-5.6-sol \
  --native-alias \
  --display-name 'Nova1 - codex-gpt-5.6-sol'
```

Este modo es deliberadamente opt-in y requiere tanto `--native-alias` como una etiqueta de visualización no vacía. El alias debe ser uno de los identificadores de modelo nativos soportados por esta versión opencodex; no se acepta un prefijo de familia nativa solo porque la eliminación debe ser capaz de restaurar metadatos autorizados. Cuando la respuesta de descubrimiento del destino enrutado suministra solo un id de modelo, la fila de compatibilidad rellena los metadatos de contexto, modalidad y razonamiento faltantes del id nativo que reemplaza. Los límites explícitos de objetivos aún ganan, por lo que esta alternativa nunca plantea un límite de contexto o anula las capacidades declaradas. Cambia la precedencia exacta de enrutamiento: las solicitudes para `gpt-5.6-sol` se resuelven a `combo/nova-sol` antes de la ruta canónica de la familia nativa OpenAI. El catálogo contiene una fila desnuda con la etiqueta de visualización configurada, no filas nativas y combinadas duplicadas. Sólo la babosa `gpt-5.6-sol` desnuda es capturada. Las filas calificadas por cuenta, como `main/gpt-5.6-sol`, y las filas calificadas por proveedor, como `openai-apikey/gpt-5.6-sol`, siguen siendo rutas OpenAI distintas; la ruta API calificada por proveedor nunca llega al alias nativo.

Las claves de visibilidad permanecen inequívocas:

- `combo/nova-sol` oculta el combo de compatibilidad del descubrimiento.
- La entrada desnuda `gpt-5.6-sol` en `disabledModels` continúa significando la fila nativa latente OpenAI; no oculta el combo que actualmente posee esa babosa pública.
- Mientras se configura al menos un alias nativo, las filas desnudas nativas deshabilitadas se omiten del catálogo efectivo Codex en lugar de conservarse como `visibility: "hide"`. Esto evita que la lista de permisos de Desktop resucite filas que no debería mostrar. La página Modelos todavía enumera los switches nativos no sombreados, y al volver a habilitar uno se restauran sus metadatos nativos conservados o actuales.

:::caution
Un alias nativo se hace cargo intencionalmente de un ID de modelo de primera persona. Utilizarlo solo cuando el objetivo es operacionalmente equivalente y etiqueta la fila del selector honestamente. Eliminar el combo restaura la normalidad enrutado nativo e identidad de catálogo en la siguiente sincronización.
:::

<a id="choose-a-strategy"></a>

## Elige una estrategia

<a id="failover-ordered-primary-and-backups"></a>

### Conmutación por error: copias de seguridad y primarias ordenadas

`failover` selecciona el primer objetivo elegible en orden de configuración. Un objetivo es elegible cuando su proveedor existe, está habilitado, no se está enfriando y puede manejar cualquier restricción de solicitud especial. Los pesos y `stickyLimit` no afectan esta estrategia.

Dada esta orden:

1. `anthropic/claude-opus-4-8`
2. `openai/gpt-5.6-sol`
3. `google/gemini-3-pro`

cada solicitud comienza con Anthropic. Un fallo Anthropic reintentable mueve esa solicitud a OpenAI; un fallo OpenAI reintentable puede moverla a Google. Un error de terminal se detiene inmediatamente en lugar de intentar los objetivos restantes.

<a id="round-robin-smooth-weighted-batches"></a>

### Round-robin: lotes ponderados lisos

`round-robin` utiliza un round-robin suave y ponderado. Un peso objetivo más grande le da a ese objetivo una mayor participación a lo largo del tiempo sin enviar toda su participación como un bloque largo. `stickyLimit` controla cuántas solicitudes exitosas permanecen en el objetivo seleccionado antes de la siguiente selección ponderada.

Crear un combo 2:1 con lotes de dos solicitudes exitosas:

```bash
ocx combo set balanced \
  --targets anthropic/claude-opus-4-8:2,openai/gpt-5.6-sol:1 \
  --strategy round-robin \
  --sticky 2
```

Llamando a los objetivos **A** (peso 2) y **B** (peso 1), las primeras seis selecciones ponderadas son `A, B, A, A, B, A`. Debido a que `stickyLimit` es 2, cada selección permanece activa para dos solicitudes exitosas:

| Solicitud exitosa | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Objetivo | A | A | B | B | A | A | A | A | B | B | A | A |

La cuota a largo plazo sigue siendo 2:1. Un fallo reintentable finaliza el lote pegajoso actual, enfría ese destino y selecciona otro destino elegible para la misma solicitud.

:::caution
Los pesos son relativos, no porcentajes. Pesos `2,1` y `200,100` expresa la misma proporción. Prefiero Pequeños valores que comunican la intención.
:::

<a id="random-weighted-draw-per-request"></a>

### Aleatorio: sorteo ponderado por solicitud

`random` dibuja un objetivo elegible por solicitud, con probabilidades proporcionales a `weight`. Cada solicitud es un empate independiente, por lo que el tráfico se propaga a través de los objetivos sin el patrón determinista o la pegajosidad de round-robin. `stickyLimit` no afecta a esta estrategia.

<a id="least-used-favor-the-target-with-fewest-successes"></a>

### Menos utilizado: favorezca al objetivo con menos éxitos

`least-used` enruta cada solicitud al objetivo elegible con la menor cantidad de solicitudes exitosas registradas por este proceso opencodex. Cuentas comienzan a cero en el reinicio, y los lazos mantienen el orden de configuración. Los pesos y `stickyLimit` no afectan esta estrategia.

<a id="reset-window-follow-the-soonest-quota-reset"></a>

### Reset-window: siga el restablecimiento de cuota más rápido

`reset-window` enruta cada solicitud al destino elegible cuya instantánea de cuota de proveedor en caché muestra el próximo restablecimiento de ventana más rápido (cinco horas, semanal, mensual o personalizado). Esto pasa el proveedor que actualiza primero. Los objetivos sin datos de cuota frescos, y lazos, mantienen el orden de configuración. Los pesos y `stickyLimit` no afectan esta estrategia.

Esta clasificación y exclusión del proveedor antes del envío requieren nuevos límites de inferencia de modelo que se aplican a la clave API actual en su conjunto. OAuth /los resúmenes de cuentas actuales, las rutas de reenvío de llamadas, las claves múltiples y las instantáneas con credenciales o destinos modificados se muestran solo para esta decisión temprana. Lo mismo se aplica cuando las cabeceras `Authorization`, `x-api-key` o `x-goog-api-key` anulan las credenciales; se excluyen las ventanas de solo búsqueda y MCP. Si ningún objetivo elegible tiene un restablecimiento aplicable, el orden de configuración gana. La selección y los reintentos de la cuenta aún imponen sus límites normales.

<a id="advisory-quota-signals-for-jev"></a>

### Señales de cuota de asesoramiento para JEV

La evidencia de cuotas es por separado opt-in **por JEV Combo**, para los tres métodos de decisión:

```bash
ocx combo set coding --decision-quota-signals on --json
ocx combo set coding --decision-quota-tiers '{"moderate":40}' --json
```

Solo habilite esto en un Combo `strategy: "jev"` existente. `decisionQuotaSignals: true` agrega niveles de cuota de suscripción a la solicitud de decisión, no una regla de elegibilidad dura. Se le pide al backend de decisión que prefiera una cuota más saludable entre las opciones adecuadas; todavía elige solo entre los objetivos elegibles configurados y las listas de permisos de esfuerzo. Desconocido no se agota, y las opciones alternativas ordinarias, el tiempo de reutilización, la selección de cuentas y los límites del proveedor permanecen sin cambios.

Los valores predeterminados son `limited: 70` y `nearlyExhausted: 90`, porcentajes incluidos utilizados. No hay un nivel moderado a menos que lo establezca explícitamente (por ejemplo, `moderate: 40`). Las anulaciones parciales se fusionan con esos valores predeterminados, entonces todos los umbrales deben ser finitos, dentro de 0-100 y estrictamente ascendentes.

La evidencia solo proviene de instantáneas de memoria publicadas por recopiladores de cuotas existentes, encabezados de respuestas aceptadas y propietarios de credenciales/cuentas, y solo mientras al menos un JEV Combo tiene este interruptor activado: hasta entonces, opencodex no recopila nada para él, por lo que la evidencia comienza a acumularse (y se lee como desconocida) desde el momento en que lo habilita. La lectura de la evidencia de la cuota de asesoramiento nunca resuelve las credenciales, carga los almacenes de autenticación o los archivos de cuota, lee un llavero, sondea aguas arriba o inicia un repaso. La resolución normal de las credenciales de backend de decisión no cambia. Se desconocen las pruebas frías, desaparecidas, rancias (más de 30 minutos), futuras, inválidas o que hayan expirado. Cada cuenta utiliza su peor ventana válida relevante de cinco horas, semanal, mensual o estructuralmente. Un grupo de Anthropic / Codex habilitado usa su nivel de cuenta más saludable; lazos desconocidos saludables. Una piscina está casi agotada solo si cada cuenta utilizable ha conocido evidencia casi agotada. Los modelos de reserva sin barras atribuibles por separado siguen siendo desconocidos. Los resúmenes de cuentas activas, los informes de visualización de múltiples claves, los créditos y los medidores API /Spark / USD no son evidencia de cuotas para esta decisión. La cuenta separada Anthropic + Pool 2 (`anthropic2`) no es una fuente de esta evidencia, por lo que sus objetivos permanecen desconocidos.

:::caution[Datos adicionales para la decisión]
La opción de envío envía los niveles de cuota, y el porcentaje/ventana/reset de demora usado disponible, a su selección backend de decisión, incluyendo alojado TypeSafe. No hay ID de cuenta, tokens o huellas dactilares de credenciales son enviados o registrados por esta característica. Los registros de decisiones locales retienen solo los recuentos de niveles limitados y el nivel seleccionado. Si la cuota supera el límite de solicitud de 64 KiB, se elimina antes de volver a intentar serialización; una decisión ordinaria de gran tamaño todavía falla abierta.
:::

`--decision-quota-signals off` deshabilita la evidencia mientras conserva los niveles configurados; `-` despeja el interruptor. `--decision-quota-tiers -` borra anulaciones, restaurando valores predeterminados. API `null` borra; API `false` desactiva el interruptor. Los campos omitidos sobreviven a las actualizaciones de JEV, el reemplazo de objetivos y el cambio de nombre, incluidas las salvaciones a través del editor existente. Al cambiar de JEV se eliminan ambos ajustes de cuota. No se habilitan nuevos controles de editor ni el trabajo de cuota de fondo.

<a id="decision-method"></a>

### Método de decisión

`strategy: "jev"` solicita una decisión de fondo para elegir el primer objetivo elegible y un esfuerzo de razonamiento compatible para la solicitud actual. Es opt-in: crea un JEV Combo y selecciona ese Combo para usarlo. Agregar una credencial de decisión no cambia los modelos, alias o valores predeterminados existentes.

| Método | Selección combinada | Backend reportado en estadísticas |
| --- | --- | --- |
| TipoSeguridad (predeterminado) | Omita ambos selectores, o configure `decisionProvider: "jev"`. | `typesafe` |
| Servidor compatible con System One | Establecer `decisionProvider` en un identificador de fila configurado `jev-decision` distinto de `jev`. | `systemone` |
| Modelo opencodex | Establecer `decisionModel` a una ruta ordinaria opencodex, como `ollama/qwen3:4b`. | `model` |

`decisionProvider` y `decisionModel` son mutuamente excluyentes. El backend se deriva de esos campos; no hay ninguna configuración `backend` almacenada. Cada método utiliza el mismo objetivo elegible y la lista de permisos de esfuerzo, el estado de decisión limitado, el tiempo de espera, la cancelación y la política de apertura por error.

<a id="typesafe-default"></a>

#### TypeSafe por defecto

La configuración más rápida es:

1. Abra **Proveedores**, agregue **TipoJEV seguro**, ingrese la clave TypeSafe API y pruebe la conexión.
2. En la vista general de ese proveedor, elija **Crear JEV Auto**. También puede usar la misma acción en **Modelos → Combos**.
3. Revise los objetivos Astra → Sol → Luna precargados. Agregue, elimine, reordene o reemplace antes de crear el Combo. La primera fila actualmente elegible está marcada como el objetivo de apertura a prueba de fallos, y cada escalera de razonamiento conocida se muestra al lado de su fila.

La plantilla crea id y alias `jev-auto`, utiliza la capacidad de razonamiento adaptativo, y sigue siendo un combo editable ordinario. No se convierte en el modelo por defecto. Sus objetivos son la lista de permisos completa: JEV nunca puede seleccionar un par proveedor/modelo fuera de esa lista, y los modelos de destino originales permanecen disponibles en sus grupos de selectores normales.

Para la configuración sin cabeza, almacene la clave explícitamente o haga referencia a la variable de entorno TypeSafe:

```bash
ocx provider add jev --api-key "${TYPESAFE_API_KEY}"
```

Cuando el proveedor no tiene ninguna clave guardada, el cliente de decisión también acepta `TYPESAFE_API_KEY` directamente y el alias estándar derivado del proveedor `JEV_API_KEY` impreso por `ocx provider add`.

```json
{
  "providers": {
    "jev": {
      "adapter": "jev-decision",
      "baseUrl": "https://api.typesafe.ai/v1/systemone",
      "authMode": "key",
      "apiKey": "${TYPESAFE_API_KEY}",
      "liveModels": false
    }
  },
  "combos": {
    "jev-auto": {
      "alias": "jev-auto",
      "strategy": "jev",
      "reasoningEffortMode": "adaptive",
      "targets": [
        { "provider": "openai", "model": "gpt-6-astra" },
        { "provider": "openai", "model": "gpt-5.6-sol" },
        { "provider": "openai", "model": "gpt-5.6-luna" }
      ]
    }
  }
}
```

Con el método predeterminado, OpenCodex envía una solicitud de decisión limitada al punto final fijo `https://api.typesafe.ai/v1/systemone` con el modelo `jev-latest`. Solo se ofrecen objetivos configurados elegibles actualmente. JEV elige el objetivo y el esfuerzo juntos; el esfuerzo todavía está limitado por la escalera anunciada de ese objetivo. No se pregunta de nuevo al JEV si el objetivo seleccionado tiene un fallo reintentable: el tiempo de reutilización y el bucle de recuperación de Combo existentes continúan a través de los objetivos configurados restantes.

<a id="system-one-compatible-server"></a>

#### Servidor compatible con System One

Un JEV Combo puede solicitar un servidor alojado o autoalojado que implemente el contrato de cable de System One. Por ejemplo, un servidor Ollama con soporte System One puede servir `tev1` a `POST /v1/systemone` sin una clave API. Agregue una fila de proveedor con `adapter: "jev-decision"` cuyo `baseUrl` es el punto final de decisión **lleno**, luego nómbrelo en `decisionProvider` del Combo:

```json
{
  "providers": {
    "ollama-tev1": {
      "adapter": "jev-decision",
      "baseUrl": "http://127.0.0.1:11434/v1/systemone",
      "allowPrivateNetwork": true,
      "defaultModel": "tev1:4b",
      "liveModels": false
    }
  },
  "combos": {
    "jev-local": {
      "strategy": "jev",
      "decisionProvider": "ollama-tev1",
      "decisionTimeoutMs": 60000,
      "reasoningEffortMode": "adaptive",
      "targets": [
        { "provider": "openai", "model": "gpt-6-astra" },
        { "provider": "openai", "model": "gpt-5.6-sol" },
        { "provider": "openai", "model": "gpt-5.6-luna" }
      ]
    }
  }
}
```

- El `baseUrl` de la fila debe ser el punto final de decisión completo. Los servicios HTTPS pueden usar cualquier ruta, como `/v1/decisions`; los puntos finales simples HTTP aún deben terminar en `/systemone`. Userinfo, cadenas de consulta y fragmentos no se aceptan en las URL de decisión. El modelo de decisión es `defaultModel`, si no la primera entrada `models`; una fila con ninguno se trata como inutilizable y falla al abrirse sin una solicitud (`jev-latest` es el modelo de TypeSafe y nunca se envía a un host autoalojado). La fila es solo un servicio de decisión: nunca se publica como un modelo enrutable y no puede ser un objetivo Combo.
- Un loopback o punto final LAN necesita `allowPrivateNetwork: true` establecido explícitamente en esa fila. Utilice un bucle de retorno literal, RFC 1918, o dirección IPv6 ULA para el plano `http:`; cada dirección resuelta debe permanecer en el conjunto permitido y no se puede aplicar ningún proxy saliente (añada el host a `NO_PROXY`). Todos los demás destinos deben usar HTTPS. Las redirecciones aún no se abren.
- Solo se envía el propio `apiKey` de la fila, y solo cuando está establecido; una fila sin llave no envía la cabecera `Authorization`. Una fila cuyas referencias `apiKey` `${TYPESAFE_API_KEY}` / `${JEV_API_KEY}` u otra entrada de llavero del proveedor se rechazan como inutilizables, por lo que `TYPESAFE_API_KEY`, `JEV_API_KEY` y la clave de la fila `jev` nunca se envían a un punto final autoalojado. El identificador `jev` en sí (explícito u omitido) siempre significa el punto final TypeSafe con el modelo `jev-latest`.
- Los servicios autoalojados reciben cada opción de destino/esfuerzo como una cadena de descripción simple (por ejemplo, `Target openai/gpt-5.6-sol (provider openai, model gpt-5.6-sol) with low reasoning
  effort.`), porque Ollama solo acepta descripciones de cadena o de opciones `null`. TypeSafe sigue recibiendo los objetos de opción estructurados.
- OpenCodex ofrece 2-26 opciones para una fila compatible con System One. Cada objetivo contribuye con una opción por esfuerzo de razonamiento ofrecido; use `reasoningEfforts` por objetivo para recortarlos. Menos de 2 o más de 26 opciones no se abren sin una solicitud.
- Una carga de modelo en frío puede tardar decenas de segundos, y una solicitud de decisión abortada hace que Ollama abandone la carga. Precalentar el modelo y mantenerlo residente (`OLLAMA_KEEP_ALIVE=-1` o `keep_alive`), y subir `decisionTimeoutMs` (1000-120000 ms, por defecto 4000) cuando el servicio es más lento que cuatro segundos. Cada tiempo de espera o error aún no se abre al primer objetivo elegible.

El **Conexión de prueba** del proveedor envía una decisión de sondeo limitada a su punto final. **Crear JEV Auto** en un proveedor de System One (incluidas las filas sin llave) rellena previamente esa fila como proveedor de decisiones. Las filas deshabilitadas, las URL de decisión no válidas y las filas sin modelo se muestran con una razón y no se pueden seleccionar.

Para un servicio alojado alternativo con el mismo contrato de solicitud/respuesta de decisión, agregue una fila de proveedores separada y selecciónela con el `decisionProvider` del Combo:

```json
{
  "providers": {
    "alternative-decider": {
      "adapter": "jev-decision",
      "baseUrl": "https://decisions.example/v1/decisions",
      "apiKey": "${ALTERNATIVE_DECISION_KEY}",
      "defaultModel": "decision-model-v1",
      "liveModels": false
    }
  }
}
```

Establecer `decisionProvider: "alternative-decider"` en el JEV Combo existente. Su propia credencial y modelo acompañan el estado de decisión limitado; Las credenciales de entorno TypeSafe nunca se heredan. El id `jev` sigue siendo canónico. HTTPS / TLS, restricciones de destino de salida, rechazo de redirección, límites de solicitud / respuesta, tiempo de espera, cancelación y la lista de permisos de elección elegible aún se aplican.

[Laya MLX](https://github.com/mizorewww/laya-mlx) ejecuta decisiones escritas en Apple Silicon. Para usarlo con este método, expóngalo a través de un envoltorio compatible con System One HTTP, luego configure una fila como `ollama-tev1` anterior con el URL completo de `/systemone` del envoltorio y el identificador de modelo aceptado como `defaultModel`. El entorno de ejecución de Python MLX solo no es un punto final de decisión HTTP. Para una envoltura loopback HTTP, mantenga `allowPrivateNetwork: true` y utilice su dirección loopback literal.

Para un ejemplo alojado, un colaborador informó que el siguiente punto final de Zen System One funcionaba en [#6185](https://github.com/lidge-jun/opencodex/pull/6185). Configure manualmente como una fila ordinaria; esto no es un preajuste del registro OpenCodex o una garantía de disponibilidad actual:

```json
{
  "providers": {
    "zen-decision": {
      "adapter": "jev-decision",
      "baseUrl": "https://opencode.ai/zen/v1/systemone",
      "defaultModel": "jev-1.13-free",
      "apiKey": "${ZEN_DECISION_API_KEY}",
      "liveModels": false
    }
  },
  "combos": {
    "jev-zen": {
      "strategy": "jev",
      "decisionProvider": "zen-decision",
      "targets": [
        { "provider": "openai", "model": "gpt-6-astra" },
        { "provider": "openai", "model": "gpt-5.6-luna" }
      ]
    }
  }
}
```

Utilice la propia clave de ese punto final si se requiere autenticación; omita `apiKey` solo si el punto final acepta llamadas sin clave. Nunca reutilice `TYPESAFE_API_KEY` o `JEV_API_KEY` para ello.

<a id="opencodex-model"></a>

#### Modelo opencodex

Un chat ordinario o modelo Responses puede hacer la misma elección de enrutamiento sin implementar `/systemone`. Configure su proveedor de inferencias como de costumbre y configure `decisionModel` en su ruta:

```json
{
  "combos": {
    "jev-chat": {
      "strategy": "jev",
      "decisionModel": "ollama/qwen3:4b",
      "decisionTimeoutMs": 60000,
      "targets": [
        { "provider": "openai", "model": "gpt-6-astra" },
        { "provider": "openai", "model": "gpt-5.6-luna" }
      ]
    }
  }
}
```

Otros ejemplos son `deepseek/deepseek-v4-flash`, `openai/gpt-5.6-luna` o `opencode-zen/<model>` para un modelo de inferencia Zen configurado. Estas son cadenas de ruta ordinarias, no preajustes de servicio de decisión; el proveedor y el modelo deben estar disponibles en la instalación. Para `openai/gpt-5.6-luna`, configure las credenciales que puede usar la llamada interna, como un inicio de sesión de grupo Codex almacenado. Un inicio de sesión hacia adelante ChatGPT propiedad de la persona que llama es insuficiente.

El modelo recibe instrucciones fijas del router y un mensaje JSON:

```json
{
  "state": { "user_task": "Review the requested change" },
  "options": { "<key>": "Target description and allowed reasoning effort" }
}
```

`state` es la evidencia limitada que se describe a continuación; `options` mapas generaron claves de opción para descripciones simples. El contrato de respuesta es `{"choice":"<key>"}`, nombrando exactamente una opción ofrecida. Las instrucciones tratan el estado como evidencia, prefieren un menor uso de recursos entre las opciones adecuadas y solo requieren JSON. Una opción no válida o no listada, una respuesta malformada o una llamada fallida no se abre.

El turno de decisión interna lleva **ninguna credencial de llamada**, encabezados de llamadas, herramientas, historial de sesiones o conversaciones. Debe usar credenciales almacenadas para el proveedor seleccionado, o un proveedor local genuinamente sin llave como Ollama. Las configuraciones de solo autenticación de llamada, como Cursor sin una credencial almacenada o un inicio de sesión de reenvío ChatGPT propiedad de la persona que llama, no pueden servir como modelos de decisión y no se abren. Seleccionar una ruta no es prueba de que su credencial sea utilizable; pruébela antes de confiar en ella.

Un Combo no-JEV puede ser usado como `decisionModel`, pero la ruta de decisión no puede nombrar este Combo o cualquier Combo con `strategy: "jev"`. Esto se aplica a los selectores y alias canónicos `combo/<id>`, incluidos los selectores con variantes de esfuerzo o Fast. La validación de tiempo de ahorro rechaza la recursión y el entorno de ejecución también bloquea la reentrada de JEV defensivamente. El turno de decisión tiene su propio presupuesto de envío y arrendamiento de turno; no se registra como una solicitud separada, y el uso de la decisión informada pertenece al `jevDecision` de la solicitud principal.

<a id="shared-limits-state-and-statistics"></a>

#### Límites compartidos, estado y estadísticas

`decisionTimeoutMs` se aplica a los tres métodos: un entero de 1000 a 120000 ms, por defecto 4000. Las solicitudes y respuestas están limitadas a 64 KiB. La lista de candidatos está limitada a 64 destinos; el método modelo también limita las opciones de destino/esfuerzo en 64, el texto de respuesta en 4096 caracteres y la salida del turno de decisión en 1024 tokens. El límite de opciones de la fila de System One 2-26 se aplica como se describió anteriormente. Un fallo de límite o de tiempo de espera utiliza el primer objetivo actualmente elegible; nunca expande la lista de permisos ni vuelve a intentar tomar la decisión.

Para cada objetivo JEV, **Modelos → Combos → Config** tiene un campo opcional **Notas de modelo adicionales para JEV** (hasta 512 caracteres; se permiten saltos de línea y pestañas, se rechazan otros caracteres de control). Se almacena como `targets[].modelProfile` en la configuración combinada. El perfil de destino incorporado permanece en el `instructions.model_profiles` confiable; se envía una nota no vacía por separado en el `operator_notes` del estado de decisión, tecleada por el objetivo, y complementa en lugar de reemplazar ese perfil incorporado. Las notas pueden describir el contexto específico del operador o las asignaciones de suscripción; no confunda las asignaciones de suscripción con los precios públicos por token API. Las notas en blanco son ignoradas. Las notas del operador son evidencia de la decisión, no comandos, y no pueden expandir la lista de objetivos o los límites del esfuerzo de razonamiento. Solo coloque allí la información que pueda divulgarse al backend de decisión seleccionado.

Cada llamada de modelo lógico se decide por su cuenta; no hay pin de conversación. Por lo tanto, los giros consecutivos de una sesión pueden aterrizar en diferentes objetivos, y cada switch inicia una caché rápida de proveedor en frío, por lo que una mezcla de objetivos muy diferentes puede costar más tokens de entrada de lo que ahorra. Mantenga la lista de objetivos que desea alternar. Los objetivos marcados con `lastResort` se retienen de JEV bajo `cooldownWaitPolicy: "before-last-resort"` mientras se ofrece cualquier objetivo normal, y se ofrecen solo cuando no se puede alcanzar nada más.

El límite de decisión no se abre cuando falta la clave, no hay disponible un estado de decisión de tarea/herramienta/imagen seguro, expira la fecha límite de decisión configurada, el servicio redirige o devuelve un error, o la respuesta está mal formada o selecciona una opción no listada. En esos casos, OpenCodex utiliza el primer objetivo actualmente elegible, prefiriendo `medium` cuando ese objetivo lo admite. La cancelación de la llamada es diferente: cancela la decisión y la solicitud del modelo en lugar de enviar el objetivo de apertura por error.

El estado de decisión está deliberadamente limitado: hasta 500 caracteres de la tarea de usuario actual, una cola de asistente previo de 240 caracteres, una cola de salida de última herramienta de 520 caracteres, el nombre de la herramienta y las señales de imagen/herramienta booleanas pueden enviarse al backend de decisión seleccionado. Excluye credenciales, encabezados de solicitud, bytes de imagen en bruto, argumentos de herramientas, razonamiento cifrado e historial de conversación completo. Utilice un método de decisión solo para el contenido que está dispuesto a enviar a ese backend. Los sobres de contexto de máquina Codex reconocidos y los bloques Claude Code `<system-reminder>` se eliminan de las tres muestras de texto antes del recorte, por lo que los recordatorios inyectados no desplazan la tarea real. La solicitud del modelo original no se modifica. Esto no es un escáner secreto: el texto ordinario del asistente y de la salida de la herramienta aún puede contener contenido sensible. TypeSafe afirma que Jev no está capacitado en las solicitudes de los clientes, pero sus términos no establecen un período de retención fijo para el estado presentado y ofrecen cero retención de datos solo en los planes empresariales ([modelos](https://docs.typesafe.ai/models), [legal](https://docs.typesafe.ai/legal) ). TypeSafe también documenta el inglés como el idioma más preciso de Jev, así que revise las decisiones sobre el trabajo que no sea inglés antes de confiar en ellos. Los registros contienen solo el objetivo/esfuerzo seleccionado, una puerta de decisión aproximada, latencia, confianza/probabilidad opcional y uso numérico. Las pruebas automatizadas utilizan respuestas TypeSafe simuladas más un humo sin llave abierta; una decisión TypeSafe en vivo requiere una clave suministrada por el operador y no se ejecuta implícitamente.

El esfuerzo seleccionado de JEV se aplica al primer niño Responses y a los niños nativos de Chat en la ruta de inscripción `protocols.rollout.nativeChatCombos`. Reemplaza el esfuerzo del llamante y elimina los controles de pensamiento conflictivos y el llamante `service_tier`; una opción explícita sin esfuerzo elimina el esfuerzo incluso cuando el Combo tiene un valor predeterminado forzado. Los pines de esfuerzo del proveedor, las tapas y la normalización del cable aún se aplican después. Los registros de solicitud e intento muestran un esfuerzo aplicado diferente como `high->xhigh` o `high->low`, reteniendo ajustes posteriores como `high->xhigh->medium`. Un esfuerzo sin cambios o una elección sin esfuerzo mantiene la etiqueta existente. Más tarde, los objetivos alternativos utilizan la política Combo ordinaria de la solicitud original, sin otra llamada JEV.

Después de que el Combo haya servido las solicitudes, abra **Modelos → Combos → jev-auto → Estadísticas** para inspeccionar las selecciones de JEV sin reemplazar el selector de modelo normal o la página de uso. La pestaña separa los tokens de decisión informados en el backend de los tokens informados por los envíos de modelos físicos, y muestra las puertas de decisión, las selecciones abiertas, los esfuerzos de razonamiento, los reintentos / retrocesos, los tokens de caché, la latencia, la confianza y los totales por modelo durante 7 días, 30 días o todo el historial disponible. Las estadísticas provienen del libro de contabilidad de uso de solo anexar local; contienen los metadatos de decisión limitados descritos anteriormente, no las solicitudes o credenciales. Las filas de backend muestran el recuento de decisiones, el recuento aplicado y la latencia promedio para `typesafe`, `systemone` y `model`; los registros más antiguos sin backend se agrupan como `unknown`.

<a id="what-happens-when-a-target-fails"></a>

## Qué pasa cuando un objetivo falla

Los fallos combinados se dividen en **hop** fallos y **terminal** fallos.

| Resultado | Comportamiento |
| --- | --- |
| HTTP 401, 403, 404, 408, 429 o cualquier 5xx | Enfría el objetivo y salta al siguiente objetivo elegible. |
| HTTP 410 con un modelo explícito al final de su vida útil, retirado, obsoleto, puesta del sol, desmantelado o señal no disponible más tiempo | Enfriar ese objetivo y saltar. Las respuestas 410 no relacionadas siguen siendo terminales. |
| Autenticación clasificada, suscripción, cuota, límite de velocidad, sobrecarga o error del servidor ascendente | Enfríe el objetivo y salte, incluso cuando el estado por sí solo no sea suficiente. |
| Cancelación de clientes (499), `origin_rejected`, rechazo de ciberpolítica, desbordamiento de contexto u otra solicitud inválida | Detener y devolver el error; otro objetivo no haría que la solicitud fuera válida. |
| Exacta HTTP 400 diciendo que un modelo no es compatible cuando se utiliza Codex con una cuenta ChatGPT | Pruebe el siguiente objetivo declarado antes del compromiso de producción. El mensaje debe ser el rechazo completo en `detail`, `error.message`, o texto desnudo; competidor `detail` y `error` sobres estancia terminal. Esto no pone en cuarentena la cuenta ni enfría todos los modelos del proveedor. |
| Estructurado HTTP 400 rechazando `user` opcional, un esfuerzo de razonamiento no soportado, entrada de imagen con modelo o medios de entrada que la ruta no puede leer (`unsupported_input_modality`) | Salta antes del compromiso de salida sin enfriamiento; vea la compatibilidad de destino local de solicitud a continuación. |
| Primera llamada de herramienta de un giro Responses ejecutada por un adaptador en proceso ( `runTurn` ) que la solicitud actual no declaró, antes de cualquier efecto secundario de salida o reproducción insegura | Enfriar el objetivo y saltar con el mismo catálogo de herramientas. Después de una salida visible o un efecto secundario de repetición insegura, el rechazo es final. Chat Completions y Anthropic Messages solicitudes no han cambiado. |
| Cualquier otro error no clasificado | Detener y devolver el error. |

Si el presupuesto de envío de solicitud compartida rechaza el primer objetivo, el combo devuelve un 429 `request_send_budget_exhausted` local sin ponerse en contacto con un proveedor. Si rechaza un objetivo posterior, el combo devuelve el último error ascendente real sin enviarlo a ese objetivo.

Cuando `cooldownMs` está sin definir, un objetivo saltado utiliza un fallback ascendente: 5 segundos para la tasa de solicitud 429s con código ascendente `1302` o `1305`, 10 minutos para una ventana de uso de la cuenta gastada, y 60 segundos de lo contrario. Una ventana de uso es reconocida por el código ascendente (`usage_limit_exceeded`,
`usage_limit_reached`, `1308`o por la prosa `usage limit reached`, independientemente del estado HTTP — el backend ChatGPT Codex informa de una ventana gastada como 502 en lugar del 429 documentado. Credenciales y fallas de facturación que ya bloquean a todo el proveedor (`invalid_api_key`, `insufficient_quota`,
`payment_required`, y los otros códigos de alcance del proveedor) toman la misma espera de 10 minutos. Cuando se establece, `cooldownMs`
se aplica siempre que no se pueda utilizar de origen `Retry-After` o Codex señal de restablecimiento existe, incluidos los 429s. Numérico `Retry-After` segundos y se aceptan valores de fecha HTTP. Explícito Los retrasos en el servidor se limitan a 24 horas; los tiempos de reutilización derivados, configurados y de reserva se limitan 10 minutos. La precedencia es, de más fuerte a más débil, explícita.
`Retry-After` → Codex reseteo de cabeceras (`x-codex-primary-reset-at`, `x-codex-secondary-reset-at`, o
`x-codex-tertiary-reset-at`) → el combo de `cooldownMs` (cuando se establece) → el 10 minutos de espera para una ventana de uso gastado o un fallo de credencial / facturación → el retroceso de tasa de solicitud de 5 segundos para upstream códigos de límite de velocidad `1302`/`1305` → el valor predeterminado de 60 segundos. La retención de la ventana de uso se prueba primero, por lo que Fallo que lleva un código de tasa de solicitud *y* La prosa de límite de uso se mantiene durante diez minutos en lugar de diez minutos. cinco segundos. Una validez inmediata
`Retry-After: 0` sigue siendo una directiva ascendente inmediata en lugar de ser reemplazada por una Enfriamiento.

Para una piscina OAuth o Codex Anthropic, un 429 vinculado a una cuenta que la piscina se ha enfriado no enfría todo el objetivo combinado. Otras cuentas detrás de ese objetivo siguen disponibles. Un 429 sin una cuenta de piscina refrigerada identificada aún enfría el objetivo, al igual que los fallos de todo el proveedor.

<a id="last-resort-targets"></a>

### Objetivos de último recurso

Un breve tiempo de reutilización de un objetivo preferido se dirige directamente a lo que viene después en la lista, incluido un objetivo que solo quería usar en una emergencia. Márcalo y dile al combo que espere primero:

```json
{
  "strategy": "failover",
  "cooldownWaitPolicy": "before-last-resort",
  "waitForCooldownMs": 10000,
  "targets": [
    { "provider": "provider-a", "model": "model-a" },
    { "provider": "provider-b", "model": "model-b" },
    { "provider": "provider-c", "model": "model-c", "lastResort": true }
  ]
}
```

Con el conjunto de políticas, la selección prueba primero los objetivos normales. Si solo se están enfriando y el enfriamiento más temprano expira dentro de `waitForCooldownMs`, la solicitud espera eso en lugar de enviar el objetivo de último recurso. Ese aplazamiento no depende de la espera: un objetivo `lastResort` se salta siempre que cualquier objetivo normal esté disponible, para cada estrategia, y bajo `round-robin` o `random` no se une a la rotación en absoluto. `waitForCooldownMs` solo agrega la espera para un objetivo normal de enfriamiento, por lo que en el `0` predeterminado nada espera: el último recurso se usa tan pronto como no hay un objetivo normal disponible. Después de un intento fallido, la siguiente selección sigue la misma regla.

**La política sólo se aplaza.** Cuando no se puede alcanzar un objetivo normal - todos se enfrían más allá del presupuesto, ya se han intentado o se han descartado - el objetivo del último recurso se envía como de costumbre. Una política que podría retenerlo convertiría una repliegue en una interrupción, que es peor que el enrutamiento prematuro que previene. Lo mismo se aplica a un combo cuyos objetivos son *todos* marcado `lastResort`: se despacha normalmente.

`lastResort` es inerte a menos que se establezca `cooldownWaitPolicy`, y ambos se omiten por defecto, por lo que los combos existentes no se ven afectados. Solo la cadena exacta `before-last-resort` se admite.

La solicitud actual nunca vuelve a intentar el mismo objetivo, con una excepción: una combinación de un solo objetivo que establece `waitForCooldownMs` puede volver a intentar su único objetivo una vez que el tiempo de reutilización de ese objetivo expire dentro de la misma solicitud, ya que no hay alternativa para fallar. Los rechazos de compatibilidad local de solicitud aún regresan sin ningún reintento. Las solicitudes posteriores omiten un objetivo enfriado hasta que expire el tiempo de reutilización; los rechazos de compatibilidad local de la solicitud no enfrían el objetivo. Un `Retry-After` HTTP -fecha que ya está en el pasado también se conserva como una directiva inmediata aguas arriba, al igual que `Retry-After: 0`. Establezca `waitForCooldownMs` para permitir que una solicitud posterior espere el tiempo de reutilización del objetivo elegible más temprano, hasta ese límite en cada intento de selección, y luego haga una selección nueva. Por lo tanto, una solicitud puede esperar hasta `hops × waitForCooldownMs` a través de múltiples saltos de conmutación por error. El valor predeterminado es `0`, que falla al cerrarse inmediatamente con HTTP 503 cuando cada objetivo elegible se está enfriando; ese `combo_unavailable` 503 lleva un encabezado `Retry-After` igual al primer tiempo de reutilización restante, redondeado a segundos enteros con un mínimo de 1. Las esperas no son nerviosas, por lo que es posible realizar despertares sincronizados. Una solicitud abortada cancela esta espera y devuelve la respuesta normal `client_cancelled`; no envía un objetivo de copia de seguridad después de la cancelación. Un tiempo de reutilización de destino combinado es el estado por combo de proceso local y está separado del tiempo de reutilización de cuota de nivel de cuenta Codex utilizado por el enrutamiento de cuenta nativo.

:::note
La conmutación por error es intencionadamente limitada. Ayuda con la disponibilidad específica del objetivo, autenticación, cuota, y sobrecarga de fallos; no oculta errores de llamada o rechazos de políticas. En una solicitud Responses no combo, se reescribe una directiva xAI 403 permitida en HTTP 200.
`incomplete/content_filter` antes de que Codex lo vuelva a intentar como un fallo de transporte; véase
[Rechazos de política xAI](/es/reference/proxy-formats/#xai-policy-refusals). Combo hops todavía clasificar el HTTP 403 original como un salto.
:::

Para las solicitudes de transmisión, el estado ascendente HTTP no es la decisión final. OpenCodex almacena un prefijo de presalida limitado del Responses SSE del hijo seleccionado. Si el flujo informa de un terminal `response.failed` reintentable antes de cualquier texto, razonamiento, llamada de herramienta u otro evento de salida, el hijo se registra como fallido y el combo puede intentar su próximo objetivo elegible. Una salida cero `response.incomplete` sigue la misma ruta cuando su razón falta o es `adapter_eof`, `missing_terminal_event` o `upstream_stall_timeout`. Las razones semánticas explícitas como `max_output_tokens` y `content_filter` siguen siendo terminales, al igual que una razón explícita nula. También se mantiene una instantánea final sin razón que ya contiene elementos de salida. Una vez que comienza cualquier evento de salida, el destino se confirma: se devuelve un fallo de flujo posterior al cliente y nunca se reproduce en otro proveedor, lo que evita la ejecución duplicada de texto y herramientas. Si la memoria intermedia de pre-salida alcanza su límite de seguridad sin un terminal o límite de salida, OpenCodex también confirma el objetivo actual en lugar de aumentar la memoria sin un límite.

<a id="request-local-target-compatibility"></a>

## Compatibilidad con objetivos locales de solicitud

Al enrutar Claude Code al backend canónico ChatGPT Codex, OpenCodex elimina el campo de metadatos de nivel superior no compatible `user` sin cambiar la clave de sesión/caché, los mensajes de entrada, los esquemas de herramientas o los identificadores de seguridad. Las pasarelas públicas Responses API y las pasarelas directas no canónicas mantienen ese campo.

Un combo también puede avanzar después de un HTTP 400 `invalid_request_error` intacto que rechaza específicamente `user`, informa `unsupported_value` para `reasoning.effort` / `reasoning_effort`, o informa `param: input` con un rechazo `does not support image inputs` con alcance de modelo exacto. Una ruta que rechaza los medios de comunicación de la solicitud con el código `unsupported_input_modality`, como la entrada de imágenes enviada a una ruta del proveedor CLI sin un contrato multimodal verificado, avanza de la misma manera. Este es un desajuste para esa solicitud, no evidencia de que el objetivo no sea saludable, por lo que no registra ningún enfriamiento. Esta recuperación de compatibilidad no cambia silenciosamente `none` en un esfuerzo diferente ni amplía esta excepción a solicitudes arbitrarias no válidas. Las denegaciones de políticas, la cancelación y la producción ya comprometida siguen siendo no reproducibles. Una solicitud de un solo objetivo todavía devuelve un rechazo ascendente no resuelto.

<a id="tool-calls-stay-on-one-target"></a>

## Las llamadas de herramientas permanecen en un objetivo

Cuando un modelo le pide a su cliente que ejecute una herramienta, la solicitud que devuelve el resultado de la herramienta finaliza el mismo turno de asistente. OpenCodex envía esa solicitud al objetivo que emitió la llamada a la herramienta, siempre que el objetivo aún esté habilitado, aún en el combo y fuera del tiempo de reutilización. Esto se aplica a todas las estrategias, incluido JEV, que omite su decisión para esa solicitud. El siguiente mensaje de usuario elige un destino normalmente.

El seguimiento utiliza el hilo o el identificador de sesión del cliente, por lo que un cliente que no envía ninguno recibe una selección normal. Si el objetivo original no está disponible o falla, el combo falla como de costumbre, y el nuevo objetivo recibe las llamadas a la herramienta anterior de la forma que acepta. DeepSeek modelos de pensamiento obtienen un marcador de posición de razonamiento de un espacio para una llamada de herramienta que otro modelo emitió sin razonamiento. Gemini obtiene el marcador de posición de firma documentado de Google. Anthropic recibe una simple llamada de herramienta y resultado. Las versiones anteriores podían enviar DeepSeek una llamada de herramienta desnuda aquí y fallar con `The reasoning_text in the
thinking mode must be passed back to the API`.

<a id="default-reasoning-effort"></a>

## Esfuerzo de razonamiento por defecto

`defaultEffort` suministra un esfuerzo configurado cuando el objetivo seleccionado tiene una escalera soportada no vacía conocida. Con el valor predeterminado `defaultEffortMode: "fallback"`, un esfuerzo explícito de la persona que llama mantiene la precedencia. `defaultEffortMode: "force"` anula un esfuerzo de llamada válido con el valor predeterminado configurado; requiere un `defaultEffort` válido, no nulo y puede aumentar el costo y la latencia. El modo de fuerza es una elección explícita del operador a través de la configuración o administración combinada.

La escalera anunciada del objetivo sigue siendo autorizada. Se conserva un valor soportado exacto; de lo contrario, se selecciona el peldaño soportado más alto en o por debajo de él, o el peldaño soportado más bajo cuando ninguno es inferior. Las escaleras desconocidas o vacías nunca causan la inyección predeterminada. El modo de fuerza no repara el esfuerzo del llamador mal formado en una solicitud costosa válida. Otros campos de razonamiento, incluyendo `reasoning.summary`, se conservan.

`reasoningEffortMode` sigue siendo independiente de `defaultEffortMode`: las escaleras vacías explícitas eliminan los controles de esfuerzo / pensamiento no compatibles, y las escaleras adaptativas desconocidas también lo hacen, como se describe a continuación. Estrictas escaleras desconocidas preservan la petición de la persona que llama sin forzar un valor predeterminado. Los valores predeterminados admitidos son `low`, `medium`, `high`, `xhigh`, `max` y `ultra`; omita `defaultEffort` o configúrelo en `null` para deshabilitar la inyección predeterminada en modo de retroceso.

<a id="mixed-capability-groups-reasoningeffortmode"></a>

### Grupos de capacidades mixtas (`reasoningEffortMode`)

Los niveles de esfuerzo que anuncia un combo son la intersección de lo que anuncian sus objetivos. Un objetivo que anuncia explícitamente el control de esfuerzo **no** participa en esa intersección, por lo que una sola copia de seguridad sin esfuerzo vacía el selector de esfuerzo para todo el combo, incluso para los objetivos que admiten la sintonización.

Establecer `reasoningEffortMode: "adaptive"` para excluir esas escaleras vacías de la intersección publicada en su lugar. El selector muestra los niveles que comparten los objetivos restantes, y el objetivo sin esfuerzo sigue siendo elegible para el enrutamiento. Los objetivos cuya escalera es simplemente *Desconocido* se tratan como comodines en ambos modos.

```json
{
  "combos": {
    "mixed": {
      "targets": [
        { "provider": "openai-apikey", "model": "gpt-5.6-luna" },
        { "provider": "local", "model": "no-effort-model" }
      ],
      "reasoningEffortMode": "adaptive"
    }
  }
}
```

El valor predeterminado es `"strict"`, que mantiene el comportamiento original del selector. Esta configuración no cambia el orden de destino ni la política de conmutación por error. En el momento del despacho, una escalera de destino explícitamente vacía tiene sus controles de esfuerzo / pensamiento no soportados eliminados en cualquier modo mientras se conservan los campos de razonamiento sin esfuerzo soportados, como `reasoning.summary`; `"adaptive"` aplica la misma normalización a una capacidad de destino desconocida, mientras que los objetivos no vacíos conocidos mantienen su resolución de esfuerzo por objetivo existente. En el tablero de instrumentos se encuentra el interruptor **Escala de razonamiento adaptativo** en la sección Capacidades de un combo.

<a id="image--multimodal-capability"></a>

## Capacidad de imagen / multimodal

De forma predeterminada, un combo publica el **intersección** de las modalidades de entrada de sus objetivos (la imagen solo está habilitada cuando cada objetivo la anuncia). Establecer `imageInput: "disabled"` para forzar solo texto incluso cuando cada destino admite imágenes: el catálogo cae `image` desde `inputModalities`, y las solicitudes que llevan imágenes se rechazan con HTTP 400 antes de que se llame a cualquier destino. `"auto"` (u omitir el campo) mantiene la intersección automática.

En el panel de control, el interruptor **Imagen / multimodal** se puede habilitar siempre que cada objetivo tenga capacidades conocidas de entrada de imagen o texto. Los miembros de la imagen nativa permanecen sin cambios; los miembros de solo texto se declaran automáticamente solo texto en guardar (`modelCapabilities[model].inputModalities = ["text"]`), por lo que el [Visión Sidecar](/es/guides/sidecars/) describe sus imágenes. La sugerencia del switch nombra a los miembros que se inscribirán. Un miembro cuyas modalidades son desconocidas o no tienen entrada de texto (por ejemplo, un modelo de solo audio) no puede ser cubierto por el sidecar; mantiene el interruptor no disponible y se nombra en la sugerencia. Si el [Visión Sidecar](/es/guides/sidecars/) está deshabilitado globalmente, habilitar el interruptor muestra una advertencia que enlaza con el tablero: la inscripción aún se guarda, pero las imágenes se reemplazan con una nota de omisión y las solicitudes continúan sin descripciones de imágenes hasta que se vuelve a habilitar el sidecar. Desactivar el interruptor desactiva la entrada de imagen para el combo pero mantiene esas declaraciones del proveedor, y `PUT /api/combos` acepta la misma inscripción como una matriz opcional `visionSidecarTargets` de nivel superior de objetivos `{ provider, model }` exactos (solamente solicitud; nunca se almacena en el combo y se rechaza mientras `imageInput` es `"disabled"` cuando la lista de inscripción no está vacía). Las entradas que ya aceptan la entrada de imagen o se declaran sin texto se rechazan con HTTP 400 en lugar de sobrescribirlas, las entradas que el sidecar ya cubre se omiten y se rechaza un guardado antes de que la publicación restaure el combo y cada declaración juntos. Eliminar un miembro del combo no elimina su declaración de solo texto; límpialo en el editor del proveedor si ya no lo deseas.

<a id="encrypted-v2-sub-agent-tasks"></a>

## Tareas de subagentes encriptadas v2

Hay una limitación importante para los subagentes Codex v2 ([Número 92](https://github.com/lidge-jun/opencodex/issues/92)). Un padre nativo puede enviar la tarea de un trabajador recién generado solo como texto cifrado acuñado para el backend nativo ChatGPT. Un proveedor externo no puede leer esa carga útil.

Para tal solicitud, un combo filtra sus objetivos elegibles a rutas canónicas nativas ChatGPT, incluso después de un fallo reintentable. Si el combo no tiene un objetivo con capacidad de descifrado, opencodex se detiene antes del envío y devuelve HTTP 400:

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "unreadable_encrypted_agent_task"
  }
}
```

Esto protege la tarea de ser enviada a un proveedor que no recibiría instrucciones legibles. Las tareas de texto plano legibles utilizan la estrategia combo normal.

Tienes cuatro opciones de recuperación:

1. Seleccione un modelo nativo ChatGPT para el niño.
2. Agregue un objetivo canónico nativo ChatGPT al combo.
3. Utilice la superficie v1 para la delegación a través de diferentes proveedores.
4. Si controla al llamante, vuelva a enviar la tarea como contenido de texto sin formato v2 `agent_message`.

Consulte [Superficie del subagente](/es/guides/sub-agent-surface/) para ver los modos v1/base/v2 y el flujo de trabajo de tareas cifrado completo.

<a id="manage-combos"></a>

## Administrar combos

<a id="dashboard"></a>

### Panel

Abra el panel de control local y elija **Modelos → Combos**. El espacio de trabajo crea, edita, renombra y elimina combos. Sus selectores de modelos incluyen modelos ocultos: la visibilidad del catálogo solo controla las listas de modelos externos, no la selección Combo interna, y seleccionar un modelo oculto no lo hace visible externamente. El selector de destino aún excluye los proveedores deshabilitados, los combos anidados y el proveedor JEV solo para credenciales. **Crear JEV Auto** abre el mismo editor Combo con una plantilla de destino de decisión editable; en lugar de crear un duplicado se informa de un id o alias `jev-auto` existente. Un JEV Combo también muestra **Servicio de decisión** (TypeSafe JEV o un proveedor configurado `jev-decision`) y **Tiempo de espera de decisión (ms)**, y la vista general de Combos enumera cada servicio de decisión, punto final y tiempo de espera de JEV Combo.

Cada objetivo también muestra una insignia de cuota en vivo: **Disponible**, **Fuera de cuota** o **Cuota desconocida**. El editor bloquea Guardar y Crear para la cuota solo cuando cada destino utilizable tiene un límite de inferencia agotado confirmado por el servidor actual para su credencial configurada. La cuenta, el modelo, la búsqueda y la cuota MCP de solo visualización, o la evidencia de enrutamiento faltante o caducada, no causan este bloque. El bloqueo expira en el límite de reinicio o frescura aplicable y se vuelve a verificar cuando la página se vuelve activa o visible; Actualizar recarga tanto los datos combinados como la cuota. El editor del panel de control aún no expone `cooldownMs` o `waitForCooldownMs`; use el archivo de configuración o la administración API hasta que la interfaz de usuario de seguimiento termine.

### CLI

Los comandos principales son:

```bash
ocx combo list
ocx combo show <id>
ocx combo set <id> --targets provider/model[:weight],...
ocx combo remove <id> --yes
```

`set` también acepta `--strategy`, `--sticky`, `--effort`, `--alias`, `--native-alias`, `--allow-metered-targets on|off`, `--display-name`, `--description`, `--decision-provider`, `--decision-timeout` y `--rename-from`. Utilice `-` como el valor de `--effort`, `--alias`, `--display-name`, `--description`, `--decision-provider`, o `--decision-timeout` para borrar ese campo. Las dos banderas de decisión se aplican solo a `--strategy jev`. `--native-alias` requiere un alias de modelo nativo desnudo actualmente soportado y un nombre de visualización no vacío. `create` y `update` son alias para `set`; `delete` es un alias para `remove`; y los mismos subcomandos están disponibles bajo `ocx route combo`.

<a id="management-api"></a>

### API de administración

Los clientes sin cabeza usan `GET`, `PUT` y `DELETE` en `/api/combos`. `GET` enumera definiciones combinadas normalizadas, `PUT` crea o reemplaza una (y puede cambiar el nombre de una), y `DELETE` toma el parámetro de consulta id. Los detalles de autenticación y solicitud / respuesta se encuentran en el [Gestión API referencia](/es/reference/management-api/). Cuando un cuerpo `PUT` omite `cooldownMs` o `waitForCooldownMs`, el API conserva el valor ya almacenado para ese combo; envíe un valor explícito para cambiarlo. Un `cooldownMs` explícito (incluso `60000`) se persiste tal cual porque anula el retroceso de la tasa de solicitud. Un `cooldownMs` almacenado solo puede eliminarse editando el archivo de configuración; `waitForCooldownMs` se restablece a su valor predeterminado cuando un `PUT` envía explícitamente `0`, porque el serializador escaso omite ese valor predeterminado. Omission conserva ambos valores y el panel de control no los expone todavía. Omitir `defaultEffortMode`, `reasoningEffortMode`, `imageInput` o `cooldownWaitPolicy` también mantiene el valor almacenado. Para una solicitud que mantiene `strategy: "jev"`, el método de decisión se mantiene solo cuando se omiten tanto `decisionProvider` como `decisionModel`: el envío de cualquiera de los dos reemplaza el método almacenado, por lo que `decisionModel: null` sin `decisionProvider` selecciona TypeSafe. `decisionTimeoutMs` se mantiene por su cuenta cada vez que se omite. Una estrategia diferente deja caer los tres, y un objetivo reenviado sin `lastResort` mantiene la bandera de ese objetivo (igualada por proveedor y modelo). El tablero de instrumentos siempre envía `imageInput` y `reasoningEffortMode`, y para un JEV Combo `decisionProvider`, `decisionModel` y `decisionTimeoutMs` (`null` por defecto), por lo que al cambiarlos de nuevo al valor predeterminado, todavía reemplaza el valor almacenado.

Para la configuración completa persistente, véase [Configuración](/es/reference/configuration/).

<a id="configuration-reference"></a>

## Referencia de configuración

Los combos se almacenan en el objeto `combos` de nivel superior, con la clave de identificación combinada:

```json
{
  "combos": {
    "balanced": {
      "targets": [
        { "provider": "anthropic", "model": "claude-opus-4-8", "weight": 2 },
        { "provider": "openai", "model": "gpt-5.6-sol", "weight": 1 }
      ],
      "strategy": "round-robin",
      "stickyLimit": 2,
      "defaultEffort": "high",
      "alias": "team/balanced"
    }
  }
}
```

| Campo | Requerido | Predeterminado | Normas |
| --- | --- | --- | --- |
| `targets` | Sí | — | Matriz ordenada no vacía de objetivos `{ provider, model, weight?, lastResort? }` configurados. Se rechazan los pares duplicados proveedor/modelo. |
| `targets[].weight` | No | `1` | Entero de 1 a 10.000. Utilizado por round-robin y aleatorio; ignorado por failover, menos utilizado, reset-window y JEV. |
| `targets[].lastResort` | No | `false` | Marca un objetivo solo de emergencia. Inert a menos que `cooldownWaitPolicy` esté establecido. Nunca hace que un objetivo sea permanentemente inelegible: cuando no se puede alcanzar un objetivo normal, se envía como de costumbre. |
| `strategy` | No | `"failover"` | `"failover"`, `"round-robin"`, `"random"`, `"least-used"`, `"reset-window"` o `"jev"`. JEV decide solo el objetivo inicial elegible y el esfuerzo; Combo ordinario posee intentos posteriores. |
| `stickyLimit` | No | `1` | Número entero de 1 a 100 solicitudes exitosas por selección de round-robin. Solo se aplica a round-robin. |
| `cooldownMs` | No | unset → upstream fallback (5 s para la tasa de solicitud 429 códigos `1302` / `1305`, 10 min para una ventana de uso gastado o un fallo de credencial / facturación, de lo contrario 60 s) | Entero de 1 a 600000. Cuando se establece, se aplica como el tiempo de reutilización por objetivo siempre que no exista una señal de reinicio de flujo ascendente `Retry-After` o Codex utilizable, incluida la tasa de solicitud 429s; cuando no se establece, utiliza el retroceso de flujo ascendente. |
| `waitForCooldownMs` | No | `0` | Entero de 0 a 600000. Tiempo máximo para esperar el objetivo de enfriamiento elegible más temprano antes de regresar `combo_unavailable`; el aborto cancela la espera. |
| `cooldownWaitPolicy` | No | Sin configurar | `"before-last-resort"` aplaza los objetivos marcados como `lastResort`: solo se usan cuando no hay un objetivo normal disponible, para cada estrategia, y `waitForCooldownMs` solo agrega la espera para un objetivo normal de enfriamiento, por lo que en su `0` predeterminado no hay nada que esperar y el último recurso se usa tan pronto como no hay un objetivo normal disponible. Solo esa cadena exacta se selecciona. La espera diferida y la espera ordinaria comparten un presupuesto de `waitForCooldownMs` por intento de selección. |
| `defaultEffort` | No | `null` | `low`, `medium`, `high`, `xhigh`, `max` o `ultra`; resuelto contra la escalera anunciada de cada objetivo. |
| `defaultEffortMode` | No | `"fallback"` | `"fallback"` preserva el esfuerzo explícito de la persona que llama. `"force"` anula el esfuerzo del llamante válido, requiere un valor predeterminado no nulo válido y puede aumentar el costo y la latencia. |
| `reasoningEffortMode` | No | `"strict"` | `"strict"` intersecta cada escalera de destino conocida, por lo que un control de no esfuerzo de publicidad de destino vacía el selector del combo. `"adaptive"` excluye esas escaleras vacías de la intersección publicada. Al momento del despacho, las escaleras desconocidas explícitas vacías o adaptativas eliminan los controles de pensamiento/esfuerzo no soportados al tiempo que preservan los campos de razonamiento sin esfuerzo soportados, como el `reasoning.summary`; los objetivos no vacíos conocidos mantienen la resolución de esfuerzo existente. |
| `imageInput` | No | `"auto"` | `"auto"` o `"disabled"`. `"auto"` publica soporte de imagen solo cuando cada objetivo soporta imágenes; `"disabled"` fuerza el texto solamente (cae la imagen de las modalidades publicadas y rechaza las solicitudes portadoras de imágenes antes del envío). |
| `alias` | No | Ninguno | ID de modelo público recortado opcional; use las reglas de alias anteriores. Un valor vacío se almacena como ningún alias. |
| `nativeAlias` | No | `false` | Permitir explícitamente que un `alias` nativo desnudo actualmente soportado tenga prioridad de enrutamiento y catálogo. Nunca se infiere del alias. |
| `displayName` | No | Ninguno | Etiqueta de catálogo limitada. Requerido y no vacío cuando `nativeAlias` es verdadero. |
| `description` | No | Ninguno | Descripción de la fila de catálogo solo para visualización, limitada como `displayName` (como máximo 128 caracteres, sin caracteres de control). Unset mantiene el texto generado `Routed via opencodex → combo (combo).`. Management API escribe que omita el valor guardado; una cadena vacía lo borra. |
| `decisionProvider` | No | `"jev"` | Sólo JEV. Id de proveedor del servicio de decisión: `"jev"` (TypeSafe, válido sin una fila de proveedor; lo mismo que omisión) o una fila `adapter: "jev-decision"` configurada con una URL de decisión HTTPS completa o una URL local HTTP `/systemone`, tal como una Ollama `tev1` autohospedada. |
| `decisionTimeoutMs` | No | `4000` | Sólo JEV. Entero de 1000 a 120000: la fecha límite de decisión antes de no abrirse al primer objetivo elegible. |

<a id="troubleshooting"></a>

## Solución de problemas

<a id="why-does-comboid-return-404"></a>

### ¿Por qué `combo/<id>` ¿Error 404?

La identificación combinada es desconocida. La respuesta es HTTP 404 con el tipo `invalid_request_error`. Ejecute `ocx combo list`, compruebe la ortografía y el caso, y confirme que el comando de administración se escribió en la misma instancia opencodex en ejecución que recibe las solicitudes del modelo.

<a id="why-do-i-get-combo_unavailable"></a>

### ¿Por qué tengo `combo_unavailable`?

Todos los objetivos no son elegibles actualmente: por ejemplo, su proveedor está deshabilitado, se está enfriando, ya se ha intentado para esta solicitud o una tarea cifrada v2 lo excluye. Compruebe el estado del proveedor de destino y los errores recientes de flujo ascendente. Cuando no se intentó ningún objetivo, el mensaje de error enumera por qué se omitió cada objetivo, por ejemplo, `No available targets for combo: fast (openai/gpt-6: quota exhausted; anthropic/claude-opus-5-5: cooldown 42s)`. Para tiempos de reutilización, siga primero un valor de `Retry-After` observado; Las cabeceras de reinicio Codex también tienen prioridad sobre `cooldownMs`. Si no se puede usar ninguna señal ascendente, se aplica la configuración `cooldownMs`, o se aplica la reserva ascendente cuando no está configurada (5 segundos para los códigos de tasa de solicitud `1302` / `1305`, 10 minutos para una ventana de uso gastada o un fallo de credencial/factura, de lo contrario 60 segundos). `Retry-After` retrasos explícitos tienen un límite de 24 horas; los otros tiempos de reutilización tienen un límite de 10 minutos.

<a id="why-was-my-alias-rejected"></a>

### ¿Por qué fue rechazado mi alias?

Compruebe primero la gramática del alias y los nombres reservados. Un alias duplicado o forma no válida se rechaza como HTTP 400. Un alias recortado cuyo primer segmento es un espacio de nombres de cuenta Codex configurado se rechaza como HTTP 409; elija un espacio de nombres de alias diferente. El CLI y el panel de control muestran el mensaje de validación exacto del servidor.

<a id="why-did-failover-stop-after-the-first-error"></a>

### ¿Por qué se detuvo la conmutación por error después del primer error?

El error fue terminal en lugar de específico del objetivo. Corrige entradas no válidas, reduce un contexto de gran tamaño, maneja un rechazo de directiva o corrige el origen de la solicitud rechazada. Los combos no saltan para esos casos.
