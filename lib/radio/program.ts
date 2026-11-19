// Programa Básico de Estudios de ENACOM (Anexo IF-2018-26956339, Res. 508/2018) y dónde lo
// cubre la guía. El programa es el mismo para todas las categorías; cada club puede ampliarlo.

export interface ProgramItem { code: string; title: string; where: ReadonlyArray<readonly [string, string]> }
export interface ProgramGroup { code: string; title: string; items: ProgramItem[] }

const A = 'a-electricidad', B = 'b-modulacion-equipos', C = 'c-antenas-propagacion', D = 'd-reglamento';

export const PROGRAM: readonly ProgramGroup[] = [
  { code: '1', title: 'Reglamentación de las radiocomunicaciones', items: [
    { code: '1.a', title: 'Internacional: UIT, CMR, IARU (plan Región 2), CITEL, CEPT', where: [[`${D}#organismos`, 'D.1']] },
    { code: '1.b', title: 'Nacional: ENACOM, CABFRA, Reglamento General (categorías, radioescuchas, permisos, señales, estaciones y radiobalizas, infracciones, plan de bandas)', where: [[`${D}#organismos`, 'D.1'], [`${D}#licencia`, 'D.2'], [`${D}#senales`, 'D.3'], [`${D}#estaciones`, 'D.4'], [`${D}#bandas`, 'D.5'], [`${D}#infracciones`, 'D.8']] },
  ] },
  { code: '2', title: 'Ética y procedimientos operativos', items: [
    { code: '2.i', title: 'Manual IARU: código de conducta, lenguaje, operación', where: [[`${D}#etica`, 'D.6'], [`${D}#lenguaje`, 'D.7']] },
  ] },
  { code: '3', title: 'Aspectos técnicos', items: [
    { code: '3.a.i', title: 'Componentes: resistencias, capacitores, inductores, transformadores, diodos, transistores, disipadores', where: [[`${A}#reactancia`, 'A.3'], [`${A}#semis`, 'A.6']] },
    { code: '3.a.ii', title: 'Teoría de circuitos: Ohm, Kirchhoff, serie y paralelo, adaptación de impedancias', where: [[`${A}#ohm`, 'A.1'], [`${C}#adaptacion`, 'C.4']] },
    { code: '3.a.iii', title: 'Circuitos: filtros, fuentes, amplificadores y atenuadores, osciladores, PLL', where: [[`${A}#filtros`, 'A.5'], [`${A}#semis`, 'A.6'], [`${A}#activos`, 'A.7']] },
    { code: '3.a.iv', title: 'Campos electromagnéticos, ondas, ROE', where: [[`${C}#ondas`, 'C.1'], [`${C}#roe`, 'C.3']] },
    { code: '3.a.v', title: 'Espectro: frecuencia, unidades, armónicas, regiones, bandas', where: [[`${A}#alterna`, 'A.2'], [`${A}#filtros`, 'A.5'], [`${D}#bandas`, 'D.5']] },
    { code: '3.a.vi', title: 'Señales: senoidales, moduladas (CW, AM, FM, SSB), digitales (FSK, PSK, QAM), DSP, ruido', where: [[`${A}#alterna`, 'A.2'], [`${B}#modulacion`, 'B.1'], [`${B}#digitales`, 'B.2']] },
    { code: '3.a.vii', title: 'Transmisores y receptores: bloques, mezcladores, sensibilidad, selectividad, ruido, intermodulación', where: [[`${B}#receptor`, 'B.3'], [`${B}#transmisor`, 'B.4']] },
    { code: '3.a.viii', title: 'Antenas: ganancia, directividad, diagrama, polarización, PIRE, tipos', where: [[`${C}#antenas`, 'C.5']] },
    { code: '3.a.ix', title: 'Líneas de transmisión: coaxil, guía de onda, balun, conectores, pérdidas', where: [[`${C}#coaxil`, 'C.2'], [`${C}#adaptacion`, 'C.4']] },
    { code: '3.a.x', title: 'Propagación: espacio libre, superficie, troposférica, ionosférica, ciclo solar, cálculo de enlace', where: [[`${C}#ionosfera`, 'C.6'], [`${C}#alcance`, 'C.7']] },
    { code: '3.b', title: 'Modos de operación: fonía, CW, digimodos (packet, RTTY, APRS, SSTV, ATV, DV)', where: [[`${B}#modulacion`, 'B.1'], [`${B}#digitales`, 'B.2'], ['morse#por-que', 'CW']] },
    { code: '3.c', title: 'Mediciones: instrumentos; tensión, corriente, potencia, ROE, intensidad de campo, espurias', where: [[`${B}#instrumentos`, 'B.5']] },
    { code: '3.d', title: 'Seguridad: tierra, pararrayos, cuerpo humano, alto voltaje', where: [[`${C}#seguridad`, 'C.8']] },
    { code: '3.e', title: 'Compatibilidad electromagnética e interferencias', where: [[`${C}#interferencias`, 'C.9']] },
    { code: '3.f', title: 'Alfabeto fonético, código Q, señales de emergencia', where: [[`${D}#lenguaje`, 'D.7']] },
  ] },
  { code: '4', title: 'Prácticas operativas', items: [
    { code: '4', title: 'Contactos, operación en bandas, estaciones, repetidoras, radiobalizas, emergencias', where: [] },
  ] },
];
