import { ROLE_LABEL, roleVar } from '@/config/pinouts/modules';
import type { PinRole } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

export function RoleBadge({ role }: { role: PinRole }) {
  const color = roleVar(role);
  return (
    <span className={styles.roleBadge} style={{ color, borderColor: color }}>
      {ROLE_LABEL[role]}
    </span>
  );
}
