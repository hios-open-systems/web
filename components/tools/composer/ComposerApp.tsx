'use client';

import { Button, Select, Space, Tooltip } from 'antd';
import { ShareAltOutlined, ApiOutlined } from '@ant-design/icons';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { ToolGuide } from '@/components/workbench/ToolGuide';
import { UrlPresets } from '@/components/common/UrlPresets';
import workbenchStyles from '@/components/workbench/workbench.module.css';
import { FAMOUS_SONGS } from '@/lib/workbench/chiptuneSongs';
import { PianoRoll } from '@/components/workbench/audio/chiptune/PianoRoll';
import { TransportBar } from '@/components/workbench/audio/chiptune/TransportBar';
import { TrackPanel } from '@/components/workbench/audio/chiptune/TrackPanel';
import { useComposerState } from './useComposerState';

/**
 * Compositor Chiptune (rebuild registry-style). Reusa el piano-roll / synth /
 * export que ya funcionaban; agrega share por URL, "exportar para device" y los
 * sistemas de workbench (ToolGuide, UrlPresets). El estado vive en useComposerState.
 */
export function ComposerApp() {
  const c = useComposerState();

  return (
    <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
      {c.contextHolder}
      <ToolHeader
        eyebrow="Audio Lab"
        title="Compositor Chiptune"
        description="Compone música de videojuego retro en un piano-roll, escuchala en el navegador y mandala al parlante HIOS. Todo local."
        locality="local"
      />

      <ToolGuide guideId="composer" />

      <Space wrap>
        <Select
          placeholder="Cargar canción…"
          style={{ minWidth: 220 }}
          value={null}
          onChange={(id) => {
            const found = FAMOUS_SONGS.find((s) => s.id === id);
            if (found) c.resetTo(found.make());
          }}
          options={FAMOUS_SONGS.map((s) => ({ value: s.id, label: s.label }))}
        />
        <UrlPresets storageKey="composer" />
        <Tooltip title="Copia un link con la canción entera adentro para compartirla o retomarla.">
          <Button icon={<ShareAltOutlined />} onClick={c.copyShareLink}>Compartir link</Button>
        </Tooltip>
        <Tooltip title="Descarga el .json y lo copia al portapapeles. Pegalo en la página del device (http://hioschip.local) para que suene en el parlante.">
          <Button icon={<ApiOutlined />} onClick={c.exportDevice}>
            {c.deviceCopied ? '✓ Copiado para device' : 'Exportar para device'}
          </Button>
        </Tooltip>
      </Space>

      <TransportBar
        bpm={c.song.bpm}
        lengthBars={c.song.lengthBars}
        isPlaying={c.isPlaying}
        loop={c.loop}
        rendering={c.rendering}
        onPlay={c.play}
        onStop={c.stop}
        onToggleLoop={c.toggleLoop}
        onBpm={c.setBpm}
        onLength={c.setLength}
        onExportMidi={c.exportMidi}
        onExportWav={c.exportWav}
        onLoadDemo={c.loadDemo}
        onClear={c.clear}
      />
      <TrackPanel
        song={c.song}
        activeTrackId={c.activeTrackId}
        onActivate={c.setActiveTrackId}
        onInstrument={c.onInstrument}
        onMute={c.onMute}
        onVolume={c.onVolume}
        onAddTrack={c.onAddTrack}
        onRemoveTrack={c.onRemoveTrack}
      />
      <PianoRoll
        song={c.song}
        activeTrackId={c.activeTrackId}
        selectedNoteId={c.selectedNoteId}
        onSelectNote={c.setSelectedNoteId}
        onChangeNote={c.onChangeNote}
        onDeleteNote={c.onDeleteNote}
        onAddNote={c.onAddNote}
        getPlayheadTicks={c.getPlayheadTicks}
        isPlaying={c.isPlaying}
      />
    </Space>
  );
}
