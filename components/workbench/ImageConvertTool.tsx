'use client';

import { useCallback, useState } from 'react';
import { Button, Card, Slider, Space, Typography, Upload, message } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';
import { downloadBlob } from '@/lib/workbench/download';

const { Text } = Typography;
const { Dragger } = Upload;

interface Loaded {
  name: string;
  width: number;
  height: number;
  bitmap: ImageBitmap;
}

const baseName = (n: string): string => n.replace(/\.[^.]+$/, '') || 'imagen';

export function ImageConvertTool() {
  const [messageApi, contextHolder] = message.useMessage();
  const [image, setImage] = useState<Loaded | null>(null);
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      messageApi.error('Ese archivo no es una imagen');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      setImage({ name: file.name, width: bitmap.width, height: bitmap.height, bitmap });
      messageApi.success('Imagen cargada');
    } catch {
      messageApi.error('No se pudo abrir la imagen');
    }
  }, [messageApi]);

  const exportAs = useCallback(async (type: string, ext: string) => {
    if (!image) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image.bitmap, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, type === 'image/png' ? undefined : quality),
      );
      if (!blob) throw new Error('encode failed');
      downloadBlob(blob, `${baseName(image.name)}.${ext}`, type);
      messageApi.success(`${ext.toUpperCase()} exportado`);
    } catch {
      messageApi.error('No se pudo convertir la imagen');
    } finally {
      setBusy(false);
    }
  }, [image, quality, messageApi]);

  return (
    <Space direction="vertical" size={20} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow="Imagen"
        title="Conversor de imágenes"
        description="Subí una imagen y exportala a PNG, JPG o WEBP. Todo en el navegador; nada se sube a un servidor."
        locality="local"
        actions={image ? <Button onClick={() => setImage(null)}>Limpiar</Button> : undefined}
      />

      {!image ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => { processFile(file); return false; }}
            style={{ background: 'var(--hios-bg-secondary)', border: '1px dashed var(--hios-border)' }}
          >
            <p style={{ fontSize: 32, margin: '16px 0 8px' }}>
              <InboxOutlined style={{ color: '#ec4899' }} />
            </p>
            <Text style={{ fontSize: 15 }}>Arrastrá una imagen o hacé click para subir</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>PNG, JPG, WEBP, GIF, AVIF… se procesa local</Text>
          </Dragger>
        </Card>
      ) : (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text strong>{image.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{image.width} × {image.height} px</Text>
            <Space align="center" size={8} style={{ maxWidth: 320 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Calidad</Text>
              <Slider style={{ width: 160 }} min={0.3} max={1} step={0.01} value={quality} onChange={setQuality} />
              <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(quality * 100)}%</Text>
            </Space>
            <Space wrap>
              <Button icon={<DownloadOutlined />} loading={busy} onClick={() => exportAs('image/png', 'png')}>PNG</Button>
              <Button icon={<DownloadOutlined />} loading={busy} onClick={() => exportAs('image/jpeg', 'jpg')}>JPG</Button>
              <Button icon={<DownloadOutlined />} loading={busy} onClick={() => exportAs('image/webp', 'webp')}>WEBP</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
}
