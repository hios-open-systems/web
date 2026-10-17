'use client';

import React from 'react';
import { Button, message, Typography } from 'antd';
import { SoundOutlined, ThunderboltOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader.tsx';
import { useBeatmakerPlayback } from '@/lib/workbench/useBeatmakerPlayback.ts';
import { useBeatmakerState } from './beatmaker/useBeatmakerState.ts';
import { BeatControls } from './beatmaker/BeatControls.tsx';
import { BeatVisualizer } from './beatmaker/BeatVisualizer.tsx';
import { DrumPadGrid } from './beatmaker/DrumPadGrid.tsx';
import { BeatShareModal } from './beatmaker/BeatShareModal.tsx';
import styles from './beatmaker/beatmaker.module.css';

const { Text } = Typography;

export function BeatmakerTool() {
  const {
    project,
    setProject,
    shareOpen,
    setShareOpen,
    toggleStep,
    cycleStepDetail,
    toggleMute,
    toggleSolo,
    selectPreset,
    fork,
    clear,
  } = useBeatmakerState();

  const playback = useBeatmakerPlayback(project);

  const handleExportWav = async () => {
    try {
      const blob = await playback.exportWav(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Audio WAV descargado');
    } catch {
      message.error('Error al exportar audio');
    }
  };

  return (
    <div className={styles.container}>
      <ToolHeader
        eyebrow="Audio & Músicos"
        title="Beatmaker & Looper DAW"
        description="Estación de loops urbanos para Trap, BoomBap, Rap y Freestyle en el navegador. Creá bases, forkeá versiones de la comunidad y descargá el audio sin instalar nada."
        locality="local"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="small" icon={<CustomerServiceOutlined />} href="/workbench/jam-station">
              Jam Station
            </Button>
            <Button size="small" icon={<SoundOutlined />} href="/workbench/guitar-tuner">
              Afinador
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} href="/composer">
              Compositor retro
            </Button>
          </div>
        }
      />

      {project.forkedFrom && (
        <div style={{ padding: '8px 14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8 }}>
          <Text style={{ fontSize: 13, color: '#f59e0b' }}>
            🌿 Versión derivada (Fork) de <strong>{project.forkedFrom}</strong>. Podés modificar los ritmos y compartir tu remix con un enlace nuevo.
          </Text>
        </div>
      )}

      <BeatControls
        project={project}
        isPlaying={playback.isPlaying}
        masterVolume={playback.masterVolume}
        onPlay={playback.play}
        onStop={playback.stop}
        onVolumeChange={playback.setMasterVolume}
        onBpmChange={(bpm) => setProject((p) => ({ ...p, bpm }))}
        onSwingChange={(swing) => setProject((p) => ({ ...p, swing }))}
        onSelectPreset={selectPreset}
        onFork={fork}
        onShare={() => setShareOpen(true)}
        onExportWav={handleExportWav}
        onClear={clear}
      />

      <BeatVisualizer analyserRef={playback.analyserRef} isPlaying={playback.isPlaying} />

      <DrumPadGrid
        project={project}
        currentStep={playback.currentStep}
        isPlaying={playback.isPlaying}
        onToggleStep={toggleStep}
        onCycleStepDetail={cycleStepDetail}
        onPreview={playback.previewSound}
        onToggleMute={toggleMute}
        onToggleSolo={toggleSolo}
      />

      <BeatShareModal open={shareOpen} project={project} onClose={() => setShareOpen(false)} />
    </div>
  );
}
