import type { BoardPin, BoardPinout } from '@/config/pinouts/modules';
import type { PinKind } from '@/config/pinouts/wiring';

export interface PinAssign { name: string; kind: PinKind }
export type AssignMap = Map<string, PinAssign>;
export const PITCH = 30;
export const BOARD_W = 240;
export const PIN_TOP = 46;
export const primaryOf = (pin: BoardPin) => pin.labels.find((label) => label.primary) ?? pin.labels[0];
export const labelWidth = (text: string) => Math.max(42, text.length * 6.6 + 16);

/** Visual reference: down the left edge, then up the right edge. */
export const diagramPinNumber = (board: BoardPinout, side: 'left' | 'right', index: number) =>
  side === 'left' ? index + 1 : board.left.length + board.right.length - index;

function sideWidth(pins: BoardPin[], assign?: AssignMap) {
  return pins.reduce((max, pin) => {
    const primary = primaryOf(pin);
    const used = assign?.get(primary.text);
    return Math.max(max, labelWidth(primary.text) + (used ? labelWidth(used.name) + 6 : 0));
  }, 0) + 18;
}

export function boardGeometry(board: BoardPinout, assign?: AssignMap) {
  const boardX = sideWidth(board.left, assign);
  const boardR = boardX + BOARD_W;
  const bottom = PIN_TOP + (Math.max(board.left.length, board.right.length) - 1) * PITCH + 92;
  return { boardX, boardR, bottom, width: boardR + sideWidth(board.right, assign), height: bottom + 16 };
}
