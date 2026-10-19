---
title: "Claude Code"
description: "Utilice cualquier modelo enrutado de Claude Code — opencodex sirve el Anthropic Messages API y el descubrimiento de modelos de pasarela en el mismo puerto."
---

opencodex sirve `POST /v1/messages` (más `count_tokens`) junto `/v1/responses`, por lo que Claude El código puede usar todos los inicios de sesión, grupos de cuentas, conmutación por error de claves y sidecars de proveedores enrutados — OAuth incluido — con cero trabajo de autenticación adicional.

En las rutas Devin (incluyendo SWE-2) alcanzadas a través de la Messages API, las llamadas de texto y de herramientas esperan para que el giro de origen se complete, de modo que su firma de razonamiento tardío pueda preceder a la respuesta. Esto evita que la final de Claude Code resultado de vaciarse; el razonamiento y el progreso de mantenimiento aún fluyen durante la generación. La memoria intermedia comparte el límite de traducción de 32 MiB de la solicitud y la cancelación detiene al productor. Esta solución de orden de salida no resuelve el rechazo separado de Cognition de algún sistema generado texto. Conserva las instrucciones del sistema y las limitaciones de seguridad.

Para una ruta Anthropic en OAuth almacenada o una clave Anthropic API, Fast nativo está disponible en
`claude-opus-5-5`, `claude-opus-5`, y `claude-opus-4-8`: elige el modelo `--fast` fila (listado cuando las filas rápidas están habilitadas) o establecer `fastMode: true`. El propio Claude Code `/fast` toggle no es Traducido a petición: el `speed` El campo que envía no sobrevive a la traducción. El proxy envía la solicitud rápida de Anthropic y registra la `usage.speed`; sólo El uso rápido confirmado obtiene la estimación de costo equivalente a 2x API. Un rechazo reconocido y específico en la ruta de solicitud del adaptador principal obtiene un reenvío de velocidad estándar presupuestado, y un nuevo giro puede incurrir en que se negó viaje de ida y vuelta de nuevo. Las cuentas de suscripción Pro/Max necesitan créditos de uso; Las cuentas de equipo/empresa necesitan habilitación de organización, y las claves API necesitan aprovisionamiento acceso a la investigación-previsión. Véase
[Anthropic Configuración rápida](/es/reference/configuration/providers/#anthropic-fast-anthropic-speed)
para el modelo exacto y alcance de recuperación.

<a id="tier-defaults-for-cli-and-external-launchers"></a>

## Valores predeterminados de nivel para CLI y lanzadores externos

En la pestaña Claude Code, seleccione un valor predeterminado de Opus, Sonnet, Haiku o Fable y **Guardar**. Estos `claudeCode.tierModels` Los valores predeterminados se pasan a nuevos `ocx claude` lanzamientos. Ellos no hacen cambiar el modelo principal seleccionado actualmente, el esfuerzo de razonamiento o las asignaciones familiares de escritorio.

Aplicaciones que se lanzan `claude` directamente no reciben el `ocx` entorno del lanzador. Después de guardar, elija **Previsualizar la configuración de Claude**, revisa el `ANTHROPIC_DEFAULT_*_MODEL`
cambios, entonces **Aplicar a la configuración de Claude**. Esto cambia el usuario OpenCodex del host Claude configuración, no la computadora de un navegador remoto. Inicie un nuevo proceso Claude para usar los nuevos valores; la operación no detiene ni reinicia las sesiones existentes. No configura el enrutamiento o autenticación, por lo que la persona que llama directamente ya debe estar conectada a OpenCodex.

Los alias de enrutamiento seleccionados se emparejan con `ANTHROPIC_DEFAULT_*_MODEL_NAME` etiquetas, utilizando el Los mismos nombres legibles que el selector de modelos. La vista previa incluye tanto los ID como los cambios de etiqueta; el alias sigue siendo el ID del modelo presentado. Una etiqueta existente se administra solo si coincide exactamente con el nombre generado para su alias actual. Se conservan otras etiquetas, incluyendo valores vacíos. Una etiqueta introducida manualmente idéntica a ese nombre generado es indistinguible de una etiqueta administrada.

Solo se aplican los ID de nivel explícitamente seleccionados. Un nivel unset deja su ID de modelo existente y su etiqueta de visualización sin tocar. Sustitución de un alias por un first party ID u otra non-alias también elimina su etiqueta generada coincidente. Vista previa muestra la eliminación de etiquetas como un reemplazo vacío; las etiquetas personalizadas y los configuración no relacionados permanecen intactos. Los archivos que faltan son compatibles, pero los archivos vacíos o corruptos existentes Rechazado. Los cambios desde la vista previa requieren una nueva vista previa. Aplicar mueve brevemente la corriente documento en un privado `model-default-backups/apply-*/settings.json` directorio bajo el El directorio de configuración Claude, valida el documento capturado y luego publica exclusivamente. Nunca reemplaza el nuevo archivo de un escritor concurrente, incluso durante la reversión. Evite editar o iniciar Claude mientras se aplica: otro lector puede ver el breve intervalo de archivo faltante. El sistema de archivos debe admitir movimientos del mismo volumen y enlaces duros; las operaciones no compatibles fallan sin sobrescribir el fallback Después de una solicitud interrumpida o una restauración automática fallida, inspeccionar esta ubicación de copia de seguridad y conciliar ediciones más recientes antes de restaurar. Windows/Linux El comportamiento del sistema de archivos debe verificarse por separado; una prueba local no es una prueba multiplataforma. Verifique el proveedor/modelo resuelto en los registros de solicitud: seleccionar un nivel no es prueba del modelo real servido. Esto es especialmente útil para los clasificadores externos que solicitan Sonnet.

<a id="claude-oauth-account-pool-experimental"></a>

## Claude Grupo de cuentas OAuth (experimental)

El passthrough de suscripción nativo Anthropic conserva el upstream `anthropic-ratelimit-*`
Cabeceras de respuesta en streaming, JSON y respuestas de error ascendente, por lo que es compatible con Claude Code Los consumidores de statusLine pueden leer las observaciones de la cuota del proveedor. Las observaciones que faltan No está lleno de valores inventados. Este relé no cambia la selección de cuenta o el comportamiento de reintento.

Puede iniciar sesión en varias cuentas de Claude a través del panel Proveedores (`ocx login anthropic` / add-account). De forma predeterminada, cada solicitud utiliza el **activo** cuenta solamente.

Un **experimental, opt-in** Grupo de cuentas Claude (`anthropicAccountPool.enabled`) añade pegajoso afinidad de sesión y selección de nueva sesión consciente del uso en esas cuentas OAuth. Lo hace
**no** conmutación por error puerta 429: con dos o más cuentas utilizables almacenadas, se mueve una solicitud de tarifa limitada a otra cuenta si la grupo está encendida o apagada, y el interruptor no lo apaga; pausar una cuenta para mantenerlo fuera de la conmutación por error. Porque **nuevo**
sesiones,
`anthropicAccountPool.strategy` Selecciona entre las cuentas elegibles: `quota` (por defecto) elige el uso conocido más bajo en la ventana establecida por `quotaWindow` (`five-hour` por defecto, o `weekly` /
`max-utilization`) cuando por encima `autoSwitchThreshold`; `round-robin` Se extiende uniformemente (`stickyLimit`, por defecto `1`); `fill-first` drena la cuenta activa hasta el enfriamiento, Reautenticación, o umbral, luego avanza. Es **por defecto** y experimental.

El panel de control enumera las condiciones para las que está destinado el grupo: suscripciones que posee o están autorizadas usar, el cliente Claude Code genuino y una persona que supervisa la sesión. Anthropic no tiene Endosada la agrupación automatizada de cuentas, las cuentas en una organización pueden compartir una cuota (por lo que otra cuenta puede no agregar capacidad), y el cambio de cuentas no protege contra ejecución. OpenCodex no envía solicitudes de mantenimiento en caliente y, por defecto, tampoco actualiza Claude tokens ni lee el uso en segundo plano: el uso se lee cuando el panel de control, la aplicación de la barra de menús o una `ocx`
El comando lo pide. Los umbrales son preferencias de selección, no límites de uso o facturación. Esto es orientación del producto, no asesoramiento legal; consulte los términos actuales de Anthropic.

Para vincular un modelo a cuentas Claude almacenadas particulares, agregue ordenado `anthropicAccountPool.routes` reglas mientras la agrupación está habilitada. Cada regla tiene un seguro `name`, un caso completo sensible `match` glob, un `accounts` array de ID de cuenta almacenados, y opcional `fallback` (por defecto) `false`) La primera regla de coincidencia limita las selecciones activas, manuales, de afinidad, estrategia y 429 de recuperación a sus cuentas. Una afinidad saludable fuera de esa regla es ignorada para esta solicitud pero guardada para otros modelos; la opción enrutada no la sobrescribe. Sin reserva, una ruta vacía devuelve un 401 local o 429 con `Retry-After` cuando todas sus cuentas declaradas se están enfriando, antes de contactar con Anthropic. La respuesta del cliente no nombra la ruta; los registros de registro proxy `route:#<n>`donde: `n` es la posición 1 de la regla. `fallback: true` usa el grupo ordinario solo cuando la ruta no tiene una cuenta elegible, incluida su orden sucesora de llenar primero; si sus cuentas almacenadas se están enfriando, el 429 devuelto usa el primer tiempo de reutilización en ese grupo expandido, incluso si se ha eliminado una cuenta de ruta guardada. Un modelo no coincidente sigue la política de agrupación existente; deshabilitar la agrupación deja las reglas guardadas inactivas y restaura el comportamiento 429 de cuenta activa y guiado por presencia. Una regla es una lista de permisos del operador, no una prueba del derecho del modelo.

Contrato operativo cuando está habilitado:

- Upstream **429** enfría esa cuenta, borra sus afinidades y puede rotar a otra cuenta elegible cuenta dentro de la misma solicitud (limitada). El tiempo de reutilización utiliza un `Retry-After` cuando presente, de lo contrario el último tiempo de restablecimiento válido entre las marcas de Windows Anthropic `rejected`, incluyendo Ventanas semanales. Los plazos iniciales válidos no se acortan a un límite de tiempo fijo. Un rechazo sin un plazo utilizable vuelve a un retroceso predeterminado de 60 segundos.
- Responses informa el uso semanal y de 5 horas de la cuenta de servicio, y cualquiera de los siguientes dos la respuesta lleva se registra para esa cuenta — cada ventana independientemente, y un El rechazo cuenta como un éxito. La selección consciente del uso funciona a partir del tráfico ordinario, sin esperar una encuesta de panel. Los encabezados conservan las ventanas de cuota específicas del modelo y lo hacen no posponer las sondas de uso o borrar el estado no disponible de una sonda de uso fallida. Medidas cuyo tiempo de reinicio conocido ha pasado se descartan como desconocidos, incluyendo retenidos específicos del modelo Ventanas. Los valores sin un restablecimiento conocido se conservan; los datos faltantes nunca se informan como uso cero.
- La afinidad es **proceso-local** (perdido en el reinicio proxy).
- Un completo, estructurado **403** El derecho a la cuenta o el rechazo de facturación pueden rotar antes salida. Los casos reconocidos no incluyen acceso Claude Code, una suscripción caducada / inactiva, y un saldo de crédito Anthropic insuficiente. La cuenta rechazada pierde sus afinidades y cools para `Retry-After`O diez minutos sin fecha límite. Permiso genérico, modelo/recurso acceso, la política y los errores no reconocidos permanecen terminales. La recuperación respeta las rutas modelo y límites de envío; si no es elegible ningún reemplazo, se devuelve el 403 original. Esto también funciona con la agrupación proactiva. Un 403 después de la salida del asistente nunca cambia de cuenta.
- Antes de la salida, una estructura exacta **401** authentication_error sin código de error y el mensaje “El acceso OAuth token ha sido revocado.” marca la cuenta de envío OAuth como requerida un nuevo inicio de sesión y borra sus afinidades de sesión. Antes de la salida, una cuenta elegible en el mismo grupo puede hacerse cargo dentro de los límites de envío existentes. Sin reemplazo elegible, Se devuelve el 401 original; la cuenta rechazada permanece excluida hasta el inicio de sesión. Otros errores 401 mantienen su comportamiento existente.
- Los fallos de las credenciales Token-refresh retienen el valor existente `needsReauth` política. Suscripción La renovación no requiere reautenticación, pero la cuenta espera a que expire su tiempo de reutilización.
- Si cada cuenta elegible se está enfriando, el proxy devuelve **429** (No 401) con `Retry-After`
  cuando se conoce.
- Recuperación, incluyendo 429 failover, usos `quotaWindow` para clasificar a los reemplazos elegibles sin cambiar los límites de tiempo de reutilización o conmutación por error existentes; `round-robin` ignora `quotaWindow`.
- `autoSwitchThreshold: 0` se apaga **Proactivo** solo conmutaciones basadas en el uso. Período de sesiones nuevo selección y recuperación 429 todavía consultar `quotaWindow`, por lo que la ventana es inerte solo bajo
  `round-robin`. `fill-first` evalúa su umbral de drenaje en la ventana seleccionada.

