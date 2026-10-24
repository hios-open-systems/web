'use client';
import { useToolFileDraft } from '@/lib/hooks/useToolFileDraft';

import React, { useCallback, useMemo } from 'react';
import { Button, Card, Space, Tag, Typography, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { useBase64Image } from './useBase64Image';
import { Base64ImageOutput } from './Base64ImageOutput';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { Dragger } = Upload;

// ── Types ─────────────────────────────────────────────────────────────────────


function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageBase64Tool() {
  const t = useTranslations('Workbench.imageBase64');
  const [messageApi, contextHolder] = message.useMessage();
  const onError = useCallback(() => { messageApi.error(t('readError')); }, [messageApi, t]);
  const { imageInfo, loading, clear, processFile } = useBase64Image(onError);

  const rememberFile = useToolFileDraft('image-base64', processFile);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const copyRaw = useCopyToClipboard(messageApi);
  const copy = (val: string, label: string) => copyRaw(val, `${label} ${t('copied')}`);



  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          (imageInfo || loading) ? <Button size="large" onClick={() => { rememberFile(null); clear(); }}>{t('clear')}</Button> : undefined
        }
      />

      {loading && <Text role="status">{t('loading')}</Text>}
      {!imageInfo ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            disabled={loading}
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              rememberFile(file);
              processFile(file);
              return false;
            }}
            style={{ background: 'var(--wb-surface-soft-bg)', border: '1px dashed var(--wb-surface-border)' }}
          >
            <p style={{ fontSize: 32, margin: '16px 0 8px' }}>
              <InboxOutlined style={{ color: '#0ea5e9' }} />
            </p>
            <Text style={{ fontSize: 15 }}>{t('dropHint')}</Text>
            <br />
            <Text style={{ color: 'var(--wb-text-muted)', fontSize: 13 }}>{t('dropSub')}</Text>
          </Dragger>
        </Card>
      ) : (
        <>
          {/* Preview + meta */}
          <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <NextImage
                src={imageInfo.dataUri}
                alt={imageInfo.name}
                  width={imageInfo.width}
                  height={imageInfo.height}
                  unoptimized
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: 'min(220px, 100%)',
                  maxHeight: 180,
                  borderRadius: 8,
                  border: '1px solid var(--wb-surface-border)',
                  objectFit: 'contain',
                  background: 'var(--hios-bg-secondary)',
                }}
              />
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Space direction="vertical" size={6}>
                  {[
                    { label: t('labelName'),       val: imageInfo.name },
                    { label: t('labelType'),       val: <Tag>{imageInfo.type}</Tag> },
                    { label: t('labelSize'),       val: formatBytes(imageInfo.size) },
                    { label: t('labelDimensions'), val: `${imageInfo.width} × ${imageInfo.height} px` },
                    { label: t('labelBase64Size'), val: formatBytes(imageInfo.base64.length) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Text style={{ color: 'var(--wb-text-muted)', fontSize: 12, minWidth: 110 }}>{label}</Text>
                      <Text style={{ fontSize: 13, minWidth: 0, overflowWrap: 'anywhere' }}>{val}</Text>
                    </div>
                  ))}
                </Space>
              </div>
            </div>
          </Card>

          <Base64ImageOutput imageInfo={imageInfo} copy={copy} />
        </>
      )}
    </Space>
  );
}
