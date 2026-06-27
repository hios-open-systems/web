import type { PadState } from './state';

// Resultado de un POST: ok (el pad respondio) + comandos que el pad encolo para
// que el companion ejecute (mute global, etc.). 204 = ok sin comandos; 200 = ok
// con cuerpo {cmds:[...]}.
export interface PushResult {
  ok: boolean;
  cmds: string[];
  ui?: unknown;       // blob del UI-mirror (solo si se pidio wantUi y el pad lo adjunto)
  launch?: number[];  // appIds que el pad pide lanzar (capa Launcher)
}

// Cliente del pad: POST /api/state. Usa fetch global (Node 18+); el host puede ser
// "hiospad.local" (si el OS resuelve mDNS) o una IP. La resolucion DNS la hace fetch
// en cada llamada, asi que un reinicio del device (nueva IP) se recupera solo si usas
// el hostname mDNS.
export class Device {
  constructor(private host: string, private readonly token: string) {}

  setHost(h: string): void { this.host = h; }   // auto-discovery cambia la IP en caliente
  get currentHost(): string { return this.host; }

  private get url(): string {
    return `http://${this.host}/api/state`;
  }

  async push(state: PadState, opts: { wantUi?: boolean; uiFull?: boolean } = {}): Promise<PushResult> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.token) headers['X-Pad-Token'] = this.token;
      const body: PadState = { ...state };
      if (opts.wantUi) body.wantUi = true;     // el pad adjunta el blob `ui` en la respuesta
      if (opts.uiFull) body.uiFull = true;     // pedir descriptor de capa completo
      const res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (res.status === 204) return { ok: true, cmds: [] };
      if (res.status === 200) {
        const b = (await res.json().catch(() => null)) as { cmds?: unknown; ui?: unknown; launch?: unknown } | null;
        const cmds = Array.isArray(b?.cmds) ? b!.cmds.filter((c): c is string => typeof c === 'string') : [];
        const launch = Array.isArray(b?.launch) ? b!.launch.filter((x): x is number => typeof x === 'number') : undefined;
        return { ok: true, cmds, ui: b?.ui, launch };
      }
      return { ok: false, cmds: [] };
    } catch {
      return { ok: false, cmds: [] };
    }
  }
}
