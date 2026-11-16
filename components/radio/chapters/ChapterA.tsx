import { Section, Prose, Formula } from '../ui/Prose';
import { Widget } from '../widgets/Widget';

export function ChapterA() {
  return (
    <>
      <Section id="ohm" kicker="A.1" title="Tensión, corriente, resistencia y potencia">
        <Prose>
          <p>La <strong>tensión</strong> (V, volts) es el empuje; la <strong>corriente</strong> (I, amperes) es cuánta carga pasa por segundo; la <strong>resistencia</strong> (R, ohms) es cuánto se opone el camino. La <strong>potencia</strong> (P, watts) es la energía por segundo que se entrega o se vuelve calor.</p>
          <p><Formula>V = I · R</Formula> &nbsp; <Formula>P = V · I = I² · R = V² / R</Formula></p>
          <p>Con dos datos sacás los otros dos. Ejemplo de examen: un transmisor de 100 W sobre una carga de 50 Ω tiene 70,7 V y 1,41 A en el cable.</p>
        </Prose>
        <Widget name="ohm" />
      </Section>

      <Section id="alterna" kicker="A.2" title="Alterna, frecuencia y longitud de onda">
        <Prose>
          <p>La continua (CC) no cambia de sentido; la alterna (CA) oscila. La <strong>frecuencia</strong> f es cuántos ciclos por segundo (Hz) y el <strong>período</strong> T = 1/f es lo que dura un ciclo.</p>
          <p>Una onda de radio viaja a la velocidad de la luz. En un ciclo avanza una <strong>longitud de onda</strong>:</p>
          <p><Formula>λ = c / f</Formula> &nbsp; → atajo: <Formula>λ (m) = 300 / f (MHz)</Formula></p>
          <p>Por eso las bandas tienen nombres en metros: 7 MHz ≈ «40 m», 146 MHz ≈ «2 m». Y por eso las antenas de HF son enormes y las de UHF entran en la mano.</p>
          <p>Valores de una senoidal: <strong>pico</strong> (Vp), <strong>pico a pico</strong> (Vpp = 2·Vp) y <strong>eficaz</strong> (Vrms = Vp/√2 ≈ 0,707·Vp). El RMS es el que produce el mismo calor que una continua: 220 V de la red son RMS, el pico es 311 V.</p>
        </Prose>
        <Widget name="wave" />
      </Section>

      <Section id="reactancia" kicker="A.3" title="Bobinas y capacitores en RF">
        <Prose>
          <p>En alterna, bobinas y capacitores se oponen a la corriente según la frecuencia. A esa oposición se la llama <strong>reactancia</strong> (X, en ohms) y no disipa calor: guarda energía y la devuelve.</p>
          <p><Formula>XL = 2π f L</Formula> la bobina frena más cuanto más alta la frecuencia.</p>
          <p><Formula>XC = 1 / (2π f C)</Formula> el capacitor deja pasar mejor las frecuencias altas y <strong>bloquea la continua</strong>.</p>
          <ul>
            <li><strong>Resistores</strong>: en RF importa que no sean inductivos. Los de alambre bobinado se comportan como bobinas; para cargas fantasma se usan de película o carbón.</li>
            <li><strong>Bobinas</strong>: con núcleo de aire (estables, Q alto, grandes) o toroides de ferrita / hierro pulverizado (chicas, el campo queda adentro).</li>
            <li><strong>Capacitores</strong>: en serie la capacidad total baja; en paralelo se suma (al revés que los resistores).</li>
          </ul>
        </Prose>
        <Widget name="reactance" />
      </Section>

      <Section id="resonancia" kicker="A.4" title="Resonancia, Q y selectividad">
        <Prose>
          <p>Hay una frecuencia en la que XL = XC: la <strong>frecuencia de resonancia</strong>. Ahí bobina y capacitor se pasan la energía de uno a otro como un péndulo.</p>
          <p><Formula>f₀ = 1 / (2π √(L·C))</Formula></p>
          <p>El <strong>factor Q</strong> mide qué tan «filosa» es la resonancia: <Formula>BW = f₀ / Q</Formula>. Q alto = elige una frecuencia y rechaza las vecinas. Es lo que hacía el viejo capacitor tándem al sintonizar: mover f₀.</p>
          <p>El <strong>tanque paralelo</strong> tiene impedancia máxima en f₀ (se usa como selector en receptores y osciladores). El <strong>LC serie</strong> tiene impedancia mínima en f₀ (deja pasar o cortocircuita una frecuencia).</p>
        </Prose>
        <Widget name="resonance" />
      </Section>
    </>
  );
}
