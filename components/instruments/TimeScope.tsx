'use client';

import { Button } from 'antd';
import { useTranslations } from 'next-intl';
import { SignalPlot, type SignalPlotProps, type ScopeSeries } from './SignalPlot';
import { useScopeClock } from './useScopeClock';
import styles from './instrumentScreen.module.css';

export function TimeScope({ sample, ...props }: Omit<SignalPlotProps, 'series' | 'status' | 'controls'> & {
  sample: (animationSeconds: number) => readonly ScopeSeries[];
}) {
  const t = useTranslations('Instrument');
  const clock = useScopeClock();
  return <div ref={clock.ref} data-time-scope>
    <SignalPlot {...props} series={sample(clock.seconds)} status={t(clock.running ? 'simulated' : 'paused')}
      controls={<Button size="small" className={styles.pause} aria-pressed={!clock.running} onClick={clock.toggle}>
        {t(clock.running ? 'pause' : 'resume')}
      </Button>} />
  </div>;
}
