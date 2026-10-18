'use client';

import { useTranslations } from 'next-intl';
import { SignalPlot } from '@/components/instruments/SignalPlot';
import { SCOPE_COLORS } from '@/components/instruments/channels';
import { dataDomain } from '@/components/instruments/plotGeometry';
import type { Point } from './responses';

export interface PlotSeries { points: Point[]; color?: string; label?: string; }
interface PlotProps {
  series: PlotSeries[];
  xLog?: boolean;
  xLabel?: string;
  yLabel?: string;
  yUnit?: string;
  mark?: { x: number; label: string };
  height?: number;
}

/** Compatibility adapter: existing calculator curves use the shared instrument. */
export function Plot({ series, xLog = true, xLabel = 'f', yLabel = '', yUnit, mark, height = 220 }: PlotProps) {
  const t = useTranslations('Instrument');
  const points = series.flatMap((s) => s.points).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && (!xLog || x > 0));
  if (!points.length) return null;
  const yTitle = yLabel + (yUnit ? ' (' + yUnit + ')' : '');
  return <SignalPlot label={t('frequencyResponse')} height={height} status={t('model')}
    series={series.map((s, i) => ({ id: String(i), label: s.label ?? yTitle, color: s.color ?? SCOPE_COLORS[i % SCOPE_COLORS.length], points: s.points }))}
    xAxis={{ domain: dataDomain(points, 0), scale: xLog ? 'log' : 'linear', label: xLabel === 'f' ? 'f (Hz)' : xLabel }}
    yAxis={{ domain: dataDomain(points, 1, 0.08), label: yTitle }}
    markers={mark ? [mark] : []} />;
}
