---
title: "Codex Mensajería"
description: "Cola de mensajes correlacionados con sesiones Codex cargadas localmente o a través de pares SSH explícitos."
---

`ocx message` es una superficie opt-in para las sesiones Codex existentes. No inicia ningún proxy o servidor de aplicaciones, no reanuda ningún hilo e instala ninguna habilidad. Sockets Unix Linux/macOS son compatibles; Windows falla explícitamente. El existente El demonio Codex debe soportar experimentos `thread/queue/add`. Sin pin de versión CLI o
`CODEX_CLI_PATH` Se requiere selección.

<a id="discover-and-send"></a>

## Descubrir y enviar

```bash
ocx message sessions --json
printf '%s\n' 'Please review the current change and send your findings back.' |
  ocx message send --name 'reviewer' --stdin --json
```

Discovery devuelve solo ID de subproceso cargados, nombres y estados en entorno de ejecución, no historial, Vista previa o directorios de trabajo. Utilice una UUID exacta (`--thread`) o una única exacta nombre (`--name`) Los destinos faltantes, duplicados, incompletos o descargados fallan; no hay coincidencia difusa o retroceso a las sesiones almacenadas.

El zócalo de control existente se resuelve bajo `CODEX_HOME`, utilizando el misma política de inicio que otros comandos de integración Codex. Antes de conectar, el socket resuelto debe ser propiedad de su uid y ser un socket. Todo verdadero padre a través de root debe ser propiedad de su uid o root y no debe ser grupo / otro escribir, excepto los directorios sticky de propiedad raíz como `/tmp`. Hogares símlinked se les permite cuando sus caminos resueltos pasan. Los caminos no confiables fallan con
`untrusted_socket` y sin detalles de ruta resuelta.

Discovery, la última comprobación de destino cargado y la cola usan una conexión a esa Enchufe. No se produce ningún ayudante nativo de CLI, instalación, reparación o reconexión. A daemon sin soporte de cola local devuelve `unsupported_queue`.

Solo se acepta UTF-8 stdin, como máximo 16 KiB de texto no vacío sin NUL. Uno La fecha límite de 30 segundos cubre la entrada, el descubrimiento, la revalidación y la presentación. Cada RPC se limita a 10 segundos. El sobre completo está limitado a 32 KiB. Texto del mensaje se envía a través de la conexión Unix RPC y nunca se coloca en los argumentos de proceso generados.

<a id="sender-and-replies"></a>

## Remitente y respuestas

El envoltorio genera un mensaje UUID y adjunta el ID/nombre del remitente desde un
`CODEX_THREAD_ID` Metadatos de demonio. Este contexto es **No autenticado peer autoridad** y nunca otorga la aprobación del usuario o la escalada. Un inválido/descargado El remitente reclamado falla; el contexto ausente permanece desconocido, sin adivinar una ruta de respuesta. Los mensajes de pares se ponen en cola como texto, no como aprobaciones o configuración de permisos. Anulaciones. El arnés del agente receptor hace cumplir sus permisos; sobre La orientación no es un límite de autorización técnica o una garantía del comportamiento del modelo.

El tipo predeterminado es `request`. Contestar utilizando el generado `replyCommand` en la envolvente, o correlacionar explícitamente una respuesta:

```bash
printf '%s\n' 'Review findings: ...' |
  ocx message send --thread <sender-thread-uuid> --kind response \
    --in-reply-to <request-message-uuid> --stdin --json
```

`response` requiere `--in-reply-to`Otros lo rechazan. Uso `--kind notification`
para un FYI. Responses y las notificaciones no solicitan reconocimientos. Un normal La respuesta final del agente no se devuelve a su compañero; las rutas faltantes no deben adivinarse. No se introducen cambios globales de solicitud ni bucles de acuse de recibo.

<a id="receipts-and-exit-codes"></a>

## Recepción y códigos de salida

`--json` emite un recibo versionado (`ocx-message/1`) que contiene el mensaje UUID, tipo, correlación de respuesta, metadatos de remitente/objetivo y estado de envío. Nunca incluye texto de cuerpo o salida de demonio sin procesar. Fallos de entrada/configuración antes de un recibo Existe el uso `ocx-message-error/1` con `not_sent`; los fallos de descubrimiento usan lo mismo esquema de error sin un estado de envío. El uso no válido sale 64 en stderr antes de E/S.

