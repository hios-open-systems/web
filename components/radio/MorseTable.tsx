import { MORSE, PHONETIC } from '@/lib/radio/codes';
import styles from './teach.module.css';

const WORD = new Map(PHONETIC);
const LETTERS = Object.keys(MORSE).filter((k) => /^[A-Z]$/.test(k));
const DIGITS = '1234567890'.split('');
const SIGNS: ReadonlyArray<readonly [string, string]> = [['.', 'Punto'], [',', 'Coma'], ['?', 'Pregunta'], ['/', 'Barra'], ['=', 'Separación (BT)'], ['+', 'Fin de mensaje (AR)'], ['-', 'Guion'], ['@', 'Arroba']];
const PROSIGNS: ReadonlyArray<readonly [string, string, string]> = [
  ['SOS', '...---...', 'Socorro'], ['CQ', '-.-. --.-', 'Llamada general'], ['K', '-.-', 'Cambio, adelante'],
  ['SK', '...-.-', 'Fin del contacto'], ['DE', '-.. .', 'De (antes de la señal)'], ['73', '--... ...--', 'Saludos'],
];

/** Dibuja puntos y rayas; cada letra queda junta y separada de la siguiente. */
function Code({ code }: { code: string }) {
  return (
    <span className={styles.mcode} aria-label={code.replace(/\./g, 'punto ').replace(/-/g, 'raya ')}>
      {code.split(' ').map((g, j) => (
        <span key={j} className={styles.mgroup}>
          {[...g].map((c, i) => <span key={i} className={c === '.' ? styles.dit : styles.dah} />)}
        </span>
      ))}
    </span>
  );
}

function Cell({ ch, code, note, wide }: { ch: string; code: string; note?: string; wide?: boolean }) {
  return (
    <div className={styles.mcell} data-wide={wide ? '' : undefined}>
      <strong>{ch}</strong>
      <Code code={code} />
      {note ? <span className={styles.mnote}>{note}</span> : null}
    </div>
  );
}

/** Tabla de referencia del código Morse internacional (ITU-R M.1677) con el alfabeto fonético. */
export function MorseTable() {
  return (
    <div className={styles.morse}>
      <h3>Letras</h3>
      <div className={styles.mgrid}>{LETTERS.map((l) => <Cell key={l} ch={l} code={MORSE[l]} note={WORD.get(l)} />)}</div>
      <h3>Números</h3>
      <div className={styles.mgrid}>{DIGITS.map((d) => <Cell key={d} ch={d} code={MORSE[d]} />)}</div>
      <h3>Signos</h3>
      <div className={styles.mgrid}>{SIGNS.map(([s, n]) => <Cell key={s} ch={s} code={MORSE[s]} note={n} />)}</div>
      <h3>Abreviaturas de uso diario</h3>
      <div className={styles.mgrid}>{PROSIGNS.map(([s, c, n]) => <Cell key={s} ch={s} code={c} note={n} wide={c.includes(' ')} />)}</div>
    </div>
  );
}
