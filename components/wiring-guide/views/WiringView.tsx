'use client';

import { useWiringGuide } from '../WiringGuideContext';
import { WiringKeyCell } from './WiringKeyCell';
import { WiringMatrix } from './WiringMatrix';
import styles from '../wiring-guide.module.css';

export function WiringView() {
  const guide = useWiringGuide();
  if (!guide.keymap) return null;

  return (
    <section>
      <p className={styles.hint}>
        Cómo se suelda cada tecla y cómo se arma la matriz. Punto azul = tap a la COLUMNA · punto naranja = unión a la FILA. Los ALT no entran acá (son directos).
      </p>
      <div className={styles.blockTitle}>Una tecla de acción (repetís lo mismo ×10)</div>
      <div className={styles.svgScroll}>
        <WiringKeyCell />
      </div>
      <div className={styles.blockTitle}>Matriz 2×5 completa — 10 diodos</div>
      <div className={styles.svgScroll}>
        <WiringMatrix keymap={guide.keymap} />
      </div>
      <p className={styles.hint}>
        Buses: cada FILA (naranja) une los cátodos de sus 5 diodos → su GPIO. Cada COLUMNA (azul) une la pata libre de sus 5 switches → su GPIO. Donde una columna cruza una fila sin tecla hay un salto (no se tocan). Si una tecla no registra, el diodo está al revés → dalo vuelta.
      </p>
    </section>
  );
}
