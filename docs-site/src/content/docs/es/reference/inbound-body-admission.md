---
title: "Inbound admisión corporal"
description: "Cómo los límites de cuerpo de solicitud elevados afectan a las solicitudes, reintentos y contabilidad de memoria concurrentes de HTTP."
---

Los [referencia de configuración del proveedor](/es/reference/configuration/providers/) describe
`maxInboundBodyBytes`, el tamaño máximo decodificado de un cuerpo JSON entrante. Su defecto permanece 256 MiB, y los valores configurados permanecen limitados a 1 MiB a 512 MiB. Reinicie el proxy después de cambiar el límite para que el oyente y los lectores utilicen el límite previsto juntos.

<a id="raising-the-limit-changes-concurrency"></a>

## Aumentar los cambios de límite de concurrencia

Cuando el límite resuelto es mayor que 256 MiB, cada solicitud HTTP cubierta se reserva su totalidad asignación configurada de un presupuesto de admisión compartido de 512 MiB en todo el proceso. Esto significa como mucho un Dicha solicitud se ejecuta a la vez, incluso cuando varios oyentes comparten un proceso. Los cuerpos pequeños también reservar la asignación completa; ni una pequeña longitud de contenido ni compresión evita la admisión. La reserva se mantiene hasta que el flujo de respuesta termina, falla o termina la cancelación, en lugar de que termina tan pronto como la solicitud JSON ha sido analizada. Una desconexión del cliente libera la reserva después de que se establece la cancelación del productor; límites anteriores 256 MiB admiten una solicitud cubierta a la vez, independientemente de `appOwnedMemoryBudgetMb`.

Los puntos finales POST cubiertos son `/v1/responses`, `/v1/responses/compact`,
`/v1/chat/completions`, `/v1/messages`, `/v1/messages/count_tokens`,
`/v1/images/generations`, `/v1/images/edits`, y `/v1/alpha/search`. Las imágenes, la búsqueda y el conteo de token mantienen sus límites configurables existentes por cuerpo. La traducción directa interna y las llamadas combinadas no reservan una segunda asignación HTTP. Los límites de administración, audio, historial de contexto y WebSocket no se modifican.

Una configuración omitida/cero, o un límite resuelto en o por debajo de 256 MiB, no habilita esta opción adicional. puerta de concurrencia. Los límites de recursos existentes siguen siendo aplicables.

<a id="temporary-refusal-versus-an-oversized-body"></a>

## Rechazo temporal frente a un cuerpo de gran tamaño

Una asignación temporalmente no disponible produce HTTP **503**, `Retry-After: 1`y código de error
`server_busy`, antes del análisis sintáctico del protocolo o del envío del proveedor. Messages y token-contando clientes recibir un error en forma de Anthropic con el tipo `overloaded_error`; Los clientes compatibles con OpenAI reciben
`server_error`. Reintentar después de que se complete la solicitud actual, honrando el encabezado y el cliente de reintento Retroceder. Aumentar aún más el límite corporal no resuelve una asignación ocupada.

Un cuerpo más grande que su límite por solicitud sigue el HTTP existente **413** Manejo. Un tamaño declarado mantiene ese camino en lugar de convertirse en un rechazo ocupado. La autenticación y las verificaciones de origen se ejecutan antes de esta puerta de concurrencia.

<a id="what-the-budget-measures"></a>

## Qué medidas presupuestarias

512 MiB es una suma de derechos de emisión admitidos por solicitud, **No es garantía de que la memoria del proceso se mantenga por debajo de 512 MiB**. Descodificación, cadenas, gráficos de objetos, copias de solicitud y otro uso del estado de la aplicación Memoria adicional. Se conservan las mediciones UTF-8 y reserialized-JSON existentes; entrada La longitud de byte no se sustituye por el tamaño JSON normalizado potencialmente mayor.

Para solicitudes pequeñas paralelas, mantenga el límite predeterminado siempre que sea posible. Elevándolo deliberadamente a flujo de trabajo de gran historia, aceptando la restricción de concurrencia adicional.
