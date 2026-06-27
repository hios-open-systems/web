import { readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Device } from '../device';
import { osName } from '../providers';

// El companion es la FUENTE DE VERDAD de la config: guarda un formato "rico"
// (config.edit.json) donde cada accion puede ser per-OS ({win,linux}) y, al
// guardar, RESUELVE por el OS detectado y pushea un config plano al pad (que el
// firmware entiende tal cual). El pad arranca antes de saber el OS -> no puede
// resolver el solo; por eso vive aca.

const EDIT_FILE = join(process.cwd(), 'config.edit.json');

type AnyObj = Record<string, unknown>;
function osKey(): 'win' | 'linux' {
  const o = osName();
  return o === 'Linux' ? 'linux' : 'win';   // Windows/WSL/mac -> atajos "win" por defecto
}

// Una accion per-OS es un objeto con win/linux y SIN "t" (que marca una accion plana).
function isVariant(v: unknown): v is { win?: unknown; linux?: unknown } {
  return !!v && typeof v === 'object' && !Array.isArray(v) && !('t' in (v as AnyObj)) &&
         ('win' in (v as AnyObj) || 'linux' in (v as AnyObj));
}
function resolveAction(v: unknown, k: 'win' | 'linux'): unknown {
  if (!isVariant(v)) return v;
  return v[k] ?? v.win ?? v.linux ?? { t: 'none' };
}
// Aplana el config rico -> el schema plano del pad, eligiendo la variante del OS.
function resolveConfig(edit: AnyObj, k: 'win' | 'linux'): AnyObj {
  const flat: AnyObj = JSON.parse(JSON.stringify(edit ?? {}));
  for (const L of (flat.layers as AnyObj[]) ?? [])
    for (const b of (L.binds as AnyObj[]) ?? [])
      for (const f of ['press', 'long', 'cw', 'ccw']) if (b[f] !== undefined) b[f] = resolveAction(b[f], k);
  for (const m of (flat.macros as AnyObj[]) ?? [])
    for (const s of (m.steps as AnyObj[]) ?? []) if (s.action !== undefined) s.action = resolveAction(s.action, k);
  return flat;
}

async function padFetch(device: Device, token: string, path: string, method: string, body?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Pad-Token'] = token;
  const r = await fetch(`http://${device.currentHost}${path}`, { method, headers, body, signal: AbortSignal.timeout(8000) });
  return { status: r.status, text: await r.text() };
}
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString();
}

// /api/config (GET -> {os, edit}), /api/config (POST <- edit) , /api/config/reset (POST)
export async function handleConfig(req: IncomingMessage, res: ServerResponse, device: Device, token: string, path: string): Promise<void> {
  const send = (status: number, text: string): void => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(text);
  };
  try {
    if (path === '/api/config/reset' && req.method === 'POST') {
      await rm(EDIT_FILE, { force: true });                      // borra el editor -> GET re-seedea del pad
      const r = await padFetch(device, token, '/api/config/reset', 'POST');
      send(r.status, r.text); return;
    }
    if (path === '/api/config' && req.method === 'GET') {
      if (existsSync(EDIT_FILE)) {
        const edit = JSON.parse(await readFile(EDIT_FILE, 'utf8'));
        send(200, JSON.stringify({ os: osKey(), edit })); return;
      }
      const r = await padFetch(device, token, '/api/config', 'GET');   // seed: config plano actual del pad
      if (r.status !== 200) { send(502, `{"error":"pad no respondio (${device.currentHost})"}`); return; }
      const flat = JSON.parse(r.text);
      await writeFile(EDIT_FILE, JSON.stringify(flat), 'utf8');
      send(200, JSON.stringify({ os: osKey(), edit: flat })); return;
    }
    if (path === '/api/config' && req.method === 'POST') {
      const edit = JSON.parse(await readBody(req));
      await writeFile(EDIT_FILE, JSON.stringify(edit), 'utf8');         // persiste el rico
      const flat = resolveConfig(edit as AnyObj, osKey());              // resuelve per-OS
      const r = await padFetch(device, token, '/api/config', 'POST', JSON.stringify(flat));
      send(r.status, r.text); return;
    }
    send(404, '{"error":"not found"}');
  } catch (e) {
    send(502, `{"error":"${String(e).replace(/"/g, "'")}"}`);
  }
}
