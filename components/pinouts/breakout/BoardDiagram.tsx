'use client';

import { useTranslations } from 'next-intl';
import { FUNC_LABEL, funcVar } from '@/config/pinouts/modules';
import type { BoardPinout } from '@/config/pinouts/modules';
import { BoardArtwork } from './BoardArtwork';
import { BoardPinSvg } from './BoardPinSvg';
import { boardGeometry, diagramPinNumber, primaryOf } from './boardGeometry';
import type { AssignMap } from './boardGeometry';
import styles from './board-diagram.module.css';

export type { AssignMap, PinAssign } from './boardGeometry';

export function BoardDiagram({ board, name, assign }: { board: BoardPinout; name: string; assign?: AssignMap }) {
  const t = useTranslations('Pinouts');
  const geometry = boardGeometry(board, assign);
  const pins = [...board.left, ...board.right];
  const funcs = [...new Set(pins.flatMap((pin) => pin.labels.map((label) => label.func)))];
  const used = assign ? pins.filter((pin) => assign.has(primaryOf(pin).text)).length : 0;
  return (
    <>
      <div className={styles.wrap}>
        <p className={styles.hint}>{t('boardOrientation')}</p>
        <svg width={geometry.width} viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={name} fontFamily="ui-monospace, Menlo, monospace">
          <title>{name}</title><desc>{t('boardOrientation')}</desc>
          <BoardArtwork board={board} x={geometry.boardX} bottom={geometry.bottom} />
          {(['left', 'right'] as const).flatMap((side) => board[side].map((pin, index) => (
            <BoardPinSvg key={`${side}-${pin.pos}`} pin={pin} index={index} side={side}
              edge={side === 'left' ? geometry.boardX : geometry.boardR} number={diagramPinNumber(board, side, index)} assign={assign} />
          )))}
        </svg>
      </div>
      {assign ? <p className={styles.hint}>{t('assignedPins', { count: used })}</p> : (
        <div className={styles.legend}>
          {funcs.map((func) => <span key={func} className={styles.chip} style={{ color: funcVar(func), borderColor: funcVar(func) }}>
            <span className={styles.dot} style={{ background: funcVar(func) }} />{FUNC_LABEL[func]}
          </span>)}
        </div>
      )}
    </>
  );
}
