---
title: "Combos: conmutación por error y equilibrio de carga"
description: "Route un modelo virtual a varios proveedores para conmutación por error o balanceo de carga ponderado."
---

A **combo** es un modelo virtual que encabeza una lista ordenada de objetivos reales de proveedor/modelo. Tu Solicitudes de clientes `combo/<id>`; opencodex elige un destino, reescribe la solicitud a ese concreto
`provider/model`, y puede intentar otro objetivo cuando el primero tiene un fallo reintentable.

Esto es útil cuando usted quiere:

- **Failover:** Prefiere un modelo, pero mantenga las copias de seguridad listas.
- **Equilibrio de carga:** Difundir solicitudes exitosas entre modelos o proveedores en lotes ponderados.

Los combos se sientan frente al enrutamiento normal del proveedor. Leer [Enrutamiento de modelos](/es/guides/model-routing/) primero si `provider/model` Los selectores son nuevos para ti.

<a id="metered-fallback-consent"></a>

## Consentimiento de fallback medido

Marca un objetivo combinado de pago por uso con `"metered": true` cuando sigue los objetivos de suscripción. El consentimiento omitido o falso niega el envío medido. Elija el consentimiento para su implementación:

- **Local Claude Code o Codex:** en un proxy de solo loopback, establecer `"allowMeteredTargets": true` en el combo, o correr `ocx combo set <id> --allow-metered-targets on`. Esto permite explícitamente a las personas que llaman locales usar sus objetivos marcados. El valor predeterminado es falso; `off` Aclara el consentimiento. La autenticación de Loopback no lee las claves API.
- **Llamadas en red o vinculadas:** el llamador está configurado `apiKeys[]` La entrada debe tener `"allowMeteredComboTargets": true`. Un proxy con un oyente que no es loopback ignora la bandera combinada, incluso en su oyente de loopback secundario. Las personas que llaman vinculadas también retienen su requisito de consentimiento de clave configurada cuando el oyente principal es loopback. El entorno token nunca califica.

Los encabezados de solicitud no pueden otorgar consentimiento. Los alcances de modelo/proveedor todavía se aplican. Esto cubre la selección inicial, conmutación por error y recuperación en todas las estrategias combinadas, compactación, Messages, Chat Completions y WebSocket, y un modelo de subagente alternativo que nombra un alias combinado. Una reserva colapsada intenta un objetivo no medido utilizable antes de rechazarlo. Los objetivos no marcados conservan el comportamiento existente; el operador declara la medición en lugar de detectarla automáticamente.

Por ejemplo, una cadena de conmutación por error puede Anthropic OAuthEntonces, CursorEntonces, `{ "provider": "anthropic-apikey", "model": "claude-opus-5-5", "metered": true }`. Sin consentimiento, el agotamiento devuelve el último error no medido, con una excepción: un rechazo de cuota anterior 429 o 402 tiene prioridad sobre un 400, 401 o 403 posterior. Si el destino de la suscripción devuelve 429 y Cursor se niega con 401 o 403, la persona que llama recibe el 429 de la suscripción, porque la suscripción gastada explica el fallo y el rechazo de credenciales de Cursor no lo hace. El panel de control guarda la medición de destino omitida y el consentimiento combinado; si se establece explícitamente en false, se borra. Estos campos de consentimiento se configuran a través del archivo de configuración o API; el indicador combinado también está disponible a través del CLI, mientras que el panel de control no lo expone.

<a id="60-second-quickstart"></a>

## 60 segundos de inicio rápido

Este ejemplo crea `combo/main` con Anthropic primero y OpenAI segundo. Ambos proveedores deben ya existen y están habilitados.

```bash
ocx combo set main --targets anthropic/claude-opus-4-8,openai/gpt-5.6-sol
```

La estrategia predeterminada es la conmutación por error, por lo que una solicitud normal va a
`anthropic/claude-opus-4-8`. Si ese intento tiene un fallo reintentable, opencodex puede saltar a
`openai/gpt-5.6-sol`.

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

La identificación combinada en `ocx combo set <id>` debe comenzar con una letra o un número. Puede entonces contener letras, números, `.`, `_`, o `-`Hasta 64 caracteres en total. Su modelo canónico id es siempre
`combo/<id>`Por ejemplo, id `main` se convierte `combo/main`.

Los `combo/` El espacio de nombres está reservado mientras se configuran los combos. Un proveedor llamado `combo` no puede ocuparlo, y un id combinado no puede duplicar un nombre de proveedor configurado.

Un alias opcional le da al combo un nombre de modelo público diferente. Un alias:

- utiliza los mismos caracteres que un id;
- Puede ser simple, como `daily-fast`, o contener una `/`, tales como `team/daily-fast`;
- No puede ser `combo` o comenzar con `combo/`;
- no puede duplicar otro alias combinado; y
- normalmente no puede ser un nombre de familia OpenAI nativo desnudo que comienza con `gpt-`, `o1-`, `o3-`, `o4-`, o `codex-`. El modo de compatibilidad de escritorio explícito a continuación es la única excepción.

Incluso cuando se establece un alias, el canónico `combo/<id>` La forma todavía se resuelve. Carreras de búsqueda canónica antes de la coincidencia de alias, por lo que un alias no puede asumir el id canónico de otro combo.

:::note
Los alias cambian la solicitud de nombre público de los clientes; no cambian el id almacenado del combo ni el proveedor de concreto/selectores de modelos detrás de él.
:::

<a id="compaction-after-switching-combos"></a>

## Compactación después de cambiar los combos

Cuando un cliente compacta usando un nombre de modelo desnudo después de cambiar de combos, opencodex puede recordar el combo que más recientemente se completó con éxito en ese carril de conversación. El modelo debe coincidir la respuesta completada, y el combo y su objetivo deben existir todavía en la configuración actual. La solicitud sigue entonces la selección combo normal y conmutación por error.

Los selectores explícitos de proveedor/combo y los alias combinados configurados tienen prioridad sobre esta recuperación. Las respuestas fallidas, incompletas o canceladas no reemplazan la última selección exitosa. El recuerdo es proceso local y limitado a 256 conversaciones durante 30 minutos, y a 1 KiB por modelo recordado nombre y 64 KiB en total; las entradas caducadas también se limpian en segundo plano. Una respuesta cuyo El nombre del modelo es demasiado grande como para mantener intacta la selección anterior en lugar de borrarla. Recall no almacena credenciales de cuenta. Sin identidad de conversación utilizable o estado válido recordado, se aplica el enrutamiento de compactación normal. Un reinicio despeja el estado recordado.

<a id="codex-desktop-native-allowlist-compatibility"></a>

## Codex Compatibilidad con la lista de permisos nativa del escritorio

