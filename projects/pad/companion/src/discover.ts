import { networkInterfaces } from 'node:os';

// Auto-discovery del pad en la LAN: escanea el /24 local buscando un host que
// responda GET / con la firma "HIOS PAD". Asi la IP de DHCP deja de importar.
// Cero dependencias (usa fetch global de Node 18+).

// Base /24 ("192.168.1.") a partir del host conocido (si es IP) o de la interfaz
// local. Preferimos el subnet del ultimo host conocido (sin ambiguedad).
export function scanBaseFrom(host: string): string | null {
  const m = host.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (m) return `${m[1]}.`;
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('172.17.')) {
        const mm = i.address.match(/^(\d+\.\d+\.\d+)\.\d+$/);
        if (mm) return `${mm[1]}.`;
      }
    }
  }
  return null;
}

async function isPad(ip: string, timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(`http://${ip}/`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return false;
    const body = await res.text();
    return body.includes('HIOS PAD');          // firma de htmlStatus()/htmlConfig() del pad
  } catch {
    return false;
  }
}

// Escanea base.1 .. base.254 con concurrencia acotada; devuelve la 1ra IP que es
// el pad (corta apenas la encuentra), o null.
export async function discoverPad(
  base: string, timeoutMs = 600, concurrency = 64,
): Promise<string | null> {
  const ips: string[] = [];
  for (let i = 1; i <= 254; i++) ips.push(base + i);
  let idx = 0;
  let found: string | null = null;
  const worker = async (): Promise<void> => {
    while (idx < ips.length && !found) {
      const ip = ips[idx++];
      if (await isPad(ip, timeoutMs)) { found ??= ip; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ips.length) }, worker));
  return found;
}
