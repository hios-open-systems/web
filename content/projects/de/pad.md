# HIOS PAD — Programmierbares Bedienpult mit ESP32-S3

Desktop-Controller mit Display, Drehgeber, Joystick, 10 Aktionstasten und 2 ALT-Tasten. Er sendet **Tastatur-, Maus- und Medienaktionen über USB oder Bluetooth BLE**. Ebenen ordnen die Bedienelemente nach Anwendung. WLAN dient zur Konfiguration und zur Kommunikation mit einem optionalen Companion, der den PC-Zustand meldet.

## Erste Schritte

```bash
cd projects/pad

# Mit PlatformIO kompilieren und übertragen
pio run -t upload

# Serieller Monitor
pio device monitor -b 115200
```

Beim Start zeigt der Monitor `token API/OTA`. Trage den Wert in `companion/config.json` ein, bevor du den Dienst startest oder die Weboberfläche von einem anderen Rechner öffnest. Das Token wird einmal erzeugt, in NVS gespeichert und zur Authentifizierung der Web-API und von OTA-Updates verwendet.

> **Übertragen aus WSL:** Binde die serielle DevKit-Schnittstelle (CH343, UART) in WSL ein. Führe in Windows PowerShell `usbipd list` und anschließend `usbipd attach --wsl --busid <id>` aus. Wiederhole dies nach erneutem Einstecken des Kabels. Das Gerät kann dann als `/dev/ttyACM0` erscheinen. Die **native USB-Schnittstelle** des S3 (303a:1001) übernimmt HID; CH343 dient zum Übertragen und zur seriellen Kommunikation.

## Ablauf

