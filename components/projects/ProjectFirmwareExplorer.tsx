'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CopyOutlined, CheckOutlined, GithubOutlined } from '@ant-design/icons';
import type { FirmwareSnippet } from '@/lib/projects';

interface ProjectFirmwareExplorerProps {
  files: FirmwareSnippet[];
  slug: string;
}

const cStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  maxWidth: '100%',
  overflowX: 'hidden',
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: '14px 16px',
  background: '#080c10',
  color: '#e2e8f0',
  fontFamily: 'var(--font-mono)',
  fontSize: 12.5,
  lineHeight: 1.55,
  overflowX: 'auto',
  maxHeight: 420,
  borderRadius: '0 0 12px 12px',
  border: '1px solid var(--hios-border)',
  borderTop: 'none',
  boxSizing: 'border-box',
  maxWidth: '100%',
};

const pillBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid var(--hios-border)',
  background: 'var(--hios-bg-secondary)',
  cursor: 'pointer',
};

export function ProjectFirmwareExplorer({ files, slug }: ProjectFirmwareExplorerProps) {
  const [activePath, setActivePath] = useState<string>(files[0]?.path ?? '');
  const [copied, setCopied] = useState(false);
  const t = useTranslations('ProjectDetail');

  const current = files.find((f) => f.path === activePath) ?? files[0];
  if (!current) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section id="firmware-code" style={cStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }} role="tablist" aria-label={t('firmware_title')}>
        {files.map((item) => {
          const isSelected = item.path === current.path;
          return (
            <button
              key={item.path}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActivePath(item.path)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                background: isSelected ? 'var(--accent)' : 'var(--hios-bg-elevated)',
                color: isSelected ? '#080c10' : 'var(--hios-text)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--hios-border)',
              }}
            >
              {item.title} <span style={{ opacity: 0.72, fontSize: 11 }}>({item.lines}L)</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 12px', background: 'var(--hios-bg-elevated)', border: '1px solid var(--hios-border)', borderRadius: '12px 12px 0 0' }}>
        <div style={{ minWidth: 0, flex: '1 1 180px', wordBreak: 'break-all' }}>
          <code style={{ color: 'var(--accent-text)', fontWeight: 700, fontSize: 12.5 }}>projects/{slug}/{current.path}</code>
          <span style={{ color: 'var(--hios-text-secondary)', fontSize: 12, display: 'block', marginTop: 2 }}>{current.role}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleCopy} style={{ ...pillBtn, color: 'var(--hios-text)' }}>
            {copied ? <><CheckOutlined /> {t('copied')}</> : <><CopyOutlined /> {t('copy')}</>}
          </button>
          <a href={current.githubUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn, color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600 }}>
            <GithubOutlined /> {t('full_file')}
          </a>
        </div>
      </div>

      <pre style={preStyle}>
        <code>{current.code}</code>
      </pre>
    </section>
  );
}
