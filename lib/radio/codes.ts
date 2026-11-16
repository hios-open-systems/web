// Alfabeto fonético ITU, código Q usual, reporte RST y tabla Morse (ITU-R M.1677).

export const PHONETIC: readonly (readonly [string, string])[] = [
  ['A', 'Alfa'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'],
  ['F', 'Foxtrot'], ['G', 'Golf'], ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'],
  ['K', 'Kilo'], ['L', 'Lima'], ['M', 'Mike'], ['N', 'November'], ['O', 'Oscar'],
  ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'], ['S', 'Sierra'], ['T', 'Tango'],
  ['U', 'Uniform'], ['V', 'Victor'], ['W', 'Whiskey'], ['X', 'X-ray'], ['Y', 'Yankee'],
  ['Z', 'Zulu'],
];

export interface QCode { code: string; question: string; statement: string }

export const Q_CODES: readonly QCode[] = [
  { code: 'QTH', question: '¿Cuál es tu ubicación?', statement: 'Mi ubicación es…' },
  { code: 'QSL', question: '¿Acusás recibo?', statement: 'Acuso recibo / confirmo.' },
  { code: 'QRZ', question: '¿Quién me llama?', statement: 'Te llama… (también: "¿alguien llamó?")' },
  { code: 'QRM', question: '¿Tenés interferencia de otras estaciones?', statement: 'Tengo interferencia artificial.' },
  { code: 'QRN', question: '¿Tenés ruido atmosférico?', statement: 'Tengo estática / ruido natural.' },
  { code: 'QRT', question: '¿Dejo de transmitir?', statement: 'Dejo de transmitir / cierro la estación.' },
  { code: 'QRP', question: '¿Bajo la potencia?', statement: 'Bajá la potencia (QRP = baja potencia, ≤5 W).' },
  { code: 'QRO', question: '¿Subo la potencia?', statement: 'Subí la potencia.' },
  { code: 'QSY', question: '¿Cambio de frecuencia?', statement: 'Cambiá a otra frecuencia.' },
  { code: 'QSO', question: '¿Podés comunicar con…?', statement: 'Comunicado (contacto) entre estaciones.' },
  { code: 'QRX', question: '¿Cuándo me llamás de nuevo?', statement: 'Esperá, te llamo a las…' },
  { code: 'QSB', question: '¿Mi señal tiene desvanecimiento?', statement: 'Tu señal sube y baja (fading).' },
  { code: 'QRV', question: '¿Estás listo?', statement: 'Estoy listo.' },
  { code: 'QSP', question: '¿Podés retransmitir a…?', statement: 'Retransmito a…' },
];

export const RST = {
  r: ['', 'Ilegible', 'Apenas legible', 'Legible con dificultad', 'Legible casi sin dificultad', 'Perfectamente legible'],
  s: ['', 'Apenas perceptible', 'Muy débil', 'Débil', 'Regular', 'Bastante buena', 'Buena', 'Moderadamente fuerte', 'Fuerte', 'Muy fuerte'],
  t: ['', 'Muy áspero', 'Áspero de CA', 'Rectificado áspero', 'Rectificado áspero algo musical', 'Rectificado modulado', 'Modulado con trino', 'Casi CC con ondulación', 'Casi CC', 'Tono CC puro'],
} as const;

export const MORSE: Readonly<Record<string, string>> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '@': '.--.-.', "'": '.----.', '(': '-.--.', ')': '-.--.-',
  ':': '---...', '"': '.-..-.',
};

const REVERSE = new Map(Object.entries(MORSE).map(([k, v]) => [v, k]));

/** Orden de Koch (LCWO): se aprende de a una letra, siempre a velocidad real. */
export const KOCH_ORDER = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';

const ACCENTS: Record<string, string> = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U', Ñ: 'N' };

/** Texto → Morse. Letras separadas por espacio, palabras por " / ". */
export function textToMorse(text: string): string {
  return text.toUpperCase().trim().split(/\s+/).filter(Boolean)
    .map((word) => [...word].map((ch) => MORSE[ACCENTS[ch] ?? ch]).filter(Boolean).join(' '))
    .filter(Boolean).join(' / ');
}

/** Morse → texto. Acepta . - · — _ y separadores " / " o 3+ espacios. */
export function morseToText(code: string): string {
  const norm = code.replace(/[·•]/g, '.').replace(/[—–_−]/g, '-').trim();
  return norm.split(/\s*\/\s*|\s{3,}/).filter(Boolean)
    .map((word) => word.trim().split(/\s+/).map((sym) => REVERSE.get(sym) ?? '�').join(''))
    .join(' ');
}

/** Duración de un punto en ms para una velocidad en palabras por minuto (PARIS). */
export function ditMs(wpm: number): number {
  return 1200 / wpm;
}
