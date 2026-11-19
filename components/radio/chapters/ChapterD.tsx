import { Section } from '../ui/Prose';
import { Def, Defs, Key, Table, Cite } from '../ui/Teach';

const DISTRICTS: ReadonlyArray<readonly [string, string]> = [
  ['CABA', 'A · B · C'], ['Buenos Aires', 'D · E'], ['Santa Fe', 'F'], ['Chaco', 'GA–GO'], ['Formosa', 'GP–GZ'],
  ['Córdoba', 'H'], ['Misiones', 'I'], ['Entre Ríos', 'J'], ['Tucumán', 'K'], ['Corrientes', 'L'], ['Mendoza', 'M'],
  ['Sgo. del Estero', 'N'], ['Salta', 'O'], ['San Juan', 'P'], ['San Luis', 'Q'], ['Catamarca', 'R'], ['La Rioja', 'S'],
  ['Jujuy', 'T'], ['La Pampa', 'U'], ['Río Negro', 'V'], ['Chubut', 'W'], ['Santa Cruz', 'XA–XO'],
  ['Tierra del Fuego', 'XP–XZ'], ['Neuquén', 'Y'], ['Antártida e Islas', 'Z'],
];

/** Bloque D, primera parte: organismos, licencia, señales distintivas y estaciones. */
export function ChapterD() {
  return (
    <>
      <Section id="organismos" kicker="D.1" title="Organismos y normas">
        <Defs>
          <Def term="UIT" symbol="ITU">Unión Internacional de Telecomunicaciones. Su Reglamento de Radiocomunicaciones (RR) atribuye las bandas a cada servicio. Las Conferencias Mundiales de Radiocomunicaciones (CMR) lo actualizan; el Grupo de Trabajo 5A trata el servicio de aficionados.</Def>
          <Def term="IARU">International Amateur Radio Union: representa a los radioaficionados ante los foros internacionales y publica el plan de bandas de la Región 2 (Américas). <Cite>Banco I.46</Cite></Def>
          <Def term="CITEL">Comisión Interamericana de Telecomunicaciones (OEA). En su marco funciona el permiso internacional IARP.</Def>
          <Def term="CEPT">Conferencia Europea de Administraciones de Correos y Telecomunicaciones. Emite la licencia CEPT, válida en sus países miembros.</Def>
          <Def term="ENACOM">Ente Nacional de Comunicaciones: Autoridad de Aplicación del Reglamento General de Radioaficionados. <Cite>Banco I.3</Cite></Def>
          <Def term="CABFRA">Cuadro de Atribución de Bandas de Frecuencias de la República Argentina. El Plan de Bandas de radioaficionados se ajusta a él.</Def>
        </Defs>
        <Key>
          <ul>
            <li>Norma de base: Reglamento General de Radioaficionados, Res. ENACOM 3635/2017, modificado por la Res. 1186/2024.</li>
            <li>Alcance: Servicio de Aficionados y Servicio de Aficionados por Satélite. <Cite>Banco I.2</Cite></li>
            <li>Radioescucha: persona autorizada sólo a recibir; no transmite. El certificado lo otorgan los Radio Clubes. <Cite>Banco V.1, III.5</Cite></li>
          </ul>
        </Key>
      </Section>

      <Section id="licencia" kicker="D.2" title="Licencia, categorías y examen">
        <Table
          head={['Categoría', 'Requisito', 'Potencia máx.']}
          rows={[
            ['Novicio', 'Desde 9 años; aprobar examen', '200 W'],
            ['General', 'Desde 13 años; 3 años como Novicio; Morse recepción 5 ppm', '1000 W'],
            ['Superior', '3 años como General; Morse 10 ppm recepción y transmisión', '1500 W'],
            ['Especial', 'Superior con 20 años de actividad ininterrumpida', '—'],
          ]}
          cite="Reglamento arts. 4.1, 4.4 y 4.11 · Banco IV.1, IV.3–IV.6, IV.8"
        />
        <Key>
          <ul>
            <li>Cursos y exámenes: Radio Clubes e Instituciones Autorizadas. Las Instituciones Reconocidas dan cursos y prácticas, pero no toman examen. <Cite>Banco XII.1, III.14, III.15</Cite></li>
            <li>Se puede rendir libre, sin hacer el curso. El examen es escrito (oral sólo para quien no puede escribir). <Cite>Banco XII.2, XII.3</Cite></li>
            <li>Para Novicio la telegrafía es teórica. En el examen de Morse: 5 caracteres = 1 palabra; letra = 1 carácter; número o signo = 2. <Cite>Banco XII.19–XII.22</Cite></li>
            <li>El certificado de aprobación vale 6 meses para presentarlo y no habilita a transmitir: hay que esperar la licencia. <Cite>Banco XII.17, XII.18</Cite></li>
            <li>Desde la Res. 1186/2024 la licencia no vence; el certificado de antecedentes penales se presenta cada 5 años. El banco 2018 todavía dice «5 años». <Cite>Reglamento arts. 1.5.5 y 4.3</Cite></li>
          </ul>
        </Key>
      </Section>

      <Section id="senales" kicker="D.3" title="Señales distintivas e identificación">
        <Defs>
          <Def term="Prefijo">Identifica al país. Argentina: LU y LW. <Cite>Banco VIII.1, VIII.2</Cite></Def>
          <Def term="Número">Dígito entre prefijo y sufijo.</Def>
          <Def term="Sufijo">Su primera letra (o letras) indica la provincia: la del domicilio de la estación fija, o la del DNI si sólo hay móviles. Sufijo de 2 letras: sólo Superior y Especial. <Cite>Banco VIII.3–VIII.6</Cite></Def>
        </Defs>
        <Table head={['Distrito', 'Letra del sufijo']} rows={DISTRICTS} cite="Reglamento art. 8.2" />
        <Key>
          <ul>
            <li>Transmitir la señal distintiva al empezar y cada 10 minutos. <Cite>Art. 1.5.8 · Banco I.41</Cite></li>
            <li>Estación móvil: señal distintiva + ubicación geográfica + condición de móvil. <Cite>Banco IX.9</Cite></li>
            <li>Estación de otro titular: señal del titular, luego la propia, y opera en las bandas de su propia categoría. <Cite>Banco IX.3, IX.4</Cite></li>
            <li>Estación del Radio Club: señal del Club y la propia. Aspirante en práctica: señal del Club aclarando «en Práctica Operativa». <Cite>Banco III.2, III.4</Cite></li>
          </ul>
        </Key>
      </Section>

      <Section id="estaciones" kicker="D.4" title="Estaciones, repetidoras y radiobalizas">
        <Defs>
          <Def term="Estación repetidora">Estación fija que retransmite automáticamente las comunicaciones. Necesita autorización de ENACOM. <Cite>Banco I.17, X.1</Cite></Def>
          <Def term="Radiobaliza (radiofaro)">Transmisor que emite en forma continua para evaluar condiciones de propagación. No requiere categoría; una sola por emplazamiento; se notifica 15 días antes. <Cite>Banco I.27, XI.1–XI.3</Cite></Def>
        </Defs>
        <Table
          head={['Repetidora: plazo', 'Valor']}
          rows={[
            ['Poner en marcha tras la autorización', '90 días'],
            ['Informar el inicio de operación', '15 días corridos'],
            ['Máximo fuera de servicio', '60 días'],
            ['Dar de baja tras el cese', '15 días corridos (y desmantelar)'],
          ]}
          cite="Banco X.4, X.5, X.8, X.10, X.11"
        />
        <Key>
          <ul>
            <li>La repetidora se identifica con la señal del titular y la localidad. Subtono de acceso: permitido si ENACOM aprueba el código y es público. <Cite>Banco X.6, X.7</Cite></li>
            <li>Prohibido operar en simplex en la entrada de una repetidora y a ±15 kHz de ella. Enlaces por internet permitidos. <Cite>Arts. 10.17 y 10.18</Cite></li>
            <li>Todas las estaciones fijas se declaran. Traslado de más de 120 días: cambio de domicilio. Torre de antenas: trámite ante ANAC. <Cite>Banco IX.6–IX.8</Cite></li>
            <li>Conexión a la línea telefónica: sólo en emergencias. Redes de emergencia: en las frecuencias y plazos que fije la autoridad. <Cite>Banco I.37, I.42</Cite></li>
          </ul>
        </Key>
      </Section>
    </>
  );
}
