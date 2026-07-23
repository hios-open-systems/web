'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, InputNumber, Row, Select, Space, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import {
  NOTE_NAMES,
  freqToNote,
  midiToFreq,
  noteToFreq,
  noteToMidi,
} from '@/lib/workbench/noteFreq';
import { ToolHeader } from '../ToolHeader';
import styles from '../workbench.module.css';

const { Text } = Typography;

const fmt = (n: number) => String(parseFloat(n.toFixed(2)));

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Col xs={12} sm={8}>
      <div
        style={{
          background: 'var(--wb-surface-soft-bg)',
          border: '1px solid var(--wb-surface-border)',
          borderRadius: 8,
          padding: '10px 14px',
          textAlign: 'center',
        }}
      >
        <Text className={styles.metricLabel} style={{ display: 'block' }}>
          {label}
        </Text>
        <Text strong style={{ fontSize: 18 }}>
          {value}
        </Text>
      </div>
    </Col>
  );
}

export function NoteFrequencyTool() {
  const t = useTranslations('Workbench.noteFrequency');
  const [a4, setA4] = useState<number | null>(440);
  const [note, setNote] = useState('A');
  const [octave, setOctave] = useState<number | null>(4);
  const [freq, setFreq] = useState<number | null>(440);
  const [midi, setMidi] = useState<number | null>(69);

  const ref = a4 && a4 > 0 ? a4 : 440;

  const fromNote = useMemo(() => {
    if (octave === null) return null;
    const m = noteToMidi(note, octave);
    return { freq: noteToFreq(note, octave, ref), midi: m };
  }, [note, octave, ref]);

  const fromFreq = useMemo(() => (freq && freq > 0 ? freqToNote(freq, ref) : null), [freq, ref]);
  const fromMidi = useMemo(
    () => (midi !== null ? freqToNote(midiToFreq(midi, ref), ref) : null),
    [midi, ref],
  );

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="noteFrequency"
        actions={
          <Space align="center">
            <Text className={styles.metricLabel}>{t('a4Label')}</Text>
            <InputNumber value={a4} onChange={setA4} addonAfter="Hz" min={400} max={480} />
          </Space>
        }
      />

      <Card title={t('fromNote')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Space wrap>
            <Select
              value={note}
              onChange={setNote}
              options={NOTE_NAMES.map((n) => ({ value: n, label: n }))}
              style={{ width: 90 }}
            />
            <InputNumber value={octave} onChange={setOctave} min={-1} max={9} addonBefore={t('octaveLabel')} />
          </Space>
          {fromNote ? (
            <Row gutter={[12, 12]}>
              <Metric label={t('freqLabel')} value={`${fmt(fromNote.freq)} Hz`} />
              <Metric label={t('midiLabel')} value={String(fromNote.midi)} />
            </Row>
          ) : null}
        </Space>
      </Card>

      <Card title={t('fromFreq')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <InputNumber value={freq} onChange={setFreq} addonAfter="Hz" min={1} style={{ width: 200 }} />
          {fromFreq ? (
            <Row gutter={[12, 12]}>
              <Metric label={t('noteLabel')} value={`${fromFreq.note}${fromFreq.octave}`} />
              <Metric label={t('midiLabel')} value={String(fromFreq.midi)} />
              <Metric label={t('centsLabel')} value={`${fromFreq.cents > 0 ? '+' : ''}${fromFreq.cents}`} />
            </Row>
          ) : null}
        </Space>
      </Card>

      <Card title={t('fromMidi')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <InputNumber value={midi} onChange={setMidi} min={0} max={127} addonBefore="MIDI" style={{ width: 200 }} />
          {fromMidi ? (
            <Row gutter={[12, 12]}>
              <Metric label={t('noteLabel')} value={`${fromMidi.note}${fromMidi.octave}`} />
              <Metric label={t('freqLabel')} value={`${fmt(fromMidi.frequency)} Hz`} />
            </Row>
          ) : null}
        </Space>
      </Card>
    </Space>
  );
}
