/**
 * Prints / Maker configuration
 * Modelos 3D propios + recomendados de la comunidad + dónde buscarlos.
 * Contenido en español (single-language-first, igual que el catálogo de tools).
 */

export interface PrintModel {
    name: string;
    author?: string;   // creditá al creador si el modelo no es tuyo
    source: string;    // Thingiverse | Printables | MakerWorld | Sitio | Propio | ...
    /** link externo (Thingiverse/etc). Opcional si el modelo se sirve local con `file`. */
    url?: string;
    description: string;
    /**
     * Ruta a un .stl servido desde public/ (ej '/downloads/pad/box.stl'). Si está,
     * la card ofrece VISOR 3D navegable + descarga directa, todo del lado del cliente
     * (el browser baja el STL y lo renderiza por WebGL; el server no hace nada).
     */
    file?: string;
    /** KB del archivo, solo para mostrar "descargar (400 KB)". Cosmético. */
    fileKB?: number;
}

// Tus piezas publicadas. Las que tienen `file` muestran visor 3D + descarga.
// Si queda vacío, la página muestra un placeholder en vez de una sección vacía.
//
// Nombres/descripciones basados en la GEOMETRÍA de cada malla (dimensiones + forma
// renderizada), no en función confirmada: describen lo que la pieza ES, no para qué
// va. Si alguna cumple un rol específico (p.ej. a qué se atornilla un soporte),
// afiná su description acá.
export const myPrints: PrintModel[] = [
    {
        name: 'Carcasa — paredes',
        source: 'Propio',
        file: '/downloads/pad/box.stl',
        fileKB: 400,
        description: 'Marco perimetral (paredes) de la carcasa, 110×160×30 mm, con ventilación en panal en dos caras. Diseño propio.',
    },
    {
        name: 'Tapa superior — cara de teclas',
        source: 'Propio',
        file: '/downloads/pad/tapa-superior.stl',
        fileKB: 101,
        description: 'Placa superior con los recortes cuadrados de las teclas, 110×160 mm × 2.5 mm de espesor. Diseño propio.',
    },
    {
        name: 'Placa perforada',
        source: 'Propio',
        file: '/downloads/pad/front_plate.stl',
        fileKB: 138,
        description: 'Placa fina con una grilla de agujeros redondos, 110×160 mm × 2.5 mm. Diseño propio.',
    },
    {
        name: 'Marco de la pantalla',
        source: 'Propio',
        file: '/downloads/pad/display-case.stl',
        fileKB: 65,
        description: 'Marco / bisel cerrado para el módulo de pantalla ILI9488 3.5", 110×61 mm. Diseño propio.',
    },
    {
        name: 'Retén de pantalla — marco en U',
        source: 'Propio',
        file: '/downloads/pad/display-case_1.stl',
        fileKB: 164,
        description: 'Marco abierto en U (retén de la pantalla), 110×61 mm × 5 mm. Variante del bisel. Diseño propio.',
    },
    {
        name: 'Soporte en L — agujero redondo',
        source: 'Propio',
        file: '/downloads/pad/Body1.stl',
        fileKB: 34,
        description: 'Escuadra en L con un agujero redondo y dos tornillos en la base, 30×34×18 mm. Diseño propio.',
    },
    {
        name: 'Soporte en L — agujero cuadrado',
        source: 'Propio',
        file: '/downloads/pad/Body2.stl',
        fileKB: 20,
        description: 'Escuadra en L con un agujero cuadrado — variante del soporte anterior, 30×34×18 mm. Diseño propio.',
    },
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
