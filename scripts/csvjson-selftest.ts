/**
 * Self-test for the CSV <-> JSON tool logic. Exercises the RFC 4180 parser,
 * the serializer, a round-trip, and the object adapters.
 *
 * Run: node --experimental-strip-types scripts/csvjson-selftest.ts
 */
import { jsonToCsv, csvToObjects, objectsToCsv, parseCsv, toCsv } from '../lib/workbench/csvJson.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failures++;
    console.error(`✗ ${name}: got ${g}, want ${w}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// parseCsv: quoted field containing the delimiter
eq('parseCsv quoted delimiter', parseCsv('a,"b,c",d'), [['a', 'b,c', 'd']]);

// parseCsv: escaped quotes ("") inside a quoted field
eq('parseCsv escaped quotes', parseCsv('"he said ""hi"""'), [['he said "hi"']]);

// parseCsv: \r\n row separators and ignored trailing newline
eq('parseCsv crlf + trailing', parseCsv('x,y\r\n1,2\r\n'), [
  ['x', 'y'],
  ['1', '2'],
]);

// parseCsv: embedded \n inside a quoted field
eq('parseCsv embedded newline', parseCsv('a,"line1\nline2",c'), [['a', 'line1\nline2', 'c']]);

// toCsv: quote a field that contains the delimiter
eq('toCsv quote delimiter', toCsv([['a', 'b,c', 'd']]), 'a,"b,c",d');

// toCsv: quote + escape internal quotes
eq('toCsv escape quotes', toCsv([['x', 'he said "hi"']]), 'x,"he said ""hi"""');

// round-trip: serialize then parse back
eq(
  'round-trip',
  parseCsv(
    toCsv([
      ['a', 'b,c', 'd'],
      ['1', '2', '3'],
    ]),
  ),
  [
    ['a', 'b,c', 'd'],
    ['1', '2', '3'],
  ],
);

// csvToObjects: header + one data row
eq('csvToObjects', csvToObjects('name,age\nJuan,30'), [{ name: 'Juan', age: '30' }]);

// objectsToCsv: values String()-ified
eq('objectsToCsv', objectsToCsv([{ name: 'Juan', age: 30 }]), 'name,age\nJuan,30');

// parseCsv: custom delimiter
eq('parseCsv custom delimiter', parseCsv('a;b\n1;2', ';'), [
  ['a', 'b'],
  ['1', '2'],
]);

eq('numeric JSON cells', jsonToCsv([[1, true, null]]), '1,true,');
eq('nested JSON cells', jsonToCsv([{ data: { x: 1 } }]), 'data\n"{""x"":1}"');
eq('prototype header retained', JSON.stringify(csvToObjects('__proto__,x\nhello,1')), '[{"__proto__":"hello","x":"1"}]');
for (const input of [[1, { x: 2 }], [null], 'text']) {
  let rejected = false;
  try { jsonToCsv(input); } catch { rejected = true; }
  eq('reject non-table JSON', rejected, true);
}
if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll csv/json self-tests passed');
