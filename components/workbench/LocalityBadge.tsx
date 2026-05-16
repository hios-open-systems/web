'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import styles from './workbench.module.css';

export type Locality = 'local' | 'network';

/**
 * Honest data-locality indicator. `local` tools never touch the network;
 * `network` tools make outbound requests, so we say so instead of pretending
 * everything stays on the operator's machine.
 */
export function LocalityBadge({ kind }: { kind: Locality }) {
  const t = useTranslations('Workbench.toolHeader');
  const isLocal = kind === 'local';

  return (
    <Tooltip title={t(isLocal ? 'localHint' : 'networkHint')}>
      <span
        className={`${styles.localityBadge} ${
          isLocal ? styles.localityLocal : styles.localityNetwork
        }`}
      >
        {isLocal ? <LockOutlined /> : <GlobalOutlined />}
        {t(isLocal ? 'localLabel' : 'networkLabel')}
      </span>
    </Tooltip>
  );
}
