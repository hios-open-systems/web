import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
export default function setup() {
  execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--local',
    '--config', 'tests/fixtures/workspaces.wrangler.jsonc', '--persist-to', '.wrangler/workspace-e2e'], { stdio: 'inherit', env: { ...process.env, CI: '1' } });
  const sql: string[] = [];
  for (const [id, githubId, login] of [['a', 990101, 'juanjparedez'], ['b', 990102, 'security-b'], ['owner', 37183343, 'renamed-owner']]) {
    sql.push(`DELETE FROM users WHERE id = 'security-${id}';
      INSERT INTO users (id, github_id, github_login) VALUES ('security-${id}', ${githubId}, '${login}');
      INSERT INTO sessions (id, user_id, expires_at) VALUES ('security-${id}-session', 'security-${id}', unixepoch() + 3600);`);
  }
  sql.push("INSERT OR REPLACE INTO sessions (id, user_id, expires_at) VALUES ('security-expired-session', 'security-a', 1);");
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/security-seed.sql', sql.join('\n'));
  execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', '--local', '--yes',
    '--config', 'tests/fixtures/workspaces.wrangler.jsonc', '--persist-to', '.wrangler/workspace-e2e', '--file', 'test-results/security-seed.sql'], { stdio: 'inherit' });
}
