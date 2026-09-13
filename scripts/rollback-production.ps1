<#
.SYNOPSIS
Lista versiones o reactiva una versión anterior de SmartBI.

.EXAMPLE
npm run deploy:rollback

Muestra los identificadores disponibles sin modificar el servidor.

.EXAMPLE
npm run deploy:rollback -- -ReleaseId 20260912183000-abc1234

Activa la versión indicada y comprueba el sitio público.
#>
[CmdletBinding()]
param(
    [ValidatePattern('^[0-9]{14}-[0-9a-f]{7,40}$')]
    [string]$ReleaseId,

    [ValidatePattern('^[A-Za-z0-9._-]+$')]
    [string]$SshHost = 'ruteza-dev',

    [ValidatePattern('^[A-Za-z0-9.-]+$')]
    [string]$Domain = 'smartbi.innovalogic.tech',

    [ValidatePattern('^/var/www/[A-Za-z0-9._/-]+$')]
    [string]$RemoteRoot = '/var/www/smartbi.innovalogic.tech'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-NativeSuccess {
    param([Parameter(Mandatory)][string]$Activity)

    if ($LASTEXITCODE -ne 0) {
        throw "$Activity falló con código $LASTEXITCODE."
    }
}

if (-not $ReleaseId) {
    Write-Host 'Versiones disponibles, de la más reciente a la más antigua:'
    $listCommand = "find '$RemoteRoot/releases' -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r"
    & ssh.exe -o BatchMode=yes -o ConnectTimeout=12 $SshHost $listCommand
    Assert-NativeSuccess 'La consulta de versiones'
    Write-Host 'Para volver a una versión use: npm run deploy:rollback -- -ReleaseId IDENTIFICADOR'
    exit 0
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$serverScript = Join-Path $repositoryRoot 'deploy/server/rollback-release.sh'

& scp.exe -o BatchMode=yes -o ConnectTimeout=12 $serverScript "${SshHost}:/tmp/smartbi-rollback.sh"
Assert-NativeSuccess 'La transferencia del script de rollback'

$remoteCommand = "bash /tmp/smartbi-rollback.sh '$RemoteRoot' '$ReleaseId'"
& ssh.exe -o BatchMode=yes -o ConnectTimeout=12 $SshHost $remoteCommand
Assert-NativeSuccess 'El rollback remoto'

$response = Invoke-WebRequest -Uri "https://$Domain/" -Method Head -TimeoutSec 20
if ($response.StatusCode -ne 200) {
    throw "El sitio respondió con estado $($response.StatusCode) después del rollback."
}

Write-Host "Rollback verificado en https://$Domain/"
