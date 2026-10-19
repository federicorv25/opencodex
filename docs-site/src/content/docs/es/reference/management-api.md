---
title: "API de administración"
description: "Autenticación, errores y referencia de punto final para el plano de control opencodex."
---

La Gestión API es el plano de control de opencodex. El dashboard en
`http://localhost:10100` es uno de sus clientes; sin cabeza `ocx` proveedor, modelo, combo, cuenta, configuración, diagnósticos y comandos del ciclo de vida también son clientes. El API solo está disponible mientras El proxy se está ejecutando.

Utilice el [Dashboard web](/es/guides/web-dashboard/) para un cliente interactivo, o esta referencia cuando Automatización de edificios. En última instancia, los valores persistentes siguen [Configuración](/es/reference/configuration/).

<a id="authentication-model"></a>

## Modelo de autenticación

La administración API tiene su propia credencial de administración, independientemente de las claves API del plano de datos. En el arranque, opencodex lo resuelve en este orden:

1. `OPENCODEX_ADMIN_AUTH_TOKEN`, cuando se establece.
2. A generado `ocx_admin_*` token en un archivo secreto endurecido.

El archivo respaldado token se acepta solo después de que su directorio y permisos de archivo o ACL hayan sido endurecido. Si esto no se puede garantizar, la autenticación de administración falla y el API devuelve 503 hasta que se suministra un entorno token o se repara el estado del archivo.

Envíe el administrador token en cualquier forma:

```http
X-OpenCodex-API-Key: <admin-token>
```

```http
Authorization: Bearer <admin-token>
```

:::caution
El administrador token debe diferir de cada credencial del plano de datos. Startup rechaza una gestión Credencial que entra en conflicto con una clave de admisión proxy. No ponga el administrador token en Codex, Claude Code, u otro cliente modelo; autoriza mutaciones en el plano de control.
:::

<a id="loopback-dashboard-sessions"></a>

### Sesiones de panel de Loopback

En un enlace de loopback, el panel de instrumentos puede recibir un breve `ocx_session_*` Credencial. Cada sesión dura cinco minutos y está vinculada al origen exacto del panel de control. Las solicitudes seguras deben coinciden con ese origen. Los métodos inseguros también requieren el navegador `Origin` y la sesión CSRF token.

Cuando se requiere la autenticación de plano de datos, que incluye enlaces remotos, el loopback bootstrap No acuña una sesión. Un panel de control remoto obtiene una sesión de 12 horas solo a través de un Tailscale confiable identidad (`remoteGui.allowedTailscaleUsers` en el ingreso de gestión de escala de cola) o un uso único concesión de emparejamiento; cada solicitud autorizada la extiende. De lo contrario, un operador remoto se autentica con el administrador token sin procesar, y el panel de control lo pide de nuevo después de una recarga porque la sesión está activa Sólo en la memoria de página. Véase [Hub remoto](/es/guides/remote-hub/).

<a id="common-errors"></a>

## Errores comunes

Todas las filas de punto final por debajo heredan estos errores de límite. La columna “Errores notables” enumera los errores adicionales resultados específicos de la ruta en lugar de repetir esta tabla.

| Estado | Tipo o código | Significado |
| --- | --- | --- |
| 401 | `opencodex admin token required` | La sesión de administración token o GUI no está disponible, no es válida, ha caducado, no coincide con el origen o falta evidencia de CSRF |
| 403 | `cross-origin request blocked` | El origen de la solicitud está fuera de la lista de permisos de administración |
| 404 | `not_found` | Ninguna ruta de administración coincide con el método y la ruta |
| 413 | `request body too large` | Un cuerpo POST, PUT o PATCH excede el límite de administración de 2 MiB |
| 503 | `management API unavailable` | La inicialización o endurecimiento de credenciales de administrador no está disponible |
| 503 | `oauth_mutation_busy` | Otra mutación de la credencial OAuth contiene el escritor; la respuesta incluye `Retry-After: 1` |
| 503 | `catalog_busy` | La recolección de catálogos ya está a su capacidad; la respuesta incluye `Retry-After: 1` |

<a id="endpoint-matrix"></a>

## Matriz de punto final

<a id="agent-and-client-settings"></a>

### Configuración de agente y cliente

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET, PUT /api/v2` | Leer o cambiar la configuración nativa del modo v2 y el subproceso de múltiples agentes | 400 configuración no válidos; 502 Fallo de transición o persistencia |
| `GET, PUT /api/injection-model` | Leer o configurar el modelo de subagente inyectado, los configuración de esfuerzo, prompt y orientación | 400 modelo, esfuerzo o cuerpo no válidos |
| `POST /api/injection-model/suggest` | Dimensionar una carga de trabajo delegada descrita y proponer un modelo de delegación y esfuerzo sin escribir | 400 trabajos o modelos no válidos; 409 sin modelo de tamaño |
| `GET, PUT /api/effort-caps` | Leer o establecer límites globales y de esfuerzo de razonamiento de subagentes | 400 valor de escalera no válido |
| `GET, PUT /api/subagent-models` | Leer u ordenar los modelos anunciados a sub-agentes | 400 lista inválida o más de cinco modelos |
| `GET, PUT /api/subagent-model-fallback` | Leer o establecer la cadena de reserva ordenada y el intervalo de sondeo | 400 lista inválida o intervalo de sondeo |
| `GET /api/grok` | Leer el estado de configuración administrada de Grok y los modelos candidatos | Error de lectura de 400 estados |
| `PUT /api/grok/selection` | Persisten los modelos Grok excluidos | 400 selección no válida o sobredimensionada |
| `POST /api/grok/apply` | Aplicar la configuración persistente de Grok a través de la sincronización administrada | 409 `grok_apply_busy`; 400/500 aplican fracaso |
| `GET /api/grok/reset-coupons?accountId=...` | Leer el resto de la facturación Grok restablecer tokens y las ventanas de validez para la cuenta xAI activa o especificada | 400 cuentas perdidas; 401 no autenticado; 502 error gRPC-Web de subida |
| `POST /api/grok/reset-coupons/consume` | Canjee un cupón de reinicio elegible. Cuerpo `{ accountId?, tokenId?, operationId? }`. Opcional `operationId` (UUIDv4) hace que la redención sea idempotente: repetir el mismo ID reproduce el resultado duradero sin doble redención. | 400 inválida JSON/UUID; 401 no autenticado; 409 `operation_id_owned_by_another_account` / `coupon_unavailable` / `operation_token_mismatch` / `operation_state_changed` / `attempt_in_progress` / `attempt_unresolved`; 502 error ascendente; 503 capacidad del libro mayor / `ledger_unavailable`; 500 `attempt_mark_failed` |
| `GET /api/anthropic/reset-grants?accountId=...` | Lea el Claude restablecimiento de límite de uso concesiones de uno Anthropic OAuth cuenta: elegibilidad, cada concesión restablece izquierda, ventana de validez, y las ventanas se borra, además de cualquier intento no confirmado todavía retryable | 400 sin cuenta de juego; 401 Re-autenticación necesaria; 502 de origen no disponible |
| `POST /api/anthropic/reset-grants/consume` | Gasta una subvención de reinicio. Cuerpo `{ accountId, grantId, operationId }`; `operationId` es un UUIDv4 enviado de origen como el ID de solicitud, por lo que repetirlo reintenta la misma reclamación. Requiere una sesión de panel. A establecido `reset` levanta el tiempo de reutilización local de la cuenta solo cuando se trata de un rechazo de cuota registrado antes de que se publicara el reclamo por primera vez y las ventanas que la subvención informó cubren todas las ventanas con ese rechazo nombradas (ambas ventanas cuando no nombró ninguna). Una denegación registrada mientras la reclamación estaba en vuelo, una denegación de derecho o una ventana descubierta permanece, incluso en una repetición del mismo ID. La cuota en caché se elimina y el uso se vuelve a leer con una nueva solicitud, por lo que el grupo puede seleccionar la cuenta antes de la fecha límite anterior. Las exclusiones de familias modelo permanecen hasta que esa relectura prueba que una familia ya no es rechazada. | 400 cuerpos inválidos; 401 Re-autenticación necesaria; 403 `session_required`; 409 `grant_not_usable`, `in_flight`, `unresolved_prior_operation`, `unknown_outcome_expired`, `operation_identity_mismatch`; 500 `journal_write_failed`; 502 `unknown_outcome`; 503 diario ocupado, no disponible o lleno |
| `GET, PUT /api/claude-desktop` | Lea o persista el perfil nativo/enrutado de Escritorio Claude | 400 asignación no válida o no disponible |
| `POST /api/claude-desktop/apply` | Escribe el perfil guardado en la configuración administrada de Claude Desktop | 400/500 fracaso de escritura |
| `GET, POST /api/codex/desktop-compatibility/certificate` | Inspeccione o prepare explícitamente el certificado de compatibilidad Windows | Se requiere un panel de control local 403 para POST; 409 estado rancio, ocupado o incompleto |
| `GET, POST /api/codex/desktop-compatibility/runtime` | Inspeccionar o iniciar, detener, iniciar o ejecutar una prueba de compatibilidad nativa limitada | Se requiere un panel de control local 403 para POST; 409 compilación sin soporte, certificado no confiable o estado incompleto |
| `GET, POST /api/codex/desktop-compatibility/settings` | Leer o guardar la preferencia de observación del siguiente inicio con su revisión actual | Se requiere un panel de control local 403 para POST; 409 Configuración obsoleta, inválida o no confirmada |
| `GET /api/claude-desktop/status` | Inspeccione el perfil guardado contra la salud del escritorio | Error de lectura de 400 estados |
| `GET, PUT /api/claude-code` | Leer o actualizar la configuración de la puerta de enlace, el modo de autenticación, el mapa de modelos, el contexto, el agente y el sidecar de Claude Code | 400 campo o forma no válidos |

`tokenId`, cuando se suministra, debe ser una cadena no vacía; devuelven valores no válidos `400 invalid_token_id` antes de que se lean las credenciales o se abra el libro. Dentro de la ventana de retención de 30 días, un mismo`operationId` retry que omite `accountId` utiliza la cuenta registrada, incluso si la cuenta activa ha cambiado. Un ejecutable `open` retry que omite `tokenId` utiliza su grabado token. Una cuenta diferente explícita o token todavía se rechaza. Un fallo definitivo despeja una espera especulativa coincidente en el panel, permitiendo un nuevo intento explícitamente confirmado; los resultados desconocidos reales permanecen retenidos.

Un intento es reclamado duramente antes de la redención. Solo una respuesta de canje ascendente confirmada puede registrar `redeemed`; un cupón que falta en la lista restante no prueba que esta operación haya tenido éxito. Después de un tiempo de espera o de un acuerdo perdido, los reintentos inspeccionan la disponibilidad sin volver a canjear y devuelven `attempt_unresolved`; un intento reciente regresa `attempt_in_progress`. Una negativa de inspección tardía resuelve solo una operación aún `open`. En la misma transacción, un ganador de terminal definitivo de identidad coincidente se reproduce con HTTP 200 y su código original; un ganador no resuelto o con identidad no coincidente regresa. `operation_state_changed`, preservando la guía de recuperación del mismo ID. Devuelve un libro mayor ilegible o bloqueado `ledger_unavailable` sin enviar una redención.

Una vez que una persona que llama suministra un `operationId`, cada respuesta que no puede probar que la operación está resuelta lleva `operationId` en el nivel superior y mantiene a la persona que llama en él: `attempt_unresolved`, `attempt_in_progress`, `attempt_reconcile_failed`, `operation_state_changed`, `operation_token_mismatch`, `attempt_mark_failed`, `ledger_unavailable`, y el libro mayor `capacity` (el libro mayor completo no puede reservar el ID, por lo que una solicitud anterior que lo contenga aún puede abrirlo más tarde). Esto incluye rechazos antes de que se abra el libro mayor: un mal formado `tokenId`, una cuenta desconocida o una búsqueda de cuenta fallida bajo una declaración de ID suministrada 409 `attempt_in_progress` con el ID, porque otra solicitud ya puede contener esa operación. Una negativa de autenticación definitiva se registra atómicamente como un `failed` operación vinculada al cupón solicitado, por lo que una repetición lo reproduce; una operación existente para un cupón diferente nunca se reproduce. Una lista de restablecimiento restante fallida establece una operación no reclamada como `fetch_resets_failed`. Una respuesta de redención cuenta como confirmada solo cuando su encuadre gRPC-Web está completo y cada vez que se `grpc-status` tiene el mismo valor válido; estados en conflicto o bytes después del retorno del remolque 502 `attempt_unresolved` y dejar la operación `attempted`.

Un reembolso no confirmado devuelve HTTP 502 con `error.code: "attempt_unresolved"` y el efectivo `operationId`. Preservar ese ID; un ID de reemplazo iniciaría una operación diferente. El CLI crea el ID antes de enviar e imprimir `--operation-id` orientación si la entrega o la respuesta es incierta. Legacy versión-uno `open` registros y no confirmados `redeem_failed` Los registros se ponen en cuarentena como inciertos; nunca autorizan otra redención.

El dashboard en **Proveedores > xAI Grok > Cuentas** enumera los cupones restantes y sus ventanas de validez de la insignia del boleto de cada cuenta. Envía un cliente-acuñado `operationId`. Después de una entrega incierta o una respuesta de resultado desconocido, el panel retiene ese intento para la sesión de pestaña del navegador, incluso en el diálogo cerrar / volver a abrir, navegación por la página y recarga. La retención se escribe antes de que la solicitud se envíe y se borre solo mediante una respuesta definitiva para el mismo `operationId`. La disponibilidad actualiza el problema GET solo y nunca autoriza a otro consumir POST. `ocx account grok-reset-coupons` Es el terminal equivalente.

Los restablecimientos de uso Claude funcionan de la misma manera desde **Proveedores > Anthropic > Cuentas**. Cada La fila de la cuenta iniciada lleva una insignia de ticket con sus reseteos restantes, y el diálogo Uno después de una segunda confirmación. Un reinicio rellena los límites de 5 horas y semanales sin mover el día de reinicio semanal. Cuando una reclamación no responde, el diálogo mantiene su
`operationId` y ofrece un reintento con esa misma identificación durante diez minutos, que es cómo se El propio cliente Claude Code se recupera; se rechaza una nueva operación para la misma concesión Hasta entonces. El gasto es solo en el panel: solo el administrador token obtiene `403 session_required`.

Para conocer los conceptos detrás de la lista de modelos y el comportamiento cifrado de las tareas del trabajador, consulte
[Interfaz de subagentes](/es/guides/sub-agent-surface/).

<a id="client-integration-rollback-journal"></a>

### Diario de reversión de la integración del cliente

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/client-integrations/journal?client=...` | Listar las operaciones de reversión, opcionalmente para un cliente. Cada fila incluye el servidor computado `deletable` bandera. | 400 clientes no válidos |
| `DELETE /api/client-integrations/journal?opId=...` | Retire una operación de reversión anterior y elimine su instantánea cuando sea posible. Retornos de éxito `snapshotRemoved`; `false` significa que la limpieza se retuvo para el reintento de mantenimiento. | 400 desaparecidos `opId`; 404 operación faltante o ya retirada; 409 nueva operación para ese cliente |

