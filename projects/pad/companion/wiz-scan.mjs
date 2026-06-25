// wiz-scan.mjs — descubre luces WiZ en la red (broadcast UDP 38899) y lista su estado.
// Corre directo con Node para Windows (NO en WSL: el broadcast tiene que salir por tu LAN):
//     node wiz-scan.mjs
import dgram from 'node:dgram';

const PORT = 38899;
const found = new Map();   // ip -> { state, dimming, temp, sceneId, moduleName, mac }

const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
sock.on('message', (msg, rinfo) => {
  let j;
  try { j = JSON.parse(msg.toString()); } catch { return; }
  const r = j.result || {};
  found.set(rinfo.address, { ...(found.get(rinfo.address) || {}), ...r });
});
sock.on('error', (e) => { console.error('socket error:', e.message); });

sock.bind(() => {
  sock.setBroadcast(true);
  const getPilot = Buffer.from(JSON.stringify({ method: 'getPilot', params: {} }));
  const getCfg   = Buffer.from(JSON.stringify({ method: 'getSystemConfig', params: {} }));
  sock.send(getPilot, PORT, '255.255.255.255');
  setTimeout(() => sock.send(getCfg, PORT, '255.255.255.255'), 250);   // tambien nombre/mac
  setTimeout(() => {
    sock.close();
    const ips = [...found.keys()];
    console.log(`\nWiZ: ${ips.length} luz(ces) descubierta(s)\n`);
    for (const ip of ips) {
      const i = found.get(ip);
      const on = i.state === undefined ? '?' : (i.state ? 'ON ' : 'off');
      console.log(`  ${ip.padEnd(15)} ${on}  brillo=${i.dimming ?? '?'}  temp=${i.temp ?? '?'}  ${i.moduleName ?? ''} ${i.mac ?? ''}`);
    }
    if (!ips.length) {
      console.log('  Ninguna. Posibles causas:');
      console.log('   - las lamparas no estan en la misma subred (o el WiFi aisla clientes / "AP isolation")');
      console.log('   - el firewall de Windows bloquea el UDP 38899 saliente/entrante');
      console.log('   - lo corriste en WSL (el broadcast no sale a la LAN) -> corre en Windows nativo');
      console.log('   - si igual no aparecen, conseguí sus IPs (router/app WiZ) y ponelas en config.json: "wiz": { "ips": ["192.168.1.x"] }');
    }
    console.log('');
  }, 1600);
});
