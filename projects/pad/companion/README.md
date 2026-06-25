# pad-companion

Daemon liviano (CLI, headless) que lee el **estado real de la PC** y se lo empuja al
macropad HIOS para que el display muestre datos reales en vez de optimistas.

- **Lee:** volumen del sistema, mic muteado, temperatura y carga de CPU/GPU.
- **Empuja:** `POST http://<pad>/api/state` (JSON) cada `pollMs`.
- **Ejecuta comandos del pad:** el pad puede pedir un **mute global de mic** (a nivel OS,
  Core Audio / PipeWire) que viaja en la *respuesta* del POST; el daemon lo aplica y
  reporta el estado real de vuelta. Funciona en cualquier app (Slack, Meet, etc.).
- **Local-first:** el pad funciona perfecto sin esto; el daemon solo lo *mejora*.
  Si el daemon se cae, el pad vuelve al estado optimista en ~4s.

Cross-platform **Linux + Windows** (macOS: la interfaz está lista, falta implementar).
Sin frameworks ni addons nativos: todo sale de comandos del sistema (`execFile`) y
`fetch` nativo de Node 18+.

## Uso

```bash
npm install        # solo typescript + @types/node (devDeps)
npm run build      # tsc -> dist/
cp config.example.json config.json   # ajustá host/token/pollMs
npm start          # node dist/index.js   (o: node dist/index.js --config /ruta/config.json)
```

`config.json`:
```json
{ "host": "hiospad.local", "token": "", "pollMs": 1000,
  "send": { "mic": true, "vol": true, "cpuTemp": true, "gpuTemp": true, "cpuLoad": true, "gpuLoad": true } }
```
- **host:** `hiospad.local` (mDNS, si tu OS lo resuelve) o la IP directa (ej `192.168.1.43`).
- **token:** si en el firmware definís `cfg::API_TOKEN`, ponelo acá (va en el header `X-Pad-Token`).
- **send:** qué campos mandar; lo que no esté/no se pueda leer se omite.

## Autostart (que arranque solo con la PC)

**Windows** — Tarea Programada al iniciar sesión, sin dependencias ni admin:
```powershell
cd projects\pad\companion
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1   # registra + arranca
powershell -ExecutionPolicy Bypass -File .\uninstall-windows.ps1 # quitar
```
- Corre Node bajo el nombre **`pad-companion.exe`** → se identifica claro en el
  Administrador de tareas > Detalles. Tarea: **`HIOS-Pad-Companion`**.
- Arranca **al iniciar sesión** (no al boot crudo) a propósito: lee tu audio (mic/volumen
  por Core Audio), que solo existe dentro de la sesión de usuario.
- Reintenta 3× si se cae. Reconfigurar: editá `config.json` y reiniciá la tarea.

**Linux (systemd)** — unit de usuario equivalente (`~/.config/systemd/user/pad-companion.service`):
```ini
[Unit]
Description=HIOS pad-companion
After=network-online.target

[Service]
ExecStart=/usr/bin/node %h/ruta/a/projects/pad/companion/dist/index.js
WorkingDirectory=%h/ruta/a/projects/pad/companion
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```
```bash
systemctl --user daemon-reload && systemctl --user enable --now pad-companion
```
El proceso se ve como **`pad-companion`** en `ps/top/htop` (lo fija `process.title`).

## Contrato (POST /api/state) — FUENTE DE VERDAD compartida con el firmware

Debe coincidir con `handlePostState()` en `../src/net/Net.cpp` (firmware del pad) y con
`src/state.ts`. Todos los campos opcionales; el firmware pisa solo lo presente.

```json
{ "mic": true, "cam": false, "media": true, "vol": 42,
  "cpuTemp": 61.5, "gpuTemp": 54.0, "cpuLoad": 23, "gpuLoad": 71 }
```
Respuesta: `204` ok (sin comandos) · `200` ok **con comandos pendientes** (cuerpo
`{"cmds":["micToggle"]}`) · `400` body/json inválido · `401` token inválido.

**Comandos pad→companion** (en la respuesta del POST): el daemon los ejecuta y reporta
el nuevo estado en el siguiente push.

| Comando | Acción |
|---|---|
| `micToggle` | Mute/unmute global del mic por OS (Win: Core Audio `SetMute` en eConsole+eCommunications; Linux: `wpctl/pactl set-mute toggle`). |
| `camToggle` | Reservado — no hay mute de cámara a nivel OS; lo hace el atajo de la app. Se loguea y se omite. |

> Latencia: el comando viaja con el próximo POST (~`pollMs`). Para que el mute desde el
> pad sea más snappy, bajá `pollMs` a `500`.

Probar sin el daemon (simular el companion):
```bash
curl -i -X POST http://hiospad.local/api/state -H 'Content-Type: application/json' \
  -d '{"mic":true,"vol":37,"cpuTemp":61.5,"gpuTemp":54,"cpuLoad":20,"gpuLoad":80}'
# -> HTTP/1.1 204 No Content   (en el pad: skin "Sensores" muestra los valores)
```

## Dependencias por OS (lo que cada provider usa)

**Linux**
- Volumen / mic: `wpctl` (PipeWire) o `pactl` (PulseAudio).
- CPU temp: `sensors -j` (lm-sensors; `sudo apt install lm-sensors && sudo sensors-detect`) o `/sys/class/hwmon`.
- GPU temp/carga: `nvidia-smi` (driver NVIDIA).
- CPU carga: `/proc/stat` (sin dependencias).

**Windows** (best-effort, verificar en Windows real)
- Volumen / mic: Core Audio vía C# inline (sin instalar nada).
- GPU temp/carga: `nvidia-smi` (en PATH con el driver).
- CPU temp: **LibreHardwareMonitor** corriendo (expone WMI `root/LibreHardwareMonitor`). Sin él → `s/d`.
- CPU carga: contador de performance de Windows.

## Notas
- WSL2: `nvidia-smi` suele funcionar; `lm-sensors`/`/sys/hwmon` del host **no** se ven desde WSL
  (la CPU temp dará null). Para temps de CPU reales, correr el daemon en el OS nativo.
- Cualquier lectura que falle devuelve `null` y se omite del POST — nunca rompe el pad.

## Roadmap (ver el plan del proyecto)
- [x] Fase 1: feedback real (volumen/mic/temps) por `POST /api/state`.
- [x] Fase 3 (mic): **mute global** de mic por comando del pad (Core Audio / PipeWire).
- [ ] Fase 2: fallback por **USB vendor-HID** para feedback sin WiFi.
- [ ] Fase 3 (control): la companion como hub de control desde el celu (mouse/teclado) + pairing por QR.
- [ ] Fase 4: streaming de pantalla.
