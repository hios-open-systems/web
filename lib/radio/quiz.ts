// Preguntas de práctica escritas para OpenHios a partir del temario Novicio.
// NO son el banco oficial de ENACOM: sirven para entender, no para memorizar.

export type QuizBlock = 'A' | 'B' | 'C' | 'D';

export interface QuizQuestion {
  id: string;
  block: QuizBlock;
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export const QUIZ: readonly QuizQuestion[] = [
  // Bloque A
  { id: 'a1', block: 'A', q: 'Una resistencia de 50 Ω tiene 10 V aplicados. ¿Qué corriente circula?', options: ['0,2 A', '5 A', '500 A', '2 A'], answer: 0, explain: 'I = V / R = 10 / 50 = 0,2 A.' },
  { id: 'a2', block: 'A', q: '¿Qué potencia disipa una carga de 50 Ω con 1 A?', options: ['50 W', '1 W', '2500 W', '0,02 W'], answer: 0, explain: 'P = I² · R = 1 · 50 = 50 W.' },
  { id: 'a3', block: 'A', q: '¿Cuál es la longitud de onda aproximada de 146 MHz?', options: ['2 m', '20 m', '20 cm', '146 m'], answer: 0, explain: 'λ = 300 / f(MHz) = 300 / 146 ≈ 2,05 m. Por eso se llama "banda de 2 metros".' },
  { id: 'a4', block: 'A', q: 'Una tensión senoidal de 10 V pico tiene un valor eficaz (RMS) de:', options: ['7,07 V', '10 V', '14,1 V', '20 V'], answer: 0, explain: 'Vrms = Vpico / √2 ≈ 0,707 · 10.' },
  { id: 'a5', block: 'A', q: 'Si se duplica la frecuencia, la reactancia de un capacitor:', options: ['Se reduce a la mitad', 'Se duplica', 'No cambia', 'Se cuadruplica'], answer: 0, explain: 'XC = 1 / (2πfC): es inversamente proporcional a f.' },
  { id: 'a6', block: 'A', q: 'Si se duplica la frecuencia, la reactancia de una bobina:', options: ['Se duplica', 'Se reduce a la mitad', 'No cambia', 'Se anula'], answer: 0, explain: 'XL = 2πfL: es directamente proporcional a f.' },
  { id: 'a7', block: 'A', q: 'En un circuito LC, la frecuencia de resonancia es aquella en la que:', options: ['XL = XC', 'R = 0', 'XL = 0', 'La corriente es cero siempre'], answer: 0, explain: 'En resonancia las reactancias se igualan y se cancelan: f0 = 1 / (2π√LC).' },
  { id: 'a8', block: 'A', q: 'Si se cuadruplica la capacidad de un circuito LC, la frecuencia de resonancia:', options: ['Se reduce a la mitad', 'Se reduce a un cuarto', 'Se duplica', 'No cambia'], answer: 0, explain: 'f0 ∝ 1/√C. √4 = 2, entonces f0 baja a la mitad.' },
  { id: 'a9', block: 'A', q: 'Un resonador de 7 MHz con Q = 100 tiene un ancho de banda de:', options: ['70 kHz', '700 kHz', '7 kHz', '100 kHz'], answer: 0, explain: 'BW = f0 / Q = 7 MHz / 100 = 70 kHz.' },
  { id: 'a10', block: 'A', q: '¿Para qué se pone un filtro pasa-bajos entre el transmisor y la antena?', options: ['Para atenuar las armónicas', 'Para subir la potencia', 'Para bajar la ROE', 'Para recibir mejor AM'], answer: 0, explain: 'El amplificador genera armónicas (2f, 3f…) que caerían en otras bandas. El LPF las mata.' },
  { id: 'a11', block: 'A', q: '¿Qué componente funciona como capacitor variable controlado por tensión?', options: ['Diodo varicap', 'Diodo Zener', 'Diodo rectificador', 'LED'], answer: 0, explain: 'El varicap en inversa cambia su capacidad con la tensión: sintonía sin partes móviles.' },
  { id: 'a12', block: 'A', q: '¿Por qué las fuentes switching baratas son un problema en la estación?', options: ['Generan ruido de RF', 'Son muy pesadas', 'No entregan corriente continua', 'Consumen más'], answer: 0, explain: 'Conmutan a decenas de kHz con flancos rápidos: irradian ruido que se escucha en HF.' },
  // Bloque B
  { id: 'b1', block: 'B', q: '¿Qué modo es el estándar para voz en HF entre radioaficionados?', options: ['SSB (banda lateral única)', 'FM de banda ancha', 'AM estéreo', 'PCM'], answer: 0, explain: 'SSB concentra la potencia en una banda lateral y ocupa ~2,7 kHz.' },
  { id: 'b2', block: 'B', q: 'Por convención, en 40 m y 80 m se usa:', options: ['LSB', 'USB', 'FM', 'DSB'], answer: 0, explain: 'Debajo de 10 MHz se usa LSB; arriba, USB (salvo 60 m, que usa USB).' },
  { id: 'b3', block: 'B', q: 'En FM, la información está en:', options: ['La variación de la frecuencia', 'La variación de la amplitud', 'La fase fija', 'El ruido'], answer: 0, explain: 'La amplitud queda constante: por eso FM rechaza bien el ruido de amplitud.' },
  { id: 'b4', block: 'B', q: 'CW es:', options: ['Telegrafía: portadora encendida y apagada', 'Voz en FM', 'Video', 'Datos por internet'], answer: 0, explain: 'Continuous Wave: la portadora se manipula con el código Morse. Es el modo más angosto.' },
  { id: 'b5', block: 'B', q: 'En un superheterodino, la frecuencia intermedia (FI) se obtiene:', options: ['Mezclando la señal con un oscilador local', 'Amplificando la antena', 'Con un filtro pasa-bajos', 'Rectificando la señal'], answer: 0, explain: 'FI = |fRF − fOL|. Todo el filtrado fino se hace a una frecuencia fija.' },
  { id: 'b6', block: 'B', q: 'Con FI = 10,7 MHz y OL = 156,7 MHz, ¿qué señales se reciben?', options: ['146 MHz y 167,4 MHz (imagen)', 'Sólo 156,7 MHz', '10,7 MHz', '146 MHz únicamente'], answer: 0, explain: '|146 − 156,7| = 10,7 y |167,4 − 156,7| = 10,7. La segunda es la frecuencia imagen, que el filtro de RF debe rechazar.' },
  { id: 'b7', block: 'B', q: 'Un SDR de muestreo directo:', options: ['Digitaliza la RF y demodula por software', 'Usa un capacitor tándem', 'Sólo recibe AM', 'No necesita antena'], answer: 0, explain: 'Un ADC rápido o un mezclador I/Q llevan la señal a números; filtros y demodulación son software.' },
  { id: 'b8', block: 'B', q: 'La carga fantasma (dummy load) sirve para:', options: ['Probar el transmisor sin irradiar', 'Mejorar la antena', 'Medir ruido atmosférico', 'Recibir satélites'], answer: 0, explain: 'Es una resistencia no inductiva de 50 Ω que disipa la potencia en calor.' },
  { id: 'b9', block: 'B', q: 'El roímetro mide:', options: ['La relación de onda estacionaria (ROE)', 'La resistencia de la bobina', 'La frecuencia', 'La tensión de red'], answer: 0, explain: 'Compara potencia directa y reflejada en la línea.' },
  { id: 'b10', block: 'B', q: 'La etapa que entrega la potencia final a la antena es:', options: ['El amplificador de potencia (PA)', 'El oscilador local', 'El detector', 'La FI'], answer: 0, explain: 'Oscilador → excitador (driver) → PA → filtro de salida → antena.' },
  // Bloque C
  { id: 'c1', block: 'C', q: 'La impedancia estándar de los equipos y coaxiles de radioaficionado es:', options: ['50 Ω', '75 Ω', '300 Ω', '600 Ω'], answer: 0, explain: '50 Ω es un compromiso entre mínima pérdida (~77 Ω) y máxima potencia (~30 Ω) en coaxil de aire.' },
  { id: 'c2', block: 'C', q: 'Una antena de 100 Ω conectada a una línea de 50 Ω produce una ROE de:', options: ['2:1', '1:1', '1,5:1', '4:1'], answer: 0, explain: 'Para cargas resistivas, ROE = mayor / menor = 100 / 50 = 2.' },
  { id: 'c3', block: 'C', q: 'Con ROE 2:1, ¿qué parte de la potencia se refleja?', options: ['≈ 11 %', '50 %', '2 %', '25 %'], answer: 0, explain: 'Γ = (2−1)/(2+1) = 1/3; potencia reflejada = Γ² ≈ 0,11.' },
  { id: 'c4', block: 'C', q: 'Un dipolo de media onda para 7,1 MHz mide aproximadamente:', options: ['20 m', '40 m', '10 m', '2 m'], answer: 0, explain: 'λ/2 · 0,95 ≈ 142,5 / 7,1 ≈ 20 m de punta a punta.' },
  { id: 'c5', block: 'C', q: 'Para la misma frecuencia, ¿qué coaxil pierde menos?', options: ['LMR-400', 'RG-58', 'RG-174', 'Todos igual'], answer: 0, explain: 'Más diámetro y mejor dieléctrico = menos pérdida. RG-58 en 2 m pierde unas 4 veces más que LMR-400.' },
  { id: 'c6', block: 'C', q: 'Un balun 1:1 se usa para:', options: ['Conectar coaxil (desbalanceado) a un dipolo (balanceado)', 'Duplicar la potencia', 'Filtrar armónicas', 'Medir ROE'], answer: 0, explain: 'Evita que la malla del coaxil irradie (corrientes de modo común).' },
  { id: 'c7', block: 'C', q: 'En VHF/UHF la propagación normal es:', options: ['Línea de vista', 'Rebote en la capa F2', 'Onda terrestre a 1000 km', 'Por la capa D'], answer: 0, explain: 'Estas frecuencias atraviesan la ionosfera. El alcance depende de la altura de las antenas.' },
  { id: 'c8', block: 'C', q: '¿Qué capa ionosférica absorbe las bandas bajas de HF durante el día?', options: ['D', 'F2', 'E esporádica', 'Ninguna'], answer: 0, explain: 'La capa D sólo existe con sol y absorbe sobre todo 160/80 m. De noche desaparece y esas bandas se abren.' },
  { id: 'c9', block: 'C', q: 'La capa que permite los contactos de DX a mayor distancia es:', options: ['F2', 'D', 'E', 'Troposfera'], answer: 0, explain: 'F2 es la más alta (~250–400 km): un salto puede cubrir ~4000 km.' },
  { id: 'c10', block: 'C', q: 'Si la frecuencia supera la MUF:', options: ['La señal atraviesa la ionosfera y no vuelve', 'Rebota más fuerte', 'Se convierte en onda terrestre', 'Se duplica el alcance'], answer: 0, explain: 'MUF = máxima frecuencia utilizable. Por encima, la ionosfera no alcanza a refractar la onda.' },
  { id: 'c11', block: 'C', q: 'Una antena Yagi con 6 dBd de ganancia comparada con un dipolo:', options: ['Concentra la energía en una dirección (~4× potencia)', 'Genera más potencia', 'Funciona en todas las direcciones igual', 'Baja la ROE'], answer: 0, explain: 'La ganancia es directividad: 6 dB ≈ 4 veces en la dirección principal, a costa de las otras.' },
  { id: 'c12', block: 'C', q: 'Dos antenas a 10 m de altura tienen un horizonte radioeléctrico de aproximadamente:', options: ['26 km', '5 km', '100 km', '1 km'], answer: 0, explain: 'd ≈ 4,12 · (√10 + √10) ≈ 26 km. Los edificios lo acortan mucho en la ciudad.' },
  // Bloque D (sólo lo que no depende del plan de bandas)
  { id: 'd1', block: 'D', q: 'En el alfabeto fonético ITU, la letra L es:', options: ['Lima', 'London', 'Luis', 'Love'], answer: 0, explain: 'Alfa, Bravo, Charlie… Lima. Los nombres propios locales no se usan.' },
  { id: 'd2', block: 'D', q: 'QTH significa:', options: ['Ubicación de la estación', 'Interferencia', 'Cambio de frecuencia', 'Fin de transmisión'], answer: 0, explain: 'QTH = "mi ubicación es…".' },
  { id: 'd3', block: 'D', q: 'QRM se refiere a:', options: ['Interferencia de otras estaciones', 'Ruido atmosférico', 'Baja potencia', 'Desvanecimiento'], answer: 0, explain: 'QRM es interferencia artificial; QRN es la natural (estática).' },
  { id: 'd4', block: 'D', q: 'Un reporte RST 59 significa:', options: ['Perfectamente legible, muy fuerte', 'Ilegible', 'Señal débil con ruido', 'Tono puro'], answer: 0, explain: 'R5 = perfectamente legible, S9 = muy fuerte. En fonía no se usa la T.' },
  { id: 'd5', block: 'D', q: 'Según el Reglamento ENACOM, ¿cada cuánto se identifica la estación?', options: ['Al inicio y cada 10 minutos', 'Sólo al final', 'Cada una hora', 'Nunca en VHF'], answer: 0, explain: 'Res. 3635/2017, art. 1.5.8.' },
  { id: 'd6', block: 'D', q: '¿Dónde se rinde el examen para la categoría Novicio?', options: ['En un Radio Club o Institución Autorizada', 'Online en el sitio de ENACOM', 'En el Correo', 'No hay examen'], answer: 0, explain: 'Res. 3635/2017, arts. 4.2 y 4.4.3.' },
  { id: 'd7', block: 'D', q: 'En una repetidora, el "offset" es:', options: ['La diferencia entre la frecuencia de transmisión y la de recepción', 'El volumen', 'El subtono', 'El horario de uso'], answer: 0, explain: 'La repetidora escucha en una frecuencia y retransmite en otra. En 2 m el offset típico es 600 kHz.' },
  { id: 'd8', block: 'D', q: 'Un subtono CTCSS sirve para:', options: ['Abrir la repetidora sólo con el tono correcto', 'Cifrar la voz', 'Subir la potencia', 'Medir ROE'], answer: 0, explain: 'Es un tono subaudible (67–254 Hz). No da privacidad: cualquiera escucha.' },
];
