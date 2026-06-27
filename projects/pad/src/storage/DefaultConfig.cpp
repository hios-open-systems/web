#include "DefaultConfig.h"
#include "../app/Theme.h"
#include "../app/Config.h"    // defaults de ALT (ALT1_LAYER/ALT2_LAYER/ALT_LINGER_MS)
#include <USBHIDKeyboard.h>   // constantes KEY_* (F-keys, flechas, etc.)
#include <USBHIDMouse.h>      // constante MOUSE_LEFT

// ============================================================================
//  Tablas RUNTIME de textos + macros (poblables desde JSON via ConfigCodec).
// ============================================================================
static constexpr uint16_t MAX_TEXTS = 24, TEXT_LEN = 80;
static constexpr uint16_t MAX_MACROS = 24, MAX_STEPS = 16;

static char      s_texts[MAX_TEXTS][TEXT_LEN];
static uint16_t  s_textCount = 0;
static MacroStep s_steps[MAX_MACROS][MAX_STEPS];
static uint8_t   s_stepCount[MAX_MACROS] = {0};
static char      s_macroLbl[MAX_MACROS][LABEL_LEN];
static uint16_t  s_macroCount = 0;

void clearMacrosTexts() { s_textCount = 0; s_macroCount = 0; }

bool addText(const char* s) {
  if (s_textCount >= MAX_TEXTS) return false;
  strncpy(s_texts[s_textCount], s ? s : "", TEXT_LEN - 1);
  s_texts[s_textCount][TEXT_LEN - 1] = '\0';
  s_textCount++;
  return true;
}

int addMacro(const char* label) {
  if (s_macroCount >= MAX_MACROS) return -1;
  int id = s_macroCount++;
  s_stepCount[id] = 0;
  strncpy(s_macroLbl[id], label ? label : "", LABEL_LEN - 1);
  s_macroLbl[id][LABEL_LEN - 1] = '\0';
  return id;
}

bool addMacroStep(uint16_t id, const MacroStep& step) {
  if (id >= s_macroCount || s_stepCount[id] >= MAX_STEPS) return false;
  s_steps[id][s_stepCount[id]++] = step;
  return true;
}

uint16_t    textCount()           { return s_textCount; }
uint16_t    macroCount()          { return s_macroCount; }
const char* macroLabel(uint16_t id) { return id < s_macroCount ? s_macroLbl[id] : ""; }
const char* textById(uint16_t id)   { return id < s_textCount  ? s_texts[id]    : ""; }

const MacroStep* macroSteps(uint16_t id, uint8_t& count) {
  if (id < s_macroCount) { count = s_stepCount[id]; return s_steps[id]; }
  count = 0; return nullptr;
}

// --- ALT momentaneos (que capa abre cada uno + linger) ---
static char     s_alt1[LABEL_LEN] = "";
static char     s_alt2[LABEL_LEN] = "";
static uint32_t s_altLinger = 600;
void setAltConfig(const char* a1, const char* a2, uint32_t lingerMs) {
  strncpy(s_alt1, a1 ? a1 : "", LABEL_LEN - 1); s_alt1[LABEL_LEN - 1] = '\0';
  strncpy(s_alt2, a2 ? a2 : "", LABEL_LEN - 1); s_alt2[LABEL_LEN - 1] = '\0';
  s_altLinger = lingerMs;
}
void        seedDefaultAlt() { setAltConfig(cfg::ALT1_LAYER, cfg::ALT2_LAYER, cfg::ALT_LINGER_MS); }
const char* altLayer1() { return s_alt1; }
const char* altLayer2() { return s_alt2; }
uint32_t    altLinger() { return s_altLinger; }

// Defaults compilados (fallback / seed para la primera vez).
void seedDefaultMacrosTexts() {
  clearMacrosTexts();
  addText("juanjparedez@gmail.com");
  addText("-- enviado desde mi control-deck\n");
  addText("npm run build\n");
  addText("console.log()");
  int b = addMacro("Build");                                  // macro 0
  addMacroStep(b, {MacroStep::KEY,   keyAction(kmod::CTRL, '`'), 0});
  addMacroStep(b, {MacroStep::DELAY, Action{},                   250});
  addMacroStep(b, {MacroStep::TEXT,  Action{},                   2});  // "npm run build\n"
}

