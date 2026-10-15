'use client';

import React, { useMemo } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import { LocalMarkdownImage } from '@/components/common/LocalMarkdownImage';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/lib/ThemeContext';
import { NotesList } from './NotesList';
import { useMarkdownNotes } from './useMarkdownNotes';
import { downloadBlob } from '@/lib/workbench/download';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

export function MarkdownNotesTool() {
  const t = useTranslations('Workbench.notes');
  const { mode } = useTheme();
  const { notes, active, activeId, setActiveId, saveFailed, patchActive, addNote, removeNote } = useMarkdownNotes();
  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
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
          <Space wrap>
            <Button size="large" icon={<PlusOutlined />} onClick={addNote}>{t('newNote')}</Button>
            <Button size="large" icon={<DownloadOutlined />} disabled={!active} onClick={() => {
              if (active) downloadBlob(active.body, (active.title.replace(/[<>:"/\\|?*]/g, '-').trim() || 'note') + '.md', 'text/markdown;charset=utf-8');
            }}>{t('download')}</Button>
          </Space>
        }
      />
      <Text role="status" type={saveFailed ? 'danger' : 'secondary'}>{t(saveFailed ? 'saveFailed' : 'savedLocal')}</Text>
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={6}>
          <Card title={t('notesLabel')} className={styles.sectionCard} styles={{ body: { padding: 8 } }}>
            <NotesList notes={notes} activeId={activeId} setActiveId={setActiveId} removeNote={removeNote} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={t('editorLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
            {active ? (
              <Space direction="vertical" size={12} className={styles.stackFull}>
                <Input
                  aria-label={t('titlePlaceholder')}
                  value={active.title}
                  onChange={(e) => patchActive({ title: e.target.value })}
                  placeholder={t('titlePlaceholder')}
                />
                <TextArea
                  aria-label={t('editorLabel')}
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
              img: LocalMarkdownImage,
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
