import { Fragment } from 'react';
import type { I2sGpio } from './schematic';
import { SCHEM } from './schematic';

function AmpBox({
  x,
  y,
  title,
  badge,
  line3,
}: {
  x: number;
  y: number;
  title: string;
  badge: string;
  line3: string;
}) {
  const inner = x + 14;
  return (
    <Fragment>
      <rect x={x} y={y} width={298} height={92} rx={9} fill="var(--pw-schem-panel)" stroke={SCHEM.teal} />
      <text x={inner} y={y + 24} fill={SCHEM.teal} fontSize={12} fontWeight={800}>
        {title}
      </text>
      <rect x={x + 206} y={y + 10} width={80} height={19} rx={9} fill="none" stroke={SCHEM.teal} />
      <text x={x + 246} y={y + 24} fill={SCHEM.teal} fontSize={10} fontWeight={700} textAnchor="middle">
        {badge}
      </text>
      <text x={inner} y={y + 46} fill="var(--pw-schem-dim)" fontSize={10.5}>
        BCLK·LRC·DIN ← bus · Vin→5V · GND→GND
      </text>
      <text x={inner} y={y + 64} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        {line3}
      </text>
      <text x={inner} y={y + 82} fill="var(--pw-schem-dim)" fontSize={10.5}>
        SPK+/− → parlante 4–8Ω (directo)
      </text>
    </Fragment>
  );
}

export function AmpStereoSvg({ i2s }: { i2s: I2sGpio }) {
  const busLabel = `bus I2S · GPIO ${i2s.bclk}/${i2s.lrc}/${i2s.din}`;
  return (
    <svg
      width={670}
      viewBox="0 0 670 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Dos módulos MAX98357A sobre el mismo bus I2S: mismas tres líneas BCLK/LRC/DIN a ambos; uno queda como canal Left (SD a Vin) y otro como Right (SD por 220–330k a Vin)."
      fontFamily="ui-monospace, Menlo, monospace"
      fontSize={11}
    >
      <rect x={12} y={112} width={92} height={90} rx={9} fill="var(--pw-schem-panel)" stroke="var(--pw-wire)" />
      <text x={58} y={142} fill="var(--pw-schem-dim)" fontSize={11} fontWeight={700} textAnchor="middle">
        ESP32
      </text>
      <text x={58} y={157} fill="var(--pw-schem-dim)" fontSize={11} fontWeight={700} textAnchor="middle">
        MCU
      </text>
      <text x={58} y={182} fill={SCHEM.teal} fontSize={11} textAnchor="middle">
        {i2s.bclk}/{i2s.lrc}/{i2s.din}
      </text>
      <text x={200} y={136} fill={SCHEM.teal} fontSize={10.5} fontWeight={700} textAnchor="middle">
        {busLabel}
      </text>
      <text x={200} y={150} fill="var(--pw-schem-dim)" fontSize={10} textAnchor="middle">
        (mismas 3 líneas a ambos)
      </text>
      <line x1={104} y1={160} x2={300} y2={160} stroke={SCHEM.teal} strokeWidth={3} />
      <line x1={300} y1={160} x2={300} y2={92} stroke={SCHEM.teal} strokeWidth={3} />
      <line x1={300} y1={160} x2={300} y2={226} stroke={SCHEM.teal} strokeWidth={3} />
      <line x1={300} y1={92} x2={360} y2={92} stroke={SCHEM.teal} strokeWidth={3} />
      <line x1={300} y1={226} x2={360} y2={226} stroke={SCHEM.teal} strokeWidth={3} />
      <AmpBox x={360} y={46} title="AMPLI L" badge="LEFT" line3="SD → Vin (medí >1,4V)" />
      <AmpBox x={360} y={180} title="AMPLI R" badge="RIGHT" line3="SD → [220–330k]→Vin (medí 0,77–1,4V)" />
    </svg>
  );
}
