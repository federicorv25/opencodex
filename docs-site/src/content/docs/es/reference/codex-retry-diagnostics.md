---
title: "Codex reintentar diagnósticos"
description: "Distinguir el asesoramiento de límite de velocidad, la retransmisión automática, la recuperación del proveedor y las notificaciones de escritorio."
---

OpenCodex [Adaptador Devin](/es/reference/adapters/#devin) preserva un reintento utilizable hint en el contrato de error Codex entiende. No es una garantía que El escritorio muestra una fila de reconexión o que el proveedor acepta la siguiente solicitud.

<a id="who-waits"></a>

## Quien espera

Con `OPENCODEX_DEVIN_STATED_RESET_WAIT_MS` Desactivado o `0`, el adaptador de Devin hace no mantener una solicitud denegada para el tiempo de reutilización declarado. Codex recibe la final falla y posee su política de reintento limitada. Un valor positivo opta por el existente de propiedad proxy; retrasa la entrega del fallo final y puede compuesto con los reintentos del cliente. Esta compatibilidad tampoco cambia el configuración ni el recuento de reintentos de Codex. Una anulación de solo proceso no necesita sobrevivir al reinicio.

`rate_limit_exceeded` más `Please try again in Ns.` Es un consejo, no un evento de cuenta atrás. La propia política de reintentos, cancelación y ciclo de vida de Codex aplicar. No agregue razonamiento sintético, herramienta, asistente o elementos de éxito para hacer esperar visible: esos elementos pueden contaminar la historia o implicar que el trabajo sucedió. No acorte el retraso del proveedor ni provoque una solicitud adicional para adelantar la Contador de reintentos del cliente.

## Triage: `exceeded retry limit, last status: 429 Too Many Requests`

El mensaje es el resumen del presupuesto de reintento del cliente, no un diagnóstico. Una negativa que el cliente no retransmita puede finalizar un turno en las mismas palabras que presupuesto totalmente agotado, así que trate el texto como una pregunta. Tres casos miran idéntico en esta capa y se comprueban de manera diferente.

| Comprobar | Evidencias distintivas | Si el cheque es positivo |
| --- | --- | --- |
| Cerradura de la cuenta principal (política de admisión local) | La configuración del panel o `GET /api/settings` informa el estado de la política, como `mainAccountHardLock.state` ser `blocked`, `ready`, o `off`, con `thresholds` y una opcional `resetAt`. Una solicitud de no transmisión también puede llevar un cuerpo de política principal explícito en lugar de un desnudo de origen 429. | Actualizar el uso con `ocx account refresh openai`; el nuevo uso por debajo de cada umbral de bloqueo o ausencia de ventana validada libera la cerradura. Si permanece bloqueado, espere a un nuevo uso más bajo o `codexMainAccountHardLock` apagado en Configuración. Construye antes [#6287](https://github.com/lidge-jun/opencodex/pull/6287) podría mantener un obsoleto bloque de ventana corta a través de reinicios cuando ninguna observación nueva lo reemplazó; la semántica de liberación se describe en el [Nota de cierre sobre el 6244](https://github.com/lidge-jun/opencodex/issues/6244). |
| Ventana de plan ChatGPT ascendente | La sección Cuota de cuenta muestra una ventana de 5 horas o semanal en o cerca de su límite mientras el bloqueo informa `ready` o `off`. | Espere a que la ventana se restablezca, inspeccione cualquier opción de reinicio que ChatGPT ofrece ([Reglas de restablecimiento bancario](https://help.openai.com/en/articles/20001498-how-banked-codex-resets-work), [Plan de Ventanas](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)), o servir la solicitud en otra cuenta con `ocx account use openai <id>`. Para el uso de crédito pagado explícitamente autorizado después del límite, consulte [política de crédito de cuenta](/es/reference/cli/providers-accounts/#pool-policy-account-thresholds-and-paid-credit-intent). El defecto de redescubrimiento del saldo crediticio en [#6845](https://github.com/lidge-jun/opencodex/issues/6845) Fue fijado por [#6886](https://github.com/lidge-jun/opencodex/pull/6886). |
| Incidente del proveedor o falla de transporte | La cuota se mantiene baja, la cerradura permanece liberada, y `ocx doctor` informes de transporte o ChatGPT problemas de accesibilidad. | Vuelva a intentar después de que el incidente se despeja o redirija a través de un combo existente. Cambiar la política de bloqueo o umbral no es una cura para un fallo de transporte. |

Una credencial principal bloqueada cierra la solicitud de admisión; no reserva la cuenta restante, y un restablecimiento predicho nunca libera el bloque en propio. Los umbrales (por defecto `short` 90, `long` 98) son visibles en el carga útil de estado y configurable a través `codexMainAccountHardLockThresholds`.

Un rechazo de bloqueo duro se informa como `usage_limit_reached`, por lo que Codex termina el turno y marca un objetivo activo como limitado al uso en lugar de esperar días en un Reintento. El tiempo de reintento sugerido es el restablecimiento de la cuenta principal o, para una solicitud que el grupo de cuentas se enruta a la cuenta principal, la primera vez conocida otra La cuenta de la grupo se recupera, lo que ocurra primero (nunca antes de un minuto). Reanudar el objetivo después de ese tiempo; enrutamiento a continuación, recoge una cuenta de estado fresco.

<a id="why-the-first-reconnect-row-can-be-absent"></a>

## Por qué la primera fila de reconexión puede estar ausente

El público Codex `rust-v0.158.0-alpha.2.1` source gates la corriente ordinaria-reint notificación en
[`handle_response_stream_error`](https://github.com/openai/codex/blob/rust-v0.158.0-alpha.2.1/codex-rs/core/src/responses_retry.rs):

```rust
let report_error = retry_count > 1
    || cfg!(debug_assertions)
    || !sess.services.model_client.responses_websocket_enabled();
```

En una compilación de lanzamiento, el primer intento en este bucle puede, por tanto, esperar sin emisión `Reconnecting...` cuando el predicado interno habilitado para WebSocket es Es verdad. El retraso seleccionado no es parte de ese predicado de notificación, y el El sueño está fuera del `if report_error` bloque. Una larga espera aconsejada por el servidor puede ser Silencioso también. Esta es una observación de la fuente específica de la versión, no prueba que La solicitud de escritorio en particular tomó esa rama. No inferir el predicado interno desde un nombre de modelo, un estado HTTP o el transporte visto en un salto proxy.

Una suscripción de notificación habilitada y un renderizador capaz de dibujar la fila Solo establece que el camino de recepción existe. Sin embargo, no demuestran que el motor emitir un evento para el giro afectado. Del mismo modo, los detalles colapsados del proveedor pueden explicar texto de detalle faltante, pero no una fila de reconexión faltante por sí mismos.

El servidor de aplicaciones correspondiente
[`ErrorNotification`](https://github.com/openai/codex/blob/rust-v0.158.0-alpha.2.1/codex-rs/app-server-protocol/schema/typescript/v2/ErrorNotification.ts)
contiene `willRetry`, `threadId` y `turnId`. Observar la emisión, la entrega a la turno coincidente, y renderizado por separado. Un proxy `response.failed` El marco no es propia notificación de app-server. Cambiar esta primera notificación del lado del motor La política requiere un cambio de Codex; una reescritura de mensaje de error de OpenCodex no puede forzar un evento a través de una rama que no lo emite.

<a id="read-only-verification"></a>

## Verificación de solo lectura

Mantenga la aplicación existente, proxy, configuración y prueba sin cambios mientras recopila pruebas. Reiniciar, enviar un nuevo turno o cambiar los transportes cambia la experimento. En un seguimiento aislado, compare el mismo fallo controlado bajo ambos estados internos de WebSocket e inspeccionar los reintentos primero y subsiguientes; no llame a eso una prueba de renderización de escritorio real a menos que se observe la interfaz de usuario.

Para la conversación afectada y el turno activo, distinga estos resultados:

| Pregunta | Evidencia requerida |
| --- | --- |
| ¿Se ha proporcionado asesoramiento útil? | El código del fallo final, retardo normalizado y tiempo de finalización de la respuesta. |
| ¿Ocurrió la retransmisión automática? | Una siguiente solicitud correlacionada después de ese fallo, sin un envío manual. Medir desde el final de la respuesta de fallo hasta el siguiente inicio de solicitud, no desde el primer inicio de solicitud. |
| ¿Se recuperó el proveedor? | Una respuesta exitosa y continuación del trabajo afectado, no simplemente otra solicitud o un giro exitoso no relacionado. |
| ¿Se emitió y entregó una notificación de reintento? | El evento de error app-server coincidente y su indicador de reintento, no solo la configuración de suscripción. |
| ¿Era visible el aviso? | Observación del turno de escritorio afectado; las comprobaciones de protocolo o código fuente por sí solas son insuficientes. |

El asesoramiento aproximado del proveedor y la sobrecarga de programación pueden producir un pequeño tiempo diferencia. Si la retransmisión llega a un error de cierre del socket y un intento posterior recibe un nuevo límite de tarifa, registra la retransmisión como trabajo pero el proveedor recupera como incompleta. El retraso del nuevo rechazo es una nueva observación, no un temporizador heredado. de la anterior negativa. Un `inProgress` Por sí mismo no demuestra ni la recuperación ni una correcta representación. Vuelve a intentar el agotamiento, la cancelación y la recuperación de la aplicación de reinicio Deben evaluarse por separado.

Publique solo el alcance de validación y las duraciones/resultados agregados. Mantenga los troncos crudos, cuerpos de solicitud, credenciales, datos de cuenta, rutas privadas e hilo/conversación/ identificadores de solicitud/traza de las relaciones públicas y los informes de diagnóstico.

<a id="regression-test-scope"></a>

## Alcance de la prueba de regresión

`tests/server/retry-delay-hardening.test.ts` comprueba que 120-, 900-, 1,800-, El consejo de 2,460 y 3,600 segundos sobrevive al formato sin cambios; una pista más larga permanece primero cuando también existe uno más corto; y una desconexión inoportuna no hacer un rechazo posterior heredar un retraso antiguo. Estos son analizador/formateador puro cheques. No esperan por una hora, ejercen el predicado de notificación de Codex, verificar un reinicio de la aplicación o probar la recuperación de un fallo del proveedor en vivo.
