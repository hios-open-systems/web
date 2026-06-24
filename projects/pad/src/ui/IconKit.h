// ============================================================================
//  IconKit.h - Set de iconos vectoriales unificado para el dashboard, el dock
//  y el menu. Un solo punto de verdad: icon(g, glyph, cx, cy, color).
//
//  Principios:
//    - Grilla comun: todos los glifos viven en una caja ~18px centrada en
//      (cx,cy), asi comparten el MISMO centro visual y peso de linea.
//    - ADITIVO: se dibuja solo lo que se ve. Nada de "tapar con el fondo"
//      (fillRect(bg)) -> se acaba el aspecto a-medio-renderizar.
//    - Arcos reales (strokeArc) para curvas (undo/redo/power/mic/speaker).
//    - Template sobre G: sirve igual para TFT_eSPI y TFT_eSprite.
// ============================================================================
#pragma once
#include <Arduino.h>
#include <math.h>
#include <string.h>
#include "../app/Theme.h"

namespace iconkit {

enum class Glyph : uint8_t {
  GENERIC, COPY, PASTE, UNDO, REDO, MAIL,
  PREV, PLAY, PAUSE, NEXT, MUTE, STOP,
  TERMINAL, COMMAND, COMMENT, RUN, BUILD,
  APP, DESKTOP, LEFT, RIGHT,
  SWATCH_R, SWATCH_G, SWATCH_B, SWATCH_W, POWER,
  MIC, CAMERA, SCREEN, HAND, SPEAKER,
  DIAL, POINTER, LINK,
  RELOAD, PLUS, BOOKMARK
};

// --- helpers de trazo (2px) ---
template <typename G>
inline void ln(G& g, int x0, int y0, int x1, int y1, uint16_t c) {
  g.drawLine(x0, y0, x1, y1, c);
  g.drawLine(x0 + 1, y0, x1 + 1, y1, c);
}
template <typename G>
inline void hln(G& g, int x, int y, int w, uint16_t c) {
  g.drawFastHLine(x, y, w, c);
  g.drawFastHLine(x, y + 1, w, c);
}
template <typename G>
inline void vln(G& g, int x, int y, int h, uint16_t c) {
  g.drawFastVLine(x, y, h, c);
  g.drawFastVLine(x + 1, y, h, c);
}

// Arco de 2px dibujado por segmentos (portatil, sin depender de drawArc).
template <typename G>
inline void strokeArc(G& g, int cx, int cy, int r, float a0, float a1, uint16_t c) {
  const int steps = 16;
  for (int pass = 0; pass < 2; pass++) {
    int rr = r - pass;
    float px = cx + rr * cosf(a0), py = cy + rr * sinf(a0);
    for (int i = 1; i <= steps; i++) {
      float t = a0 + (a1 - a0) * i / steps;
      float x = cx + rr * cosf(t), y = cy + rr * sinf(t);
      g.drawLine((int)px, (int)py, (int)x, (int)y, c);
      px = x; py = y;
    }
  }
}

// Mapea la label de un binding a su glifo.
inline Glyph glyphFor(const char* label) {
  if (!label) return Glyph::GENERIC;
  if (!strcmp(label, "Copiar"))     return Glyph::COPY;
  if (!strcmp(label, "Pegar"))      return Glyph::PASTE;
  if (!strcmp(label, "Deshacer"))   return Glyph::UNDO;
  if (!strcmp(label, "Rehacer"))    return Glyph::REDO;
  if (!strcmp(label, "Email"))      return Glyph::MAIL;
  if (!strcmp(label, "Anterior"))   return Glyph::PREV;
  if (!strcmp(label, "Play"))       return Glyph::PLAY;
  if (!strcmp(label, "Siguiente"))  return Glyph::NEXT;
  if (!strcmp(label, "Mute"))       return Glyph::MUTE;
  if (!strcmp(label, "Stop"))       return Glyph::STOP;
  if (!strcmp(label, "Terminal"))   return Glyph::TERMINAL;
  if (!strcmp(label, "Paleta"))     return Glyph::COMMAND;
  if (!strcmp(label, "Comentar"))   return Glyph::COMMENT;
  if (!strcmp(label, "Run"))        return Glyph::RUN;
  if (!strcmp(label, "Build"))      return Glyph::BUILD;
  if (!strncmp(label, "App", 3))    return Glyph::APP;
  if (!strcmp(label, "Escritorio")) return Glyph::DESKTOP;
  if (!strcmp(label, "Esc <-"))     return Glyph::LEFT;
  if (!strcmp(label, "Esc ->"))     return Glyph::RIGHT;
  if (!strcmp(label, "Rojo"))       return Glyph::SWATCH_R;
  if (!strcmp(label, "Verde"))      return Glyph::SWATCH_G;
  if (!strcmp(label, "Azul"))       return Glyph::SWATCH_B;
  if (!strcmp(label, "Blanco"))     return Glyph::SWATCH_W;
  if (!strcmp(label, "Off"))        return Glyph::POWER;
  if (!strcmp(label, "Mic"))        return Glyph::MIC;
  if (!strcmp(label, "Camara"))     return Glyph::CAMERA;
  if (!strcmp(label, "Pantalla"))   return Glyph::SCREEN;
  if (!strcmp(label, "Mano"))       return Glyph::HAND;
  if (!strcmp(label, "Altavoz"))    return Glyph::SPEAKER;
  if (!strcmp(label, "Atras"))      return Glyph::LEFT;
  if (!strcmp(label, "Adelante"))   return Glyph::RIGHT;
  if (!strcmp(label, "Recargar"))   return Glyph::RELOAD;
  if (!strcmp(label, "Nueva tab"))  return Glyph::PLUS;
  if (!strcmp(label, "Marcadores")) return Glyph::BOOKMARK;
  if (!strcmp(label, "-10s"))       return Glyph::PREV;   // seek atras (YouTube/Netflix)
  if (!strcmp(label, "+10s"))       return Glyph::NEXT;   // seek adelante
  if (!strcmp(label, "Salir"))      return Glyph::POWER;  // salir/colgar llamada
  if (!strcmp(label, "Colgar"))     return Glyph::POWER;
  if (!strcmp(label, "Buscar"))     return Glyph::COMMAND;
  return Glyph::GENERIC;
}

// Dibuja el glifo centrado en (cx,cy) con color col. Aditivo, ~18px.
template <typename G>
void icon(G& g, Glyph gl, int cx, int cy, uint16_t col) {
  switch (gl) {
    case Glyph::COPY:
      g.drawRoundRect(cx - 8, cy - 3, 13, 14, 3, col);
      g.drawRoundRect(cx - 3, cy - 9, 13, 14, 3, col);
      break;
    case Glyph::PASTE:
      g.drawRoundRect(cx - 8, cy - 8, 16, 19, 3, col);
      g.fillRoundRect(cx - 4, cy - 11, 8, 5, 2, col);
      g.drawFastHLine(cx - 4, cy - 2, 8, col);
      g.drawFastHLine(cx - 4, cy + 3, 9, col);
      break;
    case Glyph::UNDO:
      strokeArc(g, cx + 1, cy + 1, 9, -0.4f, 3.6f, col);
      g.fillTriangle(cx - 9, cy - 7, cx - 2, cy - 9, cx - 3, cy - 1, col);
      break;
    case Glyph::REDO:
      strokeArc(g, cx - 1, cy + 1, 9, -2.7f, 3.6f, col);
      g.fillTriangle(cx + 9, cy - 7, cx + 2, cy - 9, cx + 3, cy - 1, col);
      break;
    case Glyph::MAIL:
      g.drawRoundRect(cx - 11, cy - 7, 22, 15, 2, col);
      g.drawLine(cx - 11, cy - 6, cx, cy + 2, col);
      g.drawLine(cx + 11, cy - 6, cx, cy + 2, col);
      break;
    case Glyph::PREV:
      g.fillTriangle(cx + 9, cy - 9, cx + 9, cy + 9, cx - 1, cy, col);
      g.fillTriangle(cx - 1, cy - 9, cx - 1, cy + 9, cx - 9, cy, col);
      break;
    case Glyph::PLAY:
      g.fillTriangle(cx - 7, cy - 10, cx - 7, cy + 10, cx + 9, cy, col);
      break;
    case Glyph::PAUSE:
      g.fillRoundRect(cx - 7, cy - 9, 5, 18, 2, col);
      g.fillRoundRect(cx + 2, cy - 9, 5, 18, 2, col);
      break;
    case Glyph::NEXT:
      g.fillTriangle(cx - 9, cy - 9, cx - 9, cy + 9, cx + 1, cy, col);
      g.fillTriangle(cx + 1, cy - 9, cx + 1, cy + 9, cx + 9, cy, col);
      break;
    case Glyph::MUTE:
      g.fillTriangle(cx - 10, cy - 4, cx - 3, cy - 4, cx + 2, cy - 9, col);
      g.fillTriangle(cx - 10, cy + 4, cx - 3, cy + 4, cx + 2, cy + 9, col);
      g.fillRect(cx - 10, cy - 4, 7, 8, col);
      ln(g, cx + 6, cy - 6, cx + 12, cy + 6, col);
      ln(g, cx + 12, cy - 6, cx + 6, cy + 6, col);
      break;
    case Glyph::STOP:
      g.fillRoundRect(cx - 8, cy - 8, 16, 16, 3, col);
      break;
    case Glyph::TERMINAL:
      g.drawRoundRect(cx - 11, cy - 9, 22, 18, 3, col);
      ln(g, cx - 6, cy - 3, cx - 1, cy + 1, col);
      ln(g, cx - 6, cy + 5, cx - 1, cy + 1, col);
      g.drawFastHLine(cx + 2, cy + 5, 6, col);
      break;
    case Glyph::COMMAND:
      g.drawRoundRect(cx - 5, cy - 5, 10, 10, 2, col);
      g.drawCircle(cx - 9, cy - 9, 3, col);
      g.drawCircle(cx + 9, cy - 9, 3, col);
      g.drawCircle(cx - 9, cy + 9, 3, col);
      g.drawCircle(cx + 9, cy + 9, 3, col);
      break;
    case Glyph::COMMENT:
      ln(g, cx - 7, cy + 8, cx - 1, cy - 8, col);
      ln(g, cx + 2, cy + 8, cx + 8, cy - 8, col);
      break;
    case Glyph::RUN:
      g.drawCircle(cx, cy, 10, col);
      g.fillTriangle(cx - 3, cy - 5, cx - 3, cy + 5, cx + 5, cy, col);
      break;
    case Glyph::BUILD:
      ln(g, cx - 8, cy + 8, cx + 3, cy - 3, col);
      ln(g, cx - 7, cy + 9, cx + 4, cy - 2, col);
      g.fillRoundRect(cx + 1, cy - 10, 9, 7, 2, col);
      break;
    case Glyph::APP:
      g.fillRoundRect(cx - 9, cy - 9, 8, 8, 2, col);
      g.fillRoundRect(cx + 1, cy - 9, 8, 8, 2, col);
      g.fillRoundRect(cx - 9, cy + 1, 8, 8, 2, col);
      g.fillRoundRect(cx + 1, cy + 1, 8, 8, 2, col);
      break;
    case Glyph::DESKTOP:
      g.drawRoundRect(cx - 11, cy - 8, 22, 15, 2, col);
      vln(g, cx - 1, cy + 7, 3, col);
      hln(g, cx - 6, cy + 10, 12, col);
      break;
    case Glyph::LEFT:
      hln(g, cx - 9, cy, 17, col);
      g.fillTriangle(cx - 10, cy, cx - 2, cy - 6, cx - 2, cy + 6, col);
      break;
    case Glyph::RIGHT:
      hln(g, cx - 8, cy, 18, col);
      g.fillTriangle(cx + 10, cy, cx + 2, cy - 6, cx + 2, cy + 6, col);
      break;
    case Glyph::SWATCH_R:
    case Glyph::SWATCH_G:
    case Glyph::SWATCH_B:
    case Glyph::SWATCH_W: {
      uint16_t fill = gl == Glyph::SWATCH_R ? theme::RED
                    : gl == Glyph::SWATCH_G ? theme::GREEN
                    : gl == Glyph::SWATCH_B ? theme::CYAN
                    : theme::FG;
      g.fillCircle(cx, cy, 8, fill);
      g.drawCircle(cx, cy, 10, col);
      break;
    }
    case Glyph::POWER:
      strokeArc(g, cx, cy + 1, 9, -1.05f, 4.2f, col);
      vln(g, cx - 1, cy - 10, 11, col);
      break;
    case Glyph::MIC:
      g.drawRoundRect(cx - 5, cy - 10, 10, 15, 5, col);
      strokeArc(g, cx, cy, 8, 0.2f, 2.94f, col);
      vln(g, cx - 1, cy + 8, 4, col);
      hln(g, cx - 5, cy + 12, 11, col);
      break;
    case Glyph::CAMERA:
      g.drawRoundRect(cx - 10, cy - 7, 15, 14, 2, col);
      g.fillTriangle(cx + 6, cy - 3, cx + 11, cy - 7, cx + 11, cy + 7, col);
      break;
    case Glyph::SCREEN:
      g.drawRoundRect(cx - 11, cy - 8, 22, 15, 2, col);
      vln(g, cx - 1, cy + 7, 3, col);
      hln(g, cx - 6, cy + 10, 12, col);
      g.fillTriangle(cx - 3, cy - 5, cx - 3, cy + 3, cx + 4, cy - 1, col);
      break;
    case Glyph::HAND:
      g.drawRoundRect(cx - 9, cy - 4, 5, 15, 2, col);
      g.drawRoundRect(cx - 3, cy - 9, 5, 20, 2, col);
      g.drawRoundRect(cx + 3, cy - 6, 5, 17, 2, col);
      g.drawRoundRect(cx + 9, cy - 2, 5, 13, 2, col);
      break;
    case Glyph::SPEAKER:
      g.fillTriangle(cx - 10, cy - 5, cx - 4, cy - 5, cx + 1, cy - 11, col);
      g.fillTriangle(cx - 10, cy + 5, cx - 4, cy + 5, cx + 1, cy + 11, col);
      g.fillRect(cx - 10, cy - 5, 6, 10, col);
      strokeArc(g, cx + 3, cy, 6, -0.9f, 0.9f, col);
      strokeArc(g, cx + 3, cy, 10, -0.9f, 0.9f, col);
      break;
    case Glyph::DIAL:
      g.drawCircle(cx, cy, 10, col);
      vln(g, cx - 1, cy - 10, 10, col);
      g.fillCircle(cx, cy, 2, col);
      break;
    case Glyph::POINTER:
      g.fillTriangle(cx - 6, cy - 9, cx - 6, cy + 8, cx + 2, cy + 2, col);
      ln(g, cx, cy + 3, cx + 5, cy + 11, col);
      break;
    case Glyph::LINK:
      g.drawRoundRect(cx - 9, cy - 5, 18, 10, 5, col);
      vln(g, cx - 2, cy - 5, 10, col);
      vln(g, cx + 2, cy - 5, 10, col);
      break;
    case Glyph::RELOAD:                              // refresco: arco ~300 + punta
      strokeArc(g, cx, cy, 9, 0.7f, 5.7f, col);
      g.fillTriangle(cx + 9, cy - 8, cx + 1, cy - 7, cx + 8, cy, col);
      break;
    case Glyph::PLUS:                               // nueva pestana
      vln(g, cx - 1, cy - 9, 19, col);
      hln(g, cx - 9, cy - 1, 19, col);
      break;
    case Glyph::BOOKMARK:                           // cinta de marcador (V abajo)
      vln(g, cx - 7, cy - 10, 17, col);
      vln(g, cx + 6, cy - 10, 17, col);
      hln(g, cx - 7, cy - 10, 15, col);
      ln(g, cx - 7, cy + 8, cx, cy + 2, col);
      ln(g, cx + 7, cy + 8, cx, cy + 2, col);
      break;
    default:
      g.drawCircle(cx, cy, 9, col);
      g.fillCircle(cx, cy, 2, col);
      break;
  }
}

}  // namespace iconkit
