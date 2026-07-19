'use client';

import { useCallback, useEffect, useState } from 'react';
import { Space } from 'antd';
import { ToolHeader } from '../ToolHeader';
import workbenchStyles from '../workbench.module.css';
import {
  createSong,
  createDemoSong,
  createTrack,
  readSong,
  writeSong,
  clamp,
  type ChiptuneNote,
  type ChiptuneSong,
  type ChiptuneTrack,
  type InstrumentId,
} from '@/lib/workbench/chiptune';
import { encodeMidi } from '@/lib/workbench/chiptuneMidi';
import { downloadBlob } from '@/lib/workbench/download';
import { renderSongToWav } from './chiptune/render';
import { usePlayback } from './chiptune/usePlayback';
import { PianoRoll } from './chiptune/PianoRoll';
import { TransportBar } from './chiptune/TransportBar';
import { TrackPanel } from './chiptune/TrackPanel';

const slugify = (name: string): string =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cancion';

const withTrack = (song: ChiptuneSong, id: string, fn: (track: ChiptuneTrack) => ChiptuneTrack): ChiptuneSong => ({
  ...song,
  tracks: song.tracks.map((track) => (track.id === id ? fn(track) : track)),
});

export function ChiptuneTool() {
  const [song, setSong] = useState<ChiptuneSong>(() => readSong() ?? createDemoSong());
  const [activeTrackId, setActiveTrackId] = useState<string>(() => song.tracks[0]?.id ?? '');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const { isPlaying, loop, play, stop, toggleLoop, getPlayheadTicks } = usePlayback(song);

  const update = useCallback((fn: (song: ChiptuneSong) => ChiptuneSong) => {
    setSong((prev) => ({ ...fn(prev), updatedAt: Date.now() }));
  }, []);

  const patchActiveNotes = useCallback(
    (fn: (notes: ChiptuneNote[]) => ChiptuneNote[]) =>
      update((song) => withTrack(song, activeTrackId, (track) => ({ ...track, notes: fn(track.notes) }))),
    [activeTrackId, update],
  );

  const onAddNote = useCallback((note: ChiptuneNote) => {
    patchActiveNotes((notes) => [...notes, note]);
    setSelectedNoteId(note.id);
  }, [patchActiveNotes]);
  const onChangeNote = useCallback(
    (id: string, patch: Partial<ChiptuneNote>) =>
      patchActiveNotes((notes) => notes.map((note) => (note.id === id ? { ...note, ...patch } : note))),
    [patchActiveNotes],
  );
  const onDeleteNote = useCallback((id: string) => patchActiveNotes((notes) => notes.filter((note) => note.id !== id)), [patchActiveNotes]);

  const onInstrument = useCallback((id: string, instrument: InstrumentId) => update((song) => withTrack(song, id, (track) => ({ ...track, instrument }))), [update]);
  const onMute = useCallback((id: string) => update((song) => withTrack(song, id, (track) => ({ ...track, muted: !track.muted }))), [update]);
  const onVolume = useCallback((id: string, volume: number) => update((song) => withTrack(song, id, (track) => ({ ...track, volume }))), [update]);
  const onAddTrack = useCallback(() => update((song) => ({ ...song, tracks: [...song.tracks, createTrack(`Pista ${song.tracks.length + 1}`, 'pulse-lead')] })), [update]);
  const onRemoveTrack = useCallback((id: string) => update((song) => ({ ...song, tracks: song.tracks.filter((track) => track.id !== id) })), [update]);

  const resetTo = useCallback((next: ChiptuneSong) => {
    stop();
    setSong(next);
    setActiveTrackId(next.tracks[0]?.id ?? '');
    setSelectedNoteId(null);
  }, [stop]);

  const exportMidi = useCallback(() => downloadBlob(encodeMidi(song), `${slugify(song.name)}.mid`, 'audio/midi'), [song]);
  const exportWav = useCallback(async () => {
    setRendering(true);
    try {
      downloadBlob(await renderSongToWav(song), `${slugify(song.name)}.wav`, 'audio/wav');
    } finally {
      setRendering(false);
    }
  }, [song]);

  useEffect(() => {
    const id = window.setTimeout(() => writeSong(song), 400);
    return () => window.clearTimeout(id);
  }, [song]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || !selectedNoteId) return;
      event.preventDefault();
      onDeleteNote(selectedNoteId);
      setSelectedNoteId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNoteId, onDeleteNote]);

  return (
    <Space direction="vertical" size={16} className={workbenchStyles.stackFull}>
      <ToolHeader
        eyebrow="Audio Lab"
        title="Compositor Chiptune"
        description="Compone música de videojuego retro en un piano-roll con voces sintetizadas estilo 8-bit y exportá a .mid y .wav — todo local, en el navegador."
        locality="local"
      />
      <TransportBar
        bpm={song.bpm}
        lengthBars={song.lengthBars}
        isPlaying={isPlaying}
        loop={loop}
        rendering={rendering}
        onPlay={play}
        onStop={stop}
        onToggleLoop={toggleLoop}
        onBpm={(value) => update((song) => ({ ...song, bpm: clamp(value, 40, 300) }))}
        onLength={(value) => update((song) => ({ ...song, lengthBars: clamp(value, 1, 16) }))}
        onExportMidi={exportMidi}
        onExportWav={exportWav}
        onLoadDemo={() => resetTo(createDemoSong())}
        onClear={() => resetTo(createSong())}
      />
      <TrackPanel
        song={song}
        activeTrackId={activeTrackId}
        onActivate={setActiveTrackId}
        onInstrument={onInstrument}
        onMute={onMute}
        onVolume={onVolume}
        onAddTrack={onAddTrack}
        onRemoveTrack={onRemoveTrack}
      />
      <PianoRoll
        song={song}
        activeTrackId={activeTrackId}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onChangeNote={onChangeNote}
        onDeleteNote={onDeleteNote}
        onAddNote={onAddNote}
        getPlayheadTicks={getPlayheadTicks}
        isPlaying={isPlaying}
      />
    </Space>
  );
}
