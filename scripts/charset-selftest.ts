/**
 * Self-test for the Charset & Code Point reference tool logic. Pure,
 * sync helpers covering decimal/hex/oct/bin formatting, control-char
 * tables, and astral-plane (emoji) round-trips.
 *
 * Run: node --experimental-strip-types scripts/charset-selftest.ts
 */
import {
  charToCodePoint,
  codePointToChar,
  formatCodePoint,
  describeChar,
  CONTROL_CHARS,
} from '../lib/workbench/charset.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) {
    failures++;
    console.error(`✗ ${name}: got ${a}, want ${b}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Basic conversions
eq('charToCodePoint A', charToCodePoint('A'), 65);
eq('codePointToChar 65', codePointToChar(65), 'A');

// Formatting (no prefixes, hex uppercase)
eq('formatCodePoint 65', formatCodePoint(65), {
  dec: '65',
  hex: '41',
  oct: '101',
  bin: '1000001',
});
eq('formatCodePoint 255 hex', formatCodePoint(255).hex, 'FF');

// Control char table
eq('CONTROL_CHARS TAB', CONTROL_CHARS.find((c) => c.code === 9)?.abbr, 'TAB');
eq('CONTROL_CHARS NUL', CONTROL_CHARS.find((c) => c.code === 0)?.abbr, 'NUL');
eq('CONTROL_CHARS DEL', CONTROL_CHARS.find((c) => c.code === 0x7f)?.abbr, 'DEL');

// describeChar classification
eq('describeChar 9 isControl', describeChar(9).isControl, true);
eq('describeChar 65 isControl', describeChar(65).isControl, false);
eq('describeChar 65 isPrintable', describeChar(65).isPrintable, true);

// Astral-plane round-trip (😀 = U+1F600 = 128512)
eq('codePointToChar U+1F600', codePointToChar(0x1f600), '😀');
eq('charToCodePoint emoji', charToCodePoint('😀'), 128512);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll charset self-tests passed');
