import type { WiringGuide } from './wiring';

export const SPEAKER_WIRING: WiringGuide = {
  meta: {
    id: 'speaker',
    title: 'WiFi Speaker',
    subtitle: 'Parlante ESP32 con 2× MAX98357 I2S en stereo, LCD 16×2 I2C y batería 2S.',
    rev: '1.0',
    mcu: 'ESP32-WROOM-32',
    note: 'as-wired desde el firmware. ⚠️ la convención SD del PINOUT.md (1MΩ→GND=Left) es datasheet-dudosa; acá el método confiable es MEDIR SD.',
    source: 'src/main.ino',
  },

  pins: [
    { gpio: 25, kind: 'i2s', name: 'I2S DOUT', rail: null, dest: '→ DIN de AMBOS MAX98357 (bus)' },
    { gpio: 26, kind: 'i2s', name: 'I2S BCLK', rail: null, dest: '→ BCLK de ambos amplis' },
    { gpio: 27, kind: 'i2s', name: 'I2S LRC', rail: null, dest: '→ LRC de ambos amplis' },
    { gpio: 21, kind: 'i2c', name: 'I2C SDA', rail: null, dest: '→ SDA del LCD 16×2 (0x27)' },
    { gpio: 22, kind: 'i2c', name: 'I2C SCL', rail: null, dest: '→ SCL del LCD' },
    { gpio: 34, kind: 'adc', name: 'VBAT ADC', rail: null, dest: 'divisor 100k/100k del pack (×2) — solo lectura', note: 'IO34 es input-only' },
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
      tip: 'Con parlantes el pico de corriente sube: buck **≥2–3A** + cap generoso. VBAT se lee por divisor 100k/100k en IO34.',
      rows: [
        { pin: 'VIN', kind: 'pwr5', nm: 'ESP32 5V', to: 'del LM2596 OUT+' },
        { pin: '34', kind: 'adc', nm: 'VBAT (lectura)', to: 'divisor 100k/100k del pack (×2)' },
        { pin: 'GND', kind: 'gnd', nm: 'Masa común', to: 'todo junto' },
      ],
    },
    {
      t: '📟 LCD 16×2 (I2C)',
      group: 'misc',
      tip: 'Backpack PCF8574 en **0x27** (a veces 0x3F). VCC a 5V, contraste con el pote de atrás.',
      rows: [
        { pin: '21', kind: 'i2c', nm: 'SDA', to: '→ SDA del LCD' },
        { pin: '22', kind: 'i2c', nm: 'SCL', to: '→ SCL del LCD' },
      ],
    },
  ],

  check: [
    'LM2596 medido a 5.0V (≥2–3A por los parlantes) antes de conectar',
    'I2S: DOUT=25, BCLK=26, LRC=27 → AMBOS MAX98357 (bus compartido)',
    'Canal L/R por pin SD de cada ampli — MEDIR SD (>1,4V=Left, 0,77–1,4V=Right)',
    'GAIN flotante = 9 dB · parlante 4–8Ω directo (filterless)',
    'LCD I2C en SDA=21 / SCL=22, dirección 0x27',
    'VBAT: divisor 100k/100k a IO34 (input-only)',
    'Masa común: ESP32, amplis, LCD, buck, BMS',
  ],

  ampSdSteps: [
    'GAIN flotante (9 dB): dejá SD sin conectar al arrancar.',
    'Ampli LEFT: SD → Vin directo (medí SD > 1,4V).',
    'Ampli RIGHT: SD → Vin por ~220–330k (medí SD 0,77–1,4V).',
    'Encendé el 5V (LM2596 ya medido a 5.0V).',
    'Multímetro en DC, SD a GND. Bandas: <0,16V mudo · 0,16–0,77V (L+R)/2 · 0,77–1,4V Right · >1,4V Left.',
    'Fijá la R y repetí en el otro módulo. (El PINOUT.md dice 1MΩ→GND=Left; preferí este método medido.)',
  ],
};
