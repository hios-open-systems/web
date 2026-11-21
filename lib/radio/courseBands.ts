export const SPEED_OF_LIGHT_METERS_PER_SECOND = 299_792_458;

export const radioFrequencyBands = [
  { id: 'vlf', minHz: 3e3, maxHz: 3e4 },
  { id: 'lf', minHz: 3e4, maxHz: 3e5 },
  { id: 'mf', minHz: 3e5, maxHz: 3e6 },
  { id: 'hf', minHz: 3e6, maxHz: 3e7 },
  { id: 'vhf', minHz: 3e7, maxHz: 3e8 },
  { id: 'uhf', minHz: 3e8, maxHz: 3e9 },
  { id: 'shf', minHz: 3e9, maxHz: 3e10 },
  { id: 'ehf', minHz: 3e10, maxHz: 3e11 },
] as const;

export type FrequencyBand = typeof radioFrequencyBands[number];
export type FrequencyBandId = FrequencyBand['id'];

export const frequencyEdgesHz = [radioFrequencyBands[0].minHz, ...radioFrequencyBands.map((band) => band.maxHz)];

/** A single logarithmic axis across all eight decades; result is in [0, 1]. */
export function spectrumPosition(frequencyHz: number): number {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) throw new RangeError('Frequency must be finite and positive.');
  const minimum = radioFrequencyBands[0].minHz;
  const maximum = radioFrequencyBands[radioFrequencyBands.length - 1].maxHz;
  return Math.max(0, Math.min(1, Math.log10(frequencyHz / minimum) / Math.log10(maximum / minimum)));
}

export function formatFrequency(frequencyHz: number, locale: string): string {
  const [scale, unit] = frequencyHz >= 1e9 ? [1e9, 'GHz'] : frequencyHz >= 1e6 ? [1e6, 'MHz'] : frequencyHz >= 1e3 ? [1e3, 'kHz'] : [1, 'Hz'];
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(frequencyHz / scale)} ${unit}`;
}

export function formatFrequencyRange(band: FrequencyBand, locale: string): string {
  return `${formatFrequency(band.minHz, locale)}–${formatFrequency(band.maxHz, locale)}`;
}

export function wavelengthRangeMeters(band: FrequencyBand): { min: number; max: number } {
  return { min: SPEED_OF_LIGHT_METERS_PER_SECOND / band.maxHz, max: SPEED_OF_LIGHT_METERS_PER_SECOND / band.minHz };
}

export function formatWavelengthRange(band: FrequencyBand, locale: string): string {
  const { min, max } = wavelengthRangeMeters(band);
  const roundedMin = Number(min.toPrecision(2));
  const [scale, unit] = roundedMin >= 1e3 ? [1e3, 'km'] : roundedMin >= 1 ? [1, 'm'] : roundedMin >= 0.01 ? [0.01, 'cm'] : [0.001, 'mm'];
  const format = (value: number) => new Intl.NumberFormat(locale, { maximumSignificantDigits: 2 }).format(value / scale);
  return `≈ ${format(min)}–${format(max)} ${unit}`;
}

export const radioBandSources = {
  itu: 'https://www.itu.int/dms_pubrec/itu-r/rec/v/R-REC-V.431-9-202510-I%21%21PDF-E.pdf',
  enacom: 'https://www.enacom.gob.ar/normativa-principal_p2974',
} as const;
