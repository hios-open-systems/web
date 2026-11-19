import { Section, Callout } from '../ui/Prose';
import { Def, Defs, Fig, Key, Table } from '../ui/Teach';
import { BankList } from '../BankList';
import { BlockChain } from '../diagrams/more';

/** Bloque B, segunda parte: transmisor y mediciones. */
export function ChapterB2() {
  return (
    <>
      <Section id="transmisor" kicker="B.4" title="El transmisor y el transceptor">
        <Fig caption="Cadena típica de un transmisor.">
          <BlockChain label="Oscilador, modulador, excitador, amplificador de potencia, filtro pasa bajos y antena" blocks={['Oscilador', 'Modulador', 'Excitador', 'Amp. (PA)', 'LPF']} />
        </Fig>
        <Defs>
          <Def term="Excitador (driver)">Etapa que lleva la señal al nivel que necesita el amplificador final.</Def>
          <Def term="Amplificador de potencia (PA)">Etapa final. Es la que más calienta y la más sensible a una ROE alta.</Def>
          <Def term="Estabilidad de frecuencia">Capacidad de mantener la frecuencia con la temperatura y el tiempo. La dan el cristal y el PLL.</Def>
          <Def term="Transceptor">Equipo que reúne transmisor y receptor y comparte osciladores y filtros.</Def>
          <Def term="Alinealidad">Distorsión de una etapa que no amplifica igual todos los niveles. Genera armónicas e intermodulación.</Def>
        </Defs>
        <Key>
          <ul>
            <li>Nunca transmitir sin antena o carga conectada: la potencia vuelve al PA y lo puede dañar.</li>
            <li>Sintetizadores modernos: PLL o DDS (por ejemplo Si5351, controlado por I²C).</li>
          </ul>
        </Key>
      </Section>

      <Section id="instrumentos" kicker="B.5" title="Mediciones e instrumentos">
        <Table
          head={['Instrumento', 'Mide', 'Cómo se conecta']}
          rows={[
            ['Voltímetro', 'Tensión', 'En paralelo con el elemento'],
            ['Amperímetro', 'Corriente', 'En serie con el circuito'],
            ['Frecuencímetro', 'Frecuencia de una señal', 'Toma de muestra de la señal'],
            ['Osciloscopio', 'Forma de onda en función del tiempo', 'Sonda en paralelo'],
            ['Analizador de espectro', 'Amplitud en función de la frecuencia: armónicas y espurias', 'Con atenuador o acoplador'],
            ['Vatímetro / ROE-metro', 'Potencia directa y reflejada, ROE', 'En serie entre equipo y antena'],
            ['Medidor de intensidad de campo', 'Nivel de la señal irradiada', 'Con antena propia, a distancia'],
            ['Carga fantasma', 'No mide: disipa la potencia en 50 Ω sin irradiar', 'En lugar de la antena'],
          ]}
          cite="Programa ENACOM 3.c"
        />
        <Callout tone="info"><p>Un analizador de antenas tipo NanoVNA mide ROE e impedancia en un barrido de frecuencias. Hoy es barato y es la herramienta más útil para ajustar antenas.</p></Callout>
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: bloque B">
        <BankList pool="B" />
      </Section>
    </>
  );
}
