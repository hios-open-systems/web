'use client';

import { useWiringGuide } from '../WiringGuideContext';
import { PinBadge } from '../PinBadge';
import { RichText } from '../RichText';
import styles from '../wiring-guide.module.css';

export function GroupsView() {
  const guide = useWiringGuide();

  return (
    <div className={styles.groups}>
      {guide.sections.map((section, index) => (
        <details key={section.t} className={styles.group} open={index === 0}>
          <summary className={styles.groupSummary}>
            {section.t}
            {section.cnt ? <span className={styles.groupCount}>{section.cnt}</span> : null}
          </summary>
          {section.ascii ? <pre className={styles.ascii}>{section.ascii}</pre> : null}
          {section.tip ? (
            <p className={styles.tip}>
              <RichText text={section.tip} />
            </p>
          ) : null}
          {section.rows && section.rows.length > 0 ? (
            <div className={styles.rowLines}>
              {section.rows.map((row) => (
                <div key={`${row.pin}-${row.nm}`} className={styles.rowLine}>
                  <PinBadge label={row.pin} role={row.kind} />
                  <div className={styles.rowMeat}>
                    <div className={styles.rowName}>{row.nm}</div>
                    {row.to ? <div className={styles.rowTo}>{row.to}</div> : null}
                    {row.note ? <div className={styles.note}>⚠ {row.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </details>
      ))}
    </div>
  );
}
