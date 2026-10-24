import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAD_WIRING } from '../config/pinouts/pad.ts';
import { BTDAC_WIRING } from '../config/pinouts/btdac.ts';
import { SPEAKER_WIRING } from '../config/pinouts/speaker.ts';
import { guideCopy, localizeGuide, mapGuideText, type GuideCopy } from '../config/pinouts/localizeGuide.ts';
import { MAX_SD_EXAMPLE_VALUES } from '../lib/electronics/max98357.ts';
import { dividerRange, dividerVoltage } from '../lib/electronics/divider.ts';

const guides = [PAD_WIRING, BTDAC_WIRING, SPEAKER_WIRING];
const placeholders = (value: string) => [...value.matchAll(/\{\w+\}/g)].map(m => m[0]).sort();
const read = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as {
  WiringGuideContent: Record<string, GuideCopy>;
  WiringGuide: { ui: Record<string, string> };
};
const spanish = read('es');

for (const locale of ['es', 'en', 'de', 'it']) {
  const messages = read(locale);
  assert.deepEqual(Object.keys(messages.WiringGuide.ui), Object.keys(spanish.WiringGuide.ui));
  for (const [key, value] of Object.entries(messages.WiringGuide.ui)) {
    assert.deepEqual(placeholders(value), placeholders(spanish.WiringGuide.ui[key]), `${locale}: UI ${key}`);
  }
  for (const guide of guides) {
    const copy = messages.WiringGuideContent[guide.meta.id];
    const source = guideCopy(guide);
    assert.deepEqual(Object.keys(copy), Object.keys(source), `${locale}/${guide.meta.id}: all prose fields`);
    for (const [key, text] of Object.entries(copy)) {
      assert.ok(text.trim(), `${locale}/${guide.meta.id}/${key}: empty`);
      assert.deepEqual(placeholders(text), placeholders(spanish.WiringGuideContent[guide.meta.id][key]), `${locale}/${key}: values`);
      assert.doesNotMatch(text, /\|◄\||12 SK6812|2\.9A/, `${locale}/${key}: obsolete PAD diagram/budget`);
      if (locale !== 'es') assert.doesNotMatch(text, /\b(pantalla|pulsador|parlantes|riel|cátodo|Matriz|Energía|soldar|flasheo)\b/u, `${locale}/${key}: untranslated prose`);
    }
    const before = structuredClone(guide);
    const translated = localizeGuide(guide, copy);
    assert.deepEqual(guide, before, 'localization must not mutate shared configuration');
    // Blank only translatable fields: everything else (pins, rails, IDs, key order) must be identical.
    assert.deepEqual(mapGuideText(translated, () => ''), mapGuideText(guide, () => ''), `${locale}/${guide.meta.id}: electrical identity`);
    assert.doesNotMatch(JSON.stringify(translated), /\{sd\w+\}/, 'no unresolved model values');
    if (locale === 'es') assert.deepEqual(guideCopy(translated), source, 'Spanish copy must match the canonical guide');
    assert.throws(() => localizeGuide(guide, { ...copy, meta_subtitle: undefined } as unknown as GuideCopy), /Missing guide translation/);
    assert.throws(() => localizeGuide(guide, { ...copy, meta_subtitle: '{unknown}' }), /Unknown guide value/);
  }
  const pad = localizeGuide(PAD_WIRING, messages.WiringGuideContent.pad);
  assert.ok(pad.sections[3].ascii?.includes('|>|'), 'cathode points toward row');
  assert.ok(pad.check[18].includes(`${MAX_SD_EXAMPLE_VALUES.resistance}k`));
  assert.ok(pad.check[18].includes(`${MAX_SD_EXAMPLE_VALUES.min}–${MAX_SD_EXAMPLE_VALUES.max}V`));
  const speaker = localizeGuide(SPEAKER_WIRING, messages.WiringGuideContent.speaker);
  assert.match(speaker.modules.find(m => m.id === 'battery')!.power, /270k → GPIO34 → 100k/);
  assert.match(speaker.pins.find(p => p.gpio === 34)!.note!, /270k\/100k/);
  assert.match(speaker.sections[1].tip!, /SDA\/SCL.*5V/);
}
assert.equal(dividerVoltage(8.4, 100_000, 100_000), 4.2, 'the old 100k/100k divider put 4.2V on GPIO34');
// Speaker VBAT: 270k/100k keeps a full 2S pack inside the ESP32 11 dB recommended range (≤2.45V), even with 5% parts.
assert.ok(Math.abs(dividerVoltage(8.4, 270_000, 100_000)! - 2.27) < 0.01);
assert.ok(dividerRange(8.4, 270_000, 100_000, 5)!.max <= 2.45);
console.log('Wiring translations: 3 guides × 4 locales, topology, placeholders and diagram regressions passed.');
