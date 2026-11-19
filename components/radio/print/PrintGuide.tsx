import { CHAPTERS, type Chapter } from '@/lib/radio/chapters';
import { CHAPTER_BODIES } from '../chapterBodies';
import { LicenseSteps, SOURCES_TEXT } from '../LicenseSteps';
import { ProgramMap } from '../ProgramMap';
import s from './print.module.css';

const BLOCKS = CHAPTERS.filter((c) => /^[A-D]$/.test(c.code));

/** Guía completa en un solo documento, maquetada para imprimir o exportar a PDF. */
export function PrintGuide() {
  return (
    <article className={s.doc} lang="es">
      <Cover />
      <Contents />
      <section className={s.page}>
        <h1 className={s.partTitle}>Antes de empezar</h1>
        <h2>Cómo sacar la licencia</h2>
        <LicenseSteps className={s.steps} />
        <h2>Cómo está armada esta guía</h2>
        <ul className={s.steps}>
          <li>Cuatro bloques (A a D) que siguen el Programa Básico de Estudios oficial de ENACOM. El anexo muestra dónde está cada punto del programa.</li>
          <li>Cada tema tiene: <strong>definiciones</strong> con su unidad, la <strong>fórmula</strong>, un <strong>ejemplo resuelto</strong> y un recuadro <strong>Para el examen</strong>.</li>
          <li>Al final de cada bloque están las preguntas del banco de examen con su respuesta. Las de reglamentación son las del banco oficial, con el texto literal.</li>
          <li>Los simuladores interactivos están en la web: openhios.dev/radio.</li>
        </ul>
      </section>
      {BLOCKS.map((c) => <Block key={c.slug} chapter={c} />)}
      <section className={s.page}>
        <h1 className={s.partTitle}>Anexo: Programa oficial de ENACOM</h1>
        <p className={s.lead}>Cada punto del Programa Básico de Estudios y la sección de esta guía que lo explica.</p>
        <ProgramMap base="/es/radio" />
        <h2>Fuentes</h2>
        <p>{SOURCES_TEXT}</p>
      </section>
    </article>
  );
}

function Cover() {
  return (
    <header className={s.cover}>
      <p className={s.coverKicker}>Radioaficionado · Categoría Novicio</p>
      <h1>Guía de estudio para el examen de ENACOM</h1>
      <p className={s.coverLead}>Técnica, Reglamentación y Ética Operativa. Con las 181 preguntas oficiales de reglamentación y sus respuestas, y el plan de bandas oficial.</p>
      <p className={s.coverMeta}>Basada en el Programa Básico de Estudios, el Banco de Preguntas y el Plan de Bandas de la Res. ENACOM 508/2018, y en el Reglamento General de Radioaficionados (Res. 3635/2017, mod. Res. 1186/2024).</p>
      <p className={s.coverFoot}>openhios.dev/radio</p>
    </header>
  );
}

function Contents() {
  return (
    <nav className={s.page} aria-label="Contenido">
      <h1 className={s.partTitle}>Contenido</h1>
      <ol className={s.contents}>
        <li><strong>Antes de empezar</strong></li>
        {BLOCKS.map((c) => (
          <li key={c.slug}>
            <strong>Bloque {c.code}. {c.title}</strong>
            <ol>{c.sections.map((x) => <li key={x.id}>{x.title}</li>)}</ol>
          </li>
        ))}
        <li><strong>Anexo: Programa oficial de ENACOM</strong></li>
      </ol>
    </nav>
  );
}

function Block({ chapter }: { chapter: Chapter }) {
  const parts = CHAPTER_BODIES[chapter.slug] ?? [];
  return (
    <div className={s.block}>
      <header className={s.blockHead}>
        <span className={s.blockCode}>Bloque {chapter.code}</span>
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
      </header>
      {parts.map((Part, i) => <Part key={i} />)}
    </div>
  );
}
