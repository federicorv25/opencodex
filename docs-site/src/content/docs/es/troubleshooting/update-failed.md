---
title: "Fallo de actualización en Windows"
description: "En qué estado se encuentra una instalación de OpenCodex después de que la actualización ocx falle durante el paso de instalación de npm, cómo finalizar la actualización de forma segura y qué carpetas sobrantes puede eliminar."
---

Esta página es para un `ocx update` o la actualización del panel de control que se detiene parcialmente, con mayor frecuencia en Windows, con un resultado como este (reportado como problema
[#5624](https://github.com/lidge-jun/opencodex/issues/5624)):

```text
update command failed (1)
exit 1 · code: ENOTDIR · syscall: mkdir
```

y, después, una carpeta junto al paquete que no se puede eliminar porque `bunx.exe` está en uso (`EPERM`).

<a id="what-state-you-are-in"></a>

## En qué estado estás

El actualizador detiene el proxy, instala la nueva versión en una carpeta de estadificación separada, lo comprueba, y solo entonces lo intercambia. Cuando el paso de instalación falla, el intercambio nunca ocurre: la versión anterior permanece instalado y ejecutable, y el actualizador reinicia el servicio en segundo plano anterior (o el anterior antes de que salga. No es necesario volver a instalar para volver a un proxy de trabajo.

Compruebe esto con:

```bash
ocx --version
ocx status
```

El trabajo del panel de control solo registra el estado de salida, ya que la propia salida del instalador puede contener datos locales. Caminos. Correr `ocx update` en un terminal muestra el paso que falló y el siguiente paso a tomar.

<a id="finish-the-update"></a>

## Finalizar la actualización

1. Cerrar cualquier cosa que aún pueda ejecutar archivos OpenCodex: la aplicación Codex, los terminales que se iniciaron
   `ocx` o `bunx`y la bandeja OpenCodex. Un funcionamiento `bun.exe` o `bunx.exe` mantiene sus archivos bloqueado en Windows.
2. Ejecuta `ocx update` de nuevo desde una terminal.
3. Si falla de la misma manera, corre `ocx status` y dejar que cualquier recuperación en curso termine. Si el updater reinició el proxy, lo detuvo a través de su propietario (`ocx stop`, su servicio o el escritorio aplicación) y confirmar que se ha detenido. Volver a instalar con el mismo administrador de paquetes que posee la instalación; para una instalación npm administrada por el servicio OpenCodex:

   ```bash
   ocx stop
   npm install -g --allow-scripts=bun @bitkyc08/opencodex@latest
   ocx service restart
   ```

   Reinicie a través del servicio propietario o la aplicación de escritorio después de que se complete la instalación; use `ocx start`
   Cuando no se gestiona. Sustituir `latest` con `preview` si sigues el canal de vista previa.

<a id="leftover-folders"></a>

## Carpetas sobrantes

Se sientan al lado del paquete en la carpeta global de npm, generalmente
`%APPDATA%\npm\node_modules\@bitkyc08\` en Windows.

| Carpeta | Creado por | Qué hacer |
|---|---|---|
| `.opencodex-<random>` | npm en sí, mientras que la sustitución del paquete durante una `npm install -g` | Elimínelo una vez que no se ejecute ningún proceso OpenCodex desde él |
| `.ocx-staging-<timestamp>` | la instalación del actualizador OpenCodex | Se informa de una etapa marcada con más de media hora pero se deja en su lugar; elimínela a mano una vez que no se ejecute ningún proceso OpenCodex desde ella. Una etapa sin un `.ocx-update-owner.json` marcador tiene un origen no verificado — una actualización interrumpida puede dejar uno, pero también puede cualquier otra cosa que eligió el prefijo — así confirmar que pertenece a OpenCodex antes de eliminarlo |
| `.ocx-backup-<timestamp>` | copia del actualizador de la versión anterior | Déjalo; se elimina automáticamente después de que la nueva versión comience saludable y se restaura si no lo hace. |

Ninguna de estas carpetas bloquea la siguiente actualización por nombre de ruta: cada intento se convierte en una nueva carpeta. Sin embargo, los contenidos de estadificación retenida todavía consumen espacio en disco, y suficientes sobras pueden hacer que una copia posterior sea más fácil. El intento fallido con `ENOSPC`. El actualizador deja las carpetas de estadificación en su lugar durante actualizaciones posteriores; informa etapas marcadas más de media hora después de comprobar sus Marcador de propiedad. Elimine un sobrante solo después de confirmar que no se ejecuta ningún proceso OpenCodex desde él.

Si una carpeta no se elimina, un proceso sigue ejecutándose desde ella. Cerrar sesión o reiniciar Windows Libera la cerradura.

<a id="if-the-update-reports-an-unsupervised-proxy"></a>

## Si la actualización informa de un proxy UNSUPERVISED

Cuando el servicio en segundo plano no se puede actualizar después de una actualización, el actualizador primero pide que se inicie. (macOS) o el administrador de usuarios de systemd (Linux) para reiniciar el servicio que ya tiene. Si eso no lo hace traer de vuelta un proxy propiedad del servicio, el actualizador inicia el proxy directamente para que no se quede sin uno, imprime una advertencia de que el proxy está ejecutando UNSUPERVISED, y sale con un status. Ese proxy funciona, pero nada lo reinicia después de un bloqueo, y un inicio de servicio posterior puede competir con ellos por el puerto. Correr `ocx service repair` para devolverlo al servicio de fondo, entonces comprobar `ocx status`.

Las actualizaciones iniciadas desde el panel siguen el mismo orden. Si solo el inicio directo trae el proxy atrás, el panel de control informa que la actualización falló con el mismo mensaje UNSUPERVISED aunque el nueva versión se instala y responde; ejecutar la misma reparación para borrarlo.

<a id="if-the-proxy-answers-503-after-a-manual-install"></a>

## Si el proxy responde 503 después de una instalación manual

Instalar sobre un proxy en ejecución hace que responda `503` con `package_tree_changed` hasta que se reinicia. Las versiones después de 2.64.0 pueden reiniciarse después de unos segundos una vez que el árbol de paquetes y su entorno de ejecución Bun están completos. Una postinstalación incompleta o fallida de Bun evita esa recuperación.
`ocx restart` o `ocx service restart` puede encontrar un proxy en ese estado, pero reiniciar aún requiere un entorno de ejecución completo y un árbol de paquetes. Con 2.64.0 y anteriores, el El proxy permanece en ese estado, y `ocx restart` puede reportar que ningún proxy se está ejecutando mientras el antiguo todavía tiene el puerto; uso `ocx service restart`o terminar el proceso, cuyo `pid` la `/healthz`
muestra la respuesta y luego ejecuta `ocx start`.

Si el instalador ha salido o ha fallado, inspeccione su error y ejecute `ocx status`. Deje que cualquier en progreso recuperación, detenga cualquier proxy en ejecución a través de su propietario (`ocx stop`, su servicio o el escritorio app), y confirmar que se ha detenido. Reinstalar con el mismo gestor de paquetes, permitiendo Bun después de la instalación para completar, luego comience de nuevo a través del servicio propietario o la aplicación de escritorio (`ocx start`
cuando no se gestiona).

<a id="if-the-update-stops-at-the-npm-cache-check"></a>

## Si la actualización se detiene en la comprobación de caché npm

`ENOTDIR` on `mkdir` significa que npm intentó crear una carpeta donde un componente de ruta de acceso era un archivo, o un enlace cuyo objetivo ya no existe. Una causa confirmada ([#6288](https://github.com/lidge-jun/opencodex/issues/6288)) es un `%LOCALAPPDATA%\npm-cache`
unión que señaló a otra unidad después de que la carpeta de destino se había eliminado o la unidad había ha sido eliminado.

El actualizador comprueba la carpeta de caché de npm antes de detener el proxy, y la instalación de puesta en escena de npm utiliza La misma carpeta que `npm config get cache` informes. Si no se puede utilizar la carpeta caché, la actualización se detiene con `cache_root_dangling_link` o `cache_root_not_directory` y deja el proxy en ejecución:

- `cache_root_dangling_link`: la carpeta de caché es un enlace o unión cuyo destino falta. Recrear la carpeta de destino o quitar el enlace para que npm pueda crear una carpeta normal.
- `cache_root_not_directory`: la carpeta de caché, o una carpeta encima de ella, es un archivo o se encuentra en una unidad que no está disponible. Mueva el archivo a un lado o apunte npm a otra caché con
  `npm config set cache <folder>`.

Luego corre `ocx update` De nuevo. Si `ENOTDIR` persiste después de que el cheque pasa, abrir un problema con el salida terminal completa de `ocx update` y la salida de `npm config get prefix` y
`npm config get cache`.

<a id="desktop-app-update-stalls-or-fails-on-installing-update"></a>

## La actualización de la aplicación de escritorio se estanca o falla en "Instalar actualización"…"

En la aplicación de escritorio OpenCodex, **Instalar actualización** descarga el instalador desde GitHub Se libera antes de reemplazar la aplicación y reiniciar. Una descarga o instalación fallida con Una versión conocida muestra una sugerencia de descarga manual y un enlace a la página de lanzamiento de esa versión.

Si `Installing update…` paradas o tiempos de espera, GitHub las descargas de la versión pueden ser lentas o bloqueados por su red. Utilice el enlace de liberación en el error, o encuentre la misma versión en la [Página de lanzamientos de OpenCodex](https://github.com/lidge-jun/opencodex/releases), y descargar el instalador para su sistema operativo y arquitectura. Las versiones previas tienen su propio páginas de lanzamiento; elija la versión que ofrece la aplicación.

Antes de ejecutar el instalador, detenga el proxy a través de su propietario y confirme que se ha detenido:

1. Salga de la aplicación de escritorio OpenCodex desde su menú de bandeja para detener un proxy propiedad de la aplicación.
2. Si un servicio posee el proxy, deténgalo a través de los controles del servicio (`ocx stop` por un Servicio administrado por OpenCodex). Para un proxy de terminal no administrado, deténgalo en ese terminal.
3. En Windows, utilice este listado de procesos para ayudar a identificar cualquier entorno de ejecución restante:

   ```powershell
   Get-Process -Name ocx, opencodex-desktop, bun, bunx -ErrorAction SilentlyContinue
   ```

   El listado no establece qué aplicación posee un proceso. Identificar el entorno de ejecución OpenCodex y detenerlo a través de su propia aplicación o servicio; `bun` proceso puede pertenecer a otra aplicación. Espere a que la aplicación propietaria y el proxy salgan antes de instalar.

Ejecute el instalador descargado y, a continuación, vuelva a abrir la aplicación de escritorio o reinicie el servicio propietario.
