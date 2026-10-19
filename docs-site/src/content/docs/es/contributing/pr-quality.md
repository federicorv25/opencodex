---
title: "Contrato de calidad Pull request"
description: "Revise la preparación, la responsabilidad del contribuyente, los carriles de confianza y la política de cierre para las solicitudes de extracción OpenCodex."
---

<a id="you-do-not-need-permission-to-fix-something"></a>

## No necesitas permiso para arreglar algo

Una solicitud de extracción no planificada para un error que realmente golpea es bienvenida. Varios de estos mejores correcciones del proyecto llegaron exactamente de esa manera — un modelo enrutado llamadas a herramientas, un proveedor que envía los parámetros de modelo incorrectos, imágenes que se aplanan fuera de los resultados de la herramienta. Ninguno de ellos comenzó con una discusión de planificación, y a La puerta que requería uno los habría perdido a todos.

Abrir un problema primero ayuda genuinamente a un trabajo más grande o en forma de diseño, donde Estar de acuerdo en el enfoque te evita construir lo incorrecto. Es un consejo, No es un requisito de admisión.

<a id="what-a-ready-pull-request-claims"></a>

## Lo que afirma una solicitud de extracción lista

Marcar un PR listo para su revisión es una afirmación de que el cambio está completo, entendido, y probado. La apertura no transfiere la responsabilidad de la sucursal al mantenedores.

Se espera que los autores entiendan cada línea cambiada, nombre los comandos exactos y resultados detrás de cualquier afirmación de validación, agregue cobertura de regresión enfocada para cambios de comportamiento, y permanecer disponible para resolver CI y revisar los comentarios. Los mantenedores identifican los problemas; no se espera que reparen al contribuyente. ramas, escribir las pruebas que faltan o traducir los hallazgos automatizados en parches en su nombre.

"Probado" o "CI pasa" sin comandos y resultados nombrados no es evidencia.

<a id="automated-gates"></a>

## Puertas automatizadas

Tres controles deterministas se ejecutan antes de la revisión humana, y cada mensaje de falla Te dice exactamente qué cambiar:

