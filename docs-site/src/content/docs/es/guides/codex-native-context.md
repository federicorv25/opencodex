---
title: "Compatibilidad de contexto nativo"
description: "Elegibilidad, configuración de prueba autenticada y límites de la historia y retransmisión de notas de Codex."
---

OpenCodex ya transmite el historial y las notas nativas de Codex. Este no es un servicio de memoria general para los proveedores enrutados, y exponer sus puntos finales HTTP no establece que un Codex compilación, cuenta o modelo puede usarlos. Véase [Integración Codex](/es/guides/codex-integration/)
para los límites de propiedad, cancelación y credenciales del relé.

<a id="two-independent-requirements"></a>

## Dos requisitos independientes

Codex debe activar la extensión, y OpenCodex debe identificar al llamante. Cambiar el backend URL resuelve ninguno de los requisitos por sí mismo.

El contrato Codex inspeccionado requiere un modelo cuya entrada de catálogo nativa anuncia
`supports_experimental_context`, un inicio de sesión ChatGPT elegible y un proveedor nombrado exactamente
`OpenAI` con una base URL que termina en `/backend-api/codex`. Su activación automática rechaza Proveedores que utilizan `env_key`, `experimental_bearer_token`, respaldado por comandos `auth`, o AWS auth. El predicado de elegibilidad inspeccionado acepta ChatGPT Plus, Pro y ProLite; esto no es un reclamo que cada cuenta en esos planes tiene puntos finales de historial de backend que funcionan.

OpenCodex requiere además un activo **clave API del plano de datos** Tanto en el modelo exitoso solicitud y las solicitudes de contexto posteriores. La inyección built-in loopback predeterminada no envía esa clave, por lo que puede servir modelos mientras las llamadas de contexto fallan con `context_principal_required`
(403). El formulario de tabla de proveedor remoto autenticado por sí solo no es una solución de contexto nativo o bien: su `env_key` y el nombre del proveedor no satisfacen el contrato de activación Codex anterior. Nunca quite los cheques de principal o de propiedad de la cuenta para ocultar cualquiera de los problemas.

<a id="explicit-opt-in-syntax"></a>

## Sintaxis explícita de opt-in

OpenCodex acepta ambas formas de característica raíz persistentes que Codex `FeatureToml` acepta:

```toml
[features]
context_management = true
```

El formulario de tabla equivalente también funciona y es la ortografía compatible para OpenCodex anterior versiones que aún no reconocen la forma booleana:

```toml
[features.context_management]
experimental_mode = true
```

Use una forma, no ambas. Los valores falsos, ausentes y mal formados permanecen fuera. El proxy lee su propio Configuración de inicio Codex; una anulación de solo CLI o una opción de inclusión presente solo dentro de un perfil Codex no permite su puerta de entorno de ejecución. Este cambio no infiere la aceptación de los metadatos del modelo.

<a id="authenticated-native-trial-profile"></a>

## Perfil de prueba nativo autenticado

Esto es un **Configuración de prueba comprobada por fuente, no una certificación de extremo a extremo de cuenta real**. Realice una copia de seguridad de la configuración de Codex y mantenga un punto de control de tareas duradero antes de realizar las pruebas. Utiliza un nuevo, hilo desechable; no cambie la identidad del proveedor de un hilo de trabajo existente.

Suministre una clave de plano de datos OpenCodex activa existente `OCX_CONTEXT_API_KEY` en el medio ambiente del proceso Codex. No utilice una administración/admin token ni almacene la clave en TOML. Un servicio El entorno no es heredado automáticamente por una aplicación de escritorio lanzada por separado. Mantenga el inicio de sesión nativo normal Codex ChatGPT disponible; el encabezado adicional no reemplaza a OAuth.

Con la función de raíz opt-in anterior, el proveedor de reenvío canónico ChatGPT configurado en OpenCodex, y un catálogo de modelo nativo actual, **adicionales** proveedor y perfil en la misma configuración Codex. Ajuste el puerto al proxy local real. Deja la raíz
`model_provider` y las tablas de proveedores existentes sin cambios.

```toml
[model_providers.ocx-native-context]
name = "OpenAI"
base_url = "http://127.0.0.1:10100/backend-api/codex"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
env_http_headers = { "x-opencodex-api-key" = "OCX_CONTEXT_API_KEY" }

[profiles.ocx-native-context]
model_provider = "ocx-native-context"
model = "gpt-6-astra"
```

