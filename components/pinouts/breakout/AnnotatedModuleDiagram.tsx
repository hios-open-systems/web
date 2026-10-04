import type { ReactNode } from 'react';
import type { Breakout } from '@/config/pinouts/modules';
import { roleVar } from '@/config/pinouts/modules';
import { contactPoint } from './pinReferenceLayout';

const ART_X = 180;
const WIDTH = 640;

export function AnnotatedModuleDiagram({ breakout, children, artworkHeight = 185 }: { breakout: Breakout; children: ReactNode; artworkHeight?: number }) {
  const left = breakout.pins.filter((pin) => pin.side !== 'right');
  const right = breakout.pins.filter((pin) => pin.side === 'right');
  const height = Math.max(artworkHeight + 24, Math.max(left.length, right.length) * 32 + 24);
  const artY = (height - artworkHeight) / 2;
  return (
    <svg width={WIDTH} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={breakout.name} fontFamily="ui-monospace, Menlo, monospace">
      <title>{breakout.name}</title>
      <g transform={`translate(${ART_X}, ${artY})`}>{children}</g>
      {breakout.pins.map((pin, index) => {
        const isLeft = pin.side !== 'right';
        const group = isLeft ? left : right;
        const row = group.indexOf(pin);
        const y = (height - group.length * 32) / 2 + row * 32 + 16;
        const x = isLeft ? 10 : 480;
        const startX = isLeft ? x + 150 : x;
        const contact = contactPoint(breakout, index);
        const cx = ART_X + contact.x;
        const cy = artY + contact.y;
        const color = roleVar(pin.role);
        return (
          <g key={pin.name} data-pin-reference={pin.name}>
            <path d={`M${startX} ${y} H${isLeft ? 172 : 468} L${cx} ${cy}`} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity=".75" />
            <circle cx={cx} cy={cy} r="4" fill="#0f172a" stroke={color} strokeWidth="2" />
            <rect x={x} y={y - 12} width="150" height="24" rx="5" fill="var(--bk-surface)" stroke={color} strokeOpacity=".65" />
            <text x={x + 75} y={y + 4} textAnchor="middle" fill={color} fontSize="13" fontWeight="700">{pin.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
