'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';
import {
    findPresetByAccent,
    THEME_PRESETS,
} from '@/lib/themes/config';
import { useThemeAccent } from '@/lib/themes/useThemeAccent';
import { useThemeStorage } from '@/lib/themes/useThemeStorage';
import type { ThemeSyncState } from '@/lib/themes/syncController';
import {
    DEFAULT_SKIN,
    SKIN_STORAGE_KEY,
    isValidSkin,
    readStoredSkin,
    writeStoredSkin,
    type SkinId,
} from '@/lib/themes/skins';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    accent: string;
    skin: SkinId;
    toggleTheme: () => void;
    setAccent: (hex: string) => void;
    setSkin: (skin: SkinId) => void;
    applyPreset: (presetId: string) => void;
    isCustomAccent: boolean;
    isAuthenticated: boolean;
    isSyncing: boolean;
    syncState: ThemeSyncState;
    syncError: string | null;
    syncCurrentAccent: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialMode(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';

    const attrMode = document.documentElement.getAttribute('data-theme');
    if (attrMode === 'light' || attrMode === 'dark') return attrMode;

    const storedMode = readRaw('theme');
    if (storedMode === 'light' || storedMode === 'dark') return storedMode;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}

function getInitialSkin(): SkinId {
    if (typeof window === 'undefined') return DEFAULT_SKIN;
    // El bootstrap de app/[locale]/layout.tsx ya seteó data-skin pre-hidratación.
    const attrSkin = document.documentElement.getAttribute('data-skin');
    if (isValidSkin(attrSkin)) return attrSkin;
    return readStoredSkin();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const themeAccent = useThemeAccent();
    const { accent, setAccent } = themeAccent;
    const [mode, setMode] = useState<ThemeMode>(getInitialMode);
    const [skin, setSkinState] = useState<SkinId>(getInitialSkin);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        writeRaw('theme', next);
    }, [mode]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-skin', skin);
    }, [skin]);

    // Solo local por ahora (como el modo). El sync remoto de skin queda para
    // cuando el endpoint de settings soporte el campo; degradar sin ruido.
    const setSkin = useCallback((next: SkinId) => {
        if (!isValidSkin(next)) return;
        setSkinState(next);
        writeStoredSkin(next);
    }, []);

    const readSharedAppearance = useCallback((key: string | null) => {
        if (key === null || key === 'theme') {
            setMode(readRaw('theme') === 'light' ? 'light' : 'dark');
        }
        if (key === null || key === SKIN_STORAGE_KEY) setSkinState(readStoredSkin());
    }, []);
    useThemeStorage(readSharedAppearance);
    // Catch writes made after the head bootstrap but before React subscribed.
    useEffect(() => readSharedAppearance(null), [readSharedAppearance]);

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
            value={{
                mode,
                skin,
                toggleTheme,
                setSkin,
                applyPreset,
                isCustomAccent,
                ...themeAccent,
            }}
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
