---
title: "Cómo contribuir"
description: "Desarrolle opencodex — configuración, diseño, convenciones y cómo agregar un proveedor o adaptador."
---

<a id="setup"></a>

## Configuración

El desarrollo de la fuente requiere el `bun` CLI en su `PATH`. El paquete npm publicado incluye su propio El entorno de ejecución de Bun para los usuarios; los scripts de paquetes pueden resolver Bun a través de esa dependencia agrupada.

```bash
git clone https://github.com/lidge-jun/opencodex.git
cd opencodex
bun install
bun run setup:hooks  # retire the managed pre-push and post-merge hooks
bun run dev:proxy    # proxy API in dev mode
bun run dev:gui      # dashboard dev server (another terminal)
bun run typecheck    # bun x tsc --noEmit
bun run test        # full suite (default)
```

`bun run setup:hooks` elimina un administrador retirado no modificado `pre-push` o `post-merge`
gancho, conservando ganchos personalizados. Ya no se requiere un gancho de pre-empuje.
`bun run prepush` sigue siendo una verificación manual opcional.

`bun run dev` Sigue siendo un alias para `bun run dev:proxy`. El servidor de desarrollo del dashboard es `bun run dev:gui`; el panel de instrumentos empaquetado en `GET /` Es producido por `bun run build:gui` (`gui/dist`).

Los jubilados `post-merge` gancho utilizado para reconstruir `gui/dist` Después de cada fusión. con el anzuelo fuera, una fusión que cambia `gui/` deja el panel de instrumentos empaquetado rancio hasta que se ejecuta `bun run build:gui`
— el servidor de desarrollo no se ve afectado porque se reconstruye bajo demanda.

<a id="build-and-test-commands"></a>

## Construir y probar comandos

El paquete raíz es Bun-Native TypeScript; no hay un paso de compilación del servidor separado. Usar el check-in scripts para que los comandos locales coincidan con CI:

```bash
bun run typecheck                 # strict TypeScript check
bun run test:changed              # import-graph tests against the resolved dev merge base
bun run test                      # full suite (default)
bun test tests/routing/router.test.ts     # focused test file
bun run build:gui                 # Vite GUI build + package preparation
bun run privacy:scan              # credential/privacy scan used by CI
bun run prepare:package           # refresh package launchers/assets
```

