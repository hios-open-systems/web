/**
 * User-saved named themes (accent + mode + skin), local-first. Pure
 * serialize/parse/list helpers so they can be unit-tested without the DOM.
 */

import { DEFAULT_SKIN, isValidSkin, type SkinId } from './skins.ts';

export type ThemeMode = 'light' | 'dark';

export interface SavedTheme {
  id: string;
  name: string;
  accent: string;
  mode: ThemeMode;
  /** Opcional para retro-compat con temas guardados antes de los skins. */
  skin?: SkinId;
}

interface SavedPayload {
  version: 1;
  themes: SavedTheme[];
}

export const SAVED_THEMES_KEY = 'hios-saved-themes';
const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const MAX_THEMES = 24;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function isSavedTheme(value: unknown): value is SavedTheme {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.accent === 'string' &&
    HEX_RE.test(v.accent) &&
    (v.mode === 'light' || v.mode === 'dark') &&
    (v.skin === undefined || isValidSkin(v.skin))
  );
}

export function serializeSavedThemes(themes: SavedTheme[]): string {
  return JSON.stringify({ version: 1, themes } satisfies SavedPayload);
}

export function parseSavedThemes(raw: string | null): SavedTheme[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.themes)) {
      return parsed.themes.filter(isSavedTheme);
    }
    return [];
  } catch {
    return [];
  }
}

/** Add (or replace by case-insensitive name) and cap the list. */
export function addSavedTheme(
  list: SavedTheme[],
  name: string,
  accent: string,
  mode: ThemeMode,
  skin: SkinId = DEFAULT_SKIN,
): SavedTheme[] {
  const clean = name.trim().slice(0, 40);
  if (!clean || !HEX_RE.test(accent)) return list;
  const without = list.filter((theme) => theme.name.toLowerCase() !== clean.toLowerCase());
  return [{ id: newId(), name: clean, accent, mode, skin }, ...without].slice(0, MAX_THEMES);
}

export function removeSavedTheme(list: SavedTheme[], id: string): SavedTheme[] {
  return list.filter((t) => t.id !== id);
}

export function readSavedThemes(): SavedTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseSavedThemes(window.localStorage.getItem(SAVED_THEMES_KEY));
  } catch {
    return [];
  }
}

export function writeSavedThemes(themes: SavedTheme[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_THEMES_KEY, serializeSavedThemes(themes));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}
