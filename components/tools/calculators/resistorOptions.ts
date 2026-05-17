/* Color-band option tables for the Resistor Color Lab. Data only — the
 * colored-swatch rendering lives in ResistorLabTab. */

export interface BandOption {
  value: string;
  color: string;
  key: string;
}

export const digitOptions: BandOption[] = [
  { value: '0', color: '#000000', key: 'black' },
  { value: '1', color: '#8b4513', key: 'brown' },
  { value: '2', color: '#ff0000', key: 'red' },
  { value: '3', color: '#ff8c00', key: 'orange' },
  { value: '4', color: '#ffd700', key: 'yellow' },
  { value: '5', color: '#008000', key: 'green' },
  { value: '6', color: '#1e90ff', key: 'blue' },
  { value: '7', color: '#9400d3', key: 'violet' },
  { value: '8', color: '#808080', key: 'gray' },
  { value: '9', color: '#ffffff', key: 'white' },
];

export const multiplierOptions: BandOption[] = [
  { value: '1', color: '#000000', key: 'black' },
  { value: '10', color: '#8b4513', key: 'brown' },
  { value: '100', color: '#ff0000', key: 'red' },
  { value: '1000', color: '#ff8c00', key: 'orange' },
  { value: '10000', color: '#ffd700', key: 'yellow' },
  { value: '100000', color: '#008000', key: 'green' },
  { value: '1000000', color: '#1e90ff', key: 'blue' },
  { value: '10000000', color: '#9400d3', key: 'violet' },
  { value: '0.1', color: '#c0c0c0', key: 'silver' },
  { value: '0.01', color: '#d4af37', key: 'gold' },
];

export const toleranceOptions: BandOption[] = [
  { value: '1', color: '#8b4513', key: 'brown' },
  { value: '2', color: '#ff0000', key: 'red' },
  { value: '5', color: '#d4af37', key: 'gold' },
  { value: '10', color: '#c0c0c0', key: 'silver' },
];
