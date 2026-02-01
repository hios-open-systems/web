# Componentes - HIOS WiFi Speaker

Especificaciones detalladas de cada modulo del proyecto.

---

## 1. Fuente Step-Down LM2596S con Display

Convertidor DC-DC step-down con display LED integrado.

**Por que este componente?**
- Display permite ver voltaje de salida en tiempo real
- Preset multivuelta para ajuste preciso
- Eficiencia del 95% (menos calor, mas autonomia)
- Proteccion integrada contra cortocircuito y sobretemperatura

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Tension entrada | 4V a 40V |
| Tension salida | 1.25V a 37V (ajustable) |
| Corriente maxima | 3A (con disipador) |
| Corriente sin disipador | 1A |
| Frecuencia trabajo | 150KHz |
| Potencia salida | 50-70W (con disipador) |
| Eficiencia | ~95% |
| Temperatura trabajo | -40 a +85 C |
| Dimensiones | 48mm x 25mm x 14mm |

### Conexion

```
Entrada (VIN+, VIN-) <-- Bateria 7.4V
Salida (VOUT+, VOUT-) --> ESP32 + Amplificador (5V)
```

---

## 2. Porta Bateria 2x 18650 en Paralelo

Porta pilas para dos baterias 18650 conectadas en paralelo.

**Por que paralelo?**
- Mantiene 3.7V nominal (compatible con cargador)
- Duplica capacidad (mAh) sin aumentar voltaje
- Mayor autonomia

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Modelo | Paralelo (no serie) |
| Tension | 3.7V nominal |
| Capacidad | 2 baterias 18650 |
| Tipo | Abierto (sin tapa) |

### Nota importante

Este porta pilas es para la version con cargador 1S. Si usas el cargador 2S (8.4V), necesitas un porta pilas en **serie**, no paralelo.

---

## 3. Cargador USB-C para 2x 18650 en Serie (2S)

Modulo cargador inteligente para dos baterias en serie.

**Por que este cargador?**
- USB-C moderno (no microUSB)
- Carga a 2.2A constante (carga rapida)
- Proteccion completa: sobredescarga, sobretension, cortocircuito
- Indicadores LED de estado

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Configuracion | 2S (serie) |
| Metodo carga | Lineal |
| Corriente entrada | 4A requerida |
| Corriente carga | 2.2A constante |
| Precision | 1.5% |
| Tension entrada | 3V a 6V |
| Tension plena carga | 8.4V |
| Puerto | USB-C |
| Protecciones | Descarga, Sobretension, Cortocircuito |
| Dimensiones | 37mm x 17mm x 10mm |

### Conexion

```
USB-C (entrada) <-- Cargador 5V 4A
B+ / B- <-- Baterias en serie
P+ / P- --> Salida protegida (al LM2596)
```

---

## 4. Amplificador I2S MAX98357

Amplificador de audio digital con DAC integrado.

**Por que MAX98357?**
- Conexion I2S digital (sin ruido analogico)
- No necesita DAC externo
- Alta eficiencia (clase D)
- Facil de conectar al ESP32

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Interface | I2S digital |
| Potencia salida | 3.2W @ 4ohm |
| Alimentacion | 2.5V a 5.5V |
| Eficiencia | >90% |
| SNR | 90dB |
| THD+N | 0.015% |

### Conexion con ESP32

| MAX98357 | ESP32 | Funcion |
|----------|-------|---------|
| VIN | 5V | Alimentacion |
| GND | GND | Tierra |
| DIN | GPIO25 | Data I2S |
| BCLK | GPIO26 | Bit Clock |
| LRC | GPIO27 | Left/Right Clock |
| GAIN | - | Sin conectar (9dB default) |
| SD | - | Sin conectar (siempre ON) |

---

## 5. Parlante 63mm 4ohm 3W

Altavoz de rango completo para audio.

