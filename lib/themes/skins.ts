/**
 * Skins: el tercer eje del sistema de temas.
 *
 * - `mode` (light/dark) y `accent` (color de marca) ya existen.
 * - Un skin es el paquete visual completo: tipografías, radios, texturas y
 *   paleta de superficie. Se implementa como overrides de las variables CSS
 *   --hios-* / --font-stack-* via el atributo `data-skin` en <html>
 *   (ver styles/globals.css) + tokens antd (ver styles/theme.ts).
 *
 * Para agregar un skin: entrada acá, bloque [data-skin='x'] en globals.css,
 * y overrides antd en getAntdTheme. El id queda whitelisted en el bootstrap
 * de app/[locale]/layout.tsx para el no-flash.
 */

export type SkinId = 'datasheet' | 'terminal' | 'blueprint';

export interface Skin {
    id: SkinId;
    label: string;
    /** Descripción corta por locale (fallback: en). */
    description: Record<string, string>;
}

export const DEFAULT_SKIN: SkinId = 'datasheet';

export const SKINS: Skin[] = [
    {
        id: 'datasheet',
        label: 'Datasheet',
        description: {
            es: 'Hoja de datos: grilla milimetrada, bordes finos, mono técnica.',
            en: 'Datasheet: graph-paper grid, hairline borders, technical mono.',
        },
    },
    {
        id: 'terminal',
        label: 'Terminal',
        description: {
            es: 'Todo mono, esquinas rectas, fósforo. Para vivir en la consola.',
            en: 'All-mono, square corners, phosphor. For console dwellers.',
        },
    },
    {
        id: 'blueprint',
        label: 'Blueprint',
        description: {
            es: 'Cianotipo: plano técnico, líneas finas sobre azul.',
            en: 'Cyanotype: technical drawing, fine lines on blue.',
        },
    },
];

export const SKIN_STORAGE_KEY = 'hios-skin';

export function isValidSkin(value: unknown): value is SkinId {
    return typeof value === 'string' && SKINS.some((skin) => skin.id === value);
}

export function readStoredSkin(): SkinId {
    if (typeof window === 'undefined') return DEFAULT_SKIN;
    try {
        const raw = window.localStorage.getItem(SKIN_STORAGE_KEY);
        if (isValidSkin(raw)) return raw;
    } catch {
        // localStorage bloqueado: seguimos con el default
    }
    return DEFAULT_SKIN;
}

export function writeStoredSkin(skin: SkinId): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {
        // no fatal
    }
}
