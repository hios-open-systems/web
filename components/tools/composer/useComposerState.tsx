'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { message } from 'antd';
import {
  createSong,
  createTrack,
  createNote,
  readSong,
  writeSong,
  serializeDeviceSong,
  loopLengthTicks,
  TICKS_PER_STEP,
  type ChiptuneNote,
  type ChiptuneSong,
  type ChiptuneTrack,
  type ChiptunePattern,
  type InstrumentId,
  type TrackTimbre,
} from '@/lib/workbench/chiptune';
import { compileArrangement } from '@/lib/workbench/arrange';
import { makeDefaultSong } from '@/lib/workbench/chiptuneSongs';
import { encodeMidi } from '@/lib/workbench/chiptuneMidi';
import { downloadBlob } from '@/lib/workbench/download';
import { renderSongToWav, renderSongToBuffer } from '@/components/workbench/audio/chiptune/render';
import { encodeMp3 } from '@/lib/workbench/mp3';
import { usePlayback } from '@/components/workbench/audio/chiptune/usePlayback';
import { repeatRange, fillSubdivision } from '@/lib/workbench/patternOps';
import { encodeShare, decodeShare } from './registry';

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  const [song, setSong] = useState<ChiptuneSong>(() => readSong() ?? makeDefaultSong());
  const [activeTrackId, setActiveTrackId] = useState<string>(() => song.tracks[0]?.id ?? '');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ startTick: number; endTick: number } | null>(null);
  const [rendering, setRendering] = useState(false);
  const [deviceCopied, setDeviceCopied] = useState(false);

  const { isPlaying, loop, play, stop, toggleLoop, getPlayheadTicks, previewNote, masterVolume, setMasterVolume, seek } = usePlayback(song);

  // --- historia (undo/redo) con coalescing de ediciones rápidas (drags) ------
  const songRef = useRef(song);
  const past = useRef<ChiptuneSong[]>([]);
  const future = useRef<ChiptuneSong[]>([]);
  const lastPush = useRef(0);
  const [, bumpHist] = useState(0);

  const commit = useCallback((next: ChiptuneSong, coalesce = false) => {
    const now = performance.now();
    const coalesced = coalesce && now - lastPush.current < 400 && past.current.length > 0;
    if (!coalesced) {
      past.current.push(songRef.current);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
    }
    lastPush.current = now;
    songRef.current = next;
    setSong(next);
    bumpHist((t) => t + 1);
  }, []);

  const update = useCallback(
    (fn: (song: ChiptuneSong) => ChiptuneSong, coalesce = false) =>
      commit({ ...fn(songRef.current), updatedAt: Date.now() }, coalesce),
    [commit],
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop() as ChiptuneSong;
    future.current.push(songRef.current);
    songRef.current = prev;
    lastPush.current = 0;
    setSong(prev);
    setActiveTrackId((id) => (prev.tracks.some((t) => t.id === id) ? id : prev.tracks[0]?.id ?? ''));
    setSelectedNoteId(null);
    bumpHist((t) => t + 1);
  }, []);
  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop() as ChiptuneSong;
    past.current.push(songRef.current);
    lastPush.current = 0;
    songRef.current = next;
    setSong(next);
    setActiveTrackId((id) => (next.tracks.some((t) => t.id === id) ? id : next.tracks[0]?.id ?? ''));
    setSelectedNoteId(null);
    bumpHist((t) => t + 1);
  }, []);

  const patchActiveNotes = useCallback(
    (fn: (notes: ChiptuneNote[]) => ChiptuneNote[], coalesce = false) =>
      update((song) => withTrack(song, activeTrackId, (track) => ({ ...track, notes: fn(track.notes) })), coalesce),
    [activeTrackId, update],
  );

  const onAddNote = useCallback((note: ChiptuneNote) => {
    patchActiveNotes((notes) => [...notes, note]);
    setSelectedNoteId(note.id);
    const track = songRef.current.tracks.find((t) => t.id === activeTrackId);
    if (track) previewNote(note.pitch, track.instrument, track.timbre);
  }, [patchActiveNotes, activeTrackId, previewNote]);

  // Seleccionar una nota (tap/drag) también la hace sonar (con su timbre).
  const selectNote = useCallback((id: string | null) => {
    setSelectedNoteId(id);
    if (!id) return;
    for (const track of songRef.current.tracks) {
      const note = track.notes.find((n) => n.id === id);
      if (note) { previewNote(note.pitch, track.instrument, track.timbre); return; }
    }
  }, [previewNote]);
  const onChangeNote = useCallback(
    (id: string, patch: Partial<ChiptuneNote>) =>
      patchActiveNotes((notes) => notes.map((note) => (note.id === id ? { ...note, ...patch } : note)), true),
    [patchActiveNotes],
  );
  const onDeleteNote = useCallback(
    (id: string) => patchActiveNotes((notes) => notes.filter((note) => note.id !== id)),
    [patchActiveNotes],
  );
  const duplicateNote = useCallback(() => {
    if (!selectedNoteId) return;
    const track = songRef.current.tracks.find((t) => t.id === activeTrackId);
    const note = track?.notes.find((n) => n.id === selectedNoteId);
    if (!note) return;
    const copy = createNote(note.pitch, note.start + note.duration, note.duration, note.velocity);
    patchActiveNotes((notes) => [...notes, copy]);
    setSelectedNoteId(copy.id);
  }, [selectedNoteId, activeTrackId, patchActiveNotes]);
  const nudgeNote = useCallback((dPitch: number, dSteps: number) => {
    if (!selectedNoteId) return;
    const track = songRef.current.tracks.find((t) => t.id === activeTrackId);
    const note = track?.notes.find((n) => n.id === selectedNoteId);
    if (!note) return;
    const patch: Partial<ChiptuneNote> = {};
    if (dPitch) patch.pitch = clampInt(note.pitch + dPitch, 0, 127);
    if (dSteps) patch.start = Math.max(0, note.start + dSteps * TICKS_PER_STEP);
    onChangeNote(selectedNoteId, patch);
  }, [selectedNoteId, activeTrackId, onChangeNote]);

  // Repetir el patrón (rango seleccionado o todo el contenido de la pista) hasta el final.
  const repeatSelection = useCallback(() => {
    const song = songRef.current;
    const track = song.tracks.find((t) => t.id === activeTrackId);
    if (!track) return;
    const until = loopLengthTicks(song);
    let start: number;
    let end: number;
    if (selectedRange && selectedRange.endTick > selectedRange.startTick) {
      start = selectedRange.startTick;
      end = selectedRange.endTick;
    } else {
      start = 0;
      const content = track.notes.reduce((m, n) => Math.max(m, n.start + n.duration), 0);
      const bar = song.beatsPerBar * song.ppq;
      end = Math.max(bar, Math.ceil(content / bar) * bar);
    }
    const additions = repeatRange(track.notes, start, end, until);
    if (additions.length) patchActiveNotes((notes) => [...notes, ...additions]);
  }, [activeTrackId, selectedRange, patchActiveNotes]);

  // Rellenar el rango (o toda la canción) con una figura musical, en el pitch de la nota seleccionada.
  const fillActiveTrack = useCallback((stepTicks: number) => {
    const song = songRef.current;
    const track = song.tracks.find((t) => t.id === activeTrackId);
    if (!track) return;
    const range = selectedRange && selectedRange.endTick > selectedRange.startTick
      ? selectedRange
      : { startTick: 0, endTick: loopLengthTicks(song) };
    const sel = track.notes.find((n) => n.id === selectedNoteId);
    const pitch = sel ? sel.pitch : 60;
    const additions = fillSubdivision(pitch, range.startTick, range.endTick, stepTicks, {
      duration: Math.max(1, Math.floor(stepTicks * 0.9)),
      velocity: 100,
    });
    if (additions.length) patchActiveNotes((notes) => [...notes, ...additions]);
  }, [activeTrackId, selectedRange, selectedNoteId, patchActiveNotes]);

  const onInstrument = useCallback(
    (id: string, instrument: InstrumentId) => update((song) => withTrack(song, id, (track) => ({ ...track, instrument }))),
    [update],
  );
  const onMute = useCallback(
    (id: string) => update((song) => withTrack(song, id, (track) => ({ ...track, muted: !track.muted }))),
    [update],
  );
  const onSolo = useCallback(
    (id: string) => update((song) => withTrack(song, id, (track) => ({ ...track, solo: !track.solo }))),
    [update],
  );
  const onVolume = useCallback(
    (id: string, volume: number) => update((song) => withTrack(song, id, (track) => ({ ...track, volume })), true),
    [update],
  );
  const onRenameTrack = useCallback(
    (id: string, name: string) => update((song) => withTrack(song, id, (track) => ({ ...track, name }))),
    [update],
  );
  const onTimbre = useCallback(
    (id: string, patch: TrackTimbre) =>
      update((song) => withTrack(song, id, (track) => ({ ...track, timbre: { ...track.timbre, ...patch } })), true),
    [update],
  );
  const onResetTimbre = useCallback(
    (id: string) => update((song) => withTrack(song, id, ({ timbre, ...rest }) => rest as ChiptuneTrack)),
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

  // --- secciones (patterns) + arreglo -> compilar ---------------------------
  const saveAsPattern = useCallback((name: string) => {
    update((song) => {
      const pattern: ChiptunePattern = {
        id: uid(),
        name: name.trim() || `Sección ${(song.patterns?.length ?? 0) + 1}`,
        lengthBars: song.lengthBars,
        tracks: song.tracks.map((t) => ({ ...t, notes: t.notes.map((n) => ({ ...n })) })),
      };
      return { ...song, patterns: [...(song.patterns ?? []), pattern] };
    });
  }, [update]);

  const loadPattern = useCallback((id: string) => {
    const pat = songRef.current.patterns?.find((p) => p.id === id);
    if (!pat) return;
    const tracks = pat.tracks.map((t) => ({ ...t, id: uid(), notes: t.notes.map((n) => ({ ...n, id: uid() })) }));
    update((s) => ({ ...s, lengthBars: pat.lengthBars, tracks }));
    setActiveTrackId(tracks[0]?.id ?? '');
    setSelectedNoteId(null);
  }, [update]);

  const deletePattern = useCallback((id: string) => {
    update((s) => ({
      ...s,
      patterns: (s.patterns ?? []).filter((p) => p.id !== id),
      arrangement: (s.arrangement ?? []).filter((c) => c.patternId !== id),
    }));
  }, [update]);

  const addClip = useCallback((patternId: string) => {
    update((s) => {
      const startBar = (s.arrangement ?? []).reduce((m, c) => {
        const p = s.patterns?.find((pp) => pp.id === c.patternId);
        return Math.max(m, c.startBar + (p?.lengthBars ?? 1));
      }, 0);
      return { ...s, arrangement: [...(s.arrangement ?? []), { id: uid(), patternId, startBar }] };
    });
  }, [update]);

  const removeClip = useCallback((id: string) => {
    update((s) => ({ ...s, arrangement: (s.arrangement ?? []).filter((c) => c.id !== id) }));
  }, [update]);

  const setClipBar = useCallback((id: string, startBar: number) => {
    update((s) => ({
      ...s,
      arrangement: (s.arrangement ?? []).map((c) => (c.id === id ? { ...c, startBar: Math.max(0, startBar) } : c)),
    }));
  }, [update]);

  const compileArrangementNow = useCallback(() => {
    const song = songRef.current;
    if (!song.patterns?.length || !song.arrangement?.length) {
      messageApi.error('Guardá secciones y armá el arreglo primero');
      return;
    }
    const compiled = compileArrangement(song.patterns, song.arrangement, {
      name: song.name, bpm: song.bpm, beatsPerBar: song.beatsPerBar, ppq: song.ppq,
    });
    update((s) => ({ ...s, tracks: compiled.tracks, lengthBars: compiled.lengthBars }));
    setActiveTrackId(compiled.tracks[0]?.id ?? '');
    setSelectedNoteId(null);
    messageApi.success('Arreglo compilado al piano-roll');
  }, [update, messageApi]);

  const setName = useCallback((name: string) => update((song) => ({ ...song, name: name.trim() || 'Sin título' })), [update]);
  const setBpm = useCallback((value: number) => update((song) => ({ ...song, bpm: clampInt(value, 40, 300) }), true), [update]);
  const setLength = useCallback((value: number) => update((song) => ({ ...song, lengthBars: clampInt(value, 1, 16) })), [update]);

  const resetTo = useCallback((next: ChiptuneSong) => {
    stop();
    commit(next);
    setActiveTrackId(next.tracks[0]?.id ?? '');
    setSelectedNoteId(null);
  }, [stop, commit]);

  // --- exportaciones ---------------------------------------------------------
  const exportMidi = useCallback(() => {
    downloadBlob(encodeMidi(song), `${slugify(song.name)}.mid`, 'audio/midi');
    messageApi.success('MIDI exportado');
  }, [song, messageApi]);
  const exportWav = useCallback(async () => {
    setRendering(true);
    try {
      downloadBlob(await renderSongToWav(song), `${slugify(song.name)}.wav`, 'audio/wav');
      messageApi.success('WAV exportado');
    } finally {
      setRendering(false);
    }
  }, [song, messageApi]);
  const exportMp3 = useCallback(async () => {
    setRendering(true);
    try {
      const { sampleRate, channelData } = await renderSongToBuffer(song);
      downloadBlob(encodeMp3(channelData, sampleRate), `${slugify(song.name)}.mp3`, 'audio/mpeg');
      messageApi.success('MP3 exportado');
    } finally {
      setRendering(false);
    }
  }, [song, messageApi]);
  const exportDevice = useCallback(() => {
    const code = serializeDeviceSong(song);
    downloadBlob(new TextEncoder().encode(code), `${slugify(song.name)}.device.json`, 'application/json');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => { setDeviceCopied(true); window.setTimeout(() => setDeviceCopied(false), 2000); })
        .catch(() => {});
    }
    messageApi.success('Código para device copiado y descargado');
  }, [song, messageApi]);
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

  // --- atajos de teclado -----------------------------------------------------
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateNote();
      } else if (event.key === ' ') {
        event.preventDefault();
        if (isPlaying) stop(); else play();
      } else if (event.key.toLowerCase() === 'l') {
        toggleLoop();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!selectedNoteId) return;
        event.preventDefault();
        onDeleteNote(selectedNoteId);
        setSelectedNoteId(null);
      } else if (selectedNoteId && event.key.startsWith('Arrow')) {
        event.preventDefault();
        if (event.key === 'ArrowUp') nudgeNote(1, 0);
        else if (event.key === 'ArrowDown') nudgeNote(-1, 0);
        else if (event.key === 'ArrowRight') nudgeNote(0, 1);
        else if (event.key === 'ArrowLeft') nudgeNote(0, -1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, play, stop, toggleLoop, undo, redo, duplicateNote, nudgeNote, onDeleteNote, selectedNoteId]);

  return {
    song, activeTrackId, selectedNoteId, rendering, deviceCopied, contextHolder,
    isPlaying, loop, play, stop, toggleLoop, getPlayheadTicks, seek,
    masterVolume, setMasterVolume,
    canUndo: past.current.length > 0, canRedo: future.current.length > 0, undo, redo,
    setActiveTrackId, setSelectedNoteId, selectNote,
    selectedRange, setSelectedRange, repeatSelection, fillActiveTrack,
    onAddNote, onChangeNote, onDeleteNote, duplicateNote,
    onInstrument, onMute, onSolo, onVolume, onRenameTrack, onTimbre, onResetTimbre,
    onAddTrack, onRemoveTrack,
    saveAsPattern, loadPattern, deletePattern, addClip, removeClip, setClipBar, compileArrangementNow,
    setName, setBpm, setLength,
    resetTo, loadDemo: () => resetTo(makeDefaultSong()), clear: () => resetTo(createSong()),
    exportMidi, exportWav, exportMp3, exportDevice, copyShareLink,
  };
}

export type ComposerState = ReturnType<typeof useComposerState>;
