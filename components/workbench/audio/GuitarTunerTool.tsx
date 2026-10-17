'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, InputNumber, Space, Typography } from 'antd';
import { AudioOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { ToolPresetBinding, textField, numberField } from '@/components/workbench/ToolPresetBinding';
import { TUNINGS, nearestString, tuningFrequencies } from '@/lib/workbench/tuning';
import { freqToNote } from '@/lib/workbench/noteFreq';
import { ToolHeader } from '../ToolHeader';
import { playTone, startTone } from './audioEngine';
import { useMicAnalyser } from './useMicAnalyser';
import { useLivePitch } from './tuner/useLivePitch';
import { TunerHeaderControls } from './tuner/TunerHeaderControls';
import { TunerStringsList } from './tuner/TunerStringsList';
import { TunerVisualizers } from './tuner/TunerVisualizers';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';

const { Text } = Typography;
const ACCENT = '#14b8a6';
const INSTRUMENTS = Array.from(new Set(TUNINGS.map((t) => t.instrument)));

export function GuitarTunerTool() {
  const t = useTranslations('Workbench.guitarTuner');
  const mic = useMicAnalyser(2048);
  const [instrument, setInstrument] = useState(INSTRUMENTS[0]);
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [a4, setA4] = useState<number | null>(440);
  const [timbre, setTimbre] = useState<OscillatorType>('triangle');
  const [loopIndex, setLoopIndex] = useState<number | null>(null);

  const outCtxRef = useRef<AudioContext | null>(null);
  const stopDroneRef = useRef<(() => void) | null>(null);

  const refA4 = a4 && a4 >= 400 && a4 <= 480 ? a4 : 440;
  const tuning = useMemo(() => TUNINGS.find((x) => x.id === tuningId) ?? TUNINGS[0], [tuningId]);
  const strings = useMemo(() => tuningFrequencies(tuning, refA4), [tuning, refA4]);
  const tuningOptions = useMemo(
    () => TUNINGS.filter((x) => x.instrument === instrument).map((x) => ({ value: x.id, label: x.name })),
    [instrument],
  );

  const detected = useLivePitch(mic.active, mic.getAnalyser(), mic.getContext(), tuning, refA4);

  const ensureContext = useCallback(() => {
    const ctx = outCtxRef.current ?? new AudioContext();
    outCtxRef.current = ctx;
    void ctx.resume();
    return ctx;
  }, []);

  const stopDrone = useCallback(() => {
    stopDroneRef.current?.();
    stopDroneRef.current = null;
  }, []);

  useEffect(() => () => {
    stopDroneRef.current?.();
    void outCtxRef.current?.close().catch(() => null);
  }, []);

  useEffect(() => {
    stopDrone();
    setLoopIndex(null);
  }, [tuningId, timbre, stopDrone]);

  const pluck = useCallback(
    (freq: number) => playTone(ensureContext(), freq, { durationMs: 1100, gain: 0.18, type: timbre }),
    [ensureContext, timbre],
  );

  const toggleLoop = useCallback(
    (index: number, freq: number) => {
      if (loopIndex === index) {
        stopDrone();
        setLoopIndex(null);
        return;
      }
      stopDrone();
      stopDroneRef.current = startTone(ensureContext(), freq, { gain: 0.14, type: timbre });
      setLoopIndex(index);
    },
    [loopIndex, stopDrone, ensureContext, timbre],
  );

  const onInstrumentChange = (next: string) => {
    setInstrument(next);
    const first = TUNINGS.find((x) => x.instrument === next);
    if (first) setTuningId(first.id);
  };

  const near = detected && mic.active ? nearestString(detected.frequency, tuning, refA4) : null;
  const chroma = detected && mic.active ? freqToNote(detected.frequency, refA4) : null;
  const cents = near?.cents ?? 0;
  const inTune = near != null && Math.abs(cents) <= 5;
  const status = near == null ? '' : inTune ? t('inTune') : cents < 0 ? t('tooLow') : t('tooHigh');

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull} style={{ '--accent': ACCENT } as React.CSSProperties}>
      <ToolPresetBinding
        toolId="guitar-tuner"
        fields={{
          instrument: textField(instrument, setInstrument, INSTRUMENTS, false),
          tuningId: textField(tuningId, setTuningId, TUNINGS.map((i) => i.id), false),
          a4: numberField(a4, setA4, 400, 480),
        }}
      />
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
              type={mic.active ? 'default' : 'primary'}
              icon={mic.active ? <StopOutlined /> : <AudioOutlined />}
              onClick={mic.active ? mic.stop : mic.start}
            >{mic.active ? t('micStop') : t('micStart')}</Button>
            <Button icon={<PlayCircleOutlined />} href="/workbench/jam-station">Jam Station</Button>
          </Space>
        }
      />
      <TunerHeaderControls
        instrument={instrument}
        instruments={INSTRUMENTS}
        tuningId={tuningId}
        tuningOptions={tuningOptions}
        timbre={timbre}
        micError={mic.error ? t('micError') : null}
        onInstrument={onInstrumentChange}
        onTuning={setTuningId}
        onTimbre={setTimbre}
      />
      <div className={styles.panelGrid}>
        <TunerStringsList strings={strings} near={near} inTune={inTune} loopIndex={loopIndex} onPluck={pluck} onToggleLoop={toggleLoop} />
        <TunerVisualizers near={near} detected={detected} chroma={chroma} active={mic.active} inTune={inTune} status={status} refA4={refA4} analyser={mic.getAnalyser()} />
      </div>
    </Space>
  );
}
