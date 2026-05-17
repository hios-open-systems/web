import React from 'react';

/* Reusable circuit-schematic primitives. Coordinates are in a 360×150 user
 * space; compose them in circuits.tsx. Wires/bodies use currentColor so the
 * parent <Schematic> controls the theme; value labels use the accent. */

export const VBW = 360;
export const VBH = 150;

export function Schematic({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block', color: '#8b97a6' }}
    >
      {children}
    </svg>
  );
}

export const Wire = ({ d }: { d: string }) => (
  <path d={d} stroke="currentColor" strokeWidth={1.6} fill="none" />
);

export const Dot = ({ x, y }: { x: number; y: number }) => (
  <circle cx={x} cy={y} r={2.6} fill="currentColor" />
);

export function Value({ x, y, text, anchor = 'middle' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="11" fontWeight={600} fill="var(--accent)">
      {text}
    </text>
  );
}

export function Pin({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="10" fill="#8b97a6">
      {text}
    </text>
  );
}

/** Horizontal resistor zigzag centred on (x,y), 44 px wide. */
export function ResistorH({ x, y }: { x: number; y: number }) {
  const w = 44;
  const x0 = x - w / 2;
  const seg = w / 6;
  const pts = [
    `${x0},${y}`,
    `${x0 + seg * 0.5},${y - 7}`,
    `${x0 + seg * 1.5},${y + 7}`,
    `${x0 + seg * 2.5},${y - 7}`,
    `${x0 + seg * 3.5},${y + 7}`,
    `${x0 + seg * 4.5},${y - 7}`,
    `${x0 + seg * 5.5},${y + 7}`,
    `${x0 + w},${y}`,
  ].join(' ');
  return <polyline points={pts} stroke="currentColor" strokeWidth={1.6} fill="none" />;
}

/** Vertical resistor (for the bottom leg of a divider). */
export function ResistorV({ x, y }: { x: number; y: number }) {
  const h = 44;
  const y0 = y - h / 2;
  const seg = h / 6;
  const pts = [
    `${x},${y0}`,
    `${x - 7},${y0 + seg * 0.5}`,
    `${x + 7},${y0 + seg * 1.5}`,
    `${x - 7},${y0 + seg * 2.5}`,
    `${x + 7},${y0 + seg * 3.5}`,
    `${x - 7},${y0 + seg * 4.5}`,
    `${x + 7},${y0 + seg * 5.5}`,
    `${x},${y0 + h}`,
  ].join(' ');
  return <polyline points={pts} stroke="currentColor" strokeWidth={1.6} fill="none" />;
}

/** Capacitor to ground from node (x, y) downward. */
export function CapacitorDown({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none">
      <line x1={x} y1={y} x2={x} y2={y + 16} />
      <line x1={x - 11} y1={y + 16} x2={x + 11} y2={y + 16} />
      <line x1={x - 11} y1={y + 22} x2={x + 11} y2={y + 22} />
      <line x1={x} y1={y + 22} x2={x} y2={y + 30} />
    </g>
  );
}

/** Inline series capacitor, horizontal, centred on (x,y). */
export function CapacitorH({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none">
      <line x1={x - 14} y1={y} x2={x - 4} y2={y} />
      <line x1={x - 4} y1={y - 11} x2={x - 4} y2={y + 11} />
      <line x1={x + 4} y1={y - 11} x2={x + 4} y2={y + 11} />
      <line x1={x + 4} y1={y} x2={x + 14} y2={y} />
    </g>
  );
}

/** Series inductor (4 humps), horizontal, centred on (x,y). */
export function InductorH({ x, y }: { x: number; y: number }) {
  const x0 = x - 24;
  let d = `M ${x0} ${y}`;
  for (let i = 0; i < 4; i++) d += ` a 6 6 0 0 1 12 0`;
  return <path d={d} stroke="currentColor" strokeWidth={1.6} fill="none" />;
}

export function Ground({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6}>
      <line x1={x} y1={y} x2={x} y2={y + 8} />
      <line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8} />
      <line x1={x - 6} y1={y + 12} x2={x + 6} y2={y + 12} />
      <line x1={x - 2} y1={y + 16} x2={x + 2} y2={y + 16} />
    </g>
  );
}

/** Op-amp triangle, input side at xIn, tip (output) at xOut, centred vy. */
export function OpAmp({ xIn, xOut, vy }: { xIn: number; xOut: number; vy: number }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none">
      <polygon points={`${xIn},${vy - 26} ${xIn},${vy + 26} ${xOut},${vy}`} />
      <text x={xIn + 7} y={vy - 9} fontSize="11" fill="#8b97a6" stroke="none">−</text>
      <text x={xIn + 7} y={vy + 14} fontSize="11" fill="#8b97a6" stroke="none">+</text>
    </g>
  );
}

export function LedSym({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none">
      <polygon points={`${x - 9},${y - 9} ${x - 9},${y + 9} ${x + 7},${y}`} fill="currentColor" />
      <line x1={x + 7} y1={y - 9} x2={x + 7} y2={y + 9} />
      <line x1={x + 11} y1={y - 13} x2={x + 17} y2={y - 19} />
      <line x1={x + 14} y1={y - 8} x2={x + 20} y2={y - 14} />
    </g>
  );
}
