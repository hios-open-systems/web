/**
 * Registro declarativo del Compositor Chiptune.
 *
 * Fuente de verdad (data, no componentes) de: qué instrumentos existen y su
 * metadata de UI, los defaults de ajustes de canción, y el códec del código de
 * compartir (?s=). El modelo puro sigue viviendo en lib/workbench/chiptune.ts;
 * este registry lo expone data-driven para el composer (espeja el patrón de
 * components/tools/calculators/registry.ts).
 */
import {
  INSTRUMENTS,
  INSTRUMENT_IDS,
  serializeSong,
  parseSong,
  type ChiptuneSong,
  type InstrumentId,
} from '@/lib/workbench/chiptune';

export interface InstrumentOption {
  id: InstrumentId;
  label: string;
  color: string;
}

/** Opciones de instrumento derivadas de INSTRUMENTS (orden = INSTRUMENT_IDS). */
export const INSTRUMENT_OPTIONS: InstrumentOption[] = INSTRUMENT_IDS.map((id) => ({
  id,
  label: INSTRUMENTS[id].label,
  color: INSTRUMENTS[id].color,
}));

export interface ComposerSetting {
  key: 'bpm' | 'beatsPerBar' | 'lengthBars';
  default: number;
  min: number;
  max: number;
}

/** Ajustes de canción con su rango y default (único lugar de estos números). */
export const COMPOSER_SETTINGS: ComposerSetting[] = [
  { key: 'bpm', default: 120, min: 40, max: 300 },
  { key: 'beatsPerBar', default: 4, min: 2, max: 8 },
  { key: 'lengthBars', default: 4, min: 1, max: 16 },
];

// ─── códec del código de compartir (?s=) ────────────────────────────────────
// La canción es grande para meterla entera en la URL en cada edición: se guarda
// en localStorage y se comparte por acción explícita (botón). base64url del
// serializeSong (version:1). Solo corre en el cliente (btoa/atob).

function toB64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShare(song: ChiptuneSong): string {
  return toB64url(serializeSong(song));
}

export function decodeShare(code: string): ChiptuneSong | null {
  try {
    return parseSong(fromB64url(code));
  } catch {
    return null;
  }
}
