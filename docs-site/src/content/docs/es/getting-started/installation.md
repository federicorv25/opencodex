---
title: "Instalación"
description: "Instale el proxy opencodex (ocx), sus requisitos previos, y compruebe que se ejecuta."
---

opencodex instala dos nombres de comando equivalentes, `ocx` y `opencodex`. Ambos lanzan el mismo pequeño servidor local HTTP (construido en Bun). Las solicitudes de modelo van al proveedor seleccionado por enrutamiento; opcional Los sidecars de visión y búsqueda web también pueden usar su inicio de sesión ChatGPT cuando un modelo enrutado los necesite.

<a id="desktop-terminal-command"></a>

## Comando terminal de escritorio

Una instalación de escritorio OpenCodex estable configura `ocx` para nuevos terminales cuando se inicia la aplicación. Abra una nueva terminal y ejecute `ocx status` o `ocx doctor` para inspeccionar el primer ejecutable en PATH. En las instalaciones deb de macOS y Linux, un bloque administrado al final de los archivos de inicio zsh, bash y fish pone `~/.opencodex-desktop/bin` primero en PATH y utiliza la shim de escritorio. Windows pone el paquete `ocx.exe` Instalar el directorio primero en el usuario `Path`. Terminales existentes, alias, cachés de shell y posteriores PATH cambios pueden seleccionar otro comando; un Windows sistema PATH También puede ganar la entrada. Utilice la configuración de comando Terminal de la aplicación para reparar, deshabilitar o eliminar esta configuración. AppImage está excluido.

En macOS y Linux, un lanzador de paquetes npm/pnpm actual que aún ejecuta comandos delegables en el Escritorio CLI cuando su registro está habilitado y pasa las verificaciones de propiedad, permiso y seguridad de archivos. Windows no tiene traspaso de paquete-lanzador: los nuevos terminales seleccionan el escritorio `ocx.exe` a través del usuario `Path` Orden. A `record-unsafe` error significa que el registro o su directorio falló una comprobación de seguridad. Abra el Escritorio OpenCodex para reparar el comando terminal, o use `OCX_NO_DESKTOP_HANDOFF=1` para una invocación de paquete en macOS/Linux. La actualización/eliminación del paquete y la inspección interna mantienen su ruta existente. `OCX_NO_DESKTOP_HANDOFF=1` suprime ese traspaso de paquetes para una invocación; no cambia la configuración directa de la shim de escritorio o PATH.

<a id="prerequisites"></a>

## Requisitos previos

