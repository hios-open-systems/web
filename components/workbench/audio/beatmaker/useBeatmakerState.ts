'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useToolDraft } from '@/lib/hooks/useToolDraft';
import {
  BEAT_PRESETS, createDefaultProject, createProjectFromPreset, fillTrackSteps,
  forkBeat, parseBeat, randomizeBeat, serializeBeat, type BeatProject, type BeatSound, type BeatTrack, type TrackFillMode,
} from '@/lib/workbench/beatmaker.ts';

function updateTrack(prev: BeatProject, sound: BeatSound, fn: (tr: BeatTrack) => BeatTrack): BeatProject {
  return { ...prev, tracks: prev.tracks.map((tr) => (tr.sound === sound ? fn(tr) : tr)) };
}

export function useBeatmakerState() {
  const [project, setProject] = useState<BeatProject>(createDefaultProject);
  const [shareOpen, setShareOpen] = useState(false);
  useToolDraft('beatmaker', { project: serializeBeat(project), solos: JSON.stringify(project.tracks.filter(t => t.solo).map(t => t.sound)) }, values => {
    const saved = parseBeat(values.project ?? '');
    if (saved) {
      try {
        const solos: unknown = JSON.parse(values.solos ?? '[]');
        if (Array.isArray(solos)) saved.tracks = saved.tracks.map(t => ({ ...t, solo: solos.includes(t.sound) }));
      } catch { /* Older drafts have no solo selection. */ }
      setProject(saved);
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const code = new URL(window.location.href).searchParams.get('beat');
    const parsed = code ? parseBeat(code) : null;
    if (parsed) { setProject(parsed); message.success(`Beat cargado: ${parsed.name}`); }
  }, []);

  const toggleStep = (sound: BeatSound, stepIdx: number) =>
    setProject((p) => updateTrack(p, sound, (tr) => {
      const steps = [...tr.steps];
      steps[stepIdx] = { ...steps[stepIdx], active: !steps[stepIdx].active };
      return { ...tr, steps };
    }));
  const toggleMute = (sound: BeatSound) => setProject((p) => updateTrack(p, sound, (tr) => ({ ...tr, muted: !tr.muted })));
  const toggleSolo = (sound: BeatSound) => setProject((p) => updateTrack(p, sound, (tr) => ({ ...tr, solo: !tr.solo })));
  const setTrackVolume = (sound: BeatSound, vol: number) => setProject((p) => updateTrack(p, sound, (tr) => ({ ...tr, volume: Math.max(0, Math.min(1, vol)) })));
  const fillTrack = (sound: BeatSound, mode: TrackFillMode) => setProject((p) => updateTrack(p, sound, (tr) => fillTrackSteps(tr, mode)));

  const selectPreset = (presetId: string) => {
    const preset = BEAT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setProject(createProjectFromPreset(preset));
    message.success(`Preset cargado: ${preset.name}`);
  };
  const fork = () => {
    const forked = forkBeat(project);
    setProject(forked);
    message.success(`Beat forkeado como "${forked.name}". ¡Editá tu propia versión!`);
  };
  const randomize = () => { setProject((p) => randomizeBeat(p)); message.success('🎲 Nuevo Random Groove generado'); };
  const clear = () => {
    setProject((p) => ({ ...p, tracks: p.tracks.map((tr) => ({ ...tr, steps: tr.steps.map((st) => ({ ...st, active: false })) })) }));
    message.info('Patrón vaciado');
  };

  const cycleStepDetail = (sound: BeatSound, stepIdx: number) =>
    setProject((p) => updateTrack(p, sound, (tr) => {
      const steps = [...tr.steps];
      const cur = steps[stepIdx];
      if (!cur.active) { steps[stepIdx] = { ...cur, active: true }; return { ...tr, steps }; }
      if (sound === 'hihat') steps[stepIdx] = { ...cur, roll: (((cur.roll ?? 1) % 4) + 1) as 1 | 2 | 3 | 4 };
      else if (sound === '808' || sound === 'melody') {
        const scale = sound === '808' ? [36, 39, 41, 43, 44, 46] : [60, 63, 65, 67, 70, 72];
        steps[stepIdx] = { ...cur, pitch: scale[(scale.indexOf(cur.pitch ?? scale[0]) + 1) % scale.length] };
      }
      return { ...tr, steps };
    }));

  return {
    project, setProject, shareOpen, setShareOpen, toggleStep, cycleStepDetail,
    toggleMute, toggleSolo, setTrackVolume, fillTrack, selectPreset, randomize, fork, clear,
  };
}
