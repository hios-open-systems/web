import type { PadState } from './state';

// Resultado de un POST: ok (el pad respondio) + comandos que el pad encolo para
// que el companion ejecute (mute global, etc.). 204 = ok sin comandos; 200 = ok
// con cuerpo {cmds:[...]}.
export interface PushResult {
  ok: boolean;
  cmds: string[];
}

// Cliente del pad: POST /api/state. Usa fetch global (Node 18+); el host puede ser
// "hiospad.local" (si el OS resuelve mDNS) o una IP. La resolucion DNS la hace fetch
// en cada llamada, asi que un reinicio del device (nueva IP) se recupera solo si usas
// el hostname mDNS.
export class Device {
  constructor(private readonly host: string, private readonly token: string) {}

  private get url(): string {
    return `http://${this.host}/api/state`;
  }

  async push(state: PadState): Promise<PushResult> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.token) headers['X-Pad-Token'] = this.token;
      const res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(state),
        signal: AbortSignal.timeout(2000),
      });
      if (res.status === 204) return { ok: true, cmds: [] };
      if (res.status === 200) {
        const body = (await res.json().catch(() => null)) as { cmds?: unknown } | null;
        const cmds = Array.isArray(body?.cmds) ? body!.cmds.filter((c): c is string => typeof c === 'string') : [];
        return { ok: true, cmds };
      }
      return { ok: false, cmds: [] };
    } catch {
      return { ok: false, cmds: [] };
    }
  }
}