Algunas versiones de escritorio Codex aplican un control remoto nativo `available_models` El allowlist después de la app-server ya se ha cargado `model_catalog_json`. Los ids encaminados normales como
`Nova1/codex-gpt-5.6-sol` son entonces utilizables por el CLI pero ausentes del selector de escritorio. Este es el de origen [Error de escritorio Codex](https://github.com/openai/codex/issues/19694) Rastreado por
[opencodex](https://github.com/lidge-jun/opencodex/issues/241).

Cuando controlas un destino enrutado equivalente, un combo puede hacerse cargo explícitamente de una babosa nativa:

```bash
ocx combo set nova-sol \
  --targets Nova1/codex/gpt-5.6-sol \
  --alias gpt-5.6-sol \
  --native-alias \
  --display-name 'Nova1 - codex-gpt-5.6-sol'
```

Este modo es deliberadamente opt-in y requiere ambos `--native-alias` y una etiqueta de visualización no vacía. El alias debe ser uno de los identificadores de modelo nativos soportados por esta versión opencodex; una familia nativa No se acepta el prefijo solo porque la eliminación debe ser capaz de restaurar metadatos autorizados. Cuando la respuesta de descubrimiento del objetivo enrutado proporciona solo un id de modelo, la fila de compatibilidad se rellena. Falta de contexto, modalidad y metadatos de razonamiento del identificador nativo que reemplaza. Objetivo explícito Los límites siguen ganando, por lo que esta alternativa nunca plantea un límite de contexto o anula las capacidades declaradas. Cambia la prioridad exacta de enrutamiento: solicitudes de `gpt-5.6-sol` Resolver `combo/nova-sol` antes la ruta canónica de la familia nativa OpenAI. El catálogo contiene una fila desnuda con la configuración mostrar la etiqueta, no duplicar filas nativas y combinadas. Solo el desnudo `gpt-5.6-sol` Slug es capturado. Filas calificadas como `main/gpt-5.6-sol` y filas calificadas por el proveedor como
`openai-apikey/gpt-5.6-sol` siguen siendo rutas OpenAI distintas; la ruta API-key calificada por el proveedor Nunca se le escapa al alias nativo.

Las claves de visibilidad permanecen inequívocas:

- `combo/nova-sol` oculta el combo de compatibilidad del descubrimiento.
- El bare `gpt-5.6-sol` Entrada en `disabledModels` continúa significando la fila OpenAI nativa inactiva; no oculta el combo que actualmente posee esa babosa pública.
- Mientras se configura al menos un alias nativo, las filas nativas desnudas deshabilitadas se omiten del catálogo Codex efectivo en lugar de retenido como `visibility: "hide"`. Esto evita que el escritorio allowlist de resucitar filas que no debe mostrar. La página Modelos todavía muestra unshadowed nativo switches, y volver a habilitar uno restaura sus metadatos nativos conservados o actuales.

:::caution
Un alias nativo se hace cargo intencionalmente de un ID de modelo de primera persona. Utilizarlo solo cuando el objetivo es operacionalmente equivalente y etiqueta la fila del selector honestamente. Eliminar el combo restaura la normalidad enrutado nativo e identidad de catálogo en la siguiente sincronización.
:::

<a id="choose-a-strategy"></a>

## Elige una estrategia

<a id="failover-ordered-primary-and-backups"></a>

### Conmutación por error: copias de seguridad y primarias ordenadas

`failover` selecciona el primer destino elegible en orden de configuración. Un objetivo es elegible cuando su El proveedor existe, está habilitado, no se está enfriando y puede manejar cualquier restricción de solicitud especial. Pesos y `stickyLimit` No afecta a esta estrategia.

Dada esta orden:

1. `anthropic/claude-opus-4-8`
2. `openai/gpt-5.6-sol`
3. `google/gemini-3-pro`

cada solicitud comienza con Anthropic. Un error Anthropic reintentable mueve esa solicitud a OpenAI; a El error retryable OpenAI puede moverlo a Google. Un error de terminal se detiene inmediatamente en lugar de Intentando los objetivos restantes.

<a id="round-robin-smooth-weighted-batches"></a>

### Round-robin: lotes ponderados lisos

`round-robin` utiliza un round-robin suave y ponderado. Un peso objetivo más grande le da a ese objetivo un peso más grande. compartir a lo largo del tiempo sin enviar toda su parte como un bloque largo. `stickyLimit` Controla cuántos Las solicitudes exitosas permanecen en el objetivo seleccionado antes de la siguiente selección ponderada.

Crear un combo 2:1 con lotes de dos solicitudes exitosas:

```bash
ocx combo set balanced \
  --targets anthropic/claude-opus-4-8:2,openai/gpt-5.6-sol:1 \
  --strategy round-robin \
  --sticky 2
```

Llamando a los objetivos **A** (peso 2) y **B** (peso 1), las primeras seis selecciones ponderadas son
`A, B, A, A, B, A`. Porque `stickyLimit` es 2, cada selección se mantiene activa durante dos Solicitudes:

| Solicitud exitosa | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Objetivo | A | A | B | B | A | A | A | A | B | B | A | A |

La cuota a largo plazo sigue siendo 2:1. Un fallo reintentable termina el lote pegajoso actual, enfría objetivo y selecciona otro objetivo elegible para la misma solicitud.

:::caution
Los pesos son relativos, no porcentajes. Pesos `2,1` y `200,100` expresa la misma proporción. Prefiero Pequeños valores que comunican la intención.
:::

<a id="random-weighted-draw-per-request"></a>

### Aleatorio: sorteo ponderado por solicitud

`random` dibuja un objetivo elegible por solicitud, con probabilidades proporcionales a `weight`. Cada solicitud es un sorteo independiente, por lo que el tráfico se propaga a través de los objetivos sin el patrón determinista o pegajosidad de round-robin. `stickyLimit` No afecta a esta estrategia.

<a id="least-used-favor-the-target-with-fewest-successes"></a>

### Menos utilizado: favorezca al objetivo con menos éxitos

`least-used` encamina cada solicitud al objetivo elegible con la menor cantidad de solicitudes exitosas registrado por este proceso opencodex. Cuentas comienzan a cero en el reinicio, y los lazos mantienen la configuración Orden. Pesos y `stickyLimit` No afecta a esta estrategia.

<a id="reset-window-follow-the-soonest-quota-reset"></a>

### Reset-window: siga el restablecimiento de cuota más rápido

`reset-window` encamina cada solicitud al destino elegible cuya instantánea de cuota de proveedor en caché muestra el próximo restablecimiento de ventana más rápido (cinco horas, semanal, mensual o personalizado). Esto gasta el proveedor que refresca primero. Los objetivos sin datos de cuota frescos, y los lazos, mantienen la configuración Orden. Pesos y `stickyLimit` No afecta a esta estrategia.

Esta clasificación y exclusión de proveedores antes del envío requieren nuevos límites de inferencia de modelo que se aplican a la clave API actual como un todo. Los resúmenes de OAuth/cuenta actual, las rutas de reenvío de llamadas, las claves múltiples y las instantáneas con credenciales o destinos modificados solo se muestran para esta decisión temprana. Lo mismo se aplica cuando `Authorization`, `x-api-key`, o `x-goog-api-key` Los encabezados anulan las credenciales; se excluyen las ventanas de solo búsqueda y solo MCP. Si ningún objetivo elegible tiene un restablecimiento aplicable, el orden de configuración gana. La selección y los reintentos de la cuenta aún imponen sus límites normales.

<a id="advisory-quota-signals-for-jev"></a>

### Señales de cuota de asesoramiento para JEV

Evidencia de cuota es opt-in por separado **por JEV Combo**, para los tres métodos de decisión:

```bash
ocx combo set coding --decision-quota-signals on --json
ocx combo set coding --decision-quota-tiers '{"moderate":40}' --json
```

Habilite esto solo en un `strategy: "jev"` Combo. `decisionQuotaSignals: true` añade niveles de cuota de suscripción a la solicitud de decisión, no una regla de elegibilidad dura. La decisión Se pide al backend que prefiera una cuota más saludable entre las opciones adecuadas; todavía elige solo de objetivos elegibles configurados y listas de permisos de esfuerzo. Desconocido no está agotado, y ordinario Las opciones, el tiempo de reutilización, la selección de cuentas y los límites del proveedor permanecen sin cambios.

Los valores predeterminados son `limited: 70` y `nearlyExhausted: 90`, porcentajes incluidos utilizados. No hay ninguna nivel moderado a menos que lo establezca explícitamente (por ejemplo, `moderate: 40`) Anulaciones parciales fusionan con esos valores predeterminados, entonces todos los umbrales deben ser finitos, dentro de 0–100 y estrictamente ascendentes.

La evidencia proviene solo de las instantáneas de memoria publicadas por los recolectores de cuotas existentes, aceptadas encabezados de respuesta y propietarios de credenciales/cuentas, y solo mientras al menos un Combo JEV tenga esta activar: hasta entonces opencodex no recoge nada para ello, por lo que la evidencia comienza a acumularse (y lee como desconocido) desde el momento en que lo habilites. Leer la evidencia de la cuota de asesoramiento nunca se resuelve credenciales, carga auth stores o archivos de cuota, lee un llavero, sondea de origen o inicia un refresco. La resolución normal de las credenciales del backend de decisión no cambia. Frío, perdido, rancio (final) 30 minutos), se desconocen las pruebas futuras, inválidas o que hayan expirado. Cada cuenta usa su peor valor ventana relevante de cinco horas, semanal, mensual o estructuralmente. Una habilitada utilizable El grupo Anthropic/Codex utiliza su nivel de cuenta más saludable; vínculos desconocidos saludables. Una grupo es casi agotada solo si cada cuenta utilizable ha conocido evidencia casi agotada. Modelos de reserva sin barras atribuibles por separado siguen siendo desconocidos. Resúmenes de cuentas activas, clave múltiple Los informes de visualización, los créditos y los medidores API/Spark/USD no son evidencia de cuota para esta decisión. El Anthropic · separado Pool 2 (`anthropic2`) el fondo de cuentas no es una fuente de esta evidencia, por lo que sus objetivos permanecen desconocidos.

:::caution[Datos adicionales para la decisión]
La opción de envío envía los niveles de cuota, y el porcentaje/ventana/reset de demora usado disponible, a su selección backend de decisión, incluyendo alojado TypeSafe. No hay ID de cuenta, tokens o huellas dactilares de credenciales son enviados o registrados por esta característica. Los registros de decisiones locales retienen solo los recuentos de niveles limitados y el nivel seleccionado. Si la cuota supera el límite de solicitud de 64 KiB, se elimina antes de volver a intentar serialización; una decisión ordinaria de gran tamaño todavía falla abierta.
:::

`--decision-quota-signals off` desactiva la evidencia mientras retiene los niveles configurados; `-` borra el interruptor. `--decision-quota-tiers -` clears overrides, restaurando los valores predeterminados. API `null` aclara; API `false` Desactiva el interruptor. Los campos omitidos sobreviven a las actualizaciones de JEV, el reemplazo de objetivos y cambiar el nombre, incluidos los guardados a través del editor existente. Alejarse de JEV elimina ambos Configuración de cuotas. No se habilitan nuevos controles de editor ni trabajo de cuota de fondo.

<a id="decision-method"></a>

### Método de decisión

`strategy: "jev"` pide una decisión de fondo para elegir el primer objetivo elegible y un esfuerzo de razonamiento para la solicitud actual. Es opt-in: cree un Combo JEV y seleccione ese Combo para usarlo. Agregar una credencial de decisión no cambia los modelos, alias o valores predeterminados existentes.

| Método | Selección combinada | Backend reportado en estadísticas |
| --- | --- | --- |
| TypeSafe (predeterminado) | Omitir ambos selectores, o conjunto `decisionProvider: "jev"`. | `typesafe` |
| Servidor compatible con System One | Establecer `decisionProvider` a una configuración `jev-decision` ID de fila que no sea `jev`. | `systemone` |
| Modelo opencodex | Establecer `decisionModel` a una ruta opencodex ordinaria, como `ollama/qwen3:4b`. | `model` |

`decisionProvider` y `decisionModel` son mutuamente excluyentes. El backend se deriva de los campos; no hay ningún almacenado `backend` Estableciendo. Cada método utiliza el mismo objetivo y esfuerzo elegible allowlist, estado de decisión limitado, tiempo de espera, cancelación y política de apertura fallida.

<a id="typesafe-default"></a>

#### TypeSafe por defecto

La configuración más rápida es:

1. Abrir **Proveedores**, añadir **TypeSafe JEV**, introduzca la clave TypeSafe API y pruebe la conexión.
2. En la vista general de ese proveedor, seleccione **Crear JEV Auto**. También puedes usar la misma acción bajo
   **Modelos → Combos**.
3. Revise los objetivos Astra → Sol → Luna precargados. Agregar, quitar, reordenar o reemplazar antes de Creando el combo. La primera fila actualmente elegible está marcada como el objetivo de apertura de error, y cada La escalera de razonamiento conocida se muestra al lado de su fila.

La plantilla crea id y alias `jev-auto`, utiliza la capacidad de razonamiento adaptativo, y sigue siendo un Combo editable ordinario. No se convierte en el modelo por defecto. Sus objetivos son la totalidad allowlist: JEV nunca puede seleccionar un par proveedor/modelo fuera de esa lista, y el objetivo original Los modelos permanecen disponibles en sus grupos de selección normales.

Para la configuración sin cabeza, almacene la clave explícitamente o haga referencia a la variable de entorno TypeSafe:

```bash
ocx provider add jev --api-key "${TYPESAFE_API_KEY}"
```

Cuando el proveedor no tiene una clave guardada, el cliente de decisión también acepta `TYPESAFE_API_KEY` directamente y El alias estándar derivado del proveedor `JEV_API_KEY` impreso por `ocx provider add`.

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

Con el método predeterminado, OpenCodex envía una solicitud de decisión limitada al
`https://api.typesafe.ai/v1/systemone` punto final con modelo `jev-latest`. Solo actualmente elegible Se ofrecen objetivos configurados. JEV elige el objetivo y el esfuerzo juntos; el esfuerzo sigue siendo limitado por la escalera anunciada de ese objetivo. JEV no se pregunta de nuevo si el objetivo seleccionado tiene un falla reintentable—el tiempo de reutilización y el bucle de retroceso de Combo existentes continúan a través del resto objetivos configurados.

<a id="system-one-compatible-server"></a>

#### Servidor compatible con System One

Un Combo JEV puede solicitar un servidor alojado o autoalojado que implemente el contrato de cable de System One. Por ejemplo, un servidor Ollama con soporte System One puede servir `tev1` en
`POST /v1/systemone` sin una clave API. Añadir una fila de proveedor con
`adapter: "jev-decision"` cuyo `baseUrl` es el **lleno** de decisión, luego nombrarlo en el Combo de `decisionProvider`:

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

- La fila `baseUrl` debe ser el punto final de decisión completo. Los servicios de HTTPS pueden usar cualquier ruta, como el `/v1/decisions`; los puntos finales HTTP simples todavía deben terminar en `/systemone`. Userinfo, cadenas de consulta y fragmentos no se aceptan en las URL de decisión. El modelo de decisión es `defaultModel`, si no el primero `models` entrada; una fila con ninguno es inutilizable y no se abre sin una solicitud (`jev-latest` es el modelo de TypeSafe y es nunca enviado a un anfitrión auto-alojado). La fila es solo un servicio de decisión: nunca se publica como un modelo enrutable y no puede ser un objetivo Combo.
- Un loopback o LAN necesidades de punto final `allowPrivateNetwork: true` explícitamente en esa fila. Utilice un dirección loopback literal, RFC 1918 o IPv6 ULA `http:`; cada dirección resuelta debe permanecer en el conjunto permitido y no se puede aplicar ningún proxy de salida (agregar anfitrión a `NO_PROXY`) Todos los demás destinos deben usar HTTPS. Las redirecciones aún no se abren.
- Solo la propia fila `apiKey` se envía, y solo cuando está configurado; una fila sin llave no envía
  `Authorization` cabecera. Una fila cuyo `apiKey` referencias `${TYPESAFE_API_KEY}`/`${JEV_API_KEY}` o La entrada del llavero de otro proveedor se rechaza como inutilizable, por lo que `TYPESAFE_API_KEY`, `JEV_API_KEY`, y la `jev` La clave de fila nunca se envía a un punto final autoalojado. Los `jev` id mismo (explícito o siempre significa el punto final TypeSafe con modelo `jev-latest`.
- Los servicios autoalojados reciben cada opción de destino/esfuerzo como una cadena de descripción simple (para ejemplo `Target openai/gpt-5.6-sol (provider openai, model gpt-5.6-sol) with low reasoning
  effort.`), porque Ollama solo acepta cadenas o `null` descripciones de opciones. TypeSafe mantiene recibir los objetos de opción estructurados.
- OpenCodex ofrece opciones 2–26 a una fila compatible con System One. Cada objetivo aporta una opción por esfuerzo de razonamiento ofrecido; uso por objetivo `reasoningEfforts` para recortarlos. Menos de 2 o más de 26 opciones no se abren sin una solicitud.
- Una carga de modelo en frío puede tardar decenas de segundos, y una solicitud de decisión abortada hace que Ollama abandone la carga. Precalentar el modelo y mantenerlo residente (`OLLAMA_KEEP_ALIVE=-1`, o `keep_alive`), y aumentar
  `decisionTimeoutMs` (1000–120000 ms, por defecto 4000) cuando el servicio es más lento que cuatro segundos. Cada tiempo de espera o error aún no se abre al primer objetivo elegible.

El proveedor **Conexión de prueba** envía una decisión de sondeo limitada a su punto final.
**Crear JEV Auto** en un proveedor de System One (incluidas las filas sin llave) rellena esa fila como el proveedor de decisiones. Filas deshabilitadas, URL de decisión no válidas y filas sin modelo se muestran con una razón y no pueden ser recogidos.

Para un servicio alojado alternativo con el mismo contrato de solicitud/respuesta de decisión, agregue un proveedor fila y seleccionarlo con el Combo de `decisionProvider`:

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

Establecer `decisionProvider: "alternative-decider"` en el Combo JEV existente. Su propia credencial y el modelo acompaña al estado de decisión limitado; Las credenciales de entorno TypeSafe nunca se heredan. Los `jev` id sigue siendo canónico. HTTPS/TLS, restricciones de destino de salida, rechazo de redirección, Límites de solicitud/respuesta, tiempo de espera, cancelación y la lista de permisos de elección elegible aún se aplican.

[Laya MLX](https://github.com/mizorewww/laya-mlx) ejecuta decisiones escritas en Apple Silicon. Para usarlo con este método, expóngalo a través de un contenedor HTTP compatible con System One y luego configure una fila como
`ollama-tev1` arriba con el envoltorio lleno `/systemone` URL e ID de modelo aceptado como `defaultModel`. El entorno de ejecución de Python MLX solo no es un punto final de decisión HTTP. Para un envoltorio de bucle HTTP, mantenga
`allowPrivateNetwork: true` y utilice su dirección de bucle de retorno literal.

Para un ejemplo alojado, un colaborador informó el siguiente punto final de Zen System One que trabaja en
[#6185](https://github.com/lidge-jun/opencodex/pull/6185). Configurarlo manualmente como una fila ordinaria; Esto no es un preajuste del registro OpenCodex o una garantía de disponibilidad actual:

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

Utilice la propia clave de ese punto final si se requiere autenticación; omita `apiKey` solo si el endpoint Acepta llamadas sin llave. Nunca reutilizar `TYPESAFE_API_KEY` o `JEV_API_KEY` Por eso.

<a id="opencodex-model"></a>

#### Modelo opencodex

Un chat ordinario o modelo Responses puede hacer la misma elección de enrutamiento sin implementar
`/systemone`. Configure su proveedor de inferencias como de costumbre y establezca `decisionModel` a su ruta:

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

Otros ejemplos son `deepseek/deepseek-v4-flash`, `openai/gpt-5.6-luna`, o
`opencode-zen/<model>` para un modelo de inferencia Zen configurado. Estos son hilos de ruta ordinarios, no preconfiguración de servicio de decisión; el proveedor y el modelo deben estar disponibles en la instalación. Porque `openai/gpt-5.6-luna`, configurar las credenciales que puede usar la llamada interna, como una Codex almacenada inicio de sesión en pool. Un inicio de sesión de reenvío ChatGPT propiedad del llamante es insuficiente.

El modelo recibe instrucciones fijas del router y un mensaje JSON:

```json
{
  "state": { "user_task": "Review the requested change" },
  "options": { "<key>": "Target description and allowed reasoning effort" }
}
```

`state` es la evidencia limitada que se describe a continuación; `options` mapas generados opción claves a llanura descripciones. El contrato de respuesta es `{"choice":"<key>"}`, nombrando exactamente una opción ofrecida. Las instrucciones tratan el estado como evidencia, prefieren un menor uso de recursos entre las opciones adecuadas, y requieren JSON solamente. Una opción no válida o no listada, una respuesta malformada o una llamada fallida no se abre.

La decisión interna lleva a **ninguna credencial de llamada**, encabezados de llamada, herramientas, sesión o Historial de conversación. Debe usar credenciales almacenadas para el proveedor seleccionado, o un proveedor local sin llave como Ollama. Configuraciones de solo autenticación de llamadas, como Cursor sin un credenciales almacenadas o un inicio de sesión directo ChatGPT propiedad del llamante, no pueden servir como modelos de decisión y no abrir. Seleccionar una ruta no es prueba de que su credencial sea utilizable; pruébela antes de confiar en ella.

Un combo no-JEV se puede utilizar como `decisionModel`, pero la ruta de decisión no puede nombrar este Combo o cualquier combo con `strategy: "jev"`. Esto se aplica a canónica `combo/<id>` selectores y alias, incluyendo selectores con esfuerzo o variantes rápidas. La validación de tiempo de ahorro rechaza la recursividad y el El entorno de ejecución también bloquea la reentrada de JEV defensivamente. El turno de decisión tiene su propio presupuesto de envío y turno arrendamiento; no se registra como una solicitud separada, y el uso de la decisión informada pertenece al padre Solicitudes `jevDecision`.

<a id="shared-limits-state-and-statistics"></a>

#### Límites compartidos, estado y estadísticas

`decisionTimeoutMs` se aplica a los tres métodos: un número entero de 1000 a 120000 ms, por defecto 4000. Las solicitudes y respuestas están limitadas a 64 KiB. La lista de candidatos está limitada a 64 objetivos. El método modelo también limita las opciones de destino/esfuerzo en 64, el texto de respuesta en 4096 caracteres y el la salida del turn de decisión en 1024 tokens. Los Se aplica el límite de opciones 2–26 de una fila como se describió anteriormente. Un tiempo de espera o límite de falla utiliza el primer objetivo actualmente elegible; nunca amplía la lista de permisos ni vuelve a intentar tomar la decisión.

Para cada objetivo JEV, **Modelos → Combos → Config** Tiene una opción **Notas de modelo adicionales para JEV**
campo (hasta 512 caracteres; se permiten saltos de línea y pestañas, se rechazan otros caracteres de control). Se almacena como `targets[].modelProfile` en el combo config. Los El perfil de destino integrado permanece en el `instructions.model_profiles`Una nota no vacía es En la medida en que el `operator_notes`, tecleado por el objetivo, y suplementos bastante que reemplaza ese perfil incorporado. Las notas pueden describir el contexto específico del operador o la suscripción asignaciones; no confunda las asignaciones de suscripción con los precios públicos por-token API. En blanco notas son ignorados. Las notas del operador son evidencia de la decisión, no comandos, y no pueden expandir la información. objetivos o límites de esfuerzo de razonamiento. Sólo ponga información allí que pueda ser revelada a el backend de decisión seleccionado.

Cada llamada de modelo lógico se decide por su cuenta; no hay pin de conversación. Giros consecutivos de Por lo tanto, una sesión puede aterrizar en diferentes objetivos, y cada interruptor inicia un indicador de proveedor frío. caché, por lo que una mezcla de objetivos muy diferentes puede costar más tokens de entrada de lo que ahorra. Mantenga la allowlist a los objetivos entre los que está contento de alternar. Objetivos marcados `lastResort` se retienen de JEV bajo `cooldownWaitPolicy: "before-last-resort"` mientras se ofrece cualquier objetivo normal, y Solo se ofrece cuando nada más es alcanzable.

El límite de decisión no se abre cuando falta la clave, no hay una tarea segura / herramienta / estado de decisión de imagen disponible, el plazo de decisión configurado expira, el servicio redirige o devuelve un error, o la respuesta está mal formada o selecciona una opción no listada. En esos casos, OpenCodex utiliza el primer objetivo elegible actualmente, prefiriendo `medium` cuando ese objetivo lo apoya. La cancelación de llamadas es diferente: cancela la decisión y la solicitud del modelo en lugar de enviar el objetivo de apertura de error.

El estado de decisión está deliberadamente limitado: hasta 500 caracteres de la tarea de usuario actual, un 240 caracteres de la cola del asistente anterior, una cola de salida de última herramienta de 520 caracteres, el nombre de la herramienta y Las señales booleanas de imagen/herramienta pueden enviarse al backend de decisión seleccionado. Excluye las credenciales, encabezados de solicitud, bytes de imagen sin procesar, argumentos de herramientas, razonamiento cifrado e historial completo de conversaciones. Utilice un método de decisión solo para el contenido que está dispuesto a enviar a ese backend. Codex reconocido contexto de máquina sobres y Claude Code `<system-reminder>` bloques se eliminan de las tres muestras de texto antes de recorte, por lo que los recordatorios inyectados no desplazan la tarea real. El modelo original es sin cambios. Esto no es un escáner secreto: el texto ordinario del asistente y de la salida de la herramienta todavía puede contener contenido sensible. TypeSafe afirma que Jev no es entrenado en las solicitudes de los clientes, pero sus términos no establecen un período de retención fijo para el estado y ofrecer cero retención de datos solo en los planes empresariales ([modelos](https://docs.typesafe.ai/models), [legal](https://docs.typesafe.ai/legal)) TypeSafe También documenta el inglés como el idioma más preciso de Jev, así que revise las decisiones sobre el trabajo que no sea inglés. antes de confiar en ellos. Los registros contienen solo los seleccionados objetivo/esfuerzo, una puerta de decisión aproximada, latencia, confianza/probabilidad opcional y uso numérico. Las pruebas automatizadas usan respuestas TypeSafe simuladas más un humo sin llave que se abre al error; una decisión TypeSafe en vivo requiere una clave suministrada por el operador y no se ejecuta implícitamente.

El esfuerzo seleccionado de JEV se aplica al primer hijo de Responses y a los hijos nativos de Chat en la opción de aceptación.
`protocols.rollout.nativeChatCombos` camino. Reemplaza el esfuerzo de quien llama y elimina el pensamiento conflictivo Controles y llamadas `service_tier`; una opción explícita sin esfuerzo elimina el esfuerzo incluso cuando el Combo ha un defecto forzado. Los pines de esfuerzo del proveedor, las tapas y la normalización del cable aún se aplican después. Los registros de solicitud y intento muestran un esfuerzo aplicado diferente como `high->xhigh` o `high->low`Reteniendo más tarde Configuración como `high->xhigh->medium`. Un esfuerzo inalterado o una elección sin esfuerzo mantiene el etiqueta. Más tarde, los objetivos de reserva usan la política Combo ordinaria de la solicitud original, sin otra llamada JEV.

Después de que el Combo haya servido las solicitudes, abra **Modelos → Combos → jev-auto → Estadísticas** para inspeccionar JEV elige sin reemplazar el selector de modelo normal o la página Uso. La pestaña separa la decisión informada por el backend tokens de tokens reportado por el modelo físico envía, y muestra las puertas de decisión, selecciones de fallo-apertura, esfuerzos de razonamiento, reintentos / retrocesos, caché tokens, latencia, confianza y totales por modelo para 7 días, 30 días o toda la historia disponible. Las estadísticas provienen del libro mayor de uso solo de apéndices locales; contienen los metadatos de decisión limitados descritos anteriormente, no mensajes ni credenciales. Backend filas muestran el recuento de decisiones, el recuento aplicado y la latencia media para `typesafe`, `systemone`, y
`model`; los registros más antiguos sin backend se agrupan como `unknown`.

<a id="what-happens-when-a-target-fails"></a>

## Qué pasa cuando un objetivo falla

Las fallas combinadas se dividen en **hop** fracasos y **terminal** fracasos.

| Resultado | Comportamiento |
| --- | --- |
| HTTP 401, 403, 404, 408, 429 o cualquier 5xx | Enfríe el objetivo y salte al siguiente objetivo elegible. |
| HTTP 410 con un modelo explícito al final de su vida útil, retirado, obsoleto, puesta del sol, desmantelado o señal ya no disponible | Enfriar ese objetivo y saltar. Las respuestas 410 no relacionadas siguen siendo terminales. |
| Autenticación clasificada, suscripción, cuota, límite de velocidad, sobrecarga o error del servidor ascendente | Enfríe el objetivo y salte, incluso cuando el estado por sí solo no sea suficiente. |
| Cancelación de cliente (499), `origin_rejected`, rechazo de políticas cibernéticas, desbordamiento del contexto u otra solicitud inválida | Detener y devolver el error; otro objetivo no haría que la solicitud fuera válida. |
| HTTP 400 exacto que dice que un modelo no es compatible cuando se usa Codex con una cuenta ChatGPT | Pruebe el siguiente objetivo declarado antes del compromiso de producción. El mensaje debe ser el rechazo total en `detail`, `error.message`, o texto desnudo; compitiendo `detail` y `error` sobres estancia terminal. Esto no pone en cuarentena la cuenta ni enfría todos los modelos del proveedor. |
| Estructurado HTTP 400 rechazo opcional `user`, un esfuerzo de razonamiento no soportado, una entrada de imagen con alcance de modelo o medios de entrada que la ruta no puede leer (`unsupported_input_modality`) | Salta antes del compromiso de salida sin enfriamiento; vea la compatibilidad de destino local de solicitud a continuación. |
| Primera llamada de herramienta de un giro Responses ejecutado por un adaptador en proceso (`runTurn`) que la solicitud actual no declaró, antes de cualquier efecto secundario de salida o reproducción insegura | Enfríe el objetivo y salte con el mismo catálogo de herramientas. Después de una salida visible o un efecto secundario de repetición insegura, el rechazo es final. Las solicitudes Chat Completions y Anthropic Messages no se modifican. |
| Cualquier otro error no clasificado | Detener y devolver el error. |

Si el presupuesto de envío de solicitud compartida rechaza el primer objetivo, el combo devuelve un 429 local.
`request_send_budget_exhausted` sin contactar a un proveedor. Si rechaza un objetivo posterior, el combo devuelve el último error ascendente real sin enviarlo a ese objetivo.

Cuando `cooldownMs` está sin definir, un objetivo saltado utiliza un fallback ascendente: 5 segundos para la tasa de solicitud 429s con código ascendente `1302` o `1305`, 10 minutos para una ventana de uso de la cuenta gastada, y 60 segundos de lo contrario. Una ventana de uso es reconocida por el código ascendente (`usage_limit_exceeded`,
`usage_limit_reached`, `1308`o por la prosa `usage limit reached`, independientemente del estado HTTP — el backend ChatGPT Codex informa de una ventana gastada como 502 en lugar del 429 documentado. Credenciales y fallas de facturación que ya bloquean a todo el proveedor (`invalid_api_key`, `insufficient_quota`,
`payment_required`, y los otros códigos de alcance del proveedor) toman la misma espera de 10 minutos. Cuando se establece, `cooldownMs`
se aplica siempre que no se pueda utilizar de origen `Retry-After` o Codex señal de restablecimiento existe, incluidos los 429s. Numérico `Retry-After` segundos y se aceptan valores de fecha HTTP. Explícito Los retrasos en el servidor se limitan a 24 horas; los tiempos de reutilización derivados, configurados y de reserva se limitan 10 minutos. La precedencia es, de más fuerte a más débil, explícita.
`Retry-After` → Codex reseteo de cabeceras (`x-codex-primary-reset-at`, `x-codex-secondary-reset-at`, o
`x-codex-tertiary-reset-at`) → el combo de `cooldownMs` (cuando se establece) → el 10 minutos de espera para una ventana de uso gastado o un fallo de credencial / facturación → el retroceso de tasa de solicitud de 5 segundos para upstream códigos de límite de velocidad `1302`/`1305` → el valor predeterminado de 60 segundos. La retención de la ventana de uso se prueba primero, por lo que Fallo que lleva un código de tasa de solicitud *y* La prosa de límite de uso se mantiene durante diez minutos en lugar de diez minutos. cinco segundos. Una validez inmediata
`Retry-After: 0` sigue siendo una directiva ascendente inmediata en lugar de ser reemplazada por una Enfriamiento.

Para un grupo Anthropic OAuth o Codex, un 429 vinculado a una cuenta que el grupo ha enfriado no no enfriar todo el combo objetivo. Otras cuentas detrás de ese objetivo siguen disponibles. El 429 con ninguna cuenta de grupo refrigerada identificada sigue enfriando el objetivo, al igual que las fallas de todo el proveedor.

<a id="last-resort-targets"></a>

### Objetivos de último recurso

Un breve tiempo de reutilización en un objetivo preferido de lo contrario se dirige directamente a lo que sea. viene a continuación en la lista — incluyendo un objetivo que solo quería utilizar en una Emergencia. Márcalo y dile al combo que espere primero:

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

Con el conjunto de políticas, la selección prueba primero los objetivos normales. Si sólo son enfriamiento y el enfriamiento más temprano expira dentro `waitForCooldownMs`, el petición espera por eso en lugar de enviar el destino del último recurso. Eso aplazamiento no depende de la espera: a `lastResort` El objetivo se salta cada vez que cualquier objetivo normal está disponible, para cada estrategia, y bajo `round-robin` o
`random` No se une a la rotación en absoluto. `waitForCooldownMs` Sólo añade el esperar un objetivo normal de enfriamiento, por lo que en el valor predeterminado `0` No hay nada que esperar: el último El recurso se utiliza tan pronto como no hay un objetivo normal disponible. Tras un intento fallido, la siguiente selección sigue la misma regla.

**La política sólo se aplaza.** Cuando no se puede alcanzar un objetivo normal — cada un enfriamiento más allá del presupuesto, ya intentado o descartado — el último recurso objetivo se envía como de costumbre. Una política que podría retenerlo se convertiría en caída en un corte, que es peor que el enrutamiento prematuro que previene. Lo mismo se aplica a un combo cuyos objetivos son *todos* marcado `lastResort`: es despachos con normalidad.

`lastResort` Es inerte a menos que `cooldownWaitPolicy` se establece, y ambos se omiten Por defecto, los combos existentes no se ven afectados. Solo la cadena exacta
`before-last-resort` Opta por.

La solicitud actual nunca vuelve a intentar el mismo objetivo — con una excepción: un combo de un solo destino que establece `waitForCooldownMs` puede volver a intentar su único objetivo una vez que el tiempo de reutilización de ese objetivo expira dentro del misma petición, ya que no hay alternativa para fallar. Rechazos de compatibilidad local todavía Regresa sin ningún intento. Las solicitudes posteriores omiten un objetivo enfriado hasta que El tiempo de reutilización expira; los rechazos de compatibilidad local de la solicitud no enfrían el objetivo. A `Retry-After` HTTP-date que ya está en el pasado también se conserva como un Directriz inmediata, como `Retry-After: 0`. Establecer `waitForCooldownMs` Para permitir una posterior solicitar esperar el tiempo de reutilización del objetivo elegible más temprano, hasta ese límite en cada intento de selección, y luego hacer una selección fresca. Por lo tanto, una solicitud puede esperar hasta `hops × waitForCooldownMs`
a través de múltiples saltos de conmutación por error. El valor predeterminado es `0`, que falla cerrado inmediatamente con HTTP 503 cuando cada objetivo elegible se está enfriando; eso `combo_unavailable` 503 lleva un `Retry-After` cabecera igual hasta el tiempo de reutilización restante más temprano, redondeado a segundos enteros con un mínimo de 1. Las esperas no se agitan, así que Es posible realizar despertares sincronizados. Una solicitud abortada cancela esta espera y devuelve el valor normal.
`client_cancelled` respuesta; no envía un objetivo de respaldo después de la cancelación. Un objetivo combinado El tiempo de reutilización es el estado por coma local del proceso y está separado del tiempo de reutilización de la cuota de cuenta Codex utilizado por el enrutamiento de cuenta nativo.

:::note
La conmutación por error es intencionadamente limitada. Ayuda con la disponibilidad específica del objetivo, autenticación, cuota, y sobrecarga de fallos; no oculta errores de llamada o rechazos de políticas. En una solicitud Responses no combo, se reescribe una directiva xAI 403 permitida en HTTP 200.
`incomplete/content_filter` antes de que Codex lo vuelva a intentar como un fallo de transporte; véase
[Rechazos de política xAI](/es/reference/proxy-formats/#xai-policy-refusals). Combo hops todavía clasificar el HTTP 403 original como un salto.
:::

Para las solicitudes de transmisión, el flujo ascendente HTTP El estatus no es la decisión final. OpenCodex búferes un prefijo de pre-salida delimitado del Responses SSE. Si el flujo informa de un
`response.failed` terminal antes de cualquier texto, razonamiento, llamada de herramienta u otro evento de salida, el niño se registra como fallido y el combo puede intentar su próximo objetivo elegible. Una salida cero
`response.incomplete` sigue el mismo camino cuando su razón falta o es `adapter_eof`,
`missing_terminal_event`, o `upstream_stall_timeout`. Razones semánticas explícitas como
`max_output_tokens` y `content_filter` sigue siendo terminal, al igual que una razón explícita nula. También se mantiene una instantánea final sin razón que ya contiene elementos de salida. Una vez que comienza cualquier evento de salida, el objetivo está comprometido: un fallo posterior de la secuencia se devuelve al cliente y nunca se reproduce en otro proveedor, lo que evita la duplicación de texto y la ejecución de herramientas. Si el buffer de pre-salida alcanza su límite de seguridad sin un terminal o límite de salida, OpenCodex también confirma el objetivo actual en lugar de crecer la memoria sin ataduras.

<a id="request-local-target-compatibility"></a>

## Compatibilidad con objetivos locales de solicitud

Cuando se enruta Claude Code a lo canónico ChatGPT Codex backend, OpenCodex elimina el nivel superior no soportado `user` campo de metadatos sin cambiar la clave de sesión/caché, los mensajes de entrada, los esquemas de herramientas o los identificadores de seguridad. Responses API y las pasarelas de avance no canónicas mantienen ese campo.

Un combo también puede avanzar después de un HTTP 400 intacto `invalid_request_error` que rechaza específicamente `user`, informes `unsupported_value` por `reasoning.effort`/`reasoning_effort`, o informes `param: input` con un modelo de alcance exacto `does not support image inputs` rechazo. Una ruta que rechaza los medios de la solicitud con código `unsupported_input_modality`, como la entrada de imágenes enviada a una ruta de proveedor CLI sin un contrato multimodal verificado, avanza de la misma manera. Este es un desajuste para esa solicitud, no evidencia de que el objetivo no sea saludable, por lo que no registra ningún enfriamiento. Esta recuperación de compatibilidad no cambia silenciosamente `none` en un esfuerzo diferente o ampliar esta excepción a solicitudes arbitrarias no válidas. Las denegaciones de política, la cancelación y la producción ya comprometida siguen siendo no reproducibles. Una solicitud de un solo objetivo todavía devuelve un rechazo ascendente no resuelto.

<a id="tool-calls-stay-on-one-target"></a>

## Las llamadas de herramientas permanecen en un objetivo

Cuando un modelo le pide a su cliente que ejecute una herramienta, la solicitud que devuelve el resultado de la herramienta finaliza la solicitud. El mismo asistente de turno. OpenCodex envía esa solicitud al destino que emitió la llamada a la herramienta, siempre que como el objetivo todavía está habilitado, todavía en el combo y fuera de tiempo de reutilización. Esto vale para cada estrategia, incluyendo JEV, que omite su decisión para esa solicitud. El siguiente mensaje de usuario elige un objetivo con normalidad.

El seguimiento utiliza el hilo o el identificador de sesión del cliente, por lo que un cliente que no envía ninguno recibe una selección normal. Si el objetivo original no está disponible o falla, el combo falla como de costumbre, y el nuevo objetivo recibe las llamadas a herramientas anteriores en un formulario que acepta. Los modelos pensantes DeepSeek obtienen un espacio único Razonamiento marcador de posición para una llamada de herramienta que otro modelo emitió sin razonamiento. Gemini obtiene El marcador de posición de firma documentado de Google. Anthropic recibe una llamada de herramienta simple y resultado. Anterior versiones podrían enviar DeepSeek una llamada de herramienta desnuda aquí y fallar con `The reasoning_text in the
thinking mode must be passed back to the API`.

<a id="default-reasoning-effort"></a>

## Esfuerzo de razonamiento por defecto

`defaultEffort` suministra un esfuerzo configurado cuando el objetivo seleccionado tiene una escalera soportada no vacía conocida. Con el valor predeterminado `defaultEffortMode: "fallback"`, un esfuerzo explícito de la persona que llama tiene prioridad. `defaultEffortMode: "force"` anula un esfuerzo de llamada válido con el valor predeterminado configurado; requiere un esfuerzo no nulo válido `defaultEffort` y puede aumentar el costo y la latencia. El modo de fuerza es una elección explícita del operador a través de la configuración o administración combinada.

La escalera anunciada del objetivo sigue siendo autorizada. Se conserva un valor soportado exacto; de lo contrario, se selecciona el peldaño soportado más alto en o por debajo de él, o el peldaño soportado más bajo cuando ninguno es inferior. Las escaleras desconocidas o vacías nunca causan la inyección predeterminada. El modo de fuerza no repara el esfuerzo del llamador mal formado en una solicitud costosa válida. Otros campos de razonamiento, incluyendo `reasoning.summary`, se conservan.

`reasoningEffortMode` Sigue siendo independiente de `defaultEffortMode`Las escaleras vacías explícitas eliminan los controles de esfuerzo/pensamiento no soportados, y las escaleras adaptativas desconocidas también lo hacen, como se describe a continuación. Estrictas escaleras desconocidas preservan la petición de la persona que llama sin forzar un valor predeterminado. Los valores predeterminados soportados son `low`, `medium`, `high`, `xhigh`, `max`, y `ultra`; omitir `defaultEffort` o establecerlo para `null` para desactivar la inyección predeterminada en modo de reserva.

<a id="mixed-capability-groups-reasoningeffortmode"></a>

### Grupos de capacidades mixtas (`reasoningEffortMode`)

Los niveles de esfuerzo que anuncia un combo son la intersección de lo que anuncian sus objetivos. Un objetivo que anuncia explícitamente **no** control de esfuerzo toma parte en esa intersección, por lo que un solo La copia de seguridad sin esfuerzo vacía el selector de esfuerzo para todo el combo —, incluidos los objetivos que sí lo hacen apoyo afinación.

Establecer `reasoningEffortMode: "adaptive"` para excluir esas escaleras vacías de la publicación intersección en su lugar. El selector muestra los niveles que comparten los objetivos restantes, y el El objetivo sin esfuerzo sigue siendo elegible para el enrutamiento. Objetivos cuya escalera es simplemente *Desconocido* son tratados Comodines en ambos modos.

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

El valor predeterminado es `"strict"`, que mantiene el comportamiento original del selector. Esta configuración no cambia orden objetivo o política de conmutación por error. En el momento del despacho, una escalera de destino explícitamente vacía no tiene soporte. Esfuerzo/pensamiento controles eliminados en cualquier modo mientras se preservan los campos de razonamiento sin esfuerzo soportados como el `reasoning.summary`; `"adaptive"` aplica la misma normalización a un objetivo desconocido capacidad, mientras que los objetivos no vacíos conocidos mantienen su resolución de esfuerzo por objetivo existente. En el panel de control se encuentra la **Escala de razonamiento adaptativo** cambiar en un Sección de capacidades de combo.

<a id="image--multimodal-capability"></a>

## Capacidad de imagen / multimodal

De forma predeterminada, un combo publica el **intersección** de sus objetivos (la imagen es habilitado solo cuando cada objetivo lo anuncia). Establecer `imageInput: "disabled"` Para forzar sólo texto incluso cuando cada destino admite imágenes — el catálogo cae `image` Desde `inputModalities`, y Las solicitudes de soporte de imágenes se rechazan con HTTP 400 antes de que se llame a cualquier destino. `"auto"` (o omitiendo el campo) mantiene la intersección automática.

En el panel, el **Imagen / multimodal** El interruptor se puede activar siempre que cada objetivo tenga capacidades de entrada de imagen o texto conocidas. Los miembros de la imagen nativa permanecen sin cambios; los miembros de solo texto son solo texto declarado automáticamente en guardar (`modelCapabilities[model].inputModalities = ["text"]`) Así que [Visión Sidecar](/es/guides/sidecars/) describe sus imágenes. La pista del switch nombra el miembros que serán inscritos. Un miembro cuyas modalidades son desconocidas o no tienen entrada de texto (para ej., un modelo de solo audio) no puede ser cubierto por el sidecar; mantiene el conmutador En el caso de los niños. Si el [Visión Sidecar](/es/guides/sidecars/) está deshabilitado globalmente, permitiendo la switch muestra una advertencia vinculada al panel: la inscripción aún se guarda, pero las imágenes se reemplazan con una nota de omisión y las solicitudes continúan sin descripciones de imágenes hasta que el sidecar esté Rehabilitado. Desactivar el interruptor desactiva la entrada de imagen para el combo pero guarda esas declaraciones del proveedor, y `PUT /api/combos` acepta la misma inscripción que un nivel superior opcional `visionSidecarTargets` matriz de exactos `{ provider, model }` objetivos (solicitar-solamente; nunca se almacena en el combo y se rechaza mientras `imageInput` es
`"disabled"` cuando la lista de inscripción no está vacía). Entradas que ya aceptan entrada de imagen o se declaran sin texto se rechazan con HTTP 400 en lugar de sobrescribir, entradas el sidecar ya se omiten las portadas, y se rechaza un guardado antes de que la publicación restaure el combo y cada declaración juntos. Eliminar un miembro del combo no elimina su declaración de solo texto; editor de proveedores si ya no lo desea.

<a id="encrypted-v2-sub-agent-tasks"></a>

## Tareas de subagentes encriptadas v2

Hay una limitación importante para los subagentes Codex v2 ([Número 92](https://github.com/lidge-jun/opencodex/issues/92)) Un padre nativo puede enviar la tarea de un trabajador recién generado solo como texto cifrado acuñado para el nativo. ChatGPT backend. Un proveedor externo no puede leer esa carga útil.

Para una solicitud de este tipo, un combo filtra sus objetivos elegibles a rutas canónicas nativas ChatGPT, incluso después de un fallo reintentable. Si el combo no tiene un objetivo capaz de descifrar, opencodex se detiene antes de enviar y devolver HTTP 400:

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

1. Seleccione un modelo nativo de ChatGPT para el niño.
2. Agregue un destino canónico nativo ChatGPT al combo.
3. Utilice la superficie v1 para la delegación a través de diferentes proveedores.
4. Si controla al llamante, vuelva a enviar la tarea como texto sin formato v2 `agent_message` contenido.

Véase [Interfaz de subagentes](/es/guides/sub-agent-surface/) para los modos v1/base/v2 y el cifrado completo Flujo de trabajo de tareas.

<a id="manage-combos"></a>

## Administrar combos

<a id="dashboard"></a>

### Panel

Abra el panel de control local y elija **Modelos → Combos**. El espacio de trabajo crea, edita, renombra y elimina Combos. Sus selectores de modelos incluyen modelos ocultos: la visibilidad del catálogo solo controla el modelo externo listas, no selección Combo interna, y seleccionar un modelo oculto no lo hace visible externamente. El selector de destino aún excluye los proveedores deshabilitados, los combos anidados y el proveedor JEV solo para credenciales. **Crear JEV Auto** abre el mismo editor Combo con una plantilla de destino de decisión editable; Un existente `jev-auto` Se informa de id o alias en lugar de crear un duplicado. También se muestra un Combo JEV
**Servicio de decisión** (TypeSafe JEV o un `jev-decision` proveedor) y **Tiempo de espera de decisión (ms)**, y la descripción general de Combos enumera el servicio de decisión, el punto final y el tiempo de espera de cada Combo JEV.

Cada objetivo también muestra una insignia de cuota en vivo: **Disponible**, **Fuera de cuota**, o **Cuota desconocida**. El editor bloquea Guardar y Crear para la cuota solo cuando cada destino utilizable tiene un límite de inferencia agotado confirmado por el servidor actual para su credencial configurada. La cuenta, el modelo, la búsqueda y la cuota de MCP, o la evidencia de enrutamiento faltante o caducada, no causan este bloque. El bloqueo expira en el límite de reinicio o frescura aplicable y se vuelve a verificar cuando la página se vuelve activa o visible; Actualizar recarga tanto los datos combinados como la cuota. El panel El editor aún no ha publicado `cooldownMs` o `waitForCooldownMs`; utilizar el archivo de configuración o la gestión API hasta que la interfaz de usuario de seguimiento termine.

### CLI

Los comandos principales son:

```bash
ocx combo list
ocx combo show <id>
ocx combo set <id> --targets provider/model[:weight],...
ocx combo remove <id> --yes
```

`set` También acepta `--strategy`, `--sticky`, `--effort`, `--alias`, `--native-alias`,
`--allow-metered-targets on|off`, `--display-name`, `--description`, `--decision-provider`, `--decision-timeout`, y `--rename-from`. Uso `-` Como el valor de `--effort`, `--alias`, `--display-name`, `--description`, `--decision-provider`, o `--decision-timeout` a claro ese campo. Las dos banderas de decisión se aplican solo a `--strategy jev`. `--native-alias` requiere un nativo desnudo actualmente soportado alias de modelo y un nombre de visualización no vacío. `create` y `update` son alias para `set`; `delete` Es un alias para
`remove`; y los mismos subcomandos están disponibles bajo `ocx route combo`.

<a id="management-api"></a>

### API de administración

Los clientes sin cabeza usan `GET`, `PUT`, y `DELETE` on `/api/combos`. `GET` listas combo normalizado definiciones, `PUT` crea o reemplaza a uno (y puede cambiar el nombre de uno), y `DELETE` toma la consulta de id parámetro. La autenticación y los detalles de la solicitud / respuesta están en el
[Referencia de gestión API](/es/reference/management-api/). Cuando a `PUT` cuerpo omite `cooldownMs`
o `waitForCooldownMs`, el API conserva el valor ya almacenado para ese combo; enviar un valor para cambiarlo. Una explícita `cooldownMs` (incluso `60000`) se mantiene tal cual porque anula el retroceso de la tasa de solicitud. Un almacenado `cooldownMs` solo se puede eliminar editando el archivo de configuración;
`waitForCooldownMs` se restablece a su valor predeterminado cuando un `PUT` explícitamente envía `0`porque el escaso El serializer omite ese valor predeterminado. Omission conserva ambos valores y el panel de control no los expone todavía. Omisión `defaultEffortMode`, `reasoningEffortMode`, `imageInput`, o `cooldownWaitPolicy` igualmente mantiene el valor almacenado. Para una solicitud que se mantiene `strategy: "jev"`, el método de decisión se mantiene Solo cuando ambos `decisionProvider` y `decisionModel` se omiten: el envío de cualquiera de los Método de almacenamiento, así que `decisionModel: null` sin `decisionProvider` selecciona TypeSafe.
`decisionTimeoutMs` se mantiene por sí solo siempre que se omite. Una estrategia diferente deja caer a los tres, y un objetivo reenviado sin `lastResort` mantiene la bandera de ese objetivo (igualada por proveedor y modelo). El dashboard siempre envía `imageInput` y `reasoningEffortMode`, y para un JEV Combo `decisionProvider`, `decisionModel` y `decisionTimeoutMs` (`null` para el valor predeterminado), por lo que volver a cambiar a El valor predeterminado sigue sustituyendo al valor almacenado.

Para la configuración completa persistente, consulte [Configuración](/es/reference/configuration/).

<a id="configuration-reference"></a>

## Referencia de configuración

Los combos se almacenan en el nivel `combos` objeto, tecleado por id combo:

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
| `targets` | Sí | — | No vacío ordenado matriz de configurado `{ provider, model, weight?, lastResort? }` objetivos. Se rechazan los pares duplicados proveedor/modelo. |
| `targets[].weight` | No | `1` | Entero de 1 a 10.000. Utilizado por round-robin y aleatorio; ignorado por la conmutación por error, el menos utilizado, la ventana de reinicio y JEV. |
| `targets[].lastResort` | No | `false` | Marca un objetivo solo de emergencia. Inerte a menos que `cooldownWaitPolicy` está establecido. Nunca hace que un objetivo sea permanentemente inelegible: cuando no se puede alcanzar un objetivo normal, se envía como de costumbre. |
| `strategy` | No | `"failover"` | `"failover"`, `"round-robin"`, `"random"`, `"least-used"`, `"reset-window"`, o `"jev"`. JEV decide solo el objetivo inicial elegible y el esfuerzo; Combo ordinario posee intentos posteriores. |
| `stickyLimit` | No | `1` | Entero de 1 a 100 solicitudes exitosas por selección round-robin. Solo se aplica a round-robin. |
| `cooldownMs` | No | no establecido → upstream fallback (5 s para los códigos 429 de tasa de solicitud) `1302`/`1305`, 10 min para una ventana de uso gastada o un fallo de credencial/facturación, de lo contrario 60 s) | Entero de 1 a 600000. Cuando se establece, se aplica como el tiempo de reutilización por destino siempre que no se pueda usar de origen `Retry-After` o Codex señal de reinicio existe, incluyendo la tasa de solicitud 429s; cuando no está establecido, utiliza el fallback de origen. |
| `waitForCooldownMs` | No | `0` | Entero de 0 a 600000. Tiempo máximo para esperar el objetivo de enfriamiento elegible más temprano antes de regresar `combo_unavailable`El aborto cancela la espera. |
| `cooldownWaitPolicy` | No | unset | `"before-last-resort"` diferencie los objetivos marcados `lastResort`: se utilizan solo cuando no hay un objetivo normal disponible, para cada estrategia, y `waitForCooldownMs` solo agrega la espera de un objetivo normal de enfriamiento, por lo que en su `0` por defecto nada espera y el último recurso se utiliza tan pronto como no hay ningún objetivo normal está disponible. Solo esa cadena exacta se selecciona. La espera aplazada y la espera ordinaria comparten una `waitForCooldownMs` presupuesto por intento de selección. |
| `defaultEffort` | No | `null` | `low`, `medium`, `high`, `xhigh`, `max`, o `ultra`; resuelto contra la escalera anunciada de cada objetivo. |
| `defaultEffortMode` | No | `"fallback"` | `"fallback"` Conserva el esfuerzo explícito de la persona que llama. `"force"` anula el esfuerzo válido del llamante, requiere un valor predeterminado no nulo válido y puede aumentar el costo y la latencia. |
| `reasoningEffortMode` | No | `"strict"` | `"strict"` intersecta cada escalera de destino conocida, por lo que un objetivo que anuncia el control sin esfuerzo vacía el selector del combo. `"adaptive"` excluye esas escaleras vacías de la intersección publicada. En el despacho, las escaleras desconocidas explícitas vacías o adaptativas eliminan los controles de esfuerzo / pensamiento sin apoyo al tiempo que preservan los campos de razonamiento sin esfuerzo compatibles, como `reasoning.summary`; los objetivos no vacíos conocidos mantienen la resolución del esfuerzo existente. |
| `imageInput` | No | `"auto"` | `"auto"` o `"disabled"`. `"auto"` publica soporte de imágenes solo cuando cada objetivo soporta imágenes; `"disabled"` fuerza solo texto (cae la imagen de las modalidades publicadas y rechaza las solicitudes que llevan imágenes antes del envío). |
| `alias` | No | ninguno | ID de modelo público recortado opcional; use las reglas de alias anteriores. Un valor vacío se almacena como ningún alias. |
| `nativeAlias` | No | `false` | Permitir explícitamente un nativo desnudo actualmente soportado `alias` para tomar la prioridad de enrutamiento y catálogo. Nunca se infiere del alias. |
| `displayName` | No | ninguno | Etiqueta de catálogo limitada. Requerido y no vacío cuando `nativeAlias` Es cierto. |
| `description` | No | ninguno | Descripción de la fila del catálogo solo para mostrar, limitada como `displayName` (como máximo 128 caracteres, sin caracteres de control). Unset mantiene el valor generado `Routed via opencodex → combo (combo).` texto. Management API escribe que omita el valor guardado; una cadena vacía lo borra. |
| `decisionProvider` | No | `"jev"` | Solo JEV. Identificación del proveedor del servicio de decisión: `"jev"` (TypeSafe, válido sin una fila de proveedor; lo mismo que omisión) `adapter: "jev-decision"` fila con una decisión HTTPS completa URL o una HTTP local `/systemone` URL, como un Ollama autoalojado `tev1`. |
| `decisionTimeoutMs` | No | `4000` | Solo JEV. Entero de 1000 a 120000: la fecha límite de decisión antes de no abrirse al primer objetivo elegible. |

<a id="troubleshooting"></a>

## Solución de problemas

<a id="why-does-comboid-return-404"></a>

### ¿Por qué `combo/<id>` ¿Error 404?

La identificación combinada es desconocida. La respuesta es HTTP 404 con tipo `invalid_request_error`. Correr
`ocx combo list`, revise la ortografía y el caso, y confirme su comando de administración escrito al mismo ejecutando la instancia opencodex que recibe solicitudes de modelo.

<a id="why-do-i-get-combo_unavailable"></a>

### ¿Por qué tengo `combo_unavailable`?

Cada objetivo es actualmente inelegible: por ejemplo, su proveedor está deshabilitado, se está enfriando, ya se ha intentado para esta solicitud, o una tarea cifrada v2 la excluye. Comprobar el objetivo estado del proveedor y errores recientes de flujo ascendente. Cuando no se intentó ningún objetivo, el mensaje de error aparece Por ejemplo, por qué se omitió cada objetivo
`No available targets for combo: fast (openai/gpt-6: quota exhausted; anthropic/claude-opus-5-5: cooldown 42s)`. Para los tiempos de reutilización, siga una observación `Retry-After` valor primero; Los encabezados de restablecimiento Codex también tienen prioridad sobre `cooldownMs`. Si no se puede utilizar ninguna señal ascendente, el `cooldownMs` se aplica, o se aplica el fallback de origen cuando está desactivado (5 segundos para los códigos de tasa de solicitud `1302`/`1305`, 10 minutos para un uso gastado ventana o un fallo de credencial/facturación, de lo contrario 60 segundos). Explícito
`Retry-After` Los retrasos tienen un límite de 24 horas; los otros tiempos de reutilización tienen un límite de 10 minutos.

<a id="why-was-my-alias-rejected"></a>

### ¿Por qué fue rechazado mi alias?

Compruebe primero la gramática del alias y los nombres reservados. Un alias duplicado o una forma no válida se rechaza como HTTP 400. Se rechaza un alias recortado cuyo primer segmento es un espacio de nombres de cuenta Codex configurado. como HTTP 409; elija un espacio de nombres de alias diferente. El CLI y el panel de control muestran exactamente el servidor Mensaje de validación.

<a id="why-did-failover-stop-after-the-first-error"></a>

### ¿Por qué se detuvo la conmutación por error después del primer error?

El error fue terminal en lugar de específico del objetivo. Arreglar entrada inválida, reducir un contexto de gran tamaño, manejar un rechazo de política, o corregir el origen de la solicitud rechazada. Los combos no saltan para esos casos.
