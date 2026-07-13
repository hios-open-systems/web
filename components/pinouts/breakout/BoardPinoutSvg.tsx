import { FUNC_LABEL, funcVar } from '@/config/pinouts/modules';
import type { BoardLabel, BoardPin, BoardPinout, PinFunc } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

const ROW_H = 28;
const BOARD_W = 132;
const HEAD_H = 62;
const NUM_W = 24;
const GAP = 6;
const CHAR_W = 6.6;
const PAD_X = 14;

const labelWidth = (label: BoardLabel) => Math.max(34, label.text.length * CHAR_W + 14);

/** ancho que ocupan todos los labels de un pin, incluido el badge del número */
const sideWidth = (pins: BoardPin[]) =>
  pins.reduce((max, pin) => {
    const w = pin.labels.reduce((sum, label) => sum + labelWidth(label) + GAP, 0);
    return Math.max(max, w);
  }, 0) + NUM_W + GAP;

function PinRow({
  pin,
  index,
  side,
  boardX,
  boardR,
}: {
  pin: BoardPin;
  index: number;
  side: 'left' | 'right';
  boardX: number;
  boardR: number;
}) {
  const y = HEAD_H + index * ROW_H + ROW_H / 2;
  const left = side === 'left';

  // el número del pin va pegado a la placa; la serigrafía al lado; las funciones
  // alternativas hacia afuera. Así se lee igual que contando pines en la placa.
  const numX = left ? boardX - NUM_W - 2 : boardR + 2;
  let cursor = left ? numX - GAP : boardR + NUM_W + 2 + GAP;

  const cells = pin.labels.map((label) => {
    const w = labelWidth(label);
    const x = left ? cursor - w : cursor;
    cursor = left ? x - GAP : x + w + GAP;
    return { label, x, w };
  });

  const primary = pin.labels.find((label) => label.primary) ?? pin.labels[0];

  return (
    <g>
      {/* patita: del borde de la placa al badge del número */}
      <line
        x1={left ? boardX : boardR}
        y1={y}
        x2={left ? boardX - 2 : boardR + 2}
        y2={y}
        stroke={funcVar(primary.func)}
        strokeWidth={2}
      />
      <rect
        x={numX}
        y={y - 9}
        width={NUM_W}
        height={18}
        rx={4}
        fill="var(--bk-surface)"
        stroke="var(--bk-border)"
      />
      <text
        x={numX + NUM_W / 2}
        y={y + 4}
        fill="var(--bk-muted)"
        fontSize={10}
        fontWeight={700}
        textAnchor="middle"
      >
        {pin.pos}
      </text>

      {cells.map(({ label, x, w }) => (
        <g key={`${label.text}-${x}`}>
          <rect
            x={x}
            y={y - 10}
            width={w}
            height={20}
            rx={5}
            fill={label.primary ? funcVar(label.func) : 'transparent'}
            fillOpacity={label.primary ? 0.16 : 1}
            stroke={funcVar(label.func)}
            strokeOpacity={label.primary ? 1 : 0.55}
          />
          <text
            x={x + w / 2}
            y={y + 4}
            fill={funcVar(label.func)}
            fontSize={label.primary ? 11 : 9.5}
            fontWeight={label.primary ? 800 : 600}
            textAnchor="middle"
          >
            {label.text}
          </text>
        </g>
      ))}
    </g>
  );
}

export function BoardPinoutSvg({ board, name }: { board: BoardPinout; name: string }) {
  const rows = Math.max(board.left.length, board.right.length);
  const leftW = sideWidth(board.left);
  const rightW = sideWidth(board.right);

  const boardX = PAD_X + leftW;
  const boardR = boardX + BOARD_W;
  const width = boardR + rightW + PAD_X;
  const height = HEAD_H + rows * ROW_H + 24;

  const seen = new Set<string>();
  const funcs: PinFunc[] = [];
  [...board.left, ...board.right].forEach((pin) =>
    pin.labels.forEach((label) => {
      if (seen.has(label.func)) return;
      seen.add(label.func);
      funcs.push(label.func);
    }),
  );

  return (
    <>
      <div className={styles.chipScroll}>
        <svg
          width={width}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Pinout físico del ${name}: ${board.left.length + board.right.length} pines en orden, con la etiqueta de la serigrafía y sus funciones.`}
          fontFamily="ui-monospace, Menlo, monospace"
        >
          {/* la placa: el USB va arriba, así el pin 1 queda arriba a la izquierda */}
          <rect
            x={boardX}
            y={16}
            width={BOARD_W}
            height={height - 32}
            rx={10}
            fill="var(--bk-surface-muted)"
            stroke="var(--bk-border)"
          />
          <rect
            x={boardX + BOARD_W / 2 - 26}
            y={4}
            width={52}
            height={20}
            rx={4}
            fill="var(--bk-surface)"
            stroke="var(--bk-border)"
          />
          <text
            x={boardX + BOARD_W / 2}
            y={18}
            fill="var(--bk-muted)"
            fontSize={9}
            fontWeight={700}
            textAnchor="middle"
          >
            USB
          </text>
          <text
            x={boardX + BOARD_W / 2}
            y={46}
            fill="var(--bk-title)"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            {name}
          </text>

          {board.left.map((pin, index) => (
            <PinRow key={`L${pin.pos}`} pin={pin} index={index} side="left" boardX={boardX} boardR={boardR} />
          ))}
          {board.right.map((pin, index) => (
            <PinRow key={`R${pin.pos}`} pin={pin} index={index} side="right" boardX={boardX} boardR={boardR} />
          ))}
        </svg>
      </div>

      <div className={styles.funcLegend}>
        {funcs.map((func) => (
          <span
            key={func}
            className={styles.funcChip}
            style={{ color: funcVar(func), borderColor: funcVar(func) }}
          >
            <span className={styles.funcDot} style={{ background: funcVar(func) }} />
            {FUNC_LABEL[func]}
          </span>
        ))}
      </div>
    </>
  );
}
