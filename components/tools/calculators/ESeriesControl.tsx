import { Segmented, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { CalculatorState } from './useCalculatorState';

/**
 * Control de serie E (E12/E24) que vive DENTRO de las calcs que lo usan (LED,
 * Filtro RC, Divisor ADC) — antes estaba global en la toolbar, donde no tenía
 * sentido para las 8 calcs que lo ignoran. Trae un tooltip que explica qué es.
 */
export function ESeriesControl({ c }: { c: CalculatorState }) {
  const { t } = c;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: c.palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.35 }}>
        {t('eseries_label')}
      </span>
      <Segmented
        size="small"
        value={c.eSeries}
        onChange={(v) => c.setESeries(v as typeof c.eSeries)}
        options={['E12', 'E24']}
      />
      <Tooltip title={t('eseries_help')}>
        <QuestionCircleOutlined style={{ color: c.palette.textSecondary, cursor: 'help' }} />
      </Tooltip>
    </div>
  );
}
