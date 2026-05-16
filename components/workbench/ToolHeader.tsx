'use client';

import React from 'react';
import { Typography } from 'antd';
import { LocalityBadge, type Locality } from './LocalityBadge';
import styles from './workbench.module.css';

const { Title, Paragraph } = Typography;

interface ToolHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  locality: Locality;
  /** Action buttons (load example, clear, copy, …). */
  actions?: React.ReactNode;
}

/**
 * Shared landing header for every workbench tool. One component keeps the
 * tools visually consistent and lets the catalog grow without each tool
 * hand-rolling its own header slab.
 */
export function ToolHeader({
  eyebrow,
  title,
  description,
  locality,
  actions,
}: ToolHeaderProps) {
  return (
    <header className={styles.toolHeader}>
      <div className={styles.toolHeaderTopRow}>
        <span className={styles.toolHeaderEyebrow}>{eyebrow}</span>
        <LocalityBadge kind={locality} />
      </div>
      <Title level={1} className={styles.toolHeaderTitle}>
        {title}
      </Title>
      <Paragraph className={styles.toolHeaderDescription}>{description}</Paragraph>
      {actions ? <div className={styles.toolHeaderActions}>{actions}</div> : null}
    </header>
  );
}
