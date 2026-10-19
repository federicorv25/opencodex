---
title: "ChatGPT Maletín de servidor de aplicaciones de escritorio (experimental)"
description: "Un experimento opt-in macOS que reescribe los campos de puerta de cuota plana en el paquete de app-server stdout pipe."
---

Este experimento es **macOS solo y apagado por defecto**. Filtra el paquete ChatGPT app-server JSON -RPC stdout para abrir las puertas de cuota plana conocidas. No aumenta la cuota de una cuenta ni hace que un servicio upstream acepte una solicitud que rechaza.

Habilitelo en su OpenCodex `config.json`:

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

`launch` crea un lanzador ejecutable bajo el directorio de configuración OpenCodex, cierra ChatGPT si se está ejecutando y lo reinicia con `open -a <bundle> --env CODEX_CLI_PATH=<launcher>`. La aplicación se encuentra por su identificador de paquete, `com.openai.codex`, por lo que una instalación en `~/Applications` o en otro volumen funciona, y otra aplicación que comparte el nombre " ChatGPT " nunca se cierra o se abre. Guarde primero el trabajo en curso: esto reinicia la aplicación. No requiere un proxy OpenCodex en ejecución.

Para quitar el lanzador y reiniciar sin la anulación:

```bash
ocx chatgpt restore
```

Restaurar deja el indicador de configuración configurado. Establezca `chatgptDesktop.appServerShim` en `false` o retírelo para desactivar futuros lanzamientos de shim explícitos. Los lanzamientos normales desde Dock o Spotlight no aplican la shim automáticamente.

Si ChatGPT no está instalado (no se encuentra el paquete `com.openai.codex`), `restore` solo elimina el lanzador: no puede relanzar nada y sale con un error.

<a id="rewrite-boundary"></a>

## Reescribir límite

Sólo `account/rateLimits/updated` notificaciones y respuestas cuyo resultado de nivel superior contiene `rateLimits`, `rateLimitsByLimitId` o `ordinaryUsageAllowed` son elegibles. Los marcadores `rate_limit_reached` llanos se limpian; las banderas de la puerta de la cuota conocidas (`allowed`, `limit_reached` / `limitReached`, `ordinaryUsageAllowed`) se abren sólo con pruebas de la cuota llano (un tipo alcanzado llano despejado o una ventana en el 100%). Una bandera cerrada por una razón por la cual la carga útil no se muestra permanece cerrada. Espacio de trabajo, crédito, tipo de alcance desconocido y restricciones de control de gasto mantienen la puerta de uso cerrada.

El uso mostrado permanece honesto: los porcentajes, los tiempos de reinicio, las duraciones de las ventanas, la información del plan y otros campos de visualización permanecen como se recibieron. Los mensajes JSON -RPC no relacionados, la salida de la herramienta anidada, los metadatos de bloque de envío de conversación y las líneas mal formadas pasan. Solo las líneas cambiadas se serializan de nuevo; otros bytes conservan su codificación original y terminaciones de línea. Stdin, stderr y el estado de salida del binario real mantienen su conexión directa con la aplicación.

<a id="executable-and-environment-security"></a>

## Ejecutable y seguridad del entorno

El lanzador generado tiene el modo `0755` e incrusta el ejecutable actual OpenCodex y, para las instalaciones de origen, la ruta de entrada CLI. `CODEX_CLI_PATH` le dice a ChatGPT que ejecute este lanzador en lugar de su binario incluido directamente. Mantenga el iniciador, su directorio de configuración y la instalación OpenCodex bajo su control: cambiar estas rutas ejecutables cambia el código de la aplicación se ejecuta. El lanzador todavía `exec` s el binario incluido del paquete descubierto; si ese paquete no tiene binario de aplicación-servidor, `launch` se niega en lugar de escribir un lanzador.

Antes de escribir el lanzador, `launch` también comprueba que el paquete y su aplicación-servidor binario son propiedad de usted o root, no son escribibles por grupo u otros, y pasan estricta verificación de firma de código bajo OpenAI 's ID de equipo (`2DC432GLL2`). Se rechaza un paquete que falla en cualquiera de estos cheques, incluido uno propiedad de otra cuenta. El archivo lanzador se escribe en un archivo temporal y se le cambia el nombre en su lugar; un enlace simbólico existente en esa ruta se reemplaza, no se sigue.

