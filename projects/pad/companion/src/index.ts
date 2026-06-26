import { loadConfig } from './config';
import { Device } from './device';
import { pickProviders } from './providers';
import { SystemMetrics } from './providers/system';
import { Wiz } from './wiz';
import type { PadState } from './state';
import { log } from './log';

async function main(): Promise<void> {
  process.title = 'pad-companion';                  // se ve asi en top/ps/htop (no como "node")
  const cfg = loadConfig(process.argv);
  const sys = new SystemMetrics();                  // CPU carga/nucleos + RAM + IP (universal, modulo os)
  log.info(`pad-companion -> http://${cfg.host}/api/state  cada ${cfg.pollMs}ms  (${process.platform})`);

  const providers = await pickProviders();
  const device = new Device(cfg.host, cfg.token);

  const wiz = new Wiz(cfg.wiz.rooms);
  const nWiz = await wiz.discover();
  log.info(`WiZ: ${nWiz} luz(ces) energizada(s) ${nWiz ? '✓' : '(ninguna; ver red/firewall o config.json)'}`);
  setInterval(() => { void wiz.discover(); }, 30000);   // re-descubre: IPs DHCP, bombitas que prenden/apagan

  let stop = false;
  const quit = () => { stop = true; log.info('saliendo...'); };
  process.on('SIGINT', quit);
  process.on('SIGTERM', quit);

  let lastOk: boolean | null = null;

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
      const ip = SystemMetrics.ip();
      if (ip) state.ip = ip;
    }
    if (vram != null) { state.vramUsed = vram.used; state.vramTotal = vram.total; }
    if (disk != null) state.disk = disk;
    if (diskIo != null) {                           // bytes/s -> KB/s (entero)
      state.diskRd = Math.round(diskIo.rd / 1024);
      state.diskWr = Math.round(diskIo.wr / 1024);
    }
    if (procs != null) state.procs = procs;
    if (s.uptime) state.uptime = SystemMetrics.uptimeSec();
    if (s.clock) {                                  // hora local del PC -> reloj del pad (sin drift)
      const d = new Date();
      state.clockMin = d.getHours() * 60 + d.getMinutes();
    }
    const w = wiz.status();                          // feedback WiZ -> la capa muestra que controla
    state.wizRoom = w.room; state.wizTarget = w.target; state.wizOn = w.on; state.wizBright = w.bright;

    // Siempre POSTeamos (aunque el state este vacio): la respuesta trae los
    // comandos que el pad encolo (mute global, etc.) y asi se entregan en ~pollMs.
    const res = await device.push(state);
    if (res.ok !== lastOk) { log.info(res.ok ? 'conectado al pad ✓' : 'pad no responde (reintentando)'); lastOk = res.ok; }

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

    if (!stop) setTimeout(tick, cfg.pollMs);   // recursivo: nunca solapa un poll lento
  };

  await tick();
}

main().catch((e) => { log.error(e); process.exit(1); });
