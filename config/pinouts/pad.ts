import type { WiringGuide } from './wiring';

export const PAD_WIRING: WiringGuide = {
  meta: {
    id: 'pad',
    title: 'HIOS PAD',
    subtitle: 'Macropad ESP32-S3: nav directa (ALT×2 + encoder + stick), 10 acciones en matriz 2×5 y 2 parlantes I2S.',
    rev: '0.9',
    mcu: 'ESP32-S3 DevKitC-1 (N16R8)',
    note: 'nav directa (ALT×2 + encoder + stick) · 10 acciones en matriz 2×5 · 2 parlantes I2S · cableado OBJETIVO (el firmware de hoy lee botones directos)',
    source: 'src/app/Pins.h + Config.h + platformio.ini',
  },

  pins: [
    { gpio: 1, kind: 'adc', name: 'Stick VRx', rail: 33, dest: 'Stick eje X (ADC1) — nav' },
    { gpio: 2, kind: 'adc', name: 'Stick VRy', rail: 33, dest: 'Stick eje Y (ADC1) — nav' },
    { gpio: 4, kind: 'io', name: 'Encoder CLK', rail: 33, dest: 'KY-040 canal A — nav' },
    { gpio: 5, kind: 'io', name: 'Encoder DT', rail: 33, dest: 'KY-040 canal B — nav' },
    { gpio: 6, kind: 'io', name: 'Encoder SW', rail: 33, dest: 'KY-040 pulsador (PULLUP) — nav' },
    { gpio: 7, kind: 'io', name: 'Stick SW', rail: 33, dest: 'Stick pulsador (PULLUP) — nav' },
    { gpio: 8, kind: 'mtx', name: 'Matriz COL 1', rail: null, dest: 'INPUT_PULLUP · lee ACC2 / ACC7', note: 'es ADC1, va como digital' },
    { gpio: 9, kind: 'neo', name: 'NeoPixel DIN', rail: 5, dest: 'datos tira (vía 330Ω). Ex-divisor de batería', note: '3.3→5V: level-shifter 74AHCT125 o SK6812. Feedback por botón: encadenar 1 pixel/tecla acá' },
    { gpio: 10, kind: 'io', name: 'TFT CS', rail: 5, dest: 'ILI9488 chip-select' },
    { gpio: 11, kind: 'io', name: 'TFT MOSI', rail: 5, dest: 'ILI9488 SDI' },
    { gpio: 12, kind: 'io', name: 'TFT SCLK', rail: 5, dest: 'ILI9488 SCK' },
    { gpio: 13, kind: 'io', name: 'TFT DC', rail: 5, dest: 'ILI9488 DC/RS' },
    { gpio: 14, kind: 'io', name: 'TFT RST', rail: 5, dest: 'ILI9488 reset' },
    { gpio: 15, kind: 'mtx', name: 'Matriz FILA 0', rail: null, dest: 'OUTPUT (drive LOW) · acción fila de ARRIBA: ACC1–5' },
    { gpio: 16, kind: 'mtx', name: 'Matriz FILA 1', rail: null, dest: 'OUTPUT (drive LOW) · acción fila de ABAJO: ACC6–10' },
    { gpio: 17, kind: 'io', name: 'Botón ALT1', rail: null, dest: '→ GND (INPUT_PULLUP) · DIRECTO, sin diodo — nav' },
    { gpio: 18, kind: 'mtx', name: 'Matriz COL 0', rail: null, dest: 'INPUT_PULLUP · lee ACC1 / ACC6' },
    { gpio: 19, kind: 'dim', name: 'USB D−', rail: null, dest: 'USB nativo (HID) — RESERVADO' },
    { gpio: 20, kind: 'dim', name: 'USB D+', rail: null, dest: 'USB nativo (HID) — RESERVADO' },
    { gpio: 21, kind: 'pwm', name: 'TFT backlight', rail: null, dest: 'LED de la TFT (PWM por LEDC)' },
    { gpio: 38, kind: 'mtx', name: 'Matriz COL 2', rail: null, dest: 'INPUT_PULLUP · lee ACC3 / ACC8' },
    { gpio: 39, kind: 'mtx', name: 'Matriz COL 3', rail: null, dest: 'INPUT_PULLUP · lee ACC4 / ACC9', note: 'puede ser LED RGB del DevKit s/rev' },
    { gpio: 40, kind: 'i2s', name: 'I2S BCLK', rail: null, dest: '→ BCLK de AMBOS MAX98357A (bus compartido)' },
    { gpio: 41, kind: 'i2s', name: 'I2S LRC / WS', rail: null, dest: '→ LRC de AMBOS MAX98357A (word-select L/R)' },
    { gpio: 42, kind: 'i2s', name: 'I2S DIN', rail: null, dest: '→ DIN de AMBOS MAX98357A (dato serial)' },
    { gpio: 43, kind: 'dim', name: 'UART0 TX', rail: null, dest: 'Serial + flasheo por cable (CH343)' },
    { gpio: 44, kind: 'dim', name: 'UART0 RX', rail: null, dest: 'Serial + flasheo por cable (CH343)' },
    { gpio: 47, kind: 'mtx', name: 'Matriz COL 4', rail: null, dest: 'INPUT_PULLUP · lee ACC5 / ACC10' },
    { gpio: 48, kind: 'io', name: 'Botón ALT2', rail: null, dest: '→ GND (INPUT_PULLUP) · DIRECTO, sin diodo — nav', note: 'puede ser LED RGB del DevKit s/rev' },
  ],

  rails: [
    { k: 'c5', t: '5V (buck 5.0V)', c: '→ ESP32 pin 5V · TFT VCC (vía SW-PANTALLA) · NeoPixel VCC · 2× MAX98357A Vin · cap 470–1000µF · buck ≥2–3A' },
    { k: 'c33', t: '3V3 (del S3)', c: '→ Stick VCC · Encoder + (NO inyectar de afuera)' },
    { k: 'cg', t: 'GND común', c: '→ batería− · buck · S3 · TFT · stick · encoder · matriz · ALT · amplis · NeoPixel (1 sola masa)' },
  ],

  sections: [
    {
      t: '⚡ Energía — 3 rieles',
      group: 'power',
      ascii: `Cargador 2S ──┬── 2 celdas (6.0–8.4V)
              └─[SW-CELDAS]─► Buck 5.0V (≥2–3A) ─► RIEL 5V
   RIEL 5V ─► ESP32 pin 5V ─►(AMS1117)─► pin 3V3 ─► RIEL 3V3
   RIEL 5V ─► cap 470–1000µF ─► GND   (+1000µF cerca de los amplis)
   RIEL 5V ─[SW-PANTALLA]─► Pantalla VCC ; RIEL 5V ─► NeoPixel + 2× ampli Vin
   RIEL 3V3 ─► Stick VCC + Encoder + ; GND común: TODO`,
      tip: '**USB no alimenta nada** (wireless). El 3V3 sale del S3, no se inyecta. Con parlantes el pico de corriente sube: buck **≥2–3A** + cap de bulk generoso o vuelve el brownout.',
      rows: [
        { pin: '5V', kind: 'pwr5', nm: 'Buck OUT 5.0V', to: '→ RIEL 5V (S3, pantalla, NeoPixel, 2× ampli, cap)' },
        { pin: '3V3', kind: 'pwr33', nm: 'S3 pin 3V3', to: '→ RIEL 3V3 (stick + encoder)' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa común', to: 'todo junto (1 sola masa)' },
      ],
    },
    {
      t: '🔌 Switches',
      group: 'power',
      cnt: '2',
      rows: [
        { pin: 'SW1', kind: 'pwr5', nm: 'SW-CELDAS', to: 'corta BAT+ → buck (apaga TODO)', note: '≥2A' },
        { pin: 'SW2', kind: 'pwr5', nm: 'SW-PANTALLA', to: 'corta 5V → VCC pantalla (queda teclado)' },
      ],
    },
    {
      t: '🌈 NeoPixel',
      group: 'misc',
      cnt: 'DIN=9',
      tip: 'Toda la tira = 1 pin (DIN→DOUT encadenado). En GPIO9 (ex-batería) → UART0 (43/44) libre p/ serial+flasheo, sin parpadeo de boot. **Feedback por botón:** encadená 1 SK6812 por tecla en el MISMO GPIO9 (subí `NEOPIXEL_COUNT`) → RGB por tecla sin gastar pines. Los diodos de la matriz NO pueden hacer esto.',
      rows: [
        { pin: '9', kind: 'neo', nm: 'DIN', to: 'GPIO9 (330Ω en serie)', note: '3.3→5V marginal: 74AHCT125 o SK6812' },
        { pin: '5V', kind: 'pwr5', nm: 'VCC', to: '→ RIEL 5V', note: '~60mA/LED a tope; limitá brillo' },
        { pin: 'GND', kind: 'gnd', nm: 'GND', to: '→ GND común' },
      ],
    },
    {
      t: '🔋 Batería — descartada en el pad',
      group: 'misc',
      cnt: 'GPIO9→NeoPixel',
      tip: 'No se mide en el pad: la **pantalla de la fuente** ya muestra la tensión de entrada (= las 2 celdas 2S). GPIO9 (ex-divisor) ahora maneja el NeoPixel. En firmware: `BATTERY_ENABLED=false` (NO activar sin reasignar el ADC).',
      rows: [],
    },
    {
      t: '🧮 Presupuesto de pines',
      group: 'misc',
      cnt: 'libre: 3',
      tip: 'Matriz acción 7 (2 filas + 5 cols) + 2 ALT directos + 3 I2S = 12 → usan todos los GPIO liberados. Queda **GPIO3** de reserva (strapping). No usables: 26–32 (flash), 33–37 (PSRAM octal), 19/20 (USB), 43/44 (UART0), 0/45/46 (strapping).',
      rows: [],
    },
  ],

  check: [
    'Buck medido a 5.0V ANTES de conectar el S3 (≥2–3A si van parlantes)',
    'Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)',
    'Cap bulk 470–1000µF en el riel 5V + 1000µF cerca de los amplis (polaridad OK)',
    'Stick y encoder al riel 3V3 (NO 5V) — verificado con multímetro',
    'Matriz acción: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)',
    '10 diodos (uno por botón de acción), cátodo (raya) hacia la FILA → evita ghosting (si no registra, dalos vuelta)',
    'Diodos: 1N4148 (chico) o cualquier silicio: 1N400x/1N540x sirven igual (más grandes). LEDs NO',
    'ALT1→GPIO17, ALT2→GPIO48 DIRECTOS a GND (INPUT_PULLUP), SIN diodo (fila nav)',
    'NeoPixel: 330Ω en serie en DIN (GPIO9) + level-shifter/SK6812 + cap en su 5V',
    'I2S: BCLK=40, LRC=41, DIN=42 cableados a AMBOS amplis (bus compartido)',
    'Ampli-L: SD→Vin, medí SD > 1,4V · Ampli-R: SD→220–330k a Vin, medí SD 0,77–1,4V',
    'GAIN de cada ampli seteado (flotante=9dB) · parlante 4–8Ω directo (filterless)',
    'SW-CELDAS corta VBAT_SW · SW-PANTALLA corta VCC de la TFT',
    '1er flasheo por cable; después OTA (--upload-port hiospad.local)',
    'BOTON(GPIO0)+USB-C nativo accesibles para recuperación ante OTA fallido',
  ],

  keymap: {
    cols: [
      { c: 0, gpio: 18 },
      { c: 1, gpio: 8 },
      { c: 2, gpio: 38 },
      { c: 3, gpio: 39 },
      { c: 4, gpio: 47 },
    ],
    rows: [
      { r: 0, gpio: 15, name: 'acción · fila de ARRIBA', keys: ['ACC1', 'ACC2', 'ACC3', 'ACC4', 'ACC5'] },
      { r: 1, gpio: 16, name: 'acción · fila de ABAJO', keys: ['ACC6', 'ACC7', 'ACC8', 'ACC9', 'ACC10'] },
    ],
    navRow: [
      { kind: 'btn', logic: 'ALT1', gpio: 17 },
      { kind: 'btn', logic: 'ALT2', gpio: 48 },
      { kind: 'aux', label: 'Encoder', gpio: '4/5/6' },
      { kind: 'aux', label: 'Stick', gpio: '1/2/7' },
    ],
  },

  ampSdSteps: [
    'GAIN flotante (9 dB): dejá el pin SD sin conectar al arrancar.',
    'Ampli **LEFT**: SD → Vin directo (o R alta).',
    'Ampli **RIGHT**: R candidata de 220–330k entre SD y Vin.',
    'Encendé el riel 5V (buck ya medido a 5.0V), sin necesidad de sonido.',
    'Multímetro en DC: punta roja a SD, negra a GND.',
    'Bandas de SD: <0,16V mudo · 0,16–0,77V (L+R)/2 · 0,77–1,4V Right · >1,4V Left.',
    'LEFT tiene que dar >1,4V; RIGHT entre 0,77 y 1,4V. Fuera de banda → ajustá la R (más chica sube la tensión) y remedí.',
    'Fijá la R y repetí en el otro módulo (el 100k interno a GND ya viene en la placa).',
  ],
};
