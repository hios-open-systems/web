import type { ServerResponse } from 'node:http';

// Fan-out de Server-Sent Events: el daemon empuja cada frame del pad a todos los
// browsers conectados al espejo. Unidireccional (pad -> browser), por eso SSE y
// no WebSocket. Tambien marca "hay alguien mirando?" para el pollMs dinamico.
export class MirrorHub {
  private clients = new Set<ServerResponse>();
  private pendingFull = false;   // un cliente nuevo se conecto -> pedir descriptor de capa completo

  add(res: ServerResponse): void {
    this.clients.add(res);
    this.pendingFull = true;
    res.on('close', () => this.clients.delete(res));
  }

  hasClients(): boolean { return this.clients.size > 0; }

  // Devuelve y limpia el flag de "pedir capa completa" (lo consume el loop una vez).
  takeFull(): boolean { const f = this.pendingFull; this.pendingFull = false; return f; }

  broadcast(ui: unknown): void {
    if (this.clients.size === 0) return;
    const data = `data: ${JSON.stringify(ui)}\n\n`;
    for (const res of this.clients) {
      try { res.write(data); } catch { this.clients.delete(res); }
    }
  }
}
