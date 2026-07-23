import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { DEFAULT_ACCENT } from '@/lib/themes/config';
import type { SkinId } from '@/lib/themes/skins';

/**
 * Tema antd derivado del accent configurable del usuario + skin activo.
 *
 * Única fuente de verdad de color de marca: `--accent` (ThemeContext).
 * antd necesita hex reales para computar sus paletas derivadas, así que
 * `getAntdTheme` recibe el accent resuelto en vez de leer la CSS var.
 * Las paletas por skin espejan los bloques [data-skin] de globals.css —
 * si tocás una, tocá la otra.
 */

// Las fuentes llegan como CSS vars desde next/font (app/[locale]/layout.tsx).
export const FONT_SANS =
    "var(--font-sans, 'Inter'), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_MONO =
    "var(--font-mono, 'IBM Plex Mono'), ui-monospace, SFMono-Regular, Menlo, monospace";

const baseTokens = {
    fontFamily: FONT_SANS,
    fontFamilyCode: FONT_MONO,
    fontSize: 14,
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 12,
};

interface SkinPalette {
    bg: string;
    bgSecondary: string;
    bgElevated: string;
    text: string;
    textSecondary: string;
    border: string;
    borderSecondary: string;
}

/** Espeja los bloques [data-skin] de globals.css. */
const SKIN_PALETTES: Record<SkinId, { light: SkinPalette; dark: SkinPalette }> = {
    datasheet: {
        light: {
            bg: '#ffffff',
            bgSecondary: '#f6f7f9',
            bgElevated: '#ffffff',
            text: '#16181d',
            textSecondary: '#5c6470',
            border: 'rgba(2, 6, 23, 0.10)',
            borderSecondary: 'rgba(2, 6, 23, 0.06)',
        },
        dark: {
            bg: '#0b0e14',
            bgSecondary: '#11151d',
            bgElevated: '#151a24',
            text: '#e8eaed',
            textSecondary: '#9aa4b2',
            border: 'rgba(255, 255, 255, 0.10)',
            borderSecondary: 'rgba(255, 255, 255, 0.06)',
        },
    },
    terminal: {
        light: {
            bg: '#f7f6f1',
            bgSecondary: '#efede4',
            bgElevated: '#fbfaf6',
            text: '#1d211d',
            textSecondary: '#47513f',
            border: 'rgba(29, 33, 29, 0.16)',
            borderSecondary: 'rgba(29, 33, 29, 0.10)',
        },
        dark: {
            bg: '#050805',
            bgSecondary: '#0b120b',
            bgElevated: '#101910',
            text: '#cde5cd',
            textSecondary: '#9dbf9d',
            border: 'rgba(140, 200, 140, 0.18)',
            borderSecondary: 'rgba(140, 200, 140, 0.10)',
        },
    },
    blueprint: {
        light: {
            bg: '#f4f8fd',
            bgSecondary: '#e9f0fa',
            bgElevated: '#fdfeff',
            text: '#132c4e',
            textSecondary: '#3d5578',
            border: 'rgba(19, 44, 78, 0.18)',
            borderSecondary: 'rgba(19, 44, 78, 0.10)',
        },
        dark: {
            bg: '#0a1f3f',
            bgSecondary: '#10294f',
            bgElevated: '#16305a',
            text: '#eaf1fb',
            textSecondary: '#b9c9e0',
            border: 'rgba(255, 255, 255, 0.16)',
            borderSecondary: 'rgba(255, 255, 255, 0.09)',
        },
    },
};

export function getAntdTheme(
    mode: 'light' | 'dark',
    accent: string,
    skin: SkinId = 'datasheet',
): ThemeConfig {
    const dark = mode === 'dark';
    const palette = SKIN_PALETTES[skin][mode];
    const terminal = skin === 'terminal';
    return {
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
            ...baseTokens,
            ...(terminal
                ? { fontFamily: FONT_MONO, borderRadius: 4, borderRadiusSM: 2, borderRadiusLG: 6 }
                : {}),
            colorPrimary: accent,
            colorInfo: accent,
            colorLink: accent,
            colorSuccess: dark ? '#34d399' : '#0e9f6e',
            colorWarning: dark ? '#fbbf24' : '#d97706',
            colorError: dark ? '#f87171' : '#dc2626',
            colorBgContainer: palette.bgSecondary === palette.bg ? palette.bg : (dark ? palette.bgSecondary : palette.bgElevated),
            colorBgElevated: palette.bgElevated,
            colorBgLayout: dark ? palette.bg : palette.bgSecondary,
            colorText: palette.text,
            colorTextSecondary: palette.textSecondary,
            colorBorder: palette.border,
            colorBorderSecondary: palette.borderSecondary,
        },
        components: {
            Layout: {
                bodyBg: palette.bg,
                headerBg: dark ? 'rgba(11, 14, 20, 0.72)' : 'rgba(255, 255, 255, 0.8)',
            },
            Card: {
                colorBgContainer: dark ? palette.bgSecondary : palette.bgElevated,
            },
            Button: {
                fontWeight: 500,
            },
        },
    };
}

// Legacy exports for compatibility
export const lightTheme = getAntdTheme('light', DEFAULT_ACCENT);
export const darkTheme = getAntdTheme('dark', DEFAULT_ACCENT);
export const theme = lightTheme;
