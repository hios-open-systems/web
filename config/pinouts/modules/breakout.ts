export type BreakoutKind =
  | 'mcu'
  | 'dac'
  | 'amp'
  | 'power'
  | 'display'
  | 'input'
  | 'led'
  | 'connector'
  | 'battery';

export type PinRole =
  | 'io'
  | 'adc'
  | 'pwm'
  | 'i2s'
  | 'i2c'
  | 'spi'
  | 'dac'
  | 'neo'
  | 'pwr5'
  | 'pwr33'
  | 'pwr'
  | 'gnd'
  | 'nc'
  | 'dim';

export interface BreakoutPin {
  name: string;
  role: PinRole;
  alt?: string;
  to?: string;
  note?: string;
  side?: 'left' | 'right';
  req?: boolean;
}

export interface BreakoutNote {
  title: string;
  body: string;
  warn?: boolean;
}

export interface BreakoutTable {
  head: [string, string];
  rows: [string, string][];
}

export interface Breakout {
  id: string;
  name: string;
  kind: BreakoutKind;
  summary: string;
  form?: string;
  iface?: string;
  voltage?: string;
  pins: BreakoutPin[];
  notes?: BreakoutNote[];
  gain?: BreakoutTable;
  channel?: BreakoutTable;
  jumpers?: BreakoutTable;
  usedBy?: string[];
  datasheetUrl?: string;
}

export const ROLE_LABEL: Record<PinRole, string> = {
  io: 'IO',
  adc: 'ADC',
  pwm: 'PWM',
  i2s: 'I2S',
  i2c: 'I2C',
  spi: 'SPI',
  dac: 'DAC',
  neo: 'NEO',
  pwr5: '5V',
  pwr33: '3V3',
  pwr: 'PWR',
  gnd: 'GND',
  nc: 'NC',
  dim: 'SYS',
};

export const roleVar = (role: PinRole): string => `var(--pw-role-${role})`;

export const KIND_ORDER: BreakoutKind[] = [
  'mcu',
  'amp',
  'dac',
  'display',
  'input',
  'led',
  'power',
  'battery',
  'connector',
];

export const matchesBreakout = (breakout: Breakout, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    breakout.name.toLowerCase().includes(q) ||
    breakout.id.toLowerCase().includes(q) ||
    breakout.summary.toLowerCase().includes(q) ||
    (breakout.iface ?? '').toLowerCase().includes(q) ||
    breakout.pins.some(
      (pin) => pin.name.toLowerCase().includes(q) || (pin.alt ?? '').toLowerCase().includes(q),
    )
  );
};
