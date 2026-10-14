'use client';
import { Button, Card, Input, Space, Table, Tag, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { ParsedURL } from '@/lib/workbench/urlParser';
import styles from './workbench.module.css';
const { Text } = Typography;
export function UrlParameters({ parsed, editMode, setEditMode, editParams, setEditParams, startEdit, applyEdit, copy }: {
  parsed: ParsedURL; editMode: boolean; setEditMode: (value: boolean) => void;
  editParams: ParsedURL['params']; setEditParams: (value: ParsedURL['params']) => void;
  startEdit: () => void; applyEdit: () => void; copy: (value: string) => Promise<boolean>;
}) {
  const t = useTranslations('Workbench.urlParser');
  return <>
          <Card
            title={t('paramsLabel')}
            className={styles.sectionCard}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ marginBottom: 16 }}>{
              editMode ? (
                <Space wrap>
                  <Button size="large" onClick={() => setEditMode(false)}>{t('cancel')}</Button>
                  <Button size="large" type="primary" onClick={applyEdit}>{t('apply')}</Button>
                </Space>
              ) : (
                <Button size="large" onClick={startEdit} >{t('edit')}</Button>
              )}</div>
            {!editMode && parsed.params.length === 0 ? (
              <Text style={{ color: 'var(--wb-text-muted)' }}>{t('noParams')}</Text>
            ) : editMode ? (
              <Space direction="vertical" size={8} className={styles.stackFull}>
                {editParams.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Input
                      aria-label={t('colKey') + ' ' + (i + 1)}
                      value={p.key}
                      onChange={(e) => {
                        const next = [...editParams];
                        next[i] = { ...next[i], key: e.target.value };
                        setEditParams(next);
                      }}
                      style={{ fontFamily: 'monospace', flex: '1 1 100px', minWidth: 0 }}
                      placeholder="key"
                    />
                    <Text style={{ color: 'var(--wb-text-muted)' }}>=</Text>
                    <Input
                      aria-label={t('colValue') + ' ' + (i + 1)}
                      value={p.value}
                      onChange={(e) => {
                        const next = [...editParams];
                        next[i] = { ...next[i], value: e.target.value };
                        setEditParams(next);
                      }}
                      style={{ fontFamily: 'monospace', flex: '2 1 140px', minWidth: 0 }}
                      placeholder="value"
                    />
                    <Button
                      size="large"
                      aria-label={t('removeParam') + ' ' + (i + 1)}
                      danger
                      onClick={() => setEditParams(editParams.filter((_, j) => j !== i))}
                    >✕</Button>
                  </div>
                ))}
                <Button
                  size="small"
                  onClick={() => setEditParams([...editParams, { key: '', value: '' }])}
                >+ {t('addParam')}</Button>
              </Space>
            ) : (
              <Table
                size="small"
                tableLayout="fixed"
                dataSource={parsed.params.map((p, i) => ({ ...p, key: `${p.key}-${i}`, paramKey: p.key }))}
                columns={[
                  {
                    title: t('colKey'),
                    dataIndex: 'paramKey',
                    render: (v: string) => <Tag color="blue" style={{ maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere' }}><code>{v}</code></Tag>,
                  },
                  {
                    title: t('colValue'),
                    dataIndex: 'value',
                    render: (v: string) => <code style={{ wordBreak: 'break-all' }}>{v}</code>,
                  },
                  {
                    title: '',
                    width: 40,
                    render: (_: unknown, row: { paramKey: string; value: string }) => (
                      <Button aria-label={t('copyParam') + ': ' + row.paramKey} style={{ minWidth: 44, minHeight: 44 }} type="text" icon={<CopyOutlined aria-hidden />} onClick={() => void copy(`${row.paramKey}=${row.value}`)} />
                    ),
                  },
                ]}
                pagination={false}
              />
            )}
          </Card>
  </>;
}
