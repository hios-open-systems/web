'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Space } from 'antd';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import styles from './audioTools.module.css';
import { SignalGeneratorControls } from './SignalGeneratorControls';
import { SignalGeneratorReadout } from './SignalGeneratorReadout';
import { createNoiseBuffer, getChannelPan, type ChannelTarget, type NoiseKind, type SignalMode } from './signalGeneratorCore';

export function ToneGeneratorTool() {
  const [mode, setMode] = useState<SignalMode>('tone');
  const [frequency, setFrequency] = useState(440);
  const [gain, setGain] = useState(0.18);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [noise, setNoise] = useState<NoiseKind>('pink');
  const [sweepStart, setSweepStart] = useState(80);
  const [sweepEnd, setSweepEnd] = useState(12000);
  const [sweepDuration, setSweepDuration] = useState(8);
  const [channel, setChannel] = useState<ChannelTarget>('left');
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioScheduledSourceNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    try {
      sourceRef.current?.stop();
    } catch {
      /* source may already be stopped */
    }
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    pannerRef.current?.disconnect();
    sourceRef.current = null;
    oscillatorRef.current = null;
    gainRef.current = null;
    pannerRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    oscillatorRef.current?.frequency.setTargetAtTime(frequency, contextRef.current?.currentTime ?? 0, 0.01);
  }, [frequency]);

  useEffect(() => {
    if (oscillatorRef.current) oscillatorRef.current.type = waveform;
  }, [waveform]);

  useEffect(() => {
    gainRef.current?.gain.setTargetAtTime(gain, contextRef.current?.currentTime ?? 0, 0.01);
  }, [gain]);

  useEffect(() => {
    pannerRef.current?.pan.setTargetAtTime(getChannelPan(channel), contextRef.current?.currentTime ?? 0, 0.01);
  }, [channel]);

  useEffect(() => () => stop(), [stop]);

  const connect = (source: AudioScheduledSourceNode, gainNode: GainNode, context: AudioContext) => {
    const panner = context.createStereoPanner();
    panner.pan.value = mode === 'channel' ? getChannelPan(channel) : 0;
    source.connect(gainNode).connect(panner).connect(context.destination);
    pannerRef.current = panner;
  };

  const start = async () => {
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    await context.resume();
    const gainNode = context.createGain();
    gainNode.gain.value = gain;
    gainRef.current = gainNode;

    if (mode === 'noise') {
      const source = context.createBufferSource();
      source.buffer = createNoiseBuffer(context, noise);
      source.loop = true;
      connect(source, gainNode, context);
      source.start();
      sourceRef.current = source;
    } else {
      const oscillator = context.createOscillator();
      oscillator.type = mode === 'channel' ? 'sine' : waveform;
      oscillator.frequency.value = mode === 'sweep' ? sweepStart : frequency;
      if (mode === 'sweep') {
        oscillator.frequency.exponentialRampToValueAtTime(sweepEnd, context.currentTime + sweepDuration);
        timerRef.current = window.setTimeout(stop, sweepDuration * 1000);
      }
      connect(oscillator, gainNode, context);
      oscillator.start();
      oscillatorRef.current = oscillator;
      sourceRef.current = oscillator;
    }
    setPlaying(true);
  };

  const updateMode = (next: SignalMode) => {
    if (playing) stop();
    setMode(next);
  };

  return (
    <Space direction="vertical" size={20} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Generador de señal"
        description="Generador local de tonos, ruido, sweeps y pruebas L/R para revisar parlantes, DACs y cadenas de audio."
        locality="local"
      />
      <div className={styles.panelGrid}>
        <Card className={`${workbenchStyles.sectionCard} ${styles.meterCard}`}>
          <SignalGeneratorControls
            mode={mode}
            playing={playing}
            frequency={frequency}
            gain={gain}
            waveform={waveform}
            noise={noise}
            sweepStart={sweepStart}
            sweepEnd={sweepEnd}
            sweepDuration={sweepDuration}
            channel={channel}
            onToggle={playing ? stop : start}
            onModeChange={updateMode}
            onFrequencyChange={setFrequency}
            onGainChange={setGain}
            onWaveformChange={setWaveform}
            onNoiseChange={setNoise}
            onSweepStartChange={setSweepStart}
            onSweepEndChange={setSweepEnd}
            onSweepDurationChange={setSweepDuration}
            onChannelChange={setChannel}
          />
        </Card>
        <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`}>
          <SignalGeneratorReadout
            mode={mode}
            frequency={frequency}
            gain={gain}
            waveform={waveform}
            noise={noise}
            sweepStart={sweepStart}
            sweepEnd={sweepEnd}
            sweepDuration={sweepDuration}
            channel={channel}
          />
        </Card>
      </div>
    </Space>
  );
}
