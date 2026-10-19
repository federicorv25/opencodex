---
title: "Por qué v1 es la superficie de subagente predeterminada"
description: "Qué rompe la limitación de tareas cifradas de v2, por qué OpenCodex ahora envía v1 y qué hacer si aún desea v2."
---

OpenCodex se instala con la superficie del subagente **v1**. El panel de control, modelos y subagentes Todas las páginas te piden que confirmes antes de moverte a **base** o **v2**, y esta página es lo que links de confirmación. El CLI no aparece.

La razón es estrecha y específica: en v2, una tarea ChatGPT-modelo nativo a un modelo enrutado no puede ser leído por el modelo enrutado. Esa es la única forma más común en que las personas delegan —
a GPT padre engendrando a Grok, Claude o GLM niño — y en v2 falla cada vez.

<a id="what-you-see-when-it-happens"></a>

## Lo que ves cuando sucede

El engendro es rechazado en lugar de producir silenciosamente una tarea infantil vacía:

```json
{
  "error": {
    "code": "unreadable_encrypted_agent_task",
    "message": "Routed V2 worker task is encrypted for the native ChatGPT backend and cannot be read by the selected provider. Use plaintext V2 agent-message delivery or select a native ChatGPT model."
  }
}
```

HTTP 400, y el texto cifrado nunca se repite. El fracaso es deliberado: enviar un Una carga útil ilegible le daría al niño una instrucción vacía y una respuesta confiadamente incorrecta.

<a id="why-it-happens"></a>

## Por qué sucede

![Two lanes compare the same delegation. On v1 a ChatGPT parent sends a plaintext task through OpenCodex, it crosses the provider boundary, and the routed child reads it. On v2 the parent sends encrypted_content minted by the ChatGPT backend; OpenCodex cannot decrypt it, so the task stops at the provider boundary and the request fails with unreadable_encrypted_agent_task.](../../../../assets/subagent-v2-encrypted-task.svg)

En v1, el padre emite la tarea del niño como texto plano. OpenCodex lo lee, lo enruta y El niño recibe algo sobre lo que puede actuar.

En v2 el padre emite la tarea como `encrypted_content`, acuñado por el backend ChatGPT. La clave se queda en ese backend. OpenCodex nunca lo tuvo, por lo que no hay nada para un proxy para descifrar y nada para reescribir — el valor es realmente texto cifrado, no texto plano detrás de una bandera. Por eso Esto es estructural en lugar de una configuración incorrecta, y por qué ninguna configuración del lado del proxy puede solucionarlo.

Tres topologías no se ven afectadas, lo cual vale la pena señalar porque explica la forma de la estructura. Fracaso en lugar de que el fracaso sea misterioso

| Topología | v1 | v2 |
| --- | --- | --- |
| ChatGPT padre a hijo enrutado | obras | **falla** |
| Padre encaminado al hijo encaminado | obras | obras |
| ChatGPT padre a hijo ChatGPT | obras | funciona — el backend puede descifrar lo que acuñó |

El backend siempre puede leer su propio texto cifrado. Sólo se rompe el cruce de fronteras.

<a id="is-it-fixed-upstream"></a>

## ¿Está fijado upstream?

