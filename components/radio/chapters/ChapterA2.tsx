import { Section } from '../ui/Prose';
import { Def, Defs, Eq, Example, Fig, Key, Sim } from '../ui/Teach';
import { BankList } from '../BankList';
import { LowPassResponse, BlockChain } from '../diagrams/more';

/** Bloque A, segunda parte: filtros, semiconductores, fuentes y circuitos activos. */
export function ChapterA2() {
  return (
    <>
      <Section id="filtros" kicker="A.5" title="Filtros y armónicas">
        <Defs>
          <Def term="Filtro pasa-bajos (LPF)">Deja pasar las frecuencias menores a su frecuencia de corte fc y atenúa las mayores. Va entre el transmisor y la antena.</Def>
          <Def term="Filtro pasa-altos (HPF)">Deja pasar las frecuencias mayores a fc. Ejemplo: bloquear la radiodifusión de AM en la entrada de un receptor de HF.</Def>
          <Def term="Filtro pasa-banda (BPF)">Deja pasar un rango alrededor de f₀. Típico en la entrada de un receptor.</Def>
          <Def term="Armónica">Señal de frecuencia múltiplo entera de la fundamental: 2f, 3f, 4f… La generan las etapas no lineales.</Def>
          <Def term="Emisión espuria">Toda emisión fuera del ancho de banda necesario (armónicas, productos de mezcla). Debe reducirse al mínimo.</Def>
        </Defs>
        <Fig caption="Pasa-bajos con corte fc entre f y 2f: la fundamental pasa y las armónicas se atenúan.">
          <LowPassResponse />
        </Fig>
        <Example
          title="Un transmisor opera en 146 MHz. ¿Dónde cae su segunda armónica?"
          steps={['f₂ = 2 · 146 MHz = 292 MHz', 'f₃ = 3 · 146 MHz = 438 MHz']}
          result="292 MHz (otro servicio) y 438 MHz (dentro de 70 cm): el LPF debe atenuarlas."
        />
        <Key>
          <ul>
            <li>Cada orden de filtro (cada L o C) agrega ≈ 6 dB por octava de pendiente.</li>
            <li>Los módulos baratos tipo SA818 sacan armónicas altas: necesitan LPF externo.</li>
          </ul>
        </Key>
        <Sim name="harmonics" label="armónicas y filtro" />
      </Section>

      <Section id="semis" kicker="A.6" title="Semiconductores y fuentes de alimentación">
        <Defs>
          <Def term="Diodo">Conduce en un solo sentido (de ánodo a cátodo). Rectifica: convierte CA en CC pulsante.</Def>
          <Def term="Diodo Zener">Polarizado en inversa mantiene una tensión fija. Se usa como referencia y regulador simple.</Def>
          <Def term="Varicap (varactor)">Diodo en inversa cuya capacidad varía con la tensión aplicada. Sintoniza circuitos sin partes móviles.</Def>
          <Def term="Transistor (BJT, FET/MOSFET)">Dispositivo de tres terminales que amplifica o conmuta. Base de amplificadores y osciladores.</Def>
          <Def term="Disipador">Pieza metálica que evacúa el calor de un semiconductor de potencia.</Def>
        </Defs>
        <Fig caption="Fuente lineal: cada bloque cumple una función.">
          <BlockChain label="Fuente lineal: transformador, rectificador, filtro y regulador" blocks={['Transformador', 'Rectificador', 'Filtro (C)', 'Regulador']} />
        </Fig>
        <Key>
          <ul>
            <li>Fuente lineal: pesada y de bajo rendimiento, pero sin ruido de RF.</li>
            <li>Fuente conmutada (switching): liviana y eficiente; las de mala calidad generan ruido que se escucha en HF.</li>
          </ul>
        </Key>
      </Section>

      <Section id="activos" kicker="A.7" title="Amplificadores, atenuadores, osciladores y PLL">
        <Defs>
          <Def term="Ganancia" symbol="G" unit="dB">Relación entre la potencia de salida y la de entrada, en decibeles.</Def>
          <Def term="Atenuador">Red resistiva que reduce el nivel de una señal en una cantidad fija de dB.</Def>
          <Def term="Oscilador">Amplificador con realimentación positiva que genera una señal de frecuencia fija sin entrada. Un cristal de cuarzo le da estabilidad.</Def>
          <Def term="PLL (lazo enganchado en fase)">Sistema que compara la fase de un oscilador controlado por tensión (VCO) con una referencia estable y lo corrige: produce muchas frecuencias con la estabilidad del cristal.</Def>
        </Defs>
        <Eq vars={[['G', 'ganancia [dB]'], ['P₂', 'potencia de salida [W]'], ['P₁', 'potencia de entrada [W]']]}>G (dB) = 10 · log₁₀ (P₂ / P₁)</Eq>
        <Example
          title="Un amplificador recibe 5 W y entrega 50 W. ¿Cuál es su ganancia?"
          steps={['G = 10 · log₁₀ (50 / 5) = 10 · log₁₀ 10']}
          result="G = 10 dB."
        />
        <Key>
          <ul>
            <li>+3 dB = el doble de potencia; +10 dB = diez veces; −3 dB = la mitad.</li>
            <li>Ganancias y pérdidas en dB se suman y restan.</li>
          </ul>
        </Key>
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: bloque A">
        <BankList pool="A" />
      </Section>
    </>
  );
}
