import landing from './landing.module.css';

const STEPS = [
  {
    name: 'Novicio', state: 'Disponible', active: true,
    req: 'Desde 9 años. Examen de Técnica, Reglamentación y Ética, y conocimientos generales de Morse (art. 4.4).',
    gives: 'Hasta 200 W (art. 4.11.1). Bandas: según plan de bandas (a verificar).',
  },
  {
    name: 'General', state: 'Próximamente',
    req: '3 años como Novicio con actividad. Examen + recibir Morse a 5 ppm (art. 4.5).',
    gives: 'Hasta 1000 W (art. 4.11.2) y más bandas.',
  },
  {
    name: 'Superior', state: 'Próximamente',
    req: '3 años como General. Examen + Morse a 10 ppm, recepción y transmisión (art. 4.6).',
    gives: 'Hasta 1500 W (art. 4.11.3), sufijo de 2 letras (art. 8.3).',
  },
  {
    name: 'Especial', state: 'Por trayectoria',
    req: 'Superior con 20 años consecutivos de actividad (art. 4.7).',
    gives: 'Reconocimiento a la trayectoria.',
  },
];

/** Escalera de categorías ENACOM, con requisitos citados del Reglamento. */
export function LicenseLadder() {
  return (
    <ol className={landing.ladder}>
      {STEPS.map((s, i) => (
        <li key={s.name} className={landing.rung} data-active={s.active ? 'true' : undefined}>
          <span className={landing.rungIndex}>{i + 1}</span>
          <div>
            <strong>{s.name}</strong> <em>{s.state}</em>
            <p><span>Requisito:</span> {s.req}</p>
            <p><span>Habilita:</span> {s.gives}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