| Estado | Salir | Significado |
| --- | --- | --- |
| `not_sent` | 1 | Validación/descubrimiento/revalidación falló, no se escribió ningún marco de cola o el demonio lo rechazó explícitamente. |
| `queued` | 0 | Una respuesta de demonio correlacionada reconoció la sumisión, **no procesamiento** por el receptor. |
| `unknown` | 3 | Puede haber ocurrido una presentación, pero se perdió el reconocimiento, se malformó, no se coincidió o se canceló. **No vuelvas a jugar.** |

El mensaje de aplicación UUID es también la solicitud de cola `clientUserMessageId`. El ID de envío del daemon está separado; ninguno demuestra el procesamiento del destinatario. La cola no es la dirección y puede esperar a que un giro ocupado para terminar. OpenCodex realiza No hay repetición automática, seguimiento de sondeo, persistencia o monitoreo de entrega. La comprobación final del objetivo cargado y el envío de la cola no son atómicos: si el objetivo Luego, un rechazo explícito es `not_sent` con `queue_rejected`; una respuesta perdida o inválida es `unknown`. OpenCodex no lo reanuda ni vuelve a intentar.

<a id="explicit-remote-peers"></a>

## Pares remotos explícitos

La mensajería remota es independiente del enlace remoto y el inicio proxy normal. Lo hace no redirigir proveedores, compartir credenciales de proveedores o iniciar un demonio nativo. Ambos nodos necesitan un demonio compatible OpenCodex CLI y un demonio existente con capacidad de cola. Linux tiene evidencia de interoperabilidad aislada; macOS requiere su propia calificación. El transporte remoto Windows no es compatible.

En cada nodo, habilite explícitamente la mensajería. En el nodo de recepción, mantenga la propietario de primer plano corriendo:

```bash
ocx message enable --port 39176 --json
ocx message serve --json
```

En el nodo de inicio, use su destino/alias OpenSSH existente. Compruebe el Se ofreció la huella digital contra una fuente confiable antes de confirmarla:

```bash
ocx message hosts probe --ssh worker --json
ocx message hosts add worker --ssh worker --fingerprint 'SHA256:<confirmed-key>' --json
ocx message hosts list --json
ocx message serve --host worker --json
```

Los registros de sonda privados mantienen su formato prefijado alias incluso cuando su SSH normal configuración permite `HashKnownHosts`; su archivo known_hosts normal no se cambia. Cada intento de inscripción utiliza su propio archivo de rasguño de clave fija calificado para la transacción, eliminado después de que su ayudante SSH se resuelva, incluidos los fallos, sin depender de otro cerradura del dueño de la mutación. Si no se puede confirmar la limpieza, el comando informa de un resultado de almacenamiento, no el éxito. El diario de recuperación está separado.

`hosts add worker` Autoriza los mensajes salientes a `worker`, **Mensajes no arbitrarios De vuelta a este nodo de inicio**. El intercambio de control SSH autoriza que dirección en el nodo de recepción usando su inicio de sesión SSH existente. El recibo de inscripción y `hosts list` muestra la política de entrada local de cada nodo. En el nodo de inicio, el El valor predeterminado es `responses-only`: el par puede ver y responder solo al remitente local original sesiones esperando una respuesta correlacionada a una petición enviada por este nodo. Una respuesta debe coincide con la solicitud UUID, la inscripción y el destino local original; no puede otra sesión o convertirse en una solicitud/notificación no solicitada.

Para conceder un acceso más amplio en cualquiera de los nodos, ejecute explícitamente en ese nodo:

```bash
ocx message hosts allow-inbound <peer-alias-or-machine-uuid> --json
# Withdraw the broad grant without removing enrollment:
ocx message hosts deny-inbound <peer-alias-or-machine-uuid> --json
```

`allow-inbound` Permite que los tres tipos de mensajes **cualquier sesión Codex local cargada**
y expone sus metadatos de directorio a ese par. No es una subvención de solo respuestas. Los cambios de consentimiento se aplican a las conexiones existentes antes de lecturas/envíos posteriores. Los registros más antiguos sin una política de entrada local `responses-only`No es un acceso amplio. Las rutas de respuesta están limitadas a 256 solicitudes pendientes por propietario en primer plano y caducan. después de 24 horas o retiro/reinicio del propietario. Ningún contexto de remitente significa ninguna ruta de respuesta. Una respuesta en cola o incierta consume su ruta; un rechazo nativo definido no lo hace. Una ruta caducada/perdida requiere una reconciliación explícita entre operador y remitente, nunca una repetición automática.

