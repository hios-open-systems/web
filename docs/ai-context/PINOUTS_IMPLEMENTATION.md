# Pinouts e instrumentos compartidos

## Catálogo

La página `app/[locale]/pinouts/page.tsx` muestra 15 módulos mediante componentes React y SVG locales. `PinoutsContent` reúne el selector móvil, la búsqueda, la navegación por hash y `BreakoutViewer`. Los diagramas se pueden ampliar con `DiagramFrame`.

`config/pinouts/modules/` conserva una única definición de cada módulo: identificador, pines, roles eléctricos, posición física, conexiones con proyectos y capacidades de simulación. Las MCU usan `BoardPinout` con el orden real de los headers. No ordenar los GPIO por número ni inferir la posición de las patillas a partir de un esquema funcional.

Los textos visibles del catálogo viven en `messages/{en,es,de,it}.json`, bajo `Pinouts.Modules.<id>`. `localizeBreakout` aplica el contrato `BreakoutCopy` antes de buscar y renderizar. Incluye nombre, descripción, características, conexiones, advertencias y tablas. Las leyendas están en `Pinouts.Functions`.

- `pins[].name` es la identidad estable del pin; debe coincidir con el catálogo físico.
- `pins[].label` permite traducir una descripción como “demás IOxx” sin cambiar su identidad.
- Las traducciones no cambian roles, geometría, perfiles de laboratorio ni gravedad de advertencias.
- Las notas y filas de tablas siguen el orden de la definición compartida. Actualizar los cuatro idiomas al agregar contenido.
- El contenido de referencia en español de los archivos de configuración no reemplaza la cobertura de traducciones: las pruebas exigen todas las entradas.

Las guías de montaje de proyectos (`config/pinouts/{pad,btdac,speaker}.ts` y `components/wiring-guide/`) tienen su propio modelo. No confundir un pinout genérico de módulo con la asignación de GPIO de un proyecto.

## Traducciones de guías de montaje

`localizeGuide` aplica `WiringGuideContent.<proyecto>` al modelo compartido. `mapGuideText` enumera únicamente campos de texto: no permite traducir GPIO, identificadores, roles eléctricos, rieles, topología ni orden del checklist. Las notas de módulos, filas, diagramas ASCII, keymap y checklist están completas en ES/EN/DE/IT. `WiringGuide.ui` contiene etiquetas, controles y descripciones accesibles de los SVG.

Las claves de módulos usan su ID y las de pines su GPIO. Secciones, filas y checklist conservan índices: al agregar o reordenar contenido hay que actualizar los cuatro idiomas y revisar la persistencia del checklist. Las pruebas comparan la copia ES resuelta con la configuración y exigen el mismo conjunto de claves en todos los idiomas; no hay fallback silencioso a español.

Los tokens `{sdResistance}`, `{sdVoltage}`, `{sdMin}` y `{sdMax}` se resuelven desde `MAX_SD_EXAMPLE_VALUES`, también en los diagramas ASCII. No copiar valores independientes a las traducciones. Los nombres técnicos de I²S se conservan para identificar BCLK/LRC/DOUT.

La matriz del PAD tiene 5 pulsadores por fila y 2 por columna; las leyendas usan las dimensiones del modelo. El cátodo del diodo apunta hacia la fila tanto en SVG como en ASCII (`|>|`). La explicación no depende de nombres de colores. El presupuesto orientativo del PAD usa 8 NeoPixel (~0,5 A), no los 12 LEDs de una revisión anterior: ~2,6 A con las hipótesis indicadas, buck ≥3 A.

