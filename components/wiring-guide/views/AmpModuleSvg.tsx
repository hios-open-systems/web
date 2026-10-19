import { useTranslations } from 'next-intl';
import { Fragment } from 'react';
import type { I2sGpio } from './schematic';
import { SCHEM } from './schematic';


function LeftPin({ y, name, dest, color }: { y: number; name: string; dest: string; color: string }) {
  return (
    <Fragment>
      <text x={216} y={y + 4} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        {name}
      </text>
      <circle cx={210} cy={y} r={3} fill="var(--pw-wire)" />
      <line x1={210} y1={y} x2={188} y2={y} stroke="var(--pw-wire)" strokeWidth={2} />
      <text x={184} y={y + 4} fill={color} fontSize={11} textAnchor="end">
        {dest}
      </text>
    </Fragment>
  );
}

export function AmpModuleSvg({ i2s }: { i2s: I2sGpio }) {
  const t = useTranslations('Electronics.max');
  return (
    <svg
      width={560}
      viewBox="0 0 560 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={t('moduleAria')}
      fontFamily="ui-monospace, Menlo, monospace"
      fontSize={12}
    >
      <text x={280} y={28} fill={SCHEM.teal} fontSize={13} fontWeight={800} textAnchor="middle">
        {t('moduleTitle')}
      </text>
      <rect x={210} y={56} width={140} height={196} rx={10} fill="var(--pw-schem-panel)" stroke="var(--pw-wire)" />
      <LeftPin y={84} name="LRC" dest={`GPIO${i2s.lrc} (LRC/WS)`} color={SCHEM.teal} />
      <LeftPin y={110} name="BCLK" dest={`GPIO${i2s.bclk}`} color={SCHEM.teal} />
      <LeftPin y={136} name="DIN" dest={`GPIO${i2s.din}`} color={SCHEM.teal} />
      <text x={216} y={166} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        GAIN
      </text>
      <line x1={210} y1={162} x2={196} y2={162} stroke="var(--pw-wire)" strokeWidth={2} />
      <text x={192} y={166} fill="var(--pw-schem-dim)" fontSize={11} textAnchor="end">
        {t('floating')}
      </text>
      <text x={216} y={192} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        SD
      </text>
      <line x1={210} y1={188} x2={150} y2={188} stroke="var(--pw-wire)" strokeWidth={2} />
      <rect x={108} y={181} width={42} height={14} rx={2} fill="var(--pw-schem-bg)" stroke="var(--pw-res)" strokeWidth={2} />
      <line x1={108} y1={188} x2={88} y2={188} stroke="var(--pw-res)" strokeWidth={2} />
      <line x1={88} y1={188} x2={88} y2={240} stroke="var(--pw-res)" strokeWidth={2} />
      <text x={82} y={212} fill="var(--pw-res)" fontSize={10} textAnchor="end">
        {t('channelResistor')}
      </text>
      <text x={216} y={218} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        GND
      </text>
      <circle cx={210} cy={214} r={3} fill="var(--pw-wire)" />
      <line x1={210} y1={214} x2={188} y2={214} stroke="var(--pw-wire)" strokeWidth={2} />
      <text x={184} y={218} fill="var(--pw-schem-dim)" fontSize={11} textAnchor="end">
        {t('commonGround')}
      </text>
      <text x={216} y={244} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700}>
        Vin
      </text>
      <line x1={210} y1={240} x2={88} y2={240} stroke={SCHEM.pwr5} strokeWidth={2} />
      <line x1={88} y1={240} x2={52} y2={240} stroke={SCHEM.pwr5} strokeWidth={2} />
      <text x={48} y={244} fill={SCHEM.pwr5} fontSize={11} fontWeight={700} textAnchor="end">
        5V
      </text>
      <text x={344} y={114} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700} textAnchor="end">
        SPK+
      </text>
      <line x1={350} y1={110} x2={400} y2={110} stroke="var(--pw-wire)" strokeWidth={2} />
      <text x={344} y={204} fill="var(--pw-schem-ink)" fontSize={11} fontWeight={700} textAnchor="end">
        SPK−
      </text>
      <line x1={350} y1={200} x2={400} y2={200} stroke="var(--pw-wire)" strokeWidth={2} />
      <line x1={400} y1={110} x2={400} y2={141} stroke="var(--pw-wire)" strokeWidth={2} />
      <line x1={400} y1={200} x2={400} y2={169} stroke="var(--pw-wire)" strokeWidth={2} />
      <rect x={400} y={141} width={18} height={28} fill="var(--pw-schem-panel)" stroke="var(--pw-wire)" />
      <polygon points="418,145 448,127 448,183 418,165" fill="var(--pw-schem-panel)" stroke="var(--pw-wire)" />
      <text x={432} y={200} fill="var(--pw-schem-dim)" fontSize={10} textAnchor="middle">
        {t('speaker')}
      </text>
      <text x={60} y={284} fill="var(--pw-res)" fontSize={11} fontWeight={700}>
        {t('measure')}
      </text>
      <text x={60} y={305} fill="var(--pw-schem-dim)" fontSize={11}>
        {t('measureHint')}
      </text>
    </svg>
  );
}
