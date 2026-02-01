/**
 * Theme configuration
 * Central source of truth for colors and styling
 *
 * Usage:
 *   import { useThemeStyles } from '@/config/theme';
 *   const styles = useThemeStyles();
 *   <div style={styles.section}>...</div>
 */

import { CSSProperties } from 'react';

// ============================================
// Color Tokens
// ============================================

export const colors = {
    // Brand colors
    accent: '#f59e0b',
    accentHover: '#d97706',
    accentMuted: 'rgba(245, 158, 11, 0.3)',

    // Primary blue
    primary: '#4096ff',
    primaryHover: '#0066cc',

    // Status colors
    success: '#10b981',
    successLight: '#34d399',
    warning: '#faad14',
    error: '#ef4444',
    info: '#1890ff',

    // Light mode
    light: {
        // Backgrounds
        bg: '#ffffff',
        bgAlt: '#fafafa',
        bgMuted: '#f5f5f5',
        bgHover: '#e8e8e8',
        bgCard: '#ffffff',
        bgOverlay: 'rgba(255, 255, 255, 0.9)',

        // Text
        text: '#0d0d0d',
        textStrong: '#1a1a1a',
        textMuted: '#666666',
        textSubtle: '#999999',
        textDisabled: '#bbbbbb',

        // Borders
        border: 'rgba(0, 0, 0, 0.06)',
        borderStrong: '#e8e8e8',
        borderMuted: '#f0f0f0',
    },

    // Dark mode
    dark: {
        // Backgrounds
        bg: '#0d0d0d',
        bgAlt: '#0a0a0a',
        bgMuted: '#1a1a1a',
        bgHover: '#262626',
        bgCard: '#141414',
        bgOverlay: 'rgba(0, 0, 0, 0.6)',

        // Text
        text: '#ffffff',
        textStrong: '#e6e6e6',
        textMuted: '#888888',
        textSubtle: '#666666',
        textDisabled: '#444444',

        // Borders
        border: 'rgba(255, 255, 255, 0.1)',
        borderStrong: '#262626',
        borderMuted: '#1a1a1a',
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

/**
 * Quick theme toggle helper - returns dark value if dark mode, else light value
 */
export function themeValue<T>(mode: ThemeMode, dark: T, light: T): T {
    return mode === 'dark' ? dark : light;
}

// ============================================
// Pre-built Style Objects
// ============================================

/**
 * Get common styles based on theme mode
 * Usage: const styles = getThemeStyles('dark');
 */
export function getThemeStyles(mode: ThemeMode) {
    const c = mode === 'dark' ? colors.dark : colors.light;

    return {
        // Section containers
        section: {
            padding: '80px 24px',
            background: c.bg,
        } as CSSProperties,

        sectionAlt: {
            padding: '80px 24px',
            background: c.bgAlt,
            borderTop: `1px solid ${c.borderMuted}`,
            borderBottom: `1px solid ${c.borderMuted}`,
        } as CSSProperties,

        // Content containers
        container: {
            maxWidth: 900,
            margin: '0 auto',
        } as CSSProperties,

        containerWide: {
            maxWidth: 1100,
            margin: '0 auto',
        } as CSSProperties,

        // Cards
        card: {
            background: c.bgCard,
            border: `1px solid ${c.borderStrong}`,
            borderRadius: '12px',
        } as CSSProperties,

        cardHover: {
            background: c.bgCard,
            border: `1px solid ${c.borderStrong}`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        } as CSSProperties,

        // Typography
        title: {
            color: c.text,
            marginBottom: '12px',
        } as CSSProperties,

        subtitle: {
            color: c.textSubtle,
            fontSize: '15px',
        } as CSSProperties,

        text: {
            color: c.textMuted,
            fontSize: '14px',
        } as CSSProperties,

        textStrong: {
            color: c.textStrong,
            fontSize: '16px',
        } as CSSProperties,

        // Badges & Pills
        badge: {
            padding: '6px 14px',
            background: c.bgMuted,
            borderRadius: '20px',
            fontSize: '13px',
            color: c.textMuted,
        } as CSSProperties,

        // Icon containers
        iconBox: (color: string) => ({
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: color,
            flexShrink: 0,
        } as CSSProperties),

        // Code blocks
        codeBlock: {
            padding: '10px 14px',
            background: mode === 'dark' ? '#0a0a0a' : '#1a1a1a',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: colors.success,
        } as CSSProperties,

        // Overlays & Navigation
        overlay: {
            background: c.bgOverlay,
            backdropFilter: 'blur(4px)',
        } as CSSProperties,

        // Dividers
        divider: {
            borderTop: `1px solid ${c.borderMuted}`,
            marginTop: '20px',
            paddingTop: '16px',
        } as CSSProperties,
    };
}

// ============================================
// React Hook for Theme Styles
// ============================================

/**
 * Hook to get theme styles - use with useTheme()
 *
 * Usage:
 *   import { useThemeStyles } from '@/config/theme';
 *   import { useTheme } from '@/lib/ThemeContext';
 *
 *   function MyComponent() {
 *     const { mode } = useTheme();
 *     const styles = useThemeStyles(mode);
 *     return <section style={styles.section}>...</section>
 *   }
 */
export function useThemeStyles(mode: ThemeMode) {
    return getThemeStyles(mode);
}

// ============================================
// Motion Variants (Framer Motion)
// ============================================

export const motionVariants = {
    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 },
    },
    fadeIn: {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true },
        transition: { duration: 0.3 },
    },
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },
    staggerItem: (index: number) => ({
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.4, delay: index * 0.1 },
    }),
    cardHover: {
        whileHover: { scale: 1.02 },
        transition: { duration: 0.2 },
    },
    expandCollapse: {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto' },
        exit: { opacity: 0, height: 0 },
        transition: { duration: 0.3 },
    },
} as const;

