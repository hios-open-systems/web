// Renders the project cover images from the three.js scenes in scripts/covers/.
// Each scene loads the project's real STLs from public/downloads/ and writes
// public/images/<slug>/cover.jpg. Run: npm run covers [-- pad speaker ...]
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const SCENES = { pad: 'pad', btdac: 'btdac', speaker: 'speaker', 'hios-node-ai': 'node-ai' };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.stl': 'model/stl', '.json': 'application/json' };
const ALLOWED = ['scripts/covers/', 'node_modules/three/', 'public/downloads/'];

const server = createServer(async (req, res) => {
  const rel = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
  if (!ALLOWED.some((p) => rel.startsWith(p))) return res.writeHead(404).end();
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : Object.keys(SCENES);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.error('scene error:', e.message));
for (const slug of slugs) {
  if (!SCENES[slug]) throw new Error(`no scene for ${slug}`);
  await page.goto(`${base}/scripts/covers/${SCENES[slug]}.html`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 180000 });
  mkdirSync(join(ROOT, 'public/images', slug), { recursive: true });
  const out = join(ROOT, 'public/images', slug, 'cover.jpg');
  await (await page.$('canvas')).screenshot({ path: out, type: 'jpeg', quality: 88 });
  console.log('cover ->', out);
}
await browser.close();
server.close();
