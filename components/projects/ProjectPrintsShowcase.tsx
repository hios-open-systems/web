'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DownloadOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { StlViewerLazy } from '@/components/prints/StlViewerLazy';
import { ProjectStlPreview } from '@/components/projects/ProjectStlPreview';
import type { PrintModel } from '@/config/prints';

interface External3dLink {
  name: string;
  url: string;
}

interface ProjectPrintsShowcaseProps {
  prints: PrintModel[];
  locale: string;
  slug: string;
  title: string;
  description: string;
  downloadLabel: string;
  makerLabel: string;
  externalLinks?: External3dLink[];
}

const cStyle: React.CSSProperties = {
  marginBottom: 48,
  padding: 'clamp(14px, 3vw, 24px)',
  background: 'var(--bg-secondary)',
  borderRadius: 16,
  border: '1px solid var(--border-color)',
  boxSizing: 'border-box',
  maxWidth: '100%',
  overflowX: 'hidden',
};

const chipBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  cursor: 'pointer',
};

export function ProjectPrintsShowcase({
  prints,
  locale,
  slug,
  title,
  description,
  downloadLabel,
  makerLabel,
  externalLinks = [],
}: ProjectPrintsShowcaseProps) {
  const [selectedFile, setSelectedFile] = useState<string>(prints[0]?.file ?? prints[0]?.name ?? '');
  const activePrint = prints.find((p) => (p.file ?? p.name) === selectedFile) ?? prints[0];
  if (!activePrint) return null;

  return (
    <section id="models-3d" style={cStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>{title}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>{description}</p>
        </div>
        <Link href={`/${locale}/prints#prints-${slug}`} style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: 13.5 }}>
          {makerLabel} →
        </Link>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }} role="tablist" aria-label={title}>
        {prints.map((item) => {
          const itemKey = item.file ?? item.name;
          const isSelected = itemKey === (activePrint.file ?? activePrint.name);
          return (
            <button
              key={itemKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedFile(itemKey)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: isSelected ? '#080c10' : 'var(--text-primary)',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              }}
            >
              {item.name} {item.fileKB ? <span style={{ opacity: 0.75, fontSize: 11 }}>({item.fileKB} KB)</span> : null}
            </button>
          );
        })}
      </div>

      {activePrint.file && (
        <div style={{ position: 'relative', height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', background: '#0d0d0d', marginBottom: 18 }}>
          <StlViewerLazy key={activePrint.file} url={activePrint.file} name={activePrint.name} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
        {prints.map((item) => {
          const itemKey = item.file ?? item.name;
          const fileName = item.file ? item.file.split('/').pop() : item.name;
          const isCurrent = itemKey === (activePrint.file ?? activePrint.name);
          return (
            <div key={itemKey} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.name}</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {fileName} {item.fileKB ? `· ${item.fileKB} KB` : ''}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item.description}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {item.file && (
                  <button type="button" onClick={() => setSelectedFile(itemKey)} style={{ ...chipBtn, background: isCurrent ? 'rgba(0, 216, 255, 0.14)' : 'transparent', color: 'var(--text-primary)' }}>
                    <EyeOutlined /> Ver aquí
                  </button>
                )}
                {item.file && <ProjectStlPreview name={item.name} url={item.file} />}
                {item.file && (
                  <a href={item.file} download style={{ ...chipBtn, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    <DownloadOutlined /> {downloadLabel} (.stl)
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {externalLinks.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Modelos 3D externos:</span>
          {externalLinks.map((ext) => (
            <a key={ext.url} href={ext.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{ext.name} <ExportOutlined /></a>
          ))}
        </div>
      )}
    </section>
  );
}
