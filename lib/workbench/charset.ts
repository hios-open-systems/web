/**
 * ASCII / Unicode code point reference, fully client-side and sync.
 * Astral-plane safe: every conversion goes through codePointAt /
 * String.fromCodePoint, never charCodeAt, so characters above U+FFFF
 * (emoji, etc.) round-trip as a single code point.
 */

export interface CodePointFormats {
  dec: string;
  hex: string;
  oct: string;
  bin: string;
}

/** First code point of a string (astral-plane safe). NaN if empty. */
export function charToCodePoint(ch: string): number {
  const cp = ch.codePointAt(0);
  return cp === undefined ? NaN : cp;
}

/** Single character for a code point (astral-plane safe). */
export function codePointToChar(cp: number): string {
  return String.fromCodePoint(cp);
}

/** Numeric representations of a code point, no prefixes, hex uppercase. */
export function formatCodePoint(cp: number): CodePointFormats {
  return {
    dec: cp.toString(10),
    hex: cp.toString(16).toUpperCase(),
    oct: cp.toString(8),
    bin: cp.toString(2),
  };
}

export interface CharInfo {
  codePoint: number;
  char: string;
  name: string | null;
  isControl: boolean;
  isPrintable: boolean;
}

/** 0x00-0x1F plus 0x7F, with standard abbreviations and long names. */
export const CONTROL_CHARS: { code: number; abbr: string; name: string }[] = [
  { code: 0x00, abbr: 'NUL', name: 'Null' },
  { code: 0x01, abbr: 'SOH', name: 'Start of Heading' },
  { code: 0x02, abbr: 'STX', name: 'Start of Text' },
  { code: 0x03, abbr: 'ETX', name: 'End of Text' },
  { code: 0x04, abbr: 'EOT', name: 'End of Transmission' },
  { code: 0x05, abbr: 'ENQ', name: 'Enquiry' },
  { code: 0x06, abbr: 'ACK', name: 'Acknowledge' },
  { code: 0x07, abbr: 'BEL', name: 'Bell' },
  { code: 0x08, abbr: 'BS', name: 'Backspace' },
  { code: 0x09, abbr: 'TAB', name: 'Horizontal Tab' },
  { code: 0x0a, abbr: 'LF', name: 'Line Feed' },
  { code: 0x0b, abbr: 'VT', name: 'Vertical Tab' },
  { code: 0x0c, abbr: 'FF', name: 'Form Feed' },
  { code: 0x0d, abbr: 'CR', name: 'Carriage Return' },
  { code: 0x0e, abbr: 'SO', name: 'Shift Out' },
  { code: 0x0f, abbr: 'SI', name: 'Shift In' },
  { code: 0x10, abbr: 'DLE', name: 'Data Link Escape' },
  { code: 0x11, abbr: 'DC1', name: 'Device Control 1' },
  { code: 0x12, abbr: 'DC2', name: 'Device Control 2' },
  { code: 0x13, abbr: 'DC3', name: 'Device Control 3' },
  { code: 0x14, abbr: 'DC4', name: 'Device Control 4' },
  { code: 0x15, abbr: 'NAK', name: 'Negative Acknowledge' },
  { code: 0x16, abbr: 'SYN', name: 'Synchronous Idle' },
  { code: 0x17, abbr: 'ETB', name: 'End of Transmission Block' },
  { code: 0x18, abbr: 'CAN', name: 'Cancel' },
  { code: 0x19, abbr: 'EM', name: 'End of Medium' },
  { code: 0x1a, abbr: 'SUB', name: 'Substitute' },
  { code: 0x1b, abbr: 'ESC', name: 'Escape' },
  { code: 0x1c, abbr: 'FS', name: 'File Separator' },
  { code: 0x1d, abbr: 'GS', name: 'Group Separator' },
  { code: 0x1e, abbr: 'RS', name: 'Record Separator' },
  { code: 0x1f, abbr: 'US', name: 'Unit Separator' },
  { code: 0x7f, abbr: 'DEL', name: 'Delete' },
];

