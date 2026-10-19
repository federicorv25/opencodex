---
title: "Referencia de configuración"
description: "Donde opencodex almacena la configuración, cómo se aplican las ediciones y enlaces a cada dominio de configuración."
---

opencodex almacena su configuración persistente en `$OPENCODEX_HOME/config.json`Normalmente
`~/.opencodex/config.json`. En Windows, el valor predeterminado es
`%USERPROFILE%\.opencodex\config.json`.

<a id="ways-to-edit-configuration"></a>

## Formas de editar la configuración

Elija el canal de edición que se ajuste a la tarea:

- **Panel de control:** utilice la interfaz de usuario web para los configuración de proveedor, modelo, agente, acceso y almacenamiento guiados.
- **CLI:** `ocx init` crea el archivo inicial, mientras que comandos como `ocx provider`, `ocx models`,
  `ocx combo`, `ocx agent`, y `ocx config` actualizar o inspeccionar sus propios configuración.
- **Archivo:** editar `config.json` directamente para campos sin una interfaz de usuario dedicada o comando CLI. El archivo debe siguen siendo válidas JSON.

El panel de control, la administración de API y la mutación de los comandos CLI persisten en el mismo archivo. Prefiero los canales, o detener el proxy antes de la edición manual. Un proceso en ejecución mantiene la configuración en la memoria, por lo que más tarde live save puede volver a escribir ediciones de mano no relacionadas desde su instantánea. Live saves combinar editado externamente
`claudeCode` y campos vinculantes para el oyente donde esos caminos tienen protección explícita contra conflictos, pero que La protección no cubre todos los subárboles.

Si el archivo no se puede analizar, opencodex lo respalda como
`config.json.invalid-<timestamp>`, advierte en la consola y comienza con valores predeterminados. Un archivo perdido también usa el valor predeterminado fresh-install: uno `openai` proveedor directo.

<a id="precedence-and-defaults"></a>

## Precedencia y valores por defecto

<a id="provider-and-model-aliases"></a>

### Proveedor y modelo de alias

Los alias son nombres de solicitud cortos opcionales. Nunca cambian el id del modelo nativo enviado de origen, y omitiendo cada campo de alias conserva enrutamiento existente exactamente.

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

Los alias coinciden insensiblemente con el caso. Un alias de modelo funciona como `or/opus` o, cuando es globalmente único, desnudo `opus`; un alias ambiguo informa a sus candidatos calificados. Los selectores de modelos Codex muestran el alias calificado mientras preservan el alias canónico. `provider/model` Id. de enrutamiento. Un proveedor `defaultAliases` valor anula `defaultModelAliases`. Los built-ins se omiten cuando varios modelos en un proveedor coinciden con el mismo patrón.

<a id="native-reasoning-retention"></a>

### Retención del razonamiento nativo

