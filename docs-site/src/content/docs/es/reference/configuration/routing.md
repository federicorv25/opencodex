---
title: "Configuración de enrutamiento"
description: "Selección de proveedor predeterminado, orden de resolución del modelo, alias combinados, ordenación de objetivos y valores predeterminados de esfuerzo."
---

El enrutamiento convierte el ID de modelo enviado por un cliente en un proveedor concreto y un modelo ascendente.

<a id="top-level-routing-fields"></a>

## Campos de enrutamiento de nivel superior

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `defaultProvider` | `string` | `"openai"` | El proveedor final se usa cuando no coincide ninguna regla de modelo anterior. Debe nombrar un proveedor configurado habilitado. |
| `combos?` | `Record<string, OcxComboConfig>` | `{}` | Virtual `combo/<id>` Modelos construidos a partir de objetivos de proveedor/modelo ordenados. |
| `routingProfiles?` | `Record<string, OcxRoutingProfileConfig>` | `{}` | Virtual `policy/<id>` modelos que seleccionan entre una lista explícita de candidatos utilizando requisitos de capacidad dura y puntuación determinista. |

<a id="model-alias-discovery"></a>

### Alias de modelo descubrimiento

Establecer `preferModelAliasIds: true` para publicar alias de modelo incorporados configurados o habilitados Como el `id` en `GET /v1/models`. El valor predeterminado es `false`. Las filas promocionadas retienen sus previa identificación calificada en `native_id` y mantener `alias_of`; ambos identificadores permanecen routable. Los modelos sin alias mantienen sus ID existentes. Si un alias corto es ambiguo a través de proveedores o está ensombrecida por otra ruta, la fila mantiene su identificación calificada todavía alcanza el modelo previsto. El ID calificado también se queda cuando un corto incorporado alias produciría un selector rápido sintético no analizable. El catálogo de modelos de Codex no ha cambiado.

<a id="codex-pool-low-quota-protection"></a>

### Codex Pool Protección de baja cuota

`codexPool.lowQuotaProtection` Se aplica sólo a los almacenados Codex Pool cuentas. La cuenta principal/de escritorio mantiene su bloqueo duro separado del 98%. La forma opcional es:

```json
{"codexPool":{"lowQuotaProtection":{"enabled":true,"threshold":80,"actions":{"pause":true,"notify":true,"desktop":true},"windows":{"short":true,"weekly":true}}}}
```

Ausencia o `enabled: false` Lo deshabilita. `threshold` es un porcentaje inclusivo finito de 1 hasta 100. Una directiva habilitada necesita al menos una acción verdadera y una ventana verdadera. A seleccionado 5 horas o activadores de ventana semanales en `usage >= threshold`; cualquier ventana seleccionada es suficiente. Sólo las observaciones nuevas aceptadas califican: no hay votación adicional, y sólo créditos, Las observaciones de uso fuera de rango en caché, expiradas, mensuales, solo de ventana personalizada y sin procesar se ignoran para esta política. Las barras de visualización todavía pueden sujetar porcentajes de origen no válidos. La política es independiente de cambio de cuenta proactivo.

Con `pause`, la cuenta deja la selección Pool en memoria antes de la siguiente solicitud. El servidor coalesces un config guardar después de la observación de turno y reintentos fallidos guarda durante un tiempo limitado. El apagado normal espera brevemente por las reservas pendientes. Un ahorro de tiempo que ya se está ejecutando permanece
`pending` hasta que realmente tenga éxito o falle; se cancela un guardado en cola. Un guardado fallido es visible en la historia del evento. Un reinicio antes de un guardado exitoso no puede conservar la pausa. Las solicitudes en vuelo mantienen su cuenta capturada. El curriculum vitae manual suprime la repetición a través de todas las ventanas altas actualmente para que cuenta hasta que una lectura por debajo del umbral o un nuevo límite de restablecimiento rearme una ventana. Un restablecimiento nunca reanuda una cuenta automáticamente.

Con `notify`, el servidor escribe una línea de registro local con ventana y porcentaje pero sin ID de cuenta y registra un evento limitado. Autenticado `GET /api/codex-auth/low-quota-events` Sólo expone eventos de ese servidor, incluyendo ID de cuenta, ventana, porcentaje de uso, tiempo de restablecimiento conocido, y estatus. El estado predeterminado es `logged`: la alerta solo alcanzó el registro y el historial de eventos. Cada cuenta/ventana se registra una vez por episodio local del servidor.

