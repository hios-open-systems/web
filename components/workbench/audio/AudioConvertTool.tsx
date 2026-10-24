'use client';
import { useToolFileDraft } from '@/lib/hooks/useToolFileDraft';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Space, Typography, Upload, message } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader';
import styles from '../workbench.module.css';
import { encodeWav } from '@/lib/workbench/wav';
import { downloadBlob } from '@/lib/workbench/download';

const { Text } = Typography;
const { Dragger } = Upload;

interface Decoded {
  name: string;
  sampleRate: number;
  channels: number;
  duration: number;
  channelData: Float32Array[];
}

const baseName = (n: string): string => n.replace(/\.[^.]+$/, '') || 'audio';

/**
 * Conversor de audio client-side: subís un archivo (WAV/MP3/OGG/FLAC…), se
 * decodifica con Web Audio y se re-exporta a WAV o MP3. Nada sale del navegador.
 * Reusa encodeWav/encodeMp3/downloadBlob (mismo pipeline que el composer). FLAC
 * (encoder WASM) queda como paso siguiente — requiere ajuste de CSP + verificación.
 */
export function AudioConvertTool() {
  const [messageApi, contextHolder] = message.useMessage();
  const [audio, setAudio] = useState<Decoded | null>(null);
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

  const processFile = useCallback(async (file: File) => {
    const ticket = ++generation.current;
    let ctx: AudioContext | null = null;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(buf);
      if (ticket !== generation.current) return;
      setSource(file);
      const channelData = Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index));
      setAudio({
        name: file.name,
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
        duration: decoded.duration,
        channelData,
      });
      messageApi.success('Audio cargado');
    } catch {
      if (ticket === generation.current) messageApi.error('No se pudo decodificar ese archivo de audio');
    } finally { void ctx?.close().catch(() => {}); if (ticket === generation.current) setLoading(false); }
  }, [messageApi]);

  const rememberFile = useToolFileDraft('audio-convert', processFile);

  const exportWav = () => {
    if (!audio) return;
    try {
    downloadBlob(encodeWav({ sampleRate: audio.sampleRate, channelData: audio.channelData }), `${baseName(audio.name)}.wav`, 'audio/wav');
    messageApi.success('WAV exportado');
    } catch { messageApi.error('No se pudo exportar el audio'); }
  };
  const exportMp3 = async () => {
    if (!audio || audio.channels > 2) return;
    setBusy(true);
    try {
      const { encodeMp3 } = await import('@/lib/workbench/mp3'); // lazy: lamejs baja solo al exportar
      downloadBlob(encodeMp3(audio.channelData, audio.sampleRate), `${baseName(audio.name)}.mp3`, 'audio/mpeg');
      messageApi.success('MP3 exportado');
    } catch {
      messageApi.error('No se pudo exportar el audio');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Space direction="vertical" size={20} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow="Audio Lab"
        title="Conversor de audio"
        description="Subí un archivo de audio y exportalo a WAV o MP3. Todo en el navegador; nada se sube a un servidor."
        locality="local"
        actions={(audio || loading) ? <Button size="large" disabled={busy} onClick={() => { rememberFile(null); generation.current++; setLoading(false); setSource(null); setAudio(null); }}>Limpiar</Button> : undefined}
      />

      {loading && <Text role="status">Procesando archivo…</Text>}
      {!audio ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            disabled={loading}
            accept="audio/*"
            showUploadList={false}
            beforeUpload={(file) => { rememberFile(file); processFile(file); return false; }}
            style={{ background: 'var(--hios-bg-secondary)', border: '1px dashed var(--hios-border)' }}
          >
            <p style={{ fontSize: 32, margin: '16px 0 8px' }}>
              <InboxOutlined style={{ color: '#0ea5e9' }} />
            </p>
            <Text style={{ fontSize: 15 }}>Arrastrá un audio o hacé click para subir</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>WAV, MP3, OGG, FLAC… se decodifica local</Text>
          </Dragger>
        </Card>
      ) : (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text strong style={{ overflowWrap: 'anywhere' }}>{audio.name}</Text>
            <audio controls src={preview || undefined} style={{ width: '100%' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {audio.sampleRate} Hz · {audio.channels} canal(es) · {audio.duration.toFixed(1)} s
            </Text>
            {audio.channels > 2 && <Text type="secondary">Este audio tiene más de dos canales. Descargá WAV para conservarlos todos.</Text>}
            <Space wrap>
              <Button size="large" icon={<DownloadOutlined aria-hidden />} disabled={busy} onClick={exportWav}>WAV</Button>
              <Button size="large" icon={<DownloadOutlined aria-hidden />} disabled={audio.channels > 2} loading={busy} onClick={exportMp3}>MP3</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
}
