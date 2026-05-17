'use client';

import Link from 'next/link';
import { Button, Space, Segmented, Tabs, Typography } from 'antd';
import { useLocale } from 'next-intl';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import styles from './embeddedCalculators.module.css';
import { PresetId, TabKey, useCalculatorState } from './calculators/useCalculatorState';
import { LedTab } from './calculators/LedTab';
import { CapTab } from './calculators/CapTab';
import { ThermalTab } from './calculators/ThermalTab';
import { RuntimeTab } from './calculators/RuntimeTab';
import { ResistorLabTab } from './calculators/ResistorLabTab';
import { AdcTab } from './calculators/AdcTab';
import { RcTab } from './calculators/RcTab';
import { GainTab } from './calculators/GainTab';
import { I2sTab } from './calculators/I2sTab';

const { Text } = Typography;

export function EmbeddedCalculators() {
  const c = useCalculatorState();
  const { t } = c;
  const locale = useLocale();

  const tabLabel = (key: string) => <span style={{ whiteSpace: 'nowrap' }}>{t(`cards.${key}.title`)}</span>;

  const items = [
    { key: 'led', label: tabLabel('led'), children: <LedTab c={c} /> },
    { key: 'cap', label: tabLabel('cap'), children: <CapTab c={c} /> },
    { key: 'thermal', label: tabLabel('thermal'), children: <ThermalTab c={c} /> },
    { key: 'runtime', label: tabLabel('runtime'), children: <RuntimeTab c={c} /> },
    { key: 'resistorLab', label: tabLabel('resistorLab'), children: <ResistorLabTab c={c} /> },
    { key: 'adc', label: tabLabel('adc'), children: <AdcTab c={c} /> },
    { key: 'rc', label: tabLabel('rc'), children: <RcTab c={c} /> },
    { key: 'gain', label: tabLabel('gain'), children: <GainTab c={c} /> },
    { key: 'i2s', label: tabLabel('i2s'), children: <I2sTab c={c} /> },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%', background: c.palette.page, padding: '4px 2px' }}>
      {c.contextHolder}
      <ToolHeader
        eyebrow={t('tags.embedded')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Link href={`/${locale}/calculators/rcl`}>
            <Button>{t('go_rcl')}</Button>
          </Link>
        }
      />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={6} style={{ minWidth: 320 }}>
          <Text style={{ fontSize: 12, color: c.palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.35 }}>
            {t('presets_label')}
          </Text>
          <Segmented
            size="small"
            value={c.preset}
            onChange={(value) => c.applyPreset(value as PresetId)}
            options={[
              { label: t('presets.custom'), value: 'custom' },
              { label: t('presets.esp32adc'), value: 'esp32-adc' },
              { label: t('presets.audio44'), value: 'audio-44k' },
              { label: t('presets.audio48'), value: 'audio-48k' },
              { label: t('presets.lowPower'), value: 'low-power' },
              { label: t('presets.rgbLed'), value: 'rgb-led' },
              { label: t('presets.buck3v3'), value: 'buck-3v3' },
            ]}
          />
        </Space>
        <Space>
          <Button onClick={c.copySummary} style={{ borderRadius: 10 }}>{t('copy_summary')}</Button>
          <Button onClick={c.copyShareLink} style={{ borderRadius: 10 }}>{t('copy_link')}</Button>
        </Space>
      </Space>

      <Tabs
        tabPosition="left"
        activeKey={c.activeTab}
        onChange={(key) => c.setActiveTab(key as TabKey)}
        className={styles.calcTabs}
        style={{ width: '100%' }}
        items={items}
      />
    </Space>
  );
}
