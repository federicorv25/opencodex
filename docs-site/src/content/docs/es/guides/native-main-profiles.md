---
title: "Perfiles de inicio de sesión principales nativos"
description: "Administrar el nativo almacenado Codex los perfiles de inicio de sesión por separado de OpenCodex Pool enrutamiento."
---

<a id="native-login-is-not-pool-selection"></a>

## El inicio de sesión nativo no es una selección Pool

En **Codex Set → Multi-auth**, abrir **Administrar el inicio de sesión principal** En el caso de
**Inicio de sesión nativo principal** inmediatamente debajo de la tarjeta de cuenta principal. El mismo El panel aparece junto a la tarjeta principal en el espacio de trabajo de la cuenta Proveedores. Lo administra el inicio de sesión físico de Codex, no la cuenta seleccionada para el próximo Pool solicitud. No agrega una pestaña Integraciones ni reemplaza los controles Pool existentes.

El visualizado **CODEX_HOME efectivo** pertenece al servidor OpenCodex. Cuando usando un panel de control remoto, este puede ser un equipo diferente del navegador.
**Perfil activo registrado** es el propietario registrado de la tienda de perfiles cifrados; el servidor verifica el inicio de sesión físico antes de cambiar. Un inicio de sesión cambiado fuera Por lo tanto, OpenCodex puede producir un error de desajuste de propiedad en lugar de ser silenciosamente sobreescrito.

<a id="save-and-switch"></a>

## Guardar y cambiar

Uso **Guardar el inicio de sesión actual como perfil** para registrar el inicio de sesión de la aplicación existente. Por un ya registrado inicio de sesión activo esto actualiza su etiqueta; no se inscriba una nueva cuenta. El cambio de perfil requiere el almacén de credenciales de archivo compatible y un sistema operativo disponible. Los códigos de diagnóstico explican por qué los controles son no disponible; no evitar un error de almacén de claves o propiedad copiando Pool credenciales en el archivo de inicio de sesión nativo. El panel está deshabilitado mientras el La operación de reautentificación del dispositivo nativo existente de la tarjeta está activa.

Seleccionar **Cambiar** junto a un perfil inactivo almacenado. Revisar la etiqueta de destino y visualizado **CODEX_HOME**, luego cierre Codex nativo en el equipo servidor usando que **CODEX_HOME**. Seleccione la casilla de verificación debajo de los pasos para confirmar que Codex es cerrado, luego confirme el cambio. No se envía ninguna mutación de credenciales antes de la confirmación. El panel vuelve a leer la casa actual, el propietario activo y el estado de recuperación inmediatamente. antes de enviar. Si ese estado cambió, revise el nuevo estado y confirme nuevamente. El backend existente sigue siendo autorizado para cerraduras, comprobaciones de procesos, drenaje Solicitudes en vuelo, activación y reversión.

La confirmación muestra tres pasos: cerrar Codex en el equipo servidor para visualizado **CODEX_HOME**; seleccione la casilla de abajo para confirmar que Codex está cerrado, luego confirme el cambio; espere el resultado y el perfil activo actualizado, luego siga las instrucciones para volver a abrir Codex. Mantenga Codex cerrado hasta que tenga Verificó el resultado. Reabrir la guía espera a que el existente lectura y actualización de la cuenta para finalizar; un fallo de actualización le pide que actualice antes de continuar.

