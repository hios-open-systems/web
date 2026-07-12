import { Fragment } from 'react';
import { parseInline } from '@/config/pinouts/wiring';
import styles from './breakout.module.css';

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        if (token.bold) return <strong key={index}>{token.text}</strong>;
        if (token.mono)
          return (
            <code key={index} className={styles.mono}>
              {token.text}
            </code>
          );
        if (token.italic) return <em key={index}>{token.text}</em>;
        return <Fragment key={index}>{token.text}</Fragment>;
      })}
    </>
  );
}
