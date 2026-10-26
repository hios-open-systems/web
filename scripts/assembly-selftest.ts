import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAD_WIRING } from '../config/pinouts/pad.ts';
import { BTDAC_WIRING } from '../config/pinouts/btdac.ts';
import { SPEAKER_WIRING } from '../config/pinouts/speaker.ts';
import { ESP32_S3_BOARD } from '../config/pinouts/modules/mcu.ts';
import { assemblyModules, moduleWires, moduleSections, headerSpot, assemblyTaskIds, assemblyStorageKey, parseAssemblyProgress } from '../lib/padWiring/assembly.ts';

for (const guide of [PAD_WIRING, BTDAC_WIRING, SPEAKER_WIRING]) {
  const modules = assemblyModules(guide);
  assert.equal(modules[0].id, 'power');
  assert.ok(!modules.some(item => item.id === 'system'));
  const wires = modules.flatMap(item => moduleWires(guide, item.id));
  assert.equal(new Set(wires.map(item => item.id)).size, wires.length, `${guide.meta.id}: wire ids are unique`);
  // every firmware GPIO outside "system" must be a joint of its own module
  for (const pin of guide.pins.filter(item => item.mod !== 'system')) {
    assert.ok(moduleWires(guide, pin.mod).some(wire => wire.pin === String(pin.gpio)), `${guide.meta.id}: GPIO${pin.gpio} missing from ${pin.mod}`);
  }
  const ids = assemblyTaskIds(guide);
  assert.equal(ids.length, wires.length);
  assert.deepEqual(parseAssemblyProgress(JSON.stringify([ids[0], ids[0], 'stale', null, 1]), ids), [ids[0]]);
  for (const raw of [null, 'broken', '{}', '42']) assert.deepEqual(parseAssemblyProgress(raw, ids), []);
  assert.notEqual(assemblyStorageKey(guide), assemblyStorageKey({ ...guide, meta: { ...guide.meta, rev: 'future' } }));
}
assert.notEqual(assemblyStorageKey(PAD_WIRING), assemblyStorageKey(BTDAC_WIRING));
assert.deepEqual(moduleWires(BTDAC_WIRING, 'dac').filter(w => /^\d+$/.test(w.pin)).map(w => Number(w.pin)).sort((a, b) => a - b), [13, 14, 27]);
assert.equal(moduleSections(PAD_WIRING, 'audio').length, 3, 'Include SD selection and speaker wiring, not only GPIOs');
assert.equal(BTDAC_WIRING.meta.boardId, undefined, 'Do not invent a physical ESP32 variant');

// Physical header positions for the PAD: every GPIO lands on a real DevKitC-1 pin.
const board = ESP32_S3_BOARD;
for (const pin of PAD_WIRING.pins) assert.ok(headerSpot(board, String(pin.gpio)), `GPIO${pin.gpio} not on the header`);
assert.deepEqual(headerSpot(board, '10'), { header: 'J1', side: 'left', pos: 16, silk: 'IO10' });
assert.deepEqual(headerSpot(board, '38'), { header: 'J3', side: 'right', pos: 10, silk: 'IO38' });
assert.deepEqual(headerSpot(board, '5V'), { header: 'J1', side: 'left', pos: 21, silk: '5V' });
assert.equal(headerSpot(board, 'SD'), undefined, 'Module-side pins never get a header position');
const display = moduleWires(PAD_WIRING, 'display', board);
assert.deepEqual(display.filter(w => w.spot).map(w => `${w.spot!.header}-${w.spot!.pos}`), ['J1-16', 'J1-17', 'J1-18', 'J1-19', 'J1-20', 'J1-15']);

assert.deepEqual(moduleWires(PAD_WIRING, 'power', board).filter(w => w.spot).map(w => `${w.spot!.header}-${w.spot!.pos}`), ['J1-21', 'J1-1', 'J1-22']);

const copies = ['en', 'es', 'de', 'it'].map(locale => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')));
for (const namespace of ['Assembly', 'PinExplorer']) {
  for (const copy of copies) {
    assert.deepEqual(Object.keys(copy[namespace]).sort(), Object.keys(copies[0][namespace]).sort());
    assert.ok(Object.values(copy[namespace]).every(value => typeof value === 'string' && value.trim()));
  }
}
console.log('Assembly: soldering joints, header positions, stable progress, revision isolation and four locales OK');
