// Atenuación típica de cables coaxiles de 50 Ω (dB cada 100 m). Valores
// redondeados de hojas de datos comunes (Belden / Times Microwave). Cada marca
// varía: es para comparar órdenes de magnitud, no para reemplazar el datasheet.

export interface CoaxCable {
  id: string;
  name: string;
  diameterMm: number;
  velocityFactor: number;
  /** [MHz, dB/100 m] ordenados por frecuencia. */
  loss: ReadonlyArray<readonly [number, number]>;
}

export const COAX_CABLES: readonly CoaxCable[] = [
  {
    id: 'rg58', name: 'RG-58', diameterMm: 5, velocityFactor: 0.66,
    loss: [[1, 1.4], [10, 4.6], [50, 10.5], [100, 15.4], [200, 23], [400, 33], [1000, 60]],
  },
  {
    id: 'rg213', name: 'RG-213', diameterMm: 10.3, velocityFactor: 0.66,
    loss: [[1, 0.6], [10, 2], [50, 4.6], [100, 6.9], [200, 10], [400, 15], [1000, 26]],
  },
  {
    id: 'lmr400', name: 'LMR-400', diameterMm: 10.3, velocityFactor: 0.85,
    loss: [[1, 0.4], [10, 1.3], [50, 2.9], [100, 4.1], [200, 5.9], [400, 8.6], [1000, 13.8]],
  },
];

/** Interpola en log-log la atenuación (dB/100 m) a una frecuencia. */
export function lossPer100m(cable: CoaxCable, frequencyMHz: number): number {
  const pts = cable.loss;
  if (frequencyMHz <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [f1, l1] = pts[i - 1];
    const [f2, l2] = pts[i];
    if (frequencyMHz <= f2) {
      const t = Math.log(frequencyMHz / f1) / Math.log(f2 / f1);
      return Math.exp(Math.log(l1) + t * Math.log(l2 / l1));
    }
  }
  const [fa, la] = pts[pts.length - 2];
  const [fb, lb] = pts[pts.length - 1];
  const slope = Math.log(lb / la) / Math.log(fb / fa);
  return lb * (frequencyMHz / fb) ** slope;
}

export function cableLossDb(cable: CoaxCable, frequencyMHz: number, lengthM: number): number {
  return (lossPer100m(cable, frequencyMHz) * lengthM) / 100;
}

/** Potencia que llega a la antena tras la pérdida del cable. */
export function powerAfterLoss(watts: number, lossDb: number): number {
  return watts * 10 ** (-lossDb / 10);
}
