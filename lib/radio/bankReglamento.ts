// Banco de Reglamentación y Ética Operativa (anexo de la Res. ENACOM 508/2018),
// en la copia publicada por el Cuyo Radio Club (LU1MA):
// http://www.lu1ma.org.ar/wp-content/uploads/2020/03/Banco-de-Preguntas2018.pdf
//
// Sólo incluimos preguntas que aplican a Novicio Y cuya respuesta pudimos
// verificar contra el Reglamento (Res. 3635/2017) o la Res. 1186/2024. Las
// preguntas están parafraseadas y conservan su número (I.41, PB.3, PBN.1…).
// `check: 'amsat'` = depende del plan de bandas (Anexo A) y por ahora sale del
// resumen de AMSAT Argentina, no del texto oficial.

export interface RuleQuestion {
  id: string;
  q: string;
  answer: string;
  wrong: string[];
  cite: string;
  check?: 'amsat';
  /** Pregunta cambiada por la Res. 1186/2024 (el banco 2018 está desactualizado). */
  updated?: boolean;
}

export const BANK_REGLAMENTO: readonly RuleQuestion[] = [
  { id: 'I.3', q: '¿Cuál es la Autoridad de Aplicación del Reglamento?', answer: 'ENACOM', wrong: ['Secretaría de Comunicaciones', 'CNC', 'Ministerio de Comunicaciones'], cite: 'Res. ENACOM 3635/2017' },
  { id: 'I.37', q: '¿Cuándo se puede conectar la estación a una línea telefónica?', answer: 'Sólo en emergencias', wrong: ['Por interés comunitario', 'En eventos de la actividad', 'Nunca'], cite: 'art. 1.5.4' },
  { id: 'I.38', q: '¿Por cuánto tiempo vale la licencia hoy?', answer: 'No vence', wrong: ['1 año', '5 años', '10 años'], cite: 'art. 1.5.5 (Res. 1186/2024)', updated: true },
  { id: 'I.41', q: '¿Cada cuánto hay que transmitir la señal distintiva?', answer: 'Al empezar y cada 10 minutos', wrong: ['Cada 5 minutos', 'Cada 30 minutos', 'Cuando uno quiera'], cite: 'art. 1.5.8' },
  { id: 'I.42', q: '¿En qué frecuencias y cuándo funcionan las redes de emergencia o desastre?', answer: 'En las frecuencias designadas, en los casos y plazos que fije la autoridad competente', wrong: ['En todas las bandas, cuando quiera la autoridad', 'En las frecuencias designadas, cuando el radioaficionado lo crea necesario', 'En cualquier frecuencia libre'], cite: 'art. 1.5.12' },
  { id: 'I.46', q: '¿Qué organización representa a los radioaficionados en los foros internacionales?', answer: 'IARU', wrong: ['ARRL', 'UIT', 'CITEL'], cite: 'Conocimiento general (IARU = International Amateur Radio Union)' },
  { id: 'III.13', q: '¿Las Instituciones Autorizadas pueden dictar cursos y tomar exámenes?', answer: 'Sí', wrong: ['No', 'Sólo cursos', 'Sólo exámenes'], cite: 'art. 1.4.17' },
  { id: 'III.15', q: '¿Las Instituciones Reconocidas pueden tomar exámenes?', answer: 'No: fomentan la actividad con Prácticas Operativas', wrong: ['Sí', 'Sólo de Novicio', 'Sólo con veedor de ENACOM'], cite: 'art. 1.4.18' },
  { id: 'IV.1', q: '¿Qué categorías existen hoy?', answer: 'Novicio, General, Superior y Especial', wrong: ['Inicial, Intermedia y Superior', 'Novicio, Intermedia y General', 'Inicial, General y Especial'], cite: 'art. 4.1' },
  { id: 'IV.2', q: '¿Por medio de quién se tramita la licencia ante ENACOM?', answer: 'De un Radio Club o una Institución Autorizada', wrong: ['Del radioaficionado, en forma directa', 'De una Institución Reconocida', 'Del Correo'], cite: 'art. 4.2' },
  { id: 'IV.3', q: '¿Edad mínima para Novicio?', answer: '9 años', wrong: ['12 años', '18 años', '16 años'], cite: 'art. 4.4.2' },
  { id: 'IV.5', q: '¿Potencia máxima de RF de un Novicio?', answer: '200 W', wrong: ['50 W', '100 W', '150 W'], cite: 'art. 4.11.1' },
  { id: 'IV.6', q: '¿Cuántos años ininterrumpidos como Novicio hacen falta para pasar a General?', answer: '3 años', wrong: ['1 año', '2 años', '5 años'], cite: 'art. 4.5.3' },
  { id: 'IV.7', q: '¿Hay que renovar la licencia cada cierto tiempo?', answer: 'No: no vence, pero cada 5 años se presenta el certificado de antecedentes penales', wrong: ['Sí, cada 5 años', 'Sí, cada 10 años', 'Sí, cada 2 años'], cite: 'arts. 1.5.5 y 4.3 (Res. 1186/2024)', updated: true },
  { id: 'VIII.1', q: '¿Qué indica el prefijo de la señal distintiva?', answer: 'El país', wrong: ['La provincia', 'La categoría', 'El radio club'], cite: 'art. 8.1' },
  { id: 'VIII.2', q: '¿Qué prefijos usa la Argentina?', answer: 'LU / LW', wrong: ['CX', 'PY', 'CE'], cite: 'art. 8.1 (serie internacional, Apéndice 42 UIT)' },
  { id: 'VIII.3', q: '¿Qué indica la primera letra del sufijo?', answer: 'La provincia (división política)', wrong: ['El país', 'La categoría', 'El año de la licencia'], cite: 'art. 8.1' },
  { id: 'VIII.4', q: 'Si sólo tenés estaciones móviles, ¿qué domicilio define el sufijo?', answer: 'El del DNI', wrong: ['El de la estación fija', 'El del radio club', 'El que uno elija'], cite: 'art. 8.2.2' },
  { id: 'VIII.5', q: 'Si tenés estación fija y móviles, ¿qué domicilio define el sufijo?', answer: 'El de la estación fija', wrong: ['El del DNI', 'El del radio club', 'El que uno elija'], cite: 'art. 8.2.1' },
  { id: 'VIII.6', q: '¿Quién puede tener sufijo de dos letras?', answer: 'Superior y Especial', wrong: ['General', 'Cualquier categoría', 'Sólo radio clubes'], cite: 'art. 8.3' },
  { id: 'IX.2', q: '¿Quién puede operar una estación?', answer: 'Su titular u otro radioaficionado que él autorice', wrong: ['Cualquier radioaficionado', 'Sólo el titular', 'Cualquier persona con el titular presente'], cite: 'art. 9.2' },
  { id: 'IX.10', q: '¿Qué categoría hace falta para diseñar, construir o lanzar una estación espacial?', answer: 'General o Superior', wrong: ['Especial', 'Novicio', 'Cualquiera'], cite: 'art. 9.14' },
  { id: 'X.1', q: '¿La repetidora tiene que estar autorizada?', answer: 'Sí, con autorización previa', wrong: ['No', 'Sólo en UHF', 'Sólo si es de un radio club'], cite: 'art. 10.1' },
  { id: 'XII.1', q: '¿Quiénes pueden dictar cursos y tomar exámenes?', answer: 'Radio Clubes e Instituciones Autorizadas', wrong: ['Instituciones Reconocidas', 'Cualquier radioaficionado General', 'Sólo ENACOM'], cite: 'arts. 3.1, 1.4.17 y 1.4.18' },
  { id: 'PB.2', q: '¿Qué es la clase de emisión A3E?', answer: 'Telefonía AM, doble banda lateral', wrong: ['Telefonía FM', 'Telefonía BLU con portadora suprimida', 'Teletipo FSK'], cite: 'Nomenclatura UIT de clases de emisión' },
  { id: 'PB.3', q: '¿Qué es la clase A1A?', answer: 'Telegrafía en código Morse', wrong: ['Telefonía FM', 'Teletipo FSK', 'Telefonía BLU'], cite: 'Nomenclatura UIT' },
  { id: 'PB.4', q: '¿Qué es la clase J3E?', answer: 'Telefonía BLU con portadora suprimida', wrong: ['Telegrafía Morse', 'Televisión FM', 'Televisión doble banda lateral'], cite: 'Nomenclatura UIT' },
  { id: 'PB.5', q: '¿Qué es la clase F3E?', answer: 'Telefonía en FM', wrong: ['Facsímil', 'Telegrafía Morse', 'Teletipo FSK'], cite: 'Nomenclatura UIT' },
  { id: 'PB.7', q: '¿Qué modo es J3E?', answer: 'SSB', wrong: ['RTTY', 'SSTV', 'ATV'], cite: 'Nomenclatura UIT' },
  { id: 'PB.8', q: '¿Qué modo es A1A?', answer: 'CW', wrong: ['SSB', 'RTTY', 'PACKET'], cite: 'Nomenclatura UIT' },
  { id: 'PB.9', q: '¿Qué modo es F3E?', answer: 'FM', wrong: ['ATV', 'FAX', 'AM'], cite: 'Nomenclatura UIT' },
  { id: 'PB.10', q: '¿Qué modo es F1B?', answer: 'RTTY', wrong: ['FAX', 'CW', 'PACKET'], cite: 'Nomenclatura UIT' },
  { id: 'PB.11', q: 'Una banda con atribución secundaria, ¿cuándo puede reclamar protección contra interferencias?', answer: 'Sólo frente al mismo servicio u otros servicios secundarios', wrong: ['Sólo frente a estaciones comerciales', 'Sólo frente a servicios oficiales', 'Siempre'], cite: 'Reglamento de Radiocomunicaciones UIT (atribución secundaria)' },
  { id: 'PB.12', q: '¿Dónde puede transmitir el Servicio de Radioaficionados por Satélite?', answer: 'Sólo en los segmentos autorizados para uso satelital', wrong: ['En todas las bandas de radioaficionado', 'En cualquier frecuencia de las bandas de satélite', 'Donde no haya interferencia'], cite: 'Anexo A (plan de bandas)' },
  { id: 'PBN.1', q: '¿En cuál de estas bandas puede operar un Novicio?', answer: '70 cm (también 60 m)', wrong: ['30 m', '12 m', '17 m (en fonía)'], cite: 'Anexo A', check: 'amsat' },
  { id: 'PBN.2', q: '¿Cuál de estas frecuencias puede usar un Novicio?', answer: '146 000 kHz (también 3550 kHz)', wrong: ['10 135 kHz', '14 235 kHz', '18 100 kHz'], cite: 'Anexo A', check: 'amsat' },
  { id: 'PBN.5', q: '¿Qué potencia puede usar un Novicio en 30 m?', answer: 'No puede emitir', wrong: ['500 W', '250 W', 'La de su categoría'], cite: 'Anexo A', check: 'amsat' },
  { id: 'PBN.6', q: '¿PIRE máxima de un Novicio en 2200 m?', answer: '1 W', wrong: ['25 W', 'La de su categoría', 'No puede emitir'], cite: 'Anexo A', check: 'amsat' },
  { id: 'PBN.7', q: '¿PIRE máxima de un Novicio en 630 m?', answer: '5 W', wrong: ['1 W', 'La de su categoría', 'No puede emitir'], cite: 'Anexo A', check: 'amsat' },
  { id: 'PBN.8', q: '¿PIRE máxima de un Novicio en 60 m?', answer: '25 W', wrong: ['100 W', 'La de su categoría', 'No puede emitir'], cite: 'Anexo A', check: 'amsat' },
];

export const BANK_REGLAMENTO_SOURCE = {
  name: 'Banco de Reglamentación y Ética Operativa (Res. ENACOM 508/2018) · copia LU1MA',
  url: 'http://www.lu1ma.org.ar/wp-content/uploads/2020/03/Banco-de-Preguntas2018.pdf',
  /** Preguntas del banco que aplican a Novicio (capítulos I–XIII, PB y PBN). */
  novicioTotal: 181,
};

/** Archivos oficiales de ENACOM (Res. 508/2018) que hay que bajar a mano. */
export const OFFICIAL_FILES = [
  { name: 'Banco de Preguntas (oficial)', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083439_9188.pdf' },
  { name: 'Programa Básico de Estudios', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083258_9793.pdf' },
  { name: 'Plan de Bandas: frecuencias y modos', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083108_1322.pdf' },
  { name: 'Res. ENACOM 508/2018 con anexos', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083514_7878.pdf' },
] as const;
