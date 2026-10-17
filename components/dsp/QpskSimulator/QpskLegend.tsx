import React from 'react';
import styles from './qpskSimulator.module.css';

export function QpskLegend() {
  return (
    <footer className={styles.legendFooter}>
      <strong>💡 Tip para observar los cambios de fase:</strong>
      <p style={{ marginTop: 6, marginBottom: 6 }}>
        Pausá la señal con el botón <em>PAUSAR</em> o reducí la velocidad a <code>0.0x</code>.
        Fijate en las líneas verticales punteadas: cuando cambian los bits (por ejemplo de{' '}
        <code>00</code> a <code>11</code>), la onda verde <strong>CH3</strong> se invierte
        abruptamente 180° respecto a la onda gris de referencia (0°).
      </p>
      <p style={{ margin: 0 }}>
        En la pantalla X-Y de la derecha, la transición entre <code>00</code> y <code>11</code>{' '}
        cruza exactamente por el centro <code>(0,0)</code>, provocando que la envolvente pase
        momentáneamente por amplitud cero. En sistemas de radio o fibra óptica con amplificadores
        saturados, ese cruce genera distorsión no lineal (motivo por el cual nació OQPSK). Al subir
        el ruido <strong>AWGN / OSNR</strong> por encima de 0.35, las nubes cruzan los umbrales de
        decisión, disparando el contador de errores <em>Pre-FEC BER</em>.
      </p>
    </footer>
  );
}
