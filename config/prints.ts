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
    /** Slug del proyecto de hardware al que pertenece la pieza (ej 'pad'). */
    project?: string;
    /** Categoría de la pieza dentro del proyecto (ej 'carcasa', 'soporte', 'knob'). */
    category?: string;
}

/** Metadata de presentación por proyecto para agrupar piezas en /prints. */
export interface PrintProjectMeta {
    /** Nombre visible del proyecto (ej 'HIOS PAD'). */
    name: string;
    /** Una línea corta de contexto para el encabezado del grupo. */
    blurb: string;
}

export const printProjectMeta: Record<string, PrintProjectMeta> = {
    pad: {
        name: 'HIOS PAD',
        blurb: 'Carcasa, tapas y soportes del macropad ESP32-S3 con pantalla, encoder y joystick. A futuro: knobs para el encoder y sticks.',
    },
};

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
        project: 'pad',
        category: 'carcasa',
        description: 'Marco perimetral (paredes) de la carcasa, 110×160×30 mm, con ventilación en panal en dos caras. Diseño propio.',
    },
    {
        name: 'Tapa superior — cara de teclas',
        source: 'Propio',
        file: '/downloads/pad/tapa-superior.stl',
        fileKB: 101,
        project: 'pad',
        category: 'carcasa',
        description: 'Placa superior con los recortes cuadrados de las teclas, 110×160 mm × 2.5 mm de espesor. Diseño propio.',
    },
    {
        name: 'Placa perforada',
        source: 'Propio',
        file: '/downloads/pad/front_plate.stl',
        fileKB: 138,
        project: 'pad',
        category: 'carcasa',
        description: 'Placa fina con una grilla de agujeros redondos, 110×160 mm × 2.5 mm. Diseño propio.',
    },
    {
        name: 'Marco de la pantalla',
        source: 'Propio',
        file: '/downloads/pad/display-case.stl',
        fileKB: 65,
        project: 'pad',
        category: 'carcasa',
        description: 'Marco / bisel legado para un módulo ILI9488 de 110×61 mm identificado como 3.5". No asumir compatibilidad con la pantalla 4" del PAD rev 0.9 sin comparar medidas.',
    },
    {
        name: 'Retén de pantalla — marco en U',
        source: 'Propio',
        file: '/downloads/pad/display-case_1.stl',
        fileKB: 164,
        project: 'pad',
        category: 'carcasa',
        description: 'Marco abierto en U legado, 110×61 mm × 5 mm. No asumir compatibilidad con la pantalla 4" del PAD rev 0.9 sin comparar medidas.',
    },
    {
        name: 'Soporte en L — agujero redondo',
        source: 'Propio',
        file: '/downloads/pad/Body1.stl',
        fileKB: 34,
        project: 'pad',
        category: 'soporte',
        description: 'Escuadra en L con un agujero redondo y dos tornillos en la base, 30×34×18 mm. Diseño propio.',
    },
    {
        name: 'Soporte en L — agujero cuadrado',
        source: 'Propio',
        file: '/downloads/pad/Body2.stl',
        fileKB: 20,
        project: 'pad',
        category: 'soporte',
        description: 'Escuadra en L con un agujero cuadrado — variante del soporte anterior, 30×34×18 mm. Diseño propio.',
    },
];

/** Piezas propias que pertenecen a un proyecto de hardware (por slug, ej 'pad'). */
export function getPrintsByProject(slug: string): PrintModel[] {
    return myPrints.filter((m) => m.project === slug);
}

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
