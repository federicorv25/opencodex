---
title: "Codex Log Guard Reclamación"
description: "Recupere manualmente páginas gratuitas del registro de diagnóstico Codex Almacenamiento SQLite con aspiración incremental limitada."
---

Reclaim es la etapa manual de recuperación de espacio de Codex Log Guard. Compacta el canónico Codex `logs_2.sqlite` base de datos solo cuando la base de datos y el entorno de ejecución pasan las mismas comprobaciones de seguridad utilizadas por la protección Log Guard.

Reclamar es **Nunca programado automáticamente** y nunca se ejecuta simplemente porque la página de almacenamiento está abierta. El panel de control requiere una acción Compact explícita y una segunda confirmación antes de enviar la solicitud de mutación.

<a id="what-reclaim-does"></a>

## Lo que hace Reclaim

OpenCodex realiza una secuencia de mantenimiento sin conexión limitada:

1. resolver el canónico `logs_2.sqlite` a través de Codex eficaz `sqlite_home`;
2. verificar la identidad del archivo y el esquema de registro Codex conocido;
3. verificar que la enumeración del proceso se haya realizado correctamente y no se esté ejecutando ningún proceso de escritura Codex compatible;
4. adquirir el bloqueo dedicado de proceso cruzado Log Guard;
5. repita la comprobación del proceso Codex mientras se mantiene ese bloqueo;
6. abrir la base de datos existente leer/escribir sin crear semántica y probar que se puede adquirir un escritor SQLite inmediato;
7. requieren `PRAGMA auto_vacuum` Para ser ya `INCREMENTAL`;
8. ejecutar `PRAGMA quick_check` antes del mantenimiento;
9. ejecutar un punto de control WAL completo y rechazar un punto de control ocupado / incompleto;
10. Ejecutar delimitado `PRAGMA incremental_vacuum(N)` los lotes, el control después de cada lote;
11. ejecutar `PRAGMA quick_check` nuevamente después del mantenimiento; y
12. informe antes/después de la base de datos, WAL, recuento de páginas, lista libre y métricas de bytes recuperables.

El objetivo por defecto es aproximadamente **8 MiB de páginas SQLite**. Una sola invocación reclama como máximo aproximadamente **256 MiB de páginas**, con un límite de iteración finita adicional. Si quedan más páginas libres, el resultado se informa como parcial y puede invocar Compact de nuevo más tarde.

Los límites de bytes se convierten en recuentos de páginas usando el tamaño de página SQLite real de la base de datos. Son límites en páginas lógicas SQLite procesadas, no reclamaciones sobre volumen de escritura SSD/NAND.

<a id="safety-guarantees"></a>

## Garantías de seguridad

Reclamar deliberadamente hace **no**:

- correr lleno `VACUUM`;
- cambiar `auto_vacuum` modo en una base de datos Codex existente;
- eliminar, truncar, renombrar o manipular de cualquier otra forma Codex `-wal` / `-shm` archivos directamente;
- eliminar filas de diagnóstico;
- modificar disparadores de protección Log Guard o disparadores de usuario no relacionados;
- ejecutar mientras se detecta Codex como activo;
- proceder cuando la enumeración del proceso es incierta;
- proceder sobre un esquema de registro futuro desconocido; o
- continuar después de una comprobación de integridad SQLite defectuosa.

Un bloqueo Log Guard ocupado, un escritor SQLite ocupado o un punto de control inicial ocupado se devuelven como un rechazo explícito en lugar de volver a intentarlo en segundo plano. Si la contención del punto de control aparece solo después de que un lote de vacío incremental ya se haya comprometido, OpenCodex informa que el trabajo ya se ha completado como un resultado parcial exitoso con `stopReason: "busy"` en lugar de afirmar que nada ha cambiado.

## CLI

Inspeccione primero el espacio recuperable:

```bash
ocx storage codex-logs status
```

Ejecute un pase de mantenimiento limitado:

```bash
ocx storage codex-logs compact
```

Para métricas de antes/después legibles por máquina:

```bash
ocx storage codex-logs compact --json
```

Si el resultado informa que queda más espacio recuperable, deténgase allí a menos que desee explícitamente otro pase limitado. OpenCodex no realiza un bucle indefinidamente ni programa un pase de seguimiento para usted.

<a id="management-api"></a>

## API de administración

La compactación se expone solo como un punto final de mutación:

```text
POST /api/storage/codex-logs/compact
```

No hay alias GET para la compactación. Una respuesta exitosa contiene a `report` objeto con mediciones de antes/después, recuentos de páginas recuperados, cambio de tamaño de la base de datos principal física, recuento de iteraciones, integridad, razón de detención y estado de integridad.

Los estados de rechazo típicos incluyen:

- `codex_running`
- `process_enumeration_failed`
- `busy`
- `unsupported_schema`
- `auto_vacuum_not_incremental`
- `unsafe_path`
- `integrity_check_failed`
- `database_error`

Las fallas de integridad incluyen si ocurrieron antes o después del pase de mantenimiento. A `busy` rechazo significa que se detectó contención antes de cualquier lote al vacío; `stopReason: "busy"` dentro de un informe exitoso significa que al menos un lote se cometió antes de que la contención del punto de control posterior detuviera el pase.

<a id="understanding-the-result"></a>

## Entender el resultado

`pagesReclaimed` y `logicalBytesReclaimed` describir las páginas de la lista gratuita SQLite eliminadas durante el pase. `physicalDatabaseBytesReclaimed` reporta la reducción observada en el archivo de base de datos principal después de los puntos de control de mantenimiento.

Estos números pueden diferir. El comportamiento de SQLite/WAL/sistema de archivos significa que reclamar páginas lógicas no garantiza una reducción idéntica de archivos físicos inmediatos, y ninguna de estas métricas debe interpretarse como NAND escribe, SSD usa o TBW consume/guarda.

`complete: true` significa que la lista libre observada alcanzó cero. Un resultado parcial utiliza `stopReason: "page_budget"` cuando el presupuesto de página por ejecución o el límite de iteración finita finaliza el pase, `stopReason: "no_progress"` cuando SQLite deja de reducir la lista libre, y `stopReason: "busy"` cuando la contención del punto de control aparece después de la reclamación comprometida. Los tres son resultados limitados; ninguno causa un reintento automático.
