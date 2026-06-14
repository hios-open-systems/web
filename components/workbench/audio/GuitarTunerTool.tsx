'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, InputNumber, Select, Space, Typography } from 'antd';
import { AudioOutlined, CheckCircleFilled, SoundOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import {
  TUNINGS,
  instrumentRange,
  nearestString,
  tuningFrequencies,
} from '@/lib/workbench/tuning';
import { detectPitch } from '@/lib/workbench/pitch';
import { freqToNote } from '@/lib/workbench/noteFreq';
import { ToolHeader } from '../ToolHeader';
import { playTone } from './audioEngine';
import { useMicAnalyser } from './useMicAnalyser';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;

const ACCENT = '#14b8a6';
const INSTRUMENTS = Array.from(new Set(TUNINGS.map((t) => t.instrument)));
const clampCents = (c: number) => Math.max(-50, Math.min(50, c));

export function GuitarTunerTool() {
  const t = useTranslations('Workbench.guitarTuner');
  const mic = useMicAnalyser(2048);
  const { active, getAnalyser, getContext } = mic;

  const [instrument, setInstrument] = useState(INSTRUMENTS[0]);
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [a4, setA4] = useState<number | null>(440);
  const [detected, setDetected] = useState<{ frequency: number; clarity: number } | null>(null);

  const outCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);

  const refA4 = a4 && a4 >= 400 && a4 <= 480 ? a4 : 440;
  const tuning = useMemo(() => TUNINGS.find((x) => x.id === tuningId) ?? TUNINGS[0], [tuningId]);
  const strings = useMemo(() => tuningFrequencies(tuning, refA4), [tuning, refA4]);
  const tuningOptions = useMemo(
    () => TUNINGS.filter((x) => x.instrument === instrument).map((x) => ({ value: x.id, label: x.name })),
    [instrument],
  );

  // Live pitch loop — reads the shared analyser, runs the improved detector
  // bounded to the instrument's range, and stores the result each frame.
  useEffect(() => {
    if (!active) {
      setDetected(null);
      return;
    }
    const range = instrumentRange(tuning, refA4);
    const buffer = new Float32Array(2048);
    const tick = () => {
      const analyser = getAnalyser();
      const context = getContext();
      if (analyser && context) {
        analyser.getFloatTimeDomainData(buffer);
        setDetected(detectPitch(buffer, context.sampleRate, { minHz: range.minHz, maxHz: range.maxHz }));
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, getAnalyser, getContext, tuning, refA4]);

  useEffect(() => () => void outCtxRef.current?.close().catch(() => null), []);

  const playString = useCallback((freq: number) => {
    const context = outCtxRef.current ?? new AudioContext();
    outCtxRef.current = context;
    void context.resume();
    playTone(context, freq, { durationMs: 1100, gain: 0.18 });
  }, []);

  const onInstrument = (next: string) => {
    setInstrument(next);
    const first = TUNINGS.find((x) => x.instrument === next);
    if (first) setTuningId(first.id);
  };

  const near = detected && active ? nearestString(detected.frequency, tuning, refA4) : null;
  const chroma = detected && active ? freqToNote(detected.frequency, refA4) : null;
  const cents = near?.cents ?? 0;
  const inTune = near != null && Math.abs(cents) <= 5;
  const status = !near
    ? t('listening')
    : inTune
      ? t('inTune')
      : cents < 0
        ? t('tooLow')
        : t('tooHigh');

  return (
    <Space
      direction="vertical"
      size={20}
      className={workbenchStyles.stackFull}
      style={{ '--accent': ACCENT } as React.CSSProperties}
    >
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="guitarTuner"
        actions={
          <Space align="center" wrap>
            <Text className={styles.statLabel}>{t('a4Label')}</Text>
            <InputNumber value={a4} onChange={setA4} min={400} max={480} addonAfter="Hz" />
            <Button
              type={active ? 'default' : 'primary'}
              icon={active ? <StopOutlined /> : <AudioOutlined />}
              onClick={active ? mic.stop : mic.start}
            >
              {active ? t('micStop') : t('micStart')}
            </Button>
          </Space>
        }
      />

      <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 16 } }}>
        <div className={styles.tunerControls}>
          <div className={styles.tunerField}>
            <Text className={styles.statLabel}>{t('instrumentLabel')}</Text>
            <Select
              value={instrument}
              onChange={onInstrument}
              options={INSTRUMENTS.map((id) => ({ value: id, label: t(`instruments.${id}`) }))}
            />
          </div>
          <div className={styles.tunerField}>
            <Text className={styles.statLabel}>{t('tuningLabel')}</Text>
            <Select value={tuningId} onChange={setTuningId} options={tuningOptions} />
          </div>
          <Text type="secondary" style={{ alignSelf: 'center' }}>
            <SoundOutlined /> {t('stringHint')}
          </Text>
        </div>
        {mic.error ? (
          <Text type="danger" style={{ display: 'block', marginTop: 12 }}>
            {t('micError')}
          </Text>
        ) : null}
      </Card>

      <div className={styles.panelGrid}>
        <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 16 } }}>
          <div className={styles.stringList}>
            {strings.map((s, i) => {
              const isNear = near?.index === i;
              const tuned = isNear && inTune;
              return (
                <button
                  key={`${s.label}-${i}`}
                  type="button"
                  className={`${styles.stringRow} ${isNear ? styles.stringRowActive : ''} ${tuned ? styles.stringInTune : ''}`}
                  onClick={() => playString(s.freq)}
                  aria-label={`${s.label} · ${s.freq.toFixed(1)} Hz`}
                >
                  <span className={styles.stringLabel}>{s.label}</span>
                  <span className={styles.stringLine} style={{ height: 2 + (strings.length - i) }} />
                  <span className={styles.stringFreq}>{s.freq.toFixed(1)} Hz</span>
                  <span className={styles.stringCheck}>{tuned ? <CheckCircleFilled /> : null}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`} styles={{ body: { padding: 16 } }}>
          <div className={styles.readout}>
            <span className={styles.note} style={{ color: inTune ? '#22c55e' : undefined }}>
              {near ? near.label : '--'}
            </span>
            <span className={styles.frequency}>
              {detected && active ? `${detected.frequency.toFixed(1)} Hz` : t('listening')}
            </span>
            <div className={styles.needleTrack} aria-hidden>
              <span className={styles.needle} style={{ left: `${50 + clampCents(cents)}%` }} />
            </div>
            <Text strong style={{ color: inTune ? '#22c55e' : undefined }}>
              {status}
            </Text>
            <div className={styles.statGrid}>
              <span className={styles.stat}>
                <span className={styles.statLabel}>{t('chromaticLabel')}</span>
                <span className={styles.statValue}>{chroma ? `${chroma.note}${chroma.octave}` : '-'}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>{t('centsLabel')}</span>
                <span className={styles.statValue}>{near ? `${cents > 0 ? '+' : ''}${cents}` : '-'}</span>
              </span>
              <span className={styles.stat}>
                <span className={styles.statLabel}>{t('referenceLabel')}</span>
                <span className={styles.statValue}>A4 {refA4}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Space>
  );
}
