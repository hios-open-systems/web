import { Section } from '../ui/Prose';
import { Def, Defs, Eq, Example, Fig, Key, Sim, Table } from '../ui/Teach';
import { OhmCircuit, SineAnatomy, Wavelength, ReactanceVsFrequency, ResonanceCurve } from '../diagrams/basics';

export function ChapterA() {
  return (
    <>
      <Section id="ohm" kicker="A.1" title="Tensión, corriente, resistencia y potencia">
        <Defs>
          <Def term="Tensión" symbol="V" unit="volt, V">Diferencia de potencial eléctrico entre dos puntos. Es la causa de que circule corriente.</Def>
          <Def term="Corriente" symbol="I" unit="ampere, A">Carga eléctrica que atraviesa una sección del conductor por segundo (1 A = 1 C/s).</Def>
          <Def term="Resistencia" symbol="R" unit="ohm, Ω">Oposición al paso de la corriente. Convierte energía eléctrica en calor.</Def>
          <Def term="Potencia" symbol="P" unit="watt, W">Energía entregada o disipada por segundo (1 W = 1 J/s).</Def>
        </Defs>
        <Fig caption="Circuito serie mínimo: la fuente impone V, la resistencia fija cuánta corriente I circula.">
          <OhmCircuit />
        </Fig>
        <Eq vars={[['V', 'tensión [V]'], ['I', 'corriente [A]'], ['R', 'resistencia [Ω]'], ['P', 'potencia [W]']]}>
          V = I · R    P = V · I = I²·R = V²/R
        </Eq>
        <Example
          title="Un transmisor entrega 100 W a una carga de 50 Ω. ¿Qué tensión y corriente hay en la carga?"
          steps={['V = √(P·R) = √(100 · 50) = 70,7 V', 'I = V / R = 70,7 / 50 = 1,41 A']}
          result="V = 70,7 V eficaces; I = 1,41 A."
        />
        <Key>
          <ul>
            <li>Con dos magnitudes conocidas se calculan las otras dos.</li>
            <li>Serie: R total = R1 + R2 + … Paralelo: 1/R total = 1/R1 + 1/R2 + …</li>
            <li>Conductores (cobre) conducen; aislantes (vidrio, plástico) no; semiconductores (silicio) conducen según cómo se los polarice.</li>
          </ul>
        </Key>
        <Defs>
          <Def term="1.ª ley de Kirchhoff (nodos)">La suma de corrientes que entran a un nodo es igual a la suma de las que salen.</Def>
          <Def term="2.ª ley de Kirchhoff (mallas)">En un lazo cerrado, la suma de las tensiones de las fuentes es igual a la suma de las caídas de tensión.</Def>
          <Def term="Energía" symbol="E" unit="joule, J; kWh">Potencia por tiempo: E = P · t.</Def>
        </Defs>
        <Sim name="ohm" label="ley de Ohm" />
      </Section>

      <Section id="alterna" kicker="A.2" title="Corriente alterna, frecuencia y longitud de onda">
        <Defs>
          <Def term="Corriente continua (CC)" >Mantiene siempre el mismo sentido y valor.</Def>
          <Def term="Corriente alterna (CA)">Cambia de sentido periódicamente. En radio la forma de referencia es la senoidal.</Def>
          <Def term="Frecuencia" symbol="f" unit="hertz, Hz">Cantidad de ciclos completos por segundo.</Def>
          <Def term="Período" symbol="T" unit="segundo, s">Duración de un ciclo. T = 1/f.</Def>
        </Defs>
        <Fig caption="Un ciclo de senoidal. Vp: valor pico. Vpp: pico a pico. Vrms: valor eficaz, el que produce el mismo calor que una CC del mismo valor.">
          <SineAnatomy />
        </Fig>
        <Eq vars={[['Vpp', '= 2 · Vp'], ['Vrms', '= Vp / √2 ≈ 0,707 · Vp'], ['T', '= 1 / f']]}>Vrms = 0,707 · Vp</Eq>
        <Example
          title="La red domiciliaria es de 220 V. ¿Cuál es su valor pico?"
          steps={['Los 220 V son eficaces (rms)', 'Vp = Vrms · √2 = 220 · 1,414 = 311 V']}
          result="Vp = 311 V; Vpp = 622 V."
        />
        <Def term="Longitud de onda" symbol="λ" unit="metro, m">Distancia que recorre la onda durante un período. La onda viaja a c ≈ 300 000 km/s.</Def>
        <Fig caption="La misma onda vista en el espacio: λ es la distancia entre dos crestas.">
          <Wavelength />
        </Fig>
        <Eq vars={[['λ', 'longitud de onda [m]'], ['c', 'velocidad de la luz, 3·10⁸ m/s'], ['f', 'frecuencia [Hz]']]}>
          λ = c / f    →    λ (m) = 300 / f (MHz)
        </Eq>
        <Example title="¿Qué longitud de onda tiene 146 MHz?" steps={['λ = 300 / 146 = 2,05 m']} result="≈ 2 m: por eso se la llama «banda de 2 metros»." />
        <Table
          head={['Región', 'Frecuencias', 'Longitud de onda']}
          rows={[
            ['LF', '30–300 kHz', '10–1 km'], ['MF', '300 kHz–3 MHz', '1 km–100 m'], ['HF', '3–30 MHz', '100–10 m'],
            ['VHF', '30–300 MHz', '10–1 m'], ['UHF', '300 MHz–3 GHz', '1 m–10 cm'], ['SHF', '3–30 GHz', '10–1 cm'],
          ]}
          cite="Regiones del espectro radioeléctrico (nomenclatura UIT)"
        />
        <Sim name="wave" label="onda, período y longitud de onda" />
      </Section>

      <Section id="reactancia" kicker="A.3" title="Reactancia: bobinas y capacitores en CA">
        <Defs>
          <Def term="Inductancia" symbol="L" unit="henry, H">Propiedad de una bobina de oponerse a los cambios de corriente. Almacena energía en campo magnético.</Def>
          <Def term="Capacidad" symbol="C" unit="farad, F">Propiedad de un capacitor de almacenar carga. Almacena energía en campo eléctrico.</Def>
          <Def term="Reactancia" symbol="X" unit="ohm, Ω">Oposición de L o C a la corriente alterna. Depende de la frecuencia y no disipa potencia.</Def>
          <Def term="Impedancia" symbol="Z" unit="ohm, Ω">Oposición total en CA: combinación de resistencia y reactancia.</Def>
        </Defs>
        <Fig caption="XL crece con la frecuencia; XC disminuye. Se igualan en f₀, la frecuencia de resonancia.">
          <ReactanceVsFrequency />
        </Fig>
        <Eq vars={[['XL', 'reactancia inductiva [Ω]'], ['XC', 'reactancia capacitiva [Ω]'], ['f', 'frecuencia [Hz]'], ['L', 'inductancia [H]'], ['C', 'capacidad [F]']]}>
          XL = 2π·f·L    XC = 1 / (2π·f·C)
        </Eq>
        <Key>
          <ul>
            <li>El capacitor bloquea la CC (f = 0 → XC infinita). La bobina deja pasar la CC (XL = 0).</li>
            <li>Capacitores en paralelo se suman; en serie, 1/C total = 1/C1 + 1/C2 (al revés que los resistores).</li>
            <li>En RF se usan resistores no inductivos (película o carbón), no de alambre bobinado.</li>
          </ul>
        </Key>
        <Sim name="reactance" label="reactancia contra frecuencia" />
      </Section>

      <Section id="resonancia" kicker="A.4" title="Resonancia, factor Q y ancho de banda">
        <Defs>
          <Def term="Frecuencia de resonancia" symbol="f₀" unit="Hz">Frecuencia en la que XL = XC en un circuito LC.</Def>
          <Def term="Factor de mérito" symbol="Q">Relación entre la energía almacenada y la disipada por ciclo. Q alto = resonancia angosta.</Def>
          <Def term="Ancho de banda" symbol="BW" unit="Hz">Rango de frecuencias en el que la respuesta cae menos de 3 dB respecto del pico.</Def>
        </Defs>
        <Fig caption="Respuesta de un circuito resonante: máxima en f₀; el ancho de banda se mide a −3 dB (70,7 % del pico).">
          <ResonanceCurve />
        </Fig>
        <Eq vars={[['f₀', 'frecuencia de resonancia [Hz]'], ['L', 'inductancia [H]'], ['C', 'capacidad [F]'], ['Q', 'factor de mérito (sin unidad)']]}>
          f₀ = 1 / (2π·√(L·C))    BW = f₀ / Q
        </Eq>
        <Example
          title="Un circuito resuena en 7 MHz con Q = 100. ¿Cuál es su ancho de banda?"
          steps={['BW = f₀ / Q = 7 000 000 / 100']}
          result="BW = 70 kHz."
        />
        <Key>
          <ul>
            <li>LC paralelo («tanque»): impedancia máxima en f₀. Selecciona una frecuencia en receptores y osciladores.</li>
            <li>LC serie: impedancia mínima en f₀. Deja pasar (o cortocircuita) una frecuencia.</li>
            <li>Si aumenta L o C, f₀ baja.</li>
          </ul>
        </Key>
        <Sim name="resonance" label="resonancia y Q" />
      </Section>
    </>
  );
}
