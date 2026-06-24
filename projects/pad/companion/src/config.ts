import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from './log';

export interface Config {
  host: string;                     // "hiospad.local" o una IP (ej "192.168.1.43")
  token: string;                    // "" = sin token; si no, va en el header X-Pad-Token
  pollMs: number;                   // periodo del loop
  send: Record<string, boolean>;    // que campos mandar
}

const DEFAULTS: Config = {
  host: 'hiospad.local',
  token: '',
  pollMs: 1000,
  send: { mic: true, cam: false, media: false, vol: true,
          cpuTemp: true, gpuTemp: true, cpuLoad: true, gpuLoad: true, clock: true },
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
  };
}
