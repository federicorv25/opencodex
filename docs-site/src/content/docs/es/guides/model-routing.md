---
title: "Enrutamiento de modelos"
description: "Cómo decide opencodex qué proveedor sirve un ID de modelo determinado."
---

Cuando Codex pide un modelo, `router.ts` lo resuelve exactamente a un proveedor configurado. Las reglas son chequeado **por orden**El primer partido gana.

Para OpenAI, una configuración `<selector>/gpt-*` id mapas a través de `codexAccountNamespaces` a exactamente uno cuenta Codex almacenada antes de que se consideren los espacios de nombres combinados o del proveedor. Desnudo `gpt-*` ids select El canónico `openai` proveedor en su lugar. Es `codexAccountMode` elige Pool (predeterminado, principal más ej., cuentas añadidas) o Direct (portador de llamadas/principal actual) sin cambiar el identificador del modelo.
`openai-apikey/<model>` selecciona explícitamente el transporte de clave API. Estas rutas de credenciales no caen a través de uno al otro.

<a id="precedence"></a>

## Precedencia

1. **Selector de cuenta Codex exacto** — si el identificador es
   `<selector>/<native-openai-model>` y el selector está configurado en `codexAccountNamespaces`, la solicitud utiliza solo la cuenta almacenada asignada y envía el modelo nativo desnudo en sentido ascendente. Los objetivos exactos no disponibles no se cierran en lugar de continuar a través de Pool, Direct o proveedor enrutamiento.

   ```text
   side/gpt-5.6-sol → provider "openai", model "gpt-5.6-sol", account selector "side"
   ```

2. **Identificación combinada o alias** — mientras se configura al menos un combo, una `combo/<id>` o combo alias configurado selecciona su destino concreto antes de que se comprueben los espacios de nombres del proveedor. Con sin combos configurados, un proveedor físico heredado llamado literalmente `combo` Sigue siendo normal espacio de nombres del proveedor. Véase [Combos](/es/guides/combos/) para selección de objetivos y comportamiento de conmutación por error.

3. **Explícito `provider/model`** — Si el id contiene `/` y la parte anterior es el nombre de un proveedor configurado, ese proveedor se utiliza y el id se quita a la parte después de la barra.

   ```text
   anthropic/claude-opus-5     →  provider "anthropic",   model "claude-opus-5"
   ollama-cloud/glm-5.2        →  provider "ollama-cloud", model "glm-5.2"
   openrouter/openai/gpt-5.6-sol → provider "openrouter",  model "openai/gpt-5.6-sol"
   ```

   Este es el formulario explícito del proveedor de rutas, y el que el selector de modelos de Codex utiliza para la ruta. modelos. Si el mismo id público es un alias combinado configurado, gana la regla 2. Si el proveedor designado es deshabilitado, esta forma explícita lanza en lugar de enrutamiento.

4. **ID de familia OpenAI nativa desnuda** — un id tal como `gpt-*`, `o1-*`, `o3-*`, o `o4-*` utiliza el canónico habilitado `openai` proveedor y su modo de cuenta configurado Pool o Direct.

5. **Un proveedor `defaultModel`** — si cualquier proveedor `defaultModel` es igual al id, ese proveedor se utiliza (id pasó a través sin cambios).

6. **Patrones de prefijo incorporado** — el id se compara con prefijos de familia de modelo conocidos, luego se enruta a un proveedor configurado con ese nombre (o prefijo de nombre):

   | Prefijos | Proveedor |
   | --- | --- |
   | `claude-`, `claude-sonnet-`, `claude-opus-`, `claude-haiku-` | `anthropic` |
   | `llama-`, `mixtral-`, `gemma-` | `groq` |

   Este matcher se basa en el nombre y, a diferencia de la `defaultModel` / `models[]` Escáneres, actualmente no filtrar un proveedor coincidente cuyo `disabled` La bandera es verdadera.

7. **Un proveedor `models[]`** — si no ganó ninguna regla de prefijo y un proveedor activo muestra el id en su
   `models[]`Este proveedor es utilizado. La regla 4 ya envía un `gpt-*` id al canónico habilitado
   `openai` proveedor antes que otro proveedor `models[]` reclamación puede coincidir.

8. **Proveedor predeterminado** — si nada coincide, el id se envía a `config.defaultProvider` sin cambios. (Si no hay ningún proveedor predeterminado configurado, o si está deshabilitado, el enrutamiento se dispara.)

<a id="api-keys-and-environment-variables"></a>

## API claves y variables de entorno

Sea cual sea la ruta elegida, el proveedor `apiKey` se resuelve a través `resolveEnvValue()`Un valor de
`${OPENAI_API_KEY}` o `$OPENAI_API_KEY` se expande desde el entorno a la hora de la solicitud, por lo que los secretos Nunca hay que vivir en `config.json`.

<a id="catalog-visibility-and-context-caps"></a>

## Visibilidad del catálogo y tapas de contexto

El enrutamiento y la visibilidad del catálogo son controles separados:

