#!/usr/bin/env bash
# ============================================================================
#  flash-ota.sh - Flashea el pad por OTA SIN salir de la terminal de Code.
#
#  Por que existe: ArduinoOTA/espota es bidireccional -> tras la invitacion, el
#  ESP abre una conexion de VUELTA al host para bajar el firmware. La red virtual
#  de WSL2 (aun en modo mirrored) no deja entrar esa conexion entrante, asi que
#  `pio run -t upload` desde WSL queda en "No response from device". El BUILD si
#  funciona en WSL; solo el UPLOAD necesita la pila de red nativa.
#
#  Truco: compilamos en WSL (pio run) y disparamos espota con el python.exe
#  NATIVO de Windows via interop. Ese proceso corre con la red de Windows (directo
#  en la LAN), igual que si abrieras PowerShell, pero sin salir de Code.
#
#  En Linux nativo (dual-boot Ubuntu) no hay python.exe -> usa el OTA normal.
#
#  Uso:   ./flash-ota.sh [IP]      (IP por defecto: 192.168.1.43)
# ============================================================================
set -euo pipefail

IP="${1:-192.168.1.43}"                 # IP del pad (o pasala como 1er argumento)
PORT=3232                               # puerto OTA de ArduinoOTA
ENV=esp32-s3-devkitc-1
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$DIR/.pio/build/$ENV/firmware.bin"
ESPOTA="$HOME/.platformio/packages/framework-arduinoespressif32/tools/espota.py"

echo ">> Build (WSL)..."
pio run -d "$DIR"

if command -v python.exe >/dev/null 2>&1; then
  echo ">> Flash OTA via python.exe de Windows -> $IP (la red de WSL no sirve para espota)"
  python.exe "$(wslpath -w "$ESPOTA")" -i "$IP" -p "$PORT" -f "$(wslpath -w "$BIN")" -r
else
  echo ">> Flash OTA (pio, Linux nativo) -> $IP"
  pio run -d "$DIR" -t upload --upload-port "$IP"
fi
