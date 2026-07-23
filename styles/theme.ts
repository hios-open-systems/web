import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { DEFAULT_ACCENT } from '@/lib/themes/config';

/**
 * Tema antd derivado del accent configurable del usuario.
 *
 * Única fuente de verdad de color de marca: `--accent` (ThemeContext).
 * antd necesita hex reales para computar sus paletas derivadas, así que
 * `getAntdTheme` recibe el accent resuelto en vez de leer la CSS var.
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

export function getAntdTheme(mode: 'light' | 'dark', accent: string): ThemeConfig {
    const dark = mode === 'dark';
    return {
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
            ...baseTokens,
            colorPrimary: accent,
            colorInfo: accent,
            colorLink: accent,
            colorSuccess: dark ? '#34d399' : '#0e9f6e',
            colorWarning: dark ? '#fbbf24' : '#d97706',
            colorError: dark ? '#f87171' : '#dc2626',
            colorBgContainer: dark ? '#11151d' : '#ffffff',
            colorBgElevated: dark ? '#151a24' : '#ffffff',
            colorBgLayout: dark ? '#0b0e14' : '#f6f7f9',
            colorText: dark ? '#e8eaed' : '#16181d',
            colorTextSecondary: dark ? '#9aa4b2' : '#5c6470',
            colorBorder: dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(2, 6, 23, 0.10)',
            colorBorderSecondary: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(2, 6, 23, 0.06)',
        },
        components: {
            Layout: {
                bodyBg: dark ? '#0b0e14' : '#ffffff',
                headerBg: dark ? 'rgba(11, 14, 20, 0.72)' : 'rgba(255, 255, 255, 0.8)',
            },
            Card: {
                colorBgContainer: dark ? '#11151d' : '#ffffff',
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
