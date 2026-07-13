import { railLabel, sortByGpio, type Pin } from '@/config/pinouts/wiring';
import { useWiringGuide } from '../WiringGuideContext';
import styles from '../wiring-guide.module.css';

const W = 760;
const MCU_X = 320;
const MCU_W = 120;
const MCU_R = MCU_X + MCU_W;
const ROW_H = 30;
const PAD_TOP = 14;
const PILL_W = 252;
const BADGE_W = 36;

const roleVar = (kind: Pin['kind']) => `var(--pw-role-${kind})`;

function PinRow({ pin, index, side }: { pin: Pin; index: number; side: 'left' | 'right' }) {
  const y = PAD_TOP + index * ROW_H + ROW_H / 2;
  const color = roleVar(pin.kind);
  const rail = railLabel(pin.rail);
  const left = side === 'left';

  // el badge del GPIO se monta sobre el borde del chip: se lee pegado al pin real
  const badgeX = left ? MCU_X - 12 : MCU_R - BADGE_W + 16;
  const pillX = left ? 6 : W - PILL_W - 6;

  return (
    <g>
      <line
        x1={left ? PILL_W + 10 : MCU_R}
        y1={y}
        x2={left ? MCU_X : W - PILL_W - 10}
        y2={y}
        stroke={color}
        strokeWidth={2}
      />
      <rect
        x={pillX}
        y={y - 11}
        width={PILL_W}
        height={22}
        rx={5}
        fill="var(--pw-schem-panel)"
        stroke={color}
        strokeOpacity={0.5}
      />
      <text
        x={left ? pillX + 8 : W - 14}
        y={y + 4}
        fill="var(--pw-schem-ink)"
        fontSize={11}
        textAnchor={left ? 'start' : 'end'}
      >
        {pin.name}
      </text>
      <text
        x={left ? PILL_W : pillX + 6}
        y={y + 4}
        fill="var(--pw-schem-dim)"
        fontSize={10}
        textAnchor={left ? 'end' : 'start'}
      >
        {rail}
      </text>
      <rect
        x={badgeX}
        y={y - 11}
        width={BADGE_W}
        height={22}
        rx={6}
        fill="var(--pw-schem-bg)"
        stroke={color}
      />
      <text
        x={badgeX + BADGE_W / 2}
        y={y + 4}
        fill={color}
        fontSize={12}
        fontWeight={800}
        textAnchor="middle"
      >
        {pin.gpio}
      </text>
    </g>
  );
}

export function BoardPinMapSvg() {
  const guide = useWiringGuide();
  const sorted = sortByGpio(guide.pins);
  const half = Math.ceil(sorted.length / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half);

  const rows = Math.max(left.length, right.length);
  const height = PAD_TOP + rows * ROW_H + 14;
  const bodyH = rows * ROW_H + 8;
  const midY = PAD_TOP + (rows * ROW_H) / 2;

  return (
    <div className={styles.svgScroll}>
      <svg
        width={W}
        viewBox={`0 0 ${W} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Mapa de pines del ${guide.meta.mcu}: ${sorted.length} GPIO usados, cada uno con su número, función y riel de alimentación.`}
        fontFamily="ui-monospace, Menlo, monospace"
      >
        <rect
          x={MCU_X}
          y={PAD_TOP - 4}
          width={MCU_W}
          height={bodyH}
          rx={10}
          fill="var(--pw-schem-panel)"
          stroke="var(--pw-wire)"
        />
        <text
          x={MCU_X + MCU_W / 2}
          y={midY}
          fill="var(--pw-schem-dim)"
          fontSize={12}
          fontWeight={700}
          textAnchor="middle"
          transform={`rotate(-90 ${MCU_X + MCU_W / 2} ${midY})`}
        >
          {guide.meta.mcu}
        </text>

        {left.map((pin, index) => (
          <PinRow key={pin.gpio} pin={pin} index={index} side="left" />
        ))}
        {right.map((pin, index) => (
          <PinRow key={pin.gpio} pin={pin} index={index} side="right" />
        ))}
      </svg>
    </div>
  );
}
