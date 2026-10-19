---
title: "Inferencia privada de Cursor"
description: "Utilice los modelos con enrutamiento opencodex dentro de la compilación de agente local de Cursor, en macOS, Windows o Linux, sin un túnel público."
---

Cursor regular no puede hablar con un proxy en su propia máquina. Cuando establece "Anular OpenAI Base URL", el backend de Cursor construye el mensaje y llama a ese URL desde los servidores de Cursor, que rechazar loopback, LAN y direcciones privadas. Es por eso que cada receta de la comunidad para Cursor + Los modelos locales terminan con ngrok, Cloudflare Tunnel o un VPS.

Cursor también envía una segunda compilación de escritorio, **Inferencia privada de Cursor**, cuyo bucle de agente se ejecuta local y llama a una puerta de enlace compatible con OpenAI que configure. Señalado en opencodex, utiliza sus modelos enrutados sin túnel, sin parches de aplicaciones y sin TLS. Esta página cubre esa construcción.

<a id="before-you-start"></a>

## Antes de empezar

Lea esta sección primero; es la parte que la gente extraña.

- **opencodex no distribuye esta compilación.** Cursor tampoco lo documenta. Es no vinculado desde cursor.com, puede cambiar sin previo aviso y puede dejar de estar disponible. Si usted aún no lo tiene, esta guía no se aplica; use la comunidad
  [`ocx-cursor`](https://www.npmjs.com/package/ocx-cursor) puente con un público HTTPS En lugar de eso.
- **El inicio de sesión Cursor sigue siendo necesario.** El muro de inicio de sesión viene antes del diálogo de puerta de enlace.
- **Los modelos propios de Cursor no están disponibles.** En el modo local, el selector enumera solo lo que su La puerta de enlace regresa. La finalización de la pestaña, el catálogo de Cursor (Compositor, Auto) y los agentes de la nube son fuera. Todavía puede comunicarse con los modelos Cursor-provider a través de la propia opencodex `cursor/*`
  rutas si ha configurado ese proveedor.
- **Cada turno lleva el sistema local de Cursor**, aproximadamente 23k tokens en el segundo y luego gira. Presupuesto para cuando elijas un modelo.
- **Comparte identidad con Cursor regular.** Id. del mismo paquete, mismo `~/.cursor`, lo mismo
  `Application Support/Cursor` (macOS), `%APPDATA%\Cursor` (Windows) o
  `~/.config/Cursor` (Linux). Lanzar con `--user-data-dir <dir>` para mantener a los dos separados, y deje "Importar datos de la instalación Cursor existente" sin marcar en la primera ejecución a menos que desea que se copien sus configuración.

<a id="identify-the-installed-build"></a>

## Identificar la construcción instalada

Ambas compilaciones se denominan "Cursor" en el Dock y comparten un identificador de paquete, así que compruebe `product.json`:

| Plataforma | product.json |
|---|---|
| macOS | `/Applications/Cursor Private Inference.app/Contents/Resources/app/product.json` |
| Windows | `%LOCALAPPDATA%\\Programs\\cursor-private-inference\\resources\\app\\product.json` |
| Linux | `<install root>/resources/app/product.json` (Se debe extraer una AppImage primero). El dashboard busca `cursor*` Instalar raíces bajo `/opt`, `/usr/share` y `~/.local/share`. |

`nameLong` es `"Cursor Private Inference"` para la construcción del agente local y `"Cursor"` por el uno regular; `version` es la compilación (3.18.25 en el momento de escribir este artículo). > Cursor La tarjeta ejecuta la misma comprobación y enumera lo que encontró. El modo local está encendido dentro del paquete de banco de trabajo, no en `product.json`, por lo que no hay bandera para voltear: si
`nameLong` dice Cursor regular, esa instalación no puede llegar a una puerta de enlace de bucle.

El loop de agente que habla con la puerta de enlace vive en un archivo bajo la misma raíz de instalación,
`extensions/cursor-agent-exec/dist/main.js`. opencodex lo lee (solo lectura, limitado) para aprender Tabla de razonamiento-esfuerzo de Cursor; ver "Modelos y esfuerzo de razonamiento".

<a id="configure-the-gateway"></a>

## Configurar la puerta de enlace

opencodex debe estar en ejecución (`ocx service status`) cualquiera de estas obras, ambas terminar en el mismo lugar.

**En la aplicación.** Configuración → Modelos → Gateway → Configurar puerta de enlace:

| Campo | Valor |
|---|---|
| URL base | `http://127.0.0.1:10100/v1` (Incluye `/v1`; llano `http://` Loopback es aceptado) |
| API clave | El valor de `OPENCODEX_API_AUTH_TOKEN` si su servicio utiliza autenticación API, de lo contrario cualquier marcador de posición como `opencodex-loopback` |

Haga clic **Actualizar lista de modelos**. El selector se llena con opencodex `/v1/models`; encender el las filas que desee.

**Con variables de entorno.** La aplicación lee esto al principio:

```text
CURSOR_LOCAL_AGENT_BASE_URL=http://127.0.0.1:10100/v1
CURSOR_LOCAL_AGENT_API_KEY=opencodex-loopback
CURSOR_LOCAL_AGENT_HEADERS=            # optional, newline-separated "Header-Name: value" lines
```

`CURSOR_LOCAL_AGENT_HEADERS` rechaza `User-Agent` y sin resolver `{...}` marcadores de posición;
`{gitOrgRepo}` y `{gitBranch}` están expandidas.

Precedencia, más alto primero: credenciales por modelo → la puerta de enlace guardada en Configuración →
`CURSOR_LOCAL_AGENT_*` → `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN` (compatibilidad fallback). El entorno no anula una puerta de enlace guardada; límpiela en Configuración primero si intención de cambiar a través del medio ambiente.

Cursor Private Inference es una aplicación GUI, por lo que un perfil de shell interactivo no es suficiente en La variable tiene que estar en el entorno de lo que sea que lance la aplicación.

| OS | Dónde colocarlo |
|---|---|
| macOS | `launchctl setenv CURSOR_LOCAL_AGENT_BASE_URL http://127.0.0.1:10100/v1` para la sesión de inicio de sesión actual, o un LaunchAgent con `EnvironmentVariables` para hacerlo persistente. Iniciar la aplicación desde un terminal también funciona. |
| Windows | `setx CURSOR_LOCAL_AGENT_BASE_URL http://127.0.0.1:10100/v1` (ámbito del usuario; afecta a nuevos procesos) o Propiedades del sistema Variables de entorno →. Reinicie la aplicación después. |
| Linux | `~/.profile` o `~/.pam_environment` para una sesión de administrador de pantalla, o `systemctl --user set-environment CURSOR_LOCAL_AGENT_BASE_URL=http://127.0.0.1:10100/v1` cuando el escritorio se ejecuta en una sesión de usuario systemd. La AppImage lanzada desde un terminal hereda el entorno de ese shell. |

La compilación existe para macOS (arm64, x64, universal), Windows (x64, arm64) y Linux (x64, arm64). La configuración es idéntica en todos ellos.

<a id="from-the-dashboard"></a>

## Desde el panel de control

El panel de control opencodex tiene un **Cursor** tab bajo Integraciones (`/#integrations/cursor`) Es de solo lectura hacia Cursor: nunca escribe la base de datos de configuración, la entrada de llavero o la aplicación de Cursor No hay ninguna opción para cambiar de paquete. Lo que hace es darle los valores y mostrarle si Se llevaron.

- **Construcción instalada.** Si Cursor Private Inference (con su ruta y versión) y Cursor regular (solo trayectoria) están presentes. Si solo se encuentra Cursor regular, la pestaña lo dice, enlaces aquí de nuevo, y ofrece un **Busque el instalador de Inferencia privada** botón. Presionarlo pide El propio canal de actualización de Cursor que el instalador en modo local anuncia para esta plataforma y CPU (el `cursor-local` canal en `api2.cursor.sh`y muestra esa versión con un enlace a la
  `downloads.cursor.com/local-mode/` instalador. No se solicita nada hasta que pulse el botón: abrir la pestaña y su actualización periódica, nunca contacte el canal de Cursor. opencodex solo muestra el link: nunca descarga, lanza o instala nada. La respuesta se almacena en caché durante 30 minutos (5 después de un fracaso). Cuando el canal no puede ser alcanzado, responde con algo inutilizable, o Cursor no envía ninguna compilación para este equipo (solo x64 y arm64 en Windows, macOS y Linux tienen uno), la pestaña dice que el instalador no se pudo resolver; los valores de la puerta de enlace a continuación permanecen válidos De cualquier manera. Regular Cursor en sí sigue rutas personalizadas Endpoints a través de los servidores de Cursor, por lo que no puede llegar a un proxy de bucle de retorno.
- **Valores de entrada.** Base URL en el propio puerto de escucha del proxy (desde su registro en entorno de ejecución, por lo que un panel de mandos inclinado hacia atrás todavía muestra el puerto Cursor en esta máquina puede alcanzar), con un Copiar botón. La fila de claves API depende del enlace: cuando no necesita credenciales, la fila es
  `opencodex-loopback` con Copiar; cuando la autenticación API está activada, o cualquier clave opencodex API está configurada, la fila le dice que use una de sus propias teclas y enlaces a la pestaña API Claves. Cualquier configurado obras clave, no sólo `OPENCODEX_API_AUTH_TOKEN`.
- **Conexión.** El último `/v1/models` solicitud cuyo usuario-agente es exactamente `Cursor/<version>`
  (el encabezado envía el entorno de ejecución del agente local de Cursor), con la hora y la versión. Se lee "nunca visto" hasta que Cursor llame al proxy; presionando
  **Actualizar lista de modelos** en Cursor es lo que lo hace voltear. La tarjeta se actualiza cada 15 segundos mientras la pestaña está abierta.
- **Lo que Cursor mostrará.** Una tabla de modelo / razonamiento / contexto para los modelos opencodex anuncios (se aplican modelos deshabilitados y listas de proveedores, al igual que la lista sin procesar), siguiendo las reglas de la siguiente sección. Es una predicción: Cursor elige el Razonamiento escalera de su propia mesa.

<a id="models-and-reasoning-effort"></a>

## Modelos y esfuerzo de razonamiento

El selector es crudo de opencodex `/v1/models` lista. Dos cosas deciden si una fila modelo obtiene a **Razonamiento** control:

1. opencodex debe anunciar capacidades en la fila (`api_types` más a `capabilities`
   objeto). Lo hace, a partir de v2.41. Los proxies más antiguos muestran los modelos pero no controlan el esfuerzo.
2. La identificación del modelo, después de despojar todo hasta el último `/` y cualquier `@…` Sufijo, debe coincide con la tabla de esfuerzo propio de Cursor. Esta tabla está compilada en la aplicación (`extensions/cursor-agent-exec/dist/main.js`); opencodex lo lee desde la instalación detectada así que la predicción del panel sigue a una actualización Cursor, y la tarjeta dice qué compilar leyó o "espejo estático" cuando no se encontró ninguno. Cursor decide la escalera, no opencodex, y no
   `/v1/models` campo puede agregar un modelo a esa tabla. La matriz a continuación es la instantánea 3.18.25 el espejo estático lleva:

| ID del modelo (después de la última `/`) | La escalera Cursor muestra | Campo de alambre |
|---|---|---|
| `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` | Bajo, Medio, Alto, Extra Alto | `reasoning.effort` |
| `gpt-5`, `gpt-5.x` | Bajo, Medio, Alto, Extra Alto | `reasoning.effort` |
| `claude-opus-5`, `claude-sonnet-5`, `claude-opus-4.7`, `claude-opus-4.8` | Bajo, medio, alto, extra alto, máximo | `output_config.effort` |
| `claude-opus-4.6`, `claude-opus-4.5`, `claude-sonnet-4.6` | Bajo, medio, alto, máximo | `output_config.effort` |
| `grok-4.3`, `grok-4.5`, `grok-4.6`, `grok-build-latest` | Mínimo, bajo, medio, alto, extra alto | `reasoning_effort` |
| `gemini-*` (necesidades `supports_reasoning`) | Mínimo, Bajo, Medio, Alto | `reasoning_effort` |
| Cualquier otra cosa, incluyendo `claude-fable-5-1`, `kimi-k3` | sin control | — |

Así que `anthropic/claude-opus-5` trabajos, y opencodex de `max`/`ultra` Los niveles para GPT-5.6 no son accesible desde este selector.

<a id="models-with-no-control"></a>

### Modelos sin control

`anthropic/claude-fable-5-1`, `cursor/kimi-k3`y cualquier otra cosa fuera de la mesa no El control de razonamiento, y Cursor registra una línea por tal id cuando la puerta de enlace se anuncia
`supports_reasoning`: "Proveedor local anuncia apoyo de razonamiento para un modelo sin hardcoded Bottlerocket familia de esfuerzo. Dos formas de elegir un esfuerzo:

- **Esfuerzo filas** (`cursorEffortRows: true` en la configuración opencodex, default off): la puerta de enlace publica una entrada de selector por esfuerzo para modelos sin tabla, como
  `anthropic/claude-fable-5-1--high` o `cursor/kimi-k3--max`, y rutas cada uno a la base modelo con ese esfuerzo aplicado. Los modelos Cursor ya se renderizan sin filas adicionales, y con una precisión modelo conocido id siempre gana sobre el `--<effort>` Sufijo. Pulse Actualizar lista de modelos después Enciende. La tarjeta del panel de control cuenta las filas que publicó por modelo. Escoger una fila es una elección explícita, por lo que su esfuerzo también gana `ocx-effort` directiva en la solicitud.
- **Un valor predeterminado fijo** (`modelDefaultReasoningEfforts` en el proveedor): se aplica cuando Cursor No envía ningún esfuerzo.

<a id="max-is-two-different-things"></a>

### "Max" es dos cosas diferentes

Cursor muestra un **Máx.** al lado de algunos modelos. Este es el Max Mode, un contexto más amplio. ventana, no un nivel de razonamiento. En la construcción de agente local la misma idea aparece como un **Contexto**
entrada en el menú del modelo, y opencodex lo enciende para la familia nativa GPT-5.6: **272K**
(predeterminado) o **922K** (el opt-in 1M, marcado como que cuesta más). El valor que eliges mayúsculas que El contexto de turno. Los modelos encaminados muestran una única ventana y ninguna entrada de contexto; un contexto de proveedor tapa por debajo de 922K elimina la entrada para las filas nativas también.

Razonamiento y esfuerzo **Máx.** (opencodex) `max`/`ultra`) es el otro significado, y que uno es no alcanzable: Cursor toma la escalera de esfuerzo de su propia mesa en lugar de la puerta de enlace, y la entrada GPT-5.6 se detiene en Extra High.

Porque opencodex anuncia `responses` en `api_types`, esta construcción envía al agente a
`/v1/responses` con `reasoning.effort`, no para `/v1/chat/completions`.

Esa elección de cable tiene un efecto secundario para las filas Claude: Cursor envía el esfuerzo Claude solo como
`output_config.effort` en el cable Anthropic Messages, así que con un `/v1` Base URL una fila Claude que muestra un control que todavía se ejecuta en el proveedor predeterminado. Una base URL que termina en `/messages`
Se envía el esfuerzo Claude y se elimina el esfuerzo de la familia OpenAI. Una entrada de gateway no puede servir a ambas familias; filas de esfuerzo (arriba) paso lateral esto porque opencodex aplica el esfuerzo sí mismo.

<a id="verify"></a>

## Verificar

`ocx observe logs` muestra los giros como `inboundProtocol: responses` con `admissionKind: loopback`.

| Síntoma | Comprobar |
|---|---|
| 401 desde la puerta de enlace | la clave API no coincide `OPENCODEX_API_AUTH_TOKEN`; para un enlace de bucle sin API funciona cualquier valor |
| El selector está vacío | opencodex no se está ejecutando, o falta la Base URL `/v1`; pulse Actualizar lista de modelos después de fijar |
| modelos enumerados pero sin control de razonamiento | opencodex más antiguo que v2.41, o el id no está en la tabla de Cursor (el panel lo marca como —); `cursorEffortRows` o establecer un proveedor predeterminado |
| No se recoge un cambio de esquema | Cachés Cursor `/models` por cadena Base URL sin caducidad; La lista de modelos de actualización la vuelve a leer, de lo contrario, reinicia la aplicación o guarda temporalmente una ortografía diferente de la URL (`localhost` Vs `127.0.0.1`) |
| 23k-token primera vuelta | esperado; ese es el indicador del sistema local de Cursor |
