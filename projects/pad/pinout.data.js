// ============================================================================
//  pinout.data.js — HIOS PAD · datos del visor offline del taller
//
//  ⚠️ ARCHIVO AUTOGENERADO — NO EDITAR A MANO.
//  Fuente: config/pinouts/pad.ts · Regenerar: npm run gen:pinout
//
//  Si editás esto a mano, el próximo `npm run gen:pinout` te lo pisa y
//  `npm run test:wiring` falla antes.
//
//  TODOS los números son GPIO — lo que imprime la serigrafía del DevKitC-1 (IOxx),
//  NO la posición física del pin en el header. Emparejá SIEMPRE por el IOxx.
//  Autoridad del firmware = src/app/Pins.h.
// ============================================================================
window.PINOUT = {
  "meta": {
    "rev": "0.9",
    "mcu": "ESP32-S3 DevKitC-1 (N16R8)",
    "note": "as-wired: el firmware del repo YA es rev 0.9 (matriz 2×5 escaneada + bus I2S). Soldás esto, flasheás lo que está commiteado y anda. El self-test compara esta guía contra Pins.h y platformio.ini en cada corrida."
  },
  "colors": {
    "io": "#58a6ff",
    "adc": "#3fb950",
    "pwm": "#bc8cff",
    "neo": "#ff79c6",
    "mtx": "#f0883e",
    "i2s": "#2dd4bf",
    "spi": "#e3b341",
    "i2c": "#e3b341",
    "dac": "#bc8cff",
    "dim": "#6e7681"
  },
  "modules": [
    {
      "id": "power",
      "name": "Energía — 3 rieles",
      "icon": "⚡",
      "rail": null,
      "power": "celdas 2S → SW-CELDAS → buck 5.0V (≥3A) → riel 5V · S3 pin 5V → LDO a bordo → riel 3V3",
      "step": 1,
      "tip": "Medí el buck a 5.0V **antes** de enchufar el S3. El 3V3 lo genera el propio DevKit (LDO SGM2212-3.3, 800mA): **no se inyecta de afuera**."
    },
    {
      "id": "display",
      "name": "Pantalla ILI9488 3.5\" (SPI)",
      "icon": "🖥️",
      "rail": 5,
      "power": "VCC → 5V · GND → GND · LED → SW-PANTALLA → GPIO21",
      "step": 2,
      "tip": "El ILI9488 es lógica **3.3V** (abs-max 3.3V en IOVCC) — tus GPIO son 3.3V, así que va directo. Pero **fijate si tu módulo trae un buffer 74HC245** al lado del header: si lo trae, se alimenta del VCC del módulo y a 5V su umbral pasa a 3.5V → tu SPI de 3.3V queda por debajo y ves **pantalla en blanco**. En ese caso, VCC va al riel **3V3**, no al 5V."
    },
    {
      "id": "matrix",
      "name": "Matriz de acción 2×5 (10 teclas)",
      "icon": "⌨️",
      "rail": null,
      "power": "no se alimenta: cada tecla cierra COLUMNA → diodo → FILA",
      "step": 3,
      "tip": "2 filas OUTPUT (se manejan a LOW de a una) + 5 columnas INPUT_PULLUP. Un diodo por tecla, **cátodo (la raya) hacia la FILA**. Sin diodos hay ghosting al apretar 3 teclas."
    },
    {
      "id": "nav",
      "name": "Botones ALT (navegación)",
      "icon": "🔀",
      "rail": null,
      "power": "no se alimenta: pulsador directo a GND (INPUT_PULLUP)",
      "step": 4,
      "tip": "Van **fuera** de la matriz y **sin diodo**: son los que abren capa/menú, tienen que leerse siempre."
    },
    {
      "id": "encoder",
      "name": "Encoder KY-040",
      "icon": "🎛️",
      "rail": 33,
      "power": "+ → 3V3 · GND → GND",
      "step": 5
    },
    {
      "id": "stick",
      "name": "Stick analógico (HW-504)",
      "icon": "🕹️",
      "rail": 33,
      "power": "+5V del módulo → riel **3V3** · GND → GND",
      "step": 6,
      "tip": "El pin del módulo dice \"+5V\" pero va a **3V3**. A 5V sobre-volta el ADC del S3 y los ejes se acoplan en el extremo alto. Los dos ejes van a GPIO1/GPIO2 = **ADC1**, el único ADC que funciona con WiFi/BLE prendido."
    },
    {
      "id": "audio",
      "name": "2× MAX98357A (I2S)",
      "icon": "🔊",
      "rail": 5,
      "power": "Vin → 5V · GND → GND · 1000µF cerca de los amplis",
      "step": 7,
      "tip": "Bus I2S compartido: los 3 pines van a **los dos** amplis. Lo único distinto entre ellos es el pin **SD**, que elige el canal. Class-D filterless: el parlante de 4–8Ω va directo, sin filtro."
    },
    {
      "id": "led",
      "name": "Tira NeoPixel",
      "icon": "🌈",
      "rail": 5,
      "power": "VCC → 5V (o 1N400x en serie, ver tip) · GND → GND",
      "step": 8,
      "tip": "Toda la tira es **un solo pin** (DIN→DOUT encadenado). El WS2812B pide V_IH = 0.7×VDD = **3.5V** y tu GPIO da 3.3V: está **fuera de spec**. Fix sin chips: meté un **1N400x** (silicio, ~0.65V) en serie con el VCC de la tira → la tira queda a ~4.35V → el umbral baja a 3.05V y tu 3.3V entra cómodo. La otra opción es un 74AHCT125. El SK6812 **no** es un fix garantizado: su umbral típico sigue siendo 3.4V."
    },
    {
      "id": "system",
      "name": "Sistema (USB / UART)",
      "icon": "🔒",
      "rail": null,
      "power": "no se cablea: los usa la placa",
      "step": 9,
      "tip": "Reservados. Tocarlos rompe el HID (19/20) o el flasheo por cable (43/44)."
    }
  ],
  "pins": [
    {
      "gpio": 1,
      "kind": "adc",
      "name": "Stick VRx",
      "mod": "stick",
      "dest": "Stick eje X — ADC1_0"
    },
    {
      "gpio": 2,
      "kind": "adc",
      "name": "Stick VRy",
      "mod": "stick",
      "dest": "Stick eje Y — ADC1_1"
    },
    {
      "gpio": 4,
      "kind": "io",
      "name": "Encoder CLK",
      "mod": "encoder",
      "dest": "KY-040 canal A"
    },
    {
      "gpio": 5,
      "kind": "io",
      "name": "Encoder DT",
      "mod": "encoder",
      "dest": "KY-040 canal B"
    },
    {
      "gpio": 6,
      "kind": "io",
      "name": "Encoder SW",
      "mod": "encoder",
      "dest": "KY-040 pulsador (INPUT_PULLUP)"
    },
    {
      "gpio": 7,
      "kind": "io",
      "name": "Stick SW",
      "mod": "stick",
      "dest": "Stick pulsador (INPUT_PULLUP)"
    },
    {
      "gpio": 8,
      "kind": "mtx",
      "name": "Matriz COL 1",
      "mod": "matrix",
      "dest": "INPUT_PULLUP · lee ACC2 / ACC7",
      "note": "es ADC1_7, pero acá va como digital"
    },
    {
      "gpio": 9,
      "kind": "neo",
      "name": "NeoPixel DIN",
      "mod": "led",
      "dest": "datos de la tira, vía 330Ω en serie",
      "note": "ex-divisor de batería. La medición de batería se descartó: NO reactivar BATTERY_ENABLED sin reasignar el ADC"
    },
    {
      "gpio": 10,
      "kind": "spi",
      "name": "TFT CS",
      "mod": "display",
      "dest": "ILI9488 CS (chip-select)"
    },
    {
      "gpio": 11,
      "kind": "spi",
      "name": "TFT MOSI",
      "mod": "display",
      "dest": "ILI9488 SDI"
    },
    {
      "gpio": 12,
      "kind": "spi",
      "name": "TFT SCLK",
      "mod": "display",
      "dest": "ILI9488 SCK"
    },
    {
      "gpio": 13,
      "kind": "spi",
      "name": "TFT DC",
      "mod": "display",
      "dest": "ILI9488 DC/RS"
    },
    {
      "gpio": 14,
      "kind": "spi",
      "name": "TFT RST",
      "mod": "display",
      "dest": "ILI9488 RESET"
    },
    {
      "gpio": 15,
      "kind": "mtx",
      "name": "Matriz FILA 0",
      "mod": "matrix",
      "dest": "OUTPUT (drive LOW) · fila de ARRIBA: ACC1–5"
    },
    {
      "gpio": 16,
      "kind": "mtx",
      "name": "Matriz FILA 1",
      "mod": "matrix",
      "dest": "OUTPUT (drive LOW) · fila de ABAJO: ACC6–10"
    },
    {
      "gpio": 17,
      "kind": "io",
      "name": "Botón ALT1",
      "mod": "nav",
      "dest": "→ GND (INPUT_PULLUP) · DIRECTO, sin diodo"
    },
    {
      "gpio": 18,
      "kind": "mtx",
      "name": "Matriz COL 0",
      "mod": "matrix",
      "dest": "INPUT_PULLUP · lee ACC1 / ACC6"
    },
    {
      "gpio": 19,
      "kind": "dim",
      "name": "USB D−",
      "mod": "system",
      "dest": "USB nativo (HID) — RESERVADO, no soldar nada"
    },
    {
      "gpio": 20,
      "kind": "dim",
      "name": "USB D+",
      "mod": "system",
      "dest": "USB nativo (HID) — RESERVADO, no soldar nada"
    },
    {
      "gpio": 21,
      "kind": "pwm",
      "name": "TFT backlight",
      "mod": "display",
      "dest": "LED de la TFT (PWM por LEDC) · acá va en serie el SW-PANTALLA"
    },
    {
      "gpio": 38,
      "kind": "mtx",
      "name": "Matriz COL 2",
      "mod": "matrix",
      "dest": "INPUT_PULLUP · lee ACC3 / ACC8",
      "note": "en DevKitC-1 **v1.1** este pin maneja el LED RGB de la placa. No rompe nada (el DIN del LED es alta impedancia) pero el pixel va a parpadear con el escaneo"
    },
    {
      "gpio": 39,
      "kind": "mtx",
      "name": "Matriz COL 3",
      "mod": "matrix",
      "dest": "INPUT_PULLUP · lee ACC4 / ACC9"
    },
    {
      "gpio": 40,
      "kind": "i2s",
      "name": "I2S BCLK",
      "mod": "audio",
      "dest": "→ BCLK de AMBOS MAX98357A (bus compartido)"
    },
    {
      "gpio": 41,
      "kind": "i2s",
      "name": "I2S LRC",
      "mod": "audio",
      "dest": "→ LRC de AMBOS MAX98357A (word-select L/R)"
    },
    {
      "gpio": 42,
      "kind": "i2s",
      "name": "I2S DOUT",
      "mod": "audio",
      "dest": "→ DIN de AMBOS MAX98357A (dato serial). Sale del S3, entra al ampli: por eso acá es DOUT y allá DIN"
    },
    {
      "gpio": 43,
      "kind": "dim",
      "name": "UART0 TX",
      "mod": "system",
      "dest": "Serial + flasheo por cable (CH343)"
    },
    {
      "gpio": 44,
      "kind": "dim",
      "name": "UART0 RX",
      "mod": "system",
      "dest": "Serial + flasheo por cable (CH343)"
    },
    {
      "gpio": 47,
      "kind": "mtx",
      "name": "Matriz COL 4",
      "mod": "matrix",
      "dest": "INPUT_PULLUP · lee ACC5 / ACC10"
    },
    {
      "gpio": 48,
      "kind": "io",
      "name": "Botón ALT2",
      "mod": "nav",
      "dest": "→ GND (INPUT_PULLUP) · DIRECTO, sin diodo",
      "note": "en DevKitC-1 **v1.0** este pin maneja el LED RGB de la placa. El pulsador funciona igual; el LED simplemente no se usa"
    }
  ],
  "rails": [
    {
      "k": "c5",
      "t": "5V (buck 5.0V)",
      "c": "→ ESP32 pin 5V · TFT VCC · NeoPixel VCC · 2× MAX98357A Vin · cap de bulk · buck **≥3A**"
    },
    {
      "k": "c33",
      "t": "3V3 (LDO del DevKit)",
      "c": "→ Stick VCC · Encoder + . Lo genera el SGM2212-3.3 a bordo (800mA): **NO inyectar de afuera**"
    },
    {
      "k": "cg",
      "t": "GND común",
      "c": "→ batería− · buck · S3 · TFT · stick · encoder · matriz · ALT · amplis · NeoPixel (1 sola masa)"
    }
  ],
  "sections": [
    {
      "t": "⚡ Energía — 3 rieles",
      "group": "power",
      "ascii": "Cargador 2S ──┬── 2 celdas (7.0–8.4V útiles)\n              └─[SW-CELDAS]─► Buck 5.0V (≥3A) ─► RIEL 5V\n   RIEL 5V ─► ESP32 pin 5V ─►(LDO SGM2212)─► pin 3V3 ─► RIEL 3V3\n   RIEL 5V ─► cap 470–1000µF ─► GND   (+1000µF cerca de los amplis)\n   RIEL 5V ─► Pantalla VCC ; NeoPixel + 2× ampli Vin\n   GPIO21 ─[SW-PANTALLA]─► LED/BL de la pantalla   (¡el switch va acá, NO en el VCC!)\n   RIEL 3V3 ─► Stick VCC + Encoder + ; GND común: TODO",
      "tip": "**USB no alimenta nada** (uso wireless). El 3V3 sale del S3, no se inyecta. Presupuesto real a full: 2 amplis a 4Ω (~1.5A) + 12 SK6812 en blanco (~0.7A) + S3 con RF + backlight (~0.6A) ≈ **2.9A** → el buck tiene que ser **≥3A**, no 2A.",
      "rows": [
        {
          "pin": "5V",
          "kind": "pwr5",
          "nm": "Buck OUT 5.0V",
          "to": "→ RIEL 5V (S3, pantalla, NeoPixel, 2× ampli, cap)"
        },
        {
          "pin": "3V3",
          "kind": "pwr33",
          "nm": "S3 pin 3V3",
          "to": "→ RIEL 3V3 (stick + encoder)"
        },
        {
          "pin": "GND",
          "kind": "gnd",
          "nm": "Masa común",
          "to": "todo junto (1 sola masa)"
        }
      ]
    },
    {
      "t": "🔌 Switches",
      "group": "power",
      "cnt": "2",
      "tip": "⚠️ **SW-PANTALLA va en la línea LED/BL, NO en el VCC de la pantalla.** Si le cortás el VCC mientras los GPIO10–14 siguen manejando el SPI a 3.3V, violás el abs-max del ILI9488 (`VIN ≤ IOVCC + 0.3V`, o sea 0.3V con el módulo apagado) y le metés corriente por los diodos de ESD: es la forma clásica de cocinar el controlador. Cortando el backlight ahorrás casi la misma corriente, sin romper nada.",
      "rows": [
        {
          "pin": "SW1",
          "kind": "pwr5",
          "nm": "SW-CELDAS",
          "to": "corta BAT+ → buck (apaga TODO)",
          "note": "≥3A"
        },
        {
          "pin": "SW2",
          "kind": "pwr33",
          "nm": "SW-PANTALLA",
          "to": "corta GPIO21 → LED/BL de la pantalla (la lógica queda alimentada)"
        }
      ]
    },
    {
      "t": "🔊 Canal de cada ampli (pin SD)",
      "group": "audio",
      "cnt": "L / R",
      "tip": "El pin **SD** del MAX98357A hace dos cosas: apaga el ampli **y** elige el canal, según la tensión que le pongas. Tiene un pulldown interno de **100k**, así que la R que le colgás a Vin arma un divisor. Los umbrales son **volts absolutos**, no fracción de Vdd.",
      "rows": [
        {
          "pin": "SD",
          "kind": "pwr5",
          "nm": "Ampli IZQUIERDO",
          "to": "SD → Vin directo (5V) → banda >1.4V = **Left**"
        },
        {
          "pin": "SD",
          "kind": "pwr33",
          "nm": "Ampli DERECHO",
          "to": "SD → **390kΩ** → Vin → ~1.0V = **Right**",
          "note": "la fórmula del datasheet (R = 94.0×Vdd − 100) da 370k a 5V"
        },
        {
          "pin": "GAIN",
          "kind": "gnd",
          "nm": "Ganancia",
          "to": "dejalo **sin conectar** = 9dB (ese es el que va flotante, NO el SD)"
        }
      ]
    },
    {
      "t": "🌈 NeoPixel",
      "group": "misc",
      "cnt": "DIN=9",
      "tip": "Toda la tira = 1 pin (DIN→DOUT encadenado). En GPIO9 (ex-batería) → UART0 (43/44) libre p/ serial+flasheo, sin parpadeo de boot. **Feedback por botón:** encadená 1 SK6812 por tecla en el MISMO GPIO9 (subí `NEOPIXEL_COUNT`) → RGB por tecla sin gastar pines. Los diodos de la matriz NO pueden hacer esto.",
      "rows": [
        {
          "pin": "9",
          "kind": "neo",
          "nm": "DIN",
          "to": "GPIO9 (330Ω en serie)",
          "note": "3.3V está bajo el umbral: 1N400x en serie con el VCC de la tira, o 74AHCT125"
        },
        {
          "pin": "5V",
          "kind": "pwr5",
          "nm": "VCC",
          "to": "→ RIEL 5V (o vía 1N400x → 4.35V)",
          "note": "~60mA/LED a tope; limitá brillo"
        },
        {
          "pin": "GND",
          "kind": "gnd",
          "nm": "GND",
          "to": "→ GND común"
        }
      ]
    },
    {
      "t": "🔋 Batería — descartada en el pad",
      "group": "misc",
      "cnt": "GPIO9→NeoPixel",
      "tip": "No se mide en el pad: la **pantalla de la fuente** ya muestra la tensión de entrada (= las 2 celdas 2S). GPIO9 (ex-divisor) ahora maneja el NeoPixel. En firmware: `BATTERY_ENABLED=false` — **NO lo actives**: `BAT_ADC_PIN` sigue apuntando al 9 y le meterías 2.7V DC a la línea de datos del NeoPixel. Ignorá el paso del divisor que quedó en el WIRING.md viejo.",
      "rows": []
    },
    {
      "t": "🧮 Presupuesto de pines",
      "group": "misc",
      "cnt": "libre: GPIO3",
      "tip": "Matriz acción 7 (2 filas + 5 cols) + 2 ALT directos + 3 I2S = 12 → usan todos los GPIO que quedaron. Sobra **exactamente un pin: el GPIO3** (y es strapping, así que con cuidado). No usables: 26–32 (flash), 35–37 (PSRAM octal), 19/20 (USB), 43/44 (UART0), **0/3/45/46 (strapping)** — el 0 además queda reservado para el BOOT de recuperación.",
      "rows": []
    }
  ],
  "check": [
    "Buck medido a 5.0V ANTES de conectar el S3 (≥3A: 2 amplis + NeoPixel + backlight pican ~2.9A)",
    "Buck con headroom real: a 6.0V de entrada un buck no-síncrono se cae de regulación — cortá el pack a ~7.0V",
    "Masa común con continuidad (batería−, buck, S3, TFT, stick, encoder, matriz, ALT, amplis, NeoPixel)",
    "Cap bulk 470–1000µF en el riel 5V + 1000µF cerca de los amplis (polaridad OK)",
    "Stick y encoder al riel 3V3 (NO 5V) — verificado con multímetro",
    "Pantalla: si tiene buffer 74HC245 junto al header, su VCC va a 3V3 (si no, pantalla en blanco)",
    "SW-PANTALLA en la línea LED/BL, NUNCA cortando el VCC de la pantalla (abs-max del ILI9488)",
    "TFT: CS=10, MOSI=11, SCLK=12, DC=13, RST=14, BL=21 (el WIRING.md viejo dice CS=13: está MAL)",
    "Matriz acción: 2 filas (15/16 = OUTPUT) + 5 columnas (18/8/38/39/47 = INPUT_PULLUP)",
    "10 diodos (uno por botón de acción), cátodo (raya) hacia la FILA → evita ghosting (si no registra, dalos vuelta)",
    "Diodos: 1N4148 (chico) o cualquier silicio: 1N400x/1N540x sirven igual (más grandes). LEDs NO",
    "ALT1→GPIO17, ALT2→GPIO48 DIRECTOS a GND (INPUT_PULLUP), SIN diodo (fila nav)",
    "NeoPixel: 330Ω en serie en DIN (GPIO9) + 1N400x en el VCC de la tira (o 74AHCT125) + cap en su 5V",
    "I2S: BCLK=40, LRC=41, DIN=42 cableados a AMBOS amplis (bus compartido)",
    "Ampli-L: SD→Vin, medí SD > 1,4V · Ampli-R: SD→390k a Vin, medí SD ~1,0V (ventana segura 0,83–1,24V)",
    "GAIN de cada ampli sin conectar (=9dB) · parlante 4–8Ω directo (filterless, NO lo pruebes con carga resistiva)",
    "SW-CELDAS corta BAT+ → buck",
    "1er flasheo por cable; después OTA (--upload-port hiospad.local)",
    "BOOT (GPIO0) + USB-C nativo accesibles para recuperación ante OTA fallido"
  ],
  "keymap": {
    "cols": [
      {
        "c": 0,
        "gpio": 18
      },
      {
        "c": 1,
        "gpio": 8
      },
      {
        "c": 2,
        "gpio": 38
      },
      {
        "c": 3,
        "gpio": 39
      },
      {
        "c": 4,
        "gpio": 47
      }
    ],
    "rows": [
      {
        "r": 0,
        "gpio": 15,
        "name": "acción · fila de ARRIBA",
        "keys": [
          "ACC1",
          "ACC2",
          "ACC3",
          "ACC4",
          "ACC5"
        ]
      },
      {
        "r": 1,
        "gpio": 16,
        "name": "acción · fila de ABAJO",
        "keys": [
          "ACC6",
          "ACC7",
          "ACC8",
          "ACC9",
          "ACC10"
        ]
      }
    ],
    "navRow": [
      {
        "kind": "btn",
        "logic": "ALT1",
        "gpio": 17
      },
      {
        "kind": "btn",
        "logic": "ALT2",
        "gpio": 48
      },
      {
        "kind": "aux",
        "label": "Encoder",
        "gpio": "4/5/6"
      },
      {
        "kind": "aux",
        "label": "Stick",
        "gpio": "1/2/7"
      }
    ]
  },
  "ampSdSteps": [
    "Ganancia: dejá el pin **GAIN** sin conectar (=9 dB). Ojo: el que va flotante es GAIN, **no** el SD — un SD flotante lo baja el pulldown interno a 0V y el ampli queda MUDO.",
    "Ampli **LEFT**: SD → Vin directo. Queda a 5V, muy por encima del umbral de 1,4V.",
    "Ampli **RIGHT**: R de **390kΩ** entre SD y Vin. (Fórmula del datasheet: R = 94.0 × Vdd − 100 = 370k a 5V; 390k es el valor comercial más cercano.)",
    "Encendé el riel 5V (buck ya medido a 5.0V). No hace falta que haya sonido.",
    "Multímetro en DC: punta roja a SD, negra a GND.",
    "Bandas de SD (volts absolutos): <0,16V mudo · 0,16–0,77V (L+R)/2 · 0,77–1,4V Right · >1,4V Left.",
    "LEFT tiene que dar >1,4V. RIGHT tiene que dar **~1,0V**; la ventana segura contra tolerancias es **0,83–1,24V**, no la banda nominal completa.",
    "⚠️ Si tu módulo ya trae una R de SD a Vin de fábrica (la de Adafruit trae 1M), la tuya queda en **paralelo** y el cálculo cambia: por eso se mide, no se asume. Con 1M a bordo vas a necesitar ~620–680k externos.",
    "⚠️ NO uses 220k: da 1,56V, que cae en la banda de **Left**. Los dos amplis te sacarían el mismo canal y vas a culpar al I2S."
  ],
  "divergence": []
};
