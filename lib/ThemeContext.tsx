'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';
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
import {
    DEFAULT_SKIN,
    isValidSkin,
    readStoredSkin,
    writeStoredSkin,
    type SkinId,
} from '@/lib/themes/skins';
import { shouldOfferThemeImport } from '@/lib/userSettings';

type ThemeMode = 'light' | 'dark';
type ThemeSyncState = 'anonymous' | 'checking' | 'needs-import' | 'synced' | 'error' | 'unavailable';

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

function applyAccentCssVar(accent: string) {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--accent', accent);
}

function getInitialSkin(): SkinId {
    if (typeof window === 'undefined') return DEFAULT_SKIN;
    // El bootstrap de app/[locale]/layout.tsx ya seteó data-skin pre-hidratación.
    const attrSkin = document.documentElement.getAttribute('data-skin');
    if (isValidSkin(attrSkin)) return attrSkin;
    return readStoredSkin();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const [mode, setMode] = useState<ThemeMode>(getInitialMode);
    const [skin, setSkinState] = useState<SkinId>(getInitialSkin);
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
        const savedConfig: ThemeConfig = readThemeConfig();
        setAccentState(savedConfig.accent);
        applyAccentCssVar(savedConfig.accent);
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        writeRaw('theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-skin', skin);
        writeStoredSkin(skin);
    }, [skin]);

    // Solo local por ahora (como el modo). El sync remoto de skin queda para
    // cuando el endpoint de settings soporte el campo; degradar sin ruido.
    const setSkin = useCallback((next: SkinId) => {
        if (!isValidSkin(next)) return;
        setSkinState(next);
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
        } catch {
            // Sync is best-effort and optional — the accent already applied
            // locally. Degrade quietly instead of alarming the user.
            setSyncError(null);
            setSyncState('unavailable');
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

    // Read the latest accent inside the initial-sync effect without making it a
    // dependency — otherwise every accent change re-runs the remote fetch.
    const accentRef = useRef(accent);
    useEffect(() => {
        accentRef.current = accent;
    }, [accent]);

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
                setSyncState(shouldOfferThemeImport(accentRef.current, settings.themeAccent) ? 'needs-import' : 'synced');
            })
            .catch(() => {
                if (cancelled) return;
                // Backend/sync unavailable (e.g. D1 unreachable) — optional
                // feature, so degrade quietly. The local theme still works.
                setSyncError(null);
                setSyncState('unavailable');
            })
            .finally(() => {
                if (!cancelled) {
                    setIsSyncing(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [applyAccent, isReady, isUserLoading, user]);

    const isCustomAccent = !findPresetByAccent(accent);

    return (
        <ThemeContext.Provider
            value={{
                mode,
                accent,
                skin,
                toggleTheme,
                setAccent,
                setSkin,
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
