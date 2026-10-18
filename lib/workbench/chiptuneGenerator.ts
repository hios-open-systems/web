/**
 * Generador procedural de canciones. Con la misma semilla y ajustes devuelve la
 * misma canción; con otra semilla cambian la forma (verso/estribillo/puente), la
 * progresión de cada sección, los motivos melódicos, el groove, el bajo, el
 * arpegio y el tempo. La teoría vive en generatorTheory, los estilos en
 * generatorStyles y las partes en generatorRhythm / generatorMelody.
 */
import { createTrack, PPQ, type ChiptuneNote, type ChiptuneSong, type ChiptuneTrack } from './chiptune.ts';
import type { MusicalScale } from './chiptuneMusic.ts';
import { STYLES, type SongStyle, type StyleDef } from './generatorStyles.ts';
import { chance, pick, planSections, seededRandom, voiceChord, type Rng, type Section } from './generatorTheory.ts';
import { bassBar, drumBar, type BarContext, type PartContext } from './generatorRhythm.ts';
import { arpBar, choirBar, makeMotif, melodyBar, padBar, varyMotif, type Motif } from './generatorMelody.ts';

export { type SongStyle } from './generatorStyles.ts';
export const SONG_STYLES = STYLES;

export type Complexity = 'simple' | 'normal' | 'rich';
export const COMPLEXITY_LABELS: Record<Complexity, string> = { simple: 'Simple', normal: 'Media', rich: 'Compleja' };
const COMPLEXITY: Record<Complexity, number> = { simple: 0.2, normal: 0.55, rich: 0.85 };

/** Rol de cada pista generada; el orden de pistas es fijo (lead, bajo, [arpegio], batería, [pad], [coro]). */
export type PartRole = 'lead' | 'bass' | 'arp' | 'drums' | 'pad' | 'choir';

export interface GeneratorOptions {
  seed: string;
  style: SongStyle;
  root: number;
  bars: number;
  trackCount?: number;
  complexity?: Complexity;
  /** Semilla propia por rol: regenera una pista sin tocar la armonía ni las demás. */
  partSeeds?: Partial<Record<PartRole, string>>;
}

export function trackRoles(count: number): PartRole[] {
  const roles: PartRole[] = count === 3 ? ['lead', 'bass', 'drums'] : ['lead', 'bass', 'arp', 'drums'];
  if (count >= 5) roles.push('pad');
  if (count >= 6) roles.push('choir');
  return roles;
}

function buildTrack(role: PartRole, style: StyleDef): ChiptuneTrack {
  const { instruments: i, names } = style;
  const spec: Record<PartRole, [string, ChiptuneTrack['instrument'], number]> = {
    lead: [names.lead, i.lead, 0.8],
    bass: ['Bajo', i.bass, 0.8],
    arp: [names.arp, i.arp, 0.45],
    drums: ['Batería', 'noise-perc', 0.68],
    pad: [names.pad, i.pad, 0.4],
    choir: ['Coro / Voces', i.choir, 0.35],
  };
  const [name, instrument, volume] = spec[role];
  const track = createTrack(name, instrument);
  track.volume = volume;
  return track;
}

/** Decisiones por letra de sección (A, B, C, I): todas las repeticiones las comparten. */
interface SectionPlan {
  progression: number[];
  seventh: boolean;
  motif: Motif;
  variation: Motif;
  groove: StyleDef['grooves'][number];
  bass: StyleDef['bass'][number];
  arp: StyleDef['arp'][number];
}

function planLetters(sections: Section[], style: StyleDef, complexity: number, rng: (role: PartRole) => Rng, harmony: Rng) {
  const plans = new Map<string, SectionPlan>();
  const used = new Set<number>();
  for (const section of sections) {
    if (plans.has(section.letter)) continue;
    let index = Math.floor(harmony() * style.progressions.length);
    for (let tries = 0; used.has(index) && tries < 4; tries++) index = Math.floor(harmony() * style.progressions.length);
    used.add(index);
    const density = Math.min(0.95, style.leadDensity * (0.7 + complexity * 0.6) + (section.kind === 'chorus' ? 0.1 : 0));
    const motif = makeMotif(rng('lead'), density);
    plans.set(section.letter, {
      progression: style.progressions[index],
      seventh: complexity > 0.3 && chance(harmony, style.seventhChance),
      motif,
      variation: varyMotif(motif, rng('lead')),
      groove: pick(rng('drums'), style.grooves),
      bass: pick(rng('bass'), style.bass),
      arp: pick(rng('arp'), style.arp),
    });
  }
  return plans;
}

