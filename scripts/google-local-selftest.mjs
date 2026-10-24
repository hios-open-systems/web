import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, statSync, unlinkSync, rmdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const folder = mkdtempSync(join(tmpdir(), 'hios-google-local-'));
const file = join(folder, 'invalid-client.json');
const destination = 'config/google-login/.dev.vars';
const before = existsSync(destination) ? statSync(destination).mtimeMs : null;
const canary = 'synthetic-secret-never-print';
function reject(args) {
  const result = spawnSync(process.execPath, ['scripts/google-local.mjs', ...args], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  const output = result.stdout + result.stderr;
  assert.equal(output.includes(canary), false, 'Never expose the credential in diagnostics');
  assert.equal(output.includes('wrangler'), false, 'Reject before starting any Cloudflare command');
}
try {
  writeFileSync(file, JSON.stringify({ web: {
    client_id: 'local-test.apps.googleusercontent.com', client_secret: canary,
    redirect_uris: ['https://openhios.dev/api/auth/google/callback'],
  } }));
  reject([file]);
  writeFileSync(file, JSON.stringify({ installed: { client_secret: canary } }));
  reject([file]);
  reject(['--remote']);
  reject(['--deploy']);
  assert.equal(existsSync(destination) ? statSync(destination).mtimeMs : null, before);
  const config = JSON.parse(readFileSync('config/google-login/wrangler.jsonc', 'utf8'));
  assert.equal(config.vars.AUTH_BASE_URL, 'http://localhost:3300');
  assert.equal(config.dev.ip, '127.0.0.1');
  assert.equal(config.d1_databases[0].database_id, '00000000-0000-0000-0000-000000000009');
  assert.equal(config.account_id, undefined);
  console.log('Local Google setup rejects wrong client/callback and remote flags without exposing credentials.');
} finally { unlinkSync(file); rmdirSync(folder); }
