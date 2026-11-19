/** Pasos para sacar la licencia de Novicio, con su artículo del reglamento. */
export function LicenseSteps({ className }: { className?: string }) {
  return (
    <ol className={className}>
      <li><strong>Elegí un Radio Club</strong> cerca tuyo: ahí se cursa, se hacen las prácticas y se rinde (Res. ENACOM 3635/2017, art. 4.2). La lista de instituciones está en el sitio de ENACOM, sección Radioaficionados.</li>
      <li><strong>Estudiá los bloques A a D</strong> y practicá Morse básico. La guía sigue el programa oficial; el club puede ampliarlo.</li>
      <li><strong>Hacé las Prácticas Operativas</strong> en la estación del club, con un instructor.</li>
      <li><strong>Rendí</strong> Técnica, Reglamentación y Ética Operativa, y Telegrafía (art. 4.4.3).</li>
      <li><strong>El club presenta el trámite</strong> ante ENACOM y te asignan tu señal distintiva.</li>
    </ol>
  );
}

export const SOURCES_TEXT = 'Reglamento General de Radioaficionados (Res. ENACOM 3635/2017, mod. Res. 1186/2024); Res. ENACOM 508/2018 con su Programa Básico de Estudios, Banco de Preguntas oficial y Plan de Bandas (Anexo A); banco técnico de Novicio del Cuyo Radio Club (LU1MA).';
