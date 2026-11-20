import { formatFrequency } from './bands.ts';

export const amateurBands = [
  { id: 'eighty', label: '80 m', family: 'HF', minHz: 3.5e6, maxHz: 4e6 },
  { id: 'forty', label: '40 m', family: 'HF', minHz: 7e6, maxHz: 7.3e6 },
  { id: 'twenty', label: '20 m', family: 'HF', minHz: 14e6, maxHz: 14.35e6 },
  { id: 'two', label: '2 m', family: 'VHF', minHz: 144e6, maxHz: 148e6 },
  { id: 'seventy', label: '70 cm', family: 'UHF', minHz: 430e6, maxHz: 440e6 },
] as const;

export type AmateurBand = typeof amateurBands[number];
export type AmateurBandId = AmateurBand['id'];

export function formatAmateurBandRange(band: Pick<AmateurBand, 'minHz' | 'maxHz'>, locale: string): string {
  return `${formatFrequency(band.minHz, locale)}–${formatFrequency(band.maxHz, locale)}`;
}

export const amateurBandSources = {
  bands: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/202106/archivo_20210615022726_5743.pdf',
  regulation: 'https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-3635-2017-286986/texto',
  propagation: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8312011.pdf',
  indoor: 'https://www.itu.int/rec/R-REC-P.1238/en',
} as const;
