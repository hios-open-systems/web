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

  return {
    project,
    setProject,
    shareOpen,
    setShareOpen,
    toggleStep,
    toggleMute,
    toggleSolo,
    selectPreset,
    fork,
    clear,
  };
}