- `disabledModels` oculta los identificadores de ruta namespaced del catálogo Codex y `/v1/models`Un nativo desnudo GPT babosa se mantiene en el catálogo con `visibility: "hide"`. Lo hace **no** Rechazar una solicitud directa para ese modelo.
- El proveedor no está vacío `selectedModels` es otro catálogo allowlist. Descubrimiento en vivo y directo enrutamiento todavía funciona; solo catálogo y `/v1/models` emisiones se han reducido.
- Conjunto de instalaciones frescas `modelDiscovery.newModelPolicy` a `"off"`. Tras el primer live exitoso fetch establece una línea de base, llegadas posteriores se adjuntan a `disabledModels` y llevar un **NUEVO**
  insignia del panel de instrumentos hasta que esté activada o reconocida. Las instalaciones existentes permanecen `"on"` Hasta que se optó. La política se aplica antes de publicar modelos recién descubiertos a través de `/v1/models`, el panel de instrumentos, Exportación de configuración del cliente o sincronización de catálogo Codex (incluido el inicio del servicio). Habilitar una llegada manualmente la mantiene habilitada en actualizaciones y exportaciones posteriores. Si la configuración del proveedor en ejecución difiere del disco, las listas de modelos aún aplican la directiva utilizando una proyección temporal; dejan intacta la configuración en ejecución y las opciones guardadas. Uso `ocx models new-policy off` globalmente, añadir `--provider <name>` para una anulación, e inspeccionar
  `ocx models new-arrivals [--json]`. Los resultados fallidos/degradados nunca cambian la línea base. Proveedores con un no-vacío `selectedModels` (incluido el modo preestablecido) ya están curados, por lo que esta política es deliberadamente inertes para ellos.
- `provider.disabled: true` elimina ese proveedor del descubrimiento de catálogo. Explícito
  `provider/model` Las solicitudes fallan, y `defaultModel` / `models[]` Escáneres omiten.
- Las filas de catálogo enrutadas se clonan desde la plantilla nativa Codex, por lo que los indicadores de entrega solo nativos son durante la normalización: `supports_websockets`, `supports_reasoning_summaries`, y
  `supports_experimental_context`. Un proveedor encaminado nunca hereda el contexto experimental. contrato; heredar hizo que Codex fuera compacto después de casi cada paso en hilos largos.
- `providerContextCaps` Aplica por proveedor Codex-caps contexto visible. `contextCapValue` es el dashboard default (350,000 por defecto), pero no hace nada por sí mismo hasta que un Presente en `providerContextCaps`. Cambiar el valor del panel de control actualiza cada límite habilitado solo cuando "aplicar a cada proveedor enrutado" está activado; de lo contrario, cada proveedor mantiene su propio Cap. Las ventanas ordinarias conocidas solo se pueden bajar; los modelos nativos que admiten una ventana más larga puede expandirse hasta su propio techo soportado. Las tapas nunca cambian el límite real del modelo ascendente. Apagar una tapa conserva su selección en `providerContextCapValues`, incluso después de la recarga; Al activarlo, se restaura esa selección. Una selección recordada nunca aplica un límite mientras está deshabilitada. Envío `{ "setAll": true }` sin `value` habilita a todos los proveedores configurados en el valor global y reemplaza sus selecciones recordadas.
- Un modelo GitHub Copilot que admita el nivel de contexto largo ascendente puede optar por
  `providers.github-copilot.modelContextTiers.<model> = "long_context"` o
  `ocx provider edit github-copilot --model-context-tier <model>=long_context`. El nivel envía `contextTier: "long_context"` en el chat de copiloto y solicitudes Responses. Se eleva la ventana anunciada sólo cuando ese modelo exacto tiene una ventana por modelo conocida. en `modelContextWindows` (Por ejemplo, `1000000`); un modelo desconocido mantiene su ventana activa. Gana una ventana explícita por modelo, luego se aplica el límite de proveedor existente. Las ventanas guardadas y las selecciones de niveles sobreviven al inicio y al nuevo inicio de sesión de OAuth. OAuth presets fill falta por modelos predeterminados mientras mantiene sus entradas configuradas, incluso en xAI. Los `"default"` tier conserva los metadatos normales del contexto en vivo. El control del panel se planifica por separado.

```json
{
  "contextCapValue": 350000,
  "providerContextCaps": {
    "anthropic": 350000,
    "cursor": 350000
  }
}
```

<a id="tips"></a>

## Propinas

- **Dirígete a una cuenta Codex explícitamente** con `<selector>/<native-openai-model>` (artículo 1). Esa ruta es exacto y falla cerrado; nunca cambia silenciosamente a otra cuenta.
- **Sea explícito para los modelos enrutados.** Prefiero `provider/model` (Regla 3) cuando esa identificación pública exacta es No un alias combinado. Nombra directamente al proveedor y coincide con lo que Codex muestra en su selector después de una sincronización de catálogo.
- **Semilla `models[]` o `defaultModel`** en un proveedor tan corto ids (reglas 5/7) resolver sin el
  `provider/` prefijo.
- **Los patrones de prefijo son una conveniencia**, no una garantía: solo se resuelven si un proveedor con ese nombre (e.g. `anthropic` o `groq`En realidad está configurado.

Véase [Configuración](/es/reference/configuration/) para los campos del proveedor estas reglas leídas.


<a id="structured-output-on-cursor-routes"></a>

## Salida estructurada en rutas Cursor

Cursor rutas traducir Responses `text.format` (`json_object` o `json_schema`) en forma explícita instrucciones de respuesta final en el contexto del sistema y solicitud activa, incluyendo resultado de herramienta continuaciones. Esta es una respuesta rápida: Cursor no proporciona decodificación nativa restringida de JSON en este transporte, y los modelos aún pueden devolver una respuesta inválida. El adaptador no convierte la prosa en una decisión de aprobación. Los auto-revisores deben validar el JSON devuelto y usar un Ruta estructurada-capaz de salida cuando se requiere una aplicación estricta. Solicitudes de texto ordinarias y Las llamadas a herramientas intermedias mantienen su comportamiento existente.
