'use client';
import { Button, Card, Space, Typography } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { downloadBlob } from '@/lib/workbench/download';
import type { ImageInfo } from './useBase64Image';
import styles from './workbench.module.css';
const { Text, Paragraph } = Typography;
export function Base64ImageOutput({ imageInfo, copy }: {
  imageInfo: ImageInfo; copy: (value: string, label: string) => Promise<boolean>;
}) {
  const t = useTranslations('Workbench.imageBase64');
  return <>
          {/* Output options */}
          <Card title={t('outputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={12} className={styles.stackFull}>
              {[
                { label: 'Data URI', key: 'dataUri', val: imageInfo.dataUri },
                { label: 'Base64 only', key: 'base64', val: imageInfo.base64 },
                { label: 'CSS background-image', key: 'css', val: `background-image: url('${imageInfo.dataUri}');` },
                { label: 'HTML <img>', key: 'html', val: `<img src="${imageInfo.dataUri}" alt="${imageInfo.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" width="${imageInfo.width}" height="${imageInfo.height}" />` },
              ].map(({ label, key, val }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontWeight: 500 }}>{label}</Text>
                    <Space wrap>
                    <Button
                      size="large"
                      icon={<CopyOutlined aria-hidden />}
                      onClick={() => void copy(val, label)}
                    >
                      {t('copy')}
                    </Button>
                    <Button size="large" aria-label={t('download') + ' ' + label} icon={<DownloadOutlined aria-hidden />} onClick={() => downloadBlob(val, 'image-' + key + '.txt', 'text/plain;charset=utf-8')}>{t('download')}</Button>
                    </Space>
                  </div>
                  <Paragraph
                    ellipsis={{ rows: 2, expandable: true, symbol: t('expand') }}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      background: 'var(--wb-surface-soft-bg)',
                      border: '1px solid var(--wb-surface-border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      margin: 0,
                      wordBreak: 'break-all',
                    }}
                  >
                    {val}
                  </Paragraph>
                </div>
              ))}
            </Space>
          </Card>
  </>;
}
