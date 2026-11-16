import { Section, Prose, Formula, Callout } from '../ui/Prose';
import { Widget } from '../widgets/Widget';

export function ChapterB() {
  return (
    <>
      <Section id="modulacion" kicker="B.1" title="Modulación">
        <Prose>
          <p>La voz (300–3000 Hz) no se puede irradiar directo: haría falta una antena de cientos de km. Se usa una <strong>portadora</strong> de RF y se le «monta» la información cambiando su amplitud, su frecuencia o prendiéndola y apagándola.</p>
          <ul>
            <li><strong>CW</strong>: telegrafía, portadora on/off. ~150 Hz de ancho. Llega lejísimos con poca potencia.</li>
            <li><strong>AM</strong>: varía la amplitud. Portadora + dos bandas laterales iguales. Ancho = 2 × audio.</li>
            <li><strong>FM</strong>: varía la frecuencia. En radioaficionados se usa FM angosta (±5 kHz de desvío o menos) en VHF/UHF. Ancho por regla de Carson: <Formula>BW ≈ 2 (Δf + fm)</Formula></li>
            <li><strong>SSB</strong>: AM sin portadora y con una sola banda lateral (USB o LSB). ~2,7 kHz. Por convención, LSB debajo de 10 MHz y USB arriba.</li>
          </ul>
        </Prose>
        <Widget name="modulation" />
      </Section>

      <Section id="receptor" kicker="B.2" title="El receptor">
        <Prose>
          <p>El <strong>superheterodino</strong> mezcla la señal con un <strong>oscilador local</strong> (OL) y la lleva siempre a una <strong>frecuencia intermedia</strong> (FI) fija. Así todo el filtrado fino se hace en un solo lugar, sin importar en qué frecuencia escuches.</p>
          <p><Formula>FI = |f_RF − f_OL|</Formula></p>
          <p>Problema clásico: hay <strong>dos</strong> frecuencias que dan la misma FI. La otra se llama <strong>frecuencia imagen</strong> (a 2·FI de la deseada) y la tiene que frenar el filtro de entrada. Por eso los equipos usan FI altas o doble conversión.</p>
          <p>El <strong>SDR</strong> (radio definida por software) digitaliza la señal con un ADC (o un mezclador I/Q + placa de sonido) y hace filtro y demodulación con matemática. Un RTL-SDR de USD 30 y una PC ya te muestran la «cascada» de toda la banda.</p>
        </Prose>
        <Widget name="receiver" />
      </Section>

      <Section id="transmisor" kicker="B.3" title="El transmisor">
        <Prose>
          <p>La cadena típica:</p>
          <p><Formula>Oscilador → Modulador → Excitador (driver) → Amplificador (PA) → Filtro LPF → Antena</Formula></p>
          <p>Hoy el oscilador suele ser un <strong>sintetizador PLL</strong> (como el Si5351, de 8 kHz a 160 MHz en pasos de 1 Hz, controlado por I²C desde un microcontrolador). El PA es la etapa que más calienta y la más sensible a una mala ROE.</p>
        </Prose>
      </Section>

      <Section id="instrumentos" kicker="B.4" title="Instrumentos de la estación">
        <Prose>
          <ul>
            <li><strong>Multímetro</strong>: tensión, corriente, resistencia y continuidad. Lo básico.</li>
            <li><strong>Roímetro (medidor de ROE)</strong>: compara potencia directa y reflejada. Se intercala entre equipo y antena.</li>
            <li><strong>Vatímetro</strong>: mide la potencia que sale. Muchos roímetros traen las dos funciones.</li>
            <li><strong>Carga fantasma (dummy load)</strong>: resistencia no inductiva de 50 Ω que disipa la potencia como calor. Para probar y ajustar <strong>sin irradiar</strong>.</li>
            <li><strong>Analizador de antenas</strong> (tipo NanoVNA): mide ROE e impedancia en un barrido de frecuencias. Muy barato hoy y vale cada peso.</li>
          </ul>
        </Prose>
        <Callout tone="info"><p>Regla de oro: nunca transmitas sin antena o carga conectada. La potencia vuelve al amplificador y lo puede quemar.</p></Callout>
      </Section>
    </>
  );
}
