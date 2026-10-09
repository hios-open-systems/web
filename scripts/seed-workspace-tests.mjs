import { getPlatformProxy } from 'wrangler';
import { readFileSync, readdirSync } from 'node:fs';
const proxy = await getPlatformProxy({ configPath: 'tests/fixtures/workspaces.wrangler.jsonc', persist: { path: '.wrangler/workspace-e2e' } });
try {
  for (const file of readdirSync('migrations').filter(file => file.endsWith('.sql')).sort()) {
    const sql = readFileSync(`migrations/${file}`, 'utf8');
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await proxy.env.DB.prepare(statement).run();
  }
  for (const [id, githubId] of [['workspace-test-a', 980001], ['workspace-test-b', 980002]]) {
    await proxy.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    await proxy.env.DB.prepare('INSERT INTO users(id, github_id, github_login) VALUES(?,?,?)').bind(id, githubId, id).run();
    await proxy.env.DB.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').bind(id + '-session', id, Math.floor(Date.now()/1000)+86400).run();
  }
  console.log('Local D1 seeded with two isolated test accounts');
} finally { await proxy.dispose(); }
