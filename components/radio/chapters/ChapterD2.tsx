import { Section, Prose } from '../ui/Prose';
import { Def, Defs, Key, Table, Cite, Sim } from '../ui/Teach';
import { BankList } from '../BankList';
import { BandPlanTable } from '../BandPlanTable';
import { OFFICIAL_FILES } from '@/lib/radio/sources';

/** Bloque D, segunda parte: plan de bandas, ética, códigos, infracciones, banco y fuentes. */
export function ChapterD2() {
  return (
    <>
      <Section id="bandas" kicker="D.5" title="Plan de bandas y clases de emisión">
        <Defs>
          <Def term="Atribución primaria">El servicio tiene prioridad en la banda y puede reclamar protección contra interferencias.</Def>
          <Def term="Atribución secundaria">No puede causar interferencia a servicios primarios ni reclamar protección frente a ellos; sólo frente al mismo servicio u otros secundarios. <Cite>Banco PB.11</Cite></Def>
          <Def term="Clase de emisión">Código UIT de tres caracteres: tipo de modulación, señal moduladora e información transmitida.</Def>
        </Defs>
        <Table
          head={['Clase', 'Modo', 'Tipo']}
          rows={[
            ['A1A', 'CW', 'Telegrafía, código Morse'], ['A3E', 'AM', 'Telefonía, AM doble banda lateral'],
            ['J3E', 'SSB', 'Telefonía, BLU con portadora suprimida'], ['F3E', 'FM', 'Telefonía, modulación de frecuencia'],
            ['F1B', 'RTTY', 'Teletipo por desplazamiento de frecuencia'], ['F2D / J2D', 'PACKET, APRS', 'Datos digitales (VHF-UHF / HF)'],
            ['F3F', 'SSTV', 'Televisión de barrido lento, FM'], ['A3F', 'ATV', 'Televisión, doble banda lateral'],
            ['A3C', 'FAX', 'Facsímil'], ['F1E / G1E', 'DV', 'Voz digital'],
          ]}
          cite="Anexo A, punto 3 · Banco PB.2–PB.10"
        />
        <Key>
          <ul>
            <li>Novicio opera en todas las bandas excepto 30, 17 y 12 m. En 20 m sólo 14070–14099 kHz; en 15 m sólo 21070–21149 kHz (21200–21310 kHz vía satélite); en 10 m, 28300–28350 kHz sólo DX y 29300–29510 kHz sólo vía satélite. <Cite>Anexo A · Banco PBN.1–PBN.5</Cite></li>
            <li>En 17 m Novicio sólo puede emitir una radiobaliza. <Cite>Banco PBN.12</Cite></li>
            <li>PIRE máxima: 1 W en 2200 m, 5 W en 630 m, 25 W en 60 m. <Cite>Banco PBN.6–PBN.8</Cite></li>
            <li>Ancho máximo de digimodos: 3 kHz en 160, 80 y 40 m; 16 kHz en 10, 6 y 2 m. <Cite>Banco PBN.10, PBN.11</Cite></li>
            <li>No se transmite en el límite de una banda o tramo: la emisión tiene ancho y quedaría afuera. <Cite>Banco PB.1</Cite></li>
          </ul>
        </Key>
        <BandPlanTable />
        <Sim name="bands" label="mapa de bandas" />
      </Section>

      <Section id="etica" kicker="D.6" title="Ética y procedimientos operativos">
        <Prose>
          <p>Referencia: manual de IARU «Ética y Procedimientos Operativos para el Radioaficionado». Sus principios del Código de Conducta son: <strong>sentido social y espíritu fraternal, comprensión, buenos modales y tolerancia</strong>. <Cite>Banco I.45</Cite></p>
        </Prose>
        <Key>
          <ul>
            <li>Escuchar antes de transmitir y preguntar si la frecuencia está ocupada.</li>
            <li>Todo se transmite en claro: transmitir textos encriptados es infracción. <Cite>Banco XIII.3</Cite></li>
            <li>No se tratan temas políticos, religiosos ni raciales, ni se transmite música. <Cite>Banco XIII.1</Cite></li>
            <li>Libro de guardia: fecha, hora de inicio y fin, clase de emisión y señal de la estación corresponsal. <Cite>Banco XII.23</Cite></li>
            <li>Las emergencias tienen prioridad; colaborar cuando la autoridad lo pide. <Cite>Arts. 1.5.12 y 1.5.13</Cite></li>
          </ul>
        </Key>
      </Section>

      <Section id="lenguaje" kicker="D.7" title="Alfabeto fonético, código Q y RST">
        <Defs>
          <Def term="Alfabeto fonético UIT">Una palabra por letra (Alfa, Bravo, Charlie…) para deletrear sin errores.</Def>
          <Def term="Código Q">Abreviaturas de tres letras que empiezan con Q. Con signo de pregunta son pregunta; sin él, afirmación.</Def>
          <Def term="RST">Reporte de señal: Legibilidad (1–5), Intensidad (1–9) y Tono (1–9, sólo CW). «59» en fonía, «599» en CW.</Def>
          <Def term="Señales de socorro">MAYDAY en fonía y SOS en telegrafía (··· ––– ···).</Def>
        </Defs>
        <Sim name="cards" label="tarjetas de fonético y código Q" />
      </Section>

      <Section id="infracciones" kicker="D.8" title="Infracciones y sanciones">
        <Table
          head={['Tipo', 'Ejemplos']}
          rows={[
            ['Generales', 'Operar sin licencia vigente; comunicar con estaciones no autorizadas; temas políticos, religiosos o raciales; transmitir música'],
            ['De identificación', 'Usar la señal de otro; móvil sin indicar ubicación; señal especial vencida; omitir «Práctica Operativa»'],
            ['Operativas', 'Frecuencia o potencia no autorizada para la categoría; textos encriptados; concursos en frecuencias no autorizadas'],
            ['Repetidoras', 'Sin identificación; frecuencias no autorizadas; enlazar repetidoras sin autorización'],
            ['Radiobalizas', 'No notificada; más de una en la misma banda y lugar; potencia superior a la autorizada'],
          ]}
          cite="Banco XIII.1–XIII.5"
        />
        <Key><p>Orden de sanciones: llamado de atención → apercibimiento → sanción económica → suspensión → cancelación de la licencia. <Cite>Banco XIII.6</Cite></p></Key>
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: reglamentación">
        <BankList pool="D" />
      </Section>

      <Section id="fuentes" kicker="D.9" title="Documentos oficiales">
        <Prose>
          <ul>
            {OFFICIAL_FILES.map((f) => <li key={f.url}><a href={f.url} target="_blank" rel="noreferrer">{f.name}</a></li>)}
            <li><a href="https://www.enacom.gob.ar/radioaficionados_p127" target="_blank" rel="noreferrer">Página de Radioaficionados de ENACOM</a> (reglamento y lista de radio clubes)</li>
          </ul>
        </Prose>
      </Section>
    </>
  );
}
