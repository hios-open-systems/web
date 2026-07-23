---
title: "ESP-NOW: comunicación entre ESP32 sin router"
date: "2026-07-23"
lang: "es"
summary: "Protocolo connectionless de Espressif sobre 802.11: cuándo conviene frente a WiFi/BLE, peers, canal, payload, cifrado y las trampas clásicas."
tags: ["esp32", "esp-now", "wireless", "referencia"]
category: "referencia"
---

ESP-NOW es un protocolo propietario de Espressif que manda frames directamente sobre la capa 802.11 (action frames vendor-specific), **sin capa IP**: no hay router, no hay DHCP, no hay TCP. Dos ESP32 se hablan por dirección MAC, punto a punto o por broadcast, con latencias de pocos milisegundos y sin el costo de mantener una conexión.

## Cuándo conviene (y cuándo no)

| Escenario | Mejor opción |
|---|---|
| Telemetría corta entre placas cercanas, baja latencia | ESP-NOW |
| Acceso a internet / MQTT / HTTP | WiFi (STA) |
| Hablar con un celular | BLE |
| Muchos nodos, mesh real con routing | ESP-WIFI-MESH / Thread |

ESP-NOW brilla cuando los mensajes son chicos y frecuentes (sensores, controles remotos, botoneras) y no querés depender de un AP. No sirve para streams grandes ni para hablar con dispositivos que no sean de Espressif.

## Unicast, broadcast y peers

- **Unicast**: mandás a la MAC de un peer registrado. Hay confirmación a nivel MAC (ACK de 802.11), y el callback de envío te dice si el frame fue *ack-eado* — ojo: eso confirma recepción por la radio, no que tu aplicación lo procesó.
- **Broadcast**: mandás a `FF:FF:FF:FF:FF:FF`. No hay ACK ni cifrado; cualquier ESP32 escuchando en el canal lo recibe.
- Antes de mandar unicast hay que **registrar el peer** (`esp_now_add_peer`) con su MAC, canal e interfaz. El límite clásico es de **20 peers** registrados; los cifrados son menos (6–7 por defecto, configurable en ESP-IDF).

## Canal: la regla que rompe todo

Todos los nodos tienen que estar en el **mismo canal WiFi**. Es la causa número uno de "me funcionaba y dejó de andar":

- Si el ESP32 está solo en modo STA sin conectarse a nada, el canal es el que vos fijes (`esp_wifi_set_channel`).
- Si además se conecta a un AP, **el canal lo decide el AP**, y puede cambiar. Tus peers ESP-NOW tienen que seguirlo.

Coexistir con WiFi es posible (ESP-NOW comparte la radio), pero el canal es uno solo: o fijás todo en el mismo, o los nodos que no están asociados al AP tienen que descubrir el canal (por ejemplo, escaneando o con un beacon propio por broadcast).

## Payload

El payload máximo clásico es de **250 bytes por frame**. ESP-NOW v2 (en versiones recientes de ESP-IDF) amplía ese límite hasta ~1470 bytes, pero si necesitás interoperar con firmware viejo, asumí 250. Para mensajes más grandes: fragmentar y rearmar a mano, con número de secuencia.

## Cifrado

ESP-NOW cifra unicast con **CCMP** usando dos claves:

- **PMK** (Primary Master Key): global, se setea una vez con `esp_now_set_pmk`.
- **LMK** (Local Master Key): por peer, va en la estructura del peer con `encrypt = true`.

Broadcast **no se cifra**. Si el contenido importa, cifrá a nivel aplicación o usá unicast.

## Esqueleto mínimo (Arduino core)

```cpp
#include <esp_now.h>
#include <WiFi.h>

uint8_t peerMac[] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC};

// Core 3.x: la firma del callback de recepción usa esp_now_recv_info_t.
// En core 2.x era (const uint8_t *mac, const uint8_t *data, int len).
void onRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  // Corre en el contexto de la task de WiFi: copiar y salir, NO bloquear.
}

void onSent(const uint8_t *mac, esp_now_send_status_t status) {
  // status == ESP_NOW_SEND_SUCCESS si hubo ACK de la radio.
}

void setup() {
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) return;
  esp_now_register_recv_cb(onRecv);
  esp_now_register_send_cb(onSent);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, peerMac, 6);
  peer.channel = 0;        // 0 = usar el canal actual de la interfaz
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

void loop() {
  const char msg[] = "ping";
  esp_now_send(peerMac, (const uint8_t *)msg, sizeof(msg));
  delay(1000);
}
```

En ESP-IDF puro el flujo es el mismo: `nvs_flash_init` → init de WiFi en STA → `esp_now_init` → callbacks → `esp_now_add_peer` → `esp_now_send`.

## Trampas comunes

- **Canal fijo vs STA que cambia de canal**: si un nodo se asocia a un AP, arrastra el canal. Los peers "sueltos" quedan hablando al vacío.
- **Bloquear en los callbacks**: tanto el de envío como el de recepción corren en el contexto de la task de WiFi. Nada de `delay()`, prints largos ni trabajo pesado: copiá el payload a una cola (FreeRTOS queue) y procesá en otra task.
- **Confundir ACK con entrega a la app**: `ESP_NOW_SEND_SUCCESS` significa que la radio del otro lado confirmó el frame, no que tu lógica lo consumió.
- **Modem sleep**: con WiFi en ahorro de energía, un nodo puede perderse frames. Si la fiabilidad importa, desactivá el power save (`esp_wifi_set_ps(WIFI_PS_NONE)`) o agregá reintentos a nivel aplicación.
- **Structs sin empaquetar**: si mandás structs crudos entre placas, fijá el layout (`__attribute__((packed))`) y no mezcles arquitecturas sin verificar tamaños.
