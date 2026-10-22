---
title: "Referencia de configuración"
description: "Donde opencodex almacena la configuración, cómo se aplican las ediciones y enlaces a cada dominio de configuración."
---

opencodex almacena su configuración persistente en `$OPENCODEX_HOME/config.json`, normalmente `~/.opencodex/config.json`. En Windows, el valor predeterminado es `%USERPROFILE%\.opencodex\config.json`.

<a id="ways-to-edit-configuration"></a>

## Formas de editar la configuración

Elija el canal de edición que se ajuste a la tarea:

- **Panel de control:** utiliza la interfaz de usuario web para la configuración guiada de proveedor, modelo, agente, acceso y almacenamiento.
- **CLI:** `ocx init` crea el archivo inicial, mientras que los comandos como `ocx provider`, `ocx models`, `ocx combo`, `ocx agent` y `ocx config` actualizan o inspeccionan sus configuraciones propias.
- **Archivo:** editar `config.json` directamente para campos sin una interfaz de usuario dedicada o comando CLI. El archivo debe seguir siendo válido JSON.

El panel de control, la administración API y la mutación CLI persisten en el mismo archivo. Prefiera esos canales, o detenga el proxy antes de editar a mano. Un proceso en ejecución mantiene la configuración en la memoria, por lo que un live save posterior puede reescribir ediciones de mano no relacionadas desde su instantánea. Live save combina los campos `claudeCode` editados externamente y los campos vinculantes para el oyente donde esas rutas tienen protección explícita contra conflictos, pero esa protección no cubre todos los subárboles.

Si el archivo no se puede analizar, opencodex lo respalda como `config.json.invalid-<timestamp>`, advierte en la consola y comienza con valores predeterminados. Un archivo que falta también utiliza el valor predeterminado de instalación reciente: un proveedor de reenvío `openai`.

<a id="precedence-and-defaults"></a>

## Precedencia y valores por defecto

<a id="provider-and-model-aliases"></a>

### Proveedor y modelo de alias

Los alias son nombres de solicitud cortos opcionales. Nunca cambian el identificador de modelo nativo enviado aguas arriba, y omitir cada campo de alias conserva el enrutamiento existente exactamente.

```jsonc
{
  "providers": {
    "openrouter": {
      "alias": "or",
      "modelAliases": { "anthropic/claude-opus-5": "opus" },
      "defaultAliases": true
    }
  },
  "defaultModelAliases": false
}
```

Los alias coinciden insensiblemente con el caso. Un alias modelo funciona como `or/opus` o, cuando es globalmente único, bare `opus`; un alias ambiguo bare informa a sus candidatos calificados. Los selectores de modelos Codex muestran el alias calificado mientras preservan el identificador de enrutamiento canónico `provider/model`. El valor `defaultAliases` de un proveedor anula `defaultModelAliases`. Los built-ins se omiten cuando varios modelos en un proveedor coinciden con el mismo patrón.

<a id="native-reasoning-retention"></a>

### Retención del razonamiento nativo

