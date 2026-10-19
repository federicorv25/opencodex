---
title: "Registro de gastos rechazado en una carpeta sincronizada"
description: "¿Por qué las solicitudes pueden fallar con \"El almacenamiento de Spend-ledger no se pudo abrir de forma segura\" cuando el directorio de estado opencodex está dentro de iCloud Drive u otra carpeta sincronizada, y cómo solucionarlo."
---

Los rechazos de almacenamiento de gasto devuelven HTTP 503 con tipo de error `server_error` y el código
`spend_ledger_storage_unavailable`. Este es un problema de almacenamiento local; no cuenta con proveedor o cuenta de salud. Los registros de solicitud lo atribuyen como `local-refusal`. Una respuesta de streaming ya lleva el mismo código en su terminal evento de error. Otras solicitudes en la misma sesión pueden tener éxito si la condición del archivo es temporal.

Las compilaciones más antiguas informaron HTTP 502 con un prefijo engañoso "Provider inalcanzable". Construcción actual diga qué archivo y qué cheque lo rechazó, por ejemplo:

```text
Spend-ledger storage could not be opened safely (journal: extra-hard-link).
```

<a id="what-the-check-is"></a>

## Cuál es el cheque

opencodex mantiene un libro mayor de gastos en su directorio de estado (`~/.opencodex` por defecto, o
`OPENCODEX_HOME`): un archivo de diario, `spend-ledger.jsonl`y una lima de sal, `spend-ledger.salt`. Antes de cada escritura, comprueba que cada archivo es un archivo regular de su propiedad, no es un archivo simbólico. enlace, y tiene exactamente una entrada de directorio. Un segundo enlace duro significaría otro nombre en otra parte. en el volumen puede ver o cambiar los mismos bytes, por lo que opencodex se niega en lugar de escribir - Sí. Este cheque se mantiene estricto a propósito.

| Condición en el mensaje | Significado |
| --- | --- |
| `extra-hard-link` | Otra entrada de directorio apunta en el mismo archivo. |
| `symbolic-link` | El archivo del libro mayor es un enlace simbólico. |
| `not-regular-file` | Algo más que un archivo regular se encuentra en la ruta del libro mayor. |
| `foreign-owner` | El archivo pertenece a un usuario diferente. |
| `invalid-salt` | El archivo de sal existe pero su contenido no es una sal válida. |

El papel en el mensaje es `journal`, `journal-compaction` (El archivo temporal escrito mientras el diario está compactado) o `salt`.

<a id="why-a-synced-folder-triggers-it"></a>

## ¿Por qué una carpeta sincronizada lo desencadena?

Servicios de sincronización macOS, incluida la unidad iCloud con "Carpetas de escritorio y documentos" activadas y Los clientes de proveedores de archivos, como OneDrive, Dropbox y Google Drive, pueden mantener brevemente un segundo enlace a un archivo mientras se escenifica o se carga un cambio. Si el directorio de estado está dentro de una carpeta de este tipo, el diario puede tener dos enlaces por un momento después de una escritura ordinaria. Una petición que aterriza en Ese momento es rechazado, y el siguiente puede tener éxito. Una vez que la sincronización se establece, el archivo vuelve a un enlace, por lo que inspeccionarlo después no muestra nada malo.

Al iniciar opencodex advierte cuando el directorio de estado se resuelve dentro de la unidad iCloud (`~/Library/Mobile Documents`), una carpeta de proveedor de archivos (`~/Library/CloudStorage`), Escritorio o Documentos mientras iCloud Desktop & Documents parece estar encendido, o Escritorio o Documentos mientras que Google Drive para escritorio parece estar en uso. La pista Google Drive es la presencia de `~/Library/CloudStorage/GoogleDrive-*` o `~/Library/Application Support/Google/DriveFS`. No lee qué carpetas se le dijo a la aplicación que sincronizara, por lo que Drive que se está instalando puede advertir Incluso cuando no se seleccionan documentos. La advertencia es de asesoramiento. La detección lee la carpeta diseño y puede estar equivocado en cualquier dirección.

<a id="fix"></a>

## Arreglar

Mantenga el directorio de estado fuera de las carpetas sincronizadas. El valor predeterminado `~/.opencodex` No está sincronizado.

1. Detener opencodex.
2. Mueva o copie el directorio de estado a una ubicación no sincronizada, por ejemplo `~/.opencodex-trial`.
3. Establecer `OPENCODEX_HOME` a esa ubicación, o desconfigúrala para usar la predeterminada, e inicia opencodex De nuevo.

No borre el diario, relaje sus permisos o quite la verificación para que el error desaparezca. El diario contiene su gasto registrado, y el cheque es lo que evita que se escriba a través de él. Un enlace inesperado.

Si el mensaje nombra una condición distinta de `extra-hard-link`o el directorio de estado no está en una carpeta sincronizada, abra un problema con el mensaje de rechazo completo. No contiene ningún camino, cuenta o solicitar contenido.
