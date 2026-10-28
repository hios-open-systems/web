import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactHash, assertReceipt, assertRemote } from './release-state.mjs';
import { runStages } from './release-commands.mjs';

const root = mkdtempSync(join(tmpdir(), 'hios-release-'));
try {
  writeFileSync(join(root, 'worker.js'), 'tested worker');
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'assets', 'chunk.js'), 'tested asset');
  const current = { sha: 'a'.repeat(40), artifact: artifactHash(root), key: 'public-key-hash', node: process.version };
  const receipt = { schema: 1, ...current };
  assertReceipt(receipt, current);
  assert.throws(() => assertReceipt(null, current), /missing or stale/);
  for (const field of ['sha', 'artifact', 'key', 'node']) {
    assert.throws(() => assertReceipt(receipt, { ...current, [field]: 'changed' }), /stale/);
  }
  writeFileSync(join(root, 'assets', 'chunk.js'), 'modified asset');
  assert.throws(() => assertReceipt(receipt, { ...current, artifact: artifactHash(root) }), /artifact/);
  assertRemote(current.sha, `${current.sha}\trefs/heads/main`);
  assert.throws(() => assertRemote(current.sha, `${'b'.repeat(40)}\trefs/heads/main`), /differs/);
  assert.throws(() => assertRemote(current.sha, ''), /differs/);
  const reached = [];
  assert.throws(() => runStages(['lint', 'failed test', 'build', 'receipt'], stage => {
    reached.push(stage);
    if (stage === 'failed test') throw new Error('Test failed');
  }), /Test failed/);
  assert.deepEqual(reached, ['lint', 'failed test']);
  console.log('Release: stale commits/assets/config, unpublished commits and failed stages are blocked.');
} finally { rmSync(root, { recursive: true, force: true }); }