Speaker sigue siendo referencia del firmware, no un circuito de batería validado: su divisor 100k/100k entrega 4,2 V desde 8,4 V. La guía ahora lo marca como **no conectar a GPIO34** hasta redimensionar el divisor y actualizar escala/calibración. También exige revisar pull-ups de 5 V del PCF8574 antes de conectar I²C al ESP32. Referencia de niveles eléctricos: [datasheet oficial ESP32, características DC](https://documentation.espressif.com/esp32_datasheet_en.html). No se modificó el firmware ni se afirmó haber validado hardware real.

`npm run test:wiring-i18n` verifica cobertura, placeholders, identidad eléctrica y regresiones de diagramas. `tests/wiring-guide-translations.spec.ts` y `tests/mobile-wiring-guides.spec.ts` recorren las pestañas de los tres proyectos en los cuatro idiomas, incluidos el menú de pestañas desbordadas, búsqueda y conservación del checklist entre idiomas.

## Reutilización de I²S

`lib/instruments/i2s.ts` es la fuente común del cálculo y las muestras:

- `i2sClockModel(fs, slotBits)` define dos ranuras por trama: `BCLK = fs × 2 × slotBits`, `WS = fs`.
- `i2sBusModel` agrega profundidad de audio, canales de audio, datos útiles y MCLK nominal. Mono no elimina una ranura del bus. La profundidad no puede superar el ancho de ranura.
- `i2sClockSamples` produce flancos digitales ideales, sin interpolar rampas. Los niveles 0/1 no representan voltajes medidos.

`components/instruments/I2sScope.tsx` presenta las dos trazas, colores, unidades, leyendas, pausa y explicación. Usa `TimeScope`/`SignalPlot`. Recibe el modelo y los nombres físicos de BCLK y WS; no posee controles de cálculo ni persistencia.

Se comparte entre la calculadora I²S y los laboratorios PCM5102A (`BCK/LRCK`) y MAX98357A (`BCLK/LRC`). Los demás módulos no activan el instrumento. Para otra familia de señales, reutilizar el renderizador cuando tenga sentido y mantener la física en un modelo específico; no representar buses distintos como si fueran I²S.

La calculadora guarda `i2sSlotBits` junto con el resto de sus valores. Conserva el valor predeterminado de 16 bits para enlaces antiguos; si un enlace anterior especificaba otra profundidad, se interpreta como su ancho implícito de ranura. Los nuevos enlaces con una profundidad no predeterminada incluyen el ancho explícito, incluso si coincide con el predeterminado. Las plantillas de audio usan 16/16 bits a 44.1 kHz y 24/32 bits a 48 kHz.

La animación está ralentizada y respeta movimiento reducido. Cambiar valores actualiza las trazas aun con el visor pausado. DIN y MCLK no se dibujan; MCLK se presenta como cálculo nominal, sujeto a los formatos y relaciones admitidos por el dispositivo real.

## Resistencias y divisores DC

`lib/electronics/series.ts` contiene las series E12/E24/E48/E96 compartidas con el código de colores. `preferredResistance` busca también las décadas vecinas y permite elegir el valor más cercano, superior o inferior. La serie comercial y la tolerancia son parámetros distintos.

`divider.ts` calcula divisores sin carga con entrada fija y extremos de tolerancia independientes. El ADC selecciona R superior redondeando hacia arriba después de aplicar el peor caso; muestra el valor comercial, la tensión nominal y el rango. `adcTolerancePct` se guarda en enlaces y presets (5% predeterminado). La resistencia inferior es la indicada por el usuario. LED usa redondeo superior para su recomendación nominal y aclara que no incluye tolerancias del LED.

`max98357.ts` concentra pulldown, tolerancias y umbrales de SD del datasheet (Rev. 16, pp. 7/17). Distingue canal nominal de canal garantizado en todo el rango; la banda típica de Right no es una garantía. Considera una resistencia de placa en paralelo con la externa, ambas a Vin. Con otra topología se debe consultar el esquema. `null` representa conexión ausente; `0`, conexión directa.

`Max98357Lab` se usa en el catálogo y las vistas de amplificadores PAD/Speaker. Las guías activan esa vista con `ampSd: true`; las instrucciones y SVG de esa vista se traducen mediante `Electronics.max`. Las demás secciones se traducen mediante `WiringGuideContent`. El ejemplo a 5 V sin pullup usa valores derivados del modelo, no recomendaciones independientes por proyecto. `DividerReadout` se comparte con ADC; aquí no hay señales temporales que requieran osciloscopio.

Pruebas: `npm run test:electronics`, `tests/electronics-shared.spec.ts` y `tests/mobile-electronics.spec.ts` cubren décadas, límites, tolerancias, canales, pullups, cuatro idiomas, enlaces y vistas de proyectos.

## Verificación de instrumentos

`npm run test:instruments` comprueba frecuencias, flancos, mono/estéreo, profundidad/ranura y entradas inválidas. `npm run test:breakouts` comprueba los headers físicos y la integridad del catálogo y sus traducciones, incluyendo valores numéricos en tablas.

Playwright cubre:

- `tests/i2s-shared.spec.ts`: acuerdo calculadora/pinouts, los cuatro idiomas, valores inválidos, pausa, enlaces antiguos, recarga y configuraciones guardadas.
- `tests/pinout-translations.spec.ts`: contenido completo de los 15 módulos y búsqueda localizada; disposición a 320 px en los cuatro idiomas.
- `tests/mobile-instruments.spec.ts`: controles y señales en móvil y tablet.
- `tests/pinouts.spec.ts` y `tests/mobile-pinouts.spec.ts`: selección, historial, identidad de pines y ampliación.

Ejecutar build, lint, pruebas de lógica y Playwright contra la compilación actual antes de integrar en `main` local. Push y deploy corresponden al cierre del día.


## Explorador de pines y banco de armado

`BoardDiagram` comparte un inspector accesible entre catálogo y guías. La identidad
seleccionada es `lado-posicion`, no el nombre del pin: los GND repetidos siguen
siendo terminales distintos. El selector HTML y los botones SVG (Enter/Espacio)
controlan la misma selección. La ubicación mostrada por el inspector usa el header
y la posición reales del modelo; la numeración corrida del dibujo sigue siendo
una referencia visual. El acabado de PCB/metal es ilustrativo, no una foto ni un
modelo mecánico de todas las variantes.

PAD y BTDAC agregan una pestaña de cableado y armado con `WiringWorkbench`.
`lib/padWiring/assembly.ts` deriva módulos, orden y conexiones de la guía existente;
no duplica GPIO ni interpreta texto traducido como topología. Los terminales #1,
#2, etc. del lienzo son referencias de la lista funcional, no patillas físicas.
Los rieles, componentes en serie y precauciones conservan el texto verificado de
la guía. BTDAC no declara variante de DevKit: no se le inventa un header físico.

Los pasos de preparación, soldadura e inspección se reutilizan por módulo. Sus
confirmaciones son un registro personal, no validación eléctrica ni permiso para
energizar. El progreso usa IDs de módulo/fase y una clave con proyecto, revisión y
versión del esquema; no depende del idioma ni modifica el checklist existente.
Al cambiar los pasos o su significado, incrementar la versión del almacenamiento.
La fase de alimentación requiere identificar y medir la fuente según la guía;
este banco no enseña a fabricar packs ni a soldar sobre celdas.

`Assembly` y `PinExplorer` contienen la interfaz ES/EN/DE/IT. Las ilustraciones de
soldadura son SVG propios; la referencia técnica está enlazada a la guía de
Adafruit: https://learn.adafruit.com/adafruit-guide-excellent-soldering/common-problems
No se cargan imágenes, fuentes ni visores externos.

Verificación: `test:assembly` (conexiones, IDs, persistencia, revisiones e idiomas),
`tests/interactive-wiring.spec.ts` y `tests/mobile-assembly.spec.ts`. CI incluye
ambos recorridos junto a las pruebas existentes de pinouts y guías.