La eliminación añade una lápida en lugar de volver a escribir el diario. La nueva operación para cada cliente está protegido en el lado del servidor para que el punto de deshacer actual permanezca disponible. Para Aside, la protección es por perfil, y las filas del diario incluyen `profileId`.

<a id="aside-profile-controls"></a>

### Aside controles de perfil

Utilice estas rutas dedicadas con un proxy compatible. `{profileId}` es un registrado ID de cuenta entero no negativo devuelto por la lista de perfiles; no es una ruta del navegador.

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/client-integrations/aside/profiles` | Lista `profiles[]`, deseado `enabledCount`/`allEnabled`, real `appliedCount`, y `total` | HTTP 200 puede contener un agregado vacío e inseguro con `error` Cuando el descubrimiento no está disponible |
| `PUT /api/client-integrations/aside/profiles` | Establecer el estado deseado de cada perfil registrado y aplicarlo; cuerpo `{ "enabled": true }`, con opcional `overwriteConflict` Cuando habilita | 400 cuerpos inválidos; 409 operación ocupada; 500 preferencia-salvar fracaso; 207 denegaciones por perfil |
| `GET /api/client-integrations/aside/profiles/{profileId}` | Lee el perfil deseado `enabled` y estado de integración real | 400 ID no válido; 404 perfil no registrado |
| `PUT /api/client-integrations/aside/profiles/{profileId}` | Cambiar un perfil con el mismo cuerpo que PUT a granel, dejando las preferencias de los hermanos sin cambios | 400 cuerpo/ID no válido; 404 perfil desconocido; 409 ocupado o rechazo; 500 fallos de escritura/guardar |
| `GET /api/client-integrations/aside/profiles/journal` | Listar el historial en los perfiles registrados de Aside | Las filas incluyen `profileId`, disponibilidad de instantáneas, `undoable`, y `deletable` |
| `GET /api/client-integrations/aside/profiles/{profileId}/journal` | Enumerar el historial de un perfil, incluidas las operaciones heredadas coincidentes | 400 ID no válido; 404 perfil desconocido |
| `DELETE /api/client-integrations/aside/profiles/journal?opId=...` | Retirar una operación anterior, resolviendo su perfil de la historia | 400 identificaciones perdidas; 404 falta de funcionamiento; 409 nueva operación para su perfil |
| `DELETE /api/client-integrations/aside/profiles/{profileId}/journal?opId=...` | Retirar una operación anterior que pertenezca al perfil seleccionado | Los mismos errores de eliminación; una operación no puede apuntar a un perfil diferente |
| `POST /api/client-integrations/aside/profiles/{profileId}/restore` | Deshacer una operación usando `{ "opId": "..." }`; opcional `confirmDrift: true` Permite reemplazar ediciones posteriores | 404 Falta la operación/perfil; 409 ocupado, desajuste o confirmación de deriva requerida; 410 instantánea expirada; 500 fallos de escritura/guardar |
| `POST /api/client-integrations/aside/sync` | Actualizar perfiles habilitados a través del propietario de la mutación del servidor; cuerpo `{}` | 400 selector de cuerpo/perfil no vacío; 409 ocupados; 207 denegaciones por perfil |

<a id="previewing-an-integration-change"></a>

## Vista previa de un cambio de integración

Una vista previa informa lo que un cambio haría sin hacerlo. Estas rutas no escriben nada: no instantánea, sin registro de propiedad, sin fila de diario, sin bloqueo y sin mantenimiento o recuperación.

| Ruta | Finalidad | Respuestas notables |
| --- | --- | --- |
| `POST /api/client-integrations/preview` | Plan `apply`, `overwrite` o `disable` para un cliente; cuerpo `{ "clientId": "...", "operation": "..." }` | 400 cliente no válido u operación; 400 `invalid_aside_profile_path`; 409 `integration_preview_unavailable` |
| `POST /api/client-integrations/restore/preview` | Deshacer; deshacer; deshacer `{ "opId": "...", "confirmDrift": false }` | 404 operación desconocida; 400 `invalid_aside_profile_path`; 409 `integration_preview_unavailable` |
| `POST /api/client-integrations/aside/profiles/{profileId}/preview` | Planificar un cambio de perfil Aside, incluyendo `restore` con un `opId` | 400 cuerpo inválido o solicitud no especificada; 404 desconocido perfil u operación, 409 `integration_preview_unavailable` |

Un plan lleva `version`, `clientId`, `operation`, `state`, `foreignEdit`, a `changes` lista de
`kind` y `path` pares, una opaca `fingerprint`, `canApply`, `willChange`, y un opcional
`refusalReason` y `profileId`. Las rutas de acceso son rutas de esquema administradas o `$snapshot`,
`$ownership` y `$journal` marcadores; una posición elegida en entorno de ejecución aparece como `*`. No Se devuelve el valor de configuración, la ubicación del archivo o la identidad del miembro seleccionado.

`canApply: true` con `willChange: false` significa que la operación tiene éxito y no cambia nada el documento del cliente administrado, como la aplicación de lo que ya se aplica.

Un cambio de perfil Aside aún guarda una cosa en ese caso. Confirmar que registra la sincronización deseada preferencia por ese perfil antes de que se toque cualquier documento del cliente, desactivando así un perfil cuyo bloque administrado ya está ausente almacena la preferencia y deja el documento y su historial intacto.

`integration_preview_unavailable` significa que actualmente no se conserva ninguna lista de modelos utilizables. Un recién iniciado proxy es una forma de estar en ese estado; una lista retirada porque la configuración o el proveedor caché movido es otro. Lectura `GET /api/client-integrations` establece uno cuando descubrimiento tiene éxito y la configuración se puede identificar, por lo que es el remedio habitual en lugar de una garantía.

<a id="confirming-a-previewed-change"></a>

## Confirmar un cambio previsualizado

Rutas de mutación aceptadas `operation` y `planFingerprint` junto a su cuerpo existente. Enviar ambos O bien, se rechaza una petición que lleva uno, ya que es uno cuyo `operation` Con el fin de cambio que se solicita. Las fijaciones Aside se aplican a un solo perfil, porque una huella dactilar no puede describe varios archivos que cambian independientemente.

El servidor vuelve a planificar antes de escribir nada y regresa `409 integration_preview_stale` con un recién computado `plan` cuando la confirmación ya no describa lo que sucedería. Decidir de nuevo contra el nuevo plan; la solicitud no se vuelve a intentar automáticamente.

Una huella digital es un cheque optimista, nunca una autorización. Autenticación de gestión y cada La regla de la propiedad todavía decide si un cambio puede suceder en absoluto.

Granel PUT devuelve `{ ok, clientId, changed, state, message, results }`; cada resultado identifica su `profileId` e informa el resultado del escritor. Retornos de sincronización `{ ok, clientId, results }`, con resultados de actualización por perfil. Ambos devuelven HTTP 200 cuando todos los intentos devueltos tienen éxito y HTTP 207 `ok: false` cuando cualquier intento se niega. HTTP 207 es un sobre de resultado parcial, incluyendo cuando cada intento de perfil se niega: inspeccionar cada resultado en lugar de tratar un 2xx respuesta como éxito completo. Un no-op exitoso puede tener `changed: false`; la sincronización no Intente los perfiles deshabilitados. Un solo perfil escribe y restaura HTTP 200 de retorno en caso de éxito o el estado de error correspondiente en caso de rechazo.

Los cambios explícitos guardan las preferencias deseadas antes de escribir archivos. Un fracaso de guardar preferencias deja los archivos de perfil sin cambios. Un rechazo de archivo posterior preserva la intención guardada y el éxito hermano escribe; inspeccionar el perfil afectado antes de volver a intentar. Los rechazos pueden incluir
`snapshotPath` y `residual: true` Cuando la recuperación no terminó. La restauración también reconcilia el el estado deseado del perfil de destino, por lo que la siguiente sincronización no invierte Deshacer. Devolución de borrado
`snapshotRemoved`; `false` significa que la limpieza de instantáneas aún necesita mantenimiento.

El legado `GET, PUT /api/client-integrations/aside` Los alias siguen disponibles. Nuevos clientes debería usar las rutas dedicadas anteriores para que un proxy antiguo no pueda ignorar un selector de perfil. Véase [Aside controles de perfil](/es/guides/integrations/#aside-profile-controls) para los comandos CLI y la actualización del proxy, reinicio y reintento secuencia.

<a id="remote-workspace"></a>

### Espacio de trabajo remoto

Requiere modo Hub y `OCX_REMOTE_WORKSPACE_ENABLED=1` en el proceso de Hub. El estado discapacitado es legible; las mutaciones se niegan sin inicializar los servicios del espacio de trabajo.

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/remote-workspace` | Lea equipos emparejados, capacidades actuales, tiempos de ejecución de Hub e instantáneas de sesión | Estado desactivado cuando el rol de Hub o el opt-in explícito están ausentes |
| `POST /api/remote-workspace/pairing` | Crear un código de inscripción de un solo uso para Ejecutor de diez minutos | Solo sesión GUI emparejada con el operador; 429 capacidad de emparejamiento |
| `GET /api/remote-workspace/runtimes` | Lea la disponibilidad de Codex, Claude Code y Pi en el Hub | — |
| `GET, POST /api/remote-workspace/sessions` | Listar sesiones o iniciar una vinculada a un dispositivo, root, entorno de ejecución y modo de acceso | POST requiere una sesión GUI emparejada por el operador; 409 objetivo fuera de línea/no disponible/inválido |
| `POST /api/remote-workspace/sessions/{id}/prompt` | Continuar la sesión del modelo encuadernado | Solo sesión GUI emparejada con el operador; 409 turno activo, ejecutor sin conexión o falla de reanudación |
| `DELETE /api/remote-workspace/sessions/{id}` | Detener el entorno de ejecución del modelo y la sesión cifrada de Ejecutor | Solo sesión GUI emparejada con el operador; 404 sesión desconocida |
| `DELETE /api/remote-workspace/devices/{id}` | Revocar una computadora y detener sus sesiones | Solo sesión GUI emparejada con el operador; 404 - Artículo no encontrado |

La inscripción del ejecutor intercambia un código de un solo uso en `POST /remote-workspace/pair` y luego abre
`/remote-workspace/agent` como WebSocket saliente autenticada por portador. Esos dos puntos finales de la máquina no son la autoridad de gestión general API. El portador es de alcance de dispositivo, y cada sesión de trabajo añade un firmado E2EE apretón de manos. Diez códigos de emparejamiento fallidos de un retorno de pares observado por kernel `429` con
`Retry-After` para el resto de la ventana fija de diez minutos. Tailscale Servir a los clientes bucket de pares de bucle inverso del oyente de gestión; el encabezado de identidad no se usa para estrangular porque un proceso local directo podría forjarlo. Véase [Espacio de trabajo remoto](/es/guides/remote-workspace/) por el Flujo de usuario final y límites de confianza.

