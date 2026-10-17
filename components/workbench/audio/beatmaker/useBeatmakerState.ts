'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';
import {
  BEAT_PRESETS,
  createDefaultProject,
  createProjectFromPreset,
  forkBeat,
  parseBeat,
  type BeatProject,
  type BeatSound,
} from '@/lib/workbench/beatmaker.ts';

export function useBeatmakerState() {
  const [project, setProject] = useState<BeatProject>(createDefaultProject);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('beat');
    if (code) {
      const parsed = parseBeat(code);
      if (parsed) {
        setProject(parsed);
        message.success(`Beat cargado: ${parsed.name}`);
      }
    }
  }, []);

  const toggleStep = (sound: BeatSound, stepIdx: number) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => {
        if (tr.sound !== sound) return tr;
        const steps = [...tr.steps];
        steps[stepIdx] = { ...steps[stepIdx], active: !steps[stepIdx].active };
        return { ...tr, steps };
      }),
    }));
  };

  const toggleMute = (sound: BeatSound) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => (tr.sound === sound ? { ...tr, muted: !tr.muted } : tr)),
    }));
  };

  const toggleSolo = (sound: BeatSound) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => (tr.sound === sound ? { ...tr, solo: !tr.solo } : tr)),
    }));
  };

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

  const clear = () => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        steps: tr.steps.map((st) => ({ ...st, active: false })),
      })),
    }));
    message.info('Patrón vaciado');
  };

  const cycleStepDetail = (sound: BeatSound, stepIdx: number) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => {
        if (tr.sound !== sound) return tr;
        const steps = [...tr.steps];
        const current = steps[stepIdx];
        if (!current.active) {
          steps[stepIdx] = { ...current, active: true };
          return { ...tr, steps };
        }
        if (sound === 'hihat') {
          const nextRoll = (((current.roll ?? 1) % 4) + 1) as 1 | 2 | 3 | 4;
          steps[stepIdx] = { ...current, roll: nextRoll };
        } else if (sound === '808') {
          const scale = [36, 39, 41, 43, 44, 46];
          const currIdx = scale.indexOf(current.pitch ?? 36);
          steps[stepIdx] = { ...current, pitch: scale[(currIdx + 1) % scale.length] };
        } else if (sound === 'melody') {
          const scale = [60, 63, 65, 67, 70, 72];
          const currIdx = scale.indexOf(current.pitch ?? 60);
          steps[stepIdx] = { ...current, pitch: scale[(currIdx + 1) % scale.length] };
        }
        return { ...tr, steps };
      }),
    }));
  };

  return {
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
  };
}
