import { Section } from '../ui/Prose';
import { Def, Defs, Eq, Example, Fig, Key, Sim, Table } from '../ui/Teach';
import { SpectrumAmSsb, BlockChain } from '../diagrams/more';

/** Bloque B, primera parte: modulación, modos digitales y receptor. */
export function ChapterB() {
  return (
    <>
      <Section id="modulacion" kicker="B.1" title="Modulación analógica: CW, AM, FM y SSB">
        <Defs>
          <Def term="Portadora">Señal de RF de frecuencia fija sobre la que se monta la información.</Def>
          <Def term="Modulación">Variación de un parámetro de la portadora (amplitud, frecuencia o fase) según la señal a transmitir.</Def>
          <Def term="Banda lateral">Componente del espectro que aparece a cada lado de la portadora al modular.</Def>
          <Def term="Ancho de banda" symbol="BW" unit="Hz">Rango de frecuencias que ocupa la emisión.</Def>
        </Defs>
        <Table
          head={['Modo', 'Qué varía', 'Ancho típico']}
          rows={[
            ['CW', 'Portadora encendida/apagada (Morse)', '≈ 150 Hz'],
            ['AM', 'Amplitud; portadora + 2 bandas laterales', '2 × audio ≈ 6 kHz'],
            ['SSB (BLU)', 'AM sin portadora y con una sola banda lateral', '≈ 2,7 kHz'],
            ['FM', 'Frecuencia (desvío ±5 kHz en FM angosta)', '≈ 2·(Δf + fm) ≈ 16 kHz'],
          ]}
        />
        <Fig caption="AM ocupa el doble del audio y gasta potencia en la portadora. SSB transmite sólo una banda lateral.">
          <SpectrumAmSsb />
        </Fig>
        <Eq vars={[['BW', 'ancho de banda FM [Hz]'], ['Δf', 'desvío máximo [Hz]'], ['fm', 'frecuencia de audio máxima [Hz]']]}>BW ≈ 2 · (Δf + fm)   (regla de Carson)</Eq>
        <Example title="FM con desvío de 5 kHz y audio hasta 3 kHz. ¿Qué ancho ocupa?" steps={['BW ≈ 2 · (5 + 3) kHz']} result="BW ≈ 16 kHz." />
        <Key>
          <ul>
            <li>Convención SSB: LSB por debajo de 10 MHz (160, 80, 40 m); USB por encima.</li>
            <li>CW es el modo que más lejos llega con poca potencia: ancho mínimo, máxima relación señal/ruido.</li>
          </ul>
        </Key>
        <Sim name="modulation" label="osciloscopio de modulación" />
      </Section>

      <Section id="digitales" kicker="B.2" title="Modos digitales y ruido">
        <Defs>
          <Def term="FSK">Modulación por desplazamiento de frecuencia: cada símbolo es una frecuencia distinta. Base de RTTY y packet.</Def>
          <Def term="PSK">Modulación por desplazamiento de fase. Ejemplo: PSK31, muy angosto.</Def>
          <Def term="QAM">Modulación en amplitud y fase a la vez: más bits por símbolo, necesita buena señal.</Def>
          <Def term="DSP">Procesamiento digital de señales: filtrado y demodulación hechos con cálculo sobre la señal digitalizada.</Def>
          <Def term="Ruido">Toda señal no deseada que se suma a la útil: atmosférico, de origen humano (motores, fuentes conmutadas) y térmico del propio receptor.</Def>
        </Defs>
        <Table
          head={['Digimodo', 'Uso']}
          rows={[
            ['RTTY', 'Teletipo por FSK (clase F1B)'], ['PACKET', 'Datos por paquetes con TNC; BBS y digipeaters'],
            ['APRS', 'Posición automática; 144,390 MHz en Argentina'], ['SSTV', 'Imágenes fijas por FM'],
            ['ATV', 'Televisión de aficionados'], ['DV', 'Voz digital (por ejemplo DMR, D-STAR)'],
          ]}
          cite="Programa ENACOM 3.b.iii · Anexo A"
        />
        <Key><p>Relación señal/ruido (S/N): cuánto más fuerte es la señal que el ruido. Un modo más angosto deja entrar menos ruido.</p></Key>
      </Section>

      <Section id="receptor" kicker="B.3" title="El receptor">
        <Fig caption="Receptor superheterodino: toda señal se lleva a una frecuencia intermedia (FI) fija.">
          <BlockChain label="Antena, amplificador de RF, mezclador con oscilador local, filtro y amplificador de FI, demodulador, audio" blocks={['Amp. RF', 'Mezclador', 'Filtro FI', 'Demodulador', 'Audio']} />
        </Fig>
        <Defs>
          <Def term="Mezclador">Combina la señal con el oscilador local (OL) y produce f_RF + f_OL y |f_RF − f_OL|.</Def>
          <Def term="Frecuencia intermedia (FI)">Frecuencia fija donde se hace el filtrado fino: FI = |f_RF − f_OL|.</Def>
          <Def term="Frecuencia imagen">La otra frecuencia que también da la FI, separada 2·FI de la deseada. La frena el filtro de entrada.</Def>
          <Def term="Sensibilidad">Señal mínima que el receptor detecta con una relación S/N dada.</Def>
          <Def term="Selectividad">Capacidad de separar la señal deseada de las adyacentes.</Def>
          <Def term="Figura de ruido">Cuánto ruido agrega el receptor; menor es mejor.</Def>
          <Def term="Intermodulación">Productos espurios que aparecen cuando dos señales fuertes se mezclan en una etapa no lineal.</Def>
        </Defs>
        <Example
          title="Receptor con FI de 10,7 MHz sintonizado en 146 MHz, con OL por debajo. ¿Dónde está la imagen?"
          steps={['f_OL = 146 − 10,7 = 135,3 MHz', 'f_imagen = f_OL − FI = 135,3 − 10,7']}
          result="f_imagen = 124,6 MHz (= 146 − 2 · 10,7)."
        />
        <Sim name="receiver" label="receptor superheterodino" />
      </Section>
    </>
  );
}