Si `CODEX_BUSY` bloquee el cambio, cierre Codex en el equipo servidor usando la visualizado **CODEX_HOME**, elige **Actualizar estado**Revisar el perfil activo. Seleccionar **Cambiar** nuevamente y seleccione la casilla de verificación para confirmar que Codex está cerrado antes confirmar el cambio. La actualización solo lee el estado; no vuelve a intentar el cambio. Un error de comprobación de proceso le pide que compruebe que Codex está cerrado e inspeccione el servidor diagnóstico, mientras que los errores de solicitud activa o de operación ocupada le piden que trabajo existente para terminar. Un error de almacenamiento significa que servidor no puede acceder de forma segura a la carpeta de inicio de sesión o al almacenamiento del perfil; diagnóstico antes de otro cambio. Otros errores permitidos identificar problemas de perfil, almacén de claves, almacenamiento o recuperación sin mostrar crudo mensajes del servidor. Una respuesta perdida sigue siendo un resultado no confirmado, incluso si el perfil activo actualizado cambiado. Una respuesta faltante no significa que el original Login fue restaurado. Nada se vuelve a intentar automáticamente. Para volver a intentar un cambio de inicio de sesión, seleccione la acción de nuevo y confirme que Codex está cerrado.

Los resultados están etiquetados **Último resultado confirmado**. Una actualización manual despeja el muestra un error, pero no confirma una transacción anterior de respuesta perdida. Un Los requisitos de reinicio existentes de un cambio confirmado anterior pueden permanecer visibles.

Después del éxito, compruebe el perfil activo actualizado y vuelva a abrir Codex nativo en el servidor con la pantalla **CODEX_HOME**. Siga cualquier requisito de reinicio Se muestra en el panel. El panel vuelve a leer el estado del perfil y actualiza el controlador de cuenta. No llama a las mutaciones de selección/configuración Pool ni edita claves del proveedor, tareas o historial. El backend existente todavía reconcilia a los nativos
`__main__` identidad, tal como lo hace para el flujo de trabajo CLI.

<a id="recovery-and-previous-profiles"></a>

## Recuperación y perfiles anteriores

Estas son diferentes operaciones:

- **Recuperar el cambio interrumpido** concilia una transacción de backend inconclusa.
  **Restaurar la transacción pendiente** Solicitudes de reversión de esa transacción. Ambos requieren que seleccione la casilla de verificación para confirmar Codex está cerrado antes de confirmar El cambio. Estos controles permanecen disponibles cuando una lista de perfiles dañada no se puede leer, pero los diagnósticos informan la recuperación pendiente.
- **Volver a la vista previa** después de que un interruptor exitoso seleccione el perfil mostrado antes de su switch usando el flujo de trabajo normal y confirmado. Esto acceso directo se mantiene solo en la memoria de la página, con alcance a la casa y espera activo propietario, y desaparece cuando la página se recarga o el proxy/propietario cambia. El API no devuelve el origen de la transacción, por lo que este no es un servidor verificado deshacer log: otro operador podría haber cambiado el inicio de sesión entre la lectura previa y su interruptor. Después de recargar, seleccione el perfil guardado deseado directamente.

Un error de red no establece que una escritura falló o se revirtió. El panel relee el estado del servidor después de una mutación enviada, incluida una respuesta perdida, y Nunca lo vuelve a intentar automáticamente. Si la actualización falla, un cambio exitoso no es reportado como deshecho. Actualice e inspeccione los diagnósticos antes de otra operación. El existente `ocx account main doctor` El comando proporciona diagnósticos del lado del servidor.

<a id="scope-of-this-phase"></a>

## Alcance de esta fase

Este panel enumera, registra, cambia y recupera los perfiles existentes utilizando el existentes `/api/native-main-profiles` límite. No inicia procesos de inicio de sesión o exponer el escritor de puesta en escena tokens. Agregar otro inicio de sesión nativo permanece en el existentes `ocx account main add` Flujo de trabajo CLI; la inscripción en el navegador es un proceso separado Seguimiento de la edición 3417. Reautenticación de dispositivos existentes de la principal actual slot es un flujo de trabajo diferente y no es reemplazado por este panel.

Los datos de perfil no se escriben en el almacenamiento del navegador. El cliente solo proyecta público campos, muestra los códigos de error permitidos en lugar de los mensajes del servidor sin procesar, y utiliza el contenedor fetch autenticado existente de la aplicación. El backend autenticación de gestión, GUI-sesión/CSRF y comprobaciones de sin cambios.
