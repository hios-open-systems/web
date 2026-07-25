'use client';

import { useState } from 'react';
import { Button, Input, InputNumber, Select, Slider, Space, Tooltip, Typography } from 'antd';
import {
  ShareAltOutlined, ApiOutlined, DeleteOutlined, CopyOutlined,
  UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
} from '@ant-design/icons';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { ToolGuide } from '@/components/workbench/ToolGuide';
import { UrlPresets } from '@/components/common/UrlPresets';
import workbenchStyles from '@/components/workbench/workbench.module.css';
import { FAMOUS_SONGS } from '@/lib/workbench/chiptuneSongs';
import { TICKS_PER_STEP } from '@/lib/workbench/chiptune';
import { PianoRoll } from '@/components/workbench/audio/chiptune/PianoRoll';
import { TransportBar } from '@/components/workbench/audio/chiptune/TransportBar';
import { TrackPanel } from '@/components/workbench/audio/chiptune/TrackPanel';
import { useComposerState } from './useComposerState';

const { Text } = Typography;

const zone: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--hios-border)',
  background: 'var(--hios-bg-elevated, var(--hios-bg-secondary))',
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

/**
 * Compositor Chiptune (versión pro). Reusa el piano-roll / synth / export; agrega
 * timbres editables, undo/redo, inspector de nota, zoom, regla+seek, solo/rename,
 * master vol, título editable y toasts. Todo client-side. Estado en useComposerState.
 */
