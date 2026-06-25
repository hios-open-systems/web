import { readFile } from 'node:fs/promises';
import type { NetProvider } from '../types';

// Linux: /proc/net/dev da bytes acumulados por interfaz; el throughput sale del
// delta entre polls. Sumamos todas las NIC reales (sin lo/docker/veth/virtuales).
export class LinuxNet implements NetProvider {
  private prev: { rx: number; tx: number; t: number } | null = null;

  async getThroughput(): Promise<{ down: number; up: number } | null> {
    const s = await readFile('/proc/net/dev', 'utf8').catch(() => null);
    if (!s) return null;
    let rx = 0;
    let tx = 0;
    for (const line of s.split('\n')) {
      const m = line.match(/^\s*([^:]+):\s*(.*)$/);
      if (!m) continue;
      const iface = m[1].trim();
      if (iface === 'lo' || /^(docker|veth|br-|virbr|tun|tap)/.test(iface)) continue;
      const cols = m[2].trim().split(/\s+/).map(Number);
      rx += cols[0] || 0;  // bytes recibidos
      tx += cols[8] || 0;  // bytes transmitidos
    }
    const now = Date.now();
    const prev = this.prev;
    this.prev = { rx, tx, t: now };
    if (!prev) return null;                          // primera muestra: sin delta
    const dt = (now - prev.t) / 1000;
    if (dt <= 0) return null;
    return { down: Math.max(0, (rx - prev.rx) / dt), up: Math.max(0, (tx - prev.tx) / dt) };
  }
}
