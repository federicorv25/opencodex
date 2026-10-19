---
title: "Capas de instrucciones de Codex"
description: "Lea lo que Codex realmente envía, apague las piezas que no necesita y agregue sus propias instrucciones como capas."
---

Codex ensambla su prompt a partir de capas: sus propias instrucciones básicas, su proyecto docs, contexto de permisos y entorno, las habilidades que ha instalado y Más. **Codex Set → Prompt** muestra esa pila, le dice lo que cuesta cada capa, y le permite apagar las piezas que no desea.

<a id="what-the-list-shows"></a>

## Lo que muestra la lista

Cada fila lleva su posición en el orden de montaje, la clave de configuración que gobierna cuando hay uno, y el tamaño de lo que realmente envió.

Las posiciones tienen lagunas. Eso es deliberado: los números son la asamblea real. dos de ellos se encuentran más abajo en **Notificaciones de transición**. Renumerar cada grupo de uno mostraría un orden que Codex no usa.

<a id="five-kinds-of-layer"></a>

### Cinco tipos de capa

| Amable | Lo que puedes hacer |
|---|---|
| Conmutable aquí | Un verdadero interruptor. Escribe una clave en `config.toml`. |
| Configurado bajo `[features]` | Real, pero cambiado de la configuración de características en lugar de esta página. |
| Siempre encendido | No hay interruptor de apagado en cualquier lugar en Codex. |
| Incendios en el cambio | Anuncia una transición, por lo que solo aparece cuando algo cambia. |
| Capas de extensión | No se puede enumerar. Codex no los expone. |

Una capa sin interruptor de apagado no muestra ningún interruptor en lugar de uno desactivado. A control gris sugeriría que la capacidad existe y es temporalmente No disponible, que no es el caso.

<a id="reading-a-layer"></a>

## Leer una capa

Haga clic en un nombre de capa para ver el texto que envía. El diálogo lo lee desde
`codex debug prompt-input`, por lo que es la cosa real en lugar de una descripción.

A veces no hay nada que mostrar, y el diálogo dice qué razón se aplica:

- **El archivo está vacío.** Tu `~/.codex/AGENTS.md` es cero bytes, por lo que La capa no tiene nada que enviar. El diálogo nombra la ruta.
- **No envió nada en el turno que leímos.** Las capas solo se envían cuando se cambio, por lo que una capa sin cambios está ausente de una sola muestra.
- **El indicador base proviene de su catálogo de modelos.** Codex lo envía fuera del lista legible, por lo que el cuadro de diálogo lo lee de la fila del catálogo del modelo seleccionado — o desde el archivo nombrado por `model_instructions_file` cuando haya establecido uno. A fila que publica solo una plantilla no expandida se informa como no mostrada, porque ese texto no es lo que envía Codex.
- **El mensaje no se pudo leer.** La sonda falló en esta máquina.

La lectura se toma de su casa global Codex (`~/.codex`), no de lo que directorio en el que se está ejecutando el panel de control.

<a id="custom-layers"></a>

## Capas personalizadas

**+ Añadir capa** Añade tus propias instrucciones. Las capas personalizadas componen en
`developer_instructions`, que es aditivo — Codex mantiene sus propias instrucciones y los tuyos se añaden a ellos.

