import type { Breakout, BreakoutKind } from './breakout';
import { KIND_ORDER, matchesBreakout } from './breakout';
import { MCU_BREAKOUTS } from './mcu';
import { AUDIO_BREAKOUTS } from './audio';
import { DISPLAY_BREAKOUTS } from './display';
import { INPUT_BREAKOUTS } from './input';
import { LED_BREAKOUTS } from './led';
import { POWER_BREAKOUTS } from './power';
import { BATTERY_BREAKOUTS } from './battery';
import { CONNECTOR_BREAKOUTS } from './connector';

export const BREAKOUTS: Breakout[] = [
  ...MCU_BREAKOUTS,
  ...AUDIO_BREAKOUTS,
  ...DISPLAY_BREAKOUTS,
  ...INPUT_BREAKOUTS,
  ...LED_BREAKOUTS,
  ...POWER_BREAKOUTS,
  ...BATTERY_BREAKOUTS,
  ...CONNECTOR_BREAKOUTS,
];

export interface BreakoutGroup {
  kind: BreakoutKind;
  items: Breakout[];
}

export const searchBreakouts = (query: string): Breakout[] =>
  BREAKOUTS.filter((breakout) => matchesBreakout(breakout, query));

export const groupByKind = (list: Breakout[]): BreakoutGroup[] =>
  KIND_ORDER.map((kind) => ({ kind, items: list.filter((b) => b.kind === kind) })).filter(
    (group) => group.items.length > 0,
  );

export const getBreakout = (id: string): Breakout | undefined =>
  BREAKOUTS.find((breakout) => breakout.id === id);

export const PINOUTS_ATTRIBUTION = {
  source: 'Luis Llamas',
  url: 'https://www.luisllamas.es/en/esp32-hardware-details-pinout/',
  description: 'Inspirado en los recursos de pinout de luisllamas.es',
};

export * from './breakout';

