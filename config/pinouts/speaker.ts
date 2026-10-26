import type { WiringGuide } from './wiring';

export const SPEAKER_WIRING: WiringGuide = {
  meta: {
    id: 'speaker',
    title: 'WiFi Speaker',
    subtitle: 'Parlante ESP32 con 2× MAX98357 I2S en stereo, LCD 16×2 I2C y batería 2S.',
    rev: '1.0',
    mcu: 'ESP32-WROOM-32',
    note: 'Referencia del cableado del firmware. Verificá SD para elegir el canal. VBAT usa un divisor 270k/100k: 8.4V llegan como 2.27V a GPIO34.',
    source: 'src/main.ino',
  },

  modules: [
    {
      id: 'power',
      name: 'Energía',
      icon: '⚡',
      rail: null,
      power: 'pack 2S → BMS → LM2596 a 5.0V → riel 5V',
      step: 1,
      tip: 'Buck ≥2–3A: los dos amplis a full pican fuerte.',
    },
    {
      id: 'audio',
      name: '2× MAX98357 (I2S)',
      icon: '🔊',
      rail: 5,
      power: 'Vin → 5V · GND → GND',
      step: 2,
      tip: 'Bus I2S compartido: los 3 pines van a los dos amplis. El canal lo elige el pin SD de cada uno — **medilo**, no lo asumas.',
    },
    {
      id: 'lcd',
      name: 'LCD 16×2 (I2C)',
      icon: '🖥️',
      rail: 5,
      power: 'VCC → 5V · GND → GND',
      step: 3,
      tip: 'Backpack PCF8574 en 0x27. Revisá la tensión de los pull-ups: las señales I2C del ESP32 no deben quedar a 5V.',
    },
    {
      id: 'battery',
      name: 'Medición de batería',
      icon: '🔋',
      rail: null,
      power: 'pack 2S → 270k → GPIO34 → 100k → GND · 100nF de GPIO34 a GND',
      step: 4,
    },
  ],

  pins: [
    { gpio: 25, kind: 'i2s', name: 'I2S DOUT', mod: 'audio', dest: '→ DIN de AMBOS MAX98357 (bus)' },
    { gpio: 26, kind: 'i2s', name: 'I2S BCLK', mod: 'audio', dest: '→ BCLK de ambos amplis' },
    { gpio: 27, kind: 'i2s', name: 'I2S LRC', mod: 'audio', dest: '→ LRC de ambos amplis' },
    { gpio: 21, kind: 'i2c', name: 'I2C SDA', mod: 'lcd', dest: '→ SDA del LCD 16×2 (0x27)' },
    { gpio: 22, kind: 'i2c', name: 'I2C SCL', mod: 'lcd', dest: '→ SCL del LCD' },
    { gpio: 34, kind: 'adc', name: 'VBAT ADC', mod: 'battery', dest: '← punto medio del divisor 270k/100k (×3.7): 8.4V → 2.27V, 6.0V → 1.62V', note: 'GPIO34 es solo entrada. Con 270k/100k queda dentro del rango recomendado del ADC a 11 dB (≤2.45V).' },
  ],

  rails: [
    { k: 'c5', t: '5V', c: '→ ESP32 VIN · 2× MAX98357 Vin · LCD VCC · del LM2596 (buck ≥2–3A)' },
    { k: 'cg', t: 'GND común', c: '→ ESP32 · amplis · LCD · buck · BMS (1 sola masa)' },
  ],

  sections: [
    {
      t: '⚡ Energía',
      group: 'power',
      ascii: `2× 18650 (2S) ─► BMS/cargador USB-C ─► LM2596 (5.0V, ≥2–3A) ─► ESP32 VIN + 2× ampli Vin + LCD`,
      tip: 'Los parlantes aumentan el pico: buck **≥2–3A** y capacitor de reserva. Divisor de batería **270k (arriba) / 100k (abajo)** + **100nF** de GPIO34 a GND: 8.4V → 2.27V, dentro del rango recomendado del ADC a 11 dB. El firmware escala ×3.7 (`VBAT_MULT`).',
      rows: [
        { pin: 'VIN', kind: 'pwr5', nm: 'ESP32 5V', to: 'del LM2596 OUT+' },
        { pin: '34', kind: 'adc', nm: 'VBAT', to: 'pack+ → 270k → GPIO34 → 100k → GND · 100nF a GND' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa común', to: 'todo junto' },
      ],
    },
    {
      t: '📟 LCD 16×2 (I2C)',
      group: 'misc',
      tip: 'Backpack PCF8574 en **0x27** (a veces 0x3F). VCC a 5V; contraste con el potenciómetro trasero. Revisá los pull-ups: si SDA/SCL suben a 5V, usá conversión de nivel I2C adecuada; no conectes lógica de 5V directamente al ESP32.',
      rows: [
        { pin: '21', kind: 'i2c', nm: 'SDA', to: '→ SDA del LCD' },
        { pin: '22', kind: 'i2c', nm: 'SCL', to: '→ SCL del LCD' },
      ],
    },
  ],

  check: [
    'LM2596 medido a 5.0V (≥2–3A por los parlantes) antes de conectar',
    'I2S: DOUT=25, BCLK=26, LRC=27 → AMBOS MAX98357 (bus compartido)',
    'MEDÍ cada pin SD. Usá el cálculo de SD y las ventanas garantizadas de cada canal, incluyendo el pull-up de la placa si existe.',
    'GAIN flotante = 9 dB · parlante 4–8Ω directo (filterless)',
    'LCD I2C: SDA=21 / SCL=22, dirección 0x27; verificá niveles lógicos seguros antes de conectar',
    'VBAT: divisor 270k/100k + 100nF; GPIO34 mide ≤2.3V con el pack cargado (8.4V)',
    'Masa común: ESP32, amplis, LCD, buck, BMS',
  ],

  ampSd: true,
};
