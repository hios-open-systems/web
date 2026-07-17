const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { loadConfig } = require('../dist/config.js');

const dir = mkdtempSync(join(tmpdir(), 'pad-companion-config-'));
const configPath = join(dir, 'config.json');

function load(value) {
  writeFileSync(configPath, JSON.stringify(value));
  return loadConfig(['node', 'index.js', '--config', configPath]);
}

try {
  const valid = load({
    host: 'pad.local', token: 'secret', pollMs: 500,
    send: { mic: false }, web: { enabled: false, port: 9000 }, discover: false,
    wiz: { rooms: [{ name: 'Office', lights: [{ name: 'Desk', mac: 'aabbccddeeff' }] }] },
    apps: [{ label: 'Editor', win: 'code', linux: 'code' }],
  });
  assert.equal(valid.host, 'pad.local');
  assert.equal(valid.token, 'secret');
  assert.equal(valid.pollMs, 500);
  assert.equal(valid.send.mic, false);
  assert.equal(valid.send.vol, true);
  assert.equal(valid.web.enabled, false);
  assert.equal(valid.web.port, 9000);
  assert.equal(valid.discover, false);
  assert.deepEqual(valid.wiz.rooms, [{ name: 'Office', lights: [{ name: 'Desk', mac: 'aabbccddeeff' }] }]);
  assert.deepEqual(valid.apps, [{ label: 'Editor', win: 'code', linux: 'code' }]);

  const invalid = load({
    host: 7, pollMs: 1, send: 'bad', web: { enabled: 'yes', port: 70000 },
    discover: 'yes', wiz: { rooms: [{ name: '', lights: [] }] }, apps: [{}],
  });
  assert.equal(invalid.host, 'hiospad.local');
  assert.equal(invalid.pollMs, 1000);
  assert.equal(invalid.send.mic, true);
  assert.equal(invalid.web.enabled, true);
  assert.equal(invalid.web.port, 8787);
  assert.equal(invalid.discover, true);
  assert.deepEqual(invalid.wiz.rooms, []);
  assert.equal(invalid.apps.length, 6);

  const nonObject = load([]);
  assert.equal(nonObject.host, 'hiospad.local');
  assert.equal(nonObject.pollMs, 1000);

  console.log('config self-test: OK');
} finally {
  rmSync(dir, { recursive: true, force: true });
}