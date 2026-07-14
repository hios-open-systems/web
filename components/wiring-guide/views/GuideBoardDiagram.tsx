'use client';

import { useMemo } from 'react';
import { getBreakout } from '@/config/pinouts/modules';
import { BoardDiagram, type PinAssign } from '@/components/pinouts/breakout/BoardDiagram';
import { useWiringGuide } from '../WiringGuideContext';
import { RichText } from '../RichText';
import styles from '../wiring-guide.module.css';

/**
 * La placa de la guía: el DevKitC-1 de verdad, con TUS pines encendidos encima.
 *
 * Reemplaza al viejo "mapa de pines", que partía la lista al medio y la dibujaba como
 * dos columnas a los costados de un rectángulo. Eso no era la placa: los pines no
 * estaban en su orden físico, así que no servía para lo único que importa con el
 * soldador en la mano — contar hasta el pin correcto.
 */
export function GuideBoardDiagram() {
  const guide = useWiringGuide();

  const board = useMemo(
    () => (guide.meta.boardId ? getBreakout(guide.meta.boardId)?.board : undefined),
    [guide],
  );

  /**
   * Indexado por la serigrafía, no por GPIO — así los pines de ALIMENTACIÓN del header
   * (5V, GND, 3V3) también quedan resaltados. Son los primeros que soldás; dejarlos
   * apagados era decir "no los toques".
   */
  const assign = useMemo(() => {
    const map = new Map<string, PinAssign>();
    guide.pins.forEach((pin) => map.set(`IO${pin.gpio}`, { name: pin.name, kind: pin.kind }));

    // los rieles: se leen de los módulos, que es donde vive la alimentación
    const rails = new Set(guide.modules.map((m) => m.rail));
    map.set('GND', { name: 'GND común', kind: 'dim' });
    if (rails.has(5)) map.set('5V', { name: 'Riel 5V (entra del buck)', kind: 'pwm' });
    if (rails.has(33)) map.set('3V3', { name: 'Riel 3V3 (sale del LDO)', kind: 'adc' });

    return map;
  }, [guide]);

  if (!board) return null;

  return (
    <div className={styles.boardBlock}>
      <BoardDiagram board={board} name={guide.meta.mcu} assign={assign} />

      {guide.divergence?.length ? (
        <div className={styles.divergence}>
          <p className={styles.divergenceHead}>
            ⚠️ Esta guía es el cableado <strong>objetivo (rev {guide.meta.rev})</strong>. El firmware
            que hay hoy en el repo lee otra cosa en {guide.divergence.length} pines. Si soldás esto y
            flasheás lo que está commiteado, esos pines <strong>no van a hacer lo que dice acá</strong>.
          </p>
          <table className={styles.divergenceTable}>
            <thead>
              <tr>
                <th>GPIO</th>
                <th>La guía dice</th>
                <th>El firmware lee</th>
                <th>Por qué</th>
              </tr>
            </thead>
            <tbody>
              {guide.divergence.map((d) => (
                <tr key={d.gpio}>
                  <td className={styles.divGpio}>{d.gpio}</td>
                  <td>{d.guide}</td>
                  <td className={styles.divFw}>{d.firmware}</td>
                  <td className={styles.divWhy}>
                    <RichText text={d.why} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
