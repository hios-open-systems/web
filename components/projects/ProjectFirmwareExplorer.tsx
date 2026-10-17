'use client';

import React, { useState } from 'react';
import { CodeOutlined, CopyOutlined, CheckOutlined, GithubOutlined } from '@ant-design/icons';
import type { FirmwareSnippet } from '@/lib/projects';

interface ProjectFirmwareExplorerProps {
  files: FirmwareSnippet[];
  slug: string;
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
  border: '1px solid var(--border-color)',
  borderTop: 'none',
  boxSizing: 'border-box',
  maxWidth: '100%',
};

const pillBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  cursor: 'pointer',
};

export function ProjectFirmwareExplorer({ files, slug }: ProjectFirmwareExplorerProps) {
  const [activePath, setActivePath] = useState<string>(files[0]?.path ?? '');
  const [copied, setCopied] = useState(false);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ minWidth: 0, maxWidth: '100%' }}>
          <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>
            <CodeOutlined style={{ color: 'var(--accent-primary)', marginRight: 8 }} />
            Explorador de Firmware y Código ({files.length} módulos)
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>
            Archivos reales del repositorio <code>projects/{slug}/</code> sin salir de la página.
          </p>
        </div>
        <a href={`https://github.com/hios-open-systems/web/tree/main/projects/${slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: 13.5 }}>
          <GithubOutlined /> En GitHub →
        </a>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }} role="tablist" aria-label="Archivos de firmware">
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
                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: isSelected ? '#080c10' : 'var(--text-primary)',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              }}
            >
              {item.title} <span style={{ opacity: 0.72, fontSize: 11 }}>({item.lines}L)</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0' }}>
        <div style={{ minWidth: 0, flex: '1 1 180px', wordBreak: 'break-all' }}>
          <code style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 12.5 }}>projects/{slug}/{current.path}</code>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginTop: 2 }}>{current.role}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleCopy} style={{ ...pillBtn, color: 'var(--text-primary)' }}>
            {copied ? <><CheckOutlined /> Copiado</> : <><CopyOutlined /> Copiar</>}
          </button>
          <a href={current.githubUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            <GithubOutlined /> Archivo completo
          </a>
        </div>
      </div>

      <pre style={preStyle}>
        <code>{current.code}</code>
      </pre>
    </section>
  );
}
