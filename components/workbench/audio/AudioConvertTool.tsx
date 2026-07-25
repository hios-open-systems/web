'use client';

import { useCallback, useState } from 'react';
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
  const [busy, setBusy] = useState(false);

  const processFile = useCallback(async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(buf);
      void ctx.close();
      const channelData = decoded.numberOfChannels >= 2
        ? [decoded.getChannelData(0), decoded.getChannelData(1)]
        : [decoded.getChannelData(0), decoded.getChannelData(0)];
      setAudio({
        name: file.name,
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
        duration: decoded.duration,
        channelData,
      });
      messageApi.success('Audio cargado');
    } catch {
      messageApi.error('No se pudo decodificar ese archivo de audio');
    }
  }, [messageApi]);

  const exportWav = () => {
    if (!audio) return;
    downloadBlob(encodeWav({ sampleRate: audio.sampleRate, channelData: audio.channelData }), `${baseName(audio.name)}.wav`, 'audio/wav');
    messageApi.success('WAV exportado');
  };
  const exportMp3 = async () => {
    if (!audio) return;
    setBusy(true);
    try {
      const { encodeMp3 } = await import('@/lib/workbench/mp3'); // lazy: lamejs baja solo al exportar
      downloadBlob(encodeMp3(audio.channelData, audio.sampleRate), `${baseName(audio.name)}.mp3`, 'audio/mpeg');
      messageApi.success('MP3 exportado');
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
        actions={audio ? <Button onClick={() => setAudio(null)}>Limpiar</Button> : undefined}
      />

      {!audio ? (
        <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Dragger
            accept="audio/*"
            showUploadList={false}
            beforeUpload={(file) => { processFile(file); return false; }}
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
            <Text strong>{audio.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {audio.sampleRate} Hz · {audio.channels} canal(es) · {audio.duration.toFixed(1)} s
            </Text>
            <Space wrap>
              <Button icon={<DownloadOutlined />} onClick={exportWav}>WAV</Button>
              <Button icon={<DownloadOutlined />} loading={busy} onClick={exportMp3}>MP3</Button>
              <Button icon={<DownloadOutlined />} disabled title="Próximamente (encoder FLAC WASM)">FLAC (pronto)</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
}
