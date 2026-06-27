// ============================================================================
//  Layout.h - Tokens de layout del dashboard (480x320, rotacion 1).
//  Fuente UNICA de verdad de posiciones y tamanos: la UI nunca vuelve a usar
//  numeros magicos sueltos. Cambiar el ritmo vertical = tocar esto y nada mas.
//
//  Bandas verticales:
//    header   0   .. 52   (panel + linea de acento de 2px)
//    keycaps  54  .. 258  (10 teclas en 2 filas x 5)
//    encoder  266 .. 312  (franja de 4 segmentos)
// ============================================================================
#pragma once
#include <stdint.h>

namespace layout {

constexpr int16_t W = 480;
constexpr int16_t H = 320;
constexpr int16_t MARGIN = 8;

// --- Header ---
constexpr int16_t HEADER_H   = 50;   // alto del panel (fila de estado + reloj)
constexpr int16_t HEADER_ACC = 2;    // grosor de la linea de acento inferior

// --- Keycaps: 10 acciones en DOBLE FILA (2 filas x 5 columnas) ---
constexpr int16_t KC_X0   = 9;
constexpr int16_t KC_W    = 86;
constexpr int16_t KC_GAP  = 8;        // separacion horizontal (5*86 + 4*8 = 462)
constexpr int16_t KC_COLS = 5;
constexpr int16_t KC_ROWS = 2;
constexpr int16_t KC_COUNT = KC_COLS * KC_ROWS;   // 10
constexpr int16_t KC_Y    = 54;       // top de la fila 0
constexpr int16_t KC_H    = 98;       // alto de cada keycap
constexpr int16_t KC_VGAP = 8;        // separacion vertical entre filas (fila1 = 160..258)
inline int16_t kcX(int i) { return KC_X0 + (i % KC_COLS) * (KC_W + KC_GAP); }
inline int16_t kcY(int i) { return KC_Y  + (i / KC_COLS) * (KC_H + KC_VGAP); }

// Posiciones internas de una keycap (relativas a su esquina sup-izq). Compactas p/ 2 filas.
constexpr int16_t KC_BADGE_DY = 7;          // y del badge de numero
constexpr int16_t KC_ICON_DY  = 41;         // centro del well/icono
constexpr int16_t KC_LABEL_DY = KC_H - 19;  // centro de la label

// --- Iconos ---
constexpr int16_t ICON_WELL_R = 19;   // radio del "pozo" detras del icono (compacto)
constexpr int16_t ICON_SIZE   = 16;   // caja nominal del glifo (chico, centrado)

// --- Bottom bar (4 segmentos SIEMPRE separados: nunca se reusa el lugar) ---
constexpr int16_t ENC_Y = 266;        // bajada al fondo (antes franja del medio)
constexpr int16_t ENC_H = 46;         // 266..312
constexpr int16_t ENC_S1_X = 9,   ENC_S1_W = 171;   // modo del encoder + dial
constexpr int16_t ENC_S2_X = 186, ENC_S2_W = 92;    // companion (compacto)
constexpr int16_t ENC_S3_X = 284, ENC_S3_W = 110;   // mouse / stick box
constexpr int16_t ENC_S4_X = 400, ENC_S4_W = 71;    // VOLUMEN (box propio, siempre visible)

// --- Dock de estado (5 tiles uniformes) ---
constexpr int16_t DOCK_Y = 232;
constexpr int16_t DOCK_H = 82;
constexpr int16_t TILE_X0  = 8;
constexpr int16_t TILE_W   = 86;
constexpr int16_t TILE_GAP = 8;
constexpr int16_t TILE_COUNT = 5;
inline int16_t tileX(int i) { return TILE_X0 + i * (TILE_W + TILE_GAP); }

}  // namespace layout
