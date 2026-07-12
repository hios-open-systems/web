import type { Breakout } from './breakout';

export const BATTERY_BREAKOUTS: Breakout[] = [
  {
    id: 'holder-2s',
    name: 'Portaceldas 18650 2S (serie)',
    kind: 'battery',
    summary: 'Dos 18650 en serie (2S). Ojo: el holder correcto es en SERIE, no en paralelo.',
    form: 'holder 2× 18650',
    voltage: '7.4V nom · 8.4V full · 6.0V vacío',
    usedBy: ['pad', 'btdac', 'speaker'],
    pins: [
      { name: '+', role: 'pwr', to: '+ del pack → B+ del cargador/BMS', side: 'left' },
      { name: '−', role: 'gnd', to: '− del pack → B− del cargador/BMS', side: 'left' },
      { name: 'mid', role: 'pwr', to: 'punto medio entre celdas → BM (balanceo)', side: 'left', req: false },
    ],
    notes: [
      {
        title: 'Serie, no paralelo',
        body: 'Para 2S las 2 celdas van **en serie** (suman tensión). Un holder en paralelo daría 3.7V, no 7.4V.',
        warn: true,
      },
      {
        title: 'Balanceo',
        body: 'Sacá el punto medio al pin BM del cargador para que las celdas carguen parejas.',
      },
    ],
  },
];
