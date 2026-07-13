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

/**
 * Pinout FÍSICO de una placa: los pines tal como salen del header, en orden, con
 * la etiqueta de la serigrafía. Es lo que necesitás con la placa en la mano para
 * contar hasta el pin correcto — no un resumen por rangos.
 */
export type PinFunc =
  | 'power'
  | 'gnd'
  | 'gpio'
  | 'adc'
  | 'touch'
  | 'spi'
  | 'i2c'
  | 'i2s'
  | 'uart'
  | 'dac'
  | 'usb'
  | 'strap'
  | 'rgb'
  | 'in'
  | 'nc';

export interface BoardLabel {
  text: string;
  func: PinFunc;
  /** la etiqueta de la serigrafía (la que va pegada a la placa) */
  primary?: boolean;
}

export interface BoardPin {
  /** posición física en el header, contando desde arriba */
  pos: number;
  labels: BoardLabel[];
}

export interface BoardPinout {
  /** lo que dice el conector de arriba (USB-C, micro-USB…) */
  usb?: string;
  left: BoardPin[];
  right: BoardPin[];
}

export const FUNC_LABEL: Record<PinFunc, string> = {
  power: 'Power',
  gnd: 'GND',
  gpio: 'GPIO',
  adc: 'ADC',
  touch: 'Touch',
  spi: 'SPI',
  i2c: 'I2C',
  i2s: 'I2S',
  uart: 'UART',
  dac: 'DAC',
  usb: 'USB',
  strap: 'Strapping',
  rgb: 'RGB',
  in: 'Solo entrada',
  nc: 'No usable',
};

export const funcVar = (func: PinFunc): string => `var(--pw-func-${func})`;

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
  /** solo para placas (MCU): el pinout físico del header, pin por pin */
  board?: BoardPinout;
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