Véase [Configuración](/es/reference/configuration/providers/#anthropicaccountpool-experimental).

<a id="native-messages-with-account-pooling"></a>

### Messages nativo con agrupación de cuentas

El Messages nativo administrado muestra el esfuerzo validado de la persona que llama en Registros y `usage.jsonl`incluyendo cada uno Intento: un esfuerzo explícito como `xhigh` o `low`, `none` para el pensamiento discapacitado, o
`budget:<tokens>` para un presupuesto de pensamiento habilitado. Un esfuerzo explícito tiene prioridad sobre el Pensando en el fallback. El pensamiento adaptativo sin un esfuerzo explícito permanece en blanco. Estas etiquetas describen solicitar controles; no confirman qué esfuerzo aplicó la corriente arriba ni cambian el cuerpo del cable.

Un grupo de cuentas Anthropic habilitado prefiere Messages nativo para rutas directas elegibles de Anthropic cuando ninguno de los dos indicadores de despliegue nativos desactiva explícitamente esa ruta. En Proveedores → Anthropic → Poblaciones de cuentas → **Cómo funciona la selección de cuentas**, **Conservar solicitudes nativas de Claude** tiendas
`anthropicAccountPool.nativeMessages` (Default true). Apagarlo selecciona el puente heredado para solicitudes agrupadas. Con la agrupación desactivada, la configuración de implementación nativa explícita mantiene su comportamiento.

Explícito `protocols.rollout.managedMessagesNative: false` desactiva ambas rutas nativas;
`managedMessagesNativeOAuth: false` desactiva el OAuth nativo. Se ha cerrado la configuración actual no válida. La casilla de verificación muestra la preferencia guardada, por lo que una casilla de verificación habilitada no anula estos indicadores o una ruta que requiere traducción proxy. Las solicitudes nativas retienen los puntos de interrupción del historial/caché, Afinidad de sesión, rutas de modelo, exclusiones de pausa/enfriamiento y recuperación presalida limitada.

Las solicitudes nativas reconocidas de CLI y Código de escritorio conservan su preámbulo de facturación / identidad y Soporte de encabezados beta de características. Las solicitudes generadas mantienen la forma de identidad SDK. Declarada costumbre herramientas usan nombres consistentes a través de referencias diferidas y adiciones/eliminaciones en línea, mientras que argumentos, esquemas y marcadores de caché permanecen sin cambios. Se rechazan las declaraciones ambiguas. Un conmutador de cuenta puede iniciar una caché en frío; esto no transfiere cachés ni garantiza resultados de caché. Para los cambios de herramientas en línea en los mensajes del sistema, envíe el mensaje `inline-tools-2026-09-15` beta; el constructor nativo de primera parte lo conserva con bloques mecanografiados independientemente del reconocimiento del cliente. Véase [Contrato de herramienta en línea de Claude](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages).

<a id="quickstart"></a>

## Inicio rápido

```bash
ocx claude
```

`ocx claude` asegura que el proxy se está ejecutando, luego inicia Claude Code con el entorno cableado:

| Variable | Valor |
| --- | --- |
| `ANTHROPIC_BASE_URL` | `http://127.0.0.1:<port>` |
| `ANTHROPIC_AUTH_TOKEN` | Solo cuando el proxy requiere una clave API — de lo contrario está configurado para NOT, por lo que su inicio de sesión claude.ai (suscripción + conectores) se mantiene activo |
| `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` | `1` (nativo) `/model` descubrimiento de selector) |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | Umbral de compactación del contexto automático (predeterminado) `829800`); solo se inyecta cuando el auto-contexto está habilitado |
| `ANTHROPIC_MODEL` | `claudeCode.model` (opcional) |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `claudeCode.tierModels.haiku ?? claudeCode.smallFastModel` (opcional; legado) `ANTHROPIC_SMALL_FAST_MODEL` también) |
| `ANTHROPIC_DEFAULT_{OPUS,SONNET,FABLE}_MODEL` | `claudeCode.tierModels.*`; en el lanzamiento de una suscripción, una ranura no configurada obtiene el `claude-opus-5-5[1m]` / `claude-sonnet-5-5[1m]` / `claude-fable-5-1[1m]`, así `--model opus`, `sonnet` y `fable` Mantener el contexto 1M |
| `ANTHROPIC_DEFAULT_{OPUS,SONNET,FABLE,HAIKU}_MODEL_NAME` | Los `/model` etiqueta para una ranura de nivel que OpenCodex establece en un alias enrutado, como `gpt-6.1-sol (native)` por `ocx-claude-native--gpt-6.1-sol`. Sin ella, Claude Code etiqueta esa fila con el alias. El alias mantiene el ID de modelo seleccionado. Cuando el env del sistema está encendido, el entorno launchd y el gancho de la carcasa obtienen el mismo par de ranura y etiqueta. Una ranura o etiqueta que usted mismo establezca se deja sola |
| `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT` | `1` cuando `alwaysEnableEffort` Está encendido (condicional) |
| `ENABLE_TOOL_SEARCH` | `claudeCode.toolSearch` cuando está establecido (condicional; apagado por defecto — ver [Los esquemas de herramientas MCP llenan el contexto](#troubleshooting)) |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS` | El contexto heredado anula cuando `maxContextTokens` se establece (condicional) |
Las variables que tú mismo exportas siempre ganan. Los argumentos adicionales pasan por: `ocx claude -p "hello"`.

Una excepción es sobre *donde* una variable viene de, no sobre la precedencia. El paquete Bun runtime auto-carga un proyecto `.env` / `.env.local`Así que un vagabundo `ANTHROPIC_API_KEY` en el el directorio desde el que se inicia solía parecer idéntico a una exportación deliberada — y Deshabilitar silenciosamente una suscripción saludable a claude.ai a favor de la facturación API. `ocx claude` ahora ignora las credenciales Anthropic que solo un dotenv de proyecto introdujo. Un valor en el que exportaste tu shell sigue ganando, en cada modo auth. Para usar una clave API deliberadamente, expórtela (`export ANTHROPIC_API_KEY=...`En lugar de dejarlo en un archivo de proyecto.

<a id="native-fallback-when-claude-routing-is-off"></a>

### Repliegue nativo cuando el enrutamiento Claude está desactivado

`ocx claude` se utiliza para salir con un error cuando se deshabilitó el enrutamiento Claude. Ahora lanza el Nativo `claude` binario en su lugar, por lo que el comando sigue siendo útil con enrutamiento apagado:

| Donde el enrutamiento está desactivado | ¿Qué sucede? |
| --- | --- |
| `claudeCode.enabled: false` en config | Lanzamiento nativo, con un aviso de que el enrutamiento está desactivado |
| Los informes proxy en ejecución `enabled: false` Desde `GET /api/claude-code` | Lanzamiento nativo; volver a habilitar la intercepción bajo demanda |
| `claudeCode.enabled` ausentes o `true` | Enrutado a través del proxy, sin cambios |

Sólo una explícita `false` activa la reserva, por lo que un proxy anterior al campo permanece enrutado. A el proxy faltante no es un disparador tampoco — con enrutamiento encendido, `ocx claude` Todavía comienza el proxy.

Una sesión nativa no debe heredar el estado proxy, por lo que el respaldo elimina los valores que puede **probar**
OpenCodex posee: `ANTHROPIC_BASE_URL` solo cuando apunta a la propia dirección de bucle de este proxy y puerto configurado *y* la admisión emparejada token es uno de los proxy emitidos; el
`CLAUDE_CODE_*` palancas de descubrimiento y auto-contexto; y ranuras de modelo que solo se resuelven a través del Proxy (enrutado alias y `provider/model` ID). Cualquier otra cosa es tuya y se conserva — un sin relación `http://localhost:8080` puerta de enlace y su propio `sk-ant-` Ambas credenciales sobreviven.

Si su guardado `/model` selector predeterminado es un modelo solo proxy, la sesión nativa vuelve a
`claudeCode.model` cuando es utilizable de forma nativa, y de lo contrario le advierte que pase
`--model <Anthropic model>`. Una explícita `--model` El argumento siempre gana.

<a id="auth-mode"></a>

## Modo de autenticación

Claude Code necesita un token en `ANTHROPIC_AUTH_TOKEN` hablar con una puerta de enlace, pero establecer que variable también desactiva el inicio de sesión claude.ai y sus conectores. ¿Cuál de los dos quieres depende de algo que opencodex puede buscar, por lo que lo hace por defecto.

Salir **Modo de autenticación** on **Automático** (el valor predeterminado) en **Conectar → Claude** y opencodex decide en cada lanzamiento:

| Lo que encuentra | Lo que hace |
| --- | --- |
| Un inicio de sesión Claude (`~/.claude.json` OAuth cuenta, `.credentials.json`, el llavero macOS, o un `ANTHROPIC_API_KEY`) | Deja la token sin configurar, por lo que su suscripción y los conectores siguen funcionando |
| Sin autorización Claude en absoluto | Inyecta un marcador de posición token, por lo que Claude Code deja de pedirle que inicie sesión y enruta a través del proxy |
| No puede decir (cadena de teclas ilegible, archivo corrupto) | Asume la suscripción e imprime una advertencia — nunca mueve a un suscriptor de pago al proxy en una lectura fallida |

Esto se vuelve a calcular cada lanzamiento, no recordado, por lo que el inicio o salida se recoge en el siguiente `ocx claude` sin nada que reconfigurar.

Escoger **Suscripción** o **Proxy** explícitamente cuando lo desee. Una elección explícita es almacenados en `claudeCode.authMode` y la detección nunca lo anula — incluso después de registrar dentro o fuera más tarde. Vuelve a Auto para devolver la decisión.

En macOS, autoconecte (`claudeCode.systemEnv`) sigue la misma resolución, por lo que un simple
`claude` Lanzado fuera `ocx` Se comporta de la misma manera. Ese archivo es una instantánea actualizada cuando el proxy inicia o guarda la configuración, mientras `ocx claude` Siempre resuelve en vivo.

<a id="system-environment-integration-macos"></a>

## Integración del entorno del sistema (macOS)

<a id="claude-desktop-modes-gateway-default-and-first-party"></a>

## Claude Modos de escritorio: gateway (predeterminado) y first party

El escritorio Claude puede usar OpenCodex en uno de los dos modos mutuamente excluyentes. Pick it en
**Conecte → Claude Desktop → Modo de conexión** en el panel o con `ocx claude desktop apply
--first-party|--gateway`.

> Los perfiles de la biblioteca de Desktop y `_meta.json` deben ser archivos regulares de un máximo de 4 MiB. OpenCodex también rechaza los perfiles o metadatos generados que superen ese límite antes de reemplazar archivos. Haz una copia de seguridad y reduce manualmente una configuración demasiado grande; el rechazo por tamaño no trunca los datos existentes. Los almacenes propios de cada conexión conservan sus límites más estrictos.

<a id="gateway-default"></a>

### Puerta de enlace (predeterminado)

Uso de nuevas instalaciones **pasarela** por defecto. Su perfil de terceros, que se describe a continuación, cambia el toda la aplicación a OpenCodex como su puerta de enlace de inferencia. El chat se ejecuta localmente a través de OpenCodex y el Las características solo de claude.ai no están disponibles. El legado `--static` / `--hybrid` /
`--discovery-only` banderas también seleccione la puerta de enlace.

Los perfiles de puerta de enlace utilizan alias de modelo distintos con un `claude-fable-5-` prefijo así Claude Desktop 2.31226 puede ofrecer su control de esfuerzo sin tratar todas las rutas El mismo modelo activo. Estos alias no cambian el modelo ascendente o sus etiquetas mostradas y valores predeterminados de familia. Los alias anteriores siguen siendo decodificables para sesiones existentes. Vuelva a aplicar el perfil de la puerta de enlace y salga completamente / vuelva a abrir Desktop para Cargar la nueva lista. El selector estático utiliza el menú de esfuerzo alternativo del escritorio; lo hace no anunciar una escalera autorizada por proveedor, y el proveedor seleccionado La normalización del esfuerzo normal todavía se aplica. Esto sigue siendo una versión específica del cliente Mecanismo de compatibilidad.

Gateway apply rechaza archivos de configuración ilegibles o no regulares, incluidos metadatos colgantes enlaces, antes de crear un nuevo perfil. Si la actualización de metadatos falla, applicar restaura el contenido anterior, o elimina un perfil que acababa de crear, pero solo mientras el perfil aún lo que se aplica escrito; si otro programa lo cambió mientras tanto, apply mantiene esa versión y Informes "Reversión de perfil omitida". Aplicar vuelve a comprobar el perfil antes copia de seguridad y reemplazo; si detecta una edición concurrente, se `desktop_profile_changed`. Revisar la edición y volver a aplicar. Si la restauración del perfil también falla después de un error de metadatos, el La razón informada incluye ambos fallos; reconcilia el perfil y los metadatos antes de volver a intentarlo.

<a id="first-party-opt-in"></a>

### Primera parte (opcional)

:::caution[Riesgo para la cuenta]
El modo de primera parte envía su tráfico de suscripción Claude a través de un proxy de interceptación local. Anthropic puede tratar esto como una violación de sus términos y suspender la cuenta. Gateway es el default; elija la primera parte solo si acepta ese riesgo.
:::

El escritorio en sí no está reconfigurado: se queda iniciar sesión en claude.ai, y la pestaña Chat, los conectores, las sesiones en la nube y el control remoto mantener trabajando. OpenCodex solo escribe estas variables en el `env` Bloque de `~/.claude/settings.json`
(Honrado por `CLAUDE_CONFIG_DIR`):

```json
{
  "env": {
    "HTTPS_PROXY": "http://opencodex:<per-install token>@127.0.0.1:10200",
    "NODE_EXTRA_CA_CERTS": "<home>/.opencodex/claude-intercept/ca.pem",
    "NO_PROXY": "127.0.0.1,localhost,::1,0.0.0.0"
  }
}
```

`NO_PROXY` mantiene el tráfico de bucle, como un servidor local HTTP MCP en `127.0.0.1`, `localhost`,
a `*.localhost` nombre, `::1` o `0.0.0.0`, fuera del proxy, que solo tuneliza HTTPS a remoto anfitriones. Un servidor en otro `127.x` necesidades de la dirección que se añaden a `NO_PROXY` Tú mismo. Si ya has establecido `NO_PROXY`, OpenCodex anexa solo las entradas de loopback que faltan y registra su cambio en `opencodex-no-proxy.json` al lado
`settings.json`. Desactivar el primer partido devuelve su valor original cuando OpenCodex podría registrarlo y no lo ha cambiado desde entonces; de lo contrario, el valor actual, incluido el Las entradas se mantienen.

Claude Desktop enruta su pestaña Código y subagentes a través de OpenCodex. El Claude Code independiente CLI tiene un interruptor de primera parte separado. Ambos clientes leen lo mismo `~/.claude/settings.json` configuración de proxy y CA: si solo un conmutador está activado, el otro cliente aún transita el proxy local, donde termina TLS, pero su Messages solicita retransmitir a Anthropic sin cambios. Otras rutas Anthropic retransmiten sin cambios y los hosts no relacionados permanecen ciegos. Con el interruptor CLI encendido, el `claude` También enumera modelos enrutados en `/model`; ver [Selector de modelos en el CLI](#model-picker-in-the-cli).

:::note[Proxy del sistema en Windows: Clash, v2rayN y proxies corporativos]
Cuando la intent del selector está desactivada en el inicio de OpenCodex, su relé Windows permanece desatado. Selector de giro el modo en adelante lo inicia dentro del servicio en ejecución; OpenCodex no necesita un reinicio. Para instalaciones de selección o instalaciones pendientes sin perfil de selección aplicado, un proxy de sistema Windows se entrega a la pestaña Código como `HTTPS_PROXY`, y ese valor tiene prioridad sobre el proxy OpenCodex en `~/.claude/settings.json`. La pestaña Código entonces va alrededor de OpenCodex y los modelos enrutados fallan allí, mientras que el CLI independiente sigue funcionando. Un perfil de selector seleccionado aplicado utiliza el proxy de salida fijo de Desktop mientras está disponible, incluso cuando La falta de confianza deja al recolector pendiente y `claude.ai` Retransmite a ciegas. Consejos de bypass del proxy del sistema Se aplica cuando no hay un perfil de selector disponible seleccionado. Añadir `api.anthropic.com` a la lista de bypass del sistema proxy de su cliente proxy (en Clash Verge,
`system_proxy_bypass`), a continuación, cierre completamente y vuelva a abrir Claude Desktop. `ocx doctor` informa esto bajo "Claude Proxy de escritorio de primera parte vs Windows sistema". No puede evaluar un script PAC o detección automática de proxy (WPAD, "Detectar automáticamente la configuración"), por lo que informa de ellos como desconocidos; Con cualquiera de los dos, haz que el guión regrese `DIRECT` por `api.anthropic.com` o desactivar la detección. Si el La configuración de primera parte es obsoleta, te pide que ejecutes `ocx ensure` En lugar de informar `ok`.
:::

Los subagentes en los modelos enrutados (no Claude) no usan los hilos de mensaje del lado del servidor de Claude Code, porque solo Anthropic almacena ese estado. OpenCodex rechaza una solicitud roscada para tal modelo, y Claude Code reenvía ese giro, y los giros posteriores, con la conversación completa.

El modo se mantiene como `claudeCode.desktopMode`. Las instalaciones que ya se han aplicado en cualquiera de los modos lo conservan, incluyendo las instalaciones de primera parte desde antes de que persistiera el modo. Un modo explícito tiene prioridad; de otro modo una fila de pasarela seleccionada propia, una huella dactilar de pasarela aplicada o una primera parte propia configuración en `~/.claude/settings.json` determinar el modo existente antes de la puerta de enlace predeterminada. Una sincronización de catálogo o actualización de lista nunca escribe un perfil de puerta de enlace sobre una instalación de origen resuelta. Una env de primera parte solo para CLI no es evidencia de que Desktop esté en modo de primera parte. El cambio aplica primero el reemplazo, luego elimina la configuración del otro modo (solo los valores OpenCodex escribieron — como `HTTPS_PROXY` o
`NODE_EXTRA_CA_CERTS`, por ejemplo, un proxy corporativo, nunca se sobrescribe y la aplicación es rechazado en su lugar). Un reemplazo fallido conserva la conexión anterior. Si se retira el viejo la configuración falla después de que se escribió el reemplazo, el comando informa de una limpieza incompleta; resuelva ese error antes de reiniciar Desktop. Una pasarela comprometida mantiene su modo y perfil guardados marcador incluso cuando falla la limpieza de configuración de primera parte. Cierre y vuelva a abrir completamente el escritorio después de un cambio exitoso. `ocx ensure` Refresca un viejo env de primera parte cuando la integración está activada y la elimina cuando OFF. Establecer
`claudeCode.intercept.enabled: false` para desactivar el proxy por completo; la primera parte entonces no puede ser aplicado. Una solicitud para una instalación existente de primera parte se rechaza cuando la intercepción está desactivada; Las nuevas instalaciones aplican gateway. En un cliente conectado, el proxy se ejecuta en el Hub, así que `ocx claude desktop apply` utiliza el perfil de la puerta de enlace.

<a id="picker-mode-opencodex-models-in-the-first-party-code-tab-picker"></a>

### Modo de selector: modelos opencodex en el selector de pestaña de código de primera parte

El modo Selector es parte del modo first party. En macOS y Windows está activado de forma predeterminada cuando se selecciona first-party, a menos que `claudeCode.intercept.picker: false` está establecido. Cambia el selector de pestañas de escritorio de primera parte por lo que enumera los modelos disponibles opencodex por nombre. La primera vez que esté habilitado, macOS puede pedirle que confiar en una autoridad de certificación local en el llavero de inicio de sesión, y Windows puede pedirle que confíe en el almacén raíz del usuario actual. Esta autoridad está limitada a `claude.ai`
y sus subdominios. OpenCodex protege su identidad de firma exportable en el almacén de credenciales del sistema operativo y reutiliza el mismo certificado y clave validados en los reinicios normales. Sin firma de selector de texto plano La clave se almacena en el directorio de configuración OpenCodex. La validación de CA restringida completa y la confianza del sistema operativo todavía se aplican, incluyendo la huella digital exacta con una hoja verificada en Windows. Con la misma identidad aprobada y un almacén de credenciales disponible, reiniciar OpenCodex no agrega ni elimina la configuración de confianza del certificado macOS. El reinicio y el estado nunca instalan confianza: Si falta la confianza, se revoca o se desconoce, el recolector permanece pendiente. Correr `ocx claude desktop picker on`
o `ocx claude desktop picker trust` explícitamente para otorgar confianza, incluida la confirmación Windows cuando sea necesario. Startup también intenta eliminar una clave de firma del selector en el disco antes de verificar si La interceptación está habilitada. La limpieza es el mejor esfuerzo y no permite la interceptación ni el bloqueo del inicio.

La migración de una sola vez desde una identidad de selector anterior puede requerir el consentimiento para eliminar su confianza anterior. Si la limpieza no puede terminar, el selector permanece indisponible y el perfil aplicado utiliza un relé ciego. hasta que la limpieza tenga éxito; `ocx claude desktop picker status` Informes de ese Estado. macOS puede por separado le pedirá que desbloquee el llavero o apruebe el acceso de una aplicación a las credenciales almacenadas. Estos nativos Las solicitudes de acceso aún pueden ocurrir en el reinicio o la actualización. En Windows, explícito `on` o `trust` puede mostrar una confirmación para agregar la raíz.

El modo Selector sigue sin soporte en Linux: OpenCodex no inicia ningún selector CA, tienda de credenciales o trabajo proxy allí. La intercepción principal Claude permanece disponible con propiedad, enlace simbólico, permiso de archivo y Windows ACL comprueba la protección de sus archivos CA locales.

El modo Selector permite hasta 64 KiB de encabezados en las solicitudes entrantes y HTTP ordinaria Respondemos, preservando las cookies de sesión del navegador. Cabeceras de respuesta ascendente más grandes 502 y log `upstream:headers-too-large`, sin valores de cookies ni rutas de solicitud. Las conexiones actualizadas continúan retransmitiendo bytes directamente después del protocolo de enlace de solicitud.

El modo Selector usa HTTP/2 con Claude Desktop, por lo que las transmisiones de chat de larga duración ya no se usan Conexiones de escritorio a claude.ai. Las versiones anteriores podrían dejar el chat atascado "Sesión de carga cronometrada" mientras el modo selector estaba activado. Si el chat deja de cargarse con el modo selector Encienda, apáguelo con `ocx claude desktop picker off` y reportar el problema.

Mientras el modo selector está activado, el escritorio Claude llega a la red a través de OpenCodex. Si OpenCodex se detiene, El escritorio está desconectado hasta que lo reinicie completamente o desactive el modo selector. Compruebe el estado con
`ocx claude desktop picker status`; utilizar `ocx claude desktop picker trust` para repetir el paso de confianza, o apagarlo con `ocx claude desktop picker off`. El panel de instrumentos tiene el mismo interruptor de selección debajo
**Conectar el escritorio → Claude**. Después de seleccionar el perfil de selector, cierre completamente y vuelva a abrir Claude Desktop.

El modo Selector es parte del modo de primera parte, por lo que el [Riesgo de cuenta de primera parte](#first-party-opt-in)
También se aplica a ella. El catálogo de Desktop y CLI reescribe los límites de fila y metadatos de límite compartido: si la adición de modelos enrutados excedería un límite, OpenCodex devuelve el catálogo original de Anthropic En lugar de publicar una lista parcial.

<a id="use-opencodex-models-from-the-desktop-code-tab-first-party-bindings"></a>

### Utilice los modelos opencodex en la ficha Código de escritorio (enlaces de origen)

En el modo de primera parte, el selector de modelos de la pestaña Código pertenece a claude.ai: sus filas (Opus 5.5, Sonnet 5, Haiku 4.5, y los modelos más antiguos bajo **Más modelos**procede de su cuenta, y no configuración local puede agregar una fila opencodex. Lo que llega a OpenCodex es el identificador de modelo Anthropic del selector cada solicitud, por lo que vincula una fila de selector a una ruta opencodex:

```bash
ocx claude desktop bind claude-sonnet-4-6 xai/grok-4.7
ocx claude desktop bind claude-opus-4-6 native/gpt-6.1-sol
ocx claude desktop unbind claude-opus-4-6
```

o usar **Conectar → Claude Desktop → Encuadernación de modelo de pestaña de código** en el panel. Picking **Soneto 4.6** en la pestaña Código es servida por `xai/grok-4.7`. El selector guarda la etiqueta de Anthropic, y el modelo es todavía presentado a sí mismo como que el modelo Claude por el sistema de Claude Code prompt, así que prefiere filas que No utilizar (el **Más modelos** Los candidatos son buenos candidatos). Las fijaciones tienen efecto sobre el siguiente solicitud; El escritorio no necesita un reinicio.

- Las rutas usan el vocabulario de ruta de escritorio: `provider/model`, o `native/<slug>` Para el nativo Piscina OpenAI. Una ruta debe ser una de las listas del panel de control como disponible.
- Una identificación de selector fechado (`claude-haiku-4-5-20251001`) coincide con un enlace sin fecha (`claude-haiku-4-5`), y `[1m]` y selecciones de modo rápido siguen el mismo enlace.
- Los enlaces se almacenan en `claudeCode.intercept.modelMap` y aplicar solo al tráfico Claude Code que llega a través del proxy de intercepción local: la pestaña Código del escritorio y el proxy independiente `claude` CLI en Modo first party. `ocx claude` sesiones y el público `/v1/messages` Endpoint los ignora; el mundial `claudeCode.modelMap` todavía se aplica en todas partes, y un enlace gana sobre él para el mismo id.
- `ocx claude desktop status --json` informa de las vinculaciones en efecto bajo `firstParty.modelBindings`.

<a id="claude-code-cli-first-party"></a>

### Claude Code CLI de primera mano

Activar el interruptor CLI en Conectar → Claude, o ejecutar `ocx claude config set --first-party on`; utilizar `off` para desactivarlo. El cambio es inmediato y se niega `{enabled:false, cliFirstParty:true}` antes de que se guarde ningún campo; también puede negarse a activarse si la intercepción local no está disponible, la CA no se puede preparar, los configuración no se pueden leer o un proxy extranjero posee las claves. Desactivar persiste incluso cuando la intercepción no está disponible; deshabilitar el enrutamiento Claude solo deja intacta una configuración propia env. Para tráfico de terminal completamente nativo con solo Desktop first-party activado, set `NO_PROXY='*'` en la cáscara. Esto aún conlleva el riesgo de la cuenta de primera parte indicado anteriormente. Deshabilitar el enrutamiento Claude deja intacta la configuración de propiedad env. Mientras el listener encuadernado todavía se ejecuta, cada petición Messages retransmite sin cambios; después de que se detiene, `claude` no se puede conectar hasta que OpenCodex se ejecute o Desktop/CLI first-party esté desactivado. Nativo `ocx claude` conjuntos `NO_PROXY=*` solo para un propietario env sin un extranjero heredado `HTTPS_PROXY`/`https_proxy`. Con un proxy externo, conserva ese valor y advierte que la intercepción de propiedad de configuración aún se aplica; desactiva o desactiva la configuración de Desktop/CLI. La interfaz de usuario distingue la incertidumbre acerca de si la configuración todavía apunta a su proxy (desconocido), un proxy token con soporte para opencodex con una CA externa (extranjero: corrige HTTPS_PROXY / NODE_EXTRA_CA_CERTS manualmente) y un proxy de bucle sin token al lado de una CA externa (local: la propiedad no está confirmada; elimine HTTPS_PROXY si no se usa). Con configuración aplicados coincidentes y un oyente vinculado, pero el enrutamiento Claude desactivado, deshabilitado significa que las solicitudes de retransmisión no se modifican mientras está vinculado; apague la primera parte para eliminar los configuración. Un URL propio sin oyente se detiene; un oyente vinculado con un CA propio pero puerto no coincidente o token está roto incluso cuando el enrutamiento está apagado. Con la intención activada, detenida o rota, además de interceptación no elegible, se muestra routingOff: enrutamiento Claude o la intercepción está desactivada, o esta máquina es un cliente de otro concentrador opencodex; habilite la interceptación en esta máquina o apague la primera parte para eliminar la configuración. Cuando se detiene la intercepción, el uso **Iniciar interceptación** o `ocx claude intercept start` para volver a intentar dentro del servicio OpenCodex en ejecución. Guardar la configuración de primera persona también lo inicia automáticamente. Un rechazo informa de enrutamiento desactivado, rol de cliente, un puerto público efímero, un puerto ocupado o un fallo de inicio. Para un puerto ocupado, libérelo o póngalo en `claudeCode.intercept.port`. El inicio actualiza un entorno proxy Claude administrado existente solo después de que el proxy de intercepción se enlaza correctamente, utilizando su puerto vinculado; un puerto ocupado deja la configuración de Claude sin cambios. Si un par ya está enlazado en un puerto diferente, la respuesta nombra ambos puertos; use el puerto enlazado o restaure el valor configurado. CLI intent sin proxy no se aplica; una intención con un proxy en vivo obtiene el aviso de retransmisión compartida; cualquier proxy restante sin ninguna intención es residual, a menos que desconocido, extranjero o local tenga prioridad.

- descubrimiento de puerta de enlace (`/model` → "Desde la puerta de enlace") no se utiliza, porque Claude Code solo consulta
  `GET /v1/models` en una pasarela configurada. Los modelos enrutados llegan al selector de otra manera; ver
  [Selector de modelos en el CLI](#model-picker-in-the-cli). También puede enlazar un Anthropic incorporado id del modelo a una ruta (`ocx claude desktop bind`(arriba) o usar `modelMap`.
- `ANTHROPIC_SMALL_FAST_MODEL` y `CLAUDE_CODE_SUBAGENT_MODEL` son elegidos por el CLI antes de la La solicitud es enviada. Claro de primera parte `claude` utiliza su `settings.json` valores. Encaminado
  `ocx claude` También ofrece el [ajuste de fuerza subagente](#forced-claude-code-subagent-model)
  en la página Subagentes y a través de la CLI.
- `ocx claude` y first-party coexisten: una sesión iniciada con `ocx claude` habla de
  `ANTHROPIC_BASE_URL` (HTTP en bucle), que `HTTPS_PROXY` No cubre, por lo que proceso llega a OpenCodex directamente y el proxy simplemente no ve tráfico de él.
- Honores Claude Code `HTTPS_PROXY`/`NODE_EXTRA_CA_CERTS` como se documenta para los proxys corporativos; una versión de CLI que deja de hacerlo detendría el enrutamiento, no rompería el inicio de sesión.

<a id="model-picker-in-the-cli"></a>

#### Selector de modelos en el CLI

Con el conmutador de primera parte CLI encendido y el enrutamiento Claude habilitado, inicie una nueva `claude` y abierto
`/model`. Sus modelos opencodex aparecen junto a los modelos Claude de su cuenta, etiquetados como "Grok 4.7 (xai)" y se describe con su ruta (`opencodex · xai/grok-4.7`) Escoger uno encamina esa sesión al modelo, como un encuadernación.

- Solo nuevo `claude` Las sesiones recogen la lista. Reinicie cualquier sesión que ya se estaba ejecutando cuando usted encendió o apagó el interruptor.
- Claude Code guarda la lista durante aproximadamente una hora. Encender o apagar el interruptor, y `ocx ensure`, copia guardada, por lo que el siguiente `claude` lanzamiento trae uno nuevo. Si los modelos dirigidos falta (el primer lanzamiento después de que se inicie OpenCodex puede perderlos mientras los modelos aún están en funcionamiento) descubierto), ejecutar `ocx ensure` y reiniciar `claude`.
- Las filas usan ids de estilo Claude (por ejemplo: `claude-opus-4-8-…`), porque el CLI solo ofrece ids en forma de modelos Claude. La pestaña Código del escritorio Claude no se ve afectada; sigue usando
  [Obligaciones de primera parte](#use-opencodex-models-from-the-desktop-code-tab-first-party-bindings).

<a id="claude-desktop-profile-gateway-mode"></a>

## Claude Perfil de escritorio (modo puerta de enlace)

El perfil de abajo está escrito solo en modo gateway. Claude Desktop utiliza un perfil separado de Claude Code. Abrir **Conectar el escritorio → Claude** en el Panel de control. Los **Modelos** La tarjeta tiene las dos opciones que la mayoría de la gente necesita: **Modelo predeterminado** está en la lista primero en el Escritorio Claude y enviado como el nivel Opus, y **Modelo de tarea rápida** respuestas Desktop's Peticiones de Haiku-tier. Elegir un modelo allí lo mueve a esa familia y lo convierte en la familia. por defecto. Para colocar cada ruta usted mismo, abra **Avanzado: Asignación de niveles Claude**donde cada La ruta disponible se encuentra en una de las cuatro familias: Opus, Fable, Sonnet o Haiku. Todas las rutas comienzan en Opus con un nuevo perfil. La primera ruta Opus se convierte en la inicial Por defecto, y cada familia no vacía siempre tiene una familia por defecto.

Arrastre una fila a otra familia si lo desea. El arrastre es opcional: cada fila también tiene un movimiento visible control que funciona con un mouse, toque o teclado. Uso **Hacer predeterminado** Elegir una familia por defecto, luego seleccione **Guardar y aplicar al escritorio**. Se permiten familias vacías. Si un valor predeterminado guardado Si no está disponible temporalmente, la primera ruta disponible de esa familia se utilizará hasta que regrese.

También puede administrar el mismo perfil desde la línea de comandos:

Las instrucciones de edición de perfil a continuación describen el perfil local. La aplicación remota conectada se describe por separado a continuación.

```bash
ocx claude desktop [apply]
ocx claude desktop show [--json]
ocx claude desktop status [--json]
ocx claude desktop move <route> <opus|fable|sonnet|haiku> [--default]
ocx claude desktop default <opus|fable|sonnet|haiku> <route|none>
ocx claude desktop export <path|->
ocx claude desktop import <path> [--apply]
```

`ocx claude desktop` y `apply` aplicar el modo seleccionado: first-party escribe el proxy Claude Code env, la puerta de enlace escribe el perfil actual en Claude Desktop. `show` da un resumen legible; `status` informa del modo efectivo, el perfil aplicado o proxy env, drift, actividad de solicitud y (solo en modo puerta de enlace) salud de políticas administradas de Windows. Añadir `--json` Para los scripts. `export -` escribe la versión JSON en la salida estándar. Importar valida el archivo completo antes de guardarlo, por lo que un archivo no válido deja el perfil actual sin cambios. Añadir `--apply` para escribir un perfil importado válido en Desktop inmediatamente. Uso `none` solo para una familia vacía; cada familia no vacía debe mantener un defecto.

En Windows, una directiva Claude administrada por máquina puede hacer que Desktop ignore el perfil local de terceros. OpenCodex informa de esto como `present`Una política que no se puede leer `unknown`Lo cual también es una advertencia en lugar de un resultado limpio. El diagnóstico informa solo que state—it no expone el valor de la directiva nombres o datos, y nunca elimina ni pasa por alto la política. Resolver la política con su administrador, luego cierre completamente y vuelva a abrir el escritorio Claude. La aplicación de nuevo también conserva las claves de perfil que OpenCodex no posee mientras actualiza sus campos de puerta de enlace y modelo.

Aplicar escrituras a los datos de usuario de Electron reales de Claude Desktop `configLibrary`: `~/Library/Application
Support/Claude/configLibrary` en macOS, `%APPDATA%\Claude\configLibrary` en Windows, y
`${XDG_CONFIG_HOME:-~/.config}/Claude/configLibrary` en Linux. Establecer
`OPENCODEX_CLAUDE_DESKTOP_CONFIG_DIR` para una anulación explícita de la biblioteca o
`CLAUDE_USER_DATA_DIR` para una raíz de datos de usuario de escritorio alternativa. El legado `Claude-3p` El directorio es no se lee ni se elimina automáticamente.

Las rutas que no son Anthropic reciben alias estables, como `claude-fable-5-p01q`Con un `p`-prefijado código de cuatro caracteres. Anterior `claude-opus-4-8-p...` IDs de perfil siguen siendo decodificar-solo compatibilidad IDs; los nuevos perfiles usan el formulario Fable. OpenCodex mantiene una ranura de fecha sintética separada internamente para que el perfil existente Las asignaciones se mantienen estables, pero no exponen esa fecha como el ID del modelo de escritorio: actual Desktop construye fechas de terminales de strip al comparar modelos de sesión activa, lo que puede suprimir los cambios de modelo. Las rutas Anthropic Claude reales siguen sus verdaderas ID. Las nuevas rutas son predeterminadas para la familia Opus, pero mover una ruta no cambia el precio. proveedor o modelo al que llama. El legado aplica banderas `--static`, `--hybrid`, y `--discovery-only`
permanecen disponibles para los scripts existentes.

<a id="system-environment-integration"></a>

## Integración del entorno del sistema

Cuando `claudeCode.systemEnv` está configurado para `true` (por defecto: **apagado**), `ocx start` usos `launchctl setenv`
para inyectar `ANTHROPIC_BASE_URL` y las variables de entorno Claude Code relacionadas en todo el sistema. Nuevas ventanas y pestañas de terminales, por lo tanto, enrutan la llanura `claude` mediante el proxy sin Requerir el `ocx claude` Envoltorio. Los proyectiles ya abiertos no se ven afectados y deben reabrirse. Cambiar una ranura o palanca del modelo (`smallFastModel`, `tierModels`, `maxContextTokens`, auto-contexto,
`autoCompactWindow`, `alwaysEnableEffort`) vuelve a aplicar la inyección de inmediato: una clave opencodex inyectado antes es actualizado o no configurado una vez que la configuración ya no lo produce. Un valor con el que te fijas
`launchctl setenv` antes de que opencodex inyecte esa clave nunca se sobrescribe ni se elimina; una clave opencodex inyectado permanece propiedad de opencodex (refrescado, sin configurar y eliminado por `ocx stop`) incluso si cambia su valor a mano.

`ocx stop` y cierre proxy **desactivar las llaves inyectadas** (no restaura los valores anteriores — solo se eliminan las claves opencodex inyectadas). El proxy también escribe `~/.opencodex/claude-env.sh`;
`ocx start` Instala un `.zshrc` fuente que lo carga automáticamente solo cuando un ejecutable Claude Code CLI está presente en `PATH`. Startup y `ocx ensure` quitar el gancho propiedad de OpenCodex cuando Claude Code está ausente o la integración del entorno del sistema está inactiva. Claude Desktop utiliza su perfil separado y no causa la instalación del gancho de shell.

Desactivar con `claudeCode.systemEnv: false` en la configuración o con el conmutador GUI. Esto solo macOS; en otras plataformas, use `ocx claude`.

<a id="native-claude-passthrough-subscription-pierce"></a>

## Paso nativo Claude (perforación de suscripción)

Sin ningún conjunto de anulación de autenticación, Claude Code mantiene su inicio de sesión claude.ai OAuth y lo envía al proxy. Solicitudes genuinas `claude*`/`anthropic*` modelos que no se reenvían alias o reclamos de mapas de modelos
**literal** a `api.anthropic.com` con su credencial — betas, firmas de pensamiento, prompt La identidad de caché y facturación permanece completamente nativa, y los modelos enrutados siguen funcionando en la misma sesión a través de los alias del selector.

**Manejo del encabezado:** encabezados hop-by-hop plus `host`, `content-length`, `accept-encoding`,
`x-opencodex-api-key`, y `origin` Siempre se quitan antes de reenviar. En un enlace sin bucle, passthrough nativo también requiere una credencial proxy válida en `x-opencodex-api-key`; `Authorization`
y `x-api-key` entonces pertenecen solo a Anthropic. Un secreto de admisión proxy encontrado en cualquiera de los proveedores Se elimina la cabecera, mientras que se conserva una credencial de proveedor genuina en la otra cabecera. Ambiguo Las cabeceras de credenciales unidas por coma no se reenvían.

El paso a través se dispara cuando se cumplen todas estas condiciones: `nativePassthrough` no es `false`; El modelo comienza con `claude` o `anthropic`; el portador token o `x-api-key` Comienza con `sk-ant-`; La resolución alias/model-map devuelve el mismo modelo sin cambios; y, en un enlace no loopback, el La cabecera de admisión proxy dedicada es válida. Esto también significa el La advertencia "Los conectores claude.ai están desactivados" ya no aparece con `ocx claude`.

El único cambio en el cuerpo son los identificadores de llamada a herramientas. A `tool_use.id` o `tool_result.tool_use_id` que Anthropic rechazaría (caracteres externos `a-zA-Z0-9_-`, o más de 64), tal como un modelo encaminado acuñado anteriormente en la sesión, se reescribe a un id conforme con su emparejamiento de llamada/resultado mantenido. Los identificadores conformes se envían sin cambios, y un identificador vacío se responde con un identificador local 400.

Desactivar con `claudeCode.nativePassthrough: false`; punto en otro lugar con
`claudeCode.anthropicBaseUrl`.

<a id="claude-desktop-on-a-connected-remote-hub"></a>

## Claude Desktop en un centro remoto conectado

Cuando esta máquina está conectada a un concentrador, `ocx claude desktop apply` (o `ocx claude desktop`) utiliza la instantánea del modelo de escritorio del concentrador. Escribe el origen del concentrador conectado y el ID de modelo en la configuración local del escritorio sin generar alias de reemplazo localmente. Los modos estático e híbrido copian las entradas de la instantánea; el modo de solo descubrimiento utiliza el origen del concentrador sin incrustar la lista de modelos.

El concentrador posee el perfil de escritorio, las asignaciones familiares y los valores predeterminados. Cambia los que están en el hub, luego aplicar de nuevo en el cliente conectado y volver a seleccionar el modelo en Escritorio. Antiguos alias creados solo en el cliente se requiere volver a aplicar / reselección; no se migran automáticamente. Local `show`, Las ediciones de perfil y la importación/exportación siguen siendo vistas y operaciones locales, no gestión de perfiles de concentrador. Mientras están conectados, `ocx claude desktop import <path> --apply` no es compatible y rechaza la importación antes de ahorrar. Importación sin `--apply` Sigue siendo local.

Apply lee la instantánea utilizando la credencial de datos de la conexión existente. No necesita administración token y no sube ningún perfil. Si el concentrador es demasiado viejo para soportar la instantánea, la respuesta no es válida. o no hay modelos de escritorio disponibles, aplicar falla sin sustituir un catálogo local o loopback origen. Actualizar/configurar el concentrador y volver a aplicar.

Este cambio de alias no fija el `thinking` / `redacted_thinking` reproducción y prompt-cache Solicitud en [#3719](https://github.com/lidge-jun/opencodex/issues/3719). La admisión proxy por sí sola no permite el paso nativo Anthropic; traducido Las rutas Anthropic aún pueden usar almacenamiento en caché rápido. La fidelidad de reproducción y las comparaciones de caché permanecen trabajo separado.

<a id="key-rotation-recovery-and-disconnect"></a>

### Rotación, recuperación y desconexión de llaves

La rotación de claves y la recuperación actualizan la credencial almacenada en el perfil de Desktop propiedad de la conexión junto con la credencial de conexión local. No se requiere volver a aplicar Desktop manual solo para migrar la clave. Se conservan los ID de modelo existentes, las opciones de familia/predeterminado y la selección de perfil actual del usuario; la rotación no selecciona el perfil administrado nuevamente ni vuelve a habilitar una integración deshabilitada.
CLI JSON `rotation: "committed"` significa que la nueva clave está activa. `rotation: "rolled_back"` significa la La clave anterior se retuvo o restableció, no es que se haya cometido una nueva clave o se haya revocado la clave anterior. La recuperación incierta o incompleta se informa como tal, en lugar de una rotación exitosa.

La primera aplicación conectada registra los configuración y la selección administrados anteriores para su restauración. La aplicación repetida y la rotación de la tecla conservan esa línea base original. `ocx disconnect` restablece el configuración de propiedad de la conexión al tiempo que se conservan los campos agregados por el usuario y los perfiles no relacionados. La selección anterior se restaura solo si el perfil administrado todavía está seleccionado; una selección válida posterior se puede restaurar. La selección del usuario permanece seleccionada. Un perfil recién creado con adiciones de usuario se conserva en un formato legible. modo estándar en lugar de eliminar esas adiciones. `--keep-catalog` mantiene el catálogo, no el Credencial de conexión de escritorio.

Para un perfil administrado más antiguo sin un registro original, OpenCodex puede migrarlo cuando pertenece inequívocamente al concentrador actual y a una clave de conexión reconocida. Aplicar, rotación/recuperación o desconexión directa puede manejar este caso sin una nueva bandera o requisito previo volver a aplicar. Una advertencia explica que la desconexión utilizará el modo estándar porque no se registraron los configuración anteriores. Ese recurso secundario elimina solo la configuración de la puerta de enlace propiedad de la conexión, conserva los campos de usuario y una Selección válida separada, y se informa como reserva estándar, no restauración original.

Se conservan los campos administrados en conflicto, las credenciales no reconocidas o los registros de restauración dañados e informó para su resolución. La limpieza interrumpida puede reanudarse para la misma conexión; no borrar una conexión más nueva o reclamar la finalización mientras que la restauración sigue siendo incompleta. Terminar pendiente recuperación de rotación antes de iniciar la desconexión, y conservar la misma opción de catálogo al volver a intentarlo.

Cierre completamente y vuelva a abrir el escritorio Claude después de aplicar, rotar/recuperar o restaurar: cambiar archivos no reemplaza una credencial que ya tiene la aplicación en ejecución. OpenCodex no mata/reinicia el App automáticamente. Desconectar funciona localmente sin revocar automáticamente la clave de concentrador o borrar copias externas arbitrarias; revocar por separado en el concentrador si se desea.

<a id="the-model-picker-from-gateway"></a>

## El selector /model ("Desde la puerta de enlace")

Claude Code 2.1.129+ descubre modelos de pasarela a través de `GET /v1/models?limit=1000` y los enumera en El nativo `/model` Recolector. Una fila sin un `description` lee "Desde la puerta"; opencodex envía uno para cada fila Claude Code CLI (`Routed by OpenCodex to <provider>/<model>`; uso de filas nativas `Routed by OpenCodex to native <model>`, añadir filas rápidas ` · Fast`, y 1M filas mantener la descripción base), que Claude Code 2.1.257+ espectáculos en su lugar. Claude Code 2.1.278 acepta un identificador de selector que contiene `claude` o `anthropic`. Una identificación no reconocida que comienza con `claude-` se contabiliza en 200k a menos que el compacto esté deshabilitado, por lo que opencodex expone los modelos enrutados como alias estables y reversibles que contienen `claude` pero no empieces con `claude-`:

| Superficie | Formato | Ejemplo |
| --- | --- | --- |
| Claude Code CLI | `ocx-claude-<provider>--<model>` (Plain) o `ocx-claude2-…` (escapado) | `ocx-claude-native--gpt-5.6-sol` |
| Claude Desktop 3P | `claude-fable-5-p<code>` (ranura de perfil de base36 3-char) | `claude-fable-5-p01q` |

El proxy elige la familia por solicitud: `?ids=cli` o `?ids=desktop` gana; de lo contrario, el
`claude-code/*` user-agent obtiene el formulario CLI legible y otros clientes obtienen el código de escritorio. Ambas familias decodifican para siempre — un modelo guardado en `settings.json` bajo cualquiera de las dos formas sigue funcionando. Cada entrada lleva un nombre de visualización honesto, como `gemini-3-pro (gemini)`, más el modelo completo capacidades (escalera de esfuerzo-razonamiento, tipos de pensamiento) en la forma oficial de ModelInfo para Claude El modo de puerta de enlace de terceros del escritorio puede ofrecer su selector de esfuerzo. Los modelos reales Anthropic mantienen su Id canónicos. La fecha 2026 sintética es una ranura interna, no una fecha de lanzamiento. Legado hash alias y `claude-ocx-<provider>--<model>` / `claude-ocx2-<provider>--<model>` ids de configs anteriores aún se resuelven. Un identificador heredado configurado en una ranura de modelo OpenCodex (`claudeCode.model`, `tierModels`, `smallFastModel`) se envía a Claude Code en su ortografía actual automáticamente. Una identificación heredada guardada por el propio selector de Claude Code sigue enrutando, pero Claude Code mantiene su cuenta de 200k para esa identificación. Escoger `ocx-claude-` por un ahorrado `claude-ocx-` id, y `ocx-claude2-` por un salvado escapado `claude-ocx2-` id, por lo que se aplican tanto la ventana de contexto del catálogo efectivo como el compacto.

Los perfiles gestionados más antiguos expusieron sus perfiles internos `YYYYMMDD` ranuras directamente. Afectado Desktop construye tira esa fecha terminal al comparar modelos de sesión activa, por lo que dos rutas distintas pueden parecer idénticas y no `set_model` Se envía la solicitud de control ([#3782](https://github.com/lidge-jun/opencodex/issues/3782)) Los perfiles actuales exponen códigos no fechados en su lugar. Después de actualizar, vuelva a aplicar el perfil de escritorio y salir y volver a abrir Desktop; un trabajador que ya está en ejecución todavía puede conservar su antiguo id con forma de fecha. El proxy continúa decodificando esos identificadores antiguos para la migración, pero no puede hacer que Desktop emita un modificador suprimido.

También puede intentar seleccionar el modelo predeterminado previsto en el OpenCodex Claude Perfil de escritorio, volver a aplicar el perfil e iniciar una nueva conversación. Este es un paso de solución de problemas, no una solución garantizada. OpenCodex no puede observar el estado del selector; enruta el identificador del modelo que lleva cada solicitud. **Registros → requestedModel**.

Modelos con una ventana de contexto larga (1M, o al menos el umbral de compactación predeterminado 829,800-token; Los modelos Claude en una ruta Anthropic necesitan un genuino 1M) obtener un extra `…[1m]` fila de selector: seleccionarlo hace
Claude Code cuenta un contexto completo de 1M para ese modelo (la autocompactación permanece activada) — el proxy quita el marcador antes de enrutar. Seleccionar uno lo Claude Code's `settings.json` `model` campo; solicitudes entrantes resolver El alias vuelve al modelo enrutado. En las versiones anteriores de Claude Code, el selector permanece en el conjunto nativo — ranuras vía
`ANTHROPIC_MODEL` o escriba cualquier id encaminado con `/model` (Claude Code pasa cadenas a través).

**Reglas gramaticales de Alias:** proveedor no debe contener `/` o `--` o igual `native`. ID de modelo sencillo (no `/` o `~`) mantener el prefijo v1 `ocx-claude-…`. Identificadores de modelo que contienen `/` o
`~` acuñar el prefijo v2 `ocx-claude2-…` con escapes (`/` → `~s`, `~` → `~t`), e.g.
`openrouter/anthropic/claude-opus-4-8` → `ocx-claude2-openrouter--anthropic~sclaude-opus-4-8`. Los alias v1 decodifican literalmente (por lo que un id de modelo histórico que contenía las secuencias de dos caracteres)
`~s` / `~t` se conserva); los alias v2 expanden los escapes. Rutas que la forma legible no puede Regresa al alias de hash. Los ID de modelo MAY contienen `--` (La resolución se divide en el primer
`--` solo); babosas nativas que contienen `--` Caer de nuevo a la forma hash.

**Orden de resolución del modelo:** `[1m]` marcador despojado → alias legible decodificado → Escritorio hash alias decodificado → `modelMap` coincidencia exacta → coincidencia eliminada por fecha (`-20250514` eliminado) paso de →.

<a id="desktop-alias-resolution"></a>

Un ID de escritorio en forma de fecha no resuelta también puede ser un modelo nativo genuino que falta en el descubrimiento. Messages y count-tokens devuelven HTTP 503 con el fijo `desktop_model_mapping_unavailable` error cuando el disponible La evidencia no puede resolver ese ID; esto no establece que el modelo no es válido. Legado desconocido Los alias hash aún devuelven HTTP 400. Ninguno de los casos quita la fecha o vuelve a otra ruta. IDs conocidos, asignaciones registradas y exactas `modelMap` mantiene su comportamiento existente, incluyendo identificaciones nativas reales. Actualizar el descubrimiento del modelo o volver a aplicar el perfil del concentrador conectado antes Intentar de nuevo; volver a intentarlo por sí solo no garantiza la resolución.

Cada entrada lleva un nombre de visualización como `gemini-3-pro (gemini)`, además de capacidades de modelo completo (escalera de razonamiento-esfuerzo, tipos de pensamiento) en el oficial `ModelInfo` forma. Modelos reales Anthropic mantener sus identificaciones canónicas en ambas superficies.

<a id="context-variant-1m-marker"></a>

### Variante de contexto `[1m]` marcador

Estas comprobaciones utilizan la ventana de catálogo efectiva, que puede incluir una [Estimación del proveedor personalizado](/es/reference/configuration/providers/#context-windows-on-custom-providers). Una estimación no verifica la capacidad real del relé.

Modelos con una ventana de contexto de catálogo efectiva de 1M, o al menos el valor predeterminado 829,800-token umbral de compactación, obtener un extra `…[1m]` fila de selector; el piso es fijo, por lo que una compactación personalizada El valor no lo reduce, y los modelos Claude en una ruta Anthropic necesitan un 1M genuino. Turning El auto-contexto desactivado limita la fila a ventanas de 1M. Seleccionarlo hace que Claude Code cuenta un contexto completo de 1M. El proxy elimina la insensibilidad de mayúsculas y minúsculas `[1m]` sufijo antes de alias Resolución y enrutamiento.

<a id="auto-context-big-context-models-without-the-200k-ceiling"></a>

## Contexto automático (modelos de gran contexto sin techo de 200k)

Claude Code cuentas 200k tokens para cualquier modelo que no reconoce. **Contexto automático** (en adelante por por defecto) corrige que:

1. Lanzamiento de ranuras env obtener el `[1m]` Marcador cuando la ventana de catálogo efectiva del modelo está por encima de 200k
   **y** al menos el umbral autocompacto configurado. Las filas del selector de descubrimiento y escritorio no siguen ese umbral: utilizan el piso fijo 829.800-token (un genuino 1M para los modelos Claude en un Ruta Anthropic).
2. `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (por defecto) `829800`, rango `100000`–`1000000`) se inyecta así La conversación se resume automáticamente en ese punto.

Tres estados de configuración:

- **ausente / `true`:** activado (por defecto)
- **`false`:** — sin marcadores, sin inyección de ventana de compactación
- **legado `maxContextTokens` conjunto:** El auto-contexto está implícitamente deshabilitado

El valor de compactación es ajustable en la página Claude. **Aviso:** Elevándolo más allá de la realidad de un modelo ventana rompe ese modelo — los errores de chat antes de que el resumen se puede disparar.

La ventana de contexto anunciada de un modelo no garantiza que una solicitud pesada en herramientas se ajuste a la límite de entrada ascendente. Un rechazo de límite de entrada clasificado alcanza Claude Code como
`invalid_request_error` con `context_length_exceeded`, redactado de la manera en que Anthropic lo dice (`prompt is too long: …`), por lo que Claude Code compacta la conversación y vuelve a intentar por sí solo; una respuesta que no es de transmisión utiliza HTTP 400 en su lugar de un 502 reintentable. Los proveedores en el carril nativo Messages tienen la misma redacción.

La normalización del desbordamiento utiliza solo el primer **65.536 unidades de código UTF-16** del error del proveedor mensaje, incluidos los mensajes que ya utilizan la redacción de Anthropic. Este es un límite de longitud de cadena, no un límite de bytes o token. El texto más allá de él se descarta sin un marcador de truncamiento o elipsis. por lo que los detalles de diagnóstico y los recuentos de token cerca del final pueden estar ausentes del error Claude Code recibe. El añadido `prompt is too long:` seguido de un espacio, puede hacer el mensaje final más largo que esta porción retenida.

Dentro de esa porción, se mantiene la redacción reconocida de Anthropic; de lo contrario, OpenCodex emite
`prompt is too long: <requested> tokens > <limit> maximum` Sólo cuando encuentra
`maximum context length is <limit> tokens` seguido por `resulted in <requested> tokens` o
`you requested <requested> tokens`. Utiliza el primer límite establecido y la primera solicitud de coincidencia cuenta después de ella. Si ese par falta, se invierte o se corta, prefija el texto retenido con
`prompt is too long:` seguido de un espacio, sin inventar cuentas. Un límite de rendimiento que solo menciona tokens (por ejemplo, "demasiados tokens por minuto") mantiene su texto y no se trata como un desbordamiento.

Si la compactación en sí misma aún excede el límite, preservar el original. historial e intente compactar una bifurcación con menos herramientas habilitadas o esquemas MCP, si su cliente admite ese flujo de trabajo. A `[1m]` El ajuste de contabilidad del marcador o cliente más grande no eleva el valor ascendente límite, y OpenCodex no elimina silenciosamente el historial o las herramientas para que encaje.

Los modelos sub-1M Anthropic nativos nunca se marcan automáticamente. Gana una ventana compacta que tú mismo exportas para el marcado de ranura de lanzamiento (el proxy utiliza el valor YOUR para decidir qué modelos son seguros para marcar). Las filas de descubrimiento ignoran esa exportación y mantienen el piso fijo. Valores de configuración no válidos editados manualmente volver a 829.800.

<a id="context-accounting-1m-by-default-200k-opt-in"></a>

### Contabilidad de contexto (1M por defecto, 200k opt-in)

`claudeCode.contextAccounting` decide lo que opencodex elige por defecto. Ausente :`1m`, el por defecto), los modelos de larga ventana se ofrecen a 1M en las ranuras de env de lanzamiento, los selectores de escritorio, Escritorio 3P (`prefer1m`) y subagentes generados. Establecer `200k` para excluirse: nada está marcado `[1m]`
automáticamente, `CLAUDE_CODE_AUTO_COMPACT_WINDOW` no se inyecta, y Desktop 3P cae `prefer1m`
mientras se mantiene `supports1m`. Un selector que marques `[1m]` usted mismo permanece disponible (generado y Los subagentes forzados todavía dejan caer un marcador que la ventana del modelo no puede llevar), y el descubrimiento todavía enumera la `· 1M` filas de modelos con ventanas de catálogo de al menos 1M. `200k` gana sobre auto-contexto: a La ventana compacta que exporta ya no activa el marcado automático, aunque opencodex deja la suya propia Exportación en su lugar.

```bash
ocx claude config set --context-accounting 200k
```

<a id="effective-model-environment"></a>

### Entorno modelo eficaz

`effectiveModelEnv` calcula seis ranuras inyectadas por `ocx claude` / system env / shell file:
`ANTHROPIC_MODEL`, cuatro `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU,FABLE}_MODEL`, y legado
`ANTHROPIC_SMALL_FAST_MODEL`. El haiku efectivo es `tierModels.haiku ?? smallFastModel`, alimentado a las dos variables del haiku.

Cuando `ocx claude` se inicia en modo de suscripción, el propio inicio de sesión de Claude Code lleva una identificación Claude desnuda como el `claude-sonnet-5` directamente a Anthropic, para que esos ids tomen sus ventanas de contexto de la registro de proveedores, lo que sea que otro proveedor enumere bajo el mismo id. Un Opus, un Soneto o una Fábula ranura entonces obtiene el id nativo Claude Code resuelve que alias a, con el `[1m]` Marcador, porque detrás de una puerta de enlace Claude Code cuenta con un id sin marcar a 200k. Un `anthropic` fila tapada por debajo de 1M o a `claudeCode.modelMap` La entrada mantiene su id sin marcar, y el Haiku nunca se llena ni se marca. Cuando el lanzamiento utiliza proxy auth o `nativePassthrough` está apagado, el router decide, y solo una fila enrutada ventana cuenta. Env del sistema y el archivo de shell dejan espacios vacíos sin establecer, ya que sus valores también alcanzan lanzamientos que pasan a través de un hub.

Cuando ambos `tierModels.haiku` y `smallFastModel` están ausentes, OpenCodex deja ambas variables de ayuda sin establecer; Claude Code luego elige su modelo de ayudante nativo (actualmente Sonnet), que puede incurrir en cargos de proveedor nativo.

<a id="roster-agents-injectagents"></a>

## Agentes de lista (injectAgents)

Proxy de inicio / asegurar, `ocx claude`, y el panel de control relevante guarda la sincronización de su lista de subagentes destacados (Pestaña Subagentes, hasta 5 modelos) más `ocx-self` en `~/.claude/agents/ocx-*.md`.

- **`ocx-self`** pines de su `/model` por defecto (regresando a `claudeCode.model`); omitido cuando tampoco existe. NOT usa herencia de modelo.
- Cada cuerpo de agente contiene un `<!-- ocx-route: <model> -->` directiva — el proxy usa esto para Fijar la ruta real. La herramienta del agente `model` argumento es, por lo tanto, inerte; pase `"haiku"` como a marcador de posición.
- Frontmatter lleva el alias; el enrutamiento es impulsado por directivas.
- Solo verificado por marcador `ocx-*.md` archivos que contienen `generated-by: opencodex` están siempre sobreescrito o podado; sus propios agentes nunca son tocados.
- Los archivos se sincronizan atómicamente por archivo (escribir + renombrar).
- `enabled: false` o `injectAgents: false` poda todas las definiciones verificadas.
- El éxito de CLI guarda y persiste la configuración de escritorio de primera parte también intenta el mejor esfuerzo Sincronización de la lista, incluida la configuración repetida para reparar las definiciones que faltan. Configuración y reversión rechazadas No sincronice agentes. Desactivar el registro de primera persona por sí solo no inhabilita el registro del agente.
- GUI PUT y la lista cambian de nuevo inmediatamente; cada inicio/garantización del proxy en primer plano o en segundo plano reconcilia los archivos propios antes de que un lanzamiento posterior de Claude Code los lea. Iniciar una nueva sesión Claude después del registro para que cargue las definiciones generadas.

Envío: `subagent_type: "ocx-gpt-5-6-sol"`. 1M-objetivos capaces de llevar `[1m]` automáticamente.

<a id="bundled-skill-elision-blockedskills"></a>

## Elisión de habilidades agrupadas (blockedSkills)

Los Claude Code incluidos `claude-api` habilidad inyecta ~840KB (~136k tokens) de la documentación Anthropic que se activa automáticamente en el modelo Claude menciona. Los modelos enrutados no están entrenados en ese paquete, por lo que por defecto opencodex reemplaza el contenido de la habilidad con un corto stub en **Enrutado** solicitudes. Nativo El paso Anthropic no ha sido tocado.

**Se manejan dos transportistas:**

1. **Portaherramientas de resultados:** asistente `Skill(...)` llama a — el emparejado `tool_result` cuerpo es reemplazado por un stub cuando la entrada JSON en caja inferior contiene un nombre bloqueado.
2. **Portador de bloque de texto:** un bloque de texto del usuario ≥10.000 caracteres que comienzan con
   `Base directory for this skill: ` — coincidió cuando el nombre base del directorio es igual a un nombre bloqueado (insensible al caso). La línea de directorio se inspecciona solo hasta 4,096 unidades de código UTF-16; Una línea más larga se envía sin cambios, incluso cuando no tiene una línea nueva de terminación.

Configura con `claudeCode.blockedSkills` (por defecto) `["claude-api"]`; `[]` Deshabilita la elisión completamente). El stub mantiene intacto el emparejamiento de llamada/resultado de la herramienta.

<a id="model-map-interception"></a>

## Mapa de modelos (intercepción)

`claudeCode.modelMap` reescribe los ID de modelo entrantes de Anthropic antes del enrutamiento:

```json
{
  "claudeCode": {
    "modelMap": {
      "claude-sonnet-4-5": "gemini/gemini-3-pro",
      "claude-haiku-4-5": "gemini/gemini-3-flash"
    }
  }
}
```

Orden de búsqueda: descubrimiento alias → id exacto → id con fecha sufijo despojado (`-20250514`) Paso →.

Véase [Resolución de alias de escritorio](#desktop-alias-resolution) por la política de rechazo.

<a id="sidecar-matrix-web-search-and-image-understanding"></a>

## Matriz Sidecar: búsqueda web y comprensión de imágenes

Los modelos enrutados no todos tienen las mismas herramientas alojadas o soporte de imágenes. opencodex llena esos vacíos antes de que el modelo principal responda:

- Los **web-buscar sidecar** ejecuta la búsqueda real alojada, luego le da al modelo enrutado la respuesta y fuentes como resultado de una herramienta.
- Los **visión sidecar** describe una imagen adjunta antes de llamar a un modelo
  `noVisionModels`, luego reemplaza la imagen con esa descripción.

Ambos sidecars pueden usar cualquiera de los dos backend:

| Backend | Cómo funciona | Lo que se requiere |
| --- | --- | --- |
| `openai` | Un pequeño modelo GPT a través de la ChatGPT `forward` proveedor | Un inicio de sesión ChatGPT y un `authMode: "forward"` proveedor |
| `anthropic` | Claude a través de almacenado Anthropic OAuth; uso de la búsqueda web `web_search_20250305` y la visión envía la imagen a Claude para la descripción | Un habilitado `adapter: "anthropic"`, `authMode: "oauth"` proveedor cuya cuenta almacenada activa no está marcada `needsReauth` |

Una explícita `backend` Siempre gana. Cuando se omite, el **web-search** sidecar siempre selecciona
`openai` (`anthropic` solo se ejecuta cuando está configurado explícitamente), mientras que el **visión** sidecar selecciona
`anthropic` si un objeto útil almacenado Anthropic OAuth La cuenta existe, de lo contrario `openai`. Selección explícita
`anthropic` sin una credencial utilizable **falla cerrado**: opencodex no toma prestado silenciosamente credenciales ChatGPT o switch backends. El backend OpenAI también se mantiene apagado sin iniciar sesión auth y un proveedor de forward.

Las repeticiones enrutadas entrantes de Claude adjuntan el inicio de sesión principal de ChatGPT a la solicitud interna, por lo que OpenAI Los sidecars siguen siendo accesibles a pesar de que el portador entrante de Claude Code es solo la credencial proxy. Ese portador nunca se reenvía al proveedor principal enrutado.

```json
{
  "webSearchSidecar": {
    "backend": "anthropic",
    "model": "claude-sonnet-5",
    "maxSearchesPerTurn": 3
  },
  "visionSidecar": {
    "backend": "anthropic",
    "model": "claude-sonnet-5",
    "maxDescriptionsPerTurn": 8
  }
}
```

`maxDescriptionsPerTurn` limita las nuevas descripciones de imágenes en un turno de modelo principal. Caché hits y Las descripciones duplicadas en vuelo no consumen el límite. Descripciones exitosas para `data:`
las imágenes se almacenan en caché por backend, modelo, detalle, bytes de imagen y contexto de solicitud, por lo que el mismo El par imagen-y-contexto no se describe de nuevo en cada repetición. Remota `https:` Las imágenes nunca se almacenan en caché porque su contenido puede cambiar.

Ver la [referencia de configuración](/es/reference/configuration/server/#sidecars) para cada clave. Anthropic-OAuth búsqueda web y descripción de la imagen reutilizan el repositorio existente Claude Code OAuth huella digital precedente, pero aún debe ser probado en remojo con su cuenta y carga de trabajo antes de que usted dependen de ellos para largas carreras sin vigilancia.

<!-- TODO(WP5 GUI): Add the sidecar settings-screen walkthrough after the GUI controls ship. -->

<a id="client-tools-on-cursor-routes"></a>

## Herramientas de cliente en rutas Cursor

Cuando Claude Code utiliza un modelo respaldado por Cursor, OpenCodex conserva nombres de herramientas de cliente reconocidos como el `Bash`, `Read`, `Write`, `Edit`, `Grep`, `Glob`, y `Task` en el catálogo de Cursor, herramienta dirección y se repiten las llamadas. Esto mantiene los nombres consistentes con las instrucciones de Claude Code. Las tramas de ejecución nativas Cursor denegadas dirigen el modelo a las herramientas cliente disponibles que giran.

Un catálogo mixto que contiene un Codex desnudo `exec_command` o `shell_command` puente utiliza alambre Alias como `ocx_client_Read` para evitar colisiones de herramientas Cursor; llamadas devueltas a Claude Code utilizar sus nombres de herramientas originales. Las herramientas MCP de espacio de nombres mantienen sus identidades de espacio de nombres. OpenCodex incluye estos alias en el presupuesto de bytes de transporte de Cursor, por lo que es una herramienta cuya definición excedería el límite se omite para ese turno.

<a id="reasoning-effort"></a>

## Esfuerzo de razonamiento

En las solicitudes traducidas Messages → Responses, Claude Code `/effort` Configuración de mapas de la siguiente manera:

| Formato de alambre | Mapeo |
| --- | --- |
| `thinking.type: "adaptive"` + `output_config.effort` | El esfuerzo pasó directamente (`minimal`\|`low`\|`medium`\|`high`\|`xhigh`\|`max`\|`ultra`) |
| `thinking.type: "enabled"` + `budget_tokens` | ≤4096→`low`, ≤16384→`medium`, arriba→`high` |
| `thinking.type: "disabled"` | `reasoning: { effort: "none" }`Resumen omitido |

Para las solicitudes traducidas, el nivel resuelto aparece en el registro de solicitudes. **Esfuerzo de razonamiento** columna. Gestionado nativo Messages registro habilitado pensando presupuestos como `budget:<tokens>` Cuando no se reconoce
`output_config.effort` está presente; este registro no cambia el cuerpo del cable.

<a id="inbound-translation-messages--responses"></a>

## Traducción entrante (Messages → Responses)

El proxy traduce cada solicitud Anthropic Messages API al formato Codex Responses API:

| Entrada Messages | Salida Responses |
| --- | --- |
| De alto nivel `system` | `instructions` (Bloques de texto unidos con `\n\n`) |
| `messages[].role: "system"` | También plegado en `instructions` |
| Texto / imagen del usuario | `input_text` / `input_image` (base64 → datos URL) |
| Texto del asistente | `output_text` |
| Asistente `tool_use` | `function_call` (`input` → JSON-stringificado `arguments`) |
| Usuario `tool_result` | `function_call_output` (`is_error` → `[tool error]` prefijo) |
| `tool_reference` en un resultado de herramienta | Texto `Tool loaded: <tool_name>` en el resultado emparejado; conserva los nombres de las herramientas cargadas sin agregar declaraciones ni habilitar el aplazamiento del lado del servidor traducido |
| `thinking` / `redacted_thinking` repetición | `reasoning` artículos con delimitado `ocxr1` sobres para firmas y cargas útiles redactadas |
| Herramientas de función | `{type: "function"}` (`web_search*` → `{type: "web_search"}`) En una ruta a `api.anthropic.com`, el tipo `web_search_*` y `web_fetch_*` las declaraciones también se envían a Anthropic como se declara y se ejecuta en el lado del servidor, a menos que la búsqueda web proporcione `web_search` sí mismo. Una búsqueda o fetch con una llamada coincidente y entrada completa vuelve al cliente como su `server_tool_use` bloque y su `web_search_tool_result` o `web_fetch_tool_result`Literalmente. Los resultados huérfanos se eliminan sin sintetizar una llamada, mientras que el texto circundante se conserva. Cuando el cliente envía un par completo de vuelta en su historial, el siguiente `api.anthropic.com` La petición lo lleva en su lugar solo si el siguiente bloque identifica de forma exclusiva su turno original. Anclajes repetidos, identificadores de llamada/resultado no coincidentes o duplicados, entrada de llamada malformada o un resultado que aparece antes de que su llamada caiga en el intercambio. fetch URL otros destinos nunca ven el intercambio |
| `tool_choice` | `auto`→`auto`, `none`→`none`, `any`→`required`, llamado function→`{type:"function",name}`, WebSearch alojado/web_search→`{type:"web_search"}` |
| `max_tokens` | `max_output_tokens` |
| `stop_sequences` | `stop` |

El modo automático Claude Code siempre envía `stop_sequences`. Para los modelos en el proveedor de rutas `noStopModels` lista, OpenCodex omite `stop` tanto en los cables Chat Completions como Responses, por lo que los modelos de razonamiento xAI como gruk-4.7 y gruk-4.6 no regresan `400 invalid-argument` y se marcan temporalmente no disponible. Véase [`noStopModels`](/es/reference/configuration/providers/).

Replay conserva los bloques firmados no ocultos (incluido el pensamiento vacío) y los bloques redactados opacos en el adaptador Anthropic previsto. `hideThinkingSummary` permanece sin cambios: el texto firmado localmente oculto no está expuesto a los clientes de Claude y no se establece la reproducción sin pérdida a través de ese límite oculto de Claude. Los sobres de razonamiento combinados más antiguos no pueden recuperar el orden de bloque original una vez que se ha emitido la transmisión de texto. `claudeCode.compatibility: "enforce"` Rechaza la repetición del pensamiento. Esto no establece la aceptación de Anthropic en vivo o mejoras de caché-hit; [#3719](https://github.com/lidge-jun/opencodex/issues/3719) permanece abierta.

**Casos de error (400):** JSON; faltante/vacío `model`; faltante/vacío `messages`; sin soporte papel; `tool_result` sin `tool_use_id`; `tool_use` sin id/nombre; nombre `tool_choice` sin nombre.

<a id="unicode-property-patterns-in-tool-schemas"></a>

### Patrones de propiedad Unicode en esquemas de herramientas

Un esquema JSON `pattern` escrito para JavaScript puede usar escapes de propiedad Unicode como
`\p{Cc}` o `\P{L}`. Los backends de la familia OpenAI validan `pattern` Compilando con Python
`re`, que no soporta esos escapes, y un esquema que no pueden compilar se le niega — entero por lo que un único patrón de este tipo en una herramienta integrada falla cada solicitud en la sesión, no solo las llamadas a esa herramienta.

Para mantener funcionando los parámetros ordinarios de Artefacto, el `openai-chat` y `openai-responses` adaptador rutas omitan escalar `pattern` restricciones que contienen propiedad Unicode escapa en positive ordinario posiciones de esquema. Restricciones de hermanos, `required`, los datos literales y los regexes soportados permanecen. Una implementación de la herramienta debe validar sus propias entradas porque no se aplica una restricción omitida. por este proxy.

`patternProperties` Los matchers y sus esquemas de valor permanecen sin cambios. Eliminar un matcher puede cambiar qué claves son evaluadas por un antepasado `unevaluatedProperties`La apertura local es No es suficiente para demostrar una transformación segura. Patrones bajo `not`, `oneOf`, `if`, `contains`,
`$defs` y `definitions` también permanecen sin cambios: relajar esos subárboles puede cambiar la negación, selección de ramas, recuento de coincidencias o el significado de una referencia.

El destino valida estos esquemas conservados. Un destino compatible con ECMA puede usar el regex original; un destino que no puede compilarlo puede rechazar el esquema. OpenCodex no reemplazar silenciosamente ese contrato con uno que prohíba argumentos previamente válidos.

Esta es la normalización en la ruta del adaptador seleccionado, no una garantía para todo el proveedor. Proveedor configuración y autenticación no se tocan, y un proveedor en un adaptador diferente es No afectado.

Es una medida de compatibilidad, no una afirmación que cada backend personalizado compatible con OpenAI rechaza. estos patrones. Vale la pena saber lo que cuesta: una regla omitida no se conserva en ningún lugar y es no se aplica en sentido ascendente, por lo que una implementación de herramientas debe validar sus propias entradas en lugar de confiar en el esquema para rechazar un argumento mal formado.

<a id="outbound-translation-responses--messages-sse"></a>

## Traducción saliente (Responses → Messages SSE)

| Evento Responses | Messages SSE |
| --- | --- |
| `response.created` | `message_start` + `ping` |
| Latido del corazón | `ping` |
| Texto deltas | `content_block_start` → `content_block_delta` (texto) → `content_block_stop` |
| Razonamiento resumen/texto | `thinking` bloque con la firma reproducida, o una `ocxr1` sobre de reserva |
| Razonamiento redactado | `redacted_thinking` bloques reproducidos desde el sobre de razonamiento |
| Marcos de llamada de función | `tool_use` Bloquear con `input_json_delta` |
| Evento terminal | `message_delta` → `message_stop` |
| EOF antes del terminal | 502-estilo `api_error` |

**Detener el mapeo de razones:** `completed` → `tool_use` (si alguna herramienta llama) o `end_turn`;
`incomplete/max_output_tokens` → `max_tokens`; `incomplete/content_filter` → `refusal`.

**Taxonomía de error:** 400 `invalid_request_error`, 401 `authentication_error`,
402 `billing_error`, 403 `permission_error`, 404 `not_found_error`, 409 `conflict_error`,
413 `request_too_large`, 429 `rate_limit_error`, 504 `timeout_error`, 529 `overloaded_error`, Otros 5xx `api_error`. `Retry-After` se conserva.

<a id="prompt-caching-and-token-usage"></a>

## Uso rápido de caché y token

**Solicitudes enrutadas por Anthropic:** el adaptador gestiona los puntos de interrupción de la memoria caché para herramientas, contenido del sistema, y el penúltimo mensaje de usuario, además de un mensaje automático de nivel superior `cache_control`. Giros estables normalmente produce una tasa de éxito de caché del 99.9%.

**Enrutamiento nativo OpenAI/ChatGPT:** deriva un alcance de sesión `prompt_cache_key` (desde
`metadata.user_id` cuando está presente, volviendo a un hash de contenido del sistema) y `session_id` cabecera por afinidad de caché. La clave de caché incluye esquemas de modelo y herramientas completas.

**Matemáticas de token:** Anthropic resta la salida `cached_tokens` y `cache_write_tokens` Desde
`input_tokens`exponiéndolos como `cache_read_input_tokens` y `cache_creation_input_tokens`. Solicitar registros mapear esos de vuelta a inclusive `inputTokens`, con lecturas en ambos `cachedInputTokens` y
`cacheReadInputTokens`, escribe en `cacheCreationInputTokens`. La página de uso informa de los hits de caché y creación de caché por separado.

**count_tokens:** Los modelos enrutados utilizan una aproximación (sistema serializado + mensajes + herramientas). Modelos nativos Anthropic con un `sk-ant-` credenciales pasar la solicitud a través de la real Anthropic `/v1/messages/count_tokens` punto final.

<a id="debug-capture"></a>

## Captura de depuración

`ocx debug claude on|off|status|reset`, `OCX_CLAUDE_DEBUG=1`, o `PUT /api/debug {"claude": true}`
Controla la captura entrante. `GET /api/claude/inbound-debug` devoluciones `{enabled, entries}` (más reciente En primer lugar, el anillo de 20).

Cada entrada registra: `at`, `endpoint`, `model`, `resolvedModel`, `stream`, `maxTokens`,
`thinkingType`, `thinkingBudgetTokens`, `outputConfigEffort`, `metadataKeys`,
`hasMetadataUserId`, `hasSystem`, en bruto `anthropicBeta`, y etiquetas de igualdad HMAC de ocho caracteres para ID de usuario / sistema. **No se almacena ningún mensaje de texto, objeto sin procesar o hash estable de ejecución cruzada.** Desactivación La depuración Claude borra inmediatamente el anillo.

<a id="gui-claude-page"></a>

## GUI (página Claude)

Abrir **Conectar → Claude** para la configuración de una página Claude Code. La página muestra estos controles y secciones en orden:

1. **Claude Code CLI de primera mano** interruptor
2. **Empezar** con `ocx claude` y el bloque de entorno manual
3. **General** con compatibilidad, instrucciones del agente, modo rápido y controles de contexto
4. **Modelo de ayudante de fondo** selector
5. **Interceptación modelo** editor
6. **Modelos disponibles**, la vista previa en vivo de Claude Code `/model` alias de selector
7. **Conexión Claude** interruptor, también disponible en la tarjeta Claude en la vista general de Connect

La pegajosa barra de Guardar muestra **Sin cambios** cuando la configuración guardada coincide con la página, o
**Cambios no guardados** Después de editarlos. **Reversión** descarta ediciones no guardadas; **Guardar** compromete el configuración editables. Los **Conexión Claude** y **Claude Code CLI de primera mano** Se aplican los interruptores inmediatamente. **Guardar** nunca cambia ninguno de los interruptores.

**Escritorio Claude** es una pestaña separada bajo **Conectar**. Es **Modo de conexión** selector ofertas gateway (predeterminado) o first party, con el puerto proxy en ejecución en modo first party. Solo
**Guardar y aplicar** modos de conmutación; **Guardar** solo almacena los carriles de perfil de puerta de enlace para una La puerta de enlace se aplica y deja el modo actual como está.

`GET /api/claude-code` devuelve valores predeterminados efectivos, config, registro de ventanas de contexto, env efectivo, ids de ruta disponibles, alias y puerto. `PUT /api/claude-code` es parcial y conserva omitido campos; `null` restablece los valores de contexto/lista de bloques/ventana compacta.

<a id="troubleshooting"></a>

## Solución de problemas

**Claude Code dice "Hizo 0 búsquedas"** — Construcciones actuales traducir completado Responses
`web_search_call` elementos en Anthropic emparejado `server_tool_use` y `web_search_tool_result` bloques, incluyendo `usage.server_tool_use.web_search_requests`. Actualizar opencodex si se completó una versión anterior la búsqueda, pero Claude Code todavía contaba cero.

**Un sidecar no se activa** — para `backend: "openai"`, confirme que ha iniciado sesión en ChatGPT y Tener un habilitado `authMode: "forward"` proveedor. Porque `backend: "anthropic"`, confirme el activo almacenado
Anthropic OAuth La cuenta no está marcada `needsReauth`. Una selección explícita de Anthropic sin eso Credencial intencionalmente no se cierra.

**"Los conectores claude.ai están deshabilitados"** — An `ANTHROPIC_API_KEY` o `ANTHROPIC_AUTH_TOKEN` se establece en tu caparazón. `ocx claude` deliberadamente hace NOT conjunto `ANTHROPIC_API_KEY`Si lo tienes exportado, Lo he visto. `ocx claude` inyecta `ANTHROPIC_BASE_URL`, descubrimiento, auto-contexto y ranuras de modelo configuradas — pero nunca `ANTHROPIC_API_KEY`.

**Modelos que no aparecen en /modelo selector** — Verificar `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` es conjunto (automático con `ocx claude`) Correr `ocx claude` para actualizar la caché del modelo de puerta de enlace en
`~/.claude/cache/gateway-models.json`. Comprobar `claudeCode.enabled` no es `false`.

**Entorno estanco después del cambio de puerto** — Si se cambia el puerto proxy, los shells antiguos pueden tener un
`ANTHROPIC_BASE_URL`. Abra una nueva terminal o vuelva a ejecutarla `ocx claude`.

**techo de contexto 200k a pesar de gran modelo** — Seleccione el `[1m]` variante en el selector, o habilitar auto-context (activado por defecto). Si el selector no muestra `[1m]` fila, el contexto de catálogo efectivo del modelo ventana puede estar por debajo del piso fijo 829,800-token.

**Alto recuento de token a partir de cargas de habilidad** — El paquete `claude-api` habilidad (~136k tokens) auto-cargas en las menciones del modelo Claude. Esto es normal para el paso nativo; en modelos encaminados, opencodex stubs Por defecto (`blockedSkills: ["claude-api"]`).

**Los esquemas de herramientas MCP llenan el contexto en la primera curva** — Claude Code desactiva el aplazamiento de la herramienta MCP Siempre que `ANTHROPIC_BASE_URL` no es un host Anthropic de origen. El cheque está en la host, no el modelo, por lo que se aplica a todos los `ocx claude` sesión: con muchos conectores configurado, cada esquema de la herramienta se alinea antes de escribir cualquier cosa. Vuelva a habilitar el aplazamiento con:

```json
{ "claudeCode": { "toolSearch": true } }
```

Esto está desactivado por defecto porque solo vale la pena en **paso nativo Anthropic** Rutas. El aplazamiento es una optimización del lado del servidor, no una solicitud más pequeña: Claude Code todavía envía cada definición de la herramienta, y Anthropic de API es lo que mantiene los esquemas diferidos fuera del contexto del modelo y responde el `tool_search` herramienta de servidor con `tool_reference` bloques. Un traducido (enrutado) modelo nunca llega a esa maquinaria — opencodex deja caer el `tool_search` herramienta e ignora
`defer_loading` — para que el proveedor siga recibiendo todos los esquemas mientras Claude Code deja de contar y, por lo tanto, deja de compactarse. Con `claudeCode.compatibility: "enforce"` El mismo La solicitud es rechazada con 400 en su lugar. Enciéndelo cuando `ocx claude` se enruta a un Anthropic modelo; déjelo para rutas de terceros hasta que se admita el aplazamiento traducido.

Los valores aceptados siguen el propio analizador de Claude Code: `true`, `"auto"`, `"auto:N"` (N al menos 100) y `"force"`. Un valor que usted mismo exporta siempre gana sobre el inyectado.

**Subagente envía al modelo equivocado** — Lista de agentes (`ocx-*`) uso `<!-- ocx-route: ... -->`
directivas, no la herramienta del agente `model` argumento. Asegúrese de que la directiva coincida con el ruta. Pase `"haiku"` como modelo de referencia.

Establecer `claudeCode.stabilizePromptCache` a `true` en `config.json` Claude arnés posterior avisos de instrucciones del sistema en las rutas traducidas. Reconocido `<total_tokens>N tokens left</total_tokens>` pies se caen, incluyendo pies repetidos. Los recordatorios de TaskCreate aún se mueven a un mensaje de usuario final; si solo se pelaron los pies de página token, no se agrega ningún mensaje de entrada. El valor predeterminado es `false`. Habilitelo solo cuando este cambio de rol sea apropiado para sus clientes. Conserva ejemplos vallados y texto sin igual; el paso nativo Anthropic no cambia. A continuación, la clave prompt-cache sin metadatos sigue instrucciones estabilizadas. Esto no crea una identidad de conversación ni garantiza accesos a caché ascendentes.

En cada ruta de chat traducida, los recordatorios de la línea de tiempo mantienen su posición en el conversación, después de cualquier resultado pendiente de la herramienta. Esto evita que una nueva recordatorio de reescribir el indicador del sistema principal, y detiene una conversación a mitad La instrucción de llegar antes de los turnos que fue escrito para seguir. El papel que la ranura lleva se decide por separado: un recordatorio se envía como `system` a menos que el proveedor registra `foldDeveloperRoleToSystem: false`, que establece que el upstream acepta el `developer` papel y lo reenvía en la misma posición. Un upstream que no acepta respuestas `400 role 'developer' is not allowed`
y el turno nunca comienza, por lo que un destino no registrado se pliega. Esto se aplica con o sin
`stabilizePromptCache`, y el paso de Anthropic nativo no cambia. Caché La reutilización todavía requiere una identidad de sesión estable y disponibilidad de caché ascendente. Los cambios en las instrucciones o herramientas anteriores, y la compactación de la conversación, aún pueden afectar a los hits de caché; preservar el orden de recordatorio por sí solo no garantiza la reutilización.

<a id="intercept-token-recovery"></a>

### Interceptar la recuperación de token

El proxy autenticado en ejecución valida el token actual para cada nueva solicitud CONNECT. Una aplicación explícita de primera parte recrea una token faltante y actualiza la configuración de propiedad sin que requieren un reinicio proxy; los túneles existentes no se revocan. Inválido, vinculado, sobredimensionado o Los archivos que no son token se rechazan en lugar de sobrescribirse. Inspeccione dicha entrada antes de eliminar solo el archivo token obsoleto confirmado y aplicando el modo de primera parte nuevamente; nunca elimine su destino de enlace.

<a id="first-party-picker-context-markers"></a>

### Marcadores de contexto de selector de primera parte

El selector de pestañas de código de escritorio agrega `[1m]` a modelos enrutados cuya ventana de contexto de catálogo efectivo es al menos un millón de tokens o al menos el umbral de compactación predeterminado 829,800-token (por ejemplo, un modelo nativo GPT-6 optó por su ventana 872k), por lo que Claude utiliza su contabilidad 1M en lugar del modelo personalizado más pequeño. Los modelos Claude en una ruta Anthropic aún necesitan un genuino 1M. Las etiquetas, el orden del perfil y las rutas del proveedor permanecen sin cambios. Las ventanas desconocidas y más cortas permanecen sin marcar. El selector no puede garantizar que un corredor de escritorio o remoto reciba el entorno de compactación correspondiente, por lo que un modelo de ventana larga que supere su ventana real obtiene una `prompt is too long` error, que Claude Code responde compactando. Escritorio 3P `supports1m`/`prefer1m` y los subagentes generados siguen la misma regla. La configuración de contexto automático emparejado para `ocx claude` No ha cambiado. Una conversación existente mantiene su selector guardado hasta que vuelva a seleccionar el modelo en el selector actualizado.

<a id="forced-claude-code-subagent-model"></a>

### Modelo de subagente forzado Claude Code

La página Subagentes ofrece **Fuerza a todos los subagentes en un modelo**, fuera por defecto. Seleccione una identificación de estilo de lista expuesta, como `combo/tev-auto`A continuación, habilite el interruptor. La lista se ofrece primero; las entradas de la lista guardadas no disponibles no pueden ser objetivos forzados.

`ocx agent subagents force combo/tev-auto` conjuntos `claudeCode.subagentModelForce`; `ocx agent subagents force -` Lo aclara. `ocx agent status` informa el establecimiento. `GET /api/subagent-models` devoluciones `force`, `forceAvailable`, y `forceStatus`; `PUT` acepta `{ "force": "combo/tev-auto" }` o `{ "force": null }` Sin cambiar el roster. Omisión `force` Lo deja sin cambios. Los objetivos inválidos o no expuestos son rechazados en la escritura; los objetivos obsoletos son reportados y omitidos en el lanzamiento.

Esto tiene efecto en el **siguiente routed `ocx claude` lanzamiento**, inyección `CLAUDE_CODE_SUBAGENT_MODEL` como un alias proxy explícito (con `[1m]` cuando la ventana de catálogo efectiva alcanza los 829.800-token piso, y solo para una ventana genuina de 1M en Anthropic Claude modelos y bare `claude-*` selectores; los objetivos nativos Claude usan un alias nativo reversible) y `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. Cada variable no vacía exportada por el shell gana independientemente. Los lanzamientos nativos no inyectan ninguna variable; simple `claude` No se ve afectado. No hay archivos de plugin o `settings.json` son modificados por esta configuración.

Claude Code **2.1.257 o más reciente** es necesario para FORCE. Los argumentos del modelo Plugin y los agentes integrados (incluyendo Explorar/Plan) y por llamada se anulan. bifurcaciones y habilidades de subagente con `model: inherit` mantener el modelo de conversación principal. El bucle principal y los sidecars de pequeño-rápido no se ven afectados. Los archivos de la lista existentes permanecen disponibles.

El panel de control advierte sobre versiones antiguas o desconocidas de CLI, objetivos no disponibles y cualquier variable que ya esté presente en el sistema. `settings.json` → `env` (que anula env de lanzamiento). La detección es de solo lectura y local en el servidor: no puede inspeccionar otro shell de lanzamiento, otra máquina o la configuración local del proyecto. Un resultado desconocido no es prueba de apoyo a la fuerza.

Los selectores de puerta de enlace explícitos en una solicitud de agente generada tienen prioridad sobre su legado `ocx-route` fallback, incluso si la configuración de fuerza guardada cambia después del lanzamiento. Para shell o configuración anuladas de agentes de lista generados, use un alias de puerta de enlace explícito; los ids Claude desnudos conservan el comportamiento de respaldo del cliente antiguo. Los alias nativos restauran su modelo desnudo antes de las verificaciones de credenciales y mapas de modelo existentes. Los lanzamientos conectados validan los objetivos de fuerza frente a un nuevo catálogo de puertas de enlace autenticadas; el descubrimiento fallido omite la inyección automática de fuerza y las ventanas de contexto en caché por sí solas nunca demuestran disponibilidad.
