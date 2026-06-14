'use client';

import { Button, Segmented, Space, Tabs } from 'antd';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './embeddedCalculators.module.css';
import { PresetId, TabKey, useCalculatorState } from './calculators/useCalculatorState';
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

export function EmbeddedCalculators() {
  const c = useCalculatorState();
  const { t } = c;

  const tabLabel = (key: string) => <span style={{ whiteSpace: 'nowrap' }}>{t(`cards.${key}.title`)}</span>;

  const items = [
    { key: 'led', label: tabLabel('led'), children: <LedTab c={c} /> },
    { key: 'cap', label: tabLabel('cap'), children: <CapTab c={c} /> },
    { key: 'thermal', label: tabLabel('thermal'), children: <ThermalTab c={c} /> },
    { key: 'runtime', label: tabLabel('runtime'), children: <RuntimeTab c={c} /> },
    { key: 'resistorLab', label: tabLabel('resistorLab'), children: <ResistorLabTab c={c} /> },
    { key: 'adc', label: tabLabel('adc'), children: <AdcTab c={c} /> },
    { key: 'rc', label: tabLabel('rc'), children: <RcTab c={c} /> },
    { key: 'rl', label: tabLabel('rl'), children: <RlTab c={c} /> },
    { key: 'rcl', label: tabLabel('rcl'), children: <RclTab c={c} /> },
    { key: 'gain', label: tabLabel('gain'), children: <GainTab c={c} /> },
    { key: 'i2s', label: tabLabel('i2s'), children: <I2sTab c={c} /> },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%', background: c.palette.page, padding: '4px 2px' }}>
      {c.contextHolder}
      <ToolHeader
        eyebrow={t('tags.embedded')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Space wrap className={styles.toolbar}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: c.palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.35 }}>
            {t('eseries_label')}
          </span>
          <Segmented
            size="small"
            value={c.eSeries}
            onChange={(v) => c.setESeries(v as typeof c.eSeries)}
            options={['E12', 'E24']}
          />
        </span>
        <UrlPresets
          storageKey="calculators"
          basePresets={BASE_PRESET_IDS.map((id) => ({ id, name: t(PRESET_I18N[id]) }))}
          onSelectBase={(id) => c.applyPreset(id as PresetId)}
        />
        <Button onClick={c.copySummary} style={{ borderRadius: 10 }}>{t('copy_summary')}</Button>
        <Button onClick={c.copyShareLink} style={{ borderRadius: 10 }}>{t('copy_link')}</Button>
      </Space>

      <div className={styles.tabsShell}>
        <Tabs
          tabPosition="left"
          activeKey={c.activeTab}
          onChange={(key) => c.setActiveTab(key as TabKey)}
          className={styles.calcTabs}
          style={{ width: '100%' }}
          items={items}
        />
      </div>
    </Space>
  );
}
