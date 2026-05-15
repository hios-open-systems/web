/**
 * Theme config: lo que se guarda en localStorage (y eventualmente se sync-ea a DB).
 *
 * Diseño:
 *  - Mantenemos `mode` aparte (lo maneja ThemeContext con su toggle existente).
 *  - Acá vive `accent`, que es lo que el usuario customiza.
 *  - Los presets son combinaciones nombradas. Si el accent no coincide con ningún preset,
 *    se considera "custom".
 *  - Versionado simple por si después agregamos densidad/escala de fuente.
 */

export interface ThemeConfig {
    version: 1;
    accent: string; // hex string, e.g. '#f59e0b'
}

export interface ThemePreset {
    id: string;
    label: string;
    accent: string;
}

export const DEFAULT_ACCENT = '#f59e0b';

export const THEME_PRESETS: ThemePreset[] = [
    { id: 'amber', label: 'Amber', accent: '#f59e0b' },
    { id: 'cyan', label: 'Cyan', accent: '#0ea5e9' },
    { id: 'violet', label: 'Violet', accent: '#8b5cf6' },
    { id: 'lime', label: 'Lime', accent: '#84cc16' },
    { id: 'rose', label: 'Rose', accent: '#f43f5e' },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
    version: 1,
    accent: DEFAULT_ACCENT,
};

export const THEME_STORAGE_KEY = 'hios-theme-config';

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function isValidHex(value: string): boolean {
    return HEX_RE.test(value.trim());
}

export function normalizeHex(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 4) {
        // #abc -> #aabbcc
        return '#' + trimmed.slice(1).split('').map((ch) => ch + ch).join('');
    }
    return trimmed;
}

export function readThemeConfig(): ThemeConfig {
    if (typeof window === 'undefined') return DEFAULT_THEME_CONFIG;
    try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (!raw) return DEFAULT_THEME_CONFIG;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.version === 1 &&
            typeof parsed.accent === 'string' &&
            isValidHex(parsed.accent)
        ) {
            return { version: 1, accent: normalizeHex(parsed.accent) };
        }
    } catch {
        // ignoramos: lo dejamos en default
    }
    return DEFAULT_THEME_CONFIG;
}

export function writeThemeConfig(config: ThemeConfig): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    } catch {
        // si localStorage está lleno o bloqueado, no es fatal: la sesión actual sigue funcionando.
    }
}

export function findPresetByAccent(accent: string): ThemePreset | undefined {
    const normalized = normalizeHex(accent);
    return THEME_PRESETS.find((preset) => preset.accent.toLowerCase() === normalized);
}
