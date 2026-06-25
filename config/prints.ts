/**
 * Prints / Maker configuration
 * Modelos 3D propios + recomendados de la comunidad + dónde buscarlos.
 * Contenido en español (single-language-first, igual que el catálogo de tools).
 */

export interface PrintModel {
    name: string;
    author?: string;   // creditá al creador si el modelo no es tuyo
    source: string;    // Thingiverse | Printables | MakerWorld | Sitio | ...
    url: string;
    description: string;
}

// Tus piezas publicadas. Agregá tu modelo de Thingiverse (name + url reales).
// Si queda vacío, la página muestra un placeholder en vez de una sección vacía.
export const myPrints: PrintModel[] = [
    // Editá con tu modelo real (tenés el link de Thingiverse):
    // {
    //     name: 'Tapa del joystick — HIOS PAD',
    //     source: 'Thingiverse',
    //     url: 'https://www.thingiverse.com/thing:XXXXXXX',
    //     description: 'Carcasa impresa para el stick analógico del macropad.',
    // },
];

// Modelos de la comunidad que vale la pena tener a mano (links estables).
export const recommendedPrints: PrintModel[] = [
    {
        name: 'Gridfinity',
        author: 'Zack Freedman',
        source: 'Sitio',
        url: 'https://gridfinity.xyz/',
        description: 'Sistema modular para organizar cajones y escritorio. El estándar de facto para ordenar herramientas, tornillos y piezas.',
    },
];

// Dónde buscar e imprimir modelos.
export interface PrintRepo {
    name: string;
    url: string;
    description: string;
}

export const printRepos: PrintRepo[] = [
    {
        name: 'Printables',
        url: 'https://www.printables.com/',
        description: 'Repositorio de Prusa. Buena curaduría, concursos y perfiles de impresión listos.',
    },
    {
        name: 'Thingiverse',
        url: 'https://www.thingiverse.com/',
        description: 'El clásico. Catálogo histórico enorme de modelos imprimibles.',
    },
    {
        name: 'MakerWorld',
        url: 'https://makerworld.com/',
        description: 'Repositorio de Bambu Lab con print-profiles listos para imprimir.',
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
