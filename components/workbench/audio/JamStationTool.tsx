'use client';

import React from 'react';
import { Button, Card, Typography } from 'antd';
import { SoundOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { ToolHeader } from '../ToolHeader.tsx';
import { useJamPlayback } from '@/lib/workbench/useJamPlayback.ts';
import { getChordDetails } from '@/lib/workbench/jamStyles.ts';
import { JamControls } from './jam/JamControls.tsx';
import { ChordDisplay } from './jam/ChordDisplay.tsx';
import { GuitarFretboard } from './jam/GuitarFretboard.tsx';
import styles from './jam/jamStation.module.css';

const { Text, Title } = Typography;

export function JamStationTool() {
  const jam = useJamPlayback();
  const activeChord = jam.style.bars[jam.currentBar % jam.style.bars.length];
  const { chordTones } = getChordDetails(jam.keyRoot, activeChord);
  const rootName = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][jam.keyRoot];
  const rootFret6 = (jam.keyRoot - 4 + 12) % 12;
  const fretDesc = rootFret6 === 0 ? 'traste 0 (al aire) o traste 12' : `traste ${rootFret6}`;

  return (
    <div className={styles.jamContainer}>
      <ToolHeader
        eyebrow="Audio & Habilidades Musicales"
        title="Jam Station & Backing Tracks"
        description="Generador de bases rítmicas e improvisación para guitarristas y músicos. Practicá solos y escalas sobre progresiones reales en tiempo real."
        locality="local"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="small" icon={<SoundOutlined />} href="/workbench/guitar-tuner">
              Afinador de guitarra
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} href="/composer">
              Compositor retro
            </Button>
          </div>
        }
      />

      <JamControls
        isPlaying={jam.isPlaying}
        onPlay={jam.play}
        onStop={jam.stop}
        style={jam.style}
        onSelectStyle={jam.selectStyle}
        keyRoot={jam.keyRoot}
        onSelectKeyRoot={jam.setKeyRoot}
        scale={jam.scale}
        onSelectScale={jam.setScale}
        bpm={jam.bpm}
        onBpmChange={jam.setBpm}
        volume={jam.volume}
        onVolumeChange={jam.setVolume}
      />

      <Card title="Armonía y Progresión de Acordes" size="small" styles={{ body: { padding: 16 } }}>
        <ChordDisplay
          style={jam.style}
          keyRoot={jam.keyRoot}
          currentBar={jam.currentBar}
          currentBeat={jam.currentBeat}
        />
      </Card>

      <Card
        title={`Diapasón Interactivo: ${jam.scale.name}`}
        size="small"
        styles={{ body: { padding: 16 } }}
        extra={<span style={{ fontSize: 12, opacity: 0.7 }}>Hacé clic en cualquier nota para escucharla</span>}
      >
        <GuitarFretboard
          rootPitchClass={jam.keyRoot}
          scale={jam.scale}
          activeChordTones={chordTones}
          onPluckNote={jam.pluck}
        />
      </Card>

      <Card size="small" styles={{ body: { padding: '14px 20px' } }}>
        <Title level={5} style={{ margin: '0 0 6px', color: '#f59e0b' }}>
          💡 Consejos para improvisar y crear solos
        </Title>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', lineHeight: 1.6 }}>
          1. <strong>Notas del acorde (Target Notes):</strong> Las notas resaltadas en celeste son las notas del acorde que suena en cada compás. Terminar tus frases en una de esas notas hace que el solo suene conectado a la armonía.<br />
          2. <strong>Tónica (Root):</strong> El punto de máxima estabilidad está marcado en dorado. Ideal para iniciar y resolver frases.<br />
          3. <strong>Blue Note:</strong> Si usás la escala de blues, la nota rosa (quinta disminuida / tritono) aporta el toque de tensión característico.<br />
          4. <strong>Patrón de digitación:</strong> La Posición 1 de {rootName} arranca con la tónica en la 6ª cuerda ({fretDesc}).
        </Text>
      </Card>
    </div>
  );
}
