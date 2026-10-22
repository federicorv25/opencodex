---
title: "Codex Log Guard"
description: "Inspeccione y reduzca explícitamente la persistencia del registro de diagnóstico Codex sin exponer los cuerpos de registro."
---

OpenCodex puede inspeccionar la base de datos de registro de diagnóstico persistente de Codex y, cuando se opta por, reducir las filas de diagnóstico Codex persiste. La inspección permanece solo de lectura; la protección es una mutación explícita que se rechaza a menos que esté presente el esquema logarítmico conocido Codex y se detenga Codex.

<a id="what-inspect-reports"></a>

## Lo que inspeccionan los informes

OpenCodex resuelve Codex 's efectiva `sqlite_home` usando Codex 's precedencia existente e inspecciona la canónica `logs_2.sqlite` base de datos allí. Un archivo `logs_N.sqlite` de numeración superior o heredado nunca se sustituye como el objetivo con capacidad de mutación.

La vista Almacenamiento informa:

- los tamaños de archivo principales de la base de datos, WAL y SHM;
- el total de filas de registros y la cuota almacenada al nivel de `TRACE`;
- los mayores depósitos de log-target por recuento de filas, utilizando etiquetas de rango en lugar de nombres de destino;
- SQLite espacio de lista libre que puede reclamarse más tarde; y
- si el esquema observado es compatible con el esquema de registro Codex actualmente conocido.

Si `sqlite_home` está fuera de `CODEX_HOME`, la base de datos de diagnóstico se muestra por separado. Sus bytes no se pliegan silenciosamente en el total de almacenamiento `CODEX_HOME` existente.

OpenCodex no selecciona ni expone `feedback_log_body` mientras produce estos diagnósticos. Los niveles de registro se reducen al conjunto de niveles conocidos fijos más `OTHER`, y los nombres de destino no se serializan.

<a id="protect-modes"></a>

## Proteger los modos

La protección está **desactivada de forma predeterminada**. Solo se activa mediante una acción explícita, como `ocx storage codex-logs protect`. Al activarla se instala un disparador `BEFORE INSERT` de OpenCodex en la base canónica `logs_2.sqlite` de Codex. Sin esa acción no se instala ningún disparador y las filas de diagnóstico pueden seguir llegando al almacenamiento persistente. OpenCodex nunca sustituye un disparador desconocido que use un nombre reservado y solo elimina aquellos cuyo SQL coincida con la versión de OpenCodex.

Hay dos modos disponibles:

- **Compatibilidad** (`compat`) es el modo recomendado. Fija la regla actual Log Guard v1 establecida a los objetivos de alto volumen que la Codex actual ya filtra o niveles bajos en su sumidero de registro persistente SQLite. Se conservan `TRACE` filas no relacionadas.
- **Silencio** (`quiet`) suprime cada nueva fila `TRACE` mientras conserva las filas `DEBUG`, `INFO`, `WARN` y `ERROR`.

La protección reduce las filas que alcanzan el almacenamiento persistente SQLite. Hace **no** eliminar Codex 's anterior trabajo de seguimiento: los eventos todavía pueden ser formateados, en cola, agrupados en transacciones, y considerado por Codex 's propia lógica de poda antes de que el disparador ignora una fila. Trate a Protect como un escudo de rotación de escritura persistente, no como un interruptor que deshabilita la generación de diagnóstico dentro de Codex.

Log Guard filtros solo persisten locales SQLite filas de registro. No cambia el procesamiento de diagnóstico Codex, [transporte del adaptador](/es/reference/adapters/), las cargas útiles del proveedor, la semántica de transmisión, la autenticación, el enrutamiento, las cuotas o el estado de la cuenta.

<a id="safety-checks"></a>

### Controles de seguridad

Antes de proteger, deshabilitar o reparar cambia la base de datos externa, OpenCodex:

1. Resuelve exactamente el camino canónico `logs_2.sqlite`;
2. verifica que la ruta de acceso es un archivo regular, no de enlace simbólico y que el esquema conocido coincide exactamente;
3. verifica que la enumeración del proceso se haya realizado correctamente y que no se esté ejecutando ningún proceso de escritura Codex;
4. adquiere una cerradura de proceso cruzado dedicado Log Guard;
5. repite la comprobación del proceso Codex después de adquirir ese bloqueo;
6. abre la base de datos leer/escribir **sin** crear semántica y adquiere SQLite `BEGIN IMMEDIATE` sin espera ocupada;
7. cambia solo los activadores Log Guard propiedad de OpenCodex y lee el resultado antes de confirmar; y
8. persiste el modo solicitado en la configuración OpenCodex mientras que el bloqueo Log Guard todavía se mantiene.

