---
title: "Clientes MiniMax"
description: "Enrutar código MiniMax y comandos de texto MiniMax CLI a través de OpenCodex sin exponer las credenciales MiniMax."
---

MiniMax publica dos productos de línea de comandos diferentes. OpenCodex integra cada el límite del protocolo que realmente expone:

- **Código MiniMax** (`mcode`) es un agente de codificación con proveedores personalizados de Anthropic Messages.
- **MiniMax CLI** (`mmx`Es una plataforma multimodal CLI. Sólo su `text` El recurso habla el Anthropic compatible con API que OpenCodex puede enrutar.

<a id="minimax-code"></a>

## Código MiniMax

En la página Modelos OpenCodex, ambas regiones del Plan de codificación MiniMax anuncian la entrada de imagen para
`MiniMax-M3` y `MiniMax-M3.1-Flash-Preview`. Un combo **Imagen / multimodal** El interruptor es disponible solo cuando cada modelo seleccionado admite la entrada de imágenes. El interruptor controla la imagen archivos adjuntos; no permite la subida de vídeos.

Instale e inicie sesión en MiniMax Code utilizando primero las instrucciones de MiniMax. Entonces empieza OpenCodex y conectar la integración de archivos reversibles:

```bash
ocx start
ocx integration client enable --client mcode
ocx mcode
```

![MiniMax Code integration shown with isolated example data](/screenshots/minimax-code-integration.png)

La integración combina un bloque en `~/.minimax/config.yaml`:

```yaml
custom_provider:
  opencodex:
    name: OpenCodex
    kind: custom
    enabled: true
    api: anthropic-messages
    options:
      apiKey: opencodex-loopback
      baseURL: http://127.0.0.1:10100
      authMode: api-key
    models:
      anthropic/claude-opus-5:
        limit:
          context: 1000000
```

La lista de modelos generados, las ventanas de contexto y las escaleras de esfuerzo de razonamiento provienen de la ejecución OpenCodex catálogo. Las ventanas contextuales pueden incluir [Estimaciones de proveedores personalizados](/es/reference/configuration/providers/#context-windows-on-custom-providers)Si el catálogo no tiene ventana o escalera de esfuerzo, se omite el campo correspondiente. MCode mantiene el esfuerzo seleccionado actualmente en la sesión, por lo que OpenCodex exporta `effortOptions` sin sobreescribir esa selección. El bloque no escribe una clave real, no reemplaza
`defaultModel`, y no cambia su inicio de sesión MiniMax. En MCode, elija un modelo bajo
`custom_provider:opencodex/...`.

`ocx mcode` verifica que este proveedor apunta al proxy que se está ejecutando antes de lanza el cliente. Después de la habilitación única, `ocx sync` Renueva el bloque propietario cuando el puerto o las capacidades del catálogo cambian. La sincronización automática nunca crea un bloque sin dueño, recrea uno que eliminó, o sobrescribe un archivo que cambió después de que OpenCodex lo escribió; use el comando habilite cuando desee volver a conectarse intencionalmente. Deshabilitar o restaurar a través de el mismo sistema de integración auditado:

```bash
ocx integration client disable --client mcode
ocx integration client history --client mcode
ocx integration client restore --op <opId> [--confirm-drift]
```

`MINIMAX_DATA_DIR` y el legado `MAVIS_DATA_DIR` Son honrados. Las anulaciones relativas son se ha rechazado porque OpenCodex y MCode pueden iniciarse en diferentes directorios de trabajo.

## MiniMax CLI (`mmx`)

Instale el CLI oficial por separado:

```bash
npm install -g mmx-cli
mmx --version
```

Enrutar un comando de texto a través de OpenCodex mediante el envoltorio y un identificador de modelo OpenCodex:

```bash
ocx mmx text chat \
  --model anthropic/claude-opus-5 \
  --message "Explain this function"

ocx mmx --output json text chat \
  --model openai/gpt-5.6-sol \
  --message "Return a JSON summary"
```

Códigos duros MMX `/anthropic/v1/messages` debajo de su base API URL. El envoltorio comienza a puente temporal de loopback durante toda la vida del proceso hijo. Solo acepta POST solicitudes a esa ruta Messages y `/anthropic/v1/messages/count_tokens`, cartografiarlos a OpenCodex existente `/v1/messages` y `/v1/messages/count_tokens` Plano de datos mientras preservar los cuerpos de solicitud y los datos de consulta. Canonical OpenCodex solicitud de traducción, la contabilidad de uso y la autenticación configurada del proveedor descendente permanecen en efecto; Los proveedores reciben `x-api-key` o transporte de portador según su configuración. La transmisión conserva los eventos de mensajes y contenido Anthropic. Antes de salir, el puente elimina los encabezados de credenciales de admisión entrantes y fija el público
`opencodex-loopback` marcador de posición. Los recursos arbitrarios de Anthropic no se representan, y El puente nunca se expone más allá del bucle.

El wrapper también crea un `MMX_CONFIG_DIR` que contiene solo ese marcador de posición, luego lo borra después de `mmx` salidas. Tu `~/.mmx/config.json`, OAuth tokens y MiniMax La clave API nunca se carga ni copia.

Los siguientes límites son intencionales:

- Solo `text chat` y `text repl` se enrutan a través de OpenCodex.
- `--api-key`, `--base-url` y `--region` son rechazados por el envoltorio así llamador credenciales o selectores de destino no pueden entrar en conflicto con el puente aislado.
- El envoltorio es solo de bucle porque MMX no puede enviar el paquete dedicado de OpenCodex.
  `x-opencodex-api-key` cabecera de admisión para un enlace remoto.
- Ejecutar llano `mmx` por `image`, `video`, `speech`, `music`, `vision`, `search`, `quota`,
  `auth`, `config`, `file` y `update`; llaman a las API específicas de MiniMax que OpenCodex No emula.

`mmx` Por defecto, el modelo de texto `MiniMax-M3`. Pase `--model <provider/model>` cuando tu desea una ruta específica de OpenCodex; de lo contrario, las reglas de enrutamiento del modelo normal de OpenCodex deciden si el id predeterminado está disponible.
