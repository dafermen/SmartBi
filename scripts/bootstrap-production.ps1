<#
.SYNOPSIS
Prepara Nginx y HTTPS para el primer despliegue de SmartBI.

.DESCRIPTION
Este paso se ejecuta una sola vez y exige que deploy-production.ps1 -Initial ya
haya creado /var/www/smartbi.innovalogic.tech/current en el servidor.
#>
[CmdletBinding()]
param(
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

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$httpConfig = Join-Path $repositoryRoot 'deploy/nginx/smartbi-http.conf'
$httpsConfig = Join-Path $repositoryRoot 'deploy/nginx/smartbi.conf'
$serverScript = Join-Path $repositoryRoot 'deploy/server/bootstrap-smartbi.sh'

Write-Host '1/3 Transfiriendo la configuración revisada...'
& scp.exe -o BatchMode=yes -o ConnectTimeout=12 $httpConfig "${SshHost}:/tmp/smartbi-http.conf"
Assert-NativeSuccess 'La transferencia de la configuración HTTP'
& scp.exe -o BatchMode=yes -o ConnectTimeout=12 $httpsConfig "${SshHost}:/tmp/smartbi.conf"
Assert-NativeSuccess 'La transferencia de la configuración HTTPS'
& scp.exe -o BatchMode=yes -o ConnectTimeout=12 $serverScript "${SshHost}:/tmp/smartbi-bootstrap.sh"
Assert-NativeSuccess 'La transferencia del bootstrap'

Write-Host '2/3 Configurando Nginx y solicitando el certificado...'
$remoteCommand = "bash /tmp/smartbi-bootstrap.sh '$Domain' '$RemoteRoot' '/tmp/smartbi-http.conf' '/tmp/smartbi.conf'"
& ssh.exe -o BatchMode=yes -o ConnectTimeout=12 $SshHost $remoteCommand
Assert-NativeSuccess 'La configuración inicial del servidor'

Write-Host '3/3 Verificando HTTPS y encabezados esenciales...'
$response = Invoke-WebRequest -Uri "https://$Domain/" -Method Head -TimeoutSec 20

if ($response.StatusCode -ne 200) {
    throw "La aplicación respondió con estado $($response.StatusCode)."
}

foreach ($requiredHeader in @('Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options')) {
    if (-not $response.Headers.ContainsKey($requiredHeader)) {
        throw "Falta el encabezado de seguridad $requiredHeader."
    }
}

Write-Host "Servidor preparado correctamente: https://$Domain/"