Si la enumeración del proceso es incierta, la base de datos está ocupada, el esquema es desconocido o un nombre de desencadenador reservado pertenece a SQL diferente, la mutación falla. OpenCodex no termina Codex automáticamente.

<a id="drift-and-repair"></a>

## Deriva y reparación

El modo de protección solicitado se almacena en la configuración OpenCodex por separado de la base de datos de registro de Codex. Esto es importante porque una migración Codex puede reconstruir la tabla `logs`, y SQLite elimina los disparadores adjuntos a una tabla que se reemplaza.

Cuando el modo guardado es `compat` o `quiet` pero ya no se observa el activador propio correspondiente, Log Guard informa **deriva**. `ocx doctor` informa de la deriva, pero nunca la repara automáticamente.

La reparación es explícita:

```bash
ocx storage codex-logs repair
```

OpenCodex deliberadamente no recrea protección en cada inicio. Una versión posterior puede reconsiderar la reparación automática solo después de que haya suficiente evidencia de campo de que hacerlo es seguro en Codex migraciones.

## CLI

Leer estado:

```bash
ocx storage codex-logs status
ocx storage codex-logs status --json
ocx doctor
```

Habilitar la directiva de compatibilidad recomendada:

```bash
ocx storage codex-logs protect
```

Elija el modo silencioso explícitamente:

```bash
ocx storage codex-logs protect --mode quiet
```

Desactivar OpenCodex protección o reparación deriva:

```bash
ocx storage codex-logs unprotect
ocx storage codex-logs repair
```

Agregue `--json` a los comandos Log Guard para obtener una salida legible por máquina. Vea el [CLI referencia](/es/reference/cli/) para la sintaxis canónica de comandos y el comportamiento JSON.

El comando existente permanece sin cambios:

```bash
ocx storage --json
```

Su respuesta lleva el mismo estado de registro Codex utilizado por la página de almacenamiento.

<a id="management-api"></a>

## API de administración

El estado está disponible en:

```text
GET /api/storage/codex-logs
```

Mutaciones explícitas:

```text
POST /api/storage/codex-logs/protect
POST /api/storage/codex-logs/unprotect
POST /api/storage/codex-logs/repair
```

El cuerpo de Protect es `{"mode":"compat"}` o `{"mode":"quiet"}`. `GET /api/storage` también incluye el informe como `codexLogs` para que el panel de control pueda actualizar el desglose de almacenamiento normal y los diagnósticos de registro Codex de una solicitud de instantánea.

<a id="read-only-snapshot-semantics"></a>

## Semántica de instantáneas de solo lectura

La inspección de estado abre la base de datos de solo lectura con SQLite `immutable=1`. Esto evita que una lectura de diagnóstico cree o actualice los sidecares `-wal` o `-shm`.

La compensación es importante: los agregados SQL y los metadatos de activación observados describen la última instantánea de la base de datos con puntos de control. Si Codex está escribiendo activamente, el WAL en vivo puede contener filas o páginas de esquema más nuevas que la instantánea inmutable. Una respuesta de mutación exitosa utiliza el estado de activación que OpenCodex verificó dentro de su transacción de escritura; una solicitud de estado de solo lectura posterior puede retrasarse temporalmente hasta que SQLite controle esas páginas de esquema.

OpenCodex informa el tamaño del archivo WAL por separado y **no** etiqueta el resultado como tasa de escritura SSD, escritura NAND o consumo de desgaste de unidad / TBW.

<a id="compatibility-states"></a>

## Estados de compatibilidad

Un esquema conocido informa de la inspección y protección según sea compatible. Un esquema futuro perdido, ilegible o desconocido sigue siendo inspeccionable como metadatos, pero se informa como no compatible para operaciones con capacidad de mutación.

Un esquema desconocido no se adivina en compatibilidad. Esto permite que una nueva versión Codex siga siendo observable, al tiempo que evita que Log Guard trate un diseño de base de datos no revisado como seguro de modificar.

<a id="reclaim-is-still-separate"></a>

## La recuperación sigue siendo independiente

Protect no aspira ni compacta el SQLite. [**Reclamar**](/es/guides/codex-log-guard-reclaim/) proporciona un flujo de vacío incremental explícito, sin conexión y limitado con puntos de control y comprobaciones de integridad.

Protect nunca ejecuta `VACUUM`, nunca trunca o elimina WAL de Codex directamente, y nunca realiza una recuperación de espacio programada.
