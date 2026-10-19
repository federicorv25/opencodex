---
title: "Por qué v1 es la superficie de subagente predeterminada"
description: "Qué rompe la limitación de tareas cifradas de v2, por qué OpenCodex ahora envía v1 y qué hacer si aún desea v2."
---

OpenCodex se instala con la superficie del subagente establecida en **v1**. Las páginas Panel de control, Modelos y Subagentes le piden que confirme antes de pasar a **base** o **v2**, y esta página es a la que se vincula esa confirmación. El CLI no lo solicita.

La razón es estrecha y específica: en la v2, una tarea transmitida desde un modelo nativo ChatGPT a un modelo enrutado no puede ser leída por el modelo enrutado. Esa es la forma más común en que las personas delegan: un padre GPT que genera un hijo Grok, Claude o GLM, y en v2 falla cada vez.

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

HTTP 400, y el texto cifrado nunca se repite. El fracaso es deliberado: reenviar una carga útil ilegible le daría al niño una instrucción vacía y una respuesta confiadamente incorrecta.

<a id="why-it-happens"></a>

## Por qué sucede

![Comparación de la delegación: en v1, ChatGPT envía una tarea sin cifrar mediante OpenCodex y el subagente enrutado puede leerla. En v2 envía encrypted_content del backend de ChatGPT; OpenCodex no puede descifrarlo y la solicitud falla con unreadable_encrypted_agent_task al cruzar el límite de proveedores.](../../../../assets/subagent-v2-encrypted-task.svg)

En v1, el padre emite la tarea del niño como texto plano. OpenCodex lo lee, lo encamina, y el niño derrotado recibe algo sobre lo que puede actuar.

En v2, el padre emite la tarea como `encrypted_content`, acuñada por el backend ChatGPT. La clave se queda en ese backend. OpenCodex nunca lo tuvo, por lo que no hay nada que un proxy pueda descifrar y nada que reescribir: el valor realmente es texto cifrado, no texto plano detrás de una bandera. Es por eso que esto es estructural en lugar de una configuración incorrecta, y por qué ninguna configuración del lado del proxy puede solucionarlo.

Tres topologías no se ven afectadas, lo cual vale la pena señalar porque explica la forma del fracaso en lugar de que el fracaso sea misterioso:

| Topología | v1 | v2 |
| --- | --- | --- |
| ChatGPT padre a hijo enrutado | obras | **falla** |
| Padre encaminado al hijo encaminado | obras | obras |
| ChatGPT padre a ChatGPT hijo | obras | funciona - el backend puede descifrar lo que acuñó |

El backend siempre puede leer su propio texto cifrado. Sólo se rompe el cruce de fronteras.

<a id="is-it-fixed-upstream"></a>

## ¿Está fijado upstream?

