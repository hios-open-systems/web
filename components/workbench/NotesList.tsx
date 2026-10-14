'use client';
import { Button, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { NoteRecord } from '@/lib/workbench/notes';
import styles from './workbench.module.css';
const { Text } = Typography;
export function NotesList({ notes, activeId, setActiveId, removeNote }: {
  notes: NoteRecord[]; activeId: string | null; setActiveId: (id: string) => void; removeNote: (id: string) => void;
}) {
  const t = useTranslations('Workbench.notes');
  return <>
            {notes.length === 0 ? (
              <div className={styles.emptyPanel}>
                <Text>{t('empty')}</Text>
              </div>
            ) : (
              <div className={styles.generatedList} style={{ maxHeight: 180, overflowY: 'auto' }}>
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

                  >
                    <Button type="text" style={{ minHeight: 44, flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'left' }} aria-pressed={n.id === activeId} onClick={() => setActiveId(n.id)}>
                      <Text ellipsis>{n.title || t('untitled')}</Text>
                    </Button>
                    <Popconfirm title={t('deleteConfirm')} onConfirm={() => removeNote(n.id)} okText={t('delete')} cancelText={t('cancel')}>
                    <Button
                      aria-label={t('delete') + ': ' + (n.title || t('untitled'))}
                      style={{ minHeight: 44, minWidth: 44 }}
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                    </Popconfirm>
                  </div>
                ))}
              </div>
            )}
  </>;
}
