'use client';

import { useLocale, useTranslations } from 'next-intl';
import { calculateCircuit, DEFAULT_CIRCUIT, type CircuitMode } from '@/lib/electronics/dcCircuit';
import { CircuitDiagram } from './CircuitDiagram';

export function ConceptCircuit({ mode = 'single' }: { mode?: CircuitMode }) {
  const locale = useLocale();
  const t = useTranslations('RadioCourse');
  const basics = useTranslations('RadioBasics.connections');
  const settings = { ...DEFAULT_CIRCUIT, mode };
  const result = calculateCircuit(settings);
  const format = (value: number, digits = 2) => new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
  }).format(value);
  return (
    <figure style={{ maxWidth: 480, margin: '28px auto' }}>
      <CircuitDiagram settings={settings} result={result} format={format} />
      <figcaption>{mode === 'single' ? t('simpleCircuitCaption') : basics('exampleLabel')}</figcaption>
    </figure>
  );
}