Las instantáneas de sesión incluyen `resumable`. Se hace cierto solo después del entorno de ejecución del agente de codificación seleccionado. tiene un historial duradero; notablemente, una nueva sesión Claude Code permanece falsa hasta su primer aviso Completa.

### Combos

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/combos` | Lista de combos normalizados y sus ID de modelo público | El trabajo del catálogo puede volver `catalog_busy` |
| `PUT /api/combos` | Crear, reemplazar o cambiar el nombre de un combo | 400 identificación inválida, destino, configuración, cambio de nombre o colisión ordinaria; 409 Colisión de espacio de nombres de cuenta Codex |
| `DELETE /api/combos?id=...` | Eliminar un combo y borrar su estado de selección/enfriamiento | 400 identificaciones faltantes; 404 - Categoría no encontrada |

Véase [Combos](/es/guides/combos/) para estrategias de destino, tiempos de reutilización, alias y fallas de enrutamiento.

<a id="codex-prompt-layers"></a>

### Capas de aviso Codex

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/codex-prompt` | Lea la instantánea de la capa de solicitud: capas, variantes base, selección y estado de deriva | — |
| `GET /api/codex-prompt/text` | Probar el mensaje de texto visible del modelo mediante `codex debug prompt-input` | Fail-soft: una sonda no disponible se degrada a un estado en el cuerpo, no a un error HTTP |
| `PUT /api/codex-prompt/toggle` | Habilitar o deshabilitar una capa conmutable | 400 cuerpo inválido o capa desconocida; 409 `stale_revision`, `layer_not_toggleable` |
| `PUT /api/codex-prompt/custom` | Reemplazar el conjunto de capas personalizadas | 400 cuerpos inválidos, `invalid_characters`, `body_too_large` cuando una capa normalizada de UTF-8 excede 65.536 bytes, `composed_too_large` más de 131.072 bytes; 409 `stale_revision` |
| `PUT /api/codex-prompt/base/select` | Seleccione el indicador de base predeterminado o una variante almacenada | 400 cuerpos inválidos, `unknown_layer` para una identificación que no coincide con ninguna variante almacenada; 409 `stale_revision`, `developer_instructions_not_owned` Cuando la base actual es externa |
| `PUT /api/codex-prompt/base` | Crear (`id` omitidos o `id: null`), editar o eliminar (`delete: true`) una variante de base. Un suministrado `id` es solo edición y debe hacer referencia a una variante almacenada. `body` está normalizado (pestañas expandidas, CR/CRLF plegado a LF) antes de medirse o almacenarse | 400 cuerpos inválidos, `unknown_layer` por el `default` id o un id que no coincida con ninguna variante almacenada, `body_too_large` cuando el cuerpo normalizado de UTF-8 supera 65.536 bytes; 409 `stale_revision` |
| `POST /api/codex-prompt/adopt` | Importación `developer_instructions` Desde `config.toml` como una capa personalizada | 400 cuerpos inválidos, `invalid_characters`, `body_too_large`, `composed_too_large`; 409 `config_unreadable`, `nothing_to_adopt`, `adopt_unsupported_form`, `stale_revision` |
| `POST /api/codex-prompt/repair` | Reparación de deriva entre `config.toml` y la proyección propia | 400 cuerpos inválidos; 409 `config_unreadable`, `nothing_to_repair`, `repair_unsupported`, `stale_revision` |

Véase [Capas de aviso Codex](/es/guides/codex-prompt/) para el modelo de capa y las claves que escribe cada capa.

<a id="configuration-startup-sync-and-updates"></a>

### Configuración, inicio, sincronización y actualizaciones

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/config` | Devolver la configuración redactada y segura para la administración DTO | — |
| `PUT /api/config` | Deshabilitado protector de reemplazo de configuración completa | 405; use endpoints enfocados en su lugar |
| `GET, PUT /api/settings` | Lee la configuración de inicio/entorno de ejecución o actualiza el inicio automático, el modo de transmisión, el presupuesto de memoria propiedad de la aplicación y `codexAccountPickerEnabled` | 400 actualización no válida, no objeto o vacía |
| `GET, PUT /api/native-reasoning-retention` | Leer resuelto booleanos modelo/cuenta razonamiento-retención; parcial PUT conserva campos omitidos, JSON `null` Restaura los valores predeterminados. Véase [Retención de razonamiento nativo](/es/reference/configuration/server/#native-reasoning-retention). | 400 campo desconocido, tipo no válido o cuerpo no-objeto/no-nulo |
| `GET /api/startup-health` | Leer servicio en caché/salud de inicio de shim | — |
| `POST /api/startup-action` | Instalar o reparar el servicio o la shim Codex | 400 acciones inválidas; Fracaso de 500 acciones |
| `GET, POST /api/windows-tray` | Leer el estado de la bandeja Windows o instalar/inicio/parada/desinstalar | 400 plataforma/acción no soportada; 500 fallo de operación |
| `GET /api/diagnostics/project-config` | Leer las advertencias de configuración del proyecto en caché | — |
| `POST /api/sync` | Sincronice el catálogo de modelos actual en Codex | 500 sincronización fallida |
| `GET /api/update/check` | Compruebe asincrónicamente el `latest` o `preview` canal de paquetes y actualizar la caché de paquetes en caso de éxito | 400 etiqueta inválida |
| `POST /api/update/run` | Compruebe de forma asíncrona una versión nueva del paquete y, a continuación, inicie un trabajo de actualización, opcionalmente seguido de reinicio | 400 cuerpo inválido; estado de conflicto/error específico del trabajo |
| `GET /api/update/status` | Votar un trabajo de actualización por id | Error 404: No se encontró la página |
| `GET, PUT /api/sidecar-settings` | Lea o actualice la configuración del modelo/backend del sidecar de la visión y la búsqueda web | 400 forma inválida, backend o límite |
| `GET, PUT /api/shadow-call-settings` | Leer o actualizar la configuración de intercepción de llamadas ocultas | 400 forma o valor no válido |

<a id="logs-usage-and-storage"></a>

### Registros, uso y almacenamiento

Solicitar registros retener `servedModel` cuando el flujo ascendente identifica el modelo que respondió, y
`wireModel` cuando el modelo enviado en sentido ascendente difiere del modelo orientado al cliente. El panel muestra `wire → served` cuando esas identidades difieren; su descripción conserva ambos valores. Falta La evidencia del modelo ascendente permanece ausente en lugar de inferirse del modelo solicitado.

Las filas de solicitud fallidas pueden incluir delimitado `upstreamErrorType`, `upstreamErrorCode`, y
`upstreamRequestId` En el caso de Codex de origen WebSocket camino, un error seguido de
EOF conserva los códigos de límite de velocidad, sobrecarga o rechazo de cliente reconocidos en el terminal con fallo sintetizado. `rate_limit_exceeded` / `rate_limit_error`, 503 por
`server_is_overloaded` / `overloaded_error`400/401/403/404 para `invalid_request_error` /
`authentication_error` / `permission_error` / `not_found_error`. Un tipo reconocido sin un código utiliza el mismo estatus. En la ruta de transmisión, un código explícito desconocido registra el estado 5xx del Codex WebSocket estados de envoltura como un entero de nivel superior `status` o `status_code` (uno de los dos, no ambos); de lo contrario, y para los llamantes JSON almacenados en búfer, sigue siendo un error genérico 502. El cliente terminal mantiene `upstream_server_error` códigos desconocidos de cualquier manera. El estado de error desnudo es provisional: un terminal genuino completado, fallido o incompleto lo reemplaza antes del registro de salud de la cuenta. La prioridad de rechazo no cambia. Este mapeo de diagnóstico no agrega reproducción o reintento automático.

`GET /api/logs` Acepta una opción opaca `cursor` de su respuesta anterior. El sobre preserva
`logs`, `total`, `generatedAt` y `timeZone`, y añade `cursor` y `reset`. Sin un cursor vuelve La ventana filtrada. Un prefijo válido sin cambios devuelve solo las filas anexas; `reset: true` sustituye la ventana del cliente después de editar, desalojar, consultar cambios o reiniciar. Los cursores no válidos devuelven HTTP 400 con
`error.code: "invalid_cursor"`. La autenticación no ha cambiado. El panel vuelve a las instantáneas completas para servidores más antiguos. Esto reduce los bytes de respuesta para ventanas estables; la proyección del servidor permanece limitada por el tamaño de la ventana actual.

Exitoso `/api/logs` `displayMetrics.decodeTokPerSecond` valores llevan
`timingBasis: "generation-window" | "legacy-post-visible-output"` junto a `kind`, `value`
y `estimated: true`Los valores de intento identifican su propia ventana. Los resultados no disponibles mantienen su existentes `reason` y sin base temporal. El campo se deriva solo en el tiempo de lectura: JSONL almacenado, extremo a extremo `tokPerSecond`, los DTO del historial de solicitudes y el rendimiento agregado no se modifican. Los DTO más antiguos pueden omitir el campo; los clientes deben tratar la base de tiempo como desconocida en ese caso. El panel nombra estos métodos **Ventana de generación** y **Después de la salida visible**, con
**Tiempo desconocido** por una causa desconocida o desaparecida. Solicitar detalles mostrar **Tasa de producción durante generación (est.)**, **Velocidad de salida después de la primera salida visible (est.)**, o **Tasa de salida (est.; Método de cronometraje desconocido)** y una explicación visible del método de temporización cuando se dispone de una velocidad.

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/logs` | Registros de solicitud en memoria filtrados por consulta | — |
| `GET, PUT /api/debug` | Leer indicadores de depuración; establecer, borrar o restablecer categorías de captura | 400 actualización no válida o vacía |
| `GET /api/debug/logs` | Leer entradas de registro de proveedor/debug limitadas | — |
| `GET /api/debug/usage-logs` | Leer entradas de depuración de uso limitadas | — |
| `GET /api/debug/injection-logs` | Leer las entradas de depuración de inyección de guía limitadas | — |
| `GET /api/claude/inbound-debug` | Leer el estado de depuración entrante y las entradas de Claude | — |
| `GET /api/usage` | Escanea el libro mayor de uso en agregados compactos de filas legibles, luego pliega los anexos verificados de forma incremental; resume por ventana personalizada preestablecida o inclusiva y superficie del cliente, con un Codex `accounts` desglose por etiquetas de registro estables no PII | 400 límites personalizados no válidos; 500 `{ "error": "read_failed" }` Si el almacenamiento no se puede leer |
| `GET /api/usage?jev=1` | Las decisiones de JEV persisten en el proyecto y sus envíos de destino físico. Opcional `comboId` selecciona un Combo; `range` acepta `7d`, `30d`, o `all` (por defecto) `30d`). | 400 inválidas `comboId`; 500 `{ "error": "read_failed" }` Si el libro no se puede leer |
| `GET /api/usage/timeline` | Uso por modelo/cuenta; acepta `hours`, `bucketMinutes`, `metric`, `aggregation`, `grouping`, separados por comas `models` y repetido `hiddenProvider` filtros | 400 consultas o límites no válidos |
| `GET /api/metrics` | Devuelve las métricas de texto process-local Prometheus para solicitudes y la cuota Kiro en caché. Las cuentas Kiro usan etiquetas de resumen opacas con límites; los identificadores de credenciales y cuentas sin procesar nunca se exportan. | 404 cuando `metricsExport.enabled` no era cierto al inicio; se requiere autenticación de administración ordinaria y las credenciales del plano de datos no otorgan acceso |
| `GET /api/storage` | Escanee el uso de almacenamiento Codex por cubo | Devuelve un `error: "scan_failed"` carga útil en fallo de escaneo |
| `POST /api/storage/cleanup/preview` | Vista previa de la limpieza de sesión archivada y devuelve un resumen vinculante | 400 `invalid_json` o `invalid_percent` |
| `POST /api/storage/cleanup` | Cuarentena o eliminar permanentemente el conjunto archivado previamente | 400 entradas no válidas; 409 estado viciado/ocupado/referenciado; 500 sistema de archivos/error de base de datos |
| `GET /api/storage/trash` | Lista de entradas de limpieza en cuarentena | 500 `trash_list_failed` |
| `POST /api/storage/trash/restore` | Restaurar una entrada en cuarentena | 400 identificación inválida; Error 404: Faltan los archivos 409 conflicto ocupado/destino; 500 falla de restauración |
| `GET /api/storage/trash/restore/test-stream` | Gancho de corriente de restauración de solo prueba | 404 `not_available` cuando los ganchos de prueba están apagados |
| `GET, PUT /api/storage/cleanup-policy` | Leer o actualizar la política de limpieza programada y el estado del trabajo | 400 Política inválida |
| `POST /api/storage/cleanup-policy/run` | Iniciar una ejecución manual de política de limpieza | 409 `already_running`; 500 `cleanup_failed` |
| `GET /api/storage/cleanup-policy/test-stream` | Solo prueba de la política de flujo gancho | 404 `not_found` cuando no está disponible |

