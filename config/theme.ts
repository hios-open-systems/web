/**
 * Theme configuration (lado JS)
 *
 * La fuente de verdad de color es CSS: las variables --hios-* y --accent en
 * styles/globals.css, y el tema antd derivado del accent en styles/theme.ts.
 * Este módulo expone helpers para los componentes que estilan por props.
 *
 * Usage:
 *   import { colors, getSectionBackground, getBorderStyle } from '@/config/theme';
 */

// ============================================
// Color Tokens
// ============================================

export const colors = {
    // Brand colors — siguen el accent configurable del usuario (--accent).
    // Solo válidos en contextos CSS (style props); para hex real usar ThemeContext.
    accent: 'var(--accent)',
    // Para accent usado como TEXTO (cumple AA en light — ver --accent-text en globals.css)
    accentText: 'var(--accent-text)',
    accentHover: 'color-mix(in srgb, var(--accent) 85%, #000)',
    accentMuted: 'color-mix(in srgb, var(--accent) 30%, transparent)',

    // Light mode
    light: {
        // Backgrounds
        bg: '#ffffff',
        bgAlt: '#f6f7f9',
        bgMuted: '#f0f2f5',
        bgHover: '#e6e9ee',
        bgCard: '#ffffff',
        bgOverlay: 'rgba(255, 255, 255, 0.9)',

        // Text
        text: '#16181d',
        textStrong: '#0b0e14',
        textMuted: '#5c6470',
        textSubtle: '#6b7280',
        textDisabled: '#b6bcc6',

        // Borders
        border: 'rgba(2, 6, 23, 0.08)',
        borderStrong: '#e2e5ea',
        borderMuted: '#eef0f3',
    },

    // Dark mode
    dark: {
        // Backgrounds
        bg: '#0b0e14',
        bgAlt: '#090b10',
        bgMuted: '#11151d',
        bgHover: '#1a2029',
        bgCard: '#11151d',
        bgOverlay: 'rgba(0, 0, 0, 0.6)',

        // Text
        text: '#f4f6f8',
        textStrong: '#e8eaed',
        textMuted: '#9aa4b2',
        textSubtle: '#78849a',
        textDisabled: '#434c5a',

        // Borders
        border: 'rgba(255, 255, 255, 0.08)',
        borderStrong: '#222834',
        borderMuted: '#161b24',
    },
} as const;

// Type for mode
export type ThemeMode = 'light' | 'dark';

// ============================================
// Color Getters
// ============================================

/**
 * Get theme-aware color value
 */
export function getColor(mode: ThemeMode, key: keyof typeof colors.light): string {
    return mode === 'dark' ? colors.dark[key] : colors.light[key];
}

export function getSectionBackground(mode: ThemeMode, alt: boolean = false): string {
    return alt ? getColor(mode, 'bgAlt') : getColor(mode, 'bg');
}

export function getBorderStyle(mode: ThemeMode): string {
    return `1px solid ${getColor(mode, 'border')}`;
}