La retención de texto cifrado de razonamiento nativo en los cambios de modelo y cuenta tiene dos configuración opt-in, ambas desactivadas por defecto. Configurarlos en la vista general del panel o ver [Retención del razonamiento nativo](/es/reference/configuration/server/#native-reasoning-retention) para el alcance exacto y el comportamiento de la cuenta experimental.

<a id="cursor-effort-rows"></a>

### filas de esfuerzo Cursor

`cursorEffortRows` es un booleano opcional y por defecto `false`. Cuando está activado, el estilo OpenAI sin procesar
`/v1/models` lista agrega `<base-id>--<effort>` selectores para modelos con capacidad de razonamiento que Cursor Privado La inferencia no coincide en su tabla de esfuerzo instalada. Seleccionar una fila generada encamina el modelo base y aplica el esfuerzo de esa fila; los modelos Cursor ya reconocen que no reciben variantes. La bandera se reserva a terminal `--<declared-effort>` sufijo para los selectores generados, excepto cuando el valor completo ya está un identificador de modelo configurado conocido. Cursor puede requerir una actualización o reinicio de la lista de modelos después de que cambie esta configuración.

<a id="fast-rows"></a>

### Filas rápidas

`fastRows` es un booleano opcional y por defecto `true`. El estilo crudo OpenAI
`/v1/models` lista, descubrimiento Claude Code y exportación de configuración de cliente (incluyendo pi, OpenCode, OMP, Hermes, OpenClaw, Kimi, gjc, DSH, MCode, ZCode, Prime, Aside, Raycast, omo, Cline, Kilo y Código de Comando) `<base-id>--fast` Selector para cada modelo cuyo La política de Fast Resuelto es elegible. Seleccionando una ruta el modelo base y solicita la `priority`
nivel de servicio — el mismo Rápido la aplicación Codex expone a través de su palanca de selección. La fila base se queda Enumerado, por lo que la fila es una adición en lugar de un reemplazo.

Establecer `"fastRows": false` para ocultar los selectores rápidos generados. Los valores erróneos también los desactivan. El Panel de Modelos expone la misma configuración y actualiza las integraciones conectadas cuando es posible. Si un selector externo no cambia después de guardar, actualice su integración o catálogo de clientes. Los clientes conectados usan los metadatos de disponibilidad del proxy de servicio; más antiguos Los proxies sin esos metadatos no obtienen entradas rápidas adivinadas. Codex mantiene su conmutación rápida nativa.

El sufijo es `--fast`, con dos guiones, porque un terminal `-fast` ya es un modelo real para varios proveedores (`grok-4-fast`, `glm-5.3-fast`, y las propias variantes rápidas de Cursor), y un solo hyphen no podía distinguir un producto aparte de un nivel. Un id de modelo configurado exacto siempre gana sobre el genera un sufijo, y un identificador que lleva tanto este marcador como un marcador de esfuerzo no resuelve ninguno.

Una fila aparece solo donde el nivel puede ser honrado: un modelo cuyo proveedor no admite o lo soporta en un cable que la ruta no puede usar, no obtiene ninguna fila. `fastMode: false` todavía suprime Rápida a nivel mundial y tiene prioridad sobre una fila seleccionada, y un selector cuyo modelo más tarde pierde La elegibilidad se degrada a una solicitud ordinaria en lugar de fallar.

Los modelos nativos tienen una condición adicional: así como una póliza elegible, de origen debe anunciar el Nivel rápido para ese modelo. Esta es la misma evidencia de que el propio conmutador del selector Codex está construido, por lo que las dos superficies no pueden estar en desacuerdo sobre qué nativos tienen Rápido.

Alcance: esto cubre las superficies de solicitud — `/v1/models`, Claude Code descubrimiento, y el
`/v1/responses`, `/v1/chat/completions`, `/v1/messages`, `/v1/messages/count_tokens`, y
`/v1/responses/compact` puntos finales, más `ocx export`, integraciones de clientes gestionados, y el lanzador OpenCode. Después de deshabilitar las filas rápidas, actualice las configuración del cliente guardadas y seleccione una base modelo en lugar de un selector rápido previamente guardado.

Valores válidos en `config.json` Anule los valores predeterminados incorporados. Los campos opcionales que faltan usan los valores predeterminados documentado en las páginas de dominio. `OPENCODEX_HOME` tiene prioridad sobre la configuración predeterminada directorio. Campos que aceptan una referencia de entorno, como `apiKey: "${PROVIDER_API_KEY}"`, Resolver esa variable en el momento de la solicitud. Para el proxy outbound, un ya establecido `HTTP_PROXY` o
`HTTPS_PROXY` tiene prioridad sobre el nivel superior `proxy` campo.

El enrutamiento tiene sus propias reglas de resolución ordenadas; ver [Enrutamiento](/es/reference/configuration/routing/).

<a id="configuration-domains"></a>

## Dominios de configuración

- [Proveedores](/es/reference/configuration/providers/) — entradas de proveedores, autenticación, puntos finales, catálogos, listas de permisos, límites de contexto, cuotas y opciones específicas del proveedor.
- [Enrutamiento](/es/reference/configuration/routing/) — `defaultProvider`, orden de resolución del modelo, combos, alias, y combo defaults de esfuerzo.
- [Agentes](/es/reference/configuration/agents/) — modo multiagente, guía de delegación, modelos de reserva, sincronización nativa predeterminada y límites de esfuerzo.
- [Servidor y entorno de ejecución](/es/reference/configuration/server/) — oyente y acceso remoto, claves de admisión, timeouts, almacenamiento, sidecars, comportamiento de inicio y llamadas sombra.

<a id="keep-secrets-out-of-the-file"></a>

## Mantener los secretos fuera del archivo

Prefiero `${ENV_VAR}` referencias para las teclas API. Literal `apiKey`, `apiKeyPool[].key`, y `apiKeys[].key`
Los valores son secretos; no los comprometas, no los pegues en registros ni los compartas. OAuth y el proveedor de forward tokens son Almacenado en tiendas de credenciales separadas en lugar de en `config.json`. Los ID de cuenta y los correos electrónicos también deben siga siendo privado; use alias de selector público donde sea compatible.

:::note[Escrituras atómicas]
opencodex escribe administrado `config.toml` y `opencodex-catalog.json` archivos a través de un archivo temporal Luego, re-nombrar (`atomicWriteFile`) Esto evita archivos parciales cuando los escritores concurrentes, tales como `ocx stop` y el controlador de apagado proxy, restaurar Codex al mismo tiempo. Si un archivo TOML administrado contiene un entero fuera del rango seguro de JavaScript, se rechaza la reescritura en lugar de redondear el valor, y el archivo se deja sin cambios.
:::
