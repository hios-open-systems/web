import { Section, Prose, Callout } from '../ui/Prose';
import { Widget } from '../widgets/Widget';

export function ChapterA2() {
  return (
    <>
      <Section id="filtros" kicker="A.5" title="Filtros y armónicas">
        <Prose>
          <p>Combinando L y C se arman filtros:</p>
          <ul>
            <li><strong>Pasa-bajos (LPF)</strong>: deja pasar lo de abajo. Va entre el transmisor y la antena.</li>
            <li><strong>Pasa-altos (HPF)</strong>: deja pasar lo de arriba. Ejemplo: sacar la AM broadcast de la entrada de un receptor de HF.</li>
            <li><strong>Pasa-banda (BPF)</strong>: deja pasar un rango. La entrada típica de un receptor.</li>
          </ul>
          <p>Un amplificador de potencia nunca es perfecto: además de f genera <strong>armónicas</strong> en 2f, 3f, 4f… Si transmitís en 146 MHz, la segunda armónica cae en 292 MHz, que es de otro servicio. El LPF existe para eso. Cada orden extra (otra L o C) suma unos 6 dB por octava de pendiente.</p>
        </Prose>
        <Callout>
          <p>Los módulos baratos tipo SA818 son conocidos por sacar armónicas altas. En el proyecto OpenHios Radio vamos a calcular, armar y medir su filtro de salida.</p>
        </Callout>
        <Widget name="harmonics" />
      </Section>

      <Section id="semis" kicker="A.6" title="Semiconductores y fuentes">
        <Prose>
          <ul>
            <li><strong>Diodo rectificador</strong>: deja pasar la corriente en un solo sentido. Convierte alterna en continua pulsante.</li>
            <li><strong>Zener</strong>: en inversa mantiene una tensión fija. Referencia y regulación simple.</li>
            <li><strong>Varicap</strong>: en inversa su capacidad cambia con la tensión. Es el «capacitor variable sin partes móviles» que reemplazó al tándem: un DAC del ESP32 lo puede sintonizar.</li>
            <li><strong>Transistores BJT y MOSFET</strong>: amplifican o conmutan. En RF: etapas excitadoras y amplificadores de potencia.</li>
          </ul>
          <p><strong>Fuentes</strong>: una lineal (transformador + regulador) es pesada y calienta, pero es silenciosa. Una switching conmuta a decenas de kHz: liviana y eficiente, pero las baratas irradian ruido que se escucha en HF como un zumbido o «pajaritos» cada tantos kHz. Para la estación: lineal o switching de buena calidad con filtros y ferritas.</p>
        </Prose>
      </Section>
    </>
  );
}
