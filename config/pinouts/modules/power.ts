import type { Breakout } from './breakout';

export const POWER_BREAKOUTS: Breakout[] = [
  {
    id: 'lm2596',
    name: 'LM2596 buck (step-down)',
    kind: 'power',
    summary: 'Regulador DC-DC reductor ajustable. La corriente útil depende del módulo y de su refrigeración.',
    form: 'módulo LM2596',
    iface: 'DC-DC',
    voltage: '4.5–40V in → 1.2–37V out',
    usedBy: ['pad', 'btdac', 'speaker'],
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/lm2596.pdf',
    pins: [
      { name: 'IN+', role: 'pwr', to: 'del cargador/BMS P+ (debe superar la salida en ~1.5V)', side: 'left' },
      { name: 'IN−', role: 'gnd', to: 'del cargador/BMS P−', side: 'left' },
      { name: 'OUT+', role: 'pwr5', to: 'riel 5V (ajustar con el pote a 5.0V)', side: 'right' },
      { name: 'OUT−', role: 'gnd', to: 'masa común (misma que IN−)', side: 'right' },
    ],
    notes: [
      {
        title: 'Ajustar ANTES de conectar carga',
        body: 'Girá el pote y **medí OUT+ con el multímetro hasta 5.0V** antes de enchufar el ESP32/amplis. Los 3A del chip no garantizan 3A continuos en cualquier módulo: comprobá temperatura, caída de tensión y corriente con tu carga.',
        warn: true,
      },
      { title: 'Masa no aislada', body: 'IN− y OUT− son la misma masa; no aísla entrada de salida.' },
    ],
  },
  {
    id: 'charger-2s',
    name: 'Cargador / BMS 2S USB-C',
    kind: 'power',
    summary: 'Referencia de conexiones para módulos 2S. Carga, balanceo y protección dependen del modelo concreto.',
    form: 'módulo 2S USB-C',
    iface: 'carga + BMS',
    voltage: '8.4V full (2S); corriente según módulo',
    usedBy: ['pad', 'btdac', 'speaker'],
    pins: [
      { name: 'B+', role: 'pwr', to: '+ del pack (celda superior)', side: 'left' },
      { name: 'BM', role: 'pwr', to: 'punto medio entre celdas (balanceo)', side: 'left' },
      { name: 'B−', role: 'gnd', to: '− del pack (celda inferior)', side: 'left' },
      { name: 'P+', role: 'pwr', to: 'salida a la carga → IN+ del buck (vía SW-CELDAS)', side: 'right' },
      { name: 'P−', role: 'gnd', to: 'salida a la carga → IN− del buck', side: 'right' },
    ],
    notes: [
      {
        title: '2S = serie',
        body: 'B+/BM/B− van a las 2 celdas **en serie** (2S, 6.0–8.4V). El BM (balance) es imprescindible para cargar parejo.',
      },
      {
        title: 'Salida',
        body: 'P+/P− son los terminales de carga del módulo representado. No todos los BMS incluyen cargador, balanceo ni gestión de carga simultánea: verificá esas funciones en la documentación de tu modelo. USB-C por sí solo no las garantiza.',
      },
    ],
  },
];
