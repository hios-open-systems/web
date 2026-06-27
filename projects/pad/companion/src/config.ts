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

// Carga config.json (o --config <path>). Sin archivo -> defaults.
export function loadConfig(argv: string[]): Config {
  const i = argv.indexOf('--config');
  const path = i >= 0 && argv[i + 1] ? argv[i + 1] : 'config.json';
  let fromFile: Partial<Config> = {};
  try {
    fromFile = JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch {
    log.warn(`sin ${path}, usando defaults (host=${DEFAULTS.host})`);
  }
  return {
    ...DEFAULTS,
    ...fromFile,
    send: { ...DEFAULTS.send, ...(fromFile.send ?? {}) },
    wiz: { ...DEFAULTS.wiz, ...(fromFile.wiz ?? {}) },
    web: { ...DEFAULTS.web, ...(fromFile.web ?? {}) },
    apps: fromFile.apps ?? DEFAULTS.apps,
  };
}
