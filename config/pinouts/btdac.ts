import type { WiringGuide } from './wiring';

export const BTDAC_WIRING: WiringGuide = {
  meta: {
    id: 'btdac',
    title: 'BTDAC',
    subtitle: 'Receptor Bluetooth con DAC PCM5102 y ESP32: A2DP → I2S → línea analógica, con LED RGB de estado.',
    rev: '2.0',
    mcu: 'ESP32-WROOM-32',
    note: 'as-wired desde el firmware (BCK=27, LRCK=14, DOUT=13). El PINOUT.md del repo ya está sincronizado con estos pines; el firmware-mirror del self-test los verifica en cada build.',
    source: 'src/HIOS_BTDAC.ino',
  },

  pins: [
    { gpio: 27, kind: 'i2s', name: 'I2S BCK', rail: null, dest: '→ BCK del PCM5102' },
    { gpio: 14, kind: 'i2s', name: 'I2S LRCK', rail: null, dest: '→ LRCK del PCM5102' },
    { gpio: 13, kind: 'i2s', name: 'I2S DOUT', rail: null, dest: '→ DIN del PCM5102' },
    { gpio: 4, kind: 'pwm', name: 'LED R', rail: null, dest: '→ 330Ω → R del KY-009' },
    { gpio: 16, kind: 'pwm', name: 'LED G', rail: null, dest: '→ 330Ω → G del KY-009' },
    { gpio: 17, kind: 'pwm', name: 'LED B', rail: null, dest: '→ 330Ω → B del KY-009' },
  ],

  rails: [
    { k: 'c5', t: '5V', c: '→ ESP32 VIN · PCM5102 VIN · del LM2596 (5.0V)' },
    { k: 'cg', t: 'GND común', c: '→ ESP32 · PCM5102 · KY-009 (cátodo) · LM2596 OUT− · BMS P−' },
  ],

  sections: [
    {
      t: '⚡ Energía',
      group: 'power',
      ascii: `2× 18650 (2S) ─► BMS/cargador USB-C ─► LM2596 (5.0V) ─► ESP32 VIN + PCM5102 VIN`,
      tip: 'Ajustá el LM2596 a **5.0V** con el multímetro antes de conectar. La pantalla del buck muestra la tensión del pack.',
      rows: [
        { pin: 'VIN', kind: 'pwr5', nm: 'ESP32 5V', to: 'del LM2596 OUT+' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa común', to: 'ESP32 + PCM5102 + KY-009 + buck' },
      ],
    },
    {
      t: '🔊 DAC — PCM5102',
      group: 'audio',
      tip: 'I2S del ESP32 → PCM5102 (breakout GY-PCM5102). **SCK del PCM5102 a GND** (genera su clock). Jumpers atrás: FLT/DEMP=L, XSMT=H, FMT=L. Salida OUT L/R al jack o ampli.',
      rows: [
        { pin: '27', kind: 'i2s', nm: 'BCK', to: '→ BCK del PCM5102' },
        { pin: '14', kind: 'i2s', nm: 'LRCK', to: '→ LRCK del PCM5102' },
        { pin: '13', kind: 'i2s', nm: 'DOUT', to: '→ DIN del PCM5102' },
        { pin: 'SCK', kind: 'i2s', nm: 'SCK del PCM5102', to: '→ **GND** (no viene del ESP32)' },
      ],
    },
    {
      t: '🌈 LED RGB — KY-009',
      group: 'misc',
      tip: 'Cátodo común (`−` a GND). Cada color por PWM vía **330Ω** (el KY-009 no trae resistencias).',
      rows: [
        { pin: '4', kind: 'pwm', nm: 'R', to: '→ 330Ω → R' },
        { pin: '16', kind: 'pwm', nm: 'G', to: '→ 330Ω → G' },
        { pin: '17', kind: 'pwm', nm: 'B', to: '→ 330Ω → B' },
      ],
    },
  ],

  check: [
    'LM2596 medido a 5.0V ANTES de conectar el ESP32/PCM5102',
    'Cap de desacople en el riel 5V (100µF + 100nF cerca del ESP32 y del PCM5102)',
    'I2S: BCK=27, LRCK=14, DOUT=13 → PCM5102',
    'PCM5102: SCK → GND (genera su clock por PLL, no recibe master clock)',
    'PCM5102: jumpers FLT=L, DEMP=L, XSMT=H, FMT=L',
    'LED KY-009: R=4 / G=16 / B=17 cada uno por 330Ω; cátodo común a GND',
    'Masa común: ESP32, PCM5102, KY-009, LM2596, BMS',
    'Sin cortocircuito entre 5V y GND antes de energizar',
  ],
};
