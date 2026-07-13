import { ROLE_LABEL, roleVar } from '@/config/pinouts/modules';
import type { Breakout, BreakoutPin } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

const BODY_X = 90;
const ROW_H = 30;
const HEAD_H = 44;
const BADGE_W = 52;
const BADGE_H = 20;
const CHAR_W = 6.7; // ui-monospace a 11px
const GUTTER = 90; // badge + patita + margen

function ChipPin({
  pin,
  index,
  side,
  bodyR,
}: {
  pin: BreakoutPin;
  index: number;
  side: 'left' | 'right';
  bodyR: number;
}) {
  const y = HEAD_H + index * ROW_H + ROW_H / 2;
  const color = roleVar(pin.role);
  const left = side === 'left';

  const padX = left ? BODY_X : bodyR;
  const legEnd = left ? BODY_X - 26 : bodyR + 26;
  const badgeX = left ? legEnd - BADGE_W : legEnd;

  return (
    <g>
      <line x1={padX} y1={y} x2={legEnd} y2={y} stroke={color} strokeWidth={2} />
      <circle cx={padX} cy={y} r={3.5} fill={color} />
      <text
        x={left ? BODY_X + 12 : bodyR - 12}
        y={y + 4}
        fill="var(--bk-title)"
        fontSize={11}
        fontWeight={700}
        textAnchor={left ? 'start' : 'end'}
      >
        {pin.name}
      </text>
      <rect
        x={badgeX}
        y={y - BADGE_H / 2}
        width={BADGE_W}
        height={BADGE_H}
        rx={5}
        fill="transparent"
        stroke={color}
      />
      <text
        x={badgeX + BADGE_W / 2}
        y={y + 4}
        fill={color}
        fontSize={10}
        fontWeight={700}
        textAnchor="middle"
      >
        {ROLE_LABEL[pin.role]}
      </text>
    </g>
  );
}

const widestLabel = (pins: BreakoutPin[]) =>
  pins.reduce((max, pin) => Math.max(max, pin.name.length), 0) * CHAR_W;

export function BreakoutChipSvg({ breakout }: { breakout: Breakout }) {
  const left = breakout.pins.filter((pin) => pin.side !== 'right');
  const right = breakout.pins.filter((pin) => pin.side === 'right');

  const rows = Math.max(left.length, right.length);
  const bodyH = HEAD_H + rows * ROW_H + 12;
  const height = bodyH + 16;

  // el cuerpo se estira con el texto: los MCU tienen nombres de rango largos
  // ("IO0 / IO3 / IO45 / IO46") que si no se pisan con los del otro lado
  const bodyW = Math.max(
    170,
    breakout.name.length * CHAR_W + 28,
    widestLabel(left) + widestLabel(right) + 44,
  );
  const bodyR = BODY_X + bodyW;
  // módulos con header de un solo lado: recortamos el lienzo en vez de dejar aire
  const width = right.length > 0 ? bodyR + GUTTER : bodyR + 24;

  return (
    <div className={styles.chipScroll}>
      <svg
        width={width}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Diagrama del ${breakout.name}: ${breakout.pins.length} pines, cada uno con su nombre y función.`}
        fontFamily="ui-monospace, Menlo, monospace"
      >
        <rect
          x={BODY_X}
          y={8}
          width={bodyW}
          height={bodyH}
          rx={12}
          fill="var(--bk-surface-muted)"
          stroke="var(--bk-border)"
        />
        <text
          x={BODY_X + bodyW / 2}
          y={32}
          fill="var(--bk-muted)"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          {breakout.name}
        </text>
        <line
          x1={BODY_X + 14}
          y1={HEAD_H - 6}
          x2={bodyR - 14}
          y2={HEAD_H - 6}
          stroke="var(--bk-border)"
        />

        {left.map((pin, index) => (
          <ChipPin key={pin.name} pin={pin} index={index} side="left" bodyR={bodyR} />
        ))}
        {right.map((pin, index) => (
          <ChipPin key={pin.name} pin={pin} index={index} side="right" bodyR={bodyR} />
        ))}
      </svg>
    </div>
  );
}
