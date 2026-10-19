---
title: "Uso del disco desde archivos Temp"
description: "Qué son los archivos responses-state.json.ocx.*.tmp, por qué podrían acumularse y cómo recuperarlos."
---

Algunos usuarios encontraron muchos gigabytes de archivos con nombre como
`responses-state.json.ocx.<pid>.<seq>.tmp` en su casa opencodex (`~/.opencodex` por defecto), creciendo después de cada reinicio.

<a id="what-these-files-are"></a>

## Qué son estos archivos

opencodex mantiene una caché de continuación para `previous_response_id` Las cadenas sobreviven a proxy reiniciar. Escribe esa instantánea atómicamente: el contenido va a un archivo temporal primero, luego reemplaza el archivo real en un solo paso. Eso es lo que detiene un accidente a mitad de escritura de dejar una instantánea a medio escribir.

La temperatura normalmente se elimina en el instante en que se completa el intercambio. Si el proceso muere Entre los dos pasos, la temperatura sobrevive.

Cada archivo puede ser de hasta 24 MB porque la instantánea se reescribe entera, no Se adjunta. Por lo tanto, unos pocos cientos de archivos abandonados se suman rápidamente.

**Son caché, no un estado duradero.** Eliminarlos no cuesta nada, excepto eso Las cadenas de conversación en vuelo pueden volver a enviar el contexto una vez. Sin configuración, credenciales, o el historial vivo en estos archivos.

<a id="why-they-could-accumulate"></a>

## Por qué se pueden acumular

Una limpieza ya existía, pero se ejecutó en un solo momento: cuando se cargaba un proxy la caché de continuación por primera vez, lo que sucede *antes* Ese proceso Escribe cualquier cosa. Dos consecuencias siguieron.

Un proxy que se estrelló y reinició barrió demasiado pronto para ver la temperatura de su predecesor acababa de dejar — hay un período de gracia de 15 minutos por lo que un archivo escrito en este momento nunca se toca — y nunca volvió a mirar para el resto de su vida. Cada reinicio agregó un archivo más.

Peor aún, la limpieza omitió cualquier archivo cuyo ID de proceso de posesión todavía estaba vivo. Después de un reinicio, el sistema operativo vuelve a emitir rutinariamente los mismos ID de proceso, por lo que un archivo antiguo podría confundirse permanentemente con uno que pertenece a un archivo en ejecución proceso. Es por eso que el crecimiento rastreó reinicios.

<a id="what-opencodex-does-now"></a>

## Lo que opencodex hace ahora

La limpieza se repite en el temporizador de fondo normal del proxy en lugar de ejecutarse una vez en el inicio, por lo que un proxy en ejecución recupera los archivos abandonados por su cuenta. También Ignora la comprobación de ID de proceso para los archivos más antiguos que el arranque actual, ya que no El proceso de ejecución puede poseerlos.

Las reglas de seguridad no cambian: nunca se elimina un archivo menor de 15 minutos. y el proxy nunca elimina un archivo que está escribiendo.

<a id="how-often-the-snapshot-is-written"></a>

## Con qué frecuencia se escribe la instantánea

Se desvían las escrituras, y el desvían se deriva del tamaño de la **último instantánea realmente escrita**: mientras que el archivo es pequeño, la siguiente escritura está programada aproximadamente dos segundos después de un cambio, y una vez que está cerca de los 24 MB se estira a lo sumo treinta segundos. Un cache que acaba de crecer todavía toma la espera corta una vez que — la cadencia más larga se aplica de la escritura después de - Sí. Un color se omite solo cuando este proceso ya escribió los mismos bytes a la mismo archivo, ese archivo todavía coincide en el disco, y — fuera de Windows — su modo es Todavía propietario-sólo. Un nuevo proceso reescribe una instantánea idéntica una vez, y un archivo cuyos contenidos o permisos cambiados debajo del proxy se reescriben a través de Endurecer el camino en lugar de dejarlo solo.

