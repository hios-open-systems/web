'use client';
import { useToolFileDraft } from '@/lib/hooks/useToolFileDraft';
import { ToolPresetBinding, numberField } from '@/components/workbench/ToolPresetBinding';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!source) { setPreview(''); return; }
    const url = URL.createObjectURL(source);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => () => image?.bitmap.close(), [image]);

  const processFile = useCallback(async (file: File) => {
    const ticket = ++generation.current;
    if (!file.type.startsWith('image/')) {
      messageApi.error('Ese archivo no es una imagen');
      return;
    }
    setLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (ticket !== generation.current) { bitmap.close(); return; }
      setSource(file);
      setImage({ name: file.name, width: bitmap.width, height: bitmap.height, bitmap });
      messageApi.success('Imagen cargada');
    } catch {
      if (ticket === generation.current) messageApi.error('No se pudo abrir la imagen');
    } finally { if (ticket === generation.current) setLoading(false); }
  }, [messageApi]);

  const rememberFile = useToolFileDraft('image-convert', processFile);

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
      if (!blob || blob.type !== type) throw new Error('encode failed');
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
      <ToolPresetBinding toolId="image-convert" fields={{ quality: numberField(quality, setQuality, 0.3, 1) }} />
      <ToolHeader
        eyebrow="Imagen"
        title="Conversor de imágenes"
        description="Subí una imagen y exportala a PNG, JPG o WEBP. Todo en el navegador; nada se sube a un servidor."
        locality="local"
        actions={(image || loading) ? <Button size="large" disabled={busy} onClick={() => { rememberFile(null); generation.current++; setLoading(false); setSource(null); setImage(null); }}>Limpiar</Button> : undefined}
      />

      {loading && <Text role="status">Procesando archivo…</Text>}
      {!image ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            disabled={loading}
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => { rememberFile(file); processFile(file); return false; }}
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
            <Text strong style={{ overflowWrap: 'anywhere' }}>{image.name}</Text>
            <Image unoptimized width={image.width} height={image.height} src={preview} alt={image.name} style={{ maxWidth: '100%', height: 'auto', maxHeight: 260, objectFit: 'contain' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>{image.width} × {image.height} px</Text>
            <Space wrap align="center" size={8} style={{ maxWidth: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Calidad</Text>
              <Slider style={{ width: 160 }} min={0.3} max={1} step={0.01} value={quality} onChange={setQuality} />
              <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(quality * 100)}%</Text>
            </Space>
            <Text type="secondary">La calidad se aplica a JPG y WEBP. JPG reemplaza la transparencia por blanco. Las imágenes animadas se exportan como una imagen fija.</Text>
            <Space wrap>
              <Button size="large" icon={<DownloadOutlined aria-hidden />} loading={busy} onClick={() => exportAs('image/png', 'png')}>PNG</Button>
              <Button size="large" icon={<DownloadOutlined aria-hidden />} loading={busy} onClick={() => exportAs('image/jpeg', 'jpg')}>JPG</Button>
              <Button size="large" icon={<DownloadOutlined aria-hidden />} loading={busy} onClick={() => exportAs('image/webp', 'webp')}>WEBP</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
}
