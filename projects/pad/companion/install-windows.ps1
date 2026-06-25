# ============================================================================
#  install-windows.ps1 — Autostart del pad-companion en Windows.
#  Registra una Tarea Programada que arranca el daemon al iniciar sesion, y
#  corre Node bajo el nombre "pad-companion.exe" para identificarlo claro en el
#  Administrador de tareas. Equivalente al unit de systemd que se usa en Ubuntu.
#
#  Uso (PowerShell, NO requiere admin):
#     cd projects\pad\companion
#     powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
#
#  Para desinstalar:  .\uninstall-windows.ps1
# ============================================================================
#Requires -Version 5
$ErrorActionPreference = 'Stop'

$TaskName = 'HIOS-Pad-Companion'
$Here     = Split-Path -Parent $MyInvocation.MyCommand.Path      # carpeta companion
$NodeExe  = (Get-Command node -ErrorAction Stop).Source          # node.exe en el PATH
$PadExe   = Join-Path $Here 'pad-companion.exe'                  # copia de node con nombre claro
$Entry    = Join-Path $Here 'dist\index.js'
$Config   = Join-Path $Here 'config.json'

Write-Host "[1/5] config.json..." -ForegroundColor Cyan
if (-not (Test-Path $Config)) {
  Copy-Item (Join-Path $Here 'config.example.json') $Config
  Write-Warning "Cree config.json desde el ejemplo. Edita 'host' (hiospad.local o la IP del pad) antes de confiar en el."
}

Write-Host "[2/5] Build del companion (npm install + tsc)..." -ForegroundColor Cyan
Push-Location $Here
try {
  if (-not (Test-Path (Join-Path $Here 'node_modules'))) { npm install }
  npm run build
} finally { Pop-Location }
if (-not (Test-Path $Entry)) { throw "No se genero $Entry (fallo el build)." }

Write-Host "[3/5] Copiando node.exe -> pad-companion.exe (nombre de proceso claro)..." -ForegroundColor Cyan
Copy-Item $NodeExe $PadExe -Force

Write-Host "[4/5] Registrando la Tarea Programada '$TaskName'..." -ForegroundColor Cyan
$action    = New-ScheduledTaskAction -Execute $PadExe -Argument "`"$Entry`"" -WorkingDirectory $Here
$trigger   = New-ScheduledTaskTrigger -AtLogOn
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                                          -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
                       -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "[5/5] Arrancando ahora..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName

Write-Host ""
Write-Host "OK -> '$TaskName' corriendo y configurado para iniciar al login." -ForegroundColor Green
Write-Host "  - Administrador de tareas > Detalles: vas a ver 'pad-companion.exe'"
Write-Host "  - Programador de tareas: tarea '$TaskName'"
Write-Host "  - Reconfigurar: edita config.json y reinicia con  Stop/Start-ScheduledTask -TaskName $TaskName"
