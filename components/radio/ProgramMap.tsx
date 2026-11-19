import Link from 'next/link';
import { PROGRAM } from '@/lib/radio/program';
import { OFFICIAL_PROGRAM_SOURCE } from '@/lib/radio/sources';
import styles from './teach.module.css';

/** Programa oficial de ENACOM, punto por punto, con el enlace a la sección de la guía que lo cubre. */
export function ProgramMap({ base }: { base: string }) {
  return (
    <div className={styles.table}>
      <table>
        <thead><tr><th>Punto</th><th>Tema del programa oficial</th><th>En la guía</th></tr></thead>
        <tbody>
          {PROGRAM.flatMap((g) => g.items.map((it) => (
            <tr key={it.code}>
              <td>{it.code}</td>
              <td>{it.title}</td>
              <td>{it.where.length
                ? it.where.map(([href, label], i) => <span key={href}>{i ? ' · ' : ''}<Link href={`${base}/${href}`}>{label}</Link></span>)
                : 'Se hacen en el Radio Club, con instructor'}</td>
            </tr>
          )))}
        </tbody>
      </table>
      <p className={styles.cite}>Fuente: <a href={OFFICIAL_PROGRAM_SOURCE.url} target="_blank" rel="noreferrer">{OFFICIAL_PROGRAM_SOURCE.name}</a> (Res. ENACOM 508/2018).</p>
    </div>
  );
}
