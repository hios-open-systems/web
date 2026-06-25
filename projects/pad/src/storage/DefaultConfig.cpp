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
  int e = km.addLayer("Edicion", theme::CYAN, LayerGroup::TRABAJO);
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
  int m = km.addLayer("Multimedia", theme::MAGENTA, LayerGroup::MULTIMEDIA);
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
  int d = km.addLayer("Dev", theme::GREEN, LayerGroup::TRABAJO);
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
  int a = km.addLayer("Apps", theme::ORANGE, LayerGroup::TRABAJO);
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
  int r = km.addLayer("RGB", theme::VIOLET, LayerGroup::SISTEMA);
  km.bind(r, InputId::BTN_1, keyAction(RGBM, 'r'), "Rojo");
  km.bind(r, InputId::BTN_2, keyAction(RGBM, 'g'), "Verde");
  km.bind(r, InputId::BTN_3, keyAction(RGBM, 'b'), "Azul");
  km.bind(r, InputId::BTN_4, keyAction(RGBM, 'w'), "Blanco");
  km.bind(r, InputId::BTN_5, keyAction(RGBM, 'o'), "Off");
  km.bindRotate(r, keyCode(RGBM, KEY_UP_ARROW), keyCode(RGBM, KEY_DOWN_ARROW), "Brillo");
  km.bind(r, InputId::ENC_SW, Action{}, "Menu");
  km.bind(r, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: WiZ (amarillo) -> control de luces WiZ por UDP via companion ---
  int wz = km.addLayer("WiZ", theme::YELLOW, LayerGroup::SISTEMA);
  km.bind(wz, InputId::BTN_1, netCmdAction(CompanionCmd::WIZ_TOGGLE),     "On/Off");
  km.bind(wz, InputId::BTN_2, netCmdAction(CompanionCmd::WIZ_ROOM_NEXT),  "Cuarto");
  km.bind(wz, InputId::BTN_3, netCmdAction(CompanionCmd::WIZ_WARMER),     "Calido");
  km.bind(wz, InputId::BTN_4, netCmdAction(CompanionCmd::WIZ_COOLER),     "Frio");
  km.bind(wz, InputId::BTN_5, netCmdAction(CompanionCmd::WIZ_LIGHT_NEXT), "Luz");
  km.bindRotate(wz, netCmdAction(CompanionCmd::WIZ_BRIGHT_UP), netCmdAction(CompanionCmd::WIZ_BRIGHT_DOWN), "Brillo");
  km.bind(wz, InputId::ENC_SW, Action{}, "Menu");
  km.bind(wz, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // === Grupo Llamadas: una capa por app. En TODAS, el long-press del boton de
  //     mic (hold) hace MUTE GLOBAL via companion (Core Audio, app-independiente);
  //     el tap usa el atajo de la app. La camara se togglea con el atajo de la app.

  // --- Capa: Meet (verde) -> atajos web de Google Meet (Chrome) ---
  int mt = km.addLayer("Meet", theme::GREEN, LayerGroup::LLAMADAS);
  km.bind(mt, InputId::BTN_1, keyAction(kmod::CTRL, 'd'), "Mic", Action{}, StateToggle::MIC);      // Ctrl+D
  km.bind(mt, InputId::BTN_2, keyAction(kmod::CTRL, 'e'), "Camara", Action{}, StateToggle::CAMERA);// Ctrl+E
  km.bind(mt, InputId::BTN_3, keyAction(kmod::CTRL | kmod::ALT, 'h'), "Mano");                     // Ctrl+Alt+H
  km.bindRotate(mt, mediaAction(MediaUsage::VOL_UP), mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(mt, InputId::ENC_SW, Action{}, "Menu");
  km.bind(mt, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Slack (violeta) -> huddles. Sin atajo de mic: el tap usa el mute
  //     global del companion (igual que el hold). ---
  int sl = km.addLayer("Slack", theme::VIOLET, LayerGroup::LLAMADAS);
  km.bind(sl, InputId::BTN_1, netCmdAction(CompanionCmd::MIC_TOGGLE), "Mic", Action{}, StateToggle::MIC);
  km.bind(sl, InputId::BTN_2, keyAction(kmod::CTRL, 'k'), "Buscar");                               // Ctrl+K quick switcher
  km.bindRotate(sl, mediaAction(MediaUsage::VOL_UP), mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(sl, InputId::ENC_SW, Action{}, "Menu");
  km.bind(sl, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Zoom (cyan). Requiere "global shortcuts" ON en Zoom para andar sin foco. ---
  int zm = km.addLayer("Zoom", theme::CYAN, LayerGroup::LLAMADAS);
  km.bind(zm, InputId::BTN_1, keyAction(kmod::ALT, 'a'), "Mic", Action{}, StateToggle::MIC);       // Alt+A
  km.bind(zm, InputId::BTN_2, keyAction(kmod::ALT, 'v'), "Camara", Action{}, StateToggle::CAMERA); // Alt+V
  km.bind(zm, InputId::BTN_3, keyAction(kmod::ALT, 's'), "Pantalla");                              // Alt+S compartir
  km.bind(zm, InputId::BTN_4, keyAction(kmod::ALT, 'y'), "Mano");                                  // Alt+Y
  km.bind(zm, InputId::BTN_5, keyAction(kmod::ALT, 'q'), "Salir");                                 // Alt+Q
  km.bindRotate(zm, mediaAction(MediaUsage::VOL_UP), mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(zm, InputId::ENC_SW, Action{}, "Menu");
  km.bind(zm, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Teams (naranja) -> atajos de Microsoft Teams ---
  int tm = km.addLayer("Teams", theme::ORANGE, LayerGroup::LLAMADAS);
  km.bind(tm, InputId::BTN_1, keyAction(kmod::CTRL | kmod::SHIFT, 'm'), "Mic", Action{}, StateToggle::MIC);      // Ctrl+Shift+M
  km.bind(tm, InputId::BTN_2, keyAction(kmod::CTRL | kmod::SHIFT, 'o'), "Camara", Action{}, StateToggle::CAMERA);// Ctrl+Shift+O
  km.bind(tm, InputId::BTN_3, keyAction(kmod::CTRL | kmod::SHIFT, 'k'), "Mano");                                 // Ctrl+Shift+K
  km.bind(tm, InputId::BTN_4, keyAction(kmod::CTRL | kmod::SHIFT, 'e'), "Pantalla");                             // Ctrl+Shift+E compartir
  km.bind(tm, InputId::BTN_5, keyAction(kmod::CTRL | kmod::SHIFT, 'b'), "Colgar");                               // Ctrl+Shift+B
  km.bindRotate(tm, mediaAction(MediaUsage::VOL_UP), mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(tm, InputId::ENC_SW, Action{}, "Menu");
  km.bind(tm, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 6: Navegador (azul) -> atajos del navegador (back/forward/tabs/marcadores) ---
  // Atajos estandar de Chrome/Firefox/Edge. El stick (Mouse) sirve para clickear links.
  int n = km.addLayer("Navegador", theme::BLUE, LayerGroup::WEB);
  km.bind(n, InputId::BTN_1, keyCode(kmod::ALT, KEY_LEFT_ARROW), "Atras");       // Alt+Left
  km.bind(n, InputId::BTN_2, keyCode(kmod::ALT, KEY_RIGHT_ARROW), "Adelante");   // Alt+Right
  km.bind(n, InputId::BTN_3, keyAction(kmod::CTRL, 'r'), "Recargar");            // Ctrl+R
  km.bind(n, InputId::BTN_4, keyAction(kmod::CTRL, 't'), "Nueva tab");           // Ctrl+T
  km.bind(n, InputId::BTN_5, keyAction(kmod::CTRL | kmod::SHIFT, 'o'), "Marcadores"); // Ctrl+Shift+O
  km.bindRotate(n, keyCode(kmod::CTRL, KEY_PAGE_DOWN),
                   keyCode(kmod::CTRL, KEY_PAGE_UP), "Pestanas");                // cambiar pestana
  km.bind(n, InputId::ENC_SW, Action{}, "Menu");
  km.bind(n, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 7: YouTube (rojo) -> atajos del reproductor de YouTube (web) ---
  int yt = km.addLayer("YouTube", theme::RED, LayerGroup::MULTIMEDIA);
  km.bind(yt, InputId::BTN_1, keyAction(0, 'k'), "Play");        // k = play/pausa
  km.bind(yt, InputId::BTN_2, keyAction(0, 'j'), "-10s");        // j = atras 10s
  km.bind(yt, InputId::BTN_3, keyAction(0, 'l'), "+10s");        // l = adelante 10s
  km.bind(yt, InputId::BTN_4, keyAction(0, 'f'), "Pantalla");    // f = pantalla completa
  km.bind(yt, InputId::BTN_5, keyAction(0, 'm'), "Mute");        // m = silenciar
  km.bindRotate(yt, mediaAction(MediaUsage::VOL_UP),
                    mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(yt, InputId::ENC_SW, Action{}, "Menu");
  km.bind(yt, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa 8: Netflix (purpura) -> atajos del reproductor de Netflix ---
  int nf = km.addLayer("Netflix", theme::PURPLE, LayerGroup::MULTIMEDIA);
  km.bind(nf, InputId::BTN_1, keyCode(0, ' '), "Play");                  // espacio = play/pausa
  km.bind(nf, InputId::BTN_2, keyCode(0, KEY_LEFT_ARROW), "-10s");       // <- atras 10s
  km.bind(nf, InputId::BTN_3, keyCode(0, KEY_RIGHT_ARROW), "+10s");      // -> adelante 10s
  km.bind(nf, InputId::BTN_4, keyAction(0, 'f'), "Pantalla");            // f = pantalla completa
  km.bind(nf, InputId::BTN_5, keyAction(0, 'm'), "Mute");                // m = silenciar
  km.bindRotate(nf, mediaAction(MediaUsage::VOL_UP),
                    mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(nf, InputId::ENC_SW, Action{}, "Menu");
  km.bind(nf, InputId::STICK_SW, mouseToggleAction(), "Mouse");
}
