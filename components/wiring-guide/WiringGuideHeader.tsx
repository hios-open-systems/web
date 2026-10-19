'use client';
import { RichText } from './RichText';
import { PageIntro } from '@/components/ui/PageIntro';

import Link from 'next/link';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { useWiringGuide } from './WiringGuideContext';
import styles from './wiring-guide.module.css';

const ROLE_ORDER: { role: string; label: string }[] = [
  { role: 'io', label: 'GPIO' },
  { role: 'adc', label: 'ADC' },
  { role: 'pwm', label: 'PWM' },
  { role: 'i2s', label: 'I2S' },
  { role: 'i2c', label: 'I2C' },
  { role: 'spi', label: 'SPI' },
  { role: 'dac', label: 'DAC' },
  { role: 'neo', label: 'NeoPixel' },
  { role: 'mtx', label: 'Matriz' },
  { role: 'pwr5', label: '5V' },
  { role: 'pwr33', label: '3V3' },
  { role: 'gnd', label: 'GND' },
];

export function WiringGuideHeader() {
  const t = useTranslations('WiringGuide');
  const locale = useLocale();
  const { meta, pins, sections } = useWiringGuide();

  const roles = new Set<string>();
  pins.forEach((pin) => roles.add(pin.kind));
  sections.forEach((section) => section.rows?.forEach((row) => roles.add(row.kind)));
  const legend = ROLE_ORDER.filter((item) => roles.has(item.role));

  return (
    <header className={styles.header}>
      <Link href={`/${locale}/pinouts`} className={styles.backLink}>
        <ArrowLeftOutlined /> {t('backToPinouts')}
      </Link>
      <PageIntro
        eyebrow={t('eyebrow')}
        title={meta.title}
        description={meta.subtitle}
        area="maker"
        compact
        meta={<span className={styles.rev}>rev {meta.rev}</span>}
      />
      <p className={styles.source}>
        {meta.mcu} · <code className={styles.mono}>{meta.source}</code>
      </p>
      <p className={styles.hint} data-guide-note><RichText text={meta.note} /></p>
      <div className={styles.legend}>
        {legend.map((item) => (
          <span
            key={item.role}
            className={styles.legendChip}
            style={{ color: `var(--pw-role-${item.role})`, borderColor: `var(--pw-role-${item.role})` }}
          >
            <span className={styles.legendDot} style={{ background: `var(--pw-role-${item.role})` }} />
            {item.role === 'mtx' ? t('ui.matrix') : item.label}
          </span>
        ))}
      </div>
    </header>
  );
}
