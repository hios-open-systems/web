'use client';

import { Fragment } from 'react';
import { useWiringGuide } from '../WiringGuideContext';
import styles from '../wiring-guide.module.css';

export function KeymapView() {
  const guide = useWiringGuide();
  const keymap = guide.keymap;
  if (!keymap) return null;

  return (
    <section>
      <p className={styles.hint}>
        Tu layout físico: la fila de navegación (directa) arriba y las 2 filas de acción (matriz 2×5) abajo. Cada tecla muestra qué GPIO de FILA y de COLUMNA la forman.
      </p>

      <div className={styles.blockTitle}>Fila navegación — directos (sin matriz)</div>
      <div className={styles.navRow}>
        {keymap.navRow.map((nav) =>
          nav.kind === 'aux' ? (
            <div key={nav.label} className={styles.navCell}>
              <div className={styles.navName} style={{ color: 'var(--pw-role-dim)' }}>
                {nav.label}
              </div>
              <div className={styles.navSub}>GPIO {nav.gpio}</div>
            </div>
          ) : (
            <div key={nav.logic} className={styles.navCell} style={{ borderColor: 'var(--pw-role-pwm)' }}>
              <div className={styles.navName} style={{ color: 'var(--pw-role-pwm)' }}>
                {nav.logic}
              </div>
              <div className={styles.navSub}>GPIO {nav.gpio} · directo</div>
            </div>
          ),
        )}
      </div>

      <div className={styles.blockTitle}>Filas de acción — matriz 2×5</div>
      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          {keymap.cols.map((col) => (
            <div key={col.c} className={styles.colHead}>
              COL {col.c}
              <br />
              GPIO {col.gpio}
            </div>
          ))}
          {keymap.rows.map((row) => (
            <Fragment key={row.r}>
              <div className={styles.rowBand}>
                FILA {row.r} · GPIO {row.gpio} — {row.name}
              </div>
              {row.keys.map((key, index) => (
                <div key={key} className={styles.cell} style={{ borderColor: 'var(--pw-role-mtx)' }}>
                  <div className={styles.cellName} style={{ color: 'var(--pw-role-mtx)' }}>
                    {key}
                  </div>
                  <div className={styles.cellPins}>
                    F·{row.gpio} × C·{keymap.cols[index].gpio}
                  </div>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