Cada cadencia de fondo ordinaria realiza como máximo una reescritura atómica completa. Si el La caché de continuación cambia mientras que la escritura está en curso, opencodex programa uno Seguimiento de la cadencia normal retardada en lugar de volver a escribir toda la instantánea inmediatamente. El apagado elegante mantiene su comportamiento de reintento limitado después del vuelo Las solicitudes se han agotado para que la instantánea final pueda ponerse al día antes de que finalice el proceso.

Together, estos mantienen la tasa de escritura aproximadamente plana a medida que crece la caché, en lugar de re-serializar y reemplazar el archivo completo cada dos segundos.

Un apagado elegante se descarga inmediatamente en lugar de esperar el temporizador, por lo que el espera más larga se amplía principalmente la ventana en la que una muerte dura pierde la más reciente continuación entradas — que son caché, como arriba. Ese rubor sigue siendo un disco escribir y puede fallar como cualquier otro, por lo que un apagado en un volumen completo o de solo lectura pueden perder las mismas entradas.

<a id="reclaiming-files-that-already-accumulated"></a>

## Recuperar archivos que ya se han acumulado

Si el proxy se ejecuta, esto sucede automáticamente en uno o dos minutos.

Si el proxy es **no** Inicio — El caso donde la pila crece más rápido — comprobar y recuperar desde la línea de comandos:

```bash
ocx doctor
```

La sección "Response-state temp files" informa cuántos archivos son recuperables y cuánto espacio ocupan. Solo informa; no cambia nada.

Para eliminarlos realmente:

```bash
ocx doctor --reclaim-response-temps
```

Ambos comandos funcionan sin un proxy en ejecución. Archivos actualmente bloqueados por otro El proceso se informa en lugar de forzarse. Se vuelven a intentar en la siguiente reclamación — automáticamente mientras el proxy se está ejecutando, de lo contrario la próxima vez que comando.

Si un backlog muy grande excede una pasada, el comando dice cuántos archivos quedan. para que puedas ejecutarlo de nuevo.

Esto cubre específicamente las temperaturas de instantáneas del estado de respuesta. Otros componentes escribir sus propios archivos temporales con un nombre similar, y esos no se tocan aquí.

<a id="spill-files-responses-state-spill"></a>

## Archivo de derrames (`responses-state-spill/`)

Un directorio hermano, `~/.opencodex/responses-state-spill/`, aguanta derramado conversaciones continuas. Cuando la continuación en memoria caché supera su presupuesto residente, opencodex mueve las cargas útiles más antiguas a estos archivos y mantiene Solo un pequeño stub en `responses-state.json`. Esto es lo que mantiene la instantánea pequeño sin caer largo `previous_response_id` cadenas.

La tienda está limitada, por lo que este directorio no puede crecer sin límite mientras el proxy ejecuta:

- como mucho **1 GiB** de carga útil derramada total,
- como mucho **1000** Respuestas almacenadas,
- Cada entrada expira **24 horas** Después de que fue almacenado.

Cuando se golpea un límite, las entradas más antiguas son desalojadas y sus archivos de derrame son eliminados. removidas con ellos.

**Reiniciar conserva cada archivo de derrame que la instantánea todavía hace referencia.** Un reinicio recarga los stubs y vuelve a poseer los archivos detrás de ellos, por lo que no se pierde nada Reboot. Un archivo se convierte en basura solo cuando ya no se hace referencia a — — y opencodex recuperan las mismas después de Un período de gracia de 15 minutos.

**No borre los archivos de derrame manualmente.** Los archivos a los que se hace referencia son parte de un cadena de continuación en vivo, y la recuperación ya maneja las no referenciadas.
`ocx doctor` informa de la división sin tocar nada: un "estado-respuesta" La sección "ficheros de derrame" muestra el total de archivos y bytes en el disco, cuánto queda propiedad de la tienda o la instantánea persistente, y cuánto se sienta como recuperable candidatos huérfanos. Las mismas cuentas están en la gestión API en
`/api/system/memory` bajo `responseSpill`.
