'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ReadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { ToolHeader } from './ToolHeader';
import { QpskSimulator } from '@/components/dsp/QpskSimulator';
import workbenchStyles from './workbench.module.css';

export function QpskModulatorTool() {
  const locale = useLocale();
  const t = useTranslations('Workbench.packs.qpsk-modulator');

  return (
    <div className={workbenchStyles.stackFull} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToolHeader
        eyebrow="DSP & Comunicaciones"
        title={t('title')}
        description={t('description')}
        locality="local"
      />

      <QpskSimulator />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 10,
          border: '1px solid var(--hios-border)',
          background: 'var(--hios-bg-elevated)',
          fontSize: 13,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--hios-text-secondary)' }}>
          <ReadOutlined style={{ color: 'var(--accent-text)' }} />
          <span>
            <strong>Referencia matemática (REF-006):</strong> Formulación ortogonal I/Q, codificación Gray y ruido AWGN.
          </span>
        </span>
        <Link
          href={`/${locale}/blog/ref-modulacion-qpsk`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-stack-mono)',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Leer artículo técnico <ArrowRightOutlined />
        </Link>
      </div>
    </div>
  );
}