| Requisito | Por qué |
| --- | --- |
| **[Nodo](https://nodejs.org) ≥ 18** | `ocx` se ejecuta en el entorno de ejecución Bun, pero el entorno de ejecución se incluye automáticamente por el npm o pnpm instalar — que hacer **no** necesita instalar Bun usted mismo. |
| **[OpenAI Codex](https://openai.com/codex)** (CLI, aplicación o SDK) | El cliente opencodex se sienta delante de. opencodex escribe a `$CODEX_HOME/config.toml` (por defecto) `~/.codex/config.toml`). |
| Una cuenta de proveedor o clave API | Anthropic, xAI, Kimi, Ollama Cloud, OpenRouter, un punto final compatible con OpenAI o su inicio de sesión ChatGPT. |

<a id="install"></a>

## Instalar

```bash
npm install -g @bitkyc08/opencodex
```

Con pnpm 10.4 o posterior:

```bash
pnpm add -g --allow-build=bun @bitkyc08/opencodex
```

:::note[¿npm bloqueó el script postinstall de Bun?]
Las versiones recientes de npm pueden bloquear el script de postinstalación de bun (`npm warn
install-scripts ... blocked because they are not covered by allowScripts`), que deja el entorno de ejecución Bun incluido sin preparación. Después de intentar permitido bunded-runtime recuperación, el lanzador puede utilizar un ejecutable Bun de un directorio absoluto PATH si su versión estable tiene el mayor y un menor al menos el menor. Con el actual 1.4.2 dependencia, que significa 1.4.0 o más reciente dentro de la mayor 1. Versión-política limitada e identidad cheques requieren `bun --version` para emparejar `bun -e`'s `Bun.version`. En POSIX, el lanzador comprueba toda la ruta del candidato, incluidos los directorios y componentes a los que se ha llegado a través de Enlaces simbólicos. Cada directorio y enlace simbólico cruzado, y el ejecutable resuelto, deben ser propiedad de root o el usuario efectivo del lanzador. Los directorios y el ejecutable resuelto no deben ser grupo o mundo-escribible; bits de permiso symlink no se utilizan. Ancestros escribibles compartidos como el `/tmp` se rechazan incluso con el bit pegajoso, por lo que solo se protege el ejecutable y su progenitor inmediato es insuficiente. Un aviso stderr de una línea nombra la versión Bun seleccionada. Bun todavía está incluido; instalarlo usted mismo es opcional.

Si no funciona el entorno de ejecución, el error aún incluye "el `bun` dependencia no se instala” cuando Falta la dependencia. En macOS, también nombra un ejecutable de escritorio CLI que se encuentra en
`/Applications/OpenCodex.app/Contents/MacOS/ocx` o
`~/Applications/OpenCodex.app/Contents/MacOS/ocx`. Puede invocar ese camino explícitamente; el lanzador de paquetes no delega automáticamente ni instala una shim PATH.

Para reparar el entorno de ejecución incluido, vuelva a instalar permitiendo el script de bun. Incluye siempre el paquete name: La sugerencia abreviada de npm lo omite y reinstala el directorio actual:

```bash
npm install -g --allow-scripts=bun @bitkyc08/opencodex

# if the original install used sudo, keep using sudo:
sudo npm install -g --allow-scripts=bun @bitkyc08/opencodex
```
:::

Verifique que ambos alias de comando estén en su `PATH`:

```bash
ocx --version
opencodex --version
```

Antes de iniciar, detener, reiniciar, dar servicio o una actualización manejada por el Bun CLI, un breve stderr Notice puede identificar un desajuste de la versión CLI/proxy. Es asesor y preserva el mando código de salida; JSON y la ayuda de salida no lo activan. Actualizaciones npm/pnpm manejadas por el lanzador de nodos antes de que comience el Bun CLI no emita este aviso. `ocx status`, `ocx doctor`, y `ocx resolve`
ya informe la versión sesgada a través de sus diagnósticos.

Si instala el servicio en segundo plano desde un shell usando fnm, nvm, mise, asdf o volta, OpenCodex deja los directorios multishell locales de shell fuera del servicio PATH. En Linux lo selecciona un duradero `ocx` lanzador cuando esté disponible; de lo contrario, utiliza el Bun del paquete En entorno de ejecución. Correr `ocx service repair` después de que un servicio más antiguo fue instalado de una directorio multishell. En macOS, se inician las recargas de reparación cuando cambia la lista guardada.

<a id="standalone-binary-no-npm"></a>

## Binario independiente (sin npm)

Las descargas de lanzamiento también incluyen un `ocx` binario para macOS, Linux y Windows compatibles objetivos. Incluye el entorno de ejecución y el panel de control Bun, por lo que npm, Nodo y una instalación Bun separada No se requieren. Descargue el archivo para su plataforma, extraigalo y ejecute:

```bash
./ocx --version
./ocx start
```

El extraído `gui/dist` y `keyring` Los directorios deben estar al lado del binario. El primero sirve el panel de instrumentos; el segundo lleva la vinculación de la tienda de credenciales del sistema operativo nativo de la plataforma.

En Windows, [Firma de código en Windows](/es/reference/code-signing/) explica cómo `ocx.exe` Es firmado y Cómo verificarlo.

<a id="release-channels"></a>

### Canales de liberación

El estable `latest` canal ya incluye GPT-5.6 Sol/Terra/Luna soporte de catálogo para ChatGPT, OpenAI API-key, OpenRouter y rutas experimentales de Cursor. El acceso ascendente sigue estando cerrado por cuenta; las entradas del catálogo no conceden acceso por sí mismas. Utilice el canal de vista previa solo para probar compilaciones inéditas opencodex:

```bash
npm install -g @bitkyc08/opencodex@preview
ocx update --tag preview
```

<a id="run-from-source"></a>

## Correr desde la fuente

Para hackear el propio opencodex:

```bash
git clone https://github.com/lidge-jun/opencodex.git
cd opencodex
bun install
bun run dev:proxy   # starts the proxy API in dev mode (src/cli/index.ts start)
bun run dev:gui     # starts the dashboard dev server (another terminal)
```

`bun run dev` Sigue siendo un alias para `bun run dev:proxy`. El proxy API expone `/healthz`,
`/v1/responses`, y `/api/*`; `GET /` sirve el panel de instrumentos empaquetado solo después `bun run build:gui`
ha producido `gui/dist`. Mientras hackea en el panel, ejecute el frontend por separado con
`bun run dev:gui`.

<a id="what-gets-created"></a>

## Lo que se crea

opencodex vive bajo `$OPENCODEX_HOME` (por defecto) `~/.opencodex`) Archivos de integración Codex en vivo bajo `$CODEX_HOME` (por defecto) `~/.codex`).

| Ruta | Finalidad |
| --- | --- |
| `$OPENCODEX_HOME/config.json` | Sus proveedores, proveedor predeterminado, puerto y opciones. |
| `$OPENCODEX_HOME/ocx.pid` | PID del proxy en ejecución (guarda de instancia única). |
| `$OPENCODEX_HOME/runtime-port.json` | El PID vivo, el nombre de host y el puerto —, incluido un puerto asignado al sistema operativo cuando `config.port` es `0`. |
| `$OPENCODEX_HOME/auth.json` | Las credenciales OAuth almacenadas (cuando `ocx login`). |
| `$OPENCODEX_HOME/catalog-backup*.json` | Codex copias de seguridad del catálogo de modelos hechas antes de que opencodex lo edite. |
| `$CODEX_HOME/config.toml` | En bucle, opencodex agrega una raíz de propiedad del marcador `openai_base_url`; non-loopback une el uso `model_provider = "opencodex"` más `[model_providers.opencodex]` para que Codex pueda enviar el encabezado API-auth. |
| `$CODEX_HOME/opencodex.config.toml` | Perfil de referencia/retroceso escrito junto a la configuración principal de Codex. |
| `$CODEX_HOME/opencodex-catalog.json` | Catálogo de modelos nativos y enrutados sincronizados utilizado por Codex. |

:::note
opencodex nunca borra tu Codex config. Cada inyección es reversible — `ocx stop`, `ocx restore`, o `ocx eject` despojar exactamente las líneas opencodex añadido y restaurar nativo Codex.
:::

<a id="next"></a>

## Siguiente

Continuar a la [Inicio rápido](/es/getting-started/quickstart/) para configurar su primer proveedor, o leer [Cómo funciona](/es/getting-started/how-it-works/) para la arquitectura.
