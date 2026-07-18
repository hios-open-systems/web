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
// ⚠️ REVISAR: los nombres y descripciones de abajo los puse yo sin ver las piezas
// físicas — ajustá lo que no cuadre. Y si querés sumar Body1/Body2 (los tenés en
// disco pero no sé qué son), copialos a public/downloads/pad/ y agregá su entrada.
export const myPrints: PrintModel[] = [
    {
        name: 'Carcasa — cuerpo',
        source: 'Propio',
        file: '/downloads/pad/box.stl',
        fileKB: 400,
        description: 'Cuerpo principal de la carcasa del HIOS PAD (aloja placa, batería y módulos). Diseño propio.',
    },
    {
        name: 'Placa frontal',
        source: 'Propio',
        file: '/downloads/pad/front_plate.stl',
        fileKB: 138,
        description: 'Frente con los recortes de las 12 teclas, el encoder y el stick. Diseño propio.',
    },
    {
        name: 'Marco de la pantalla',
        source: 'Propio',
        file: '/downloads/pad/display-case.stl',
        fileKB: 65,
        description: 'Marco/bisel para el módulo ILI9488 3.5". Diseño propio.',
    },
    {
        name: 'Marco de la pantalla — variante',
        source: 'Propio',
        file: '/downloads/pad/display-case_1.stl',
        fileKB: 164,
        description: 'Segunda versión del marco de pantalla. Diseño propio.',
    },
    {
        name: 'Tapa superior',
        source: 'Propio',
        file: '/downloads/pad/tapa-superior.stl',
        fileKB: 101,
        description: 'Tapa superior de la carcasa del HIOS PAD. Diseño propio.',
    },
    {
        // ⚠️ REVISAR: "Body1/Body2" son los nombres default de Fusion — no sé qué
        // pieza es cada uno. Poné el nombre y la descripción reales.
        name: 'Pieza — Body1',
        source: 'Propio',
        file: '/downloads/pad/Body1.stl',
        fileKB: 34,
        description: 'Pieza impresa del HIOS PAD (revisar nombre/descripción). Diseño propio.',
    },
    {
        name: 'Pieza — Body2',
        source: 'Propio',
        file: '/downloads/pad/Body2.stl',
        fileKB: 20,
        description: 'Pieza impresa del HIOS PAD (revisar nombre/descripción). Diseño propio.',
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
