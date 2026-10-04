import type { BoardPinout } from '@/config/pinouts/modules';
import { BOARD_W } from './boardGeometry';

function BoardControls({ bottom, ports }: { bottom: number; ports: { label: string }[] }) {
  const total = ports.length * 58 + (ports.length - 1) * 16;
  return (
    <g>
      {[{ x: 55, label: 'RESET' }, { x: BOARD_W - 75, label: 'BOOT' }].map(({ x, label }) => (
        <g key={label}>
          <rect x={x} y={bottom - 61} width="20" height="20" rx="3" fill="#94a3b8" stroke="#334155" />
          <circle cx={x + 10} cy={bottom - 51} r="6" fill="#0f172a" />
          <text x={x + 10} y={bottom - 66} fill="#cbd5e1" fontSize="8" textAnchor="middle">{label}</text>
        </g>
      ))}
      {ports.map((port, index) => {
        const x = (BOARD_W - total) / 2 + index * 74;
        return (
          <g key={port.label}>
            <rect x={x} y={bottom - 30} width="58" height="26" rx="5" fill="#94a3b8" stroke="#475569" />
            <rect x={x + 7} y={bottom - 21} width="44" height="9" rx="4" fill="#0f172a" />
            <text x={x + 29} y={bottom + 8} fill="var(--bk-muted)" fontSize="9" textAnchor="middle">{port.label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function BoardArtwork({ board, x, bottom }: { board: BoardPinout; x: number; bottom: number }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect y="8" width={BOARD_W} height={bottom - 8} rx="12" fill="var(--bk-pcb, #14532d)" stroke="#4ade80" strokeOpacity=".3" />
      <rect x="9" y="31" width="12" height={bottom - 112} rx="5" fill="#0f172a" fillOpacity=".4" />
      <rect x={BOARD_W - 21} y="31" width="12" height={bottom - 112} rx="5" fill="#0f172a" fillOpacity=".4" />
      <rect x="52" y="27" width="136" height="211" rx="3" fill="#94a3b8" stroke="#cbd5e1" />
      <rect x="52" y="27" width="136" height="45" fill="#1e293b" />
      <path d="M67 62V39h16v20h16V39h16v20h16V39h16v20h16V39h10" fill="none" stroke="#d4b777" strokeWidth="3" />
      {(board.chipLabel ?? []).map((line, index) => <text key={line} x="120" y={150 + index * 18} fill="#0f172a" fontSize="12" fontWeight="700" textAnchor="middle">{line}</text>)}
      <rect x="98" y={bottom - 146} width="44" height="42" rx="3" fill="#0f172a" stroke="#64748b" />
      {board.rgb ? <g>
        <rect x="113" y="283" width="14" height="14" rx="2" fill="#e879f9" stroke="#cbd5e1" />
        <text x="120" y="314" fill="#cbd5e1" fontSize="9" textAnchor="middle">RGB · IO38 / IO48</text>
      </g> : null}
      <BoardControls bottom={bottom} ports={board.usbPorts ?? [{ label: 'USB' }]} />
    </g>
  );
}
