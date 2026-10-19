---
title: "Codex Log Guard"
description: "Inspeccione y reduzca explícitamente la persistencia del registro de diagnóstico Codex sin exponer los cuerpos de registro."
---

OpenCodex puede inspeccionar la base de datos de registro de diagnóstico persistente de Codex y, cuando se opta por, reducir qué filas de diagnóstico persiste Codex. La inspección permanece solo de lectura; la protección es una mutación explícita que se rechaza a menos que el esquema de registro Codex conocido esté presente y Codex se detenga.

<a id="what-inspect-reports"></a>

## Lo que inspeccionan los informes

OpenCodex resuelve la eficacia de Codex `sqlite_home` usando la precedencia existente de Codex e inspeccionando el canonical `logs_2.sqlite` base de datos allí. Un número más alto o legado `logs_N.sqlite` El archivo nunca se sustituye como la diana con capacidad de mutación.

La vista Almacenamiento informa:

- la base de datos principal, WAL y los tamaños de archivo SHM;
- el total de filas de registro y la parte almacenada en `TRACE` nivel;
- los mayores depósitos de log-target por recuento de filas, utilizando etiquetas de rango en lugar de nombres de destino;
- SQLite espacio de la lista libre que puede ser reclamable más tarde; y
- si el esquema observado es compatible con el esquema de registro Codex actualmente conocido.

Si `sqlite_home` está fuera `CODEX_HOME`, la base de datos de diagnóstico se muestra por separado. Sus bytes no se pliegan silenciosamente en el `CODEX_HOME` almacenamiento total.

OpenCodex no selecciona ni expone `feedback_log_body` mientras se producen estos diagnósticos. Los niveles de registro se reducen al conjunto de niveles conocidos fijos más `OTHER`, y los nombres de destino no se serializan.

<a id="protect-modes"></a>

## Proteger los modos

La protección es **por defecto**. Habilitarlo instala una propiedad OpenCodex `BEFORE INSERT` desencadenador en el canonical de Codex `logs_2.sqlite` base de datos. OpenCodex nunca reemplaza un desencadenador desconocido usando sus nombres reservados y elimina solo los desencadenadores cuyo SQL coincide con la versión propiedad de OpenCodex.

Hay dos modos disponibles:

- **Compatibilidad** (`compat`) es el modo recomendado. Fija la regla Log Guard v1 actual establecida a los objetivos de alto volumen que Codex ya filtra o niveles bajos en su sumidero de registro SQLite persistente. Sin relación `TRACE` Se conservan las filas.
- **Silencio** (`quiet`) suprime cada nuevo `TRACE` fila mientras se conserva `DEBUG`, `INFO`, `WARN`, y `ERROR` filas.

La protección reduce las filas que llegan al almacenamiento SQLite persistente. Lo hace **no** eliminar el trabajo de seguimiento anterior de Codex: los eventos aún se pueden formatear, poner en cola, agrupar en transacciones y considerar la propia lógica de poda de Codex antes de que el desencadenador ignore una fila. Trata a Protect como un escudo de conversión de escritura persistente, no como un interruptor que deshabilita la generación de diagnóstico dentro de Codex.

Los filtros Log Guard solo persisten en las filas de registro locales SQLite. No cambia el procesamiento de diagnóstico Codex, [transporte del adaptador](/es/reference/adapters/), cargas útiles de proveedores, semántica de transmisión, autenticación, enrutamiento, cuotas o estado de la cuenta.

<a id="safety-checks"></a>

### Controles de seguridad

Antes de proteger, deshabilitar o reparar cambia la base de datos externa, OpenCodex:

1. resuelve exactamente lo canónico `logs_2.sqlite` camino;
2. verifica que la ruta de acceso es un archivo regular, sin enlace simbólico y que el esquema conocido coincide exactamente;
3. verifica que la enumeración del proceso se haya realizado correctamente y no se esté ejecutando ningún proceso de escritura Codex compatible;
4. adquiere un bloqueo dedicado de proceso cruzado Log Guard;
5. repite la comprobación del proceso Codex después de adquirir ese bloqueo;
6. abre la base de datos leer/escribir **sin** crear semántica y adquiere SQLite `BEGIN IMMEDIATE` sin esperas ocupadas;
7. cambia solo los disparadores Log Guard propiedad de OpenCodex y lee el resultado antes de confirmar; y
8. persiste el modo solicitado en la configuración de OpenCodex mientras el bloqueo de Log Guard aún se mantiene.

