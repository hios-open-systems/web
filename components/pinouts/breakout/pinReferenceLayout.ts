import type { Breakout } from '@/config/pinouts/modules';

export interface ContactPoint { x: number; y: number }

/** Anchors on the illustrative artwork, not a vendor-independent solder-pad order. */
export function contactPoint(breakout: Breakout, index: number): ContactPoint {
  const pin = breakout.pins[index];
  const side = pin.side === 'right' ? 'right' : 'left';
  const onSide = breakout.pins.filter((item) => (item.side === 'right' ? 'right' : 'left') === side);
  const row = onSide.indexOf(pin);
  switch (breakout.id) {
    case 'pcm5102': return { x: side === 'left' ? 42 : 238, y: side === 'left' ? 35 + row * 18 : 55 + row * 35 };
    case 'max98357a':
      if (pin.name.startsWith('SPK')) return { x: 216, y: pin.name === 'SPK+' ? 68 : 98 };
      return { x: side === 'left' ? 42 : 238, y: 35 + row * 24 };
    case 'ky-040': case 'hw-504': case 'ky-009': return { x: 90 + index * 25, y: 151 };
    case 'ws2812': return { x: pin.name === 'DOUT' ? 267 : 13, y: pin.name === '5V' ? 69 : pin.name === 'GND' ? 111 : 90 };
    case 'lm2596': return { x: side === 'left' ? 38 : 242, y: row === 0 ? 45 : 111 };
    case 'charger-2s': return { x: side === 'left' ? 38 : 242, y: 45 + row * 33 };
    case 'holder-2s': return [{ x: 48, y: 68 }, { x: 48, y: 126 }, { x: 248, y: 97 }][index];
    case 'plug-trrs': return { x: 140, y: 34 + index * 18 };
    case 'jack-trs': return { x: 140, y: 85 + index * 20 };
    default: return { x: 48 + index * (184 / Math.max(1, breakout.pins.length - 1)), y: 158 };
  }
}
