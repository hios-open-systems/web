'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { message } from 'antd';
import {
  createSong,
  createDemoSong,
  createTrack,
  readSong,
  writeSong,
  serializeDeviceSong,
  type ChiptuneNote,
  type ChiptuneSong,
  type ChiptuneTrack,
  type InstrumentId,
} from '@/lib/workbench/chiptune';
import { encodeMidi } from '@/lib/workbench/chiptuneMidi';
import { downloadBlob } from '@/lib/workbench/download';
import { renderSongToWav } from '@/components/workbench/audio/chiptune/render';
import { usePlayback } from '@/components/workbench/audio/chiptune/usePlayback';
import { encodeShare, decodeShare } from './registry';

const slugify = (name: string): string =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cancion';

const withTrack = (song: ChiptuneSong, id: string, fn: (track: ChiptuneTrack) => ChiptuneTrack): ChiptuneSong => ({
  ...song,
  tracks: song.tracks.map((track) => (track.id === id ? fn(track) : track)),
});

const clampInt = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * Estado + acciones del composer (el "modelo"). El layout vive en ComposerApp.
 * Espeja la separación hook/componente de useCalculatorState + EmbeddedCalculators.
 */
export function useComposerState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [song, setSong] = useState<ChiptuneSong>(() => readSong() ?? createDemoSong());
  const [activeTrackId, setActiveTrackId] = useState<string>(() => song.tracks[0]?.id ?? '');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [deviceCopied, setDeviceCopied] = useState(false);

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
  const onDeleteNote = useCallback(
    (id: string) => patchActiveNotes((notes) => notes.filter((note) => note.id !== id)),
    [patchActiveNotes],
  );

  const onInstrument = useCallback(
    (id: string, instrument: InstrumentId) => update((song) => withTrack(song, id, (track) => ({ ...track, instrument }))),
    [update],
  );
  const onMute = useCallback(
    (id: string) => update((song) => withTrack(song, id, (track) => ({ ...track, muted: !track.muted }))),
    [update],
  );
  const onVolume = useCallback(
    (id: string, volume: number) => update((song) => withTrack(song, id, (track) => ({ ...track, volume }))),
    [update],
  );
  const onAddTrack = useCallback(
    () => update((song) => ({ ...song, tracks: [...song.tracks, createTrack(`Pista ${song.tracks.length + 1}`, 'pulse-lead')] })),
    [update],
  );
  const onRemoveTrack = useCallback(
    (id: string) => update((song) => ({ ...song, tracks: song.tracks.filter((track) => track.id !== id) })),
    [update],
  );

  const setBpm = useCallback((value: number) => update((song) => ({ ...song, bpm: clampInt(value, 40, 300) })), [update]);
  const setLength = useCallback((value: number) => update((song) => ({ ...song, lengthBars: clampInt(value, 1, 16) })), [update]);

  const resetTo = useCallback((next: ChiptuneSong) => {
    stop();
    setSong(next);
    setActiveTrackId(next.tracks[0]?.id ?? '');
    setSelectedNoteId(null);
  }, [stop]);

  // --- exportaciones ---------------------------------------------------------
  const exportMidi = useCallback(() => downloadBlob(encodeMidi(song), `${slugify(song.name)}.mid`, 'audio/midi'), [song]);
  const exportWav = useCallback(async () => {
    setRendering(true);
    try {
      downloadBlob(await renderSongToWav(song), `${slugify(song.name)}.wav`, 'audio/wav');
    } finally {
      setRendering(false);
    }
  }, [song]);
  const exportDevice = useCallback(() => {
    const code = serializeDeviceSong(song);
    downloadBlob(new TextEncoder().encode(code), `${slugify(song.name)}.device.json`, 'application/json');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => { setDeviceCopied(true); window.setTimeout(() => setDeviceCopied(false), 2000); })
        .catch(() => {});
    }
  }, [song]);
  const copyShareLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}${pathname}?s=${encodeShare(song)}`;
      await navigator.clipboard.writeText(url);
      messageApi.success('Link copiado — la canción viaja en la URL');
    } catch {
      messageApi.error('No se pudo copiar el link');
    }
  }, [song, pathname, messageApi]);

  // --- hidratación one-shot desde ?s= (código de compartir) ------------------
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const code = searchParams.get('s');
    if (code) {
      const shared = decodeShare(code);
      if (shared) resetTo(shared);
    }
  }, [searchParams, resetTo]);

  // --- persistencia en localStorage (debounced) ------------------------------
  useEffect(() => {
    const id = window.setTimeout(() => writeSong(song), 400);
    return () => window.clearTimeout(id);
  }, [song]);

  // --- borrar nota seleccionada con Delete/Backspace -------------------------
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

  return {
    song, activeTrackId, selectedNoteId, rendering, deviceCopied, contextHolder,
    isPlaying, loop, play, stop, toggleLoop, getPlayheadTicks,
    setActiveTrackId, setSelectedNoteId,
    onAddNote, onChangeNote, onDeleteNote,
    onInstrument, onMute, onVolume, onAddTrack, onRemoveTrack,
    setBpm, setLength,
    resetTo, loadDemo: () => resetTo(createDemoSong()), clear: () => resetTo(createSong()),
    exportMidi, exportWav, exportDevice, copyShareLink,
  };
}

export type ComposerState = ReturnType<typeof useComposerState>;
