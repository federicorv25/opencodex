---
title: "Proveedores"
description: "En todos los sentidos opencodex autentica y habla con un proveedor de LLM — OAuth, API clave, ChatGPT hacia adelante y local."
---

A **proveedor** es un punto final LLM ascendente más cómo llegar a él: un adaptador, una base URL, una autenticación modo y una lista de modelos opcional. Los proveedores viven bajo `providers` en `~/.opencodex/config.json`.

La vista general del proveedor del panel de control separa los detalles de conexión, el uso de la cuenta y las notas editables. Las notas aparecen una vez, debajo de las secciones de conexión y autenticación. Preconfiguración de patrocinador compatibles también muestran una breve introducción, una etiqueta de patrocinador y enlaces al sitio o consola del proveedor. Estos enlaces conservan los parámetros de referencia del preset. La información del patrocinador se muestra solo cuando el nombre de proveedor configurado, adaptador y punto final coinciden con el preset; nunca cambia el enrutamiento, selección de cuenta o valores predeterminados.

<a id="openai-account-modes"></a>

## Modos de cuenta OpenAI

| Id de proveedor | Uso | Regla de credenciales/cuenta |
| --- | --- | --- |
| `openai` | Codex inicio de sesión | Pool(predeterminado) selecciona las cuentas principales más agregadas; Direct utiliza el inicio de sesión actual de la persona que llama/principal solamente. |
| `openai-apikey` | OpenAI API | Solo se configura el grupo de claves/claves API; nunca lee cuentas Codex. |

Usar desnudo `gpt-5.6-sol` con la opción Pool/Direct en la página Proveedores, o
`openai-apikey/gpt-5.6-sol` para API. Las rutas de credenciales nunca se cruzan entre sí. La ruta API publica 1,050,000 metadatos de entrada de contexto / 922,000 máximos. Es
`sol-pro`, `terra-pro`, y `luna-pro` Los identificadores virtuales mantienen su identidad pública seleccionada mientras el cable utiliza el modelo base plus `reasoning.mode: "pro"`.

Si el `openai` proveedor falta o está deshabilitado, el selector de cuentas del panel y Codex Auth page puede restaurarlo: las filas ausentes se crean a partir del preajuste canónico, canónica deshabilitada Las filas se vuelven a habilitar sin necesidad de reemplazar los configuración del modelo o modo guardado, y los configuración no canónicos. `openai`
no se ofrecen filas que la ruta de recuperación.