Todavía no, y no para la mitad de lo que importa. Upstream fusionó [openai/códex: 35845](https://github.com/openai/codex/pull/35845), que agregó soporte para mensajes de colaboración de texto plano, pero ese es el lado *recibir*. Maneja el texto plano que ya se produjo; no hace que un padre OpenAI lo produzca.

El lado de envío todavía está abierto: [#36376](https://github.com/openai/codex/issues/36376), reproducido en CLI 0.146 a 0.151 en Windows, macOS y Linux, y [#37197](https://github.com/openai/codex/issues/37197), que establece la pieza que falta directamente: una política de entrega del lado de envío. Tampoco tiene un compromiso de mantenimiento o una ETA.

OpenCodex registró la consecuencia como [#92](https://github.com/lidge-jun/opencodex/issues/92), cerrado como no planeado: nada en este repositorio puede arreglarlo, por lo que el problema es un puntero al trabajo ascendente en lugar de una tarea que espera en un mantenedor aquí.

<a id="what-the-three-modes-do-now"></a>

## Lo que los tres modos hacen ahora

| Modo | Superficie | Cuándo elegirlo |
| --- | --- | --- |
| **v1** (por defecto) | Cada modelo anuncia las herramientas clásicas de generación de nombres. Una generación puede nombrar a otro modelo directamente. | Cualquier persona que delega a través de proveedores. Este es el valor predeterminado enviado. |
| **base** | Alfileres de modelo aguas arriba: Sol y Terra usan v2, Luna usa v1, los modelos sin pines siguen la propia bandera de Codex. | Usted quiere Codex 's superficie por modelo previsto y delegar dentro de un solo proveedor. |
| **v2** | Cada modelo anuncia las herramientas concurrentes planas. | Desea que el modelo de sesión concurrente más nuevo y su padre y su hijo estén en el mismo lado del límite. |

La base aparece en segundo lugar en lugar de primero porque sus pines ponen a Sol y Terra, los dos modelos que la mayoría de la gente delega en *Desde*, en v2. La base no es un ajuste medio para este problema; para un ChatGPT -enrutado se comporta como v2.

<a id="if-you-already-chose-base-or-v2"></a>

## Si ya ha elegido base o v2

Nada ha cambiado para ti. La actualización a una versión que envía este valor predeterminado no reescribe una configuración existente; el panel de control eleva el aviso una vez y espera una respuesta.

- **Continuar** mantiene el modo en el que estás y deja de preguntar.
- **Cambiar a v1** aplica v1 y deja de preguntar.

Cualquiera de las respuestas queda registrada y el aviso no regresa. Desestimarlo sin responder lo deja para la próxima vez que abra el tablero.

Los cambios de modo se aplican a **nuevo** Sesiones Codex. Iniciar una nueva sesión después de elegir; si se El anfitrión de la aplicación todavía muestra la superficie antigua, ejecuta `ocx sync` Reinicia esa superficie.

<a id="if-you-want-v2-anyway"></a>

## Si quieres v2 de todos modos

Cuatro rutas, en el orden en que la mayoría de la gente debería probarlas:

1. **Mantenga ChatGPT en v1.** Dentro de la v2, el interruptor `keepNativeChatGptOnV1` deja a Sol y Terra en la superficie de la v1 para que aún puedan generar Grok o Claude, mientras que los padres enrutados obtienen la v2. Esto es lo más parecido a tener ambos.
2. **Delegar dentro de un proveedor.** Un padre enrutado que genera un hijo enrutado es texto plano en v2 y funciona normalmente.
3. **Confíe en un relé de llave-auth directo Responses.** Un proveedor que marque explícitamente con `allowEncryptedV2AgentTasks: true` recibe la carga útil opaca en lugar de la 400. Solo haz esto para un destino que sabes que puede consumirlo.
4. **Habilitar `agentTaskRecovery`.** Experimental y apagado por defecto. Recupera ilegibles cifrados `NEW_TASK`, `MESSAGE`, `FOLLOWUP_TASK` y `FINAL_ANSWER` elementos a través de la ChatGPT backend, a costa de cuota, latencia y una dependencia de comportamiento indocumentado; Combo recuperación sigue siendo limitada a turnos engendrado-hijo, y fragmentos de token dividido permanecer sin soporte.

Vea [Superficie del subagente](/es/guides/sub-agent-surface/) para ver la mecánica completa de cada uno, y [Configuración del agente](/es/reference/configuration/agents/) para los ajustes en sí.

<a id="when-this-page-goes-away"></a>

## Cuando esta página desaparece

Cuando una versión upstream hace que un padre nativo ChatGPT emita la tarea de un hijo enrutado como texto plano, la razón del valor predeterminado desaparece con él. En ese momento, el valor predeterminado vuelve a la base, la confirmación deja de aparecer y esta página se convierte en historia en lugar de consejo.

<a id="changing-the-mode"></a>

## Cambiar el modo

Panel de control, Modelos y Subagentes todos llevan el mismo switch v1/base/v2, y los tres preguntan antes de base o v2. Desde el CLI:

```bash
ocx v2 status
ocx v2 mode v1
```

El CLI no da respuesta. Es la misma configuración, así que elíjala sabiendo lo que describe esta página.

<a id="concurrent-child-limit"></a>

## Límite simultáneo por hijo

En **Modelos → Ajustes del modelo**, el control de límite de subagente establece el número máximo de agentes secundarios concurrentes, excluyendo el agente primario. Sigue estando disponible en v1, base y v2, incluido el modo híbrido con la bandera global v2 desactivada. Elija el modo de superficie por separado de este límite.

Elevar la tapa permite más niños; no los crea automáticamente ni garantiza una ejecución más rápida. Inicie una nueva sesión Codex después de cambiar el límite. Si un host App de larga duración sigue utilizando el límite anterior, reinicie ese host.
