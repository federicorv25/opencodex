---
title: "Perfiles de inicio de sesión principales nativos"
description: "Administrar el nativo almacenado Codex los perfiles de inicio de sesión por separado de OpenCodex Pool enrutamiento."
---

<a id="native-login-is-not-pool-selection"></a>

## El inicio de sesión nativo no es una selección Pool

En **Codex Conjunto → Multi-auth**, abra **Administrar inicio de sesión principal** en el panel separado **Nativo inicio de sesión principal** inmediatamente debajo de la tarjeta de cuenta principal. El mismo panel aparece junto a la tarjeta principal en el espacio de trabajo de la cuenta de proveedores. Gestiona el inicio de sesión físico Codex, no la cuenta seleccionada para la próxima solicitud Pool. No agrega una pestaña Integraciones ni reemplaza los controles Pool existentes.

El **Efectivo CODEX_HOME** mostrado pertenece al servidor OpenCodex. Cuando se utiliza un panel de control remoto, este puede ser un equipo diferente del navegador. **Perfil activo registrado** es el propietario registrado de la tienda de perfiles cifrados; el servidor verifica el inicio de sesión físico antes de cambiar. Por lo tanto, un inicio de sesión cambiado fuera de OpenCodex puede producir un error de desajuste de propiedad en lugar de sobrescribirse silenciosamente.

<a id="save-and-switch"></a>

## Guardar y cambiar

Utilice **Guardar actual como perfil** para registrar el inicio de sesión de la aplicación existente. Para un inicio de sesión activo ya registrado, esto actualiza su etiqueta; no registra una nueva cuenta. El cambio de perfil requiere el almacén de credenciales de archivo compatible y un almacén de claves del sistema operativo disponible. Los códigos de diagnóstico explican por qué los controles no están disponibles; no trabaje alrededor de un almacén de claves o error de propiedad copiando las credenciales Pool en el archivo de inicio de sesión nativo. El panel está desactivado mientras la operación de reautentificación de dispositivos nativa de la tarjeta principal está activa.

Elija **Interruptor** junto a un perfil inactivo almacenado. Revise la etiqueta de destino y visualice **CODEX_HOME**, luego cierre Codex nativo en el equipo servidor usando ese **CODEX_HOME**. Active la casilla de verificación debajo de los pasos para confirmar que el Codex está cerrado y, a continuación, confirme el cambio. No se envía ninguna mutación de credenciales antes de la confirmación. El panel vuelve a leer la casa actual, el propietario activo y el estado de recuperación inmediatamente antes de enviar. Si ese estado cambió, revise el nuevo estado y confirme nuevamente. El backend existente sigue siendo autorizado para bloqueos, comprobaciones de procesos, eliminación de solicitudes en vuelo, activación y reversión.

La confirmación muestra tres pasos: cerrar Codex en el ordenador servidor para el **CODEX_HOME** visualizado; seleccionar la casilla de verificación de abajo para confirmar que Codex está cerrado, luego confirmar el cambio; esperar el resultado y el perfil activo actualizado, luego seguir las instrucciones para volver a abrir Codex. Mantenga el Codex cerrado hasta que haya comprobado el resultado. La guía de reapertura espera a que finalice la lectura y actualización de la cuenta existentes; un error de actualización le pide que actualice antes de continuar.

Si `CODEX_BUSY` bloquea el cambio, cierre Codex en el ordenador servidor usando el **CODEX_HOME** visualizado, elija **Actualizar estado** y revise el perfil activo. Seleccione **Interruptor** de nuevo y seleccione la casilla de verificación para confirmar que Codex está cerrado antes de confirmar el cambio. La actualización solo lee el estado; no vuelve a intentar el cambio. Un error de comprobación de proceso le pide que compruebe que Codex está cerrado e inspeccione los diagnósticos del servidor, mientras que los errores de solicitud activa o de operación ocupada le piden que espere a que finalice el trabajo existente. Un error de almacenamiento significa que el servidor no puede acceder de forma segura a la carpeta de inicio de sesión o al almacenamiento del perfil; compruebe los diagnósticos del servidor antes de otro cambio. Otros errores permitidos identifican problemas de perfil, almacenamiento de claves, almacenamiento o recuperación sin mostrar mensajes sin procesar del servidor. Una respuesta perdida sigue siendo un resultado no confirmado, incluso si el perfil activo actualizado ha cambiado. Una respuesta faltante no significa que el inicio de sesión original fue restaurado. Nada se vuelve a intentar automáticamente. Para volver a intentar un cambio de inicio de sesión, seleccione la acción de nuevo y confirme que Codex está cerrado.

