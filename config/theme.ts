/**
 * Theme configuration
 * Central source of truth for colors and styling
 */

export const colors = {
    // Brand colors
    accent: '#f59e0b',
    accentHover: '#d97706',

    // Status colors
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',

    // Light mode
    light: {
        background: '#ffffff',
        backgroundAlt: '#f5f5f5',
        text: '#1a1a1a',
        textSecondary: '#666666',
        border: 'rgba(0, 0, 0, 0.06)',
        card: '#ffffff',
    },

    // Dark mode
    dark: {
        background: '#0d0d0d',
        backgroundAlt: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        border: 'rgba(255, 255, 255, 0.1)',
        card: '#141414',
    },
} as const;

/**
 * Get theme-aware color
 */
export function getThemeColor(mode: 'light' | 'dark', key: keyof typeof colors.light): string {
    return mode === 'dark' ? colors.dark[key] : colors.light[key];
}

/**
 * Get background style for sections
 */
export function getSectionBackground(mode: 'light' | 'dark', alt: boolean = false): string {
    if (alt) {
        return mode === 'dark' ? colors.dark.backgroundAlt : colors.light.backgroundAlt;
    }
    return mode === 'dark' ? colors.dark.background : colors.light.background;
}

/**
 * Get border style
 */
export function getBorderStyle(mode: 'light' | 'dark'): string {
    return `1px solid ${mode === 'dark' ? colors.dark.border : colors.light.border}`;
}

/**
 * Common motion variants for animations
 */
export const motionVariants = {
    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
    },
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
    },
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },
    staggerItem: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
    },
    cardHover: {
        scale: 1.02,
        transition: { duration: 0.2 },
    },
} as const;

/**
 * Common section padding
 */
export const sectionPadding = {
    default: '80px 24px',
    compact: '60px 24px',
    large: '100px 24px',
} as const;

/**
 * Max widths for content containers
 */
export const maxWidths = {
    narrow: 800,
    default: 900,
    wide: 1100,
    full: 1200,
} as const;
