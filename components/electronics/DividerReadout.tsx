'use client';

import { useTranslations } from 'next-intl';
import type { dividerRange } from '@/lib/electronics/divider';

export function DividerReadout({ voltage }: { voltage: ReturnType<typeof dividerRange> }) {
  const t = useTranslations('Electronics');
  return <div data-divider-readout aria-live="polite">
    {voltage ? <>
      <p>{t('voltage')}: <strong>{voltage.nominal.toFixed(3)} V</strong></p>
      <p>{t('range')}: <strong>{voltage.min.toFixed(3)}–{voltage.max.toFixed(3)} V</strong></p>
    </> : <p role="status">{t('invalid')}</p>}
    <p>{t('unloaded')}</p>
  </div>;
}
