import { useTranslations } from 'next-intl';
import styles from './project-software.module.css';

interface ComponentItem { component: string; qty: number; notes?: string }

export function ProjectComponents({ items }: { items: ComponentItem[] }) {
  const t = useTranslations('ProjectDetail');
  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
      <h3>{t('bom')}</h3>
      <div className={styles.card} style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th scope="col" style={{ textAlign: 'left' }}>{t('component')}</th>
            <th scope="col">{t('quantity')}</th>
            <th scope="col" style={{ textAlign: 'left' }}>{t('notes')}</th>
          </tr></thead>
          <tbody>{items.map((item) => <tr key={item.component}>
            <td style={{ padding: '12px 8px 12px 0' }}>{item.component}</td>
            <td style={{ padding: 12, textAlign: 'center' }}>{item.qty}</td>
            <td style={{ padding: '12px 0', color: 'var(--hios-text-secondary)' }}>{item.notes || '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