1. **Montage:** Folge **[/pinouts/pad](https://openhios.dev/pinouts/pad)** für Reihenfolge, Checkliste und Messungen: 5.0V-Regler, SD-Pins der Verstärker und Matrixdioden. `npm run test:wiring` im Stammverzeichnis des Web-Repositories prüft die Anleitung gegen [`src/app/Pins.h`](src/app/Pins.h) und [`platformio.ini`](platformio.ini).
2. **Erste Übertragung per Kabel:** `pio run -t upload`. In WSL zuerst CH343 mit `usbipd` einbinden.
   > **Versorgung:** Öffne bei angeschlossenem 2S-Akku `SW-CELDAS`, bevor du USB anschließt. Sonst werden USB-VBUS und Reglerausgang am `5V`-Pin verbunden. Übertrage die Firmware bei abgeschalteter Akkuversorgung oder verwende OTA.
3. **OTA-Updates:** Ergänze bei bestehender WLAN-Verbindung `--auth=<token API/OTA>` unter `upload_flags` im Abschnitt `[env:ota]` der `platformio.ini`. Führe `pio run -e ota -t upload --upload-port hiospad.local` aus. Halte natives USB-C und BOOT für die Wiederherstellung nach einem fehlgeschlagenen Update zugänglich.
4. **Optionaler Companion:** Starte ihn für PC-Zustandsdaten und die Stummschaltung des Systemmikrofons. HID funktioniert auch ohne ihn.

## Verfügbare Funktionen

Jede **Ebene** weist den **10 Aktionstasten**, 2 ALT-Tasten, dem Drehgeber und Joystick Aktionen zu. USB und BLE übertragen Tastatur-, Maus- und Medienaktionen über HID. Tastenkürzel hängen von Betriebssystem und Anwendung ab.

- **USB und BLE:** TinyUSB und NimBLE stellen zusammengesetztes Tastatur-, Maus- und Consumer-HID bereit. Angeschlossen wird USB verwendet, sonst BLE. WLAN überträgt Zustandsdaten und vermittelte Steuerbefehle, kein HID.
- **Unabhängige Bedienung:** HID benötigt weder Netzwerk noch Companion. PC-Zustand und Systemmikrofonsteuerung benötigen beides.
- **Joystick als Maus:** bewegt den Zeiger; kurzes Drücken klickt links, doppeltes Drücken rechts, langes Drücken schaltet den Mausmodus um.
- **Kontextabhängiger Drehgeber:** steuert je nach Ebene Lautstärke, Scrollen, Zoom oder Tabs. Doppelklick wechselt die Funktion; Drücken öffnet das Menü.

## Ebenen und Menü

Ebenen sind nach Typ gruppiert. Ein Druck auf den Drehgeber öffnet eine einstufige Auswahl: Die **10 physischen Tasten** wählen Ebenen der aktuellen Gruppe, Drehen wechselt die Gruppe.

| Gruppe | Ebenen |
|---|---|
| **Arbeit** | Bearbeitung, Dev, Apps |
| **Medien** | Multimedia, YouTube, Netflix |
| **Web** | Browser |
| **Anrufe** | Meet, Slack, Zoom, Teams |
| **System** | RGB |
| **Einstellungen** (letzte Seite) | Helligkeit, Thema, Farbe, Skin, Dimmer, Uhrzeit, WLAN, Kalibrierung |

Drehen wechselt Gruppe oder Seite; Tasten 1–10 wählen eine Ebene. Drücken öffnet die Einstellungen, langes Drücken führt zurück oder schließt das Menü.

### Videoanrufe

Jede App hat eine Ebene mit Tastenkürzeln. Kurzes Drücken der Mikrofonsteuerung sendet das konfigurierte Kürzel; langes Drücken fordert die Stummschaltung des Systemmikrofons über den Companion an. Die Slack-Ebene nutzt diese Systemsteuerung. Die Kamera wird per App-Kürzel bedient. Die Kompatibilität hängt von System, Kürzeleinstellungen und Berechtigungen ab.

> Aktiviere in Zoom unter Settings → Keyboard Shortcuts globale Tastenkürzel, um das Mikrofon auch ohne Fensterfokus zu steuern.

## Optionale Companion-Software

Der Companion ergänzt Webbearbeitung und Betriebssystemkommunikation. HID bleibt auch ohne Verbindung zum Companion verfügbar.

- **[`pad-companion`](companion): Hintergrunddienst.** Meldet Lautstärke und Mikrofonzustand über `POST /api/state` und empfängt PAD-Befehle für das Betriebssystem. Windows und Linux werden unterstützt; macOS steht noch aus. CPU-/GPU- und Temperaturwerte hängen von Sensoren, Programmen und Berechtigungen ab. Bleiben Aktualisierungen aus, zeigt das PAD wieder einen geschätzten Zustand. API-Vertrag, Abhängigkeiten und Autostart stehen in [`companion/README.md`](companion/README.md).
- **Webverwaltung und Spiegelansicht:** Der Server in [`companion/src/web`](companion/src/web) bearbeitet Zuordnungen, Ebenen und Texte. Spiegelansicht und Emulator verwenden das Datenmodell der Firmware und senden die Konfiguration ohne erneutes Kompilieren.
- **[`host/openrgb-rgb-layer.ahk`](host/openrgb-rgb-layer.ahk):** AutoHotkey-Skript zur Verbindung der RGB-Ebene mit **OpenRGB** auf dem PC; steuert die Beleuchtung von Peripheriegeräten nach aktiver Ebene.

## Architektur

FreeRTOS-Tasks sind Kernen zugeordnet:

- **inputTask** (core1): liest Tasten, Drehgeber und Joystick; `Dispatcher` bestimmt Ebenenaktionen, stellt sie in die Warteschlange und erstellt den UI-Zustand.
- **transportTask** (core1): verarbeitet Aktionen über den aktiven USB-/BLE-HID-Transport mit `TransportRouter`.
- **uiTask** (core0): zeichnet Dashboard, Menü und Portal mit `TFT_eSprite`.
- **netTask** (core0): WLAN-STA, Captive Portal, NTP und WebServer (`/api/state`).

Verzeichnisse: `actions/` (`Action`-Modell), `mapping/` (`KeyMap`/`Dispatcher`), `inputs/` (Tasten, Drehgeber, Joystick), `transport/` (USB, BLE, Router), `net/`, `ui/` (Skins, Menü, Dock, Vektorsymbole), `storage/` (Standardkonfiguration) und `app/` (Konfiguration, Pins, Zustand).

## Hardware

- **ESP32-S3-DevKitC-1 N16R8:** 16MB Flash und 8MB Octal-PSRAM, AP Memory 3.3V, im Chip-Dump des Projekts identifiziert. Octal-PSRAM belegt GPIO 33–37, Flash 26–32; diese Pins stehen nicht für Peripherie zur Verfügung.
- **4-Zoll-ILI9488-Display:** 480×320, SPI/HSPI mit 27MHz. Das Projekt verwendet ILI9488, nicht ST7796.
- **KY-040-Drehgeber**, **HW-504-Joystick** mit **3V3** und **12 Schließertaster** gegen GND: 10 Aktionstasten in einer **2×5-Diodenmatrix**, Kathoden zu den Zeilen, plus 2 direkte ALT-Tasten.
- **2× MAX98357A:** gemeinsamer I2S-Bus, Kanalauswahl über SD. Projektverdrahtung: links SD an Vin, rechts SD über **390k** an Vin.
- Pindefinitionen: [`src/app/Pins.h`](src/app/Pins.h). Verdrahtung und Versorgung: **[/pinouts/pad](https://openhios.dev/pinouts/pad)**, durch Selbsttests gegen die Firmware geprüft.

## Hinweise zur Implementierung

- **Sprites und Schrift:** Nach jedem `TFT_eSprite`-Objekt `setTextFont(1)` aufrufen; im Projekt wurde eine Startschleife durch nicht initialisiertes `gfxFont` dokumentiert.
- **Joystick mit 3V3:** Nicht mit 5V versorgen; der Ausgang kann den ADC-Eingangsbereich des S3 überschreiten.
- **BLE-Symbolkonflikte:** `USBHIDKeyboard.h` und BLE-Header definieren kollidierende `KEY_*`-/`KeyReport`-Symbole. Fabriken in `transport/` trennen sie, sodass `main` nicht beide Header einbindet.
- **Menüspeicher:** Den etwa 60KB großen Karussell-Sprite beim Schließen freigeben, um den Heap bei aktivem BLE und WLAN zu entlasten.
- **Spannungsabfälle:** Bei Neustarts während der WLAN-/BLE-Aktivierung zuerst Versorgung und serielle Meldungen prüfen, bevor die Firmware als Ursache angenommen wird.

## Status

**Implementiert:** automatischer USB-/BLE-HID-Wechsel, WLAN, Portal, NTP, Joystick-Maus, Ebenen und Menü, PC-Zustand und Systemmikrofonsteuerung über den Companion, **JSON-Konfiguration** über `GET/POST /api/config` in LittleFS und eine vom Companion über SSE bereitgestellte **Display-Spiegelansicht**. Die Konfiguration lässt sich ohne erneutes Kompilieren bearbeiten und übertragen.

Die Akkumessung am PAD ist deaktiviert: Das Versorgungsdisplay zeigt die 2S-Packspannung, während GPIO9, zuvor für den Teiler vorgesehen, jetzt den NeoPixel steuert. Behalte `cfg::BATTERY_ENABLED=false` bei, solange der ADC nicht neu zugewiesen ist. Verbinde den Akkuspannungsteiler nicht mit der NeoPixel-Datenleitung.

### Geplante Entwicklung

- [ ] **Direkte PAD-Weboberfläche: Code implementiert, Hardwareprüfung ausstehend.** Das PAD stellt sie über [`net/WebUi.cpp`](src/net/WebUi.cpp) ohne PC bereit. Enthält Zustandsanzeige, Ebenenauswahl, ein **virtuelles 2×5-PAD** für Tasten/Drehgeber und einen **Konfigurationseditor** für Namen, Farben und Beschriftungen unter Beibehaltung der Aktionen. Endpunkte: `GET /api/ui`, `POST /api/cmd`, `/api/config`. `npm run test:padwebui` prüft die extrahierte Firmware-Seite mit Playwright und einem simulierten API-Vertrag. Die Anwendung von Änderungen auf dem Gerät muss noch mit übertragener Firmware geprüft werden.
- [ ] **Bearbeitbare Gesten:** Konfigurierbare Zusatzgesten erfordern einen Neuentwurf; das frühere fest codierte Langdruckverhalten wurde entfernt. Niedrigere Priorität.
- [ ] **Pad2:** Geplante neue Architektur mit virtuellem PAD als Ausgangspunkt, datengetriebenem Verhalten und JavaScript/JSDoc ohne Build-Schritt. Noch nicht begonnen.

## Quellen und Mitwirkende

Der gedruckte Joystickknopf basiert auf [diesem Thingiverse-Modell](https://www.thingiverse.com/thing:6189483). Vielen Dank an den Urheber für die Veröffentlichung.
