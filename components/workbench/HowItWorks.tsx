'use client';

import React from 'react';
import { Collapse, Typography } from 'antd';
import { useLocale } from 'next-intl';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import manifest from '@/lib/algorithmsManifest.json';
import { useTheme } from '@/lib/ThemeContext';
import { CopyButton } from './CopyButton';

SyntaxHighlighter.registerLanguage('typescript', typescript);

const { Text } = Typography;

// El manifest lo genera scripts/gen-algorithms-manifest.mjs desde
// lib/algorithms/*.ts: el código mostrado acá es EL MISMO que ejecuta
// la tool (una sola fuente, sin drift).
const ENTRIES: Record<string, { file: string; source: string }> = manifest;

const REPO_BLOB_BASE = 'https://github.com/hios-open-systems/web/blob/main/';

// Textos inline a propósito (es/en con fallback en): este componente es
// puramente informativo y no queremos tocar messages/*.json por él.
const DICT = {
  en: {
    title: 'How it works',
    github: 'View on GitHub →',
    note: 'This is the actual code this tool runs. Open license — copy it, tweak it, make it yours.',
  },
  es: {
    title: 'Cómo funciona',
    github: 'Ver en GitHub →',
    note: 'Este es el código real que ejecuta esta tool. Licencia abierta — copialo, modificalo, hacelo tuyo.',
  },
} as const;

export function HowItWorks({ algorithmId }: { algorithmId: string }) {
  const locale = useLocale();
  const { mode } = useTheme();
  const d = locale === 'es' ? DICT.es : DICT.en;

  const entry = ENTRIES[algorithmId];
  if (!entry) return null;

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <CopyButton value={entry.source} />
        <a
          href={`${REPO_BLOB_BASE}${entry.file}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-stack-mono)',
            fontSize: 12,
            color: 'var(--accent-text)',
          }}
        >
          {d.github}
        </a>
      </div>
      <SyntaxHighlighter
        language="typescript"
        style={mode === 'dark' ? vscDarkPlus : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 8,
          border: '1px solid var(--hios-border)',
          fontSize: 12.5,
          lineHeight: 1.55,
          maxHeight: 480,
          overflow: 'auto',
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-stack-mono)' } }}
      >
        {entry.source}
      </SyntaxHighlighter>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {d.note}
      </Text>
    </div>
  );

  return (
    <Collapse
      bordered={false}
      style={{
        border: '1px solid var(--hios-border)',
        background: 'var(--hios-bg-secondary)',
        borderRadius: 8,
      }}
      items={[
        {
          key: 'source',
          label: (
            <span
              style={{
                fontFamily: 'var(--font-stack-mono)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
              }}
            >
              {d.title}
            </span>
          ),
          children: body,
        },
      ]}
    />
  );
}
