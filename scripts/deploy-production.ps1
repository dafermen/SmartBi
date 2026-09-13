<#
.SYNOPSIS
Compila, valida y publica una versión estática de SmartBI.

.DESCRIPTION
El script exige un árbol Git limpio y que HEAD ya exista en origin/main. Luego
instala exactamente package-lock.json, ejecuta todas las comprobaciones, crea
un paquete de dist/ y lo instala como una nueva versión atómica en el servidor.

Use -Initial solamente en el primer despliegue, cuando HTTPS aún no existe. En
ese caso el script instala los archivos y deja la comprobación web para el
bootstrap de Nginx.
#>
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9._-]+$')]
    [string]$SshHost = 'ruteza-dev',

    [ValidatePattern('^[A-Za-z0-9.-]+$')]
    [string]$Domain = 'smartbi.innovalogic.tech',

    [ValidatePattern('^/var/www/[A-Za-z0-9._/-]+$')]
    [string]$RemoteRoot = '/var/www/smartbi.innovalogic.tech',

    [switch]$Initial
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-NativeSuccess {
    param([Parameter(Mandatory)][string]$Activity)

    if ($LASTEXITCODE -ne 0) {
        throw "$Activity falló con código $LASTEXITCODE. El despliegue se detuvo."
    }
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$deploymentDirectory = Join-Path $repositoryRoot '.deploy'
$archivePath = $null

Push-Location $repositoryRoot

try {
    Write-Host '1/7 Verificando trazabilidad Git...'
    & git rev-parse --is-inside-work-tree | Out-Null
    Assert-NativeSuccess 'La verificación de Git'

    $pendingChanges = (& git status --porcelain) -join [Environment]::NewLine
    Assert-NativeSuccess 'La lectura del estado de Git'

    if ($pendingChanges) {
        throw 'Existen cambios sin commit. Confírmelos antes de desplegar para que la versión sea reproducible.'
    }

    $currentBranch = (& git branch --show-current).Trim()
    Assert-NativeSuccess 'La lectura de la rama actual'

    if ($currentBranch -ne 'main') {
        throw "La rama actual es '$currentBranch'. Producción solo se despliega desde main."
    }

    & git fetch origin main
    Assert-NativeSuccess 'La actualización de origin/main'

    $localCommit = (& git rev-parse HEAD).Trim()
    Assert-NativeSuccess 'La lectura del commit local'
    $remoteCommit = (& git rev-parse origin/main).Trim()
    Assert-NativeSuccess 'La lectura de origin/main'

    if ($localCommit -ne $remoteCommit) {
        throw 'El commit local no coincide con origin/main. Haga push y vuelva a ejecutar el despliegue.'
    }

    $shortCommit = (& git rev-parse --short=12 HEAD).Trim()
    Assert-NativeSuccess 'La creación del identificador de versión'
    $releaseId = "$(Get-Date -Format 'yyyyMMddHHmmss')-$shortCommit"

    Write-Host '2/7 Instalando dependencias exactas...'
    & npm.cmd ci
    Assert-NativeSuccess 'npm ci'

    Write-Host '3/7 Ejecutando calidad, navegadores y auditoría de producción...'
    & npm.cmd run deploy:check
    Assert-NativeSuccess 'npm run deploy:check'

    Write-Host '4/7 Empaquetando dist/...'
    New-Item -ItemType Directory -Path $deploymentDirectory -Force | Out-Null
    $archiveName = "smartbi-$releaseId.tar.gz"
    $archivePath = Join-Path $deploymentDirectory $archiveName
    $remoteArchive = "/tmp/$archiveName"

    & tar.exe -czf $archivePath -C (Join-Path $repositoryRoot 'dist') .
    Assert-NativeSuccess 'El empaquetado de dist'
    $archiveChecksum = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()

    Write-Host '5/7 Transfiriendo el paquete al servidor...'
    & scp.exe -o BatchMode=yes -o ConnectTimeout=12 $archivePath "${SshHost}:$remoteArchive"
    Assert-NativeSuccess 'La transferencia del paquete'
    & scp.exe -o BatchMode=yes -o ConnectTimeout=12 `
        (Join-Path $repositoryRoot 'deploy/server/install-release.sh') `
        "${SshHost}:/tmp/smartbi-install-release.sh"
    Assert-NativeSuccess 'La transferencia del instalador remoto'

    Write-Host '6/7 Activando la nueva versión de forma atómica...'
    $remoteCommand = "bash /tmp/smartbi-install-release.sh '$RemoteRoot' '$releaseId' '$remoteArchive' '$archiveChecksum'"
    & ssh.exe -o BatchMode=yes -o ConnectTimeout=12 $SshHost $remoteCommand
    Assert-NativeSuccess 'La instalación remota'

    Write-Host '7/7 Verificando la aplicación publicada...'
    if ($Initial) {
        Write-Warning 'Primera versión instalada. Ejecute npm run deploy:bootstrap para habilitar Nginx y HTTPS.'
    }
    else {
        $response = Invoke-WebRequest -Uri "https://$Domain/" -Method Head -TimeoutSec 20
        if ($response.StatusCode -ne 200) {
            throw "La verificación web respondió con estado $($response.StatusCode)."
        }

        $publishedRelease = Invoke-RestMethod -Uri "https://$Domain/release.json" -TimeoutSec 20
        if ($publishedRelease.release -ne $releaseId) {
            throw 'El sitio no está entregando el identificador de la versión recién instalada.'
        }

        Write-Host "SmartBI $releaseId está disponible en https://$Domain/"
    }
}
finally {
    Pop-Location

    if ($archivePath -and (Test-Path -LiteralPath $archivePath)) {
        Remove-Item -LiteralPath $archivePath -Force
    }
}
