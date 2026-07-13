import { splitColumns } from '@/config/pinouts/wiring';
import type { Breakout, BreakoutPin } from '@/config/pinouts/modules';
import { RoleBadge } from './RoleBadge';
import { RichText } from './RichText';
import styles from './breakout.module.css';

function PinRow({ pin }: { pin: BreakoutPin }) {
  return (
    <div className={styles.pinRow}>
      <RoleBadge role={pin.role} />
      <div className={styles.pinMeat}>
        <div className={styles.pinName}>
          {pin.name}
          {pin.alt ? <span className={styles.pinAlt}> · {pin.alt}</span> : null}
        </div>
        {pin.to ? (
          <div className={styles.pinTo}>
            <RichText text={pin.to} />
          </div>
        ) : null}
        {pin.note ? (
          <div className={styles.pinNote}>
            ⚠ <RichText text={pin.note} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BreakoutPinList({ breakout }: { breakout: Breakout }) {
  // solo respetamos los lados si de verdad hay pines a la derecha; si están todos
  // declarados 'left' (hw-504, lcd1602) la columna derecha quedaba vacía
  const hasRight = breakout.pins.some((pin) => pin.side === 'right');
  const [left, right] = hasRight
    ? [
        breakout.pins.filter((pin) => pin.side !== 'right'),
        breakout.pins.filter((pin) => pin.side === 'right'),
      ]
    : splitColumns(breakout.pins);

  return (
    <div className={styles.pinGrid}>
      <div>
        {left.map((pin) => (
          <PinRow key={pin.name} pin={pin} />
        ))}
      </div>
      <div>
        {right.map((pin) => (
          <PinRow key={pin.name} pin={pin} />
        ))}
      </div>
    </div>
  );
}
