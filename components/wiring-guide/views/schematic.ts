import type { WiringGuide } from '@/config/pinouts/wiring';

export const SCHEM = {
  row: 'var(--pw-role-mtx)',
  col: 'var(--pw-role-io)',
  teal: 'var(--pw-role-i2s)',
  pwr5: 'var(--pw-role-pwr5)',
};

export interface I2sGpio {
  bclk: number;
  lrc: number;
  din: number;
}

export const i2sGpio = (guide: WiringGuide): I2sGpio => {
  const gpioOf = (needle: string): number =>
    guide.pins.find((pin) => pin.kind === 'i2s' && pin.name.includes(needle))?.gpio ?? 0;
  const dataGpio =
    guide.pins.find((pin) => pin.kind === 'i2s' && (pin.name.includes('DIN') || pin.name.includes('DOUT')))
      ?.gpio ?? 0;
  return { bclk: gpioOf('BCLK'), lrc: gpioOf('LRC'), din: dataGpio };
};
