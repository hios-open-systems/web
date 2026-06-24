#include "DefaultConfig.h"
#include "../app/Theme.h"
#include <USBHIDKeyboard.h>   // constantes KEY_* (F-keys, flechas, etc.)
#include <USBHIDMouse.h>      // constante MOUSE_LEFT

// ============================================================================
//  Tabla de textos (snippets que se "tipean")
// ============================================================================
static const char* const TEXTS[] = {
  /* 0 */ "juanjparedez@gmail.com",
  /* 1 */ "-- enviado desde mi control-deck\n",
  /* 2 */ "npm run build\n",
  /* 3 */ "console.log()",
};
static const uint16_t TEXTS_N = sizeof(TEXTS) / sizeof(TEXTS[0]);

const char* textById(uint16_t id) {
  return id < TEXTS_N ? TEXTS[id] : "";
}

// ============================================================================
//  Tabla de macros (secuencias)
// ============================================================================
// Macro 0: "Build" -> abre terminal (Ctrl+`), espera y tipea "npm run build".
static const MacroStep MACRO_BUILD[] = {
  {MacroStep::KEY,   keyAction(kmod::CTRL, '`'), 0},
  {MacroStep::DELAY, Action{},                   250},
  {MacroStep::TEXT,  Action{},                   2},
};

const MacroStep* macroSteps(uint16_t id, uint8_t& count) {
  switch (id) {
    case 0: count = sizeof(MACRO_BUILD) / sizeof(MACRO_BUILD[0]); return MACRO_BUILD;
    default: count = 0; return nullptr;
  }
}

