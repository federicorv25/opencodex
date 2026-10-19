---
title: "Grok Build"
description: "Utilice cualquier modelo opencodex-enrutado de xAI Grok Build CLI modelos — se auto-registran en ~/.grok/config.toml mientras se ejecuta el proxy."
---

opencodex sirve un OpenAI-compatible `POST /v1/responses` en su puerto local, y Grok Build admite modelos personalizados contra servidores compatibles con OpenAI. Comenzando con esta integración, opencodex registra todo su catálogo visible en Grok Build automáticamente — sin configuración manual Se requiere edición.

<a id="auto-registration"></a>

## Auto-registro

Cuando `~/.grok` existe, `ocx start` (y `ocx ensure` / `ocx restart`) escribe un bloque administrado en `~/.grok/config.toml`:

```toml
# >>> opencodex managed block — do not edit (removed by `ocx stop`) >>>
[model_providers.opencodex]
base_url = "http://127.0.0.1:10100/v1"
api_backend = "responses"
api_key = "opencodex-loopback"
extra_headers = { "x-opencodex-grok" = "1" }

[model.ocx-gpt-5-6-sol]
model = "gpt-5.6-sol"
model_provider = "opencodex"
name = "OCX gpt-5.6-sol"
context_window = 272000
supports_reasoning_effort = true
reasoning_effort = "low"

[[model.ocx-gpt-5-6-sol.reasoning_efforts]]
id = "low"
value = "low"
label = "Low"
description = "Quick, fast implementations"
default = true
# ... remaining rungs for this model, then one [model.ocx-*] table per visible model,
# each referencing model_provider = "opencodex" ...
# <<< opencodex managed block <<<
```

- **Aditivo:** su propia configuración fuera de la cerca nunca se toca. Antes de la primera inyección en un archivo preexistente, se escribe una copia de seguridad única
  `~/.grok/config.toml.bak-opencodex`.
- **Idempotente:** cada `ocx start` (y `ocx ensure` mientras el inicio automático está habilitado) reemplaza el bloque vallado con el catálogo actual.
- **Eliminado en desmontaje:** `ocx stop`, `ocx eject`, `ocx uninstall`, y graciosa daemon shutdown sin servicio desmonta el bloque cercado y restaura tu archivo byte por byte. Bajo un gerente de servicio, el desmontaje pasa por `ocx stop`/`ocx
  uninstall` (los procesos en modo servicio mantienen intencionalmente el bloque en respawns).
- **Conflict-safe:** Alias ya definidos por su propio `[model.*]` Las mesas son respetadas (opencodex sufijos sus propias entradas); una valla dañada (comienza marcador sin marcador final) rechaza cualquier cambio automático y pide la reparación manual.

A continuación, elija un modelo dentro de Grok Build:

```bash
grok models          # lists ocx-* entries alongside native grok models
grok -m ocx-anthropic-claude-opus-4-8 -p "hello"
# or in the TUI: /model ocx-anthropic-claude-opus-4-8
```

<a id="reasoning-effort"></a>

## Esfuerzo de razonamiento

Grok Build `/effort` (y `--effort`) solo funciona para modelos cuya entrada en el catálogo anuncia la escalera: su lista de modelos fetch lee el crudo `GET /v1/models` respuesta, y Las entradas deben llevar `supports_reasoning_effort` más `reasoning_efforts` menú opciones. Una proyección compatible con Grok de esa escalera se escribe en cada uno administrado
`[model.*]` cuadro (`supports_reasoning_effort`, por defecto `reasoning_effort`, y
`[[model.<alias>.reasoning_efforts]]` filas del selector) para que el menú esté presente cuando Grok Lee el modelo de `config.toml`. Para las entradas del modelo enrutado, opencodex refleja el niveles de proveedores configurados (`reasoningEfforts` / `modelReasoningEfforts`, y el valor predeterminado Desde `modelDefaultReasoningEfforts`) Este metadata describe el proxy configurado Escalera enrutada. Los adaptadores pueden emular el razonamiento o mapear niveles en proveedores específicos campos. Los modelos enrutados con una escalera configurada muestran el control de esfuerzo en Grok Build como en Codex. Los modelos con una lista de niveles vacía no mantienen ningún control de esfuerzo, lo que coincide con el comportamiento Codex. Nativo Las entradas GPT-5.6 están separadas: preservan y exponen su razonamiento ascendente anclado más que los metadatos enrutados configurados por el proveedor. peldaños válidos Grok, incluyendo
`none` y `minimal`, se conservan cuando se anuncian. peldaños no soportados o duplicados, incluyendo Codex-solamente `ultra`, se omiten del archivo, guardando cada recolector emitido opción seleccionable.

Grok Build habla con opencodex sobre la Responses API. Cuando la ruta anuncia un razonamiento ladder, el Responses pasa a través hacia adelante `reasoning.summary` como se configura, así que pensar Las trazas alcanzan Grok de forma nativa como elementos de razonamiento Responses. Establecer `reasoning.summary: "none"` si un cliente quiere que el modelo piense sin devolver el rastro. Una explícita `reasoning.summary`
gana sobre la ruta predeterminada.

<a id="authentication-note"></a>

## Nota de autenticación

Grok Build requiere una clave API no vacía para los modelos personalizados, incluso en loopback. El inyectado las entradas llevan un marcador de posición (`opencodex-loopback`) — opencodex ignora las claves de admisión conexiones loopback, por lo que no hay secreto real está involucrado.

