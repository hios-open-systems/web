import { Section } from '../ui/Prose';
import { Widget } from '../widgets/Widget';

export function ChapterPractice() {
  return (
    <>
      <Section id="quiz" kicker="✓.1" title="Preguntas y simulacro">
        <Widget name="quiz" />
      </Section>
      <Section id="fichas" kicker="✓.2" title="Tarjetas de memoria">
        <Widget name="cards" />
      </Section>
    </>
  );
}
