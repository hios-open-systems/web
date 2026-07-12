import { SCHEM } from './schematic';

export function WiringKeyCell() {
  return (
    <svg
      width={500}
      viewBox="0 0 500 175"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Esquema de una tecla de acción: una pata del pulsador va a su columna (INPUT_PULLUP) y la otra pasa por un diodo 1N4148, con el cátodo hacia la fila (OUTPUT)."
      fontFamily="ui-monospace, Menlo, monospace"
      fontSize={12}
    >
      <rect x={205} y={58} width={90} height={60} rx={9} fill="var(--pw-schem-panel)" stroke="var(--pw-wire)" />
      <text x={250} y={93} fill="var(--pw-schem-ink)" fontWeight={700} textAnchor="middle">
        PULSADOR
      </text>
      <line x1={205} y1={88} x2={55} y2={88} stroke={SCHEM.col} strokeWidth={2.5} />
      <circle cx={205} cy={88} r={3.5} fill={SCHEM.col} />
      <text x={52} y={78} fill={SCHEM.col} fontWeight={700}>
        ◄ a su COLUMNA
      </text>
      <text x={52} y={110} fill="var(--pw-schem-dim)" fontSize={11}>
        COLx → GPIO (INPUT_PULLUP)
      </text>
      <line x1={295} y1={88} x2={330} y2={88} stroke="var(--pw-wire)" strokeWidth={2.5} />
      <polygon points="330,79 330,97 348,88" fill="var(--pw-schem-ink)" />
      <line x1={348} y1={77} x2={348} y2={99} stroke="var(--pw-schem-ink)" strokeWidth={3} />
      <line x1={348} y1={88} x2={452} y2={88} stroke={SCHEM.row} strokeWidth={2.5} />
      <circle cx={452} cy={88} r={3.5} fill={SCHEM.row} />
      <text x={452} y={78} fill={SCHEM.row} fontWeight={700} textAnchor="end">
        a su FILA ►
      </text>
      <text x={452} y={110} fill="var(--pw-schem-dim)" fontSize={11} textAnchor="end">
        FILAy → GPIO (OUTPUT)
      </text>
      <text x={339} y={128} fill={SCHEM.row} fontSize={11} textAnchor="middle">
        ▲ diodo 1N4148 — raya/cátodo hacia la FILA
      </text>
    </svg>
  );
}
