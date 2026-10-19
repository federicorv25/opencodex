---
title: "Firma de código en Windows"
description: "Cómo OpenCodex firma sus binarios Windows a través de SignPath Foundation, cómo verificar una firma y la política de firma de código del proyecto."
---

OpenCodex está moviendo sus descargas de Windows, la versión independiente `ocx.exe` y el instalador de escritorio
`OpenCodex-<version>-windows-x64.msi`, a Authenticode firma de código a través
[Fundación SignPath](https://signpath.org). Un archivo firmado indica Windows, SmartScreen y antivirus productos que lo publicaron y que nadie lo cambió después de la compilación, que es lo que se detiene falsos positivos binarios no firmados como el reportado en
[#7207](https://github.com/lidge-jun/opencodex/issues/7207).

La firma se está extendiendo. El flujo de trabajo de liberación está cableado y SignPath lo está validando con una prueba Certificado. Hasta que se emita el certificado de producción, los archivos de versión Windows permanecen sin firmar y SmartScreen puede preguntar una vez (**Más info → Ejecutar de todos modos**) Releases publicados después de que el interruptor lleva Una firma de **Fundación SignPath**.

<a id="code-signing-policy"></a>

## Política de firma de código

Firma de código gratuito proporcionada por [SignPath.io](https://about.signpath.io/), certificado por
[Fundación SignPath](https://signpath.org/).

- Committers y revisores: [lidge-jun](https://github.com/lidge-jun)
- Aprobadores: [lidge-jun](https://github.com/lidge-jun)

Cada solicitud de firma para un lanzamiento se aprueba a mano en SignPath antes de que el certificado sea aprobado. utilizado. Solo se firman los binarios creados a partir del origen de este repositorio por GitHub Actions. Terceros archivos incluidos con una versión, como los complementos de llavero preconstruidos, mantienen su forma ascendente; el La política de la Fundación SignPath prohíbe firmarlos con el certificado del proyecto.

<a id="privacy"></a>

### Privacidad

Este programa no transferirá ninguna información a otros sistemas en red a menos que solicitado por el usuario o la persona que lo instala u opera. En la práctica, OpenCodex reenvía solicitudes a los proveedores que configure. Para buscar nuevas versiones también lee release metadatos de GitHub y el registro npm, y esas comprobaciones no llevan ninguna de sus indicaciones, credenciales o datos de uso.

<a id="verifying-a-download"></a>

## Verificar una descarga

En PowerShell, compruebe el archivo que descargó:

```powershell
Get-AuthenticodeSignature .\OpenCodex-<version>-windows-x64.msi | Format-List Status, SignerCertificate
Get-AuthenticodeSignature .\ocx.exe | Format-List Status, SignerCertificate
```

Informes de liberación firmados `Status : Valid` y un certificado de firma cuyos nombres de asunto
`SignPath Foundation`. En el Explorer, la misma información está bajo **Propiedades → Digital Firmas**. Cada archivo de lanzamiento también tiene un `.sha256` en la página de lanzamiento, que puede Comparar con `Get-FileHash <file> -Algorithm SHA256`.

<a id="what-gets-signed"></a>

## Lo que se firma

| Archivo | Contenido firmado |
|---|---|
| `ocx-<version>-bun-windows-x64.zip` | `ocx.exe` dentro del archivo. El zip y sus `.sha256` se construyen a partir del binario firmado. |
| `OpenCodex-<version>-windows-x64.msi` | El instalador, además de todos los `.exe` instala (la aplicación de escritorio y su paquete `ocx.exe`). |

La firma del actualizador de escritorio (`.msi.sig`) `latest.json` Producido a partir de la firma instalador, por lo que las actualizaciones dentro de la aplicación instalan los mismos bytes que ofrece la página de lanzamiento.

<a id="for-maintainers"></a>

## Para los mantenedores

El flujo de trabajo de liberación (`.github/workflows/release.yml`) firma a través del funcionario
`signpath/github-action-submit-signing-request` acción. Se lee un secreto y tres repositorios variables:

| Nombre | Amable | Valor |
|---|---|---|
| `SIGNPATH_API_TOKEN` | secreto | API token del usuario SignPath CI |
| `SIGNPATH_ORGANIZATION_ID` | variable | ID de organización SignPath |
| `SIGNPATH_PROJECT_SLUG` | variable | `opencodex` |
| `SIGNPATH_SIGNING_POLICY_SLUG` | variable | `test-signing` hoy; `release-signing` Una vez emitido el certificado |

Configuración de artefactos SignPath: `windows-standalone-zip` (uno `ocx.exe` en la raíz zip) y
`windows-msi-zip` (uno `.msi` en la zip root, profundo firmado).

Firmar nunca bloquea un lanzamiento. Lo que hace una carrera depende de la política:

| Política | Secado | Liberación real |
|---|---|---|
| Sin token, o una configuración incompleta | Sin firmar | Sin firmar, con una notificación o advertencia |
| `test-signing` | Firmado con el certificado de prueba, mantenido solo como un artefacto de flujo de trabajo | Sin firmar, con un aviso; un certificado de prueba nunca se envía |
| `release-signing` | Firmado y verificado como de confianza | Firmado y verificado como de confianza |

Si una solicitud de firma falla, expira o es rechazada, o si la verificación falla, el trabajo registra un alerta y envía el archivo sin firmar junto con su firma original del actualizador.

**Cambiar al certificado de producción.** Una vez que SignPath lo emite, establezca la variable de repositorio
`SIGNPATH_SIGNING_POLICY_SLUG` a `release-signing` (Configuración de → Secretos y variables → Acciones → variables). No es necesario ningún cambio en el flujo de trabajo. A partir de entonces, cada liberación, incluyendo una carrera seca, se abre. dos solicitudes de firma (el binario independiente y el instalador). Un aprobador debe aprobar ambos en
[app.signpath.io](https://app.signpath.io) mientras la carrera espera. El flujo de trabajo espera hasta una hora por solicitud antes de que se dé por vencida y navegue sin firmar.

**Pruebas sin publicar.** Los **Prueba de firma Windows** flujo de trabajo (`.github/workflows/windows-signing-test.yml`, envío manual solamente, sin entradas) construye `ocx.exe`
y los corredores MSI en GitHub-hosted Windows, firma ambos con `test-signing`, verifica el firmas y mantiene los archivos firmados como artefactos de flujo de trabajo de corta duración. Publica nada y nunca usa la política de liberación.