:::note
Esto es deliberadamente no `model_instructions_file`. Esa clave REPLACES la base más rápido que añadir a ella, por lo que el cableado **+** eliminaría el propio Codex instrucciones la primera vez que guardó una capa. Si la sustitución del indicador base es lo que quieres, eso es lo que [Variantes de prompt base](#base-prompt-variants) es por — una decisión separada, con nombre en lugar de un efecto secundario de agregar una capa.
:::

Las capas personalizadas se numeran entre sí porque están unidas en una sola capa. sección en ese orden — no se entrelazan con las capas incorporadas.

Reordenar con las flechas en la fila, o con `Alt` + `Up` / `Alt` + `Down` Desde en cualquier lugar de la fila. El orden es el orden de composición.

El panel muestra el tamaño combinado de las capas habilitadas contra los 128 KiB. límite para `developer_instructions`, y una vista previa plegable de la texto — una capa que empujaría la sección sobre el límite es visible antes de salvar, no después.

Eliminar una capa pide primero, luego ofrece **Deshacer** durante unos segundos. La capa vuelve a su posición anterior, por lo que una lista sensible al orden sobrevive al desliz.

<a id="presets"></a>

### Preconfiguración

**+ Añadir capa** ofrece cinco puntos de partida: salida concisa, plan antes de editar, explicar el razonamiento, probar primero y respuestas coreanas. Cada uno abre el editor ordinario precargado y totalmente editable — un preajuste es un punto de partida, y lo que se guarda es una capa personalizada ordinaria.

Los preconfiguración son nuestro propio texto, escrito para destilar un enfoque en lugar de copiarlo. El prontitud de cualquiera. Cada uno nombra su fuente.

<a id="moving-between-layers-while-editing"></a>

### Moverse entre capas mientras se edita

El editor tiene controles previos/siguientes y un indicador de posición. Las ediciones no guardadas se mantienen mientras te mueves, por lo que puedes comparar dos capas a mitad de edición y volver sin Perder lo que escribes. El cierre con ediciones en otra capa pregunta antes de descartarlas. Guardar una capa también pregunta antes descartando ediciones aparcadas en otras capas; la confirmación **Guardar** el botón guarda solo la capa que se muestra.

<a id="compatibility-warnings"></a>

### Advertencias de compatibilidad

El editor advierte cuando una capa dice algo que no funcionará como está escrito. —
reivindicar una identidad diferente, nombrar una herramienta que el registro define, usar marcadores de posición de plantilla nada se expande o declarar hechos del entorno Codex También marca las credenciales pegadas (un API en una capa se envía al modelo en texto plano en cada solicitud), fraseo que le dice al modelo que deje caer sus instrucciones anteriores, y unaCodex identidad reclamada en coreano.

Estas son advertencias y nunca bloquean un salvamento. Si quieres anular Codex, puedes; La advertencia sólo hace que sea una decisión en lugar de un accidente.

<a id="commit-attribution"></a>

## Comprometer la atribución

Los **Comprometer la atribución** El modelo debe añadir un `Co-authored-by: Codex`
Se escribe un trailer y se `Generated with Codex.` línea a pull lo solicita abre.

No hay ningún interruptor para ello aquí, y ninguno bajo `[features]` o bien: Codex lo resuelve de la política de atribución de su cuenta. Desactivarlo en el nivel de cuenta no eliminar la capa — Codex envía el **opuesto** instrucción en su lugar, diciéndole al modelo No añadir el trailer. De cualquier manera se envía algo, por lo que la fila aparece en la lista. según lo establecido por su cuenta en lugar de como siempre.

<a id="base-prompt-variants"></a>

## Variantes de prompt base

El indicador base es la capa que no se puede desactivar, porque un modelo sin base prompt no es un agente de trabajo. Usted puede **sustituto** Sin embargo, y el Encienda el **Instrucciones de base** La fila es lo que hace eso.

Abra la fila para ver el selector. Muévete entre las opciones deslizando hacia los lados, con el teclas de flecha izquierda y derecha, o con los botones de flecha — los botones son también lo que un El lector de pantalla anuncia, por lo que la página permanece operativa sin un panel táctil.

| Opción | Qué es | Editable |
|---|---|---|
| Prompt base propia de Codex | `model_instructions_file` está ausente de su configuración | nunca |
| Su variante | un mensaje que escriba, almacenado en `~/.codex/opencodex-prompt-base/` | sí |
| Una segunda variante | Lo mismo, hasta dos | sí |

La primera opción no tiene nada que editar y no **Guardar** botón, y el diálogo dice por qué en lugar de mostrar controles atenuados. El valor predeterminado no es una copia del mensaje de Codex que almacenamos — es el **ausencia** de la llave. No hay texto que cambiar y No se puede eliminar, y elegirlo simplemente elimina `model_instructions_file` Desde su configuración de nuevo.

:::caution
Una variante **sustituye** Instrucciones base de Codex en lugar de añadir a ellos. A La variante de tres líneas le da un modelo con tres líneas de instrucciones: ninguna herramienta disciplina, sin hábitos de verificación, nada de lo que Codex normalmente trae. Si quieres a *añadir* Guía, utiliza un [capa personalizada](#custom-layers) en su lugar, — son aditivos.
:::

El editor de variantes tiene las mismas barandas que el editor de capas personalizado: unsaved las ediciones se mantienen mientras se mueve entre las opciones, cerrando con descartándolos, y el cuerpo se cuenta contra el límite de 64 KiB por variante mientras escribes.

<a id="if-something-else-already-replaced-your-base-prompt"></a>

### Si algo más ya ha reemplazado a su prompt base

Si `model_instructions_file` opencodex no escribió, el selector Se niega a actuar y dice dónde están los puntos clave. No reorientará silenciosamente una clave usted u otro conjunto de herramientas.

Sin embargo, no tienes que aclararlo a mano. **Importarlo como variante** convierte el archivo: la vista previa muestra el *exacto* texto que se instalará — a `# `
línea de encabezado que contiene el título de la variante, luego el cuerpo del archivo con terminaciones de línea y pestañas normalizadas — y puede editar el título antes de confirmar. El cuerpo puede usar como máximo 64 KiB después de la normalización (`bodyBytes` en la vista previa); el archivo completo en el disco, encabezado incluido, es un poco más grande (`serializedBytes`) La confirmación está vinculada al texto previsualizado por un hash, por lo que si el archivo — o su título elegido — cambiado en el medio, la importación se niega en lugar de instalar texto Nunca lo viste. Limpie la llave usted mismo en su lugar si prefiere comenzar desde el valor predeterminado.

Este es el mismo principio que la importación `developer_instructions`: los informes del panel lo que encuentra, y tú decides.

El cambio se aplica a las sesiones recién iniciadas, como cualquier otro cambio en esta página.

<a id="instructions-written-outside-opencodex"></a>

## Instrucciones escritas fuera de opencodex

Si `developer_instructions` ya existe y opencodex no lo escribió, el El panel no lo sobreescribirá. En su lugar, ofrece importar el texto como una capa: primero se ve el valor existente, y nada se escribe hasta que se confirme.

<a id="when-something-is-out-of-sync"></a>

## Cuando algo está fuera de sincronización

Si las capas guardadas y el valor en `config.toml` El panel lo dice así y ofertas **Reparar** en lugar de arreglarlo en silencio. Dos de las rutas de reparación reescribir texto que escribiste, para que se mantengan deliberados. Un escrito interrumpido ("journal present") ejecuta una operación bloqueada de recuperación utilizando las imágenes de archivo grabadas de la revista; no vuelve a guardar la lista de capas actual ni inventa contenido que falte. Si el archivos en vivo no coinciden con ninguno de los estados registrados, la recuperación se niega y conserva La evidencia. El panel actualizado informa de cualquier deriva restante. Donde una capa archivo ha desaparecido, la reparación escribe una copia de seguridad antes de tocar cualquier cosa.

<a id="when-changes-take-effect"></a>

## Cuando los cambios surtan efecto

Los cambios se aplican a las sesiones recién iniciadas. Una sesión ya en marcha mantiene la configuración rápida con la que comenzó.

<a id="keeping-the-skills-catalog-stable"></a>

## Mantener el catálogo de habilidades estable

El proxy por defecto `skills.catalog_refresh: "per_session"`: el primero
`<skills_instructions>` catálogo recibido para una conversación se reutiliza más tarde solicitudes en esa conversación. Esto mantiene el descubrimiento de habilidades y `SKILL.md` edits de cambiar esa parte del prefijo de caché de prompt ascendente a mitad de sesión. Una solicitud que lleve más de una `<skills_instructions>` El bloqueo se ha pasado sin cambios, y una solicitud que el proxy rechaza no establece el catálogo.

Para utilizar el catálogo suministrado por el cliente en cada turno, establezca esto en opencodex's
`$OPENCODEX_HOME/config.json` (normalmente `~/.opencodex/config.json`), luego reinicia El proxy:

```json
{
  "skills": {
    "catalog_refresh": "per_turn"
  }
}
```

Los valores soportados son `"per_session"` (predeterminado) y `"per_turn"`. Esto es un configuración de proxy, separada de Codex `skills.include_instructions` alternar. Las solicitudes sin una identidad de conversación confiable utilizan el catálogo proporcionado por el cliente. Las instantáneas se guardan en la memoria y no sobreviven a un reinicio proxy. Caducan después de cuatro horas de inactividad y pueden ser desalojados cuando el rellenos de caché. Un bloque de catálogo inicial mayor de 512 KiB se reenvía sin almacenamiento en caché. Después de la expiración o el desalojo, el siguiente catálogo recibido se convierte en la nueva instantánea. La vista previa del panel sigue leyendo los archivos actuales; no se muestra la instantánea conservada para una conversación en curso.

<a id="what-this-page-reads-and-what-it-does-not"></a>

## Lo que esta página lee y lo que no

opencodex lee un archivo de configuración — su `config.toml`. Codex resuelve su configuración de varias capas, por lo que un valor aquí es lo que dice el archivo YOUR, no necesariamente lo que Codex finalmente calcula.

<a id="the-keys-this-page-writes"></a>

## Las claves que escribe esta página

Estos viven en su Codex `config.toml`, no en la propia configuración de opencodex.

| Clave | Predeterminado | Capa |
|---|---|---|
| `include_permissions_instructions` | `true` | Permisos |
| `include_collaboration_mode_instructions` | `true` | Modo de colaboración |
| `include_environment_context` | `true` | Contexto ambiental |
| `include_apps_instructions` | `true` | Aplicaciones |
| `skills.include_instructions` | `true` | Habilidades |
| `developer_instructions` | unset | Sus capas personalizadas, unidas en orden |
| `model_instructions_file` | unset | Prompt base, cuando se selecciona una variante |

Las escrituras son ediciones de línea: tus comentarios y formato sobreviven, y una clave opencodex no reconoce que se le deja solo en lugar de eliminarlo.

Una clave ausente se lee como su valor predeterminado en lugar de como `false`. El panel muestra el valor que su archivo realmente contiene, y dice cuando una clave no está establecida.

Una fila que tiene un valor explícito también ofrece **Restablecer a <default>**, que elimina la línea clave en lugar de escribir el valor predeterminado. Ese es el único estado que sigue al valor predeterminado si Codex lo cambia más tarde — escritura
`key = true` congelaría el valor predeterminado de hoy como una anulación.

Este editor escalar rechaza arrays, tablas en línea y cadenas multilínea antes de escribir o restablecer una clave, preservando los bytes originales. Una importación informa explícitamente de una configuración ilegible. Las vistas previas de título de solo lectura mantienen el campo de título editable; la confirmación aún requiere una vista previa vinculada a ese título. Los fallos de HTTP o de medición de red se muestran como fallos en lugar de estar ocupada otra sonda.
