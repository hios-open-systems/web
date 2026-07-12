import type { BreakoutTable } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

interface LabeledTable {
  title: string;
  table: BreakoutTable;
}

export function BreakoutTables({ tables }: { tables: LabeledTable[] }) {
  return (
    <>
      {tables.map(({ title, table }) => (
        <div key={title} className={styles.tableBlock}>
          <div className={styles.tableTitle}>{title}</div>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>{table.head[0]}</th>
                <th>{table.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
