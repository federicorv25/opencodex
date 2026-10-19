---
title: "Windows Crecimiento de memoria"
description: "Por qué el proceso de bollo puede crecer a muchos gigabytes de RAM en Windows, lo que opencodex hace al respecto hoy y sus opciones hasta que la Bun ascendente se solucione."
---

Algunos usuarios de Windows ven el `bun` proceso detrás de opencodex crecer a muchos gigabytes de RSS durante largas sesiones de transmisión (reportados como problema)
[#314](https://github.com/lidge-jun/opencodex/issues/314)) Esta página explica lo que realmente está sucediendo y lo que puedes hacer al respecto, honestamente.

<a id="root-cause-upstream-bun-runtime-issues"></a>

## Causa raíz: problemas de entorno de ejecución Bun ascendentes

opencodex agrupa el entorno de ejecución Bun (actualmente **1.3.14**) El crecimiento de la memoria es impulsado por problemas conocidos de Bun ascendente, no por fugas a nivel de JavaScript en el proxy:

| Problema con Bun | Estado (comprobado 2026-07-23) |
|---|---|
| [#28035](https://github.com/oven-sh/bun/issues/28035) — `fetch()` recibir contrapresión no acoplada al consumo de JS | Fijo por [P.R. :29831](https://github.com/oven-sh/bun/pull/29831); **que la liberación lleva no está verificada** — suponemos que el paquete 1.3.14 no |
| [#32111](https://github.com/oven-sh/bun/issues/32111) — se bloquea cuando un cliente cancela una transmisión asincrónica | Arreglar [PR +32120](https://github.com/oven-sh/bun/pull/32120) fusionó 2026-06-21; no se asume presente en 1.3.14. Nota: este crash es **no es específico de Windows** (también reproducido en macOS/Linux) |
| [P.R. :31654](https://github.com/oven-sh/bun/pull/31654) — `node:net` gotera de mango de enchufe | Todavía **abierto** de origen |

En Windows, opencodex debe mantener las respuestas de transmisión en un código conservador camino para evitar el bloqueo .32111, y ese camino es el más expuesto a la Problema de contrapresión: un cliente lento o estancado puede dejar el buffering en entorno de ejecución datos en la memoria nativa que JavaScript no puede enlazar.

<a id="what-opencodex-does-today"></a>

## Lo que opencodex hace hoy

Mitigación limitada y visibilidad — **No es una solución**. En el paquete 1.3.14 En entorno de ejecución, la fuga en sí sigue siendo un problema ascendente:

- **Perro guardián de la memoria** — el proxy muestrea su propia memoria cada minuto y registra un velocidad limitada cuando la memoria observada cruza 4 GiB. La memoria observada es el más grande de RSS, `external`, y `arrayBuffers` (No es su suma), porque Windows conjunto de trabajo / RSS contadores pueden sub-informar comprometido externo retención.
- **`ocx doctor`** — una sección "Memoria / entorno de ejecución" muestra la *servicio*
  Bun versión del proceso, RSS, contadores externos / ArrayBuffers, contexto JS-heap, y la decisión de modo de transmisión. En el entorno de ejecución Bun 1.3.14 incluido, `heapUsed` /
  `jscHeap` solos no son un discriminador de fugas; compare la memoria observada con
  `responseState` y muestras repetidas antes de asignar una fuga a nivel de aplicación.
- **`GET /api/system/memory`** — los mismos datos sobre la autenticación administración API para paneles o scripts. Junto a RSS/montón/contadores externos Reporta un escalar `responseState` bloque (recuento de entrada, total/mayor bytes serializados, edad de entrada más antigua) para el proxy en memoria
  `previous_response_id` tienda de continuación. Esto le atribuye crecimiento: a creciente `responseState.totalBytes` bajo puntos de memoria observados crecientes en retención de conversación (largo `store:false` cadenas que se vuelven a expandir cada vuelta), mientras que un plano `responseState` bajo el aumento de los puntos de memoria observados lejos de esa tienda. Los valores son — sin cuerpos de solicitud, tokens, rutas o identificadores de cuenta — y la lectura es libre de efectos secundarios (nunca poda o desalojos). La salud de derrame-escritura se informa por separado dentro de ese bloque:
  `spillWriteStatus` comienza como `initial`, se convierte `degraded` Después de un fracaso publicación, y vuelve a `healthy` después de la siguiente publicación exitosa.
  `spillWriteConsecutiveFailures`, el último tiempo de fracaso, y el último éxito El tiempo muestra si los fallos se están acumulando o recuperando en el mismo proceso. El último fallo es una clase fija segura para la privacidad, como `EACCES`, `ENOSPC`,
  `ETIMEDOUT`, o `EACLRETRYEXHAUSTED`; mensajes de error en bruto y rutas del sistema de archivos Nunca son devueltos. `spillLastWriteFailureOrigin` añade un origen fijo o nulo:
  `retry_returned_timeout` significa que el segundo intento de derrame existente devuelve un tiempo de espera; `timeout_memo_refusal` significa que el ayudante ACL se negó a través de su Recordó el estado de tiempo. Otros fallos usan null. El acumulativo
  `spillAclRetryReturnedTimeouts` y `spillAclTimeoutMemoRefusals` terminal de conteo Publicaciones fallidas, no comandos individuales de ACL o primeros intentos transitorios. Cuando una nueva continuación no cabe bajo el techo de derrame de 1 GiB, el proxy primero desaloja las continuaciones almacenadas más antiguas para hacer espacio, siempre que pueda tener éxito; una continuación que no puede encajar incluso entonces es rechazada. El acumulativo
  `spillHeadroomEvictions` cuenta las continuaciones desalojadas para hacer espacio, y
  `spillCapacityRefusals` se rechazaron las continuaciones porque el techo podía no hacer sitio (cada uno es también una publicación fracasada con clase `ECAPACITY`) Un aumento `spillCapacityRefusals` Mientras que la memoria es saludable significa lo duradero. El conjunto de continuación está lleno de espacio, el proxy no puede reclamar — en vuelo publicaciones o archivos de un borrado fallido dejado atrás — en lugar de un problema de memoria. El éxito despeja la racha de fracasos, pero conserva los últimos campos de recuentos acumulativos; un fallo posterior no relacionado establece el último origen en nulo. Estos valores son process-local, así que compara instantáneas del mismo proceso. Ninguno de los orígenes identifica un comando del sistema operativo: el presupuesto del intento puede expirar antes de se inicia un comando y se puede ejecutar una inspección de cumplimiento opcional antes de una nota Rechazo. Un proceso separado que tenga éxito no prueba que el proceso en vivo Memo recuperado. Estas observaciones no agregan reintentos, notas claras, debilitan ACL necesarias, o reiniciar automáticamente el servicio.

  Estos diagnósticos permanecen en la gestión autenticada están intencionalmente ausentes de `/healthz`, que sigue siendo una vivacidad señal. El panel de control **Observabilidad de la memoria** La tarjeta muestra la memoria y de tamaño de continuación desde este punto final y ofrece un
  **Drenar y reiniciar** acción: muestra el recuento de giros activos actual, espera hasta 60 s para los giros activos (reutilización la HTTP existente 503 JSON `server_restarting` + `Retry-After: 5` drenaje), luego aborta cualquier giro restante. El proxy en ejecución posee la autorización de reinicio y la coordinación de drenaje, luego salidas; un administrador de servicio instalado inicia el reemplazo cuando sea aplicable. La acción reporta el éxito solo después de un proceso diferente y verificado por la identidad. está sano en el mismo puerto, sin romper la inyección de Codex. Eso es un reciclaje más largo e informado que el drenaje corto en `POST /api/stop`.

  Para obtener una instantánea de la carga útil autenticada completa, ejecute
  `ocx observe memory --json`; el CLI reenvía los mismos campos de estado de respuesta.
- **Un camino de flujo alternativo cerrado** — un relé de un solo lector limitado que elimina por completo la forma ilimitada del buffering. En Windows se convierte en el predeterminado automáticamente una vez que una versión Bun incluida lleva de forma verificable el 32111 Fix; hoy es opt-in solamente (ver más abajo). En macOS sigue siendo opt-in incluso después de tal lanzamiento — voltear macOS `auto` Es una decisión separada.

Los metadatos del catálogo leen el último catálogo incluido confirmado del entorno de ejecución seleccionado. Las selecciones frías o cambiadas se actualizan a través de sondas de versión/modelo asíncronas, por lo que Esas sondas no mantienen el bucle de eventos proxy. Las actualizaciones compartidas tienen una duración de 45 segundos fecha límite; las actualizaciones activadas por solicitud fallidas conservan filas coincidentes y aplican un Reintentar el tiempo de reutilización. Solicitar abortar libera la contabilidad del traductor cuando un cuerpo de respuesta no es leído. Estos cambios de vida no establecen que Windows retención de flujo nativo ([#6671](https://github.com/lidge-jun/opencodex/issues/6671)) está resuelto.

La mejora de RSS en el mundo real a partir de estos cambios es **A la espera de verificación por Usuarios de Windows** — no afirmamos que la fuga sea reparada.

El reinicio automático basado en umbral es deliberadamente **no** enviado. Si el proceso fallas, los administradores de servicios (Programador de tareas / WinSW, launchd, systemd) ya Reiniciar.

<a id="your-options"></a>

## Sus opciones

1. **Espere una actualización de entorno de ejecución incluida.** Una vez que una liberación Bun verificable lleva las correcciones, opencodex aumentará el entorno de ejecución del paquete y la seguridad La ruta de transmisión se activa automáticamente en Windows (macOS sigue requiriendo la explícito opt-in abajo).

2. **Ejecutar un entorno de ejecución Bun en el que confía `OPENCODEX_BUN_PATH`.** Establezca la variable antes del lanzamiento `ocx` desde ese shell, entonces corre `ocx service repair` para hornear el entorno de ejecución seleccionado en la definición del servicio. Un proyecto posterior `.env` no cambia la selección; solo cambiar el entorno no actualiza un servicio instalado.

3. **Optar por el relé limitado con `streamMode: "eager-relay"`.** Dos formas: editar `config.json` (añadir) `"streamMode": "eager-relay"`), o llamar al administración API — a `PUT /api/settings` con `{"streamMode":"eager-relay"}`
   se aplica a los nuevos giros sin reiniciar. **Advertencia de riesgo de accidente:** en Bun 1.3.14 esto utiliza la forma de flujo afectada por   .32111, que puede bloquear el proceso a mitad de flujo (en cualquier sistema operativo, no solo Windows). El gerente de servicio será reiniciarlo, pero las solicitudes en vuelo fallan. `"legacy-tee"` pines la corriente por defecto. En Windows, `"auto"` (predeterminado) deja que la puerta de ejecución decida. En marcha macOS, `"auto"` siempre se queda en tee; explícito `"eager-relay"` Es el opt-in.

Si intenta alguno de estos en una carga de trabajo Windows real, informe el antes y después `ocx doctor` secciones de memoria en
[#314](https://github.com/lidge-jun/opencodex/issues/314) — que es exactamente la verificación de que esta mitigación está esperando.

<a id="windows-selected-runtime-write-refusal"></a>

## Windows rechazo de escritura en entorno de ejecución seleccionado

Windows servicio de instalación, reparación y Codex shim de instalación / actualización comprobar si el ejecutable seleccionado puede crear y eliminar un directorio dentro de la raíz de configuración OpenCodex. Esta es una revisión de política de escritura, no una solución de memoria. El fallo se niega antes de que el servicio se detenga, se descargue, se ponga en escena, se escriba token o el lanzador. La reparación automática de calzas se aplaza con la orientación y el inicio continúa. Las shims sanas o discapacitadas no sondean. No se descubre ningún entorno de ejecución alternativo. Una instalación del programador por primera vez registra su tarea y reclama la raíz de configuración antes de esta comprobación; al rechazarse, se devuelve el nuevo registro y la raíz reclamada permanece para un reintento.

> El entorno de ejecución Bun seleccionado no pudo crear ni eliminar un directorio en el directorio de configuración OpenCodex. La directiva de aplicación Windows puede denegar escrituras desde esta ubicación ejecutable. Configure OPENCODEX_BUN_PATH en un ejecutable Bun de confianza permitido por su política antes de iniciar ocx, o vuelva a instalar opencodex con npm install -g bitkyc08/opencodex, luego reintente. No se seleccionó ningún entorno de ejecución alternativo.
