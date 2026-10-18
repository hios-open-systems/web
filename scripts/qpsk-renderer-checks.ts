import assert from 'node:assert/strict';
import { drawConstellation, drawTimeDomain } from '../components/dsp/QpskSimulator/qpskRenderer.ts';
import { CHANNELS, mapDibit } from '../components/dsp/QpskSimulator/qpskMath.ts';
import { constellationSamples } from '../components/dsp/QpskSimulator/qpskSimulation.ts';
import type { Point2D, QpskSimConfig } from '../components/dsp/QpskSimulator/types.ts';

class RecordingContext {
  strokeStyle = ''; fillStyle = ''; lineWidth = 1; shadowColor = ''; shadowBlur = 0;
  font = ''; textAlign = 'left';
  path: Point2D[] = [];
  strokes: { color: string; points: Point2D[] }[] = [];
  circles: Point2D[] = [];
  texts: string[] = [];
  save() {}
  restore() {}
  clearRect() {}
  setLineDash() {}
  beginPath() { this.path = []; }
  moveTo(x: number, y: number) { this.path.push({ x, y }); }
  lineTo(x: number, y: number) { this.path.push({ x, y }); }
  stroke() { this.strokes.push({ color: this.strokeStyle, points: [...this.path] }); }
  arc(x: number, y: number) { this.circles.push({ x, y }); }
  fill() {}
  fillText(text: string) { this.texts.push(text); }
  get canvasContext() { return this as unknown as CanvasRenderingContext2D; }
}

export function testRenderer(config: QpskSimConfig): void {
  console.log('QPSK: rendered colors, actual waveform, and normalized constellation');
  const a = new RecordingContext(), b = new RecordingContext();
  drawTimeDomain(a.canvasContext, 600, 360, { ...config, noiseLevel: 0 }, 0);
  drawTimeDomain(b.canvasContext, 600, 360, { ...config, noiseLevel: 0.6 }, 0);
  assert.deepEqual(a.strokes, b.strokes, 'TX must not change with receiver noise');
  const traces = CHANNELS.map((ch) => a.strokes.find((s) => s.color === ch.color && s.points.length === 600));
  traces.forEach((trace) => assert.ok(trace));
  for (let symbol = 0; symbol < config.dibits.length; symbol++) {
    const x = symbol * 100 + 25;
    const expected = mapDibit(config.dibits[symbol]);
    assert.ok(Math.abs(traces[0]!.points[x].y - (360 * 0.22 - expected.I * 360 * 0.075)) < 1e-10);
    assert.ok(Math.abs(traces[1]!.points[x].y - (360 * 0.46 - expected.Q * 360 * 0.075)) < 1e-10);
    const phase = 2 * Math.PI * config.cyclesPerSymbol * x / 100 + expected.phaseRad;
    assert.ok(Math.abs(traces[2]!.points[x].y - (360 * 0.77 - Math.cos(phase) * 360 * 0.165)) < 1e-10);
  }
  const point = constellationSamples([{ symbolIndex: 0, I: 0, Q: 0 }], ['00'], 0)[0];
  for (const width of [300, 900]) {
    const ctx = new RecordingContext();
    drawConstellation(ctx.canvasContext, width, 360, config, [point]);
    const drawn = ctx.circles.at(-1)!;
    const radius = Math.min(width, 360) * 0.35;
    assert.ok(Math.abs(drawn.x - (width / 2 + Math.SQRT1_2 * radius)) < 1e-10);
    assert.ok(Math.abs(drawn.y - (180 - Math.SQRT1_2 * radius)) < 1e-10);
  }
}