**Por que este parlante?**
- 4 ohm compatible con MAX98357
- 3W suficiente para uso personal
- Tamano compacto (63mm)
- Rango de frecuencia amplio

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Potencia nominal | 3W |
| Impedancia | 4 ohm |
| Diametro | 63mm |
| Altura | 31mm |
| Frecuencia resonancia | 135Hz +/-20% |
| Rango frecuencia | F0 ~ 20KHz |
| Sensibilidad | 87dB |
| Distorsion | <5% |

### Conexion

```
MAX98357 (+) --> Parlante (+)
MAX98357 (-) --> Parlante (-)
```

**No usar tierra comun con audio!** El parlante se conecta directo a la salida del amplificador.

---

## 6. Display LCD 16x2 con Modulo I2C

Display de caracteres para mostrar estado del sistema.

**Por que LCD 16x2 I2C?**
- Suficiente para mostrar titulo/artista
- Bajo consumo
- Solo 2 pines (I2C) en lugar de 6+
- Backlight azul visible

### Especificaciones

| Parametro | Valor |
|-----------|-------|
| Caracteres | 16 columnas x 2 filas |
| Tamaño caracter | 5x8 puntos (5.23 x 3mm) |
| Controlador | HD44780 |
| Interface | I2C (SDA, SCL) |
| Direccion I2C | 0x27 o 0x3F (tipico) |
| Backlight | LED azul |
| Color caracteres | Blanco |
| Alimentacion | 5V |
| Dimensiones modulo | 80mm x 35mm x 11mm |
| Area visible | 64.5mm x 16mm |

### Conexion con ESP32

| LCD I2C | ESP32 | Funcion |
|---------|-------|---------|
| VCC | 5V | Alimentacion |
| GND | GND | Tierra |
| SDA | GPIO21 | I2C Data |
| SCL | GPIO22 | I2C Clock |

### Uso en el proyecto

```
Linea 1: Estado + Modo (WiFi/BT)
Linea 2: Titulo cancion o URL

Ejemplos:
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│WiFi   Vol:80%  │    │BT     Vol:65%  │    │Radio  Vol:90%  │
│Rock FM 95.9   │    │Bohemian Rhaps..│    │Connecting...   │
└────────────────┘    └────────────────┘    └────────────────┘
```

---

## Diagrama de bloques

```
                                    ┌──────────────┐
                                    │  LCD 16x2   │
                                    │   (I2C)     │
                                    └──────┬──────┘
                                           │
[Bateria 2x18650] --> [Cargador 2S] --> [LM2596 5V] --> [ESP32]
        (7.4V)           (8.4V)           (5V)            │
                                            │       ┌─────┴─────┐
                                            │       │ WiFi+BT   │
                                            v       └─────┬─────┘
                                      [MAX98357] <────────┘
                                            │         I2S Audio
                                            v
                                      [Parlante 4ohm]
```

### Modos de operacion

```
┌─────────────────────────────────────────────────────────────┐
│                    HIOS WiFi Speaker                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ WiFi Radio  │    │   YouTube   │    │  Bluetooth  │     │
│  │  Streams    │    │ (Invidious) │    │  A2DP Sink  │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            v                                │
│                    ┌──────────────┐                         │
│                    │ Audio Buffer │                         │
│                    └──────┬───────┘                         │
│                           v                                 │
│                    ┌──────────────┐                         │
│                    │  I2S Output  │                         │
│                    └──────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Lista de compras (Argentina - MercadoLibre)

1. **ESP32 DevKit** - Buscar: "esp32 devkit v1"
2. **MAX98357** - Buscar: "max98357 i2s amplificador"
3. **LCD 16x2 I2C** - Buscar: "lcd 16x2 i2c arduino" (incluye modulo I2C)
4. **LM2596S c/Display** - Buscar: "fuente lm2596 step down display"
5. **Cargador 2S USB-C** - Buscar: "cargador litio 2s usb-c"
6. **Porta pilas 2x18650** - Buscar: "porta pila 18650 serie" (para 2S)
7. **2x Bateria 18650** - Buscar: "bateria 18650 litio" (comprar protegidas)
8. **Parlante 63mm** - Buscar: "parlante 4 ohm 3w 63mm"
9. **Resistencias 100k** (x2) - Para divisor bateria (opcional)
