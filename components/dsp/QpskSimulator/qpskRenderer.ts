import type { Dibit, Point2D, QpskSimConfig } from './types';
import { CHANNELS, GRAY_ORDER, carrierSample, mapDibit } from './qpskMath.ts';
import { projectPoint } from './qpskSimulation.ts';

/**
 * Dibuja la grilla reticular de osciloscopio CRT.
 */
export function drawScopeGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0, 255, 170, 0.08)';
  ctx.lineWidth = 1;

  const cols = 12;
  const rows = 8;
  for (let i = 1; i < cols; i++) {
    const x = (w / cols) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let j = 1; j < rows; j++) {
    const y = (h / rows) * j;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawSymbolHeaders(
  ctx: CanvasRenderingContext2D,
  h: number,
  dibits: Dibit[],
  symbolWidth: number,
): void {
  ctx.save();
  const isCompact = symbolWidth < 68;
  for (let s = 0; s < dibits.length; s++) {
    const xStart = s * symbolWidth;
    const xCenter = xStart + symbolWidth / 2;
    const info = mapDibit(dibits[s]);

    if (s > 0) {
      const hasJump = dibits[s] !== dibits[s - 1];
      ctx.strokeStyle = hasJump ? 'rgba(255, 68, 68, 0.42)' : 'rgba(255, 255, 255, 0.14)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xStart, 8);
      ctx.lineTo(xStart, h);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    if (isCompact) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(dibits[s], xCenter, 15);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`${info.phaseDeg}°`, xCenter, 27);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`"${dibits[s]}" (${info.phaseDeg}°)`, xCenter, 22);
    }
  }
  ctx.restore();
}

function drawDigitalChannel(
  ctx: CanvasRenderingContext2D,
  w: number,
  dibits: Dibit[],
  symbolWidth: number,
  yBase: number,
  amp: number,
  channel: 'I' | 'Q',
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const sIdx = Math.min(dibits.length - 1, Math.floor(x / symbolWidth));
    const info = mapDibit(dibits[sIdx]);
    const val = channel === 'I' ? info.I : info.Q;
    const y = yBase - val * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawReferenceWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  yCh3: number,
  ampCarrier: number,
  cycles: number,
  timeOffset: number,
  symbolWidth: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const totalSym = x / symbolWidth;
    const wt = 2 * Math.PI * cycles * totalSym - timeOffset;
    const y = yCh3 - Math.cos(wt) * ampCarrier;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCarrierWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  dibits: Dibit[],
  symbolWidth: number,
  yCh3: number,
  ampCarrier: number,
  cycles: number,
  timeOffset: number,
): void {
  ctx.save();
  ctx.strokeStyle = CHANNELS[2].color;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = CHANNELS[2].color;
  ctx.shadowBlur = 8;
  ctx.beginPath();

  for (let x = 0; x < w; x++) {
    const sIdx = Math.min(dibits.length - 1, Math.floor(x / symbolWidth));
    const totalSym = x / symbolWidth;
    const wt = 2 * Math.PI * cycles * totalSym - timeOffset;

    const y = yCh3 - carrierSample(dibits[sIdx], wt) * ampCarrier;

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPhaseJumpMarkers(
  ctx: CanvasRenderingContext2D,
  dibits: Dibit[],
  symbolWidth: number,
  yCh3: number,
): void {
  ctx.save();
  for (let s = 1; s < dibits.length; s++) {
    if (dibits[s] !== dibits[s - 1]) {
      const x = s * symbolWidth;
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, yCh3, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Renderiza el dominio del tiempo en el Canvas Izquierdo (CH1, CH2, CH3, Ref).
 */
export function drawTimeDomain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: QpskSimConfig,
  timeOffset: number,
): void {
  drawScopeGrid(ctx, w, h);

  const numSymbols = config.dibits.length;
  const symbolWidth = w / numSymbols;

  const yCh1 = h * 0.22;
  const yCh2 = h * 0.46;
  const yCh3 = h * 0.77;
  const ampDigital = h * 0.075;
  const ampCarrier = h * 0.165;

  drawSymbolHeaders(ctx, h, config.dibits, symbolWidth);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  [yCh1, yCh2, yCh3].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });

  if (config.showReference) {
    drawReferenceWave(ctx, w, yCh3, ampCarrier, config.cyclesPerSymbol, timeOffset, symbolWidth);
  }

  drawDigitalChannel(ctx, w, config.dibits, symbolWidth, yCh1, ampDigital, 'I', CHANNELS[0].color);
  drawDigitalChannel(ctx, w, config.dibits, symbolWidth, yCh2, ampDigital, 'Q', CHANNELS[1].color);
  drawCarrierWave(
    ctx,
    w,
    config.dibits,
    symbolWidth,
    yCh3,
    ampCarrier,
    config.cyclesPerSymbol,
    timeOffset,
  );
  drawPhaseJumpMarkers(ctx, config.dibits, symbolWidth, yCh3);
}

function drawConstellationAxes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  w: number,
  h: number,
): void {
  ctx.strokeStyle = 'rgba(0, 255, 170, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('+I (0°)', w - 8, cy - 6);
  ctx.textAlign = 'left';
  ctx.fillText('+Q (90°)', cx + 6, 18);
}

function drawConstellationTrajectories(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dibits: Dibit[],
): void {
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  dibits.forEach((dibit, idx) => {
    const { I, Q } = mapDibit(dibit);
    const px = cx + I * Math.SQRT1_2 * radius;
    const py = cy - Q * Math.SQRT1_2 * radius;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function drawIdealTargets(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  w: number,
): void {
  ctx.save();
  const isNarrow = w < 290;
  GRAY_ORDER.forEach((dibit) => {
    const { I, Q, phaseDeg } = mapDibit(dibit);
    const px = cx + I * Math.SQRT1_2 * radius;
    const py = cy - Q * Math.SQRT1_2 * radius;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = isNarrow ? 'bold 10px monospace' : 'bold 12px monospace';
    ctx.textAlign = 'center';
    const offsetY = Q > 0 ? -15 : 22;
    ctx.fillText(`${dibit} (${phaseDeg}°)`, px, py + offsetY);
  });
  ctx.restore();
}

function drawPhosphorCloud(ctx: CanvasRenderingContext2D, historyXY: Point2D[], w: number, h: number): void {
  historyXY.forEach((pt, idx) => {
    const alpha = ((idx + 1) / historyXY.length) * 0.85;
    ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
    ctx.beginPath();
    const pixel = projectPoint(pt, w, h);
    ctx.arc(pixel.x, pixel.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Renderiza el diagrama de constelación en Modo X-Y (Canvas Derecho).
 */
export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: QpskSimConfig,
  historyXY: Point2D[],
): void {
  drawScopeGrid(ctx, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.35;

  drawConstellationAxes(ctx, cx, cy, radius, w, h);

  if (config.showTrajectories) {
    drawConstellationTrajectories(ctx, cx, cy, radius, config.dibits);
  }

  drawIdealTargets(ctx, cx, cy, radius, w);
  drawPhosphorCloud(ctx, historyXY, w, h);
}
