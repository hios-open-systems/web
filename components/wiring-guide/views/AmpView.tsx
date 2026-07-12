'use client';

import { useWiringGuide } from '../WiringGuideContext';
import { i2sGpio } from './schematic';
import { AmpModuleSvg } from './AmpModuleSvg';
import { AmpStereoSvg } from './AmpStereoSvg';
import { AmpMeasureSteps } from './AmpMeasureSteps';
import styles from '../wiring-guide.module.css';

export function AmpView() {
  const guide = useWiringGuide();
  const i2s = i2sGpio(guide);

  return (
    <section>
      <p className={styles.hint}>
        Pinout de cada MAX98357A y la resistencia de SD que fija el canal. Los 2 amplis comparten las 3 líneas I2S; solo cambia la R de SD (L vs R). GAIN flotante = 9 dB. Parlante 4–8Ω directo (sin filtro).
      </p>
      <div className={styles.blockTitle}>Un módulo — pinout + resistencia de SD</div>
      <div className={styles.svgScroll}>
        <AmpModuleSvg i2s={i2s} />
      </div>
      <div className={styles.blockTitle}>Stereo — 2 módulos en el mismo bus</div>
      <div className={styles.svgScroll}>
        <AmpStereoSvg i2s={i2s} />
      </div>
      <AmpMeasureSteps />
    </section>
  );
}
