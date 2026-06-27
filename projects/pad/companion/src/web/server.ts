import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { log } from '../log';
import type { MirrorHub } from './mirrorHub';
import type { Device } from '../device';
import { handleConfig } from './configApi';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// Sirve los assets del espejo desde src/web/public (JS/HTML plano, sin bundler).
// __dirname compilado = dist/web -> sube a la raiz del companion -> src/web/public.
function publicDir(): string {
  const candidates = [join(__dirname, 'public'), resolve(__dirname, '../../src/web/public')];
  for (const c of candidates) if (existsSync(join(c, 'index.html'))) return c;
  return candidates[candidates.length - 1];
}

// Server local del UI-mirror: estaticos + SSE en /events + config (per-OS). Sin deps (http nativo).
export function startWebServer(port: number, hub: MirrorHub, device: Device, token: string): void {
  const root = publicDir();
  const server = createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];

    if (url.startsWith('/api/config')) { await handleConfig(req, res, device, token, url); return; }
    if (url === '/events') {                       // stream SSE: pad -> browser
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('retry: 2000\n\n');                // reconexion del navegador
      hub.add(res);
      return;
    }

    // Estaticos (con guardia contra path traversal).
    const rel = normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, '');
    const file = join(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  server.on('error', (e) => log.error(`web server (${port}): ${String(e)}`));
  server.listen(port, () => log.info(`espejo (UI-mirror) -> http://localhost:${port}`));
}