La compatibilidad de Luna Reserve es un ChatGPT La capacidad de la cuenta en lo canónico OpenAI El camino, no un OpenAI APISu selector principal almacenado manual requiere un modo de escritorio local sin authless efectivo y un permiso de flujo ascendente vinculado a credenciales actual; una entrada de catálogo sola no autoriza una solicitud. Ver [Luna Reserve junto a modelos enrutados](/es/reference/cli/providers-accounts/#luna-reserve-alongside-routed-models)
para la configuración, el orden de reinicio, los requisitos de autorización y los ayudantes no compatibles.

Para agregar una cuenta con cuota agotada y finalizar su validación diferida, consulte
[Codex calentamiento de la cuenta](/es/guides/codex-integration/#codex-account-warmup).

<a id="providers-overview-pool-capacity"></a>

### Capacidad de la grupo

Para el inicio de sesión de Codex en el modo Pool, la descripción general de los proveedores muestra una estimación del peso configurado del La capacidad utilizada por el grupo en lugar de presentar una cuenta arbitraria como el total del proveedor. El mismo fila también muestra el porcentaje de cuota bruta de la cuenta efectiva actual, para que pueda distinguir el Estimación de la cuenta que una nueva solicitud usaría.

Cuando la información de restablecimiento está disponible, el resumen muestra el siguiente tiempo de restablecimiento y la capacidad que Se espera que el reset se recupere como `+N% pool capacity`. **Cobertura incompleta** significa una o más grupos cuentas no podrían contribuir de manera segura a la estimación, por ejemplo, porque su plan o desconocido, su lectura es rancia, o el relato está pausado o necesita reautenticación.

A **Cobertura de ventana parcial** advertencia significa que algunas cuentas incluidas informaron una ventana de cuota, pero No otro. La visión general mantiene esas ventanas separadas y marca cada ventana afectada incompleta en lugar de tratar la lectura faltante como uso para esa ventana.

Esta estimación es solo de visualización. No cambia la selección de cuentas, afinidad de sesión, conmutación, tiempos de reutilización o cualquier otra decisión de enrutamiento. Utilice el [Codex Grupo de cuentas de Autonomía](/es/guides/web-dashboard/#codex-auth-and-account-pools)
para el estado de la cuenta individual y los controles de enrutamiento.

Las configuración v1 enviadas migran automáticamente al marcador 2 y a una fila consciente de las opciones. La configuración original Se mantiene una vez en `~/.opencodex/config.json.pre-openai-tiers-v2.bak`; restaurarlo con
`cp ~/.opencodex/config.json.pre-openai-tiers-v2.bak ~/.opencodex/config.json`.

<a id="claude-opus-55-progress-updates"></a>

## Claude Opus 5.5 actualizaciones de progreso

Cuando el `anthropic` adaptador envía Claude Opus 5.5 a `api.anthropic.com` (OAuth o API clave), OpenCodex solicita Anthropic [Modo de visualización de actualización de progreso](https://platform.claude.com/docs/en/build-with-claude/thinking#progress-updates). Las actualizaciones de progreso y los reconocimientos a mitad de giro aparecen como comentarios de asistente visibles en Codex, Incluso cuando los resúmenes de pensamiento están ocultos. Los resúmenes de razonamiento se omiten en este modo porque Anthropic no puede distinguir las actualizaciones de progreso del razonamiento bajo `display: "summarized"`. Los bloques de pensamiento firmados originales se conservan para la continuación de la herramienta; no se descodifica ninguna firma. o reescrito. Las actualizaciones aparecen una vez que se completa su bloque firmado. Otros modelos y compatibles Los puntos finales de terceros conservan su comportamiento de visualización de pensamiento existente.

<a id="anthropic-image-input"></a>

## Entrada de imagen Anthropic

Las semillas de modelo Claude incorporadas anuncian la entrada de texto e imagen para ambos `anthropic` (OAuth) y
`anthropic-apikey`, consistente con [Resumen de modelos de Anthropic](https://platform.claude.com/docs/en/models/overview). Las anulaciones explícitas por modalidad de entrada por modelo siguen siendo autorizadas; no se asumen modelos desconocidos capacidad de imagen. Esto se aplica a todas las integraciones donde la configuración del cliente soporta la imagen. Metadatos de capacidad: OpenClaw exporta un valor declarado `input` array y Kimi Exportaciones de código
`capabilities: ["image_in"]` solo para modelos con capacidad de imagen. OpenClaw omite `input` cuando no se soporta se declaran las modalidades; Kimi omite `capabilities` para modelos desconocidos o de solo texto. Clientes sin un campo de capacidad soportado mantenga su forma de configuración existente. Después de actualizar opencodex, regenerar o actualizar la configuración del cliente administrada por opencodex para recibir los metadatos actualizados.

<a id="replayed-anthropic-thinking-signatures"></a>

## Firmas de pensamiento Anthropic reproducidas

En el punto final Responses, un flujo ascendente compatible con Anthropic puede rechazar una repetición del pensamiento porque pertenece a un prefijo de conversación diferente. Cuando el error explícitamente identifica este problema de firma vinculante, opencodex puede eliminar el pensamiento firmado / redactado reproducido y vuelva a intentarlo una vez dentro del presupuesto de envío de la solicitud. Esto cubre los rechazos de HTTP 400 y el flujo inicial errores antes de la actividad de salida o herramienta. La búsqueda web alojada y los puentes de imagen / video comparten una recuperación límite a través de sus iteraciones del modelo: solo se reenvía la inferencia rechazada, mientras se completa el sidecar Se conservan las llamadas y los resultados de la herramienta. Un reintento de terminación vacía comparte la asignación de su solicitud; Las continuaciones ordinarias después de la salida no pueden usarlas. El reemplazo fallido es Sin embargo, volvió sin otra firma. Otros errores mantienen su manejo existente.

La recuperación de Sidecar se desactiva cuando la contabilidad de gastos impuesta no puede establecer recibos para cuentas anteriores. Sidecar ordinario envía. Nunca aumenta la asignación de llamadas o envío combinado.

Sólo una finalización exitosa y no vacía recuerda el rechazo de esa conversación y servicio. identidad durante cinco minutos. Solo se suprimen las cargas útiles opacas rechazadas cuando pueden identificado; el pensamiento recién emitido sigue siendo reproducible. El historial de texto sin formato permanece disponible; un reintento fallido o cancelado lo hace no deshabilitar la repetición de pensamiento en solicitudes posteriores.

<a id="auth-modes"></a>

## Modos de autenticación

Las configuración del proveedor aceptan tres `authMode` valores (`key` es el valor por defecto). El registro incorporado también etiqueta los preconfiguración locales por separado; los que normalmente omiten ambos `authMode` y `apiKey`.

| `authMode` | Cómo se autentica | Utilizado por |
| --- | --- | --- |
| `key` | Envía su clave API (`Authorization: Bearer …`, o `x-api-key` / `api-key` ej., por adaptador). La clave puede ser literal o `${ENV_VAR}` referencia. | La mayoría de los proveedores. |
| `forward` | Relés **sus cabeceras de autenticación Codex entrantes** Verbatim al proveedor — ninguna clave almacenada. Este es el paso de inicio de sesión ChatGPT. | OpenAI (`openai-responses` adaptador). |
| `oauth` | Resuelve un acceso OAuth almacenado token (actualizado automáticamente antes de la expiración) y lo utiliza como clave portadora. | xAI, Anthropic, Kimi, Kiro, Google Antigravedad, Cursor, Zed Hosted AI, Código de comando, GitHub Copiloto, Nous Portal. |

Los [`retryOn429`](/es/reference/configuration/) La repetición 429 de la misma clave solo se aplica a API-key proveedores (`authMode: "key"`). OAuth, se excluyen los configuración preestablecidos directos y locales — Sus credenciales nunca deben ser reproducidas en la misma tokenEs opt-in: cuando la opción está ausente, la función está desactivada; la presencia de objetos la habilita a menos que la opción no esté disponible. `enabled: false`.

Cuando se habilita la selección de clave de round-robin, las solicitudes en cola vuelven a verificar los tiempos de reutilización de la clave antes de enviar y adquieren capacidad de estimulación para cualquier clave de reemplazo. Esto se aplica a Chat nativo, Messages, Responses y compacto. Esperar la capacidad de la clave de reemplazo no consume el tiempo de espera del encabezado de respuesta ascendente. El ritmo por tecla y el round-robin usan HTTP/SSE protegido incluso cuando WebSockets de origen están habilitados; La dirección e inyección solo para WebSocket requieren una ruta sin esas políticas clave. Esto no cambia la clave activa guardada. Un giro ascendente establecido mantiene su credencial; los envíos posteriores se rechazan si esa clave se enfría. El rechazo de clave de pre-salida puede recuperar una clave sana dentro del límite de solicitud existente. Direct Las imágenes y las solicitudes compactas graban los tiempos de reutilización genuinos 401/429 sin reproducir el POST de pago.

<a id="anthropic-api-key-credit-exhaustion"></a>

### Anthropic API-agotamiento de crédito clave

Anthropic Los grupos de teclas API con al menos dos teclas intentan automáticamente una tecla hermana cuando una HTTP completa `400` o `402` error indica que el saldo de crédito es demasiado bajo para acceder a la Anthropic API. Esto se aplica a `invalid_request_error`, `billing_error`, y `permission_error` antes de cualquier salida de texto o herramienta. Las estrategias de rotación y agrupación de claves omiten la clave fallida durante una hora, porque un saldo vacío solo se borra cuando se agregan créditos; cuando cada clave está fuera de crédito, las solicitudes aún usan la clave activa y devuelven el error original de Anthropic; elegir la clave como activa en el panel de control o reiniciar el proxy, borra esa retención después de una recarga. El reemplazo envía compartir el límite de envío de la solicitud. Ordinario `400` Los errores permanecen en el terminal, y esto no permite reintentos de la misma clave ni cambiar el enrutamiento de la cuenta OAuth. Una anulación de encabezado que envía una credencial diferente no puede enfriar o rotar la clave de grupo seleccionada.

<a id="which-account-a-request-spends"></a>

### Que cuenta gasta una solicitud

La pregunta que la gente hace antes de conectar una cuenta es si opencodex se basará en el suscripción que el inicio de sesión ya paga, o facturar una cuenta API separada. La respuesta sigue al
`authMode` más arriba que el nivel de marketing del vendedor.

- `forward` — el inicio de sesión ChatGPT. La solicitud lleva su credencial Codex, por lo que gasta la Plan ChatGPT detrás de ese inicio de sesión e informa de las ventanas de cuota Codex de ese plan. Qué ventanas existen es dependiente del plan: no todos los planes tienen una ventana de cinco horas. Nunca lee una clave API.
- `oauth` — un inicio de sesión de suscripción. La solicitud lleva un acceso almacenado token, por lo que gasta lo que sea cuenta que ha iniciado sesión como, y opencodex informa de cualquier ventana de uso que el proveedor expone.
- `key` — la solicitud lleva la clave que proporcionó, por lo que el uso aterriza en la cuenta que posee esa clave, en los propios términos de esa clave. Eso es uso medido para una cuenta de pago por uso API, pero un plan cuando la llave *es* una suscripción: Z.AI GLM Coding Plan, Kimi Code, la codificación BigModel CodeBuddy, Command Code y Plan venden uno de esa manera.

Una solicitud utiliza exactamente uno de estos, y opencodex no se devuelve de uno a otro. Cuando un La credencial OAuth no se puede resolver, la solicitud falla con un error de autenticación en lugar de alcanzar una clave almacenada, y la conmutación por error de grupo de claves que responde a un 429 o un 401 se rechaza completamente para proveedores OAuth y de reenvío.

Dos excepciones vale la pena conocerlas porque puedes golpearlas:

- `xai` y `github-copilot` aceptar `authMode: "key"` mismo proveedor, y si ese proveedor ya tenía una clave almacenada, corriendo `ocx login` porque puede dejarlo en modo clave en lugar de cambiarlo a la suscripción. Lo que cambia es: una `xai` clave retargets el proveedor a `https://api.x.ai/v1`, por lo que una cuenta diferente paga, mientras que un `github-copilot` La clave sigue siendo un Credencial de copiloto contra `api.githubcopilot.com`, por lo que la suscripción Copilot paga de cualquier manera.
- `orcarouter-oauth` es un flujo de consentimiento que acuña una propiedad del usuario `sk-orca-…` Llave API. Una vez que lo ha hecho, la solicitud lleva una clave, por lo que sigue el `key` regla anterior.

<a id="providers-that-accept-both-a-login-and-a-key"></a>

#### Proveedores que aceptan tanto un inicio de sesión como una clave

| Proveedor | Inicio de sesión de suscripción | Clave API |
| --- | --- | --- |
| OpenAI / ChatGPT | `openai` — Codex inicio de sesión; gasta el plan ChatGPT detrás de él | `openai-apikey` — un proveedor independiente; el uso aterriza en la cuenta de la plataforma OpenAI que posee la clave |
| Anthropic | `ocx login anthropic` — inicia sesión como su cuenta Claude. opencodex lee sus ventanas de uso de cinco horas y siete días; ese punto final no informa ningún nivel de suscripción | `anthropic-apikey` — directo Anthropic API facturación, sin suscripción Claude |
| xAI | `ocx login xai` — la pasarela de suscripción Grok CLI. opencodex lee los créditos semanales de SuperGrok, o el grupo mensual | El mismo `xai` proveedor con `authMode: "key"`, que tiene como objetivos `https://api.x.ai/v1`, por lo que el uso aterriza en esa cuenta API |
| Kimi | `ocx login kimi` — inicie sesión con su cuenta Kimi. `kimi-responses` es el mismo inicio de sesión de la cuenta Kimi enrutado a través del cable OpenAI Responses (pensando que el contenido permanece cifrado en el lado del servidor, las llamadas a herramientas permanecen visibles; el preajuste predeterminado de Chat mantiene el razonamiento de texto plano) | `kimi-code` — la forma de clave API del mismo transporte del plan de código Kimi |
| Código de comando | `ocx login command-code` — opencodex lee ventanas de cinco horas y semanales más un saldo de crédito | `commandcode` — el mismo servicio `/provider/v1` con una llave |
| GitHub Copiloto | `ocx login github-copilot` — requiere una suscripción activa de Copiloto | El mismo `github-copilot` proveedor con `authMode: "key"`. El flujo de dispositivos anterior es la ruta admitida, y cualquiera de las credenciales es una Copilot, por lo que la suscripción aún paga |
| OrcaRouter | `ocx login orcarouter-oauth` El consentimiento de — acuña una propiedad del usuario, de larga duración `sk-orca-…` clave, y la petición lleva entonces una clave | `orcarouter` — la misma clave pegada a mano |
| Meta Muse | `ocx login meta-muse` puede importar una clave local de código Muse CLI o iniciar el inicio de sesión del dispositivo. Meta alcances de esa credencial a su propio CLI, por lo que este es un uso no compatible: cómo se liquidan las llamadas no es observable desde el API, y debe tratar cada llamada como facturable en su cuenta | `meta-model` es la ruta soportada — cada llamada se mide por token, y una suscripción de código Muse no funciona allí |

Cursor, Kiro, Zed Hosted AI y Nous Portal son solo de inicio de sesión y no tienen equivalente de clave API. Google Antigravedad es Solo login también: `ocx login google-antigravity` inicia sesión con tu cuenta de Google a través del código de la nube Auxiliar de alambre, y el `google` preset al lado de él es el AI Studio Gemini API — un producto diferente alcanzado con su propia clave, no un modo de clave para el mismo inicio de sesión. La pestaña Cuentas antigravedad muestra un nivel de membresía observado como una insignia al lado de la cuenta etiqueta, usando el ID de nivel ascendente (por ejemplo `free-tier` o `gemini-pro`) No aparece ninguna insignia cuando el plan es desconocido; no afecta el enrutamiento o la cuota.

Gemini 4 Argón (`gemini-4-argon`) aparece en el `google` preset con bajo, medio (el por defecto), y altos niveles de pensamiento. Google lo ofrece solo en el nivel de pago Gemini API, no en el gratuito nivel. En marcha `google-antigravity`, Argon aparece con los mismos tres niveles, que se asignan a la
`gemini-4-argon-low`, `-medium`, y `-high` modelos de alambre. Google lo limita allí a AI Ultra y Cuentas Enterprise elegibles. Cloud Code Assist solo sirve Argon para el cliente Antigravedad CLI, por lo que OpenCodex envía solicitudes de argón y descubrimiento de modelos con el agente de usuario CLI (`antigravity/cli/1.3.4`) y mantiene el agente de usuario IDE para todos los demás modelos.

En Vertex AI, `gemini-4-argon` recibe imágenes devueltas por herramientas, como capturas de pantalla, dentro la respuesta de la función coincidente. Esto evita el error 400 de origen "Solicitudes que terminan con un no se admiten" después de una llamada a la herramienta de producción de imágenes mientras se conservan las imágenes. Las imágenes de resultados duplicados o resultados sin una llamada coincidente se conservan en un archivo separado. mensaje después de las respuestas de la herramienta, con un marcador que explica que no se pueden emparejar. No se necesita ningún cambio de configuración; este manejo es específico para Vertex Argon.

Para Gemini en Antigravedad, incluyendo Argón, los resúmenes de pensamientos marcados por el proveedor permanecen separados de la respuesta: Responses utiliza elementos de resumen de razonamiento, Chat Completions utiliza
`reasoning_content`, y Messages utiliza `thinking` bloques. Los clientes deciden cómo mostrar esos campos. Un cliente Responses puede solicitar `reasoning.summary: "none"` para suprimir los resúmenes; Esto no desactiva el razonamiento interno del modelo. Una firma de pensamiento es continuación metadatos y puede acompañar al texto ordinario, por lo que su presencia por sí sola no oculta ese texto. OpenCodex conserva el texto de respuesta sin marcar incluso cuando su redacción suena como planificación o análisis.

Los modelos Gemini, en particular el argón, a veces se saltan el pensar en un turno de llamada de herramientas y escriben sus planificación en el texto de progreso visible, por ejemplo, una línea de progreso seguida de "Leamos google.ts siguiente." Una vez que el texto se envía de vuelta como historia, el modelo tiende a repetir el patrón en cada vuelta posterior. Para evitar que se propague, OpenCodex envía Gemini solo la primera oración de el texto que llegó antes de una llamada de herramienta en giros anteriores. Las respuestas finales se envían de vuelta en su totalidad, y lo que muestra su cliente no se cambia.

El incorporado `google-antigravity` la lista de modelos es Gemini 3.8 Flash (`gemini-3.8-flash`), Gemini 4 Argón (`gemini-4-argon`), Claude Opus 5.5`claude-opus-5-5`), y Claude Soneto 5.5 (`claude-sonnet-5-5`), cada uno con esfuerzos bajos, medios y altos. Lo que realmente ves es tu descubrimiento de modelo propio de la cuenta, porque Google habilita modelos por cuenta: algunas cuentas lista Claude Soneto 4.6 y Claude Opus 4.6 (Pensamiento), otros solo Claude Opus y Soneto 5.5 (directamente ej., facturados, planes Pro o Ultra sin prueba) y Gemini 4 Argon solo en Ultra y Enterprise. Tanto Claude generations map: 4.6 toma su esfuerzo como un nivel de pensamiento, 5.5 como su `-low`, `-medium`, o
`-high` modelo. Con varias cuentas antigravedad y `oauthAccountFailover.enabled`, una solicitud prefiere una cuenta cuyo descubrimiento enumere el modelo solicitado. Selecciones guardadas de modelos que se fueron la lista sigue routing como antes.

Para comprobar qué modo está utilizando realmente un proveedor, ábralo en la página Proveedores: el **Conexión**
Bloque **Autenticación** fila lee `OAuth`, `API key`, `ChatGPT passthrough`, `Local`, o
`No key needed`. Es una configuración a nivel de proveedor, por lo que las filas de la cuenta debajo de ella no lo repiten.

<a id="1-chatgpt-login-forward--passthrough"></a>

## 1. Inicio de sesión ChatGPT (adelante / paso)

Los `openai` proveedor necesita **sin clave API**. Direct reenvía credenciales desde su cuenta existente
`codex login`; Pool resuelve una cuenta principal o agregada de Codex antes de usar el mismo backend:

```json
{
  "openai": {
    "adapter": "openai-responses",
    "baseUrl": "https://chatgpt.com/backend-api/codex",
    "authMode": "forward"
  }
}
```

Solo se reenvía un conjunto curado de encabezados (`FORWARD_HEADERS`: autorización, ChatGPT ID de cuenta,
OpenAI beta/originador/sesión — ver [Adaptadores](/es/reference/adapters/)) Este camino también es ¿Qué potencia el [web-search y sidecars de visión](/es/guides/sidecars/).

El catálogo de pasos ChatGPT también se superpone en las babosas desnudas GPT-5.6 Sol/Terra/Luna (`gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`) para las cuentas que pueden usarlos.

<a id="2-account-login-oauth"></a>

## 2. Inicio de sesión de la cuenta (OAuth)

Los configuración preestablecidos del proveedor pueden usar el inicio de sesión de la cuenta —, incluido GitHub puente de flujo de dispositivos. opencodex almacena sus credenciales en
`~/.opencodex/auth.json`; tokens actualizable se refrescan automáticamente, mientras que las llaves duraderas son reutilizadas hasta que el proveedor las revoque. `ocx login codex` También es aceptado, pero no es uno de los estos proveedores: dirige al grupo de cuentas Codex — el mismo flujo que `ocx account login codex`, que mantiene su propio libro de cuentas y necesita un proxy en ejecución. `chatgpt` y `openai` Los alias de esa ruta.

```bash
ocx login xai          # xAI Grok
ocx login anthropic    # Anthropic Claude (Pro/Max)
ocx login kimi         # Moonshot Kimi
ocx login nous         # Nous Portal (device grant; free + paid models)
ocx login kiro         # import kiro-cli credentials (or token fallback)
ocx login google-antigravity
ocx login cursor       # standalone Cursor PKCE login
ocx login zed          # Zed native-app callback login (experimental)
ocx login command-code # Command Code browser OAuth (or import ~/.commandcode/auth.json)
ocx login orcarouter-oauth # OrcaRouter browser consent + PKCE
ocx login devin       # Cognition/Devin: import Devin CLI credential, else Auth0 browser sign-in
ocx login dsh-account # DeepSeek Harness Desktop (import ~/.dsh/.credentials.yaml grant)
ocx login github-copilot  # GitHub device flow → Copilot token (Copilot account)
ocx login codex        # Codex account pool (aliases: chatgpt, openai; needs a running proxy)
ocx logout <provider>
```

| Proveedor | Adaptador | URL base | Notas |
| --- | --- | --- | --- |
| `xai` | `openai-chat` | `https://cli-chat-proxy.grok.com/v1` | OAuth utiliza la pasarela de suscripción independiente Grok CLI. La anulación de la clave API utiliza `https://api.x.ai/v1` y puede inyectar procesamiento prioritario. Catálogo en vivo primero Grok; `grok-4.5` es el valor predeterminado de reserva. |
| `anthropic` | `anthropic` | `https://api.anthropic.com` | Modelos Claude; lista de modelos en vivo obtenida de `/v1/models`. |
| `kimi` | `openai-chat` | `https://api.kimi.com/coding/v1` | Modelos de codificación del plan de código Kimi. Por defecto al stable `kimi-for-coding` alias (actualmente K2.8 Vista previa): ventana de contexto 1M-token, ajustable `low`/`high`/`max` Pensamiento (predeterminado) `max`), texto + entrada de imagen. Jubilado `kimi-k2.x` las selecciones se migran al alias en la actualización. |
| `kimi-responses` | `openai-responses` | `https://api.kimi.com/coding/v1` | Mismo inicio de sesión de cuenta Kimi (reutiliza el `kimi` OAuth credencial) sobre el cable OpenAI Responses. El mismo modelo y capacidades que `kimi`; pensando que el contenido permanece encriptado en el servidor, las llamadas a herramientas y los resultados permanecen visibles. |
| `nous` | `openai-chat` | `https://inference-api.nousresearch.com/v1` | Nous Research pasarela de suscripción (el mismo backend que usa Hermes Agent). Device-grant inicio de sesión contra `portal.nousresearch.com`; el acceso token es la inferencia por solicitud JWT. Pago mixto + `:free` catálogo de modelos (`tencent/hy3:free`, `stepfun/step-3.7-flash:free`, ...) descubierto en vivo desde la cuenta iniciada. Actualizar tokens son de un solo uso y rotado en cada actualización. |
| `kiro` | `kiro` | `https://runtime.us-east-1.kiro.dev` | Los botones de inicio de sesión y agregar cuenta del panel de control ofrecen Builder ID, Google, inicio de sesión del dispositivo GitHub o Kiro CLI. Inicio de sesión nativo del dispositivo agrega una cuenta sin firmar `kiro-cli` fuera. La opción Kiro CLI importa o inicia una sesión CLI; su flujo de trabajo Agregar cuenta cambia temporalmente la cuenta CLI y la restaura en caso de cancelación o falla. |
| `google-antigravity` | `google` | `https://daily-cloudcode-pa.googleapis.com` | Google OAuth sobre el cable de Cloud Code Assist. El descubrimiento en vivo utiliza el autenticado de CCA `v1internal:fetchAvailableModels` Endpoint y publica los modelos de agente disponibles para la cuenta iniciada; el catálogo mantenido sigue siendo la reserva. |
| `cursor` | `cursor` | `https://api2.cursor.sh` | Experimental inicio de sesión PKCE, transporte vivo HTTP/2 con una ruta de compatibilidad opt-in HTTP/1.1 y descubrimiento de modelo filtrado por cuenta. |
| `zed` | `zed` | `https://cloud.zed.dev` | Experimental Zed Hosted AI bridge. Utiliza la aplicación nativa de Zed RSA callback, cambia la cuenta token por una breve inferencia hospedada token, y descubre la lista en vivo de la cuenta. |
| `orcarouter-oauth` | `openai-chat` | `https://api.orcarouter.ai/v1` | Consentimiento del navegador y uso de intercambio de claves `https://www.orcarouter.ai` con S256 PKCE El usuario devuelto `sk-orca-…` La clave API se almacena en el almacén de credenciales existente y se reutiliza hasta que se revoca. |
| `devin` | `devin` | `https://server.codeium.com` | Experimental no oficial Cognición/Puente Devin. Login primero importa la credencial que ya tiene instalada Devin CLI (`devin auth login` escribe un `devin-session-token` a su propio `credentials.toml`); cuando no está presente, abre el inicio de sesión del navegador Auth0 e intercambia la token pegada a través de Cognition's `RegisterUser` para una clave API de larga duración. `ocx login devin-cli` Se mantiene como un alias obsoleto. Los modelos se descubren por cuenta con `GetCascadeModelConfigs`. Cuota de cuenta viene de `GetUserStatus` menos de una solicitud de ocho segundos y fecha límite del cuerpo: ventanas diarias y semanales con fecha, más el fondo de crédito rápido y flexible mensual para un plan de crédito facturado o una estrategia desconocida con ambas fechas de reinicio ausentes cuando está presente un campo de saldo. Los créditos usados negativos omiten la ventana mensual; los créditos válidos disponibles cero lo marcan agotado. Una sonda de tiempo de espera mantiene la última cuota buena. No se muestra en el panel de control predeterminado. Los informes de chat y uso se verifican con una cuenta real en tres modelos. |
| `dsh-account` | `dsh-account` | `https://api.deepseek.com/anthropic` | Proveedor experimental de cuentas de importación primero que reutiliza una cuenta de escritorio instalada e iniciada DeepSeek Harness (DSH). Lee las credenciales estrictamente de solo lectura de `~/.dsh/.credentials.yaml` sobre la importación explícita. Independiente de la facturación de claves DeepSeek API. |
| `github-copilot` | `openai-chat` | `https://api.githubcopilot.com` | Experimental. GitHub flujo de dispositivos + `copilot_internal` intercambio (cliente de código VS OAuth). Requiere una suscripción activa de Copiloto; no un API oficial de terceros. |

Google Antigravedad agrupa un modelo completo `low` / `medium` / `high` variantes en una sola entrada con un selector de esfuerzo. Esto incluye Claude Opus y Sonnet 5.5 y futuras versiones descubiertas durante la actualización automática. Los conjuntos parciales permanecen separados. Las opciones existentes activadas/deshabilitadas se incluyen en la entrada agrupada; los modelos genuinamente nuevos aún siguen su política de Nuevo modelo. Los ID de sufijo guardados continúan solicitando su nivel original. El enrutamiento de esfuerzo agrupado sobrevive a un reinicio proxy cuando el descubrimiento del modelo no está disponible temporalmente. Una sesión Codex en ejecución puede necesitar recargar su lista de modelos después de actualizar el catálogo. Grupos de uso conocidos Claude Sonnet y Opus 5.5 bajo su modelo base, incluyendo registros históricos de nivel. Sus costos mostrados son estimaciones de referencia derivadas de Anthropic, no cargos de suscripción antigravedad.

Google Las sondas de cuenta antigravedad y cuota de proveedores utilizan puntos finales de contabilidad Google fijos, incluidos los modelos alternativos. Soportan el falso IP transparente DNS para esos destinos al tiempo que retienen la verificación TLS, el rechazo de redireccionamiento y las verificaciones de direcciones privadas. Una base de proveedores personalizada URL cambia las solicitudes de modelo, no los destinos de cuota; `NO_PROXY` continúa seleccionando la política de ruta directa.

<a id="google-tool-schema-loss-diagnostics"></a>

### Google diagnósticos de pérdida de herramientas-esquema

Las declaraciones de la herramienta Google se compilan con la clase de punto final seleccionada. Cuando el debug del proveedor es en — `ocx debug provider on`, el panel Registros alterna, o `OCX_DEBUG=1` Pérdida de esquema — durante la compatibilidad La conversión en el omitido o `compatible` El camino de la política emite un `[ocx:google:google-tool-schema-loss]`
Grabación (cola con `ocx debug provider logs -f`) solo la versión del informe, clase de punto final, a `lossy` indicador, un recuento de incertidumbre limitada, categorías de pérdida fija con recuentos limitados y una bandera de truncamiento. Los nombres de herramientas y propiedades, rutas, valores y texto del esquema son Nunca incluido. Con una omitida o `compatible` Este diagnóstico observa la existencia de conversión sin rechazarla. Bajo `reject-lossy`, un inicialmente con pérdidas o indeterminado por comparación La compilación se rechaza antes del envío; no se emite ningún registro de pérdidas por separado para la solicitud rechazada. Bajo
`reject-lossy`, una reparación de Vertex o Cloud Code Assist que borraría las restricciones emite un código similar contenido-libre `google-tool-schema-repair` registrar y devolver el 400 original sin un envío modificado; con un omitido o `compatible` política, la solicitud reparada se reproduce como antes. Direct AI Studio nunca realiza esta reparación. Los esquemas de salida nativos están fuera de ambas rutas de política. Ver la
[referencia de comando debug](/es/reference/cli/agents/).


Después de un fallo de actualización Nous terminal, ejecute `ocx login nous` para reautenticar.

### Zed Hosted AI (experimental)

:::caution[No oficial: úsalo bajo tu responsabilidad]
Zed no proporciona ni respalda este puente. Reutiliza el modelo alojado de tu cuenta de Zed derecho fuera del editor de Zed, que puede estar fuera de los términos de servicio de Zed. Zed puede calificar Limitar, restringir o suspender la cuenta. Revise los términos actuales de Zed antes de iniciar sesión; el proveedor se queda fuera hasta que lo agregues y ejecutes `ocx login zed` y el dashboard pregunta Usted debe reconocer este riesgo antes de que comience el inicio de sesión.
:::

Ejecuta `ocx login zed` y complete el inicio de sesión en la aplicación nativa de Zed en el navegador. OpenCodex inicia un loopback callback, le da a Zed una clave pública RSA, y mantiene la clave privada local mientras la devolución de llamada devuelve la identidad de cuenta y el acceso cifrado token. El ID de la cuenta almacenada y token se emparejan en cada solicitud; OpenCodex intercambia esa credencial para el LLM de Zed de corta duración token antes de llamar `https://cloud.zed.dev/completions`.

La lista de modelos en vivo de Zed es de metadatos de visualización con alcance de cuenta. El identificador de modelo seleccionado se reenvía como proporcionado, y el puente infiere la familia de backend alojado de la fila en vivo o el nombre del modelo; El descubrimiento de modelos no es una lista permitida. El acceso Zed token no tiene un punto final de actualización, por lo que cuando Revocarlo, correr `ocx login zed` De nuevo.

Para los modelos OpenAI alojados en Zed, OpenCodex traduce `developer` Instrucciones para `system` mensajes y elimina los campos privados OpenAI y las herramientas integradas no compatibles, como `web_search`. La función y las herramientas personalizadas permanecen disponibles a través del delegado; una opción de herramienta sin herramientas compatibles se convierte en `none`.

Para los preconfiguración canónicos del Plan de codificación Kimi (`kimi` Inicio de sesión y `kimi-code` API clave), opencodex reenvía solo un establo suministrado por el llamante `prompt_cache_key` a la solicitud Chat Completions (el cable Responses acepta el mismo campo, pero opencodex no lo envía allí hoy); Nunca genera uno. Kimi documenta una clave de sesión/tarea estable según sea necesario para mejorar el Plan de código tasas de éxito de caché, mientras que las solicitudes sin una clave permanecen sin llave. Si una opción de arriba rechaza la campo, opencodex no lo despoja y reintenta o muta la configuración guardada. Otros proveedores permanecen Negar por defecto.

Kimi Nativo del código Responses ruta omite los mensajes del historial del asistente vacíos de contenido explícito para evitar `assistant must not be empty` rechazo. Texto no vacío, espacios en blanco, rechazos, Se conservan el razonamiento y las llamadas/resultados de herramientas; no se reescribe el historial del cliente almacenado. Un mensaje vacío referenciado por un `item_reference` en la misma entrada se retiene en lugar de dejar una referencia colgante.

Kimi Codificación precios de uso para `k3`, `k3[1m]`, y `k3-256k` son **API-estimaciones de referencia** a través
`kimi`, `kimi-code`, y `kimi-responses`, usando la tasa de escritura en caché de 5 minutos predeterminada publicada. No reproducen la facturación o cuota del Plan de Código: la variante 1M de K3 consume aproximadamente el doble de la cuota de `k3-256k`. `kimi-for-coding` ahora apunta a K2.8 Preview, por lo que su antiguo precio K2.7 ya no es utilizado; su estimación permanece indisponible a menos que el operador suministre `modelCosts`. Precio desconocido Por lo tanto, las políticas de enrutamiento y los límites de costos que excluyen estimaciones desconocidas pueden excluir este alias. Véase [Configuración del modelo de Kimi](https://www.kimi.com/code/docs/en/kimi-code/models.html) y
[Precios de API](https://platform.kimi.ai/docs/pricing/chat).

Una costumbre `openai-chat` proveedor puede optar por cuando sus documentos ascendentes soporten
`prompt_cache_key`:

```json
{
  "providers": {
    "example-compatible-provider": {
      "adapter": "openai-chat",
      "baseUrl": "https://api.example.com/v1",
      "apiKey": "${EXAMPLE_API_KEY}",
      "promptCacheKey": true
    }
  }
}
```

El adaptador reenvía la llave que se le da y nunca inventa una. Todavía puede recibir una clave El llamador no envió: Claude Messages traducción deriva uno de `metadata.user_id`, o de un cohorte de modelo/sistema/herramientas cuando el cliente no envía metadatos, porque el informe de backends OpenAI
`cached_tokens: 0` por cada vuelta sin llave. Por lo tanto, "enviado, no fabricado" describe este adaptador, No toda la ruta de solicitud.

Preservar el resto de la configuración del proveedor al agregar la opción, luego recargar o reiniciar opencodex. Para validar el almacenamiento en caché, compare la solicitud inicial en frío con las solicitudes posteriores que lleven el misma clave estable. Deje la opción omitida o configure `false` para de origen incompatibles, y desactivarlo o eliminarlo si una puerta de enlace estricta devuelve un error de campo desconocido HTTP 400.

También puede iniciar OAuth desde el [panel web](/es/guides/web-dashboard/).

<a id="logging-in-from-another-browser-profile-or-another-machine"></a>

### Iniciar sesión desde otro perfil de navegador u otra máquina

Cuando se inicia un inicio de sesión, el proxy abre la autorización URL en **Su propio** máquina, utilizando el sistema operativo navegador predeterminado — y, por lo tanto, el perfil predeterminado. Este es el comportamiento adecuado para un local escritorio y el incorrecto en dos casos comunes: necesita un perfil de navegador diferente (un ej., identidad, una segunda cuenta), o el panel de control está abierto contra un proxy que se ejecuta en otro lugar.

Cada superficie de inicio de sesión muestra la autorización URL con un botón de copia, el código del dispositivo cuando proveedor emite uno, y las instrucciones actuales. Los flujos de devolución de llamada del navegador también muestran un campo pegar el redireccionamiento URL o código de autorización de nuevo. Durante la aprobación del dispositivo, ese campo está oculto: introduzca el código mostrado en la página de verificación del proveedor. Si el proveedor cambia Para la entrada manual, el panel reemplaza el código antiguo y las instrucciones en su próxima encuesta de estado.

Si el proxy intenta abrir un navegador y no puede, el inicio de sesión lo dice por encima de la URL y mantiene going: abre la página de inicio de sesión desde el enlace o cópialo. Un inicio de sesión del dispositivo nunca abre un navegador por propio; **Copiar código & abrir** copia el código y abre la página de verificación con un solo clic, y el panel de control sigue esperando mientras el código del proveedor siga siendo válido. En la aplicación de escritorio estos enlaces se abren en su navegador predeterminado.

Para evitar que el proxy abra un navegador, marque **No abra un navegador en la máquina proxy**
junto al botón de inicio de sesión, o configúralo permanentemente:

```json
{ "oauthOpenBrowser": false }
```

Ausente y `true` ambos abiertos, por lo que nada cambia para una instalación existente; solo un
`false` declina. `POST /api/oauth/login` y `POST /api/codex-auth/login` También acepta un por solicitud `openBrowser` booleano que anula la configuración almacenada para ese inicio de sesión.

Dos casos se comportan de manera diferente, y vale la pena saber en qué estás:

- **Un perfil de navegador diferente en la misma máquina** Solo funciona con el enlace copiado. Los Loopback callback encendido `127.0.0.1` Todavía completa el flujo.
- **Un flujo de devolución de llamada del navegador en una máquina diferente** también necesita el retroceso de la pasta, porque la redirección URI es todavía `http://127.0.0.1:<port>/callback` en el host del proxy. Termina el inicio de sesión allí, luego pega redireccionar URL (o simplemente el código) de nuevo al panel o `ocx account code`.

Los proveedores de código de dispositivo nunca abren un navegador desde el proxy en cualquier caso: muestran un código y una verificación URL para abrir donde quiera que haya iniciado sesión.

<a id="headless-claude-login-code-display-mode"></a>

### Inicio de sesión Claude sin cabeza (modo de visualización de código)

Para Anthropic hay una ruta más limpia que pegar una redirección muerta: la **code-display** inicio de sesión. Anthropic redirige a su propia página y muestra una `code#state` En lugar de llamar a la Proxy, así que nada tiene que llegar `127.0.0.1` en el host del proxy.

```bash
ocx login anthropic --headless
```

Sobre la administración API, comience con `POST /api/oauth/login` y `{"provider":"anthropic","mode":"code"}`; La respuesta lleva a `flowId` y un `expiresAt` (10 minutos). Enviar la cadena pegada a
`POST /api/oauth/login/code` con eso `flowId`. La respuesta es el resultado del intercambio token —
`{"ok":true,"account":…}` o `{"ok":false,"error":…}` — para una llamada alojada con un solo cuadro de pegado sabe si el login realmente funcionó. Una pasta con el estado equivocado, o sin código en ella, es rechazado antes de cualquier solicitud token y deja el flujo abierto para otro intento; una El intercambio token usa el flujo hacia arriba, así que inicie un nuevo inicio de sesión si ese intercambio falla.

Solo `anthropic` y `anthropic2` Apoyar este modo; otros proveedores responden `code_mode_unsupported`. Varios códigos los inicios de sesión pueden estar en vuelo a la vez, cada uno fijado a su `flowId`pero todos escriben la misma cuenta almacén: el más reciente exitoso se convierte en la cuenta activa Claude. Esto es para un operador en un host sin cabeza, no para aislar usuarios no relacionados en una instancia compartida.

<a id="multiple-oauth-accounts"></a>

### Múltiples cuentas OAuth

Los proveedores de OAuth cuyas credenciales incluyen un ID de cuenta o correo electrónico estable pueden mantener más de uno inicio de sesión. La página de proveedores muestra esas cuentas en un menú desplegable, le permite agregar otra y cambia la cuenta activa sin cerrar sesión con los demás. Un inicio de sesión normal con una credencial Kimi sin identidad sustituye a la ranura activa, mientras que una **Añadir cuenta** conserva esa ranura y activa una nueva, distinto uno. Las cuentas de Kiro están marcadas por el perfil ARN. `chatgpt` siempre es de una sola ranura porque Codex Las cuentas de la grupo tienen un libro mayor separado. Los tokens permanecen en `~/.opencodex/auth.json`; `/api/oauth/accounts` devuelve solo metadatos enmascarados.

<a id="cockpit-tools-antigravity-import"></a>

### Herramientas para bañera Importación de antigravedad

Para v1, OpenCodex importa solo un **Herramientas de bañera Antigravedad** JSON exportación para el `google-antigravity` proveedor. En el panel Proveedores, elija el archivo local JSON de la pestaña Cuentas de ese proveedor. El panel de control no muestra el contenido del archivo ni los valores de las credenciales; solo informa los recuentos importados, actualizados, fallidos y no admitidos. Otros proveedores de Cockpit son rechazados en v1.

El CLI acepta la exportación desde un archivo o entrada estándar solo — nunca pegarlo en un argumento de comando:

```bash
ocx account import google-antigravity --format cockpit-tools --file <path> [--json]
cat accounts.json | ocx account import google-antigravity --format cockpit-tools --stdin [--json]
```

Se rechazan JSON y argumentos posicionales adicionales. Mantenga los archivos exportados privados y elimínelos o guárdelos de forma segura después de la importación.

<a id="oauth-reliability"></a>

### OAuth fiabilidad

opencodex coordina la actualización de token y el enrutamiento de grupo Codex para que las solicitudes concurrentes no se ejecuten tienda de credenciales. Esta es la fiabilidad y el trabajo de diagnóstico — que hace **no** garantizar la protección de cumplimiento del proveedor, límites de tarifas o acciones de la cuenta.

**Refrescar la coordinación.** Antes de una llamada enrutada, un acceso vencido token se actualiza una vez por
`(provider, account)`:

1. Las llamadas simultáneas — de un solo vuelo en proceso comparten una promesa de actualización.
2. Los escritores de procesos cruzados — se serializan en la misma cuenta.
3. Generación CAS — persiste solo cuando la generación de credenciales almacenada aún coincide; un escritor más nuevo gana, y un resultado de actualización anterior no puede sobrescribirlo.

Los fallos de actualización de terminal marcan la cuenta como que necesita una nueva autenticación en lugar de volver a intentarlo para siempre.

Para la credencial nativa principal Codex en `CODEX_HOME/auth.json`, cancelar una solicitud detiene un esperar actualizar antes de que comience el intercambio token. Un intercambio ya comenzó termina dentro su propio tiempo de espera de 30 segundos y guarda el acceso exitoso y actualiza tokens antes de informar el Cancelación de la solicitud. Esto conserva la actualización rotada token para solicitudes posteriores; una El reemplazo de credenciales externas aún tiene prioridad.

**Enfriamientos (grupo Codex).** Upstream `429` / las respuestas de cuota establecen un tiempo de reutilización difícil desde
`Retry-After`, cuota `reset` cabeceras (capped), o un corto retroceso por defecto. Cuentas sobre una explícita
`Retry-After` El tiempo de reutilización no se prueba temprano; los tiempos de reutilización derivados del reinicio pueden recibir un arrendamiento de sonda con ritmo para que la recuperación se pueda detectar sin inundar al proveedor. Reutilización de modelos nativos derivados de Restablecer mantener la cuota nativa compartida (incluyendo GPT-5.6 Terra/Luna) separada de `gpt-reserve`. Los modelos en el grupo compartido todavía se protegen unos a otros; un éxito ordinario no puede borrar un tiempo de reutilización de la Reserva. Explícito `Retry-After` y los tiempos de reutilización predeterminados siempre permanecen en toda la cuenta.

**Afinidad de sesión.** Codex thread→afinidad de la cuenta es proceso-local (solo en memoria; no persistente a través de reinicios proxy). Sobre fallos de credenciales (`401` / `403`) la cuenta está en cuarentena por reauth y afinidades para esa cuenta se borran. En marcha `429`, la cuenta entra en tiempo de reutilización, afinidades se borran, y la selección de grupo puede girar los hilos — no se fijan a través de una respuesta de límite de velocidad.

**Volver a una cuenta recuperada.** Para reanudar el uso de la cuenta de mayor prioridad durante un tareas, permitir `ocx config set codexAccountPriorityFailback true` y mantener la estrategia Pool en `quota` con conmutación automática habilitada. Por ejemplo, una tarea puede pasar de Plus a otra. cuenta cuando se llena su ventana de cinco horas, luego vuelve a Plus después de que la actualización de la cuota confirme recuperación. Mientras fluyen las solicitudes, los intentos de actualización en segundo plano se ejecutan como máximo una vez cada cinco minutos. La solicitud que desencadena una actualización puede seguir usando la cuenta anterior; la siguiente solicitud después de que se complete la actualización puede retroceder. Las solicitudes ya en ejecución finalizan en sus capturas cuenta. Los pines de cuenta manuales y las restricciones de acceso al modelo aún se aplican. Esta característica está desactivada por default; uso `ocx config set codexAccountPriorityFailback false` para restaurar los enlaces estables.

El umbral efectivo de la cuenta de origen vinculada controla esta preferencia: `0` lo deshabilita, y una anulación positiva funciona incluso cuando el umbral global es `0`. Un candidato debe saber, uso no agotado por debajo de su propio umbral efectivo positivo. Candidato `0` elimina sólo eso preferencia de umbral; todavía se aplican la elegibilidad, el tiempo de reutilización y los bloqueos duros. Cada ventana contribuye para su puntuación necesita una observación reciente en vivo en este proceso. Actualizaciones solo de créditos, conservadas Las ventanas y las barras de visualización hidratadas no prueban por sí mismas la recuperación.

**Metadatos del cliente Codex.** La ruta de avance ChatGPT pasa a través de la `FORWARD_HEADERS`
allowlist (autorización, `chatgpt-account-id`, originador, ID de sesión/hilo y Codex relacionados cabeceras — ver [Adaptadores](/es/reference/adapters/)) El modo Pool sobrescribe solo la autenticación y
`chatgpt-account-id` para que coincida con la credencial seleccionada. opencodex hace **no** Fabricar oficial identidad del cliente (por ejemplo, `originator`, encabezados de sesión o hilo) cuando la persona que llama no envió A ellos.

Para el diagnóstico de compatibilidad de cuenta-conmutador, habilitando la depuración del proveedor (`ocx debug provider on`) añade uno `[ocx:codex:affinity]` línea por respuesta directa canónica ChatGPT. La línea contiene el encabezado presencia, cubos de tamaño grueso, etiquetas de igualdad de proceso local HMAC, resúmenes seguros de nivel superior conocido y un recuento de campos de giro desconocidos. Nunca incluye credenciales en bruto, ID de cuenta, valores de certificación, identificadores de hilos/sesiones, metadatos de turno o cuerpos de solicitud; las etiquetas intencionalmente cambiar después de cada reinicio proxy. Uso `ocx debug provider logs -f` mientras reproducir las dos solicitudes, y luego ejecutar `ocx debug provider off`. Esta captura es solo de observación y no elimina metadatos, vuelve a intentar una solicitud, cambia de cuenta, restablece un subproceso o afecta el enrutamiento.

**Diagnóstico y reauth.** Humanos `ocx status` imprime un bloque de estado OAuth (identificadores de cuenta redactados, sin tokens). `ocx doctor` agrega una sección de confiabilidad OAuth con comprobaciones de almacenamiento grabable / de un solo vuelo y WARN filas que incluyen una acción de recuperación. Cuando una cuenta de proveedor OAuth necesita reautenticación, ejecute
`ocx login <provider>` (O utilice Reautenticate en el panel de control). Las cuentas de grupo Codex no son una de Estos proveedores, pero `ocx login codex --reauth` rutas a su reautenticación de cuenta-pool, que el panel de control Codex cuenta grupo también realiza. Véase
[`ocx status` / `ocx doctor`](/es/reference/cli/) en la referencia CLI.

<a id="kiro-request-credits"></a>

### Créditos de solicitud Kiro

En los giros habilitados para herramientas, opencodex mantiene el texto ordinario de Kiro hasta que se valida la finalización. Si Kiro termina con texto sin formato en lugar de su herramienta privada de respuesta final, se sigue ejecutándose, y solo se muestra la respuesta final resultante. El progreso que acompaña a un verdadero La llamada a la herramienta sigue siendo visible. Una respuesta final privada normal no necesita reintento de finalización.

Cuando Kiro emite medición de crédito, los registros de solicitudes conservan el gasto reportado como
`usage.providerCredits`, incluido en el libro mayor de uso persistente. Estos son créditos Kiro; Los recuentos de token aún pueden estimarse, y el valor del crédito no reemplaza las estimaciones de costos de USD. Las solicitudes de reserva de finalización agregan sus créditos reportados. Un valor ausente significa que Kiro no informe el uso de crédito; un cero explícito significa que no informó ningún gasto.

<a id="kiro-refresh-attention"></a>

### Kiro actualizar la atención

Si un AWS SSO refrescar devoluciones `400 invalid_request` y emparejar Kiro CLI recuperación no tiene éxito, el panel de control muestra la cuenta afectada como la necesidad de volver a autenticar una vez que su acceso
token expira. El proveedor activo informa `loggedIn: false` Desde `/api/oauth/status`. Un acceso todavía válido token permanece conectado. Puede iniciar sesión de nuevo a través del panel; una actualización automática exitosa posterior también borra el estado de atención. Este estatus no clasificar la concesión de actualización como revocada o deshabilitar futuros intentos de actualización. Red y servidor Los errores no activan este estado.

Para cuentas de escritorio, un HTTP 401 con exactamente `Bad credentials` requiere un nuevo login e inmediatamente marca la generación de credenciales rechazadas como que necesita una nueva autenticación. Otros mensajes, estados y respuestas AWS SSO no activan esta regla específica del escritorio.

<a id="kiro-credential-import"></a>

### Importación de credenciales Kiro

El panel de control ofrece el inicio de sesión del dispositivo nativo Builder ID, Google y GitHub sin Kiro CLI. La elección Kiro CLI y `ocx login kiro` importar ruta de acceso use el CLI: en Unix, instálelo con `curl -fsSL https://cli.kiro.dev/install | bash`; en PowerShell Windows, uso `irm 'https://cli.kiro.dev/install.ps1' | iex`; luego inicie sesión con `kiro-cli login`. Sin un `kiro-cli` período de sesiones `ocx login kiro` caídas volver a un acceso pegado token o el `KIRO_ACCESS_TOKEN` variable de entorno.

Los `ocx login kiro` ruta de importación busca la plataforma Kiro CLI almacena y abre bases de datos SQLite Sólo lectura. Dos variables de entorno hacen explícita la selección de fila fuente y token:

- `KIROCLI_DB_PATH` selecciona una base de datos no estándar Kiro CLI SQLite. El camino ya debe existir; durante esta ruta de importación, opencodex no crea ni modifica la base de datos, los archivos WAL o SHM.
- `KIROCLI_TOKEN_KEY` selecciona el exacto `auth_kv` token clave cuando una base de datos contiene múltiples de otro modo ambiguas filas token. Una selección faltante falla el inicio de sesión en lugar de adivinar.

En Windows, la importación busca `%LOCALAPPDATA%\Kiro-Cli\data.sqlite3`. Inicio de sesión forzado/agregar cuenta también necesita el binario local CLI: opencodex primero utiliza `PATH`Luego vuelve a caer en
`%LOCALAPPDATA%\Kiro-Cli\kiro-cli.exe` y `C:\Program Files\Kiro-Cli\kiro-cli.exe`. Si ninguna carpeta tiene `kiro-cli.exe`, a `kiro.exe` Dentro de los mismos dos `Kiro-Cli` Se utilizan carpetas. opencodex nunca se ejecuta un corto `kiro` o `kiro.exe` encontrado en `PATH` o en el contenedor compartido macOS/Linux directorios, por lo que instalar o vincular el CLI como `kiro-cli` Ahí.

Después de una importación exitosa, opencodex mantiene la credencial importada para
`~/.opencodex/auth.json`. Mantenga estas variables y la base de datos seleccionada privada. No adjunte archivos de base de datos o inicio de sesión sin formato Diagnóstico de informes de errores.

Para el **Kiro CLI** elección, **Añadir cuenta** es un flujo de trabajo de escritura separado: captura la sesión actual, registra `kiro-cli` fuera, e importa el nuevo inicio de sesión del navegador. Si el inicio de sesión se cancela o falla, incluso mientras OpenCodex persiste la credencial, reversión sustituye a la Kiro CLI base de datos y elimina su actual WAL, SHM, y sidecares de diario antes de publicar la instantánea de sesión anterior.

Debido a que la reversión solo es posible desde una instantánea, el Kiro CLI **Añadir cuenta** La elección se niega a firmar `kiro-cli`
cuando un almacén de sesión está presente pero no se puede capturar (archivo ilegible, esquema no coincidente o una selección ambigua de token), cuando `KIROCLI_DB_PATH` / `KIRO_CLI_DB_FILE` redirección importación lee lejos de la tienda CLI en vivo, o cuando una base de datos CLI primaria existente no tiene ninguna fila token reconocida. Reparar o eliminar la base de datos ilegible bajo el `kiro-cli` ruta de datos, desestablezca la importación selectores, y luego reintentar. Iniciar sesión desde una máquina sin existencia `kiro-cli` La sesión no se ve afectada. Las opciones del panel de control nativo son solo para agregar y no cerrar sesión `kiro-cli`. Un diálogo de dispositivo muestra el código y el destino de la verificación. Solo los hosts Kiro o Builder ID reconocidos se abren como enlaces; se muestra un destino inesperado como texto copiable para su revisión. El cierre del cuadro de diálogo envía la cancelación y deja una verificación de estado de fondo limitada para conciliar una confirmación ya en curso. Se vuelve a intentar una respuesta de estado estancada; agotar la fecha límite de flujo produce el resultado final neutral en lugar de reclamar el éxito. La aprobación Google y GitHub se completa cuando Kiro informa `authorized` (o el legado `approved` estado) con tokens válido y un perfil ARN. La lista de cuentas marca las cuentas Kiro excluidas de la selección automática por un motivo, cuando están disponibles.

<a id="deepseek-account-dsh"></a>

### DeepSeek Cuenta (DSH)

`dsh-account` es un proveedor de cuentas experimental diseñado para reutilizar las credenciales de cuenta autenticadas de una aplicación de escritorio DeepSeek Harness (DSH) instalada.

- **Independiente de DeepSeek API Clave:** `dsh-account` se ejecuta en la cuenta DeepSeek iniciada sesión en DeepSeek Harness, mientras que el `deepseek` facturas de proveedores contra el saldo de claves de su plataforma API. Los dos dominios y rutas de credenciales están estrictamente separados y nunca se cruzan.
- **Importación explícita solamente:** opencodex lee `~/.dsh/.credentials.yaml` (o `$DSH_HOME/.credentials.yaml`) solo cuando corres `ocx login dsh-account` o seleccione **Iniciar sesión** en la fila de la cuenta DeepSeek (DSH) del panel **Añadir proveedor** Recolector. Nunca copia, importa o utiliza el token por sí solo.
- **Tienda de credenciales DSH de solo lectura:** OpenCodeX trata `~/.dsh/.credentials.yaml` como estrictamente de solo lectura. OpenCodeX nunca escribe, modifica, elimina o altera los permisos de ningún archivo perteneciente a DeepSeek Harness.
- **Copia de credencial aislada & cierre de sesión:** Al importar, OpenCodeX valida el token contra el punto final de identidad autorizado de DeepSeek (`/auth-api/v0/users/current`) y guarda su propia copia en la tienda de autenticación OpenCodeX. Cerrar sesión o eliminar la cuenta en OpenCodeX solo elimina la copia local de OpenCodeX; nunca activa el cierre de sesión remota ascendente y no cerrará la sesión en DeepSeek Harness Desktop.
- **Sin fondo token rotación y 401 re-importación:** Las concesiones de sesión DSH no cuentan con un punto final automático de actualización en segundo plano. Si upstream devuelve HTTP 401 (`ACCOUNT_TOKEN_INVALID`), OpenCodeX marca la cuenta `needsReauth` y detiene el enrutamiento. Para restaurar el acceso, el usuario debe volver a importar explícitamente a través de `ocx login dsh-account`.
- **Descargo de responsabilidad de terceros:** OpenCodeX no hace ninguna reclamación de respaldo oficial o autorización por parte de DeepSeek para clientes de terceros que reutilizan subvenciones de sesión.

<a id="3-api-key-catalog"></a>

## 3. API-clave de catálogo

opencodex envía 104 preconfiguración incorporados: 84 basados en teclas, 16 OAuth, tres locales y uno predeterminado ChatGPT-preajuste de avance. El panel de control **Añadir proveedor** selector abre el panel de un proveedor clave, valida la clave y la almacena; la validación es específica del proveedor. Entradas notables:

**ClinePass** utiliza una clave Cline API con el [catálogo de suscripción oficial](https://docs.cline.bot/getting-started/clinepass)
y [Chat Completions punto final](https://docs.cline.bot/api/chat-completions), operado por Cline Bot Inc. bajo
[Los términos de Cline](https://cline.bot/tos). Un id enrutado como `cline-pass/cline-pass/kimi-k3` es intencional: el primer segmento selecciona el proveedor opencodex, mientras `cline-pass/kimi-k3` es el modelo completo slug enviado de origen. La cuota de ClinePass es compartida por la cuenta a lo largo de 5 horas, Límites semanales y mensuales. Una sonda en vivo 2026-08-13 verificó que todos los modelos estáticos de ClinePass acepta `low`, `medium`, `high`, `xhigh`, y `max` en el límite de entrada de la pasarela. opencodex conserva los niveles solicitados; cualquier normalización específica del backend sigue siendo responsabilidad de ClinePass.

**Cline** es la misma clave y punto final API en la facturación de uso de pago por uso en más de 100 modelos (OpenRouter-estilo ids como `anthropic/claude-sonnet-4-6`) Los modelos gratuitos promocionales de Cline son solo disponible en el Cline IDE/CLI, no a través del API; `minimax/minimax-m2.5` es el API documentado Modelo de experimentación libre.

**OrcaRouter** ([patrocinador](https://github.com/lidge-jun/opencodex/blob/main/SPONSORS.md)) es un Puerta de enlace compatible con OpenAI en `https://api.orcarouter.ai/v1` con identificadores de modelo espaciados por el proveedor (`openai/gpt-5.5`, `anthropic/claude-opus-4.8`, `deepseek/deepseek-v4-flash`, ...) y una adaptación router, `orcarouter/auto`, que califica cada indicador y elige el modelo. Crear una clave en el
[Consola OrcaRouter](https://www.orcarouter.ai/console); el preajuste fija la fila cerca de la parte superior del Agregue el selector de proveedores y lo marca como patrocinador, y nada más sobre el enrutamiento o los cambios predeterminados.

**Código Packy** es un API relé para Claude Code, Codex, Gemini y más. El preajuste apunta a su Chat compatible con OpenAI Finaliza el punto final, `https://cf.api.fan/v1`, con el descubrimiento de modelos en vivo reducido a lo que El grupo token permite (`gpt-5.5` y `gpt-5.1-codex` son sembradas). Regístrate en
[packyapi.com](https://www.packyapi.com) y crear un grupo Codex token.

**Opper** es la puerta de enlace de IA alojada en la UE de Opper AI (Estocolmo): una clave (creada en
[platform.opper.ai](https://platform.opper.ai)) y un punto final compatible con OpenAI frente a más de 700 modelos de más de 30 proveedores. ID de modelos desnudos como `claude-sonnet-4-6` o `gpt-5.5` son *grupos*: Opper elige el proveedor y la región por solicitud, por lo que las identificaciones semilla permanecen válidas a medida que las rutas van y vienen. A
`vendor/model` id.`anthropic/claude-sonnet-4-6`, `aws/claude-sonnet-4-6-eu`) fija una ruta en su lugar. El catálogo fue descubierto en vivo por `/v3/compat/models` con su clave; la lista pública, incluyendo rutas de la UE, está en [opper.ai/modelos](https://opper.ai/models). Opper también es un
[models.dev](https://models.dev) proveedor (`opper`), que utiliza los mismos identificadores de grupo desnudos.

| Proveedor | URL base |
| --- | --- |
| **OpenAI (llave API)** | `https://api.openai.com/v1` |
| **Anthropic (llave API)** | `https://api.anthropic.com` |
| **OpenRouter** | `https://openrouter.ai/api/v1` |
| **Cline** | `https://api.cline.bot/api/v1` |
| **ClinePass** | `https://api.cline.bot/api/v1` |
| **Ollama Nube** | `https://ollama.com/v1` |
| Google Gemini · Google Vertex AI | `https://generativelanguage.googleapis.com` · `https://aiplatform.googleapis.com` |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai` |
| Umans AI · Neuralwatt | `https://api.code.umans.ai` · `https://api.neuralwatt.com/v1` |
| Mistral | `https://api.mistral.ai/v1` |
| MiniMax · MiniMax (CN) | `https://api.minimax.io/v1` · `https://api.minimaxi.com/v1` |

| DeepSeek | `https://api.deepseek.com` | | Cerebras | `https://api.cerebras.ai/v1` | | Chutes | `https://llm.chutes.ai/v1` | | DeepInfra | `https://api.deepinfra.com/v1/openai` | | Hiperbólico | `https://api.hyperbolic.xyz/v1` | | Inferencia sin servidor a escala cero | `https://inference.api.nscale.com/v1` | | Vultr Inferencia sin servidor | `https://api.vultrinference.com/v1` | | Baseten Modelo de APIs | `https://inference.baseten.co/v1` | | Código de comando | `https://api.commandcode.ai/provider/v1` | | OrcaRouter | `https://api.orcarouter.ai/v1` | | Código de paquete | `https://cf.api.fan/v1` | | Meta Modelo API | `https://api.meta.ai/v1` | | Código de la Meta Muse (Crédential CLI) | `https://api.meta.ai/v1` | | SambaNova Nube | `https://api.sambanova.ai/v1` | | Fábrica de fichas Nebius | `https://api.tokenfactory.nebius.com/v1` | | Crusoe | `https://api.inference.crusoecloud.com/v1` | | DigitalOcean Inferencia sin servidor | `https://inference.do-ai.run/v1` |
| API generativas de Scaleway | `https://api.scaleway.ai/v1` | | AI sin plumas | `https://api.featherless.ai/v1` | | Novita AI | `https://api.novita.ai/openai/v1` | | Together | `https://api.together.xyz/v1` | | Fireworks | `https://api.fireworks.ai/inference/v1` |
| Moonshot (Kimi API) · Kimi (codificación) | `https://api.moonshot.ai/v1` · `https://api.kimi.com/coding/v1` | | Cara de abrazo | `https://router.huggingface.co/v1` | | NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | | Z.AI (codificación GLM) | `https://api.z.ai` — Responses en `/api/v1/responses` por defecto; Chat Completions en `/api/coding/paas/v4/chat/completions` por modelo a través `modelAdapters` | | Zhipu AI (modelo grande) | `https://open.bigmodel.cn/api/paas/v4` |
| Plan de codificación BigModel (Responses, lista estática) | `https://open.bigmodel.cn/api/v1` | | Qwen Cloud Plan de tokens | (predeterminado): `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` · Pague sobre la marcha: `https://dashscope.aliyuncs.com/compatible-mode/v1` · o Personalizado |
| Plan de codificación de nube de Tencent | `https://api.lkeap.cloud.tencent.com/coding/v3` | | SiliconFlow | `https://api.siliconflow.cn/v1` | | Arca de Volcán · Plan de Codificación · Plan de Agente | `https://ark.cn-beijing.volces.com/api/v3` · `https://ark.cn-beijing.volces.com/api/coding/v3` · `https://ark.cn-beijing.volces.com/api/plan/v3` |
| Xiaomi MiMo | `https://api.xiaomimimo.com/anthropic` | | Xiaomi MiMo (OpenAI Chat) | `https://api.xiaomimimo.com/v1` | | Kilo | `https://api.kilo.ai/api/gateway` | | Opper | `https://api.opper.ai/v3/compat` | | TokenLab | `https://api.tokenlab.sh/v1` | | Modelflare | `https://modelflare.dev/v1` | | OpenGateway | `https://apis.opengateway.ai/v1` | | GitLab Duo | `https://cloud.gitlab.com/ai/v1/proxy/openai/v1` | | Cloudflare Puerta de enlace AI | `https://gateway.ai.cloudflare.com/v1/{account-id}/{gateway}/anthropic` | | … y más | código abierto zen, Puerta de enlace Vercel AI, Venecia, NanoGPT, Sintético, Qianfan, Alibaba, Paralelo, ZenMux, LitelLM |

**OpenGateway** es una puerta de enlace compatible con OpenAI operada por Sionic AI en
`https://apis.opengateway.ai/v1`. Su catálogo público contiene alrededor de 80 modelos activos. (como se verificó en 2026-10-02); el ajuste preestablecido actualiza automáticamente la lista de modelos en vivo desde público `GET /v1/models` y mantiene activos los modelos Chat Completions (además de la Responses-only `openai/o3-pro`, que está anclado a Responses). Servido con ión
`deepseek/deepseek-v4.1-flash-ultrafast` y `z-ai/glm-5.3-flash-ultrafast` Se enumeran primero. Crear una clave en el [Panel de OpenGateway](https://opengateway.ai/api-keys), luego corre
`ocx provider add opengateway` o seleccione **OpenGateway** en el panel. Solicitudes de chat use la clave Bearer configurada; la lista de modelos públicos no valida esa clave. En el cable Responses, OpenGateway rechaza las llamadas a herramientas personalizadas nativas reproducidas, por lo que el ajuste preestablecido reduce las herramientas personalizadas Codex, como el modo de código `exec` para que funcionen antes de enviarlas.

**TokenLab** ([patrocinador](https://github.com/lidge-jun/opencodex/blob/main/SPONSORS.md)) es un
OpenAI-compatible API Puerta de enlace en [tokenlab.sh](https://tokenlab.sh/r/OPENCODEX), operado por TOKENLAB AI INC. Crear un espacio de trabajo [Clave API](https://tokenlab.sh/dashboard/api?tab=keys), luego corre
`ocx provider add tokenlab` o seleccione **TokenLab** en el panel de instrumentos **Añadir proveedor** Recolector. TokenLab mantiene un paso a paso [Guía de integración OpenCodex](https://tokenlab.sh/docs/en/integrations/opencodex)
([한국어](https://tokenlab.sh/docs/ko/integrations/opencodex)) que cubre la configuración y el enrutamiento por modelo. El preset utiliza [Chat Completions](https://tokenlab.sh/docs/en/quickstart) y descubre modelos en
`GET /v1/models?category=chat`, manteniendo solo las entradas que declaran `tool-use` capacidad. Los modelos de imagen, video, audio, incrustación y decisión están excluidos de este preajuste de chat.

Cada modelo utiliza el formato de solicitud que TokenLab declara para él. (`tokenlab.accepted_request_formats` on `GET /v1/models/{model}`):

| Modelos | Codex (clientes Responses) | Clientes de chat | Claude Code (clientes Anthropic) |
| --- | --- | --- | --- |
| `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-luna`, `grok-4.7`, `deepseek-v4.1-flash`, `deepseek-v4-pro`, `kimi-k3`, `glm-5.3` | [Responses](https://tokenlab.sh/docs/en/api-reference/responses/create-response) | Chat Completions | Chat Completions |
| `claude-*` | [Messages](https://tokenlab.sh/docs/en/api-reference/messages/create-message) | Messages | Messages |
| Cualquier otro modelo, incluyendo `gemini-3.8-flash` | Chat Completions | Chat Completions | Chat Completions |

Para mantener un modelo en Chat Completions, agréguelo al `modelAdapters`Por ejemplo,
`"modelAdapters": { "gpt-6.1-sol": "openai-chat" }`. El enrutamiento Claude se aplica solo mientras puntos de proveedor en `https://api.tokenlab.sh/v1`. OpenCodex no envía ningún encabezado de política de entrega, por lo que La política de entrega propia de tu clave API decide cómo TokenLab sirve cada solicitud.

Los [catálogo de modelos](https://tokenlab.sh/docs/en/api-reference/models/list-models) Es público sin una clave, pero se valida una clave suministrada y los resultados de los alcances a sus permisos del modelo y la entrega política. Utilice una clave válida con un espacio de trabajo financiado para la inferencia. `gpt-5.6-terra` es la semilla por defecto; elija otro modelo descubierto si su clave no lo permite. Proveedor y modelo Los prefijos permanecen separados: `tokenlab/gpt-5.6-terra` envía `gpt-5.6-terra` de origen. TokenLab's [términos](https://tokenlab.sh/tos) y [Política de privacidad](https://tokenlab.sh/privacy-policy)
aplicar a las solicitudes enviadas a este servicio. El preajuste fija la fila cerca de la parte superior del proveedor Añadir selector y lo marca como un patrocinador, y nada más sobre enrutamiento o cambios por defecto.

**Modelflare** es un relé compatible con OpenAI en `https://modelflare.dev/v1`. Seleccionar **Modelflare**
en `ocx init` o el dashboard **Añadir proveedor** Picker, o correr `ocx provider add modelflare`, y darle su clave directamente o como referencia `${MODELFLARE_API_KEY}` para que la llave permanezca en su medio ambiente. El preajuste utiliza Chat Completions y siembra cuatro modelos que fueron verificados con chat, streaming y llamadas de herramientas: `glm-5.3-flash` (el valor predeterminado),
`claude-sonnet-5-5`, `gpt-6.1-sol` y `deepseek-v4-flash`. Puede agregar otros Chat-compatible Modelflare modelos como modelos personalizados. Los modelos de imagen y vídeo utilizan puntos finales Modelflare independientes y no funciona a través de este Chat preestablecido. Una clave Modelflare ordinaria está vinculada a un grupo de enrutamiento y puede llamar solo a los modelos de ese grupo, así que use una llave inteligente para el conjunto completo de semillas, o
`--default-model` con un modelo sirve el grupo de su clave.
`deepseek-v4.1-flash` está listada de origen pero actualmente responde 503, por lo que el preajuste lo deja fuera. La latencia ascendente varía de unos pocos segundos a aproximadamente 30 segundos, con transitorios ocasionales 503.

Las tarjetas de proveedor MiniMax y MiniMax (CN) también pueden mostrar la cuota del Plan de codificación cuando se configuran Key tiene un plan activo. El panel de control lee la ventana de 5 horas del plan y, cuando está presente, semanalmente ventana; estas son observaciones de visualización y no cambian el enrutamiento del modelo.

Ollama Tarjetas de proveedor de la nube leer cuota de `/api/balance` Primero, con `/api/usage` como a fallback para despliegues más antiguos. Un informe de reserva analizado sustituye a un fallo anterior; 4xx respuestas duras (excepto 404/408/429) borran la última cuota buena, incluso si otra El intento falla, mientras que los fallos transitorios lo mantienen. Un cuerpo ilegible o de gran tamaño se detiene nuevos intentos. Los créditos en dólares solo muestran la asignación incluida, excluyendo los créditos comprados. por lo que una asignación agotada detiene el enrutamiento a Ollama Cloud solo cuando no queda ningún crédito comprado.

`MiniMax-M3.1-Flash-Preview` (1M contexto) aparece en ambos configuración preestablecidos MiniMax. MiniMax lo sirve solo a las claves de suscripción de Token Plan y al código MiniMax por ahora, por lo que una clave API de pago por uso obtiene una Error en ello. Pensar siempre está en: el recolector de esfuerzo ofrece `low` a través `max` y por defecto
`max`, y no hay manera de apagar el pensamiento. MiniMax no ha publicado un precio por-token para la vista previa; el uso se extrae de su
[Cuota del Plan Token](https://platform.minimax.io/docs/guides/pricing-token-plan), por lo que OpenCodex No muestra ningún costo estimado para ello. MiniMax `/models` El endpoint no aparece la vista previa aún, por lo que OpenCodex lo mantiene en el catálogo desde el preajuste. Una instalación cuyo guardado La lista de modelos MiniMax sigue siendo la predeterminada anterior y la recibe en el siguiente inicio; una lista que ha editado se deja tal cual; registre la vista previa a mano con
`ocx models add minimax MiniMax-M3.1-Flash-Preview --context-window 1000000`.

**OpenCode Ir** Rutas `gemini-4-argon-contributor` Gemini API, incluyendo continuaciones de streaming y resultados de herramientas. El existente `opencode-go` preset mantiene su Fijación histórica de URL: URL personalizadas guardadas, incluidas `https://opencode.ai/inference/go/v1`, ruta a través de la canónica `https://opencode.ai/zen/go/v1` endpoint y heredar los valores predeterminados de Go. Gemini luego usa el punto final del modelo nativo de Go con autenticación de clave. Un nombre diferente proveedor personalizado mantiene su URL configurado y no recibe este pin Gemini. Selecciona protocolos por ID de modelo exacto: GPT 6 Luna, GPT 5.6 Luna, Grok 4.6/4.7 y Muse Spark Contributor usa Responses; Claude Haiku 5.5, MiniMax M2.7/M3 y Qwen3.7 Plus/3.8 Max/3.8 Flash utilizar Anthropic Messages. Legado MiniMax M2.5 y Union Alpha también retiene Messages. Los modelos sin un cable listado retienen el chat. Los nuevos pines nativos se aplican al destino Go anclado con autenticación de clave. Los modelos Responses todavía aceptan una explícita `modelAdapters` Anular. Al leer una configuración guardada más antigua, OpenCodex ignora las anulaciones obsoletas de Chat/Responses para los modelos Gemini y Qwen recién anclados, junto con sus preferencias de herramientas alojadas solo válidas para Responses. Otros proveedores, cuentas y enrutamiento permanecen disponibles. Las lecturas dejan el archivo sin cambios; una edición de configuración explícita posterior guarda los valores actualizados. Nuevas anulaciones para estos modelos nativos siguen siendo rechazadas. Gemini utiliza `low`, `medium` y `high` niveles de pensamiento; esfuerzos más altos `high`.

OpenCode Go requiere un identificador de sesión estable para el enrutamiento. OpenCodex envía
`claude-haiku-5-5`, al igual que los modelos MiniMax, sobre el cable Anthropic Messages, a juego
[Tabla de puntos finales de OpenCode Go](https://opencode.ai/docs/go/#endpoints). OpenCodex deriva su encabezado de sesión Go desde los encabezados de hilo/sesión Codex, o desde el
`x-opencode-session` cabecera cuando las cabeceras Codex están ausentes. Esto se aplica a los directos Solicitudes y solicitudes Chat Completions puenteadas a Responses. Incluso un `ocx_`-prefijado El valor entrante se trata como entrada de cliente y El puente interno lleva el valor original, por lo que es nativo. Chat, Chat puenteado y Responses obtienen el mismo resultado. Provider-config explícito Las cabeceras de sesión son anulaciones del operador y se envían sin cambios. Los clientes deben mantener la Identificador estable dentro de una conversación y distinto a través de conversaciones. Una solicitud sin ningún identificador de sesión no se le da una identidad de solicitud cruzada inferida; es en lugar de enviarse en una sesión asignada solo para esa solicitud, aislada de cada otra solicitud (consulte la referencia del proveedor para saber cómo se transmite ese valor). Para Claude Messages, los encabezados de sesión de OpenCode Go configurados siguen siendo autorizados. De lo contrario, los encabezados de sesión o subproceso explícitos válidos tienen prioridad y son válidos. Identidad de conversación en `metadata.user_id` Suministra el respaldo. Este fallback es aplicado al destino final de Go, incluyendo selecciones aleatorias y reserva intentos, en lugar de la ruta preliminar. Claves de caché de sistema-prompt compartidas hacen no identifica conversaciones, y la identidad específica de Go no se envía a objetivos que no son Go. Las configuración del proveedor Pi generado permiten `compat.sendSessionAffinityHeaders`
así que Pi envía su identidad por sesión al proxy. Pi administrado manualmente existente configuración pueden establecer esta opción en sus `opencodex` proveedor también. Pi puede omitir la afinidad de sesión cuando `cacheRetention` es `none`; habilitar la retención de caché cuando se requiere una sesión ascendente estable.

**Ecos de llamadas a herramientas de MiMo.** En OpenCode Go y otras rutas de Chat Completions, se oculta un bloque `<tool_call>` cuando duplica una llamada estructurada a la misma herramienta con la misma entrada efectiva. Esto incluye envoltorios de MiMo como `<tool_call_deadbeef>` con identificadores de cierre coincidentes, incluso cuando el eco sigue a un texto normal. Los ejemplos de código siguen visibles. Si la entrada es distinta o varias llamadas pueden explicar el bloque, el marcado se conserva. Para `mimo-v2` y los identificadores MiMo V2 con puntos, como `mimo-v2.6-pro`, si la pasarela envía exactamente una llamada vacía `{}` a una herramienta freeform declarada y coloca su entrada en un bloque independiente, sin identificador o con él, opencodex recupera la entrada en la llamada y oculta el bloque. Los identificadores con guiones, como `mimo-v2-pro` y `mimo-v2-omni`, no participan en esta recuperación. El texto normal, los ejemplos entre comillas, las funciones ordinarias y las respuestas ambiguas no cambian. También se admite el inicio incorrecto `<parameter=` de MiMo al principio de ese bloque independiente.

**OpenCode Zen** (`opencode-zen`) usos `https://opencode.ai/zen/v1` con una clave API de [opencode.ai/auth](https://opencode.ai/auth). El tráfico de modelo libre puede alcanzar los límites de velocidad de ventana corta alrededor de 15–20 solicitudes / minuto (medido por la comunidad; OpenCode no publica RPM). Cuando un límite de velocidad 429 omite `Retry-After`, opencodex añade guía y un sintético `Retry-After`; las cabeceras ascendentes válidas tienen prioridad. Los reintentos de la misma clave siguen siendo opt-in a través [`retryOn429`](/es/reference/configuration/).

Gemini modelos en `opencode-zen` utilice Google nativo de API automáticamente cuando el proveedor utiliza una clave API, el valor predeterminado `googleMode` (`ai-studio`), y también `https://opencode.ai/zen/v1` o `https://opencode.ai/inference/v1`. Usar los ID de modelo listados por Zen; OpenCodex los conserva, incluidos los ID de Flash sin un `-tiered` Sufijo. Los modelos Claude en estas rutas API-clave usan Anthropic Messages automáticamente, independientemente de `googleMode`. Al cargar las configuración guardadas, OpenCodex ignora las Gemini y Claude Chat/Responses anteriores elegibles que se anulan solo para los modelos nativos en la clave canónica. `opencode-zen` proveedor en estas rutas oficiales Zen. También ignora Responses-solamente elegible `image_generation` Preferencias de herramientas alojadas; los proveedores personalizados, las rutas no clave y otras preferencias permanecen sin cambios.

**`opencode-free` ha sido eliminado** porque ahora todos los modelos vuelven `403 permission_denied` bajo la puerta de nivel libre de origen de OpenCode ([#7255](https://github.com/lidge-jun/opencodex/issues/7255)) Cargar una configuración existente desactiva sus entradas y referencias de modelo dependientes en la memoria, advierte una vez por proceso y deja el archivo sin cambios. Si era el proveedor por defecto, la ruta estándar OpenAI OAuth se convierte en la predeterminada. Uso `opencode-go`, tecleado `opencode-zen`u otro proveedor. [Términos de OpenCode Zen](https://opencode.ai/docs/zen/).

Saludable Claude Las asignaciones de escritorio y los valores predeterminados se conservan. Las reglas cuya lista de permisos de modelo de origen se vacía están deshabilitadas, junto con la sincronización de subagentes nativa cuando se elimina su modelo de inyección. Más tarde, la configuración guarda las referencias eliminadas del archivo mientras conserva las ediciones concurrentes sanas.

La mayoría usa el `openai-chat` adaptador con una clave portadora; Preconfiguración compatibles con Anthropic, como
**Xiaomi MiMo** (`xiaomi`) utilizar el `anthropic` adaptador (`x-api-key`) Xiaomi también tiene un chat OpenAI preajustado, `xiaomi-mimo`, y un preajuste de plano token, `mimo`. Los tres por defecto a MiMo V2.6 (`mimo-v2.6-pro`, o `mimo-v2.6-flash` on `xiaomi-mimo`) Xiaomi se retira `mimo-v2.5` y `mimo-v2.5-pro` el 2026-10-21 sin redirección, así que cambie un valor predeterminado de V2.5 guardado antes de entonces; opencodex no lo reescribe por usted. El Plan de codificación Volcengine y el Plan de agente utilizan sus puntos finales nativos Responses a través de `openai-responses`. Durante las continuaciones validadas de la herramienta Ark Coding Plan, reproducir el Responses devuelto `reasoning` elemento contestado `400 InvalidParameter`, por lo que el Plan de codificación preestablecido deja caer elementos de razonamiento reproducidos antes continuación; es decir, con pérdidas, y `dropResponsesReasoningItems: false` Lo apaga. Una instalación que ya guardó el proveedor del Plan de codificación en `openai-chat` mantiene ese cable — nada reescribe una fila almacenada — para que el cambio sea una edición deliberada: set `adapter` a `openai-responses` y
`responsesPath` a `/responses`, o eliminar y volver a agregar el preset. Por modelo explícito `openai-chat`
Las anulaciones permanecen disponibles de cualquier manera. El preajuste incorporado DeepSeek también se `deepseek-v4-flash` sobre su punto final nativo Responses y mantiene la transmisión SSE habilitada. Si ese modelo termina cada elemento de salida pero omite el último Responses evento, opencodex aplica una reparación de gracia de cinco segundos modelo-alcance; mal formado o parcial Las corrientes se cierran como incompletas en lugar de ser reportadas como exitosas. El first party `deepseek-flash` modelo anuncia nativo `text` y `image` entrada, por lo que las solicitudes de imágenes se envían directamente a DeepSeek por defecto en lugar de a través del sidecar de visión. Explícito
`noVisionModels` o las declaraciones de solo texto siguen siendo autoritativas. Primera parte `deepseek-chat`,
`deepseek-reasoner`, y `deepseek-v4-flash` Sidecar por defecto. Las rutas Zen son sin cambios y no fueron probados en esta actualización.

> **Tres rutas de facturación Volcengine:** `volcengine` es el Arca de pago API,
> `volcengine-coding-plan` consume la cuota del plan de codificación, y `volcengine-agent-plan` Consume agente > Cuota del plan. Utilice la clave y el punto final emitidos para el mismo producto; el `/api/v3` punto final > puede incurrir en cargos de pago por uso incluso cuando existe una suscripción al Plan. > Los configuración preestablecidos usan catálogos de modelos estáticos seleccionados porque Ark's `/models` La respuesta también incluye > incrustación, imagen, vídeo y recursos 3D, la puerta de enlace de codificación devuelve el mismo catálogo amplio, > y la puerta de enlace del plan del agente no tiene `/models` recursos. Pago por uso predeterminado a
> `doubao-seed-2-1-pro-260628`; su catálogo curado también incluye texto DeepSeek y GLM actuales > modelos. El plan de codificación por defecto `ark-code-latest`, mientras que el Plan de Agente por defecto
> `deepseek-v4-flash`.

> **Restricción de uso del plan Volcengine:** Volcengine documenta el Plan de Codificación y la cuota del Plan de Agente como > válido solo dentro de las herramientas de codificación de IA compatibles, y advierte que el uso de una clave de plan para API general Las llamadas > pueden suspender la suscripción o prohibir la cuenta. Enrutamiento Codex o Claude Code a través de > opencodex es el uso documentado; apuntando otra automatización a una clave de plan no lo es. Los > de pago por uso `volcengine` ruta no tiene tal restricción.

**Chutes descubrimiento.** Los `chutes` preset usa el contenido compartido fijo de Chutes OpenAI-compatible LLM Se lee el público. `/v1/models` catálogo, mantiene solo filas cuya `supported_features` anunciar
`tools`, conserva los identificadores de modelos que contienen barras y los metadatos en vivo seguros, y limita el descubrimiento a 256 KiB y 128 filas brutas. Debido a que ese catálogo es público, no puede probar que una clave suministrada sea válida; chat Las solicitudes siguen utilizando la clave Bearer configurada. Los hosts Chute personalizados desplegados por el usuario y los Chutes que no son LLM Las API siguen siendo territorio de proveedor personalizado. Crea una clave desde el [Panel de chutes](https://chutes.ai/auth/start).

**DeepInfra descubrimiento.** La clave basada `deepinfra` OpenAI Chat Completions proveedor utiliza el
`openai-chat` adaptador con una tecla Bearer API. Su lista de modelos propiedad del registro URL mantiene solo las filas etiquetadas
`chat`, preserva los identificadores de modelos nativos que contienen barras y limita el descubrimiento en vivo a 512 KiB y 512 en bruto filas. Crear claves en [Panel de DeepInfra](https://deepinfra.com/dash/api_keys).

**descubrimiento hiperbólico.** El preset lee `/v1/models` con la clave portadora configurada, conserva ids de modelos nativos que contienen barras, y limita el descubrimiento en vivo a 256 KiB y 256 filas sin procesar. Cubre solo texto sin servidor y chat de lenguaje de visión; Los puntos finales de imagen, audio y GPU separados de Hyperbolic están fuera de alcance. Crear claves en [Hiperbólico](https://app.hyperbolic.ai).

**Nscale y descubrimiento de Vultr.** Ambos presets leen la autenticación del proveedor `/v1/models` catálogo, preservar los identificadores nativos y limitar el descubrimiento a 256 KiB y 256 filas sin procesar. El catálogo de Nscale mezcla el chat, imagen, y la incrustación de modelos sin un campo de modalidad, por lo que el preajuste admite solo
`meta-llama/Llama-3.1-8B-Instruct`, el modelo utilizado por la herramienta oficial de Nscale que llama al ejemplo API. Vultr actualmente documenta la herramienta que llama solo para `kimi-k2-instruct`, por lo que su preset expone solo eso modelo. Otras filas permanecen ocultas hasta que el proveedor publica evidencia equivalente de agente-herramienta. Crear un servicio de Nscale token en el [Consola Nscale](https://console.nscale.com); copia la inferencia de Vultr La clave de la descripción general de la suscripción en [Consola Vultr](https://my.vultr.com).

**Detección de código de comando.** El preajuste lee el código de comando `/provider/v1/models` Lista de el host fijo Provider API, conserva los identificadores nativos del proveedor y limita el descubrimiento a 256 KiB y 256 raw filas. `ocx login command-code` admite OAuth a través del inicio de sesión en el navegador (con credenciales locales opcionales CLI Importación de `~/.commandcode/auth.json` para los usuarios existentes de Código de Comando CLI); el catálogo del modelo es cuenta-scoped y viene del punto final de descubrimiento autenticado después de iniciar sesión. El proveedor-API preset (`commandcode`) envía la clave de configuración activa: la mayoría de los identificadores de modelo usan Chat Completions con un Bearer encabezado, mientras `claude-*` ids use Anthropic Messages con `x-api-key`porque el código de comando les sirve sólo en `/provider/v1/messages`. Un proveedor que reutiliza el `commandcode` nombre para un diferente punto final mantiene su propio cable. El ajuste preestablecido de OAuth (`command-code`) utiliza el portador de la cuenta almacenada para descubrimiento autenticado y generación de flujos desde `/alpha/generate` como NDJSON. MiMo tool-call markup repetido por la puerta de enlace como texto se elimina cuando duplica una llamada real. En los modelos MiMo, a Completar la llamada de herramienta declarada sin contraparte nativa se restaura solo después de un acabado limpio; Los giros interrumpidos o filtrados dejan el marcado como texto. Crear claves de proveedor-API en
[Command Code Studio](https://commandcode.ai/studio/).

Para un proveedor que utiliza el `command-code` adaptador, `projectContext: "on"` Opta por enviar archivos de proyectos locales en el `/alpha/generate` `memory`, `taste`, y `skills` campos. Con `projectContext` Desactivado o `"off"`, no hay archivos del proyecto (`AGENTS.md`, gusto o habilidades) se leen o se envían; el `config` La carga útil de metadatos no cambia. Las raíces se resuelven desde el **Directorio de trabajo del proceso proxy opencodex**, no de un Espacio de trabajo remoto del llamante. El cargador lee `AGENTS.md`, `.commandcode/taste/taste.md`, y `SKILL.md` archivos en directorios secundarios inmediatos de `.commandcode/skills`,
`.agents/skills`, y `.pi/skills` bajo ese directorio de trabajo. Habilitar la opción envía el contenido recogido de origen del punto final de código de commando configurado. Es rechazada para otros adaptadores. Las comprobaciones de ruta asíncrona mantienen las lecturas dentro del trabajo resuelto directorio, incluso cuando ese directorio es una raíz del sistema de archivos; solo El contenido es leído. Se permiten enlaces simbólicos de directorio de habilidad que se resuelven dentro de ese directorio; Los que se resuelven fuera son rechazados. Cada entrada visitada cuenta para el presupuesto de escaneo; en Se seleccionaron 16 habilidades. Los bytes de archivo, los bytes totales de habilidad y el tiempo de carga están limitados; Los archivos ilegibles o faltantes producen campos vacíos. Los resultados estables se almacenan en caché durante 30 segundos; Los tiempos de espera y los rechazos de admisión al sistema de archivos no se almacenan en caché, por lo que una solicitud posterior puede volver a intentarlo.

**Autenticación y descubrimiento de OrcaRouter.** Elija cualquiera `ocx login orcarouter-oauth` por autorización del navegador con un solo clic o `ocx login orcarouter` para pegar una clave API existente. El PKCE flow inicia primero un loopback listener, envía un desafío S256 nuevo y declara a
`https://www.orcarouter.ai/auth`, intercambia el código de un solo uso en
`https://www.orcarouter.ai/api/v1/auth/keys`, y almacena la clave devuelta por el usuario en
`~/.opencodex/auth.json`. El preajuste de teclas manuales continúa utilizando el almacén de claves del proveedor normal. Ambos modos de ruta a `https://api.orcarouter.ai/v1` y descubre el catálogo público en vivo con
`capability=chat`; se excluyen las filas de medios que no sean de chat/de reclasificación, y se informa sobre el control de modalidades de entrada si Codex ofrece archivos adjuntos de imagen. Debido a que el catálogo en sí es público, la configuración de la clave manual La validación de los informes es desconocida en lugar de aceptar esa respuesta como prueba de que la clave funciona.

Durante el inicio de sesión del navegador OrcaRouter (`ocx login orcarouter-oauth`), un intercambio de claves exitoso cuerpo de respuesta debe ser válido UTF-8 JSON no más grande que 64 KiB. Los 30 segundos existentes de la solicitud El presupuesto cubre tanto los encabezados de respuesta como el cuerpo completo; los cuerpos sobredimensionados o malformados son rechazado antes de que se guarde la clave. Estos límites se aplican solo al intercambio de claves de inicio de sesión, no a la inferencia. solicitar cargas útiles. Validación del alcance no ha cambiado: una omitida `scope` Está permitido, mientras que explícitamente inválido `scope` es rechazada.

Para una implementación auto-alojada de un origen, establezca el origen compartido antes del primer inicio de sesión PKCE; la inferencia URL se deriva del mismo origen:

```bash
ORCAROUTER_BASE_URL=https://router.example ocx login orcarouter-oauth
```

Para una implementación auto-alojada dividida, establezca `ORCAROUTER_API_BASE_URL` y
`ORCAROUTER_AUTH_BASE_URL` separadamente.

El valor debe ser un origen HTTPS (o un bucle HTTP para el desarrollo local) sin credenciales, consulta, o fragmento. Antes del primer inicio de sesión en un punto final autoalojado privado/loopback, explícitamente permitir que ese destino en su `~/.opencodex/config.json` fila de proveedores. Por ejemplo, combinar este La entrada en el existente `providers` Objeto para un servidor de desarrollo local:

```json
{
  "orcarouter-oauth": {
    "adapter": "openai-chat",
    "baseUrl": "http://127.0.0.1:9999/v1",
    "authMode": "oauth",
    "allowPrivateNetwork": true
  }
}
```

Luego corre `ORCAROUTER_BASE_URL=http://127.0.0.1:9999 ocx login orcarouter-oauth`. El inicio de sesión conserva este consentimiento explícito; la configuración del URL por sí sola nunca habilita el acceso a la red privada. Sin la aceptación, la validación de destino rechaza la inferencia y el descubrimiento del modelo para ese punto final. Este requisito se refiere al punto final del proveedor; el oyente de devolución de llamada del navegador no necesita dicha aceptación. Vuelva a ejecutar el inicio de sesión después de un relé `401`; Las llaves OrcaRouter son duraderas y no tienen una concesión refresc-token.

**Meta Modelo API (`meta-model`).** Muse Spark en el propio punto final compatible con OpenAI de Meta, Servido sobre `/v1/responses`. Crear una clave en
[la consola de desarrolladores de Meta](https://dev.meta.ai/docs/authentication) — Meta llama a esto variable `MODEL_API_KEY`, pero opencodex deriva el env var del ID del proveedor, por lo que Exportar como **`META_MODEL_API_KEY`** (o lo pega durante `ocx init`) La cuenta necesita un método de pago antes de que servirá solicitudes, y cada llamada se mide por token. Tres Los modelos están sembrados, cada uno con una ventana de contexto de 1M: `meta-model/muse-spark-1.3` y
`meta-model/muse-spark-1.3-contributor` con el vendedor `minimal`/`low`/`medium`/`high`/`xhigh`
escalera, y `meta-model/muse-wonder-1.0` (Museo Maravilla, vista previa) con `minimal` a través `max`. Muse Wonder es el modo estándar solo en el modelo API: no tiene nivel de colaborador y cuesta $4 por 1M de entrada y $20 por 1M de salida tokens. Muse Wonder Full solo está disponible dentro de Muse Suscripciones de código, por lo que no se siembra. El descubrimiento se queda hasta que se verifica una lista autenticada, porque Meta sirve imagen y modelos de voz en el mismo host.

Dos cosas que vale la pena saber antes de elegirlo. **No se aplica una suscripción a Muse Code Aquí:** Meta-ámbito de esa credencial al código de Muse CLI y factura cualquier otra clave Pague según vaya. Y el nivel de colaborador es barato porque Meta entrena en sus indicaciones — aproximadamente 92% de descuento en la entrada, 96% de descuento en la salida y 99% de descuento en la entrada en caché —, así que mantén la confidencialidad material fuera de él. Muse Spark también es accesible a través de revendedores, con una lista más estrecha:
`command-code` Lleva ambos niveles, mientras que `opencode-go` Sólo sirve
`muse-spark-1.3-contributor`.

**Código Meta Muse (`meta-muse`).** Un inicio de sesión macOS simple ya prueba la clave API Almacenado por `muse login`. Sin credenciales locales, o en otra plataforma, se inicia el flujo de aprobación del dispositivo del navegador. Agregar cuenta y reautenticación omite la importación local para evitar Reutilizar la cuenta que se está reemplazando. OpenCodex nunca lanza el Muse CLI. Si el dispositivo inicia sesión falla sin cancelación, una superficie de entrada manual disponible puede aceptar una clave pegada; que la clave se enfrenta al mismo formato y validación del modelo API como una clave importada. En macOS, Aprobar el aviso de llavero en el host proxy en 120 segundos. Denegaciones de importación mostrar la razón de falla y ofrecer un campo de pegado de clave existente sin iniciar otro inicio de sesión. Agregar cuenta en un proveedor ya configurado omite la importación local. Véase
[Soporte de plataforma](/es/reference/platform-support/) para la imagen completa por plataforma.

Para iniciar cualquier inicio de sesión de Meta Muse a través de la administración, API requiere una sesión de panel. incluyendo add-account y reautenticación. Un encabezado token de administración en bruto o GUI falsificado recibe
`403 oauth_consent_required` antes de que se lea una credencial o comience una subvención. Esta puerta utiliza el principal de sesión resuelto por el servidor, no un recibo de casilla de advertencia registrado por separado. Direct `ocx login meta-muse` y otros proveedores de OAuth mantienen sus políticas de inicio de sesión existentes. Por lo tanto, la lista de proveedores de administración OAuth omite Meta Muse para los paneles raw-admin-token; abra un panel de control autenticado por sesión para usar ese flujo de inicio de sesión. Esto sólo cambia el descubrimiento, no las verificaciones de admisión en el inicio de sesión o la continuación manual.

Los tres sembrados `meta-muse` modelos (Muse Spark 1.3, su nivel de colaborador y Muse Wonder) exponer `minimal`/`low`/`medium`/`high`/`xhigh`/`max` a clientes enrutados, incluido el selector de esfuerzo de Grok. Solicitudes de uso
`User-Agent: muse-build/1.3.0 (opencodex compatibility)` Así que Meta acepta el código Muse Contrato de esfuerzo. Un proveedor explícito User-Agent anula este valor predeterminado y puede causar
`max` ser rechazado. En marcha `meta-model` Solo Muse Wonder acepta `max`sus filas de chispa y OpenCode Ir a mantener el `xhigh` techo. Publicidad `max` es el contrato del modelo y no prueba tu plan de código Muse cubre Muse Wonder.

**Lee esto antes de habilitarlo.** Meta-ámbitos de esa credencial en el código de Muse CLI, Usarlo aquí es un *sin soporte* camino. Meta no autoriza la cobertura de suscripción fuera de su propio cliente, cómo se establecen estas llamadas no es observable desde el API, y usted debe tratar cada llamada como facturable contra su cuenta. La clave, importada o pegada, se copia en Tienda de autenticación de OpenCodex (`~/.opencodex/auth.json`, modo 0600) como cualquier otro OAuth Credencial. El panel muestra una advertencia de Términos de Servicio antes del primer inicio de sesión y antes de cualquier reautenticación — el mismo tratamiento Anthropic y Google Antigravedad obtener.

Meta informa el uso de la ventana de suscripción dentro de las respuestas de transmisión, y OpenCodex La fila de la cuenta muestra las últimas ventanas observadas de 5 horas y semanales con la edad de esa lectura. — Meta no publica ningún punto final para consultarlos a pedido, por lo que un valor solo se actualiza con otro turno de transmisión a través de este proveedor y un turno que pasa por la traducción de solicitudes en lugar de passthrough informa ninguno. Una cuenta que aún no ha servido un turno de transmisión simplemente no muestra cuota, lo cual no es un error. Los límites de velocidad se aplican por equipo, no por clave.

Para una configuración compatible, use `meta-model` arriba con su propia clave.

**Cuota de código de comando.** El panel de control y `ocx account refresh` Código de comando de la sonda
`/alpha/billing/credits` ventanas (5 horas y semanal) en el canónico
`https://api.commandcode.ai` anfitrión. El ajuste preestablecido de OAuth (`command-code`) utiliza el almacenado portadora de cuenta; el preajuste de tecla Proveedor-API (`commandcode`) utiliza el activo configurado clave. Una base similar editada por el usuario URL nunca se prueba. Permanecer mensualmente, comprado, y Los créditos gratuitos se muestran como una ventana USD cuando el Código de Comando también informa sobre el período de gasto.

**SambaNova Cloud descubrimiento.** El preajuste lee el público de SambaNova Cloud `/v1/models` de la lista fija API host, conserva los identificadores nativos del proveedor y limita el descubrimiento a 128 KiB y 128 filas sin procesar. Porque el catálogo no está autenticado, el flujo de inicio de sesión CLI informa la clave como no verificable en lugar de tratar La respuesta pública como prueba. Las solicitudes de chat aún usan la clave Bearer configurada y desactivan en paralelo llamadas a funciones, que SambaNova aún no admite. Los endpoints de implementación privados de SambaStudio son fuera del alcance. Crear claves en
[Nube SambaNova](https://cloud.sambanova.ai/apis).

**Descubrimiento de la fábrica de tokens Nebius.** El preset solicita el catálogo de modelos verbose autenticado y mantiene solo filas cuya arquitectura produce texto, excluyendo modelos de incrustación y generación de imágenes. Conserva los identificadores nativos que contienen barras, además de los metadatos de contexto y modalidad de entrada informados, y limita descubrimiento en 512 KiB y 512 filas sin procesar. Los hosts de implementación dedicados están fuera del alcance. Crear claves en
[Fábrica de tokens Nebius](https://tokenfactory.nebius.com).

**Crusoe descubrimiento.** El preajuste basado en claves utiliza el `openai-chat` adaptador y envía su clave Bearer solo para el host de inferencia sin servidor fijo de Crusoe. `/v1/models` Rechaza solicitudes no autenticadas con 401, por lo que una respuesta de lista exitosa cuenta como validación de clave. Descubrimiento preserva barra delimitada IDs nativos como `zai-org/GLM-5.3` y `moonshotai/Kimi-K2.6` exactamente como Crusoe los devuelve y es Limitado a 256 KiB y 256 filas en bruto. Las filas se mantienen solo cuando informan `is_public: true` y un texto o multimodal `architecture.modality`, que excluye las implementaciones privadas de cuenta y cualquier incorporación o filas de medios. Los modelos de razonamiento devuelven su pensamiento en el Chat Completions
`reasoning` que el adaptador lee. Solo `openai/gpt-oss-120b` acepta un `reasoning_effort`
Escalera (`low`, `medium`, `high`); los otros modelos de razonamiento tratan el campo como una palanca de encendido / apagado, por lo que el preajuste declara que no hay escala de esfuerzo en todo el proveedor ni llamadas a herramientas paralelas en todo el proveedor. Tasa Se aplican límites por proyecto y por modelo (429 cuando se excede, 503 mientras que una implementación compartida escala), y Las cuentas nuevas comienzan con $5 de créditos gratis. Crear una clave en el
[Consola de Crusoe Cloud](https://console.crusoecloud.com) bajo Fundición de Inteligencia, Inferencia.

**DigitalOcean descubrimiento.** El preajuste utiliza una clave de acceso de modelo contra el Serverless compartido fijo Inferencia host y se cruza con el autenticado `/v1/models` Respuesta con DigitalOcean Chat Completions allowlist respaldado por documentos. Desconocido, solo Responses, incrustación y generación de medios Los IDs fallan al cerrarse. Discovery tiene un límite de 256 KiB y 256 filas en bruto; específico del agente y dedicado Los hosts están fuera de alcance. Crear una clave en el [Panel de Control de Seguridad](https://cloud.digitalocean.com/model-studio/manage-keys).

**Scaleway descubrimiento.** El preajuste cruza la lista de modelos autenticados con el Lista de permisos de Chat Completions sin servidor documentado. Desconocido, solo Responses, incrustación, La transcripción y otros identificadores de modelos de medios fallan; el descubrimiento está limitado a 128 KiB y 128 en bruto filas. Utiliza el punto final compartido del proyecto predeterminado; URL calificadas para el proyecto y URL dedicadas. implementaciones requieren un proveedor personalizado. Crear una clave API en el
[Consola Scaleway](https://console.scaleway.com/generative-api).

**Descubrimiento sin plumas.** El preajuste se autentica contra el host compatible con OpenAI fijo y solicita solo los primeros 100 modelos populares filtrados de origen para chatear y el plan actual. Secretaría reglas luego fallan cerrado a menos que cada fila informe independientemente de la disponibilidad del plan, no hay Puerta, y `features.tool_use: true`. El descubrimiento tiene un límite de 128 KiB y 100 filas en bruto, por lo que el servicio está El catálogo de decenas de miles de modelos nunca se descarga o almacena en caché por completo. Porque `/v1/models` está documentado como llamable con o sin autenticación, no puede probar que una clave suministrada sea válida; las solicitudes de chat aún usan la clave Bearer configurada. Reserva de términos sin plumas planes individuales para uso interactivo/de prototipos; las aplicaciones arbitrarias requieren un plan de escala. Crear una clave en el [Panel sin plumas](https://featherless.ai/account/api-keys).

**Novita descubrimiento.** El preajuste basado en claves utiliza el `openai-chat` adaptador y envía su clave Bearer solo para el host compatible con OpenAI fijo de Novita. Su lista de modelos públicos se filtra a filas que informan ambos `model_type: chat` y el `chat/completions` punto final, con descubrimiento limitado a 512 KiB y 256 filas en bruto. Los identificadores de los modelos deben conservarse exactamente como Novita los devuelve, incluidos los identificadores delimitados por barras, y no deben ser normalizados o reescritos antes del enrutamiento. Como el catálogo es público, los informes de inicio de sesión la clave como no verificable en lugar de tratar una respuesta de lista exitosa como prueba. Capacidades de modelo varíe, por lo que el ajuste preestablecido no anuncia llamadas de herramientas paralelas en todo el proveedor ni OpenAI `reasoning_effort`. Crear una clave en [Gerente clave de Novita](https://novita.ai/settings/key-management).

> **Alcance Baseten:** El preajuste cubre el valor compartido de Baseten [API de modelo](https://docs.baseten.co/inference/model-apis/overview)
Solo >. Utilice un personal [Clave API](https://docs.baseten.co/organization/api-keys) para uso local, o una clave de equipo > con **API de modelo de llamada** Acceso para uso compartido/producción. Truss dedicado `predict` los extremos usan diferentes Los hosts y esquemas > no se enrutan con este preajuste. El descubrimiento en vivo de > para este preajuste se limita a una respuesta de 1 MiB y 256 filas de modelos sin procesar.

<a id="official-codebuddy-code-cli-global--cn"></a>

### Código oficial CLI (Global y CN)

OpenCodex proporciona soporte de adaptador oficial para el código CLI de Tencent Cloud a través del `codebuddy` (Global) y `codebuddy-cn` (China) presets.

```json
{
  "providers": {
    "codebuddy": {
      "adapter": "codebuddy",
      "baseUrl": "https://www.codebuddy.ai",
      "apiKey": "${CODEBUDDY_API_KEY}"
    },
    "codebuddy-cn": {
      "adapter": "codebuddy",
      "baseUrl": "https://www.codebuddy.cn",
      "apiKey": "${CODEBUDDY_CN_API_KEY}"
    }
  }
}
```

- **Prerrequisitos:** Instale el CodeBuddy CLI oficial a nivel mundial:
  ```bash
  npm install -g @tencent-ai/codebuddy-code
  ```
- **Autenticación:** Obtenga su clave oficial API desde la consola del proveedor:
  - Global: [Llaves de CodeBuddy Global API](https://www.codebuddy.ai/profile/keys)
  - CN: [Llaves de CodeBuddy CN API](https://copilot.tencent.com/profile/keys)
- **Aislamiento de la región:** `codebuddy` y `codebuddy-cn` usar puntos finales canónicos separados (`https://www.codebuddy.ai` y `https://www.codebuddy.cn`) y ambientes infantiles aislados (`CODEBUDDY_INTERNET_ENVIRONMENT=public` Vs `internal`) Las credenciales son estrictamente regionales y nunca se intercambian entre entornos. La anulación de la base canónica URL falla cerrada.
- **Modelo Discovery:** el proxy solicita la configuración del producto CodeBuddy (`GET {baseUrl}/v3/config`) con la tecla configurada como `X-API-Key` encabezado, y la lista en esa respuesta es la lista autorizada de modelos descubiertos: es la configuración de la propia cuenta de la clave, por lo que se ha demostrado que pertenece a la clave —, una clave diferente o incorrecta responde al sobre anónimo sin lista en lugar de los modelos de otra cuenta. La lista autenticada es la misma lista que imprime el CLI para `--model` (la línea "actualmente soportada" de un CLI), puede diferir del manifiesto estático incluido con el CLI, y los selectores predeterminados del proveedor (`default` por CN, `default-model` para Global) nunca aparecen en él, pero permanecen accesibles: el catálogo los retiene durante el descubrimiento en vivo y en cada camino de reserva. Al iniciar/sincronizar, el proxy vincula la lista almacenada en caché a una huella digital irreversible de la clave configurada, por lo que un conmutador de clave nunca observa una lista almacenada en caché para la clave anterior, y se degrada a la caché obsoleta del proveedor/clave-huella digital, luego a la semilla estática en `src/providers/codebuddy-models.ts`, cuando la clave no se autentica o la solicitud falla. Los registros de fallos de detección contienen solo una categoría y un estado HTTP, sin el mensaje de la puerta de enlace o una excepción de transporte sin procesar. La solicitud de descubrimiento con credenciales no sigue a las redirecciones; una respuesta 3xx degrada la lista sin reenviar la clave a otro origen.
- **Propiedad de la herramienta y el puente de herramientas:** El CLI siempre se genera con `--tools ""` y `--strict-mcp-config`, por lo que no tiene herramientas propias incorporadas o configuradas por el usuario. Cuando una solicitud lleva un catálogo de herramientas Codex, el proveedor arma un puente MCP de solo captura: el catálogo validado y la configuración MCP se escriben en un dir temporal privado, el CLI se inicia con `--mcp-config` y una exacta `--allowedTools` lista, y el `system/init` frame debe informar exactamente ese servidor de puente como conectado o el turno falla cerrado. El puente anuncia las herramientas Codex y captura las llamadas propuestas, pero nunca ejecuta nada: se devuelve un lote de llamada de herramienta completado como `function_call` elementos (nombres asignados a los nombres de cable de la solicitud, como máximo 16 llamadas por mensaje de asistente), el árbol de procesos se termina en `message_stop`, y el cliente Codex externo solo realiza la aprobación, sandboxing y ejecución. Los bloques de uso de herramientas paralelos se almacenan en memoria intermedia y se devuelven como llamadas completas incluso cuando sus fragmentos se entrelazan o CodeBuddy reutiliza un índice de bloque de contenido. Un bloque que se deja abierto al final de turno, un reemplazo del mismo índice antes de completar los argumentos JSON o un fragmento de argumento que no se puede atribuir a un bloque abierto falla el turno en lugar de reenviar una llamada parcial o vacía. Los resultados de la herramienta vuelven como entrada de la siguiente solicitud, y la conversación continúa. Las solicitudes sin herramientas mantienen la forma de texto y razonamiento plano. Si el CLI escribe un DSML sin citar `calls` línea de control seguida de a `functions.*` invocar la línea de control en texto o razonamiento, OpenCodex rechaza el turno en lugar de reenviar el andamio o interpretarlo como una llamada ejecutable. DSML discutido o citado en prosa, código en línea, código cercado o ejemplos de fuente sigue siendo texto de respuesta ordinario.
- **Aplicación de elección de herramienta:** Cuando una solicitud especifica `tool_choice: "required"` o selecciona una herramienta con nombre específico, el puente espera una llamada a la herramienta del modelo. Si el CLI completa el turno con texto sin formato en lugar de capturar una llamada a la herramienta, el OpenCodex falla al cerrarse con un 502 `tool_call_required` error en lugar de devolver un texto no válido.
- **Estado de gobierno:** Si el enrutamiento de esta superficie de automatización del proveedor detrás de un proxy para un agente de terceros satisface los términos de uso aceptable de CodeBuddy es una pregunta abierta marcada para la revisión de seguridad del mantenedor (consulte la nota de gobierno en la entrada del registro del proveedor). Trate a este proveedor como pendiente de esa revisión, y tenga en cuenta el límite de propiedad del puente de herramientas: la CLI anidada anuncia las herramientas pero nunca las ejecuta, y la aprobación, el sandboxing y la ejecución permanecen con el cliente externo Codex.
- **Derechos y facturación:** El proveedor utiliza la misma cuenta CodeBuddy/superficie de autenticación CLI documentada por el proveedor. La disponibilidad y la facturación de los créditos gratuitos, promocionales, de prueba o de suscripción siguen estando determinadas por el derecho de cuenta de CodeBuddy del usuario.

<a id="official-qoder-cli-global--cn"></a>

### Oficial Qoder CLI (Global y CN)

OpenCodex proporciona soporte oficial del adaptador para Qoder a través de la `qoder` (Global) y `qoder-cn` (China) presets. Ambos utilizan un token de acceso personal suministrado por el usuario y el CLI sin cabeza del proveedor; OpenCodex nunca lee sesiones de escritorio de Qoder, cookies del navegador, actualizar tokens o API de consola privada.

```json
{
  "providers": {
    "qoder": {
      "adapter": "qoder",
      "baseUrl": "https://qoder.com",
      "apiKey": "${QODER_PERSONAL_ACCESS_TOKEN}"
    },
    "qoder-cn": {
      "adapter": "qoder",
      "baseUrl": "https://qoder.cn",
      "apiKey": "${QODERCN_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

- **Prerrequisitos:** Instale el CLI oficial para la región que utiliza:
  ```bash
  npm install -g @qoder-ai/qodercli        # Global: qoder / qodercli
  npm install -g @qodercn-ai/qoderclicn    # CN: qodercn / qoderclicn
  ```
- **Autenticación:** Crear un PAT en la página de integraciones de cuenta ([Mundial](https://qoder.com/account/integrations), [NC](https://qoder.cn/account/integrations)) y pegarlo como clave API del proveedor. La clave almacenada llega a la CLI solo como `QODER_PERSONAL_ACCESS_TOKEN` (Global) o `QODERCN_PERSONAL_ACCESS_TOKEN` (CN) en un entorno infantil de alcance.
- **Aislamiento de la región:** Cada preajuste acepta solo su destino canónico (`https://qoder.com` o `https://qoder.cn`y resuelve su propio ejecutable. Las credenciales, el caché del modelo, el uso y la salud son independientes; ninguna región vuelve a la otra. Un proveedor personalizado más antiguo llamado `qoder` con un destino diferente mantiene su adaptador existente y URL.
- **Modelo Discovery:** `qoder --list-models` es la lista autorizada de derechos para el PAT actual. La caché está vinculada a una huella digital irreversible de la token, por lo que cambiar de cuenta nunca reutiliza la lista de otra cuenta. Si el descubrimiento falla, el proveedor se degrada a una caché obsoleta y luego a la semilla estática documentada.
- **Uso del token:** Qoder CLI informa de cero recuentos de token a menos que su interruptor de uso esté encendido, por lo que cada preajuste lo enciende en su entorno hijo CLI con alcance: `QODER_EXPOSE_TOKEN_USAGE=true` para Global y `QODERCN_EXPOSE_TOKEN_USAGE=true` para CN, que solo lee su propio prefijo.
- **Propiedad de la herramienta:** El CLI se ejecuta en un solo giro `stream-json` con `--tools ""`, `--strict-mcp-config`, desactivando las fuentes y desactivando la persistencia de sesión, por lo que Codex mantiene la propiedad exclusiva de la herramienta. Las herramientas declaradas por el cliente se exponen a través de un servidor MCP con alcance de solicitud aislado.
- **Entrada de imagen:** Qoder Global acepta la entrada de imágenes a través del Qoder CLI. OpenCodex reenvía las entradas de imagen compatibles que llegan al adaptador Global a la CLI sin mantener una lista de permisos de capacidad de visión por modelo allí. La compatibilidad de imágenes y cualquier preprocesamiento o enrutamiento específico del modelo son manejados por Qoder. OpenCodex no utiliza la lista de reserva de descubrimiento estático para clasificar la capacidad de visión por modelo. Qoder CN mantiene su clasificación de sidecar existente, y cualquier solicitud de imagen bruta residual que llegue al adaptador CN se rechaza como `unsupported_input_modality`. OpenCodex serializa el historial antes del turno actual, pero Qoder no persiste las sesiones, por lo que las imágenes anteriores se reproducen en turnos posteriores. En las conversaciones de imágenes observadas de varios giros, las imágenes reproducidas pueden asociarse de manera poco confiable u ordenarse efectivamente en relación con el texto histórico que acompañaron originalmente.
- **Recuperación de PAT:** Para ambos configuración preestablecidos de Qoder, un grupo de teclas API puede cambiar a otro PAT en un rechazo de autenticación compatible o agotamiento de cuota a nivel de cuenta, pero solo antes del contenido de respuesta o un evento que hace que la reproducción sea insegura. La recuperación requiere una clasificación específica de Qoder y respeta los presupuestos de envío y salto de credenciales; un mensaje HTTP 401/429 o de cuota solo no es permiso para reproducir. Las configuración de una sola tecla no giran. Compartir el corredor CLI no habilita esta recuperación de clave API para CodeBuddy o Claude CLI autoautenticado.
- **Contingente:** No se utiliza cuota pública API, por lo que los totales y los tiempos de reinicio no están disponibles. Códigos 110 (límite diario de cuenta) y 118 (agotamiento personal de créditos) `insufficient_quota` y permitir la consideración de la recuperación PAT. Otros códigos de cuotas soportados también informan `insufficient_quota` pero no lo autorices. Los códigos de error numéricos tienen prioridad: un código numérico no reconocido no vuelve a la cuota o al texto de autenticación. Sin un código numérico, solo el mensaje diario de la cuenta compatible que comienza con “Ha alcanzado su límite de uso diario para Chat”, sin equipo/modelo/calificador compartido, otorga recuperación de cuota; el texto genérico de límite de crédito no lo hace. Solo los fallos de cuota elegibles para la recuperación de PAT ingresan al manejo de enfriamiento de claves. Cuando un fallo de este tipo no tiene tiempo de reinicio, la clave fallida utiliza el tiempo de reutilización predeterminado existente; las clasificaciones de cuotas no recuperables no crean un tiempo de reutilización a través de esta ruta y no se infiere ningún reinicio del día siguiente.
- **Operadores:** Qoder Global es operado por BRIGHT ZENITH PRIVATE LIMITED bajo el [términos de servicio del producto](https://qoder.com/product-service); Qoder CN by ?(?)? con Alibaba Cloud. Verificar `ocx provider test qoder` (o `qoder-cn`) después de configurar.

<a id="claude-code-cli-subscription"></a>

### Claude Code CLI (suscripción)

OpenCodex puede gastar una suscripción a Claude a través del propio arnés de Anthropic en lugar de reproducir una Claude Code identidad contra el Messages API. Los `claude-cli` preset ejecuta el Claude Code oficial CLI sin cabeza (`claude -p`, `stream-json`) una vez por turno:

```json
{
  "providers": {
    "claude-cli": {
      "adapter": "claude-cli",
      "baseUrl": "https://api.anthropic.com"
    }
  }
}
```

- **Prerrequisitos:** `npm install -g @anthropic-ai/claude-code`, luego inicie sesión una vez con `claude`
  (o `claude setup-token`) El CLI utiliza el propio inicio de sesión Claude Code de la máquina (el llavero macOS) entrada, o `~/.claude/.credentials.json` en otros lugares).
- **Ninguna credencial almacenada:** esta fila no tiene ninguna clave API, y OpenCodex nunca lee, copia o reenvía a Claude token. El CLI posee el inicio de sesión y factura la cuenta en sí. Un CLI que no haya iniciado sesión falla el turno con un error de inicio de sesión que nombra el comando, en lugar de un `401`. La clasificación sigue el mismo hecho: el preajuste es una fila de teclas sin llave (`keyOptional`), por lo que necesita no se ofrece ninguna clave API y ningún campo de clave para ello. Una clave API guardada en esta fila por otros medios nunca es entregado al arnés — clave de facturación pertenece a la `anthropic-apikey` preestablecido.
- **En el panel de control:** el selector Añadir proveedor enumera este preajuste bajo **Pagado**, con las filas API, y lo marca con un **Suscripción CLI** insignia en lugar de **Libre** — aquí significa el CLI posee la cuenta, no es que el tráfico sea libre. Seleccionarlo muestra una advertencia en lugar de la clave campo: esta no es una ruta de acceso de clave API, controla la CLI iniciada (`claude -p`) y las facturas que suscripción, y una clave ingresada para ella nunca se usa. El espacio de trabajo de los proveedores cuenta y filtra es como pagado y muestra **Suscripción CLI** como su modo auth. Cualquier proveedor con
  `"adapter": "claude-cli"` se trata de la misma manera, incluyendo una fila renombrada o escrita a mano: el dashboard lo enumera como listo sin una clave y nunca pide uno.
- **Un inicio de sesión sirve a todo el proxy:** el arnés lee el inicio de sesión Claude Code del usuario OpenCodex se ejecuta como, por lo que cada solicitud enrutada a través de esta fila — desde cualquier cliente del proxy — gasta esa cuenta Claude. No hay ninguna cuenta por cliente, sin agrupación y sin multiplexación; dar a varias personas su propio uso Claude necesita un usuario proxy por inicio de sesión.
- **Medios de entrada:** la fila publica sus modelos como texto solo para v1. El CLI acepta un marco de imagen en su entrada stream-json, pero no se ha mostrado ningún giro sin cabeza para entregar esos bytes al modelo, por lo que se rechaza una imagen enviada directamente a este proveedor (`unsupported_input_modality`) en lugar de ser bajado en silencio y respondió ciego. Con el Sidecar de visión en la ruta de solicitud, las imágenes se subtitulan en texto antes de llegar a la fila.
- **Aislamiento:** cada turno se ejecuta en un entorno infantil con alcance sin herencia `ANTHROPIC_*`
  variable (a) `claude` por lo tanto no puede volver a él), la telemetría, retroalimentación y el auto-actualizador desactivado, y `--tools ""`, `--strict-mcp-config` más
  `--setting-sources ""`. El arnés no carga ningún servidor CLAUDE.md, habilidad, gancho, plugin o MCP desde el máquina y no puede leer, escribir, ejecutar ni navegar. No se mantiene ninguna sesión entre turnos. Los oficial CLI se encuentra en `PATH`, o en la ubicación de instalación nativa (`~/.local/bin/claude`) cuando un servicio inicia OpenCodex con una versión anterior `PATH`.
- **Indicación del sistema:** El sistema del llamante y las indicaciones del desarrollador reemplazan el preajuste Claude Code (`--system-prompt-file`), por lo que el turno responde al contrato del cliente en lugar del arnés persona. El indicador plegado se organiza en un archivo privado por turno (modo `0600`y por el camino, porque los argumentos del proceso son legibles en todo el mundo a través de la lista de procesos; una solicitud que lleva ni un sistema ni una solicitud de desarrollador solo reciben las instrucciones fijas de repetición de conversación.
- **Almacenamiento en caché de conversación:** cada mensaje se reproduce como un bloque de texto estable separado, con el mensaje actual formateado idénticamente a su representación histórica posterior. La larga historia se corta sólo en los puntos de control de todo el mensaje. Los catálogos de herramientas se serializan de manera determinista. Claude Code controla los puntos de interrupción de la caché, por lo que esto hace posible la reutilización de la caché rápida sin garantizarla.
- **Propiedad de la herramienta:** cuando la solicitud lleva herramientas, un catálogo MCP aislado solo captura expone solo las herramientas seleccionadas por el cliente (el mismo puente que CodeBuddy usa). El CLI captura la llamada y el turno termina allí; aprobación, sandboxing, ejecución y el resultado devuelto se queda con Codex, Pi u otro cliente. Las herramientas integradas y todos los demás servidores MCP permanecen desactivados.
- **Límites de suscripción:** antes de cada lanzamiento OpenCodex pide el punto final de uso de Anthropic, El propio inicio de sesión de CLI se lee en la memoria, ya sea la ventana de 5 horas, semanal o específica del modelo del plan. lleno. Un plan agotado es rechazado localmente con HTTP 429 `claude_subscription_cooldown` y a
  `Retry-After` para el restablecimiento, en lugar de iniciar un CLI que fallaría. La respuesta se almacena en caché para Un minuto en `claude-usage-admission.json` bajo el hogar OpenCodex (porcentajes, tiempos de reinicio y ej., una clave de cuenta hash solamente). Si el cheque no puede ejecutarse, el turno continúa.
- **Destino:** Los nombres canónicos `https://api.anthropic.com` Porque ahí es donde el El tráfico de la suscripción aterriza. OpenCodex nunca envía esa solicitud por sí misma, y anula la base URL falla cerrado en lugar de entregar el giro a otro entorno.

> **Términos:** este ajuste preestablecido gasta su suscripción a Claude a través de la propia Anthropic de CLI. Si La conducción > que se arnés sin cabeza de un proxy se ajusta a los términos de su plan es una pregunta entre usted y > Anthropic. OpenCodex no convierte el inicio de sesión en una clave API y no reproduce las claves CLI > Identidad HTTP.

<a id="a6api-credit-quota"></a>

### Cuota de crédito A6API

Una costumbre `openai-chat` proveedor utilizando `authMode: "key"` y el canónico
`https://api.a6api.com` o `https://api.a6api.com/v1` base URL recibe un medidor de crédito A6API en el panel y de `ocx account refresh <provider>`. El nombre del proveedor es arbitrario; detección utiliza el punto final canónico HTTPS. El medidor convierte las unidades A6API token en USD utilizando la cuenta de límite de crédito duro y muestra el porcentaje consumido más el crédito restante. El token es no se muestra como un restablecimiento de la cuota porque el vencimiento no implica que el crédito se reponga.

```json
{
  "providers": {
    "my-a6": {
      "adapter": "openai-chat",
      "authMode": "key",
      "baseUrl": "https://api.a6api.com/v1",
      "apiKey": "${A6API_API_KEY}"
    }
  }
}
```

Las sondas de cuota envían solo la clave activa al host canónico A6API y rechazan las redirecciones. Malformado, Los totales de facturación negativos o internamente inconsistentes no producen ningún informe en lugar de una barra engañosa.

> **Restricción de uso del Plan de codificación de Tencent Cloud:** Tencent documenta esta suscripción para Solo herramientas de codificación interactiva >. General API automatización, backends de aplicaciones personalizados y El uso por lotes no interactivos de > está prohibido y puede provocar la suspensión de la clave del plan.

> **Rutas de facturación GLM:** `zai` es la suscripción internacional al plan de codificación Z.AI; `zhipu-bigmodel`
> es el punto final nacional de pago por uso de BigModel de Zhipu. Diferentes hosts, diferentes teclas, diferentes > facturación — una clave emitida para uno no autenticar contra el otro.

<a id="bigmodel-coding-plan-over-responses"></a>

### Plan de codificación BigModel sobre Responses

Seleccionar **Zhipu AI — Plan de codificación BigModel (Responses)** (`zhipu-bigmodel-responses`) por el `openai-responses` punto final `https://open.bigmodel.cn/api/v1`. Esto es separado Desde `zhipu-bigmodel-coding`, que utiliza Chat Completions en `/api/coding/paas/v4`.

El preset utiliza un **Lista estática** (`liveModels: false`) tomado de la publicación
[GLM Documentación del plan de codificación](https://docs.bigmodel.cn/cn/coding-plan/tool/codex.md):

| Modelo | Contexto tokens | Esfuerzo seleccionable ascendente | Esfuerzo predeterminado | Resúmenes de razonamiento |
| --- | ---: | --- | --- | --- |
| `glm-5.3` | 1,048,576 | `low`, `high`, `max` | `max` | Apoyado |
| `glm-5.3-flash` | 1,048,576 | `low`, `high`, `max` | `max` | Apoyado |
| `glm-5-turbo` | 204,800 | Ninguno (lista vacía) | `max` | Apoyado |

`glm-5.3` y `glm-5-turbo` declarar entrada de solo texto ascendente. El catálogo Codex anuncia texto e imagen para ellos porque el sidecar de visión existente de opencodex puede describir imágenes para modelos de solo texto; esa ruta requiere una visión disponible y habilitada sidecar y no reclama soporte de imagen BigModel nativo.

`glm-5.3-flash` es la excepción: declara nativo `text` y `image` entrada, porque upstream lo documenta como un modelo multimodal nativo. Por lo tanto, lee imágenes directamente en lugar de ser encaminado a través del desvío del primer sidecar descrito.

El modelo predeterminado es `glm-5.3`; El contenido de razonamiento Responses se conserva en la repetición. La exportación Codex existente agrega su compatibilidad
`ultra` nivel a GLM-5.3 y omite el campo de esfuerzo predeterminado de Turbo porque Turbo no tiene escalera seleccionable; los metadatos del proveedor todavía registran `max` para ambos modelos. Para Turbo, las solicitudes Responses salientes omiten `reasoning.effort`, incluyendo una llamada
`max` o `ultra`, preservando al mismo tiempo los resúmenes de razonamiento solicitados. Esto deja el esfuerzo selección al valor predeterminado ascendente; opencodex no inyecta un cable seleccionable o `max`.

El ejemplo `models.json` es un archivo de catálogo local, no una lista de modelos HTTP documentada respuesta, y no el conjunto de modelos que el punto final sirve a — el estado de las páginas del Plan de codificación que cada nivel del plan alcanza GLM-5.3 y GLM-5.3-Flash, y que las llamadas GLM-5-Turbo son auto-switched a Flash, por lo que este punto final ya estaba sirviendo Flash bajo el Turbo id. Este preajuste aún no realiza el descubrimiento de modelos en vivo. Un proveedor personalizado existente con el mismo nombre mantiene su destino configurado y metadatos. CLI clave de inicio de sesión también se salta el indocumentado `/models` validación de la sonda y los informes como desconocido; la autenticación de clave exitosa se establece mediante una solicitud de inferencia posterior.

<a id="multiple-api-keys"></a>

### Múltiples teclas API

Los proveedores basados en claves también pueden mantener múltiples claves. Agregar una clave a través de la página Proveedores la almacena bajo `provider.apiKeyPool`, lo hace activo y lo refleja `provider.apiKey` Así que el enrutamiento y Los adaptadores siguen leyendo el mismo campo que antes. El mismo menú desplegable puede cambiar o quitar teclas; el administración API es `/api/providers/keys` y devuelve solo las teclas enmascaradas.

<a id="switching-accounts-from-the-terminal"></a>

### Cambio de cuentas desde la terminal

Uso `ocx account list`, `ocx account current`, y `ocx account use` para inspeccionar o cambiar el mismo Grupos de teclas Codex, OAuth y API sin abrir el panel de control. Ver la
[Referencia CLI](/es/reference/cli/providers-accounts/#ocx-account-subcommand) para los comandos, salida JSON, y Comportamiento de nueva sesión.

<a id="subscription-tier-in-account-listings"></a>

#### Nivel de suscripción en los listados de cuentas

`ocx account list <provider> --json` y `GET /api/oauth/accounts` informe a `plan` campo en cada cuenta OAuth, utilizando el mismo nombre y ubicación que el proveedor OpenAI/Codex para que un consumidor pueda Lea una forma entre los proveedores.

El campo siempre está presente. Es `null` cuando se desconoce el nivel, lo cual es deliberado: una
**ausente** key significa que el proxy es anterior a este campo, mientras que `null` significa que esta versión miró y el proveedor no reportó un nivel. Colapsar los dos permitiría a un consumidor asumir silenciosamente un nivel.

Para las cuentas Anthropic (ambas agrupaciones) el valor proviene del perfil de cuenta autenticado que OpenCodex ya lee: el nivel de límite de velocidad de la organización, reportado como etiquetas como `max_20x`,
`max_5x` o `pro`. Se registra al iniciar sesión, importación local de Claude Code y actualización de token. Porque Google Antigravedad el valor es el nivel pagado de `loadCodeAssist` (Por ejemplo `g1-pro-tier`), volver al nivel actual. Una lectura fallida guarda la última etiqueta grabada; una lectura que responde sin un informe de nivel `null`. El nivel nunca se deriva de los porcentajes de cuota, porque estos son normalizado por cuenta: un asiento Max ×5 al 50% es indistinguible de un asiento Max ×20 al 50%.

<a id="gpt-56-preview-paths"></a>

### GPT-5.6 rutas de vista previa

GPT-5.6 Sol / Terra / Luna se siembran en las listas de reserva del proveedor, así `ocx sync` puede mantener los modelos visible incluso mientras los catálogos en vivo están rezagados:

| Ruta Codex | IDs de modelos de semillas | Codex-visible contexto |
| --- | --- | --- |
| Inicio de sesión Codex (Pool o Direct) | `gpt-5.6-*` | 922,000 |
| OpenAI (llave API) | `openai-apikey/gpt-5.6-*` más `*-pro` | 922.000 (922.000 entradas máximas) |
| OpenRouter | `openrouter/openai/gpt-5.6-sol`, `openrouter/openai/gpt-5.6-terra`, `openrouter/openai/gpt-5.6-luna` | 922,000 |
| Cursor | `cursor/gpt-5.6-sol`, `cursor/gpt-5.6-terra`, `cursor/gpt-5.6-luna` | 1,000,000 |

Las entradas nativas GPT-5.6 preservan las escaleras de razonamiento de origen ancladas (por ejemplo, Luna tiene
`max` pero no `ultra`) Las entradas enrutadas usan sus metadatos de proveedor y mapeos de razonamiento. Los cuatro las vías permanecen abiertas en sentido ascendente; El descubrimiento en vivo de Cursor filtra adicionalmente su semilla estática a los modelos la cuenta iniciada puede utilizar.

:::note[Pasarelas y proxies de suscripciones]
Se incluye un proveedor cuando opencodex tiene un adaptador de cable correspondiente, **no** basado en si es un producto "agente". Los identificadores de adaptador actuales son `openai-chat`, `openai-responses`, `anthropic`, `google`
(modos AI Studio, Vertex y Antigravedad / Cloud Code Assist), `azure` / `azure-openai`, `kiro`, y
`cursor`. Un propietario API sin una de estas implementaciones, como Amazon Bedrock nativo, No se apoya directamente.

La configuración del proveedor selecciona el adaptador; la selección de transporte de origen es independiente. Elegible El tráfico Responses puede usar WSS con [Enrutamiento proxy explícito](/es/reference/proxy-formats/#json-and-sse-output). La configuración del proxy WebSocket no válida o no compatible vuelve a HTTP/SSE, que utiliza el
[servidor configurado fetch](/es/reference/configuration/server/). Un servidor proxy SOCKS5 de
`config.proxy` o un SOCKS5 heredado `ALL_PROXY` utiliza el túnel incorporado cuando `NO_PROXY` hace No eximir al objetivo. Las variables proxy HTTP(S) específicas del esquema conservan su manejo nativo separado; no SOCKS
`ALL_PROXY` No es un nativo HTTP fetch ruta.

**GitHub Copiloto** es un proveedor de OAuth (`ocx login github-copilot`) que intercambian a GitHub
inicio de sesión de device-flow para un Copiloto de corta duración API token — no un pegado API clave. **Dúo GitLab** permanece una puerta de enlace clave/suscripción-token en su punto final compatible con OpenAI. **Cloudflare AI Pasarela** necesita su cuenta + identificadores de pasarela rellenados en el URL.

Copilot utiliza automáticamente Auto cuando cada fila válida en un catálogo de cuenta no vacía explícitamente indica que la selección manual no está disponible. Los permisos faltantes o mal formados retienen rutas con nombre; el selector elimina solo filas explícitamente denegadas. Suministros de descubrimiento de solo auto `github-copilot/auto`, y GitHub selecciona el modelo real por solicitud. Esto no cambia los permisos de suscripción. Las listas de permisos de modelos ordinarios, el estado pendiente/deshabilitado y la política de nuevo modelo también se aplican a la visibilidad automática. Si las selecciones guardadas o la directiva ocultan Auto, seleccione o habilite la fila Auto antes de usarla. Existentes Las preferencias manuales permanecen guardadas. Un modelo llamado `auto` solo no anula la evidencia de la cuenta.

Auto sigue el protocolo de sesión e intención en público
[VS Copilot Aplicación de chat](https://github.com/microsoft/vscode-copilot-chat/blob/7b70532a4cbdfa61c2b30fe4ccffda3d89336a4d/src/platform/endpoint/node/automodeService.ts). Se trata de una integración experimental del cliente, no un contrato documentado de terceros API; GitHub puede cambiar los permisos del protocolo o de la cuenta. Auto utiliza el modelo seleccionado Endpoint anunciado para cada solicitud. El enrutamiento intencional envía solo el texto de usuario más reciente, limitado localmente en 32,768 unidades de código UTF-16; la inferencia real mantiene la entrada completa. La negociación tiene un carácter local presupuestos defensivos de 512 entradas de catálogo / grupo / candidato, 1 MiB por respuesta exitosa y ocho segundos por llamada, incluyendo ritmo y lecturas de cuerpo. Estas son las salvaguardas OpenCodex, no están documentadas Los límites de GitHub; catálogos de gran tamaño, negociación lenta o un extracto de intención truncado pueden afectar la compatibilidad.

Para las selecciones con nombre, Copilot presenta un catálogo de cables mixtos: los siguientes modelos (`gpt-5.3-codex`, `gpt-5.4`,
`gpt-5.4-mini`, `gpt-5.5`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `grok-4.5`, `grok-4.6`, `mai-code-1.1-flash`, `mai-code-1-flash-picker`) Rechazar
`/chat/completions` para el tráfico de agentes, por lo que opencodex enruta esos modelos Responses API por defecto incorporado, mientras que cualquier otro modelo Copilot permanece en el chat Finalizaciones. La precedencia es: pin de alambre duro → su explícito
[`modelAdapters`](/es/reference/configuration/providers/) entrada Registro → predeterminado → adaptador de todo el proveedor. Para optar por un modelo sin un valor predeterminado incorporado (por ejemplo
`gpt-5.4-nano`) en Responses, conjunto `"modelAdapters": { "gpt-5.4-nano": "openai-responses" }`.

Cursor se rastrea por separado como un adaptador experimental. `adapter: "cursor"` aparece en `ocx init`
y el selector Add Provider del panel como una entrada de configuración local experimental con Cursor's metadatos estáticos del catálogo de modelos de reserva. Cursor acceso token está configurado, opencodex usos Cursor's vivo HTTP/2 transporte. Conjunto `upstreamHttpVersion: "http1.1"` cuando un proxy requiere Cursor de HTTP/1.1 ruta de compatibilidad; la configuración cubre tanto la inferencia como el descubrimiento del modelo en vivo y se expone en
**Proveedores → Cursor → Configuración → Cursor transporte**. Su semilla de reserva incluye `gpt-5.6-sol` / `terra` / `luna` (1M contexto), filas regulares/rápidas para Grok 4.5, 4.6 y 4.7 (500K), y `kimi-k3` (262K); el descubrimiento en vivo decide cuál permanecer visible para la cuenta. Grok 4.6 y 4.7 exponer `low` / `medium` / `high` / `xhigh` En ambas formas, mientras que 4.5 se detiene en `high`. Las solicitudes rápidas Grok 4.5 y 4.6 envían el modelo base correspondiente con una configuración separada
`effort` y `fast=true` `requested_model` parámetros; sus aplanados
`cursor-grok-{version}-{effort}-fast` ids son solo identidades de descubrimiento y selector. Grok 4.7 aparece sin el `cursor-` Prefijo y envía `grok-4.7-{effort}-fast` directamente. Cursor sirve Kimi K3 solo como ids de alambre con sufijo de esfuerzo, así que
`cursor/kimi-k3` expone a `low` / `high` / `max` Escalera y valores predeterminados `max`, igualando el modelo documentado API por defecto. Cursor lectura/escritura/eliminación nativa impulsada por servidor/ls/grep/shell/ejecución de fetch está deshabilitado de forma predeterminada porque omite la aprobación de Codex y la ruta sandbox; establecer
`unsafeAllowNativeLocalExec: true` en el `providers.cursor` objeto en `~/.opencodex/config.json`
solo para experimentos locales de confianza (o a través de **Proveedores → Cursor → Editar JSON** en el panel). Solicitudes de shell nativo en primer plano (`shellArgs` y `shellStreamArgs`) permanecen no disponibles en Windows, macOS y Linux incluso con esta opción: opencodex los rechaza antes de comenzar un proceso hasta que tenga un propietario descendiente respaldado por el kernel. Utilice la herramienta de shell del cliente en su lugar. Sin comando se recopila la salida; los shells de fondo y los ejecutores MCP/desktop configurados por separado no cambian. Ver la [Referencia de configuración](/es/reference/configuration/providers/#cursor-provider-adapter-cursor)
Para un ejemplo completo. MCP, grabación de pantalla y uso del ordenador están disponibles como ganchos ejecutor; sin un configurado el ejecutor local, opencodex devuelve los resultados sin ejecutor escritos en lugar del bloqueo de directivas la solicitud. Cursor OAuth y el descubrimiento de modelos en vivo están habilitados para este adaptador experimental; Cursor todavía no se muestra en las listas de inicio de sesión clave.
:::

<a id="ollama-cloud"></a>

### Ollama Nube

La nube de Ollama es una Ollama alojada (no local). Configurarlo en `https://ollama.com/v1` con una llave Desde [ollama.com/configuración/claves](https://ollama.com/settings/keys). opencodex lo alcanza Ollama propia REST API (`POST /api/chat`en lugar de la superficie compatible con OpenAI, y descubre la lista de modelos en vivo del proveedor, por lo que los nuevos modelos Ollama Cloud aparecen sin una configuración cambio. opencodex clasifica su nube capacidad de visión, por lo que el [visión sidecar](/es/guides/sidecars/) Solo se mete por Modelos de texto solamente. Modelos solo de texto (e.g. `glm-5.2`, `deepseek-v4-flash`, `gpt-oss`, `qwen3-coder`,
`minimax-m2.x`, `nemotron-3-*`) están listados en `noVisionModels`; modelos nativos de visión (e.g.
`kimi-k2.6`, `minimax-m3`, `gemma4`, `qwen3.5`, `gemini-3-flash-preview`) no lo son. El emparejamiento es tolerante de Ollama `:size` etiquetas, así que `gpt-oss` cubiertas `gpt-oss:120b` y `gpt-oss:20b`.

Ollama actualmente documenta salidas estructuradas como no compatibles en Ollama Cloud. Por canónico
`ollama-cloud`, opencodex por lo tanto rechaza las solicitudes de salida estructuradas (`text.format`) con un claro error en lugar de devolver silenciosamente prosa sin restricciones; local y `ollama-native`
los puntos finales mantienen el nativo de Ollama `format` comportamiento.

<a id="4-local-providers"></a>

## 4. Proveedores locales

Punto opencodex en un servidor local compatible con OpenAI — generalmente con una clave en blanco:

| Proveedor | URL base |
| --- | --- |
| Ollama | `http://localhost:11434/v1` |
| vLLM | `http://localhost:8000/v1` |
| LM Studio | `http://localhost:1234/v1` |

<a id="any-openai-compatible-endpoint"></a>

## Cualquier punto final compatible con OpenAI

Si un proveedor habla Chat Completions, el `openai-chat` adaptador maneja — elegir **Personalizado** en el panel de instrumentos o `custom` en `ocx init` e introduzca la base URL. Ver la
[Referencia de configuración](/es/reference/configuration/) para cada campo de proveedores (`headers`, `noReasoningModels`, `noVisionModels`, `models`, …).

<a id="approval-reviewer-per-provider"></a>

## Revisor de aprobación por proveedor

Codex le pide a un segundo modelo que revise las solicitudes de aprobación, y toma ese revisor de
`auto_review_model_override` en la fila del catálogo del modelo actual de turno. La raíz
`auto_review_model` en `$CODEX_HOME/config.toml` es la reserva de Codex. El dashboard global
**Anulación de revisión automática** en Configuración del modelo se aplica un revisor a todas las filas de catálogo que no tener un revisor con alcance de proveedor. Almacena `autoReviewOverride` en `~/.opencodex/config.json`; el La configuración debe estar habilitada y nombrar un modelo. Una configuración habilitada sin modelo permanece sin aplicar y deja el fallback Codex en efecto. Una actualización de catálogo es un estado separado: después de un guardar puede permanecer pendiente, y la página Modelos informa de ello para que pueda volver a intentarlo con `ocx sync`. Desde el CLI, lea El ajuste con `ocx models auto-review status` o cambiarlo con `ocx models auto-review set <model|-> [--enabled <on|off>]`; utilizar `-` Para limpiar el modelo. CLI salida recomienda `ocx sync` cuando se puede volver a intentar una actualización. Si una actualización falla, el La configuración permanece guardada y el comando sale 1. Resolver el fallo antes de la sincronización. Para dar una ruta proveedor de su propio — generalmente más barato — revisor, establecer el selector en esa fila de proveedor en
`~/.opencodex/config.json`:

```json
{
  "providers": {
    "blsc": {
      "autoReviewModel": "opencode-go/deepseek-v4-flash",
      "autoReviewModelOverrides": { "kimi-k3": "gpt-5.6-terra" }
    }
  }
}
```

`autoReviewModel` cubre todas las filas enrutadas del proveedor. `autoReviewModelOverrides` Objetivos a modelo upstream único y gana sobre él. Un valor es un id de modelo desnudo de ese mismo proveedor. o un slug de catálogo público como `opencode-go/deepseek-v4-flash`, y un sello de proveedor gana sobre el selector de raíz en sus propias filas, mientras que el selector de raíz se mantiene la reserva en otro lugar.

Un valor desnudo se resuelve primero contra las propias filas del proveedor y luego contra una fila de catálogo desnuda, Así es como un modelo como el `gpt-5.6-terra` se nombra; un valor que no coincide con ninguno sin resolver, y un valor desnudo que aterriza fuera del proveedor imprime una nota Suministra al revisor. Dando la babosa completa evita la pregunta por completo cuando el revisor es modelo de otro proveedor.

Los selectores se resuelven contra el catálogo final en la siguiente sincronización, cada uno por su cuenta, y cada cerrado por sí mismo: una solución no resuelta `autoReviewModel` imprime un diagnóstico y sellos no filas de proveedores, un problema no resuelto `autoReviewModelOverrides` entrada imprime un diagnóstico y sellos sin anulación por modelo, dejando un objetivo válido para todo el proveedor como reserva. Lo que sea que resuelva se sigue aplicando. Filas sin sello de proveedor mantenga el selector raíz o el comportamiento ascendente cuando no esté establecido. Eliminar las hojas del selector de raíz sellos de proveedor solo, y la eliminación de un selector de proveedor borra sólo los sellos de ese proveedor.

Los campos de proveedor están disponibles a través de la configuración, `PATCH /api/providers?name=<provider>`, y el editor de proveedores JSON sin procesar del panel de control; no hay controles de formulario de proveedor dedicados. Los global override está disponible en la configuración del modelo. El canónico `openai` El proveedor rechaza al proveedor campos de revisor. Las reglas de campo por campo viven en el
[referencia de configuración del proveedor](/es/reference/configuration/providers/#auto-review-approval-model-selection).

<a id="rate-limits-in-the-providers-overview"></a>

## Límites de tarifas en la descripción general de los proveedores

Los **Límites de tarifas** sección de la descripción general de proveedores muestra la utilización en vivo barras actualizadas desde el propio punto final de uso/facturación de cada proveedor cuando existe uno. Las barras muestran la cantidad de una ventana (5 horas, semanal, mensual o específico del proveedor) ya se ha consumido.

Proveedores con una sonda activa: OpenAI/Codex, Anthropic, xAI, Cursor, Kimi, Google Antigravedad, OpenCode Go, OpenRouter, DeepSeek, ClinePass, Z.AI, MiniMax, Moonshot, Venecia, Sintético, DeepInfra, Neuralwatt, Código de Comando, y cualquier a6api-respaldado proveedor personalizado.

**Cuota de OpenCode Go.** El canónico `opencode-go` preset lee
`GET https://opencode.ai/zen/go/v1/usage` con la clave configurada como Bearer token y No sigue redirecciones. La respuesta es continua, semanal y mensual `percent` Los valores son utilización ya consumida: mapas rodantes a la barra de 5 horas, mientras que semanal y mensual mantener sus correspondientes barras. OpenCodex no reconstruye los límites de dólares de los registros de uso local, y proveedor que utiliza un no canónico `baseUrl` nunca se envía la clave para esta sonda.

**Cuota del plan de codificación Z.AI GLM.** Los `zai`, `glm`, `glm-cn`, y `zhipu-bigmodel-coding`
presets leídos `GET /api/monitor/usage/quota/limit` y no sigas las redirecciones. La sonda corre contra la región que el proveedor señala:
`api.z.ai` (desnudo o `/api/coding/paas/v4`) `open.bigmodel.cn` (bare,
`/api/coding/paas/v4`O el OpenAI Responses punto final `/api/v1`).

La autenticación difiere según la región: `api.z.ai` toma la clave como Bearer token, mientras
`open.bigmodel.cn` espera la clave directamente en `Authorization` Sin prefijos y rechaza un encabezado Bearer. La respuesta es `limits` Rellene las filas de la barra de utilización:
`TOKENS_LIMIT` / `CREDIT_LIMIT` filas con `unit` 3 / `number` 5 Llene la barra de 5 horas y
`unit` 6 / `number` 1 El bar semanal.

`TIME_LIMIT` Las filas son **no** modelo y se ignoran. Ellos son los compartidos mensualmente Asignación de llamadas MCP para la búsqueda web, el lector web y Zread, por lo que los trata como un modelo ventana permitiría que un presupuesto de búsqueda web gastado se leyera como capacidad de modelo agotada en Ranking de cuentas con cuotas. Un plan que sólo reporta `TIME_LIMIT` Por lo tanto, las filas muestran no hay barras de cuota en lugar de una fabricada, y las ventanas del plan no informan quedarse ausente en lugar de representar como 0%.

Un proveedor que utiliza un método no canónico `baseUrl` nunca se envía la clave para esta sonda.
<a id="diagnosing-an-antigravity-quota-refresh"></a>

### Diagnosticar una actualización de cuota antigravedad

La vista de cuota de cuenta y `ocx account list google-antigravity --quota --refresh` distinguir la denegación de acceso, limitación de velocidad, destinos bloqueados o redirecciones, DNS/conexión/tiempos de espera y datos de cuota inutilizables. Las últimas barras conocidas permanecen visibles con su tiempo de observación cuando falla una actualización. La reautenticación retira los diagnósticos de la credencial anterior; una actualización exitosa borra el fallo.

Un resultado denegado por acceso no prueba por sí mismo un inicio de sesión vencido o un plan no elegible. Un destino bloqueado es una decisión de política de red, no una prueba de un defecto de IP falsa. Los destinos de cuota Canonical Google retienen las restricciones de verificación y redirección/dirección privada de TLS. El comportamiento autenticado de TUN debe comprobarse en el entorno afectado; los accesorios de transporte inyectados por sí solos no establecen ese resultado de campo.

<a id="large-inline-images-on-chat-providers"></a>

## Grandes imágenes en línea en proveedores de chat

Las solicitudes de chat compatibles con OpenAI traducidas reducen las imágenes en línea cuando sus datos base64 combinados superan los 3,5 MiB. Las imágenes más antiguas pierden detalle primero. Este es un presupuesto de imagen de mejor esfuerzo, por lo que el texto grande, los esquemas o las imágenes que no se pueden procesar aún pueden exceder un límite de solicitud ascendente. Las URL de imágenes remotas no se descargan y las imágenes que no se pueden reducir permanecen adjuntas. El passthrough de Native Chat mantiene sus bytes de imagen originales.
