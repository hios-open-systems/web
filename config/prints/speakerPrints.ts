import type { PrintModel } from '../prints.ts';

export const speakerPrints: PrintModel[] = [
  {
    name: 'Gabinete acústico estéreo',
    source: 'Propio',
    file: '/downloads/speaker/speaker-cabinet-base.stl',
    fileKB: 5,
    project: 'speaker',
    category: 'carcasa',
    description: 'Cuerpo del parlante con tabique divisorio acústico entre canales izquierdo y derecho (135×75×60 mm). Diseño propio.',
  },
  {
    name: 'Bafle frontal — doble parlante y LCD',
    source: 'Propio',
    file: '/downloads/speaker/speaker-front-baffle.stl',
    fileKB: 21,
    project: 'speaker',
    category: 'carcasa',
    description: 'Panel frontal con rejillas circulares para parlantes de 40 mm y marco para display LCD 16×2 (135×75×4 mm). Diseño propio.',
  },
  {
    name: 'Tapa posterior para puertos',
    source: 'Propio',
    file: '/downloads/speaker/speaker-back-plate.stl',
    fileKB: 2,
    project: 'speaker',
    category: 'carcasa',
    description: 'Panel trasero con aberturas para conector de carga USB-C y switch de alimentación general (135×75×3 mm). Diseño propio.',
  },
];
