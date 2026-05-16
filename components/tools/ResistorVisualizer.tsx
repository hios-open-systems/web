'use client';

import React from 'react';

export type ResistorPackageType =
  | 'axial-carbon'
  | 'axial-metal'
  | 'axial-ceramic'
  | 'axial-wirewound'
  | 'melf'
  | 'smd-0603'
  | 'smd-0805'
  | 'smd-1206';

interface ResistorVisualizerProps {
  packageType: ResistorPackageType;
  wattage: number;
  resistorValue: number;
  tolerance: number;
  bandColors: string[];
  smdCode: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatValueShort(valueOhm: number): string {
  if (valueOhm >= 1_000_000) {
    const m = valueOhm / 1_000_000;
    return `${m.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (valueOhm >= 1_000) {
    const k = valueOhm / 1_000;
    const whole = Math.floor(k);
    const decimal = Math.round((k - whole) * 10);
    return decimal === 0 ? `${whole}K` : `${whole}K${decimal}`;
  }
  if (valueOhm >= 10) return `${Math.round(valueOhm)}`;
  return valueOhm.toFixed(1).replace('.0', '');
}

function toleranceLetter(tolerance: number): string {
  if (tolerance === 1) return 'F';
  if (tolerance === 2) return 'G';
  if (tolerance === 10) return 'K';
  return 'J';
}

export function ResistorVisualizer({
  packageType,
  wattage,
  resistorValue,
  tolerance,
  bandColors,
  smdCode,
}: ResistorVisualizerProps) {
  const isSmd = packageType.startsWith('smd');
  const isMelf = packageType === 'melf';
  const isCeramic = packageType === 'axial-ceramic';
  const isWirewound = packageType === 'axial-wirewound';
  const isMetalFilm = packageType === 'axial-metal';
  const isBanded = packageType === 'axial-carbon' || isMetalFilm || isMelf;

  const safeBandColors = [
    bandColors[0] || '#ff0000',
    bandColors[1] || '#ff0000',
    bandColors[2] || '#ff0000',
    bandColors[3] || '#d4af37',
  ];

  const caption = `${formatValueShort(resistorValue)}Ω · ±${tolerance}% · ${wattage >= 1 ? wattage.toFixed(0) : wattage.toFixed(3).replace(/0+$/, '')}W`;

  const axialScale = clamp(0.9 + Math.log2(Math.max(wattage, 0.125) / 0.25 + 1) * 0.5, 0.85, 2.4);
  const blockScale = clamp(1.1 + Math.log2(Math.max(wattage, 0.25) / 0.5 + 1) * 0.7, 1, 2.8);
  const bodyColor = isMetalFilm ? '#6fa8d6' : isMelf ? '#1f2937' : '#d8be96';

  const smdSizeMap: Record<string, { width: number; height: number; lead: number }> = {
    'smd-0603': { width: 92, height: 48, lead: 16 },
    'smd-0805': { width: 116, height: 60, lead: 18 },
    'smd-1206': { width: 150, height: 74, lead: 22 },
  };
  const smdSize = smdSizeMap[packageType] || smdSizeMap['smd-0805'];

  const Lead = ({ x1, x2, w = 4 }: { x1: number; x2: number; w?: number }) => (
    <>
      <line x1={x1} y1={0} x2={x2} y2={0} stroke="#6b7280" strokeWidth={w + 2} strokeLinecap="round" />
      <line x1={x1} y1={-1} x2={x2} y2={-1} stroke="#d1d5db" strokeWidth={Math.max(1, w - 2)} strokeLinecap="round" />
    </>
  );

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        boxShadow: '0 10px 26px rgba(0,0,0,0.28)',
      }}
    >
      <svg viewBox="0 0 560 210" width="100%" height="210" role="img" aria-label="Resistor visualizer">
        <defs>
          <pattern id="gridPattern" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id="boardGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#121212" />
            <stop offset="100%" stopColor="#1c1c1c" />
          </linearGradient>
          <linearGradient id="bodyShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
          </linearGradient>
          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8eaed" />
            <stop offset="100%" stopColor="#9aa0a8" />
          </linearGradient>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="190%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect x="0" y="0" width="560" height="210" fill="url(#boardGradient)" />
        <rect x="0" y="0" width="560" height="210" fill="url(#gridPattern)" />

        <g transform="translate(280,92)" filter="url(#softShadow)">
          {isSmd && (
            <>
              <Lead x1={-200} x2={-smdSize.width / 2 - smdSize.lead} />
              <Lead x1={smdSize.width / 2 + smdSize.lead} x2={200} />
              {[-1, 1].map((s) => (
                <g key={s}>
                  <rect
                    x={s === -1 ? -smdSize.width / 2 - smdSize.lead : smdSize.width / 2}
                    y={-smdSize.height / 2}
                    width={smdSize.lead}
                    height={smdSize.height}
                    rx="3"
                    fill="url(#capGrad)"
                  />
                  <path
                    d={`M ${s * (smdSize.width / 2)} ${-smdSize.height / 2} q ${s * 14} ${smdSize.height / 2} 0 ${smdSize.height}`}
                    fill="rgba(180,190,200,0.45)"
                  />
                </g>
              ))}
              <rect
                x={-smdSize.width / 2}
                y={-smdSize.height / 2}
                width={smdSize.width}
                height={smdSize.height}
                rx="7"
                fill="#0d0d0f"
                stroke="#4b5563"
                strokeWidth="1.4"
              />
              <rect
                x={-smdSize.width / 2}
                y={-smdSize.height / 2}
                width={smdSize.width}
                height={smdSize.height / 2.4}
                rx="7"
                fill="rgba(255,255,255,0.07)"
              />
              <text x="0" y="6" textAnchor="middle" fill="#f3f4f6" fontSize={Math.max(14, smdSize.height * 0.34)} fontWeight="700" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                {smdCode}
              </text>
            </>
          )}

          {isBanded && (() => {
            const bodyW = (isMelf ? 150 : 150) * (isMelf ? 1 : axialScale);
            const bodyH = (isMelf ? 52 : 44) * (isMelf ? 1 : axialScale);
            const leftX = -bodyW / 2;
            return (
              <>
                <Lead x1={-250} x2={leftX - 14} w={isMelf ? 5 : 4} />
                <Lead x1={bodyW / 2 + 14} x2={250} w={isMelf ? 5 : 4} />
                {isMelf && [-1, 1].map((s) => (
                  <rect key={s} x={s === -1 ? leftX - 14 : bodyW / 2 - 4} y={-bodyH / 2 - 2} width={18} height={bodyH + 4} rx="4" fill="url(#capGrad)" />
                ))}
                <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2.1} fill={bodyColor} stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" />
                <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2.1} fill="url(#bodyShade)" />
                {safeBandColors.map((color, index) => {
                  const spacing = bodyW / 6;
                  const x = leftX + spacing * (index + 1.1) - (index === 3 ? -spacing * 0.5 : 0);
                  const light = ['#ffffff', '#ffd700', '#c0c0c0'].includes(color.toLowerCase());
                  return (
                    <g key={`${color}-${index}`}>
                      <rect x={x} y={-bodyH / 2 - 1.5} width={Math.max(10, bodyW * 0.058)} height={bodyH + 3} rx="2" fill={color} stroke={light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.22)'} strokeWidth="1" />
                      <rect x={x} y={-bodyH / 2 - 1.5} width={Math.max(10, bodyW * 0.058)} height={(bodyH + 3) * 0.4} rx="2" fill="rgba(255,255,255,0.18)" />
                    </g>
                  );
                })}
              </>
            );
          })()}

          {(isCeramic || isWirewound) && (() => {
            const bodyW = 150 * blockScale;
            const bodyH = (isWirewound ? 56 : 46) * blockScale;
            const leftX = -bodyW / 2;
            return (
              <>
                <Lead x1={-250} x2={leftX} w={5} />
                <Lead x1={bodyW / 2} x2={250} w={5} />
                <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx="5" fill={isWirewound ? '#eef0f2' : '#f1f5f9'} stroke="#9ca3af" strokeWidth="1.3" />
                <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx="5" fill="url(#bodyShade)" opacity="0.5" />
                {isWirewound && Array.from({ length: 9 }).map((_, i) => {
                  const gx = leftX + (bodyW / 9) * (i + 0.5);
                  return <line key={i} x1={gx} y1={-bodyH / 2 + 4} x2={gx} y2={bodyH / 2 - 4} stroke="rgba(120,130,140,0.4)" strokeWidth="2" />;
                })}
                <text x="0" y="5" textAnchor="middle" fill="#0f172a" fontSize={Math.max(12, bodyH * 0.24)} fontWeight="700" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  {`${formatValueShort(resistorValue)}Ω ${toleranceLetter(tolerance)}`}
                </text>
              </>
            );
          })()}
        </g>

        <text x="280" y="190" textAnchor="middle" fill="#9ca3af" fontSize="15" fontWeight="600" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {caption}
        </text>
      </svg>
    </div>
  );
}
