import assert from 'node:assert/strict';
import { requestLocalCompletion } from './lmstudio-client.ts';

const output = await requestLocalCompletion('local source code', async (url, options) => {
  assert.equal(url, 'http://127.0.0.1:1234/v1/chat/completions');
  assert.equal(options?.redirect, 'error');
  assert.equal(options?.method, 'POST');
  assert.deepEqual(JSON.parse(String(options?.body)), {
    model: 'nemotron-3-nano', messages: [{ role: 'user', content: 'local source code' }], stream: false,
  });
  return Response.json({ choices: [{ message: { content: 'class ConfigViewModel {}' } }] });
});
assert.equal(output, 'class ConfigViewModel {}');
await assert.rejects(requestLocalCompletion('test', async () => new Response('unavailable', { status: 503 })), /HTTP 503/);
for (const invalid of [null, {}, { choices: [] }, { choices: [{ message: { content: '' } }] }, { choices: [{ message: { content: 42 } }] }]) {
  await assert.rejects(requestLocalCompletion('test', async () => Response.json(invalid)), /no generated text/);
}
await assert.rejects(requestLocalCompletion('test', async () => { throw new Error('offline'); }), /offline/);
console.log('Local LM Studio request, response validation and failures: OK');
