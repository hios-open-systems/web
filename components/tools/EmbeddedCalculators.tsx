'use client';

import type { ReactNode } from 'react';
import { Button, Space, Tabs, Tooltip } from 'antd';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { ToolGuide } from '@/components/workbench/ToolGuide';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './embeddedCalculators.module.css';
import { PresetId, useCalculatorState } from './calculators/useCalculatorState';
import { CALCULATORS_BY_CATEGORY, type CalcDef } from './calculators/registry';
import { GenericCalcTab } from './calculators/GenericCalcTab';
import { LedTab } from './calculators/LedTab';
import { CapTab } from './calculators/CapTab';
import { ThermalTab } from './calculators/ThermalTab';
import { RuntimeTab } from './calculators/RuntimeTab';
import { ResistorLabTab } from './calculators/ResistorLabTab';
import { AdcTab } from './calculators/AdcTab';
import { RcTab } from './calculators/RcTab';
import { RlTab } from './calculators/RlTab';
import { RclTab } from './calculators/RclTab';
import { GainTab } from './calculators/GainTab';
import { I2sTab } from './calculators/I2sTab';

const BASE_PRESET_IDS = ['esp32-adc', 'audio-44k', 'audio-48k', 'low-power', 'rgb-led', 'buck-3v3'] as const;
const PRESET_I18N: Record<(typeof BASE_PRESET_IDS)[number], string> = {
  'esp32-adc': 'presets.esp32adc',
  'audio-44k': 'presets.audio44',
  'audio-48k': 'presets.audio48',
  'low-power': 'presets.lowPower',
  'rgb-led': 'presets.rgbLed',
  'buck-3v3': 'presets.buck3v3',
};

const catHeaderStyle = { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, opacity: 0.55 };

export function EmbeddedCalculators() {
  const c = useCalculatorState();
  const { t } = c;

  const tabLabel = (key: string) => <span style={{ whiteSpace: 'nowrap' }}>{t(`cards.${key}.title`)}</span>;

  // El render de cada calc vive en su *Tab.tsx; el registry solo decide orden/categoría.
  const render: Record<string, ReactNode> = {
    resistorLab: <ResistorLabTab c={c} />,
    led: <LedTab c={c} />,
    cap: <CapTab c={c} />,
    thermal: <ThermalTab c={c} />,
    runtime: <RuntimeTab c={c} />,
    adc: <AdcTab c={c} />,
    rc: <RcTab c={c} />,
    rl: <RlTab c={c} />,
    rcl: <RclTab c={c} />,
    gain: <GainTab c={c} />,
    i2s: <I2sTab c={c} />,
  };

  // Las calcs con *Tab.tsx propio usan `render`; las declaradas en el registry
  // (obra/clima/cotidianas + Ohm) se renderizan genéricas desde su descriptor.
  const childFor = (def: CalcDef): ReactNode =>
    render[def.id] ?? (def.generic ? <GenericCalcTab c={c} def={def} /> : null);

  // Sidebar agrupado por categoría (los headers solo aparecen cuando hay >1 categoría).
  const showCatHeaders = CALCULATORS_BY_CATEGORY.length > 1;
  const items = CALCULATORS_BY_CATEGORY.flatMap((group) => {
    const calcItems = group.calcs
      .map((def) => ({ def, child: childFor(def) }))
      .filter((x) => x.child !== null)
      .map(({ def, child }) => ({ key: def.id, label: tabLabel(def.id), children: child }));
    if (!showCatHeaders) return calcItems;
    return [
      {
        key: `__cat_${group.category}`,
        label: <span style={catHeaderStyle}>{t(`categories.${group.category}`)}</span>,
        disabled: true,
        children: null,
      },
      ...calcItems,
    ];
  });

  return (
    <Space direction="vertical" size={24} style={{ width: '100%', background: c.palette.page, padding: '4px 2px' }}>
      {c.contextHolder}
      <ToolHeader
        eyebrow={t('tags.embedded')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <ToolGuide guideId="calculators" />

      <Space wrap className={styles.toolbar}>
        <UrlPresets
          storageKey="calculators"
          basePresets={BASE_PRESET_IDS.map((id) => ({ id, name: t(PRESET_I18N[id]) }))}
          onSelectBase={(id) => c.applyPreset(id as PresetId)}
        />
        <Tooltip title={t('copy_summary_help')}>
          <Button onClick={c.copySummary} style={{ borderRadius: 10 }}>{t('copy_summary')}</Button>
        </Tooltip>
        <Tooltip title={t('copy_link_help')}>
          <Button onClick={c.copyShareLink} style={{ borderRadius: 10 }}>{t('copy_link')}</Button>
        </Tooltip>
      </Space>

      <div className={styles.tabsShell}>
        <Tabs
          tabPosition="left"
          activeKey={c.activeTab}
          onChange={(key) => c.setActiveTab(key)}
          className={styles.calcTabs}
          style={{ width: '100%' }}
          items={items}
        />
      </div>
    </Space>
  );
}
