---
title: "Editor de perfiles de enrutamiento"
description: "Cree, edite, valide, ejecute en seco y elimine perfiles de directivas de enrutamiento del panel de control de OpenCodex."
---

Los **Modelos → Enrutamiento** pestaña en el panel de control OpenCodex puede administrar `config.routingProfiles` Sin edición `config.json` mano.

<a id="create-a-profile"></a>

## Crear un perfil

1. Abrir **Enrutamiento** en el panel.
2. Seleccionar **Crear perfil**.
3. Introduzca un `id`. El modelo canónico es `policy/<id>`.
4. Agregue uno o más candidatos explícitos de proveedor/modelo.
5. Configurar requisitos opcionales, ponderaciones de puntuación, límites de costes (`maxEstimatedCostUsd`, opcional `onUnknownCost`), y el comportamiento de evidencia desconocida.
6. Guardar el perfil.

Los ID de perfil son inmutables después de la creación. Para usar un id diferente, cree un nuevo perfil y elimine el antiguo después de actualizar las llamadas.

<a id="validation-and-persistence"></a>

## Validación y persistencia

El panel de control envía el mismo objeto de perfil utilizado por `config.routingProfiles` a la administración API. El servidor valida el candidato completo antes de escribirlo:

- ids y alias deben seguir las reglas de nombres y colisiones del perfil de enrutamiento;
- todos los proveedores candidatos deben existir y estar habilitados;
- Los candidatos duplicados son rechazados.
- Los límites y requisitos numéricos deben permanecer dentro de sus rangos admitidos; y
- al menos un peso de optimización debe ser positivo.

Un guardado exitoso mantiene el perfil a través del escritor de configuración normal, reconcilia el estado en vivo y actualiza el catálogo de modelos. Los errores de validación dejan la configuración anterior sin cambios y se muestran en el editor.

Cuando `limits.maxEstimatedCostUsd` está configurado, `limits.onUnknownCost` por defecto a `"allow"`: una estimación de costos desconocida no obtiene un exclusión específica de la tapa, y sello de huellas de ruta-decisión en seco / en vivo
`cost.capOutcome: "unknown-allowed"` para que los operadores puedan decir que la tapa no fue probada. Establecer `"exclude"`
cuando el techo debe estar cerrado (`cost-limit-unknown`, con
`cost.capOutcome: "unknown-excluded"`) Configuración `onUnknownCost` solo es inerte y no emite un resultado de tapa. Esto es separado de
`unknownEvidence.cost`, que aún puede excluir o penalizar precios desconocidos independientemente de la Resultado del tope.

<a id="dry-run-a-saved-profile"></a>

## Ejecutar en seco un perfil guardado

Las capacidades candidatas usan la configuración efectiva del proveedor después del registro Se aplican las anulaciones. Requisitos de localidad (`localOnly` y `remoteAllowed`) Por lo tanto, utilice la dirección efectiva de origen. Si esa dirección no puede ser clasificada, El perfil de `unknownEvidence.capability` El establecimiento decide la elegibilidad. Una configuración de proveedor no válida que no se puede resolver siempre se excluye con
`route-unavailable`Incluso cuando se permiten capacidades desconocidas. Los proveedores desaparecidos o discapacitados también están excluidos con `route-unavailable` Antes de anotar.

Seleccione un perfil guardado y use **Evaluación en seco** para agregar evidencia de solicitud, como el tamaño de la ventana de contexto, el uso de herramientas, la entrada de imágenes o la salida estructurada. Dry-run evalúa la elegibilidad y la puntuación, pero nunca envía una solicitud de modelo ascendente.

Las ediciones no guardadas no son usadas por dry-run. Guarde primero el perfil para que la revisión y evaluación mostradas se refieran a la misma configuración.

<a id="management-api"></a>

## API de administración

El editor utiliza estos puntos finales:

- `GET /api/routing-profiles` Lista perfiles normalizados y revisiones.
- `PUT /api/routing-profiles` Crea o actualiza un perfil. Enviar `mode: "create"` o `mode: "update"`; create mode se niega a sobrescribir un id existente.
- `DELETE /api/routing-profiles?id=<id>` Elimina un perfil.
- `POST /api/routing-profiles/dry-run` Evalúa un perfil guardado sin enviar de origen.

Ejemplo de guardar carga útil:

```json
{
  "id": "fast",
  "mode": "create",
  "profile": {
    "alias": "ocx/fast",
    "candidates": [
      { "provider": "anthropic", "model": "claude-sonnet-5" },
      { "provider": "openai", "model": "gpt-5.6" }
    ],
    "require": { "tools": true, "minContextWindow": 128000 },
    "optimize": { "latency": 0.55, "health": 0.25, "cost": 0.1, "quota": 0.1 },
    "limits": { "maxEstimatedCostUsd": 0.5, "onUnknownCost": "allow" },
    "unknownEvidence": {
      "capability": "exclude",
      "health": "penalize",
      "quota": "penalize",
      "cost": "penalize"
    }
  }
}
```
