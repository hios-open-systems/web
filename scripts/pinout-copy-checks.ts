import assert from 'node:assert/strict';
import type { Breakout } from '../config/pinouts/modules/breakout.ts';
import { localizeBreakout, type BreakoutCopy } from '../config/pinouts/modules/localize.ts';

const present = (text: unknown) => assert.ok(typeof text === 'string' && text.trim().length > 0);
const numbers = (text: string) => text.replaceAll(',', '.').match(/\d+(?:\.\d+)?/g) ?? [];
const numericFacts = (text: string) => [...new Set(numbers(text))].sort();

export function checkPinoutCopies(sources: Breakout[], copies: Record<string, BreakoutCopy>) {
  assert.deepEqual(Object.keys(copies).sort(), sources.map((b) => b.id).sort());
  for (const source of sources) {
    const copy = copies[source.id];
    for (const key of ['name', 'description', 'form', 'iface', 'voltage'] as const) present(copy[key]);
    assert.deepEqual(copy.pins.map((p) => p.name).sort(), source.pins.map((p) => p.name).sort());
    for (const pin of source.pins) {
      const localized = copy.pins.find((p) => p.name === pin.name)!;
      for (const key of ['to', 'note'] as const) if (pin[key]) {
        present(localized[key]);
        assert.deepEqual(numericFacts(localized[key]!), numericFacts(pin[key]!), `${source.id}.${pin.name}.${key}`);
      }
    }
    assert.equal(copy.notes?.length, source.notes?.length);
    for (const [i, note] of (copy.notes ?? []).entries()) {
      present(note.title); present(note.body);
      assert.deepEqual(numericFacts(note.body), numericFacts(source.notes![i].body), `${source.id}.notes[${i}]`);
    }
    for (const key of ['gain', 'channel', 'jumpers'] as const) {
      const table = source[key];
      if (!table) { assert.equal(copy[key], undefined); continue; }
      assert.equal(copy[key]?.head.length, 2);
      assert.equal(copy[key]?.rows.length, table.rows.length);
      copy[key]!.head.forEach(present);
      copy[key]!.rows.forEach((row, i) => {
        assert.equal(row.length, 2);
        row.forEach((text, j) => {
          present(text);
          assert.deepEqual(numbers(text), numbers(table.rows[i][j]), `${source.id}.${key}[${i}][${j}]`);
        });
      });
    }
    // Locale overlays cannot change wiring, geometry, capabilities or warning severity.
    const localized = localizeBreakout(source, copy);
    assert.equal(localized.board, source.board);
    assert.equal(localized.signalLab, source.signalLab);
    assert.equal(localized.datasheetUrl, source.datasheetUrl);
    assert.equal(localized.kind, source.kind);
    localized.pins.forEach((pin, i) => {
      for (const key of ['name', 'role', 'alt', 'side', 'req'] as const) assert.equal(pin[key], source.pins[i][key]);
    });
    assert.deepEqual(localized.notes?.map((n) => n.warn), source.notes?.map((n) => n.warn));
    assert.deepEqual(localizeBreakout(source, { ...copy, pins: [...copy.pins].reverse() }).pins, localized.pins);
  }
}
