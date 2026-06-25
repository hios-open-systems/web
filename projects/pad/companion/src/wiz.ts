// Control de luces WiZ por su API local UDP (puerto 38899).
// - Descubre por broadcast SOLO las bombitas energizadas (las apagadas desde la llave no
//   responden; eso es de la API local — la de nube listaria todas pero necesita login).
// - Identifica por MAC (estable); resuelve MAC->IP en cada descubrimiento (DHCP cambia IPs).
// - Cuartos = grupos de MACs (config.json). Sin cuartos -> uno "Todas" con lo descubierto.
// - Target: dentro del cuarto se puede apuntar a TODAS (-1) o a una luz puntual (indice).
import dgram from 'node:dgram';

const WIZ_PORT = 38899;

export interface Room { name: string; macs: string[]; }
interface Bulb { ip: string; mac: string; }

export class Wiz {
  private rooms: Room[];
  private auto: boolean;                 // sin cuartos configurados -> "Todas"
  private bulbs: Bulb[] = [];            // descubiertos (energizados): ip + mac
  private sel = 0;                       // cuarto seleccionado
  private target = -1;                   // -1 = todas las del cuarto; >=0 = una luz puntual
  private st = { on: true, dimming: 70, temp: 3500 };

  constructor(rooms: Room[]) {
    this.auto = rooms.length === 0;
    this.rooms = this.auto ? [{ name: 'Todas', macs: [] }] : rooms;
  }

  // {room, target ("Todas" o "n/N"), on, bright, lights} para el feedback al pad.
  status(): { room: string; target: string; on: boolean; bright: number; lights: number } {
    const n = this.roomIps().length;
    return {
      room: this.rooms[this.sel]?.name ?? 'Todas',
      target: this.target < 0 ? 'Todas' : `${this.target + 1}/${n}`,
      on: this.st.on, bright: this.st.dimming, lights: n,
    };
  }

  private roomIps(): string[] {
    const room = this.rooms[this.sel];
    if (!room) return [];
    if (this.auto || room.macs.length === 0) return this.bulbs.map((b) => b.ip);
    const want = new Set(room.macs.map((m) => m.toLowerCase()));
    return this.bulbs.filter((b) => b.mac && want.has(b.mac.toLowerCase())).map((b) => b.ip);
  }
  // IPs a las que mandar: todas las del cuarto, o solo la luz apuntada.
  private targetIps(): string[] {
    const ips = this.roomIps();
    if (this.target < 0 || this.target >= ips.length) return ips;
    return [ips[this.target]];
  }

  discover(timeoutMs = 1200): Promise<number> {
    return new Promise((resolve) => {
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      const map = new Map<string, Bulb>();
      sock.on('message', (msg, rinfo) => {
        let mac = '';
        try { mac = JSON.parse(msg.toString())?.result?.mac ?? ''; } catch { /* noop */ }
        map.set(rinfo.address, { ip: rinfo.address, mac });
      });
      sock.on('error', () => { try { sock.close(); } catch { /* noop */ } resolve(this.bulbs.length); });
      sock.bind(() => {
        try { sock.setBroadcast(true); } catch { /* noop */ }
        sock.send(Buffer.from(JSON.stringify({ method: 'getSystemConfig', params: {} })), WIZ_PORT, '255.255.255.255');
        setTimeout(() => {
          try { sock.close(); } catch { /* noop */ }
          this.bulbs = [...map.values()];
          resolve(this.bulbs.length);
        }, timeoutMs);
      });
    });
  }

  private send(params: Record<string, unknown>): void {
    const ips = this.targetIps();
    if (!ips.length) return;
    const sock = dgram.createSocket('udp4');
    const msg = Buffer.from(JSON.stringify({ method: 'setPilot', params }));
    let pending = ips.length;
    const done = () => { if (--pending <= 0) { try { sock.close(); } catch { /* noop */ } } };
    for (const ip of ips) sock.send(msg, WIZ_PORT, ip, done);
  }

  // Lee el estado real de la luz apuntada (sincroniza on/brillo/temp con la realidad).
  sync(): Promise<void> {
    return new Promise((resolve) => {
      const ips = this.targetIps();
      if (!ips.length) return resolve();
      const sock = dgram.createSocket('udp4');
      let done = false;
      const finish = () => { if (!done) { done = true; try { sock.close(); } catch { /* noop */ } resolve(); } };
      sock.on('message', (msg) => {
        try {
          const r = JSON.parse(msg.toString())?.result;
          if (r) {
            if (typeof r.state === 'boolean') this.st.on = r.state;
            if (r.dimming) this.st.dimming = r.dimming;
            if (r.temp) this.st.temp = r.temp;
          }
        } catch { /* noop */ }
        finish();
      });
      sock.on('error', finish);
      sock.send(Buffer.from(JSON.stringify({ method: 'getPilot', params: {} })), WIZ_PORT, ips[0]);
      setTimeout(finish, 500);
    });
  }

  async roomNext(): Promise<void> { if (this.rooms.length) { this.sel = (this.sel + 1) % this.rooms.length; this.target = -1; await this.sync(); } }
  async lightNext(): Promise<void> { const n = this.roomIps().length; this.target = this.target + 1 >= n ? -1 : this.target + 1; await this.sync(); }
  toggle(): void { this.st.on = !this.st.on; this.send({ state: this.st.on }); }
  brighter(): void { this.st.dimming = Math.min(100, this.st.dimming + 15); this.st.on = true; this.send({ state: true, dimming: this.st.dimming }); }
  dimmer(): void { this.st.dimming = Math.max(10, this.st.dimming - 15); this.send({ state: true, dimming: this.st.dimming }); }
  warmer(): void { this.st.temp = Math.max(2200, this.st.temp - 400); this.send({ state: true, temp: this.st.temp }); }
  cooler(): void { this.st.temp = Math.min(6500, this.st.temp + 400); this.send({ state: true, temp: this.st.temp }); }
}
