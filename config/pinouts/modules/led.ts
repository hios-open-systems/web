import type { Breakout } from './breakout';

export const LED_BREAKOUTS: Breakout[] = [
  {
    id: 'ws2812',
    name: 'Tira WS2812 / SK6812 (NeoPixel)',
    kind: 'led',
    summary: 'LEDs RGB direccionables encadenados: toda la tira usa 1 pin de datos.',
    form: 'tira / anillo',
    iface: '1-wire (800 kHz)',
    voltage: '5V',
    usedBy: ['pad'],
    datasheetUrl: 'https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf',
    pins: [
      { name: 'DIN', role: 'neo', to: 'datos del MCU, vía **330Ω** en serie', side: 'left' },
      { name: '5V', role: 'pwr5', alt: 'VCC', to: '5V (≈60 mA/LED a blanco pleno)', side: 'left' },
      { name: 'GND', role: 'gnd', to: 'masa común con el MCU', side: 'left' },
      { name: 'DOUT', role: 'neo', to: 'al DIN del siguiente LED (encadenado)', side: 'right' },
    ],
    notes: [
      {
        title: 'Nivel 3.3 → 5V',
        body: 'El S3 saca datos a 3.3V y el WS2812 quiere ~3.5V para un "1": marginal. Solución: **level-shifter 74AHCT125**, o usar **SK6812** (más tolerante), o alimentar la tira a ~4.0–4.3V.',
      },
      {
        title: 'Alimentación',
        body: '330Ω en serie en DIN + cap 470–1000µF en el 5V de la tira. Limitá el brillo (cuidá el buck).',
      },
    ],
  },
  {
    id: 'ky-009',
    name: 'KY-009 LED RGB (SMD)',
    kind: 'led',
    summary: 'LED RGB de cátodo común. SIN resistencias a bordo.',
    form: 'módulo KY-009',
    iface: 'PWM ×3',
    voltage: '3.3–5V',
    usedBy: ['btdac'],
    pins: [
      { name: 'R', role: 'pwm', to: '→ 330Ω → GPIO (PWM)', side: 'left' },
      { name: 'G', role: 'pwm', to: '→ 330Ω → GPIO (PWM)', side: 'left' },
      { name: 'B', role: 'pwm', to: '→ 330Ω → GPIO (PWM)', side: 'left' },
      { name: '−', role: 'gnd', to: 'cátodo común → GND', side: 'right' },
    ],
    notes: [
      {
        title: 'Sin resistencias',
        body: 'El módulo NO trae resistencias: poné **330Ω en serie** en cada color o quemás el LED.',
        warn: true,
      },
      { title: 'Cátodo común', body: 'El pin `−` es común a GND; los colores se manejan por PWM en alto.' },
    ],
  },
];