const CONTROL_BY_CODE = new Map(CONTROL_CHARS.map((c) => [c.code, c]));

/** Max results returned by searchChars, to keep the UI bounded. */
export const SEARCH_LIMIT = 50;

function isControlCode(cp: number): boolean {
  return (cp >= 0x00 && cp <= 0x1f) || cp === 0x7f;
}

/**
 * A code point counts as assigned (and therefore printable, when not a
 * control char) when String.fromCodePoint round-trips to a non-empty
 * string and the result is not an unpaired surrogate. Surrogate halves
 * (0xD800-0xDFFF) are never assigned characters on their own.
 */
function isAssigned(cp: number): boolean {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) return false;
  if (cp >= 0xd800 && cp <= 0xdfff) return false;
  return true;
}

/** Full description of a code point. */
export function describeChar(cp: number): CharInfo {
  const control = CONTROL_BY_CODE.get(cp);
  const isControl = isControlCode(cp);
  const assigned = isAssigned(cp);
  return {
    codePoint: cp,
    char: assigned ? String.fromCodePoint(cp) : '',
    name: control ? control.name : null,
    isControl,
    isPrintable: !isControl && assigned,
  };
}

function parseCodePoint(query: string): number | null {
  const trimmed = query.trim();
  if (trimmed === '') return null;

  // Hex with explicit prefix: 0x41, U+0041 (case-insensitive).
  const prefixed = /^(?:0x|u\+)([0-9a-f]+)$/i.exec(trimmed);
  if (prefixed) {
    const cp = parseInt(prefixed[1], 16);
    return isAssignedOrControl(cp) ? cp : null;
  }

  // Plain decimal.
  if (/^[0-9]+$/.test(trimmed)) {
    const cp = parseInt(trimmed, 10);
    return isAssignedOrControl(cp) ? cp : null;
  }

  // Bare hex (letters present, valid hex digits): treat as hex.
  if (/^[0-9a-f]+$/i.test(trimmed) && /[a-f]/i.test(trimmed)) {
    const cp = parseInt(trimmed, 16);
    return isAssignedOrControl(cp) ? cp : null;
  }

  return null;
}

function isAssignedOrControl(cp: number): boolean {
  return isControlCode(cp) || isAssigned(cp);
}

/**
 * Search by: a single typed character, a control abbreviation or long
 * name (case-insensitive), or a code point typed in decimal or hex
 * (with or without 0x / U+ prefix). Returns a bounded list.
 */
export function searchChars(query: string): CharInfo[] {
  const raw = query;
  const trimmed = query.trim();
  if (trimmed === '') return [];

  const results: CharInfo[] = [];
  const seen = new Set<number>();
  const push = (cp: number) => {
    if (!seen.has(cp) && results.length < SEARCH_LIMIT) {
      seen.add(cp);
      results.push(describeChar(cp));
    }
  };

  // A single typed character (counts code points, so one emoji = length 1).
  if (Array.from(raw).length === 1) {
    push(charToCodePoint(raw));
  }

  // Control char by abbreviation or long name (case-insensitive).
  const needle = trimmed.toLowerCase();
  for (const c of CONTROL_CHARS) {
    if (c.abbr.toLowerCase() === needle || c.name.toLowerCase() === needle) {
      push(c.code);
    }
  }

  // Code point typed numerically (decimal or hex).
  const numeric = parseCodePoint(trimmed);
  if (numeric !== null) push(numeric);

  // Partial match on control names so substring queries still surface.
  if (results.length < SEARCH_LIMIT) {
    for (const c of CONTROL_CHARS) {
      if (c.name.toLowerCase().includes(needle) || c.abbr.toLowerCase().includes(needle)) {
        push(c.code);
      }
    }
  }

  return results;
}