// ============================================================================
//  Capas por defecto
// ============================================================================
void loadDefaults(KeyMap& km) {
  km.clear();

  // --- Capa 0: Edicion (cyan) ---
  int e = km.addLayer("Edicion", theme::CYAN);
  km.bind(e, InputId::BTN_1, keyAction(kmod::CTRL, 'c'), "Copiar");
  km.bind(e, InputId::BTN_2, keyAction(kmod::CTRL, 'v'), "Pegar");
  km.bind(e, InputId::BTN_3, keyAction(kmod::CTRL, 'z'), "Deshacer");
  km.bind(e, InputId::BTN_4, keyAction(kmod::CTRL | kmod::SHIFT, 'z'), "Rehacer");
  km.bind(e, InputId::BTN_5, textAction(0), "Email");
  km.bindRotate(e, mouseAction(MouseMode::SCROLL_FROM_ENC, 0, 0, 1),
                   mouseAction(MouseMode::SCROLL_FROM_ENC, 0, 0, -1), "Scroll");
  km.bind(e, InputId::ENC_SW, Action{}, "Menu");   // encoder press = menu (navegacion)
  km.bind(e, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 1: Multimedia (magenta) ---
  int m = km.addLayer("Multimedia", theme::MAGENTA);
  km.bind(m, InputId::BTN_1, mediaAction(MediaUsage::PREV), "Anterior");
  km.bind(m, InputId::BTN_2, mediaAction(MediaUsage::PLAY_PAUSE), "Play", Action{}, StateToggle::MEDIA);
  km.bind(m, InputId::BTN_3, mediaAction(MediaUsage::NEXT), "Siguiente");
  km.bind(m, InputId::BTN_4, mediaAction(MediaUsage::MUTE), "Mute");
  km.bind(m, InputId::BTN_5, mediaAction(MediaUsage::STOP), "Stop");
  km.bindRotate(m, mediaAction(MediaUsage::VOL_UP),
                   mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(m, InputId::ENC_SW, Action{}, "Menu");
  km.bind(m, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 2: Dev (verde) ---
  int d = km.addLayer("Dev", theme::GREEN);
  km.bind(d, InputId::BTN_1, keyAction(kmod::CTRL, '`'), "Terminal");
  km.bind(d, InputId::BTN_2, keyAction(kmod::CTRL | kmod::SHIFT, 'p'), "Paleta");
  km.bind(d, InputId::BTN_3, keyAction(kmod::CTRL, '/'), "Comentar");
  km.bind(d, InputId::BTN_4, keyCode(0, KEY_F5), "Run");
  km.bind(d, InputId::BTN_5, macroAction(0), "Build");
  km.bindRotate(d, keyAction(kmod::CTRL, '='),
                   keyAction(kmod::CTRL, '-'), "Zoom");
  km.bind(d, InputId::ENC_SW, Action{}, "Menu");
  km.bind(d, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 3: Apps / Ventanas (naranja) ---
  int a = km.addLayer("Apps", theme::ORANGE);
  km.bind(a, InputId::BTN_1, keyCode(kmod::GUI, '1'), "App 1");
  km.bind(a, InputId::BTN_2, keyCode(kmod::GUI, '2'), "App 2");
  km.bind(a, InputId::BTN_3, keyCode(kmod::GUI, 'd'), "Escritorio");
  km.bind(a, InputId::BTN_4, keyCode(kmod::GUI | kmod::CTRL, KEY_LEFT_ARROW), "Esc <-");
  km.bind(a, InputId::BTN_5, keyCode(kmod::GUI | kmod::CTRL, KEY_RIGHT_ARROW), "Esc ->");
  km.bindRotate(a, mouseAction(MouseMode::SCROLL_FROM_ENC, 0, 0, 1),
                   mouseAction(MouseMode::SCROLL_FROM_ENC, 0, 0, -1), "Scroll");
  km.bind(a, InputId::ENC_SW, Action{}, "Menu");
  km.bind(a, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 4: RGB (violeta) -> OpenRGB via atajos (ver host/openrgb-rgb-layer.ahk) ---
  // Cada control manda un atajo Ctrl+Alt+Shift+X que el script de la PC traduce
  // a un comando de OpenRGB. Combos raros a proposito, para no chocar con apps.
  const uint8_t RGBM = kmod::CTRL | kmod::ALT | kmod::SHIFT;
  int r = km.addLayer("RGB", theme::VIOLET);
  km.bind(r, InputId::BTN_1, keyAction(RGBM, 'r'), "Rojo");
  km.bind(r, InputId::BTN_2, keyAction(RGBM, 'g'), "Verde");
  km.bind(r, InputId::BTN_3, keyAction(RGBM, 'b'), "Azul");
  km.bind(r, InputId::BTN_4, keyAction(RGBM, 'w'), "Blanco");
  km.bind(r, InputId::BTN_5, keyAction(RGBM, 'o'), "Off");
  km.bindRotate(r, keyCode(RGBM, KEY_UP_ARROW), keyCode(RGBM, KEY_DOWN_ARROW), "Brillo");
  km.bind(r, InputId::ENC_SW, Action{}, "Menu");
  km.bind(r, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 5: Calls (coral) -> atajos de Zoom + mute de parlantes del sistema ---
  // Mic mute es app-especifico (default Zoom = Alt+A). Para que ande sin foco en
  // Zoom, activa "atajos globales" en Zoom (Settings -> Keyboard Shortcuts).
  // Si usas Meet/Teams/Discord, avisame y cambio los atajos.
  int c = km.addLayer("Calls", theme::ROSE);
  km.bind(c, InputId::BTN_1, keyAction(kmod::ALT, 'a'), "Mic", Action{}, StateToggle::MIC);  // Zoom: mute mic
  km.bind(c, InputId::BTN_2, keyAction(kmod::ALT, 'v'), "Camara", Action{}, StateToggle::CAMERA);  // Zoom: video on/off
  km.bind(c, InputId::BTN_3, keyAction(kmod::ALT, 's'), "Pantalla");   // Zoom: compartir
  km.bind(c, InputId::BTN_4, keyAction(kmod::ALT, 'y'), "Mano");       // Zoom: levantar mano
  km.bind(c, InputId::BTN_5, mediaAction(MediaUsage::MUTE), "Altavoz"); // mute parlantes (sistema)
  km.bindRotate(c, mediaAction(MediaUsage::VOL_UP),
                   mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(c, InputId::ENC_SW, Action{}, "Menu");
  km.bind(c, InputId::STICK_SW, mouseToggleAction(), "Mouse");
}
