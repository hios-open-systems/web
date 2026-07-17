import { loadConfig } from './config';
import { Device } from './device';
import { pickProviders, osName } from './providers';
import { SystemMetrics } from './providers/system';
import { Wiz } from './wiz';
import type { PadState } from './state';
import { log } from './log';
import { MirrorHub } from './web/mirrorHub';
import { startWebServer } from './web/server';
import { discoverPad, scanBaseFrom } from './discover';
import { spawn } from 'node:child_process';

// Lanza una app (comando del config, ya resuelto por OS). detached + unref: corre
// independiente, el companion no espera. El comando viene del config del USUARIO
// (no de input externo) -> no es inyeccion arbitraria.
function launchApp(label: string, cmd: string): void {
  try {
    const child = spawn(cmd, { shell: true, detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', (e) => log.warn(`launch ${label} fallo: ${e.message}`));
    child.unref();
    log.info(`lanzando ${label}: ${cmd}`);
  } catch (e) {
    log.warn(`launch ${label} fallo: ${String(e)}`);
  }
}

async function main(): Promise<void> {
  process.title = 'pad-companion';                  // se ve asi en top/ps/htop (no como "node")
  const cfg = loadConfig(process.argv);
  const sys = new SystemMetrics();                  // CPU carga/nucleos + RAM + IP (universal, modulo os)
  const os = osName();                              // SO -> el pad lo muestra / resuelve per-OS
  if (!cfg.token) log.warn('token vacio: copia el token API/OTA que el pad muestra por serial en config.json');
  log.info(`pad-companion -> http://${cfg.host}/api/state  cada ${cfg.pollMs}ms  (${os})`);

  const providers = await pickProviders();
  const device = new Device(cfg.host, cfg.token);

  // Espejo (UI-mirror): server local + SSE. Si hay un browser mirando, el daemon
  // pide el blob `ui` al pad y acelera el poll a 250ms para que se sienta live.
  const hub = new MirrorHub();
  if (cfg.web.enabled) startWebServer(cfg.web.port, hub, device, cfg.token);

  const wiz = new Wiz(cfg.wiz.rooms);
  const nWiz = await wiz.discover();
  log.info(`WiZ: ${nWiz} luz(ces) energizada(s) ${nWiz ? '✓' : '(ninguna; ver red/firewall o config.json)'}`);
  setInterval(() => { void wiz.discover(); }, 30000);   // re-descubre: IPs DHCP, bombitas que prenden/apagan

  let stop = false;
  const quit = () => { stop = true; log.info('saliendo...'); };
  process.on('SIGINT', quit);
  process.on('SIGTERM', quit);

  let lastOk: boolean | null = null;

  // Auto-discovery: si el pad deja de responder (cambio de IP por DHCP), escanea
  // la LAN y cambia el host en caliente. Cooldown para no escanear de mas.
  let fails = 0, discovering = false, lastScan = 0;
  const maybeDiscover = (ok: boolean): void => {
    if (ok) { fails = 0; return; }
    if (!cfg.discover || ++fails < 3 || discovering) return;
    const now = Date.now();
    if (now - lastScan < 15000) return;          // como mucho un scan cada 15s
    lastScan = now;
    const base = scanBaseFrom(device.currentHost);
    if (!base) return;
    discovering = true;
    log.info(`buscando el pad en ${base}0/24 (la IP no responde, DHCP?)...`);
    void discoverPad(base).then((ip) => {
      const old = device.currentHost;
      if (ip && ip !== old) { device.setHost(ip); log.info(`pad encontrado en ${ip} ✓ (antes ${old})`); }
      else if (ip) log.info(`pad sigue en ${ip}`);
      else log.info('no encontre el pad en la LAN (¿encendido y en la red?)');
      fails = 0;
    }).finally(() => { discovering = false; });
  };

  // Historial reciente de throughput (KB/s) para pre-cargar los sparklines del pad:
  // el firmware lo seedea la 1ra vez -> los graficos aparecen poblados al abrir la vista.
  const HSEND = 48;
  const hNd: number[] = [], hNu: number[] = [], hDr: number[] = [], hDw: number[] = [];
  const hpush = (a: number[], v: number): void => { a.push(v); if (a.length > HSEND) a.shift(); };

  const tick = async (): Promise<void> => {
    const s = cfg.send;
    const cores = s.cores || s.cpuLoad ? sys.coreLoadsPct() : null;   // os.cpus() una sola vez
    const [vol, mic, cpuT, gpuT, gpuL, cpuFan, gpuFan, ram, net, vram, disk, diskIo, procs] = await Promise.all([
      s.vol     ? providers.audio.getVolume()      : Promise.resolve(null),
      s.mic     ? providers.audio.getMicMuted()     : Promise.resolve(null),
      s.cpuTemp ? providers.sensors.getCpuTempC()   : Promise.resolve(null),
      s.gpuTemp ? providers.sensors.getGpuTempC()   : Promise.resolve(null),
      s.gpuLoad ? providers.sensors.getGpuLoadPct() : Promise.resolve(null),
      s.cpuFan  ? providers.sensors.getCpuFanRpm()  : Promise.resolve(null),
      s.gpuFan  ? providers.sensors.getGpuFanPct()  : Promise.resolve(null),
      s.ram     ? sys.ramPct()                      : Promise.resolve(null),
      s.net     ? providers.net.getThroughput()     : Promise.resolve(null),
      s.vram    ? providers.sensors.getGpuMemMb()   : Promise.resolve(null),
      s.disk    ? providers.disk.getUsagePct()      : Promise.resolve(null),
      s.disk    ? providers.disk.getIo()            : Promise.resolve(null),
      s.procs   ? sys.procCount()                   : Promise.resolve(null),
    ]);
    const cpuL = s.cpuLoad ? SystemMetrics.avg(cores) : null;

    const state: PadState = {};
    if (vol  != null) state.vol = vol;
    if (mic  != null) state.mic = mic;
    if (cpuT != null) state.cpuTemp = cpuT;
    if (gpuT != null) state.gpuTemp = gpuT;
    if (cpuL != null) state.cpuLoad = cpuL;
    if (gpuL != null) state.gpuLoad = gpuL;
    if (cpuFan != null) state.cpuFan = cpuFan;
    if (gpuFan != null) state.gpuFan = gpuFan;
    if (ram  != null) state.ram = ram;
    if (s.cores && cores) state.cores = cores.slice(0, 24);   // el pad muestra hasta 24
    if (net != null) {                              // bytes/s -> KB/s (entero) para el pad
      state.netDown = Math.round(net.down / 1024);
      state.netUp = Math.round(net.up / 1024);
      hpush(hNd, state.netDown); hpush(hNu, state.netUp);
      const ip = SystemMetrics.ip();
      if (ip) state.ip = ip;
    }
    if (vram != null) { state.vramUsed = vram.used; state.vramTotal = vram.total; }
    if (disk != null) state.disk = disk;
    if (diskIo != null) {                           // bytes/s -> KB/s (entero)
      state.diskRd = Math.round(diskIo.rd / 1024);
      state.diskWr = Math.round(diskIo.wr / 1024);
      hpush(hDr, state.diskRd); hpush(hDw, state.diskWr);
    }
    if (procs != null) state.procs = procs;
    if (hNd.length || hDr.length) {                 // ventana reciente -> pre-carga de sparklines
      state.hist = {};
      if (hNd.length) { state.hist.nd = hNd.slice(); state.hist.nu = hNu.slice(); }
      if (hDr.length) { state.hist.dr = hDr.slice(); state.hist.dw = hDw.slice(); }
    }
    if (s.uptime) state.uptime = SystemMetrics.uptimeSec();
    if (s.clock) {                                  // hora local del PC -> reloj del pad (sin drift)
      const d = new Date();
      state.clockMin = d.getHours() * 60 + d.getMinutes();
    }
    const w = wiz.status();                          // feedback WiZ -> la capa muestra que controla
    state.wizRoom = w.room; state.wizTarget = w.target; state.wizOn = w.on; state.wizBright = w.bright;
    state.os = os;                                    // SO -> el pad lo muestra / resuelve per-OS

    // Siempre POSTeamos (aunque el state este vacio): la respuesta trae los
    // comandos que el pad encolo (mute global, etc.) y asi se entregan en ~pollMs.
    // Si hay un browser en el espejo, pedimos el blob `ui` (uiFull al recien conectar).
    const watching = hub.hasClients();
    const res = await device.push(state, { wantUi: watching, uiFull: watching && hub.takeFull() });
    if (res.ui !== undefined) hub.broadcast(res.ui);
    if (res.ok !== lastOk) { log.info(res.ok ? `conectado al pad ✓ (${device.currentHost})` : 'pad no responde (reintentando)'); lastOk = res.ok; }
    maybeDiscover(res.ok);   // si no responde, busca el pad en la LAN (DHCP)

    for (const cmd of res.cmds) {
      if (cmd === 'micToggle') {
        const nm = await providers.audio.toggleMicMute();
        log.info(`comando micToggle -> mic ${nm === null ? '??' : nm ? 'MUTEADO' : 'abierto'}`);
      } else if (cmd === 'camToggle') {
        log.info('comando camToggle -> sin mute de camara a nivel OS (lo hace el atajo de la app)');
      } else if (cmd === 'wizToggle')    { wiz.toggle();   log.info('WiZ on/off');
      } else if (cmd === 'wizBrightUp')  { wiz.brighter(); log.info('WiZ +brillo');
      } else if (cmd === 'wizBrightDown'){ wiz.dimmer();   log.info('WiZ -brillo');
      } else if (cmd === 'wizWarmer')    { wiz.warmer();   log.info('WiZ +calido');
      } else if (cmd === 'wizCooler')    { wiz.cooler();   log.info('WiZ +frio');
      } else if (cmd === 'wizRoomNext')  { await wiz.roomNext();  log.info(`WiZ cuarto -> ${wiz.status().room}`);
      } else if (cmd === 'wizLightNext') { await wiz.lightNext(); log.info(`WiZ luz -> ${wiz.status().target}`);
      } else {
        log.info(`comando desconocido: ${cmd}`);
      }
    }

    for (const id of res.launch ?? []) {            // capa Launcher -> lanzar app por OS
      const app = cfg.apps[id];
      if (!app) { log.info(`launch id ${id}: sin app configurada`); continue; }
      const cmd = os === 'Linux' ? app.linux : app.win;
      if (cmd) launchApp(app.label, cmd); else log.info(`launch ${app.label}: sin comando para ${os}`);
    }

    // pollMs dinamico: 250ms si hay un browser mirando (se siente live), idle al normal.
    const interval = hub.hasClients() ? Math.min(cfg.pollMs, 250) : cfg.pollMs;
    if (!stop) setTimeout(tick, interval);   // recursivo: nunca solapa un poll lento
  };

  await tick();
}

main().catch((e) => { log.error(e); process.exit(1); });
