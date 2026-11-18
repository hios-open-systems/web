// Bandas de radioaficionado: límites de la atribución UIT Región 2 (Américas)
// y usos típicos. Los segmentos y potencias por categoría en Argentina salen del
// Anexo A del Reglamento ENACOM (Res. 3635/2017) y TODAVÍA NO están verificados
// contra el texto primario: `novicio` resume la tabla de AMSAT Argentina
// (fuente secundaria) y se muestra marcado como "a verificar".

export type Range = 'LF' | 'MF' | 'HF' | 'VHF' | 'UHF';
export type NovicioAccess = 'si' | 'parcial' | 'no';

export interface Band {
  name: string;
  startMHz: number;
  endMHz: number;
  range: Range;
  /** Propagación dominante. */
  propagation: string;
  uses: string;
  novicio: NovicioAccess;
  note?: string;
}

export const BANDS: readonly Band[] = [
  { name: '2200 m', startMHz: 0.1357, endMHz: 0.1378, range: 'LF', propagation: 'Onda terrestre', uses: 'Experimentación, CW lento, modos digitales débiles', novicio: 'si', note: 'Máx. 1 W PIRE' },
  { name: '630 m', startMHz: 0.472, endMHz: 0.479, range: 'MF', propagation: 'Onda terrestre, ionosférica de noche', uses: 'CW y digitales (WSPR)', novicio: 'si', note: 'Máx. 5 W PIRE' },
  { name: '160 m', startMHz: 1.8, endMHz: 2.0, range: 'MF', propagation: 'Nocturna, mucho ruido', uses: 'DX nocturno, CW', novicio: 'si' },
  { name: '80 m', startMHz: 3.5, endMHz: 4.0, range: 'HF', propagation: 'NVIS regional; DX de noche', uses: 'Charlas regionales, redes de emergencia', novicio: 'si' },
  { name: '60 m', startMHz: 5.3515, endMHz: 5.3665, range: 'HF', propagation: 'NVIS', uses: 'Emergencias, CW y digitales', novicio: 'si', note: 'Máx. 25 W PIRE' },
  { name: '40 m', startMHz: 7.0, endMHz: 7.3, range: 'HF', propagation: 'Regional de día, DX de noche', uses: 'La banda más usada en Argentina', novicio: 'si' },
  { name: '30 m', startMHz: 10.1, endMHz: 10.15, range: 'HF', propagation: 'Día y noche', uses: 'Sólo CW y digitales', novicio: 'no' },
  { name: '20 m', startMHz: 14.0, endMHz: 14.35, range: 'HF', propagation: 'DX de día', uses: 'La banda de DX por excelencia, FT8', novicio: 'parcial', note: 'Novicio: sólo un tramo de CW/digitales' },
  { name: '17 m', startMHz: 18.068, endMHz: 18.168, range: 'HF', propagation: 'DX de día', uses: 'DX sin concursos', novicio: 'no' },
  { name: '15 m', startMHz: 21.0, endMHz: 21.45, range: 'HF', propagation: 'DX con buen ciclo solar', uses: 'DX', novicio: 'parcial', note: 'Novicio: sólo un tramo' },
  { name: '12 m', startMHz: 24.89, endMHz: 24.99, range: 'HF', propagation: 'DX con ciclo solar alto', uses: 'DX', novicio: 'no' },
  { name: '10 m', startMHz: 28.0, endMHz: 29.7, range: 'HF', propagation: 'DX con ciclo alto; local con ciclo bajo', uses: 'SSB, FM, repetidoras, satélites', novicio: 'si' },
  { name: '6 m', startMHz: 50, endMHz: 54, range: 'VHF', propagation: 'Esporádica E ("banda mágica")', uses: 'Aperturas de E esporádica', novicio: 'si' },
  { name: '2 m', startMHz: 144, endMHz: 148, range: 'VHF', propagation: 'Línea de vista', uses: 'FM local, repetidoras, APRS, satélites', novicio: 'si' },
  { name: '1,25 m', startMHz: 220, endMHz: 225, range: 'VHF', propagation: 'Línea de vista', uses: 'FM local, enlaces', novicio: 'si' },
  { name: '70 cm', startMHz: 420, endMHz: 450, range: 'UHF', propagation: 'Línea de vista, atraviesa mejor edificios', uses: 'FM, repetidoras, DMR, satélites', novicio: 'si', note: 'En Argentina se usa 430–440 MHz' },
  { name: '23 cm', startMHz: 1240, endMHz: 1300, range: 'UHF', propagation: 'Línea de vista', uses: 'ATV, enlaces, satélites', novicio: 'si' },
];

export const RANGE_COLORS: Record<Range, string> = {
  LF: '#a855f7', MF: '#6366f1', HF: '#0ea5e9', VHF: '#10b981', UHF: '#f59e0b',
};
