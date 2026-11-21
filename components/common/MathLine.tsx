import type { ReactNode } from 'react';
import styles from './mathLine.module.css';

/** Keep a complete expression together; long equations scroll within their block. */
export function MathLine({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <code className={`${styles.line} ${className}`} data-math-line tabIndex={0}>{children}</code>;
}
