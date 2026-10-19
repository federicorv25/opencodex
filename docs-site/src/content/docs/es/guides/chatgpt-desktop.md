---
title: "ChatGPT Maletín de servidor de aplicaciones de escritorio (experimental)"
description: "Un experimento opt-in macOS que reescribe los campos de puerta de cuota plana en el paquete de app-server stdout pipe."
---

Este experimento es **macOS solo y apagado por defecto**. Filtra el ChatGPT incluido app-server's JSON-RPC stdout para abrir las puertas de cuota plana conocidas. No aumenta la cuota de una cuenta o hacer que un servicio upstream acepte una solicitud que rechaza.

Habilitarlo en su OpenCodex `config.json`:

```json
{
  "chatgptDesktop": { "appServerShim": true }
}
```

Luego ejecuta:

```bash
ocx chatgpt launch
ocx chatgpt status
```

`launch` crea un lanzador ejecutable bajo el directorio de configuración OpenCodex, cierra ChatGPT si se está ejecutando y lo reinicia con
`open -a <bundle> --env CODEX_CLI_PATH=<launcher>`. La aplicación es encontrada por su paquete identificador, `com.openai.codex`Así que una instalación en `~/Applications` o en otro volumen funciona, y otra aplicación que comparte el nombre "ChatGPT" nunca abierto. Guarde el trabajo en curso primero: esto Reinicia la aplicación. No requiere un proxy OpenCodex en ejecución.

Para quitar el lanzador y reiniciar sin la anulación:

```bash
ocx chatgpt restore
```

Restaurar deja el indicador de configuración configurado. Establecer `chatgptDesktop.appServerShim`
a `false` o eliminarlo para desactivar futuros lanzamientos explícitos de shim. Lanzamientos normales de Dock o Spotlight no aplican la shim automáticamente.

Si ChatGPT no está instalado (no `com.openai.codex` Se encuentra el paquete), `restore`
solo elimina el lanzador: no puede relanzar nada y sale con un error.

<a id="rewrite-boundary"></a>

## Reescribir límite

Solo `account/rateLimits/updated` notificaciones y respuestas cuyo nivel superior El resultado contiene `rateLimits`, `rateLimitsByLimitId`, o `ordinaryUsageAllowed`
son elegibles. Llanura `rate_limit_reached` los marcadores se borran; puerta de cuota conocida banderas (`allowed`, `limit_reached` / `limitReached`, `ordinaryUsageAllowed`) son abierto solo con evidencia de cuota simple (un tipo alcanzado plano despejado o una ventana en 100 %). Una bandera cerrada por una razón por la que la carga útil no se muestra permanece cerrada. Espacio de trabajo, crédito, tipo alcanzado desconocido y control del gasto las restricciones mantienen la puerta de uso cerrada.

El uso mostrado sigue siendo honesto: porcentajes, tiempos de reinicio, duraciones de ventana, plan información y otros campos de visualización permanecen tal como se recibieron. No relacionado JSON-RPC mensajes, salida de herramienta anidada, metadatos de bloque de envío de conversación y malformado Las líneas pasan. Solo las líneas cambiadas se serializan de nuevo; otros bytes retienen su codificación original y terminaciones de línea. Stdin, stderr y el binario real El estado de salida mantiene su conexión directa con la aplicación.

<a id="executable-and-environment-security"></a>

## Ejecutable y seguridad del entorno

El lanzador generado tiene el modo `0755` e incrusta el ejecutable OpenCodex actual y, para las instalaciones de origen, la ruta de entrada CLI. `CODEX_CLI_PATH` le dice a ChatGPT ejecutar este lanzador en lugar de su binario incluido directamente. Mantenga el lanzador, su directorio de configuración y la instalación OpenCodex bajo su control: cambiar Estas rutas ejecutables cambian el código que ejecuta la aplicación. El lanzador aún `exec`s binario del paquete descubierto; si ese paquete no tiene binario app-server,
`launch` Se niega en lugar de escribir un lanzador.

Antes de escribir el launcher, `launch` También comprueba que el paquete y app-server binario son propiedad de usted o root, no son escribibles por grupo u otros, y pasar estricta verificación de firma de código bajo el ID de equipo de OpenAI (`2DC432GLL2`) Un paquete que falla cualquiera de estas comprobaciones es rechazado, incluyendo Una propiedad de otra cuenta. El archivo del lanzador es escrito en un archivo temporal y renombrado en su lugar; un enlace simbólico existente en Ese camino es reemplazado, no seguido.

