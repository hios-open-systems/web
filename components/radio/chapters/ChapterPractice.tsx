import { Section, Prose, Callout } from '../ui/Prose';
import { Widget } from '../widgets/Widget';
import { MOCK_LAYOUT } from '@/lib/radio/exam';
import { BANK_TECNICA_SOURCE } from '@/lib/radio/bankTecnica';
import { BANK_REGLAMENTO_SOURCE } from '@/lib/radio/bankReglamento';

export function ChapterPractice() {
  return (
    <>
      <Section id="examen" kicker="✓.1" title="Cómo es el examen">
        <Prose>
          <ul>
            <li>Se rinde en un <strong>Radio Club o Institución Autorizada</strong>, que también da el curso (art. 4.2).</li>
            <li>Para Novicio: examen escrito de <strong>Técnica</strong> y de <strong>Reglamentación y Ética Operativa</strong>, conocimientos generales de <strong>Telegrafía</strong> y Prácticas Operativas (art. 4.4.3).</li>
            <li>Las preguntas salen de los bancos que ENACOM publicó con la Res. 508/2018. Cada club arma su examen de ahí, así que el formato exacto (cantidad, tiempo, aprobación) lo confirmás con tu club.</li>
          </ul>
          <p>Practicamos con el <a href={BANK_TECNICA_SOURCE.url} target="_blank" rel="noreferrer">banco técnico de Novicio</a> (150 preguntas con clave) y con el <a href={BANK_REGLAMENTO_SOURCE.url} target="_blank" rel="noreferrer">banco de reglamentación</a> (sólo las preguntas cuya respuesta verificamos contra el Reglamento). Las preguntas están parafraseadas y cada una cita su número en el banco.</p>
        </Prose>
        <Callout tone="info"><p>El simulacro de acá usa {MOCK_LAYOUT.tecnica} preguntas técnicas, {MOCK_LAYOUT.reglamento} de reglamentación y {MOCK_LAYOUT.minutes} minutos. Es un formato de práctica, no el oficial.</p></Callout>
      </Section>
      <Section id="quiz" kicker="✓.2" title="Práctica con el banco y simulacro">
        <Widget name="quiz" />
      </Section>
      <Section id="fichas" kicker="✓.3" title="Tarjetas de memoria">
        <Widget name="cards" />
      </Section>
    </>
  );
}
