// Índice de la guía de radioaficionado. El orden define las páginas y el pager.

export interface ChapterSection { id: string; title: string }

export interface Chapter {
  slug: string;
  code: string;
  title: string;
  summary: string;
  sections: ChapterSection[];
}

export const CHAPTERS: readonly Chapter[] = [
  {
    slug: 'a-electricidad', code: 'A', title: 'Electricidad y componentes',
    summary: 'Ohm, alterna, longitud de onda, bobinas, capacitores, resonancia y filtros.',
    sections: [
      { id: 'ohm', title: 'Tensión, corriente, resistencia y potencia' },
      { id: 'alterna', title: 'Alterna, frecuencia y longitud de onda' },
      { id: 'reactancia', title: 'Bobinas y capacitores en RF' },
      { id: 'resonancia', title: 'Resonancia, Q y selectividad' },
      { id: 'filtros', title: 'Filtros y armónicas' },
      { id: 'semis', title: 'Semiconductores y fuentes' },
    ],
  },
  {
    slug: 'b-modulacion-equipos', code: 'B', title: 'Modulación y equipos',
    summary: 'CW, AM, FM y SSB; receptor superheterodino vs SDR; transmisor e instrumentos.',
    sections: [
      { id: 'modulacion', title: 'Modulación' },
      { id: 'receptor', title: 'El receptor' },
      { id: 'transmisor', title: 'El transmisor' },
      { id: 'instrumentos', title: 'Instrumentos de la estación' },
    ],
  },
  {
    slug: 'c-antenas-propagacion', code: 'C', title: 'Líneas, antenas y propagación',
    summary: 'Coaxil y 50 Ω, ROE, baluns, dipolos y verticales, ionosfera y alcance en VHF.',
    sections: [
      { id: 'coaxil', title: 'Impedancia y cable coaxil' },
      { id: 'roe', title: 'ROE: ondas estacionarias' },
      { id: 'adaptacion', title: 'Adaptación: baluns y acopladores' },
      { id: 'antenas', title: 'Antenas básicas' },
      { id: 'ionosfera', title: 'Propagación en HF' },
      { id: 'alcance', title: 'Alcance en VHF/UHF: ¿llego?' },
    ],
  },
  {
    slug: 'd-reglamento', code: 'D', title: 'Reglamento y operación',
    summary: 'Licencias en Argentina, señales distintivas, bandas, código Q, repetidoras.',
    sections: [
      { id: 'licencia', title: 'La licencia en Argentina' },
      { id: 'senales', title: 'Señales distintivas' },
      { id: 'bandas', title: 'Bandas y frecuencias' },
      { id: 'lenguaje', title: 'Fonético, código Q y RST' },
      { id: 'repetidoras', title: 'Repetidoras y emergencias' },
    ],
  },
  {
    slug: 'morse', code: 'CW', title: 'Código Morse',
    summary: 'Traductor con audio y entrenador por el método Koch.',
    sections: [
      { id: 'por-que', title: 'Por qué Morse todavía importa' },
      { id: 'traductor', title: 'Traductor texto ↔ Morse' },
      { id: 'entrenador', title: 'Entrenador Koch' },
    ],
  },
  {
    slug: 'practica', code: '✓', title: 'Práctica y simulacro',
    summary: 'Preguntas por bloque con explicación, simulacro cronometrado y tarjetas.',
    sections: [
      { id: 'quiz', title: 'Preguntas y simulacro' },
      { id: 'fichas', title: 'Tarjetas de memoria' },
    ],
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chapterNeighbors(slug: string): { prev?: Chapter; next?: Chapter } {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return { prev: i > 0 ? CHAPTERS[i - 1] : undefined, next: i >= 0 ? CHAPTERS[i + 1] : undefined };
}
