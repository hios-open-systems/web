# ============================================================================
#  uninstall-windows.ps1 — Quita el autostart del pad-companion en Windows.
#  Detiene y borra la Tarea Programada y elimina la copia pad-companion.exe.
#
#  Uso:  powershell -ExecutionPolicy Bypass -File .\uninstall-windows.ps1
# ============================================================================
#Requires -Version 5
$ErrorActionPreference = 'SilentlyContinue'

$TaskName = 'HIOS-Pad-Companion'
$Here     = Split-Path -Parent $MyInvocation.MyCommand.Path
$PadExe   = Join-Path $Here 'pad-companion.exe'

Stop-ScheduledTask       -TaskName $TaskName
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Remove-Item $PadExe -Force

Write-Host "Removido '$TaskName' y pad-companion.exe." -ForegroundColor Green
