import type { Breakout } from './breakout';

export const CONNECTOR_BREAKOUTS: Breakout[] = [
  {
    id: 'jack-trs',
    name: 'Jack 3.5mm TRS (estéreo)',
    kind: 'connector',
    summary: 'Conector hembra estéreo: Tip=L, Ring=R, Sleeve=GND.',
    form: 'jack hembra 3.5mm',
    iface: 'audio analógico',
    voltage: 'pasivo',
    pins: [
      { name: 'Tip', role: 'dac', alt: 'T', to: 'canal izquierdo (L)', side: 'left' },
      { name: 'Ring', role: 'dac', alt: 'R', to: 'canal derecho (R)', side: 'left' },
      { name: 'Sleeve', role: 'gnd', alt: 'S', to: 'masa / blindaje', side: 'left' },
      { name: 'SW', role: 'io', to: 'detección de inserción (opcional, no en todos)', side: 'right', req: false },
    ],
    notes: [
      { title: 'Detección', body: 'Algunos jacks agregan un contacto que abre/cierra al insertar el plug.' },
    ],
  },
  {
    id: 'plug-trrs',
    name: 'Plug 3.5mm TRRS (CTIA)',
    kind: 'connector',
    summary: 'Conector macho con micrófono, estándar CTIA (celulares modernos).',
    form: 'plug macho 3.5mm',
    iface: 'audio analógico',
    voltage: 'pasivo',
    pins: [
      { name: 'Tip', role: 'dac', alt: 'T', to: 'canal izquierdo (L)', side: 'left' },
      { name: 'Ring 1', role: 'dac', alt: 'R1', to: 'canal derecho (R)', side: 'left' },
      { name: 'Ring 2', role: 'gnd', alt: 'R2', to: 'masa (en CTIA)', side: 'left' },
      { name: 'Sleeve', role: 'adc', alt: 'S', to: 'micrófono (en CTIA)', side: 'left' },
    ],
    notes: [
      {
        title: 'CTIA vs OMTP',
        body: 'En CTIA: Ring2=GND, Sleeve=MIC. En OMTP se invierten. Si el mic no anda, puede ser el estándar.',
      },
    ],
  },
];
