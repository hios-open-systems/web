// ============================================================================
//  NavModel - Modelo de navegacion data-driven del pad (schema v2).
//  Espeja el modelo "rico" que edita la companion: Secciones -> Views -> Cards.
//
//  Es OPCIONAL y aditivo: si la config trae `navigation` + `views`, queda
//  cargado y MenuModel lo prefiere; si no viene (config plana legacy, que es
//  lo que hoy empuja la companion porque strippea esa metadata), el modelo
//  queda invalido y el menu cae a las plantillas + KeyMap de siempre.
//
//  Storage estatico, sin heap (cabe en el firmware). Limites explicitos.
// ============================================================================
#pragma once
#include <stdint.h>
#include <ArduinoJson.h>

namespace navmodel {

constexpr int NAV_LABEL_LEN        = 16;
constexpr int NAV_ID_LEN           = 18;
constexpr int MAX_VIEWS            = 28;   // == KeyMap MAX_LAYERS
constexpr int MAX_SECTIONS         = 10;
constexpr int MAX_VIEWS_PER_SECTION = 12;
constexpr int MAX_CARDS            = 10;   // 10 botones fisicos

enum class ViewKind : uint8_t { CARDS, MONITOR, SETTINGS, WIFI, GAME, WEBCONTENT };

struct Card {
  uint8_t slot;
  char    label[NAV_LABEL_LEN];
};

struct View {
  char     id[NAV_ID_LEN];
  char     label[NAV_LABEL_LEN];   // = nombre de la Layer en el KeyMap
  uint16_t color;
  ViewKind kind;
  uint8_t  cardCount;
  Card     cards[MAX_CARDS];
};

struct Section {
  char     id[NAV_ID_LEN];
  char     label[NAV_LABEL_LEN];
  uint16_t color;
  uint8_t  viewCount;
  uint8_t  viewIdx[MAX_VIEWS_PER_SECTION];   // indices en el array de Views
};

// Parsea root["navigation"] + root["views"]. Devuelve true si quedo un modelo
// usable (al menos una seccion con Views). Limpia el estado previo siempre.
bool loadFromJson(JsonObjectConst root);
void clear();

bool           valid();
int            sectionCount();
const Section& section(int i);
int            viewCount();
const View&    view(int i);
int            indexOfView(const char* id);   // -1 si no esta
const char*    homeView();                    // id de la View Home ("" si no hay)

// "cyan"/"magenta"/... -> color RGB565 de theme. 0 si no se reconoce.
uint16_t colorFromName(const char* name);

}  // namespace navmodel
