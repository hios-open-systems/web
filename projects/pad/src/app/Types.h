// ============================================================================
//  Types.h - Tipos base del flujo de entrada.
//  Un InputEvent es la entrada NORMALIZADA: las fuentes (botones/encoder/stick)
//  emiten esto y el resto del sistema nunca toca GPIO directamente.
// ============================================================================
#pragma once
#include <stdint.h>

// Ids logicos estables, independientes del GPIO fisico.
enum class InputId : uint8_t {
  BTN_1, BTN_2, BTN_3, BTN_4, BTN_5, BTN_6, BTN_7, BTN_8, BTN_9, BTN_10,  // 10 de accion
  ALT_1, ALT_2,   // 2 modificadores (sin rol asignado aun)
  ENC_SW, STICK_SW,
  ENC_ROT,      // rotacion: delta en v1 (con signo)
  STICK_AXIS,   // ejes: x en v1, y en v2
  _COUNT
};
// NOTA: el bit i del bitmask `buttons` (UiSnapshot) = valor de InputId i, porque
// ButtonMatrix construye sus indices en este mismo orden. Asi bit==InputId.

enum class Edge : uint8_t {
  PRESS,        // pulsador: flanco a pulsado
  RELEASE,      // pulsador: flanco a soltado
  LONG_PRESS,   // pulsador: mantenido > umbral
  ROTATE,       // encoder: hubo giro (delta en v1)
  MOVE          // stick: cambio de posicion (x en v1, y en v2)
};

struct InputEvent {
  InputId  id;
  Edge     edge;
  int16_t  v1;      // delta de giro, o stick X
  int16_t  v2;      // stick Y (sin usar en el resto)
  uint32_t t_ms;
};

// Sink de eventos: en M0 imprime/dibuja; en M1+ empuja a una cola FreeRTOS.
// Mantenerlo como interfaz permite cambiar el destino sin tocar las fuentes.
struct InputSink {
  virtual void emit(const InputEvent& e) = 0;
  virtual ~InputSink() = default;
};

// Snapshot del estado para la UI. El productor (inputTask) lo escribe con
// xQueueOverwrite a un mailbox; la UI (otro core) lee el ultimo sin bloquear.
// Qué estado togglea un binding (para que la UI pueda reflejarlo, "optimista").
enum class StateToggle : uint8_t { NONE, MIC, MOUSE, MEDIA, CAMERA };

// Bits de transporte para UiSnapshot.transports
namespace tport { enum : uint8_t { USB = 1, BLE = 2, WIFI = 4 }; }

struct UiSnapshot {
  uint16_t buttons;     // bitmask por InputId: bits 0..9 = BTN_1..10, 10..11 = ALT_1/2, 12 = encSW, 13 = stickSW
  long     encPos;      // posicion acumulada del encoder (detentes)
  uint16_t stickX;      // crudo 0..4095
  uint16_t stickY;
  uint8_t  activeLayer; // capa activa
  bool     mouseOn;     // modo mouse del stick activo (toggle por SW del stick)
  uint8_t  clickFlash;  // flash de click reciente en el box del mouse: 0=nada, 1=izq, 2=der
  uint8_t  encMode;     // override del encoder por doble-tap: 0=capa,1=Vol,2=Scroll,3=Zoom,4=Pestanas
  uint8_t  altActive;   // ALT momentaneo activo (held+linger): 0=ninguno, 1=ALT1, 2=ALT2 (feedback UI)
  uint16_t longFlash;   // bitmask (BTN_1..10): botones cuyo long-press acaba de dispararse (flash)
  // --- estado optimista (lo que el pad cree haber dejado) ---
  bool     micMuted;
  bool     mediaPlay;
  bool     camOff;
  uint8_t  volume;      // 0..100 (estimado)
  uint8_t  transports;  // bits tport::USB/BLE/WIFI
  bool     wifiOff;     // WiFi apagado por el usuario (long-press boton 5) -> aviso en pantalla
  uint8_t  battery;     // 0..100 (placeholder hasta sumar medicion; 255 = sin dato)
  // --- feedback real del companion (Fase 1); sentinela = sin dato ---
  bool     live;        // hay estado fresco del companion (mic/vol son reales)
  int16_t  cpuTemp;     // C, -1000 = sin dato
  int16_t  gpuTemp;     // C, -1000 = sin dato
  uint8_t  cpuLoad;     // 0..100, 255 = sin dato
  uint8_t  gpuLoad;     // 0..100, 255 = sin dato
  // --- monitor extendido (capas General/Red/Nucleos); sentinela = sin dato ---
  int16_t  cpuFan;      // RPM, -1 = sin dato
  uint8_t  gpuFan;      // 0..100, 255 = sin dato
  uint8_t  ram;         // 0..100, 255 = sin dato
  uint32_t netDown;     // KB/s, 0xFFFFFFFF = sin dato
  uint32_t netUp;       // KB/s, 0xFFFFFFFF = sin dato
  char     ip[16];      // IP local ("" = sin dato)
  uint8_t  cores[24];   // carga por nucleo 0..100, 255 = sin dato
  uint8_t  coreCount;   // nucleos validos en cores[] (0 = sin dato)
  uint16_t vramUsed;    // MB de VRAM usada, 0xFFFF = sin dato
  uint16_t vramTotal;   // MB de VRAM total, 0 = sin dato
  uint32_t uptimeSec;   // s encendido, 0xFFFFFFFF = sin dato
  uint16_t procs;       // nº de procesos, 0xFFFF = sin dato
  uint8_t  diskPct;     // 0..100 uso del volumen principal, 255 = sin dato
  uint32_t diskRd;      // KB/s lectura de disco, 0xFFFFFFFF = sin dato
  uint32_t diskWr;      // KB/s escritura de disco, 0xFFFFFFFF = sin dato
  // --- feedback WiZ (para la capa WiZ): cuarto/luz/on/brillo ---
  char     wizRoom[16];
  char     wizTarget[16];   // "Todas" o el nombre de la luz
  bool     wizOn;
  uint8_t  wizBright;   // 0..100
};

// Nombre legible de un input (para Serial / UI).
inline const char* inputName(InputId id) {
  switch (id) {
    case InputId::BTN_1:      return "Boton 1";
    case InputId::BTN_2:      return "Boton 2";
    case InputId::BTN_3:      return "Boton 3";
    case InputId::BTN_4:      return "Boton 4";
    case InputId::BTN_5:      return "Boton 5";
    case InputId::BTN_6:      return "Boton 6";
    case InputId::BTN_7:      return "Boton 7";
    case InputId::BTN_8:      return "Boton 8";
    case InputId::BTN_9:      return "Boton 9";
    case InputId::BTN_10:     return "Boton 10";
    case InputId::ALT_1:      return "ALT 1";
    case InputId::ALT_2:      return "ALT 2";
    case InputId::ENC_SW:     return "Encoder SW";
    case InputId::STICK_SW:   return "Stick SW";
    case InputId::ENC_ROT:    return "Encoder";
    case InputId::STICK_AXIS: return "Stick";
    default:                  return "?";
  }
}
