import type { BoardPinout } from '@/config/pinouts/modules';
import { useId } from 'react';
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
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`translate(${x}, 0)`}>
      <defs>
        <linearGradient id={`${id}-pcb`} x2="1" y2="1"><stop stopColor="#194c3e" /><stop offset=".5" stopColor="#12372f" /><stop offset="1" stopColor="#092b25" /></linearGradient>
        <linearGradient id={`${id}-metal`}><stop stopColor="#8c9ba9" /><stop offset=".3" stopColor="#dce4e9" /><stop offset=".6" stopColor="#adbbc6" /><stop offset="1" stopColor="#7e909f" /></linearGradient>
      </defs>
      <rect y="8" width={BOARD_W} height={bottom - 8} rx="12" fill={`url(#${id}-pcb)`} stroke="#71a58a" />
      <rect x="4" y="12" width={BOARD_W - 8} height={bottom - 16} rx="9" fill="none" stroke="#a7c6b5" strokeOpacity=".16" />
      <rect x="9" y="31" width="12" height={bottom - 112} rx="5" fill="#0f172a" fillOpacity=".4" />
      <rect x={BOARD_W - 21} y="31" width="12" height={bottom - 112} rx="5" fill="#0f172a" fillOpacity=".4" />
      <rect x="49" y="25" width="142" height="216" rx="4" fill="#101c24" />
      <rect x="52" y="27" width="136" height="211" rx="3" fill={`url(#${id}-metal)`} stroke="#e2e8f0" />
      <rect x="52" y="27" width="136" height="45" fill="#1e293b" />
      <path d="M67 62V39h16v20h16V39h16v20h16V39h16v20h16V39h10" fill="none" stroke="#d4b777" strokeWidth="3" />
      {(board.chipLabel ?? []).map((line, index) => <text key={line} x="120" y={150 + index * 18} fill="#0f172a" fontSize="12" fontWeight="700" textAnchor="middle">{line}</text>)}
      <path d="M62 221H178M62 225H178" stroke="#64748b" strokeOpacity=".4" />
      <text x="29" y="30" fill="#b1ccbe" fontSize="8">{board.headers.left}</text>
      <text x={BOARD_W - 29} y="30" textAnchor="end" fill="#b1ccbe" fontSize="8">{board.headers.right}</text>
      <rect x="98" y={bottom - 146} width="44" height="42" rx="3" fill="#0f172a" stroke="#64748b" />
      {board.rgb ? <g>
        <rect x="113" y="283" width="14" height="14" rx="2" fill="#e879f9" stroke="#cbd5e1" />
        <text x="120" y="314" fill="#cbd5e1" fontSize="9" textAnchor="middle">RGB · IO38 / IO48</text>
      </g> : null}
      <BoardControls bottom={bottom} ports={board.usbPorts ?? [{ label: 'USB' }]} />
    </g>
  );
}
