import { statfs, readFile } from 'node:fs/promises';
import type { DiskProvider } from '../types';

// Linux: uso de "/" via statfs; I/O por delta de /proc/diskstats entre polls.
// Sumamos discos fisicos enteros (sd*, nvme*, vd*, mmcblk*), no particiones ni loop.
export class LinuxDisk implements DiskProvider {
  private prev: { rd: number; wr: number; t: number } | null = null;

  async getUsagePct(): Promise<number | null> {
    try {
      const s = await statfs('/');
      const total = s.blocks * s.bsize;
      const free = s.bavail * s.bsize;        // bavail = libre para usuario no-root
      if (total <= 0) return null;
      return Math.round((1 - free / total) * 100);
    } catch {
      return null;
    }
  }

  async getIo(): Promise<{ rd: number; wr: number } | null> {
    const s = await readFile('/proc/diskstats', 'utf8').catch(() => null);
    if (!s) return null;
    let rd = 0;
    let wr = 0;
    for (const line of s.split('\n')) {
      const f = line.trim().split(/\s+/);
      if (f.length < 14) continue;
      const name = f[2];
      if (!/^(sd[a-z]+|nvme\d+n\d+|vd[a-z]+|mmcblk\d+)$/.test(name)) continue;  // disco entero
      rd += Number(f[5]) * 512;   // sectores leidos -> bytes
      wr += Number(f[9]) * 512;   // sectores escritos -> bytes
    }
    const now = Date.now();
    const prev = this.prev;
    this.prev = { rd, wr, t: now };
    if (!prev) return null;                  // primera muestra: sin delta
    const dt = (now - prev.t) / 1000;
    if (dt <= 0) return null;
    return { rd: Math.max(0, (rd - prev.rd) / dt), wr: Math.max(0, (wr - prev.wr) / dt) };
  }
}
