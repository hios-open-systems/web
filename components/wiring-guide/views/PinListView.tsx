'use client';

import { useMemo, useState } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { matchesQuery, railClass, railLabel, sortByGpio } from '@/config/pinouts/wiring';
import type { RailInfo } from '@/config/pinouts/wiring';
import { useWiringGuide } from '../WiringGuideContext';
import { PinBadge } from '../PinBadge';
import { RichText } from '../RichText';
import styles from '../wiring-guide.module.css';

const RAIL_TAG: Record<RailInfo['k'], string> = {
  c5: styles.tagC5,
  c33: styles.tagC33,
  cg: styles.tagCg,
};

export function PinListView() {
  const guide = useWiringGuide();
  const [query, setQuery] = useState('');
  const sorted = useMemo(() => sortByGpio(guide.pins), [guide]);
  const rows = useMemo(() => sorted.filter((pin) => matchesQuery(pin, query)), [sorted, query]);

  return (
    <section>
      <div className={styles.search}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar: 40, ALT, stick, NeoPixel…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
      </div>
      <div className={styles.listWrap}>
        <table className={styles.pinTable}>
          <thead>
            <tr>
              <th>GPIO</th>
              <th>Función</th>
              <th>Riel</th>
              <th>Destino</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pin) => (
              <tr key={pin.gpio}>
                <td>
                  <PinBadge label={pin.gpio} role={pin.kind} />
                </td>
                <td className={styles.tableName}>{pin.name}</td>
                <td className={styles[railClass(pin.rail)]}>{railLabel(pin.rail)}</td>
                <td>
                  {pin.dest}
                  {pin.note ? <div className={styles.note}>⚠ {pin.note}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className={styles.empty}>Sin resultados</div> : null}
      </div>
      <div className={styles.rails}>
        {guide.rails.map((rail) => (
          <div key={rail.k} className={styles.railItem}>
            <span className={`${styles.railTag} ${RAIL_TAG[rail.k]}`}>{rail.t}</span>
            <span>
              <RichText text={rail.c} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
