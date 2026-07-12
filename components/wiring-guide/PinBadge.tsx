import styles from './wiring-guide.module.css';

interface PinBadgeProps {
  label: string | number;
  role: string;
}

export function PinBadge({ label, role }: PinBadgeProps) {
  const color = `var(--pw-role-${role})`;
  return (
    <span className={styles.badge} style={{ color, borderColor: color }}>
      {label}
    </span>
  );
}
