#pragma once
#include <Arduino.h>
#include <TFT_eSPI.h>
#include "../app/Theme.h"

namespace uikit {

struct Rect {
  int x;
  int y;
  int w;
  int h;
};

struct Tone {
  uint16_t bg;
  uint16_t fg;
  uint16_t soft;
  uint16_t edge;
  uint16_t accent;
};

inline Tone tone(uint16_t accent) {
  return {theme::BG, theme::FG, theme::SOFT, theme::EDGE, accent};
}

template <typename G>
void card(G& g, const Rect& r, uint16_t fill, uint16_t stroke, uint8_t radius = 8) {
  g.fillRoundRect(r.x + 3, r.y + 4, r.w, r.h, radius, theme::blend(theme::BG, theme::DARK, 80));
  g.fillRoundRect(r.x, r.y, r.w, r.h, radius, fill);
  g.drawRoundRect(r.x, r.y, r.w, r.h, radius, stroke);
}

template <typename G>
void chip(G& g, const Rect& r, const char* text, uint16_t fill, uint16_t fg, uint16_t stroke) {
  g.fillRoundRect(r.x, r.y, r.w, r.h, r.h / 2, fill);
  g.drawRoundRect(r.x, r.y, r.w, r.h, r.h / 2, stroke);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(fg, fill);
  g.drawString(text, r.x + r.w / 2, r.y + r.h / 2, 1);
}

// Pildora redondeada con texto centrado y fuente configurable.
template <typename G>
void pill(G& g, const Rect& r, const char* text, uint16_t fill, uint16_t fg,
          uint16_t stroke, uint8_t font = 2) {
  g.fillRoundRect(r.x, r.y, r.w, r.h, r.h / 2, fill);
  if (stroke != fill) g.drawRoundRect(r.x, r.y, r.w, r.h, r.h / 2, stroke);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(fg, fill);
  g.drawString(text, r.x + r.w / 2, r.y + r.h / 2 + 1, font);
}

// Etiqueta rectangular pequena (ej: numero de tecla).
template <typename G>
void badge(G& g, const Rect& r, const char* text, uint16_t fill, uint16_t fg,
           uint8_t radius = 5, uint8_t font = 2) {
  g.fillRoundRect(r.x, r.y, r.w, r.h, radius, fill);
  g.setTextDatum(MC_DATUM);
  g.setTextColor(fg, fill);
  g.drawString(text, r.x + r.w / 2, r.y + r.h / 2 + 1, font);
}

// "Pozo" circular detras de un icono: le da a TODOS los iconos el mismo centro
// y tamano visual, sin importar la altura interna del glifo.
template <typename G>
void iconWell(G& g, int cx, int cy, int radius, uint16_t fill) {
  g.fillCircle(cx, cy, radius, fill);
}

template <typename G>
void progress(G& g, const Rect& r, uint8_t pct, uint16_t fill, uint16_t track) {
  if (pct > 100) pct = 100;
  g.fillRoundRect(r.x, r.y, r.w, r.h, r.h / 2, track);
  int w = (int)pct * (r.w - 4) / 100;
  if (w > 0) g.fillRoundRect(r.x + 2, r.y + 2, w, r.h - 4, (r.h - 4) / 2, fill);
}

template <typename G>
void fitText(G& g, const char* text, int cx, int cy, int maxw, uint16_t fg, uint16_t bg, uint8_t font = 2) {
  char buf[18];
  strncpy(buf, text ? text : "", sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = '\0';
  while (strlen(buf) > 0 && g.textWidth(buf, font) > maxw) {
    size_t n = strlen(buf);
    if (n <= 3) break;
    buf[n - 1] = '\0';
    buf[n - 2] = '.';
    buf[n - 3] = '.';
  }
  g.setTextDatum(MC_DATUM);
  g.setTextColor(fg, bg);
  g.drawString(buf, cx, cy, font);
}

}  // namespace uikit
