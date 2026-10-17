/**
 * Prints / Maker configuration
 * Modelos 3D propios + recomendados de la comunidad + dónde buscarlos.
 * Contenido en español (single-language-first, igual que el catálogo de tools).
 */

import { padPrints } from './prints/padPrints.ts';
import { btdacPrints } from './prints/btdacPrints.ts';
import { speakerPrints } from './prints/speakerPrints.ts';

export interface PrintModel {
    name: string;
    author?: string;
    source: string;
    url?: string;
    description: string;
    file?: string;
    fileKB?: number;
    project?: string;
    category?: string;
}

export interface PrintProjectMeta {
    name: string;
    blurb: string;
}

export const printProjectMeta: Record<string, PrintProjectMeta> = {
    pad: {
        name: 'HIOS PAD',
        blurb: 'Carcasa, tapas y soportes del HIOS PAD. Compará las medidas con la revisión de tu montaje antes de imprimir.',
    },
    btdac: {
        name: 'HIOS BTDAC',
        blurb: 'Gabinete compacto, bandeja para PCM5102 y tapa con bisel para el LED RGB del receptor Bluetooth.',
    },
    speaker: {
        name: 'HIOS Speaker',
        blurb: 'Gabinete acústico estéreo, bafle frontal para doble parlante y marco para display LCD 16×2.',
    },
};

export const myPrints: PrintModel[] = [
    ...padPrints,
    ...btdacPrints,
    ...speakerPrints,
];

export function getPrintsByProject(slug: string): PrintModel[] {
    return myPrints.filter((m) => m.project === slug);
}

export const recommendedPrints: PrintModel[] = [
    {
        name: 'Gridfinity',
        author: 'Zack Freedman',
        source: 'Sitio',
        url: 'https://gridfinity.xyz/',
        description: 'Sistema modular de recipientes y bases para organizar herramientas, tornillos y piezas.',
    },
];

export interface PrintRepo {
    name: string;
    url: string;
    description: string;
}

export const printRepos: PrintRepo[] = [
    {
        name: 'Printables',
        url: 'https://www.printables.com/',
        description: 'Repositorio de Prusa con modelos y perfiles de impresión compartidos por la comunidad.',
    },
    {
        name: 'Thingiverse',
        url: 'https://www.thingiverse.com/',
        description: 'Catálogo de modelos 3D publicados por la comunidad.',
    },
    {
        name: 'MakerWorld',
        url: 'https://makerworld.com/',
        description: 'Repositorio de Bambu Lab con modelos y perfiles de impresión.',
    },
    {
        name: 'Thangs',
        url: 'https://thangs.com/',
        description: 'Buscador de modelos 3D con búsqueda geométrica entre múltiples fuentes.',
    },
    {
        name: 'Cults3D',
        url: 'https://cults3d.com/',
        description: 'Marketplace con modelos gratis y de pago, con foco en diseño.',
    },
];
