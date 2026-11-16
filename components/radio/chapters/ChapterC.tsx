import { Section, Prose, Formula, Callout } from '../ui/Prose';
import { Widget } from '../widgets/Widget';
import { BankList } from '../BankList';

export function ChapterC() {
  return (
    <>
      <Section id="coaxil" kicker="C.1" title="Impedancia y cable coaxil">
        <Prose>
          <p>Una línea de transmisión tiene una <strong>impedancia característica</strong> Z₀ que depende de su geometría, no de su largo. Los equipos y coaxiles de radioaficionado son de <strong>50 Ω</strong>: un compromiso entre la menor pérdida (~77 Ω) y la mayor potencia soportada (~30 Ω). La TV usa 75 Ω.</p>
          <p>La pérdida sube con la frecuencia y con el largo, y baja con cables más gruesos. En HF un RG-58 alcanza; en VHF/UHF conviene RG-213 o LMR-400.</p>
        </Prose>
        <Widget name="coax" />
      </Section>

      <Section id="roe" kicker="C.2" title="ROE: ondas estacionarias">
        <Prose>
          <p>Si la antena no presenta 50 Ω, parte de la potencia rebota y vuelve. La onda que va y la que vuelve se suman y forman una <strong>onda estacionaria</strong>: puntos de tensión máxima y mínima fijos en el cable.</p>
          <p><Formula>Γ = (Z − Z₀) / (Z + Z₀)</Formula> &nbsp; <Formula>ROE = (1 + |Γ|) / (1 − |Γ|)</Formula></p>
          <p>ROE 1:1 es perfecto. Hasta 1,5:1 es excelente, 2:1 es aceptable (vuelve 11 %). Arriba de 3:1 muchos equipos bajan la potencia para protegerse.</p>
        </Prose>
        <Widget name="swr" />
      </Section>

      <Section id="adaptacion" kicker="C.3" title="Adaptación: baluns y acopladores">
        <Prose>
          <ul>
            <li><strong>Balun 1:1</strong>: une el coaxil (desbalanceado) con un dipolo (balanceado). Evita que la malla irradie y meta RF en la casa.</li>
            <li><strong>Balun / unun 4:1 y 9:1</strong>: además transforman impedancia. Se usan en antenas de hilo largo y end-fed.</li>
            <li><strong>Acoplador (ATU)</strong>: una red de L y C que hace que el equipo «vea» 50 Ω. No arregla la antena: sólo protege al transmisor. Los automáticos (tipo ATU-100) conmutan bancos de L y C con relés.</li>
          </ul>
        </Prose>
      </Section>

      <Section id="antenas" kicker="C.4" title="Antenas básicas">
        <Prose>
          <ul>
            <li><strong>Dipolo λ/2</strong>: dos ramas de λ/4 alimentadas al centro. ~73 Ω, irradia de costado al hilo.</li>
            <li><strong>Vertical λ/4</strong>: un irradiante + plano de tierra (radiales). Omnidireccional. La típica de VHF en el techo o el auto.</li>
            <li><strong>Yagi-Uda</strong>: un dipolo + reflector + directores. Concentra la energía en una dirección. La <strong>ganancia</strong> se mide en dBi (vs. una antena isotrópica ideal) o dBd (vs. un dipolo): <Formula>dBi = dBd + 2,15</Formula>. Relación frente-espalda: cuánto más irradia adelante que atrás.</li>
          </ul>
        </Prose>
        <Widget name="antenna" />
      </Section>

      <Section id="ionosfera" kicker="C.5" title="Propagación en HF">
        <Prose>
          <p>Tres formas de llegar: <strong>onda terrestre</strong> (sigue el suelo, bandas bajas), <strong>onda espacial</strong> (línea de vista, VHF/UHF) y <strong>onda ionosférica</strong> (rebota en la ionosfera, HF).</p>
          <ul>
            <li><strong>Capa D</strong> (60–90 km): sólo de día. Absorbe 160 y 80 m.</li>
            <li><strong>Capa E</strong> (90–130 km): de día; a veces aparece la E esporádica que abre 6 m y 10 m.</li>
            <li><strong>F1 y F2</strong>: de día están separadas; de noche se juntan en una sola F. La F2 da el DX.</li>
          </ul>
          <p>La <strong>MUF</strong> es la frecuencia más alta que vuelve a tierra. Depende del sol: el <strong>ciclo solar</strong> de ~11 años hace que 10–15 m estén abiertas al mundo en el máximo y muertas en el mínimo. Regla práctica: de día bandas altas, de noche bandas bajas.</p>
        </Prose>
        <Widget name="ionosphere" />
      </Section>

      <Section id="alcance" kicker="C.6" title="Alcance en VHF/UHF: ¿llego?">
        <Prose>
          <p>En VHF/UHF manda la <strong>altura</strong>. Horizonte radioeléctrico: <Formula>d (km) ≈ 4,12 · (√h₁ + √h₂)</Formula> con alturas en metros. Con las antenas a la altura de la mano, el suelo y los edificios se comen la señal mucho antes del horizonte.</p>
        </Prose>
        <Callout tone="info"><p>Para el enlace de ~5 km con un familiar: probá con dos handies a nivel de calle y después con una antena en el techo. La diferencia es enorme, y es más barata que más potencia.</p></Callout>
        <Widget name="link" />
      </Section>

      <Section id="banco" kicker="Examen" title="Preguntas del examen: bloque C">
        <BankList pool="C" />
      </Section>
    </>
  );
}
