import { Section } from '../ui/Prose';
import { Def, Defs, Eq, Example, Fig, Key, Sim } from '../ui/Teach';
import { Reflection, DipolePattern } from '../diagrams/more';

/** Bloque C, primera parte: ondas, líneas de transmisión, ROE, adaptación y antenas. */
export function ChapterC() {
  return (
    <>
      <Section id="ondas" kicker="C.1" title="Campos y ondas electromagnéticas">
        <Defs>
          <Def term="Campo eléctrico" symbol="E" unit="V/m">Lo crea una tensión entre conductores.</Def>
          <Def term="Campo magnético" symbol="H" unit="A/m">Lo crea una corriente que circula.</Def>
          <Def term="Onda electromagnética">Campos E y H perpendiculares entre sí y a la dirección de avance, que viajan a la velocidad de la luz.</Def>
          <Def term="Polarización">Orientación del campo eléctrico: horizontal, vertical o circular. Las dos antenas deben coincidir.</Def>
        </Defs>
      </Section>

      <Section id="coaxil" kicker="C.2" title="Líneas de transmisión">
        <Defs>
          <Def term="Impedancia característica" symbol="Z₀" unit="Ω">Relación tensión/corriente de una línea infinita. Depende de la geometría y el dieléctrico, no del largo.</Def>
          <Def term="Cable coaxil">Línea desbalanceada: conductor central y malla. En radioaficionados, 50 Ω; en TV, 75 Ω.</Def>
          <Def term="Línea abierta (paralela)">Dos conductores paralelos: balanceada, de muy baja pérdida (300–600 Ω).</Def>
          <Def term="Guía de onda">Tubo metálico que conduce microondas.</Def>
          <Def term="Pérdida" unit="dB">Atenuación de la línea. Sube con la frecuencia y con el largo; baja con cables más gruesos.</Def>
        </Defs>
        <Key>
          <ul>
            <li>En HF alcanza RG-58; en VHF/UHF conviene RG-213 o LMR-400.</li>
            <li>Conectores: PL-259/SO-239 en HF; N y SMA en VHF/UHF.</li>
          </ul>
        </Key>
        <Sim name="coax" label="pérdida en cable coaxil" />
      </Section>

      <Section id="roe" kicker="C.3" title="ROE: relación de onda estacionaria">
        <Fig caption="Si la carga no es igual a Z₀, parte de la potencia se refleja. La suma de ambas ondas forma la onda estacionaria.">
          <Reflection />
        </Fig>
        <Defs>
          <Def term="Coeficiente de reflexión" symbol="Γ">Fracción de la tensión que vuelve. 0 = adaptado; 1 = todo vuelve.</Def>
          <Def term="ROE (SWR)">Relación entre la tensión máxima y la mínima a lo largo de la línea. 1:1 es la adaptación perfecta.</Def>
        </Defs>
        <Eq vars={[['Γ', 'coeficiente de reflexión'], ['Z', 'impedancia de carga [Ω]'], ['Z₀', 'impedancia de la línea [Ω]']]}
          lines={['Γ = (Z − Z₀) / (Z + Z₀)', 'ROE = (1 + |Γ|) / (1 − |Γ|)']} />
        <Example
          title="Una antena de 100 Ω se conecta a un coaxil de 50 Ω. ¿Qué ROE hay?"
          steps={['Γ = (100 − 50) / (100 + 50) = 0,333', 'ROE = 1,333 / 0,667 = 2']}
          result="ROE = 2:1 (vuelve el 11 % de la potencia). Para cargas resistivas: ROE = Z mayor / Z menor."
        />
        <Sim name="swr" label="ondas estacionarias" />
      </Section>

      <Section id="adaptacion" kicker="C.4" title="Adaptación de impedancias: baluns y acopladores">
        <Defs>
          <Def term="Balun">Transformador de balanceado a desbalanceado. El 1:1 une coaxil y dipolo; 4:1 y 9:1 además transforman la impedancia.</Def>
          <Def term="Acoplador de antena (ATU)">Red de L y C que hace que el transmisor vea 50 Ω. Protege al equipo, pero no mejora la antena.</Def>
        </Defs>
      </Section>

      <Section id="antenas" kicker="C.5" title="Antenas">
        <Fig caption="Dipolo de media onda: irradia al máximo perpendicular al hilo y nada en la dirección del hilo.">
          <DipolePattern />
        </Fig>
        <Defs>
          <Def term="Ganancia" unit="dBi / dBd">Cuánto concentra la antena la potencia en una dirección, respecto de una antena isotrópica (dBi) o de un dipolo (dBd).</Def>
          <Def term="Directividad">Capacidad de concentrar la radiación en una dirección.</Def>
          <Def term="Diagrama de radiación">Gráfico de la intensidad irradiada según la dirección.</Def>
          <Def term="Ancho de haz">Ángulo entre los puntos a −3 dB del lóbulo principal.</Def>
          <Def term="PIRE" unit="W">Potencia isotrópica radiada equivalente: potencia entregada a la antena multiplicada por su ganancia lineal respecto de una isotrópica. Si la ganancia es G en dBi, el factor lineal es 10 elevado a G/10.</Def>
        </Defs>
        <Eq vars={[['L', 'largo total del dipolo [m]'], ['f', 'frecuencia [MHz]'], ['0,95', 'factor de acortamiento típico']]}
          lines={['L (m) ≈ 150 / f (MHz) · 0,95', 'dBi = dBd + 2,15']} />
        <Example title="Dipolo para 7,1 MHz." steps={['L = 150 / 7,1 · 0,95 = 20,07 m', 'Cada rama: 10,04 m']} result="≈ 20 m en total; impedancia ≈ 73 Ω en el centro." />
        <Key>
          <ul>
            <li>Tipos: dipolo, V invertida, monopolo (vertical λ/4 con radiales), lazo, Yagi-Uda, log-periódica, helicoidal, parabólica, panel.</li>
            <li>Yagi: dipolo + reflector + directores. Más elementos = más ganancia y haz más angosto.</li>
          </ul>
        </Key>
        <Sim name="antenna" label="largo de antena y diagrama" />
      </Section>
    </>
  );
}
