---
title: "Puente Factory Droid"
description: "Conecte los modelos Factory Droid a opencodex a través de un puente local compatible con Responses."
---

Factory Droid es un entorno de ejecución del agente, no un punto final de inferencia compatible con OpenAI documentado. Si a proveedor personalizado señaló una fábrica interna LLM URL devuelve `403 Forbidden`, cambiando solo el El adaptador opencodex o la adición de encabezados de proveedor no convierten esa ruta privada en una API pública admitida.

La integración de trabajo es:

```text
Text-only Responses client
  -> opencodex (http://127.0.0.1:10100/v1/responses)
  -> local Responses bridge (http://127.0.0.1:11435/v1/responses)
  -> official droid exec command
  -> Factory account and selected model
```

Esto mantiene la credencial de fábrica dentro del cliente oficial Droid. OpenCodex recibe un separado, puente solo local token.

<a id="what-failed-and-why"></a>

## Qué falló y por qué

| Síntoma | Causa | Arreglar |
| --- | --- | --- |
| `403 Forbidden` desde una fábrica LLM URL | Los URL No es un propósito general documentado. OpenAI Endpoint para clientes de terceros | Invocar fábrica a través de la Droid oficial CLI o SDK |
| `404` en `/models/models` | La base de proveedores URL ya terminó en `/models` | Usar una raíz API como `baseUrl`; nunca incluya el camino de descubrimiento |
| La búsqueda de modelos falla | El puente no expone un catálogo completo en vivo | Establecer `liveModels: false` y proporcionar una estática `models` lista |
| El proveedor de Loopback es rechazado | El acceso a la red privada se deniega de forma predeterminada | Establecer `allowPrivateNetwork: true` solo para el puente de bucle |
| `${DROID_BRIDGE_TOKEN}` Está sin resolver | La variable falta en el entorno de servicio opencodex | Inyéctelo en el proceso de servicio, no solo un shell interactivo |
| `OutputTextDelta without active item` | El puente emitió un delta de texto antes de abrir un elemento de salida y una parte de contenido. | Emitir el ciclo de vida completo Responses SSE en orden |

La misma credencial de fábrica puede, por lo tanto, funcionar en `droid exec` Una petición directa a un LLM indocumentado URL todavía regresa `403`. Estos resultados prueban diferentes productos y no deben ser tratados como contradictorios.

<a id="prerequisites"></a>

## Requisitos previos

1. Instalar e iniciar sesión en el [Droid CLI](https://docs.factory.ai/droid-cli/quickstart).
2. Confirme que una solicitud sin cabeza limitada funciona:

   ```bash
   droid exec --model glm-5.2 --output-format json "Reply with DROID_OK only."
   ```

3. Ejecutar un puente local que invoca `droid exec` (o el Droid oficial SDK) y expone:

   - `GET /healthz`
   - `GET /v1/models`
   - `POST /v1/responses`

Documentos de fábrica `droid exec` como su superficie de automatización no interactiva y recomienda salida JSON Para los scripts. Para una integración de larga duración, Factory también documenta el flujo JSON-RPC y el flujo oficial TypeScript y Python SDKs en el
[Droid Guía de ejecución](https://docs.factory.ai/droid-exec/overview).

<a id="bridge-contract"></a>

## Contrato de puente

Atar el puente a `127.0.0.1`, requieren un portador generado aleatoriamente token, tamaños de solicitud de límite, y ID de modelo de allowlist. El puente mínimo acepta solo estos Responses `input` formas:

- una cadena no vacía; o
- Un array que contiene sólo `message` Temas. Cada mensaje debe tener un `user`, `developer`, `system`, o `assistant` rol y contenido de cadena o partes de contenido solo de texto (`input_text` para la entrada Roles y `output_text` para el asistente de historia).

Valide la solicitud completa antes de invocar Droid. Si una parte de entrada es una imagen o un archivo, `tools`
contiene cualquier definición de herramienta, o `input` contiene una llamada de herramienta o resultado (`function_call`,
`function_call_output`, `custom_tool_call`, o `custom_tool_call_output`), devuelve HTTP `400` con un Responses-estilo `invalid_request_error`. Utilice un código específico de puente estable como
`unsupported_bridge_input` e identificar el campo rechazado en el mensaje. Haz esto antes de comenzar SSE, incluso cuando `stream: true`; nunca desechar, encadenar o aplanar el contenido no soportado en el pronto.

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "unsupported_bridge_input",
    "param": "tools",
    "message": "The minimal Droid bridge does not accept tool definitions."
  }
}
```

Para una solicitud aceptada, el puente debe:

1. Convertir el Responses aceptado `input` a un aviso.
2. invocación `droid exec --model <id> --output-format json <prompt>`;
3. Analizar la final `result` y `session_id`;
4. Devolver un OpenAI Responses sobre; y
5. mapa `previous_response_id` a la ID de sesión Droid cuando se requiere continuación.

Para las respuestas de transmisión, emita este ciclo de vida en orden:

```text
response.created
response.output_item.added
response.content_part.added
response.output_text.delta
response.output_text.done
response.content_part.done
response.output_item.done
response.completed
```

No exponga el puente en `0.0.0.0` y no reutilice la credencial de fábrica como portador del puente token.

<a id="opencodex-provider-configuration"></a>

## Configuración del proveedor OpenCodex

Crear el proveedor personalizado con el ID de proveedor explícito `droid`:

```bash
ocx provider add droid \
  --adapter openai-responses \
  --base-url http://127.0.0.1:11435/v1 \
  --default-model glm-5.2 \
  --allow-private-network
