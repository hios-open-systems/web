import { readFile } from 'node:fs/promises';
import type { SensorProvider } from '../types';
import { run } from '../index';

// Linux: CPU temp via `sensors -j` (lm-sensors) o /sys/class/hwmon; GPU via nvidia-smi;
// CPU load por deltas de /proc/stat entre polls.
export class LinuxSensors implements SensorProvider {
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

  async getGpuFanPct(): Promise<number | null> {
    return this.nvidia('fan.speed');
  }

  // Cooler de CPU/gabinete via lm-sensors: el fan*_input mas alto (RPM).
  async getCpuFanRpm(): Promise<number | null> {
    const j = await run('sensors', ['-j']);
    if (!j) return null;
    try {
      const data = JSON.parse(j) as Record<string, Record<string, Record<string, number>>>;
      let max = 0;
      for (const chip of Object.values(data)) {
        if (typeof chip !== 'object') continue;
        for (const sub of Object.values(chip)) {
          if (typeof sub !== 'object') continue;
          for (const [k, v] of Object.entries(sub)) {
            if (/fan\d*_input/i.test(k) && typeof v === 'number' && v > max) max = v;
          }
        }
      }
      return max > 0 ? Math.round(max) : null;
    } catch {
      return null;
    }
  }

  // VRAM usada/total en MB (nvidia-smi). null sin GPU Nvidia.
  async getGpuMemMb(): Promise<{ used: number; total: number } | null> {
    const o = await run('nvidia-smi', ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits']);
    if (!o) return null;
    const [u, t] = o.trim().split('\n')[0].split(',').map((x) => parseInt(x, 10));
    return isNaN(u) || isNaN(t) || t <= 0 ? null : { used: u, total: t };
  }

  private async nvidia(query: string): Promise<number | null> {
    const o = await run('nvidia-smi', [`--query-gpu=${query}`, '--format=csv,noheader,nounits']);
    if (!o) return null;
    const n = parseInt(o.trim().split('\n')[0], 10);
    return isNaN(n) ? null : n;
  }
}
