// Documentos oficiales de ENACOM que usa la guía (publicados junto a la Res. ENACOM 508/2018).

export const OFFICIAL_FILES = [
  { name: 'Banco de Preguntas y Respuestas sobre Reglamentación y Ética Operativa (Anexo de la Res. 508/2018)', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083439_9188.pdf' },
  { name: 'Programa Básico de Estudios para todas las categorías', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083258_9793.pdf' },
  { name: 'Plan de Bandas de Frecuencias (Anexo A del Reglamento)', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083108_1322.pdf' },
  { name: 'Resolución ENACOM 508/2018', url: 'https://www.enacom.gob.ar/multimedia/noticias/archivos/201811/archivo_20181105083514_7878.pdf' },
] as const;

export const OFFICIAL_BANK_SOURCE = { name: OFFICIAL_FILES[0].name, url: OFFICIAL_FILES[0].url } as const;
export const OFFICIAL_PLAN_SOURCE = { name: OFFICIAL_FILES[2].name, url: OFFICIAL_FILES[2].url } as const;
export const OFFICIAL_PROGRAM_SOURCE = { name: OFFICIAL_FILES[1].name, url: OFFICIAL_FILES[1].url } as const;
