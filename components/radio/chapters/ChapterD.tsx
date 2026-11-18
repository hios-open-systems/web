import { Section, Prose, Callout } from '../ui/Prose';
import { Widget } from '../widgets/Widget';
import { BankList } from '../BankList';
import { OFFICIAL_FILES } from '@/lib/radio/bankReglamento';
import styles from '../radio.module.css';

const DISTRICTS: ReadonlyArray<readonly [string, string]> = [
  ['CABA', 'A · B · C'], ['Buenos Aires', 'D · E'], ['Santa Fe', 'F'], ['Chaco', 'GA–GO'], ['Formosa', 'GP–GZ'],
  ['Córdoba', 'H'], ['Misiones', 'I'], ['Entre Ríos', 'J'], ['Tucumán', 'K'], ['Corrientes', 'L'], ['Mendoza', 'M'],
  ['Sgo. del Estero', 'N'], ['Salta', 'O'], ['San Juan', 'P'], ['San Luis', 'Q'], ['Catamarca', 'R'], ['La Rioja', 'S'],
  ['Jujuy', 'T'], ['La Pampa', 'U'], ['Río Negro', 'V'], ['Chubut', 'W'], ['Santa Cruz', 'XA–XO'],
  ['Tierra del Fuego', 'XP–XZ'], ['Neuquén', 'Y'], ['Antártida e Islas', 'Z'],
];

export function ChapterD() {
  return (
    <>
      <Section id="licencia" kicker="D.1" title="La licencia en Argentina">
        <Prose>
          <p>La regula ENACOM con el <strong>Reglamento General de Radioaficionados</strong> (Res. ENACOM 3635/2017), modificado por la Res. 1186/2024. Citamos el artículo de cada dato.</p>
          <ul>
            <li>Categorías: <strong>Novicio, General, Superior y Especial</strong> (art. 4.1).</li>
            <li>Novicio: desde los 9 años, argentino o extranjero con residencia permanente (art. 4.4.1–4.4.2).</li>
            <li>Examen escrito de <strong>Técnica, Reglamentación y Ética Operativa</strong>, más <strong>Telegrafía</strong> (conocimientos generales de Morse), y Prácticas Operativas (art. 4.4.3).</li>
            <li>Se rinde y se tramita en un <strong>Radio Club o Institución Autorizada</strong>, no online (art. 4.2).</li>
            <li>Potencia máxima: Novicio 200 W, General 1000 W, Superior 1500 W, con límites por banda en el plan de bandas (art. 4.11).</li>
            <li>Desde la Res. 1186/2024 la licencia <strong>no vence</strong>; el certificado de antecedentes penales se sigue presentando cada 5 años (arts. 1.5.5 y 4.3).</li>
          </ul>
        </Prose>
      </Section>

      <Section id="senales" kicker="D.2" title="Señales distintivas">
        <Prose>
          <p>Tu indicativo es un prefijo del país más un número, y un sufijo cuya primera letra indica dónde está tu estación (art. 8.1–8.2). Los sufijos de dos letras se reservan a Superior y Especial (art. 8.3), así que un Novicio recibe tres. Ejemplo de forma: <strong>LU1DXX</strong> → «D» = provincia de Buenos Aires.</p>
          <p>Te identificás <strong>al empezar y cada 10 minutos</strong> (art. 1.5.8).</p>
        </Prose>
        <div className={styles.readouts} style={{ maxWidth: 'var(--layout-reading)' }}>
          {DISTRICTS.map(([name, letters]) => (
            <div key={name} className={styles.readout} style={{ background: 'var(--hios-bg-secondary)', borderColor: 'var(--hios-border)' }}>
              <span style={{ color: 'var(--hios-text-muted)' }}>{name}</span>
              <strong style={{ color: 'var(--hios-text)' }}>{letters}</strong>
            </div>
          ))}
        </div>
      </Section>

      <Section id="bandas" kicker="D.3" title="Bandas y frecuencias">
        <Callout>
          <p><strong>Pendiente de verificar.</strong> Los segmentos y potencias que puede usar cada categoría están en el Anexo A (Plan de Bandas) de ENACOM, que todavía no contrastamos con el texto oficial. El mapa muestra los límites UIT Región 2 y, marcado «a verificar», el resumen de AMSAT Argentina.</p>
        </Callout>
        <Widget name="bands" />
      </Section>

      <Section id="lenguaje" kicker="D.4" title="Fonético, código Q y RST">
        <Prose>
          <p>El <strong>alfabeto fonético ITU</strong> (Alfa, Bravo, Charlie…) evita confusiones al deletrear. El <strong>código Q</strong> son abreviaturas de tres letras que empiezan con Q; con signo de pregunta son pregunta, sin él son afirmación. El reporte <strong>RST</strong> es Legibilidad (1–5), Señal (1–9) y Tono (1–9, sólo en CW): «59» en fonía, «599» en CW.</p>
        </Prose>
        <Widget name="cards" />
      </Section>

      <Section id="repetidoras" kicker="D.5" title="Repetidoras y emergencias">
        <Prose>
          <ul>
            <li>Una <strong>repetidora</strong> escucha en una frecuencia y retransmite en otra, desde un lugar alto. La diferencia es el <strong>offset</strong> (en 2 m suele ser 600 kHz; en 70 cm, 5 MHz).</li>
            <li>Muchas sólo se abren con un <strong>subtono CTCSS</strong> (un tono subaudible). No es privacidad: cualquiera escucha.</li>
            <li>Toda repetidora necesita autorización (art. 10.1). Está prohibido operar en simplex en la frecuencia de entrada de una repetidora y a ±15 kHz de ella (art. 10.18).</li>
            <li>Cortesía: dejá un par de segundos entre cambios para que alguien con urgencia pueda entrar.</li>
            <li>Los enlaces por internet (VoIP) entre estaciones y repetidoras están permitidos (art. 10.17).</li>
            <li>Emergencias: las redes de emergencia funcionan en las frecuencias y plazos que fije la autoridad (art. 1.5.12) y las estaciones dan prioridad a colaborar cuando se lo piden (art. 1.5.13).</li>
          </ul>
        </Prose>
        <Callout tone="info"><p>Sin cifrado: en radioaficionados todo se transmite en claro. Los bancos de estudio listan «transmitir textos encriptados» como infracción (Cap. XIII); lo confirmamos contra el texto oficial junto con el plan de bandas.</p></Callout>
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: reglamentación">
        <BankList pool="D" />
      </Section>

      <Section id="fuentes" kicker="D.6" title="Archivos oficiales para bajar">
        <Prose>
          <p>ENACOM publica el material del examen junto a la Res. 508/2018. Bajalos y guardalos: son la referencia final ante cualquier duda.</p>
          <ul>
            {OFFICIAL_FILES.map((f) => <li key={f.url}><a href={f.url} target="_blank" rel="noreferrer">{f.name}</a></li>)}
            <li><a href="https://www.enacom.gob.ar/radioaficionados_p127" target="_blank" rel="noreferrer">Página de Radioaficionados de ENACOM</a> (reglamento, normativa y lista de radio clubes)</li>
            <li><a href="https://www.lu1ma.org.ar/index.php/biblioteca/" target="_blank" rel="noreferrer">Biblioteca del Cuyo Radio Club (LU1MA)</a>: bancos de preguntas técnicas por categoría y apuntes del curso</li>
          </ul>
        </Prose>
      </Section>
    </>
  );
}
