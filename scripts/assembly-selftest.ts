import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAD_WIRING } from '../config/pinouts/pad.ts';
import { BTDAC_WIRING } from '../config/pinouts/btdac.ts';
import { assemblyModules, moduleConnections, moduleSections, assemblyTaskIds, assemblyStorageKey, parseAssemblyProgress } from '../lib/padWiring/assembly.ts';

for (const guide of [PAD_WIRING, BTDAC_WIRING]) {
  const modules = assemblyModules(guide);
  assert.equal(modules[0].id, 'power');
  assert.ok(!modules.some(item => item.id === 'system'));
  const connections = modules.flatMap(item => moduleConnections(guide, item.id));
  assert.equal(connections.length, guide.pins.filter(pin => pin.mod !== 'system').length);
  assert.equal(new Set(connections.map(item => item.id)).size, connections.length);
  for (const connection of connections) {
    const original = guide.pins.find(pin => pin.gpio === connection.gpio)!;
    assert.equal(connection.dest, original.dest);
    assert.equal(connection.kind, original.kind);
    assert.equal(connection.note, original.note);
  }
  const ids = assemblyTaskIds(guide);
  assert.equal(ids.length, modules.length * 3);
  assert.deepEqual(parseAssemblyProgress(JSON.stringify([ids[0], ids[0], 'stale', null, 1]), ids), [ids[0]]);
  for (const raw of [null, 'broken', '{}', '42']) assert.deepEqual(parseAssemblyProgress(raw, ids), []);
  assert.notEqual(assemblyStorageKey(guide), assemblyStorageKey({ ...guide, meta: { ...guide.meta, rev: 'future' } }));
}
assert.notEqual(assemblyStorageKey(PAD_WIRING), assemblyStorageKey(BTDAC_WIRING));
assert.deepEqual(moduleConnections(BTDAC_WIRING, 'dac').map(pin => pin.gpio), [27, 14, 13]);
assert.ok(moduleSections(BTDAC_WIRING, 'dac').some(section => section.rows?.some(row => row.pin === 'SCK')));
assert.equal(moduleSections(PAD_WIRING, 'audio').length, 3, 'Include SD selection and speaker wiring, not only GPIOs');
assert.equal(BTDAC_WIRING.meta.boardId, undefined, 'Do not invent a physical ESP32 variant');
const copies = ['en', 'es', 'de', 'it'].map(locale => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')));
for (const namespace of ['Assembly', 'PinExplorer']) {
  for (const copy of copies) {
    assert.deepEqual(Object.keys(copy[namespace]).sort(), Object.keys(copies[0][namespace]).sort());
    assert.ok(Object.values(copy[namespace]).every(value => typeof value === 'string' && value.trim()));
  }
}
console.log('Assembly: firmware-backed signals, stable progress, revision isolation and four locales OK');
