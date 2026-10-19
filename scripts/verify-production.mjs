import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const origin = 'https://openhios.dev';
const routes = ['calculators', 'workbench/qpsk-modulator', 'pinouts/pad', 'pinouts/btdac', 'pinouts/speaker'];

export async function verifyProduction(sha, { request = fetch, wait = delay, attempts = 12 } = {}) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('A full commit SHA is required');
  const expected = sha.slice(0, 12);
  let matched = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await request(`${origin}/api/version?deploy=${sha}&attempt=${attempt}`, {
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000),
      });
      matched = response.ok && (await response.json()).version === expected;
    } catch { /* Allow bounded propagation and transient network errors. */ }
    if (matched) break;
    if (attempt + 1 < attempts) await wait(10_000);
  }
  if (!matched) throw new Error(`Production did not publish ${expected}`);
  for (const locale of ['en', 'es', 'de', 'it']) {
    for (const route of routes) {
      const url = `${origin}/${locale}/${route}`;
      const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
      const html = await response.text();
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html') || !html.includes('<html')) {
        throw new Error(`Production route failed: ${url} (${response.status})`);
      }
    }
  }
  return expected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyProduction(process.env.GITHUB_SHA ?? process.argv[2])
    .then(version => console.log(`Production ${version}: version and 20 localized routes verified`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
