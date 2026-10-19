---
title: "Advisor"
description: "Consulta independiente de expertos con políticas adaptativas manuales, previas y basadas en la evidencia."
---

El asesor es un modelo de experto independiente que revisa la tarea del trabajador y devuelve el asesoramiento. OpenCodex posee la consulta de extremo a extremo: el proxy inyecta un sintético `advisor` herramienta en el el turno del trabajador, ejecuta la propia consulta a través de la autoridad de enrutamiento normal, y reinyecte el consejo para que el trabajador original continúe. El trabajador nunca delega, engendra cualquier cosa, o lleva credenciales de proveedor.

Esto es distinto de la superficie del subagente (ver
[Configuración del agente](/es/reference/configuration/agents/)): los subagentes son iniciados por el trabajador delegación a través de las herramientas de colaboración de Codex. El asesor es un sidecar del lado del proxy que el cliente nunca ve —, incluso un trabajador que nunca genera nada puede ser aconsejado.

<a id="configuration"></a>

## Configuración

En el panel de control **Advisor** página (bajo el **Subagentes** ej., fila de la barra lateral), seleccione el modelo experto en el selector de catálogo. Guarda el identificador de catálogo exacto, incluidos los selectores nativos, proveedores, calificados para cuentas, personalizados y combinados. Los modelos deshabilitados y los modelos que esperan la selección inicial no se ofrecen como nuevas opciones. Un identificador guardado que falta en el catálogo seleccionable permanece visible con una advertencia y se conserva hasta que elija otro modelo o lo borre. Los fallos de carga del catálogo preservan la selección y proporcionan Reintento. Elija un modelo que pueda devolver consejos de texto: el catálogo no garantiza la compatibilidad de la consulta. El CLI y el API siguen aceptando cadenas de modelos compatibles con router.

```json
{
  "advisor": {
    "enabled": true,
    "model": "gpt-6-astra",
    "effort": "max",
    "policy": "preflight",
    "contextSharingConsent": "v1"
  }
}
```

| Campo | Tipo | Predeterminado | Significado |
| --- | --- | --- | --- |
| `enabled?` | `boolean` | `false` | Interruptor maestro. Deshabilitado significa cero comportamiento del asesor en la ruta de solicitud. La habilitación no registra el consentimiento. |
| `model?` | `string` | — | El modelo experto. Cualquier cadena de modelo que el router acepte: un modelo nativo desnudo (`gpt-6-astra`), una explícita `provider/model` (`anthropic/claude-sonnet-4-6`, `xai/grok-...`), o un modelo nativo calificado para la cuenta. El proveedor cruzado es totalmente compatible: el trabajador y el asesor no necesitan compartir un proveedor. |
| `effort?` | `string` | `"max"` | Esfuerzo de razonamiento para la llamada del asesor (`low` a través `ultra`). |
| `policy?` | `"manual" \| "preflight" \| "adaptive"` | `"manual"` | Cuando se consulta al asesor. |
| `maxConsultationsPerTask?` | `integer` | `3` | Asignación de tareas adaptable (1–3 intentos), incluyendo llamadas manuales. |
| `timeoutMs?` | `number` | `120000` | Tiempo de espera de consulta Loopback. |
| `contextSharingConsent?` | `"v1"` | ausente | Consentimiento del operador para enviar el contexto de la tarea al proveedor de Asesor configurado. Solo `"v1"` es actual. Ausente, rancio o cualquier otro valor significa que no se envía ningún contexto de tarea. |

Gestionarlo desde el panel de control **Advisor** página (la casilla de verificación de compartir contexto comienza sin marcar) o con `ocx advisor status`, `ocx advisor on --ack-context-sharing`, `ocx advisor consent`,
`ocx advisor consent --revoke`, `ocx advisor off`, y
`ocx advisor set --model <model> --effort <effort> --policy <manual|preflight|adaptive>`.
`ocx advisor on` sin `--ack-context-sharing` no permite compartir entre proveedores cuando Falta el consentimiento: imprime esta divulgación y se detiene. `ocx advisor set` No otorga consentimiento.

<a id="policies"></a>

## Políticas

