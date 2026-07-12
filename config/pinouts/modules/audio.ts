import type { Breakout } from './breakout';

export const AUDIO_BREAKOUTS: Breakout[] = [
  {
    id: 'max98357a',
    name: 'MAX98357A',
    kind: 'amp',
    summary: 'Amplificador Class-D I2S mono 3.2W (breakout). 2 en paralelo = stereo.',
    form: 'breakout ~14 × 16 mm',
    iface: 'I2S',
    voltage: '2.5–5.5V (5V ≈ 3.2W @ 4Ω)',
    usedBy: ['speaker', 'pad'],
    datasheetUrl:
      'https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf',
    pins: [
      { name: 'LRC', role: 'i2s', alt: 'WS', to: 'word-select del MCU (bus, a ambos amplis)', side: 'left' },
      { name: 'BCLK', role: 'i2s', to: 'bit-clock del MCU (bus)', side: 'left' },
      { name: 'DIN', role: 'i2s', to: 'dato serial del MCU (bus)', side: 'left' },
      { name: 'GAIN', role: 'io', to: 'ganancia (ver tabla). Flotante = 9 dB', side: 'left' },
      { name: 'SD', role: 'io', to: 'shutdown + selección de canal (ver tabla)', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'right' },
      { name: 'Vin', role: 'pwr5', to: '2.5–5.5V (5V para 3.2W)', side: 'right' },
      { name: 'SPK+', role: 'pwr', to: 'parlante 4–8Ω (directo, filterless)', side: 'right' },
      {
        name: 'SPK−',
        role: 'pwr',
        to: 'parlante 4–8Ω',
        side: 'right',
        note: 'salida en puente (BTL): NINGUNA salida va a GND',
      },
    ],
    gain: {
      head: ['Conexión de GAIN', 'Ganancia'],
      rows: [
        ['flotante (sin conectar)', '9 dB'],
        ['directo a GND', '12 dB'],
        ['directo a Vin', '6 dB'],
        ['100k a GND', '15 dB'],
        ['100k a Vin', '3 dB'],
      ],
    },
    channel: {
      head: ['Tensión en SD (medí a GND)', 'Salida'],
      rows: [
        ['< 0,16 V', 'apagado (shutdown)'],
        ['0,16 – 0,77 V', '(L+R)/2 mono'],
        ['0,77 – 1,4 V', 'Right'],
        ['> 1,4 V', 'Left'],
      ],
    },
    notes: [
      {
        title: 'Stereo con 2 módulos',
        body: 'Los 2 amplis cuelgan de las **mismas** 3 líneas I2S (BCLK/LRC/DIN). El canal L/R lo fija el pin **SD** de cada uno, no un cable distinto.',
      },
      {
        title: 'Elegir el canal (medir SD)',
        body: 'Poné la R de SD→Vin y medí SD–GND: **>1,4V = Left**, 0,77–1,4V = Right. Left: SD→Vin directo; Right: SD→Vin por ~220–330k.',
      },
      {
        title: 'Salida',
        body: 'Parlante 4–8Ω directo a SPK+/SPK− (Class-D filterless). No conectar ninguna salida a GND.',
      },
    ],
  },
  {
    id: 'pcm5102',
    name: 'PCM5102A DAC',
    kind: 'dac',
    summary: 'DAC I2S 32-bit/384kHz (breakout GY-PCM5102). Salida de línea L/R.',
    form: 'breakout GY-PCM5102',
    iface: 'I2S',
    voltage: '3.3–5V (regulador a bordo)',
    usedBy: ['btdac'],
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/pcm5102a.pdf',
    pins: [
      { name: 'VIN', role: 'pwr5', to: '5V (el regulador del módulo baja a 3.3V)', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      {
        name: 'SCK',
        role: 'i2s',
        to: '→ GND',
        side: 'left',
        note: 'a GND: el PCM5102 genera su clock por PLL (sin master clock del MCU)',
      },
      { name: 'BCK', role: 'i2s', to: 'bit-clock del MCU', side: 'left' },
      { name: 'DIN', role: 'i2s', to: 'dato serial del MCU', side: 'left' },
      { name: 'LRCK', role: 'i2s', alt: 'LCK', to: 'word-select del MCU', side: 'left' },
      { name: '3.3V', role: 'nc', to: 'salida del regulador — NO conectar', side: 'left', req: false },
      { name: 'OUT L', role: 'dac', to: 'línea izquierda → ampli / jack', side: 'right' },
      { name: 'OUT R', role: 'dac', to: 'línea derecha → ampli / jack', side: 'right' },
      { name: 'AGND', role: 'gnd', to: 'masa analógica de la salida', side: 'right' },
    ],
    jumpers: {
      head: ['Jumper (cara de atrás)', 'Estado'],
      rows: [
        ['FLT (filtro)', 'L = normal / baja latencia'],
        ['DEMP (de-énfasis)', 'L = off'],
        ['XSMT (soft-mute)', 'H = sonido ON (auto-mute off)'],
        ['FMT (formato)', 'L = I2S estándar'],
      ],
    },
    notes: [
      {
        title: 'SCK a GND',
        body: 'El breakout no recibe master clock del ESP32: puenteá **SCK a GND** para que el PCM5102 genere el suyo por PLL.',
      },
      {
        title: 'Jumpers',
        body: 'En la cara de atrás. Con los 4 en su estado default el DAC arranca sonando en I2S estándar.',
      },
    ],
  },
];
