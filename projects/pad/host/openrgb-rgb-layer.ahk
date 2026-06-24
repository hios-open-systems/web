; ============================================================================
;  control-deck - Capa RGB -> OpenRGB   (AutoHotkey v1, Windows)
; ----------------------------------------------------------------------------
;  Traduce los atajos que manda el pad (capa "RGB") a comandos de OpenRGB CLI.
;
;  Requisitos:
;    1. OpenRGB instalado. Ajusta OPENRGB abajo a la ruta de tu OpenRGB.exe.
;    2. (Recomendado) Abri OpenRGB y activa el "SDK Server" (Settings ->
;       Enable Server). Asi el CLI se conecta al server ya corriendo y responde
;       al instante, en vez de re-escanear dispositivos en cada tecla.
;    3. AutoHotkey v1 (https://www.autohotkey.com/). Ejecuta este .ahk.
;
;  Mapeo (capa RGB del pad):
;    Boton 1..5 = Rojo / Verde / Azul / Blanco / Off
;    Encoder    = Brillo +/-       Encoder press = Efecto (perfil "efecto")
;
;  Cuando este el WiFi (M7), el pad va a hablar directo con OpenRGB por red y
;  este script deja de hacer falta.
; ============================================================================

OPENRGB := "C:\Program Files\OpenRGB\OpenRGB.exe"
brightness := 100

RunRGB(args) {
    global OPENRGB
    Run, % """" OPENRGB """ " args, , Hide
}

; --- Colores: Ctrl+Alt+Shift + R/G/B/W/O ---
^!+r:: RunRGB("--mode Static --color FF0000")   ; Rojo
^!+g:: RunRGB("--mode Static --color 00FF00")   ; Verde
^!+b:: RunRGB("--mode Static --color 0000FF")   ; Azul
^!+w:: RunRGB("--mode Static --color FFFFFF")   ; Blanco
^!+o:: RunRGB("--mode Static --color 000000")   ; Off (negro)

; --- Brillo: Ctrl+Alt+Shift + Up/Down (mantiene un valor 0..100) ---
^!+Up::
    brightness := Min(100, brightness + 10)
    RunRGB("--brightness " brightness)
return
^!+Down::
    brightness := Max(0, brightness - 10)
    RunRGB("--brightness " brightness)
return

; --- Efecto: Ctrl+Alt+Shift+E -> carga un perfil guardado en OpenRGB ---
; Crea en OpenRGB un perfil llamado "efecto" (ej. Rainbow) y se aplica aca.
^!+e:: RunRGB("--profile efecto")

; Notas:
;  - "--mode Static --color" aplica a TODOS los dispositivos. Para uno solo,
;    agrega "--device N" (N = indice en la lista de OpenRGB).
;  - "--brightness" requiere OpenRGB reciente; si tu version no lo soporta,
;    usa perfiles por nivel de brillo (--profile brillo_alto, etc.).
;  - Para Linux, en vez de AutoHotkey usa sxhkd/xbindkeys llamando a
;    `openrgb --mode static --color FF0000`, etc., con los mismos atajos.
