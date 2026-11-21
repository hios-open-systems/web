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
    slug: 'a-electricidad', code: 'A', title: 'Electricidad y circuitos',
    summary: 'Ohm y Kirchhoff, alterna y espectro, reactancia, resonancia, filtros, semiconductores, amplificadores y PLL.',
    sections: [
      { id: 'ohm', title: 'Tensión, corriente, resistencia y potencia' },
      { id: 'alterna', title: 'Alterna, frecuencia y longitud de onda' },
      { id: 'reactancia', title: 'Reactancia: bobinas y capacitores' },
      { id: 'resonancia', title: 'Resonancia, Q y ancho de banda' },
      { id: 'filtros', title: 'Filtros y armónicas' },
      { id: 'semis', title: 'Semiconductores y fuentes' },
      { id: 'activos', title: 'Amplificadores, osciladores y PLL' },
      { id: 'banco', title: 'Preguntas del examen' },
    ],
  },
  {
    slug: 'b-modulacion-equipos', code: 'B', title: 'Señales, modos y equipos',
    summary: 'CW, AM, FM y SSB; modos digitales y ruido; receptor y transmisor; instrumentos de medición.',
    sections: [
      { id: 'modulacion', title: 'Modulación analógica' },
      { id: 'digitales', title: 'Modos digitales y ruido' },
      { id: 'receptor', title: 'El receptor' },
      { id: 'transmisor', title: 'El transmisor' },
      { id: 'instrumentos', title: 'Mediciones e instrumentos' },
      { id: 'banco', title: 'Preguntas del examen' },
    ],
  },
  {
    slug: 'c-antenas-propagacion', code: 'C', title: 'Líneas, antenas, propagación y seguridad',
    summary: 'Ondas, coaxil y ROE, antenas, ionosfera, enlaces en VHF/UHF, seguridad e interferencias.',
    sections: [
      { id: 'ondas', title: 'Campos y ondas' },
      { id: 'coaxil', title: 'Líneas de transmisión' },
      { id: 'roe', title: 'ROE' },
      { id: 'adaptacion', title: 'Baluns y acopladores' },
      { id: 'antenas', title: 'Antenas' },
      { id: 'ionosfera', title: 'Propagación en HF' },
      { id: 'alcance', title: 'VHF/UHF y cálculo de enlace' },
      { id: 'seguridad', title: 'Seguridad' },
      { id: 'interferencias', title: 'Interferencias (EMC)' },
      { id: 'banco', title: 'Preguntas del examen' },
    ],
  },
  {
    slug: 'd-reglamento', code: 'D', title: 'Reglamentación y operación',
    summary: 'Organismos, licencia, señales distintivas, estaciones, plan de bandas oficial, ética, códigos e infracciones.',
    sections: [
      { id: 'organismos', title: 'Organismos y normas' },
      { id: 'licencia', title: 'Licencia, categorías y examen' },
      { id: 'senales', title: 'Señales distintivas' },
      { id: 'estaciones', title: 'Estaciones, repetidoras y radiobalizas' },
      { id: 'bandas', title: 'Plan de bandas' },
      { id: 'etica', title: 'Ética y procedimientos' },
      { id: 'lenguaje', title: 'Fonético, código Q y RST' },
      { id: 'infracciones', title: 'Infracciones y sanciones' },
      { id: 'banco', title: 'Preguntas del examen' },
      { id: 'fuentes', title: 'Documentos oficiales' },
    ],
  },
  {
    slug: 'morse', code: 'CW', title: 'Código Morse',
    summary: 'Alfabeto sonoro, traductor, práctica de escucha y entrenador de transmisión con árbol Morse.',
    sections: [
      { id: 'por-que', title: 'Por qué Morse todavía importa' },
      { id: 'transmision', title: 'Entrenador de transmisión' },
      { id: 'alfabeto', title: 'Alfabeto Morse' },
      { id: 'traductor', title: 'Traductor texto ↔ Morse' },
      { id: 'entrenador', title: 'Entrenador Koch' },
    ],
  },
  {
    slug: 'practica', code: '✓', title: 'Práctica y simulacro',
    summary: 'Las preguntas reales del banco de examen por bloque, simulacro cronometrado y tarjetas.',
    sections: [
      { id: 'examen', title: 'Cómo es el examen' },
      { id: 'quiz', title: 'Práctica con el banco y simulacro' },
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
