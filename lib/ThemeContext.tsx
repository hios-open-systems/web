'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import {
    DEFAULT_ACCENT,
    findPresetByAccent,
    isValidHex,
    normalizeHex,
    readThemeConfig,
    THEME_PRESETS,
    writeThemeConfig,
    type ThemeConfig,
} from '@/lib/themes/config';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    accent: string;
    toggleTheme: () => void;
    setAccent: (hex: string) => void;
    applyPreset: (presetId: string) => void;
    isCustomAccent: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyAccentCssVar(accent: string) {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--accent', accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('dark');
    const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

    useEffect(() => {
        const savedMode = (typeof window !== 'undefined'
            ? (localStorage.getItem('theme') as ThemeMode | null)
            : null);
        if (savedMode === 'light' || savedMode === 'dark') {
            setMode(savedMode);
        } else if (
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
            setMode('dark');
        }

        const savedConfig: ThemeConfig = readThemeConfig();
        setAccentState(savedConfig.accent);
        applyAccentCssVar(savedConfig.accent);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const setAccent = useCallback((hex: string) => {
        if (!isValidHex(hex)) return;
        const normalized = normalizeHex(hex);
        setAccentState(normalized);
        applyAccentCssVar(normalized);
        writeThemeConfig({ version: 1, accent: normalized });
    }, []);

    const applyPreset = useCallback(
        (presetId: string) => {
            const preset = THEME_PRESETS.find((p) => p.id === presetId);
            if (!preset) return;
            setAccent(preset.accent);
        },
        [setAccent],
    );

    const isCustomAccent = !findPresetByAccent(accent);

    return (
        <ThemeContext.Provider
            value={{ mode, accent, toggleTheme, setAccent, applyPreset, isCustomAccent }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
