'use client';

import { useId, type ReactNode } from 'react';
import { InstrumentScreen } from './InstrumentScreen';
import type { ScopeChannel } from './channels';
import { axisPosition, axisTicks, formatScopeValue, tracePath, validAxis, type ScopeAxis, type ScopePoint } from './plotGeometry';
import { usePlotWidth } from './usePlotWidth';
import styles from './instrumentScreen.module.css';

export interface ScopeSeries extends ScopeChannel { points: readonly ScopePoint[]; lineWidth?: number; }
export interface SignalPlotProps {
  label: string;
  description?: string;
  series: readonly ScopeSeries[];
  xAxis: ScopeAxis;
  yAxis: ScopeAxis;
  markers?: readonly { x: number; label: string }[];
  height?: number;
  status?: ReactNode;
  controls?: ReactNode;
}

const LEFT = 56, RIGHT = 18, TOP = 24, BOTTOM = 48;

function PlotAxes({ xAxis, yAxis, width, height }: Pick<SignalPlotProps, 'xAxis' | 'yAxis'> & { width: number; height: number }) {
  const x = (v: number) => axisPosition(v, xAxis, LEFT, width - RIGHT);
  const y = (v: number) => axisPosition(v, yAxis, height - BOTTOM, TOP);
  return <g className={styles.axis}>
    {axisTicks(xAxis).map((value) => <g key={value}>
      <line className={styles.grid} x1={x(value)} x2={x(value)} y1={TOP} y2={height - BOTTOM} />
      <text x={x(value)} y={height - BOTTOM + 18} textAnchor="middle">{(xAxis.format ?? formatScopeValue)(value)}</text>
    </g>)}
    {axisTicks(yAxis).map((value) => <g key={value}>
      <line className={styles.grid} x1={LEFT} x2={width - RIGHT} y1={y(value)} y2={y(value)} />
      <text x={LEFT - 8} y={y(value) + 4} textAnchor="end">{(yAxis.format ?? formatScopeValue)(value)}</text>
    </g>)}
    <text x={(LEFT + width - RIGHT) / 2} y={height - 8} textAnchor="middle">{xAxis.label}</text>
    <text x={LEFT} y={14}>{yAxis.label}</text>
  </g>;
}

function PlotTraces({ series, xAxis, yAxis, markers = [], width, height, clipId }: SignalPlotProps & { width: number; height: number; clipId: string }) {
  const x = (v: number) => axisPosition(v, xAxis, LEFT, width - RIGHT);
  const y = (v: number) => axisPosition(v, yAxis, height - BOTTOM, TOP);
  return <>
    <g clipPath={`url(#${clipId})`}>
      {series.map((channel) => <path key={channel.id} data-trace-id={channel.id} className={styles.trace}
        stroke={channel.color} style={{ strokeWidth: channel.lineWidth ?? 2 }} d={tracePath(channel.points, x, y)} />)}
    </g>
    {markers.filter((m) => m.x >= xAxis.domain[0] && m.x <= xAxis.domain[1]).map((marker) => (
      <g key={marker.label}>
        <line className={styles.marker} x1={x(marker.x)} x2={x(marker.x)} y1={TOP} y2={height - BOTTOM} />
        <text className={styles.markerLabel} x={x(marker.x) > width / 2 ? x(marker.x) - 4 : x(marker.x) + 4}
          y={TOP + 12} textAnchor={x(marker.x) > width / 2 ? 'end' : 'start'}>{marker.label}</text>
      </g>
    ))}
  </>;
}

/** A renderer only: callers provide units, domains and the model's sampled values. */
export function SignalPlot(props: SignalPlotProps) {
  const { ref, width } = usePlotWidth();
  const clipId = useId();
  const height = props.height ?? 240;
  const valid = validAxis(props.xAxis) && validAxis(props.yAxis);
  return <InstrumentScreen label={props.label} channels={props.series} status={props.status} controls={props.controls}>
    <div ref={ref}>
      <svg className={styles.plot} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={props.description ?? props.label}>
        <title>{props.label}</title>
        <defs><clipPath id={clipId}><rect x={LEFT} y={TOP} width={width - LEFT - RIGHT} height={height - TOP - BOTTOM} /></clipPath></defs>
        {valid && <>
          <PlotAxes {...props} width={width} height={height} />
          <PlotTraces {...props} width={width} height={height} clipId={clipId} />
        </>}
      </svg>
    </div>
  </InstrumentScreen>;
}