// ============================================
// Layout Constants
// ============================================

export const layout = {
    // Section padding
    sectionPadding: '80px 24px',
    sectionPaddingCompact: '60px 24px',
    sectionPaddingLarge: '100px 24px',

    // Max widths
    maxWidth: {
        narrow: 800,
        default: 900,
        wide: 1100,
        full: 1200,
    },

    // Border radius
    radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },

    // Spacing
    gap: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },
} as const;

// ============================================
// CSS Custom Properties Generator
// ============================================

/**
 * Generate CSS custom properties for the current theme
 * Can be used in global styles or CSS files
 */
export function getCSSVariables(mode: ThemeMode): Record<string, string> {
    const c = mode === 'dark' ? colors.dark : colors.light;

    return {
        '--color-bg': c.bg,
        '--color-bg-alt': c.bgAlt,
        '--color-bg-muted': c.bgMuted,
        '--color-bg-hover': c.bgHover,
        '--color-bg-card': c.bgCard,
        '--color-text': c.text,
        '--color-text-strong': c.textStrong,
        '--color-text-muted': c.textMuted,
        '--color-text-subtle': c.textSubtle,
        '--color-border': c.border,
        '--color-border-strong': c.borderStrong,
        '--color-accent': colors.accent,
        '--color-primary': colors.primary,
        '--color-success': colors.success,
    };
}

// ============================================
// Legacy exports (backwards compatibility)
// ============================================

export const sectionPadding = layout.sectionPadding;
export const maxWidths = layout.maxWidth;

export function getThemeColor(mode: ThemeMode, key: keyof typeof colors.light): string {
    return getColor(mode, key);
}

export function getSectionBackground(mode: ThemeMode, alt: boolean = false): string {
    return alt ? getColor(mode, 'bgAlt') : getColor(mode, 'bg');
}

export function getBorderStyle(mode: ThemeMode): string {
    return `1px solid ${getColor(mode, 'border')}`;
}