Opcional `actions.desktop: true` (requiere `notify: true`) también entrega cada aviso a la Notificador del sistema operativo de la máquina que ejecuta el proxy: `/usr/bin/osascript` en macOS, o
`notify-send` Desde `/usr/bin`, `/usr/local/bin` o `/bin` en Linux. La notificación nombra la cuenta solo por su etiqueta de registro seudónima (por ejemplo `p1a2b3c`), nunca su correo electrónico, alias o id, y incluye la ventana, el uso, el umbral y el tiempo de reinicio conocido. Windows y hosts sin soporte Notificador mantener la alerta `logged`. `delivered` significa que el notificador del sistema operativo aceptó la notificación; no puede ver si la configuración de notificación del sistema lo oculta. Un notificador fallido o con tiempo de espera es Registrado como `failed`; una observación elegible al menos cinco minutos después puede volver a intentarlo, sin Repetir la línea de registro. Turning `desktop` encendido o apagado se aplica a la siguiente observación sin reiniciar. Un aviso aún en vuelo se cancela en el cierre, y cuando la siguiente observación de cuota detecta que su episodio terminó (reset limit, recovery, eliminación de la cuenta o cambio de política); hasta entonces el notificador está limitado por un tiempo de espera de cinco segundos.

<a id="model-resolution-order"></a>

## Orden de resolución del modelo

opencodex resuelve el modelo solicitado en este orden:

1. Un configurado `policy/<id>` o alias de perfil de enrutamiento, ejecutando el evaluador de políticas y el enrutamiento El candidato seleccionado. Una no resuelta `policy/<id>` Cae a través de las reglas posteriores.
2. Un configurado `<account-selector>/<native-openai-model>` espacio de nombres, enrutado a través de exactamente el asignada cuenta Codex almacenada. Un objetivo exacto no válido o no disponible no se cierra.
3. Un canónico `combo/<id>` o alias combinado configurado. Los ID canónicos ganan antes de alias coincidente.
4. Una explícita `<provider>/<model>` espacio de nombres cuyo prefijo nombra un proveedor configurado.
5. Un id de familia OpenAI nativo desnudo tal como `gpt-*`, `o1-*`, `o3-*`, o `o4-*`, enrutado a través de la canónico habilitado `openai` proveedor.
6. Una coincidencia exacta para un proveedor `defaultModel`.
7. Un prefijo de modelo de familia de proveedor conocido.
8. Un modelo exacto en la configuración de un proveedor `models` lista.
9. `defaultProvider`, preservando el ID de modelo solicitado.

Se excluyen los proveedores discapacitados. Un espacio de nombres explícito para un proveedor deshabilitado falla en lugar de cayendo a través. Las entradas del proveedor se comprueban en su orden de inserción JSON para las reglas que pueden coincidir más de un proveedor, así que use espacios de nombres explícitos cuando un modelo desnudo podría ser ambiguo.

<a id="blocked-model-redirects"></a>

### Redireccionamientos de modelo bloqueado

`blockedModelRedirects` es un nivel superior opcional `Record<string, string>` de resolución exacta reemplazos de model-id, no establecidos por defecto. Las teclas desnudas aún coinciden con el modelo nativo **después** proveedor, cuenta, y resolución de alias. Un objetivo sin un proveedor configurado explícito y diferente mantiene que el proveedor y la cuenta seleccionados y reemplaza solo el id del modelo ascendente, una vez. Esto preserva asignaciones existentes de valores desnudos y barras diagonales, incluidas las asignaciones en solicitudes calificadas por el proveedor.

