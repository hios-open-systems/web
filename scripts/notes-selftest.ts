/**
 * Self-test for the Markdown Notes logic (pure serialize/parse + helpers).
 *
 * Run: node --experimental-strip-types scripts/notes-selftest.ts
 */
import {
  createNoteDraft,
  isNoteRecord,
  parseNotes,
  serializeNotes,
} from '../lib/workbench/notes.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const d = createNoteDraft({ title: 'T', body: 'B' });
ok('draft shape', isNoteRecord(d) && d.title === 'T' && d.body === 'B');
ok('draft has id', typeof d.id === 'string' && d.id.length > 0);
ok('draft timestamps', d.createdAt > 0 && d.updatedAt > 0);
ok('default title', createNoteDraft().title === 'Untitled note');

const round = parseNotes(serializeNotes([d]));
ok('round-trip', round.length === 1 && round[0].id === d.id && round[0].body === 'B');

ok('parse null -> []', parseNotes(null).length === 0);
ok('parse garbage -> []', parseNotes('{not json').length === 0);
ok('parse wrong version -> []', parseNotes(JSON.stringify({ version: 9, notes: [d] })).length === 0);
ok(
  'parse filters bad records',
  parseNotes(JSON.stringify({ version: 1, notes: [d, { id: 1 }] })).length === 1,
);

ok('isNoteRecord rejects null', !isNoteRecord(null));
ok('isNoteRecord rejects partial', !isNoteRecord({ id: 'x', title: 'y' }));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll notes self-tests passed');
