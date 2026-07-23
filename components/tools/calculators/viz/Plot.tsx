import React, { useMemo } from 'react';
import type { Point } from './responses';

export interface PlotSeries {
  points: Point[];
  color: string;
  label?: string;
}

interface PlotProps {
  series: PlotSeries[];
  xLog?: boolean;
  xLabel?: string;
  yLabel?: string;
  yUnit?: string;
  mark?: { x: number; label: string };
  height?: number;
}

const W = 560;

const fmtHz = (v: number) => {
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}k`;
  return `${v.toFixed(0)}`;
};
const fmtY = (v: number) => (Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

/* Dependency-free themed XY plot. Knows nothing about circuits — just maps
 * (x,y) series into an SVG, with optional log-x and a vertical marker. */
export function Plot({ series, xLog = true, xLabel, yLabel, yUnit, mark, height = 220 }: PlotProps) {
  const H = height;
  const padL = 52;
  const padB = 34;
  const padT = 14;
  const padR = 14;

  const geom = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    if (all.length === 0) return null;
    const tx = (x: number) => (xLog ? Math.log10(Math.max(x, 1e-9)) : x);
    const xs = all.map((p) => tx(p[0]));
    const ys = all.map((p) => p[1]);
    const xMin = Math.min(...xs);
    let xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (xMin === xMax) xMax = xMin + 1;
    const yPad = (yMax - yMin) * 0.08 || 1;
    yMin -= yPad;
    yMax += yPad;

    const px = (x: number) => padL + ((tx(x) - xMin) / (xMax - xMin)) * (W - padL - padR);
    const py = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin)) * (H - padT - padB);

    const xTicks: { v: number; x: number }[] = [];
    if (xLog) {
      for (let e = Math.ceil(xMin); e <= Math.floor(xMax); e++) {
        const v = Math.pow(10, e);
        xTicks.push({ v, x: px(v) });
      }
    } else {
      for (let i = 0; i <= 4; i++) {
        const v = xMin + ((xMax - xMin) * i) / 4;
        xTicks.push({ v, x: padL + ((W - padL - padR) * i) / 4 });
      }
    }
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / 4;
      return { v, y: py(v) };
    });

    return { px, py, xTicks, yTicks };
  }, [series, xLog, H]);

  if (!geom) return null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
      {/* grid */}
      {geom.yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke="rgba(128,128,128,0.18)" />
          <text x={padL - 8} y={t.y + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-stack-mono)" fill="var(--hios-text-muted)">{fmtY(t.v)}</text>
        </g>
      ))}
      {geom.xTicks.map((t, i) => (
        <g key={`x${i}`}>
          <line x1={t.x} x2={t.x} y1={padT} y2={H - padB} stroke="rgba(128,128,128,0.12)" />
          <text x={t.x} y={H - padB + 14} textAnchor="middle" fontSize="10" fontFamily="var(--font-stack-mono)" fill="var(--hios-text-muted)">{fmtHz(t.v)}</text>
        </g>
      ))}
      {/* axis labels */}
      {xLabel && <text x={(W + padL) / 2} y={H - 2} textAnchor="middle" fontSize="10" fontFamily="var(--font-stack-mono)" fill="var(--hios-text-secondary)">{xLabel}</text>}
      {yLabel && (
        <text x={12} y={H / 2} textAnchor="middle" fontSize="10" fontFamily="var(--font-stack-mono)" fill="var(--hios-text-secondary)" transform={`rotate(-90 12 ${H / 2})`}>
          {yLabel}{yUnit ? ` (${yUnit})` : ''}
        </text>
      )}
      {/* marker */}
      {mark && mark.x > 0 && (
        <g>
          <line x1={geom.px(mark.x)} x2={geom.px(mark.x)} y1={padT} y2={H - padB} stroke="var(--accent)" strokeDasharray="4 4" opacity={0.7} />
          <text x={geom.px(mark.x) + 4} y={padT + 11} fontSize="10" fill="var(--accent)">{mark.label}</text>
        </g>
      )}
      {/* series */}
      {series.map((s, si) => (
        <polyline
          key={si}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          points={s.points.map((p) => `${geom.px(p[0]).toFixed(1)},${geom.py(p[1]).toFixed(1)}`).join(' ')}
        />
      ))}
    </svg>
  );
}