`restore` aplica la misma propiedad, permisos y comprobaciones de firma a los bundle y su aplicación principal ejecutable antes de salir o abrirlo. Funciona con el indicador experimental apagado y sin un binario app-server incluido. Si la confianza Si falla la verificación o el relanzamiento, el lanzador existente se mantiene para su recuperación.

Ambos comandos también comprueban las carpetas que contienen el paquete hasta el sistema de archivos. raíz. Carpetas propiedad de otra cuenta, enlaces simbólicos y grupos ordinarios o Los padres que se escriben en el mundo son rechazados. Instalación del grupo de administradores propiedad de Root carpetas y carpetas adhesivas de confianza conservan su comportamiento normal de permisos. Estos son la propiedad, el permiso POSIX y los controles de firma; ACL nativo y No se ha verificado el comportamiento de la política de propiedad del volumen.

Esta integración instala ningún certificado, oyente de red, PAC o fondo Vigilante. No registra los mensajes o el entorno de la aplicación. Informes de situación si el proceso de paquete ChatGPT en ejecución lleva la anulación del lanzador esperada.

Si falla el descubrimiento de la aplicación o la inspección del proceso, `status` informes `unknown` más bien que `not running`. `launch` y `restore` Rechazar la reapertura de una aplicación cuya salida no se puede confirmar; la restauración mantiene el lanzador. Resolver el error de inspección y reintento. Lanzar comprobaciones antes de escribir su lanzador, pero una inspección posterior puede todavía fallan después de esa actualización atómica; los comandos no garantizan un todo o nada Reiniciar transacción.

<a id="failure-behavior-and-known-limits"></a>

## Comportamiento de fracaso y límites conocidos

Cuando la plataforma no es macOS, falta el entorno de ejecución OpenCodex, o el filtro auto-prueba falla, el lanzador ejecuta el binario original con stdout intacto. A El binario app-server faltante es la excepción: no hay nada que retroceder Para, por lo que el lanzador sale con un error (ver más abajo). Un filtro que pasa la autoprueba y luego muere a mitad de sesión cierra la tubería. Lo que hace el servidor de aplicaciones incluido después de eso no se ha verificado; puede obtener SIGPIPE o un error de escritura y Desktop lo reaparecerá a través del mismo lanzador. El modo passthrough del filtro limita esto a un caso de salida/caída: una excepción de reescritura pasa por su línea, y un fallo inesperado de la máquina de reescritura Resto de flujo a bytes en bruto.

El experimento depende de la ruta binaria incluida, la aplicación honrando
`CODEX_CLI_PATH`, y formas de campo RPC actuales. Las actualizaciones pueden cambiar esto. Un movimiento o la instalación OpenCodex eliminada falla el prevuelo del lanzador y ejecuta el Binario original. Correr `ocx chatgpt launch` Después de volver a colocar la instalación. Si una actualización de la aplicación mueve o elimina el binario app-server incluido, el Launcher no puede iniciarlo: imprime un mensaje con el nombre `ocx chatgpt launch` y
`ocx chatgpt restore` en stderr y exits, y Desktop no puede iniciar su app-server hasta que ejecutes uno de ellos. Una sola línea de salida más larga que 8 MiB es Pasado a través de sin analizar en lugar de tamponado.

Esta shim independiente no reescribe los metadatos de la conversación ni las llamadas al modelo de ruta. Otras puertas de aplicación o rechazos ascendentes aún pueden evitar el envío. Un lanzador adjunto o una autoprueba de filtro que pasa no prueba que los datos de la puerta de la aplicación crucen esta tubería.

Observaciones de los reporteros en [#6196](https://github.com/lidge-jun/opencodex/issues/6196)
el 2 y 13 de octubre de 2026 describen una shim adjunta con el envío todavía desactivado en agotamiento natural de las cuotas. En el escritorio 26.1007.30912 con OpenCodex 2.84.0, el reportero no observó ningún mensaje RPC de límite de velocidad elegible mientras la puerta del renderizador Utiliza un transporte de uso separado. Esta shim no puede reescribir datos que nunca llegan a su filtro stdout. Estos son informes de campo específicos de compilación, no un nuevo informe en vivo. verificación o prueba de que cada compilación de escritorio utiliza el mismo transporte.

El comportamiento del compositor registrado restante permanece rastreado en el número 6196. Éxito anterior con una configuración combinada de shim/interceptación no establece una sola shim Suficiencia, y la interceptación cerrada, sin mezcla de 6365 libras no es un remedio enviado.