Si la enumeración del proceso es incierta, la base de datos está ocupada, el esquema es desconocido o un nombre de desencadenador reservado pertenece a SQL diferente, la mutación falla. OpenCodex no termina Codex automáticamente.

<a id="drift-and-repair"></a>

## Deriva y reparación

El modo de protección solicitado se almacena en la configuración de OpenCodex por separado de la base de datos de registros de Codex. Esto es importante porque una migración Codex puede reconstruir el `logs` tabla, y SQLite elimina los disparadores adjuntos a una tabla que se reemplaza.

Cuando el modo guardado es `compat` o `quiet` pero ya no se observa el correspondiente desencadenador propio, informa Log Guard **deriva**. `ocx doctor` reporta la deriva pero nunca la repara automáticamente.

La reparación es explícita:

```bash
ocx storage codex-logs repair
```

OpenCodex deliberadamente no recrea la protección en cada inicio. Una versión posterior puede reconsiderar la reparación automática solo después de que haya suficiente evidencia de campo de que hacerlo es seguro en todas las migraciones de Codex.

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

Desactivar la deriva de protección o reparación de OpenCodex:

```bash
ocx storage codex-logs unprotect
ocx storage codex-logs repair
```

Añadir `--json` a los comandos Log Guard para una salida legible por máquina. Ver la [Referencia CLI](/es/reference/cli/) para la sintaxis del comando canónico y el comportamiento JSON.

El comando existente permanece sin cambios:

```bash
ocx storage --json
```

Su respuesta lleva el mismo estado Codex-log utilizado por la página de almacenamiento.

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

El cuerpo protector también `{"mode":"compat"}` o `{"mode":"quiet"}`. `GET /api/storage` También incluye el informe como `codexLogs` para que el panel de control pueda actualizar el desglose de almacenamiento normal y los diagnósticos del registro Codex a partir de una solicitud de instantánea.

<a id="read-only-snapshot-semantics"></a>

## Semántica de instantáneas de solo lectura

La inspección de estado abre la base de datos de solo lectura con SQLite `immutable=1`. Esto evita que una lectura de diagnóstico cree o actualice `-wal` o `-shm` sidecares.

La compensación es importante: los agregados de SQL y los metadatos del disparador observados describen la última instantánea de la base de datos con puntos de control. Si Codex está escribiendo activamente, la WAL en vivo puede contener filas o páginas de esquema más nuevas que la instantánea inmutable. Una respuesta de mutación exitosa utiliza el estado de activación que OpenCodex verificó dentro de su transacción de escritura; una solicitud de estado de solo lectura posterior puede retrasarse temporalmente hasta que SQLite revise esas páginas de esquema.

OpenCodex informa el tamaño del archivo WAL por separado y no **no** etiquetar el resultado como tasa de escritura SSD, NAND escribe o consumo de drive-wear/TBW.

<a id="compatibility-states"></a>

## Estados de compatibilidad

Un esquema conocido informa de la inspección y protección según sea compatible. Un esquema futuro perdido, ilegible o desconocido sigue siendo inspeccionable como metadatos, pero se informa como no compatible para operaciones con capacidad de mutación.

Un esquema desconocido no se adivina en compatibilidad. Esto permite que una versión más reciente de Codex permanezca observable mientras evita que Log Guard trate un diseño de base de datos no revisado como seguro de modificar.

<a id="reclaim-is-still-separate"></a>

## La recuperación sigue siendo independiente

Protect no aspira ni compacta SQLite. [**Reclamar**](/es/guides/codex-log-guard-reclaim/) proporciona un flujo incremental de vacío explícito, sin conexión y limitado con puntos de control y comprobaciones de integridad.

Proteger nunca se ejecuta `VACUUM`, nunca trunca o elimina Codex de WAL directamente, y nunca realiza la recuperación de espacio programada.
