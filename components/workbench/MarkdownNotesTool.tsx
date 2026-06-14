'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/lib/ThemeContext';
import { type NoteRecord, createNoteDraft, readNotes, writeNotes } from '@/lib/workbench/notes';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

function normalizeEscapedNewlines(value: string): string {
  if (!value.includes('\\n') || value.includes('\n')) return value;
  return value.replace(/\\n/g, '\n');
}

export function MarkdownNotesTool() {
  const t = useTranslations('Workbench.notes');
  const { mode } = useTheme();
  const searchParams = useSearchParams();
  const hydrated = useRef(false);

  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    let loaded = readNotes().map((note) => ({
      ...note,
      body: normalizeEscapedNewlines(note.body),
    }));
    const shared = searchParams.get('note');
    if (shared !== null) {
      const imported = createNoteDraft({
        title: t('importedTitle'),
        body: normalizeEscapedNewlines(shared),
      });
      loaded = [imported, ...loaded];
    }
    if (loaded.length === 0) {
      loaded = [
        createNoteDraft({
          title: t('exampleTitle'),
          body: normalizeEscapedNewlines(t('exampleBody')),
        }),
      ];
    }
    setNotes(loaded);
    setActiveId(loaded[0]?.id ?? null);
  }, [searchParams, t]);

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated.current) return;
    const h = setTimeout(() => writeNotes(notes), 400);
    return () => clearTimeout(h);
  }, [notes]);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  const patchActive = (patch: Partial<NoteRecord>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );
  };

  const addNote = () => {
    const draft = createNoteDraft({ title: t('newNote') });
    setNotes((prev) => [draft, ...prev]);
    setActiveId(draft.id);
  };

  const removeNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
      }) as React.CSSProperties,
    [mode],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="notes"
        actions={
          <Button icon={<PlusOutlined />} onClick={addNote}>
            {t('newNote')}
          </Button>
        }
      />
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={6}>
          <Card title={t('notesLabel')} className={styles.sectionCard} styles={{ body: { padding: 8 } }}>
            {notes.length === 0 ? (
              <div className={styles.emptyPanel}>
                <Text>{t('empty')}</Text>
              </div>
            ) : (
              <div className={styles.generatedList}>
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className={styles.generatedRow}
                    style={{
                      cursor: 'pointer',
                      background:
                        n.id === activeId ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : undefined,
                      borderRadius: 8,
                    }}
                    onClick={() => setActiveId(n.id)}
                  >
                    <Text className={styles.generatedValue} ellipsis>
                      {n.title || t('untitled')}
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNote(n.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={t('editorLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
            {active ? (
              <Space direction="vertical" size={12} className={styles.stackFull}>
                <Input
                  value={active.title}
                  onChange={(e) => patchActive({ title: e.target.value })}
                  placeholder={t('titlePlaceholder')}
                />
                <TextArea
                  value={active.body}
                  onChange={(e) => patchActive({ body: e.target.value })}
                  autoSize={{ minRows: 12, maxRows: 28 }}
                  placeholder={t('bodyPlaceholder')}
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                />
              </Space>
            ) : (
              <div className={styles.emptyPanel}>
                <Text>{t('selectOrCreate')}</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={t('previewLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
            {active && active.body.trim() ? (
              <div data-testid="notes-preview" className={styles.markdownBody}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ children, className }) => {
                      const isBlock = Boolean(className);
                      if (isBlock) {
                        return <code className={className}>{children}</code>;
                      }
                      return <code>{children}</code>;
                    },
                    pre: ({ children }) => <pre>{children}</pre>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {active.body}
                </ReactMarkdown>
              </div>
            ) : (
              <div className={styles.emptyPanel}>
                <Text>{t('previewEmpty')}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
