'use client';
import { Card, Select, Typography } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import workbenchStyles from '../../workbench.module.css';
import styles from '../audioTools.module.css';

const { Text } = Typography;

interface Props {
  instrument: string;
  instruments: string[];
  tuningId: string;
  tuningOptions: { value: string; label: string }[];
  timbre: OscillatorType;
  micError: string | null;
  onInstrument: (inst: string) => void;
  onTuning: (id: string) => void;
  onTimbre: (timbre: OscillatorType) => void;
}

export function TunerHeaderControls({
  instrument,
  instruments,
  tuningId,
  tuningOptions,
  timbre,
  micError,
  onInstrument,
  onTuning,
  onTimbre,
}: Props) {
  const t = useTranslations('Workbench.guitarTuner');

  return (
    <Card className={workbenchStyles.sectionCard} styles={{ body: { padding: 16 } }}>
      <div className={styles.tunerControls}>
        <div className={styles.tunerField}>
          <Text className={styles.statLabel}>{t('instrumentLabel')}</Text>
          <Select
            value={instrument}
            onChange={onInstrument}
            options={instruments.map((id) => ({ value: id, label: t(`instruments.${id}`) }))}
          />
        </div>
        <div className={styles.tunerField}>
          <Text className={styles.statLabel}>{t('tuningLabel')}</Text>
          <Select value={tuningId} onChange={onTuning} options={tuningOptions} />
        </div>
        <div className={styles.tunerField}>
          <Text className={styles.statLabel}>{t('timbreLabel')}</Text>
          <Select
            value={timbre}
            onChange={onTimbre}
            options={[
              { value: 'triangle', label: t('timbreTriangle') },
              { value: 'sine', label: t('timbreSine') },
              { value: 'sawtooth', label: t('timbreSawtooth') },
              { value: 'square', label: t('timbreSquare') },
            ]}
          />
        </div>
        <Text type="secondary" style={{ alignSelf: 'center' }}>
          <SoundOutlined /> {t('stringHint')}
        </Text>
      </div>
      {micError ? (
        <Text type="danger" style={{ display: 'block', marginTop: 12 }}>
          {t('micError')}
        </Text>
      ) : null}
    </Card>
  );
}
