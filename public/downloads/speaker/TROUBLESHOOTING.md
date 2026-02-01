# Troubleshooting - HIOS WiFi Speaker

Problemas comunes y como solucionarlos.

---

## No hay sonido

### Verificar alimentacion

1. **Display LM2596 no enciende**
   - Verificar conexion de baterias
   - Verificar que baterias estan cargadas (>6.5V total)
   - Revisar soldaduras en cargador

2. **ESP32 no enciende (LED apagado)**
   - Medir voltaje en VIN (debe ser ~5V)
   - Si voltaje es correcto, ESP32 puede estar danado
   - Probar con USB directo al ESP32

3. **MAX98357 no recibe audio**
   - Verificar conexiones I2S (DIN, BCLK, LRC)
   - Los pines deben coincidir con el codigo

### Verificar codigo

```cpp
// Verificar estos valores en el codigo
#define I2S_DOUT 25  // DIN del MAX98357
#define I2S_BCLK 26  // BCLK
#define I2S_LRC  22  // LRC (Word Select)
```

### Verificar parlante

1. **Probar parlante con pila de 1.5V**
   - Tocar brevemente los cables del parlante a una pila AA
   - Debe hacer "click" si funciona

2. **Verificar conexion al MAX98357**
   - Cables en terminales correctas (+ y -)
   - Soldaduras firmes

---

## Sonido distorsionado

### Causas comunes

1. **Voltaje bajo**
   - Cargar baterias
   - Verificar que LM2596 entrega 5V estables

2. **Volumen muy alto en codigo**
   - Reducir ganancia en software
   - MAX98357 puede saturar con audio muy fuerte

3. **Parlante danado**
   - Escuchar si hay ruido mecanico
   - Probar con otro parlante

4. **Interferencia electrica**
   - Alejar cables de audio de cables de alimentacion
   - Agregar capacitor 100uF en alimentacion del MAX98357

---

## WiFi no conecta

### Verificar credenciales

```cpp
// En el codigo, verificar:
const char* ssid = "TU_RED_WIFI";      // Nombre exacto
const char* password = "TU_PASSWORD";   // Case sensitive
```

### Verificar red

1. **Red 2.4GHz** - ESP32 no soporta 5GHz
2. **Distancia** - Probar cerca del router
3. **Cantidad de dispositivos** - Router puede limitar conexiones

### Debug por Serial

1. Conectar ESP32 por USB
2. Abrir Monitor Serial (115200 baud)
3. Buscar mensajes de error de WiFi

---

## ESP32 se reinicia constantemente

### Causas comunes

1. **Alimentacion insuficiente**
   - ESP32 necesita picos de 500mA al transmitir WiFi
   - Agregar capacitor 470uF en entrada del ESP32

2. **Codigo con error**
   - Conectar por USB y ver Serial Monitor
   - Buscar "Guru Meditation Error" o "Backtrace"

3. **Sobrecalentamiento**
   - Verificar que voltaje no supera 5.5V
   - Agregar ventilacion si esta en caja cerrada

---

## Bateria se descarga rapido

### Optimizaciones

1. **Reducir brillo display LM2596**
   - No se puede, pero consume poco (~20mA)

2. **WiFi consume mucho**
   - Normal: 80-200mA transmitiendo
   - Modo sleep cuando no hay audio: agregar en codigo

3. **Verificar fugas de corriente**
   - Desconectar componentes uno a uno
   - Medir consumo con multimetro en serie

### Consumo esperado

| Estado | Consumo |
|--------|---------|
| Idle (WiFi conectado) | ~80mA |
| Reproduciendo audio | ~150mA |
| Volumen maximo | ~300mA |

Con baterias 2x 2500mAh en paralelo (5000mAh):
- Idle: ~60 horas
- Reproduciendo: ~33 horas
- Volumen max: ~16 horas

---

## Cargador no carga

### Verificar

1. **Cargador USB suficiente**
   - Necesita 5V 4A (20W)
   - Cargadores de celular comunes no alcanzan

2. **LEDs del modulo cargador**
   - Rojo: Cargando
   - Verde/Azul: Carga completa
   - Sin LED: No hay conexion o bateria danada

3. **Baterias en buen estado**
   - Medir voltaje individual (debe ser >2.5V cada una)
   - Si alguna esta en 0V, esta danada

---

## Ruido/Zumbido en audio

### Causas y soluciones

1. **Ground loop**
   - Usar un solo punto de tierra comun
   - No conectar GND del ESP32 y MAX98357 por separado

2. **Cables largos**
   - Acortar cables de I2S
   - Usar cable trenzado para lineas de audio

3. **Fuente ruidosa**
   - Agregar capacitor ceramico 100nF cerca del MAX98357
   - Agregar capacitor electrolitico 100uF en alimentacion

4. **Interferencia WiFi**
   - Alejar MAX98357 de la antena del ESP32
   - Agregar ferrita en cables de audio

---

## El display muestra voltaje incorrecto

### Calibracion

1. Medir con multimetro el voltaje real
2. Si difiere mucho (>0.2V), el display no esta calibrado
3. Algunos modulos tienen preset de calibracion adicional

### Nota

El voltaje mostrado es la **salida**, no la bateria. Para ver bateria, medir entre IN+ e IN-.

---

## Comandos utiles para debug

### Monitor Serial (Arduino IDE)

```
Herramientas > Monitor Serial
Velocidad: 115200 baud
```

### Escanear redes WiFi

```cpp
#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; ++i) {
    Serial.println(WiFi.SSID(i));
  }
}

void loop() {}
```

### Test de audio simple

```cpp
// Genera tono de prueba sin WiFi
// Util para verificar que I2S funciona
#include "driver/i2s.h"

// Ver ejemplo completo en src/tests/
```