La suite utiliza Bun 1.4.3 (`package.json`'s `testRunnerBun`) mientras que el entorno de ejecución enviado es 1.4.2.
`scripts/test.ts` encuentra un binario 1.4.3 en PATH o en `~/.bun/bin`, o usos `OCX_TEST_RUNNER_BUN`. Instale esa versión localmente si falta; el solucionador nunca la descarga.

Ejecuta `bun run test` por defecto. Si una ejecución completa es desproporcionadamente costosa para el tamaño de la tarea, recursos de máquina disponibles, o árboles de trabajo concurrentes, al menos debe ejecutar pruebas de regresión enfocadas que ejercen el comportamiento cambiado, como `bun test tests/<domain>/<name>.test.ts`. Explique la razón para reducir la ejecución e informar los comandos exactos, los resultados y el alcance no probado.
`bun run test:changed` puede complementar esta cobertura, pero no puede detectar cada dependencia indirecta. Ni confiar solo en CI ni saltarse las pruebas locales es una exención general. Antes de fusionarse, todos Los controles de CI requeridos deben pasar por el jefe de PR actual exacto.

`test:changed` selecciona la primera comparación ref que existe, en orden: `upstream/dev`,
`origin/dev`Entonces local `dev`. Se informa que ref y el exacto `git merge-base HEAD <ref>`
commit, luego pasa la base de fusión SHA a Bun.

Si un carril de prueba se agota, el corredor imprime el stdout y el stderr que ya ha capturado y sale con el código 124. Después de que un proceso sale, las tuberías capturadas tienen un límite de drenaje de un segundo para que un descendiente que sostiene una tubería abierta no pueda detener el corredor. La captura incompleta se informa explícitamente y no cuenta como una ejecución exitosa. incluso si el hijo directo salió con el código 0.

Las pruebas son pruebas Bun en directorios de dominio que reflejan `src/`: `tests/server/`, `tests/providers/`,
`tests/adapters/openai/`, `tests/cli/` Y así sucesivamente. `scripts/test-layout/layout.json` es el mapa y `tests/test-layout.test.ts` lo impone, por lo que una nueva prueba entra en su directorio de dominios y una entrada en el mapa (la prueba de herramientas le indica cuál falta). `tests/helpers/` bodegas Compartimos los accesorios y `tests/helpers/repo-root.ts` es cómo una prueba llega a los archivos de repositorio;
`tests/e2e-style/` tiene escenarios de paridad nativa más amplios. Mantenga una regresión enfocada cerca de la pruebas existentes para el subsistema que cambia (`bun test tests/<domain>` ejecuta un subsistema).

El sitio de documentos en el que estás leyendo vive `docs-site/` (Astro + Starlight):

```bash
cd docs-site && bun install && bun dev
```

<a id="docs-publishing"></a>

## Publicación de documentos

Los documentos públicos publican en páginas GitHub en <https://opencodex.me/es/>. Los
`.github/workflows/deploy-docs.yml` flujo de trabajo se ejecuta en `main` empuja ese toque `docs-site/**` o el flujo de trabajo en sí, construye `docs-site`, y despliega el sitio generado. Antes de impulsar los cambios en los documentos, Ejecutar:

```bash
cd docs-site
bun install --frozen-lockfile
bun run build
```

<a id="ci-and-releases"></a>

## CI y liberaciones

GitHub Las acciones intencionadamente se mantienen pequeñas:

- **CI multiplataforma** (`.github/workflows/ci.yml`) se ejecuta en las solicitudes de extracción y `main` empuja que toque los archivos de entorno de ejecución, pruebas, paquetes, secuencias de comandos, TypeScript o flujos de trabajo. Su matriz Bun cubre Linux, Windows y macOS con instalación, comprobación de tipo, pruebas, análisis de privacidad, una versión de ayuda a la construcción de humo, GUI Construir, y `ocx help`. Un segundo carril de tres sistemas operativos demuestra que la instalación global npm funciona sin una instalación separada instalado Bun utilizando el entorno de ejecución incluido del paquete.
- **Liberación** (`.github/workflows/release.yml`) es manual. No actúa como un segundo CI completo pipeline; antes de que se ejecute en seco o publicarlo requiere el commit de liberación exacto (`GITHUB_SHA`) a ya tener una ejecución exitosa de CI multiplataforma.
- **Stale needs-info** (`.github/workflows/stale-needs-info.yml`) se ejecuta diariamente en la rama predeterminada. Temas abiertos etiquetados `needs-info` sin actividad durante 14 días recibe una advertencia; después de 7 más inactivo Los días se cierran como no estaba previsto. Cualquier actualización borra la advertencia rancia. Para mantener abierto el trabajo de larga duración, eliminar `needs-info` (Por ejemplo, cuando se trata de promover un `roadmap`).
- **Calidad de la emisión** (`.github/workflows/enforce-issue-quality.yml`) valida la estructura de la plantilla en nuevos y editados, aplica etiquetas amables (`bug`, `enhancement`, `provider-compatibility`,
  `documentation`), y añade ortogonal **área** etiquetas del formulario Campo de área más luz Título/Heurística resumen: `provider`, `account-pool`, `catalog`, `gui`, `cli`, `proxy`,
  `platform`, `streaming`, `tools`, `install`, y `service`. Las etiquetas tipo/proceso permanecen separadas puede filtrar `bug` + `account-pool` sin romper esos ejes. Prefiero el menú desplegable Área sobre inventar etiquetas por proveedor. Área: La documentación no agrega una segunda etiqueta de área (los documentos ya forman semillas `documentation`) Los mantenedores pueden volver a aplicar etiquetas de área a todos los problemas abiertos con workflow_dispatch `backfill_open_areas` después de que el flujo de trabajo esté en la rama predeterminada.

Utilice el ayudante para las versiones:


Antes de ejecutar el ayudante, elija la versión de lanzamiento prevista y envíe
`.github/workflows/dev-version-bump.yml` de la rama por defecto con
`intended-version=<version>` y `mode=pre-move`. Revisar y fusionar las PR que abre en `dev`, luego promover a `main` o `preview` y correr el ayudante. Si `dev` ya supera la versión prevista, los informes de flujo de trabajo `changed=false` y no hay bump PR es necesario. Publicar todavía requiere un CI exitoso en el compromiso de lanzamiento exacto.

```bash
bun run release <version>           # commits/pushes the bump; publish workflow is dry-run by default
bun run release --bump minor        # derive the next patch, minor, or major version from tags and npm channels
bun run release <version> --publish # publish after the CI-gated dry run is understood
bun run release:watch               # watch the newest Release workflow run
```

`--bump patch|minor|major` es una alternativa a una versión explícita. Una vez que se abre una etiqueta de vista previa núcleo de la versión superior, `--bump patch` se niega a continuar con la línea de parches estable más antigua; enviar esa solución en el núcleo de vista previa abierta.

<a id="branches"></a>

## Ramas

- `dev` — el único objetivo de integración. Abre tu solicitud de extracción aquí.
- `main` — solo versiones. Se mueve por la promoción controlada por el mantenedor de
  `dev`; no abra las solicitudes de extracción de características en su contra.
- `preview` — el tren de prelanzamiento.

Los `dev2-go` línea que llevaba el puerto nativo de Go ha sido retirada, y la política de transporte dual-track con él. Su historia se publica de solo lectura en
[lidge-jun/opencodex-go-archive](https://github.com/lidge-jun/opencodex-go-archive). Bun-nativo TypeScript encendido `dev` es la única línea de entorno de ejecución.

Las solicitudes de extracción de rebase son bienvenidas. Traer una rama rancia a la cabeza actual es contribución normal en lugar de ruido — nota la fuente confirma en el descripción.

<a id="pull-requests"></a>

## Solicitudes de tirón

- Objetivo **`dev`**. No abra la función ni fije las solicitudes de extracción en **`main`**.
- Rama de la corriente **`dev`** Propina, no de **`main`**. El requerido **`enforce-target`** cheque rechaza cabezas cuya base de fusión se encuentra en el **`main`** tip mientras la rama está muy por detrás de la base de solicitud de extracción (el modo de fallo visto en #644).
- Escribe una descripción real: a **Resumen** de lo que cambió y por qué, más un **Plan de ensayo** (o sustancia equivalente). Cuerpos vacíos, texto solo para marcadores de posición y descripciones que usan escape `\n` en lugar de roturas de línea reales fallar el cheque.
- Si la solicitud de extracción cambia los archivos bajo `gui/`, incluir una captura de pantalla del cambio de interfaz de usuario en la descripción; el `enforce-target` comprobar las repeticiones en las ediciones de descripción hasta que la captura de pantalla esté presente. Arrastre la imagen al editor de descripciones en lugar de cometerlo: una imagen en su rama monta el squash se fusiona en `dev`. Los mantenedores que suben desde la línea de comandos usan el `pr-assets` ramificación y enlace por SHA de confirmación.
- Cambios en el flujo de trabajo en este uso del repositorio **`pull_request_target`**. La lógica de aplicación actualizada se aplica solo después de que el flujo de trabajo se promocione a la rama predeterminada del repositorio —, la misma advertencia operativa documentada en #631.

<a id="project-maintainers"></a>

## Mantenedores de proyectos

Los mantenedores actuales, sus responsabilidades y la política de revisión y fusión están documentados en
[`MAINTAINERS.md`](https://github.com/lidge-jun/opencodex/blob/main/MAINTAINERS.md). GitHub revisión La propiedad del repositorio y las rutas sensibles a la seguridad se declaran en `.github/CODEOWNERS`.

Las solicitudes de extracción de contribuyentes normalmente necesitan la aprobación de un mantenedor. Un mantenedor actual con GitHub `maintain` o `admin` acceso puede integrar explícitamente un PR en `dev`, incluyendo sus propia, sin una segunda aprobación de mantenimiento. La decisión y la verificación exacta de la cabeza deben ser registrado; CI, revisión de seguridad y objeciones pendientes del mantenedor todavía se aplican. Esta excepción no cambia `main`/`preview` revisar las reglas o permitir empujes directos, forzar-empujes o eliminación.

<a id="conventions"></a>

## Convenios

- **Solo módulos ES** (`import`/`export`), TypeScript, `strict` modo. Conservar `bun x tsc --noEmit` Limpio.
- **~500 líneas por archivo máximo** — dividido por la responsabilidad (el `web-search/` y `vision/` Los sidecares son buenos ejemplos de módulos pequeños y enfocados detrás de un `index.ts`).
- **Manejar errores asincrónicos en los límites** Los sidecar — nunca se lanzan a la ruta de la solicitud; se degradan a Un marcador elegante.
- **Estructura SOT** — invariantes mantenedores actuales viven en `structure/`. Mantenga los flujos de trabajo de usuarios públicos en `docs-site/` y notas de planificación e investigación en `devlog/`.
- **Preservar las exportaciones** — otros módulos pueden depender de ellos.

<a id="adding-a-provider-to-the-catalog"></a>

## Agregar un proveedor al catálogo

Todos los recolectores y semillas de proveedores se derivan del registro canónico (`src/providers/registry/entries-extended.ts`):

```ts
{
  id: "my-provider",
  label: "My Provider",
  baseUrl: "https://api.example.com/v1",
  adapter: "openai-chat",
  authKind: "key",
  dashboardUrl: "https://example.com/keys",
  models: ["model-a", "model-b"],
  defaultModel: "model-a",
  noVisionModels: ["model-a"],   // text-only models → vision sidecar describes images
},
```

`src/providers/derive.ts` alimenta esa entrada en `ocx init`, `ocx provider`, configuración preestablecidos de panel, API clave de inicio de sesión y OAuth config semillas. `enrichProviderFromCatalog()` copia metadatos de modelo y las clasificaciones de capacidad en la configuración del proveedor guardado. Implementaciones de protocolo OAuth todavía vivir en `src/oauth/`; los metadatos del registro por sí solos no son un flujo OAuth.

<a id="evidence-required-for-a-canonical-preset"></a>

### Evidencia requerida para un preajuste canónico

Una entrada de registro es una promesa mantenida: opencodex envía el destino que la clave API de un usuario es enviado a. Por lo tanto, un preajuste necesita evidencia de fuente primaria, no una ruta de código de trabajo. Solicitudes de tirón que añadir o promover un proveedor debe proporcionar todo lo siguiente en la descripción:

- **Los puntos finales documentados compatibles con OpenAI.** Vincule la referencia API del proveedor para el chat Cuando la entrada se establece `liveModels: true`, por su modelo-descubrimiento autenticado punto final (típicamente `GET /v1/models`) A Pasar la prueba de accesorios no es un sustituto: demuestra nuestra forma de código, no el contrato anterior.
- **Términos de servicio y la entidad legal operativa.** Una página legal vacía o de marcador de posición no establecer quién ejecuta el punto final o bajo qué términos se maneja el tráfico de usuario.
- **Autorización de reventa o enrutamiento para agregadores.** Una puerta de enlace que vende acceso a Claude, GPT, Gemini, u otros modelos de terceros deben mostrar su autorización para enrutar a ellos. Los usuarios leen a preconfigurado como una ruta mantenida, no como un revendedor no verificado.
- **Un propietario de mantenimiento nombrado.** Indicar quién actualiza el ajuste preestablecido cuando la base URL, autenticación o cambios en el contrato del catálogo y cómo se informará de una ruptura.
- **Una fecha de verificación citable.** Registrar la fuente primaria y la fecha en que se verificó, el mismo vía `lastVerified` trabaja en `src/providers/free-directory.ts`. Una fecha en una fila no verificada afirma procedencia que nadie produjo.

Los colaboradores que agreguen su propio servicio son bienvenidos, y varios configuración preestablecidos actuales llegaron de esa manera. Divulgar la afiliación en la descripción de la solicitud pull-request para que los revisores puedan sopesarla; no es una razón para el rechazo, y tampoco baja la barra de evidencia.

Cuando la evidencia es incompleta, el hogar honesto es una fila de referencia en
`src/providers/free-directory.ts` en lugar del registro canónico. Las filas del directorio llevan un explícito `verification` grado (`official`, `primary`, `unverified`) y son inertes: los usuarios pueden llegar al servicio a través del flujo personalizado compatible con OpenAI, mientras que opencodex evita no puede estar detrás. Promocionar la fila al registro una vez que exista la evidencia anterior.

<a id="adding-an-adapter"></a>

## Añadir un adaptador

Implementar `ProviderAdapter` (ver [Adaptadores](/es/reference/adapters/)) `src/adapters/`, Registrar su fábrica en `src/adapters/registry.ts`, y puentear su salida a la interna
`AdapterEvent`s. `src/server/adapter-resolve.ts` selecciona el protocolo efectivo antes de delegar al registro. Reutilización `image.ts` para el manejo de imágenes y seguir `openai-chat.ts` por ordinario llamadas de herramienta/transmisión; uso `fetchResponse` solo cuando el adaptador posee reintentos de transporte, o `runTurn`
para un transporte verdaderamente bidireccional como Cursor. Añadir pruebas enfocadas bajo `tests/` y exportación La fábrica de `src/index.ts` cuando pertenece al paquete público API.

<a id="adding-a-compatibility-claim"></a>

### Añadir una reclamación de compatibilidad

Las reclamaciones de compatibilidad viven bajo `src/compatibility/`. Un reclamo es más estrecho que un adaptador: nombra el proveedor exacto, la base normalizada de subida URL, el modo de autenticación, el protocolo entrante, la subida protocolo, y modelos de identificación cuyo comportamiento fue probado. No copie una reclamación a cada proveedor que utilice el mismo adaptador o a otro destino utilizando el mismo formato del protocolo.

Utilice una de las disposiciones versionadas: `passthrough`, `translated`, `degraded`, o `unsupported`. Cada reclamo sin paso debe indicar su limitación, y cada reclamo respaldado por accesorios debe nombrar el ids de afirmación exacta que lo prueban. Añadir el vector de solicitud libre de secretos bajo
`tests/fixtures/compatibility/` y ejecutarlo contra el adaptador de producción en una prueba enfocada. A `passthrough` Reclamar sólo puede citar `equals` aserciones cuyo valor esperado es el propio valor en el mismo lugar, en un selector vinculado a esa característica en la prueba de manifiesto, reescrito, o el campo no relacionado no puede ser etiquetado como sin pérdida. Manténgase relacionado Aspectos como reclamaciones separadas cuando una ruta puede preservar una y perder la otra, como una herramienta personalizada. y su gramática. Los manifiestos de compatibilidad son datos pasivos: el enrutador ordinario, el controlador Responses y el servidor La ruta de inicio no debe importar el catálogo del manifiesto ni activar Compatibility Lab.

<a id="verify-before-you-claim-done"></a>

## Verifica antes de reclamar hecho

Siga la política de pruebas anterior y ejecute `bun run typecheck` para cambios de tipo, más los cheques necesarias para la superficie afectada. Informar los comandos, resultados y alcance restante no probado; solo reclama la validación que realmente has completado.