**El registro automático es solo loopback.** Cuando opencodex se une a un host que no es loopback, — incluye los comodines `0.0.0.0` y `::`, que exponen todas las solicitudes de interfaz — necesitan su real admission token, y un bloque administrado no puede llevar uno de forma segura. Escribir el literal token sería Pon tu secreto en `~/.grok/config.toml` y sobrescribir lo que sea que establezcas allí en el siguiente
`ocx start`/`ensure`/`restart`. Así que opencodex no escribe nada en absoluto en ese caso (y elimina cualquier bloque sobrante de un enlace de bucle de retorno anterior), y configurar los modelos usted mismo fuera de los marcadores administrados, donde nada de lo que hace opencodex puede golpearlos. Véase
[Receta manual](#manual-recipe-without-auto-registration) para la tabla exacta, y establecer ambos
`base_url` (un host que es realmente accesible desde donde corres `grok`) `api_key`
(tu `OPENCODEX_API_AUTH_TOKEN`).

No reemplazar `api_key` con `env_key` Aquí. Un `env_key` El que no se resuelve no detener la solicitud — Grok cae a su sesión xAI token y lo envía a cualquier `base_url` los nombres de entrada, que para una implementación LAN es un punto final HTTP de texto plano que no es xAI.

El inyectado `api_key` en la entrada del proveedor ocupa el primer lugar en la cadena de credenciales de Grok para estos modelos, por lo que se vuelve en contra de opencodex no necesitan ningún inicio de sesión adicional Grok. Mantenga su normalidad
`grok login` / `XAI_API_KEY` configuración para los modelos nativos de gruk y cualquier arnés características que Póngase en contacto directamente con xAI.

<a id="manual-recipe-without-auto-registration"></a>

## Receta manual (sin auto-registro)

Si no te gusta `~/.grok/config.toml` — o opencodex está en un enlace no loopback — agregar a `[model_providers.opencodex]` tablas de bloques y por modelo que hacen referencia a él, fuera del
`# >>> opencodex managed block` marcadores:

```toml
[model_providers.opencodex]
base_url = "http://127.0.0.1:10100/v1"
api_backend = "responses"
api_key = "opencodex-loopback"

[model.ocx-opus]
model = "anthropic/claude-opus-4-8"
model_provider = "opencodex"
```

Para un proxy accesible a través de la red, `base_url` en la dirección `grok` puede en realidad marque y use su admisión token:

```toml
[model_providers.opencodex]
base_url = "http://192.168.1.10:10100/v1"   # the reachable host, not 127.0.0.1
api_backend = "responses"
api_key = "your-OPENCODEX_API_AUTH_TOKEN"

[model.ocx-opus]
model = "anthropic/claude-opus-4-8"
model_provider = "opencodex"
```

Esto usa `[model_providers.<id>]` herencia, que requiere Grok Build 0.2.109 o posterior (publicado 2026-07-21). En versiones anteriores, los herederos `base_url` No se aplica a la inferencia encaminar la actualización —, o volver a los campos directos por modelo (`base_url`/`api_backend`/`api_key`
en cada `[model.*]` tabla).

Citar cualquier alias que contenga un punto: bare `[model.grok-4.5]` es un camino clave de tres segmentos, no El ID `grok-4.5`. Los alias generados evitan los puntos completamente por esta razón.

<a id="known-limitations"></a>

## Limitaciones conocidas

- **Instalación de servicio `ocx restart`:** el proxy en ejecución posee la autorización de reinicio y drena coordinación, mientras que el administrador de servicios instalado inicia el reemplazo después del proceso anterior salidas. La supervisión del servicio permanece instalada. En el registro automático de loopback, el bloque administrado también se mantiene en su lugar a través de la transferencia; despliegues no loopback uso gestionado manualmente Grok configuración en su lugar. El comando tiene éxito solo después de que un proceso diferente, verificado por la identidad, es saludable en el mismo puerto.
- **Configure el tiempo de lectura:** iniciar opencodex primero, luego iniciar `grok` Para los más resultados predecibles. Relojes Grok Build `~/.grok/config.toml` y se recarga cuando el
  `[model]` La tabla cambia (aproximadamente un segundo de rebote, en comparación con el contenido), por lo que un bloque actualizado llega a una sesión abierta sin reiniciarse. Para confirmar lo que Grok analizó, ejecutar `grok inspect`: enumera las fuentes de configuración que cargó y advierte sobre cualquier campo que haya rechazado. No imprime la lista de modelos resueltos. Informes y saltos actuales de Grok Build campos de modelo no válidos mientras se conserva el resto de la entrada del modelo. Un error de sintaxis TOML todavía Evita que el archivo se cargue. opencodex escribe atómicamente, por lo que Grok observa una documento en cada recarga.
- **Actualizaciones del catálogo:** el bloque vallado refleja el catálogo en el memento de la inyección. Después agregar proveedores o modelos, ejecutar `ocx ensure` (o reiniciar el proxy) para actualizarlo.

<a id="devin-rate-limits"></a>

## Límites de tarifas Devin

Si Devin rechaza una solicitud directa con un límite de velocidad antes de producir una acción, OpenCodex devuelve HTTP 429 con un error JSON. Grok puede entonces reconocer el límite en lugar de mostrar un error genérico 500 de un flujo HTTP 200 fallido. Si la respuesta incluye `Retry-After`, siga ese retraso antes de volver a intentarlo. Cuotas agotadas sin reinicio No reciba un retraso predeterminado. La conmutación por error de la cuenta OAuth existente aún se aplica. Esto El manejo de HTTP 429 también se aplica a las solicitudes Responses que no son de transmisión.

Para las solicitudes de transmisión, OpenCodex espera hasta el tiempo de espera configurado para este inicio. Rechazo. Si eso espera expira, abre la respuesta SSE y permite que el stream watchdog existente maneje las paradas. Después de que se envían las cabeceras HTTP, un fallo posterior permanece en el flujo como `response.failed`.