La retención de texto cifrado de razonamiento nativo en los cambios de modelo y cuenta tiene dos configuraciones de aceptación, ambas desactivadas de forma predeterminada. Configurelos en la vista general del panel o consulte [Retención del razonamiento nativo](/es/reference/configuration/server/#native-reasoning-retention) para conocer el alcance exacto y el comportamiento experimental de la cuenta.

<a id="cursor-effort-rows"></a>

### filas de esfuerzo Cursor

`cursorEffortRows` es un booleano opcional y por defecto a `false`. Cuando está habilitada, la lista OpenAI -style `/v1/models` sin procesar agrega `<base-id>--<effort>` selectores para modelos con capacidad de razonamiento que Cursor Private Inference no coincide en su tabla de esfuerzo instalada. La selección de una fila generada enruta el modelo base y aplica el esfuerzo de esa fila; los modelos Cursor ya reconocen que no reciben variantes. El indicador reserva un sufijo `--<declared-effort>` de terminal para selectores generados, excepto cuando el valor completo ya es un identificador de modelo configurado conocido. Cursor puede requerir una actualización o reinicio de la lista de modelos después de que esta configuración cambie.

<a id="fast-rows"></a>

### Filas rápidas

`fastRows` es un booleano opcional y por defecto `true`. El estilo crudo OpenAI
`/v1/models` lista, descubrimiento Claude Code y exportación de configuración de cliente (incluyendo pi, OpenCode, OMP, Hermes, OpenClaw, Kimi, gjc, DSH, MCode, ZCode, Prime, Aside, Raycast, omo, Cline, Kilo y Command Code) `<base-id>--fast` Selector para cada modelo cuyo La política de Fast Resuelto es elegible. Seleccionando una ruta el modelo base y solicita la `priority`
nivel de servicio — el mismo Rápido la aplicación Codex expone a través de su palanca de selección. La fila base se queda Enumerado, por lo que la fila es una adición en lugar de un reemplazo.

Establecer `"fastRows": false` para ocultar los selectores rápidos generados. Los valores erróneos también los desactivan. El Panel de Modelos expone la misma configuración y actualiza las integraciones conectadas cuando es posible. Si un selector externo no cambia después de guardar, actualice su integración o catálogo de clientes. Los clientes conectados usan los metadatos de disponibilidad del proxy de servicio; los proxys más antiguos sin esos metadatos no obtienen entradas rápidas adivinadas. Codex mantiene su palanca rápida nativa.

El sufijo es `--fast`, con dos guiones, porque un terminal `-fast` ya es un identificador de modelo real para varios proveedores (`grok-4-fast`, `glm-5.3-fast` y las propias variantes rápidas de Cursor), y un solo guion no podría distinguir un producto aparte de un nivel. Un id de modelo configurado exacto siempre gana sobre el sufijo generado, y un id que lleva tanto este marcador como un marcador de esfuerzo no resuelve ninguno.

Una fila aparece solo donde el nivel realmente puede ser honrado: un modelo cuyo proveedor no lo soporta, o lo soporta en un cable que la ruta no puede usar, no obtiene ninguna fila. `fastMode: false` todavía suprime Fast globalmente y tiene prioridad sobre una fila seleccionada, y un selector cuyo modelo más tarde pierde elegibilidad se degrada a una solicitud ordinaria en lugar de fallar.

Los modelos nativos tienen una condición adicional: así como una política elegible, el nivel de upstream debe anunciar el nivel rápido para ese modelo. Esta es la misma evidencia de la palanca del propio recolector Codex se construye a partir de, por lo que las dos superficies no pueden estar en desacuerdo sobre qué nativos tienen rápido.

Alcance: esto cubre las superficies de servicio de solicitudes: `/v1/models`, Claude Code descubrimiento y los puntos finales `/v1/responses`, `/v1/chat/completions`, `/v1/messages`, `/v1/messages/count_tokens` y `/v1/responses/compact`, más `ocx export`, integraciones de clientes administrados y el lanzador OpenCode. Después de deshabilitar las filas rápidas, actualice las configuraciones de cliente guardadas y seleccione un modelo base en lugar de un selector rápido guardado anteriormente.

Los valores válidos en `config.json` anulan los valores predeterminados incorporados. Los campos opcionales que faltan utilizan los valores predeterminados documentados en las páginas de dominio. `OPENCODEX_HOME` tiene prioridad sobre el directorio de configuración predeterminado. Los campos que aceptan una referencia de entorno, como `apiKey: "${PROVIDER_API_KEY}"`, resuelven esa variable en el momento de la solicitud. Para el proxy saliente, un `HTTP_PROXY` o `HTTPS_PROXY` ya establecido tiene prioridad sobre el campo `proxy` de nivel superior.

El enrutamiento tiene sus propias reglas de resolución ordenadas; ver [Enrutamiento](/es/reference/configuration/routing/).

<a id="configuration-domains"></a>

## Dominios de configuración

- [Proveedores](/es/reference/configuration/providers/) - entradas de proveedores, autenticación, endpoints, catálogos, listas de permisos, límites de contexto, cuotas y opciones específicas de proveedores.
- [Enrutamiento](/es/reference/configuration/routing/) - `defaultProvider`, orden de resolución del modelo, combos, alias y valores predeterminados de esfuerzo combinado.
- [Agentes](/es/reference/configuration/agents/) - modo multiagente, guía de delegación, modelos de reserva, sincronización por defecto nativo y límites de esfuerzo.
- [Servidor y entorno de ejecución](/es/reference/configuration/server/) - oyente y acceso remoto, claves de admisión, tiempos de espera, almacenamiento, sidecars, comportamiento de inicio y llamadas de sombra.

<a id="keep-secrets-out-of-the-file"></a>

## Mantener los secretos fuera del archivo

Prefiere referencias `${ENV_VAR}` para las claves API. Los valores literales de `apiKey`, `apiKeyPool[].key` y `apiKeys[].key` son secretos: no los incluyas en commits, registros ni informes compartidos. Los tokens OAuth y los de autenticación por reenvío se guardan en almacenes de credenciales separados de `config.json`. Los identificadores de cuenta y correos también deben mantenerse privados; usa alias públicos de selector cuando estén admitidos.

:::note[Escrituras atómicas]
opencodex escribe administrado `config.toml` y `opencodex-catalog.json` archivos a través de un archivo temporal Luego, re-nombrar (`atomicWriteFile`) Esto evita archivos parciales cuando los escritores concurrentes, tales como `ocx stop` y el controlador de apagado proxy, restaurar Codex al mismo tiempo. Si un archivo TOML administrado contiene un entero fuera del rango seguro de JavaScript, se rechaza la reescritura en lugar de redondear el valor, y el archivo se deja sin cambios.
:::
