import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { verifyProduction } from './verify-production.mjs';

const workflow = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
assert.equal(workflow.jobs.build.needs, 'test', 'Publishing must depend on self-tests');
assert.equal(workflow.concurrency['cancel-in-progress'], "${{ github.event_name == 'pull_request' }}");
assert.deepEqual(workflow.permissions, { contents: 'read' });
const steps = workflow.jobs.build.steps;
const deployIndex = steps.findIndex(step => step.run === 'npx opennextjs-cloudflare deploy');
assert.ok(deployIndex > 0);
const guardIndex = steps.findIndex(step => step.name === 'Verify production deployment prerequisites');
assert.equal(guardIndex, deployIndex - 1);
assert.match(steps[guardIndex].run, /WORKERS_BUILDS_DISABLED/);
assert.match(steps[guardIndex].run, /git\/ref\/heads\/main/);
assert.match(steps[guardIndex].run, /GITHUB_SHA/);
for (const step of steps.filter(step => step.env?.CLOUDFLARE_API_TOKEN || step.run === 'node scripts/verify-production.mjs')) {
  assert.equal(step.if, "github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.WORKERS_BUILDS_DISABLED == 'true'");
}
assert.equal(steps.filter(step => step.run === 'npx opennextjs-cloudflare build').length, 1);
for (const [index, step] of steps.entries()) {
  if (/playwright test|test:seo|test:sitemap/.test(step.run ?? '')) {
    assert.ok(index < guardIndex, 'All validation must precede deployment');
    assert.equal(step['continue-on-error'], undefined);
    assert.equal(step.if, undefined);
  }
}
const sha = 'a'.repeat(40);
const version = () => Response.json({ version: sha.slice(0, 12) });
const page = () => new Response('<html lang="en"></html>', { headers: { 'content-type': 'text/html' } });
let calls = 0;
let waits = 0;
const request = async url => {
  calls++;
  if (!url.includes('/api/version')) return page();
  return calls === 1 ? Response.json({ version: 'old' }) : version();
};
assert.equal(await verifyProduction(sha, { request, wait: async () => { waits++; } }), sha.slice(0, 12));
assert.equal(calls, 22);
assert.equal(waits, 1);
await assert.rejects(verifyProduction(''), /full commit/);
await assert.rejects(verifyProduction(sha, { request: async () => Response.json({ version: 'old' }), attempts: 1 }), /did not publish/);
await assert.rejects(verifyProduction(sha, { request: async () => { throw new Error('offline'); }, attempts: 1 }), /did not publish/);
await assert.rejects(verifyProduction(sha, { request: async url => url.includes('/api/version') ? version() : new Response('error', { status: 500 }) }), /route failed/);
await assert.rejects(verifyProduction(sha, { request: async url => url.includes('/api/version') ? version() : Response.json({ ok: true }) }), /route failed/);
console.log('Deployment gate, stale version, propagation, network errors and production route failures: OK');
