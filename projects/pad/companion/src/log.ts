import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

// Cuando el companion corre OCULTO (tarea programada sin consola), igual queremos ver
// que pasa: ademas de la consola, todo va a companion.log en el directorio de trabajo.
const LOG_FILE = join(process.cwd(), 'companion.log');

function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

function emit(tag: string, a: unknown[], sink: (...x: unknown[]) => void): void {
  sink(`[${ts()}]${tag}`, ...a);
  try {
    appendFileSync(LOG_FILE, `[${ts()}]${tag} ${a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')}\n`);
  } catch { /* el log a archivo es best-effort */ }
}

export const log = {
  info: (...a: unknown[]) => emit('', a, console.log),
  warn: (...a: unknown[]) => emit(' WARN', a, console.warn),
  error: (...a: unknown[]) => emit(' ERR ', a, console.error),
};
