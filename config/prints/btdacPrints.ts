import type { PrintModel } from '../prints.ts';

export const btdacPrints: PrintModel[] = [
  {
    name: 'Gabinete — base',
    source: 'Propio',
    file: '/downloads/btdac/btdac-enclosure-base.stl',
    fileKB: 6,
    project: 'btdac',
    category: 'carcasa',
    description: 'Caja inferior con postes de montaje y separador para el pack de batería 2S (105×65×26 mm). Diseño propio.',
  },
  {
    name: 'Tapa superior con bisel LED',
    source: 'Propio',
    file: '/downloads/btdac/btdac-enclosure-lid.stl',
    fileKB: 4,
    project: 'btdac',
    category: 'carcasa',
    description: 'Tapa superior con reborde interno a presión y apertura para el LED RGB indicador de estado (105×65×3 mm). Diseño propio.',
  },
  {
    name: 'Bandeja de montaje PCM5102',
    source: 'Propio',
    file: '/downloads/btdac/btdac-pcm5102-mount.stl',
    fileKB: 3,
    project: 'btdac',
    category: 'soporte',
    description: 'Bandeja soporte para fijar el módulo DAC PCM5102 y aislar los pines soldados (46×32×6 mm). Diseño propio.',
  },
];
