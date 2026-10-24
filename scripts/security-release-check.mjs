import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

// Read-only gate. Never print secret values or create a deployment.
const account = '74517853847d3bfb25721012cf268858';
const key = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
if (!key || !/^[a-zA-Z0-9_-]{10,100}$/.test(key) || /^[123]x0+/.test(key)) {
  throw new Error('Configure a real NEXT_PUBLIC_TURNSTILE_SITEKEY before building and releasing.');
}
if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCOUNT_ID !== account) {
  throw new Error('Wrong Cloudflare account.');
}
const assets = readdirSync('.open-next/assets', { recursive: true });
if (!assets.some(path => path.endsWith('.js') && readFileSync(`.open-next/assets/${path}`, 'utf8').includes(key))) {
  throw new Error('Turnstile site key is absent from the built browser assets. Rebuild before release.');
}
const secrets = JSON.parse(execFileSync(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'secret', 'list', '--name', 'hios-platform',
], { encoding: 'utf8', env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: account, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] }));
for (const name of ['GITHUB_CLIENT_SECRET', 'TURNSTILE_SECRET_KEY']) {
  if (!secrets.some(secret => secret.name === name)) throw new Error(`Missing production secret: ${name}`);
}
console.log('Security release prerequisites present. Validate widget hostname and OAuth settings before release.');
