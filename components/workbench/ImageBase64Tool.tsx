'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Card, Space, Tag, Typography, Upload, message } from 'antd';
import { CopyOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageInfo {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  dataUri: string;
  base64: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageBase64Tool() {
  const t = useTranslations('Workbench.imageBase64');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        messageApi.error(t('notAnImage'));
        return;
      }
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        const base64 = dataUri.split(',')[1] ?? '';
        const img = new Image();
        img.onload = () => {
          setImageInfo({
            name: file.name,
            type: file.type,
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            dataUri,
            base64,
          });
          setLoading(false);
        };
        img.src = dataUri;
      };
      reader.readAsDataURL(file);
    },
    [messageApi, t],
  );

  const copy = async (val: string, label: string) => {
    try {
      await navigator.clipboard.writeText(val);
      messageApi.success(`${label} ${t('copied')}`);
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  const clear = () => {
    setImageInfo(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          imageInfo ? <Button onClick={clear}>{t('clear')}</Button> : undefined
        }
      />

      {!imageInfo ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
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
              <img
                src={imageInfo.dataUri}
                alt={imageInfo.name}
                style={{
                  maxWidth: 220,
                  maxHeight: 180,
                  borderRadius: 8,
                  border: '1px solid var(--wb-surface-border)',
                  objectFit: 'contain',
                  background: mode === 'dark' ? '#1e293b' : '#f1f5f9',
                }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
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
                      <Text style={{ fontSize: 13 }}>{val}</Text>
                    </div>
                  ))}
                </Space>
              </div>
            </div>
          </Card>

          {/* Output options */}
          <Card title={t('outputLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={12} className={styles.stackFull}>
              {[
                { label: 'Data URI', key: 'dataUri', val: imageInfo.dataUri },
                { label: 'Base64 only', key: 'base64', val: imageInfo.base64 },
                { label: 'CSS background-image', key: 'css', val: `background-image: url('${imageInfo.dataUri}');` },
                { label: 'HTML <img>', key: 'html', val: `<img src="${imageInfo.dataUri}" alt="${imageInfo.name}" width="${imageInfo.width}" height="${imageInfo.height}" />` },
              ].map(({ label, key, val }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontWeight: 500 }}>{label}</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => void copy(val, label)}
                    >
                      {t('copy')}
                    </Button>
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
        </>
      )}
    </Space>
  );
}
