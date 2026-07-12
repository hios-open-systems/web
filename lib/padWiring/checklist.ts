export interface ChecklistState {
  version: 1;
  done: number[];
}

export const EMPTY_CHECKLIST: ChecklistState = { version: 1, done: [] };

const keyFor = (id: string): string => `hios-${id}-checklist`;

export function isDone(state: ChecklistState, index: number): boolean {
  return state.done.includes(index);
}

export function toggle(state: ChecklistState, index: number): ChecklistState {
  const done = state.done.includes(index)
    ? state.done.filter((i) => i !== index)
    : [...state.done, index];
  return { version: 1, done };
}

export function serialize(state: ChecklistState): string {
  return JSON.stringify(state);
}

export function parse(raw: string | null): ChecklistState {
  if (!raw) return { version: 1, done: [] };
  try {
    const value = JSON.parse(raw);
    if (
      value &&
      value.version === 1 &&
      Array.isArray(value.done) &&
      value.done.every((i: unknown) => typeof i === 'number')
    ) {
      return { version: 1, done: value.done };
    }
    return { version: 1, done: [] };
  } catch {
    return { version: 1, done: [] };
  }
}

export function readChecklist(id: string): ChecklistState {
  if (typeof window === 'undefined') return { version: 1, done: [] };
  try {
    return parse(window.localStorage.getItem(keyFor(id)));
  } catch {
    return { version: 1, done: [] };
  }
}

export function writeChecklist(id: string, state: ChecklistState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(id), serialize(state));
  } catch {
    return;
  }
}
