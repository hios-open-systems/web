# ============================================================================
#  uninstall-windows.ps1 — Quita el autostart nativo del pad-companion.
#  Detiene/borra la Tarea Programada y elimina la carpeta nativa de Windows.
#
#  Uso:  powershell -ExecutionPolicy Bypass -File .\uninstall-windows.ps1
# ============================================================================
#Requires -Version 5
$ErrorActionPreference = 'SilentlyContinue'

$TaskName = 'HIOS-Pad-Companion'
$Dest     = Join-Path $env:LOCALAPPDATA 'pad-companion'

Stop-ScheduledTask       -TaskName $TaskName
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Remove-Item $Dest -Recurse -Force

Write-Host "Removido '$TaskName' y la carpeta $Dest." -ForegroundColor Green