- **`manual`** — solo una llamada explícita del trabajador a la `advisor` herramienta consulta. La llamada es interceptado por el proxy, nunca mostrado al cliente y nunca ejecutado como una herramienta local.
- **`preflight`** — OpenCodex también intenta una consulta por tarea automáticamente. Cuando el trabajador ha presentado su primera evidencia de orientación (una llamada a una herramienta auxiliar O una herramienta ej., resultado después del último mensaje de usuario), el proxy consulta al asesor e inyecta el consejo antes de que el trabajador vuelva a —, incluso si el trabajador nunca llama a la herramienta. El disparador es un Determinista, aproximación documentada, no un detector semántico de "modelo está atascado". Un intento de consulta que FAILS no se trata silenciosamente como un consejo: la tarea vuelve a intentar después La entrada del libro mayor de la falla expira, por lo que una interrupción temporal del asesor no es permanente silenciar la política.
- **`adaptive`** — agrega consultas de reparación fallida al intento inicial de prevuelo. El proxy debe observar una validación fallida completada, un resultado posterior de la herramienta de edición de archivos exitosa, Una nueva ejecución de la **mismo comando en el mismo directorio de trabajo** Fracasó de nuevo. Una validación de aprobación borra su estado de fallo. Una comprobación iniciada antes de la edición no puede contar como una repetición después de la edición. Las etapas inicial y de reparación fallida tienen reclamaciones separadas. Solo los clientes con una identidad de conversación estable reciben consultas adaptativas automáticas.

<a id="adaptive-budget-and-evidence"></a>

### Presupuesto y pruebas adaptables

```sh
ocx advisor set --policy adaptive --max-consultations 2
ocx advisor activity --json
```

El presupuesto adaptativo de tareas cuenta manual y automáticamente **Intentos**, a través de solicitudes y trabajadores Cambios de modelo. El servidor se reserva un intento antes del envío en un modo privado.
`advisor-budget.sqlite` archivo en `OPENCODEX_HOME`; los reinicios proxy no lo restablecen. Una tarea es identificado por un compendio de la identidad de conversación y el último límite de tarea del usuario. Reservas expira 24 horas después del primer intento, por lo que esta es una aproximación limitada de tarea y tiempo de vida, no una sesión permanente o un presupuesto monetario diario. Solo se digieren, cuentan y los tiempos de caducidad son almacenados. Hay espacio para 512 tareas en vivo; un presupuesto completo, no disponible o bloqueado se salta al experto Llame mientras el trabajador continúa. Las llamadas enviadas que fallaron o se desconectaron retienen su reserva porque pueden haber incurrido en el uso. El consentimiento revocado antes del envío no gasta ninguna asignación. Los clientes sin una identidad estable mantienen el acceso manual, limitado a solicitudes, pero no reciben acceso automático. Consulta adaptativa. Legado `manual` y `preflight` mantener su comportamiento anterior de desestructuración de tareas.

El recopilador reconoce llamadas de shell emparejadas con estado de salida numérico explícito, incluyendo
`exec_command`, `shell_command`, `shell`, `Bash`, y terminal `write_stdin` encuestas. Apoyado Los comandos incluyen comandos comunes Bun/npm/pnpm/yarn test, typecheck, lint, check y build,
`pytest`, `python -m pytest`, `tsc`, `eslint`, `cargo test/check/clippy/build` y `go test/vet`. Las ediciones de archivos usan con éxito `apply_patch`, `Write`, `Edit`, `write_file` o `edit_file` resultados. Se reconocen los ayudantes de modo de código único con argumentos JSON literales (se aceptan claves vacías); JavaScript arbitrario, lotes, tuberías/sustituciones de shell, ediciones basadas en shell, ambiguo La prosa de salida y error por sí sola no proporciona ningún desencadenante. A lo sumo los 512 mensajes más recientes desde el Se examinan las tareas más recientes del usuario. El contexto de reparación fallida incluye la validación, limitada primero y extractos repetidos de fallas, y referencias al mensaje fuente antes de la transcripción general.

<a id="consent"></a>

## Consentimiento

El contexto de la tarea no se envía hasta que el operador registra el consentimiento para compartir el contexto `v1`. El consentimiento es versión para que una divulgación posterior, más amplia pueda requerir `v2` en lugar de reutilizar esta subvención. Los El entorno de ejecución lo hace cumplir. Un valor perdido o obsoleto deja al asesor inejecutable (`advisor_context_sharing_consent_required`) sin fallar la solicitud de codificación. Ni el modelo, y ninguna cadena en la tarea, puede otorgar el consentimiento.

<a id="what-the-advisor-sees"></a>

## Lo que ve el asesor

Una consulta puede enviar:

- La última tarea del usuario
- texto de usuario, asistente y desarrollador visible en la conversación analizada
- Llamadas a herramientas y argumentos de herramientas
- resultados de la herramienta
- el catálogo y las descripciones de la herramienta de trabajo
- la identidad del trabajador y el modelo de Asesor configurado
- una pregunta de enfoque opcional cuando el trabajador llama `advisor()`

El proveedor de Asesor configurado puede diferir del proveedor de trabajador.

OpenCodex no inserta las claves del proveedor API, encabezados de autorización, OAuth tokens, solo backend configure secretos, entorno de proceso o cadena de pensamiento oculta en ese indicador. No es así. desencriptar o reenviar el razonamiento cifrado proveedor-privado. **El contenido de la tarea no se edita en secreto.**
Una clave pegada en la tarea, un secreto en un archivo que leen las herramientas o una token impresa por una herramienta o El log puede ser enviado. OpenCodex no ejecuta el DLP general.

