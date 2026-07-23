/**
 * Calculadora de delay: tempo musical <-> milisegundos <-> distancia acústica.
 *
 * Dos conversiones independientes que en la práctica se usan juntas:
 *
 * 1. BPM -> ms: para sincronizar delays/echos con el tempo de un tema.
 *    Un beat (negra) a X BPM dura 60000/X ms; el resto de las figuras
 *    son múltiplos o fracciones de ese beat.
 *
 * 2. ms -> metros: el sonido viaja a ~343 m/s (a 20 °C), así que un retardo
 *    en ms equivale a una distancia física. Es la base de la alineación de
 *    sistemas PA: si un parlante está 10 m más lejos, su señal llega
 *    ~29 ms tarde y hay que compensarlo.
 *
 * Módulo 100% puro: sin React, sin DOM, sin APIs de Node.
 */

export interface NoteValue {
  /** Figura musical en notación de fracción ("1/4" = negra). */
  label: string;
  /** Duración en beats, tomando la negra (1/4) como 1 beat en compás de 4/4. */
  beats: number;
}

/** De redonda (4 beats) a fusa de compás (1/32 = 0.125 beats). */
export const NOTE_VALUES: NoteValue[] = [
  { label: '1/1', beats: 4 },
  { label: '1/2', beats: 2 },
  { label: '1/4', beats: 1 },
  { label: '1/8', beats: 0.5 },
  { label: '1/16', beats: 0.25 },
  { label: '1/32', beats: 0.125 },
];

/**
 * Velocidad del sonido en aire según temperatura (fórmula lineal empírica,
 * válida para el rango habitable): 331.3 m/s a 0 °C + 0.606 m/s por grado.
 * A 20 °C da los famosos ~343 m/s.
 */
export function speedOfSound(temperatureC: number): number {
  return 331.3 + 0.606 * temperatureC;
}

/**
 * Duración de un beat (negra) en ms. 60 segundos / BPM, pasado a ms:
 * a 120 BPM cada beat dura 500 ms.
 */
export function beatDurationMs(bpm: number): number {
  return 60000 / bpm;
}

export interface DelayTime {
  label: string;
  beats: number;
  /** La figura tal cual: beat × beats. */
  straightMs: number;
  /** Con puntillo: la figura + su mitad (×1.5). Suena "arrastrado". */
  dottedMs: number;
  /** Tresillo: 3 notas en el tiempo de 2 (×2/3). Suena "shuffle". */
  tripletMs: number;
}

/**
 * Tabla completa de tiempos de delay para un BPM: cada figura en sus tres
 * variantes (recta, con puntillo y tresillo). Son los valores que se cargan
 * a mano en un pedal o plugin de delay sin tap-tempo.
 */
export function delayTimes(bpm: number): DelayTime[] {
  const beatMs = beatDurationMs(bpm);
  return NOTE_VALUES.map((note) => ({
    ...note,
    straightMs: beatMs * note.beats,
    dottedMs: beatMs * note.beats * 1.5,
    tripletMs: (beatMs * note.beats * 2) / 3,
  }));
}

/**
 * Milisegundos de retardo -> metros recorridos por el sonido.
 * distancia = tiempo × velocidad (con el tiempo pasado a segundos).
 */
export function msToDistanceMeters(milliseconds: number, temperatureC = 20): number {
  return (milliseconds / 1000) * speedOfSound(temperatureC);
}

/**
 * Cuántos ms tarda el sonido en recorrer 1 metro (~2.9 ms a 20 °C).
 * Regla mnemotécnica de sonidista: "3 ms por metro".
 */
export function msPerMeter(temperatureC = 20): number {
  return 1000 / speedOfSound(temperatureC);
}