function barContexts(sections: Section[], plans: Map<string, SectionPlan>, bars: number): (BarContext & { plan: SectionPlan })[] {
  const out: (BarContext & { plan: SectionPlan })[] = [];
  for (const section of sections)
    for (let b = 0; b < section.bars; b++) {
      const plan = plans.get(section.letter)!;
      const bar = section.startBar + b;
      out.push({
        plan, section, barInSection: b, start: bar * PPQ * 4, seventh: plan.seventh,
        degree: bar === bars - 1 ? 0 : plan.progression[b % plan.progression.length],
        nextDegree: 0, sectionEnd: b === section.bars - 1, songEnd: bar === bars - 1,
      });
    }
  out.forEach((bar, i) => (bar.nextDegree = out[i + 1]?.degree ?? 0));
  return out;
}

export function generateSong(options: GeneratorOptions): ChiptuneSong {
  const style: StyleDef = STYLES[options.style] ?? STYLES.adventure;
  const root = Math.max(0, Math.min(11, Math.round(options.root)));
  const bars = Math.max(1, Math.min(16, Math.round(options.bars)));
  const count = options.trackCount ? Math.max(3, Math.min(6, options.trackCount)) : 4;
  const complexity = COMPLEXITY[options.complexity ?? 'normal'];
  const scale: MusicalScale = { root, mode: style.mode };
  const harmony = seededRandom(`${options.seed}:${options.style}:harmony`);
  const randoms = new Map<PartRole, Rng>();
  const rng = (role: PartRole) => {
    if (!randoms.has(role)) randoms.set(role, seededRandom(`${options.partSeeds?.[role] ?? options.seed}:${options.style}:${role}`));
    return randoms.get(role)!;
  };
  const sections = planSections(bars, harmony);
  const plans = planLetters(sections, style, complexity, rng, harmony);
  const [lo, hi] = style.bpm;
  const bpm = Math.round((lo + harmony() * (hi - lo)) / 2) * 2;

  const roles = trackRoles(count);
  const tracks = roles.map((role) => buildTrack(role, style));
  const notesOf = (role: PartRole): ChiptuneNote[] | undefined => tracks[roles.indexOf(role)]?.notes;
  const ctx = (role: PartRole): PartContext => ({ scale, random: rng(role), complexity, swing: style.swing });

  let leadDegree = 9;
  let padVoicing: number[] | undefined;
  let arpVoicing: number[] | undefined;
  for (const bar of barContexts(sections, plans, bars)) {
    const { plan, section } = bar;
    drumBar(notesOf('drums')!, plan.groove, bar, ctx('drums'), options.style === 'hiphop');
    bassBar(notesOf('bass')!, section.kind === 'intro' ? 'whole' : plan.bass, bar, ctx('bass'));
    if (section.kind !== 'intro') {
      const motif = bar.barInSection === 2 ? plan.variation : plan.motif;
      leadDegree = melodyBar(notesOf('lead')!, motif, bar, ctx('lead'), leadDegree, section.kind === 'chorus' ? 2 : 0);
    }
    padVoicing = voiceChord(scale, bar.degree, bar.seventh, 60, padVoicing);
    arpVoicing = voiceChord(scale, bar.degree, bar.seventh, 67, arpVoicing);
    const arp = notesOf('arp');
    if (arp) arpBar(arp, plan.arp, arpVoicing, bar, ctx('arp'));
    const pad = notesOf('pad');
    if (pad) padBar(pad, padVoicing, bar);
    const choir = notesOf('choir');
    if (choir) choirBar(choir, voiceChord(scale, bar.degree, false, 72), bar);
  }

  return {
    version: 1,
    scale,
    name: `${style.label} · ${options.seed}`,
    bpm,
    ppq: PPQ,
    beatsPerBar: 4,
    lengthBars: bars,
    tracks,
    updatedAt: 0,
  };
}

/** Rol de una pista de una canción generada con `count` pistas (por posición). */
export const roleAt = (count: number, index: number): PartRole | undefined => trackRoles(count)[index];
