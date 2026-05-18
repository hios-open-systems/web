/**
 * Regex tester logic — pure, client-side. Compiling user patterns is safe
 * (it's their own browser); we cap match counts to avoid pathological loops.
 */

export const MAX_MATCHES = 1000;

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
  named: Record<string, string>;
}

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; truncated: boolean }
  | { ok: false; error: string };

const VALID_FLAGS = 'dgimsuy';

export function sanitizeFlags(flags: string): string {
  const seen = new Set<string>();
  let out = '';
  for (const ch of flags) {
    if (VALID_FLAGS.includes(ch) && !seen.has(ch)) {
      seen.add(ch);
      out += ch;
    }
  }
  return out;
}

export function compileRegex(pattern: string, flags: string): RegExp | { error: string } {
  try {
    return new RegExp(pattern, sanitizeFlags(flags));
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid pattern' };
  }
}

export function runRegex(pattern: string, flags: string, input: string): RegexResult {
  if (!pattern) return { ok: true, matches: [], truncated: false };
  const compiled = compileRegex(pattern, flags);
  if ('error' in compiled) return { ok: false, error: compiled.error };

  const global = compiled.global;
  const re = global ? compiled : new RegExp(compiled.source, sanitizeFlags(flags + 'g'));
  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(input)) !== null) {
    matches.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1).map((g) => g ?? ''),
      named: { ...(m.groups ?? {}) },
    });
    if (m[0] === '') re.lastIndex += 1; // avoid zero-length infinite loop
    guard += 1;
    if (guard >= MAX_MATCHES) {
      return { ok: true, matches, truncated: true };
    }
    if (!global) break;
  }
  return { ok: true, matches, truncated: false };
}

export function replacePreview(
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const compiled = compileRegex(pattern, flags);
  if ('error' in compiled) return { ok: false, error: compiled.error };
  try {
    return { ok: true, value: input.replace(compiled, replacement) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Replace failed' };
  }
}
