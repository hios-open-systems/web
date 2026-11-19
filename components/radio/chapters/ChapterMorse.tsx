import { Section, Prose } from '../ui/Prose';
import { Widget } from '../widgets/Widget';
import { MorseKeypad } from '../MorseKeypad';

export function ChapterMorse() {
  return (
    <>
      <Section id="por-que" kicker="CW.1" title="Por qué Morse todavía importa">
        <Prose>
          <ul>
            <li>Es parte del examen en <strong>todas</strong> las categorías. Para Novicio se piden conocimientos generales (art. 4.4.3.4); para General, recibir a 5 palabras por minuto (art. 4.5.5.1); para Superior, recibir y transmitir a 10 (art. 4.6.5.1).</li>
            <li>CW ocupa ~150 Hz: con 5 W y un alambre se hacen contactos a miles de km donde la voz no pasa.</li>
            <li>El equipo es el más simple que existe: un oscilador que se prende y se apaga. Ideal para armar.</li>
          </ul>
          <p>Truco para aprender: no cuentes puntos y rayas. Cada letra es un <strong>sonido</strong> («di-dah» = A). Por eso el entrenador usa velocidad real desde el día uno y espacios largos entre letras (método Farnsworth) para darte tiempo a pensar.</p>
        </Prose>
      </Section>
      <Section id="alfabeto" kicker="CW.2" title="Alfabeto Morse">
        <Prose><p>Código Morse internacional (ITU-R M.1677). Cada letra lleva su palabra del alfabeto fonético. La raya dura tres puntos. Tocá una letra para escucharla y armar un mensaje.</p></Prose>
        <MorseKeypad />
      </Section>
      <Section id="traductor" kicker="CW.3" title="Traductor texto ↔ Morse">
        <Widget name="morse" />
      </Section>
      <Section id="entrenador" kicker="CW.4" title="Entrenador Koch">
        <Widget name="koch" />
      </Section>
    </>
  );
}