Los identificadores del modelo de línea de tiempo se dividen en la primera barra, por lo que los id nativos anidados, como
`github-models/openai/gpt-4.1` son apoyados. Las exclusiones de proveedores se aplican antes de que las series en exceso plegado en `other`; el aditivo `appliedFilters` objeto se hace eco del modelo/proveedor normalizado filtros. La cubeta final incluye el intervalo parcial actual. Los configuración complementarios no son aplicado implícitamente a las llamadas generales API.

`GET /api/metrics` devoluciones `Content-Type: text/plain;version=0.0.4`. Contadores e histogramas reiniciar cuando se reinicia el proceso; `opencodex_metrics_process_start_time_seconds` identifica que límite. Los cubos de histograma son acumulativos y terminan con `le="+Inf"`, igual al número de la familia.

| Familia métrica | Etiquetas | Significado |
| --- | --- | --- |
| `opencodex_logical_requests_total` | `protocol`, `result` | Una observación por solicitud lógica finalizada. |
| `opencodex_physical_sends_total` | `protocol` | El flujo ascendente real envía sumas de intentos finalizados. |
| `opencodex_recoveries_total` | `protocol`, `recovery` | Diferentes tipos de recuperación observados por intento, proyectados a una clase cerrada. |
| `opencodex_request_failures_total` | `protocol`, `cause` | Solicitudes finalizadas que no entregaron respuesta, por la causa que derivó el grabador. Solo contra; ningún histograma lleva una causa. |
| `opencodex_request_duration_seconds` | `protocol`, `result` | Histograma de duración de cubo fijo para solicitudes finalizadas. |
| `opencodex_ttft_seconds` | `protocol`, `result` | Histograma TTFT de cubo fijo para solicitudes con primera salida observada. |
| `opencodex_ttft_missing_total` | `protocol`, `result` | Recuento complementario para solicitudes sin observar TTFT. |
| `opencodex_metrics_process_start_time_seconds` | ninguno | Límite de reinicio local del proceso. |
| `opencodex_kiro_quota_{used_credits,limit_credits,used_percent,seconds_to_reset}` | `account` (opaco) `o` más seis dígitos hexadecimales; como máximo 32 cuentas reales distintas) | Lecturas de plan Kiro en caché coincidentes con la identidad. Las lecturas faltantes, rancias, de fecha futura o pasadas por reajuste no emiten muestras; el raspado nunca escudriña de origen. |

Los `recovery` label toma uno de un conjunto fijo de clases: `transient`, `connection`, `credential`,
`rate_limit`, `quota`, `policy`, `ciphertext`, `payload`, `empty_completion`, `effort_downgrade`,
`fast_downgrade` y `other`. El conjunto de recuperación está cerrado; Los medidores de cuotas Kiro utilizan solo el etiqueta de resumen de cuenta opaca descrita anteriormente, nunca un identificador de cuenta en bruto. `fast_downgrade` registra un rechazo rápido Anthropic reparado de forma estándar velocidad; es distinto del esfuerzo de razonamiento `effort_downgrade` clase. `rate_limit`, `quota`,
`policy` y `ciphertext` están separados porque la respuesta del operador difiere: espera el límite, muévete a otra cuenta, cambia el mensaje o deja de estar encriptado. Estado. Una burbuja de razonamiento opaca rechazada cuenta como `ciphertext` en lugar de `payload`.

Si una fila escaneada excede el límite de tamaño del analizador existente, `GET /api/usage` y `GET /api/keys`
mantener los agregados de filas legibles y agregar `usageIncomplete: true` con
`usageIncompleteReason: "oversized_rows"` en el nivel de respuesta. Este diagnóstico sobrevive en caché respuestas y agrega incrementales, incluyendo resultados vacíos o sin igual; una reconstrucción lo recalcula. Ningún proveedor, modelo o identificador de clave API se acorta para que quepa una fila. Una bandera ausente no es prueba que cada registro de contabilidad era válido. Esto es separado de `historyTruncated`, `entriesTruncated`, y cobertura de medición token.

La proyección JEV informa de los recuentos y las puertas de decisión, aplicado frente a las selecciones de apertura por error, decisión latencia/confianza, TypeSafe-decisión informada tokens, recuentos de envíos de destino físico, modelo disponible token/totales de caché, selecciones de esfuerzo de razonamiento y solicitudes enviadas a un objetivo que no sea el de JEV elección inicial. `attempts` se suman de cada intento persistente `sendCount`; una fila de envío cero es No un fallback. Un objeto de uso reportado se cuenta una vez incluso cuando su intento se repite, por lo que el El recuento de intentos medidos puede ser menor que el recuento de envíos físicos. El modelo de cardinalidad está limitado; un La fila de desbordamiento explícito agrega identidades adicionales sin dejar caer totales de resumen.

Las estadísticas de JEV usan el mismo complemento solo `usage.jsonl` libro mayor y escáner cooperativo como uso ordinario. Las lecturas en frío escanean el libro mayor actual, las encuestas sin cambios no leen ningún archivo y el crecimiento verificado se pliega Solo el sufijo adjunto. Las solicitudes idénticas simultáneas comparten una exploración. El registro JEV persistente es cerrado y sin contenido: ID combinado, proveedor/modelo/esfuerzo seleccionado, puerta de decisión, latencia, opcional confianza/probabilidad, y uso de decisión numérica opcional. Nunca almacena mensajes, encabezados, credenciales, argumentos de herramienta o respuestas TypeSafe sin procesar. Las filas sobredimensionadas conservan el mismo positivo
`usageIncomplete` diagnóstico como el punto final de uso ordinario.

Nuevos intentos de xAI en `usage.jsonl` Incluya un tiempo de solicitud `credentialSource`: `grok-oauth`
para el transporte resuelto Grok CLI OAuth, o `xai-api-key` para el público xAI clave API transporte. Esta etiqueta fija no contiene credenciales ni identificador de cuenta. Pertenece a Cada elemento en `attempts`, por lo que el total agregado de token de un combo no debe atribuirse a su proveedor final. Los destinos personalizados y las filas históricas omiten el campo; los consumidores no inferir el uso de la suscripción desde la configuración actual, el nombre del modelo o la clave entrante API. El registro informa el uso, no los montos de la factura de suscripción.

Los intentos de clave API también registran `accountLogLabel` como `k` seguido de 32 dígitos hexadecimales en minúsculas. La etiqueta es los primeros 128 bits de SHA-256 sobre
`JSON.stringify(["ocx-key-account-v1", providerName, entryId ?? null, reference])`. La referencia es el valor de clave configurado capturado para la solicitud física, antes del entorno. o resolución de llavero. Las claves RAW, las referencias y los identificadores de grupo no se escriben en el campo etiqueta. Un consumidor puede derivar la misma etiqueta de su configuración local sin resolver secretos. Cambiar una clave o referencia literal cambia la etiqueta; reemplazando el secreto detrás de una clave sin cambios. referencia mantiene la misma cuenta lógica. Los registros sin etiquetar más antiguos no se pueden atribuir de manera confiable.

La selección de claves se registra después de que las solicitudes en cola se han reconstruido para la selección actual. Cuando un reintento cambia las claves, `attempts` conserva un registro separado para la clave anterior, incluyendo Uso reportado de respuestas fallidas. El uso faltante sigue sin ser reportado. Terminales adaptadores enrutados se observan antes de que los bucles de imagen/búsqueda o los protectores de continuación combinen su uso. Consumidores Suma los intentos planos por proveedor/cuenta y no vuelva a agregar el combo total padre. Estos Los registros identifican el uso; los porcentajes de cuota del proveedor siguen siendo observaciones separadas.

`GET /api/usage` lee `~/.opencodex/usage.jsonl` desde el principio hasta el libro mayor actual instantánea en un arranque en frío. Procesa trozos fijos de 1 MiB y conserva el estado agregado compacto en lugar de que cada fila de solicitud normalizada. Las actualizaciones posteriores validan el límite de línea anterior y solo se pliegan filas completas recién anexadas. Las llamadas simultáneas comparten la misma actualización. Predicados de rango y superficie se aplican al agregado de filas legibles, por lo que la ventana de bytes de lectura anterior y la tapa de filas analizadas no pueden omitir un prefijo de archivo anterior de los totales de 7 días, 30 días o todo el historial. `managementUsageMaxReadBytes` permanece Se acepta la compatibilidad con lectores heredados limitados, pero cambiarlo ya no se expande o reduce. la historia resumida por este punto final.

Pasar ambos `since` y `until` para seleccionar un intervalo personalizado inclusivo. Cada uno acepta enteros Unix época **milisegundos**, o una fecha ISO completa con una zona horaria explícita. Fechas no válidas, negativas o valores fuera de rango, límites invertidos y un único límite son rechazados. Límites personalizados anulan
`range`; la respuesta mantiene el preset `range` Campo de compatibilidad y añade `customWindow: true`, El exacto `since`, y `until`. `generatedAt` Es el momento en que se produce el informe.

Ventanas personalizadas filtran las entradas individuales del libro mayor antes de la agregación diaria, incluida la primera parcial y los últimos días. Ellos preservan `surface`, `provider`, `model`, y `apiKeyId` Filtrar y nunca reutilizar o sobrescribir resúmenes preestablecidos sin filtrar. El gráfico diario permanece limitado a 366 días calendario locales; Los totales cubren el intervalo completo solicitado. Los campos de ventana instantánea describen el libro mayor escaneado antes el filtro de tiempo, para que puedan extenderse más allá de los límites solicitados.

La página Uso acepta entradas locales de fecha/hora. Su minuto final seleccionado incluye la totalidad de minuto a través `:59.999`. Elegir un ajuste preestablecido o borrar la ventana personalizada restaura el comportamiento del ajuste preestablecido. Esto agrega una selección exacta del rango y estimaciones de costos existentes; no agrega cubos de gráficos por hora. o informes offline.

El libro mayor en entorno de ejecución es solo para anexar. Reemplazarlo o truncarlo, o cambiar los precios locales / zona horaria entradas, desencadena una reconstrucción completa. Si edita manualmente una fila anterior mientras el proxy está En ejecución, reinicie el proxy (o reemplace el archivo) antes de confiar en el nuevo total; actualizaciones incrementales verificar el límite del apéndice, no todos los bytes agregados previamente.

La respuesta sigue incluyendo `historyTruncated`, `truncatedPrefixBytes`, `entriesTruncated`, y
`entriesDropped` para que los clientes mayores puedan consumir la misma forma de alambre. Una exploración exitosa de todo el libro mayor informes `false`, `0`, `false`, y `0`, respectivamente. Estos son campos de compatibilidad heredados, no un señal de que el punto final lee solo una cola de tamaño configurado.

Porque `GET /api/usage?range=30d&surface=codex`, `accounts` contiene una fila por Codex observado etiqueta de la grupo. Cada fila reporta `accountLogLabel`, totales de token, `usageCoverageRatio`, y un opcional
`estimatedCostUsd` basado en los precios de visualización actualmente configurados. Usuario activo `modelCosts`
Las superposiciones tienen prioridad sobre el catálogo verificado incluido y las caídas de precios, y el uso histórico es Reestimación a partir del precio activo cuando se lee el resumen. Esta es una estimación API-equivalente, no un cargo de suscripción. Las nuevas solicitudes de grupos principales utilizan el `main` etiqueta; legado desnudo
`openai` las filas permanecen en un depósito ambiguo en lugar de ser reasignadas desde la configuración actual.

Los precios de los modelos manuales también se pueden editar desde **Modelos → Precio**. Sobrevive una insignia de precio manual Recargas de catálogo. Los precios se almacenan en `providers.<name>.modelCosts` y sobrevivir a la sincronización de catálogo. Tasas de usuario explícitas de todo cero significan una estimación conocida de cero; **Restablecer a automático** elimina el Anular y restaurar el catálogo habitual. Estos siguen siendo estimaciones de pantalla, no facturas.

`GET /api/providers/{provider}/model-costs` devoluciones `{ provider, modelCosts }`, con desinfectado cuatro entradas y sus opcionales `promptLengthPricing` política, tecleada por el ID exacto del modelo ascendente.
`PUT` en la misma ruta acepta `{ modelId, cost }`donde: `cost` contiene
`{ input, output, cacheRead, cacheWrite }` y opcionalmente `promptLengthPricing`, o es `null` para reiniciar. Las cuatro tarifas deben ser números finitos del 0 al 1.000.000, en USD por 1M tokens. Los campos desconocidos y las tasas malformadas son rechazadas. Una escritura conserva las anulaciones de otros modelos y devuelve `{ ok: true, provider, modelId, cost }`; restablecer las devoluciones `cost: null`.

