---
title: "Aplicación de barra de menús de macOS"
description: "Utilice la bandeja, el panel de uso nativo y el widget macOS de la aplicación de escritorio OpenCodex."
---

El elemento de la barra de menús macOS es parte de la aplicación de escritorio OpenCodex. Muestra el uso desde el proxy local y abre un panel de uso nativo. La misma aplicación también contiene el panel de control y una extensión WidgetKit. Ver la [guía de aplicaciones de escritorio](/es/guides/desktop-app/) Instalación en otras plataformas.

<a id="install"></a>

## Instalar

Descargar `OpenCodex-<version>-macos.dmg` Desde el [última versión](https://github.com/lidge-jun/opencodex/releases). Abra el DMG y arrastre `OpenCodex.app` a Aplicaciones. La aplicación de escritorio requiere macOS 13 o posterior; su widget requiere macOS 14 o posterior.

<a id="first-launch"></a>

## Primer lanzamiento

Las compilaciones de lanzamiento de `OpenCodex.app` están firmados con un ID de desarrollador, usan el runtime endurecido y son notariados por Apple con el ticket grapado a la aplicación. En el primer lanzamiento, macOS normalmente solo solicita la confirmación estándar para una aplicación descargada de Internet. Si macOS todavía lo bloquea, abra **Configuración del sistema → Privacidad y seguridad** y elige **Abrir de todas formas** para OpenCodex. Las aplicaciones que tú mismo creas están firmadas ad-hoc; ver [Construir desde la fuente](#build-from-source).

La aplicación muestra su progreso de inicio en una ventana al abrirlo. Esto permite **Inicio de sesión** una vez en el primer lanzamiento; puede desactivarlo desde el menú de la bandeja. El elemento de la bandeja se comprueba solo cuando esta copia de la aplicación está registrada y macOS no ha desactivado el elemento de inicio de sesión; de lo contrario, su etiqueta indica por qué (ver [Aplicación de escritorio](/es/guides/desktop-app/)) Los lanzamientos posteriores desde el elemento de inicio de sesión comienzan con la ventana oculta mientras la bandeja permanece disponible.

<a id="menu-bar-and-usage-panel"></a>

## Barra de menús y panel de uso

El titular de la barra de menú muestra el total de tokens de hoy por defecto. En el panel de control, abra **Uso → Barra de menú y widget** (o `#usage/companion`) para elegir solicitudes, tokens, costo estimado, cuota o icono solamente.

Uso **Mostrar uso** en el menú de la bandeja para abrir el panel nativo. El panel muestra los totales de hoy y de 30 días, una tabla de uso, una lista de modelos y límites de proveedores y cuentas según la configuración de su pantalla. Los totales incluyen tokens y solicitudes, con un costo estimado cuando está habilitado. Las filas de cuota muestran su ventana, porcentaje y tiempo de reinicio. Las mediciones que faltan aparecen como `—`, y el uso parcial se marca como incompleto.

El panel tiene **Actualizar**, **Panel**, y **Configuración** controles. **Panel** abre la vista de uso en la ventana del escritorio; **Configuración** abre el **Barra de menú & widget** tab bajo Uso. El menú también ofrece **Abrir el panel de control**, **Abrir en el navegador**, **Inicio de sesión**, **Detener proxy**, **Buscar actualizaciones…**, un **Instalar actualización** artículo cuando uno está disponible, y **Salir**. **Detener proxy** siempre aparece, pero solo está habilitado cuando la aplicación inició el proxy en sí; un proxy que comenzó por separado sigue funcionando. Cerrar la ventana o usar Command-Q oculta la aplicación cuando su bandeja está disponible; use la **Salir** para salir de él.

El botón de actualización del panel del escritorio abre la propia página de actualización de la aplicación; comprueba e instala la misma actualización firmada que el menú de la bandeja.

El titular de la bandeja se actualiza cada 60 segundos. Mientras el panel nativo está abierto, sus datos se actualizan cada 60 segundos; **Actualizar** Solicita una actualización inmediata.

## Widget

En macOS 14 o posterior, abra OpenCodex.app una vez, luego Controle y haga clic en un área vacía del escritorio, elija **Editar widgets**, busque por **OpenCodex**y agregue el tamaño que desee. Los tamaños de los widgets muestran diferentes combinaciones de estado de proxy, tokens de hoy y solicitudes, costo estimado, cuotas y un gráfico de uso. La extensión lee una instantánea local escrita por la aplicación de escritorio; esa instantánea contiene datos de visualización, no claves API ni datos de cuenta sin procesar. La aplicación actualiza la instantánea del widget en cada quinto tick de bandeja de 60 segundos, aproximadamente cada cinco minutos mientras el proxy está conectado. WidgetKit también solicita una nueva línea de tiempo después de cinco minutos.

<a id="connecting-to-the-proxy"></a>

## Conectarse al proxy

La aplicación de escritorio pide a su CLI incluido que se ejecute `ocx resolve --json`. Se conecta a un proxy local accesible existente, o inicia su entorno de ejecución incluido solo cuando el CLI demuestra que no hay entorno de ejecución escuchando. Si el descubrimiento es incierto, el inicio informa el problema en lugar de iniciar un segundo proxy. La aplicación habla con el puerto resuelto en `127.0.0.1`.

Para las solicitudes de administración, la aplicación primero intenta sin un token. Si el proxy devuelve HTTP 401, vuelve a intentarlo usando `OPENCODEX_ADMIN_AUTH_TOKEN` desde el entorno de la aplicación o la configuración resuelta `admin-api-token` Archivo. No utiliza el llavero macOS para este token. Un proxy vinculado solo a una dirección que la aplicación no puede alcanzar en bucle no puede ser conectado por el shell de escritorio.

<a id="build-from-source"></a>

## Construir desde la fuente

En macOS 13 o posterior, con Bun, Rust y las herramientas Swift/Xcode de macOS disponibles, cree el panel desde la raíz del repositorio y ejecute los comandos del escritorio desde `desktop/`:

```bash
bun install
bun run build:gui
cd desktop
bun install
bun run prepare-sidecar
bun run prepare-widget
bun run build:local
```

`build:local` produce la aplicación local y DMG sin necesidad de una clave de firma del actualizador Tauri. Un directo `bunx tauri build` requiere `TAURI_SIGNING_PRIVATE_KEY` porque también produce un artefacto actualizador. La compilación del widget utiliza una firma ad-hoc a menos que `MACOS_SIGN_IDENTITY` se establece, y los paquetes de escritorio locales también están firmados ad-hoc. La aplicación se ejecuta, pero macOS no registra una extensión de widget firmada ad-hoc, por lo que una compilación local generalmente no muestra ningún widget OpenCodex. `build:local` siempre ad-hoc firma la aplicación, por lo que la configuración `MACOS_SIGN_IDENTITY` Solo no ayuda: el widget se registra solo cuando la aplicación y la extensión están firmadas por el mismo equipo de ID de desarrollador, como lo hace la compilación de la versión. Usa una compilación de lanzamiento cuando necesites el widget.

<a id="uninstall"></a>

## Desinstalar

Apagado **Inicio de sesión** en el menú de la bandeja si lo habilitaste, luego mueve `OpenCodex.app` de las aplicaciones a la basura. Esto elimina el paquete CLI y la extensión de widget, pero no elimina el proxy `$OPENCODEX_HOME` estado o un instalado por separado `ocx` Servicio. La aplicación de escritorio también escribe un identificador de instalación y marcadores de elemento de inicio de sesión en su directorio de configuración de la aplicación, además de una instantánea del widget en `~/Library/Containers/com.opencodex.desktop.widget/Data/Library/Application Support/OpenCodex/snapshot.json`; mover la aplicación a la Papelera no elimina esos archivos.
