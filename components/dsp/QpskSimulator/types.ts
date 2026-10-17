export type Dibit = '00' | '01' | '11' | '10';

export type ScreenViewMode = 'both' | 'time' | 'constellation';

export interface QpskSymbolInfo {
  I: number;
  Q: number;
  phaseDeg: number;
  phaseRad: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CanvasSize {
  w: number;
  h: number;
}

export interface QpskSimConfig {
  dibits: Dibit[];
  cyclesPerSymbol: number;
  noiseLevel: number;
  scrollSpeed: number;
  running: boolean;
  showReference: boolean;
  showTrajectories: boolean;
}