Los **Precio del modelo** diálogo ofrece **Automático**, **Tarifa fija**, y **Umbral personalizado**
Precios de longitud rápida. Automático (también el valor predeterminado cuando la política está ausente) conserva el catálogo Contexto con las tasas de base guardadas. Flat desactiva los configuración de contexto. Personaliza selecciona cuatro Tasas absolutas alternativas usando un número entero seguro positivo `thresholdTokens` y `comparison`
(`"gt"` por `>`, `"gte"` por `≥`) Todo el recuento de tokens de prompt, incluidas las lecturas y escrituras en caché; La salida no lo hace. Las tarifas seleccionadas se aplican a toda la solicitud, incluida la producción, no solo a la exceso de tokens. Custom reemplaza la regla de contexto del catálogo tanto por debajo como por encima de su umbral. Las tarifas personalizadas son tarifas de velocidad estándar: un ajuste rápido / prioritario aplicable se aplica una vez después selección de velocidad y sigue la relación Prioridad del catálogo para ese modelo. Sólo un modelo cuyo Relación de catálogo `lower-bound` informes `priorityLowerBound: true`; un modelo sin regla de catálogo Aplica cualquier multiplicador de prioridad una vez.
`{ "mode": "automatic" }` se acepta en la escritura y se almacena como una política ausente, por lo que GET y PUT Los recibos nunca lo contienen.
**Restablecer a automático** elimina toda la anulación, incluidas las tasas base y la política. Ver la [ejemplo de configuración](../configuration/providers/#prompt-length-pricing).

```bash
ocx models price ollama/custom-model --json
ocx models set-price ollama/custom-model --input 0.50 --output 1.50
ocx models set-price ollama/custom-model --input 0 --output 0
ocx models set-price ollama/custom-model --auto
```

Tasas de caché-lectura/caché-escritura omitidas CLI predeterminadas a cero. Uso `--cache-read` y `--cache-write`
para establecerlas explícitamente. Un nombre de proveedor sigue siendo una identidad de configuración exacta; visualización de la cuenta Las etiquetas no son nombres de proveedores editables.

Filas en `models`, `providers`, y `days[].models` También lleva `cacheHitRate`: la parte de los insumos tokens servido desde la caché del proveedor, sujetado a `[0, 1]`. Es `null` — nunca `0` — cuando el proveedor no informó telemetría de caché o la fila no tiene entrada tokens, porque "no hay caché datos" y "una tasa de éxito genuina del 0%" son hechos diferentes y un gráfico que los hace iguales es engañosa.

:::caution
Los puntos finales de limpieza de almacenamiento pueden mover o eliminar permanentemente los datos de sesión archivados. Siempre vista previa primero y presentar el resumen devuelto. Prefiera la cuarentena cuando sea necesaria la recuperación.
:::

Los manifiestos de recuperación de limpieza se publican atómicamente, conservando el registro completo anterior. si un reemplazo falla antes de la publicación. Esto no revierte una purga permanente: restaurar puede fallar cuando una sesión grabada no tiene archivo de despliegue sobreviviente.

<a id="models-and-catalog"></a>

### Modelos y catálogo

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/catalog` | Devuelve el documento de catálogo Codex instalado. Los clientes remotos prefieren el plano de datos `GET /v1/catalog`, que todavía requiere una credencial de plano de datos ordinaria pero no un token de administración. | No se encontró la página |
| `GET /api/models` | Devuelve las filas del modelo dashboard/CLI | `catalog_busy` cuando la reunión es saturada |
| `GET /api/client-config?client=...` | Cree una configuración de cliente de solo lectura para cualquier integración de archivos compatible | 400 clientes no admitidos; 503 catálogo no disponible |
| `PUT /api/disabled-models` | Reemplazar la lista de modelos compartidos deshabilitados | 400 inválido JSON |
| `PUT /api/model-visibility` | Cambiar atómicamente la visibilidad a nivel de proveedor o modelo | 400 proveedor, alcance, objetivo o entidad no válidos; 409 `initial_model_selection_pending` (refrescar la lista de modelos y volver a intentarlo) |
| `GET, POST /api/custom-models` | Listar modelos personalizados o agregar uno | 400 campos no válidos; Falta el proveedor 404; 409 modelo duplicado |
| `PUT, DELETE /api/custom-models/{id}` | Editar o eliminar un modelo personalizado | 400 identificación/campos no válidos; Error: 404 Artículo no encontrado 409 modelo duplicado |
| `GET, PUT /api/selected-models` | Lea las listas de proveedores y la disponibilidad, o reemplace una lista | 400 proveedores/cuerpo ausentes; 404 proveedor desconocido; PUT 409 `initial_model_selection_pending` |
| `GET, PUT /api/model-presets` | Leer resúmenes preestablecidos o elegir el modo preset/all/custom | 400 modo no válido o preajuste no compatible; 404 proveedor desconocido; PUT 409 `initial_model_selection_pending` |
| `PUT /api/model-settings` | Editar los ejes de capacidad de un modelo enrutado en su lugar | 400 proveedores/modelId que faltan, proveedores desconocidos o nativos/combo, campo mal formado, campo desconocido, ID de modelo no exacto o un esfuerzo predeterminado no válido para la escalera resultante; 500 cuando no se pudo guardar la configuración (la configuración en vivo no cambia) |

`PUT /api/model-settings` toma `{ provider, modelId }` más cualquiera de `contextWindow`,
`inputModalities`, `reasoningEfforts`, y `defaultReasoningEffort`. Escribe el nivel de proveedor por modelo mapea el entorno de ejecución que ya se lee (`modelContextWindows`,
`modelCapabilities.<modelId>.inputModalities`, `modelReasoningEfforts`,
`modelDefaultReasoningEfforts`), por lo que una fila editada mantiene su procedencia de descubrimiento en lugar de ser reemplazado por un modelo personalizado. `inputModalities` acepta `text`, `image`, y `audio`;
`reasoningEfforts` debe ser un subconjunto de los esfuerzos que el runtime conoce. Campos de solicitud desconocidos son rechazados por su nombre. `modelId` debe ser exacto, sin espacios en blanco circundantes, control caracteres, longitud excesiva o un nombre de propiedad de objeto reservado. `contextWindow` debe ser
`null` o un número entero seguro positivo.

Cada campo es opcional, y `null` **borra** la declaración en lugar de escribir un defecto, que devuelve el hecho al registro, al catálogo y al proveedor. Un vacío
`inputModalities` array también se borra, mientras que un vacío `reasoningEfforts` La matriz se almacena como un explícito "este modelo no tiene peldaños de razonamiento" sobre — que no está claro. Liquidación `inputModalities` También elimina el legado exacto `modelInputModalities` La entrada para ello modelo, por lo que una restauración no puede dejar una declaración anterior en vigor; claves de familia compartidas con otros modelos se quedan. Un mapa vacío por modelo se elimina en lugar de dejar como `{}`. Una petición que no cambia nada respuestas `changed: false` con el estado almacenado. El recibo también informa `saved` (Si esto solicitud de configuración publicada), `hasOverrides` (si alguno de los cuatro ejes permanece almacenado), y
`catalogRefresh` (`committed`, `skipped`, o `failed`) Estos campos distinguen un no-op con Declaraciones almacenadas de un modelo sin nada que restaurar. Una solicitud modificada persiste atómicamente; un fallo de guardado no publicado deja la configuración en vivo sin cambios. Después de la publicación el servidor elimina el caché de ese proveedor `/models` resultados e informa el resultado del catálogo. Un escrito publicado seguido de un error de contabilidad todavía devuelve `saved: true` con un refresco saltado. La reunión bake resuelve pistas en las filas que almacena en caché, y un golpe de caché solo puede bajar una ventana configurada, así que una anulación elevada o borrada de lo contrario leería la respuesta anterior para todo el TTL. Solo los proveedores enrutados son direccionables: `openai` es el carril de paso nativo y `combo` es una fila sintética, por lo que tampoco lo es un proveedor cuyo modelo mapas de donde provienen estos hechos. Mostrar nombre no es parte de esta ruta; usar
`PUT /api/providers/{provider}/model-display-names`.

`GET /api/models` informa el exacto almacenado `contextWindowDeclared` separadamente de la eficaz `contextWindow`. El editor de Modelos comienza desde la declaración y muestra el ventana como una pista heredada cuando no existe ninguna declaración. Si se desconoce el resultado, o save tuvo éxito pero la lista de modelos no se recargó, el diálogo deshabilita las escrituras y ofertas adicionales una recarga de solo lectura. Después de una recarga exitosa, vuelva a abrir la fila para inspeccionar los valores almacenados. A `catalogRefresh` que fracasó, o fue saltado con `retryable: true`, deja el guardar en su lugar y muestra una advertencia para ejecutar Sync; un salto no reintentable significa que no se administra el catálogo Codex y es un guardado limpio.

Un modelo manual reemplaza la fila del panel Modelos con el mismo proveedor y el mismo ID de modelo. Para OpenAI, la fila manual se mantiene `openai/<model>` y soporta los mismos controles de visibilidad como otros modelos enrutados; eliminarlo restaura la fila del panel de control nativo desnudo. Explícito Las filas nativas calificadas para cuentas permanecen separadas. Esto no cambia el nombre de las rutas nativas desnudas o cambiar derechos de cuenta. Los objetivos de visibilidad OpenAI no nativos deben coincidir con una configuración modelo manual.

Solicitudes válidas de PUT `/api/selected-models` y `/api/model-presets` devolver HTTP 409 con código `initial_model_selection_pending` hasta que esté disponible una lista de modelos inicial confiable. Actualizar el descubrimiento del modelo (por ejemplo, `GET /api/models`) y volver a intentarlo después de que tenga éxito.

Visibilidad/selección exitosa escribe a `/api/disabled-models`, `/api/model-visibility`,
`/api/selected-models`, y `/api/model-presets` Informe de resultados en `catalogRefresh`
y `clientIntegrations` cuando se ejecuta ese camino de actualización. HTTP 200 `ok: true` confirmar el selección guardar; no garantizan que todos los catálogos de clientes estén actualizados. Inspeccionar
`clientIntegrations[]` por `ok: false`, `client`, opcional Aside `profileId`, y el rechazo
`reason`Los detalles de recuperación también pueden incluir `refusalReason`, `snapshotPath`, y `residual`. La página Modelos mantiene la selección guardada y muestra una advertencia de actualización del cliente por separado. Inspeccione las integraciones y resuelva el problema reportado antes de volver a intentar `ocx sync`. Falta Los campos de resultado de un servidor antiguo no establecen una recuperación exitosa.

<a id="oauth-accounts-provider-keys-and-data-plane-keys"></a>

### Cuentas OAuth, claves de proveedor y claves de plano de datos

Las filas de la cuenta OAuth siempre incluyen `plan`: una etiqueta de suscripción ascendente validada o `null`
cuando desconocido. Anthropic niveles de perfil informe etiquetas como `max_20x`, `max_5x`, o `pro`; Antigravedad prefiere el nivel pagado (por ejemplo `g1-pro-tier`) sobre el nivel actual. Las etiquetas se leen al iniciar sesión/importar o actualizar, nunca se infieren de los porcentajes de cuota.

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/oauth/providers` | Listar proveedores con flujos de inicio de sesión públicos OAuth | — |
| `GET /api/key-providers` | Lista de proveedores configurados a través de API-key login | — |
| `POST /api/oauth/login` | Inicie un inicio de sesión OAuth o flujo de adición de cuenta. `mode: "code"` inicia un inicio de sesión de visualización de código (solo Anthropic) y devuelve `mode`, `flowId`, `expiresAt` | 400 proveedor desconocido/inválido, inválido `mode`, `code_mode_unsupported`; `oauth_mutation_busy` |
| `POST /api/oauth/login/code` | Envíe una devolución de llamada manual URL o código de autorización. Para un flujo de visualización de código (con `flowId`) devuelve el resultado del intercambio token `{ok, account}` / `{ok:false, error}` | 400 proveedor/código no válido, `state_mismatch`, `invalid_or_expired_code`, `provider_unreachable`, `malformed_input`; 409 `no_pending_login`; `oauth_mutation_busy` |
| `POST /api/oauth/login/cancel` | Cancelar un flujo público en progreso OAuth; una opción `flowId` Nombres de un flujo de visualización de código (se rechaza el flujo de otro proveedor) | 400 proveedor desconocido |
| `GET /api/oauth/status` | Sondear el flujo OAuth de un proveedor | 400 proveedor desconocido |
| `POST /api/oauth/logout` | Eliminar la credencial de proveedor seleccionada | 400 proveedor desconocido; `oauth_mutation_busy` |
| `GET /api/oauth/accounts` | Lista de cuentas enmascaradas; Anthropic y las filas genéricas de la cuenta OAuth incluyen sus `paused` Estado. Las filas Kiro incluyen `autoSelectable` y un cerrado `skipReason` cuando se excluye de la selección automática; un singleton activo todavía puede enviar. La cuota sigue siendo opt-in. | 400 proveedor no válido |
| `DELETE /api/oauth/accounts` | Eliminar una cuenta | 400 proveedor/identificador no válido; 404 falta la cuenta; `oauth_mutation_busy` |
| `PUT /api/oauth/accounts/active` | Seleccione la cuenta OAuth activa | 400 proveedor/cuenta no válido; 404 falta la cuenta; 409 cuenta pausada; `oauth_mutation_busy` |
| `PUT /api/oauth/accounts/pause` | Pausa o reanuda una cuenta Anthropic o una cuenta genérica OAuth. Cuerpo `{ provider, accountId, paused }`; pausar la cuenta activa selecciona la siguiente cuenta utilizable cuando esté disponible. La pausa es duradera e independiente de la habilitación de la grupo; el currículum preserva la salud y las credenciales. | 400 proveedor no soportado o cuerpo inválido; 404 falta la cuenta; `oauth_mutation_busy` |
| `GET, PUT, PATCH /api/pool/settings` | Leer o actualizar la política de pool para cualquier tipo (códice, antrópico, genérico); responde con las mismas claves para los tres y declara en `supported` que la bondad honra | 400 proveedor desconocido, un campo que el tipo no admite o un valor no válido |
| `GET, PUT, PATCH /api/oauth/accounts/pool` | Política de legado por grupo para Anthropic y genérico OAuth proveedores; reemplazado por `/api/pool/settings` y mantenido para los clientes existentes | 400 proveedor de códice o api-key, o política inválida |
| `POST /api/oauth/accounts/clear-cooldown` | Borrar una cuenta OAuth tiempo de reutilización | 400 proveedor/cuenta no válido |
| `PUT /api/oauth/accounts/alias` | Establecer o borrar un alias de cuenta OAuth | 400 proveedor/cuenta/alias no válido |
| `GET, POST, DELETE /api/providers/keys` | Enumerar las claves de proveedor enmascaradas, agregar/activar una o eliminar una | 400 entradas no válidas; Error 404 - Falta el proveedor/clave |
| `PUT /api/providers/keys/active` | Seleccione la clave activa de un proveedor | 400 entradas no válidas; Error 404 - Falta el proveedor/clave |
| `PUT /api/providers/keys/alias` | Establecer o borrar un alias de clave de proveedor | 400 entradas no válidas; Error 404 - Falta el proveedor/clave |
| `GET, POST, PATCH, DELETE /api/keys` | Listar, crear, editar o eliminar las claves de admisión del plano de datos | 400 cuerpo/identificación no válido; Error 404: Errores técnicos |

Para Anthropic, `routes` Es una orden ordenada de `{name, match, accounts, fallback?}` reglas en ambos puntos finales de configuración. GET y los ecos de escritura incluyen `routes` (`null` cuando están ausentes); los DTO unificados exponen `routes: null` para otros tipos. Un suministrado `routes` en otro tipo es rechazada. La omisión preserva las reglas, `[]` No coincide con nada, y `null` los limpia. Los `accounts` Los valores son ID almacenados; los ID eliminados siguen siendo válidos en una regla, por lo que volver a agregar una cuenta puede restaurar el enrutamiento. Las respuestas de la administración conservan nombres configurados válidos; los registros de solicitudes identifican una coincidencia solo como `route:#<n>` (1 posición de lista basada). Si una regla almacenada editada a mano no es válida, ambas configuración `routes: null` y a `routesError` diagnóstico en lugar de presentar esa regla como válida; el valor almacenado permanece disponible para corrección. Reglas válidas o ausentes omitir `routesError`.

Las respuestas de la lista de credenciales se enmascaran deliberadamente. OAuth acceso tokens y proveedor completo API Las claves no se devuelven a los clientes del panel de control.

<a id="protocol-paths"></a>

### Rutas de protocolo

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/protocols` | Devuelve la versión del contrato de protocolo, qué API se sirven, la configuración del protocolo, la revisión de directiva actual y las características de la solicitud que entiende una vista previa | — |
| `GET /api/protocols?provider=<name>` | El mismo cuerpo más `provider`: `{ name, adapter, adapterSource, authMode, upstream, modelOverrides: [{ model, adapter, source }] }` — el cable que recibe el proveedor y quién lo decidió (`hard-pin`, `operator`, `registry`, `provider-default`), con hasta 64 modelos en un cable diferente (`modelOverridesTruncated: true` más allá de eso). Ninguna credencial o base URL | 400 caracteres vacíos, repetidos, más de 200 caracteres o caracteres de control; 404 ningún proveedor con ese nombre |
| `POST /api/protocols/plan` | Vista previa de la ruta que tomaría una solicitud: `{ "model": "...", "inbound": "responses" \| "chat" \| "messages", "features": [...] }` devuelve la ruta de solicitud y respuesta de cada candidato, el modo de entrega, la fidelidad, los efectos de las características y las razones | 400 JSON no válido, campo desconocido, modelo de más de 200 caracteres, entrada desconocida o más de 24 / características desconocidas |
| `PATCH /api/protocols/settings` | Cambiar la configuración del protocolo: `{ "messagesEnabled"?: boolean, "unrepresentable"?: "legacy" \| "reject", "rollout"?: { ...boolean switches } }`. Devuelve el mismo cuerpo que `GET /api/protocols`. Cierre Messages también establece `claudeCode.enabled` a `false` en el mismo salvo; al abrirlo escribe solamente `apiSurfaces.messages.enabled` | 400 inválido JSON, cuerpo vacío, campo desconocido, tipo incorrecto, o `rollout.managedMessagesNativeOAuth` sin `rollout.managedMessagesNative`; 409 configuración ocupada; 500 guardar falló (nada cambia) |

Una vista previa se calcula a partir de la configuración sola. No envía nada a ningún proveedor, no cuesta nada, no avanza la rotación combinada, y no se registra. La página API en el panel de control muestra lo mismo vista previa bajo **Solicitar vista previa de ruta**. Un modo de entrega de `native` Describe cómo la solicitud viajes; no es una verificación de compatibilidad.

Los `?provider=` Formar de nuevo el **Alambre corriente arriba** sección de la configuración de un proveedor. Informes el formato opencodex envía a ese proveedor; no abre ni cierra ningún cliente API. Para cambiar el adaptador de todo el proveedor, guarde la configuración del proveedor como de costumbre (`PATCH /api/providers`).

`PATCH /api/protocols/settings` es el único escritor aquí y respalda la palanca Messages Página API. El CLI maneja estas rutas con `ocx api protocols`, `ocx api explain` y
`ocx api policy`. Los interruptores de despliegue están por etapas y desactivados por defecto ([Rutas de protocolo](/es/guides/protocol-paths/#rollout-switches)); véase
[Superficies API](/es/reference/configuration/server/#api-surfaces-apisurfaces) para cómo el Messages La configuración interactúa con `claudeCode.enabled` a través de actualizaciones y degradaciones.

<a id="providers"></a>

### Proveedores

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/providers` | Listar la configuración del proveedor redactado y el estado de descubrimiento | — |
| `POST /api/providers` | Agregar o reemplazar un proveedor validado y, opcionalmente, hacerlo predeterminado | 400 destino o configuración no válido/peligroso; 409 Colisión de espacio de nombres |
| `PATCH /api/providers?name=...` | Actualizar los campos de proveedor permitidos (incluyendo una combinación `headers` bloque), estado habilitado/predeterminado, o modo de cuenta OpenAI | 400 campo no válido o transición; 404 proveedor desconocido |
| `DELETE /api/providers?name=...` | Eliminar un proveedor, reasignar el valor predeterminado cuando sea posible | 404 proveedor desconocido; 409 `last_provider`; 409 `provider_has_dependent_combos` |
| `POST /api/providers/test?name=...` | Realizar una sonda de conectividad/descubrimiento de proveedor en vivo limitada | 404 proveedor desconocido; los fallos se devuelven normalmente como `ok: false` pruebas |
| `GET /api/provider-quotas` | Leer los informes de cuotas de proveedores; `refresh=1` fuerzas refrescan | — |
| `GET /api/quota-resets` | Listar los restablecimientos de la ventana de cuota detectados recientemente y si la detección está habilitada; `limit=<n>` Caps la cuenta | 400 inválidas `limit` |
| `GET, PUT /api/provider-context-caps` | Leer o actualizar los límites de contexto globales, de todos los proveedores o de un solo proveedor | 400 solicitud inválida; 404 proveedor desconocido |
| `GET /api/provider-presets` | Devolver los configuración preestablecidos del proveedor GUI derivados del registro en entorno de ejecución | — |

El proveedor lee incluye el booleano opcional `inferContextWindow` cuando se configura. Proveedor PATCH acepta solo un booleano o `null` para limpiar esta configuración; la omisión lo preserva. Un mismo nombre POST también conserva una configuración omitida, incluida la última configuración almacenada `false`; una presentación explícita booleano gana. Véase [Ventanas de contexto en proveedores personalizados](/es/reference/configuration/providers/#context-windows-on-custom-providers)
por su comportamiento predeterminado, solo de proveedor personalizado.

Cuando el punto final de cuota-resumen de Antigravedad no tiene una respuesta utilizable, los informes de cuota también pueden incluir Por modelo Cloud Code Assist ventanas de uso cuando la respuesta modelo-descubrimiento les proporciona. Estos las mediciones son diagnósticas; una ventana de modelo ausente no establece que el modelo no está disponible.

La respuesta del proveedor incluye `caps` (límites activos) y `values` (último seleccionado valores, retenidos mientras están deshabilitados). Habilitar un proveedor sin `value` restablece su selección, o utiliza el sistema global `contextCapValue` En primer lugar habilitar. Esto también se aplica a OpenAI: el interruptor no selecciona un modo especial 922k. Una tapa activa limita cada ventana nativa; modelos con una La ventana de contexto largo compatible puede expandirse solo hasta su propio techo compatible. Actualizando el valor global con `{ "value": 600000, "setAll": true }` Solo se permiten cambios tapas de proveedores; los proveedores deshabilitados mantienen sus selecciones recordadas cuando se habilitan más tarde. En contraste, `{ "setAll": true }` sin `value` permite a todos los proveedores configurados en el valor global actual, reemplazando sus selecciones recordadas. Apagar una tapa no activar su valor recordado o borrar la selección.


`provider_has_dependent_combos` es una barrera de seguridad: eliminar o editar los combos dependientes antes de Eliminar a su proveedor.

<a id="sidebar-and-consent-bound-actions"></a>

### Acciones de barra lateral y vinculadas al consentimiento

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/github/star` | Leer el estado de la estrella del repositorio a través del usuario `gh` período de sesiones | Códigos de resultados fijos específicos del estado |
| `POST /api/github/star` | Protagoniza el repositorio solo desde una acción humana autenticada | 403 `agent_consent_required` para personas que llaman impulsadas por agentes sin evidencia de sesión en el panel |
| `GET /api/update/badge` | Leer la insignia del paquete almacenado en caché sin una búsqueda del registro; Devoluciones de caché faltantes, erróneas o de hace 40 horas `unknown: true`. `surface=desktop&session=<id>` lee solo esa sesión de aplicación de escritorio. | 400 superficie no válida; la sesión de escritorio faltante o vencida vuelve `unknown: true` |
| `POST /api/update/desktop-snapshot` | El shell de escritorio publica su estado de visualización Tauri-updater a través del cliente proxy vinculado | 403 si un `Origin` El encabezado está presente o el principal no es el raw `admin-token`; 400 campos no válidos; 413 sobre 1 KiB |

La instantánea del escritorio es un estado de visualización temporal, no una solicitud de instalación. El proxy almacena un máximo de 32 sesiones en memoria y expira 180 segundos después de su último latido. Un navegador normal sin surface-desktop continúa leyendo la insignia del paquete.

El proxy comprueba la instalación de un paquete elegible después del inicio cuando falta su caché o tiene más de 20 horas, y comprueba la frescura cada hora. Establecer `OCX_DISABLE_UPDATE_CHECK=1` para desactivar las comprobaciones automáticas. Las solicitudes explícitas de verificación y ejecución aún funcionan.

:::caution
La autenticación de administración prueba el acceso al proxy; no prueba el consentimiento para gastar el proxy. identidad del usuario. Un agente no debe recorrer `agent_consent_required`. El usuario debe elegir si se debe estrellar el repositorio.
:::

<a id="system-lifecycle"></a>

### Ciclo de vida del sistema

`POST /api/system/restart` mantiene el drenaje de 60 segundos por defecto, incluyendo las solicitudes Sin cuerpo o `{}`. Una persona que llama autenticada puede enviar explícitamente un cuerpo JSON tal como `{"drainGraceMs":2000}` para elegir una gracia más corta de solicitud activa/drenaje con alcance. El valor debe ser un entero de 1 a 60000 milisegundos. Cuerpos o valores no válidos devuelva 400 antes de iniciar un drenaje; el límite estándar del cuerpo de administración aún se aplica. La capacidad de reinicio local de destino conserva la gracia predeterminada; configurando este La opción cuerpo requiere una sesión de administración o administración token (de lo contrario 403). La respuesta es `drainTimeoutMs` informa de la gracia aceptada. Las llamadas repetidas retienen la gracia del primer reinicio aceptado y no cambia su fecha límite.

La gracia se mide a partir de la aceptación, incluyendo el retraso de respuesta. La limpieza El perro guardián permanece 60 segundos y la preparación para el reemplazo conserva sus 70 segundos separados presupuesto. Una gracia corta puede interrumpir un giro que ya se ha ejecutado de origen. Compruebe su resultados antes de volver a presentar; OpenCodex no añade ninguna repetición automática de trabajo ambiguo, y un reemplazo saludable no prueba que el reenvío sea seguro. El panel de instrumentos, CLI, bandeja y los reinicios automáticos continúan usando el valor predeterminado de 60 segundos.

Durante un drenaje de reinicio, las nuevas solicitudes de plano de datos reciben HTTP 503 con JSON
`error.type: "server_error"`, `error.code: "server_restarting"`y el mensaje"OpenCodex se está reiniciando; reintente esta solicitud". Responses retener `Retry-After: 5`
y la política CORS del oyente receptor. Este código permite que todas las versiones de Codex vuelvan a intentarlo el 503 sin informar de la capacidad del modelo; los errores de sobrecarga del proveedor conservan su asignación separada.

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET /api/system/memory` | Devuelve métricas de proceso escalar, montón, flujo, estado de respuesta, vigilancia y turno activo. Los diagnósticos del estado de respuesta incluyen el estado de desbordamiento-escritura, fallas consecutivas, clase de falla fija segura para la privacidad y las últimas marcas de tiempo de falla/éxito. `spillLastWriteFailureOrigin` es `retry_returned_timeout`, `timeout_memo_refusal`, o nulo; acumulativo `spillAclRetryReturnedTimeouts` y `spillAclTimeoutMemoRefusals` Recuento de publicaciones fallidas; acumulativo `spillCapacityRefusals` y `spillHeadroomEvictions` Las continuaciones de conteo se negaron en el techo del derrame y las continuaciones fueron desalojadas para dejar espacio para una más nueva. Véase [Diagnósticos de derrame Windows](/es/troubleshooting/windows-memory/) para la semántica local de procesos. Los errores crudos y los caminos nunca son devueltos. | — |
| `POST /api/system/restart` | Iniciar un reinicio del proceso consciente de drenaje sin eliminar la inyección del cliente; opcional JSON `drainGraceMs` explícitamente acorta la gracia predeterminada de los 60 | Devuelve 202; las llamadas repetidas informan de la gracia existente; 400 cuerpo inválido o gracia |
| `POST /api/stop` | Detener el servicio, restaurar Codex nativo, quitar la inyección administrada de Grok y drenar el proxy | 409 conflicto de propiedad del servicio; 409 `respawnable_service` cuando un envoltorio del planificador de tareas Windows podría reaparecer el proxy y el llamante no es `ocx stop` (Nada cambia). 409 `self_unload_service` cuando este proxy se está ejecutando como el servicio de lanzamiento / systemd instalado, porque detener el administrador desde dentro terminaría el proceso antes de que native Codex es restaurado — ejecutar `ocx stop` En cambio (nada se cambia); 409 cuando el administrador instalado se niega a detenerse; 409 `service_state_unknown` cuando no se puede leer el estado del Programador de tareas (no se cambia nada; reparar la consulta y volver a intentar) |
| `GET /api/system/codex-app-server` | Informe si los servidores de aplicaciones Codex en ejecución son anteriores al catálogo actual del modelo | — |
| `POST /api/system/codex-restart` | Actualizar el catálogo y reiniciar los servidores de aplicaciones Codex. La aplicación de escritorio Codex se cierra completamente y se vuelve a lanzar cuando se lanzó antes de que se escribiera el catálogo actual, cuando esta solicitud cambia la `model_catalog_json` vinculante (incluso si el shell es más nuevo que el archivo de catálogo), o cuando no se puede determinar su estado de selector, por lo que el selector de modelos se recarga; un escritorio en ejecución con un selector actual permanece abierto con `desktopApp.reason: "picker_current"`. Vuelve un escritorio cerrado `desktopApp.reason: "no_targets"`; su `pickerState` puede ser `not_running`, o `stale` cuando esta solicitud cambió el enlace del catálogo. `desktopApp.pickerState` informa la lectura que se decidió (`current`, `stale`, `unknown` o `not_running`) Cuando el propio proxy se ejecuta dentro de la aplicación Codex, se rechaza el reinicio del escritorio en lugar de transferirlo. | Devuelve 200 con `code: partially_stopped` Cuando un objetivo sobrevive |

<a id="codex-authentication-delegation"></a>

### Delegación de autenticación Codex

`GET /api/settings` Reporta la eficacia `codexAccountPickerEnabled` booleano. A `PUT` que contiene que el booleano estricto inicializa los selectores de cuenta seguros para la privacidad al habilitar un mapa vacío, conserva etiquetas selectoras existentes al deshabilitar o volver a habilitar, persiste primero y luego solicita una convergencia de catálogos solo cuando cambia la visibilidad efectiva del selector. La respuesta exitosa incluye
`catalogRefreshPending`: `false` significa que se completó la confirmación del catálogo (o no se necesitó actualización), mientras
`true` significa que el entorno se salvó, pero `POST /api/sync` Se debe usar para volver a intentar la actualización del catálogo. Persistencia o error de asignación de selector devuelve la configuración en memoria y no se ejecuta convergencia.

El despachador de administración raíz delega todos los `/api/codex-auth/*` solicitud a la cuenta Codex gerente. Sus rutas son:

| Método y ruta | Finalidad | Errores notables |
| --- | --- | --- |
| `GET, POST, DELETE /api/codex-auth/accounts` | Listar/actualizar o eliminar cuentas Codex. POST se mantiene como un punto final de compatibilidad deshabilitado; las respuestas exitosas de DELETE incluyen `catalogRefreshPending`. | POST siempre devuelve 403 `manual_import_disabled`; 400 entrada inválida DELETE |
| `PUT /api/codex-auth/accounts/alias` | Establecer o borrar un alias de cuenta | 400 cuenta/alias no válida |
| `PUT /api/codex-auth/accounts/pause` | Pausa o reanuda manualmente una cuenta y sus entradas principales/grupo coincidentes existentes; devuelve `affectedAccountIds` | 400 cuenta/estado no válido; 404 Cuenta perdida 503 identidad principal ocupada o ilegible |
| `PUT /api/codex-auth/accounts/pause-exhausted` | Pausa las cuentas cuya cuota se ha agotado | Los fallos de bloqueo de mutación se convierten en 503 |
| `PUT /api/codex-auth/accounts/credits` | Permitir o dejar de gastar créditos ChatGPT después del límite de uso. Cuerpo `{ id, creditsAfterLimit }` por una cuenta, incluyendo `__main__`: true añade el id a `creditCodexAccountIds`, false lo elimina. Cuerpo `{ all }` para el cambio global: listas verdaderas `__main__` y cada cuenta de grupo, falsa borra la lista. Se aplica a la siguiente selección. | 400 ID no válido o valor no booleano; 404 falta la cuenta |
| `PUT /api/settings` con `codexQuotaAutoRefresh: { id, window, enabled }` | Habilitar o deshabilitar la activación automática de ventana de 5 horas o semanal para una cuenta | 400 id/ventana/estado no válidos; 404 Cuenta perdida 409 Ventana no disponible |
| `POST /api/codex-auth/accounts/clear-cooldown` | Borrar el tiempo de reutilización en entorno de ejecución para una cuenta o todas las cuentas | 400 ID no válido |
| `GET, PUT /api/codex-auth/active` | Leer o seleccionar la cuenta activa | 400 cuenta inválida o faltante; 409 conflicto pausado/fila de herencia o `account_selection_unavailable` |
| `PUT /api/codex-auth/auto-switch` | Establecer el umbral de cuota global con `{ threshold }`o una cuenta con `{ id, threshold }`; `null` restaura la herencia global, y `__main__` selecciona el inicio de sesión del escritorio | 400 identificación inválida/umbral; 404 falta la cuenta |
| `GET /api/codex-auth/preserve-signed-in` | Leer política, actual `affectedAccountIds`, `identityKnown`, `nextAccountId`, `nextUsesSignedInQuota` (Próxima elección real, incluso cuando está deshabilitado), `pinnedAccountId`, `bindings`, `priorityFailbackEnabled`, y `fallbackConsumesSignedInQuota` | 503 perfil nativo ocupado/ilegible |
| `PUT /api/codex-auth/preserve-signed-in` | Estricto `{ enabled: boolean, applyToBound?: boolean }`; explícito `applyToBound: true` requiere habilitado, libera los enlaces/pin afectados para la próxima solicitud; informes `releasedPin` | 400 cuerpos inválidos; 503 perfil nativo ocupado/ilegible |
| `PUT, PATCH /api/codex-auth/pool-strategy` | Actualizar la estrategia de selección de grupos de cuentas Codex | 400 estrategia/configuración no válida |
| `PUT /api/codex-auth/failover` | Establecer el umbral de conmutación por error de la cuenta | 400 umbral inválido |
| `GET /api/codex-auth/quota` | Leer el estado de la cuota en caché por cuenta | — |
| `GET /api/codex-auth/low-quota-events?limit=20` | Lea solo los últimos eventos de registro/aviso de cuota baja 0–100 de este servidor (por defecto 20); incluye el id y el estado de la cuenta (`logged` para la alerta de solo registro predeterminada o un host sin un notificador compatible; `delivered` cuando el notificador del sistema operativo haya aceptado la notificación; `failed` cuando falla o se agota; `cancelled` Cuando su episodio terminó primero; `succeeded` para una pausa completa guardar) | 400 límite no válido; se requiere autenticación de administración |
| `GET /api/codex-auth/reset-credits` | Inspeccione la elegibilidad de reset-credit para una cuenta | 400 ID de cuenta faltante; paso de estado ascendente; Fallo de búsqueda 500 |
| `POST /api/codex-auth/reset-credits/consume` | Consume un crédito de reinicio elegible. Opcional `operationId` (UUIDv4) hace que la redención sea idempotente: el mismo id reproduce un resultado duradero en lugar de gastar un segundo crédito. | 400 ID de cuenta faltante o no válido `operationId`; 409 `identity_mismatch` cuando el id pertenece a otra cuenta; 503 `server_busy`, `capacity`, o `unavailable`; 500 consumen fracaso |
| `POST /api/codex-auth/login` | Iniciar inicio de sesión o reautenticación Codex | 400 solicitudes no válidas; estados de inicio de sesión conflictivos/ocupados |
| `POST /api/codex-auth/login/code` | Envíe un código manual para un flujo de inicio de sesión Codex | 400 flujo/código no válido |
| `POST /api/codex-auth/login/cancel` | Cancele solo el inicio de sesión Codex pendiente identificado por `{ "flowId": "..." }` | 400 ID de flujo faltante, desconocido o no pendiente |
| `GET /api/codex-auth/login-status` | Sondear un flujo o estado de inicio de sesión de cuenta. Un flujo de cuenta nueva completado incluye `catalogRefreshPending: true` Sólo cuando sea necesaria la recuperación. | Informe de flujos desconocidos `expired`; no hay informes de flujo activo `idle` |

`PUT /api/codex-auth/active` requiere `{ "accountId": "<id>" }` o una explícita
`{ "accountId": null }` Para una clara selección. La re-selección de la cuenta corriente es una selección incluso si otro proceso cambió la cuenta guardada. El servidor conserva las configuración guardada y rechaza los objetivos eliminados o pausados desde que se cargó el panel de control. Un no disponible o la configuración guardada inválida deja la selección y afinidad en vivo anterior sin cambios; recarga configuración antes de volver a intentarlo. Una respuesta exitosa describe la selección comprometida. Contingente existente y las reglas de conmutación por error aún pueden liberar un pin; `pinDrained` reporta una razón de drenaje conocida actualmente.

Para el consumo de reset-crédito, una `operationId` mientras que el mismo físico cuenta tiene una operación inconclusa se une a esa operación como un alias. Su reintento utiliza el ID original de la solicitud ascendente y registra el resultado bajo esa misma identidad, por lo que más tarde solicitudes con el ID original o un alias conocido reproducen el resultado almacenado sin consumir solicitud. Una identificación nunca antes vista suministrada después de la liquidación comienza una nueva explícita redención; los clientes que reintentan una acción existente deben conservar su ID.

Después de un manual confirmado `reset`, OpenCodex comprueba el uso fresco para esa misma cuenta y puede conciliar su tiempo de reutilización derivado del reinicio compartido preexistente elegible inmediatamente. Cuentas en pausa, cuentas que requieren reautenticación y tiempos de reutilización que ya son propiedad de un La sonda en vuelo permanece excluida de esta recuperación; sus tiempos de reutilización se conservan. Uso comenzó antes del restablecimiento, el uso incompleto o agotado, una cuenta cambiada y una nueva El fracaso de la cuota no califica. Las respuestas de uso de cuenta principal más antiguas no pueden reemplazar una respuesta más nueva. Publicada observación. Si el uso necesita actualización de credenciales, la recuperación requiere esa actualización linaje confirmado; una credencial reemplazada externamente no califica simplemente porque pertenece a la misma cuenta. Explícito `Retry-After`, Reserva los tiempos de reutilización, pausa configuración, los pines y la cuenta seleccionada se conservan. `already_redeemed` y durable La repetición no prueba un nuevo restablecimiento y no obtiene este comportamiento de recuperación.

Una actualización de uso fallido o ocupado después de una confirmación `reset` o `already_redeemed` no hace convertir el consumo completado en un error: la respuesta sigue siendo HTTP 200 con su consumir `code`Omitiendo `remaining` cuando no se obtuvo un recuento reciente. Esta respuesta confirma el resultado del consumo, no que la cuenta ahora esté enrutable. Actualizar el uso para comprobar disponibilidad; no consuma otro crédito para volver a intentar una actualización de uso fallida.

Si se guarda una nueva fila de configuración de cuenta pero la configuración de credenciales no puede finalizar, OAuth `login-status` informes
`status: "error"` con
`code: "codex_credential_persistence_failed"`, `accountId`, `needsReauth: true`, y opcional
`catalogRefreshPending: true`; los detalles del error de almacenamiento no están expuestos. La fila de la cuenta permanece guardada: reautenticarlo o eliminarlo antes de volver a intentar crear una cuenta.

Tiempos de espera de bloqueo de escritura de configuración o actualización de credenciales bajo esta devolución familiar delegada HTTP 503 con código `CONFIG_MUTATION_LOCK_UNAVAILABLE`. Los clientes deben volver a intentarlo en breve en lugar de tratar Esa respuesta como un fallo permanente de la cuenta.

Creación y eliminación de credenciales de confirmación/configuración antes de la convergencia del catálogo. Un fracaso o El intento de catálogo diferido nunca hace retroceder la mutación de la cuenta duradera y nunca refleja la mutación interna. detalles de proveedor, cuenta, ruta o credenciales; los clientes reciben solo el booleano de finalización. Borrar una cuenta retiene su selector vinculante para que las rutas exactas no se cierren mientras la cuenta está ausente y el Se restaura el mismo selector si se vuelve a agregar ese identificador de cuenta.

<a id="windows-compatibility-certificate-setup"></a>

## Configuración del certificado de compatibilidad Windows

`GET /api/codex/desktop-compatibility/certificate` devuelve el estado del certificado público: soporte, estado, huella dactilar, caducidad, aviso de renovación, observación de confianza y cualquier operación activa. Nunca genera una clave, descifra material privado o registra la confianza del sistema operativo. Certificado de confianza solo no significa que se esté ejecutando un relé de compatibilidad o que se haya verificado la clave privada en este proceso.

POST acepta `action: "prepare" | "trust" | "remove-trust" | "renew"` y `confirmed: true`. Las acciones de confianza también requieren la mayúscula exacta SHA-256 `fingerprint` Devuelto por estado. Estas mutaciones requieren un GUI-sesión principal de entrada de bucle de confianza; un administrador token solo 403 . Están destinados a un flujo de confirmación local, no a la inscripción de certificados desatendida.

Prepare las tiendas con una autoridad limitada de 30 días con un Windows Actual-UsuarioDPAPI-protegido clave privada. Preparaciones posteriores reutilizarlo. Acciones de confianza nunca crear estado faltante o reemplazar en silencio una raíz caducada. Remoción se niega mientras que Codex se está ejecutando o la propiedad del proceso no se puede establecer. La cancelación o la finalización del comando OS incierto se comprueba contra el almacén de certificados real. El estado desconocido sigue siendo un error en lugar de autorizar un reintento automático. PEM, claves privadas, datos de cuenta o salida de subproceso.

La renovación requiere la huella digital actual y una aplicación Codex ausente. Verifica la eliminación de la confianza del certificado anterior antes de publicar un reemplazo cifrado validado. Rechazado o la eliminación incierta conserva la vieja identidad. El reemplazo está preparado pero no es de confianza; registrarlo con un `trust` confirmación utilizando su nueva huella digital. Un viejo reintento No se puede reemplazar la nueva identidad. No se conserva la cadena de copia de seguridad del certificado.

Esta configuración API no habilita un relé, cambia el inicio de sesión, altera el uso, reinicia Codex o instala un observador. La protección CurrentUser no aísla los secretos de otros procesos que se ejecutan como el mismo usuario del sistema operativo.

<a id="experimental-windows-compatibility-runtime"></a>

## Experimental entorno de ejecución de compatibilidad Windows

`GET /api/codex/desktop-compatibility/runtime` es un estado inerte leído. POST requiere un sesión local GUI y `{ action, confirmed: true }`Donde la acción es `start`, `stop`,
`observe`, `launch`, o `apply`. Solo `apply` Además requiere `accountWideConsent: true`. El punto final es experimental. El panel lo expone bajo **Codex Establecer → Compatibilidad con equipos de escritorio**; la **Reanudar la observación cuando se inicia OpenCodex** toggle guarda el opcional
`desktopCompatibility.startOnProxyStart` preferencia. El modo de cliente administrado OpenCodex no ofrece estos los controles locales o los reenvía al concentrador compartido.

Start requiere un certificado de confianza ya preparado, un archivo nativo recién verificado Inicio de sesión ChatGPT y la compilación Codex evaluada Windows `26.924.2738.0`. Comienza en el modo Observar. HTTP/HTTPS y los proxies de salida autenticados SOCKS5 utilizan la misma selección explícita para HTTP, verificación de identidad y sockets actualizados. NO_PROXY es honrado; los fracasos nunca vuelven a intentarlo directamente. Vuelve una configuración no válida o no compatible `egress_proxy_invalid`. Start nunca registra un certificado o cambios inicio de sesión. Launch conserva la identidad del paquete y rechaza una aplicación que ya se está ejecutando. Los puertos PAC y CONNECT persisten después de la primera vinculación exitosa y se reutilizan en el reinicio.
`connection_unavailable` significa que la unión falló; `connection_invalid` o `connection_changed`
medios no pudieron aceptarse la identidad de punto final almacenada. Estas fallas nunca giran silenciosamente puertos o sobrescribir el registro de conexión existente. Reiniciar vuelve a Observar, no a Aplicar.
`native_routing_unverified` significa que el enrutamiento raíz/perfil nativo no se puede emparejar con este El listener OpenCodex vinculado al proceso. El estado en entorno de ejecución puede exponer `contextFailure` para esta condición o `build_unverified`. Estos estados desactivan la corrección de respuesta sin reclamar una reparación de la aplicación.

Una respuesta de estado también puede `buildAssessment`, los metadatos públicos del último completado Comprobación de compilación: `assessedVersion` (el paquete exacto contra el que se evaluó este entorno de ejecución),
`observedVersion`, `verified` y `completedAt`. Registra una observación pasada, no una observación en vivo. lectura de instalación: un entorno de ejecución detenido, una actualización de la aplicación o una comprobación pendiente o interrumpida pueden salir de ella más antiguo que el paquete instalado, y solo un cheque completado lo reemplaza. `observedVersion` es nulo a menos que el descubrimiento coincida con la familia de paquetes evaluados y el punto de entrada; un nuevo build mantiene su propia versión con `verified` Falso, y `verified` Siempre describe el paquete observado en `completedAt`Nunca lo que sea que se instale más tarde. El campo está ausente hasta que el el servicio crea su sonda durante el inicio y `null` hasta que la sonda termine un chequeo; lectura estado nunca comienza uno.

La aplicación requiere una instantánea de agotamiento elegible observada recientemente y dura como máximo tres minutos en la capa de respuesta. Cambia dos banderas de puerta de cuenta-UI, no porcentajes de uso, créditos, Restricciones de gasto o límites de servidor. La respuesta de uso no identifica el modelo seleccionado: Este ensayo no puede prometer un efecto limitado a modelos externos. Una activación aceptada o producida La respuesta no prueba que la aplicación haya aceptado la nueva instantánea o habilitado su compositor. Un registro de uso original disponible o protegido devuelve el controlador a Observar y invalida las correcciones pendientes. El agotamiento posterior requiere otra solicitud de aplicación explícita. El enrutamiento raíz TOML o configurado de model/provider/fallback invalida el entorno de ejecución contexto de observación hasta la parada/inicio; revertir esos configuración no lo reactiva.

Observar desactiva la corrección y actualiza solo los flujos de uso validados. Stop cierra este entorno de ejecución escuchas y conexiones; el PAC incluye `DIRECT` fallback. El certificado permanece instalado para Reutilización. Detenga el entorno de ejecución y cierre Codex antes de eliminar la confianza o renovar el certificado. Informes de limpieza fallidos `cleanup-required`; no afirma que el entorno de ejecución está apagado. Inicio de sesión, La configuración de proxy del sistema y los archivos de aplicación no se modifican mediante estos comandos en entorno de ejecución.

El punto final de configuración independiente devuelve `{ startOnProxyStart, revision }`. POST requiere
`{ startOnProxyStart: boolean, revision, confirmed: true }` de una sesión local GUI. Un rancio revisión rechaza la escritura; una actualización válida conserva campos de configuración no relacionados y verifica El resultado persistente. Esta preferencia afecta al siguiente inicio proxy, nunca al entorno de ejecución actual. estado, lanzamiento de la aplicación o una prueba de Apply. Una respuesta incierta debe ser seguida por GET, no por un automático POST reintento. La configuración no válida o faltante se conserva en lugar de recrearse.

<a id="choosing-a-client"></a>

## Elegir un cliente

Para la administración ordinaria, el [Dashboard web](/es/guides/web-dashboard/) La guía más segura flujo de trabajo. Para los hosts sin cabeza y la automatización, utilice el `ocx` comandos: ellos llaman a esto mismo live API y devuelve un resultado distinto de cero cuando el proxy es inalcanzable o la operación falla. Direct HTTP es más útil para integraciones que necesitan los contratos de punto final exactos anteriores.

<a id="remote-sessions-and-data-key-rotation"></a>

## Sesiones remotas y rotación de datos

`POST /api/keys/rotate {id}` inicia una superposición de diez minutos y devuelve el nuevo secreto de datos una vez. `POST /api/keys/rotate/commit {id,rotationId}` lo compromete; `DELETE /api/keys/rotate {id,rotationId}` Lo aborta. Todos requieren autenticación de administración; las claves de datos no pueden llamarlos. `POST /api/session/logout` Requiere el actual `gui-session`, haciendo coincidir Origin y CSRF. Un administrador token recibe 403 y nunca puede acuñar o intercambiar en una sesión de consentimiento.

<a id="anthropic-account-usage-threshold"></a>

## Umbral de uso de la cuenta Anthropic

`PUT /api/oauth/accounts/auto-switch`

Anthropic OAuth solamente; `{ provider: "anthropic", accountId, threshold }` acepta el número entero 0–100 o null para heredar. El umbral faltante no es válido. La anulación almacenada sobrevive al reinicio y se elimina con la cuenta.

Los DTO de la lista de cuentas incluyen `autoSwitchThresholdOverride` (entero/nulo), `autoSwitchThreshold` (grupo predeterminado), y `effectiveAutoSwitchThreshold`. 0 deshabilita solo la conmutación basada en el uso; nunca deshabilita la pausa o la recuperación 429.

HTTP: 400 inválido/no soportado; 404 Cuenta perdida `oauth_mutation_busy` en la contención de bloqueo.

<a id="forced-claude-code-subagent-model"></a>

### Modelo de subagente forzado Claude Code

La página Subagentes ofrece **Fuerza a todos los subagentes en un modelo**, fuera por defecto. Seleccione una identificación de estilo de lista expuesta, como `combo/tev-auto`A continuación, habilite el interruptor. La lista se ofrece primero; las entradas de la lista guardadas no disponibles no pueden ser objetivos forzados.

`ocx agent subagents force combo/tev-auto` conjuntos `claudeCode.subagentModelForce`; `ocx agent subagents force -` Lo aclara. `ocx agent status` informa el establecimiento. `GET /api/subagent-models` devoluciones `force`, `forceAvailable`, y `forceStatus`; `PUT` acepta `{ "force": "combo/tev-auto" }` o `{ "force": null }` Sin cambiar el roster. Omisión `force` Lo deja sin cambios. Los objetivos inválidos o no expuestos son rechazados en la escritura; los objetivos obsoletos son reportados y omitidos en el lanzamiento.

Esto tiene efecto en el **siguiente routed `ocx claude` lanzamiento**, inyección `CLAUDE_CODE_SUBAGENT_MODEL` como un alias proxy explícito (con `[1m]` solo para una ventana autorizada de un millón de token; los objetivos nativos Claude usan un alias nativo reversible) y `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. Cada variable no vacía exportada por el shell gana independientemente. Los lanzamientos nativos no inyectan ninguna variable; simple `claude` No se ve afectado. No hay archivos de plugin o `settings.json` son modificados por esta configuración.

Claude Code **2.1.257 o más reciente** es necesario para FORCE. Los argumentos del modelo Plugin y los agentes integrados (incluyendo Explorar/Plan) y por llamada se anulan. bifurcaciones y habilidades de subagente con `model: inherit` mantener el modelo de conversación principal. El bucle principal y los sidecars de pequeño-rápido no se ven afectados. Los archivos de la lista existentes permanecen disponibles.

El panel de control advierte sobre versiones antiguas o desconocidas de CLI, objetivos no disponibles y cualquier variable que ya esté presente en el sistema. `settings.json` → `env` (que anula env de lanzamiento). La detección es de solo lectura y local en el servidor: no puede inspeccionar otro shell de lanzamiento, otra máquina o la configuración local del proyecto. Un resultado desconocido no es prueba de apoyo a la fuerza.
