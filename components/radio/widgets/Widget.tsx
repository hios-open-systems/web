'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Los widgets son 100 % cliente (animación, audio, azar): sin SSR evitamos
// diferencias de hidratación y el HTML estático queda liviano.
const placeholder = () => <div style={{ minHeight: 320, borderRadius: 14, background: '#12151a', border: '1px solid #2d3748' }} aria-hidden />;
const load = <T extends string>(name: T, loader: () => Promise<Record<T, ComponentType>>) =>
  dynamic(() => loader().then((m) => m[name]), { ssr: false, loading: placeholder });

const WIDGETS = {
  ohm: load('OhmLab', () => import('./OhmLab')),
  wave: load('WaveLab', () => import('./WaveLab')),
  reactance: load('ReactanceLab', () => import('./ReactanceLab')),
  resonance: load('ResonanceLab', () => import('./ResonanceLab')),
  harmonics: load('HarmonicsLab', () => import('./HarmonicsLab')),
  modulation: load('ModulationScope', () => import('./ModulationScope')),
  receiver: load('ReceiverLab', () => import('./ReceiverLab')),
  coax: load('CoaxLab', () => import('./CoaxLab')),
  swr: load('StandingWaveLab', () => import('./StandingWaveLab')),
  antenna: load('AntennaLab', () => import('./AntennaLab')),
  ionosphere: load('IonosphereLab', () => import('./IonosphereLab')),
  link: load('LinkBudgetLab', () => import('./LinkBudgetLab')),
  bands: load('BandChart', () => import('./BandChart')),
  morse: load('MorseLab', () => import('./MorseLab')),
  koch: load('MorseTrainer', () => import('./MorseTrainer')),
  cards: load('Flashcards', () => import('./Flashcards')),
  quiz: load('QuizLab', () => import('./QuizLab')),
} as const;

export type WidgetName = keyof typeof WIDGETS;

export function Widget({ name }: { name: WidgetName }) {
  const Component = WIDGETS[name];
  return <Component />;
}
