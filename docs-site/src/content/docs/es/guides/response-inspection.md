---
title: "Inspección de respuestas y grandes respuestas"
description: "Cómo interactúan la retención diagnóstica limitada y la inspección de transmisión con la entrega de respuesta."
---

OpenCodex mantiene los diagnósticos de respuesta limitados sin limitar el registro límite en los bytes entregados a su cliente. Otro proveedor, solicitud y transporte Los límites se aplican de forma independiente.

<a id="json-and-ordinary-error-responses"></a>

## JSON y respuestas de error ordinarias

La inspección JSON retiene como máximo 32 MiB de bytes fuente. Si el cuerpo supera esa Si el registro deja caer su copia retenida y continúa reenviando el original. respuesta. No analiza un prefijo truncado como uso o modelo autorizado Metadatos. El uso ya suministrado por otra ruta de confianza se conserva; falta El uso no se reemplaza con un cero inventado. Diagnósticos de error ordinarios que no son JSON retener solo los primeros 8 KiB y pasar por la lógica de redacción existente.

El cliente recibe fragmentos a medida que los lee en lugar de esperar el diagnóstico. inspección de todo el cuerpo. Un fallo de lectura se registra como 502 y la cancelación como 499 en el historial de solicitudes; estos resultados de diagnóstico no reescriben los encabezados HTTP que ya han sido enviados. El registro se finaliza una vez.

<a id="streaming-responses"></a>

## Respuestas de streaming

La inspección nativa SSE se detiene cuando se ejecuta demasiado por delante del consumo del cliente. La asignación es de 32 MiB más gastos generales de Source-chunk/native-prefetch, no un total límite de tamaño de respuesta o un límite en toda la memoria del proceso. Una respuesta más larga sigue siendo inspeccionado a través de su evento de finalización real, incluido el uso de la terminal y Estado de continuación.

Después de que el cliente se desconecta, el drenaje acotado existente todavía puede observar un hasta 15 segundos o 32 MiB de inspección adicional. Un forzado El cierre es diferente: descarta candidatos incompletos en lugar de grabar como una respuesta completa. Selección de transporte existente y memoria WebSocket Los límites no han cambiado. No se requiere ninguna configuración nueva.
