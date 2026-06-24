// ============================================================================
//  Layout.h - Tokens de layout del dashboard (480x320, rotacion 1).
//  Fuente UNICA de verdad de posiciones y tamanos: la UI nunca vuelve a usar
//  numeros magicos sueltos. Cambiar el ritmo vertical = tocar esto y nada mas.
//
//  Bandas verticales:
//    header   0   .. 46   (panel + linea de acento de 2px)
//    keycaps  54  .. 186  (5 teclas)
//    encoder  192 .. 226  (franja de 3 segmentos)
//    dock     232 .. 314  (5 tiles de estado)
// ============================================================================
#pragma once
#include <stdint.h>

namespace layout {

constexpr int16_t W = 480;
constexpr int16_t H = 320;
constexpr int16_t MARGIN = 8;

// --- Header ---
constexpr int16_t HEADER_H   = 44;   // alto del panel
constexpr int16_t HEADER_ACC = 2;    // grosor de la linea de acento inferior

// --- Keycaps ---
constexpr int16_t KC_X0  = 9;
constexpr int16_t KC_W   = 86;
constexpr int16_t KC_GAP = 8;
constexpr int16_t KC_Y   = 54;
constexpr int16_t KC_H   = 132;
constexpr int16_t KC_COUNT = 5;
inline int16_t kcX(int i) { return KC_X0 + i * (KC_W + KC_GAP); }

// Posiciones internas de una keycap (relativas a KC_Y).
constexpr int16_t KC_BADGE_DY = 9;    // y del badge de numero
constexpr int16_t KC_ICON_DY  = 62;   // centro del well/icono
constexpr int16_t KC_LABEL_DY = KC_H - 22;  // centro de la label

// --- Iconos ---
constexpr int16_t ICON_WELL_R = 27;   // radio del "pozo" detras del icono
constexpr int16_t ICON_SIZE   = 18;   // caja nominal del glifo (chico, centrado)

// --- Franja del encoder (3 segmentos) ---
constexpr int16_t ENC_Y = 192;
constexpr int16_t ENC_H = 34;
constexpr int16_t ENC_S1_X = 9,   ENC_S1_W = 171;   // modo del encoder
constexpr int16_t ENC_S2_X = 188, ENC_S2_W = 104;   // press = menu
constexpr int16_t ENC_S3_X = 300, ENC_S3_W = 171;   // estado del stick

// --- Dock de estado (5 tiles uniformes) ---
constexpr int16_t DOCK_Y = 232;
constexpr int16_t DOCK_H = 82;
constexpr int16_t TILE_X0  = 8;
constexpr int16_t TILE_W   = 86;
constexpr int16_t TILE_GAP = 8;
constexpr int16_t TILE_COUNT = 5;
inline int16_t tileX(int i) { return TILE_X0 + i * (TILE_W + TILE_GAP); }

}  // namespace layout
