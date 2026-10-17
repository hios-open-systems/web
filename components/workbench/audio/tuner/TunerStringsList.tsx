'use client';
import { Card } from 'antd';
import { CheckCircleFilled, PauseCircleFilled, PlayCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import workbenchStyles from '../../workbench.module.css';
import styles from '../audioTools.module.css';

interface StringItem {
  label: string;
  freq: number;
}

interface Props {
  strings: StringItem[];
  near: { label: string; cents: number; index: number } | null;
  inTune: boolean;
  loopIndex: number | null;
  onPluck: (freq: number) => void;
  onToggleLoop: (index: number, freq: number) => void;
}

export function TunerStringsList({ strings, near, inTune, loopIndex, onPluck, onToggleLoop }: Props) {
  const t = useTranslations('Workbench.guitarTuner');

  return (
    <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 16 } }}>
      <div className={styles.stringList}>
        {strings.map((s, i) => {
          const isNear = near?.index === i;
          const tuned = isNear && inTune;
          const looping = loopIndex === i;
          return (
            <div
              key={`${s.label}-${i}`}
              className={`${styles.stringRow} ${isNear ? styles.stringRowActive : ''} ${tuned ? styles.stringInTune : ''}`}
            >
              <button
                type="button"
                className={styles.stringMain}
                onClick={() => onPluck(s.freq)}
                aria-label={`${t('pluckString')} ${s.label}`}
              >
                <span className={styles.stringLabel}>{s.label}</span>
                <span className={styles.stringLine} style={{ height: 2 + (strings.length - i) }} />
                <span className={styles.stringFreq}>{s.freq.toFixed(1)} Hz</span>
              </button>
              <button
                type="button"
                className={`${styles.stringLoop} ${looping ? styles.stringLoopActive : ''}`}
                onClick={() => onToggleLoop(i, s.freq)}
                aria-label={looping ? t('loopStop') : t('loopPlay')}
                title={looping ? t('loopStop') : t('loopPlay')}
              >
                {looping ? <PauseCircleFilled /> : <PlayCircleOutlined />}
              </button>
              <span className={styles.stringCheck}>{tuned ? <CheckCircleFilled /> : null}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
