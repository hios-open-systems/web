import assert from 'node:assert/strict';
import { parseRepository, readRepository } from '../lib/repositories/reader.ts';
import { landingBeat, randomizeLandingBeat, toggleBeatStep, toggleMelodyStep } from '../lib/workbench/landingBeat.ts';
import { parseSong, serializeSong } from '../lib/workbench/chiptune.ts';

const beat = landingBeat();
assert.equal(parseSong(serializeSong(beat))?.tracks.length,5);
assert.equal(toggleBeatStep(beat,'Kick',0).tracks[0].notes.some(note => note.start === 0),false);
const melody = toggleMelodyStep(beat,76,4);
assert.ok(melody.tracks[4].notes.some(note => note.pitch === 76 && note.start === 480));
assert.ok(parseSong(serializeSong(melody)));
const remixed = randomizeLandingBeat(beat, 12345);
assert.equal(remixed.tracks.length, 5);
assert.ok(parseSong(serializeSong(remixed)));
for (const url of ['http://github.com/a/b','https://github.com.evil/a/b','https://user:pass@github.com/a/b',
  'https://github.com/a/b?x=1','https://gitlab.com/a/b#x','https://example.org/a/b','https://github.com/a/b/c']) {
  assert.throws(() => parseRepository(url,''));
}
const github = parseRepository('https://github.com/a/b.git','feature/demo');
const gitlab = parseRepository('https://gitlab.com/group/subgroup/project','main');
assert.equal(gitlab.project,'group/subgroup/project');
const originalFetch = globalThis.fetch;
let calls = 0;
try {
  globalThis.fetch = async (input, init) => {
    calls++; const url = new URL(String(input));
    assert.ok(['api.github.com','gitlab.com'].includes(url.hostname));
    assert.equal(init?.method,'GET'); assert.equal(init?.credentials,'omit');
    assert.equal(init?.redirect,'error'); assert.equal(init?.cache,'no-store');
    assert.equal(init?.referrerPolicy,'no-referrer');
    return Response.json([{name:'README.md',path:'README.md',type:'file'}]);
  };
  const result = await readRepository(github,'test-only','',true,new AbortController().signal);
  assert.equal(result.entries?.length,1); assert.equal(calls,1);
  await assert.rejects(readRepository(github,'test-only','../private',true,new AbortController().signal));
  assert.equal(calls,1);
  globalThis.fetch = async () => new Response('x'.repeat(1_500_001));
  await assert.rejects(readRepository(gitlab,'test-only','file',false,new AbortController().signal));
  globalThis.fetch = async () => new Response('binary\0data');
  await assert.rejects(readRepository(gitlab,'test-only','file',false,new AbortController().signal));
  globalThis.fetch = async () => new Response('denied',{status:403});
  await assert.rejects(readRepository(github,'test-only','file',false,new AbortController().signal));
} finally { globalThis.fetch = originalFetch; }
console.log('Repository boundaries, read-only requests, response limits and editable demo models passed.');
