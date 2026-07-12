import type { Breakout } from './breakout';

export const INPUT_BREAKOUTS: Breakout[] = [
  {
    id: 'ky-040',
    name: 'KY-040 encoder rotativo',
    kind: 'input',
    summary: 'Encoder incremental con pulsador. Pull-ups a bordo.',
    form: 'módulo KY-040',
    iface: 'GPIO (cuadratura)',
    voltage: '3.3–5V',
    usedBy: ['pad'],
    pins: [
      { name: 'CLK', role: 'io', alt: 'A', to: 'canal A (interrupción)', side: 'left' },
      { name: 'DT', role: 'io', alt: 'B', to: 'canal B (interrupción)', side: 'left' },
      { name: 'SW', role: 'io', to: 'pulsador → INPUT_PULLUP', side: 'left' },
      { name: '+', role: 'pwr33', to: '3V3 (sus pull-ups fijan el nivel de salida)', side: 'right' },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'right' },
    ],
    notes: [
      {
        title: 'Alimentar a 3V3 en el S3',
        body: 'El módulo trae pull-ups: si lo alimentás a 5V, mete 5V en los GPIO del ESP32-S3. Usá **3V3**.',
      },
      { title: 'Lectura', body: 'CLK/DT en cuadratura; SW con `INPUT_PULLUP` (activo en bajo).' },
    ],
  },
  {
    id: 'hw-504',
    name: 'HW-504 joystick analógico',
    kind: 'input',
    summary: 'Joystick tipo PlayStation: 2 ejes analógicos + pulsador.',
    form: 'módulo HW-504',
    iface: 'ADC + GPIO',
    voltage: '3.3V (¡no 5V!)',
    usedBy: ['pad'],
    pins: [
      {
        name: '+5V',
        role: 'pwr33',
        to: '**3V3, NO 5V**',
        side: 'left',
        note: 'a 5V sobre-volta el ADC del S3 y acopla los ejes (diagonal)',
      },
      { name: 'GND', role: 'gnd', to: 'masa común', side: 'left' },
      { name: 'VRx', role: 'adc', to: 'eje X → ADC1', side: 'left' },
      { name: 'VRy', role: 'adc', to: 'eje Y → ADC1', side: 'left' },
      { name: 'SW', role: 'io', to: 'pulsador → INPUT_PULLUP', side: 'left' },
    ],
    notes: [
      {
        title: 'Alimentar a 3V3',
        body: 'El pin dice "+5V" pero en el ESP32-S3 va a **3V3**. A 5V el wiper sobre-volta los pines ADC → conduce el diodo de protección y acopla los dos ejes.',
        warn: true,
      },
    ],
  },
];