Cada `serve` es de propiedad en primer plano: manténgalo funcionando y use una terminal separada Para el mensaje. A lo sumo cuatro `--host` Se pueden suministrar selecciones. Nada instala un servicio o inicia un propietario automáticamente. SSH utiliza anclado confirmado claves de host y las claves/agente configuradas; las solicitudes de contraseña están desactivadas. Los wrapper posee rutas de ida y vuelta solo en bucle, por lo que el nodo receptor puede enviar respuestas correlacionadas sin un inicio de sesión SSH al iniciador, sujeto a la política anterior.

```bash
ocx message status --json
ocx message sessions --host worker --json
printf '%s\n' 'Please review and reply using the supplied route.' |
  ocx message send --host worker --name reviewer --stdin --json
```

`--host` selecciona un alias inscrito exacto o una máquina UUID. Los comandos de respuesta incluyen la máquina de origen validada UUID y el subproceso UUID; la identidad de origen se resuelve en el demonio de origen, no adivinado desde un directorio remoto. Sin el contexto del emisor, No hay un comando de respuesta inventado. Comandos locales sin `--host` retenga sus Ruta no-state/no-SSH/no-listener. El receptor valida el sobre canónico completo contra el máquina y mensaje nativo UUID, incluyendo respuesta host/command y guía estándar de pares. Un par no puede etiquetar el envoltorio como otro equipo u omitir su advertencia de no mensaje de usuario. Los nombres de sesión y los identificadores de subproceso siguen siendo reclamos descriptivos de esa máquina, no autenticación por sesión.

Las capacidades direccionales emitidas por el receptor viven en el estado de mensajería privada bajo
`OPENCODEX_HOME` (o el hogar de configuración OpenCodex predeterminado). Nunca aparecen en salida normal de comandos, argumentos de ayuda, URL o envolventes de mensajes. Pruebas mutuas autenticar la conexión WebSocket real antes de los marcos nativos/cuerpo. Una separada La prueba de salud no es suficiente evidencia de identidad. Esta es una puerta de enlace OpenCodex protocolo: crudo `codex queue --remote` no implementa su protocolo de autenticación. La puerta de enlace utiliza el mismo experimento nativo `thread/queue/add` contrato; lo hace no alterar el propio Codex `--ws-auth`, la configuración o los oyentes nativos portadores-token. Expone solo metadatos cargados y colas de texto, no el control general del servidor de aplicaciones.

El estado distingue la configuración habilitada, el propietario en ejecución y el iniciado/alquilado Rutas. Los arrendamientos de devolución expiran después de 25 segundos sin actualización; no son entrega o procesamiento de recibos. Perder una ruta o cambiar la configuración del propietario requiere propietario explícito reiniciar. La recuperación del transporte nunca reenvía un mensaje incierto.

```bash
ocx message hosts remove worker --json
ocx message disable --json
```

La eliminación revoca primero la admisión local; una limpieza remota no confirmada sale 3 y También requiere la eliminación de ese compañero. Cada eliminación saliente utiliza una clave fija independiente scratch file; un fallo en la preparación de ese archivo aún informa la eliminación local y no confirmada limpieza remota. La limpieza de rasguños se intenta tanto en el éxito como en el fracaso. Usos de la guía de limpieza generada
`hosts remove <machine-uuid> --transaction <enrollment-uuid> --json`; la transacción guard rechaza un recibo antiguo en lugar de eliminar una inscripción más reciente. Expulsión ordinaria sin este protector opcional sigue quitando el par seleccionado actualmente. Deshabilitar retira la generación actual de propietarios; despacho rechaza el nuevo trabajo inmediatamente, y los avisos del propietario en primer plano cambiaron configuración dentro de su intervalo de mantenimiento de diez segundos. El remitente comprueba el local inmediatamente antes del envío; la revocación tras el envío no puede un mensaje en vuelo o un trabajo nativo ya aceptado. Una respuesta de inscripción perdida conserva una privada transacción: repita exactamente el mismo comando add para reconciliar, en lugar de inscribirse bajo otro nombre dentro de la misma generación habilitada. Deshabilitar/rehabilitar o puerto Los cambios invalidan esa generación de recuperación. Las transacciones completadas o revocadas no pueden restaurar un par eliminado o borrar el registro de recuperación de otra inscripción. Si el diario local guardado tiene JSON mal formado, registre formas o valores de campo,
`hosts add`, `hosts list`, `status` y `hosts abandon` Rechazar con
`invalid_enrollment_journal`. Sus bytes se conservan para la recuperación explícita del operador; OpenCodex no lo repara, reemplaza o elimina automáticamente. `hosts add` envía no solicitud de control de inscripción en este caso, aunque puede ejecutarse su sonda de clave de anfitrión preliminar. El almacenamiento inseguro o un bloqueo de mutación ocupado conserva su clasificación de error separada. Si un diario válido ya no se puede conciliar, inspeccione `ocx message hosts list --json` o
`ocx message status --json` por `pendingEnrollment` (alias, transacción UUID y si su generación es rancia), luego abandona explícitamente esa revista local exacta:

