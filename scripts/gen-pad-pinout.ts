/**
 * Genera `projects/pad/pinout.data.js` desde `config/pinouts/pad.ts`.
 *
 * POR QUÉ EXISTE ESTO
 * El visor offline del taller (`pinout.html`) y la página `/pinouts/pad` tenían el
 * MISMO pinout escrito a mano DOS veces. Divergieron. La divergencia se descubrió
 * con la placa en la mano y el soldador prendido, que es el peor momento posible.
 *
 * El self-test viejo "verificaba" comparando esas dos copias entre sí — o sea,
 * comparaba dos espejos del mismo objetivo y daba verde mientras ambos mentían
 * respecto del firmware. Ahora hay UNA fuente (`pad.ts`), este script emite la otra,
 * y el self-test falla si el archivo emitido quedó viejo.
 *
 *   npm run gen:pinout    → reescribe pinout.data.js
 *   npm run test:wiring   → falla si está desactualizado
 */
import { writeFileSync } from 'node:fs';
import { PAD_WIRING } from '../config/pinouts/pad.ts';

/** color por kind — lo usan el SVG y las clases CSS del visor offline */
const COLORS = {
  io: '#58a6ff',
  adc: '#3fb950',
  pwm: '#bc8cff',
  neo: '#ff79c6',
  mtx: '#f0883e',
  i2s: '#2dd4bf',
  spi: '#e3b341',
  i2c: '#e3b341',
  dac: '#bc8cff',
  dim: '#6e7681',
};

const OUT = new URL('../projects/pad/pinout.data.js', import.meta.url);

const HEADER = `// ============================================================================
//  pinout.data.js — HIOS PAD · datos del visor offline del taller
//
//  ⚠️ ARCHIVO AUTOGENERADO — NO EDITAR A MANO.
//  Fuente: config/pinouts/pad.ts · Regenerar: npm run gen:pinout
//
//  Si editás esto a mano, el próximo \`npm run gen:pinout\` te lo pisa y
//  \`npm run test:wiring\` falla antes.
//
//  TODOS los números son GPIO — lo que imprime la serigrafía del DevKitC-1 (IOxx),
//  NO la posición física del pin en el header. Emparejá SIEMPRE por el IOxx.
//  Autoridad del firmware = src/app/Pins.h.
// ============================================================================
`;

export function renderPinoutData(): string {
  const payload = {
    meta: {
      rev: PAD_WIRING.meta.rev,
      mcu: PAD_WIRING.meta.mcu,
      note: PAD_WIRING.meta.note,
    },
    colors: COLORS,
    modules: PAD_WIRING.modules,
    pins: PAD_WIRING.pins,
    rails: PAD_WIRING.rails,
    sections: PAD_WIRING.sections,
    check: PAD_WIRING.check,
    keymap: PAD_WIRING.keymap,
    ampSdSteps: PAD_WIRING.ampSdSteps,
    divergence: PAD_WIRING.divergence,
  };
  return `${HEADER}window.PINOUT = ${JSON.stringify(payload, null, 2)};\n`;
}

// solo escribe cuando lo corrés directo (el self-test lo importa para comparar)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  writeFileSync(OUT, renderPinoutData(), 'utf8');
  console.log(`pinout.data.js regenerado desde pad.ts (${PAD_WIRING.pins.length} pines, ${PAD_WIRING.modules.length} módulos)`);
}