`restore` aplica la misma propiedad, permisos y comprobaciones de firma al paquete y su ejecutable de aplicación principal antes de cerrarlo o abrirlo. Funciona con la bandera experimental apagada y sin un binario de aplicación-servidor incluido. Si la verificación de confianza o el relanzamiento fallan, el lanzador existente se mantiene para la recuperación.

Ambos comandos también comprueban las carpetas que contienen el paquete hasta la raíz del sistema de archivos. Carpetas propiedad de otra cuenta, enlaces simbólicos, y los padres ordinarios de grupo o del mundo-escribible son rechazados. Las carpetas de instalación del grupo de administradores propiedad de Root y las carpetas adhesivas de confianza conservan su comportamiento normal de permisos. Se trata de comprobaciones de propiedad, permiso POSIX y firma; no se ha verificado el comportamiento nativo de ACL y política de propiedad de volumen.

Esta integración no instala ningún certificado, oyente de red, PAC u observador de fondo. No registra los mensajes o el entorno de la aplicación. El estado informa si el proceso de paquete en ejecución ChatGPT lleva la anulación del lanzador esperada.

Si falla la detección de aplicaciones o la inspección de procesos, `status` informa `unknown` en lugar de `not running`. `launch` y `restore` se niegan a reabrir una aplicación cuya salida no puede ser confirmada; la restauración mantiene el lanzador. Resuelva el error de inspección y vuelva a intentarlo. Lance las comprobaciones antes de escribir su lanzador, pero una inspección posterior aún puede fallar después de esa actualización atómica; los comandos no garantizan una transacción de reinicio de todo o nada.

<a id="failure-behavior-and-known-limits"></a>

## Comportamiento de fracaso y límites conocidos

Cuando la plataforma no es macOS, falta el entorno de ejecución OpenCodex, o falla la autoprueba del filtro, el lanzador ejecuta el binario original con stdout intacto. Un binario de aplicación-servidor incluido que falta es la excepción: no hay nada a lo que recurrir, por lo que el lanzador sale con un error (ver a continuación). Un filtro que pasa la autoprueba y luego muere a mitad de sesión cierra la tubería. Lo que hace el servidor de aplicaciones incluido después de eso no se ha verificado; puede obtener SIGPIPE o un error de escritura y ser reenviado por Desktop a través del mismo lanzador. El modo de paso a través del filtro limita esto a un caso de salida/caída: una excepción de reescritura pasa su línea a través de ella, y un fallo inesperado de la máquina de reescritura cambia el flujo restante a bytes sin procesar.

El experimento depende de la ruta binaria incluida, la aplicación que honra `CODEX_CLI_PATH` y las formas actuales del campo RPC. Las actualizaciones pueden cambiar esto. Una instalación movida o eliminada OpenCodex falla el preflight del lanzador y ejecuta el binario original. Ejecute `ocx chatgpt launch` de nuevo después de reubicar la instalación. Si una actualización de la aplicación se mueve o elimina el binario app-server incluido, el iniciador no puede iniciarlo: imprime un mensaje con los nombres `ocx chatgpt launch` y `ocx chatgpt restore` en stderr y sale, y Desktop no puede iniciar su app-server hasta que ejecute uno de ellos. Una sola línea de salida de más de 8 MiB se pasa a través de sin analizar en lugar de almacenado en búfer.

Esta shim independiente no reescribe los metadatos de la conversación ni las llamadas de modelo de ruta. Otras puertas de aplicación o rechazos ascendentes aún pueden evitar el envío. Un lanzador conectado o una autoprueba de filtro que pasa no prueban que los datos de la puerta de la aplicación crucen esta tubería.

Las observaciones de los reporteros en [#6196](https://github.com/lidge-jun/opencodex/issues/6196) el 2 y 13 de octubre de 2026 describen un calzo adjunto con Send todavía deshabilitado al agotamiento natural de la cuota. En el escritorio 26.1007.30912 con OpenCodex 2.84.0, el reportero no observó mensajes RPC de límite de velocidad elegibles mientras que la puerta del renderizador usó un transporte de uso separado. Esta shim no puede reescribir datos que nunca llegan a su filtro stdout. Estos son informes de campo específicos de la compilación, no una nueva verificación en vivo o prueba de que cada compilación de escritorio utiliza el mismo transporte.

El comportamiento del compositor registrado restante permanece rastreado en 6196. El éxito anterior con una configuración combinada de shim / intercepción no establece la suficiencia de solo shim, y la intercepción cerrada e inmersa de 6365 libras no es un remedio enviado.
