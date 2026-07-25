/**
 * Click de metrónomo compartido (composer + MetronomeTool). Un oscilador corto con
 * envelope rápido; acento (downbeat) más agudo y fuerte. Funciona con cualquier
 * BaseAudioContext. Fuente única del sonido de click en todo el sitio.
 */
export function scheduleClick(
  ctx: BaseAudioContext,
  dest: AudioNode,
  when: number,
  accent = false,
): AudioScheduledSourceNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 2000 : 1400;
  const peak = accent ? 0.5 : 0.3;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
  osc.connect(gain).connect(dest);
  osc.start(when);
  osc.stop(when + 0.06);
  return osc;
}
