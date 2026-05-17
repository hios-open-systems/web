import React from 'react';
import styles from '../embeddedCalculators.module.css';

/* Shared compact result banner. When `invalid` is set the numeric value is
 * dimmed and replaced by a clear warning, so an error state never looks like
 * a legitimate "0" answer. */
export function ResultBar({
  label,
  value,
  hint,
  invalid,
  invalidText,
}: {
  label: string;
  value: string;
  hint?: string;
  invalid?: boolean;
  invalidText?: string;
}) {
  return (
    <div className={styles.resultBar}>
      <span className={styles.resultLabel}>{label}</span>
      <span
        className={styles.resultValue}
        style={invalid ? { opacity: 0.35 } : undefined}
      >
        {invalid ? '—' : value}
      </span>
      {invalid ? (
        <span className={styles.resultHint} style={{ color: '#d97706', fontWeight: 600 }}>
          ⚠ {invalidText}
        </span>
      ) : hint ? (
        <span className={styles.resultHint}>{hint}</span>
      ) : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </div>
  );
}
