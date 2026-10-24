import { getPlatformProxy } from 'wrangler';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--local',
  '--config', 'tests/fixtures/workspaces.wrangler.jsonc', '--persist-to', '.wrangler/workspace-e2e'], { stdio: 'inherit', env: { ...process.env, CI: '1' } });
const proxy = await getPlatformProxy({ configPath: 'tests/fixtures/workspaces.wrangler.jsonc', persist: { path: '.wrangler/workspace-e2e' } });
try {
  for (const [id, githubId] of [['workspace-test-a', 980001], ['workspace-test-b', 980002]]) {
    await proxy.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    await proxy.env.DB.prepare('INSERT INTO users(id, github_id, github_login) VALUES(?,?,?)').bind(id, githubId, id).run();
    await proxy.env.DB.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').bind(id + '-session', id, Math.floor(Date.now()/1000)+86400).run();
  }
  console.log('Local D1 seeded with two isolated test accounts');
} finally { await proxy.dispose(); }
