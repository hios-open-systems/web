'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ReadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { ToolHeader } from './ToolHeader';
import { QpskSimulator } from '@/components/dsp/QpskSimulator';
import workbenchStyles from './workbench.module.css';

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
  gap: 12, padding: '14px 18px', borderRadius: 10, border: '1px solid var(--hios-border)',
  background: 'var(--hios-bg-elevated)', fontSize: 13,
};
const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-text)',
  fontFamily: 'var(--font-stack-mono)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
};

export function QpskModulatorTool() {
  const locale = useLocale();
  const t = useTranslations('Workbench.packs.qpsk-modulator');
  const q = useTranslations('Qpsk');
  return (
    <div className={workbenchStyles.stackFull} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToolHeader eyebrow={q('eyebrow')} title={t('title')} description={t('description')} locality="local" />
      <QpskSimulator />
      <div style={cardStyle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--hios-text-secondary)' }}>
          <ReadOutlined style={{ color: 'var(--accent-text)' }} />
          <span><strong>{q('referenceTitle')}</strong> {q('referenceDescription')}</span>
        </span>
        <Link href={`/${locale}/blog/ref-modulacion-qpsk`} style={linkStyle}>
          {q('readArticle')} <ArrowRightOutlined />
        </Link>
      </div>
    </div>
  );
}
