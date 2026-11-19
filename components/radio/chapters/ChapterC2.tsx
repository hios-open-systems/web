import { Section } from '../ui/Prose';
import { Def, Defs, Eq, Example, Fig, Key, Sim, Table } from '../ui/Teach';
import { BankList } from '../BankList';
import { Skywave, Horizon } from '../diagrams/more';

/** Bloque C, segunda parte: propagación, enlaces, seguridad e interferencias. */
export function ChapterC2() {
  return (
    <>
      <Section id="ionosfera" kicker="C.6" title="Propagación en HF: la ionosfera">
        <Defs>
          <Def term="Onda de superficie (terrestre)">Sigue la superficie de la Tierra. Domina en LF y MF.</Def>
          <Def term="Onda ionosférica (de cielo)">Se refracta en la ionosfera y vuelve a tierra lejos. Es la propagación de HF.</Def>
          <Def term="MUF">Máxima frecuencia utilizable: la más alta que la ionosfera devuelve para un trayecto dado.</Def>
          <Def term="Zona de silencio">Región entre el alcance de la onda de superficie y el primer retorno ionosférico.</Def>
          <Def term="Ciclo solar">Ciclo de ≈ 11 años de manchas solares. En el máximo, 10–15 m se abren al mundo.</Def>
        </Defs>
        <Fig caption="Un salto: la onda sube, se refracta en la capa F y vuelve a tierra a cientos o miles de km.">
          <Skywave />
        </Fig>
        <Table
          head={['Capa', 'Altura', 'Comportamiento']}
          rows={[
            ['D', '60–90 km', 'Sólo de día; absorbe 160 y 80 m'],
            ['E', '90–130 km', 'De día; la E esporádica abre 10 y 6 m'],
            ['F1 / F2', '150–400 km', 'De día separadas; de noche una sola F. La F2 da el DX'],
          ]}
        />
        <Key><p>De día, bandas altas (20–10 m); de noche, bandas bajas (160–40 m).</p></Key>
        <Sim name="ionosphere" label="ionosfera día y noche" />
      </Section>

      <Section id="alcance" kicker="C.7" title="VHF/UHF y cálculo de enlace">
        <Defs>
          <Def term="Onda espacial (línea de vista)">Viaja en línea recta entre las antenas. Domina en VHF y UHF.</Def>
          <Def term="Propagación troposférica">Curvatura de la onda por cambios de temperatura y humedad del aire: amplía el alcance en VHF/UHF.</Def>
          <Def term="Difracción">La onda rodea obstáculos como cerros o edificios, con pérdida.</Def>
          <Def term="Multitrayecto">La señal llega por varios caminos (reflexiones) y se suma o cancela.</Def>
        </Defs>
        <Fig caption="La curvatura de la Tierra corta la línea de vista. Subir las antenas aumenta el alcance más que subir la potencia.">
          <Horizon />
        </Fig>
        <Eq vars={[['FSPL', 'pérdida en el espacio libre [dB]'], ['d', 'distancia [km]'], ['f', 'frecuencia [MHz]']]}>
          FSPL (dB) = 32,45 + 20·log₁₀ d + 20·log₁₀ f
        </Eq>
        <Example
          title="Pérdida en el espacio libre a 5 km en 146 MHz."
          steps={['20·log₁₀ 5 = 14,0', '20·log₁₀ 146 = 43,3', 'FSPL = 32,45 + 14,0 + 43,3']}
          result="FSPL ≈ 89,7 dB. Con obstáculos y antenas bajas la pérdida real es bastante mayor."
        />
        <Key><p>Cálculo de enlace: potencia del TX + ganancias de antenas − pérdidas (cables, trayecto) ≥ sensibilidad del receptor + margen. Lluvia, niebla y vegetación suman pérdida en UHF y SHF.</p></Key>
        <Sim name="link" label="¿llego? alcance a 5 km" />
      </Section>

      <Section id="seguridad" kicker="C.8" title="Seguridad">
        <Defs>
          <Def term="Puesta a tierra">Conexión de chasis y mástil a una jabalina. Protege a las personas y descarga la estática.</Def>
          <Def term="Pararrayos">Protege la instalación de descargas atmosféricas. Se desconecta la antena del equipo durante tormentas.</Def>
          <Def term="Exposición a RF">La RF calienta los tejidos. Más riesgo cuanto más potencia y más cerca de la antena, y en VHF/UHF.</Def>
          <Def term="Alto voltaje">Fuentes, amplificadores valvulares y capacitores cargados pueden ser mortales aun desenchufados.</Def>
        </Defs>
        <Key>
          <ul>
            <li>Antenas lejos de las personas y de las líneas eléctricas.</li>
            <li>Descargar los capacitores antes de trabajar dentro de un equipo.</li>
          </ul>
        </Key>
      </Section>

      <Section id="interferencias" kicker="C.9" title="Interferencias y compatibilidad electromagnética">
        <Defs>
          <Def term="Bloqueo (desensibilización)">Una señal muy fuerte cercana satura el receptor y le quita sensibilidad.</Def>
          <Def term="Intermodulación">Dos señales fuertes se mezclan en una etapa no lineal y producen señales falsas.</Def>
          <Def term="Emisión espuria">Emisión fuera de la banda necesaria (armónicas, productos de mezcla).</Def>
        </Defs>
        <Table
          head={['Remedio', 'Qué hace']}
          rows={[
            ['Filtrado', 'LPF en el transmisor; HPF o filtros de red en el equipo afectado'],
            ['Desacoplamiento', 'Ferritas y capacitores de paso que cortan la RF en cables de audio y alimentación'],
            ['Blindaje', 'Gabinete metálico conectado a tierra que encierra el circuito'],
          ]}
          cite="Programa ENACOM 3.e"
        />
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: bloque C">
        <BankList pool="C" />
      </Section>
    </>
  );
}
