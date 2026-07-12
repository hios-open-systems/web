import { Fragment } from 'react';
import type { KeyMap } from '@/config/pinouts/wiring';
import { SCHEM } from './schematic';

const X0 = 118;
const DX = 150;
const Y_TOP = 46;
const SW_Y = [120, 260];
const BUS_Y = [184, 324];
const colX = (index: number) => X0 + index * DX;
const HEIGHT = 360;

export function WiringMatrix({ keymap }: { keymap: KeyMap }) {
  const { cols, rows } = keymap;
  const width = X0 + (cols.length - 1) * DX + 96;

  return (
    <svg
      width={width}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Esquema de la matriz de botones 2×5: dos buses de fila (naranja) y cinco de columna (azul); cada tecla es un pulsador con un diodo hacia su fila."
      fontFamily="ui-monospace, Menlo, monospace"
      fontSize={11}
    >
      {rows.map((row, j) => (
        <Fragment key={`bus-${row.r}`}>
          <line x1={66} y1={BUS_Y[j]} x2={width - 16} y2={BUS_Y[j]} stroke={SCHEM.row} strokeWidth={2.5} />
          <text x={60} y={BUS_Y[j] - 5} fill={SCHEM.row} fontWeight={800} textAnchor="end">
            FILA {row.r}
          </text>
          <text x={60} y={BUS_Y[j] + 10} fill="var(--pw-schem-dim)" textAnchor="end">
            GPIO {row.gpio}
          </text>
        </Fragment>
      ))}
      {cols.map((col, i) => {
        const x = colX(i);
        return (
          <Fragment key={`col-${col.c}`}>
            <text x={x} y={Y_TOP - 17} fill={SCHEM.col} fontWeight={800} textAnchor="middle">
              COL {col.c}
            </text>
            <text x={x} y={Y_TOP - 4} fill="var(--pw-schem-dim)" textAnchor="middle">
              GPIO {col.gpio}
            </text>
            <path
              d={`M ${x} ${Y_TOP} L ${x} ${BUS_Y[0] - 6} A 6 6 0 0 1 ${x} ${BUS_Y[0] + 6} L ${x} ${SW_Y[1]}`}
              fill="none"
              stroke={SCHEM.col}
              strokeWidth={2.5}
            />
          </Fragment>
        );
      })}
      {rows.map((row, j) =>
        cols.map((col, i) => {
          const x = colX(i);
          const y = SW_Y[j];
          const xd = x + 30;
          const yb = BUS_Y[j];
          return (
            <Fragment key={`cell-${row.r}-${col.c}`}>
              <text x={x - 6} y={y - 11} fill={SCHEM.row} fontWeight={800} fontSize={12}>
                {row.keys[i]}
              </text>
              <circle cx={x} cy={y} r={3.5} fill={SCHEM.col} />
              <line x1={x} y1={y} x2={x + 9} y2={y} stroke="var(--pw-wire)" strokeWidth={2.5} />
              <line x1={x + 9} y1={y} x2={xd} y2={y - 11} stroke="var(--pw-wire)" strokeWidth={2.5} />
              <circle cx={xd} cy={y} r={3} fill="none" stroke="var(--pw-wire)" />
              <line x1={xd} y1={y} x2={xd} y2={y + 13} stroke="var(--pw-wire)" strokeWidth={2.5} />
              <polygon points={`${xd - 7},${y + 13} ${xd + 7},${y + 13} ${xd},${y + 27}`} fill="var(--pw-schem-ink)" />
              <line x1={xd - 7} y1={y + 27} x2={xd + 7} y2={y + 27} stroke="var(--pw-schem-ink)" strokeWidth={3} />
              <line x1={xd} y1={y + 27} x2={xd} y2={yb} stroke={SCHEM.row} strokeWidth={2.5} />
              <circle cx={xd} cy={yb} r={3.5} fill={SCHEM.row} />
            </Fragment>
          );
        }),
      )}
    </svg>
  );
}
