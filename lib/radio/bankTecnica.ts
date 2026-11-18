// Banco de preguntas técnicas para el ingreso a Novicio, tal como lo usa el
// Cuyo Radio Club (LU1MA): 150 preguntas de opción múltiple con su clave.
// Fuente: http://www.lu1ma.org.ar/wp-content/uploads/2024/04/PreguntasTecnicas.pdf
// Las preguntas están PARAFRASEADAS (no copiadas) y conservan el número del
// banco para que se puedan buscar en el original. `fix` marca las claves del
// documento que son técnicamente discutibles: mostramos la respuesta correcta y
// avisamos qué dice la clave.

export type BankTopic =
  | 'ohm' | 'alterna' | 'componentes' | 'resonancia' | 'semiconductores' | 'fuentes'
  | 'modulacion' | 'receptor' | 'transmisor' | 'instrumentos'
  | 'lineas' | 'roe' | 'antenas' | 'propagacion' | 'otros';

export interface BankQuestion {
  n: number;
  topic: BankTopic;
  q: string;
  answer: string;
  wrong: string[];
  /** Nota cuando la clave del documento no coincide con la teoría. */
  fix?: string;
}

/** Circuito de las preguntas 36, 44, 125–126, 129, 134–135 y 149. */
export const PARALLEL_CIRCUIT = 'Circuito del banco: fuente de 12 V con R1 = 50 Ω, R2 = 10 Ω, R3 = 120 Ω y R4 = 4,7 kΩ, todas en paralelo.';

type Row = [number, BankTopic, string, string, string, string, string, string?];

