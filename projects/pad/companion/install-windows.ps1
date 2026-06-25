# ============================================================================
#  install-windows.ps1 — Autostart NATIVO del pad-companion en Windows.
#
#  Copia el build (dist/ + config.json) desde esta carpeta (puede estar en la
#  share \\wsl.localhost) a una carpeta nativa de Windows, y registra una Tarea
#  Programada que lo arranca al iniciar sesion. Asi NO depende de WSL ni de
#  node_modules (el companion en runtime solo usa APIs nativas de Node + fetch).
#  Corre Node como "pad-companion.exe" -> nombre de proceso claro.
#
#  Requisitos: Node para Windows instalado (nodejs.org) y el build hecho
#  (en WSL: `npm run build`).
#
#  Uso (PowerShell, sin admin):
#     cd \\wsl.localhost\Ubuntu-20.04\home\juanparedez\projects\hios\web\projects\pad\companion
#     powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
#
#  Desinstalar:  .\uninstall-windows.ps1
# ============================================================================
#Requires -Version 5
$ErrorActionPreference = 'Stop'

$TaskName = 'HIOS-Pad-Companion'
$Source   = Split-Path -Parent $MyInvocation.MyCommand.Path       # carpeta companion (puede ser \\wsl$)
$Dest     = Join-Path $env:LOCALAPPDATA 'pad-companion'           # carpeta nativa de Windows
$PadExe   = Join-Path $Dest 'pad-companion.exe'
$Entry    = Join-Path $Dest 'dist\index.js'

Write-Host "[1/5] Verificando Node para Windows..." -ForegroundColor Cyan
$NodeExe = (Get-Command node -ErrorAction Stop).Source
Write-Host "      node: $NodeExe"

Write-Host "[2/5] Verificando el build (dist/)..." -ForegroundColor Cyan
$SrcDist = Join-Path $Source 'dist'
if (-not (Test-Path (Join-Path $SrcDist 'index.js'))) {
  throw "No existe dist\index.js en $Source. Construilo primero en WSL: 'npm run build'."
}

Write-Host "[3/5] Copiando a carpeta nativa: $Dest" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
if (Test-Path (Join-Path $Dest 'dist')) { Remove-Item (Join-Path $Dest 'dist') -Recurse -Force }
Copy-Item $SrcDist (Join-Path $Dest 'dist') -Recurse -Force
# config.json: NO pisar uno ya editado en Windows; si no hay, traer el de origen o el ejemplo.
if (-not (Test-Path (Join-Path $Dest 'config.json'))) {
  $srcCfg = Join-Path $Source 'config.json'
  if (-not (Test-Path $srcCfg)) { $srcCfg = Join-Path $Source 'config.example.json' }
  Copy-Item $srcCfg (Join-Path $Dest 'config.json')
  Write-Warning "config.json copiado a $Dest. Edita 'host' = IP del pad (o hiospad.local) antes de confiar."
}
Copy-Item $NodeExe $PadExe -Force                                  # node con nombre claro

# Lanzador VBS: corre pad-companion.exe SIN ventana de consola (0 = oculto), en la sesion
# del usuario (necesaria para el audio). Asi no hay terminal que cerrar ni se mata al cerrarla.
$vbs = Join-Path $Dest 'launch.vbs'
@'
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
d = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = d
sh.Run """" & d & "\pad-companion.exe"" ""dist\index.js""", 0, False
'@ | Set-Content -Path $vbs -Encoding ASCII

Write-Host "[4/5] Registrando la Tarea Programada '$TaskName'..." -ForegroundColor Cyan
$action    = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`"" -WorkingDirectory $Dest
$trigger   = New-ScheduledTaskTrigger -AtLogOn
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                                          -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
                       -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "[5/5] Arrancando ahora..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName

Write-Host ""
Write-Host "OK -> '$TaskName' corriendo desde $Dest (nativo, sin WSL)." -ForegroundColor Green
Write-Host "  - Administrador de tareas > Detalles: 'pad-companion.exe'"
Write-Host "  - Reconfigurar: edita $Dest\config.json y reinicia:"
Write-Host "      Stop-ScheduledTask -TaskName $TaskName ; Start-ScheduledTask -TaskName $TaskName"
Write-Host "  - Al actualizar el firmware/companion: re-corre este script (recopia dist/)."
