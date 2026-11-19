// Une los bancos de preguntas en un solo formato para práctica y simulacro.

import { BANK_TECNICA, type BankTopic } from './bankTecnica.ts';
import { OFFICIAL_RULES, OFFICIAL_CHAPTERS } from './officialBank.ts';
import { QUIZ } from './quiz.ts';

export type ExamPool = 'A' | 'B' | 'C' | 'D' | 'repaso';

export interface ExamQuestion {
  key: string;
  pool: ExamPool;
  /** Etiqueta de origen, p. ej. «Banco técnico · Preg. 66». */
  source: string;
  q: string;
  options: string[];
  /** Índices de las opciones correctas. Puede haber más de una. */
  correct: number[];
  explain?: string;
  warn?: string;
}

const TOPIC_BLOCK: Record<BankTopic, 'A' | 'B' | 'C'> = {
  ohm: 'A', alterna: 'A', componentes: 'A', resonancia: 'A', semiconductores: 'A', fuentes: 'A',
  modulacion: 'B', receptor: 'B', transmisor: 'B', instrumentos: 'B',
  lineas: 'C', roe: 'C', antenas: 'C', propagacion: 'C', otros: 'B',
};

/** Las «otros» del banco técnico que en realidad son de antenas/propagación. */
const OTHER_TO_C = new Set([97, 108, 117]);
/** Las «otros» que son de electricidad básica. */
const OTHER_TO_A = new Set([21, 87, 143, 145]);

export function blockOfTopic(n: number, topic: BankTopic): 'A' | 'B' | 'C' {
  if (topic === 'otros' && OTHER_TO_C.has(n)) return 'C';
  if (topic === 'otros' && OTHER_TO_A.has(n)) return 'A';
  return TOPIC_BLOCK[topic];
}

export const EXAM_QUESTIONS: readonly ExamQuestion[] = [
  ...BANK_TECNICA.map((b): ExamQuestion => ({
    key: `t${b.n}`, pool: blockOfTopic(b.n, b.topic), source: `Banco técnico · Preg. ${b.n}`,
    q: b.q, options: [b.answer, ...b.wrong], correct: [0], warn: b.fix,
  })),
  ...OFFICIAL_RULES.map((r): ExamQuestion => ({
    key: `r${r.id}`, pool: 'D', source: `Banco oficial ENACOM · ${r.id} · ${OFFICIAL_CHAPTERS[r.ch]}`,
    q: r.q, options: r.opts, correct: r.ok, warn: r.note,
  })),
  ...QUIZ.map((q): ExamQuestion => ({
    key: `p${q.id}`, pool: 'repaso', source: `Repaso OpenHios · Bloque ${q.block}`,
    q: q.q, options: q.options, correct: [q.answer], explain: q.explain,
  })),
];

export function questionsFor(pool: ExamPool): ExamQuestion[] {
  return EXAM_QUESTIONS.filter((q) => q.pool === pool);
}

/** Texto de la/s respuesta/s correcta/s. */
export function answerText(q: ExamQuestion): string {
  return q.correct.map((i) => q.options[i]).join(' · ');
}

export const MOCK_LAYOUT = { tecnica: 25, reglamento: 15, minutes: 45 } as const;

function shuffle<T>(items: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Simulacro: preguntas técnicas del banco (A–C) + reglamentación (D), mezcladas. */
export function buildMock(rnd: () => number = Math.random): ExamQuestion[] {
  const tec = shuffle(EXAM_QUESTIONS.filter((q) => q.pool === 'A' || q.pool === 'B' || q.pool === 'C'), rnd).slice(0, MOCK_LAYOUT.tecnica);
  const reg = shuffle(questionsFor('D'), rnd).slice(0, MOCK_LAYOUT.reglamento);
  return shuffle([...tec, ...reg], rnd);
}

export { shuffle };