```bash
ocx message hosts abandon --transaction <pending-transaction-uuid> --json
```

El abandono también funciona mientras está discapacitado. Deja a los pares existentes sin cambios, no vuelve a intentarlo La inscripción y las salidas 3 porque la limpieza remota no está confirmada. Siga su guía de limpieza en el nodo remoto si queda una inscripción huérfana. Las revistas estancadas no se eliminan silenciosamente. Un receptor completo regresa `peer_capacity` sin inscribirse; libere una ranura y repita lo mismo transacción o abandonarla explícitamente. Las respuestas de control mal formadas o perdidas siguen siendo inciertas. Las casas de configuración 0755 confiables existentes se aceptan sin chmod; propia mensajería El subdirectorio sigue siendo privado. Un reinicio inmediato del propietario puede reemplazar un arrendamiento de devolución obsoleto después de que el nuevo punto final se autentique y el punto final antiguo ya no se autentique dentro de un Un segundo de verificación. Un punto final antiguo aún autenticante conserva su arrendamiento hasta el vencimiento; La inalcanzabilidad temporal puede permitir la toma de posesión, no la repetición. Pérdida inesperada del túnel visiblemente retira al propietario en primer plano; la eliminación deliberada de pares deja en funcionamiento rutas no relacionadas. bloqueos de mutación fallan cerrado y necesitan recuperación del operador; el envoltorio nunca adivina que una vieja cerradura está abandonada. Estado y publicación de la revista de recuperación sincronizan el archivo y contienen el directorio antes de dependiente trabajo remoto; eliminación de diario también sincroniza su directorio. `remote_storage_unknown` (salida 3) significa La durabilidad del choque del cambio de almacenamiento no se pudo confirmar: inspeccione el estado antes de explícito recuperación en lugar de volver a intentarlo automáticamente. Un diario legible de forma segura con JSON mal formado o schema no bloquea la eliminación de pares, pero se conserva para la recuperación del operador; Si no se invalida un diario coincidente, se rechaza la eliminación.

El propietario en primer plano comparte límites finitos de conexión/solicitud/ayudante/memoria intermedia entre todos los pares y rechaza la sobrecarga sin una cola ilimitada: los pares inscritos juntos pueden mantener doce conexiones autenticadas, cuatro más estancia reservada para el propietario control, sondas salientes y renovación, y como máximo ocho túneles niños y dos ayudantes de control/inspección transitorios, diez en total. La instalación está limitada por 30 segundos en todo el lote de pares seleccionado. Una renovación final del contrato precede a la puesta en marcha éxito; los lotes de renovación final y periódica tienen plazos de cinco segundos, dentro de la configuración plazo cuando corresponda, y el mantenimiento periódico se realiza cada diez segundos. Cancelación se detiene solo propiedad SSH helpers/listeners; deja solos a los daemons, hilos y proxies no relacionados con Codex. La limpieza también se une a las rutas de túnel retiradas. Direct salida de niño y tubería natural EOF debe ambos se asientan dentro del techo de limpieza de tres segundos; de lo contrario, la limpieza está incompleta y la reserva de ayudante sigue cargada. La cancelación de las tuberías retenidas no demuestra descendientes Salió. Los descendientes separados o descendientes que cierran las pipas heredadas no son rastreados. La captura de Stdout Helper está limitada a 64 KiB; stderr se descarta sin ser impreso o almacenado. Después del desbordamiento de captura, el ayudante se detiene y la salida descartada se drena a EOF natural. La limpieza exitosa reporta el error de salida original; la limpieza genuinamente incompleta permanece
`cleanup_incomplete` y mantiene su reserva de ayudante cargada. Los procesos Same-uid pueden leer el estado de inscripción privada; la autenticación de máquina sí no establecer una identidad por agente no falsificable. Tráfico nativo que evita esta puerta de enlace No está controlado por ella.

Malla, controles de panel/caché, aislamiento, mensajería Claude, habilidades administradas y Las notificaciones inactivas permanecen fuera de esta contribución.
