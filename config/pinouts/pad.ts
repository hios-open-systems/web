import type { WiringGuide } from './wiring';

export const PAD_WIRING: WiringGuide = {
  meta: {
    id: 'pad',
    title: 'HIOS PAD',
    subtitle: 'Macropad ESP32-S3: pantalla ILI9488 3.5", nav directa (ALT×2 + encoder + stick), 10 acciones en matriz 2×5, 8 NeoPixel y 2 parlantes I2S.',
    rev: '0.9',
    mcu: 'ESP32-S3 DevKitC-1 (N16R8)',
    boardId: 'esp32-s3-devkitc-1',
    note: 'as-wired: el firmware del repo YA es rev 0.9 (matriz 2×5 escaneada + bus I2S). Soldás esto, flasheás lo que está commiteado y anda. El self-test compara esta guía contra Pins.h y platformio.ini en cada corrida.',
    source: 'src/app/Pins.h + Config.h + platformio.ini',
  },

  /**
   * El riel vive en el MÓDULO, no en el pin. Un CS no va a 5V — va al GPIO. Lo que
   * come de un riel es la pantalla, por su VCC. El `step` es el orden en que
   * conviene soldar: cada módulo se prueba antes de pasar al siguiente.
   */
  modules: [
    {
      id: 'power',
      name: 'Energía — 3 rieles',
      icon: '⚡',
      rail: null,
      power: 'celdas 2S → SW-CELDAS → buck 5.0V (≥3A) → riel 5V · S3 pin 5V → LDO a bordo → riel 3V3',
      step: 1,
      tip: 'Medí el buck a 5.0V **antes** de enchufar el S3. El 3V3 lo genera el propio DevKit (LDO SGM2212-3.3, 800mA): **no se inyecta de afuera**.',
    },
    {
      id: 'display',
      name: 'Pantalla ILI9488 3.5" (SPI)',
      icon: '🖥️',
      rail: 5,
      power: 'VCC → 5V · GND → GND · LED → SW-PANTALLA → GPIO21',
      step: 2,
      tip: 'El ILI9488 es lógica **3.3V** (abs-max 3.3V en IOVCC) — tus GPIO son 3.3V, así que va directo. Pero **fijate si tu módulo trae un buffer 74HC245** al lado del header: si lo trae, se alimenta del VCC del módulo y a 5V su umbral pasa a 3.5V → tu SPI de 3.3V queda por debajo y ves **pantalla en blanco**. En ese caso, VCC va al riel **3V3**, no al 5V.',
    },
    {
      id: 'matrix',
      name: 'Matriz de acción 2×5 (10 teclas)',
      icon: '⌨️',
      rail: null,
      power: 'no se alimenta: cada tecla cierra COLUMNA → diodo → FILA',
      step: 3,
      tip: '2 filas OUTPUT (se manejan a LOW de a una) + 5 columnas INPUT_PULLUP. Un diodo por tecla, **cátodo (la raya) hacia la FILA**. Sin diodos hay ghosting al apretar 3 teclas.',
    },
    {
      id: 'nav',
      name: 'Botones ALT (navegación)',
      icon: '🔀',
      rail: null,
      power: 'no se alimenta: pulsador directo a GND (INPUT_PULLUP)',
      step: 4,
      tip: 'Van **fuera** de la matriz y **sin diodo**: son los que abren capa/menú, tienen que leerse siempre.',
    },
    {
      id: 'encoder',
      name: 'Encoder KY-040',
      icon: '🎛️',
      rail: 33,
      power: '+ → 3V3 · GND → GND',
      step: 5,
    },
    {
      id: 'stick',
      name: 'Stick analógico (HW-504)',
      icon: '🕹️',
      rail: 33,
      power: '+5V del módulo → riel **3V3** · GND → GND',
      step: 6,
      tip: 'El pin del módulo dice "+5V" pero va a **3V3**. A 5V sobre-volta el ADC del S3 y los ejes se acoplan en el extremo alto. Los dos ejes van a GPIO1/GPIO2 = **ADC1**, el único ADC que funciona con WiFi/BLE prendido.',
    },
    {
      id: 'audio',
      name: '2× MAX98357A (I2S)',
      icon: '🔊',
      rail: 5,
      power: 'Vin → 5V · GND → GND · 1000µF cerca de los amplis',
      step: 7,
      load: '2× parlante 4–8Ω',
      tip: 'Bus I2S compartido: los 3 pines van a **los dos** amplis. Lo único distinto entre ellos es el pin **SD**, que elige el canal. Class-D filterless: el parlante de 4–8Ω va directo, sin filtro.',
    },
    {
      id: 'led',
      name: '2× NeoPixel 4 LEDs (8 px)',
      icon: '🌈',
      rail: 5,
      power: 'VCC → 5V (o 1N400x en serie, ver tip) · GND → GND',
      step: 8,
      tip: 'Las **2 placas de 4 LEDs van encadenadas en un solo pin**: DOUT de la primera → DIN de la segunda. Eso NO las vuelve dependientes — cada WS2812B tiene su propio controlador, así que los 8 píxeles se direccionan de a uno (`NEOPIXEL_COUNT=8`). El WS2812B pide V_IH = 0.7×VDD = **3.5V** y tu GPIO da 3.3V: está **fuera de spec**. Fix sin chips: meté un **1N400x** (silicio, ~0.65V) en serie con el VCC de la tira → la tira queda a ~4.35V → el umbral baja a 3.05V y tu 3.3V entra cómodo. La otra opción es un 74AHCT125. El SK6812 **no** es un fix garantizado: su umbral típico sigue siendo 3.4V.',
    },
    {
      id: 'system',
      name: 'Sistema (USB / UART)',
      icon: '🔒',
      rail: null,
      power: 'no se cablea: los usa la placa',
      step: 9,
      tip: 'Reservados. Tocarlos rompe el HID (19/20) o el flasheo por cable (43/44).',
    },
  ],

  pins: [
    { gpio: 1, kind: 'adc', name: 'Stick VRx', mod: 'stick', dest: 'Stick eje X — ADC1_0' },
    { gpio: 2, kind: 'adc', name: 'Stick VRy', mod: 'stick', dest: 'Stick eje Y — ADC1_1' },
    { gpio: 4, kind: 'io', name: 'Encoder CLK', mod: 'encoder', dest: 'KY-040 canal A' },
    { gpio: 5, kind: 'io', name: 'Encoder DT', mod: 'encoder', dest: 'KY-040 canal B' },
    { gpio: 6, kind: 'io', name: 'Encoder SW', mod: 'encoder', dest: 'KY-040 pulsador (INPUT_PULLUP)' },
    { gpio: 7, kind: 'io', name: 'Stick SW', mod: 'stick', dest: 'Stick pulsador (INPUT_PULLUP)' },
    { gpio: 8, kind: 'mtx', name: 'Matriz COL 1', mod: 'matrix', dest: 'INPUT_PULLUP · lee ACC2 / ACC7', note: 'es ADC1_7, pero acá va como digital' },
    { gpio: 9, kind: 'neo', name: 'NeoPixel DIN', mod: 'led', dest: 'datos de la tira, vía 330Ω en serie', note: 'ex-divisor de batería. La medición de batería se descartó: NO reactivar BATTERY_ENABLED sin reasignar el ADC' },
    { gpio: 10, kind: 'spi', name: 'TFT CS', mod: 'display', dest: 'ILI9488 CS (chip-select)' },
    { gpio: 11, kind: 'spi', name: 'TFT MOSI', mod: 'display', dest: 'ILI9488 SDI' },
    { gpio: 12, kind: 'spi', name: 'TFT SCLK', mod: 'display', dest: 'ILI9488 SCK' },
    { gpio: 13, kind: 'spi', name: 'TFT DC', mod: 'display', dest: 'ILI9488 DC/RS' },
    { gpio: 14, kind: 'spi', name: 'TFT RST', mod: 'display', dest: 'ILI9488 RESET' },
    { gpio: 15, kind: 'mtx', name: 'Matriz FILA 0', mod: 'matrix', dest: 'OUTPUT (drive LOW) · fila de ARRIBA: ACC1–5' },
    { gpio: 16, kind: 'mtx', name: 'Matriz FILA 1', mod: 'matrix', dest: 'OUTPUT (drive LOW) · fila de ABAJO: ACC6–10' },
    { gpio: 17, kind: 'io', name: 'Botón ALT1', mod: 'nav', dest: '→ GND (INPUT_PULLUP) · DIRECTO, sin diodo' },
    { gpio: 18, kind: 'mtx', name: 'Matriz COL 0', mod: 'matrix', dest: 'INPUT_PULLUP · lee ACC1 / ACC6' },
    { gpio: 19, kind: 'dim', name: 'USB D−', mod: 'system', dest: 'USB nativo (HID) — RESERVADO, no soldar nada' },
    { gpio: 20, kind: 'dim', name: 'USB D+', mod: 'system', dest: 'USB nativo (HID) — RESERVADO, no soldar nada' },
    { gpio: 21, kind: 'pwm', name: 'TFT backlight', mod: 'display', dest: 'LED de la TFT (PWM por LEDC) · acá va en serie el SW-PANTALLA' },
    { gpio: 38, kind: 'mtx', name: 'Matriz COL 2', mod: 'matrix', dest: 'INPUT_PULLUP · lee ACC3 / ACC8', note: 'en DevKitC-1 **v1.1** este pin maneja el LED RGB de la placa. No rompe nada (el DIN del LED es alta impedancia) pero el pixel va a parpadear con el escaneo' },
    { gpio: 39, kind: 'mtx', name: 'Matriz COL 3', mod: 'matrix', dest: 'INPUT_PULLUP · lee ACC4 / ACC9' },
    { gpio: 40, kind: 'i2s', name: 'I2S BCLK', mod: 'audio', dest: '→ BCLK de AMBOS MAX98357A (bus compartido)' },
    { gpio: 41, kind: 'i2s', name: 'I2S LRC', mod: 'audio', dest: '→ LRC de AMBOS MAX98357A (word-select L/R)' },
    { gpio: 42, kind: 'i2s', name: 'I2S DOUT', mod: 'audio', dest: '→ DIN de AMBOS MAX98357A (dato serial). Sale del S3, entra al ampli: por eso acá es DOUT y allá DIN' },
    { gpio: 43, kind: 'dim', name: 'UART0 TX', mod: 'system', dest: 'Serial + flasheo por cable (CH343)' },
    { gpio: 44, kind: 'dim', name: 'UART0 RX', mod: 'system', dest: 'Serial + flasheo por cable (CH343)' },
    { gpio: 47, kind: 'mtx', name: 'Matriz COL 4', mod: 'matrix', dest: 'INPUT_PULLUP · lee ACC5 / ACC10' },
    { gpio: 48, kind: 'io', name: 'Botón ALT2', mod: 'nav', dest: '→ GND (INPUT_PULLUP) · DIRECTO, sin diodo', note: 'en DevKitC-1 **v1.0** este pin maneja el LED RGB de la placa. El pulsador funciona igual; el LED simplemente no se usa' },
  ],

  /**
   * Vacío: el firmware ya alcanzó a la guía (rev 0.9 en ambos).
   *
   * NO borrar el campo. Existe para que una divergencia guía↔firmware nunca vuelva
   * a ser CALLADA: el self-test compara contra `Pins.h` y, si encuentra una que no
   * esté declarada acá con su motivo, falla. La vez que faltó, alguien se enteró de
   * que ALT1 se había mudado de pin con el soldador prendido.
   */
  divergence: [],

  rails: [
    { k: 'c5', t: '5V (buck 5.0V)', c: '→ ESP32 pin 5V · TFT VCC · NeoPixel VCC · 2× MAX98357A Vin · cap de bulk · buck **≥3A**' },
    { k: 'c33', t: '3V3 (LDO del DevKit)', c: '→ Stick VCC · Encoder + . Lo genera el SGM2212-3.3 a bordo (800mA): **NO inyectar de afuera**' },
    { k: 'cg', t: 'GND común', c: '→ batería− · buck · S3 · TFT · stick · encoder · matriz · ALT · amplis · NeoPixel (1 sola masa)' },
  ],

  sections: [
    {
      t: '⚡ Energía — 3 rieles',
      group: 'power',
      ascii: `Cargador 2S ──┬── 2 celdas (7.0–8.4V útiles)
              └─[SW-CELDAS]─► Buck 5.0V (≥3A) ─► RIEL 5V
   RIEL 5V ─► ESP32 pin 5V ─►(LDO SGM2212)─► pin 3V3 ─► RIEL 3V3
   RIEL 5V ─► cap 470–1000µF ─► GND   (+1000µF cerca de los amplis)
   RIEL 5V ─► Pantalla VCC ; NeoPixel + 2× ampli Vin
   GPIO21 ─[SW-PANTALLA]─► LED/BL de la pantalla   (¡el switch va acá, NO en el VCC!)
   RIEL 3V3 ─► Stick VCC + Encoder + ; GND común: TODO`,
      tip: '**USB no alimenta nada** (uso wireless). El 3V3 sale del S3, no se inyecta. Presupuesto real a full: 2 amplis a 4Ω (~1.5A) + 12 SK6812 en blanco (~0.7A) + S3 con RF + backlight (~0.6A) ≈ **2.9A** → el buck tiene que ser **≥3A**, no 2A.',
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
      tip: '⚠️ **SW-PANTALLA va en la línea LED/BL, NO en el VCC de la pantalla.** Si le cortás el VCC mientras los GPIO10–14 siguen manejando el SPI a 3.3V, violás el abs-max del ILI9488 (`VIN ≤ IOVCC + 0.3V`, o sea 0.3V con el módulo apagado) y le metés corriente por los diodos de ESD: es la forma clásica de cocinar el controlador. Cortando el backlight ahorrás casi la misma corriente, sin romper nada.',
      rows: [
        { pin: 'SW1', kind: 'pwr5', nm: 'SW-CELDAS', to: 'corta BAT+ → buck (apaga TODO)', note: '≥3A' },
        { pin: 'SW2', kind: 'pwr33', nm: 'SW-PANTALLA', to: 'corta GPIO21 → LED/BL de la pantalla (la lógica queda alimentada)' },
      ],
    },
    {
      t: '🖥️ Pantalla ILI9488 3.5"',
      group: 'display',
      cnt: '6 pines',
      tip: 'SPI por **HSPI** a 27MHz. El **MISO no se cablea** (`TFT_MISO=-1`): solo escribimos. Los 5 pines de señal salen de `platformio.ini`, no de `Pins.h` — el backlight sí está en `Pins.h` porque lo maneja el LEDC a mano. ⚠️ El **CS es 10**: un doc viejo decía 13, y soldarlo ahí lo cortocircuita contra el DC.',
      rows: [
        { pin: '10', kind: 'spi', nm: 'CS', to: '→ CS (a veces serigrafiado "CD")' },
        { pin: '11', kind: 'spi', nm: 'MOSI', to: '→ SDI del módulo' },
        { pin: '12', kind: 'spi', nm: 'SCLK', to: '→ SCK / SCL del módulo' },
        { pin: '13', kind: 'spi', nm: 'DC', to: '→ DC / RS' },
        { pin: '14', kind: 'spi', nm: 'RST', to: '→ RESET' },
        { pin: '21', kind: 'pwm', nm: 'Backlight', to: '→ [SW-PANTALLA] → LED', note: 'el switch va acá, NUNCA cortando el VCC' },
        { pin: 'VCC', kind: 'pwr5', nm: 'Alimentación', to: '→ RIEL 5V', note: 'si el módulo trae buffer 74HC245 junto al header, VCC va a 3V3 o ves pantalla en blanco' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa', to: '→ GND común' },
        { pin: '—', kind: 'dim', nm: 'MISO / SDO', to: 'NO se conecta (TFT_MISO=-1)' },
      ],
    },
    {
      t: '⌨️ Matriz de acción 2×5',
      group: 'matrix',
      cnt: '10 teclas · 7 pines',
      ascii: `        COL0    COL1    COL2    COL3    COL4
        GPIO18  GPIO8   GPIO38  GPIO39  GPIO47
          │       │       │       │       │
FILA0 ────┼─ACC1──┼─ACC2──┼─ACC3──┼─ACC4──┼─ACC5
GPIO15    │       │       │       │       │
          │       │       │       │       │
FILA1 ────┼─ACC6──┼─ACC7──┼─ACC8──┼─ACC9──┼─ACC10
GPIO16

  cada tecla:  COLUMNA ──[switch]──|◄|── FILA
                                  diodo
                          (la RAYA mira a la FILA)`,
      tip: '2 filas **OUTPUT** (en reposo HIGH, se bajan de a una) + 5 columnas **INPUT_PULLUP**. Un diodo por tecla, **cátodo (la raya) hacia la FILA**. Sin diodos, apretar 3 teclas en L inventa una cuarta (ghosting). Si una tecla no registra, el diodo está al revés: dalo vuelta. Sirve 1N4148 o cualquier silicio (1N400x/1N540x); **LEDs no**.',
      rows: [
        { pin: '15', kind: 'mtx', nm: 'FILA 0 — arriba', to: 'OUTPUT · ACC1 a ACC5' },
        { pin: '16', kind: 'mtx', nm: 'FILA 1 — abajo', to: 'OUTPUT · ACC6 a ACC10' },
        { pin: '18', kind: 'mtx', nm: 'COL 0', to: 'INPUT_PULLUP · ACC1 / ACC6' },
        { pin: '8', kind: 'mtx', nm: 'COL 1', to: 'INPUT_PULLUP · ACC2 / ACC7', note: 'es ADC1_7, acá va como digital' },
        { pin: '38', kind: 'mtx', nm: 'COL 2', to: 'INPUT_PULLUP · ACC3 / ACC8', note: 'en DevKitC-1 v1.1 maneja el LED RGB de la placa: va a parpadear con el escaneo (cosmético)' },
        { pin: '39', kind: 'mtx', nm: 'COL 3', to: 'INPUT_PULLUP · ACC4 / ACC9' },
        { pin: '47', kind: 'mtx', nm: 'COL 4', to: 'INPUT_PULLUP · ACC5 / ACC10' },
      ],
    },
    {
      t: '🔀 Botones ALT (navegación)',
      group: 'nav',
      cnt: '2 · directos',
      tip: 'Van **fuera de la matriz y sin diodo**, a propósito: son los que abren capa/menú y tienen que leerse **siempre**, sin depender de qué fila está escaneando. Pulsador NA directo a GND, el pull-up es interno.',
      rows: [
        { pin: '17', kind: 'io', nm: 'ALT 1', to: 'pulsador → GND (INPUT_PULLUP)' },
        { pin: '48', kind: 'io', nm: 'ALT 2', to: 'pulsador → GND (INPUT_PULLUP)', note: 'en DevKitC-1 v1.0 este pin maneja el LED RGB de la placa; el pulsador anda igual' },
      ],
    },
    {
      t: '🎛️ Encoder KY-040',
      group: 'encoder',
      cnt: '3 pines',
      tip: 'CLK y DT van por **interrupción** (cuadratura: el orden de flancos da el sentido). El SW es el pulsador del eje: **press abre el menú**. Si gira al revés, permutá CLK y DT. El módulo KY-040 ya trae sus pull-ups a bordo.',
      rows: [
        { pin: '4', kind: 'io', nm: 'CLK — canal A', to: '→ CLK del módulo (interrupción)' },
        { pin: '5', kind: 'io', nm: 'DT — canal B', to: '→ DT del módulo (interrupción)' },
        { pin: '6', kind: 'io', nm: 'SW — pulsador', to: '→ SW (INPUT_PULLUP)' },
        { pin: '+', kind: 'pwr33', nm: 'Alimentación', to: '→ RIEL 3V3' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa', to: '→ GND común' },
      ],
    },
    {
      t: '🕹️ Stick analógico HW-504',
      group: 'stick',
      cnt: '3 pines',
      tip: '⚠️ El pin del módulo dice **"+5V" pero va al riel 3V3**. A 5V sobre-volta el ADC del S3 y los ejes se **acoplan en el extremo alto** (diagonales fantasma que vas a culpar al firmware). Los dos ejes van a GPIO1/GPIO2 = **ADC1**, el único ADC que sigue funcionando con WiFi/BLE encendido. El pulsador del stick es el click.',
      rows: [
        { pin: '1', kind: 'adc', nm: 'VRx — eje X', to: '→ VRx (ADC1_0)' },
        { pin: '2', kind: 'adc', nm: 'VRy — eje Y', to: '→ VRy (ADC1_1)' },
        { pin: '7', kind: 'io', nm: 'SW — pulsador', to: '→ SW (INPUT_PULLUP)' },
        { pin: '+5V', kind: 'pwr33', nm: 'Alimentación', to: '→ RIEL **3V3** (NO 5V)', note: 'el silk miente: verificá con multímetro antes de encender' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa', to: '→ GND común' },
      ],
    },
    {
      t: '🔊 Bus I2S — a los DOS amplis',
      group: 'audio',
      cnt: '3 pines',
      ascii: `                 ┌────────────────┐
  GPIO40 BCLK ──┬─►│ MAX98357A  L   │──► parlante L (4–8Ω)
  GPIO41 LRC  ──┼─►│ SD → Vin       │
  GPIO42 DOUT ──┼─►│ (DIN)          │
                │  └────────────────┘
                │  ┌────────────────┐
                └─►│ MAX98357A  R   │──► parlante R (4–8Ω)
                   │ SD → 390k → Vin│
                   │ (DIN)          │
                   └────────────────┘
       mismas 3 líneas a los dos · sólo cambia la R de SD`,
      tip: 'Las **3 líneas van en paralelo a los dos amplis**: no hay un bus por canal. Lo único distinto entre ellos es el pin **SD**, que elige el canal (ver el bloque de abajo). Ojo con el nombre: sale del S3 como **DOUT** y entra al ampli como **DIN** — es el mismo cable.',
      rows: [
        { pin: '40', kind: 'i2s', nm: 'BCLK — bit clock', to: '→ BCLK de AMBOS amplis' },
        { pin: '41', kind: 'i2s', nm: 'LRC — word select', to: '→ LRC de AMBOS amplis (elige L/R en el tiempo)' },
        { pin: '42', kind: 'i2s', nm: 'DOUT — dato serial', to: '→ DIN de AMBOS amplis' },
        { pin: 'Vin', kind: 'pwr5', nm: 'Alimentación', to: '→ RIEL 5V + **1000µF** cerca de los amplis' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa', to: '→ GND común' },
      ],
    },
    {
      t: '🔊 Canal de cada ampli (pin SD)',
      group: 'audio',
      cnt: 'L / R',
      tip: 'El pin **SD** del MAX98357A hace dos cosas: apaga el ampli **y** elige el canal, según la tensión que le pongas. Tiene un pulldown interno de **100k**, así que la R que le colgás a Vin arma un divisor. Los umbrales son **volts absolutos**, no fracción de Vdd.',
      rows: [
        { pin: 'SD', kind: 'pwr5', nm: 'Ampli IZQUIERDO', to: 'SD → Vin directo (5V) → banda >1.4V = **Left**' },
        { pin: 'SD', kind: 'pwr33', nm: 'Ampli DERECHO', to: 'SD → **390kΩ** → Vin → ~1.0V = **Right**', note: 'la fórmula del datasheet (R = 94.0×Vdd − 100) da 370k a 5V' },
        { pin: 'GAIN', kind: 'gnd', nm: 'Ganancia', to: 'dejalo **sin conectar** = 9dB (ese es el que va flotante, NO el SD)' },
      ],
    },
    {
      t: '🔈 Parlantes',
      group: 'audio',
      cnt: '2 × 4–8Ω',
      tip: 'No tienen GPIO — cuelgan de la salida de cada ampli, pero igual hay que soldarlos. El MAX98357A es **class-D filterless**: el parlante va **directo** a sus bornes, sin filtro ni cap de acople. ⚠️ **No lo pruebes con una resistencia** como carga falsa: la salida es un puente PWM sin filtrar y necesita la inductancia de la bobina — una carga resistiva la disipa como calor. Y **ningún borne va a GND**: la salida es diferencial (puenteada); masar uno mata el ampli.',
      rows: [
        { pin: '+', kind: 'pwr5', nm: 'Parlante IZQUIERDO', to: '→ borne + del ampli con SD → Vin' },
        { pin: '−', kind: 'gnd', nm: 'Parlante IZQUIERDO', to: '→ borne − del MISMO ampli (NO a GND común)' },
        { pin: '+', kind: 'pwr5', nm: 'Parlante DERECHO', to: '→ borne + del ampli con SD → 390k' },
        { pin: '−', kind: 'gnd', nm: 'Parlante DERECHO', to: '→ borne − del MISMO ampli (NO a GND común)' },
      ],
    },
    {
      t: '🌈 NeoPixel — 2 placas, 8 píxeles',
      group: 'led',
      cnt: 'DIN=9',
      ascii: `  GPIO9 ──[330Ω]──► DIN ┌─placa A─┐ DOUT ──► DIN ┌─placa B─┐
                        │ 0  1    │              │ 4  5    │
                        │ 2  3    │              │ 6  7    │
                        └─────────┘              └─────────┘
   RIEL 5V ──[1N400x]──► VCC de las dos (~4.35V)
   GND ─────────────────► GND de las dos

   1 solo cable de datos = 8 píxeles direccionables de a uno`,
      tip: 'Las 2 placas están **encadenadas en un solo pin** (DOUT de A → DIN de B) y eso **no** les quita independencia: cada WS2812B tiene su propio controlador y se come los primeros 24 bits que le llegan, así que los 8 píxeles se direccionan por separado (`NEOPIXEL_COUNT=8`). Efectos por zona = **software, no cableado**: pintás 0–3 con un color y 4–7 con otro. Un segundo GPIO de datos no compraría nada. En GPIO9 (ex-batería) → UART0 (43/44) queda libre p/ serial+flasheo, sin parpadeo de boot. **Feedback por botón:** encadená 1 LED por tecla en el MISMO GPIO9 (subí `NEOPIXEL_COUNT`) → RGB por tecla sin gastar pines.',
      rows: [
        { pin: '9', kind: 'neo', nm: 'DIN — placa A', to: 'GPIO9 → 330Ω en serie → DIN de la primera placa', note: '3.3V está bajo el umbral: 1N400x en serie con el VCC, o 74AHCT125' },
        { pin: '—', kind: 'neo', nm: 'DOUT A → DIN B', to: 'encadenado: la placa B sigue a la A (píxeles 4–7)', note: 'sentido único: DIN→DOUT. Al revés, la B queda muerta' },
        { pin: '5V', kind: 'pwr5', nm: 'VCC — las dos', to: '→ RIEL 5V vía 1N400x (→ ~4.35V)', note: '~60mA/LED a tope: 8 LEDs en blanco ≈ 0,5A. Limitá brillo' },
        { pin: 'GND', kind: 'gnd', nm: 'GND — las dos', to: '→ GND común' },
      ],
    },
    {
      t: '🔒 Sistema — USB / UART',
      group: 'system',
      cnt: 'no soldar',
      tip: 'Reservados: **no les sueldes nada**. GPIO19/20 son el USB nativo (el HID: si los tocás, el pad deja de gobernar la PC). GPIO43/44 son UART0 → CH343 → serial y flasheo por cable. El **BOOT (GPIO0)** y el USB-C tienen que quedar accesibles con la carcasa cerrada: es tu red si un OTA sale mal.',
      rows: [
        { pin: '19', kind: 'dim', nm: 'USB D−', to: 'USB nativo (HID) — RESERVADO' },
        { pin: '20', kind: 'dim', nm: 'USB D+', to: 'USB nativo (HID) — RESERVADO' },
        { pin: '43', kind: 'dim', nm: 'UART0 TX', to: 'serial + flasheo (CH343) — RESERVADO' },
        { pin: '44', kind: 'dim', nm: 'UART0 RX', to: 'serial + flasheo (CH343) — RESERVADO' },
        { pin: '0', kind: 'dim', nm: 'BOOT', to: 'recuperación ante OTA fallido — dejalo accesible' },
      ],
    },
    {
      t: '🔋 Batería — descartada en el pad',
      group: 'misc',
      cnt: 'GPIO9→NeoPixel',
      tip: 'No se mide en el pad: la **pantalla de la fuente** ya muestra la tensión de entrada (= las 2 celdas 2S). GPIO9 (ex-divisor) ahora maneja el NeoPixel. En firmware: `BATTERY_ENABLED=false` — **NO lo actives**: `BAT_ADC_PIN` sigue apuntando al 9 y le meterías 2.7V DC a la línea de datos del NeoPixel.',
      rows: [],
    },
    {
      t: '🧮 Presupuesto de pines',
      group: 'misc',
      cnt: 'libre: GPIO3',
      tip: 'Matriz acción 7 (2 filas + 5 cols) + 2 ALT directos + 3 I2S = 12 → usan todos los GPIO que quedaron. Sobra **exactamente un pin: el GPIO3**, y es strapping (JTAG_SEL), así que con cuidado. No usables: **26–32** (flash) y **33–37** (PSRAM octal del R8 — el DevKitC-1 ni siquiera saca 26–34 al header, y 35/36/37 están ahí pero se los come la PSRAM), 19/20 (USB nativo), 43/44 (UART0), **0/45/46** (strapping; el 0 además es el BOOT de recuperación).',
      rows: [
        { pin: '3', kind: 'io', nm: 'ÚNICO pin libre', to: 'strapping (JTAG_SEL): usable como salida, sin nada colgado al bootear' },
        { pin: '35', kind: 'dim', nm: '35 / 36 / 37', to: 'están en el header pero los usa la PSRAM octal — tocarlos = boot loop' },
        { pin: '45', kind: 'dim', nm: '0 / 45 / 46', to: 'strapping: deciden el modo de boot. 0 = BOOT, reservado' },
      ],
    },
    {
      t: '💡 ¿Un segundo pin de datos para los LEDs?',
      group: 'led',
      cnt: 'no hace falta',
      tip: 'No, y **no lo necesitás**. Las 2 placas de 4 LEDs ya son **8 píxeles direccionables de a uno** sobre GPIO9: encadenarlas no las hace dependientes, cada WS2812B tiene su propio controlador. Lo que hoy las pinta iguales es el **firmware**, no el cable — `leds::setLayerColor()` recorre `NEOPIXEL_COUNT` pintando el MISMO color en todos. Efectos por zona (placa A ≠ placa B) salen **cambiando ese loop**, sin tocar el soldador. Si igual quisieras un bus separado, el único pin libre es el **GPIO3** (strapping): gastarías tu último pin de reserva a cambio de nada.',
      rows: [],
    },
  ],

  check: [
    'Buck medido a 5.0V ANTES de conectar el S3 (≥3A: 2 amplis + NeoPixel + backlight pican ~2.9A)',
    'Buck con headroom real: a 6.0V de entrada un buck no-síncrono se cae de regulación — cortá el pack a ~7.0V',
    'Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)',
    'Cap bulk 470–1000µF en el riel 5V + 1000µF cerca de los amplis (polaridad OK)',
    'Stick y encoder al riel 3V3 (NO 5V) — verificado con multímetro',
    'Pantalla: si tiene buffer 74HC245 junto al header, su VCC va a 3V3 (si no, pantalla en blanco)',
    'SW-PANTALLA en la línea LED/BL, NUNCA cortando el VCC de la pantalla (abs-max del ILI9488)',
    'TFT: CS=10, MOSI=11, SCLK=12, DC=13, RST=14, BL=21 (verificado contra platformio.ini)',
    'TFT: el MISO/SDO NO se cablea (TFT_MISO=-1, sólo escribimos)',
    'Matriz acción: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)',
    '10 diodos (uno por botón de acción), cátodo (raya) hacia la FILA → evita ghosting (si no registra, dalos vuelta)',
    'Diodos: 1N4148 (chico) o cualquier silicio: 1N400x/1N540x sirven igual (más grandes). LEDs NO',
    'ALT1→GPIO17, ALT2→GPIO48 DIRECTOS a GND (INPUT_PULLUP), SIN diodo (fila nav)',
    'Encoder KY-040: CLK=GPIO4, DT=GPIO5, SW=GPIO6, + a 3V3 (si gira al revés, permutá CLK y DT)',
    'Stick HW-504: VRx=GPIO1, VRy=GPIO2, SW=GPIO7 — los ejes en ADC1, el único que anda con la radio prendida',
    'NeoPixel: 330Ω en serie en DIN (GPIO9) + 1N400x en el VCC de la tira (o 74AHCT125) + cap en su 5V',
    'NeoPixel: las 2 placas ENCADENADAS (DOUT de la A → DIN de la B) = 8 píxeles en un solo pin; NEOPIXEL_COUNT=8',
    'I2S: BCLK=40, LRC=41, DIN=42 cableados a AMBOS amplis (bus compartido)',
    'Ampli-L: SD→Vin, medí SD > 1,4V · Ampli-R: SD→390k a Vin, medí SD ~1,0V (ventana segura 0,83–1,24V)',
    'GAIN de cada ampli sin conectar (=9dB) · parlante 4–8Ω directo (filterless, NO lo pruebes con carga resistiva)',
    'Parlantes: cada uno a los DOS bornes de SU ampli — ningún borne va a GND (la salida es diferencial)',
    'SW-CELDAS corta BAT+ → buck',
    '1er flasheo por cable; después OTA (--upload-port hiospad.local)',
    'BOOT (GPIO0) + USB-C nativo accesibles para recuperación ante OTA fallido',
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
    'Ganancia: dejá el pin **GAIN** sin conectar (=9 dB). Ojo: el que va flotante es GAIN, **no** el SD — un SD flotante lo baja el pulldown interno a 0V y el ampli queda MUDO.',
    'Ampli **LEFT**: SD → Vin directo. Queda a 5V, muy por encima del umbral de 1,4V.',
    'Ampli **RIGHT**: R de **390kΩ** entre SD y Vin. (Fórmula del datasheet: R = 94.0 × Vdd − 100 = 370k a 5V; 390k es el valor comercial más cercano.)',
    'Encendé el riel 5V (buck ya medido a 5.0V). No hace falta que haya sonido.',
    'Multímetro en DC: punta roja a SD, negra a GND.',
    'Bandas de SD (volts absolutos): <0,16V mudo · 0,16–0,77V (L+R)/2 · 0,77–1,4V Right · >1,4V Left.',
    'LEFT tiene que dar >1,4V. RIGHT tiene que dar **~1,0V**; la ventana segura contra tolerancias es **0,83–1,24V**, no la banda nominal completa.',
    '⚠️ Si tu módulo ya trae una R de SD a Vin de fábrica (la de Adafruit trae 1M), la tuya queda en **paralelo** y el cálculo cambia: por eso se mide, no se asume. Con 1M a bordo vas a necesitar ~620–680k externos.',
    '⚠️ NO uses 220k: da 1,56V, que cae en la banda de **Left**. Los dos amplis te sacarían el mismo canal y vas a culpar al I2S.',
  ],
};