Un objetivo que nombra explícitamente a **proveedor configurado diferente** (Por ejemplo,
`google-antigravity/gemini-3.8-flash-high`En su lugar, las rutas a través de ese proveedor. Un exacto
`<source-provider>/<resolved-model>` la clave con tal objetivo tiene prioridad sobre una clave desnuda; otras claves calificadas no tienen efecto. Las redirecciones de proveedores cruzados pueden encadenarse a través de alias resueltos, con un límite de cinco bordes compartido y detección de ciclo. Un selector de cuenta anclado nunca deja su cuenta: un objetivo de proveedor cruzado no se cierra, ya sea que su clave esté descubierta o calificada para la cuenta. El destino utiliza sus propias credenciales y cuota, y nunca hereda campos de cuenta de origen; una llamada `Authorization` Se elimina el encabezado dirigido a la ruta de origen, como para las rutas combinadas y de política. Un destino deshabilitado, un destino directo o un destino clave/OAuth sin almacenamiento utilizable credenciales mantiene el comportamiento heredado de la ruta de origen. Bajo una política de enrutamiento, cada destino de redirección debe ser un candidato elegible declarado, incluso cuando mantiene el mismo proveedor. El conjunto de proveedores/modelos elegibles de la evaluación inicial permanece fijo a través de fallback y subagente recuperación. Los reintentos usan candidatos concretos, por lo que un alias combinado no puede reemplazar el destino de un candidato. Diferentes candidatos que resuelven un destino ya intentado no envían el turno allí de nuevo. Un modelo virtual elegible mantiene su mapeo normal de modelo de cable sin agregar ese identificador de cable al Perfil de los candidatos permitidos. Si se salta un reemplazo local, la reserva retiene el último fallo de origen. Los mapas de redirección mal formados se ignoran con una advertencia bajo carga y se rechazan en las escrituras de configuración. Registro de rutas redirigidas `blocked-model-redirect`; omitir la configuración deja el enrutamiento sin cambios.

```json
{
  "blockedModelRedirects": { "gpt-5.6-terra": "gpt-5.6-luna" }
}
```

<a id="exact-codex-account-selectors"></a>

## Selectores de cuenta Codex exactos

`codexAccountNamespaces` un selector público como `side` a una cuenta Codex almacenada. A Solicitud de `side/gpt-5.6-sol` utiliza sólo esa cuenta, incluso cuando el canónico `openai` El proveedor es en el modo Direct, y envía la `gpt-5.6-sol` id del modelo de origen. Solo la familia OpenAI nativa desnuda ids son válidos después del selector. ID de cuenta-espectrales observados en el catálogo de modelos actual de Codex pueden también se conservan exactamente cuando aún no forman parte del conjunto estático de opencodex; la observación debe llevar la forma del campo de una fila de catálogo real, permanece calificado para su selector de cuenta coincidente, y nunca es promovido a la lista global de modelos desnudos. Esa forma comprueba los filtros mal formados y mínimos filas — no es un control de confianza, porque la caché de los modelos es un archivo propiedad del usuario y una completa La fila escrita a mano es indistinguible de una observación de origen. Nada nuevo se convierte en routeable: a desnudo `gpt-*` id bajo un selector de cuenta es aceptado por el router independientemente del catálogo.

La selección exacta evita la estrategia de asignación Pool y la afinidad de hilos ordinaria. Si el cuenta falta, está en pausa, se está enfriando, no se puede utilizar o requiere reautenticación, la solicitud falla cerrado en lugar de cambiar de cuenta y no cambia la cuenta activa Pool. Cuando por lo menos una El selector elegible está configurado, los catálogos de Codex ocultan las filas del selector nativo desnudo y enumeran una lista separada
`<selector>/<native-openai-model>` fila para cada selector. Los identificadores nativos desnudos retienen Pool/Direct normal Enrutamiento y permanecer en bruto `/v1/models` descubrimiento a menos que esté explícitamente deshabilitado. Selectores cuyos mapas La cuenta almacenada no se anuncia. La validación del selector, las reglas de colisión y la guía de privacidad están documentadas en
[Configuración del proveedor](/es/reference/configuration/providers/).

La página Auth de Codex expone este comportamiento del selector como un opt-in. Deshabilitar oculta generado seleccionador-calificado filas y restaura las filas ordinarias GPT, pero no elimina la Mapeo o cambio exacto `<selector>/<model>` enrutamiento. Por lo tanto, volver a habilitar restaura el mismo público etiquetas. La cuenta y el ajuste de las mutaciones se mantienen antes de una actualización de catálogo limitada; un `ocx sync`
aviso significa solo que el catálogo de selectores aún necesita convergencia, no que el cambio de enrutamiento fue perdido.

## Combos (`config.combos`)

Cada clave combinada es un id que coincide `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`. Siempre es directamente direccionable como `combo/<id>` También puede exponer una `alias`. Los alias deben ser únicos, no pueden ocupar la `combo/`
espacio de nombres, y no pueden usar familias nativas desnudas reservadas como `gpt-*`, `o1-*`, `o3-*`, `o4-*`, o
`codex-*` a menos que `nativeAlias: true` explícitamente habilita el contrato de compatibilidad de escritorio.

| Clave | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `targets` | `{ provider: string; model: string; weight?: number; lastResort?: boolean; metered?: boolean }[]` | requerido | Rutas concretas ordenadas. `weight` es 1–10000 y por defecto `1`. `lastResort` marca un objetivo solo de emergencia; vea `cooldownWaitPolicy`. `metered: true` requiere consentimiento de clave o consentimiento combinado solo de loopback; ver [consentimiento](/es/guides/combos/#metered-fallback-consent). |
| `allowMeteredTargets?` | `boolean` | `false` | Consentimiento del operador para llamadas locales en un proxy de solo loopback. Un oyente que no es de bucle de retorno desactiva esta bandera; las personas que llaman con clave configurada y vinculada aún necesitan consentimiento de clave. |
| `strategy?` | `"failover" \| "round-robin" \| "random" \| "least-used" \| "reset-window" \| "jev"` | `"failover"` | Estrategia de selección. El orden objetivo es prioridad de conmutación por error; los pesos forman sorteos redondos y aleatorios; el menos utilizado sigue a los éxitos registrados; la ventana de reinicio sigue al restablecimiento de cuota más rápido; JEV toma una decisión limitada para el objetivo y el esfuerzo iniciales elegibles, luego usa la reserva ordenada ordinaria. |
| `stickyLimit?` | `number` | `1` | Solicitudes exitosas retenidas en un lote round-robin. Rango 1–100. Solo se aplica a round-robin. |
| `cooldownMs?` | `number` | no establecido → upstream fallback (5 s para los códigos 429 de tasa de solicitud) `1302`/`1305`, en caso contrario 60 s) | Rango 1–600000. Cuando se establece, se aplica siempre que no se pueda usar de origen `Retry-After` o Codex señal de reinicio existe, incluyendo la tasa de solicitud 429s; cuando no está establecido, utiliza el fallback de origen. Las señales ascendentes tienen prioridad. Un explícito ascendente `Retry-After` se limita a las 24 horas; los enfriamientos derivados, configurados y de reserva se limitan a los 10 minutos. |
| `waitForCooldownMs?` | `number` | `0` | Esperar al máximo el objetivo de enfriamiento elegible más temprano en cada intento de selección. Rango 0–600000; un aborto cancela la espera. Un combo de un solo objetivo con una espera distinta de cero mantiene la solicitud hasta este techo y vuelve a intentar el mismo objetivo en lugar de fallar inmediatamente; si nunca se envió ningún objetivo, la espera termina en `combo_unavailable`, de lo contrario se devuelve el último fallo de origen. |
| `cooldownWaitPolicy?` | `"before-last-resort"` | unset | Defiende objetivos marcados `lastResort`: se utilizan solo cuando no hay un objetivo normal disponible, para cada estrategia. `waitForCooldownMs` solo agrega la espera de un objetivo normal de enfriamiento, por lo que en su `0` por defecto nada espera y el último recurso se utiliza tan pronto como no hay ningún objetivo normal está disponible. El aplazamiento y la espera ordinaria comparten uno `waitForCooldownMs` presupuesto por intento de selección. Solo esa cadena exacta se inscribe; `lastResort` Es inerte sin ella. |
| `defaultEffort?` | `"low" \| "medium" \| "high" \| "xhigh" \| "max" \| "ultra" \| null` | unset | `defaultEffort` llena un ausente `reasoning.effort` en modo de reserva, o anula el esfuerzo válido del llamante en modo de fuerza explícita cuando el combo tiene un valor predeterminado no nulo y el objetivo seleccionado tiene una escalera conocida, no vacía. Si el destino admite el valor configurado, se retiene; de lo contrario, se usa el peldaño soportado más alto en o por debajo de él, o el peldaño soportado más bajo cuando ninguno es inferior. Las escaleras desconocidas o vacías omiten el valor predeterminado. |
| `defaultEffortMode?` | `"fallback" \| "force"` | `"fallback"` | Preserva la precedencia del llamante por defecto. La fuerza explícita requiere un valor predeterminado válido, respeta la capacidad de destino y puede aumentar el costo y la latencia. `reasoningEffortMode` Sigue siendo independiente. |
| `reasoningEffortMode?` | `"strict" \| "adaptive"` | `"strict"` | `"strict"` intersecta todas las escaleras de destino conocidas, incluidas las vacías; `"adaptive"` excluye las escaleras vacías. Las escaleras desconocidas son comodines de catálogo en ambos modos. Al momento, las escaleras vacías explícitas eliminan los controles de esfuerzo/pensamiento en ambos modos; las escaleras desconocidas lo hacen solo en adaptativo. `reasoning.summary` se conserva. Los objetivos no vacíos conocidos conservan su resolución de esfuerzo, y la selección/orden del objetivo no cambia. |
| `imageInput?` | `"auto" \| "disabled"` | `"auto"` | `"auto"` publica imágenes solo cuando cada objetivo admite imágenes; `"disabled"` fuerza solo texto (cae la imagen de las modalidades publicadas y rechaza las solicitudes que llevan imágenes antes del envío). |
| `alias?` | `string` | — | id modelo público opcional en lugar de la babosa selector canónica. |
| `nativeAlias?` | `boolean` | `false` | Deje que un id nativo desnudo actualmente soportado tenga prioridad solo para ese id no calificado. Desnudo `gpt-5.6-*` Los identificadores usan credenciales Codex Pool/Direct. Las rutas calificadas para la cuenta siguen siendo distintas. Rutas calificadas por el proveedor, como `openai-apikey/gpt-5.6-*` utilizar su ruta API-key configurada y nunca pasar al alias nativo. |
| `displayName?` | `string` | — | Etiqueta de catálogo solo para mostrar, requerida y no vacía para un alias nativo. |
| `decisionProvider?` | `string` | `"jev"` | `strategy: "jev"` Sólo. `"jev"` (lo mismo que omitirlo, y almacenado como omisión) es el servicio de decisión TypeSafe, válido sin una fila de proveedor; cualquier otro valor debe nombrar a un proveedor configurado con `adapter: "jev-decision"` y una decisión HTTPS completa `baseUrl` (cualquier ruta) o un HTTP local `/systemone` punto final. Userinfo, cadenas de consulta y fragmentos son rechazados. |
| `decisionModel?` | `string` | unset | `strategy: "jev"` mutuamente excluyentes con `decisionProvider`. Una ruta opencodex ordinaria (por ejemplo `ollama/qwen3:4b`) se le pidió que escogiera una opción ofrecida JSON. Se ejecuta con las credenciales almacenadas del proveedor seleccionado, nunca las del llamante, y no puede resolver este combo, ninguna JEV combo, o un `jev-decision` fila. |
| `decisionTimeoutMs?` | `number` | `4000` | `strategy: "jev"` Sólo. Plazo de decisión antes de fallar abierto, 1000–120000 ms. |
| `decisionQuotaSignals?` | `boolean` | `false` | Solo JEV. Explícito `true` envía la evidencia de la cuota de asesoramiento cargada al backend seleccionado; nunca cambia la elegibilidad dura o la selección de la cuenta. |
| `decisionQuotaTiers?` | `{ moderate?: number; limited?: number; nearlyExhausted?: number }` | `{ limited: 70, nearlyExhausted: 90 }` | Solo JEV. Las anulaciones parciales se fusionan con los valores predeterminados; los valores finitos 0–100 deben ser estrictamente ascendentes. `moderate` ausente a menos que sea explícito. No permite señales por sí mismo. |

La configuración de cuotas, la privacidad y la semántica de grupos desconocidos se describen en
[Señales de cuota de asesoramiento para JEV](/es/guides/combos/#advisory-quota-signals-for-jev). Entornos omitidos sobreviven JEV API actualizaciones/renombrar; `null` Claros, `false` Desactiva las señales sin borrar niveles y cambiar a otra estrategia elimina ambas configuración.

```json
{
  "defaultProvider": "openai",
  "combos": {
    "coding": {
      "targets": [
        { "provider": "anthropic", "model": "claude-sonnet-5" },
        { "provider": "openrouter", "model": "qwen/qwen3-coder-plus" }
      ],
      "strategy": "failover",
      "defaultEffort": "high",
      "alias": "coding-primary"
    }
  }
}
```

Para el comportamiento de la estrategia, fallas reintentables, tiempos de reutilización, límites de tareas encriptados v2 y administración comandos, ver [Combos](/es/guides/combos/).

Los `jev` La estrategia es opcional. Solo el método TypeSafe, utilizado cuando `decisionProvider` ni
`decisionModel` se establece, requiere el canónico `jev` credencial de proveedor. Ese proveedor es un servicio de decisión, no publica ningún modelo directamente encaminable y no puede ser un objetivo combinado. JEV ve Actualmente sólo los miembros elegibles de `targets`; faltante, fallo, o decisiones inválidas use el primer miembro elegible, mientras que la cancelación de llamadas sigue siendo terminal. Agregar el proveedor o Combo nunca cambios `defaultProvider` u oculta las filas del modelo directo. Véase
[Método de decisión](/es/guides/combos/#decision-method) para los tres métodos, configuración, límites de privacidad y el contrato de una decisión por llamada. APILos alcances de proveedor/modelo clave también se aplican a TypeSafe Si la clave niega el destino de decisión opcional, no se envía ninguna solicitud de decisión; la reserva de inferencia elegible ordinaria todavía tiene que satisfacer el alcance de esa clave.

<a id="self-hosted-decision-model-eg-ollama-tev1"></a>

### Modelo de decisión autoalojado (e.g. Ollama tev1)

`decisionProvider` puede apuntar un Combo JEV en un modelo de decisión autoalojado compatible con Jev-API, como Ollama `tev1` (Ollama 0.35+, `POST /v1/systemone`, sin clave API):

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
      "targets": [
        { "provider": "openai", "model": "gpt-5.6-sol" },
        { "provider": "openai", "model": "gpt-5.6-luna" }
      ]
    }
  }
}
```

La fila `baseUrl` es el punto final de la decisión completa y debe terminar en `/systemone`Su modelo es
`defaultModel`, si no `models[0]` (una fila con ninguno de los dos falla sin una solicitud). Loopback necesita El propio explícito de la fila `allowPrivateNetwork: true`y claro `http:` Se acepta sólo para `localhost`
o un literal de dirección loopback/RFC 1918/ULA alcanzado sin proxy. Solo la propia fila `apiKey` es envió — ninguno cuando está sin configurar — y una clave que hace referencia a las variables de entorno TypeSafe u otra La entrada de llavero del proveedor es rechazada, por lo que las credenciales TypeSafe nunca llegan a ella. Las opciones se envían como cadenas de descripción, que Ollama requiere. `tev1` fue entrenado en las opciones 2–24, así que mantenga el objetivo × pares de esfuerzo en 24 o menos (menos de 2 o más de 26 no abren sin una solicitud); su contexto efectivo es de aproximadamente 2k tokens y OpenCodex recorta el texto de la tarea a 500 caracteres. Mantenga la modelo de residente (`OLLAMA_KEEP_ALIVE=-1`) y subir `decisionTimeoutMs` para servicios lentos; ver
[Servidor compatible con System One](/es/guides/combos/#system-one-compatible-server). En el panel de control, elija **Servidor compatible con System One** en el Combo de JEV **Método de decisión**
sección bajo **Modelos → Combos**, a continuación, elija la fila y establecer **Tiempo de espera de decisión (ms)**.

<a id="routing-policy-profiles-configroutingprofiles"></a>

## Perfiles de las políticas de enrutamiento (`config.routingProfiles`)

Los perfiles de directiva de enrutamiento son la capa de selección de Inteligencia de router: una solicitud explícita
`policy/<id>` (o alias configurado) selecciona entre una lista de permisos candidata fija usando capacidad dura requisitos y puntuación determinista y explicable. Una explícita `policy/<id>` Solicitud (o a ej., alias configurado) ejecuta el evaluador y encamina al candidato seleccionado. Los modelos existentes son
**nunca** Enrutado a través de un perfil implícitamente: el `policy/` espacio de nombres y alias de perfil son los solo los puntos de entrada, y ambos se validan con el orden de resolución del modelo anterior.

Cada clave es un id que coincide `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`, siempre direccionable como `policy/<id>`, con una opción `alias`. Los alias deben ser únicos y no pueden colisionar con proveedores configurados. la `<provider>/<model>` Enrutamiento de namespace, combos, espacios de nombres de cuenta de codex, el `policy/`
espacio de nombres, o familias nativas desnudas reservadas (`gpt-*`, `o1-*`, `o3-*`, `o4-*`, `codex-*`).

| Clave | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `candidates` | `{ provider: string; model: string }[]` | requerido | Lista explícita de `provider/model` refs. No hay expansión implícita. |
| `alias?` | `string` | — | Modelo público opcional en lugar de `policy/<id>`. |
| `require?` | objeto | `{}` | Requisitos de capacidad dura evaluados antes de la puntuación (ver más abajo). |
| `optimize?` | objeto | latencia 0,55, salud 0,25, costo 0,10, cuota 0,10 | Pesos de puntuación, normalizados determinísticamente. `health`, `quota`, y `cost` tiene dimensiones de puntuación; la cuota de prioridad configurada es `1 - health - quota - cost` (por defecto 0,55), y `latency` se pliega en esa cuota de prioridad en lugar de anotar independientemente. |
| `limits?` | objeto | — | Límites difíciles. `maxEstimatedCostUsd` excluye a un candidato cuando se conoce su costo estimado y por encima del límite. Cuando se establece ese límite, `onUnknownCost` (`"allow"` por defecto, o `"exclude"`) controla las estimaciones desconocidas: permitir evita una exclusión específica de la tapa y los registros `cost.capOutcome: "unknown-allowed"`; excluir emite `cost-limit-unknown` y `capOutcome: "unknown-excluded"`. `onUnknownCost` solo (sin tapa) es inerte. Separado de `unknownEvidence.cost`, que todavía puede excluir o penalizar precios desconocidos a través de `unknown-price` / puntuación. |
| `unknownEvidence?` | objeto | capacidad `exclude`, salud/cuota/coste `penalize` | Cómo se trata la evidencia desconocida por dimensión: `allow`, `penalize`, o `exclude`. Desconocido nunca se convierte en cero. |

`require` soporta: `minContextWindow` (entero positivo), `minQuotaHeadroom` (0...1 fracción), y los booleanos `tools`, `imageInput`, `structuredOutput`, `localOnly`, `remoteAllowed`,
`encryptedCodexTasks`; más `reasoningEffort` y `serviceTier` cuerdas.

Porque `unknownEvidence.capability`, `penalize` Actualmente se comporta como `allow`: el puntuar tiene solamente un componente de prioridad configurada hasta que se envíe una dimensión de puntuación de capacidad (planificada con RI-06+),
`penalize` No se puede cambiar el candidato seleccionado.

La evidencia de solicitud se evalúa contra las capacidades candidatas junto con el perfil. `require`
bloque; un candidato debe satisfacer a ambos para ser elegible. En la ruta de solicitud en vivo, el proxy deriva herramientas y evidencia de entrada de imágenes del cuerpo de la solicitud; tamaño de la ventana de contexto y el resto las dimensiones de la evidencia permanecen desconocidas en el momento de la ruta. Utilice la ejecución en seco API/CLI para inspeccionar el superficie de evidencia para perfiles sensibles al contexto.

El CLI dry-run acepta indicadores de solicitud-evidencia, pero aún no puede proporcionar evidencia de capacidad candidata; pruebas candidatas se proporciona a través de la API (`POST /api/routing-profiles/dry-run`).

```json
{
  "routingProfiles": {
    "fast": {
      "alias": "ocx/fast",
      "candidates": [
        { "provider": "anthropic", "model": "claude-sonnet-5" },
        { "provider": "openai", "model": "gpt-5.6-sol" }
      ],
      "require": { "tools": true, "minContextWindow": 128000 },
      "optimize": { "latency": 0.55, "health": 0.25, "cost": 0.10, "quota": 0.10 },
      "limits": { "maxEstimatedCostUsd": 0.50, "onUnknownCost": "allow" },
      "unknownEvidence": {
        "capability": "exclude",
        "health": "penalize",
        "quota": "penalize",
        "cost": "penalize"
      }
    }
  }
}
```

CLI: `ocx route policy list [--json]`, `ocx route policy show <id> [--json]`, y
`ocx route policy dry-run <id> [--model-context <tokens>] [--tools] [--image] [--structured-output] [--json]`. Dry-run evalúa a los candidatos sin enviar ninguna solicitud previa.

Pruebas de cuota (`optimize.quota`, `require.minQuotaHeadroom`, `unknownEvidence.quota`) viene de cuenta clave Codex y cachés de cuotas Anthropic. Un candidato en entorno de ejecución recibe cuota en caché solo cuando La evidencia ya identifica la cuenta. Canónico no vinculado `openai` y Anthropic candidatos permanecer desconocido durante la evaluación de políticas porque Pool selección, Direct identidad del llamante, proveedor rotación y afinidad de hilos se resuelven después de que la política elija un proveedor/modelo; un proceso activo La cuenta no se utiliza como sustituto. La evidencia de cuotas nunca cambia la selección de cuentas, afinidad de sesión, tiempos de reutilización o comportamiento de conmutación — solo alimenta la puntuación de la política. Para ver el comportamiento consciente de la cuota en una ejecución en seco de API, proporcione las refs de cuenta en Las pruebas candidatas enviadas a `POST /api/routing-profiles/dry-run`:
`candidates[].codexAccountId` (Codex grupo, proveedor `openai`) `candidates[].accountRef`
(Anthropic) deriva la cuota de cuenta en caché coincidente; una `candidates[].quota` El objeto es Echo como dado. La ejecución en seco de CLI no puede suministrar estos campos de cuenta por candidato.

<a id="combos-vs-policy-profiles"></a>

### Combos vs perfiles de políticas

- A **combo** es un enrutamiento de destino explícito con una estrategia seleccionable (failover ordenado, Equilibrio ponderado o aleatorio, menos utilizado, ventana de reinicio o una decisión de primera selección JEV limitada): la estrategia configurada decide, y los fallos reintentables avanzan a través de la lista.
- A **perfil político** es una selección basada en la evidencia entre los candidatos configurados: capacidad difícil Los requisitos se filtran primero, luego la puntuación determinista clasifica a los sobrevivientes.

Ambos son espacios de nombres virtuales con alias y validación de colisión; difieren en *cómo* un candidato es elegido. La puntuación de perfil combina el componente de prioridad configurada con la salud (RI-06), cupos (RI-07) y costos (RI-08) en los que hay pruebas; `latency` peso se pliega en la cuota de prioridad en lugar de anotar de forma independiente. El costo también se aplica a través de la
`limits.maxEstimatedCostUsd` un candidato cuyo costo estimado se conoce y excede el límite es excluidos (`cost-limit`) Cuando se configura un límite y la estimación es desconocida, el valor predeterminado `limits.onUnknownCost: "allow"`
registros `cost.capOutcome: "unknown-allowed"` en el trazado de decisión de ruta sin exclusión de límite; conjunto `onUnknownCost: "exclude"` para un techo cerrado (`cost-limit-unknown`) El resultado final no es elegibilidad general — `unknownEvidence.cost: "exclude"` todavía puede añadir `unknown-price` y marcar el Candidato no elegible. Los rastros de decisión de ruta por solicitud se registran cuando se ejecuta un perfil de directiva.

<a id="catalog-eligibility"></a>

### Elegibilidad del catálogo

Un combo permanece directamente enrutable incluso cuando no se puede enumerar. `ocx sync`, `/v1/models`, y el El selector Codex lo lista solo cuando cada destino expone capacidades que pueden ser intersectadas:

- a positivo `contextWindow`, desde metadatos en vivo, sugerencias de registro, proveedor
  `modelContextWindows` / `contextWindow`, un conocido positivo `maxInputTokens` en la fila de miembros, o — cuando el proveedor es conocido y está habilitado, pero cada fuente aún omite una ventana — a conservador 128,000-token fallback (sujetado por `providerContextCaps` cuando se establece); y
- Un no vacío `inputModalities` intersección, tratando un valor de miembro omitido como `["text"]`.

Un objetivo en un proveedor discapacitado (incluso con una fila de descubrimiento completa), en un proveedor desconocido con ninguna fila de descubrimiento, o destinos con modalidades disjuntas, elimina el combo del catálogo. Sincronización emite una advertencia de resumen y el panel lo marca **Necesita atención**. Añadir metadatos de contexto, alinear modalidades o modelos objetivo con capacidades compatibles detectables.

<a id="request-history-and-routing-analytics"></a>

## Historial de solicitudes y análisis de enrutamiento

- `GET /api/request-history` - cursor-paginado historia completa de la derivada índice (`routing-history.sqlite`), con filtros (`provider`, `model`,
  `requestedModel`, `status`, `conversationId`, `surface`, `inboundProtocol`,
  `apiKeyId`, `profileId`, `fallback`, `from`, `to`) y opaco `cursor`
  Paginación. `GET /api/request-history/:requestId` devuelve una fila canónica.
- `GET /api/request-history/:requestId/route-decision` - el por qué-esta-ruta explicación: traza (candidatos, exclusiones, componentes de puntuación, perfil + ej., revisión), secuencia de intentos de ejecución y resultado final.
- `GET /api/routing-analytics` - tasas de éxito/fracaso/cancelado/retroceso, duración p50/p95/p99 y TTFT, velocidad de transmisión incompleta, activación por tiempo de reutilización fallas, costo por solicitud exitosa, cobertura, confianza y un bandera de truncamiento explícita.
- `GET /api/routing-profiles`, `POST /api/routing-profiles/dry-run` - perfil inspección y evaluación en seco (sin despacho previo).

El historial devuelto y las cargas útiles de decisión de ruta exponen solo los metadatos de solicitud enmascarados (Por ejemplo, opaco) `apiKeyId` etiquetas). No incluyen credenciales, cuerpos rápidos, o secretos del proveedor.

CLI: `ocx logs history`, `ocx logs get <request-id>`,
`ocx logs explain <request-id>`, `ocx logs rebuild-index`,
`ocx logs index-status`, `ocx route policy list | show | dry-run | evaluate`.

<a id="migration"></a>

## Migración

`routingProfiles` es opcional y aditivo: los archivos de configuración existentes cargan sin cambios. Viejo `usage.jsonl` filas sin `routeDecision` analizar sin cambios. El índice de historia es desechable - borrar `routing-history.sqlite` disparadores Una reconstrucción automática de `usage.jsonl` en la siguiente consulta; `ocx logs
rebuild-index` fuerzas uno. Una vez `usage.jsonl` alcanza 1 MiB, una reconstrucción se ejecuta en un hilo de trabajo, por lo que el proxy sigue sirviendo solicitudes mientras se ejecuta. Hasta que termina, las consultas de historial lo esperan y los perfiles de enrutamiento tratan el histórico salud como evidencia desconocida (el perfil `unknownEvidence.health` política aplica). Nada en este sistema ajusta automáticamente los pesos, presupuestos o candidatos. conjuntos.