```

Esto crea el `providers.droid` entrada de configuración. En el panel de control, abra **Proveedores → droide → Editar JSON** y reemplace el valor de ese proveedor con:

```json
{
  "adapter": "openai-responses",
  "baseUrl": "http://127.0.0.1:11435/v1",
  "responsesPath": "/responses",
  "allowPrivateNetwork": true,
  "authMode": "key",
  "apiKey": "${DROID_BRIDGE_TOKEN}",
  "liveModels": false,
  "models": ["glm-5.2", "glm-5.2-fast", "kimi-k3"],
  "defaultModel": "glm-5.2"
}
```

Los ID de modelo son ejemplos. Sólo los modelos que `droid exec` puede utilizar para la fábrica iniciada cuenta. No agregue encabezados de inferencia específicos de Factory a este proveedor: su fuente es el servidor local. puente, no un endpoint Factory HTTP.

Después de guardar un proveedor o cambiar su catálogo estático, sincronizar y reiniciar Codex tan nuevo Las sesiones leen el catálogo actualizado:

```bash
ocx sync --restart-codex
ocx doctor
```

`--restart-codex` reinicia los servidores de aplicaciones correspondientes y cierra completamente y vuelve a iniciar el escritorio Codex aplicación, que termina las conversaciones en vivo. Uso `--restart-app-server-only` para salir de la aplicación de escritorio corriendo. Ejecute el reinicio solo después de terminar o guardar esas sesiones.

<a id="verify-the-complete-route"></a>

## Verificar la ruta completa

Compruebe cada límite por separado:

```bash
curl -fsS http://127.0.0.1:11435/healthz
ocx doctor
ocx access test droid/glm-5.2 --protocol responses
```

Una fila de proveedores o una entrada de selector de modelos solo prueban la visibilidad del catálogo. La integración sólo funciona después de que la sonda Responses regrese a través del `droid/<model>` ruta.

<a id="current-limitation"></a>

## Limitación actual

El puente mínimo anterior traduce texto y el ciclo de vida Responses SSE. Lo hace **no** Implementar el protocolo completo bidireccional Codex función/herramienta-llamada. Codex Aplicación y `codex exec` Normalmente envía Codex CLI no tiene ninguna definición general de herramienta, incluso cuando un mensaje indica que no se llame a las herramientas. bandera que elimina esas definiciones. El puente mínimo debe rechazar esas solicitudes con el `400`
contrato por encima. Definiciones de herramientas, llamadas de herramientas, resultados de herramientas, permisos, cancelación y riqueza Los eventos Droid requieren un puente con estado construido en el modo de transmisión de Factory JSON-RPC o un Droid oficial. SDK. Tratar `ocx access test` éxito como verificación de ruta de texto, no como agente o ruta de herramienta Codex verificación.