Iniciar un nuevo hilo CLI con `codex --profile ocx-native-context`. El ejemplo utiliza HTTP/SSE para mantener la prueba inicial en la ruta de propiedad modelo a relé; no cambia el transporte de otros perfiles o certificar la paridad WebSocket/media vuelta-dirección. Utilice el modelo sólo cuando el El catálogo nativo de la cuenta en realidad anuncia su capacidad de contexto; nunca fuerce esa bandera en una fila Devin, Gemini u otra fila encaminada.

El ID de proveedor personalizado es intencional. El Codex de flujo ascendente generalmente no anula el sistema integrado proveedores de `model_providers.openai`; añadir un encabezado adicional puede ser silenciosamente ineficaz. El ID personalizado conserva el proveedor normal, mientras que el `OpenAI` El nombre satisface al nativo predicado backend. No añadir `env_key` a este perfil: `env_http_headers` Admisión local Por separado mientras `Authorization` continúa llevando el inicio de sesión nativo ChatGPT. OpenCodex consume la clave local; no envía esa clave a ChatGPT.

El opt-in raíz también afecta a otros perfiles nativos elegibles. **Durante el juicio, no continúe hilos de bucle de retroceso incorporados ordinarios que carecen de la clave adicional.** Desactivar la función raíz y ejecutar
`ocx sync` antes de volver a esos hilos. Esto no es una integración automática o predeterminada. cambiar, y este perfil CLI no es una reclamación sobre el soporte de selección de perfiles de escritorio.

<a id="verify-before-resetting-context"></a>

## Verificar antes de restablecer el contexto

Primero obtenga una respuesta exitosa del modelo nativo en el nuevo hilo. Luego verifica una nota escrita, lee la misma nota y consulta el historial de ese hilo. Solo después de que esas operaciones tengan éxito ¿Debería usar una prueba desechable `new_context` y compruebe que se puede recuperar el estado guardado. Mantenga el punto de control externo incluso cuando la prueba tenga éxito.

- **403 `context_principal_required`:** ninguna clave de plano de datos local válida alcanzó el proxy.
- **409 `context_account_unavailable`:** falta o es inconsistente; no sustituya la cuenta activa actual o vuelva a intentar escribir a ciegas.
- **404:** distinguir la respuesta de punto final deshabilitado/desconocido del proxy de un 404 ascendente. Este último no es prueba de un defecto de enrutamiento OpenCodex o una interrupción en toda la cuenta.

Una llamada de modelo exitosa o `ocx ready` no es prueba de que las notas, la historia o la restauración del estado funciona. El enrutamiento del modelo, los cambios en la cuenta, los reinicios proxy y la disponibilidad de los puntos finales ascendentes permanecen preocupaciones separadas. Ninguna bandera local puede conceder la elegibilidad de backend faltante, y un contexto fallido La operación no debe ser reportada como un restablecimiento exitoso. Retire las tablas de prueba y desactive el clave de prueba cuando haya terminado; deje la función desactivada a menos que utilice una ruta autenticada verificada.

<a id="upstream-contracts-inspected"></a>

## Contratos ascendentes inspeccionados

Estos enlaces fijan el contrato de origen utilizado para la configuración anterior, no una promesa de implementación:

- [FeatureToml booleano/formas de tabla](https://github.com/openai/codex/blob/78245b47af2a7aafcabe025828ceecca69db4df1/codex-rs/features/src/lib.rs)
- [Elegibilidad del contexto nativo](https://github.com/openai/codex/blob/78245b47af2a7aafcabe025828ceecca69db4df1/codex-rs/core/src/session/token_budget.rs)
- [Identidad del proveedor y reglas de fusión incorporadas](https://github.com/openai/codex/blob/78245b47af2a7aafcabe025828ceecca69db4df1/codex-rs/model-provider-info/src/lib.rs)
- [El historial/las notas utilizan los encabezados de solicitud y la autenticación del proveedor](https://github.com/openai/codex/blob/78245b47af2a7aafcabe025828ceecca69db4df1/codex-rs/ext/history-notes/src/backend.rs)
