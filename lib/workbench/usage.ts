/**
 * Pinned + recently-used tools. Local-first (localStorage), pure
 * state transitions so they unit-test without the DOM.
 */

import { readRaw, writeRaw } from '../storage/safeLocalStorage.ts';

export interface UsageState {
  version: 1;
  pinned: string[];
  recent: string[];
}

export const USAGE_KEY = 'hios-tool-usage';
const RECENT_MAX = 8;

export const EMPTY_USAGE: UsageState = { version: 1, pinned: [], recent: [] };

export function isPinned(state: UsageState, id: string): boolean {
  return state.pinned.includes(id);
}

export function togglePin(state: UsageState, id: string): UsageState {
  const pinned = state.pinned.includes(id)
    ? state.pinned.filter((x) => x !== id)
    : [id, ...state.pinned];
  return { ...state, pinned };
}

export function recordUse(state: UsageState, id: string): UsageState {
  const recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, RECENT_MAX);
  return { ...state, recent };
}

export function serializeUsage(state: UsageState): string {
  return JSON.stringify(state);
}

export function parseUsage(raw: string | null): UsageState {
  if (!raw) return { ...EMPTY_USAGE };
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      p.version === 1 &&
      Array.isArray(p.pinned) &&
      Array.isArray(p.recent) &&
      p.pinned.every((x: unknown) => typeof x === 'string') &&
      p.recent.every((x: unknown) => typeof x === 'string')
    ) {
      return { version: 1, pinned: p.pinned, recent: p.recent.slice(0, RECENT_MAX) };
    }
    return { ...EMPTY_USAGE };
  } catch {
    return { ...EMPTY_USAGE };
  }
}

export function readUsage(): UsageState {
  return parseUsage(readRaw(USAGE_KEY));
}

export function writeUsage(state: UsageState): void {
  writeRaw(USAGE_KEY, serializeUsage(state));
}
