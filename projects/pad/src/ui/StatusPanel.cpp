// ============================================================================
//  StatusPanel - Dock de estado inferior como TFT_eSprite 8-bit (sin parpadeo).
//  5 tiles de ancho UNIFORME: Mic / Camara / Media / Volumen / Enlace.
//  (El estado del mouse/stick vive en la franja del encoder, no se duplica.)
//  Dirty-check: solo re-renderiza y hace pushSprite cuando cambia algo.
// ============================================================================
#include "StatusPanel.h"
#include <Arduino.h>
#include "../app/Theme.h"
#include "Layout.h"
#include "IconKit.h"

namespace statuspanel {

static const int PX = 0, PY = layout::DOCK_Y, PW = layout::W, PH = layout::DOCK_H;

static TFT_eSprite* sp = nullptr;
static bool        s_ok = false;
static bool        s_force = true;
static UiSnapshot  s_prev;
static bool        s_havePrev = false;

static const int TY = 4;                 // inset vertical del tile dentro del sprite
static const int TH = PH - 8;            // alto del tile
static const int ICON_CY = TY + 26;      // centro vertical del icono
static const int LABEL_CY = TY + TH - 13;// centro vertical de la label

void begin(TFT_eSPI& tft) {
  sp = new TFT_eSprite(&tft);
  sp->setTextFont(1);                         // gfxFont=NULL: el ctor de TFT_eSprite no lo inicializa (heap basura -> crash)
  sp->setColorDepth(8);                       // 8-bit (RGB332) -> 1 byte/pixel
  if (sp->createSprite(PW, PH)) s_ok = true;  // 480x82 ~= 39 KB
  s_force = true;
  Serial.printf("[panel] sprite %s, heap libre=%u\n", s_ok ? "OK" : "FALLO", (unsigned)ESP.getFreeHeap());
}

void forceRedraw() { s_force = true; }

static int tileX(int i)  { return layout::tileX(i) - PX; }
static int tileCx(int i) { return tileX(i) + layout::TILE_W / 2; }

static void tile(int i, uint16_t stroke, uint16_t fill) {
  sp->fillRoundRect(tileX(i), TY, layout::TILE_W, TH, 10, fill);
  sp->drawRoundRect(tileX(i), TY, layout::TILE_W, TH, 10, stroke);
}

static void tileLabel(int i, const char* s, uint16_t col, uint16_t bg) {
  sp->setTextDatum(MC_DATUM);
  sp->setTextColor(col, bg);
  sp->drawString(s, tileCx(i), LABEL_CY, 1);
}

// Cruz roja sobre un icono "apagado" (mic/camara muteados).
static void slash(int cx, int cy) {
  iconkit::ln(*sp, cx - 11, cy - 10, cx + 11, cy + 10, theme::RED);
}

static bool changed(const UiSnapshot& s) {
  if (!s_havePrev) return true;
  return s.micMuted != s_prev.micMuted || s.mediaPlay != s_prev.mediaPlay ||
         s.volume != s_prev.volume || s.transports != s_prev.transports ||
         s.camOff != s_prev.camOff || s.battery != s_prev.battery ||
         s.wifiOff != s_prev.wifiOff;
}

void render(TFT_eSPI& tft, const UiSnapshot& s, uint8_t layerCount) {
  (void)layerCount;
  if (!s_ok) return;
  if (!s_force && !changed(s)) return;
  s_force = false;
  s_prev = s; s_havePrev = true;

  sp->fillSprite(theme::BG);

  // 0: microfono
  uint16_t micC = s.micMuted ? theme::RED : theme::GREEN;
  tile(0, micC, theme::DARK);
  iconkit::icon(*sp, iconkit::Glyph::MIC, tileCx(0), ICON_CY, micC);
  if (s.micMuted) slash(tileCx(0), ICON_CY);
  tileLabel(0, s.micMuted ? "mute" : "abierto", micC, theme::DARK);

  // 1: camara (estado optimista, ahora cableado en la capa Calls)
  uint16_t camC = s.camOff ? theme::RED : theme::GREEN;
  tile(1, camC, theme::DARK);
  iconkit::icon(*sp, iconkit::Glyph::CAMERA, tileCx(1), ICON_CY, camC);
  if (s.camOff) slash(tileCx(1), ICON_CY);
  tileLabel(1, s.camOff ? "off" : "on", camC, theme::DARK);

  // 2: media play/pausa
  uint16_t medC = s.mediaPlay ? theme::GREEN : theme::YELLOW;
  tile(2, medC, theme::DARK);
  iconkit::icon(*sp, s.mediaPlay ? iconkit::Glyph::PLAY : iconkit::Glyph::PAUSE, tileCx(2), ICON_CY, medC);
  tileLabel(2, s.mediaPlay ? "play" : "pausa", medC, theme::DARK);

  // 3: volumen (valor + barra)
  {
    int x = tileX(3), w = layout::TILE_W;
    sp->fillRoundRect(x, TY, w, TH, 10, theme::PANEL);
    sp->drawRoundRect(x, TY, w, TH, 10, theme::EDGE);
    sp->setTextDatum(MC_DATUM);
    sp->setTextColor(theme::DIM, theme::PANEL);
    sp->drawString("VOL", x + w / 2, TY + 13, 1);
    char vb[8]; snprintf(vb, sizeof(vb), "%u%%", s.volume);
    sp->setTextColor(theme::FG, theme::PANEL);
    sp->drawString(vb, x + w / 2, TY + 33, 2);
    int bx = x + 12, by = TY + TH - 14, bw = w - 24, bh = 6;
    sp->fillRoundRect(bx, by, bw, bh, 3, theme::DARK);
    sp->fillRoundRect(bx + 1, by + 1, (int)s.volume * (bw - 2) / 100, bh - 2, 2, theme::CYAN);
  }

  // 4: enlace / transporte
  bool wifi = s.transports & tport::WIFI;
  bool usb = s.transports & tport::USB;
  bool ble = s.transports & tport::BLE;
  uint16_t linkC = wifi ? theme::CYAN : (ble ? theme::MAGENTA : (usb ? theme::GREEN : theme::DIM));
  tile(4, (usb || ble || wifi) ? linkC : theme::EDGE, theme::DARK);
  iconkit::icon(*sp, iconkit::Glyph::LINK, tileCx(4), ICON_CY, linkC);
  if (s.wifiOff) slash(tileCx(4), ICON_CY);   // WiFi apagado por el usuario (aviso)
  tileLabel(4, s.wifiOff ? "WiFi off" : (wifi ? "WiFi" : (ble ? "BLE" : (usb ? "USB" : "off"))),
            s.wifiOff ? theme::ORANGE : linkC, theme::DARK);

  sp->pushSprite(PX, PY);
}

}  // namespace statuspanel
