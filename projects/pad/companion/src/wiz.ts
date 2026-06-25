// Control de luces WiZ por su API local UDP (puerto 38899). El pad encola comandos
// (wizToggle/wizBrightUp/...) que viajan en la respuesta del POST; aca se ejecutan.
// Descubrimiento por broadcast; control con setPilot. Mantiene un estado local simple
// para los incrementos (brillo/temperatura).
import dgram from 'node:dgram';

const WIZ_PORT = 38899;

interface WizState { on: boolean; dimming: number; temp: number; }

export class Wiz {
  private bulbs: string[];
  private st: WizState = { on: true, dimming: 70, temp: 3500 };

  constructor(staticIps: string[] = []) {
    this.bulbs = [...staticIps];
  }

  count(): number { return this.bulbs.length; }

  // Broadcast getPilot y junta las IPs que respondan. Suma a las IPs configuradas.
  discover(timeoutMs = 1200): Promise<number> {
    return new Promise((resolve) => {
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      const found = new Set<string>(this.bulbs);
      sock.on('message', (_msg, rinfo) => found.add(rinfo.address));
      sock.on('error', () => { try { sock.close(); } catch { /* noop */ } resolve(this.bulbs.length); });
      sock.bind(() => {
        try { sock.setBroadcast(true); } catch { /* noop */ }
        const probe = Buffer.from(JSON.stringify({ method: 'getPilot', params: {} }));
        sock.send(probe, WIZ_PORT, '255.255.255.255');
        setTimeout(() => {
          try { sock.close(); } catch { /* noop */ }
          this.bulbs = [...found];
          resolve(this.bulbs.length);
        }, timeoutMs);
      });
    });
  }

  private send(params: Record<string, unknown>): void {
    if (this.bulbs.length === 0) return;
    const sock = dgram.createSocket('udp4');
    const msg = Buffer.from(JSON.stringify({ method: 'setPilot', params }));
    let pending = this.bulbs.length;
    const done = () => { if (--pending <= 0) { try { sock.close(); } catch { /* noop */ } } };
    for (const ip of this.bulbs) sock.send(msg, WIZ_PORT, ip, done);
  }

  toggle(): void { this.st.on = !this.st.on; this.send({ state: this.st.on }); }
  brighter(): void { this.st.dimming = Math.min(100, this.st.dimming + 15); this.st.on = true; this.send({ state: true, dimming: this.st.dimming }); }
  dimmer(): void { this.st.dimming = Math.max(10, this.st.dimming - 15); this.send({ state: true, dimming: this.st.dimming }); }
  warmer(): void { this.st.temp = Math.max(2200, this.st.temp - 400); this.send({ state: true, temp: this.st.temp }); }
  cooler(): void { this.st.temp = Math.min(6500, this.st.temp + 400); this.send({ state: true, temp: this.st.temp }); }
}
