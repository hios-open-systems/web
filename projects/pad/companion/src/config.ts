import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from './log';
import type { Room } from './wiz';

export interface Config {
  host: string;                     // "hiospad.local" o una IP (ej "192.168.1.43")
  token: string;                    // "" = sin token; si no, va en el header X-Pad-Token
  pollMs: number;                   // periodo del loop (idle, sin browser mirando el espejo)
  send: Record<string, boolean>;    // que campos mandar
  wiz: { rooms: Room[] };           // cuartos WiZ por MAC (vacio = un cuarto "Todas" autodescubierto)
  web: { enabled: boolean; port: number };  // UI-mirror local (http://localhost:port)
  discover: boolean;                // auto-discovery del pad en la LAN si la IP no responde
  apps: AppEntry[];                 // launcher: la capa Launcher manda launch:<id> = indice aca
}

// App del launcher: comando por OS. El companion ejecuta el del OS detectado.
export interface AppEntry { label: string; win: string; linux: string }

const DEFAULTS: Config = {
  host: 'hiospad.local',
  token: '',
  pollMs: 1000,
  send: { mic: true, cam: false, media: false, vol: true,
          cpuTemp: true, gpuTemp: true, cpuLoad: true, gpuLoad: true, clock: true,
          cpuFan: true, gpuFan: true, ram: true, cores: true, net: true,
          vram: true, disk: true, uptime: true, procs: true },
  wiz: { rooms: [] },
  web: { enabled: true, port: 8787 },
  discover: true,
  apps: [   // ids 0..5 = los botones de la capa Launcher. Ajustá los comandos a tu PC.
    { label: 'VS Code',  win: 'code',                      linux: 'code' },
    { label: 'Slack',    win: 'slack',                     linux: 'slack' },
    { label: 'Chrome',   win: 'start chrome',              linux: 'google-chrome' },
    { label: 'YouTube',  win: 'start https://youtube.com', linux: 'xdg-open https://youtube.com' },
    { label: 'Terminal', win: 'wt',                        linux: 'x-terminal-emulator' },
    { label: 'Archivos', win: 'explorer',                  linux: 'xdg-open .' },
  ],
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function invalid(field: string): void {
  log.warn(`config: ${field} invalido; usando default`);
}

function stringValue(value: unknown, fallback: string, field: string): string {
  if (value === undefined) return fallback;
  if (typeof value === 'string' && value.trim()) return value.trim();
  invalid(field); return fallback;
}

function boolValue(value: unknown, fallback: boolean, field: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  invalid(field); return fallback;
}

function intValue(value: unknown, fallback: number, min: number, max: number, field: string): number {
  if (value === undefined) return fallback;
  if (typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max) return value;
  invalid(field); return fallback;
}

function boolRecord(value: unknown, fallback: Record<string, boolean>, field: string): Record<string, boolean> {
  if (value === undefined) return { ...fallback };
  if (!isObject(value)) { invalid(field); return { ...fallback }; }
  const normalized = { ...fallback };
  for (const [key, enabled] of Object.entries(value)) {
    if (typeof enabled === 'boolean') normalized[key] = enabled;
    else invalid(`${field}.${key}`);
  }
  return normalized;
}

function roomsValue(value: unknown): Room[] {
  if (value === undefined) return DEFAULTS.wiz.rooms;
  if (!Array.isArray(value)) { invalid('wiz.rooms'); return DEFAULTS.wiz.rooms; }
  const rooms: Room[] = [];
  for (const room of value) {
    if (!isObject(room) || typeof room.name !== 'string' || !room.name.trim() || !Array.isArray(room.lights)) {
      invalid('wiz.rooms'); return DEFAULTS.wiz.rooms;
    }
    const lights = room.lights.map((light) => {
      if (!isObject(light) || typeof light.name !== 'string' || typeof light.mac !== 'string' || !light.name.trim() || !light.mac.trim()) {
        invalid('wiz.rooms'); return null;
      }
      return { name: light.name.trim(), mac: light.mac.trim() };
    });
    if (lights.some((light) => light === null)) return DEFAULTS.wiz.rooms;
    rooms.push({ name: room.name.trim(), lights: lights as Room['lights'] });
  }
  return rooms;
}

function appsValue(value: unknown): AppEntry[] {
  if (value === undefined) return DEFAULTS.apps;
  if (!Array.isArray(value)) { invalid('apps'); return DEFAULTS.apps; }
  const apps: AppEntry[] = [];
  for (const app of value) {
    if (!isObject(app) || typeof app.label !== 'string' || typeof app.win !== 'string' || typeof app.linux !== 'string' || !app.label.trim()) {
      invalid('apps'); return DEFAULTS.apps;
    }
    apps.push({ label: app.label.trim(), win: app.win.trim(), linux: app.linux.trim() });
  }
  return apps;
}

// Carga config.json (o --config <path>). Sin archivo -> defaults.
export function loadConfig(argv: string[]): Config {
  const i = argv.indexOf('--config');
  const path = i >= 0 && argv[i + 1] ? argv[i + 1] : 'config.json';
  let fromFile: JsonObject = {};
  try {
    const raw = readFileSync(resolve(path), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) throw new Error('raiz no es un objeto');
    fromFile = parsed;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    const reason = code === 'ENOENT' ? 'sin' : 'invalido';
    log.warn(`${reason} ${path}, usando defaults (host=${DEFAULTS.host})`);
  }
  const web = isObject(fromFile.web) ? fromFile.web : {};
  const wiz = isObject(fromFile.wiz) ? fromFile.wiz : {};
  return {
    host: stringValue(fromFile.host, DEFAULTS.host, 'host'),
    token: typeof fromFile.token === 'string' ? fromFile.token.trim() : DEFAULTS.token,
    pollMs: intValue(fromFile.pollMs, DEFAULTS.pollMs, 100, 60000, 'pollMs'),
    send: boolRecord(fromFile.send, DEFAULTS.send, 'send'),
    wiz: { rooms: roomsValue(wiz.rooms) },
    web: {
      enabled: boolValue(web.enabled, DEFAULTS.web.enabled, 'web.enabled'),
      port: intValue(web.port, DEFAULTS.web.port, 1024, 65535, 'web.port'),
    },
    discover: boolValue(fromFile.discover, DEFAULTS.discover, 'discover'),
    apps: appsValue(fromFile.apps),
  };
}
