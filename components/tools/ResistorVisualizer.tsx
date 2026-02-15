'use client';

import React from 'react';

export type ResistorPackageType =
  | 'axial-carbon'
  | 'axial-metal'
  | 'axial-ceramic'
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
    const s = m.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
    return `${s}M`;
  }

  if (valueOhm >= 1_000) {
    const k = valueOhm / 1_000;
    const whole = Math.floor(k);
    const decimal = Math.round((k - whole) * 10);
    if (decimal === 0) return `${whole}K`;
    return `${whole}K${decimal}`;
  }

  if (valueOhm >= 10) return `${Math.round(valueOhm)}`;
  return valueOhm.toFixed(1).replace('.0', '');
}

function toleranceLetter(tolerance: number): string {
  if (tolerance === 1) return 'F';
  if (tolerance === 2) return 'G';
  if (tolerance === 5) return 'J';
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
  const isCeramic = packageType === 'axial-ceramic';
  const isMetalFilm = packageType === 'axial-metal';

  const safeBandColors = [
    bandColors[0] || '#ff0000',
    bandColors[1] || '#ff0000',
    bandColors[2] || '#ff0000',
    bandColors[3] || '#d4af37',
  ];

  const axialScale = clamp(0.9 + Math.log2(Math.max(wattage, 0.125) / 0.25 + 1) * 0.5, 0.85, 2.6);
  const ceramicScale = clamp(1.1 + Math.log2(Math.max(wattage, 0.25) / 0.5 + 1) * 0.8, 1, 3.2);

  const bodyColor = isMetalFilm ? '#78a9d3' : '#d7bd96';
  const bodyScale = isCeramic ? ceramicScale : axialScale;

  const smdSizeMap: Record<string, { width: number; height: number; lead: number }> = {
    'smd-0603': { width: 88, height: 46, lead: 16 },
    'smd-0805': { width: 108, height: 58, lead: 18 },
    'smd-1206': { width: 138, height: 70, lead: 22 },
  };

  const smdSize = smdSizeMap[packageType] || smdSizeMap['smd-0805'];

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
      <svg viewBox="0 0 560 190" width="100%" height="190" role="img" aria-label="Resistor visualizer">
        <defs>
          <pattern id="gridPattern" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>

          <linearGradient id="boardGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#131313" />
            <stop offset="100%" stopColor="#1b1b1b" />
          </linearGradient>

          <linearGradient id="axialBodyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>

          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect x="0" y="0" width="560" height="190" fill="url(#boardGradient)" />
        <rect x="0" y="0" width="560" height="190" fill="url(#gridPattern)" />

        {isSmd ? (
          <g transform="translate(280,95)" filter="url(#softShadow)">
            <line x1={-190} y1={0} x2={-smdSize.width / 2 - smdSize.lead} y2={0} stroke="#9da3af" strokeWidth="3" />
            <line x1={smdSize.width / 2 + smdSize.lead} y1={0} x2={190} y2={0} stroke="#9da3af" strokeWidth="3" />

            <rect
              x={-smdSize.width / 2 - smdSize.lead}
              y={-smdSize.height / 2}
              width={smdSize.lead}
              height={smdSize.height}
              rx="3"
              fill="#c6c8cc"
            />
            <rect
              x={smdSize.width / 2}
              y={-smdSize.height / 2}
              width={smdSize.lead}
              height={smdSize.height}
              rx="3"
              fill="#c6c8cc"
            />

            <rect
              x={-smdSize.width / 2}
              y={-smdSize.height / 2}
              width={smdSize.width}
              height={smdSize.height}
              rx="8"
              fill="#0d0d0f"
              stroke="#4b5563"
              strokeWidth="1.4"
            />

            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#f3f4f6"
              fontSize={Math.max(14, smdSize.height * 0.35)}
              fontWeight="700"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {smdCode}
            </text>
          </g>
        ) : (
          <g transform="translate(280,95)" filter="url(#softShadow)">
            {(() => {
              const bodyW = isCeramic ? 110 * bodyScale : 130 * bodyScale;
              const bodyH = isCeramic ? 44 * bodyScale : 40 * bodyScale;
              const leftX = -bodyW / 2;
              const rightX = bodyW / 2;

              return (
                <>
                  <line x1={-240} y1={0} x2={leftX - 16} y2={0} stroke="#9da3af" strokeWidth={isCeramic ? 4 : 3} />
                  <line x1={rightX + 16} y1={0} x2={240} y2={0} stroke="#9da3af" strokeWidth={isCeramic ? 4 : 3} />

                  {!isCeramic ? (
                    <>
                      <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2.1} fill={bodyColor} stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" />
                      <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2.1} fill="url(#axialBodyGradient)" opacity="0.55" />

                      {safeBandColors.map((color, index) => {
                        const spacing = bodyW / 6;
                        const x = leftX + spacing * (index + 1);
                        const isLight = color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#ffd700';
                        return (
                          <rect
                            key={`${color}-${index}`}
                            x={x}
                            y={-bodyH / 2 - 1}
                            width={Math.max(9, bodyW * 0.06)}
                            height={bodyH + 2}
                            rx="2"
                            fill={color}
                            stroke={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)'}
                            strokeWidth="1"
                          />
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <rect x={leftX} y={-bodyH / 2} width={bodyW} height={bodyH} rx="4" fill="#f1f5f9" stroke="#9ca3af" strokeWidth="1.3" />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#111827"
                        fontSize={Math.max(11, bodyH * 0.26)}
                        fontWeight="700"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      >
                        {`${wattage >= 1 ? wattage.toFixed(0) : wattage.toFixed(2)}W ${formatValueShort(resistorValue)} ${toleranceLetter(tolerance)}`}
                      </text>
                    </>
                  )}
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
