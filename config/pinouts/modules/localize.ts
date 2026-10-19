import type { Breakout, BreakoutNote, BreakoutTable } from './breakout';

/** Text only: pin identity, electrical roles, geometry and lab profiles stay shared. */
export interface BreakoutCopy {
  name: string;
  description: string;
  form?: string;
  iface?: string;
  voltage?: string;
  pins: { name: string; label?: string; to?: string; note?: string }[];
  notes?: Pick<BreakoutNote, 'title' | 'body'>[];
  gain?: BreakoutTable;
  channel?: BreakoutTable;
  jumpers?: BreakoutTable;
}

export function localizeBreakout(source: Breakout, copy: BreakoutCopy): Breakout {
  const pins = new Map(copy.pins.map((pin) => [pin.name, pin]));
  return {
    ...source,
    name: copy.name,
    summary: copy.description,
    form: copy.form,
    iface: copy.iface,
    voltage: copy.voltage,
    pins: source.pins.map((pin) => ({ ...pin, ...pins.get(pin.name) })),
    notes: source.notes?.map((note, index) => ({ ...note, ...copy.notes?.[index] })),
    gain: copy.gain,
    channel: copy.channel,
    jumpers: copy.jumpers,
  };
}