export function ComposerApp() {
  const c = useComposerState();
  const [zoom, setZoom] = useState(1);
  const [fillStep, setFillStep] = useState(240); // corchea por defecto
  const [sectionName, setSectionName] = useState('');

  const patterns = c.song.patterns ?? [];
  const arrangement = c.song.arrangement ?? [];
  const patternName = (id: string) => patterns.find((p) => p.id === id)?.name ?? '(borrada)';

  const FIGURES = [
    { value: 1920, label: 'Redonda' },
    { value: 960, label: 'Blanca' },
    { value: 480, label: 'Negra' },
    { value: 240, label: 'Corchea' },
    { value: 120, label: 'Semicorchea' },
  ];

  const activeTrack = c.song.tracks.find((t) => t.id === c.activeTrackId);
  const selNote = activeTrack?.notes.find((n) => n.id === c.selectedNoteId);

  return (
    <Space direction="vertical" size={14} className={workbenchStyles.stackFull}>
      {c.contextHolder}
      <ToolHeader
        eyebrow="Audio Lab"
        title="Compositor Chiptune"
        description="Compone música de videojuego retro en un piano-roll, editá los timbres, escuchala en el navegador y mandala al parlante HIOS. Todo local."
        locality="local"
      />

      <ToolGuide guideId="composer" />

      {/* Zona: canción / biblioteca / compartir / exportar / historial */}
      <div style={zone}>
        <Space wrap size={8} align="center">
          <Text type="secondary">Canción</Text>
          <Typography.Title level={5} style={{ margin: 0 }} editable={{ onChange: c.setName }}>
            {c.song.name}
          </Typography.Title>
          <Tooltip title="Deshacer (Ctrl/Cmd+Z)">
            <Button icon={<UndoOutlined />} disabled={!c.canUndo} onClick={c.undo} />
          </Tooltip>
          <Tooltip title="Rehacer (Shift+Ctrl/Cmd+Z)">
            <Button icon={<RedoOutlined />} disabled={!c.canRedo} onClick={c.redo} />
          </Tooltip>
        </Space>
        <Space wrap size={8} style={{ marginTop: 10 }}>
          <Select
            placeholder="Cargar canción…"
            style={{ minWidth: 180, maxWidth: '100%' }}
            value={null}
            onChange={(id) => {
              const found = FAMOUS_SONGS.find((s) => s.id === id);
              if (found) c.resetTo(found.make());
            }}
            options={FAMOUS_SONGS.map((s) => ({ value: s.id, label: s.label }))}
          />
          <UrlPresets storageKey="composer" />
          <Tooltip title="Copia un link con la canción entera adentro.">
            <Button icon={<ShareAltOutlined />} onClick={c.copyShareLink}>Compartir</Button>
          </Tooltip>
          <Tooltip title="Descarga el .json y lo copia. Pegalo en http://hioschip.local para que suene en el parlante.">
            <Button icon={<ApiOutlined />} onClick={c.exportDevice}>
              {c.deviceCopied ? '✓ Device' : 'Exportar para device'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Zona: transporte */}
      <div style={zone}>
        <TransportBar
          bpm={c.song.bpm}
          lengthBars={c.song.lengthBars}
          ppq={c.song.ppq}
          beatsPerBar={c.song.beatsPerBar}
          isPlaying={c.isPlaying}
          loop={c.loop}
          metronome={c.metronome}
          rendering={c.rendering}
          masterVolume={c.masterVolume}
          getPlayheadTicks={c.getPlayheadTicks}
          onPlay={c.play}
          onStop={c.stop}
          onToggleLoop={c.toggleLoop}
          onToggleMetronome={c.toggleMetronome}
          onBpm={c.setBpm}
          onLength={c.setLength}
          onMasterVolume={c.setMasterVolume}
          onExportMidi={c.exportMidi}
          onExportWav={c.exportWav}
          onExportMp3={c.exportMp3}
          onLoadDemo={c.loadDemo}
          onClear={c.clear}
        />
      </div>

      {/* Zona: pistas */}
      <div style={zone}>
        <TrackPanel
          song={c.song}
          activeTrackId={c.activeTrackId}
          onActivate={c.setActiveTrackId}
          onInstrument={c.onInstrument}
          onMute={c.onMute}
          onSolo={c.onSolo}
          onVolume={c.onVolume}
          onRename={c.onRenameTrack}
          onTimbre={c.onTimbre}
          onResetTimbre={c.onResetTimbre}
          onAddTrack={c.onAddTrack}
          onRemoveTrack={c.onRemoveTrack}
        />
      </div>

      {/* Zona: secciones (patterns) + arreglo + compilar */}
      <div style={zone}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space wrap size={8} align="center">
            <Text type="secondary">Secciones</Text>
            <Input
              size="small"
              placeholder="nombre de la sección"
              style={{ width: 180 }}
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
            <Tooltip title="Guarda las pistas actuales como una sección reusable.">
              <Button size="small" onClick={() => { c.saveAsPattern(sectionName); setSectionName(''); }}>
                Guardar sección
              </Button>
            </Tooltip>
          </Space>

          {patterns.length > 0 && (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {patterns.map((p) => (
                <Space key={p.id} wrap size={6}>
                  <Text style={{ minWidth: 120 }}>{p.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{p.lengthBars} comp.</Text>
                  <Button size="small" onClick={() => c.loadPattern(p.id)}>Cargar</Button>
                  <Button size="small" onClick={() => c.addClip(p.id)}>+ arreglo</Button>
                  <Button size="small" danger onClick={() => c.deletePattern(p.id)}>Borrar</Button>
                </Space>
              ))}
            </Space>
          )}

          {arrangement.length > 0 && (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>Arreglo (patrón · compás de inicio)</Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {arrangement.map((clip) => (
                  <Space key={clip.id} wrap size={6}>
                    <Text style={{ minWidth: 120 }}>{patternName(clip.patternId)}</Text>
                    <InputNumber size="small" min={0} value={clip.startBar} onChange={(v) => c.setClipBar(clip.id, Number(v) || 0)} />
                    <Button size="small" danger onClick={() => c.removeClip(clip.id)}>Quitar</Button>
                  </Space>
                ))}
              </Space>
              <Button type="primary" onClick={c.compileArrangementNow}>Compilar arreglo → piano-roll</Button>
            </>
          )}
        </Space>
      </div>

      {/* Zona: editor (zoom + inspector + piano-roll) */}
      <div style={zone}>
        <Space wrap size={8} style={{ marginBottom: 10 }}>
          <Text type="secondary">Zoom</Text>
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))} />
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tocá para agregar · arrastrá horizontal para seleccionar un rango · seleccioná una nota y editá abajo.
          </Text>
        </Space>

        <Space wrap size={8} style={{ marginBottom: 10 }}>
          <Text type="secondary">Patrón</Text>
          <Tooltip title="Repite el rango seleccionado (o toda la pista) hasta el final de la canción.">
            <Button size="small" onClick={c.repeatSelection}>Repetir</Button>
          </Tooltip>
          <Select
            size="small"
            style={{ minWidth: 130 }}
            value={fillStep}
            onChange={setFillStep}
            options={FIGURES}
          />
          <Tooltip title="Rellena el rango (o la canción) con esa figura, en el tono de la nota seleccionada.">
            <Button size="small" onClick={() => c.fillActiveTrack(fillStep)}>Rellenar</Button>
          </Tooltip>
          {c.selectedRange && (
            <Button size="small" type="text" onClick={() => c.setSelectedRange(null)}>Limpiar rango</Button>
          )}
        </Space>

        {selNote && activeTrack && (
          <Space wrap size={10} align="center" style={{ marginBottom: 10 }}>
            <Text strong style={{ fontSize: 12 }}>Nota</Text>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tono</Text>
              <InputNumber size="small" min={0} max={127} value={selNote.pitch}
                onChange={(v) => c.onChangeNote(selNote.id, { pitch: Number(v) })} />
            </Space>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>Inicio</Text>
              <InputNumber size="small" min={0} value={Math.round(selNote.start / TICKS_PER_STEP)}
                onChange={(v) => c.onChangeNote(selNote.id, { start: Number(v) * TICKS_PER_STEP })} />
            </Space>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>Largo</Text>
              <InputNumber size="small" min={1} value={Math.round(selNote.duration / TICKS_PER_STEP)}
                onChange={(v) => c.onChangeNote(selNote.id, { duration: Math.max(1, Number(v)) * TICKS_PER_STEP })} />
            </Space>
            <Space size={4} style={{ minWidth: 160 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Vel</Text>
              <Slider style={{ width: 100 }} min={1} max={127} value={selNote.velocity}
                onChange={(v) => c.onChangeNote(selNote.id, { velocity: v })} />
            </Space>
            <Tooltip title="Duplicar (Ctrl/Cmd+D)">
              <Button size="small" icon={<CopyOutlined />} onClick={c.duplicateNote} />
            </Tooltip>
            <Button size="small" danger icon={<DeleteOutlined />}
              onClick={() => { c.onDeleteNote(selNote.id); c.setSelectedNoteId(null); }}>
              Eliminar
            </Button>
          </Space>
        )}

        <PianoRoll
          song={c.song}
          activeTrackId={c.activeTrackId}
          selectedNoteId={c.selectedNoteId}
          selectedRange={c.selectedRange}
          zoom={zoom}
          onRange={c.setSelectedRange}
          onSelectNote={c.selectNote}
          onChangeNote={c.onChangeNote}
          onDeleteNote={c.onDeleteNote}
          onAddNote={c.onAddNote}
          onSeek={c.seek}
          getPlayheadTicks={c.getPlayheadTicks}
          isPlaying={c.isPlaying}
        />
      </div>
    </Space>
  );
}