Los resultados se etiquetan como **Ultimo resultado confirmado**. Una actualización manual borra el error que se muestra, pero no confirma una transacción de respuesta perdida anterior. Un requisito de reinicio existente de un cambio confirmado anterior puede permanecer visible.

Después del éxito, compruebe el perfil activo actualizado y, a continuación, vuelva a abrir el Codex nativo en el equipo servidor con el **CODEX_HOME** visualizado. Siga todos los requisitos de reinicio que se muestran en el panel. El panel vuelve a leer el estado del perfil y actualiza el controlador de cuenta existente. No llama a Pool mutaciones de selección/configuración ni edita claves, tareas o historial del proveedor. El backend existente todavía reconcilia la identidad nativa `__main__`, tal como lo hace para el flujo de trabajo CLI.

<a id="recovery-and-previous-profiles"></a>

## Recuperación y perfiles anteriores

Estas son diferentes operaciones:

- **Recupera cambios interrumpidos** reconcilia una transacción de backend inacabada. **Restaurar transacción pendiente** solicita la reversión de esa transacción. Ambos requieren que seleccione la casilla de verificación para confirmar que Codex está cerrado antes de confirmar el cambio. Estos controles permanecen disponibles cuando no se puede leer una lista de perfiles dañada, pero los diagnósticos informan sobre la recuperación pendiente.
- **Volver a la vista previa** después de un cambio exitoso selecciona el perfil que se muestra antes de su cambio utilizando el flujo de trabajo de cambio normal y confirmado. Este acceso directo se mantiene solo en la memoria de la página, se extiende a la casa y al propietario activo esperado, y desaparece cuando se recarga la página o cambia el proxy / propietario. El API no devuelve el origen de la transacción, por lo que este no es un registro de deshacer verificado por el servidor: otro operador podría haber cambiado el inicio de sesión entre la lectura previa y su interruptor. Después de recargar, seleccione el perfil guardado deseado directamente.

Un error de red no establece que una escritura falló o se revirtió. El panel vuelve a leer el estado del servidor después de una mutación enviada, incluida una respuesta perdida, y nunca lo vuelve a intentar automáticamente. Si falla la actualización, un cambio exitoso no se informa como deshecho. Actualice e inspeccione los diagnósticos antes de otra operación. El comando `ocx account main doctor` existente proporciona diagnósticos del lado del servidor.

<a id="scope-of-this-phase"></a>

## Alcance de esta fase

Este panel enumera, registra, cambia y recupera perfiles existentes utilizando el límite `/api/native-main-profiles` existente. No inicia procesos de inicio de sesión ni expone tokens de escritor de estadificación. La adición de otro inicio de sesión nativo permanece en el flujo de trabajo `ocx account main add` CLI existente; la inscripción del navegador es un seguimiento separado del problema. La re-autenticación del dispositivo existente de la ranura principal actual es un flujo de trabajo diferente y no es reemplazado por este panel.

Los datos de perfil no se escriben en el almacenamiento del navegador. El cliente proyecta solo campos públicos, muestra los códigos de error permitidos en lugar de los mensajes del servidor sin procesar y utiliza el contenedor de extracción autenticado existente de la aplicación. Las comprobaciones de autenticación de gestión del backend, GUI-sesión/CSRF y ruta-admisión no han cambiado.
