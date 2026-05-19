/**
 * Self-test for the saved-themes logic (pure, sync).
 *
 * Run: node --experimental-strip-types scripts/themes-selftest.ts
 */
import {
  addSavedTheme,
  isSavedTheme,
  parseSavedThemes,
  removeSavedTheme,
  serializeSavedThemes,
} from '../lib/themes/saved.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

let list = addSavedTheme([], 'Amber night', '#f59e0b', 'dark');
ok('add creates one', list.length === 1 && list[0].name === 'Amber night');
ok('added is valid', isSavedTheme(list[0]));

list = addSavedTheme(list, 'Cyan day', '#0ea5e9', 'light');
ok('add second (newest first)', list.length === 2 && list[0].name === 'Cyan day');

list = addSavedTheme(list, 'amber NIGHT', '#111111', 'light');
ok('replace by case-insensitive name', list.length === 2 && list.some((x) => x.accent === '#111111'));

ok('empty name rejected', addSavedTheme(list, '   ', '#fff000', 'dark') === list);
ok('bad hex rejected', addSavedTheme(list, 'Bad', 'nothex', 'dark') === list);

const removed = removeSavedTheme(list, list[0].id);
ok('remove drops one', removed.length === 1);

const round = parseSavedThemes(serializeSavedThemes(list));
ok('round-trip', round.length === 2 && round[0].name === list[0].name);

ok('parse null -> []', parseSavedThemes(null).length === 0);
ok('parse garbage -> []', parseSavedThemes('{nope').length === 0);
ok(
  'parse wrong version -> []',
  parseSavedThemes(JSON.stringify({ version: 7, themes: list })).length === 0,
);
ok(
  'parse filters bad records',
  parseSavedThemes(JSON.stringify({ version: 1, themes: [list[0], { id: 'x' }] })).length === 1,
);
ok('isSavedTheme rejects bad mode', !isSavedTheme({ id: 'a', name: 'b', accent: '#fff', mode: 'sepia' }));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll saved-themes self-tests passed');
