'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
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
import { fetchRemoteThemeSettings, updateRemoteThemeAccent } from '@/lib/themes/sync';
import { shouldOfferThemeImport } from '@/lib/userSettings';

type ThemeMode = 'light' | 'dark';
type ThemeSyncState = 'anonymous' | 'checking' | 'needs-import' | 'synced' | 'error';

interface ThemeContextType {
    mode: ThemeMode;
    accent: string;
    toggleTheme: () => void;
    setAccent: (hex: string) => void;
    applyPreset: (presetId: string) => void;
    isCustomAccent: boolean;
    isAuthenticated: boolean;
    isSyncing: boolean;
    syncState: ThemeSyncState;
    syncError: string | null;
    syncCurrentAccent: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyAccentCssVar(accent: string) {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--accent', accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const [mode, setMode] = useState<ThemeMode>('dark');
    const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
    const [isReady, setIsReady] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncState, setSyncState] = useState<ThemeSyncState>('anonymous');
    const [syncError, setSyncError] = useState<string | null>(null);

    const applyAccent = useCallback((nextAccent: string) => {
        setAccentState(nextAccent);
        applyAccentCssVar(nextAccent);
        writeThemeConfig({ version: 1, accent: nextAccent });
    }, []);

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
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const pushAccentToAccount = useCallback(async (nextAccent: string) => {
        if (!user) return;
        setIsSyncing(true);
        try {
            const settings = await updateRemoteThemeAccent(nextAccent);
            const normalized = settings.themeAccent ?? normalizeHex(nextAccent);
            applyAccent(normalized);
            setSyncError(null);
            setSyncState('synced');
        } catch (error) {
            setSyncError(error instanceof Error ? error.message : 'Failed to sync theme');
            setSyncState('error');
        } finally {
            setIsSyncing(false);
        }
    }, [applyAccent, user]);

    const setAccent = useCallback((hex: string) => {
        if (!isValidHex(hex)) return;
        const normalized = normalizeHex(hex);
        applyAccent(normalized);
        if (user) {
            void pushAccentToAccount(normalized);
        } else {
            setSyncState('anonymous');
            setSyncError(null);
        }
    }, [applyAccent, pushAccentToAccount, user]);

    const applyPreset = useCallback(
        (presetId: string) => {
            const preset = THEME_PRESETS.find((p) => p.id === presetId);
            if (!preset) return;
            setAccent(preset.accent);
        },
        [setAccent],
    );

    const syncCurrentAccent = useCallback(async () => {
        await pushAccentToAccount(accent);
    }, [accent, pushAccentToAccount]);

    useEffect(() => {
        if (!isReady || isUserLoading) return;

        if (!user) {
            setSyncState('anonymous');
            setSyncError(null);
            return;
        }

        let cancelled = false;
        setIsSyncing(true);
        setSyncState('checking');

        fetchRemoteThemeSettings()
            .then((settings) => {
                if (cancelled) return;
                if (settings.themeAccent) {
                    applyAccent(settings.themeAccent);
                    setSyncState('synced');
                    setSyncError(null);
                    return;
                }

                setSyncError(null);
                setSyncState(shouldOfferThemeImport(accent, settings.themeAccent) ? 'needs-import' : 'synced');
            })
            .catch((error) => {
                if (cancelled) return;
                setSyncError(error instanceof Error ? error.message : 'Failed to load account theme settings');
                setSyncState('error');
            })
            .finally(() => {
                if (!cancelled) {
                    setIsSyncing(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [accent, applyAccent, isReady, isUserLoading, user]);

    const isCustomAccent = !findPresetByAccent(accent);

    return (
        <ThemeContext.Provider
            value={{
                mode,
                accent,
                toggleTheme,
                setAccent,
                applyPreset,
                isCustomAccent,
                isAuthenticated: Boolean(user),
                isSyncing,
                syncState,
                syncError,
                syncCurrentAccent,
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
