import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANNELS, mapDibit, GRAY_ORDER } from '../components/dsp/QpskSimulator/qpskMath.ts';

function read(path: string) { return readFileSync(new URL('../' + path, import.meta.url), 'utf8'); }

export function testContent(): void {
  console.log('QPSK: article tables, translated controls, channel colors and equations');
  let referenceKeys: string[] | undefined;
  for (const locale of ['es', 'en', 'de', 'it']) {
    const messages = JSON.parse(read('messages/' + locale + '.json'));
    const strings = messages.Qpsk;
    const keys = Object.keys(strings).sort();
    if (referenceKeys) assert.deepEqual(keys, referenceKeys);
    referenceKeys = keys;
    const article = read('content/blog/' + (locale === 'es' ? '' : locale + '/') + 'ref-modulacion-qpsk.md');
    for (const channel of CHANNELS) {
      const line = article.split('\n').find((line) => line.startsWith('* **' + channel.label + ','));
      assert.ok(line, locale + ': missing channel ' + channel.id);
      assert.ok(line.includes(strings.colors[channel.colorName]), locale + ': wrong color ' + channel.id);
      if (channel.bit) assert.ok(line.includes(channel.bit + ' = 0'), locale + ': wrong branch bit');
    }
    for (const dibit of GRAY_ORDER) {
      const symbol = mapDibit(dibit);
      const line = article.split('\n').find((line) => line.startsWith('| `' + dibit + '` |'));
      assert.ok(line);
      const cells = line.split('|').map((s) => s.trim());
      assert.equal(cells[2], symbol.I > 0 ? '`+1`' : '`−1`');
      assert.equal(cells[3], symbol.Q > 0 ? '`+1`' : '`−1`');
      assert.equal(cells[4], symbol.phaseDeg + '°');
    }
    for (const key of ['force180', 'pause', 'connections', 'noise']) {
      assert.ok(article.includes('**' + strings[key] + '**'), locale + ': stale control label ' + key);
    }
    for (const equation of ['I = 1 − 2b₀', 'Q = 1 − 2b₁',
      's(t) = [I·cos(ωc·t) − Q·sin(ωc·t)] / √2 = cos(ωc·t + φ)',
      'N₀ = 2σ²', 'Pb = Qfunc(1/(√2·σ)) = ½·erfc(1/(2σ))']) {
      assert.ok(article.includes(equation), locale + ': missing model equation');
    }
    assert.equal(article.split('<!-- interactive:qpsk-simulator -->').length, 2);
    assert.ok(article.includes('6.11 dB') && article.includes('0.0217'));
    assert.ok(strings.modelLimits.includes('σ = 0'));
    assert.ok(!messages.Workbench.packs['qpsk-modulator'].description.match(/demodul/i));
    assert.ok(!article.includes('SINGLE SHOT'));
  }
}
