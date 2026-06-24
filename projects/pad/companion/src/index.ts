import { loadConfig } from './config';
import { Device } from './device';
import { pickProviders } from './providers';
import type { PadState } from './state';
import { log } from './log';

async function main(): Promise<void> {
  const cfg = loadConfig(process.argv);
  log.info(`pad-companion -> http://${cfg.host}/api/state  cada ${cfg.pollMs}ms  (${process.platform})`);

  const providers = await pickProviders();
  const device = new Device(cfg.host, cfg.token);

  let stop = false;
  const quit = () => { stop = true; log.info('saliendo...'); };
  process.on('SIGINT', quit);
  process.on('SIGTERM', quit);

  let lastOk: boolean | null = null;

  const tick = async (): Promise<void> => {
    const s = cfg.send;
    const [vol, mic, cpuT, gpuT, cpuL, gpuL] = await Promise.all([
      s.vol     ? providers.audio.getVolume()      : Promise.resolve(null),
      s.mic     ? providers.audio.getMicMuted()     : Promise.resolve(null),
      s.cpuTemp ? providers.sensors.getCpuTempC()   : Promise.resolve(null),
      s.gpuTemp ? providers.sensors.getGpuTempC()   : Promise.resolve(null),
      s.cpuLoad ? providers.sensors.getCpuLoadPct() : Promise.resolve(null),
      s.gpuLoad ? providers.sensors.getGpuLoadPct() : Promise.resolve(null),
    ]);

    const state: PadState = {};
    if (vol  != null) state.vol = vol;
    if (mic  != null) state.mic = mic;
    if (cpuT != null) state.cpuTemp = cpuT;
    if (gpuT != null) state.gpuTemp = gpuT;
    if (cpuL != null) state.cpuLoad = cpuL;
    if (gpuL != null) state.gpuLoad = gpuL;
    if (s.clock) {                                  // hora local del PC -> reloj del pad (sin drift)
      const d = new Date();
      state.clockMin = d.getHours() * 60 + d.getMinutes();
    }

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
      } else {
        log.info(`comando desconocido: ${cmd}`);
      }
    }

    if (!stop) setTimeout(tick, cfg.pollMs);   // recursivo: nunca solapa un poll lento
  };

  await tick();
}

main().catch((e) => { log.error(e); process.exit(1); });
