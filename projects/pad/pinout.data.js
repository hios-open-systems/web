// ============================================================================
//  pinout.data.js — FUENTE ÚNICA DE VERDAD del pinout del HIOS PAD.
//  Espejo humano de:  src/app/Pins.h  +  src/app/Config.h  +  flags TFT de
//  platformio.ini.  Lo carga pinout.html con <script src> (cero build, funciona
//  abriendo el .html como archivo local, sin CORS).
//
//  ⚠️ TODOS los números son GPIO (lo que imprime la serigrafía del DevKitC-1:
//     "IO15", "IO40", etc.), NO la posición física del pin en el header.
//     Emparejá SIEMPRE por el IOxx impreso en la placa.
//
//  LAYOUT FÍSICO (de arriba abajo):
//    · Pantalla horizontal (arriba).
//    · Fila NAVEGACIÓN: ALT1 · ALT2 · encoder · stick  (todos DIRECTOS).
//    · Fila acción 1: ACC1..ACC5   ┐  matriz 2×5 (con diodos)
//    · Fila acción 2: ACC6..ACC10  ┘
//
//  rev 0.9 — cambios sobre 0.8:
//    · 10 botones de ACCIÓN en MATRIZ 2×5 con diodos (7 GPIO).
//    · 2 ALT DIRECTOS a GPIO (INPUT_PULLUP, sin diodo) — están en la fila de nav
//      con el encoder y el stick, que también son directos.
//    · Eso deja 3 GPIO para 2× amplificador I2S MAX98357A (parlantes).
//    · Presupuesto: matriz 7 + ALT 2 + I2S 3 = 12. Queda libre GPIO3 (strapping).
//    · Diodos de acción = 1N4148 (o cualquier silicio: 1N400x/1N540x sirven).
//      LEDs NO (Vf deja la línea sobre el umbral de LOW). Feedback por botón =
//      1 SK6812 por tecla ENCADENADO en el mismo GPIO9.
//
//  ⚠️ El FIRMWARE de hoy todavía lee 5 botones directos y NO tiene driver de
//     matriz ni de I2S: este archivo describe el CABLEADO OBJETIVO (para soldar
//     en la carcasa nueva). El refactor de firmware es pasada aparte.
//     Autoridad del firmware = Pins.h; este archivo es el espejo humano.
// ============================================================================
window.PINOUT = {
  meta: {
    rev: "0.9",
    mcu: "ESP32-S3 DevKitC-1 (N16R8)",
    note: "nav directa (ALT×2 + encoder + stick) · 10 acciones en matriz 2×5 · 2 parlantes I2S",
  },

  // color por tipo (lo usa el SVG y las clases CSS .gp.<kind> / .pin.<kind>)
  colors: {
    io:"#58a6ff", adc:"#3fb950", pwm:"#bc8cff", neo:"#ff79c6",
    mtx:"#f0883e", i2s:"#2dd4bf", dim:"#6e7681",
  },

  // ── pin-a-pin ──────────────────────────────────────────────────────────────
  // {gpio, kind, name, rail(5|33|null), dest, note?}   · gpio = serigrafía IOxx
  pins: [
    {gpio:1, kind:"adc", name:"Stick VRx",     rail:33,   dest:"Stick eje X (ADC1) — nav"},
    {gpio:2, kind:"adc", name:"Stick VRy",     rail:33,   dest:"Stick eje Y (ADC1) — nav"},
    {gpio:4, kind:"io",  name:"Encoder CLK",   rail:33,   dest:"KY-040 canal A — nav"},
    {gpio:5, kind:"io",  name:"Encoder DT",    rail:33,   dest:"KY-040 canal B — nav"},
    {gpio:6, kind:"io",  name:"Encoder SW",    rail:33,   dest:"KY-040 pulsador (PULLUP) — nav"},
    {gpio:7, kind:"io",  name:"Stick SW",      rail:33,   dest:"Stick pulsador (PULLUP) — nav"},
    {gpio:8, kind:"mtx", name:"Matriz COL 1",  rail:null, dest:"INPUT_PULLUP · lee ACC2 / ACC7", note:"es ADC1, va como digital"},
    {gpio:9, kind:"neo", name:"NeoPixel DIN",  rail:5,    dest:"datos tira (vía 330Ω). Ex-divisor de batería", note:"3.3→5V: level-shifter 74AHCT125 o SK6812. Feedback por botón: encadenar 1 pixel/tecla acá"},
    {gpio:10,kind:"io",  name:"TFT CS",        rail:5,    dest:"ILI9488 chip-select"},
    {gpio:11,kind:"io",  name:"TFT MOSI",      rail:5,    dest:"ILI9488 SDI"},
    {gpio:12,kind:"io",  name:"TFT SCLK",      rail:5,    dest:"ILI9488 SCK"},
    {gpio:13,kind:"io",  name:"TFT DC",        rail:5,    dest:"ILI9488 DC/RS"},
    {gpio:14,kind:"io",  name:"TFT RST",       rail:5,    dest:"ILI9488 reset"},
    {gpio:15,kind:"mtx", name:"Matriz FILA 0", rail:null, dest:"OUTPUT (drive LOW) · acción fila de ARRIBA: ACC1–5"},
    {gpio:16,kind:"mtx", name:"Matriz FILA 1", rail:null, dest:"OUTPUT (drive LOW) · acción fila de ABAJO: ACC6–10"},
    {gpio:17,kind:"io",  name:"Botón ALT1",    rail:null, dest:"→ GND (INPUT_PULLUP) · DIRECTO, sin diodo — nav"},
    {gpio:18,kind:"mtx", name:"Matriz COL 0",  rail:null, dest:"INPUT_PULLUP · lee ACC1 / ACC6"},
    {gpio:19,kind:"dim", name:"USB D−",        rail:null, dest:"USB nativo (HID) — RESERVADO"},
    {gpio:20,kind:"dim", name:"USB D+",        rail:null, dest:"USB nativo (HID) — RESERVADO"},
    {gpio:21,kind:"pwm", name:"TFT backlight", rail:null, dest:"LED de la TFT (PWM por LEDC)"},
    {gpio:38,kind:"mtx", name:"Matriz COL 2",  rail:null, dest:"INPUT_PULLUP · lee ACC3 / ACC8"},
    {gpio:39,kind:"mtx", name:"Matriz COL 3",  rail:null, dest:"INPUT_PULLUP · lee ACC4 / ACC9", note:"puede ser LED RGB del DevKit s/rev"},
    {gpio:40,kind:"i2s", name:"I2S BCLK",      rail:null, dest:"→ BCLK de AMBOS MAX98357A (bus compartido)"},
    {gpio:41,kind:"i2s", name:"I2S LRC / WS",  rail:null, dest:"→ LRC de AMBOS MAX98357A (word-select L/R)"},
    {gpio:42,kind:"i2s", name:"I2S DIN",       rail:null, dest:"→ DIN de AMBOS MAX98357A (dato serial)"},
    {gpio:43,kind:"dim", name:"UART0 TX",      rail:null, dest:"Serial + flasheo por cable (CH343)"},
    {gpio:44,kind:"dim", name:"UART0 RX",      rail:null, dest:"Serial + flasheo por cable (CH343)"},
    {gpio:47,kind:"mtx", name:"Matriz COL 4",  rail:null, dest:"INPUT_PULLUP · lee ACC5 / ACC10"},
    {gpio:48,kind:"io",  name:"Botón ALT2",    rail:null, dest:"→ GND (INPUT_PULLUP) · DIRECTO, sin diodo — nav", note:"puede ser LED RGB del DevKit s/rev"},
  ],

  // ── rieles ───────────────────────────────────────────────────────────────
  rails: [
    {k:"c5",  t:"5V (buck 5.0V)", c:"→ ESP32 pin 5V · TFT VCC (vía SW-PANTALLA) · NeoPixel VCC · 2× MAX98357A Vin · cap 470–1000µF · buck ≥2–3A"},
    {k:"c33", t:"3V3 (del S3)",   c:"→ Stick VCC · Encoder + (NO inyectar de afuera)"},
    {k:"cg",  t:"GND común",      c:"→ batería− · buck · S3 · TFT · stick · encoder · matriz · ALT · amplis · NeoPixel (1 sola masa)"},
  ],

  // ── grupos (cards) ─────────────────────────────────────────────────────────
  sections: [
    { t:"⚡ Energía — 3 rieles", ascii:
`Cargador 2S ──┬── 2 celdas (6.0–8.4V)
              └─[SW-CELDAS]─► Buck 5.0V (≥2–3A) ─► RIEL 5V
   RIEL 5V ─► ESP32 pin 5V ─►(AMS1117)─► pin 3V3 ─► RIEL 3V3
   RIEL 5V ─► cap 470–1000µF ─► GND   (+1000µF cerca de los amplis)
   RIEL 5V ─[SW-PANTALLA]─► Pantalla VCC ; RIEL 5V ─► NeoPixel + 2× ampli Vin
   RIEL 3V3 ─► Stick VCC + Encoder + ; GND común: TODO`,
      tip:"<b>USB no alimenta nada</b> (wireless). El 3V3 sale del S3, no se inyecta. Con parlantes el pico de corriente sube: buck <b>≥2–3A</b> + cap de bulk generoso o vuelve el brownout.", rows:[
        {pin:"5V",kind:"pwr5",nm:"Buck OUT 5.0V",to:"→ RIEL 5V (S3, pantalla, NeoPixel, 2× ampli, cap)"},
        {pin:"3V3",kind:"pwr33",nm:"S3 pin 3V3",to:"→ RIEL 3V3 (stick + encoder)"},
        {pin:"GND",kind:"gnd",nm:"Masa común",to:"todo junto (1 sola masa)"},
      ]},

    { t:"🔌 Switches", cnt:"2", rows:[
        {pin:"SW1",kind:"pwr5",nm:"SW-CELDAS",to:"corta BAT+ → buck (apaga TODO)",note:"≥2A"},
        {pin:"SW2",kind:"pwr5",nm:"SW-PANTALLA",to:"corta 5V → VCC pantalla (queda teclado)"},
      ]},

    { t:"🧭 Fila navegación — todo DIRECTO", cnt:"ALT×2 + enc + stick", tip:"La fila pegada a la pantalla. Los 4 son entradas <b>directas</b> (sin matriz, sin diodo): cada uno un GPIO + GND, <span class='mono'>INPUT_PULLUP</span>. Los 2 ALT se cablean igual que el SW del encoder y el del stick.", rows:[
        {pin:"17",kind:"io",nm:"Botón ALT1",to:"GPIO17 → GND (INPUT_PULLUP), sin diodo"},
        {pin:"48",kind:"io",nm:"Botón ALT2",to:"GPIO48 → GND (INPUT_PULLUP), sin diodo",note:"puede ser LED RGB del DevKit s/rev"},
        {pin:"4/5/6",kind:"io",nm:"Encoder KY-040",to:"CLK=4, DT=5, SW=6 · a 3V3"},
        {pin:"1/2/7",kind:"adc",nm:"Stick",to:"X=1, Y=2 (ADC1), SW=7 · a 3V3"},
      ]},

    { t:"🎹 Acción — matriz 2×5 (diodos)", cnt:"10 → 7 pines", ascii:
`              COL0(18) COL1(8) COL2(38) COL3(39) COL4(47)  ← INPUT_PULLUP (leer)
 FILA0 (15) ►  ACC1     ACC2     ACC3     ACC4     ACC5     ← fila de ARRIBA
 FILA1 (16) ►  ACC6     ACC7     ACC8     ACC9     ACC10    ← fila de ABAJO
   ▲ filas: OUTPUT, drive LOW de a una

 Celda (por tecla):   COL ──┤ botón ├──▷|── FILA
                                     1N4148 (RAYA/cátodo → FILA)`,
      tip:"Los 10 botones de acción = tu grilla de 2×5, tal cual. Cada fila física = una FILA eléctrica (1 cable en margarita a los 5 botones → GPIO); las 5 COLUMNAS cruzan vertical y tocan la otra pata vía diodo. <b>10 diodos de silicio</b> (1N4148 chico, o 1N400x/1N540x más grandes — cualquiera anda), cátodo (raya) hacia la FILA → mata el <i>ghosting</i>. Los ALT NO llevan diodo (son directos, ver Navegación).", rows:[
        {pin:"15",kind:"mtx",nm:"FILA 0 (arriba)",to:"OUTPUT · ACC1–5"},
        {pin:"16",kind:"mtx",nm:"FILA 1 (abajo)",to:"OUTPUT · ACC6–10"},
        {pin:"18",kind:"mtx",nm:"COL 0",to:"INPUT_PULLUP · ACC1/6"},
        {pin:"8", kind:"mtx",nm:"COL 1",to:"INPUT_PULLUP · ACC2/7"},
        {pin:"38",kind:"mtx",nm:"COL 2",to:"INPUT_PULLUP · ACC3/8"},
        {pin:"39",kind:"mtx",nm:"COL 3",to:"INPUT_PULLUP · ACC4/9"},
        {pin:"47",kind:"mtx",nm:"COL 4",to:"INPUT_PULLUP · ACC5/10"},
      ]},

    { t:"🔊 Parlantes — 2× MAX98357A (I2S)", cnt:"3 pines", ascii:
`ESP32-S3            2× MAX98357A  (bus I2S COMPARTIDO)
 GPIO40 ─BCLK─┬─► BCLK ─┬─ ampli-L        ampli-R
 GPIO41 ─LRC──┼─► LRC ──┤   (Left)          (Right)
 GPIO42 ─DIN──┴─► DIN ──┘                       ▲ mismas 3 líneas
   5V ─► Vin (ambos) ;  GND ─► GND (ambos)
   ampli-L: SD → Vin           (medir SD > 1.4V  = Left)
   ampli-R: SD → 220–330k a Vin (medir SD 0.77–1.4V = Right)
   parlante 4–8Ω DIRECTO a la salida (filterless: sin R ni filtro)`,
      tip:"Los <b>2 amplis cuelgan de las MISMAS 3 líneas</b> (BCLK/LRC/DIN): I2S es un bus. Lo que hace L/R no es un cable distinto, es el <b>pin SD</b> de cada uno. <b>Canal:</b> el voltaje en SD elige salida — &lt;0,16V off · 0,16–0,77V (L+R)/2 · 0,77–1,4V <b>Right</b> · &gt;1,4V <b>Left</b>. Poné la R candidata de SD→Vin y <b>medí SD con el multímetro</b> hasta caer en la banda. <b>Ganancia</b> por pin GAIN (flotante=9dB · a GND=12dB · a Vin=6dB). No hace falta MCLK.", rows:[
        {pin:"40",kind:"i2s",nm:"BCLK",to:"bit-clock → ambos amplis"},
        {pin:"41",kind:"i2s",nm:"LRC/WS",to:"word-select → ambos amplis"},
        {pin:"42",kind:"i2s",nm:"DIN",to:"dato serial → ambos amplis"},
        {pin:"SD-L",kind:"i2s",nm:"ampli Left",to:"SD → Vin (medí >1,4V)"},
        {pin:"SD-R",kind:"i2s",nm:"ampli Right",to:"SD → 220–330k a Vin (medí 0,77–1,4V)"},
        {pin:"OUT",kind:"i2s",nm:"parlantes",to:"4–8Ω directo (filterless, sin R)",note:"2 amplis a tope ~1,3A pico → buck ≥2–3A"},
      ]},

    { t:"🌈 NeoPixel", cnt:"DIN=9", tip:"Toda la tira = 1 pin (DIN→DOUT encadenado). En GPIO9 (ex-batería) → UART0 (43/44) libre p/ serial+flasheo, sin parpadeo de boot. <b>Feedback por botón:</b> encadená 1 SK6812 por tecla en el MISMO GPIO9 (subí <span class='mono'>NEOPIXEL_COUNT</span>) → RGB por tecla sin gastar pines. Los diodos de la matriz NO pueden hacer esto.", rows:[
        {pin:"9",kind:"neo",nm:"DIN",to:"GPIO9 (330Ω en serie)",note:"3.3→5V marginal: 74AHCT125 o SK6812"},
        {pin:"5V",kind:"pwr5",nm:"VCC",to:"→ RIEL 5V",note:"~60mA/LED a tope; limitá brillo"},
        {pin:"GND",kind:"gnd",nm:"GND",to:"→ GND común"},
      ]},

    { t:"🔋 Batería — descartada en el pad", cnt:"GPIO9→NeoPixel",
      tip:"No se mide en el pad: la <b>pantalla de la fuente</b> ya muestra la tensión de entrada (= las 2 celdas 2S). GPIO9 (ex-divisor) ahora maneja el NeoPixel. En firmware: <span class='mono'>BATTERY_ENABLED=false</span> (NO activar sin reasignar el ADC).", rows:[] },

    { t:"🧮 Presupuesto de pines", cnt:"libre: 3",
      tip:"Matriz acción 7 (2 filas + 5 cols) + 2 ALT directos + 3 I2S = 12 → usan todos los GPIO liberados. Queda <b>GPIO3</b> de reserva (strapping). No usables: 26–32 (flash), 33–37 (PSRAM octal), 19/20 (USB), 43/44 (UART0), 0/45/46 (strapping).", rows:[] },
  ],

  // ── checklist de armado ─────────────────────────────────────────────────────
  check: [
    "Buck medido a 5.0V ANTES de conectar el S3 (≥2–3A si van parlantes)",
    "Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)",
    "Cap bulk 470–1000µF en el riel 5V + 1000µF cerca de los amplis (polaridad OK)",
    "Stick y encoder al riel 3V3 (NO 5V) — verificado con multímetro",
    "Matriz acción: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)",
    "10 diodos (uno por botón de acción), cátodo (raya) hacia la FILA → evita ghosting (si no registra, dalos vuelta)",
    "Diodos: 1N4148 (chico) o cualquier silicio: 1N400x/1N540x sirven igual (más grandes). LEDs NO",
    "ALT1→GPIO17, ALT2→GPIO48 DIRECTOS a GND (INPUT_PULLUP), SIN diodo (fila nav)",
    "NeoPixel: 330Ω en serie en DIN (GPIO9) + level-shifter/SK6812 + cap en su 5V",
    "I2S: BCLK=40, LRC=41, DIN=42 cableados a AMBOS amplis (bus compartido)",
    "Ampli-L: SD→Vin, medí SD > 1,4V · Ampli-R: SD→220–330k a Vin, medí SD 0,77–1,4V",
    "GAIN de cada ampli seteado (flotante=9dB) · parlante 4–8Ω directo (filterless)",
    "SW-CELDAS corta VBAT_SW · SW-PANTALLA corta VCC de la TFT",
    "1er flasheo por cable; después OTA (--upload-port hiospad.local)",
    "BOTON(GPIO0)+USB-C nativo accesibles para recuperación ante OTA fallido",
  ],

  // ── mapa de teclas: layout FÍSICO ↔ matriz ↔ GPIO ↔ lógico ──────────────────
  // Fila nav = directos (1 GPIO c/u). Acción = matriz: cada fila física = una
  // FILA eléctrica (bus a un GPIO); cada columna = un bus a un GPIO (vía diodo).
  // Firmware: KEYMAP[fila][col] -> InputId (acciones) + lectura directa de ALT.
  keymap: {
    cols: [
      {c:0, gpio:18}, {c:1, gpio:8}, {c:2, gpio:38}, {c:3, gpio:39}, {c:4, gpio:47},
    ],
    rows: [
      {r:0, gpio:15, name:"acción · fila de ARRIBA", keys:["ACC1","ACC2","ACC3","ACC4","ACC5"]},
      {r:1, gpio:16, name:"acción · fila de ABAJO",  keys:["ACC6","ACC7","ACC8","ACC9","ACC10"]},
    ],
    navRow: [
      {logic:"ALT1", gpio:17, kind:"btn"},
      {logic:"ALT2", gpio:48, kind:"btn"},
      {label:"Encoder", gpio:"4/5/6", kind:"aux"},
      {label:"Stick",   gpio:"1/2/7", kind:"aux"},
    ],
  },
};
