import { readFile } from 'node:fs/promises';
import type { SensorProvider } from '../types';
import { run } from '../index';

// Linux: CPU temp via `sensors -j` (lm-sensors) o /sys/class/hwmon; GPU via nvidia-smi;
// CPU load por deltas de /proc/stat entre polls.
export class LinuxSensors implements SensorProvider {
  private prevCpu: { idle: number; total: number } | null = null;

  async getCpuTempC(): Promise<number | null> {
    const j = await run('sensors', ['-j']);
    if (j) {
      try {
        const data = JSON.parse(j) as Record<string, Record<string, Record<string, number>>>;
        for (const chip of Object.keys(data)) {
          if (!/coretemp|k10temp|zenpower|cpu_thermal/i.test(chip)) continue;
          const o = data[chip];
          for (const key of Object.keys(o)) {
            if (!/package|tctl|tdie|temp1/i.test(key)) continue;
            const sub = o[key];
            const inp = Object.keys(sub).find((x) => /_input$/.test(x));
            if (inp) return Math.round(sub[inp]);
          }
        }
      } catch {
        /* cae al fallback hwmon */
      }
    }
    for (let i = 0; i < 10; i++) {
      const name = await readFile(`/sys/class/hwmon/hwmon${i}/name`, 'utf8').catch(() => '');
      if (!/coretemp|k10temp|zenpower|cpu/i.test(name)) continue;
      const t = await readFile(`/sys/class/hwmon/hwmon${i}/temp1_input`, 'utf8').catch(() => null);
      if (t) return Math.round(parseInt(t, 10) / 1000);
    }
    return null;
  }

  async getGpuTempC(): Promise<number | null> {
    return this.nvidia('temperature.gpu');
  }

  async getGpuLoadPct(): Promise<number | null> {
    return this.nvidia('utilization.gpu');
  }

  private async nvidia(query: string): Promise<number | null> {
    const o = await run('nvidia-smi', [`--query-gpu=${query}`, '--format=csv,noheader,nounits']);
    if (!o) return null;
    const n = parseInt(o.trim().split('\n')[0], 10);
    return isNaN(n) ? null : n;
  }

  async getCpuLoadPct(): Promise<number | null> {
    const s = await readFile('/proc/stat', 'utf8').catch(() => null);
    if (!s) return null;
    const cols = s.split('\n')[0].trim().split(/\s+/).slice(1).map(Number); // user nice system idle iowait irq ...
    if (cols.length < 4) return null;
    const idle = cols[3] + (cols[4] || 0);
    const total = cols.reduce((a, b) => a + b, 0);
    const prev = this.prevCpu;
    this.prevCpu = { idle, total };
    if (!prev) return null; // primera muestra: hace falta un delta
    const dIdle = idle - prev.idle;
    const dTotal = total - prev.total;
    if (dTotal <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((1 - dIdle / dTotal) * 100)));
  }
}
