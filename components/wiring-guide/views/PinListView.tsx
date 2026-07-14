'use client';

import { useMemo, useState } from 'react';
import { Input, Segmented } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  PIN_ORDER_HINT,
  PIN_ORDER_LABEL,
  matchesQuery,
  moduleOf,
  orderPins,
  railLabel,
  railClass,
} from '@/config/pinouts/wiring';
import type { Pin, PinOrder, RailInfo } from '@/config/pinouts/wiring';
import { getBreakout } from '@/config/pinouts/modules';
import { useWiringGuide } from '../WiringGuideContext';
import { PinBadge } from '../PinBadge';
import { RichText } from '../RichText';
import { GuideBoardDiagram } from './GuideBoardDiagram';
import styles from '../wiring-guide.module.css';

const RAIL_TAG: Record<RailInfo['k'], string> = {
  c5: styles.tagC5,
  c33: styles.tagC33,
  cg: styles.tagCg,
};

const ORDERS: PinOrder[] = ['module', 'header', 'gpio'];

export function PinListView() {
  const guide = useWiringGuide();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<PinOrder>('module');

  /**
   * GPIO → posición física en el header. Sale del pinout real de la placa, así que
   * "ordenar por header" sigue el cobre, no una lista inventada.
   */
  const headerPos = useMemo(() => {
    const board = guide.meta.boardId ? getBreakout(guide.meta.boardId)?.board : undefined;
    if (!board) return undefined;
    const map = new Map<number, number>();
    [...board.left, ...board.right].forEach((pin, i) => {
      const primary = pin.labels.find((label) => label.primary) ?? pin.labels[0];
      if (primary.text.startsWith('IO')) map.set(Number(primary.text.slice(2)), i);
    });
    return map;
  }, [guide]);

  const ordered = useMemo(() => orderPins(guide, order, headerPos), [guide, order, headerPos]);
  const rows = useMemo(
    () => ordered.filter((pin) => matchesQuery(pin, query, moduleOf(guide, pin))),
    [ordered, query, guide],
  );

  // en modo "por módulo" metemos una fila-cabecera cada vez que cambia el dueño:
  // eso convierte la tabla en una secuencia de soldadura en vez de una lista plana
  const grouped = order === 'module';
  let lastMod = '';

  const renderRow = (pin: Pin) => {
    const mod = moduleOf(guide, pin);
    const head = grouped && mod.id !== lastMod ? mod : null;
    if (head) lastMod = mod.id;

    return (
      <ModuleRows
        key={pin.gpio}
        pin={pin}
        head={head}
        modName={mod.name}
        modIcon={mod.icon}
        grouped={grouped}
      />
    );
  };

  return (
    <section>
      <GuideBoardDiagram />

      <div className={styles.controls}>
        <Segmented
          value={order}
          onChange={(value) => setOrder(value as PinOrder)}
          options={ORDERS.map((o) => ({ label: PIN_ORDER_LABEL[o], value: o }))}
        />
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar: 40, ALT, stick, pantalla…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
      </div>
      <p className={styles.orderHint}>{PIN_ORDER_HINT[order]}</p>

      <div className={styles.listWrap}>
        <table className={styles.pinTable}>
          <thead>
            <tr>
              <th>GPIO</th>
              <th>Función</th>
              {!grouped ? <th>Módulo</th> : null}
              <th>Destino</th>
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
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

/**
 * Una fila de pin, precedida por la cabecera de su módulo cuando arranca uno nuevo.
 *
 * La cabecera es donde vive el RIEL. Antes cada pin tenía una columna "Riel" que
 * decía, por ejemplo, que el CS de la pantalla iba a 5V — y no va: al 5V va el VCC
 * del MÓDULO. La alimentación se declara una vez, acá, junto a sus pines de power.
 */
function ModuleRows({
  pin,
  head,
  modName,
  modIcon,
  grouped,
}: {
  pin: Pin;
  head: ReturnType<typeof moduleOf> | null;
  modName: string;
  modIcon: string;
  grouped: boolean;
}) {
  return (
    <>
      {head ? (
        <tr className={styles.modHead}>
          <td colSpan={grouped ? 3 : 4}>
            <div className={styles.modHeadRow}>
              <span className={styles.modStep}>{head.step}</span>
              <span className={styles.modName}>
                {head.icon} {head.name}
              </span>
              <span className={`${styles.modRail} ${styles[railClass(head.rail)]}`}>
                {head.rail === null ? 'sin alimentación' : `riel ${railLabel(head.rail)}`}
              </span>
            </div>
            <div className={styles.modPower}>
              <RichText text={head.power} />
            </div>
            {head.tip ? (
              <div className={styles.modTip}>
                <RichText text={head.tip} />
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
      <tr>
        <td>
          <PinBadge label={pin.gpio} role={pin.kind} />
        </td>
        <td className={styles.tableName}>{pin.name}</td>
        {!grouped ? (
          <td className={styles.modCell}>
            {modIcon} {modName}
          </td>
        ) : null}
        <td>
          {pin.dest}
          {pin.note ? (
            <div className={styles.note}>
              ⚠ <RichText text={pin.note} />
            </div>
          ) : null}
        </td>
      </tr>
    </>
  );
}
