/**
 * `done` guarda ÍNDICES, o sea posiciones dentro de `guide.check[]`. Son estables
 * sólo mientras la lista no cambie: insertar un paso en el medio corre todos los
 * de abajo y tus tildes pasan a señalar OTRO paso — un checklist que miente es
 * peor que uno vacío, y acá el paso 1 es "medí el buck antes de enchufar el S3".
 *
 * Por eso `version` va atada al layout de la lista: si agregás o reordenás pasos,
 * SUBILA. `parse()` descarta lo guardado con otra versión, así que el progreso
 * viejo se borra (evidente) en vez de re-mapearse mal (silencioso).
 *
 * v2 = rev 0.9 + los pasos de encoder/stick/parlantes/NeoPixel encadenado.
 */
export interface ChecklistState {
  version: 2;
  done: number[];
}

export const EMPTY_CHECKLIST: ChecklistState = { version: 2, done: [] };

const keyFor = (id: string): string => `hios-${id}-checklist`;

export function isDone(state: ChecklistState, index: number): boolean {
  return state.done.includes(index);
}

export function toggle(state: ChecklistState, index: number): ChecklistState {
  const done = state.done.includes(index)
    ? state.done.filter((i) => i !== index)
    : [...state.done, index];
  return { version: 2, done };
}

export function serialize(state: ChecklistState): string {
  return JSON.stringify(state);
}

export function parse(raw: string | null): ChecklistState {
  if (!raw) return { version: 2, done: [] };
  try {
    const value = JSON.parse(raw);
    if (
      value &&
      value.version === 2 &&
      Array.isArray(value.done) &&
      value.done.every((i: unknown) => typeof i === 'number')
    ) {
      return { version: 2, done: value.done };
    }
    return { version: 2, done: [] };
  } catch {
    return { version: 2, done: [] };
  }
}

export function readChecklist(id: string): ChecklistState {
  if (typeof window === 'undefined') return { version: 2, done: [] };
  try {
    return parse(window.localStorage.getItem(keyFor(id)));
  } catch {
    return { version: 2, done: [] };
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
