import Link from 'next/link';
import { PageIntro } from '@/components/ui/PageIntro';
import { CHAPTERS } from '@/lib/radio/chapters';
import { SpanishOnlyNotice } from './SpanishOnlyNotice';
import { LicenseLadder } from './LicenseLadder';
import { ProgramMap } from './ProgramMap';
import { Callout } from './ui/Prose';
import landing from './landing.module.css';
import styles from './radio.module.css';

const TOOLS = [
  { href: 'a-electricidad#alterna', label: 'Longitud de onda', badge: 'λ' },
  { href: 'a-electricidad#resonancia', label: 'Resonancia LC', badge: 'LC' },
  { href: 'a-electricidad#filtros', label: 'Filtro y armónicas', badge: 'LPF' },
  { href: 'b-modulacion-equipos#modulacion', label: 'Osciloscopio de modulación', badge: 'MOD' },
  { href: 'c-antenas-propagacion#roe', label: 'ROE en el coaxil', badge: 'ROE' },
  { href: 'c-antenas-propagacion#antenas', label: 'Calculadora de antenas', badge: 'ANT' },
  { href: 'c-antenas-propagacion#coaxil', label: 'Pérdida de coaxil', badge: 'COAX' },
  { href: 'c-antenas-propagacion#alcance', label: '¿Llego a 5 km?', badge: 'LINK' },
  { href: 'd-reglamento#bandas', label: 'Mapa de bandas', badge: 'BANDAS' },
  { href: 'morse#traductor', label: 'Traductor Morse', badge: 'CW' },
  { href: 'morse#entrenador', label: 'Entrenador Koch', badge: 'KOCH' },
  { href: 'practica#quiz', label: 'Simulacro de examen', badge: 'QUIZ' },
];

export function RadioLanding({ locale }: { locale: string }) {
  const base = `/${locale}/radio`;
  return (
    <main className={styles.page} lang="es">
      <PageIntro
        eyebrow="Guía · Argentina"
        title="Radioaficionado, de cero a la licencia"
        description="Guía de estudio para el examen Novicio de ENACOM, ordenada según el Programa Básico de Estudios oficial: definiciones con unidades, diagramas, fórmulas con ejemplos resueltos y el banco de preguntas oficial de reglamentación."
        area="knowledge"
        compact
      />
      {locale !== 'es' ? <SpanishOnlyNotice /> : null}
      <p className={landing.lead}>
        <a href="/downloads/radio/guia-radioaficionado-novicio.pdf" download className={landing.pdf}>⬇ Descargar la guía completa en PDF</a>
        {' '}Bloques A a D con diagramas, fórmulas, ejemplos y el banco de preguntas con respuestas.
      </p>

      <section className={landing.block}>
        <h2>El camino: una categoría a la vez</h2>
        <p className={landing.lead}>Las categorías no son temarios distintos: las materias son las mismas, pero cada escalón pide años de actividad, más Morse y habilita más potencia y bandas. La guía arranca por Novicio, que es la base de todo.</p>
        <LicenseLadder />
      </section>

      <section className={landing.block}>
        <h2>Novicio: el temario</h2>
        <div className={landing.grid}>
          {CHAPTERS.map((c) => (
            <Link key={c.slug} href={`${base}/${c.slug}`} className={landing.card}>
              <span className={landing.code}>{c.code}</span>
              <strong>{c.title}</strong>
              <span>{c.summary}</span>
              <span className={landing.count}>{c.sections.length} temas</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={landing.block}>
        <h2>Programa oficial de ENACOM, punto por punto</h2>
        <p className={landing.lead}>Cada tema del Programa Básico de Estudios y la sección de la guía que lo explica.</p>
        <ProgramMap base={base} />
      </section>

      <section className={landing.block}>
        <h2>Herramientas</h2>
        <div className={landing.tools}>
          {TOOLS.map((t) => (
            <Link key={t.href} href={`${base}/${t.href}`} className={landing.tool}>
              <span className={styles.badge}>{t.badge}</span>{t.label}
            </Link>
          ))}
        </div>
      </section>

      <section className={landing.block}>
        <h2>Cómo sacar la licencia</h2>
        <ol className={landing.steps}>
          <li><strong>Elegí un Radio Club</strong> cerca tuyo: ahí se cursa, se hacen las prácticas y se rinde (Res. ENACOM 3635/2017, art. 4.2). La lista de instituciones está en el sitio de ENACOM, sección Radioaficionados.</li>
          <li><strong>Estudiá los bloques A a D</strong> y practicá Morse básico. La guía sigue el programa oficial; el club puede ampliarlo.</li>
          <li><strong>Hacé las Prácticas Operativas</strong> en la estación del club, con un instructor.</li>
          <li><strong>Rendí</strong> Técnica, Reglamentación y Ética Operativa, y Telegrafía (art. 4.4.3).</li>
          <li><strong>El club presenta el trámite</strong> ante ENACOM y te asignan tu señal distintiva.</li>
        </ol>
        <Callout tone="info"><p>Fuentes: Reglamento General de Radioaficionados (Res. ENACOM 3635/2017, mod. Res. 1186/2024); Res. ENACOM 508/2018 con su Programa Básico de Estudios, Banco de Preguntas oficial y Plan de Bandas (Anexo A); banco técnico de Novicio del Cuyo Radio Club (LU1MA).</p></Callout>
      </section>
    </main>
  );
}