Todavía no, y no para la mitad de lo que importa. Combinación ascendente
[openai/códex : 35845](https://github.com/openai/codex/pull/35845), lo que añade soporte para mensajes de colaboración de texto sin formato —, pero ese es el *recibir* lado. Maneja el texto plano que ya fue producido; no hace que un padre OpenAI lo produzca.

El lado de envío sigue abierto:
[#36376](https://github.com/openai/codex/issues/36376), reproducido a través de CLI 0.146 a 0.151 en Windows, macOS y Linux y [#37197](https://github.com/openai/codex/issues/37197), que establece la pieza faltante directamente — una política de entrega del lado de envío. Tampoco tiene un mantenedor compromiso o un ETA.

OpenCodex registró la consecuencia como [#92](https://github.com/lidge-jun/opencodex/issues/92), cerrado como no está previsto: nada en este repositorio puede solucionarlo, por lo que el problema es un puntero a la upstream trabajo en lugar de una tarea de espera en un mantenedor aquí.

<a id="what-the-three-modes-do-now"></a>

## Lo que los tres modos hacen ahora

| Modo | Superficie | Cuándo elegirlo |
| --- | --- | --- |
| **v1** (predeterminado) | Cada modelo anuncia las herramientas de generación clásicas. Una generación puede nombrar a otro modelo directamente. | Cualquier persona que delega a través de proveedores. Este es el valor predeterminado enviado. |
| **base** | Alfileres de modelo ascendente: Sol y Terra usan v2, Luna usa v1, los modelos sin pines siguen la propia bandera de Codex. | Desea la superficie por modelo prevista de Codex y solo delega dentro de un proveedor. |
| **v2** | Cada modelo anuncia las herramientas concurrentes planas. | Desea que el modelo de sesión concurrente más nuevo y su padre e hijo estén en el mismo lado del límite. |

base aparece en segundo lugar en lugar de primero porque sus pines ponen Sol y Terra — los dos modelos más personas delegan *Desde* — en v2. base no es un ajuste medio para este problema; para un ChatGPT-a-enrutado engendra se comporta como v2.

<a id="if-you-already-chose-base-or-v2"></a>

## Si ya ha elegido base o v2

Nada ha cambiado para ti. La actualización a una versión que envía este valor predeterminado no reescribe un configuración existente; el panel de control eleva el aviso una vez y espera una respuesta.

- **Continuar** mantiene el modo en el que estás y deja de preguntar.
- **Cambiar a v1** aplica v1 y deja de preguntar.

Cualquiera de las respuestas queda registrada y el aviso no regresa. Desestimarlo sin responder Lo deja para la próxima vez que abra el panel de control.

Los cambios de modo se aplican a **nuevo** Sesiones Codex. Iniciar una nueva sesión después de elegir; si se El anfitrión de la aplicación todavía muestra la superficie antigua, ejecuta `ocx sync` Reinicia esa superficie.

<a id="if-you-want-v2-anyway"></a>

## Si quieres v2 de todos modos

Cuatro rutas, en el orden en que la mayoría de la gente debería probarlas:

1. **Mantenga ChatGPT en la v1.** Dentro de v2, el `keepNativeChatGptOnV1` switch deja Sol y Terra encendidos la superficie v1 para que aún puedan generar Grok o Claude, mientras que los padres enrutados obtienen v2. Este es el Lo más parecido a tener ambos.
2. **Delegar dentro de un proveedor.** Un padre enrutado que genera un hijo enrutado es texto plano en v2 y funciona normalmente.
3. **Confíe en un relé Responses de clave directa.** Un proveedor con el que marcas explícitamente
   `allowEncryptedV2AgentTasks: true` recibe la carga útil opaca en lugar de la 400. Sólo haz esto para un destino que sabes que puede consumirlo.
4. **Habilitar `agentTaskRecovery`.** Experimental y apagado por defecto. Recupera cifrado ilegible
   `NEW_TASK`, `MESSAGE`, `FOLLOWUP_TASK`, y `FINAL_ANSWER` los elementos a través del backend ChatGPT, en el costo de la cuota, la latencia y una dependencia del comportamiento indocumentado; recuperación combinada sigue siendo limitado a los giros de niño generado, y fragmentos divididos-token permanecen sin soporte.

Véase [Interfaz de subagentes](/es/guides/sub-agent-surface/) para la mecánica completa de cada uno, y
[Configuración del agente](/es/reference/configuration/agents/) para los propios configuración.

<a id="when-this-page-goes-away"></a>

## Cuando esta página desaparece

Cuando una versión upstream hace que un padre nativo ChatGPT emita una tarea secundaria enrutada como texto plano, la razón del defecto desaparece con él. En ese momento el valor predeterminado se mueve de nuevo a la base, el La confirmación deja de aparecer, y esta página se convierte en historia en lugar de consejo.

<a id="changing-the-mode"></a>

## Cambiar el modo

Panel de control, modelos y subagentes todos llevan el mismo switch v1/base/v2, y los tres preguntan antes base o v2. Desde el CLI:

```bash
ocx v2 status
ocx v2 mode v1
```

El CLI no aparece. Es la misma configuración, así que elíjala sabiendo lo que describe esta página.

<a id="concurrent-child-limit"></a>

## Límite simultáneo por hijo

En **Modelos → Configuración del modelo**, el control de límite de subagente establece el número máximo de Agentes secundarios, excluyendo el agente primario. Se encuentra disponible en v1, base y v2, incluyendo modo híbrido con el indicador global v2 desactivado. Elija el modo de superficie por separado de este límite.

Elevar la tapa permite más niños; no los crea automáticamente ni garantiza una mayor velocidad ejecución. Iniciar una nueva sesión Codex después de cambiar el límite. Si un host de aplicación de larga duración sigue utiliza el límite anterior, reinicie ese host.
