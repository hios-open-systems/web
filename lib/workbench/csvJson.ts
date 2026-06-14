/**
 * CSV <-> JSON conversion, fully client-side. Pure, sync helpers.
 * The parser follows RFC 4180: double-quoted fields, "" as an escaped
 * quote, and embedded delimiters/newlines inside quoted fields.
 */

const QUOTE = '"';
const CR = '\r';
const LF = '\n';

/**
 * Parse CSV text into a grid of rows/fields (RFC 4180).
 * Rows are separated by \n or \r\n; a single trailing newline is ignored.
 * Inside double quotes, the delimiter, \n, \r\n and "" (escaped quote) are literal.
 */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const endField = (): void => {
    row.push(field);
    field = '';
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === QUOTE) {
        if (text[i + 1] === QUOTE) {
          // Escaped quote ("") -> literal "
          field += QUOTE;
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === QUOTE) {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      endField();
      i += 1;
      continue;
    }
    if (char === CR) {
      // \r\n or bare \r both terminate the row.
      if (text[i + 1] === LF) {
        i += 2;
      } else {
        i += 1;
      }
      endRow();
      continue;
    }
    if (char === LF) {
      endRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush the final field/row unless the input was empty or ended on a
  // newline (which already flushed the row, leaving nothing pending).
  if (field !== '' || row.length > 0) {
    endRow();
  }

  return rows;
}

/**
 * Serialize a grid into CSV text. A field is quoted IFF it contains the
 * delimiter, a double-quote, \n or \r; internal quotes are doubled.
 * Fields join by the delimiter; rows join by \n.
 */
export function toCsv(rows: string[][], delimiter = ','): string {
  return rows
    .map((row) => row.map((field) => encodeField(field, delimiter)).join(delimiter))
    .join(LF);
}

function encodeField(field: string, delimiter: string): string {
  const needsQuote =
    field.includes(delimiter) ||
    field.includes(QUOTE) ||
    field.includes(LF) ||
    field.includes(CR);
  if (!needsQuote) {
    return field;
  }
  return QUOTE + field.replace(/"/g, '""') + QUOTE;
}

/**
 * Parse CSV where the first row is a header, yielding one object per data
 * row keyed by header. Missing trailing cells default to ''.
 */
export function csvToObjects(text: string, delimiter = ','): Record<string, string>[] {
  const rows = parseCsv(text, delimiter);
  if (rows.length === 0) {
    return [];
  }
  const header = rows[0];
  const objects: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c += 1) {
      obj[header[c]] = c < cells.length ? cells[c] : '';
    }
    objects.push(obj);
  }
  return objects;
}

/**
 * Serialize objects to CSV. The header is the union of keys across all
 * objects, in first-seen order; values are String()-ified (null/undefined
 * become ''). Delegates serialization to toCsv.
 */
export function objectsToCsv(objs: Record<string, unknown>[], delimiter = ','): string {
  const header: string[] = [];
  const seen = new Set<string>();
  for (const obj of objs) {
    for (const key of Object.keys(obj)) {
      if (!seen.has(key)) {
        seen.add(key);
        header.push(key);
      }
    }
  }

  const rows: string[][] = [header];
  for (const obj of objs) {
    rows.push(header.map((key) => stringifyValue(obj[key])));
  }
  return toCsv(rows, delimiter);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}