<a id="authority"></a>

## Autoridad

El asesoramiento manual es un resultado de la herramienta para el `advisor` llamar al trabajador realizado. El resultado es un JSON objeto. Es `advice` El campo es el texto del modelo Advisor. Es `status` está establecido por el entorno de ejecución.

Preflight automático mantiene la instrucción de transporte en entorno de ejecución fija en un mensaje de desarrollador y pone el consejo citado JSON en una posición separada **mensaje de aviso de usuario-rol**. Texto generado por el asesor nunca ingresa contenido de desarrollador / sistema, incluso cuando se traduce OpenAI Desarrollador de mapas de chat política al sistema. Anthropic puede llevar ese aviso sin una llamada de herramienta inventada. JSON escapando evita la ruptura estructural y los campos forjados; no puede garantizar el aislamiento de inyección rápida. Un protocolo de consulta-resultado dedicado podría distinguir el asesoramiento de la entrada ordinaria del usuario más Fuertemente.

Cada solicitud permite como máximo tres consultas, incluyendo intentos automáticos, y cuatro continuaciones de trabajadores propiedad del Asesor. Después del agotamiento de la consulta `advisor` herramienta es removida. Una llamada repetida recibe un final resultado del límite emparejado; si el trabajador lo llama de nuevo, escriba 502 `advisor_continuation_limit` termina el solicitud sin otra llamada oculta del trabajador. El enlace se comparte con los reintentos de finalización vacía.

La supresión no lee cadenas de Advisor. El dedup automático es el libro mayor propiedad del servidor. A El mensaje de desarrollador, incluido uno que copia el texto de transporte, no suprime el prevuelo.

<a id="cost-and-accounting"></a>

## Coste y contabilidad

Cada consulta es un modelo de llamada adicional real. Aparece en uso bajo la **asesor modelo** — nunca se fusionó en el token del trabajador cuenta — y cada consulta escribe un
`[advisor]` línea de registro con disparador, duración, estado y uso, por lo que una llamada de asesor siempre es Probable desde los registros.

Los **Actividad reciente del asesor** sección y `GET /api/advisor/activity` Mostrar los últimos 100 los registros de metadatos de consulta de este proceso, conservados hasta 24 horas. El panel Los refresca cada cinco segundos mientras están visibles. Los registros incluyen disparador, estado, trabajador y modelos expertos, duración, entrada/salida informada tokens, esfuerzo solicitado y mapeado por adaptador esfuerzo. La denegación del presupuesto se muestra como bloqueada. Los registros no contienen texto de tarea, comandos, consejos, identificadores de subproceso o cuerpos de error del proveedor y se borran en el reinicio proxy.

El esfuerzo mapeado describe lo que el adaptador serializó, no una garantía sobre la seguridad del proveedor. Razonamiento oculto. El esfuerzo o uso no reportado permanece desconocido; nunca se presenta como cero. uso o apoyo de razonamiento confirmado. No se infiere una puntuación de adopción de consejos ni un costo monetario exacto.

<a id="failure-behavior"></a>

## Comportamiento de fracaso

El asesor no abre. A DISPATCHED consulta que falla (modelo no disponible, proveedor mal configurado, tiempo de espera) le da al trabajador un aviso corto y no engañoso de "consejero no disponible" — a
`<opencodex_advisor_unavailable>` mensaje de prevuelo, un resultado de herramienta de error para manual — y la tarea continúa; solo una consulta CANCELLED no inyecta nada, porque la persona que llama se ha ido. Un plan que nunca despacha (asesor desactivado, habilitado sin un modelo o habilitado sin un modelo) ej., consentimiento actual para compartir contexto) no envía ningún aviso previo, porque no se inició ninguna consulta. Un manual `advisor()` llamada sin consentimiento actual devuelve un resultado de herramienta requerido por consentimiento y No envía nada. Un error del asesor nunca falla la solicitud de codificación, y un La consulta nunca cambia el modelo principal de la sesión.

<a id="limitations"></a>

## Limitaciones

- Los giros de paso nativos de OpenAI (trabajadores de ChatGPT-pool) no obtienen la herramienta sintética; asesor soporte cubre proveedores encaminados (traducidos). La consulta previa al vuelo se aplica a la vuelta adaptadores; la herramienta no lo hace.
- No hay detección semántica atascada, revisión de finalización, escalada de niveles, múltiples asesores o votación. La consulta adaptativa requiere la validación/edición/evidencia de reintento estructurada descrita anteriormente.
- El libro mayor de dedup previo al vuelo es process-local; después de reiniciar un proxy, una tarea en progreso puede recibir un intento más de prevuelo.