// ============================================================================
//  Capas por defecto
// ============================================================================
void loadDefaults(KeyMap& km) {
  km.clear();
  seedDefaultMacrosTexts();          // textos/macros default (macro 0 = Build, textos 0-3)
  seedDefaultAlt();                  // ALT1->Launcher, ALT2->Macros, linger default

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
  km.bind(e, InputId::BTN_6,  keyAction(kmod::CTRL, 'x'), "Cortar");
  km.bind(e, InputId::BTN_7,  keyAction(kmod::CTRL, 'a'), "Sel.todo");
  km.bind(e, InputId::BTN_8,  keyAction(kmod::CTRL, 'f'), "Buscar");
  km.bind(e, InputId::BTN_9,  keyAction(kmod::CTRL, 's'), "Guardar");
  km.bind(e, InputId::BTN_10, keyAction(kmod::CTRL, 'h'), "Reemplazar");

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
  km.bind(d, InputId::BTN_6,  keyAction(kmod::CTRL, 's'), "Guardar");
  km.bind(d, InputId::BTN_7,  keyAction(kmod::CTRL, 'p'), "Ir a archivo");
  km.bind(d, InputId::BTN_8,  keyAction(kmod::CTRL | kmod::SHIFT, 'o'), "Simbolo");
  km.bind(d, InputId::BTN_9,  keyAction(kmod::SHIFT | kmod::ALT, 'f'), "Formatear");
  km.bind(d, InputId::BTN_10, keyCode(0, KEY_F2), "Renombrar");

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
  km.bind(a, InputId::BTN_6,  keyCode(kmod::GUI, '3'), "App 3");
  km.bind(a, InputId::BTN_7,  keyCode(kmod::GUI, '4'), "App 4");
  km.bind(a, InputId::BTN_8,  keyCode(kmod::ALT, KEY_TAB), "Cambiar");
  km.bind(a, InputId::BTN_9,  keyCode(kmod::GUI, KEY_UP_ARROW), "Maximizar");
  km.bind(a, InputId::BTN_10, keyCode(kmod::GUI, KEY_DOWN_ARROW), "Minimizar");

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
  km.bind(r, InputId::BTN_6,  keyAction(RGBM, 'c'), "Cian");
  km.bind(r, InputId::BTN_7,  keyAction(RGBM, 'm'), "Magenta");
  km.bind(r, InputId::BTN_8,  keyAction(RGBM, 'y'), "Amarillo");
  km.bind(r, InputId::BTN_9,  keyAction(RGBM, 'e'), "Efecto");
  km.bind(r, InputId::BTN_10, keyAction(RGBM, 'p'), "Velocidad");

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

  // === Grupo Monitor: vistas de telemetria del companion (CPU/GPU temps+coolers,
  //     RAM, red, carga por nucleo). La UI las renderiza a pantalla completa via
  //     skin homonimo (sin teclas); el nombre de la capa DEBE coincidir con el del
  //     skin (ver ui/Skins.cpp: monitorIndex). Encoder press = menu para navegar. ===
  int mg = km.addLayer("General", theme::CYAN, LayerGroup::SISTEMA);
  km.bind(mg, InputId::ENC_SW, Action{}, "Menu");
  km.bind(mg, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  int rd = km.addLayer("Red", theme::GREEN, LayerGroup::SISTEMA);
  km.bind(rd, InputId::ENC_SW, Action{}, "Menu");
  km.bind(rd, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  int nc = km.addLayer("Nucleos", theme::VIOLET, LayerGroup::SISTEMA);
  km.bind(nc, InputId::ENC_SW, Action{}, "Menu");
  km.bind(nc, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  int dk = km.addLayer("Disco", theme::YELLOW, LayerGroup::SISTEMA);
  km.bind(dk, InputId::ENC_SW, Action{}, "Menu");
  km.bind(dk, InputId::STICK_SW, mouseToggleAction(), "Mouse");

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
  km.bind(zm, InputId::BTN_6,  keyAction(kmod::ALT, 'h'), "Chat");
  km.bind(zm, InputId::BTN_7,  keyAction(kmod::ALT, 'u'), "Participantes");
  km.bind(zm, InputId::BTN_8,  keyAction(kmod::ALT, 'r'), "Grabar");
  km.bind(zm, InputId::BTN_9,  keyCode(kmod::ALT, KEY_F2), "Galeria");

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
  km.bind(tm, InputId::BTN_6,  keyAction(kmod::CTRL, '2'), "Chat");
  km.bind(tm, InputId::BTN_7,  keyAction(kmod::CTRL, '3'), "Equipos");
  km.bind(tm, InputId::BTN_8,  keyAction(kmod::CTRL, '4'), "Calendario");
  km.bind(tm, InputId::BTN_9,  keyAction(kmod::CTRL, 'e'), "Buscar");

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
  km.bind(n, InputId::BTN_6,  keyAction(kmod::CTRL, 'w'), "Cerrar tab");
  km.bind(n, InputId::BTN_7,  keyAction(kmod::CTRL | kmod::SHIFT, 't'), "Reabrir");
  km.bind(n, InputId::BTN_8,  keyAction(kmod::CTRL, 'f'), "Buscar");
  km.bind(n, InputId::BTN_9,  keyAction(kmod::CTRL, 'h'), "Historial");
  km.bind(n, InputId::BTN_10, keyAction(kmod::CTRL | kmod::SHIFT, 'n'), "Incognito");

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
  km.bind(yt, InputId::BTN_6,  keyAction(0, 'c'), "Subtitulos");
  km.bind(yt, InputId::BTN_7,  keyAction(kmod::SHIFT, ','), "-Vel");
  km.bind(yt, InputId::BTN_8,  keyAction(kmod::SHIFT, '.'), "+Vel");
  km.bind(yt, InputId::BTN_9,  keyAction(kmod::SHIFT, 'p'), "Anterior");
  km.bind(yt, InputId::BTN_10, keyAction(kmod::SHIFT, 'n'), "Siguiente");

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

  // --- Capa: Spotify (verde) -> teclas de media globales (anda sin foco en la app) ---
  int sf = km.addLayer("Spotify", theme::GREEN, LayerGroup::MULTIMEDIA);
  km.bind(sf, InputId::BTN_1, mediaAction(MediaUsage::PREV), "Anterior");
  km.bind(sf, InputId::BTN_2, mediaAction(MediaUsage::PLAY_PAUSE), "Play", Action{}, StateToggle::MEDIA);
  km.bind(sf, InputId::BTN_3, mediaAction(MediaUsage::NEXT), "Siguiente");
  km.bind(sf, InputId::BTN_4, mediaAction(MediaUsage::MUTE), "Mute");
  km.bind(sf, InputId::BTN_5, mediaAction(MediaUsage::STOP), "Stop");
  km.bindRotate(sf, mediaAction(MediaUsage::VOL_UP),
                    mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(sf, InputId::ENC_SW, Action{}, "Menu");
  km.bind(sf, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Disney+ (azul) -> atajos del reproductor web (igual que Netflix) ---
  int dp = km.addLayer("Disney+", theme::BLUE, LayerGroup::MULTIMEDIA);
  km.bind(dp, InputId::BTN_1, keyCode(0, ' '), "Play");                  // espacio = play/pausa
  km.bind(dp, InputId::BTN_2, keyCode(0, KEY_LEFT_ARROW), "-10s");       // <- atras
  km.bind(dp, InputId::BTN_3, keyCode(0, KEY_RIGHT_ARROW), "+10s");      // -> adelante
  km.bind(dp, InputId::BTN_4, keyAction(0, 'f'), "Pantalla");            // f = pantalla completa
  km.bind(dp, InputId::BTN_5, keyAction(0, 'm'), "Mute");                // m = silenciar
  km.bindRotate(dp, mediaAction(MediaUsage::VOL_UP),
                    mediaAction(MediaUsage::VOL_DOWN), "Volumen");
  km.bind(dp, InputId::ENC_SW, Action{}, "Menu");
  km.bind(dp, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Launcher (ALT1 momentaneo) -> lanzador de apps (azul) ---
  // Caras "armadas" con labels; las acciones de lanzar se cablean luego (companion
  // spawn / hotkey, via la pagina de admin). Aprovecha los 10 botones de accion.
  int lz = km.addLayer("Launcher", theme::BLUE, LayerGroup::TRABAJO);
  km.bind(lz, InputId::BTN_1,  launchAction(0), "VS Code");   // ids -> tabla de apps del companion
  km.bind(lz, InputId::BTN_2,  launchAction(1), "Slack");
  km.bind(lz, InputId::BTN_3,  launchAction(2), "Chrome");
  km.bind(lz, InputId::BTN_4,  launchAction(3), "YouTube");
  km.bind(lz, InputId::BTN_5,  launchAction(4), "Terminal");
  km.bind(lz, InputId::BTN_6,  launchAction(5), "Archivos");
  km.bind(lz, InputId::ENC_SW, Action{}, "Menu");
  km.bind(lz, InputId::STICK_SW, mouseToggleAction(), "Mouse");

  // --- Capa: Macros (ALT2 momentaneo) -> macros seleccionables (rosa) ---
  int mz = km.addLayer("Macros", theme::ROSE, LayerGroup::TRABAJO);
  km.bind(mz, InputId::BTN_1, macroAction(0), "Build");        // macro existente (Ctrl+`, npm run build)
  km.bind(mz, InputId::BTN_2, Action{}, "Macro 2");
  km.bind(mz, InputId::BTN_3, Action{}, "Macro 3");
  km.bind(mz, InputId::ENC_SW, Action{}, "Menu");
  km.bind(mz, InputId::STICK_SW, mouseToggleAction(), "Mouse");
}
