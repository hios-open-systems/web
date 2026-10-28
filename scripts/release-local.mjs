import { mkdirSync, openSync, closeSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { artifactHash, assertRemote, cleanCommit, git, publicKeyHash, receiptPath, verifiedCommit } from './release-state.mjs';
import { bins, command, gitleaks, node, npm, runStages } from './release-commands.mjs';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd(), false);
Object.assign(process.env, { NEXT_TELEMETRY_DISABLED: '1', WRANGLER_SEND_METRICS: 'false', HIOS_RELEASE: '1' });
const plan = JSON.parse(readFileSync('scripts/release-browser-plan.json', 'utf8'));

function verify() {
  rmSync(receiptPath, { force: true });
  const sha = cleanCommit();
  const key = publicKeyHash();
  let builtArtifact;
  // Pin Next's deploy version even if a shell inherited a remote CI environment.
  for (const name of ['WORKERS_CI_COMMIT_SHA', 'CF_PAGES_COMMIT_SHA', 'VERCEL_GIT_COMMIT_SHA']) delete process.env[name];
  process.env.GITHUB_SHA = sha;
  const stages = [
    ['Gitleaks prerequisite', () => command(gitleaks(), ['version'])],
    ['Clean dependency install', () => npm(['ci'])],
    ['Chromium prerequisite', () => node(bins.playwright, ['install', 'chromium'])],
    ['Git history secret scan', () => command(gitleaks(), ['git', '.', '--log-opts=--all', '--redact=100', '--no-banner'])],
    ['Lint', () => npm(['run', 'lint'])],
    ['Self-tests', () => npm(['test'])],
    ['OpenNext production build', () => { node(bins.opennext, ['build']); builtArtifact = artifactHash(); }],
    ['Worker + local D1 security', () => node(bins.playwright, ['test', '-c', 'playwright.security.config.ts'], { SECURITY_WORKER: '1' })],
    ['Rendered SEO', () => npm(['run', 'test:seo', '--', '--built'])],
    ['Rendered sitemap', () => npm(['run', 'test:sitemap', '--', '--built'])],
    ['Project software content', () => npm(['run', 'test:software'])],
    ...plan.map(stage => [stage.name, () => node(bins.playwright, stage.args)]),
  ];
  runStages(stages, ([name, run]) => { console.log(`\n=== ${name} ===`); run(); });
  if (cleanCommit() !== sha || publicKeyHash() !== key) throw new Error('Inputs changed during verification.');
  if (artifactHash() !== builtArtifact) throw new Error('Build output changed during verification. Rebuild and verify.');
  writeFileSync(receiptPath, JSON.stringify({ schema: 1, sha, key, artifact: builtArtifact, node: process.version,
    verifiedAt: new Date().toISOString(), stages: stages.map(([name]) => name) }, null, 2) + '\n');
  console.log(`\nVerified ${sha.slice(0, 12)}. Next: npm run release:push, then npm run deploy.`);
}

function publish(action) {
  const sha = verifiedCommit();
  if (action === 'push') {
    command('git', ['push', 'origin', `${sha}:refs/heads/main`]);
    return;
  }
  assertRemote(sha, git('ls-remote', 'origin', 'refs/heads/main'));
  node('scripts/security-release-check.mjs');
  // Recheck after remote prerequisites; never rebuild between verification and upload.
  verifiedCommit();
  node(bins.opennext, ['deploy']);
  node('scripts/verify-production.mjs', [sha], { GITHUB_SHA: sha });
}

const action = process.argv[2];
let lock;
try {
  if (!['verify', 'push', 'deploy'].includes(action)) throw new Error('Expected verify, push or deploy.');
  mkdirSync('.release', { recursive: true });
  lock = openSync('.release/lock', 'wx');
  writeFileSync(lock, String(process.pid));
  if (action === 'verify') verify(); else publish(action);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (lock !== undefined) { closeSync(lock); rmSync('.release/lock', { force: true }); }
}
