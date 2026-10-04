import type { BoardPinout } from '@/config/pinouts/modules';
import styles from './breakout.module.css';
import { diagramPinNumber } from './boardGeometry';

export function BoardPinTable({ board }: { board: BoardPinout }) {
  return (
    <div className={styles.headerTables}>
      {(['left', 'right'] as const).map((side) => (
        <table key={side} className={styles.miniTable}>
          <caption>{board.headers[side]}</caption>
          <thead><tr><th>Pin</th><th>GPIO / funciones</th></tr></thead>
          <tbody>{board[side].map((pin, index) => (
            <tr key={pin.pos}>
              <td>{diagramPinNumber(board, side, index)}</td>
              <td>{pin.labels.map((label) => label.text).join(' · ')}</td>
            </tr>
          ))}</tbody>
        </table>
      ))}
    </div>
  );
}