- **Calidad de PR (`enforce-target`).** Las solicitudes de tirón deben apuntar `dev` y llevar una descripción real: a **Resumen** de lo que cambió y por qué, más un **Prueba plan** (o sustancia equivalente). Cuando el diff cambia los archivos bajo `gui/`, o cuando GitHub devuelve una lista de archivos modificados incompleta para una diferencia grande, el la descripción debe incluir una captura de pantalla del cambio de interfaz de usuario; el cheque mantiene el PR un borrador y comentarios hasta que la captura de pantalla está presente. Archivo incompleto Las listas se tratan de forma conservadora como un cambio GUI. Un mantenedor puede renunciar a la requisito de captura de pantalla para un `gui/` cambio, para un camino GUI falso positivo clasificación, o para un falso positivo de lista de archivos incompletos, agregando el
  `gui-screenshot-waived` etiquetar; agregar o quitar esa etiqueta inmediatamente Reevalúa la puerta. Comentarios de los mantenedores heredados como "no gui changes" todavía se reconocen en el próximo evento de relaciones públicas por compatibilidad, pero los comentarios ellos mismos ya no activan la puerta privilegiada de PR. Un colaborador no puede auto-renuncia al requisito de captura de pantalla. Los PR de colaboradores (autores sin permiso de inserción del repositorio) se abren en borrador y permanecer allí hasta que una lista de verificación de revisión de cuatro cajas en el descripción está completa: validación local requerida pasada con su alcance documentado, la rama en el último `dev` commit, todos los hallazgos correctos de Codex y CodeRabbit corregidos, y el lista para la confirmación de revisión. Una vez que cada casilla está marcada, el cheque marca la PR listo para su revisión y notifica a los mantenedores enumerados en `MAINTAINERS.md`
  (excluyendo al autor). El estado de la puerta y "qué hacer" viven en una sola bot consolidado que se reescribe en cada ejecución, por lo que hay exactamente Un lugar para mirar. La finalización está vinculada a la confirmación exacta del jefe de relaciones públicas señalado: si se presionan nuevos commits después, la puerta mueve el PR hacia atrás para redactar, restablece la lista de verificación y la notificación mantenedora, y le pide que para probar y marcar las casillas de nuevo contra el último código. Un retargeting para
  `dev` borra el mensaje de rama incorrecta automáticamente y es recordado por el puerta; el borrador permanece hasta que se complete la lista de verificación. Antes de que se acepte una finalización, la puerta verifica la lista de verificación afirma que puede comprobarse a sí mismo: la sucursal debe estar en el último `dev` Comprometerse o como mucho 10 confirma detrás de él, y cada Codex y CodeRabbit hilo de revisión creado por un bot de revisión en la cabeza actual debe resolverse (hilos sin resolver de otros autores no bloquean). La caja de validación local sigue la [política de alcance de prueba](/es/contributing/#build-and-test-commands): ejecutar la suite completa de forma predeterminada; cuando es demasiado costoso, ejecutar regresiones enfocadas y documentar la excepción. Es una certificación de autor que solo los contribuyentes de fork de — no pueden iniciar el repositorio CI; un mantenedor tiene que — para que la puerta nunca lo desmienta; un nuevo empujón todavía restablece cada caja. CodeRabbit hallazgos que caen fuera del rango de diferencia y se informan solo en una revisión cuerpo en la cabeza actual añadir al recuento no resuelto mientras que un bot revisión El hilo está abierto; resolver cada hilo de bot despeja la caja. Una afirmación refutada desmarca la caja correspondiente y mantiene el PR un borrador. Cuando la lista de verificación es completa y cada puerta es verde, la puerta añade un `review-ready` etiquetar como a marcador de estado visible en el momento listo. Las ediciones del comentario de estado CodeRabbit no activan la puerta PR. CodeRabbit Exitoso `CodeRabbit` El estado de confirmación activa la puerta de rama predeterminada de confianza A través de la `status` evento. La puerta asigna ese estado SHA a exactamente uno abierto PR cuya cabeza actual aún coincide, luego vuelve a leer los hilos de revisión en vivo y revisar los organismos antes de cambiar la lista de verificación, etiquetar, comentar o redactar el estado. Un asociación ambigua o rancia SHA se ignora, y no hay ejecutada con el token capaz de escritura de la puerta.

- **Higiene.** Los cambios de comportamiento necesitan una prueba; nuevas pelusas o supresiones de tipo, pruebas enfocadas o saltadas, bloques de captura vacíos, salida generada editada y un archivo lock cambiado sin su manifiesto cada necesidad una etiqueta de aprobación explícita. Un cambio solo de comentario en un archivo fuente no es un cambio de comportamiento y no debe Prueba.
- **CI multiplataforma.** La suite se ejecuta fragmentada en Linux y en su totalidad en macOS para cada solicitud de tirón. Windows se ejecuta en el límite de envío — en la promoción a
  `main` o `preview` — así que un corredor lento o escamoso de Windows no puede decidir cuando su La solicitud de extracción se vuelve verde. Esto funciona para **cada** solicitud de extracción, cualquiera que sea su rama base — incluyendo un niño apilado cuya base es otra cabeza abierta de PR. Los `paths:` filtro, no la rama base, decide si los trabajos se ejecutan en absoluto: un PR tocando solo documentos o `devlog/` Nada de colas.

- **Tipo de etiqueta.** Los `label` check deriva `bug` / `enhancement` /
  `documentation` / `chore` de su título de PR. Un título sin reconocimiento prefijo (`stack 3/5: …`) vuelve a los compromisos de PR, que generalmente se quedan convencional; `chore`-compromisos familiares (`test:`, `ci:`, `refactor:`) no Votar un `fix:` o `feat:`. Un PR que genuinamente mezcla tipos se deja Sin etiquetar en lugar de adivinar, y una etiqueta que un humano establece nunca se sobrescribe.

CodeRabbit revisa todas las relaciones públicas y sus hallazgos son de asesoramiento. Dirija lo que obtiene Bien; di por qué cuando está mal. No bloquea una fusión.

<a id="when-a-workflow-change-takes-effect"></a>

### Cuando un cambio de flujo de trabajo entra en vigor

`enforce-target` y `label` Utilice la automatización de rama predeterminada de confianza. La puerta de PR se ejecuta en `pull_request_target` y en CodeRabbit `status` eventos, ambos cargados desde la rama predeterminada del repositorio; el comportamiento capaz de escritura por lo tanto cambios solo después de que se promocione la revisión de puerta a `main`. El multiplataforma El flujo de trabajo de CI se ejecuta en `pull_request` y surtirá efecto tan pronto como se rama que está siendo atacada.

<a id="sponsored-surfaces"></a>

## Superficies patrocinadas

Autenticación, gestión de credenciales, flujos de trabajo de GitHub Actions, versión La automatización y la instalación de dependencias necesitan un mantenedor para patrocinar el cambio. (`maintainer-sponsored`) antes de que se fusione. Una mala fusión en esas superficies es costosas y difíciles de desenrollar, por lo que son las únicas superficies De ninguna manera. Todo lo demás está abierto.

<a id="when-a-pull-request-is-closed"></a>

## Cuando se cierra una solicitud de extracción

Una RP que se detiene con comentarios de revisión no resueltos puede cerrarse, con la razón declarado claramente. El cierre no es un veredicto sobre el contribuyente: reabrirlo una vez que el la razón declarada se resuelve, o reemplazarlo por uno limpio. Pregunte si la razón es No está claro.

<a id="updating-an-older-readiness-checklist"></a>

## Actualización de una lista de verificación de preparación más antigua

Si la puerta informa que su lista de verificación todavía usa la redacción local-CI retirada, conserva su descripción y le pide que actualice el primer elemento. Cambiar ese elemento a la redacción en el aviso del bot, borre las cuatro cajas y guarde. Espere a que el bot reconozca el borrado lista de verificación, validar la cabeza que se muestra, a continuación, marque las cuatro casillas y guardar de nuevo. Cambio Solo la redacción dejando cuatro garrapatas no cuenta como una nueva certificación. Un empujón o El retargeting invalida el punto de control. La puerta permanece roja y las relaciones públicas permanecen en borrador hasta este momento. secuencia y los controles de calidad ordinarios completos. Si su guardar comparte el punto de control timestamp, haga que otro cuerpo edite y guarde más tarde; editar solo el título no cuenta.