const ROWS: Row[] = [
  [1, 'componentes', '¿Qué componente bloquea la corriente continua entre dos puntos?', 'Capacitor', 'Resistor', 'Inductor', 'Termistor'],
  [2, 'lineas', '¿Qué coaxil es el menos recomendable en VHF/UHF por sus pérdidas?', 'RG-58', 'RG-8', 'RG-213', 'RG-11'],
  [3, 'componentes', '¿Qué valor tiene un resistor rojo-naranja-rojo?', '2,3 kΩ', '670 kΩ', '230 Ω', '23 kΩ'],
  [4, 'componentes', '¿Qué tolerancia indica la banda dorada de un resistor?', '5 %', '10 %', '20 %', '30 %'],
  [5, 'componentes', '¿En qué unidad se mide la inductancia de una bobina?', 'Henrio', 'Faradio', 'Joule', 'Coulomb'],
  [6, 'ohm', '¿Qué dice la ley de Ohm?', 'La corriente es directamente proporcional a la tensión e inversamente proporcional a la resistencia', 'La corriente es inversa al cuadrado de la tensión y directa a la resistencia', 'La corriente es directa a la resistencia e inversa a la tensión', 'La corriente es directa a la tensión y a la resistencia'],
  [7, 'ohm', '¿Unidad de intensidad de corriente?', 'Ampere', 'Volt', 'Watt', 'Henrio'],
  [8, 'ohm', '¿Unidad de tensión?', 'Volt', 'Ampere', 'Watt', 'Henrio'],
  [9, 'ohm', 'Tres resistencias de 10 Ω en serie con 30 V. ¿Qué corriente circula?', '1 A', '10 A', '100 A', '0,1 A'],
  [10, 'instrumentos', '¿Con qué se mide tensión y cómo se conecta?', 'Voltímetro, en paralelo', 'Voltímetro, en serie', 'Amperímetro, en serie', 'Amperímetro, en paralelo'],
  [11, 'instrumentos', '¿Con qué se mide corriente y cómo se conecta?', 'Amperímetro, en serie', 'Voltímetro, en serie', 'Amperímetro, en paralelo', 'Voltímetro, en paralelo'],
  [12, 'ohm', '¿Unidad de potencia eléctrica?', 'Watt', 'Ampere', 'Volt', 'Henrio'],
  [13, 'ohm', '¿Qué potencia disipa una resistencia de 400 Ω con 20 V?', '1 W', '10 W', '100 W', '20 W'],
  [14, 'componentes', 'Capacitores de 22, 33 y 5 µF en paralelo. ¿Capacidad total?', '60 µF', '3 µF', '45 µF', '70 µF'],
  [15, 'antenas', '¿Qué antena conviene para un equipo portátil de emergencia en HF?', 'Dipolo de media onda', 'Quad de 3 elementos', 'Yagi de 3 elementos', 'Helicoidal'],
  [16, 'antenas', '¿Ángulo ideal entre las ramas de un dipolo en V invertida?', '90°', '135°', '45°', '180°'],
  [17, 'alterna', '¿Diferencia fundamental entre corriente continua y alterna?', 'La frecuencia', 'No hay diferencia', 'La continua es trifásica', 'La continua tiene 50 Hz'],
  [18, 'componentes', '¿Qué elemento, por sí solo, eleva una tensión alterna?', 'Transformador', 'Resistencia', 'Diodo', 'Impedancia'],
  [19, 'alterna', '¿Frecuencia de una señal con período de 4 ms?', '250 Hz', '500 Hz', '350 Hz', '4 Hz'],
  [20, 'alterna', '¿Valor eficaz de una corriente con pico de 200 mA?', '≈ 141 mA', '130 mA', '158 mA', '282,8 mA'],
  [21, 'otros', '¿Qué fusible lleva un equipo de 220 V y 1 kW?', '6 A', '500 mA', '1 A', '3 A'],
  [22, 'alterna', 'En un capacitor, ¿cómo están tensión y corriente?', 'La corriente adelanta a la tensión', 'La tensión adelanta a la corriente', 'Están en fase', 'Desfasadas 360°'],
  [23, 'resonancia', '¿Cuándo hay resonancia en un circuito?', 'Cuando la reactancia capacitiva es igual a la inductiva', 'Cuando la reactancia capacitiva es igual a la corriente', 'Cuando la reactancia inductiva es igual a la tensión', 'Cuando la reactancia inductiva es igual a la corriente'],
  [24, 'componentes', '¿Cómo se llama el material que separa las placas de un capacitor?', 'Dieléctrico', 'Conductor', 'Cátodo', 'Ánodo'],
  [25, 'semiconductores', '¿Un diodo común conduce en ambos sentidos?', 'No', 'Sí', 'Sólo en fuentes', 'Sólo los Zener'],
  [26, 'fuentes', '¿Con qué componentes se arma un puente rectificador?', 'Diodos', 'Capacitores', 'FET', 'Bobinas'],
  [27, 'componentes', '¿Qué elementos son indispensables en un transformador?', 'Dos bobinas', 'Dos capacitores', 'Un capacitor y una bobina', 'Una bobina y un diodo'],
  [28, 'fuentes', '¿Qué tiene una fuente típica de 12 V CC para la estación?', 'Transformador, puente de diodos, capacitor y fusible', 'Transformador, capacitor, regulador y fusible (sin rectificador)', 'Puente, regulador, capacitor y fusible (sin transformador)', 'Transformador, resistencias, capacitor y fusible'],
  [29, 'fuentes', '¿Qué corriente entrega la fuente típica de un transceptor?', 'Continua', 'Pulsante', 'Alterna', 'Monofásica'],
  [30, 'semiconductores', '¿Una de las funciones más importantes del transistor?', 'Amplificar señales débiles', 'Rectificar la tensión de línea', 'Regular la frecuencia del oscilador', 'Atenuar señales débiles'],
  [31, 'semiconductores', '¿Cómo se llaman los terminales de un transistor bipolar?', 'Colector, base y emisor', 'Ánodo, emisor y grilla', 'Placa, pantalla y base', 'Colector, base y cátodo'],
  [32, 'modulacion', 'Packet a 1200 baudios (F2D): ¿qué tonos de audio usa?', '1200 y 2200 Hz', '600 y 1200 Hz', '1600 y 2400 Hz', '1000 y 1200 Hz'],
  [33, 'otros', '¿A qué puerto de la computadora se conecta un TNC?', 'Puerto serie', 'Conector de video', 'Conector del escáner', 'Conector del teclado'],
  [34, 'roe', 'Un dipolo de 80 m tiene la ROE más baja por debajo de lo deseado y sube hacia 3750 kHz. ¿Qué hacés?', 'Acortarlo', 'Alargarlo', 'Aumentar la impedancia del coaxil', 'Inclinarlo'],
  [35, 'otros', '¿Qué es la telemetría de un satélite?', 'La información sobre el estado del satélite', 'Medir la distancia al satélite', 'Medir su tamaño', 'Medir su peso'],
  [36, 'ohm', '¿Qué tensión hay sobre R4 en el circuito en paralelo?', '12 V', '0,0025 V', '47 V', '6 V'],
  [37, 'roe', '¿Qué significa tener una buena ROE?', 'Poca potencia reflejada y mucha incidente', 'Mucha reflejada y poca incidente', 'Mucha reflejada y mucha incidente', 'Poca reflejada y poca incidente'],
  [38, 'receptor', '¿Qué bloques tiene un receptor superheterodino de AM (A3E)?', 'Amp. de RF, mezclador, oscilador, amp. de FI, detector, amp. de audio y parlante', 'Lo mismo pero sin oscilador', 'Con detector de producto en lugar de oscilador', 'Lo mismo pero sin detector'],
  [39, 'receptor', '¿Qué es la selectividad de un receptor?', 'Rechazar estaciones potentes cercanas en frecuencia', 'Escuchar señales muy débiles', 'Escuchar señales muy fuertes', 'Bloquear señales débiles'],
  [40, 'receptor', '¿Qué es la sensibilidad de un receptor?', 'Poder escuchar señales muy débiles', 'Rechazar estaciones cercanas en frecuencia', 'Escuchar señales muy fuertes', 'Bloquear señales débiles'],
  [41, 'receptor', '¿Qué bloques tiene un receptor de FM (F3E)?', 'Amp. de RF, mezclador, oscilador, filtro, amp. de FI, limitador, discriminador, amp. de audio y parlante', 'Pasa-bajos sin oscilador, con detector', 'Detector de producto, sin limitador', 'Amp. de RF, mezclador, oscilador, FI, detector y audio (sin limitador ni discriminador)'],
  [42, 'receptor', '¿Para qué sirve el amplificador de FI?', 'Para dar ganancia y selectividad', 'Para aumentar la ganancia de la primera etapa de RF', 'Para usarlo como discriminador', 'Para aumentar la ganancia de la última etapa de audio'],
  [43, 'receptor', '¿Qué hace el mezclador de un superheterodino?', 'Pasa la señal a otra frecuencia con la misma información, para filtrarla y amplificarla', 'Mezcla la FI con la señal recibida', 'La convierte en una señal totalmente distinta', 'Ninguna es correcta'],
  [44, 'ohm', '¿Qué potencia disipa R1 (50 Ω) en el circuito en paralelo de 12 V?', '2,88 W', '1,44 W', '0,72 W', '0,36 W'],
  [45, 'transmisor', '¿Qué bloques tiene un transmisor de BLU (J3E)?', 'Oscilador, modulador balanceado, amp. de micrófono, filtro, mezclador y amp. lineal', 'Lo mismo sin modulador balanceado', 'Bloques de receptor con limitador', 'Bloques de receptor con detector'],
  [46, 'modulacion', '¿Ancho de banda aproximado de una emisión J3E (BLU)?', '≈ 3 kHz', '6 kHz', '16 kHz', '1,5 kHz'],
  [47, 'modulacion', '¿Ancho de banda de FM angosta (F3E) en 2 m?', '≈ 16 kHz', '6 kHz', '25 kHz', '3 kHz'],
  [48, 'modulacion', '¿Qué es una emisión F3E?', 'El micrófono hace variar la frecuencia de la portadora', 'La portadora varía su amplitud', 'La portadora no cambia y cambian los armónicos', 'Se transmiten tres tonos'],
  [49, 'modulacion', '¿Cómo funciona el RTTY?', 'Dos tonos de audio modulan la portadora', 'Tres tonos modulan en frecuencia', 'Tres tonos modulan en amplitud', 'El micrófono varía la frecuencia'],
  [50, 'modulacion', '¿Qué es una emisión A1A?', 'La portadora se emite al ritmo del manipulador (CW)', 'La portadora se modula con el micrófono', 'El manipulador corta el lineal', 'Tres tonos modulan en amplitud'],
  [51, 'modulacion', '¿Qué es una emisión J3E?', 'La portadora se modula con el audio del amplificador de micrófono (BLU)', 'Se modula con audio del amplificador de RF', 'Se modula con audio del OFV', 'El micrófono varía la frecuencia'],
  [52, 'modulacion', '¿Qué es una emisión A3E?', 'Portadora modulada en amplitud (AM)', 'Modulada en fase', 'Modulada por armónicos', 'El micrófono varía la frecuencia'],
  [53, 'instrumentos', '¿Con qué instrumento se ve la forma de onda?', 'Osciloscopio', 'Amperímetro', '«Formámetro»', 'Ondámetro'],
  [54, 'instrumentos', '¿Con qué se mide la potencia de un transmisor?', 'Vatímetro', 'Amperímetro', 'Potenciómetro', 'Medidor de ROE'],
  [55, 'alterna', '¿Fórmula de la frecuencia (P = período)?', 'F = 1 / P', 'F = 1 / V', 'F = 1 / I', 'F = V / I'],
  [56, 'roe', 'Una Yagi de 120 Ω en línea de 50 Ω. ¿ROE mínima posible?', '2,4 : 1', '1,2 : 1', '3 : 1', '2 : 1'],
  [57, 'instrumentos', '¿Con qué se mide la frecuencia?', 'Frecuencímetro', 'Amperímetro', 'Vatímetro', 'Potenciómetro'],
  [58, 'ohm', '¿Cómo se llama la inversa de la resistencia (1/R)?', 'Conductancia', 'Susceptancia', 'Admitancia', 'Reactancia'],
  [59, 'ohm', '¿Qué resistencia tiene un circuito con 150 V y 2,5 A?', 'Ninguna de las opciones: son 60 Ω', '50 Ω', '90 Ω', '375 Ω'],
  [60, 'ohm', '¿Corriente con 250 V sobre 5000 Ω?', '0,05 A', '0,9 A', '10 A', '0,5 A'],
  [61, 'ohm', '¿Resistencia total de 500 Ω en paralelo con 1200 Ω?', '353 Ω', '500 Ω', '700 Ω', '1700 Ω'],
  [62, 'ohm', '¿Caída de tensión con 150 mA en 20 kΩ?', '3000 V', '2500 V', '5000 V', '13 333 V'],
  [63, 'antenas', '¿Qué elemento adapta la impedancia entre dipolo y línea?', 'Balun', 'Transistor', 'Diodo', 'Transmatch'],
  [64, 'antenas', '¿Cómo irradia un dipolo de media onda?', 'Bidireccional', 'Unidireccional', 'Omnidireccional', 'Isotrópico'],
  [65, 'antenas', '¿Cantidad mínima de elementos de una Yagi?', '2', '1', '3', '4'],
  [66, 'antenas', '¿Longitud de onda de 1845 kHz?', '162,6 m', '104,46 m', '78 m', '24,57 m'],
  [67, 'antenas', '¿Longitud de onda de 3657 kHz?', '82,03 m', '154,46 m', '94,57 m', '75,01 m'],
  [68, 'antenas', '¿Largo de un dipolo de media onda para 28 950 kHz?', '4,9 m', '5,34 m', '6,23 m', '9,84 m'],
  [69, 'antenas', '¿Largo de UNA rama de un dipolo de media onda para 7043 kHz?', '10,11 m', '9,23 m', '12,56 m', '20,22 m'],
  [70, 'antenas', '¿Largo de una antena de 4 medias ondas para 14,2 MHz?', '40,14 m', '50,14 m', '39,87 m', '45,01 m'],
  [71, 'antenas', '¿Largo de una vertical de 1/4 de onda para 146 MHz?', '48,8 cm', '24,4 cm', '97,7 cm', '2 m'],
  [72, 'antenas', '¿Cómo irradia una antena vertical?', 'Omnidireccional', 'Unidireccional', 'Bidireccional', 'Isotrópica'],
  [73, 'antenas', '¿Cómo irradia una Yagi de 3 elementos?', 'Direccional', 'Omnidireccional', 'Isotrópica', 'Con polarización circular'],
  [74, 'antenas', '¿Ganancia de una Yagi de 3 elementos optimizada en VHF?', '6 a 8 dB', '3 a 5 dB', '8 a 10 dB', '9 a 11 dB'],
  [75, 'lineas', '¿Impedancia del RG-59/U?', '75 Ω', '50 Ω', '300 Ω', '600 Ω'],
  [76, 'lineas', '¿Impedancia del RG-58/U?', '50 Ω', '75 Ω', '300 Ω', '600 Ω'],
  [77, 'lineas', '¿Impedancia de la cinta bifilar de TV?', '300 Ω', '50 Ω', '75 Ω', '600 Ω'],
  [78, 'lineas', '¿Impedancia del RG-8/U y del RG-213/U?', '≈ 50 Ω', '75 Ω', '300 Ω', '600 Ω'],
  [79, 'lineas', 'Transmisor de 146 MHz con 100 m de RG-58 y vatímetros en las dos puntas. ¿Qué medís?', 'Llega menos potencia a la antena que la que sale del equipo', 'La misma potencia', 'Más potencia en la antena', 'Potencias inversamente proporcionales'],
  [80, 'antenas', '¿Mejor ángulo para una V invertida?', '90°', '45°', '30°', '180°'],
  [81, 'antenas', '¿Para qué sirve el transmatch (acoplador)?', 'Para adaptar impedancias entre el transmisor y la línea', 'Para amplificar la potencia', 'Para adaptar entre la línea y la antena', 'Para enfasar dos antenas'],
  [82, 'otros', '¿Qué es la ITV?', 'Interferencia a televisores', 'Interferencia de chispas del auto', 'Interferencia a teléfonos', 'Interferencia total en VHF'],
  [83, 'antenas', '¿Qué antena móvil tiene más ganancia?', '5/8 de onda', '1/4 de onda', 'Helicoidal «cola de chancho» (0 dB)', 'Una de 1,5 dBi'],
  [84, 'transmisor', '¿Impedancia de salida habitual de un transceptor de radioaficionado?', '50 Ω', '75 Ω', '300 Ω', '35 Ω'],
  [85, 'lineas', '¿Qué coaxil conviene en 2 m por sus bajas pérdidas?', 'RG-213/U', 'RG-58/U', 'RG-59/U', 'RG-8'],
  [86, 'antenas', '¿Impedancia en el centro de un dipolo en V invertida a 90°?', '≈ 52 Ω', '75 Ω', '35 Ω', '125 Ω'],
  [87, 'otros', '¿Cuánto es 21 000 kHz en MHz?', '21 MHz', '0,21 MHz', '210 MHz', '2,1 MHz'],
  [88, 'componentes', '¿Cómo se llama un resistor variable?', 'Potenciómetro', 'Capacitor', 'Termistor', 'Variac'],
  [89, 'antenas', '¿Cómo se llaman los elementos de una Yagi de 3 elementos?', 'Director, excitado y reflector', 'Director, balun y excitado', 'Director, excitado y pasivo', 'Director, activo y pasivo'],
  [90, 'antenas', '¿Fórmula práctica de una vertical de 1/4 de onda?', 'L (m) = 72 / f (MHz)', 'L = 142,5 / f (MHz)', 'L = 142,5 / velocidad de la luz', 'L = f (MHz) / 72'],
  [91, 'propagacion', '¿Qué factor manda en la propagación ionosférica en HF?', 'El ciclo de manchas solares', 'El clima en el trayecto', 'Ninguno', 'La posición de los planetas'],
  [92, 'antenas', '¿Qué es la polarización de una onda?', 'La orientación (vertical u horizontal) de su campo eléctrico', 'Su contenido de iones', 'Que llega a los polos', 'Su polaridad positiva o negativa'],
  [93, 'propagacion', '¿De qué dependen la densidad y la altura de las capas ionosféricas?', 'Del ciclo solar, la época del año, la hora y la latitud', 'De la luna y el clima', 'Son permanentes', 'De la posición de los planetas'],
  [94, 'propagacion', '¿Cuándo sirve 80 m para comunicar con la Antártida?', 'En invierno, a medianoche', 'En cualquier época al mediodía', 'Las dos anteriores', 'Nunca'],
  [95, 'propagacion', '¿Banda más segura para 300 km al mediodía?', '40 m', '160 m', '80 m', '20 m'],
  [96, 'propagacion', '¿Cómo se propagan normalmente las señales de VHF?', 'En línea recta (línea de vista)', 'Se curvan en la ionosfera', 'En círculos', 'En ángulos rectos'],
  [97, 'otros', '¿Qué frecuencia tiene una armónica respecto de la fundamental?', 'Un múltiplo exacto', 'Apenas más alta', 'Apenas más baja', 'Ninguna de las anteriores'],
  [98, 'antenas', 'Dipolo horizontal con las puntas al Este y al Oeste. ¿Hacia dónde irradia?', 'Hacia el Norte y el Sur', 'Hacia el Este y el Oeste', 'De arriba hacia abajo', 'En todas direcciones'],
  [99, 'antenas', '¿Qué elemento irradia la energía?', 'La antena', 'La línea de transmisión', 'El transmisor', 'El amplificador de RF'],
  [100, 'transmisor', '¿Qué es un transceptor?', 'Un equipo que es transmisor y receptor a la vez', 'Un transmisor', 'Un receptor', 'Un receptor bibanda'],
  [101, 'transmisor', '¿Qué es el PTT?', 'El pulsador que se aprieta para transmitir', 'La etapa de transmisión', 'Un interruptor para recibir', 'La fuente'],
  [102, 'antenas', '¿Cuándo se puede transmitir sin antena (en vacío)?', 'Nunca', 'En comunicados cortos', 'Con transmisor clase C', 'En VHF o UHF'],
  [103, 'receptor', '¿Qué etapa va justo después de la antena en un receptor?', 'Amplificador de RF', 'Mezclador', 'Amplificador de FI', 'Amplificador de audio'],
  [104, 'componentes', 'En un transformador reductor, ¿cómo son las vueltas del primario?', 'Más que las del secundario', 'Menos que las del secundario', 'Iguales', 'La mitad'],
  [105, 'receptor', '¿Qué significa OFV?', 'Oscilador de frecuencia variable', 'Oscilador de fuente de voltaje', 'Oscilador fotovoltaico', 'Oscilador de fase virtual'],
  [106, 'receptor', '¿Qué significa CAF?', 'Control automático de frecuencia', 'Corriente de audiofrecuencia', 'Cristal de alta frecuencia', 'Corriente audio frecuente'],
  [107, 'transmisor', '¿Qué significa ALC?', 'Control automático de nivel', 'Control anual de nivel', 'Control manual de audio', 'Amplificador lineal controlado'],
  [108, 'otros', '¿Cómo se relacionan frecuencia y longitud de onda?', 'Son inversamente proporcionales', 'Son directamente proporcionales', 'La frecuencia es proporcional al cuadrado de λ', 'La frecuencia es la mitad de λ'],
  [109, 'antenas', '¿Polarización usual de las repetidoras de 2 m?', 'Vertical', 'Circular', 'Horizontal', 'Oblicua a 45°'],
  [110, 'antenas', '¿Polarización usual para BLU en VHF/UHF?', 'Horizontal', 'Circular', 'Vertical', 'Oblicua a 45°'],
  [111, 'roe', '¿Qué significa ROE?', 'Relación de Ondas Estacionarias', 'Relación de polarización oblicua espacial', 'Red de observadores espaciales', 'Relación de ondas especiales'],
  [112, 'instrumentos', '¿Con qué se mide la ROE?', 'Medidor de ondas estacionarias (roímetro)', 'Frecuencímetro', 'Amperímetro', 'Osciloscopio'],
  [113, 'roe', 'Potencia directa 10 W y reflejada 1 W. ¿ROE aproximada?', '1,92 : 1', '1 : 1,22', '3 : 1', '3,15 : 1'],
  [114, 'receptor', '¿Qué etapa va antes del amplificador de FI?', 'Mezclador', 'Detector', 'Amplificador de RF', 'Amplificador de audio', 'La clave del banco LU1MA marca «detector». En un superheterodino el mezclador alimenta a la FI: aprendé la teoría y consultá en el club qué respuesta toman.'],
  [115, 'receptor', '¿Qué etapa va justo después del detector?', 'Amplificador de audio', 'Amplificador de FI', 'Amplificador de RF', 'Mezclador', 'La clave del banco LU1MA marca «amplificador de FI». Después del detector viene el audio: consultá en el club qué respuesta toman.'],
  [116, 'receptor', '¿Qué etapa va justo antes del detector?', 'Amplificador de FI', 'Amplificador de RF', 'Amplificador de audio', 'Ninguna de las nombradas'],
  [117, 'otros', '¿Velocidad de las ondas electromagnéticas en el vacío?', '300 000 km/s', '3 000 000 km/s', '300 / f (MHz)', '142,5 / f (MHz)'],
  [118, 'lineas', '¿Cómo son los coaxiles como líneas de transmisión?', 'Desbalanceadas', 'Balanceadas', 'De muy alta impedancia', 'Para conectar en el punto de máxima tensión'],
  [119, 'lineas', '¿Cómo son las líneas abiertas (escalerita)?', 'Balanceadas', 'Desbalanceadas', 'De muy baja impedancia', 'Para conectar en el punto de máxima corriente'],
  [120, 'propagacion', '¿De qué están formadas las ondas de radio?', 'De campos eléctricos y magnéticos', 'Sólo de campo eléctrico', 'Sólo de campo magnético', 'De campos electrostáticos'],
  [121, 'receptor', 'Una señal de VHF muy débil, justo en el umbral del squelch, marca:', 'S-1', 'Busy', 'S-9', 'S-5'],
  [122, 'modulacion', '¿Qué clase de emisión usan los handies bibanda?', 'F3E', 'A3E', 'J3E', 'J2D'],
  [123, 'receptor', 'Una estación de 80 m con muy buena señal marca:', 'S-9 + 20 dB', 'S-3 + 9 dB', 'S-20 + 9 dB', 'S-3'],
  [124, 'componentes', 'En el símbolo de una batería, ¿qué indica la raya corta?', 'El negativo', 'El positivo', 'El neutro', 'La fase'],
  [125, 'ohm', '¿Corriente por R2 (10 Ω) en el circuito en paralelo de 12 V?', '1200 mA', '120 mA', '12 mA', '1,2 mA'],
  [126, 'ohm', '¿Corriente por R1 (50 Ω) en el circuito en paralelo de 12 V?', '240 mA', '10 mA', '1000 mA', '24 mA'],
  [127, 'antenas', '¿Qué montaje de un dipolo de 80 m irradia más hacia un lado?', 'Inclinado (sloper)', 'V invertida', 'Horizontal', 'Vertical'],
  [128, 'antenas', '¿Cuál de estas antenas tiene más ganancia?', 'Colineal de 11 dBi', 'Direccional de 3 elementos', 'Dipolo de media onda', 'Vertical de 1/4 con planos de tierra'],
  [129, 'ohm', '¿Corriente por R4 (4,7 kΩ) en el circuito en paralelo de 12 V?', '2,55 mA', '25,53 mA', '255,31 mA', '2,55 A'],
  [130, 'otros', '¿Qué es un tono DTMF?', 'Tonos audibles multifrecuencia del teclado de los handies', 'Una señal de telemando', 'El tono de fin de la repetidora', 'Telemetría satelital'],
  [131, 'lineas', 'Comparadas con coaxiles de costo similar, las líneas abiertas tienen:', 'Menos pérdida', 'La misma pérdida', 'Más pérdida', 'El doble de pérdida'],
  [132, 'antenas', 'Dipolo de media onda: L (m) = K / f (MHz). ¿Cuánto vale K?', '142,5', '72', '132,5', '300'],
  [133, 'otros', '¿Qué es un tono CTCSS?', 'Un tono subaudible que acompaña a la portadora y habilita al receptor', 'Una señal de telemando', 'El tono de fin de la repetidora', 'Telemetría satelital'],
  [134, 'ohm', '¿Corriente por R3 (120 Ω) en el circuito en paralelo de 12 V?', '100 mA', '1 mA', '10 mA', '1 A'],
  [135, 'ohm', '¿Corriente total aproximada del circuito en paralelo de 12 V?', '1,54 A', '154 mA', '15,4 mA', '1,54 mA'],
  [136, 'transmisor', '¿Qué es un amplificador lineal?', 'La etapa que amplifica la RF que sale del transmisor', 'Una etapa que amplifica la fuente', 'Una etapa hecha sólo con componentes lineales', 'Un multiplicador de la tensión de red'],
  [137, 'semiconductores', 'En el símbolo de un transistor PNP, ¿qué indica la flecha?', 'El emisor, apuntando hacia adentro', 'El colector, hacia adentro', 'La base, hacia adentro', 'El colector, hacia afuera'],
  [138, 'antenas', '¿Longitud de onda de 50,050 MHz?', '5,99 m', '6,85 m', '6,10 m', '7,98 m'],
  [139, 'antenas', '¿Longitud de onda de 430,130 MHz?', '0,697 m', '0,662 m', '0,595 m', '0,98 m'],
  [140, 'antenas', '¿Ángulo ideal entre las ramas de un dipolo horizontal de 80 m?', '180°', '45°', '90°', '135°'],
  [141, 'ohm', 'Dos resistencias iguales en paralelo, ¿resistencia total?', 'La mitad de una de ellas', 'La suma de las dos', 'Tres veces una', 'Un cuarto del producto'],
  [142, 'ohm', 'Dos resistencias iguales en serie, ¿resistencia total?', 'La suma de las dos', 'La mitad de una', 'Tres veces una', 'Un cuarto del producto'],
  [143, 'otros', 'Una señal de 725 Hz es de:', 'Audiofrecuencia', 'Radiofrecuencia', 'Alta frecuencia', 'VHF'],
  [144, 'antenas', '¿Impedancia en el centro de un dipolo plegado?', '≈ 300 Ω', '50 Ω', '75 Ω', '150 Ω'],
  [145, 'otros', 'El dial marca 7125 kHz. ¿Cuánto es en MHz?', '7,125 MHz', '71,25 MHz', '0,007125 MHz', '712,5 MHz'],
  [146, 'propagacion', '¿Cada cuánto se repite el máximo del ciclo solar?', '≈ 11 años', '2 años', '15 años', '5 años'],
  [147, 'componentes', '¿Código de colores de 290 Ω?', 'Rojo, blanco, marrón', 'Naranja, blanco, negro', 'Rojo, gris, marrón', 'Rojo, gris, negro'],
  [148, 'componentes', 'En una válvula, ¿qué elemento es el ánodo?', 'La placa', 'El filamento', 'La pantalla', 'El drenaje'],
  [149, 'ohm', '¿Resistencia total aproximada del circuito en paralelo de cuatro resistencias?', '7,77 Ω', '7,77 kΩ', '77,7 Ω', '777 Ω'],
  [150, 'componentes', '¿Código de colores de 87 Ω?', 'Gris, violeta, negro', 'Gris, azul, negro', 'Blanco, azul, negro', 'Blanco, verde, marrón'],
];

const CIRCUIT = new Set([36, 44, 125, 126, 129, 134, 135, 149]);

export const BANK_TECNICA: readonly BankQuestion[] = ROWS.map(([n, topic, q, answer, w1, w2, w3, fix]) => ({
  n, topic, answer, wrong: [w1, w2, w3], fix,
  q: CIRCUIT.has(n) ? `${q} (${PARALLEL_CIRCUIT})` : q,
}));

export const BANK_TECNICA_SOURCE = {
  name: 'Banco de preguntas técnicas para Novicio · Cuyo Radio Club (LU1MA)',
  url: 'http://www.lu1ma.org.ar/wp-content/uploads/2024/04/PreguntasTecnicas.pdf',
};
