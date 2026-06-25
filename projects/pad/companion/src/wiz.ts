// Control de luces WiZ por su API local UDP (puerto 38899).
// - Descubre por broadcast SOLO las bombitas energizadas (las apagadas no responden).
// - Identifica por MAC (estable); resuelve MAC->IP en cada descubrimiento (DHCP).
// - Cuartos con luces NOMBRADAS (config.json). Sin cuartos -> uno "Todas" autodescubierto.
// - Target: TODAS las del cuarto, o una luz puntual (se muestra por nombre).
import dgram from 'node:dgram';
import { log } from './log';

const WIZ_PORT = 38899;

export interface Light { name: string; mac: string; }
export interface Room { name: string; lights: Light[]; }
interface Bulb { ip: string; mac: string; }

export class Wiz {
  private rooms: Room[];
  private auto: boolean;                 // sin cuartos configurados -> "Todas"
  private bulbs: Bulb[] = [];            // descubiertos (energizados): ip + mac
  private sel = 0;                       // cuarto
  private target = -1;                   // -1 = todas; >=0 = indice de luz en el cuarto
  private st = { on: true, dimming: 70, temp: 3500 };

  constructor(rooms: Room[]) {
    this.auto = rooms.length === 0;
    this.rooms = this.auto ? [{ name: 'Todas', lights: [] }] : rooms;
  }

  private lights(): Light[] {            // luces del cuarto actual (en auto = las descubiertas)
    if (this.auto) return this.bulbs.map((b) => ({ name: b.ip, mac: b.mac }));
    return this.rooms[this.sel]?.lights ?? [];
  }
  private macToIp(mac: string): string | undefined {
    const m = (mac || '').toLowerCase();
    if (!m) return undefined;
    return this.bulbs.find((b) => b.mac && b.mac.toLowerCase() === m)?.ip;
  }
  private targetIps(): string[] {        // IPs a las que mandar (todas o la luz apuntada)
    const ls = this.lights();
    const pick = this.target < 0 ? ls : (ls[this.target] ? [ls[this.target]] : []);
    return pick.map((l) => this.macToIp(l.mac)).filter((x): x is string => !!x);
  }
  private targetName(): string {
    if (this.target < 0) return 'Todas';
    return this.lights()[this.target]?.name ?? 'Todas';
  }

  status(): { room: string; target: string; on: boolean; bright: number; lights: number } {
    return {
      room: this.rooms[this.sel]?.name ?? 'Todas',
      target: this.targetName(),
      on: this.st.on, bright: this.st.dimming, lights: this.lights().length,
    };
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
    if (!ips.length) {
      log.warn(`WiZ: "${this.status().room} / ${this.targetName()}" sin IPs (¿luz apagada / MAC no descubierta?)`);
      return;
    }
    log.info(`WiZ -> setPilot ${JSON.stringify(params)} a [${ips.join(', ')}]`);
    const sock = dgram.createSocket('udp4');
    const msg = Buffer.from(JSON.stringify({ method: 'setPilot', params }));
    let pending = ips.length;
    const done = () => { if (--pending <= 0) { try { sock.close(); } catch { /* noop */ } } };
    for (const ip of ips) sock.send(msg, WIZ_PORT, ip, done);
  }

  sync(): Promise<void> {                // lee estado real (getPilot) de la luz apuntada
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
  async lightNext(): Promise<void> { const n = this.lights().length; this.target = this.target + 1 >= n ? -1 : this.target + 1; await this.sync(); }
  toggle(): void { this.st.on = !this.st.on; this.send({ state: this.st.on }); }
  brighter(): void { this.st.dimming = Math.min(100, this.st.dimming + 15); this.st.on = true; this.send({ state: true, dimming: this.st.dimming }); }
  dimmer(): void { this.st.dimming = Math.max(10, this.st.dimming - 15); this.send({ state: true, dimming: this.st.dimming }); }
  warmer(): void { this.st.temp = Math.max(2200, this.st.temp - 400); this.send({ state: true, temp: this.st.temp }); }
  cooler(): void { this.st.temp = Math.min(6500, this.st.temp + 400); this.send({ state: true, temp: this.st.temp }); }
}
