import { funcVar } from '@/config/pinouts/modules';
import type { BoardPin } from '@/config/pinouts/modules';
import { labelWidth, PIN_TOP, PITCH, primaryOf } from './boardGeometry';
import type { AssignMap } from './boardGeometry';

function Label({ text, x, y, color }: { text: string; x: number; y: number; color: string }) {
  const width = labelWidth(text);
  return (
    <g>
      <rect x={x} y={y - 11} width={width} height="22" rx="5" fill={color} fillOpacity=".14" stroke={color} strokeOpacity=".7" />
      <text x={x + width / 2} y={y + 4} fill={color} fontSize="11" fontWeight="700" textAnchor="middle">{text}</text>
    </g>
  );
}

interface Props {
  pin: BoardPin;
  index: number;
  side: 'left' | 'right';
  edge: number;
  number: number;
  assign?: AssignMap;
}

export function BoardPinSvg({ pin, index, side, edge, number, assign }: Props) {
  const y = PIN_TOP + index * PITCH;
  const left = side === 'left';
  const primary = primaryOf(pin);
  const used = assign?.get(primary.text);
  const color = used ? `var(--pw-role-${used.kind})` : funcVar(primary.func);
  const textX = left ? edge - labelWidth(primary.text) - 14 : edge + 14;
  const usedX = left ? textX - labelWidth(used?.name ?? '') - 6 : textX + labelWidth(primary.text) + 6;
  return (
    <g opacity={assign && !used ? .28 : 1}>
      <title>{`${number}: ${pin.labels.map((label) => label.text).join(', ')}`}</title>
      <circle cx={edge} cy={y} r="6" fill="#0f172a" stroke={color} strokeWidth="2" />
      <rect x={edge - 2} y={y - 2} width="4" height="4" fill="#d4b777" />
      <text data-pin-number={number} x={left ? edge + 12 : edge - 12} y={y + 4} fill="#cbd5e1" fontSize="11" textAnchor={left ? 'start' : 'end'}>{number}</text>
      <Label text={primary.text} x={textX} y={y} color={color} />
      {used ? <Label text={used.name} x={usedX} y={y} color={color} /> : null}
    </g>
  );
}
