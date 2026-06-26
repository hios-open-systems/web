// Metricas de sistema que NO dependen del OS: las saca el modulo `os` nativo de
// Node, identico en Windows y Linux, sin herramientas externas. Asi CPU carga,
// carga por nucleo y RAM andan parejo en ambos (a diferencia de temps/fans, que
// necesitan helpers). La IP local tambien sale de aca.
import os from 'node:os';
import { readFile, readdir } from 'node:fs/promises';
import { run } from './index';

export class SystemMetrics {
  private prev: { idle: number; total: number }[] | null = null;

  // Carga POR NUCLEO 0..100 por delta de os.cpus() entre polls. Primera muestra
  // = null (hace falta un delta). Universal: no usa WMI ni /proc directamente.
  coreLoadsPct(): number[] | null {
    const cpus = os.cpus();
    const cur = cpus.map((c) => {
      const t = c.times;
      return { idle: t.idle, total: t.user + t.nice + t.sys + t.idle + t.irq };
    });
    const prev = this.prev;
    this.prev = cur;
    if (!prev || prev.length !== cur.length) return null;
    return cur.map((c, i) => {
      const dIdle = c.idle - prev[i].idle;
      const dTotal = c.total - prev[i].total;
      if (dTotal <= 0) return 0;
      return Math.max(0, Math.min(100, Math.round((1 - dIdle / dTotal) * 100)));
    });
  }

  // Carga CPU global = promedio de los nucleos (derivada de coreLoadsPct para no
  // leer os.cpus() dos veces). Llamar DESPUES de coreLoadsPct en el mismo tick.
  static avg(cores: number[] | null): number | null {
    if (!cores || !cores.length) return null;
    return Math.round(cores.reduce((a, b) => a + b, 0) / cores.length);
  }

  // RAM usada 0..100. En Linux usamos MemAvailable (free + cache reclamable);
  // os.freemem() solo cuenta MemFree y haria ver la RAM siempre casi llena.
  async ramPct(): Promise<number | null> {
    if (process.platform === 'linux') {
      try {
        const m = await readFile('/proc/meminfo', 'utf8');
        const total = Number(/MemTotal:\s+(\d+)/.exec(m)?.[1] ?? 0);
        const avail = Number(/MemAvailable:\s+(\d+)/.exec(m)?.[1] ?? 0);
        if (total > 0 && avail > 0) return Math.round((1 - avail / total) * 100);
      } catch { /* cae a os.freemem */ }
    }
    const total = os.totalmem();
    if (total <= 0) return null;
    return Math.round((1 - os.freemem() / total) * 100);
  }

  // Tiempo encendido en segundos (universal, os.uptime).
  static uptimeSec(): number {
    return Math.round(os.uptime());
  }

  // Nº de procesos. Linux: cuenta /proc/[pid] (sin herramientas). Windows: tasklist
  // (nativo, sin powershell). null si no se pudo.
  async procCount(): Promise<number | null> {
    if (process.platform === 'linux') {
      try {
        const ents = await readdir('/proc');
        return ents.reduce((n, e) => (/^\d+$/.test(e) ? n + 1 : n), 0);
      } catch {
        return null;
      }
    }
    const o = await run('tasklist', ['/fo', 'csv', '/nh'], 3000);
    if (!o) return null;
    const n = o.split('\n').filter((l) => l.trim().length > 0).length;
    return n > 0 ? n : null;
  }

  // Primera IPv4 no interna (la de la LAN). Universal.
  static ip(): string | null {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const a of ifaces[name] ?? []) {
        if (a.family === 'IPv4' && !a.internal) return a.address;
      }
    }
    return null;
  }
}
